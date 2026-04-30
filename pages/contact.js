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
  'Billing or Stripe',
  'Technical issue',
  'Funeral home / partner inquiry',
  'Content or press',
  'Other',
];

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: C.soft, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

const input = { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontFamily: 'Georgia,serif', fontSize: 14, color: C.ink, outline: 'none', background: '#fff' };
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

  function set(key, value) { setForm(prev => ({ ...prev, [key]: value })); }

  async function submit(e) {
    e.preventDefault();
    setState('sending');
    const r = await fetch('/api/supportInquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setState(r.ok ? 'sent' : 'error');
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />

      <section style={{ maxWidth: 980, margin: '0 auto', padding: '26px 22px 58px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 20 }}>
        <div>
          <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Contact Passage</div>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 40px)', lineHeight: 1.06, margin: '0 0 10px', fontWeight: 400 }}>Tell us what is happening. We will route it with care.</h1>
          <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>Use this form for support, billing, urgent-flow feedback, partnership inquiries, or content requests. For emergencies, please contact local emergency services or the appropriate funeral, medical, legal, or government office directly.</p>
          <div style={{ marginTop: 16, background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, color: C.mid, fontSize: 13, lineHeight: 1.55 }}>
            <strong style={{ color: C.ink }}>Support email:</strong> <SupportEmail /><br />
            <strong style={{ color: C.ink }}>Partnerships:</strong> funeral homes, attorneys, planners, and care teams can use the partner inquiry category.
          </div>
        </div>

        <form onSubmit={submit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, boxShadow: '0 12px 40px rgba(55,45,35,.06)' }}>
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
            <textarea required rows={7} value={form.message} onChange={e => set('message', e.target.value)} style={{ ...input, resize: 'vertical', lineHeight: 1.55 }} placeholder="Share enough detail for us to understand the issue or request." />
          </Field>
          <button disabled={state === 'sending'} style={{ width: '100%', border: 'none', borderRadius: 13, padding: '14px 18px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>
            {state === 'sending' ? 'Sending...' : 'Submit inquiry'}
          </button>
          {state === 'sent' && <p style={{ color: C.sage, fontSize: 13, lineHeight: 1.6 }}>We received it. Thank you.</p>}
          {state === 'error' && <p style={{ color: C.rose, fontSize: 13, lineHeight: 1.6 }}>Something did not send. Please email <SupportEmail />.</p>}
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}
