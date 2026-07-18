'use server';

import { revalidatePath } from 'next/cache';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createPassageServerClient } from '@/lib/supabase/server';

export type StaffCommandState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'saved';
  message?: string;
  receipt?: { eventId: string; occurredAt: string; replayed: boolean };
};

type StartReceipt = { event_id: string; occurred_at: string; replayed: boolean };
export const initialStaffCommandState: StaffCommandState = { status: 'idle' };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function startTask(_previous: StaffCommandState, formData: FormData): Promise<StaffCommandState> {
  const taskId = String(formData.get('taskId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));
  if (!uuid.test(taskId) || !uuid.test(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return { status: 'validation', message: 'This work changed before the action was ready. Reload My work.' };
  }
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || viewer.viewer.role !== 'staff') return { status: 'denied', message: 'Assigned staff authority is required. Nothing changed.' };
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'Passage could not verify the work service. Nothing changed.' };
  const result = await client.rpc('start_task_idempotent', { p_task_id: taskId, p_expected_version: expectedVersion, p_request_id: requestId });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'This work is not available to your account. Nothing changed.' };
    if (result.error.code === '40001') return { status: 'conflict', message: 'This work changed before your action was saved. No change was made. Reload My work.' };
    if (result.error.code === '55000') return { status: 'conflict', message: 'This work is no longer waiting to be started. Reload My work.' };
    return { status: 'unavailable', message: 'Passage could not start this work. Nothing is shown as changed.' };
  }
  const receipt = firstRpcRow<StartReceipt>(result.data);
  if (!receipt?.event_id || !receipt.occurred_at) return { status: 'unavailable', message: 'Passage did not return a complete work receipt. Reload before retrying.' };
  revalidatePath('/staff');
  revalidatePath('/director');
  revalidatePath('/director/activity');
  return { status: 'saved', message: receipt.replayed ? 'The original start receipt was returned. No duplicate activity was created.' : 'Work started. The server activity receipt is ready.', receipt: { eventId: receipt.event_id, occurredAt: receipt.occurred_at, replayed: receipt.replayed } };
}
