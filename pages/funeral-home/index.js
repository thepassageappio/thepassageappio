import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { calendlyUrl } from '../../lib/scheduling';
import { trackEvent } from '../../lib/trackEvent';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#9a9288',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageDark: '#4a6e50',
  sageFaint: '#eef5ef',
  sageLight: '#c8deca',
  rose: '#c47a7a',
};

const plans = [
  ['Pilot', '$99.99/mo', '$0 for 3 months', 'A guided rollout for a small real-case sample, co-branded family view, and director workspace.'],
  ['Local', '$249.99/mo', '', 'Unlimited active cases, staff queues, approved family updates, proof trail, and exports.'],
  ['Group', '$349.99/mo', '', 'Multi-location controls, reporting, role scopes, onboarding support, and priority workflow setup.'],
];

const operatingSteps = [
  ['1', 'Open a case', 'Add the family contact, service context, dates you know, and the person on your team who owns the next step.'],
  ['2', 'Assign the work', 'Directors see the full floor. Staff see only the assigned cases and tasks they need to move.'],
  ['3', 'Ask once', 'Passage prepares the family request or staff note so the right person gets one clear ask instead of repeated calls.'],
  ['4', 'Record proof', 'Every handled, waiting, or blocked item gets a note, owner, timestamp, and proof destination.'],
  ['5', 'Keep families aligned', 'Families see approved updates and waiting points without seeing private staff, billing, or admin information.'],
  ['6', 'Export the record', 'Case status, task outcomes, messages, dates, and proof can leave Passage for the systems you already use.'],
];

const outcomes = [
  ['Fewer repeated calls', 'Families can see what is waiting, who owns it, and what has already been handled.'],
  ['Clear staff ownership', 'Directors assign work once; employees get the context and proof requirement beside the task.'],
  ['Safer family updates', 'Messages are prepared for review. Nothing goes out automatically without the funeral-home team approving it.'],
  ['A usable case record', 'Dates, owners, notes, family requests, and proof stay together instead of scattering across texts and inboxes.'],
];

function planForTier(index) {
  return index === 0 ? 'partner_pilot' : index === 1 ? 'partner_local' : 'partner_group';
}

function contactHref(planId) {
  return calendlyUrl({ source: `Funeral home page - ${planId}` });
}

export default function FuneralHomePage() {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase?.auth) return;
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
  }, []);

  async function signOut() {
    if (!supabase?.auth) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  async function startCheckout(planId) {
    trackEvent('funeral_home_plan_start_clicked', { planId, signedIn: Boolean(user) });
    setError('');
    if (!user) {
      window.location.href = contactHref(planId);
      return;
    }
    setBusy(planId);
    if (!supabase?.auth) {
      setError('Sign-in is not configured in this environment.');
      setBusy('');
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({ planId, userId: user.id, userEmail: user.email }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy('');
    if (!res.ok) {
      setError(json.error || 'Could not start partner checkout.');
      return;
    }
    window.location.href = json.url;
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <style>{`
        .fh-shell, .fh-shell * { box-sizing:border-box; }
        .fh-shell { max-width:1120px; margin:0 auto; padding:28px 24px 74px; }
        .fh-kicker { color:${C.sage}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; font-weight:900; }
        .fh-hero { display:grid; grid-template-columns:minmax(0,1fr) minmax(320px,.46fr); gap:18px; align-items:stretch; }
        .fh-panel { background:${C.card}; border:1px solid ${C.border}; border-radius:18px; padding:18px; box-shadow:0 12px 34px rgba(55,45,35,.06); }
        .fh-title { font-size:48px; line-height:1.02; margin:8px 0 10px; font-weight:400; letter-spacing:0; max-width:760px; }
        .fh-lede { color:${C.mid}; font-size:16px; line-height:1.55; margin:0; max-width:760px; }
        .fh-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; }
        .fh-button { min-height:44px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; padding:0 15px; font-weight:900; text-decoration:none; font-family:inherit; cursor:pointer; font-size:13px; }
        .fh-primary { background:${C.ink}; color:white; border:1px solid ${C.ink}; }
        .fh-secondary { background:${C.card}; color:${C.sageDark}; border:1px solid ${C.sageLight}; }
        .fh-sample { background:${C.sage}; color:white; border:1px solid ${C.sage}; }
        .fh-note { color:${C.soft}; font-size:12px; line-height:1.45; margin-top:10px; }
        .fh-case { background:${C.sageFaint}; border:1px solid ${C.sageLight}; border-radius:14px; padding:13px; margin-top:12px; }
        .fh-case-head { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; margin-bottom:10px; }
        .fh-case-head b { font-size:18px; line-height:1.12; }
        .fh-pill { border-radius:999px; padding:4px 8px; background:${C.card}; color:${C.sageDark}; border:1px solid ${C.sageLight}; font-size:11px; font-weight:900; white-space:nowrap; }
        .fh-row { display:grid; grid-template-columns:86px minmax(0,1fr); gap:10px; padding:7px 0; border-top:1px solid ${C.sageLight}; }
        .fh-row-label { color:${C.sageDark}; font-size:10.5px; letter-spacing:.11em; text-transform:uppercase; font-weight:900; }
        .fh-row-value { color:${C.mid}; font-size:12.6px; line-height:1.35; }
        .fh-section { margin-top:16px; }
        .fh-section-head { display:flex; justify-content:space-between; gap:16px; align-items:flex-end; flex-wrap:wrap; margin-bottom:10px; }
        .fh-section h2 { font-size:30px; line-height:1.1; margin:5px 0 0; font-weight:400; }
        .fh-section p { color:${C.mid}; font-size:14px; line-height:1.55; margin:0; max-width:680px; }
        .fh-outcomes { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
        .fh-card { background:${C.card}; border:1px solid ${C.border}; border-radius:15px; padding:13px; min-height:128px; }
        .fh-card b { display:block; font-size:15.5px; line-height:1.18; margin-bottom:6px; }
        .fh-card span { color:${C.mid}; font-size:12.5px; line-height:1.42; }
        .fh-steps { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
        .fh-step { background:${C.card}; border:1px solid ${C.border}; border-radius:15px; padding:13px; min-height:142px; }
        .fh-step-number { width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:999px; background:${C.sageFaint}; border:1px solid ${C.sageLight}; color:${C.sageDark}; font-size:11px; font-weight:900; margin-bottom:8px; }
        .fh-step b { display:block; font-size:15px; line-height:1.18; margin-bottom:5px; }
        .fh-step span { display:block; color:${C.mid}; font-size:12.3px; line-height:1.42; }
        .fh-plans { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
        .fh-plan { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; padding:14px; min-height:174px; display:flex; flex-direction:column; justify-content:space-between; gap:12px; }
        .fh-plan-price { color:${C.ink}; font-size:22px; line-height:1.1; font-weight:900; margin-top:6px; }
        .fh-plan-pilot { color:${C.rose}; font-size:15px; font-weight:900; }
        .fh-plan-detail { color:${C.mid}; font-size:12.6px; line-height:1.42; margin-top:7px; }
        @media (max-width:860px) {
          .fh-shell { padding:20px 16px 56px; }
          .fh-hero, .fh-outcomes, .fh-steps, .fh-plans { grid-template-columns:1fr; }
          .fh-title { font-size:36px; }
          .fh-actions { flex-direction:column; }
          .fh-button { width:100%; }
          .fh-row { grid-template-columns:1fr; gap:4px; }
        }
      `}</style>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section className="fh-shell">
        <div className="fh-hero" data-demo-anchor="demo-fh-promise">
          <div className="fh-panel">
            <div className="fh-kicker">For funeral homes</div>
            <h1 className="fh-title">A calmer way to keep families and staff aligned.</h1>
            <p className="fh-lede">
              Passage gives your funeral home a private operating workspace for family requests, staff ownership, approved updates, and proof. Families get clarity. Staff get one queue. Directors get a reliable case record without replacing the systems they already use.
            </p>
            <div className="fh-actions">
              <a href={calendlyUrl({ source: 'Funeral home walkthrough' })} target="_blank" rel="noreferrer" onClick={() => trackEvent('funeral_home_cta_clicked', { label: 'Book walkthrough' })} className="fh-button fh-primary">Book walkthrough</a>
              <Link href="/funeral-home/pilot-proof" onClick={() => trackEvent('funeral_home_cta_clicked', { label: 'Open sample case', href: '/funeral-home/pilot-proof' })} className="fh-button fh-sample">Open sample case</Link>
              <Link href="/funeral-home/login" onClick={() => trackEvent('funeral_home_cta_clicked', { label: 'Director sign in', href: '/funeral-home/login' })} className="fh-button fh-secondary">Director sign in</Link>
              <Link href="/funeral-home/staff" onClick={() => trackEvent('funeral_home_cta_clicked', { label: 'Staff sign in', href: '/funeral-home/staff' })} className="fh-button fh-secondary">Staff sign in</Link>
            </div>
            <div className="fh-note">For funeral-home owners, directors, arrangers, and staff who need fewer repeat calls and clearer case ownership.</div>
            {error && <div style={{ marginTop: 14, background: '#fdf3f3', border: `1px solid ${C.rose}33`, borderRadius: 12, padding: 11, color: C.rose, fontSize: 12.5, fontWeight: 800 }}>{error}</div>}
          </div>

          <div className="fh-panel">
            <div className="fh-kicker">What opens first</div>
            <h2 style={{ fontSize: 24, lineHeight: 1.1, margin: '6px 0 0', fontWeight: 400 }}>The next case, owner, waiting point, and proof.</h2>
            <div className="fh-case">
              <div className="fh-case-head">
                <b>Price family arrangement</b>
                <span className="fh-pill">Waiting on family</span>
              </div>
              <div className="fh-row">
                <div className="fh-row-label">Owner</div>
                <div className="fh-row-value">Maria, arranger</div>
              </div>
              <div className="fh-row">
                <div className="fh-row-label">Next</div>
                <div className="fh-row-value">Confirm cemetery plot details and review the prepared family update.</div>
              </div>
              <div className="fh-row">
                <div className="fh-row-label">Proof</div>
                <div className="fh-row-value">Hospital release saved. Family request drafted. Export packet ready.</div>
              </div>
            </div>
            <div style={{ color: C.mid, fontSize: 12.8, lineHeight: 1.45 }}>
              The point is simple: every case should say what is happening, who owns it, what is waiting, and what proof exists.
            </div>
          </div>
        </div>

        <section className="fh-section">
          <div className="fh-section-head">
            <div>
              <div className="fh-kicker">Why teams use it</div>
              <h2>Less chasing. Better handoffs. Cleaner records.</h2>
            </div>
            <p>Passage is not a public directory and it is not a replacement for your case-management system. It is the family coordination layer that keeps people, tasks, updates, and proof from scattering.</p>
          </div>
          <div className="fh-outcomes">
            {outcomes.map(([title, body]) => (
              <div className="fh-card" key={title}>
                <b>{title}</b>
                <span>{body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="fh-section" aria-labelledby="fh-case-flow">
          <div className="fh-section-head">
            <div>
              <div className="fh-kicker">Case workflow</div>
              <h2 id="fh-case-flow">What happens inside a real case.</h2>
            </div>
            <p>The workflow is built for funeral-home operations: one case, one owner, one waiting point, one approved family update, and one proof trail.</p>
          </div>
          <div className="fh-steps">
            {operatingSteps.map(([number, title, body]) => (
              <div className="fh-step" key={title}>
                <div className="fh-step-number">{number}</div>
                <b>{title}</b>
                <span>{body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="fh-section">
          <div className="fh-section-head">
            <div>
              <div className="fh-kicker">Plans</div>
              <h2>Start with a guided rollout.</h2>
            </div>
            <p>Use a small set of real cases first. Once your team trusts the workflow, expand locations, seats, and reporting.</p>
          </div>
          <div className="fh-plans">
            {plans.map(([name, price, pilot, detail], index) => {
              const planId = planForTier(index);
              return (
                <div className="fh-plan" key={name}>
                  <div>
                    <div className="fh-kicker">{name}</div>
                    <div className="fh-plan-price">{pilot || price}</div>
                    {pilot && <div className="fh-plan-pilot">then {price}</div>}
                    <div className="fh-plan-detail">{detail}</div>
                  </div>
                  <Link
                    href={contactHref(planId)}
                    onClick={(event) => {
                      trackEvent('funeral_home_plan_cta_clicked', { planId, signedIn: Boolean(user) });
                      if (!user) return;
                      event.preventDefault();
                      startCheckout(planId);
                    }}
                    className={index === 0 ? 'fh-button fh-primary' : 'fh-button fh-secondary'}
                  >
                    {busy === planId ? 'Starting...' : index === 0 ? 'Start pilot' : 'Talk through plan'}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
