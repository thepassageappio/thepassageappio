'use server';

import { revalidatePath } from 'next/cache';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createPassageServerClient } from '@/lib/supabase/server';

export type UrgentDirectorCommandState = {
  status: 'idle' | 'saved' | 'validation' | 'denied' | 'unavailable' | 'conflict';
  message?: string;
  receipt?: { occurredAt: string; replayed: boolean; workflowId?: string };
};

type ClaimReceipt = { urgent_intake_request_id: string; status: string; version: number; replayed: boolean };
type CaseReceipt = { urgent_intake_request_id: string; workflow_id: string; status: string; version: number; replayed: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function claimUrgentIntake(_previous: UrgentDirectorCommandState, formData: FormData): Promise<UrgentDirectorCommandState> {
  const requestUiId = String(formData.get('urgentIntakeRequestId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));

  if (!uuid.test(requestUiId) || !uuid.test(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return { status: 'validation', message: 'This changed before the action was ready. Reload the queue.' };
  }
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || (viewer.viewer.role !== 'owner' && viewer.viewer.role !== 'director')) {
    return { status: 'denied', message: 'Claiming an urgent request requires director authority. Nothing changed.' };
  }
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'Passage could not reach the queue right now. Nothing changed. Try again.' };

  const result = await client.rpc('claim_urgent_intake_idempotent', {
    p_urgent_intake_request_id: requestUiId,
    p_expected_version: expectedVersion,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'You do not have director authority to claim this. Nothing changed.' };
    if (result.error.code === '40001') return { status: 'conflict', message: 'This request changed before it was claimed. Reload the queue.' };
    if (result.error.code === '55000') return { status: 'conflict', message: 'This request is no longer waiting to be claimed. Reload the queue.' };
    return { status: 'unavailable', message: 'Passage could not claim this request. Nothing changed.' };
  }
  const receipt = firstRpcRow<ClaimReceipt>(result.data);
  if (!receipt?.urgent_intake_request_id) return { status: 'unavailable', message: 'We could not confirm this was claimed. Reload before trying again.' };
  revalidatePath('/director/urgent');
  revalidatePath(`/director/urgent/${requestUiId}`);
  return {
    status: 'saved',
    message: receipt.replayed ? 'You already claimed this request.' : 'Claimed. Create the case when ready.',
    receipt: { occurredAt: new Date().toISOString(), replayed: receipt.replayed },
  };
}

export async function createCaseFromUrgentIntake(_previous: UrgentDirectorCommandState, formData: FormData): Promise<UrgentDirectorCommandState> {
  const requestUiId = String(formData.get('urgentIntakeRequestId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));
  const organizationLocationId = String(formData.get('organizationLocationId') ?? '');
  const caseReference = String(formData.get('caseReference') ?? '').trim();
  const familyName = String(formData.get('familyName') ?? '').trim();

  if (!uuid.test(requestUiId) || !uuid.test(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1
    || !uuid.test(organizationLocationId) || caseReference.length < 1 || caseReference.length > 60
    || familyName.length < 1 || familyName.length > 200) {
    return { status: 'validation', message: 'Review the case details. Nothing was created.' };
  }
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || (viewer.viewer.role !== 'owner' && viewer.viewer.role !== 'director')) {
    return { status: 'denied', message: 'Creating a case requires director authority. Nothing changed.' };
  }
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'Passage could not reach the queue right now. Nothing changed. Try again.' };

  const result = await client.rpc('create_case_from_urgent_intake_idempotent', {
    p_urgent_intake_request_id: requestUiId,
    p_expected_version: expectedVersion,
    p_organization_location_id: organizationLocationId,
    p_case_reference: caseReference,
    p_family_name: familyName,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'You do not have director authority for this organization and location. Nothing changed.' };
    if (result.error.code === '40001') return { status: 'conflict', message: 'This request changed before the case was created. Reload the page.' };
    if (result.error.code === '55000') return { status: 'conflict', message: 'This request is not ready for a case yet. Reload the page.' };
    return { status: 'unavailable', message: 'Passage could not create the case. Nothing changed.' };
  }
  const receipt = firstRpcRow<CaseReceipt>(result.data);
  if (!receipt?.workflow_id) return { status: 'unavailable', message: 'We could not confirm the case was created. Reload before trying again.' };
  revalidatePath('/director/urgent');
  revalidatePath(`/director/urgent/${requestUiId}`);
  revalidatePath('/director');
  return {
    status: 'saved',
    message: receipt.replayed ? 'This case was already created.' : 'Case created.',
    receipt: { occurredAt: new Date().toISOString(), replayed: receipt.replayed, workflowId: receipt.workflow_id },
  };
}
