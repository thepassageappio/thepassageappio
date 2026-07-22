'use client';

import { useActionState } from 'react';
import { startTask, type StaffCommandState } from './actions';
import styles from '../operations-beta.module.css';

const initialStaffCommandState: StaffCommandState = { status: 'idle' };

export function StartTaskForm({ taskId, requestId, version }: { taskId: string; requestId: string; version: number }) {
  const [state, action, pending] = useActionState(startTask, initialStaffCommandState);
  return (
    <form action={action} aria-busy={pending} className={styles.startForm}>
      <input name="taskId" type="hidden" value={taskId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <button aria-busy={pending} disabled={pending} type="submit">{pending ? 'Starting work…' : 'Start work'}</button>
      <p>Passage checks that this task is still assigned to you before saving.</p>
      {state.message && <div className={state.status === 'saved' ? styles.commandReceipt : styles.commandError} role={state.status === 'saved' ? 'status' : 'alert'}><strong>{state.status === 'saved' ? 'Work started' : 'Nothing changed'}</strong><p>{state.message}</p>{state.receipt && <small>Saved {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(state.receipt.occurredAt))} · visible to the authorized case team · next: complete the work and save proof</small>}</div>}
    </form>
  );
}
