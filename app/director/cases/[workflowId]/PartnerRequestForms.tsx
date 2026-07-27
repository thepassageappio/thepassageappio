'use client';

import { useActionState, useMemo, useState } from 'react';
import { DurableReceipt } from '@/components/operations/DurableReceipt';
import { createPartnerRequest, verifyPartnerRequest } from './partner-actions';
import type { PartnerCommandState } from '@/app/partner/actions';
import styles from '../../../proof-loop.module.css';

const initialState: PartnerCommandState = { status: 'idle' };

function Result({ state }: { state: PartnerCommandState }) {
  if (!state.message) return null;
  if (state.status === 'saved' && state.durable) return <DurableReceipt announce receipt={state.durable} />;
  return <div className={styles.error} role="alert"><h3>Nothing changed.</h3><p>{state.message}</p></div>;
}

export function CreatePartnerRequestForm({ workflowId, requestId, partnerOrganizations }: { workflowId: string; requestId: string; partnerOrganizations: { id: string; name: string; category: string }[] }) {
  const [state, action, pending] = useActionState(createPartnerRequest, initialState);
  const [partnerOrganizationId, setPartnerOrganizationId] = useState(partnerOrganizations[0]?.id ?? '');
  const selectedPartner = useMemo(
    () => partnerOrganizations.find((organization) => organization.id === partnerOrganizationId) ?? partnerOrganizations[0],
    [partnerOrganizationId, partnerOrganizations],
  );
  if (partnerOrganizations.length === 0) {
    return <p className={styles.boundary}>No active vendors are available to request from yet.</p>;
  }
  return (
    <form action={action} aria-busy={pending} className={styles.form}>
      <input name="workflowId" type="hidden" value={workflowId} />
      <input name="requestId" type="hidden" value={requestId} />
      <fieldset disabled={pending}>
        <legend>Send a request to a vendor.</legend>
        <label>Vendor<select name="partnerOrganizationId" onChange={(event) => setPartnerOrganizationId(event.target.value)} required value={selectedPartner.id}>{partnerOrganizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
        <p className={styles.boundary}>Service matched to this vendor: <strong>{humanCategory(selectedPartner.category)}</strong>. Choose a different vendor to change the service.</p>
        <label>Title<input maxLength={200} name="title" required /></label>
        <label>Details<textarea maxLength={2000} name="details" required /></label>
        <label>Needed by <span>Optional</span><input name="neededBy" type="datetime-local" /></label>
        <button type="submit">{pending ? 'Sending…' : 'Send vendor request'}</button>
      </fieldset>
      <Result state={state} />
    </form>
  );
}

function humanCategory(category: string) {
  return {
    florist: 'Flowers',
    catering: 'Food and refreshments',
    transport: 'Transportation',
    memorial_products: 'Memorial products',
    other: 'Other support',
  }[category] ?? 'Vendor support';
}

export function VerifyPartnerRequestForm({ workflowId, partnerRequestId, requestId, version }: { workflowId: string; partnerRequestId: string; requestId: string; version: number }) {
  const [state, action, pending] = useActionState(verifyPartnerRequest, initialState);
  return (
    <form action={action} aria-busy={pending} className={styles.form}>
      <input name="workflowId" type="hidden" value={workflowId} />
      <input name="partnerRequestId" type="hidden" value={partnerRequestId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <p className={styles.boundary}>Verifying marks this vendor request complete and keeps the delivery proof in history. It does not create a payment or send a message to the Rivera family.</p>
      <button disabled={pending} type="submit">{pending ? 'Verifying…' : 'Verify vendor delivery'}</button>
      <Result state={state} />
    </form>
  );
}
