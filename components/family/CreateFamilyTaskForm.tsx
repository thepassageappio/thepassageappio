'use client';

import { useActionState } from 'react';
import { createFamilyTask, type TaskCreationCommandState } from '@/lib/family/task-actions';

const initialState: TaskCreationCommandState = { status: 'idle' };
const CATEGORIES = ['legal', 'service', 'notifications', 'property', 'personal', 'medical', 'memorial', 'logistics', 'digital', 'financial', 'government', 'other'];

export function CreateFamilyTaskForm({ workflowId, requestId }: { workflowId: string; requestId: string }) {
  const [state, action, pending] = useActionState(createFamilyTask, initialState);
  return (
    <form action={action} aria-busy={pending} key={state.status === 'saved' ? requestId : undefined}>
      <input name="workflowId" type="hidden" value={workflowId} />
      <input name="requestId" type="hidden" value={requestId} />
      <label>What needs to be done<input maxLength={200} name="title" placeholder="e.g. Contact the bank" required /></label>
      <label>Category<select defaultValue="personal" name="category">
        {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
      </select></label>
      <button disabled={pending} type="submit">{pending ? 'Adding…' : 'Add step'}</button>
      {state.message && <p role={state.status === 'saved' ? 'status' : 'alert'} style={{ fontSize: 12, marginTop: 4 }}>{state.message}</p>}
    </form>
  );
}
