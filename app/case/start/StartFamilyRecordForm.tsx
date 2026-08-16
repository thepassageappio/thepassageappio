'use client';

import { useActionState } from 'react';
import { startFamilyRecord, type StartFamilyRecordState } from './actions';
import styles from '../../login/Auth.module.css';

const initialState: StartFamilyRecordState = { status: 'idle' };

export function StartFamilyRecordForm() {
  const [state, action, pending] = useActionState(startFamilyRecord, initialState);

  return (
    <form className={styles.inviteForm} action={action} aria-busy={pending}>
      <label htmlFor="personName">Who is this record for?</label>
      <input id="personName" maxLength={200} name="personName" placeholder="Full name" required type="text" />
      <label htmlFor="relationship">Your relationship <span>Optional</span></label>
      <input id="relationship" maxLength={100} name="relationship" placeholder="Daughter, spouse, executor…" type="text" />
      <button className={styles.primary} disabled={pending} type="submit">{pending ? 'Starting…' : 'Start my family record'}</button>
      {state.status !== 'idle' && state.message && <p className={styles.alert} role="alert">{state.message}</p>}
    </form>
  );
}
