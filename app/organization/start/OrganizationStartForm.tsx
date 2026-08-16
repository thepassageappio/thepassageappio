'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { createOrganization, type OrganizationCreationState } from './actions';
import styles from '../../login/Auth.module.css';

const initialState: OrganizationCreationState = { status: 'idle' };

export function OrganizationStartForm() {
  const [state, action, pending] = useActionState(createOrganization, initialState);

  if (state.status === 'created') {
    return (
      <div className={styles.actions}>
        <p className={styles.notice} role="status">Your organization is set up. Head to your workspace to add locations, invite your team, and start your first case.</p>
        <Link className={styles.primary} href="/director" style={{ display: 'inline-flex' }}>Open your workspace</Link>
      </div>
    );
  }

  return (
    <form className={styles.inviteForm} action={action} aria-busy={pending}>
      <label htmlFor="organizationName">Funeral home name</label>
      <input id="organizationName" maxLength={200} name="organizationName" placeholder="Riverside Family Funeral Home" required type="text" />
      <label htmlFor="locationName">First location name</label>
      <input id="locationName" maxLength={200} name="locationName" placeholder="Main location" required type="text" />
      <label htmlFor="city">City <span>Optional, helps families find you later</span></label>
      <input id="city" maxLength={100} name="city" placeholder="Riverside" type="text" />
      <label htmlFor="state">State <span>Optional</span></label>
      <input id="state" maxLength={56} name="state" placeholder="CA" type="text" />
      <button className={styles.primary} disabled={pending} type="submit">{pending ? 'Setting up…' : 'Create my organization'}</button>
      {state.status !== 'idle' && state.message && <p className={styles.alert} role="alert">{state.message}</p>}
    </form>
  );
}
