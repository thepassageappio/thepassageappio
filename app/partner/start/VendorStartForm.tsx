'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { createVendorOrganization, type VendorSignupState } from './actions';
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS } from '@/lib/partner/categories';
import styles from '../../login/Auth.module.css';

const initialState: VendorSignupState = { status: 'idle' };

export function VendorStartForm() {
  const [state, action, pending] = useActionState(createVendorOrganization, initialState);

  if (state.status === 'created') {
    return (
      <div className={styles.actions}>
        <p className={styles.notice} role="status">Your vendor account is set up. Next, set up payouts so funeral-home directors can send you requests.</p>
        <Link className={styles.primary} href="/partner/payouts" style={{ display: 'inline-flex' }}>Set up payouts</Link>
      </div>
    );
  }

  return (
    <form className={styles.inviteForm} action={action} aria-busy={pending}>
      <label htmlFor="organizationName">Business name</label>
      <input id="organizationName" maxLength={200} name="organizationName" placeholder="Riverside Florals" required type="text" />
      <label htmlFor="category">Category</label>
      <select id="category" name="category" required>
        {VENDOR_CATEGORIES.map((value) => <option key={value} value={value}>{VENDOR_CATEGORY_LABELS[value]}</option>)}
      </select>
      <label htmlFor="contactEmail">Contact email <span>Optional</span></label>
      <input id="contactEmail" name="contactEmail" placeholder="orders@example.com" type="email" />
      <label htmlFor="contactPhone">Contact phone <span>Optional</span></label>
      <input id="contactPhone" name="contactPhone" placeholder="(555) 555-5555" type="tel" />
      <button className={styles.primary} disabled={pending} type="submit">{pending ? 'Setting up…' : 'Create my vendor account'}</button>
      {state.status !== 'idle' && state.message && <p className={styles.alert} role="alert">{state.message}</p>}
    </form>
  );
}
