import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';
import { calendlyUrl, isMeetingCategory } from '../lib/scheduling';
import { trackEvent } from '../lib/trackEvent';

const categories = [
  'Urgent family support',
  'Planning-ahead question',
  'Book a funeral-home demo',
  'Vendor conversation',
  'Hospice or care-facility conversation',
  'Funeral home inquiry',
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
    <label className="th-label-wrap">
      <div className="th-label">{label}</div>
      {children}
    </label>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', category: categories[0], urgency: 'Normal', message: '' });
  const [state, setState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
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
              ? 'Funeral home inquiry'
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
    setErrorMessage('');
    try {
      const r = await fetch('/api/supportInquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const responseBody = await r.json().catch(() => ({}));
      if (r.ok) {
        trackEvent('contact_submit_succeeded', { category: form.category, urgency: form.urgency, meetingReady });
        setForm({ name: '', email: '', category: categories[0], urgency: 'Normal', message: '' });
        setState('sent');
      } else {
        const message = responseBody?.error || 'Something did not send. Please try again or book a meeting.';
        trackEvent('contact_submit_failed', { category: form.category, status: r.status, reason: message });
        setErrorMessage(message);
        setState('error');
      }
    } catch (error) {
      const message = 'Something did not send. Please try again or book a meeting.';
      trackEvent('contact_submit_failed', { category: form.category, reason: 'network_error' });
      setErrorMessage(message);
      setState('error');
    }
  }

  return (
    <main className="th-shell">
      <style jsx global>{`
        :root{
          --pine-950:#0A1F1A; --pine-900:#0F2A24; --pine-800:#153A31; --pine-700:#1C4A3E; --pine-600:#245A4B;
          --pine-100:#E7EFEA; --pine-50:#F2F6F3;
          --clay-700:#9A4F26; --clay-600:#B5622F; --clay-200:#EBC6A4; --clay-100:#F5E4D6; --clay-50:#FBF0E7;
          --bone-50:#FEFDFB; --bone-100:#FBF8F3; --bone-200:#F5F0E7; --bone-300:#EBE3D3; --bone-400:#DDD2BB;
          --ink-900:#1C1917; --ink-700:#3D372F; --ink-600:#5A5348; --ink-500:#79705F; --ink-400:#9A9081; --ink-300:#BEB6A8;
          --line:#E6DDCB; --line-soft:#EFE8DA;
          --r-xs:8px; --r-sm:12px; --r-md:18px; --r-lg:26px; --r-full:999px;
          --e1:0 1px 1px rgba(20,30,25,.03), 0 2px 4px rgba(20,30,25,.03);
          --e2:0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10);
          --ease:cubic-bezier(.22,1,.36,1);
        }
      `}</style>
      <style jsx>{`
        .th-shell {
          min-height: 100vh;
          background: var(--bone-100);
          color: var(--ink-900);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: -.005em;
        }
        .wrap { max-width: 1040px; margin: 0 auto; padding: 20px 22px 40px; display: grid; grid-template-columns: minmax(0,.9fr) minmax(360px,1fr); gap: 16px; align-items: start; }
        .eyebrow { color: var(--clay-600); font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; display: block; }
        h1 { font-family: 'Fraunces', serif; font-weight: 440; font-size: 32px; line-height: .98; margin: 0 0 8px; letter-spacing: -.015em; color: var(--pine-950); }
        p.lede { color: var(--ink-500); font-size: 13.5px; line-height: 1.42; margin: 0; }
        .notice-box { margin-top: 10px; background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-sm); padding: 10px 11px; color: var(--ink-600); font-size: 12.5px; line-height: 1.45; }
        .notice-box strong { color: var(--ink-900); }
        .notice-box a { color: var(--pine-700); font-weight: 600; }
        .fast-path { margin-top: 10px; background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-sm); padding: 10px 11px; box-shadow: var(--e1); }
        .fast-eyebrow { font-size: 10.5px; color: var(--clay-600); font-weight: 700; text-transform: uppercase; letter-spacing: .14em; margin-bottom: 5px; }
        .fast-title { color: var(--ink-900); font-size: 17px; line-height: 1.18; margin-bottom: 5px; font-weight: 600; }
        .fast-body { color: var(--ink-500); font-size: 12.5px; line-height: 1.42; margin: 0 0 9px; }
        .th-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 12.5px;
          border-radius: var(--r-full); padding: 0 13px; min-height: 38px;
          border: 1px solid transparent; cursor: pointer; text-decoration: none;
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
        }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn-primary {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800));
          color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        form.th-form { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 14px; box-shadow: var(--e2); }
        .th-label-wrap { display: block; margin-bottom: 9px; }
        .th-label { font-size: 10.5px; color: var(--ink-400); font-weight: 700; text-transform: uppercase; letter-spacing: .12em; margin-bottom: 5px; }
        input, select, textarea {
          width: 100%; box-sizing: border-box; border: 1.5px solid var(--line); border-radius: var(--r-sm);
          padding: 8px 12px; font-family: 'Inter', sans-serif; font-size: 13px; color: var(--ink-900);
          outline: none; background: var(--bone-50);
        }
        textarea { resize: vertical; line-height: 1.35; }
        .meeting-note { background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-sm); padding: 10px; color: var(--ink-600); font-size: 12.6px; line-height: 1.42; margin-bottom: 9px; }
        .meeting-note strong { color: var(--ink-900); }
        .meeting-note a { display: flex; margin-top: 8px; min-height: 38px; align-items: center; justify-content: center; }
        .submit-btn {
          width: 100%; border: none; border-radius: var(--r-sm); padding: 11px 16px; min-height: 46px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; cursor: pointer;
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .submit-btn:disabled { opacity: .62; cursor: wait; }
        .status-ok { color: var(--pine-700); font-size: 13px; line-height: 1.6; }
        .status-error { color: var(--clay-700); font-size: 13px; line-height: 1.6; }

        @media (max-width: 780px) {
          .wrap { grid-template-columns: 1fr !important; padding: 16px 16px 32px; }
        }
      `}</style>
      <SiteHeader />
      <section className="wrap">
        <div>
          <span className="eyebrow">Contact Passage</span>
          <h1>How can we help right now?</h1>
          <p className="lede">Book demos and provider conversations immediately. Use the form for support, billing, bugs, feature requests, urgent-flow feedback, or anything that can wait for a written reply.</p>
          <div className="notice-box">
            <strong>Emergencies:</strong> contact local emergency services or the appropriate funeral, medical, legal, or government office directly.<br />
            <strong>Vendors:</strong> use the approval flow. <Link href="/vendors/onboard">Apply as a vendor</Link>
          </div>
          <div className="fast-path">
            <div className="fast-eyebrow">Fastest path</div>
            <div className="fast-title">Book a Passage discovery meeting.</div>
            <p className="fast-body">For funeral-home demos, vendor conversations, hospice or care-facility discovery, and product walkthroughs, skip the inbox and choose a time.</p>
            <a href={meetingHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('contact_hubspot_clicked', { category: form.category, href: meetingHref })} className="th-btn th-btn-primary">Book on HubSpot</a>
          </div>
        </div>

        <form onSubmit={submit} className="th-form">
          <Field label="Name">
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Email">
            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          {meetingReady && (
            <div className="meeting-note">
              <strong>This is a meeting request.</strong> The fastest next step is HubSpot meetings. The form below is only for context you want to send before or after booking.
              <a href={meetingHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('contact_meeting_context_clicked', { category: form.category, href: meetingHref })} className="th-btn th-btn-primary">Book the meeting</a>
            </div>
          )}
          <Field label="Urgency">
            <select value={form.urgency} onChange={e => set('urgency', e.target.value)}>
              <option>Normal</option>
              <option>Time sensitive</option>
              <option>Urgent help blocked</option>
            </select>
          </Field>
          <Field label="How can we help?">
            <textarea required rows={3} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Share enough detail for us to understand the issue or request." />
          </Field>
          <button disabled={state === 'sending'} className="submit-btn">
            {state === 'sending' ? 'Sending...' : meetingReady ? 'Send context instead' : 'Submit inquiry'}
          </button>
          {state === 'sent' && <p className="status-ok">We received it. Thank you.</p>}
          {state === 'error' && <p className="status-error">{errorMessage || 'Something did not send. Please try again or book a meeting.'}</p>}
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}
