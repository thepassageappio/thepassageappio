'use client';

import { type FormEvent, useActionState, useEffect, useId, useRef, useState } from 'react';
import { reviewTaskProof, type DirectorCommandState } from '../../actions';
import styles from '../../../proof-loop.module.css';

const initialState: DirectorCommandState = { status: 'idle' };

function Result({ state, nextAction, reloadHref }: { state: DirectorCommandState; nextAction: string; reloadHref: string }) {
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.message) resultRef.current?.focus();
  }, [state]);

  if (!state.message) return null;
  return <div className={state.status === 'saved' ? styles.receipt : styles.error} ref={resultRef} role={state.status === 'saved' ? 'status' : 'alert'} tabIndex={-1}><h3>{state.status === 'saved' ? 'Director decision saved.' : 'Nothing changed.'}</h3><p>{state.message}</p>{state.receipt && <small>Saved {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(state.receipt.occurredAt))} · the current task owner and directors authorized for this location can see it · saved in proof history · next: {nextAction}</small>}{state.status !== 'saved' && <div className={styles.recoveryActions}><a href={reloadHref}>Reload current task</a><a href="/director">Return to Today</a></div>}</div>;
}

export function ProofReviewForms({ proofId, taskId, workflowId, version, verifyRequestId, replacementRequestId }: { proofId: string; taskId: string; workflowId: string; version: number; verifyRequestId: string; replacementRequestId: string }) {
  const [verifyState, verifyAction, verifying] = useActionState(reviewTaskProof, initialState);
  const [replacementState, replacementAction, replacing] = useActionState(reviewTaskProof, initialState);
  const [replacementOpen, setReplacementOpen] = useState(false);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const replacementPanelId = useId();
  const replacementReasonErrorId = useId();
  const replacementTriggerRef = useRef<HTMLButtonElement>(null);
  const replacementReasonRef = useRef<HTMLTextAreaElement>(null);
  const reloadHref = `/director/cases/${workflowId}?task=${taskId}`;

  function closeReplacement() {
    setReplacementOpen(false);
    setReasonError(null);
    requestAnimationFrame(() => replacementTriggerRef.current?.focus());
  }

  function validateReplacement(event: FormEvent<HTMLFormElement>) {
    const reason = replacementReasonRef.current?.value.trim() ?? '';
    if (reason) {
      setReasonError(null);
      return;
    }
    event.preventDefault();
    setReasonError('Explain what the task owner needs to replace. Nothing was changed.');
    requestAnimationFrame(() => replacementReasonRef.current?.focus());
  }

  return <div>
    <div className={styles.actions}>
      <form action={verifyAction} aria-busy={verifying} className={styles.form}>
        <input name="proofId" type="hidden" value={proofId} /><input name="workflowId" type="hidden" value={workflowId} /><input name="expectedVersion" type="hidden" value={version} /><input name="decision" type="hidden" value="verified" /><input name="reason" type="hidden" value="" /><input name="requestId" type="hidden" value={verifyRequestId} />
        <p className={styles.boundary}>The task will be marked complete and the verification will remain in history.</p>
        <button disabled={verifying || replacing} type="submit">{verifying ? 'Verifying…' : 'Verify proof'}</button>
      </form>
      <div className={styles.form}>
        <p className={styles.boundary}>The task returns to in progress. The submitted proof remains in history.</p>
        <button aria-controls={replacementPanelId} aria-expanded={replacementOpen} className={styles.secondary} disabled={verifying || replacing} onClick={() => setReplacementOpen((open) => !open)} ref={replacementTriggerRef} type="button">Request replacement</button>
      </div>
    </div>
    <Result nextAction="no further action; the task is complete" reloadHref={reloadHref} state={verifyState} />
    {replacementOpen && <form action={replacementAction} aria-busy={replacing} className={styles.form} id={replacementPanelId} noValidate onSubmit={validateReplacement}>
      <input name="proofId" type="hidden" value={proofId} /><input name="workflowId" type="hidden" value={workflowId} /><input name="expectedVersion" type="hidden" value={version} /><input name="decision" type="hidden" value="needs_replacement" /><input name="requestId" type="hidden" value={replacementRequestId} />
      <fieldset disabled={replacing}><legend>Explain what must be replaced.</legend><label>Replacement reason<textarea aria-describedby={reasonError ? replacementReasonErrorId : undefined} aria-invalid={Boolean(reasonError)} maxLength={500} name="reason" onChange={(event) => { if (event.currentTarget.value.trim()) setReasonError(null); }} ref={replacementReasonRef} required /></label>{reasonError && <p className={styles.fieldError} id={replacementReasonErrorId}>{reasonError}</p>}<div className={styles.formActions}><button type="submit">{replacing ? 'Sending request…' : 'Send replacement request'}</button><button className={styles.secondary} onClick={closeReplacement} type="button">Cancel</button></div></fieldset>
      <Result nextAction="the current owner submits replacement proof" reloadHref={reloadHref} state={replacementState} />
    </form>}
  </div>;
}
