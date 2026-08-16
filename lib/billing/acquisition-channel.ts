import type { SupabaseClient } from '@supabase/supabase-js';
import type { AcquisitionChannel } from '@/lib/hubspot';

export type AcquisitionResult = { channel: AcquisitionChannel; referringOrganizationName: string | null };

// Answers "did this paying user first show up on Passage as a family member
// invited onto a funeral home's case?" -- checked at the moment they pay, not
// at invite-acceptance time, since only a fraction of participants ever
// convert to their own subscription. Only checks case_family_invitations
// (this session's real, live invitation path); the older public.people
// table models the same concept but is empty and disconnected from any
// current route, so it is deliberately not consulted here.
export async function resolveAcquisitionChannel(service: SupabaseClient, userId: string): Promise<AcquisitionResult> {
  const { data } = await service
    .from('case_family_invitations')
    .select('workflow_id, accepted_at, workflows:workflow_id(organization_id, organizations:organization_id(name))')
    .eq('accepted_by_user_id', userId)
    .not('accepted_at', 'is', null)
    .order('accepted_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const organizationName = (data as { workflows?: { organizations?: { name?: string } | null } | null } | null)
    ?.workflows?.organizations?.name ?? null;

  if (organizationName) return { channel: 'funeral_home_referral', referringOrganizationName: organizationName };
  return { channel: 'organic_direct', referringOrganizationName: null };
}
