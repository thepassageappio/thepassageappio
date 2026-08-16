'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { adminCreateOrganization, type AdminOrganizationCreationState } from './actions';
import styles from '../../../login/Auth.module.css';

const initialState: AdminOrganizationCreationState = { status: 'idle' };

function formatReceiptTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(value));
}

export function AdminOrganizationForm() {
  const [state, action, pending] = useActionState(adminCreateOrganization, initialState);

  if (state.status === 'created' && state.receipt) {
    const receipt = state.receipt;
    return (
      <div className={styles.actions}>
        <p className={styles.notice} role="status">Organization created. Share this secure invitation link with the director through your approved private channel. Passage cannot show it again.</p>
        <dl style={{ fontSize: 14, lineHeight: 1.6 }}>
          <div><dt style={{ fontWeight: 650 }}>Director</dt><dd>{receipt.directorEmail}</dd></div>
          <div><dt style={{ fontWeight: 650 }}>Expires</dt><dd>{formatReceiptTime(receipt.expiresAt)}</dd></div>
          <div><dt style={{ fontWeight: 650 }}>Token proof</dt><dd>Ends in {receipt.tokenHint}</dd></div>
        </dl>
        {receipt.invitePath && <Link className={styles.primary} href={receipt.invitePath} style={{ display: 'inline-flex' }} prefetch={false}>Open secure invitation</Link>}
        <Link className={styles.textLink} href="/admin/organizations/new">Onboard another funeral home</Link>
      </div>
    );
  }

  return (
    <form className={styles.inviteForm} action={action} aria-busy={pending}>
      <label htmlFor="organizationName">Funeral home name</label>
      <input id="organizationName" maxLength={200} name="organizationName" required type="text" />
      <label htmlFor="locationName">First location name</label>
      <input id="locationName" maxLength={200} name="locationName" required type="text" />
      <label htmlFor="directorEmail">Director email</label>
      <input id="directorEmail" name="directorEmail" required type="email" />
      <label htmlFor="purpose">Purpose (optional)</label>
      <input defaultValue="New funeral home onboarding." id="purpose" maxLength={240} name="purpose" type="text" />
      <button className={styles.primary} disabled={pending} type="submit">{pending ? 'Creating…' : 'Create organization and invitation'}</button>
      {state.status !== 'idle' && state.message && <p className={styles.alert} role="alert">{state.message}</p>}
    </form>
  );
}
