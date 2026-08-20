'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { claimUrgentIntake, createCaseFromUrgentIntake } from './actions';
import type { UrgentDirectorCommandState } from './actions';
import styles from '../../proof-loop.module.css';

const initialState: UrgentDirectorCommandState = { status: 'idle' };

function Result({ state }: { state: UrgentDirectorCommandState }) {
  if (!state.message) return null;
  if (state.status === 'upgrade-required') {
    return <div className={styles.error} role="alert"><h3>Upgrade required</h3><p>{state.message}</p><Link href="/director/billing">Upgrade now</Link></div>;
  }
  return <div className={state.status === 'saved' ? styles.receipt : styles.error} role={state.status === 'saved' ? 'status' : 'alert'}><h3>{state.status === 'saved' ? 'Saved.' : 'Nothing changed.'}</h3><p>{state.message}</p></div>;
}

export function ClaimUrgentIntakeForm({ urgentIntakeRequestId, requestId, version }: { urgentIntakeRequestId: string; requestId: string; version: number }) {
  const [state, action, pending] = useActionState(claimUrgentIntake, initialState);
  return (
    <form action={action} aria-busy={pending} className={styles.form}>
      <input name="urgentIntakeRequestId" type="hidden" value={urgentIntakeRequestId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <p className={styles.boundary}>Claiming this means you are taking responsibility for reaching out and creating the case.</p>
      <button disabled={pending} type="submit">{pending ? 'Claiming…' : 'Claim this request'}</button>
      <Result state={state} />
    </form>
  );
}

export function CreateCaseFromUrgentIntakeForm({ urgentIntakeRequestId, requestId, version, locations }: { urgentIntakeRequestId: string; requestId: string; version: number; locations: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createCaseFromUrgentIntake, initialState);
  if (locations.length === 0) {
    return <p className={styles.boundary}>No authorized location is available to open this case under yet.</p>;
  }
  return (
    <form action={action} aria-busy={pending} className={styles.form}>
      <input name="urgentIntakeRequestId" type="hidden" value={urgentIntakeRequestId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <fieldset disabled={pending}>
        <legend>Create the case.</legend>
        <label>Location<select name="organizationLocationId" required>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <label>Case reference<input maxLength={60} name="caseReference" required /></label>
        <label>Family name<input maxLength={200} name="familyName" required /></label>
        <button type="submit">{pending ? 'Creating…' : 'Create the case'}</button>
      </fieldset>
      <Result state={state} />
    </form>
  );
}
