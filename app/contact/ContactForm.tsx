'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { submitContactInquiry, type ContactCommandState } from './actions';
import styles from '@/components/marketing/MarketingPage.module.css';

const categories = [
  'Urgent family support',
  'Planning-ahead question',
  'Funeral home inquiry',
  'Vendor conversation',
  'Hospice or care-facility conversation',
  'Feature request',
  'Report a bug',
  'Billing question',
  'Other',
];

const initialState: ContactCommandState = { status: 'idle' };

function categoryFromParam(raw: string | null): string {
  const value = (raw || '').toLowerCase();
  if (!value) return categories[0];
  if (value.includes('vendor')) return 'Vendor conversation';
  if (value.includes('hospice') || value.includes('care')) return 'Hospice or care-facility conversation';
  if (value.includes('funeral') || value.includes('partner')) return 'Funeral home inquiry';
  if (value.includes('planning') || value.includes('pricing')) return 'Planning-ahead question';
  return categories[0];
}

export function ContactForm() {
  const searchParams = useSearchParams();
  const initialCategory = useMemo(() => categoryFromParam(searchParams.get('category')), [searchParams]);
  const initialMessage = useMemo(() => {
    const plan = searchParams.get('plan');
    return plan ? `Interested plan: ${plan.replace(/_/g, ' ')}.` : '';
  }, [searchParams]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [message, setMessage] = useState(initialMessage);
  const [state, formAction, pending] = useActionState(submitContactInquiry, initialState);
  const alertRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.status !== 'idle') alertRef.current?.focus();
  }, [state.status]);

  if (state.status === 'sent') {
    return (
      <div className={styles.card} style={{ maxWidth: 520 }}>
        <p className={styles.note}>Thanks. Your message was sent to Passage. We&apos;ll follow up at {email}.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.card} style={{ maxWidth: 520 }} aria-busy={pending}>
      <label className={styles.fieldLabel}>
        Name
        <input className={styles.input} name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </label>
      <label className={styles.fieldLabel}>
        Email
        <input required type="email" className={styles.input} name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      <label className={styles.fieldLabel}>
        Category
        <select className={styles.input} name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label className={styles.fieldLabel}>
        How can we help?
        <textarea required rows={4} className={styles.input} name="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share enough detail for us to understand the issue or request." />
      </label>
      <button type="submit" disabled={pending} className={`${styles.button} ${styles.fullWidth}`}>{pending ? 'Sending…' : 'Send to Passage'}</button>
      {state.status !== 'idle' && state.message && (
        <p className={styles.note} style={{ marginTop: 12 }} ref={alertRef} role="alert" tabIndex={-1}>{state.message}</p>
      )}
    </form>
  );
}
