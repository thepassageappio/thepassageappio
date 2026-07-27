'use server';

import { revalidatePath } from 'next/cache';
import { resolvePartnerViewer } from '@/lib/auth/partner-authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import type { DurableReceiptData } from '@/components/operations/DurableReceipt';
import { durableReceipt } from '@/lib/presentation/durable-receipts';
import { humanizePreviewLabel } from '@/lib/presentation/plain-language';
import { createPassageServerClient } from '@/lib/supabase/server';

export type PartnerCommandState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'saved';
  message?: string;
  receipt?: { occurredAt: string; replayed: boolean };
  durable?: DurableReceiptData;
};

type RespondReceipt = { partner_request_id: string; status: string; version: number; replayed: boolean };
type ProofReceipt = { partner_request_id: string; status: string; version: number; replayed: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function respondToPartnerRequest(_previous: PartnerCommandState, formData: FormData): Promise<PartnerCommandState> {
  const partnerRequestId = String(formData.get('partnerRequestId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));
  const decision = String(formData.get('decision') ?? '');
  const quoteAmountDollars = String(formData.get('quoteAmountDollars') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();

  if (!uuid.test(partnerRequestId) || !uuid.test(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1
    || !['accept', 'decline'].includes(decision)) {
    return { status: 'validation', message: 'This request changed before the action was ready. Reload the queue.' };
  }
  let quoteAmountCents: number | null = null;
  if (decision === 'accept') {
    const parsed = Number(quoteAmountDollars);
    if (!quoteAmountDollars || !Number.isFinite(parsed) || parsed < 0) {
      return { status: 'validation', message: 'Enter a valid quote amount before accepting.' };
    }
    quoteAmountCents = Math.round(parsed * 100);
  }
  if (decision === 'decline' && (note.length < 1 || note.length > 500)) {
    return { status: 'validation', message: 'Explain why you are declining before saving.' };
  }
  if (note.length > 2000) return { status: 'validation', message: 'Shorten the note before saving.' };

  const viewer = await resolvePartnerViewer();
  if (!viewer.ok) return { status: 'denied', message: 'This request is not available to your account. Nothing changed.' };
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this request right now. Nothing changed. Try again.' };

  const result = await client.rpc('respond_to_partner_request_idempotent', {
    p_partner_request_id: partnerRequestId,
    p_expected_version: expectedVersion,
    p_decision: decision,
    p_quote_amount_cents: quoteAmountCents,
    p_note: note || null,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'This request is not available to your account. Nothing changed.' };
    if (result.error.code === '40001') return { status: 'conflict', message: 'This request changed before your response was saved. Reload the queue.' };
    if (result.error.code === '55000') return { status: 'conflict', message: 'This request is no longer waiting for a response. Reload the queue.' };
    return { status: 'unavailable', message: 'Passage could not save your response. Nothing changed.' };
  }
  const receipt = firstRpcRow<RespondReceipt>(result.data);
  if (!receipt?.partner_request_id) return { status: 'unavailable', message: 'We could not confirm your response was saved. Reload before trying again.' };
  const [eventResult, requestResult] = await Promise.all([
    client
      .from('partner_request_events')
      .select('id, occurred_at')
      .eq('partner_request_id', partnerRequestId)
      .eq('idempotency_key', `partner_request_respond:${requestId}`)
      .maybeSingle(),
    client
      .from('partner_requests')
      .select('title, quote_amount_cents')
      .eq('id', partnerRequestId)
      .maybeSingle(),
  ]);
  if (eventResult.error || !eventResult.data?.id || !eventResult.data.occurred_at || requestResult.error || !requestResult.data) {
    return { status: 'unavailable', message: 'Your response may be saved, but Passage could not confirm its receipt. Reload this request before trying again.' };
  }
  const title = humanizePreviewLabel(requestResult.data.title ?? '', 'Memorial flowers');
  const quote = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((requestResult.data.quote_amount_cents ?? quoteAmountCents ?? 0) / 100);
  const partnerName = humanizePreviewLabel(viewer.viewer.partnerOrganizationName, 'Cascade Floral & Keepsakes');
  const changedBy = humanizePreviewLabel(viewer.viewer.displayName, `${partnerName} team member`);
  revalidatePath('/partner');
  revalidatePath(`/partner/requests/${partnerRequestId}`);
  revalidatePath('/director');
  return {
    status: 'saved',
    message: receipt.replayed ? 'The original response is shown below.' : decision === 'accept' ? 'The quote was saved.' : 'The decline was saved.',
    durable: durableReceipt({
      eventId: eventResult.data.id,
      heading: decision === 'accept' ? `${quote} sample quote saved.` : 'Request declined.',
      changedBy,
      savedAt: eventResult.data.occurred_at,
      result: decision === 'accept'
        ? `${changedBy} accepted ${title} with a ${quote} sample quote. No purchase or payment occurred.`
        : `${changedBy} declined ${title}.`,
      visibleTo: `${partnerName} and authorized Northstar directors. Not visible to the Rivera family.`,
      savedIn: 'Vendor request history',
      next: decision === 'accept'
        ? 'Northstar reviews the quote and coordinates the next step.'
        : 'Northstar chooses another way to complete the request.',
    }),
  };
}

export async function submitPartnerRequestProof(_previous: PartnerCommandState, formData: FormData): Promise<PartnerCommandState> {
  const partnerRequestId = String(formData.get('partnerRequestId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));
  const proofSummary = String(formData.get('proofSummary') ?? '').trim();
  const proofReference = String(formData.get('proofReference') ?? '').trim();

  if (!uuid.test(partnerRequestId) || !uuid.test(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1
    || proofSummary.length < 1 || proofSummary.length > 2000 || proofReference.length > 240) {
    return { status: 'validation', message: 'Review the delivery proof fields. Nothing changed.' };
  }

  const viewer = await resolvePartnerViewer();
  if (!viewer.ok) return { status: 'denied', message: 'This request is not available to your account. Nothing changed.' };
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this request right now. Nothing changed. Try again.' };

  const result = await client.rpc('submit_partner_request_proof_idempotent', {
    p_partner_request_id: partnerRequestId,
    p_expected_version: expectedVersion,
    p_proof_summary: proofSummary,
    p_proof_reference: proofReference || null,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'This request is not available to your account. Nothing changed.' };
    if (result.error.code === '40001') return { status: 'conflict', message: 'This request changed before your proof was saved. Reload the current request.' };
    if (result.error.code === '55000') return { status: 'conflict', message: 'Only accepted, in-progress work can receive delivery proof. Reload the current request.' };
    return { status: 'unavailable', message: 'Passage could not save this proof. Nothing changed.' };
  }
  const receipt = firstRpcRow<ProofReceipt>(result.data);
  if (!receipt?.partner_request_id) return { status: 'unavailable', message: 'We could not confirm your proof was saved. Reload before trying again.' };
  const [eventResult, requestResult] = await Promise.all([
    client
      .from('partner_request_events')
      .select('id, occurred_at')
      .eq('partner_request_id', partnerRequestId)
      .eq('idempotency_key', `partner_request_proof:${requestId}`)
      .maybeSingle(),
    client
      .from('partner_requests')
      .select('title')
      .eq('id', partnerRequestId)
      .maybeSingle(),
  ]);
  if (eventResult.error || !eventResult.data?.id || !eventResult.data.occurred_at || requestResult.error || !requestResult.data) {
    return { status: 'unavailable', message: 'The proof may be saved, but Passage could not confirm its receipt. Reload this request before trying again.' };
  }
  const partnerName = humanizePreviewLabel(viewer.viewer.partnerOrganizationName, 'Cascade Floral & Keepsakes');
  const changedBy = humanizePreviewLabel(viewer.viewer.displayName, `${partnerName} team member`);
  const title = humanizePreviewLabel(requestResult.data.title ?? '', 'Memorial flowers');
  revalidatePath('/partner');
  revalidatePath(`/partner/requests/${partnerRequestId}`);
  revalidatePath('/director');
  return {
    status: 'saved',
    message: receipt.replayed ? 'The original delivery proof is shown below.' : 'Delivery proof was saved for review.',
    durable: durableReceipt({
      eventId: eventResult.data.id,
      heading: 'Delivery proof saved.',
      changedBy,
      savedAt: eventResult.data.occurred_at,
      result: `${changedBy} submitted delivery proof for ${title}.`,
      visibleTo: `${partnerName} and authorized Northstar directors. Not visible to the Rivera family.`,
      savedIn: 'Vendor request history',
      next: 'An authorized Northstar director reviews the proof. The request is not complete yet.',
    }),
  };
}
