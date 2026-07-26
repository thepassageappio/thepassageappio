'use client';

import { useActionState, useEffect, useRef } from 'react';
import { submitTaskProof, type StaffCommandState } from '../../actions';
import styles from '../../../proof-loop.module.css';

const initialState: StaffCommandState = { status: 'idle' };

export function ProofSubmissionForm({ taskId, requestId, version, supersedesProofId }: { taskId: string; requestId: string; version: number; supersedesProofId?: string }) {
  const [state, action, pending] = useActionState(submitTaskProof, initialState);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.message) resultRef.current?.focus();
  }, [state]);

  return (
    <form action={action} aria-busy={pending} className={styles.form}>
      <input name="taskId" type="hidden" value={taskId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <input name="supersedesProofId" type="hidden" value={supersedesProofId ?? ''} />
      <fieldset disabled={pending}>
        <legend>{supersedesProofId ? 'Submit replacement proof.' : 'Submit proof for director review.'}</legend>
        <label>Evidence type<select name="proofType" required defaultValue="confirmation"><option value="confirmation">Confirmation</option><option value="handoff">Completed handoff</option><option value="reference">Reference confirmation</option><option value="completion_note">Completion note</option></select></label>
        <label>What was completed<textarea maxLength={2000} name="completionSummary" required /></label>
        <label>Supporting reference <span>Optional. Use a non-sensitive work reference only. Do not enter passwords, access codes, or personal account numbers.</span><input maxLength={240} name="reference" /></label>
        <p className={styles.boundary}>This does not mark the task complete. A director authorized for this location reviews it next. The current task owner and those directors can see it.</p>
        <button type="submit">{pending ? 'Submitting…' : supersedesProofId ? 'Submit replacement proof' : 'Submit proof for review'}</button>
      </fieldset>
      {state.message && <div className={state.status === 'saved' ? styles.receipt : styles.error} ref={resultRef} role={state.status === 'saved' ? 'status' : 'alert'} tabIndex={-1}><h3>{state.status === 'saved' ? 'Work evidence saved.' : 'Nothing changed.'}</h3><p>{state.message}</p>{state.receipt && <small>Saved {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(state.receipt.occurredAt))} · the current task owner and directors authorized for this location can see it · saved in this task’s proof history · next: director review</small>}{state.status !== 'saved' && <div className={styles.recoveryActions}><a href={`/staff/work/${taskId}`}>Reload current task</a><a href="/staff">Return to My work</a></div>}</div>}
    </form>
  );
}
