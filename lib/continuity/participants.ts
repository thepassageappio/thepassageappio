import 'server-only';

import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

export type ContinuitySpace = {
  id: string;
  display_name: string;
  created_at: string;
};

export type ContinuityParticipant = {
  id: string;
  continuity_space_id: string;
  display_name: string;
  relationship: string;
  purpose: string;
  category_scope: string[];
  status: 'active' | 'revoked';
  accepted_at: string;
  revoked_at: string | null;
  outcome_note?: string | null;
};

export type ParticipantInvitation = {
  id: string;
  continuity_space_id: string;
  invited_email: string;
  display_name: string;
  relationship: string;
  purpose: string;
  category_scope: string[];
  delivery_state: 'not_sent';
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  lifecycle_state: 'available' | 'accepted' | 'declined' | 'revoked' | 'expired';
  outcome_note: string | null;
};

export type FamilyPeopleProjection =
  | { state: 'signed-out' }
  | { state: 'unavailable' }
  | {
      state: 'ready';
      accountEmail: string;
      ownedSpace: ContinuitySpace | null;
      participants: ContinuityParticipant[];
      invitations: ParticipantInvitation[];
    };

export async function loadFamilyPeople(): Promise<FamilyPeopleProjection> {
  const client = await createPassageServerClient();
  if (!client) return { state: 'unavailable' };
  const user = await verifiedUser(client);
  if (!user) return { state: 'signed-out' };

  const spaces = await client.rpc('list_owned_continuity_spaces');
  if (spaces.error) return { state: 'unavailable' };
  const ownedSpace = ((spaces.data ?? [])[0] as ContinuitySpace | undefined) ?? null;
  if (!ownedSpace) {
    return {
      state: 'ready',
      accountEmail: user.email ?? '',
      ownedSpace: null,
      participants: [],
      invitations: [],
    };
  }

  const [participants, invitations] = await Promise.all([
    client.rpc('list_owned_continuity_participant_projection'),
    client.rpc('list_participant_invitation_projection'),
  ]);
  if (participants.error || invitations.error) return { state: 'unavailable' };

  return {
    state: 'ready',
    accountEmail: user.email ?? '',
    ownedSpace,
    participants: (participants.data ?? []) as ContinuityParticipant[],
    invitations: (invitations.data ?? []) as ParticipantInvitation[],
  };
}

export type ParticipantFamilyUpdate = {
  space_name: string;
  participant_name: string;
  relationship: string;
  purpose: string;
  can_see: string[];
  accepted_at: string;
  family_name: string | null;
  person_name: string | null;
  current_step_title: string | null;
  current_step_summary: string | null;
  current_step_owner: string | null;
  current_step_updated_at: string | null;
  latest_update_summary: string | null;
  latest_update_at: string | null;
};

export type ParticipantHomeProjection =
  | { state: 'signed-out' }
  | { state: 'unavailable' }
  | { state: 'closed' }
  | {
      state: 'ready';
      accountEmail: string;
      spaces: ParticipantFamilyUpdate[];
    };

export async function loadParticipantHome(): Promise<ParticipantHomeProjection> {
  const client = await createPassageServerClient();
  if (!client) return { state: 'unavailable' };
  const user = await verifiedUser(client);
  if (!user) return { state: 'signed-out' };

  const [spacesResult, participantsResult, updatesResult] = await Promise.all([
    client.rpc('list_participant_continuity_spaces'),
    client.rpc('list_continuity_participant_projection'),
    client.rpc('list_participant_family_updates'),
  ]);
  if (spacesResult.error || participantsResult.error || updatesResult.error) {
    return { state: 'unavailable' };
  }

  const spaces = (spacesResult.data ?? []) as ContinuitySpace[];
  const participants = (participantsResult.data ?? []) as ContinuityParticipant[];
  const activeUpdateSpaceIds = new Set(
    participants
      .filter((row) => row.status === 'active' && row.category_scope.includes('updates'))
      .map((row) => row.continuity_space_id),
  );
  if (!spaces.some((space) => activeUpdateSpaceIds.has(space.id))) return { state: 'closed' };

  const familyUpdates = (updatesResult.data ?? []) as ParticipantFamilyUpdate[];
  if (familyUpdates.length === 0) return { state: 'closed' };

  return {
    state: 'ready',
    accountEmail: user.email ?? '',
    spaces: familyUpdates,
  };
}
