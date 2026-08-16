'use client';

import { useActionState } from 'react';
import { createPartnerRequest, verifyPartnerRequest } from './partner-actions';
import type { PartnerCommandState } from '@/app/partner/actions';
import styles from '../../../proof-loop.module.css';

const initialState: PartnerCommandState = { status: 'idle' };

function Result({ state }: { state: PartnerCommandState }) {
  if (!state.message) return null;
  return <div className={state.status === 'saved' ? styles.receipt : styles.error} role={state.status === 'saved' ? 'status' : 'alert'}><h3>{state.status === 'saved' ? 'Saved.' : 'Nothing changed.'}</h3><p>{state.message}</p></div>;
}

export function CreatePartnerRequestForm({ workflowId, requestId, partnerOrganizations }: { workflowId: string; requestId: string; partnerOrganizations: { id: string; name: string; category: string; categoryLabel: string }[] }) {
  const [state, action, pending] = useActionState(createPartnerRequest, initialState);
  if (partnerOrganizations.length === 0) {
    return <p className={styles.boundary}>No active vendors are available to request from yet.</p>;
  }
  return (
    <form action={action} aria-busy={pending} className={styles.form}>
      <input name="workflowId" type="hidden" value={workflowId} />
      <input name="requestId" type="hidden" value={requestId} />
      <fieldset disabled={pending}>
        <legend>Send a request to a vendor.</legend>
        <label>Vendor<select name="partnerOrganizationId" required>{partnerOrganizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name} · {organization.categoryLabel}</option>)}</select></label>
        <label>Category <span>Must match the chosen vendor's specialty above</span><select name="category" required><option value="florist">Florist</option><option value="caterer">Caterer</option><option value="restaurant">Restaurant</option><option value="cemetery">Cemetery</option><option value="transport">Transport</option><option value="printer_stationery">Printer / Stationery</option><option value="memorial_products">Memorial products</option><option value="other">Other</option></select></label>
        <label>Title<input maxLength={200} name="title" required /></label>
        <label>Details<textarea maxLength={2000} name="details" required /></label>
        <label>Needed by <span>Optional</span><input name="neededBy" type="datetime-local" /></label>
        <button type="submit">{pending ? 'Sending…' : 'Send vendor request'}</button>
      </fieldset>
      <Result state={state} />
    </form>
  );
}

export function VerifyPartnerRequestForm({ workflowId, partnerRequestId, requestId, version }: { workflowId: string; partnerRequestId: string; requestId: string; version: number }) {
  const [state, action, pending] = useActionState(verifyPartnerRequest, initialState);
  return (
    <form action={action} aria-busy={pending} className={styles.form}>
      <input name="workflowId" type="hidden" value={workflowId} />
      <input name="partnerRequestId" type="hidden" value={partnerRequestId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <p className={styles.boundary}>Verifying marks this vendor request complete. The submitted delivery proof remains in history.</p>
      <button disabled={pending} type="submit">{pending ? 'Verifying…' : 'Verify vendor delivery'}</button>
      <Result state={state} />
    </form>
  );
}
