'use client';

import { useActionState } from 'react';
import { submitTaskProof, type StaffCommandState } from '../../actions';
import styles from '../../../proof-loop.module.css';

const initialState: StaffCommandState = { status: 'idle' };

export function ProofSubmissionForm({ taskId, requestId, version, supersedesProofId }: { taskId: string; requestId: string; version: number; supersedesProofId?: string }) {
  const [state, action, pending] = useActionState(submitTaskProof, initialState);
  return (
    <form action={action} aria-busy={pending} className={styles.form}>
      <input name="taskId" type="hidden" value={taskId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <input name="supersedesProofId" type="hidden" value={supersedesProofId ?? ''} />
      <fieldset disabled={pending}>
        <legend>{supersedesProofId ? 'Submit replacement proof.' : 'Submit proof for director review.'}</legend>
        <label>Proof type<select name="proofType" required defaultValue="confirmation"><option value="confirmation">Confirmation</option><option value="handoff">Completed handoff</option><option value="reference">Work reference</option><option value="completion_note">Completion note</option></select></label>
        <label>What was completed<textarea maxLength={2000} name="completionSummary" required /></label>
        <label>Reference <span>Optional. Use a non-sensitive work reference only. Do not enter passwords, access codes, or personal account numbers.</span><input maxLength={240} name="reference" /></label>
        <p className={styles.boundary}>This does not mark the task complete. An authorized director reviews it next. Visible to the authorized case team only.</p>
        <button type="submit">{pending ? 'Submitting…' : supersedesProofId ? 'Submit replacement proof' : 'Submit proof for review'}</button>
      </fieldset>
      {state.message && <div className={state.status === 'saved' ? styles.receipt : styles.error} role={state.status === 'saved' ? 'status' : 'alert'} tabIndex={-1}><h3>{state.status === 'saved' ? 'Proof saved.' : 'Nothing changed.'}</h3><p>{state.message}</p>{state.receipt && <small>Saved {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(state.receipt.occurredAt))} · visible to the authorized case team · saved in this task’s proof history · next: director review</small>}</div>}
    </form>
  );
}
