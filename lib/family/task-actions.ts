'use server';

import { revalidatePath } from 'next/cache';
import { firstRpcRow } from '@/lib/auth/invitations';
import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

// Family/D2C self-serve task completion (Phase L.2). Authorization for who
// may complete which task is decided entirely by
// passage_private.set_family_task_completion_idempotent -- it only allows
// the workflow owner acting on a case with no organization involved, so a
// funeral-home-backed case stays read-only for family regardless of what
// this action is called with.
export type TaskCompletionCommandState = {
  status: 'idle' | 'validation' | 'denied' | 'unavailable' | 'saved';
  message?: string;
  receipt?: { taskStatus: string; taskVersion: number; replayed: boolean };
};

type CompletionReceipt = { task_id: string; task_status: string; task_version: number; event_id: string; occurred_at: string; replayed: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function setFamilyTaskCompletion(_previous: TaskCompletionCommandState, formData: FormData): Promise<TaskCompletionCommandState> {
  const workflowId = String(formData.get('workflowId') ?? '');
  const taskId = String(formData.get('taskId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion') ?? '');
  const completed = String(formData.get('completed') ?? '') === 'true';

  if (!uuid.test(workflowId) || !uuid.test(taskId) || !uuid.test(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return { status: 'validation', message: 'This step could not be updated. Reload the page, then try again.' };
  }

  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this case right now. Nothing changed. Try again.' };
  const user = await verifiedUser(client);
  if (!user) return { status: 'denied', message: 'Sign in to update this step.' };

  const result = await client.rpc('set_family_task_completion_idempotent', {
    p_task_id: taskId,
    p_completed: completed,
    p_expected_version: expectedVersion,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'This step is not available to your account. Nothing changed.' };
    if (result.error.code === '40001') return { status: 'validation', message: 'This step changed elsewhere. Reload the page, then try again.' };
    return { status: 'unavailable', message: 'Passage could not update this step. Nothing changed. Try again.' };
  }
  const receipt = firstRpcRow<CompletionReceipt>(result.data);
  if (!receipt?.task_id) return { status: 'unavailable', message: 'We could not confirm this step was updated. Reload before trying again.' };

  revalidatePath(`/case/${workflowId}/tasks`);
  revalidatePath(`/case/${workflowId}/today`);
  return {
    status: 'saved',
    message: receipt.task_status === 'completed' ? 'Marked complete.' : 'Reopened.',
    receipt: { taskStatus: receipt.task_status, taskVersion: receipt.task_version, replayed: receipt.replayed },
  };
}
