'use client';

import { useActionState, useEffect, useRef } from 'react';
import { submitPartnerRequestProof, type PartnerCommandState } from '../../actions';
import styles from '../../../proof-loop.module.css';

const initialState: PartnerCommandState = { status: 'idle' };

export function SubmitDeliveryProofForm({ partnerRequestId, requestId, version }: { partnerRequestId: string; requestId: string; version: number }) {
  const [state, action, pending] = useActionState(submitPartnerRequestProof, initialState);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.message) resultRef.current?.focus();
  }, [state]);

  return (
    <form action={action} aria-busy={pending} className={styles.form}>
      <input name="partnerRequestId" type="hidden" value={partnerRequestId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <fieldset disabled={pending}>
        <legend>Submit delivery proof for director review.</legend>
        <label>What was delivered<textarea maxLength={2000} name="proofSummary" required /></label>
        <label>Supporting reference <span>Optional. Use a non-sensitive delivery reference only. Do not enter passwords, access codes, or personal account numbers.</span><input maxLength={240} name="proofReference" /></label>
        <p className={styles.boundary}>This does not mark the request complete. A director authorized for this case reviews it next.</p>
        <button type="submit">{pending ? 'Submitting…' : 'Submit delivery proof'}</button>
      </fieldset>
      {state.message && <div className={state.status === 'saved' ? styles.receipt : styles.error} ref={resultRef} role={state.status === 'saved' ? 'status' : 'alert'} tabIndex={-1}><h3>{state.status === 'saved' ? 'Delivery proof saved.' : 'Nothing changed.'}</h3><p>{state.message}</p>{state.status !== 'saved' && <div className={styles.recoveryActions}><a href={`/partner/requests/${partnerRequestId}`}>Reload current request</a><a href="/partner">Return to requests</a></div>}</div>}
    </form>
  );
}
