'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createManualCase, type ManualIntakeState } from './actions';
import styles from '../../proof-loop.module.css';

const initialState: ManualIntakeState = { status: 'idle' };

export function ManualIntakeForm({ locations }: { locations: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createManualCase, initialState);

  if (locations.length === 0) {
    return <p className={styles.boundary}>No authorized location is available to open a case under yet. Ask an owner to grant one.</p>;
  }

  return (
    <form action={action} aria-busy={pending} className={styles.form}>
      <fieldset disabled={pending}>
        <legend>Open a new case.</legend>
        <label>Location<select name="organizationLocationId" required>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <label>Case reference<input maxLength={60} name="caseReference" placeholder="e.g. a file or reference number" required /></label>
        <label>Family name<input maxLength={200} name="familyName" required /></label>
        <label>Person&apos;s name<input maxLength={200} name="personName" required /></label>
        <button type="submit">{pending ? 'Creating…' : 'Create the case'}</button>
      </fieldset>
      {state.status !== 'idle' && state.message && (
        state.status === 'upgrade-required' ? (
          <div className={styles.error} role="alert"><h3>Upgrade required</h3><p>{state.message}</p><Link href="/director/billing">Upgrade now</Link></div>
        ) : (
          <div className={styles.error} role="alert"><h3>Nothing changed.</h3><p>{state.message}</p></div>
        )
      )}
    </form>
  );
}
