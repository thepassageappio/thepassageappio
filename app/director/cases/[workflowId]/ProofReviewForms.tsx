'use client';

import { useActionState, useId, useState } from 'react';
import { reviewTaskProof, type DirectorCommandState } from '../../actions';
import styles from '../../../proof-loop.module.css';

const initialState: DirectorCommandState = { status: 'idle' };

function Result({ state, nextAction }: { state: DirectorCommandState; nextAction: string }) {
  if (!state.message) return null;
  return <div className={state.status === 'saved' ? styles.receipt : styles.error} role={state.status === 'saved' ? 'status' : 'alert'} tabIndex={-1}><h3>{state.status === 'saved' ? 'Review saved.' : 'Nothing changed.'}</h3><p>{state.message}</p>{state.receipt && <small>Saved {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(state.receipt.occurredAt))} · visible to the authorized case team · saved in proof history · next: {nextAction}</small>}</div>;
}

export function ProofReviewForms({ proofId, workflowId, version, verifyRequestId, replacementRequestId }: { proofId: string; workflowId: string; version: number; verifyRequestId: string; replacementRequestId: string }) {
  const [verifyState, verifyAction, verifying] = useActionState(reviewTaskProof, initialState);
  const [replacementState, replacementAction, replacing] = useActionState(reviewTaskProof, initialState);
  const [replacementOpen, setReplacementOpen] = useState(false);
  const replacementPanelId = useId();
  return <div>
    <div className={styles.actions}>
      <form action={verifyAction} aria-busy={verifying} className={styles.form}>
        <input name="proofId" type="hidden" value={proofId} /><input name="workflowId" type="hidden" value={workflowId} /><input name="expectedVersion" type="hidden" value={version} /><input name="decision" type="hidden" value="verified" /><input name="reason" type="hidden" value="" /><input name="requestId" type="hidden" value={verifyRequestId} />
        <p className={styles.boundary}>The task will be marked complete and the verification will remain in history.</p>
        <button disabled={verifying || replacing} type="submit">{verifying ? 'Verifying…' : 'Verify proof'}</button>
      </form>
      <div className={styles.form}>
        <p className={styles.boundary}>The task returns to in progress. The submitted proof remains in history.</p>
        <button aria-controls={replacementPanelId} aria-expanded={replacementOpen} className={styles.secondary} disabled={verifying || replacing} onClick={() => setReplacementOpen(true)} type="button">Request replacement</button>
      </div>
    </div>
    <Result nextAction="no further action; the task is complete" state={verifyState} />
    {replacementOpen && <form action={replacementAction} aria-busy={replacing} className={styles.form} id={replacementPanelId}>
      <input name="proofId" type="hidden" value={proofId} /><input name="workflowId" type="hidden" value={workflowId} /><input name="expectedVersion" type="hidden" value={version} /><input name="decision" type="hidden" value="needs_replacement" /><input name="requestId" type="hidden" value={replacementRequestId} />
      <fieldset disabled={replacing}><legend>Explain what must be replaced.</legend><label>Replacement reason<textarea maxLength={500} name="reason" required /></label><button type="submit">{replacing ? 'Sending request…' : 'Send replacement request'}</button></fieldset>
      <Result nextAction="the current owner submits replacement proof" state={replacementState} />
    </form>}
  </div>;
}
