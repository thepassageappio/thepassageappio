'use server';

import { revalidatePath } from 'next/cache';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createPassageServerClient } from '@/lib/supabase/server';

export type FamilyInvitationState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'created';
  message?: string;
  receipt?: {
    invitedEmail: string;
    relationship: string;
    purpose: string;
    expiresAt: string;
    invitePath?: string;
    replayed: boolean;
  };
};

type Receipt = { invitation_id: string; raw_token: string | null; token_hint: string; invitation_expires_at: string; invitation_created_at: string; invitation_state: string; replayed: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PARTICIPANT_ROLES = ['family_member', 'executor', 'poa_medical_proxy', 'clergy_officiant', 'cemetery_crematory_contact'];

export async function createFamilyInvitation(_previous: FamilyInvitationState, formData: FormData): Promise<FamilyInvitationState> {
  const workflowId = String(formData.get('workflowId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const invitedEmail = String(formData.get('invitedEmail') ?? '').trim().toLowerCase();
  const displayName = String(formData.get('displayName') ?? '').trim();
  const relationship = String(formData.get('relationship') ?? '').trim();
  const purpose = String(formData.get('purpose') ?? '').trim();
  const expiresAt = new Date(String(formData.get('expiresAt') ?? ''));
  const participantRole = String(formData.get('participantRole') ?? 'family_member');

  if (!uuid.test(workflowId) || !uuid.test(requestId)) return { status: 'validation', message: 'This form expired before submission. Reload and try again.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedEmail)) return { status: 'validation', message: 'Enter the family member’s email address. Nothing was created.' };
  if (!displayName) return { status: 'validation', message: 'Enter the family member’s name. Nothing was created.' };
  if (!relationship) return { status: 'validation', message: 'Enter their relationship to the case. Nothing was created.' };
  if (!purpose) return { status: 'validation', message: 'Explain why this family access is needed. Nothing was created.' };
  if (Number.isNaN(expiresAt.getTime())) return { status: 'validation', message: 'Choose a valid invitation expiry. Nothing was created.' };
  if (!PARTICIPANT_ROLES.includes(participantRole)) return { status: 'validation', message: 'Choose a valid participant role. Nothing was created.' };

  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || (viewer.viewer.role !== 'owner' && viewer.viewer.role !== 'director')) {
    return { status: 'denied', message: 'Inviting family access requires director authority for this case. Nothing changed.' };
  }
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this case right now. Nothing changed. Try again.' };

  const result = await client.rpc('create_case_family_invitation_idempotent', {
    p_workflow_id: workflowId,
    p_invited_email: invitedEmail,
    p_display_name: displayName,
    p_relationship: relationship,
    p_purpose: purpose,
    p_expires_at: expiresAt.toISOString(),
    p_request_id: requestId,
    p_participant_role: participantRole,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'You do not have authority to invite family access for this case. Nothing changed.' };
    if (result.error.code === '23505') return { status: 'conflict', message: 'That person already has active access or a pending invitation for this case. Nothing new was created.' };
    if (result.error.code === '22023') return { status: 'validation', message: 'Review the recipient, relationship, purpose, and expiry. Nothing was created.' };
    return { status: 'unavailable', message: 'Passage could not create the invitation right now. Nothing is shown as sent or accepted.' };
  }
  const receipt = firstRpcRow<Receipt>(result.data);
  if (!receipt?.invitation_id) return { status: 'unavailable', message: 'Passage did not return a complete creation receipt. Reload before retrying.' };
  revalidatePath(`/director/cases/${workflowId}`);
  return {
    status: 'created',
    receipt: {
      invitedEmail, relationship, purpose,
      expiresAt: receipt.invitation_expires_at,
      invitePath: receipt.raw_token ? `/family-invite/${receipt.raw_token}` : undefined,
      replayed: receipt.replayed,
    },
  };
}
