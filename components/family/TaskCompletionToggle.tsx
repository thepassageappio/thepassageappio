'use client';

import { useActionState } from 'react';
import type { TaskCompletionCommandState } from '@/lib/family/task-actions';

const initialState: TaskCompletionCommandState = { status: 'idle' };

// Self-serve (D2C) task checkbox. Only ever rendered when case-view.ts has
// already confirmed this is the workflow owner's own no-organization case
// (see FamilyCommitmentItem.version -- null means "not completable here").
// version/requestId are supplied fresh by the parent Server Component on
// every render, so a remount after a successful toggle (via the form's key
// below) always carries the task's new version for the next action.
export function TaskCompletionToggle({
  workflowId,
  taskId,
  version,
  completed,
  requestId,
  action,
}: {
  workflowId: string;
  taskId: string;
  version: number;
  completed: boolean;
  requestId: string;
  action: (previous: TaskCompletionCommandState, formData: FormData) => Promise<TaskCompletionCommandState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const nextCompleted = !completed;

  return (
    <form action={formAction} key={state.receipt?.taskVersion ?? version}>
      <input name="workflowId" type="hidden" value={workflowId} />
      <input name="taskId" type="hidden" value={taskId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="completed" type="hidden" value={String(nextCompleted)} />
      <button disabled={pending} style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px' }} type="submit">
        {pending ? 'Saving…' : completed ? 'Mark not done' : 'Mark done'}
      </button>
      {state.status !== 'idle' && state.status !== 'saved' && state.message && (
        <p role="alert" style={{ fontSize: 12, marginTop: 4 }}>{state.message}</p>
      )}
    </form>
  );
}
