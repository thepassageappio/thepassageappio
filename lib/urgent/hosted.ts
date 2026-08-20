import type { SupabaseClient } from '@supabase/supabase-js';

export type UrgentIntakeRequest = {
  id: string;
  situation_category: string;
  person_name: string;
  person_location: string;
  person_city: string | null;
  person_state: string | null;
  person_timing: string | null;
  coordinator_name: string;
  coordinator_phone: string | null;
  coordinator_email: string | null;
  callback_notes: string | null;
  wants_callback: boolean;
  status: string;
  version: number;
  claimed_organization_id: string | null;
  workflow_id: string | null;
  submitted_at: string;
  claimed_at: string | null;
  case_created_at: string | null;
};

const SELECT_COLUMNS = 'id, situation_category, person_name, person_location, person_city, person_state, person_timing, coordinator_name, coordinator_phone, coordinator_email, callback_notes, wants_callback, status, version, claimed_organization_id, workflow_id, submitted_at, claimed_at, case_created_at';

// "Matching" today is honest about what data actually exists: intake only
// ever collects a city/state (no street address, no geocoding), so this is
// same-state / same-city sorting, not a real distance radius. Still real
// value over the previous fully-global, unordered queue -- a director no
// longer has to read every row's location text to find the ones near them.
export type UrgentProximity = 'same-city' | 'same-state' | 'other';

function proximityFor(request: Pick<UrgentIntakeRequest, 'person_city' | 'person_state'>, orgCities: Set<string>, orgStates: Set<string>): UrgentProximity {
  const city = request.person_city?.trim().toLowerCase();
  const state = request.person_state?.trim().toUpperCase();
  if (city && orgCities.has(city)) return 'same-city';
  if (state && orgStates.has(state)) return 'same-state';
  return 'other';
}

const PROXIMITY_RANK: Record<UrgentProximity, number> = { 'same-city': 0, 'same-state': 1, other: 2 };

export async function loadUrgentIntakeQueue(client: SupabaseClient, organizationId: string): Promise<{ unclaimed: (UrgentIntakeRequest & { proximity: UrgentProximity })[]; mine: UrgentIntakeRequest[] } | null> {
  const [unclaimedResult, mineResult, locationsResult] = await Promise.all([
    client.from('urgent_intake_requests').select(SELECT_COLUMNS).eq('status', 'submitted').order('submitted_at', { ascending: true }),
    client.from('urgent_intake_requests').select(SELECT_COLUMNS).eq('claimed_organization_id', organizationId).order('submitted_at', { ascending: false }),
    client.from('organization_locations').select('city, state').eq('organization_id', organizationId).eq('status', 'active'),
  ]);
  if (unclaimedResult.error) return null;
  if (mineResult.error) return null;
  const orgLocations = (locationsResult.data ?? []) as { city: string | null; state: string | null }[];
  const orgCities = new Set(orgLocations.map((location) => location.city?.trim().toLowerCase()).filter((city): city is string => Boolean(city)));
  const orgStates = new Set(orgLocations.map((location) => location.state?.trim().toUpperCase()).filter((state): state is string => Boolean(state)));

  const unclaimed = ((unclaimedResult.data ?? []) as UrgentIntakeRequest[])
    .map((request) => ({ ...request, proximity: proximityFor(request, orgCities, orgStates) }))
    .sort((a, b) => PROXIMITY_RANK[a.proximity] - PROXIMITY_RANK[b.proximity] || new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

  return { unclaimed, mine: (mineResult.data ?? []) as UrgentIntakeRequest[] };
}

export function humanProximity(proximity: UrgentProximity): string {
  if (proximity === 'same-city') return 'Same city';
  if (proximity === 'same-state') return 'Same state';
  return 'Location not confirmed nearby';
}

export async function loadUrgentIntakeRequest(client: SupabaseClient, id: string): Promise<UrgentIntakeRequest | null> {
  const result = await client.from('urgent_intake_requests').select(SELECT_COLUMNS).eq('id', id).maybeSingle();
  if (result.error || !result.data) return null;
  return result.data as UrgentIntakeRequest;
}

export function humanUrgentStatus(status: string): string {
  switch (status) {
    case 'submitted': return 'Waiting to be claimed';
    case 'self_handling': return 'No callback requested';
    case 'claimed': return 'Claimed — case not started yet';
    case 'case_created': return 'Case created';
    default: return 'Status unavailable';
  }
}
