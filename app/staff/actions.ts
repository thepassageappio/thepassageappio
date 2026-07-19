'use server';

import { revalidatePath } from 'next/cache';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createPassageServerClient } from '@/lib/supabase/server';

export type StaffCommandState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'saved';
  message?: string;
  receipt?: { occurredAt: string; replayed: boolean };
};

type StartReceipt = { event_id: string; occurred_at: string; replayed: boolean };
type ProofReceipt = { proof_id: string; event_id: string; occurred_at: string; replayed: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function startTask(_previous: StaffCommandState, formData: FormData): Promise<StaffCommandState> {
  const taskId = String(formData.get('taskId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));
  if (!uuid.test(taskId) || !uuid.test(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return { status: 'validation', message: 'This work changed before the action was ready. Reload My work.' };
  }
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || viewer.viewer.role !== 'staff') return { status: 'denied', message: 'This task is not available to your account. Ask a director to confirm your assignment.' };
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this task right now. Nothing changed. Try again.' };
  const result = await client.rpc('start_task_idempotent', { p_task_id: taskId, p_expected_version: expectedVersion, p_request_id: requestId });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'This work is not available to your account. Nothing changed.' };
    if (result.error.code === '40001') return { status: 'conflict', message: 'This work changed before your action was saved. No change was made. Reload My work.' };
    if (result.error.code === '55000') return { status: 'conflict', message: 'This work is no longer waiting to be started. Reload My work.' };
    return { status: 'unavailable', message: 'Passage could not start this work. Nothing is shown as changed.' };
  }
  const receipt = firstRpcRow<StartReceipt>(result.data);
  if (!receipt?.event_id || !receipt.occurred_at) return { status: 'unavailable', message: 'We could not confirm that the work started. Reload My work before trying again.' };
  revalidatePath('/staff');
  revalidatePath('/director');
  revalidatePath('/director/activity');
  return { status: 'saved', message: receipt.replayed ? 'This work was already started. The original saved time is shown below.' : 'Work started and was saved in team activity.', receipt: { occurredAt: receipt.occurred_at, replayed: receipt.replayed } };
}

export async function submitTaskProof(_previous: StaffCommandState, formData: FormData): Promise<StaffCommandState> {
  const taskId = String(formData.get('taskId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));
  const proofType = String(formData.get('proofType') ?? '');
  const completionSummary = String(formData.get('completionSummary') ?? '').trim();
  const reference = String(formData.get('reference') ?? '').trim();
  const supersedesProofId = String(formData.get('supersedesProofId') ?? '');
  if (!uuid.test(taskId) || !uuid.test(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1
    || !['confirmation', 'handoff', 'reference', 'completion_note'].includes(proofType)
    || completionSummary.length < 1 || completionSummary.length > 2000
    || reference.length > 240 || (supersedesProofId && !uuid.test(supersedesProofId))) {
    return { status: 'validation', message: 'Review the proof fields and reload if this task changed. Nothing changed.' };
  }
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || viewer.viewer.role !== 'staff') return { status: 'denied', message: 'This work is not available to your account. Nothing changed.' };
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open the proof step right now. Nothing changed. Try again.' };
  const result = await client.rpc('submit_task_proof_idempotent', {
    p_task_id: taskId,
    p_expected_task_version: expectedVersion,
    p_proof_type: proofType,
    p_completion_summary: completionSummary,
    p_reference: reference || null,
    p_supersedes_proof_id: supersedesProofId || null,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'You no longer have access to this work. Nothing changed.' };
    if (result.error.code === '40001') return { status: 'conflict', message: 'This task changed since you opened it. Nothing changed. Reload current task.' };
    if (result.error.code === '22023' || result.error.code === '55000') return { status: 'conflict', message: 'This proof request no longer matches the current task. Nothing changed. Reload current task.' };
    return { status: 'unavailable', message: 'We could not save this proof. Nothing changed. Try again.' };
  }
  const receipt = firstRpcRow<ProofReceipt>(result.data);
  if (!receipt?.proof_id || !receipt.event_id || !receipt.occurred_at) return { status: 'unavailable', message: 'We could not confirm that your proof was saved. Reload the task before trying again.' };
  revalidatePath('/staff');
  revalidatePath(`/staff/work/${taskId}`);
  revalidatePath('/director');
  revalidatePath('/director/activity');
  return {
    status: 'saved',
    message: receipt.replayed ? 'Already recorded. The original proof receipt was returned.' : 'Proof submitted for director review.',
    receipt: { occurredAt: receipt.occurred_at, replayed: receipt.replayed },
  };
}
