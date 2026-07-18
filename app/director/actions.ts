'use server';

import { revalidatePath } from 'next/cache';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createPassageServerClient } from '@/lib/supabase/server';

export type DirectorCommandState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'saved';
  message?: string;
  receipt?: {
    eventId: string;
    occurredAt: string;
    replayed: boolean;
  };
};

type CommandReceipt = { event_id: string; occurred_at: string; replayed: boolean };
type InvitationReceipt = { invitation_id: string; revoked_at: string; invitation_state: string; replayed: boolean };

export const initialDirectorCommandState: DirectorCommandState = { status: 'idle' };
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

function rpcFailure(error: { code?: string } | null, noun: string): DirectorCommandState {
  if (error?.code === '42501' || error?.code === '28000') return failure('denied', `This ${noun} is outside your current authority. Nothing changed.`);
  if (error?.code === '40001') return failure('conflict', 'Ownership changed before your action was saved. No change was made. Reload current work.');
  if (error?.code === '55000') return failure('conflict', noun === 'team access' ? 'Reassign active commitments before ending access. Nothing changed.' : `The ${noun} changed before this command. Reload and review it again.`);
  if (error?.code === '22023') return failure('validation', `Review the ${noun} command. It conflicts with an earlier request or is incomplete.`);
  return failure('unavailable', `Passage could not save the ${noun} command. Nothing is shown as changed.`);
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
  if (!authority) return failure('denied', 'Verified director authority is required. Nothing changed.');
  const result = await authority.client.rpc('assign_task_idempotent', {
    p_task_id: taskId,
    p_expected_version: expectedVersion,
    p_assignee_member_id: assigneeId,
    p_reason: reason,
    p_request_id: requestId,
  });
  if (result.error) return rpcFailure(result.error, 'assignment');
  const receipt = firstRpcRow<CommandReceipt>(result.data);
  if (!receipt?.event_id || !receipt.occurred_at) return failure('unavailable', 'Passage did not return a complete assignment receipt. Reload before retrying.');
  revalidatePath('/director');
  revalidatePath('/staff');
  revalidatePath('/director/activity');
  return { status: 'saved', message: receipt.replayed ? 'The original assignment receipt was returned. No duplicate event was created.' : 'Ownership was saved and the activity receipt is ready.', receipt: { eventId: receipt.event_id, occurredAt: receipt.occurred_at, replayed: receipt.replayed } };
}

export async function revokeInvitation(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const invitationId = String(formData.get('invitationId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (!uuid.test(invitationId) || !reason) return failure('validation', 'Name the invitation and explain why access is being revoked. Nothing changed.');
  const authority = await directorClient();
  if (!authority) return failure('denied', 'Verified director authority is required. Nothing changed.');
  const result = await authority.client.rpc('revoke_organization_invitation', { p_invitation_id: invitationId, p_reason: reason });
  if (result.error) return rpcFailure(result.error, 'invitation');
  const receipt = firstRpcRow<InvitationReceipt>(result.data);
  if (!receipt?.invitation_id || !receipt.revoked_at) return failure('unavailable', 'Passage did not return a complete revocation receipt. Reload before retrying.');
  revalidatePath('/director/team');
  revalidatePath('/director/activity');
  return { status: 'saved', message: receipt.replayed ? 'This invitation was already revoked. No duplicate activity was created.' : 'The invitation was revoked. No access was granted.', receipt: { eventId: receipt.invitation_id, occurredAt: receipt.revoked_at, replayed: receipt.replayed } };
}

export async function revokeMember(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const memberId = String(formData.get('memberId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  const requestId = String(formData.get('requestId') ?? '');
  if (!uuid.test(memberId) || !uuid.test(requestId) || !reason) return failure('validation', 'Name the staff member and explain why access is ending. Nothing changed.');
  const authority = await directorClient();
  if (!authority) return failure('denied', 'Verified director authority is required. Nothing changed.');
  const result = await authority.client.rpc('revoke_organization_member_idempotent', { p_member_id: memberId, p_reason: reason, p_request_id: requestId });
  if (result.error) return rpcFailure(result.error, 'team access');
  const receipt = firstRpcRow<CommandReceipt>(result.data);
  if (!receipt?.event_id || !receipt.occurred_at) return failure('unavailable', 'Passage did not return a complete access receipt. Reload before retrying.');
  revalidatePath('/director/team');
  revalidatePath('/director/activity');
  revalidatePath('/staff');
  return { status: 'saved', message: receipt.replayed ? 'The original access-ending receipt was returned. No duplicate event was created.' : 'Team access ended. Existing activity remains in the record.', receipt: { eventId: receipt.event_id, occurredAt: receipt.occurred_at, replayed: receipt.replayed } };
}
