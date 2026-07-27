'use server';

import { revalidatePath } from 'next/cache';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createPassageServerClient } from '@/lib/supabase/server';
import type { PartnerCommandState } from '@/app/partner/actions';

// Director-side counterparts to app/partner/actions.ts: a director originates
// a vendor request from the Case Room, and later verifies the vendor's
// submitted delivery proof. Kept in their own file (not merged into the
// already-merged Cycle 8 assignment/proof-review actions.
type CreateReceipt = { partner_request_id: string; status: string; version: number; replayed: boolean };
type VerifyReceipt = { partner_request_id: string; status: string; version: number; replayed: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createPartnerRequest(_previous: PartnerCommandState, formData: FormData): Promise<PartnerCommandState> {
  const workflowId = String(formData.get('workflowId') ?? '');
  const partnerOrganizationId = String(formData.get('partnerOrganizationId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const category = String(formData.get('category') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const details = String(formData.get('details') ?? '').trim();
  const neededByRaw = String(formData.get('neededBy') ?? '').trim();

  if (!uuid.test(workflowId) || !uuid.test(partnerOrganizationId) || !uuid.test(requestId)
    || !['florist', 'catering', 'transport', 'memorial_products', 'other'].includes(category)
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
  revalidatePath(`/director/cases/${workflowId}`);
  revalidatePath('/director');
  return {
    status: 'saved',
    message: receipt.replayed ? 'This delivery was already verified.' : 'Vendor delivery verified and saved in case history.',
    receipt: { occurredAt: new Date().toISOString(), replayed: receipt.replayed },
  };
}
