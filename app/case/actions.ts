'use server';

import { revalidatePath } from 'next/cache';
import { firstRpcRow } from '@/lib/auth/invitations';
import { verifiedUser } from '@/lib/auth/session';
import { syncD2cEstateUsage } from '@/lib/hubspot';
import { createPassageServerClient } from '@/lib/supabase/server';

export type CreateEstateState = {
  status: 'idle' | 'validation' | 'denied' | 'unavailable' | 'upgrade-required' | 'created';
  message?: string;
};

type EstateReceipt = { workflow_id: string; seat_index: number; replayed: boolean };

export async function createAdditionalEstate(_previous: CreateEstateState, formData: FormData): Promise<CreateEstateState> {
  const personName = String(formData.get('personName') ?? '').trim();
  const relationship = String(formData.get('relationship') ?? '').trim();
  const requestId = String(formData.get('requestId') ?? '');

  if (!personName || personName.length > 200) return { status: 'validation', message: 'Enter who this estate is for. Nothing was created.' };

  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'Passage could not verify sign-in right now. Nothing was created.' };
  const user = await verifiedUser(client);
  if (!user) return { status: 'denied', message: 'Sign in before adding another estate. Nothing was created.' };

  const result = await client.rpc('create_additional_estate_idempotent', {
    p_person_name: personName,
    p_relationship: relationship || null,
    p_request_id: requestId,
  });

  if (result.error) {
    if (result.error.code === '28000') return { status: 'denied', message: 'Sign in before adding another estate. Nothing was created.' };
    if (result.error.code === '22023') return { status: 'validation', message: 'Enter a valid name for this estate. Nothing was created.' };
    if (result.error.code === '55001') return { status: 'upgrade-required', message: result.error.message?.trim() || 'Your plan is at its estate limit. Upgrade to add another.' };
    return { status: 'unavailable', message: 'Passage could not add this estate right now. Nothing was created.' };
  }

  const receipt = firstRpcRow<EstateReceipt>(result.data);
  if (!receipt?.workflow_id) return { status: 'unavailable', message: 'We could not confirm the estate was created. Try again.' };
  revalidatePath('/case');
  if (!receipt.replayed && user.email) await syncD2cEstateUsage(user.email, { estatesCreated: receipt.seat_index }).catch(() => null);
  return { status: 'created', message: receipt.replayed ? 'This estate was already created.' : 'Estate added.' };
}

export type InviteToEstateState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'created';
  message?: string;
  receipt?: { invitedEmail: string; invitePath?: string; replayed: boolean };
};

type InviteReceipt = { invitation_id: string; raw_token: string | null; invitation_expires_at: string; replayed: boolean };

// D2C counterpart to app/director/cases/[workflowId]/family-actions.ts'
// createFamilyInvitation, which gates on resolveOperationalViewer (a
// funeral-home org role) -- a plain D2C case owner has no organization
// membership at all, so that action always denies them. The underlying RPC
// (create_case_family_invitation_idempotent) already authorizes a D2C
// owner via workflows.user_id = auth.uid(); only the frontend/action side
// was missing for this persona.
export async function inviteToEstate(_previous: InviteToEstateState, formData: FormData): Promise<InviteToEstateState> {
  const workflowId = String(formData.get('workflowId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const invitedEmail = String(formData.get('invitedEmail') ?? '').trim().toLowerCase();
  const displayName = String(formData.get('displayName') ?? '').trim();
  const relationship = String(formData.get('relationship') ?? '').trim() || 'Family member';
  const purpose = 'Stay updated on this estate';
  const expiresAt = new Date(Date.now() + 30 * 86400000);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedEmail)) return { status: 'validation', message: 'Enter their email address. Nothing was created.' };
  if (!displayName) return { status: 'validation', message: 'Enter their name. Nothing was created.' };

  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this estate right now. Nothing changed. Try again.' };
  const user = await verifiedUser(client);
  if (!user) return { status: 'denied', message: 'Sign in before inviting someone. Nothing was created.' };

  const result = await client.rpc('create_case_family_invitation_idempotent', {
    p_workflow_id: workflowId,
    p_invited_email: invitedEmail,
    p_display_name: displayName,
    p_relationship: relationship,
    p_purpose: purpose,
    p_expires_at: expiresAt.toISOString(),
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'You do not have authority to invite someone to this estate. Nothing changed.' };
    if (result.error.code === '23505') return { status: 'conflict', message: 'That person already has active access or a pending invitation. Nothing new was created.' };
    if (result.error.code === '22023') return { status: 'validation', message: 'Review their email and name. Nothing was created.' };
    return { status: 'unavailable', message: 'Passage could not create the invitation right now.' };
  }
  const receipt = firstRpcRow<InviteReceipt>(result.data);
  if (!receipt?.invitation_id) return { status: 'unavailable', message: 'Passage did not return a complete invitation. Reload before retrying.' };
  revalidatePath('/case');
  if (!receipt.replayed && user.email) {
    const { count } = await client.from('case_family_invitations').select('id', { count: 'exact', head: true }).eq('invited_by_user_id', user.id);
    if (typeof count === 'number') await syncD2cEstateUsage(user.email, { familyParticipantsAdded: count }).catch(() => null);
  }
  return {
    status: 'created',
    receipt: {
      invitedEmail,
      invitePath: receipt.raw_token ? `/family-invite/${receipt.raw_token}` : undefined,
      replayed: receipt.replayed,
    },
  };
}
