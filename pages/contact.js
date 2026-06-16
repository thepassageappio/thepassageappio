import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';
import { calendlyUrl, isMeetingCategory } from '../lib/scheduling';
import { trackEvent } from '../lib/trackEvent';
import { PASSAGE_BRAND } from '../lib/brand';

const C = {
  bg: '#f6f3ee', card: '#ffffff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890',
  border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a',
};

const categories = [
  'Urgent family support',
  'Planning-ahead question',
  'Book a funeral-home demo',
  'Vendor conversation',
  'Hospice or care-facility conversation',
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
      <div style={{ fontSize: 10.5, color: C.soft, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 5 }}>{label}</div>
      {children}
    </label>
  );
}

const input = { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.border}`, borderRadius: 11, padding: '8px 12px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink, outline: 'none', background: '#fff' };

function SupportEmail() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || PASSAGE_BRAND.supportEmail;
  return <a href={'mailto:' + email} style={{ color: C.ink }}>{email}</a>;
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', category: categories[0], urgency: 'Normal', message: '' });
  const [state, setState] = useState('idle');
  const meetingReady = isMeetingCategory(form.category);
  const meetingHref = calendlyUrl({ name: form.name, email: form.email, source: form.category });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const rawCategory = String(params.get('category') || '').trim().toLowerCase();
    const plan = String(params.get('plan') || '').trim();
    if (!rawCategory && !plan) return;
    setForm(prev => {
      const category = rawCategory.includes('vendor')
        ? (rawCategory.includes('meeting') || rawCategory.includes('conversation') ? 'Vendor conversation' : 'Local vendor interest')
        : rawCategory.includes('hospice') || rawCategory.includes('care')
          ? 'Hospice or care-facility conversation'
          : rawCategory.includes('demo') || rawCategory.includes('walkthrough')
            ? 'Book a funeral-home demo'
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
    trackEvent('contact_submit_clicked', { category: form.category, urgency: form.urgency, meetingReady });
    setState('sending');
    const r = await fetch('/api/supportInquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      trackEvent('contact_submit_succeeded', { category: form.category, urgency: form.urgency, meetingReady });
      setForm({ name: '', email: '', category: categories[0], urgency: 'Normal', message: '' });
      setState('sent');
    } else {
      trackEvent('contact_submit_failed', { category: form.category, status: r.status });
      setState('error');
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />

      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '6px 22px 10px', display: 'grid', gridTemplateColumns: 'minmax(0,.9fr) minmax(360px,1fr)', gap: 16, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 6 }}>Contact Passage</div>
          <h1 style={{ fontSize: 32, lineHeight: .98, margin: '0 0 8px', fontWeight: 400 }}>How can we help right now?</h1>
          <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.42, margin: 0 }}>Book demos and partner conversations immediately. Use the form for support, billing, bugs, feature requests, urgent-flow feedback, or anything that can wait for a written reply.</p>
          <div style={{ marginTop: 10, background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 13, padding: '10px 11px', color: C.mid, fontSize: 12.5, lineHeight: 1.45 }}>
            <strong style={{ color: C.ink }}>Emergencies:</strong> contact local emergency services or the appropriate funeral, medical, legal, or government office directly.<br />
            <strong style={{ color: C.ink }}>Support:</strong> <SupportEmail /><br />
            <strong style={{ color: C.ink }}>Vendors:</strong> use the approval flow. <Link href="/vendors/onboard" style={{ color: C.sage, fontWeight: 900 }}>Apply as a vendor</Link>
          </div>
          <div style={{ marginTop: 10, background: '#fffdf9', border: `1px solid ${C.border}`, borderRadius: 13, padding: '10px 11px' }}>
            <div style={{ fontSize: 10.5, color: C.sage, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 5 }}>Fastest path</div>
            <div style={{ color: C.ink, fontSize: 17, lineHeight: 1.18, marginBottom: 5 }}>Book a Passage discovery meeting.</div>
            <p style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.42, margin: '0 0 9px' }}>For funeral-home demos, vendor conversations, hospice or care-facility discovery, and product walkthroughs, skip the inbox and choose a time.</p>
            <a href={meetingHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('contact_hubspot_clicked', { category: form.category, href: meetingHref })} style={{ display: 'inline-flex', minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: C.sage, color: '#fff', textDecoration: 'none', padding: '0 13px', fontWeight: 900, fontSize: 12.5 }}>Book on HubSpot</a>
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
          {meetingReady && (
            <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 10, color: C.mid, fontSize: 12.6, lineHeight: 1.42, marginBottom: 9 }}>
              <strong style={{ color: C.ink }}>This is a meeting request.</strong> The fastest next step is HubSpot meetings. The form below is only for context you want to send before or after booking.
              <a href={meetingHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('contact_meeting_context_clicked', { category: form.category, href: meetingHref })} style={{ display: 'flex', marginTop: 8, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: C.sage, color: '#fff', textDecoration: 'none', padding: '0 13px', fontWeight: 900 }}>Book the meeting</a>
            </div>
          )}
          <Field label="Urgency">
            <select value={form.urgency} onChange={e => set('urgency', e.target.value)} style={input}>
              <option>Normal</option>
              <option>Time sensitive</option>
              <option>Urgent help blocked</option>
            </select>
          </Field>
          <Field label="How can we help?">
            <textarea required rows={3} value={form.message} onChange={e => set('message', e.target.value)} style={{ ...input, resize: 'vertical', lineHeight: 1.35 }} placeholder="Share enough detail for us to understand the issue or request." />
          </Field>
          <button disabled={state === 'sending'} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '11px 16px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>
            {state === 'sending' ? 'Sending...' : meetingReady ? 'Send context instead' : 'Submit inquiry'}
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
