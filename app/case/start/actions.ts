'use server';

import { redirect } from 'next/navigation';
import { firstRpcRow } from '@/lib/auth/invitations';
import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

export type StartFamilyRecordState = {
  status: 'idle' | 'validation' | 'denied' | 'unavailable';
  message?: string;
};

type RpcReceipt = { workflow_id: string; replayed: boolean };

function failure(status: StartFamilyRecordState['status'], message: string): StartFamilyRecordState {
  return { status, message };
}

// Fallback for a signed-in, actively-subscribed user who somehow doesn't
// have a family record yet -- the normal path is fully automatic
// (provisionD2cFamilyRecordIfNeeded in the Stripe webhook), this covers a
// legacy subscriber from before that existed, or a rare webhook hiccup.
export async function startFamilyRecord(_previous: StartFamilyRecordState, formData: FormData): Promise<StartFamilyRecordState> {
  const personName = String(formData.get('personName') ?? '').trim();
  const relationship = String(formData.get('relationship') ?? '').trim();

  if (!personName || personName.length > 200) return failure('validation', 'Enter a name. Nothing was created.');

  const client = await createPassageServerClient();
  if (!client) return failure('unavailable', 'Passage could not verify sign-in right now. Nothing was created.');
  const user = await verifiedUser(client);
  if (!user) return failure('denied', 'Sign in before starting your family record. Nothing was created.');

  const result = await client.rpc('self_serve_create_family_record', {
    p_person_name: personName,
    p_relationship_to_deceased: relationship || null,
  });

  if (result.error) {
    if (result.error.code === '28000') return failure('denied', 'Sign in before starting your family record. Nothing was created.');
    if (result.error.code === '42501') return failure('denied', 'An active plan is required. Choose a plan to continue.');
    if (result.error.code === '22023') return failure('validation', 'Enter a valid name. Nothing was created.');
    return failure('unavailable', 'Passage could not start your family record right now. Nothing was created.');
  }

  const receipt = firstRpcRow<RpcReceipt>(result.data);
  if (!receipt?.workflow_id) return failure('unavailable', 'We could not confirm your family record was created. Try again.');
  redirect(`/case/${receipt.workflow_id}/today`);
}
