'use client';

import { useActionState } from 'react';
import { setTaskBlocked, type StaffCommandState } from '../../actions';
import styles from '../../../operations-beta.module.css';

const initialStaffCommandState: StaffCommandState = { status: 'idle' };

export function BlockTaskForm({ taskId, requestId, version }: { taskId: string; requestId: string; version: number }) {
  const [state, action, pending] = useActionState(setTaskBlocked, initialStaffCommandState);
  return (
    <form action={action} aria-busy={pending} className={styles.startForm}>
      <input name="taskId" type="hidden" value={taskId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <input name="blocked" type="hidden" value="true" />
      <label htmlFor={`block-reason-${taskId}`}>What&apos;s blocking this work?</label>
      <textarea id={`block-reason-${taskId}`} maxLength={500} name="reason" placeholder="Waiting on a callback, missing information, etc." required rows={3} />
      <button aria-busy={pending} disabled={pending} type="submit">{pending ? 'Reporting…' : 'Report a blocker'}</button>
      <p>You can clear this yourself once it&apos;s resolved. Your director will see it in team activity.</p>
      {state.message && <div className={state.status === 'saved' ? styles.commandReceipt : styles.commandError} role={state.status === 'saved' ? 'status' : 'alert'}><strong>{state.status === 'saved' ? 'Blocker reported' : 'Nothing changed'}</strong><p>{state.message}</p></div>}
    </form>
  );
}

export function UnblockTaskForm({ taskId, requestId, version }: { taskId: string; requestId: string; version: number }) {
  const [state, action, pending] = useActionState(setTaskBlocked, initialStaffCommandState);
  return (
    <form action={action} aria-busy={pending} className={styles.startForm}>
      <input name="taskId" type="hidden" value={taskId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <input name="blocked" type="hidden" value="false" />
      <button aria-busy={pending} disabled={pending} type="submit">{pending ? 'Resuming…' : 'Clear blocker, resume work'}</button>
      {state.message && <div className={state.status === 'saved' ? styles.commandReceipt : styles.commandError} role={state.status === 'saved' ? 'status' : 'alert'}><strong>{state.status === 'saved' ? 'Blocker cleared' : 'Nothing changed'}</strong><p>{state.message}</p></div>}
    </form>
  );
}
