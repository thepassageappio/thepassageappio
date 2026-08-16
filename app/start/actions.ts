'use server';

import { revalidatePath } from 'next/cache';
import { verifiedUser } from '@/lib/auth/session';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createPassageServerClient } from '@/lib/supabase/server';
import { PREVIEW_RECEIVING_ORGANIZATION, type SituationCategory } from '@/lib/urgent/situations';

export type UrgentCommandState = {
  status: 'idle' | 'saved' | 'validation' | 'denied' | 'unavailable' | 'conflict';
  message?: string;
  receipt?: { occurredAt: string; replayed: boolean; wantsCallback: boolean };
};

type SubmitReceipt = { urgent_intake_request_id: string; status: string; version: number; replayed: boolean };

const SITUATIONS: SituationCategory[] = ['home_unexpected', 'hospice', 'hospital', 'care_facility', 'already_handled', 'other'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function submitUrgentIntake(_previous: UrgentCommandState, formData: FormData): Promise<UrgentCommandState> {
  const situationCategory = String(formData.get('situationCategory') ?? '');
  const receivingOrganizationId = String(formData.get('receivingOrganizationId') ?? '');
  const personName = String(formData.get('personName') ?? '').trim();
  const personLocation = String(formData.get('personLocation') ?? '').trim();
  const personTiming = String(formData.get('personTiming') ?? '').trim();
  const coordinatorName = String(formData.get('coordinatorName') ?? '').trim();
  const coordinatorPhone = String(formData.get('coordinatorPhone') ?? '').trim();
  const coordinatorEmail = String(formData.get('coordinatorEmail') ?? '').trim();
  const callbackNotes = String(formData.get('callbackNotes') ?? '').trim();
  const wantsCallback = String(formData.get('wantsCallback') ?? '') === 'true';
  const requestId = String(formData.get('requestId') ?? '');

  if (receivingOrganizationId !== PREVIEW_RECEIVING_ORGANIZATION.id) {
    return { status: 'validation', message: 'We could not confirm where to send this. Nothing was saved. Reload and try again.' };
  }
  if (!SITUATIONS.includes(situationCategory as SituationCategory)
    || personName.length < 1 || personName.length > 200
    || personLocation.length < 1 || personLocation.length > 300
    || coordinatorName.length < 1 || coordinatorName.length > 200
    || (!coordinatorPhone && !coordinatorEmail)
    || !uuid.test(requestId)) {
    return { status: 'validation', message: 'A few details are missing. Nothing was sent — go back and check each step.' };
  }

  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'Passage could not save this right now. Nothing changed — try again in a moment.' };
  const user = await verifiedUser(client);
  if (!user) return { status: 'denied', message: 'Sign in or create a free account to save this and request a callback.' };

  const result = await client.rpc('submit_urgent_intake_idempotent', {
    p_receiving_organization_id: receivingOrganizationId,
    p_situation_category: situationCategory,
    p_person_name: personName,
    p_person_location: personLocation,
    p_person_timing: personTiming || null,
    p_coordinator_name: coordinatorName,
    p_coordinator_phone: coordinatorPhone || null,
    p_coordinator_email: coordinatorEmail || null,
    p_callback_notes: callbackNotes || null,
    p_wants_callback: wantsCallback,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '28000') return { status: 'denied', message: 'Sign in or create a free account to save this and request a callback.' };
    if (result.error.code === '22023') return { status: 'conflict', message: 'This request is different from what was already saved. Reload to check the saved request before trying again.' };
    return { status: 'unavailable', message: 'We could not confirm whether this was saved. Reload and check before trying again.' };
  }
  const receipt = firstRpcRow<SubmitReceipt>(result.data);
  if (!receipt?.urgent_intake_request_id) {
    return { status: 'unavailable', message: 'We could not confirm whether this was saved. Reload and check before trying again.' };
  }

  const savedEvent = await client
    .from('urgent_intake_events')
    .select('occurred_at')
    .eq('urgent_intake_request_id', receipt.urgent_intake_request_id)
    .eq('idempotency_key', `urgent_intake_create:${requestId}`)
    .maybeSingle();
  if (savedEvent.error || !savedEvent.data?.occurred_at) {
    return { status: 'unavailable', message: 'This may have been saved, but Passage could not confirm when. Reload and check before trying again.' };
  }

  revalidatePath('/director/urgent');
  return {
    status: 'saved',
    message: wantsCallback ? 'Sent to Passage. A team member will reach out shortly.' : 'Saved privately.',
    receipt: { occurredAt: String(savedEvent.data.occurred_at), replayed: receipt.replayed, wantsCallback },
  };
}
