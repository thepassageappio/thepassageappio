'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { firstRpcRow, validInvitationToken } from '@/lib/auth/invitations';
import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InvitationReceipt = {
  invitation_id: string;
  raw_token: string | null;
  invitation_expires_at: string;
  invitation_created_at: string;
  delivery_state: 'not_sent';
  replayed: boolean;
};

type RotationReceipt = {
  invitation_id: string;
  raw_token: string | null;
  invitation_expires_at: string;
  invitation_created_at: string;
  invitation_state: 'available' | 'accepted' | 'revoked' | 'expired';
  delivery_state: 'not_sent';
  replayed: boolean;
};

type InvitationRevocationReceipt = {
  invitation_id: string;
  revoked_at: string;
  event_id: string;
  replayed: boolean;
};

type ParticipantRevocationReceipt = {
  participant_id: string;
  revoked_at: string;
  event_id: string;
  replayed: boolean;
};

type LifecycleErrorKind = 'known_failure' | 'stale' | 'verification';

export type CoordinatorLifecycleState =
  | { status: 'idle' }
  | { status: 'error'; kind: LifecycleErrorKind; message: string }
  | {
      status: 'rotated';
      previousInvitationId: string;
      invitationId: string;
      rawToken: string | null;
      createdAt: string;
      expiresAt: string;
      replayed: boolean;
    }
  | { status: 'canceled'; invitationId: string; changedAt: string; replayed: boolean }
  | { status: 'access-ended'; participantId: string; changedAt: string; replayed: boolean };

const CANCELLATION_REASON = 'Family coordinator canceled the invitation';
const ACCESS_END_REASON = 'Family coordinator ended participant access';

function lifecycleError(message: string, fallback: string): CoordinatorLifecycleState {
  const normalized = message.toLowerCase();
  const stale = normalized.includes('conflict')
    || normalized.includes('accepted invitation')
    || normalized.includes('no longer available')
    || normalized.includes('cannot be rotated')
    || normalized.includes('instead of revoking')
    || normalized.includes('invitation is unavailable')
    || normalized.includes('participant access is unavailable');
  return stale
    ? {
        status: 'error',
        kind: 'stale',
        message: 'This access changed in another session. Reload People to see the current state before acting again.',
      }
    : { status: 'error', kind: 'known_failure', message: fallback };
}

function verifiedTimestamp(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export type InviteParticipantState =
  | { status: 'idle' }
  | { status: 'error'; message: string; field?: 'displayName' | 'invitedEmail' | 'relationship' | 'purpose' | 'categoryScope' | 'expiryDays' }
  | {
      status: 'created' | 'replayed';
      rawToken: string | null;
      displayName: string;
      invitedEmail: string;
      relationship: string;
      purpose: string;
      categoryScope: string[];
      createdAt: string;
      expiresAt: string;
    };

export async function createFamilySpace(formData: FormData) {
  const displayName = String(formData.get('displayName') ?? '').trim();
  const requestId = String(formData.get('requestId') ?? '');
  if (displayName.length < 2 || displayName.length > 120 || !UUID.test(requestId)) {
    redirect('/family/people?error=family-details');
  }
  const client = await createPassageServerClient();
  if (!client || !await verifiedUser(client)) redirect('/login?next=%2Ffamily%2Fpeople');
  const result = await client.rpc('create_family_space_idempotent', {
    p_display_name: displayName,
    p_request_id: requestId,
  });
  if (result.error) redirect('/family/people?error=family-save');
  revalidatePath('/family/people');
  redirect('/family/people?notice=family-created');
}

export async function createParticipantInvitation(
  _previous: InviteParticipantState,
  formData: FormData,
): Promise<InviteParticipantState> {
  const continuitySpaceId = String(formData.get('continuitySpaceId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const invitedEmail = String(formData.get('invitedEmail') ?? '').trim().toLowerCase();
  const displayName = String(formData.get('displayName') ?? '').trim();
  const relationship = String(formData.get('relationship') ?? '').trim();
  const purpose = String(formData.get('purpose') ?? '').trim();
  const expiryDays = Number(formData.get('expiryDays') ?? 7);
  const categoryScope = formData.getAll('categoryScope').map(String);

  if (!UUID.test(continuitySpaceId) || !UUID.test(requestId)) {
    return { status: 'error', message: 'Reload People before creating this invitation.' };
  }
  if (!EMAIL.test(invitedEmail)) {
    return { status: 'error', field: 'invitedEmail', message: 'Enter the complete email named for this invitation.' };
  }
  if (displayName.length < 2 || displayName.length > 120) {
    return { status: 'error', field: 'displayName', message: 'Enter the person’s name using 2 to 120 characters.' };
  }
  if (relationship.length < 2 || relationship.length > 80) {
    return { status: 'error', field: 'relationship', message: 'Describe their relationship using 2 to 80 characters.' };
  }
  if (purpose.length < 3 || purpose.length > 240) {
    return { status: 'error', field: 'purpose', message: 'Explain why you are inviting them using 3 to 240 characters.' };
  }
  if (categoryScope.length !== 1 || categoryScope[0] !== 'updates') {
    return { status: 'error', field: 'categoryScope', message: 'Choose Family updates for this invitation.' };
  }
  if (![7, 14, 30].includes(expiryDays)) {
    return { status: 'error', field: 'expiryDays', message: 'Choose an invitation length of 7, 14, or 30 days.' };
  }

  const client = await createPassageServerClient();
  if (!client || !await verifiedUser(client)) {
    return { status: 'error', message: 'Sign in again before creating this invitation.' };
  }
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
  const result = await client.rpc('create_participant_invitation_idempotent', {
    p_continuity_space_id: continuitySpaceId,
    p_invited_email: invitedEmail,
    p_display_name: displayName,
    p_relationship: relationship,
    p_purpose: purpose,
    p_category_scope: categoryScope,
    p_expires_at: expiresAt,
    p_request_id: requestId,
  });
  if (result.error) {
    const message = result.error.message.toLowerCase();
    if (message.includes('live invitation')) {
      return { status: 'error', message: 'A current invitation already exists for this person. Use the invitation in the waiting list.' };
    }
    if (message.includes('active participant')) {
      return { status: 'error', message: 'This person already has access to this family space.' };
    }
    if (message.includes('idempotency')) {
      return { status: 'error', message: 'This request no longer matches the saved invitation. Reload People and start again.' };
    }
    return { status: 'error', message: 'Passage could not create the invitation. Nothing changed; try again.' };
  }

  const receipt = firstRpcRow<InvitationReceipt>(result.data);
  if (!receipt) {
    return { status: 'error', message: 'Passage could not verify the saved invitation. Reload People before trying again.' };
  }
  revalidatePath('/family/people');
  return {
    status: receipt.replayed ? 'replayed' : 'created',
    rawToken: receipt.replayed ? null : receipt.raw_token,
    displayName,
    invitedEmail,
    relationship,
    purpose,
    categoryScope,
    createdAt: receipt.invitation_created_at,
    expiresAt: receipt.invitation_expires_at,
  };
}

export async function rotateParticipantInvitation(
  _previous: CoordinatorLifecycleState,
  formData: FormData,
): Promise<CoordinatorLifecycleState> {
  const invitationId = String(formData.get('invitationId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const requestedAt = String(formData.get('requestedAt') ?? '');
  const expiryDays = Number(formData.get('expiryDays') ?? 7);
  const requestedAtMs = Date.parse(requestedAt);
  const now = Date.now();
  if (!UUID.test(invitationId) || !UUID.test(requestId)) {
    return { status: 'error', kind: 'stale', message: 'Reload People before creating a replacement link.' };
  }
  if (![7, 14, 30].includes(expiryDays)
      || !Number.isFinite(requestedAtMs)
      || requestedAtMs > now + 5 * 60 * 1000
      || requestedAtMs < now - 24 * 60 * 60 * 1000) {
    return { status: 'error', kind: 'known_failure', message: 'Choose a new link length of 7, 14, or 30 days.' };
  }

  const expiresAt = new Date(requestedAtMs + expiryDays * 24 * 60 * 60 * 1000).toISOString();
  const client = await createPassageServerClient();
  if (!client || !await verifiedUser(client)) {
    return { status: 'error', kind: 'known_failure', message: 'Sign in again before creating a replacement link. Nothing changed.' };
  }
  const result = await client.rpc('rotate_participant_invitation_idempotent', {
    p_invitation_id: invitationId,
    p_expires_at: expiresAt,
    p_request_id: requestId,
  });
  if (result.error) {
    return lifecycleError(result.error.message, 'Passage could not create the replacement link. Nothing changed; try again.');
  }
  const receipt = firstRpcRow<RotationReceipt>(result.data);
  if (!receipt
      || receipt.invitation_id === invitationId
      || !UUID.test(receipt.invitation_id)
      || !verifiedTimestamp(receipt.invitation_created_at)
      || !verifiedTimestamp(receipt.invitation_expires_at)
      || receipt.invitation_state !== 'available'
      || receipt.delivery_state !== 'not_sent'
      || (receipt.replayed
        ? receipt.raw_token !== null
        : !receipt.raw_token || !validInvitationToken(receipt.raw_token))) {
    return {
      status: 'error',
      kind: 'verification',
      message: 'Passage could not confirm the saved replacement. Reload People before sharing any link.',
    };
  }
  revalidatePath('/family/people');
  return {
    status: 'rotated',
    previousInvitationId: invitationId,
    invitationId: receipt.invitation_id,
    rawToken: receipt.raw_token,
    createdAt: receipt.invitation_created_at,
    expiresAt: receipt.invitation_expires_at,
    replayed: receipt.replayed,
  };
}

export async function cancelParticipantInvitation(
  _previous: CoordinatorLifecycleState,
  formData: FormData,
): Promise<CoordinatorLifecycleState> {
  const invitationId = String(formData.get('invitationId') ?? '');
  if (!UUID.test(invitationId)) {
    return { status: 'error', kind: 'stale', message: 'Reload People before canceling this invitation.' };
  }
  const client = await createPassageServerClient();
  if (!client || !await verifiedUser(client)) {
    return { status: 'error', kind: 'known_failure', message: 'Sign in again before canceling this invitation. Nothing changed.' };
  }
  const result = await client.rpc('revoke_participant_invitation', {
    p_invitation_id: invitationId,
    p_reason: CANCELLATION_REASON,
  });
  if (result.error) {
    return lifecycleError(result.error.message, 'Passage could not cancel the invitation. Nothing changed; try again.');
  }
  const receipt = firstRpcRow<InvitationRevocationReceipt>(result.data);
  if (!receipt
      || receipt.invitation_id !== invitationId
      || !UUID.test(receipt.event_id)
      || !verifiedTimestamp(receipt.revoked_at)) {
    return {
      status: 'error',
      kind: 'verification',
      message: 'Passage could not confirm whether the invitation was canceled. Reload People before acting again.',
    };
  }
  revalidatePath('/family/people');
  return {
    status: 'canceled',
    invitationId,
    changedAt: receipt.revoked_at,
    replayed: receipt.replayed,
  };
}

export async function endParticipantAccess(
  _previous: CoordinatorLifecycleState,
  formData: FormData,
): Promise<CoordinatorLifecycleState> {
  const participantId = String(formData.get('participantId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  if (!UUID.test(participantId) || !UUID.test(requestId)) {
    return { status: 'error', kind: 'stale', message: 'Reload People before ending this access.' };
  }
  const client = await createPassageServerClient();
  if (!client || !await verifiedUser(client)) {
    return { status: 'error', kind: 'known_failure', message: 'Sign in again before ending this access. Nothing changed.' };
  }
  const result = await client.rpc('revoke_continuity_participant_idempotent', {
    p_participant_id: participantId,
    p_reason: ACCESS_END_REASON,
    p_request_id: requestId,
  });
  if (result.error) {
    return lifecycleError(result.error.message, 'Passage could not end this access. Nothing changed; try again.');
  }
  const receipt = firstRpcRow<ParticipantRevocationReceipt>(result.data);
  if (!receipt
      || receipt.participant_id !== participantId
      || !UUID.test(receipt.event_id)
      || !verifiedTimestamp(receipt.revoked_at)) {
    return {
      status: 'error',
      kind: 'verification',
      message: 'Passage could not confirm whether access ended. Reload People before acting again.',
    };
  }
  revalidatePath('/family/people');
  revalidatePath('/participant');
  revalidatePath('/case/[id]/messages', 'page');
  return {
    status: 'access-ended',
    participantId,
    changedAt: receipt.revoked_at,
    replayed: receipt.replayed,
  };
}
