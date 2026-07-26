'use server';

import { revalidatePath } from 'next/cache';
import { resolvePartnerViewer } from '@/lib/auth/partner-authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createPassageServerClient } from '@/lib/supabase/server';

export type PartnerCommandState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'saved';
  message?: string;
  receipt?: { occurredAt: string; replayed: boolean };
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
  revalidatePath('/partner');
  revalidatePath(`/partner/requests/${partnerRequestId}`);
  revalidatePath('/director');
  return {
    status: 'saved',
    message: receipt.replayed ? 'This response was already saved. The original decision is shown below.' : decision === 'accept' ? 'Quote accepted and saved. The funeral home can see your response.' : 'Request declined and saved.',
    receipt: { occurredAt: new Date().toISOString(), replayed: receipt.replayed },
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
  revalidatePath('/partner');
  revalidatePath(`/partner/requests/${partnerRequestId}`);
  revalidatePath('/director');
  return {
    status: 'saved',
    message: receipt.replayed ? 'This delivery proof was already saved.' : 'Delivery proof submitted for director review.',
    receipt: { occurredAt: new Date().toISOString(), replayed: receipt.replayed },
  };
}
