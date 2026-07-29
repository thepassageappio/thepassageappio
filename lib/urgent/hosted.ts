import type { SupabaseClient } from '@supabase/supabase-js';

export type UrgentIntakeRequest = {
  id: string;
  situation_category: string;
  person_name: string;
  person_location: string;
  person_timing: string | null;
  coordinator_name: string;
  coordinator_phone: string | null;
  coordinator_email: string | null;
  callback_notes: string | null;
  wants_callback: boolean;
  status: string;
  version: number;
  receiving_organization_id: string;
  claimed_organization_id: string | null;
  workflow_id: string | null;
  submitted_at: string;
  claimed_at: string | null;
  case_created_at: string | null;
};

const SELECT_COLUMNS = 'id, situation_category, person_name, person_location, person_timing, coordinator_name, coordinator_phone, coordinator_email, callback_notes, wants_callback, status, version, receiving_organization_id, claimed_organization_id, workflow_id, submitted_at, claimed_at, case_created_at';

export async function loadUrgentIntakeQueue(client: SupabaseClient, organizationId: string): Promise<{ unclaimed: UrgentIntakeRequest[]; mine: UrgentIntakeRequest[] } | null> {
  const unclaimedResult = await client.from('urgent_intake_requests').select(SELECT_COLUMNS).eq('receiving_organization_id', organizationId).eq('wants_callback', true).eq('status', 'submitted').order('submitted_at', { ascending: true });
  if (unclaimedResult.error) return null;
  const mineResult = await client.from('urgent_intake_requests').select(SELECT_COLUMNS).eq('receiving_organization_id', organizationId).eq('wants_callback', true).eq('claimed_organization_id', organizationId).order('submitted_at', { ascending: false });
  if (mineResult.error) return null;
  return { unclaimed: (unclaimedResult.data ?? []) as UrgentIntakeRequest[], mine: (mineResult.data ?? []) as UrgentIntakeRequest[] };
}

export async function loadUrgentIntakeRequest(client: SupabaseClient, id: string, organizationId: string): Promise<UrgentIntakeRequest | null> {
  const result = await client.from('urgent_intake_requests').select(SELECT_COLUMNS).eq('id', id).eq('receiving_organization_id', organizationId).eq('wants_callback', true).neq('status', 'self_handling').maybeSingle();
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
