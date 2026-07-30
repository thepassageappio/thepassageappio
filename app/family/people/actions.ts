'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { firstRpcRow } from '@/lib/auth/invitations';
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
