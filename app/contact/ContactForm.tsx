'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
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

// Same address the legacy contact-form handler (pages/api/supportInquiry.js)
// used as its ultimate fallback recipient when no CONTACT_TO_EMAIL/SUPPORT_EMAIL
// env var was set. No app/api route exists yet to receive submissions server-side,
// so this form hands off to the visitor's own email client instead of pretending
// to deliver silently.
const SUPPORT_EMAIL = 'steventurrisi@gmail.com';

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
  const [sent, setSent] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const subject = `Passage inquiry: ${category}`;
    const body = [`Name: ${name || 'Not provided'}`, `Email: ${email}`, '', message].join('\n');
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form onSubmit={submit} className={styles.card} style={{ maxWidth: 520 }}>
      <label className={styles.fieldLabel}>
        Name
        <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </label>
      <label className={styles.fieldLabel}>
        Email
        <input required type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      <label className={styles.fieldLabel}>
        Category
        <select className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label className={styles.fieldLabel}>
        How can we help?
        <textarea required rows={4} className={styles.input} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share enough detail for us to understand the issue or request." />
      </label>
      <button type="submit" className={`${styles.button} ${styles.fullWidth}`}>Open in email</button>
      {sent && <p className={styles.note} style={{ marginTop: 12 }}>Opening your email client with this message pre-filled — send it from there.</p>}
    </form>
  );
}
