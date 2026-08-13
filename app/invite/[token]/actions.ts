'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  firstRpcRow,
  type InvitationAcceptance,
  type ParticipantInvitationAcceptance,
  type ParticipantInvitationDeclineReceipt,
  type PassageInvitationInspection,
} from '@/lib/auth/invitations';
import { readInvitationIntent } from '@/lib/auth/invitation-intent';
import { INVITATION_CONTINUE_PATH } from '@/lib/auth/invitation-intent-cookie';
import { loginPath } from '@/lib/auth/redirects';
import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

const DECLINE_REASON = 'Invited person declined the invitation';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ParticipantDecisionState =
  | { status: 'idle' }
  | { status: 'error'; kind: 'known_failure' | 'stale' | 'verification'; message: string }
  | { status: 'declined'; declinedAt: string; replayed: boolean };

function failureCode(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('verified email address')) return 'email-mismatch';
  if (normalized.includes('active family access')) return 'existing-access';
  if (normalized.includes('accepted by another') || normalized.includes('already bound to another')) return 'claimed-other';
  if (normalized.includes('access has ended')) return 'access-ended';
  if (normalized.includes('invalid or unavailable')) return 'unavailable';
  return 'retry';
}

async function invitationContext() {
  const invitePath = INVITATION_CONTINUE_PATH;
  const token = await readInvitationIntent();
  if (!token) redirect(`${invitePath}?error=invalid`);
  const client = await createPassageServerClient();
  if (!client) redirect(`${invitePath}?error=environment`);
  if (!await verifiedUser(client)) redirect(loginPath(invitePath));
  const inspection = await client.rpc('inspect_passage_invitation', { p_raw_token: token });
  const invitation = inspection.error
    ? null
    : firstRpcRow<PassageInvitationInspection>(inspection.data);
  if (!invitation) redirect(`${invitePath}?error=unavailable`);
  return { client, invitation, invitePath, token };
}

export async function acceptInvitation() {
  const { client, invitation, invitePath, token } = await invitationContext();
  if (invitation.invitation_type !== 'staff') redirect(`${invitePath}?error=unavailable`);

  const accepted = await client.rpc('accept_organization_invitation', { raw_token: token });
  if (accepted.error) redirect(`${invitePath}?error=${failureCode(accepted.error.message)}`);
  const first = firstRpcRow<InvitationAcceptance>(accepted.data);
  if (!first || !await verifiedUser(client)) redirect(`${invitePath}?error=verification`);

  const verified = await client.rpc('accept_organization_invitation', { raw_token: token });
  const second = verified.error ? null : firstRpcRow<InvitationAcceptance>(verified.data);
  if (!second
    || !second.replayed
    || second.organization_member_id !== first.organization_member_id
    || second.organization_id !== first.organization_id
    || second.member_role !== first.member_role) {
    redirect(`${invitePath}?error=verification`);
  }
  redirect(`${invitePath}?receipt=accepted`);
}

export async function acceptParticipantInvitation() {
  const { client, invitation, invitePath, token } = await invitationContext();
  if (invitation.invitation_type !== 'participant') redirect(`${invitePath}?error=unavailable`);

  const accepted = await client.rpc('accept_participant_invitation', { p_raw_token: token });
  if (accepted.error) redirect(`${invitePath}?error=${failureCode(accepted.error.message)}`);
  const first = firstRpcRow<ParticipantInvitationAcceptance>(accepted.data);
  if (!first || !await verifiedUser(client)) redirect(`${invitePath}?error=verification`);

  const verified = await client.rpc('accept_participant_invitation', { p_raw_token: token });
  const second = verified.error
    ? null
    : firstRpcRow<ParticipantInvitationAcceptance>(verified.data);
  if (!second
    || !second.replayed
    || second.participant_id !== first.participant_id
    || second.continuity_space_id !== first.continuity_space_id
    || second.accepted_at !== first.accepted_at) {
    redirect(`${invitePath}?error=verification`);
  }
  redirect(`${invitePath}?receipt=accepted`);
}

export async function declineParticipantInvitation(
  _previous: ParticipantDecisionState,
  _formData: FormData,
): Promise<ParticipantDecisionState> {
  const token = await readInvitationIntent();
  if (!token) {
    return { status: 'error', kind: 'stale', message: 'This invitation is no longer available. Ask the family coordinator if you still need access.' };
  }
  const client = await createPassageServerClient();
  if (!client || !await verifiedUser(client)) {
    return { status: 'error', kind: 'known_failure', message: 'Sign in with the email named for this invitation before declining. Nothing changed.' };
  }
  const inspection = await client.rpc('inspect_passage_invitation', { p_raw_token: token });
  const invitation = inspection.error
    ? null
    : firstRpcRow<PassageInvitationInspection>(inspection.data);
  if (!invitation
      || invitation.invitation_type !== 'participant'
      || invitation.invitation_state !== 'available') {
    return { status: 'error', kind: 'stale', message: 'This invitation changed in another session. Reload it to see the current state.' };
  }

  const result = await client.rpc('decline_participant_invitation', {
    p_raw_token: token,
    p_reason: DECLINE_REASON,
  });
  if (result.error) {
    const normalized = result.error.message.toLowerCase();
    if (normalized.includes('accepted')
        || normalized.includes('unavailable')
        || normalized.includes('conflict')) {
      return { status: 'error', kind: 'stale', message: 'This invitation changed in another session. Reload it to see the current state.' };
    }
    if (normalized.includes('verified email')) {
      return { status: 'error', kind: 'known_failure', message: 'This signed-in account cannot decline this invitation. No access was added.' };
    }
    return { status: 'error', kind: 'known_failure', message: 'Passage could not decline the invitation. Nothing changed; try again.' };
  }
  const first = firstRpcRow<ParticipantInvitationDeclineReceipt>(result.data);
  if (!first
      || !UUID.test(first.invitation_id)
      || !UUID.test(first.event_id)
      || !Number.isFinite(Date.parse(first.declined_at))) {
    return { status: 'error', kind: 'verification', message: 'Passage could not confirm the saved result. Reload the invitation before acting again.' };
  }

  const verified = await client.rpc('decline_participant_invitation', {
    p_raw_token: token,
    p_reason: DECLINE_REASON,
  });
  const second = verified.error
    ? null
    : firstRpcRow<ParticipantInvitationDeclineReceipt>(verified.data);
  if (!second
      || !second.replayed
      || second.invitation_id !== first.invitation_id
      || second.event_id !== first.event_id
      || second.declined_at !== first.declined_at) {
    return { status: 'error', kind: 'verification', message: 'Passage could not confirm the saved result. Reload the invitation before acting again.' };
  }
  revalidatePath(INVITATION_CONTINUE_PATH);
  revalidatePath('/family/people');
  return { status: 'declined', declinedAt: first.declined_at, replayed: first.replayed };
}

export async function useAnotherInvitationAccount() {
  const client = await createPassageServerClient();
  if (!client) redirect(`${INVITATION_CONTINUE_PATH}?error=signout-failed`);
  const signOutResult = await client.auth.signOut({ scope: 'local' });
  if (signOutResult.error) redirect(`${INVITATION_CONTINUE_PATH}?error=signout-failed`);
  redirect(`${loginPath(INVITATION_CONTINUE_PATH)}&status=account-switched`);
}
