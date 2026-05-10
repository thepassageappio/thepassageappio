import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';

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
  roseFaint: '#fdf3f3',
  amber: '#a97832',
  amberFaint: '#fbf5e8',
};

const tiers = [
  ['Pilot', '$99.99/mo', '$0 for 3 months', '10 active cases, co-branded family view, partner dashboard'],
  ['Local', '$249.99/mo', '', 'Unlimited active cases, act-on-behalf, staff seats, proof trail'],
  ['Group', '$349.99/mo', '', 'Locations, reporting, approved family handoffs, priority onboarding'],
];

function planForTier(index) {
  return index === 0 ? 'partner_pilot' : index === 1 ? 'partner_local' : 'partner_group';
}

function contactHref(planId) {
  return '/contact?category=Funeral%20home%20pilot&plan=' + encodeURIComponent(planId);
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
        .fh-shell { max-width:980px; margin:0 auto; padding:0 28px 6px; }
        .fh-hero { display:grid; grid-template-columns:minmax(0,1fr) minmax(300px,.55fr); gap:16px; align-items:center; padding:2px 0 8px; }
        .fh-kicker { color:${C.sage}; font-size:9.5px; letter-spacing:.17em; text-transform:uppercase; font-weight:900; margin-bottom:6px; }
        .fh-title { font-size:clamp(31px,3.15vw,40px); line-height:.98; margin:0 0 8px; font-weight:400; letter-spacing:0; max-width:560px; }
        .fh-lede { color:${C.mid}; font-size:13.2px; line-height:1.36; max-width:540px; margin:0; }
        .fh-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
        .fh-button { min-height:40px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; padding:0 13px; font-weight:900; text-decoration:none; font-family:inherit; cursor:pointer; font-size:12.5px; }
        .fh-primary { background:${C.ink}; color:white; border:1px solid ${C.ink}; }
        .fh-secondary { background:${C.card}; color:${C.sageDark}; border:1px solid ${C.sageLight}; }
        .fh-note { color:${C.soft}; font-size:11px; line-height:1.3; margin-top:7px; }
        .fh-panel { background:${C.card}; border:1px solid ${C.border}; border-radius:17px; padding:12px; box-shadow:0 12px 34px rgba(55,45,35,.06); }
        .fh-panel h2 { font-size:19px; line-height:1.08; margin:0 0 8px; font-weight:400; }
        .fh-case { background:${C.sageFaint}; border:1px solid ${C.sageLight}; border-radius:13px; padding:9px; margin-bottom:7px; }
        .fh-case-title { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; margin-bottom:7px; }
        .fh-case-title b { font-size:15px; line-height:1.12; }
        .fh-pill { border-radius:999px; padding:3px 7px; background:${C.card}; color:${C.sageDark}; border:1px solid ${C.sageLight}; font-size:10px; font-weight:900; white-space:nowrap; }
        .fh-row { display:grid; grid-template-columns:76px minmax(0,1fr); gap:8px; padding:4px 0; border-top:1px solid ${C.sageLight}; }
        .fh-row-label { color:${C.sageDark}; font-size:9px; letter-spacing:.11em; text-transform:uppercase; font-weight:900; }
        .fh-row-value { color:${C.mid}; font-size:11.4px; line-height:1.25; }
        .fh-proof { border-top:1px solid ${C.border}; padding-top:8px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
        .fh-proof-card { background:${C.card}; border:1px solid ${C.border}; border-radius:13px; padding:9px 10px; min-height:66px; }
        .fh-proof-card b { display:block; color:${C.ink}; font-size:13.5px; margin-bottom:4px; }
        .fh-proof-card span { color:${C.mid}; font-size:11.2px; line-height:1.26; }
        .fh-pilot { margin-top:8px; background:${C.sageFaint}; border:1px solid ${C.sageLight}; border-radius:17px; padding:10px 12px; display:grid; grid-template-columns:minmax(0,.7fr) minmax(360px,1fr); gap:16px; align-items:center; }
        .fh-plan { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:10px; align-items:center; padding:4px 0; border-bottom:1px solid ${C.sageLight}; }
        .fh-plan:last-child { border-bottom:none; }
        .fh-plan-name { color:${C.ink}; font-size:13.2px; }
        .fh-plan-detail { color:${C.mid}; font-size:10.8px; line-height:1.25; margin-top:1px; }
        @media (max-width:760px) {
          .fh-shell { padding:12px 18px 42px; }
          .fh-hero, .fh-pilot, .fh-proof { grid-template-columns:1fr; min-height:auto; }
          .fh-hero { gap:22px; }
          .fh-actions { flex-direction:column; }
          .fh-button { width:100%; }
          .fh-row { grid-template-columns:1fr; gap:4px; }
        }
      `}</style>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section className="fh-shell">
        <div className="fh-hero">
          <div>
            <div className="fh-kicker">For funeral homes</div>
            <h1 className="fh-title">A calmer family layer on top of the work you already do.</h1>
            <p className="fh-lede">
              Passage gives families one shared command center while your team keeps cases moving: fewer repeated calls, clearer owners, visible proof, approved handoffs, and clean export back to your existing workflow.
            </p>
            <div className="fh-actions">
              <Link href="/funeral-home/dashboard" className="fh-button fh-primary">Open partner workspace</Link>
              <Link href="/contact?category=Funeral%20home%20walkthrough" className="fh-button fh-secondary">Book a pilot walkthrough</Link>
            </div>
            <div className="fh-note">Passage does not replace your case system. It coordinates the humans around it.</div>
            {error && <div style={{ marginTop: 14, background: C.roseFaint, border: `1px solid ${C.rose}33`, borderRadius: 12, padding: 11, color: C.rose, fontSize: 12.5, fontWeight: 800 }}>{error}</div>}
          </div>

          <div className="fh-panel">
            <div className="fh-kicker">Monday morning view</div>
            <h2>What needs attention, without another status call.</h2>
            <div className="fh-case">
              <div className="fh-case-title">
                <b>Price family arrangement</b>
                <span className="fh-pill">Waiting on family</span>
              </div>
              <div className="fh-row">
                <div className="fh-row-label">Owner</div>
                <div className="fh-row-value">Maria, arranger</div>
              </div>
              <div className="fh-row">
                <div className="fh-row-label">Next</div>
                <div className="fh-row-value">Confirm cemetery plot details and approve the family update.</div>
              </div>
              <div className="fh-row">
                <div className="fh-row-label">Proof</div>
                <div className="fh-row-value">Hospital release saved. Family message prepared. CSV export ready.</div>
              </div>
            </div>
            <div style={{ color: C.mid, fontSize: 12, lineHeight: 1.38 }}>
              Directors see the floor. Staff see their queue. Families see only what helps them move through the next step.
            </div>
          </div>
        </div>

        <section className="fh-proof">
          {[
            ['Fewer repeated calls', 'Families see what is waiting, who owns it, and what has already been handled.'],
            ['Warm family handoffs', 'When a family starts in Passage first, they can save your home or ask for help choosing. Nothing is sent without approval.'],
            ['Proof that travels', 'Updates, dates, messages, and proof can export back to the systems you already use.'],
          ].map(([title, body]) => (
            <div className="fh-proof-card" key={title}>
              <b>{title}</b>
              <span>{body}</span>
            </div>
          ))}
        </section>

        <section className="fh-pilot">
          <div>
            <div className="fh-kicker">Pilot</div>
            <h2 style={{ fontSize: 'clamp(20px,2.2vw,25px)', lineHeight: 1.03, margin: '0 0 6px', fontWeight: 400 }}>Start with a few real cases.</h2>
            <p style={{ color: C.mid, fontSize: 12, lineHeight: 1.32, margin: 0 }}>
              We help set up the workspace, load a small case set, move one family-facing task, and show how a family-approved handoff carries context into your case pane before you expand.
            </p>
          </div>
          <div>
            {tiers.map(([name, price, pilot, detail], index) => {
              const planId = planForTier(index);
              return (
                <div className="fh-plan" key={name}>
                  <div>
                    <div className="fh-plan-name">
                      {name}{' '}
                      <span style={{ color: index === 0 ? C.rose : C.sageDark, fontSize: 13, fontWeight: 900 }}>
                        {pilot || price}
                      </span>
                      {pilot && <span style={{ color: C.soft, fontSize: 12, textDecoration: 'line-through', marginLeft: 6 }}>{price}</span>}
                    </div>
                    <div className="fh-plan-detail">{detail}</div>
                  </div>
                  <Link
                    href={contactHref(planId)}
                    onClick={(event) => {
                      if (!user) return;
                      event.preventDefault();
                      startCheckout(planId);
                    }}
                    style={{ background: index === 0 ? C.rose : C.sage, color: '#fff', borderRadius: 10, padding: '7px 10px', fontWeight: 900, fontSize: 11.5, textDecoration: 'none' }}
                  >
                    {busy === planId ? '...' : 'Start'}
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
