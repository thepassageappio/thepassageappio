'use client';

import { useActionState, useState } from 'react';
import { DurableReceipt } from '@/components/operations/DurableReceipt';
import { respondToPartnerRequest, type PartnerCommandState } from './actions';
import styles from '../operations-beta.module.css';

const initialState: PartnerCommandState = { status: 'idle' };

export function RespondToRequestForm({ partnerRequestId, requestId, version }: { partnerRequestId: string; requestId: string; version: number }) {
  const [state, action, pending] = useActionState(respondToPartnerRequest, initialState);
  const [decision, setDecision] = useState<'accept' | 'decline'>('accept');

  return (
    <form action={action} aria-busy={pending} className={styles.commandForm}>
      <input name="partnerRequestId" type="hidden" value={partnerRequestId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <input name="decision" type="hidden" value={decision} />
      <p><strong>Respond to this request.</strong><span>Passage checks that this request still matches what you see before saving.</span></p>
      <div role="radiogroup" aria-label="Decision">
        <label><input checked={decision === 'accept'} disabled={pending} name="decisionChoice" onChange={() => setDecision('accept')} type="radio" /> Accept with a quote</label>
        <label><input checked={decision === 'decline'} disabled={pending} name="decisionChoice" onChange={() => setDecision('decline')} type="radio" /> Decline</label>
      </div>
      {decision === 'accept' ? (
        <>
          <label>Quote amount (USD)<input defaultValue="185.00" disabled={pending} inputMode="decimal" min="0" name="quoteAmountDollars" placeholder="185.00" required step="0.01" type="number" /></label>
          <label>Note to the funeral home <span>Optional</span><textarea disabled={pending} maxLength={2000} name="note" /></label>
        </>
      ) : (
        <label>Reason for declining<textarea disabled={pending} maxLength={500} name="note" required /></label>
      )}
      <button aria-busy={pending} disabled={pending} type="submit">{pending ? 'Saving…' : decision === 'accept' ? 'Save sample quote for Northstar' : 'Decline request'}</button>
      {state.status === 'saved' && state.durable
        ? <DurableReceipt announce receipt={state.durable} />
        : state.message && <div className={styles.commandError} role="alert"><strong>Nothing changed</strong><p>{state.message}</p></div>}
    </form>
  );
}
