'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import { humanPartnerCategory, type PassageServerClient } from '@/lib/partner/hosted';
import { getStripeClient } from '@/lib/stripe';
import { createPassageServerClient } from '@/lib/supabase/server';
import type { PartnerCommandState } from '@/app/partner/actions';

// Director-side counterparts to app/partner/actions.ts: a director originates
// a vendor request from the Case Room, approves or declines a vendor's
// priced quote, verifies submitted delivery proof, and (automatically, as
// part of verification) releases the vendor's payout. Kept in their own
// file (not merged into the already-merged Cycle 8 assignment/proof-review
// actions.
type CreateReceipt = { partner_request_id: string; status: string; version: number; replayed: boolean };
type VerifyReceipt = { partner_request_id: string; status: string; version: number; replayed: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function origin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.thepassageapp.io';
}

// Automatic vendor payout, no admin/manual step anywhere: called right after
// a successful verification, and independently retryable from a standalone
// "Release vendor payment" recovery action if the Stripe transfer step ever
// fails after verification already succeeded. Guarded by payout_released_at
// so it is always safe to call more than once; the Stripe transfer itself
// also carries its own idempotency key for the same reason.
async function attemptPartnerPayoutRelease(client: PassageServerClient, partnerRequestId: string, requestId: string): Promise<boolean> {
  const { data } = await client
    .from('partner_requests')
    .select('id, status, partner_organization_id, vendor_payout_cents, payout_released_at')
    .eq('id', partnerRequestId)
    .maybeSingle();
  const row = data as { id: string; status: string; partner_organization_id: string; vendor_payout_cents: number | null; payout_released_at: string | null } | null;
  if (!row || row.status !== 'verified' || row.payout_released_at || !row.vendor_payout_cents || row.vendor_payout_cents <= 0) return false;

  const { data: partnerOrgData } = await client
    .from('partner_organizations')
    .select('stripe_connect_account_id, stripe_connect_payouts_enabled')
    .eq('id', row.partner_organization_id)
    .maybeSingle();
  const partnerOrg = partnerOrgData as { stripe_connect_account_id: string | null; stripe_connect_payouts_enabled: boolean } | null;
  if (!partnerOrg?.stripe_connect_account_id || !partnerOrg.stripe_connect_payouts_enabled) return false;

  const stripe = getStripeClient();
  if (!stripe) return false;

  const transfer = await stripe.transfers.create(
    { amount: row.vendor_payout_cents, currency: 'usd', destination: partnerOrg.stripe_connect_account_id, transfer_group: `partner_request_${row.id}` },
    { idempotencyKey: `partner_request_payout:${row.id}` },
  );

  await client.rpc('record_partner_request_payout_idempotent', {
    p_partner_request_id: row.id,
    p_stripe_transfer_id: transfer.id,
    p_request_id: requestId,
  });
  return true;
}

export async function createPartnerRequest(_previous: PartnerCommandState, formData: FormData): Promise<PartnerCommandState> {
  const workflowId = String(formData.get('workflowId') ?? '');
  const partnerOrganizationId = String(formData.get('partnerOrganizationId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const category = String(formData.get('category') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const details = String(formData.get('details') ?? '').trim();
  const neededByRaw = String(formData.get('neededBy') ?? '').trim();

  if (!uuid.test(workflowId) || !uuid.test(partnerOrganizationId) || !uuid.test(requestId)
    || !['florist', 'caterer', 'restaurant', 'cemetery', 'transport', 'printer_stationery', 'memorial_products', 'other'].includes(category)
    || title.length < 1 || title.length > 200 || details.length < 1 || details.length > 2000) {
    return { status: 'validation', message: 'Review the vendor request fields. Nothing was sent.' };
  }
  const neededBy = neededByRaw ? new Date(neededByRaw) : null;
  if (neededBy && Number.isNaN(neededBy.getTime())) return { status: 'validation', message: 'Enter a valid needed-by date. Nothing was sent.' };

  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || (viewer.viewer.role !== 'owner' && viewer.viewer.role !== 'director')) {
    return { status: 'denied', message: 'Sending a vendor request requires director authority for this case. Nothing changed.' };
  }
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this case right now. Nothing changed. Try again.' };

  const result = await client.rpc('create_partner_request_idempotent', {
    p_workflow_id: workflowId,
    p_partner_organization_id: partnerOrganizationId,
    p_category: category,
    p_title: title,
    p_details: details,
    p_needed_by: neededBy ? neededBy.toISOString() : null,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === 'PS001') return { status: 'validation', message: "This vendor doesn't handle that category of request. Choose a matching vendor or category." };
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'You do not have director authority for this case. Nothing changed.' };
    if (result.error.code === '22023') return { status: 'validation', message: 'This request conflicts with an earlier command. Reload the case.' };
    return { status: 'unavailable', message: 'Passage could not send this vendor request. Nothing changed.' };
  }
  const receipt = firstRpcRow<CreateReceipt>(result.data);
  if (!receipt?.partner_request_id) return { status: 'unavailable', message: 'We could not confirm the vendor request was saved. Reload the case before trying again.' };
  revalidatePath(`/director/cases/${workflowId}`);
  revalidatePath('/director');
  return {
    status: 'saved',
    message: receipt.replayed ? 'This vendor request was already sent.' : 'Vendor request sent and saved in case history.',
    receipt: { occurredAt: new Date().toISOString(), replayed: receipt.replayed },
  };
}

// Director approves a vendor's quote -- redirects to a Stripe Checkout
// Session for the exact quoted amount. Nothing in partner_requests changes
// here; the webhook (handlePartnerRequestPaymentCompleted) moves the status
// from 'quoted' to 'in_progress' once Stripe confirms the charge, so a
// cancelled or abandoned checkout just leaves the request in 'quoted' for
// the director to retry.
export async function approvePartnerQuote(_previous: PartnerCommandState, formData: FormData): Promise<PartnerCommandState> {
  const workflowId = String(formData.get('workflowId') ?? '');
  const partnerRequestId = String(formData.get('partnerRequestId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));

  if (!uuid.test(workflowId) || !uuid.test(partnerRequestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return { status: 'validation', message: 'This request changed before the action was ready. Reload the case.' };
  }
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || (viewer.viewer.role !== 'owner' && viewer.viewer.role !== 'director')) {
    return { status: 'denied', message: 'Approving a vendor quote requires director authority for this case. Nothing changed.' };
  }
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this case right now. Nothing changed. Try again.' };

  const { data, error } = await client
    .from('partner_requests')
    .select('id, status, version, quote_amount_cents, title, category')
    .eq('id', partnerRequestId)
    .maybeSingle();
  if (error || !data) return { status: 'unavailable', message: 'We could not load this vendor request. Nothing changed.' };
  const request = data as { id: string; status: string; version: number; quote_amount_cents: number | null; title: string; category: string };
  if (request.status !== 'quoted' || request.version !== expectedVersion) {
    return { status: 'conflict', message: 'This request changed before approval. Reload the case.' };
  }
  if (!request.quote_amount_cents || request.quote_amount_cents <= 0) {
    return { status: 'unavailable', message: 'This request has no valid quote to pay. Reload the case.' };
  }

  const stripe = getStripeClient();
  if (!stripe) return { status: 'unavailable', message: 'Payments are not available right now. Nothing changed.' };

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `${humanPartnerCategory(request.category)} — ${request.title}` },
        unit_amount: request.quote_amount_cents,
      },
      quantity: 1,
    }],
    success_url: `${origin()}/director/cases/${workflowId}?vendorPayment=success`,
    cancel_url: `${origin()}/director/cases/${workflowId}?vendorPayment=cancelled`,
    metadata: { kind: 'partner_request_payment', partner_request_id: request.id },
  });
  if (!session.url) return { status: 'unavailable', message: 'Passage could not start the payment. Nothing changed.' };
  redirect(session.url);
}

export async function rejectPartnerQuote(_previous: PartnerCommandState, formData: FormData): Promise<PartnerCommandState> {
  const workflowId = String(formData.get('workflowId') ?? '');
  const partnerRequestId = String(formData.get('partnerRequestId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));
  const reason = String(formData.get('reason') ?? '').trim();

  if (!uuid.test(workflowId) || !uuid.test(partnerRequestId) || !uuid.test(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1
    || reason.length < 1 || reason.length > 500) {
    return { status: 'validation', message: 'Explain why you are declining this quote before saving.' };
  }
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || (viewer.viewer.role !== 'owner' && viewer.viewer.role !== 'director')) {
    return { status: 'denied', message: 'Declining a vendor quote requires director authority for this case. Nothing changed.' };
  }
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this case right now. Nothing changed. Try again.' };

  const result = await client.rpc('reject_partner_quote_idempotent', {
    p_partner_request_id: partnerRequestId,
    p_expected_version: expectedVersion,
    p_reason: reason,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'You do not have director authority for this case. Nothing changed.' };
    if (result.error.code === '40001') return { status: 'conflict', message: 'This quote changed before it was declined. Reload the case.' };
    if (result.error.code === '55000') return { status: 'conflict', message: 'This request is no longer a quote waiting for approval. Reload the case.' };
    return { status: 'unavailable', message: 'Passage could not decline this quote. Nothing changed.' };
  }
  const receipt = firstRpcRow<VerifyReceipt>(result.data);
  if (!receipt?.partner_request_id) return { status: 'unavailable', message: 'We could not confirm the decline was saved. Reload before trying again.' };
  revalidatePath(`/director/cases/${workflowId}`);
  revalidatePath('/director');
  return {
    status: 'saved',
    message: receipt.replayed ? 'This quote was already declined.' : 'Vendor quote declined and saved in case history.',
    receipt: { occurredAt: new Date().toISOString(), replayed: receipt.replayed },
  };
}

// Standalone recovery action -- only ever needed if the automatic payout
// release inside verifyPartnerRequest failed (e.g. a transient Stripe
// error). Safe to click repeatedly: attemptPartnerPayoutRelease is a no-op
// once payout_released_at is set.
export async function releaseVendorPayout(_previous: PartnerCommandState, formData: FormData): Promise<PartnerCommandState> {
  const workflowId = String(formData.get('workflowId') ?? '');
  const partnerRequestId = String(formData.get('partnerRequestId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');

  if (!uuid.test(workflowId) || !uuid.test(partnerRequestId) || !uuid.test(requestId)) {
    return { status: 'validation', message: 'This request changed before the action was ready. Reload the case.' };
  }
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || (viewer.viewer.role !== 'owner' && viewer.viewer.role !== 'director')) {
    return { status: 'denied', message: 'Releasing vendor payment requires director authority for this case. Nothing changed.' };
  }
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this case right now. Nothing changed. Try again.' };

  try {
    const released = await attemptPartnerPayoutRelease(client, partnerRequestId, requestId);
    revalidatePath(`/director/cases/${workflowId}`);
    return released
      ? { status: 'saved', message: 'Vendor payment released.', receipt: { occurredAt: new Date().toISOString(), replayed: false } }
      : { status: 'unavailable', message: 'Nothing to release. This request may already be paid out, or the vendor has not finished payout setup.' };
  } catch {
    return { status: 'unavailable', message: 'Passage could not release this payment. Nothing changed. Try again.' };
  }
}

export async function verifyPartnerRequest(_previous: PartnerCommandState, formData: FormData): Promise<PartnerCommandState> {
  const workflowId = String(formData.get('workflowId') ?? '');
  const partnerRequestId = String(formData.get('partnerRequestId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));

  if (!uuid.test(workflowId) || !uuid.test(partnerRequestId) || !uuid.test(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return { status: 'validation', message: 'This request changed before the action was ready. Reload the case.' };
  }
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || (viewer.viewer.role !== 'owner' && viewer.viewer.role !== 'director')) {
    return { status: 'denied', message: 'Verifying vendor delivery requires director authority for this case. Nothing changed.' };
  }
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this case right now. Nothing changed. Try again.' };

  const result = await client.rpc('verify_partner_request_idempotent', {
    p_partner_request_id: partnerRequestId,
    p_expected_version: expectedVersion,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'You do not have director authority for this case. Nothing changed.' };
    if (result.error.code === '40001') return { status: 'conflict', message: 'This request changed before it was verified. Reload the case.' };
    if (result.error.code === '55000') return { status: 'conflict', message: 'No delivery proof is waiting for review. Reload the case.' };
    return { status: 'unavailable', message: 'Passage could not verify this delivery. Nothing changed.' };
  }
  const receipt = firstRpcRow<VerifyReceipt>(result.data);
  if (!receipt?.partner_request_id) return { status: 'unavailable', message: 'We could not confirm the verification was saved. Reload before trying again.' };

  // Automatic vendor payout -- no admin step, no separate "pay the vendor"
  // action. If this throws (a transient Stripe error), verification itself
  // already succeeded and is durably saved; the "Release vendor payment"
  // recovery action covers the rare case where the transfer needs a retry.
  try {
    await attemptPartnerPayoutRelease(client, partnerRequestId, requestId);
  } catch {
    // swallow -- see comment above
  }

  revalidatePath(`/director/cases/${workflowId}`);
  revalidatePath('/director');
  return {
    status: 'saved',
    message: receipt.replayed ? 'This delivery was already verified.' : 'Vendor delivery verified. Payment to the vendor is being released automatically.',
    receipt: { occurredAt: new Date().toISOString(), replayed: receipt.replayed },
  };
}
