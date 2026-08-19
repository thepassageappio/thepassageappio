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

type InviteReceipt = { invitation_id: string; raw_token: string | null; invitation_expires_at: string; replayed: boolean };
const PARTICIPANT_ROLES = ['family_member', 'executor', 'poa_medical_proxy', 'clergy_officiant', 'cemetery_crematory_contact'];

// Founder decision 2026-08-19: when a subscriber has more than one estate
// (Couple/Family plan), inviting a participant is one action where the
// owner picks which estate(s) in the household that person can see --
// "owner's choice per invite," not automatic cross-estate sharing and not a
// separate invite per estate. No schema change: this loops the same
// per-estate create_case_family_invitation_idempotent RPC once per selected
// workflow, each with its own stable request id, so a participant checked
// for two estates simply ends up with two independent estate_access rows --
// the existing per-estate revoke/role model still applies to each estate
// individually if the owner later wants to remove access to just one.
export type InviteToHouseholdState = {
  status: 'idle' | 'validation' | 'denied' | 'unavailable' | 'created';
  message?: string;
  results?: { workflowId: string; personLabel: string; status: 'created' | 'replayed' | 'conflict' | 'denied' | 'unavailable'; invitePath?: string }[];
};

export async function inviteToHousehold(_previous: InviteToHouseholdState, formData: FormData): Promise<InviteToHouseholdState> {
  const selectedWorkflowIds = formData.getAll('workflowIds').map(String).filter(Boolean);
  const invitedEmail = String(formData.get('invitedEmail') ?? '').trim().toLowerCase();
  const displayName = String(formData.get('displayName') ?? '').trim();
  const relationship = String(formData.get('relationship') ?? '').trim() || 'Family member';
  const participantRole = String(formData.get('participantRole') ?? 'family_member');
  const purpose = 'Stay updated on this estate';
  const expiresAt = new Date(Date.now() + 30 * 86400000);

  if (selectedWorkflowIds.length === 0) return { status: 'validation', message: 'Choose at least one estate to invite them to. Nothing was created.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedEmail)) return { status: 'validation', message: 'Enter their email address. Nothing was created.' };
  if (!displayName) return { status: 'validation', message: 'Enter their name. Nothing was created.' };
  if (!PARTICIPANT_ROLES.includes(participantRole)) return { status: 'validation', message: 'Choose a valid participant role. Nothing was created.' };

  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open your estates right now. Nothing was created. Try again.' };
  const user = await verifiedUser(client);
  if (!user) return { status: 'denied', message: 'Sign in before inviting someone. Nothing was created.' };

  const results: NonNullable<InviteToHouseholdState['results']> = [];
  let anyCreated = false;
  for (const workflowId of selectedWorkflowIds) {
    const requestId = String(formData.get(`requestId_${workflowId}`) ?? '');
    const personLabel = String(formData.get(`personLabel_${workflowId}`) ?? 'this estate');
    if (!requestId) { results.push({ workflowId, personLabel, status: 'unavailable' }); continue; }

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
      const status = result.error.code === '42501' || result.error.code === '28000' ? 'denied' : result.error.code === '23505' ? 'conflict' : 'unavailable';
      results.push({ workflowId, personLabel, status });
      continue;
    }
    const receipt = firstRpcRow<InviteReceipt>(result.data);
    if (!receipt?.invitation_id) { results.push({ workflowId, personLabel, status: 'unavailable' }); continue; }
    anyCreated = anyCreated || !receipt.replayed;
    results.push({ workflowId, personLabel, status: receipt.replayed ? 'replayed' : 'created', invitePath: receipt.raw_token ? `/family-invite/${receipt.raw_token}` : undefined });
  }

  revalidatePath('/case');
  if (anyCreated && user.email) {
    const { count } = await client.from('case_family_invitations').select('id', { count: 'exact', head: true }).eq('invited_by_user_id', user.id);
    if (typeof count === 'number') await syncD2cEstateUsage(user.email, { familyParticipantsAdded: count }).catch(() => null);
  }
  return { status: 'created', results };
}
