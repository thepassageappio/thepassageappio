import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const C = {
  bg: '#f6f3ee', card: '#ffffff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890',
  border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a',
};

const categories = [
  'Urgent family support',
  'Planning-ahead question',
  'Funeral home / partner inquiry',
  'Local vendor interest',
  'Feature request',
  'Report a bug',
  'Billing or Stripe',
  'Technical issue',
  'Content or press',
  'Other',
];

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 9 }}>
      <div style={{ fontSize: 10, color: C.soft, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 5 }}>{label}</div>
      {children}
    </label>
  );
}

const input = { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.border}`, borderRadius: 11, padding: '8px 12px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink, outline: 'none', background: '#fff' };
const SUPPORT_USER = 'thepassageappio';
const SUPPORT_DOMAIN = 'gmail.com';

function SupportEmail() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <span>support email loading</span>;
  const email = SUPPORT_USER + '@' + SUPPORT_DOMAIN;
  return <a href={'mailto:' + email} style={{ color: C.ink }}>{email}</a>;
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', category: categories[0], urgency: 'Normal', message: '' });
  const [state, setState] = useState('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const rawCategory = String(params.get('category') || '').trim().toLowerCase();
    const plan = String(params.get('plan') || '').trim();
    if (!rawCategory && !plan) return;
    setForm(prev => {
      const category = rawCategory.includes('vendor')
        ? 'Local vendor interest'
        : rawCategory.includes('funeral') || rawCategory.includes('partner')
          ? 'Funeral home / partner inquiry'
          : prev.category;
      const planLine = plan ? `Interested plan: ${plan.replace(/_/g, ' ')}.` : '';
      const message = prev.message || planLine;
      return { ...prev, category, message };
    });
  }, []);

  function set(key, value) { setForm(prev => ({ ...prev, [key]: value })); }

  async function submit(e) {
    e.preventDefault();
    setState('sending');
    const r = await fetch('/api/supportInquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      setForm({ name: '', email: '', category: categories[0], urgency: 'Normal', message: '' });
      setState('sent');
    } else {
      setState('error');
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />

      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '6px 22px 10px', display: 'grid', gridTemplateColumns: 'minmax(0,.9fr) minmax(360px,1fr)', gap: 16, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 10, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 6 }}>Contact Passage</div>
          <h1 style={{ fontSize: 'clamp(30px, 3.4vw, 44px)', lineHeight: .98, margin: '0 0 8px', fontWeight: 400 }}>How can we help right now?</h1>
          <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.42, margin: 0 }}>Use this for support, billing, bug reports, feature requests, urgent-flow feedback, partner inquiries, or content requests.</p>
          <div style={{ marginTop: 10, background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 13, padding: '10px 11px', color: C.mid, fontSize: 12.5, lineHeight: 1.45 }}>
            <strong style={{ color: C.ink }}>Emergencies:</strong> contact local emergency services or the appropriate funeral, medical, legal, or government office directly.<br />
            <strong style={{ color: C.ink }}>Support:</strong> <SupportEmail /><br />
            <strong style={{ color: C.ink }}>Vendors:</strong> use the approval flow. <Link href="/vendors/onboard" style={{ color: C.sage, fontWeight: 900 }}>Apply as a vendor</Link>
          </div>
        </div>

        <form onSubmit={submit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 17, padding: 14, boxShadow: '0 10px 30px rgba(55,45,35,.045)' }}>
          <Field label="Name">
            <input value={form.name} onChange={e => set('name', e.target.value)} style={input} placeholder="Your name" />
          </Field>
          <Field label="Email">
            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} style={input} placeholder="you@example.com" />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={e => set('category', e.target.value)} style={input}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Urgency">
            <select value={form.urgency} onChange={e => set('urgency', e.target.value)} style={input}>
              <option>Normal</option>
              <option>Time sensitive</option>
              <option>Urgent path blocked</option>
            </select>
          </Field>
          <Field label="How can we help?">
            <textarea required rows={3} value={form.message} onChange={e => set('message', e.target.value)} style={{ ...input, resize: 'vertical', lineHeight: 1.35 }} placeholder="Share enough detail for us to understand the issue or request." />
          </Field>
          <button disabled={state === 'sending'} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '11px 16px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>
            {state === 'sending' ? 'Sending...' : 'Submit inquiry'}
          </button>
          {state === 'sent' && <p style={{ color: C.sage, fontSize: 13, lineHeight: 1.6 }}>We received it. Thank you.</p>}
          {state === 'error' && <p style={{ color: C.rose, fontSize: 13, lineHeight: 1.6 }}>Something did not send. Please email <SupportEmail />.</p>}
        </form>
      </section>
      <style jsx>{`
        @media (max-width: 780px) {
          section { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <SiteFooter />
    </main>
  );
}
