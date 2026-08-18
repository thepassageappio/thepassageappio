'use server';

import { revalidatePath } from 'next/cache';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createPassageServerClient } from '@/lib/supabase/server';

export type DirectorCommandState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'saved' | 'upgrade-required';
  message?: string;
  receipt?: {
    occurredAt: string;
    replayed: boolean;
  };
};

type CommandReceipt = { event_id: string; occurred_at: string; replayed: boolean };
type InvitationReceipt = { invitation_id: string; revoked_at: string; invitation_state: string; replayed: boolean };
type CaseCreationGrantReceipt = { organization_member_id: string; organization_location_id: string; can_create_cases: boolean; replayed: boolean };
type LocationReceipt = { location_id: string; location_count: number; included_location_slots: number; is_additional: boolean; replayed: boolean };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function failure(status: DirectorCommandState['status'], message: string): DirectorCommandState {
  return { status, message };
}

async function directorClient() {
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || !['owner', 'director'].includes(viewer.viewer.role)) return null;
  const client = await createPassageServerClient();
  return client ? { client, viewer: viewer.viewer } : null;
}

// `noun` names the thing that changed, e.g. "assignment" / "proof review" --
// the 40001 branch previously hardcoded "Ownership changed..." regardless
// of noun, a copy bug that leaked assignment-specific wording into e.g. a
// proof-review conflict (found during the 2026-08-17 full UX audit).
function rpcFailure(error: { code?: string; message?: string } | null, noun: string): DirectorCommandState {
  if (error?.code === '42501' || error?.code === '28000') return failure('denied', `You do not have access to change this ${noun}. Nothing changed. Ask an organization owner for help.`);
  if (error?.code === '40001') return failure('conflict', `This ${noun} changed before your action was saved. No change was made. Reload current work.`);
  if (error?.code === '55000') return failure('conflict', noun === 'team access' ? 'Reassign active commitments before ending access. Nothing changed.' : `The ${noun} changed before this action was saved. Reload and review it again.`);
  if (error?.code === '55001') return failure('upgrade-required', error.message?.trim() || `Your plan does not include another ${noun}. Upgrade to continue.`);
  if (error?.code === '22023') return failure('validation', `Review the ${noun} details. They are incomplete or no longer match the current record.`);
  return failure('unavailable', `We could not save this ${noun}. Nothing changed. Try again.`);
}

export async function assignTask(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const taskId = String(formData.get('taskId') ?? '');
  const assigneeId = String(formData.get('assigneeId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));
  const reason = String(formData.get('reason') ?? '').trim();
  const requestId = String(formData.get('requestId') ?? '');
  if (!uuid.test(taskId) || !uuid.test(assigneeId) || !uuid.test(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1 || !reason) {
    return failure('validation', 'Choose authorized staff and explain why ownership is changing. Nothing changed.');
  }
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('assign_task_idempotent', {
    p_task_id: taskId,
    p_expected_version: expectedVersion,
    p_assignee_member_id: assigneeId,
    p_reason: reason,
    p_request_id: requestId,
  });
  if (result.error) return rpcFailure(result.error, 'assignment');
  const receipt = firstRpcRow<CommandReceipt>(result.data);
  if (!receipt?.event_id || !receipt.occurred_at) return failure('unavailable', 'We could not confirm that the owner changed. Reload before trying again.');
  revalidatePath('/director');
  revalidatePath('/staff');
  revalidatePath('/director/activity');
  return { status: 'saved', message: receipt.replayed ? 'This ownership change was already saved. The original saved time is shown below.' : 'Ownership was saved in team activity.', receipt: { occurredAt: receipt.occurred_at, replayed: receipt.replayed } };
}

export async function revokeInvitation(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const invitationId = String(formData.get('invitationId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (!uuid.test(invitationId) || !reason) return failure('validation', 'Name the invitation and explain why access is being revoked. Nothing changed.');
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('revoke_organization_invitation', { p_invitation_id: invitationId, p_reason: reason });
  if (result.error) return rpcFailure(result.error, 'invitation');
  const receipt = firstRpcRow<InvitationReceipt>(result.data);
  if (!receipt?.invitation_id || !receipt.revoked_at) return failure('unavailable', 'Passage did not return a complete revocation receipt. Reload before retrying.');
  revalidatePath('/director/team');
  revalidatePath('/director/activity');
  return { status: 'saved', message: receipt.replayed ? 'This invitation was already revoked. The original saved time is shown below.' : 'The invitation was revoked. No access was granted.', receipt: { occurredAt: receipt.revoked_at, replayed: receipt.replayed } };
}

export async function revokeMember(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const memberId = String(formData.get('memberId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  const requestId = String(formData.get('requestId') ?? '');
  if (!uuid.test(memberId) || !uuid.test(requestId) || !reason) return failure('validation', 'Name the staff member and explain why access is ending. Nothing changed.');
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('revoke_organization_member_idempotent', { p_member_id: memberId, p_reason: reason, p_request_id: requestId });
  if (result.error) return rpcFailure(result.error, 'team access');
  const receipt = firstRpcRow<CommandReceipt>(result.data);
  if (!receipt?.event_id || !receipt.occurred_at) return failure('unavailable', 'Passage did not return a complete access receipt. Reload before retrying.');
  revalidatePath('/director/team');
  revalidatePath('/director/activity');
  revalidatePath('/staff');
  return { status: 'saved', message: receipt.replayed ? 'This access change was already saved. The original saved time is shown below.' : 'Team access ended. Earlier activity remains in the record.', receipt: { occurredAt: receipt.occurred_at, replayed: receipt.replayed } };
}

export async function reviewTaskProof(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const proofId = String(formData.get('proofId') ?? '');
  const workflowId = String(formData.get('workflowId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));
  const decision = String(formData.get('decision') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  const requestId = String(formData.get('requestId') ?? '');
  if (!uuid.test(proofId) || !uuid.test(workflowId) || !uuid.test(requestId)
    || !Number.isInteger(expectedVersion) || expectedVersion < 1
    || !['verified', 'needs_replacement'].includes(decision)
    || (decision === 'needs_replacement' && !reason)
    || (decision === 'verified' && reason)) {
    return failure('validation', 'Choose a valid proof decision and explain any replacement request. Nothing changed.');
  }
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('review_task_proof_idempotent', {
    p_proof_id: proofId,
    p_expected_task_version: expectedVersion,
    p_decision: decision,
    p_reason: reason || null,
    p_request_id: requestId,
  });
  if (result.error) return rpcFailure(result.error, 'proof review');
  const receipt = firstRpcRow<CommandReceipt>(result.data);
  if (!receipt?.event_id || !receipt.occurred_at) return failure('unavailable', 'Passage did not return a complete proof-review receipt. Reload before retrying.');
  revalidatePath('/director');
  revalidatePath(`/director/cases/${workflowId}`);
  revalidatePath('/director/activity');
  revalidatePath('/staff');
  return {
    status: 'saved',
    message: receipt.replayed ? 'Already recorded. The original review receipt was returned.' : decision === 'verified' ? 'Proof verified. The task is complete.' : 'Replacement requested. The task returned to the current owner.',
    receipt: { occurredAt: receipt.occurred_at, replayed: receipt.replayed },
  };
}

export async function createLocation(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const organizationId = String(formData.get('organizationId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();
  const zip = String(formData.get('zip') ?? '').trim();
  if (!uuid.test(organizationId) || !uuid.test(requestId) || !name) {
    return failure('validation', 'Enter a location name. Nothing was created.');
  }
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('create_organization_location_idempotent', {
    p_organization_id: organizationId,
    p_name: name,
    p_address: address || null,
    p_city: city || null,
    p_state: state || null,
    p_zip: zip || null,
    p_request_id: requestId,
  });
  if (result.error) return rpcFailure(result.error, 'location');
  const receipt = firstRpcRow<LocationReceipt>(result.data);
  if (!receipt?.location_id) return failure('unavailable', 'Passage did not return a complete location receipt. Reload before retrying.');
  revalidatePath('/director/team');
  revalidatePath('/director/activity');
  return {
    status: 'saved',
    message: receipt.replayed ? 'This location was already created.' : 'Location added.',
  };
}

export async function grantStaffLocation(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const memberId = String(formData.get('memberId') ?? '');
  const locationId = String(formData.get('locationId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const canCreateCases = String(formData.get('canCreateCases') ?? '') === 'true';
  if (!uuid.test(memberId) || !uuid.test(locationId) || !uuid.test(requestId)) {
    return failure('validation', 'Choose a staff member and location. Nothing changed.');
  }
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('grant_staff_location_idempotent', {
    p_organization_member_id: memberId,
    p_organization_location_id: locationId,
    p_can_create_cases: canCreateCases,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '23505') return failure('conflict', 'This staff member already has this location. Nothing changed.');
    return rpcFailure(result.error, 'location grant');
  }
  const receipt = firstRpcRow<CaseCreationGrantReceipt>(result.data);
  if (!receipt) return failure('unavailable', 'Passage did not return a complete grant receipt. Reload before retrying.');
  revalidatePath('/director/team');
  revalidatePath('/director/activity');
  return {
    status: 'saved',
    message: receipt.replayed ? 'Already recorded. This staff member already has this location.' : 'Location added for this staff member.',
  };
}

export async function setStaffCaseCreationGrant(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const memberId = String(formData.get('memberId') ?? '');
  const locationId = String(formData.get('locationId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const granted = String(formData.get('granted') ?? '') === 'true';
  const reason = String(formData.get('reason') ?? '').trim();
  if (!uuid.test(memberId) || !uuid.test(locationId) || !uuid.test(requestId) || (!granted && !reason)) {
    return failure('validation', 'Choose a staff member and location, and explain any removal of case-creation rights. Nothing changed.');
  }
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('set_staff_case_creation_grant_idempotent', {
    p_organization_member_id: memberId,
    p_organization_location_id: locationId,
    p_granted: granted,
    p_request_id: requestId,
    p_revocation_reason: granted ? null : reason,
  });
  if (result.error) return rpcFailure(result.error, 'case-creation grant');
  const receipt = firstRpcRow<CaseCreationGrantReceipt>(result.data);
  if (!receipt) return failure('unavailable', 'Passage did not return a complete grant receipt. Reload before retrying.');
  revalidatePath('/director/team');
  revalidatePath('/director/activity');
  return {
    status: 'saved',
    message: receipt.replayed
      ? 'Already recorded. This grant was already set to that state.'
      : receipt.can_create_cases
        ? 'This staff member can now create cases at this location.'
        : 'Case-creation rights were removed.',
  };
}
