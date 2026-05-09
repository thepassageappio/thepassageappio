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

const operatingLoop = [
  ['Create or import', 'Start with the family contact, case reference, location, and service context.'],
  ['Assign ownership', 'Directors, staff, participants, vendors, and family helpers each see the work meant for them.'],
  ['Move one task', 'Every item has a next action, waiting state, proof request, and visible owner.'],
  ['Export the record', 'Case data, proof, dates, and tasks can leave Passage when the work needs to move.'],
];

const metrics = [
  ['Waiting items', 'What needs family, staff, or partner response'],
  ['Calls avoided', 'Repeated status calls reduced by visible state'],
  ['Staff queue', 'Each employee sees the work they own'],
  ['Proof trail', 'Sent, waiting, confirmed, handled, and exported'],
];

const tiers = [
  ['Pilot', '$99.99/mo', '$0 for 3 months', '10 active cases, co-branded family view, partner dashboard'],
  ['Local', '$249.99/mo', '', 'Unlimited active cases, act-on-behalf, staff seats, proof trail'],
  ['Group', '$349.99/mo', '', 'Locations, reporting, lead capture, priority onboarding'],
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
        .fh-shell { max-width:1120px; margin:0 auto; padding:26px 28px 70px; }
        .fh-hero { min-height:calc(100vh - 180px); display:grid; grid-template-columns:minmax(0,1.02fr) minmax(340px,.72fr); gap:42px; align-items:center; }
        .fh-kicker { color:${C.sage}; font-size:11px; letter-spacing:.18em; text-transform:uppercase; font-weight:900; margin-bottom:14px; }
        .fh-title { font-size:clamp(44px,5.8vw,74px); line-height:.98; margin:0 0 18px; font-weight:400; letter-spacing:0; }
        .fh-lede { color:${C.mid}; font-size:18px; line-height:1.62; max-width:680px; margin:0; }
        .fh-actions { display:flex; gap:12px; flex-wrap:wrap; margin-top:28px; }
        .fh-button { min-height:54px; border-radius:14px; display:inline-flex; align-items:center; justify-content:center; padding:0 20px; font-weight:900; text-decoration:none; font-family:inherit; cursor:pointer; }
        .fh-primary { background:${C.ink}; color:white; border:1px solid ${C.ink}; }
        .fh-secondary { background:${C.card}; color:${C.sageDark}; border:1px solid ${C.sageLight}; }
        .fh-note { color:${C.soft}; font-size:13px; line-height:1.55; margin-top:14px; }
        .fh-panel { background:${C.card}; border:1px solid ${C.border}; border-radius:24px; padding:24px; box-shadow:0 22px 70px rgba(55,45,35,.08); }
        .fh-panel h2 { font-size:30px; line-height:1.08; margin:0 0 14px; font-weight:400; }
        .fh-case { background:${C.sageFaint}; border:1px solid ${C.sageLight}; border-radius:18px; padding:16px; margin-bottom:12px; }
        .fh-case-title { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:12px; }
        .fh-case-title b { font-size:19px; line-height:1.18; }
        .fh-pill { border-radius:999px; padding:5px 9px; background:${C.card}; color:${C.sageDark}; border:1px solid ${C.sageLight}; font-size:11px; font-weight:900; white-space:nowrap; }
        .fh-row { display:grid; grid-template-columns:118px minmax(0,1fr); gap:12px; padding:10px 0; border-top:1px solid ${C.sageLight}; }
        .fh-row-label { color:${C.sageDark}; font-size:11px; letter-spacing:.12em; text-transform:uppercase; font-weight:900; }
        .fh-row-value { color:${C.mid}; font-size:13.5px; line-height:1.45; }
        .fh-band { border-top:1px solid ${C.border}; padding-top:38px; margin-top:24px; }
        .fh-band-grid { display:grid; grid-template-columns:minmax(0,.82fr) minmax(0,1fr); gap:38px; align-items:start; }
        .fh-band h2 { font-size:clamp(31px,3.8vw,46px); line-height:1.04; margin:0 0 12px; font-weight:400; }
        .fh-band p { color:${C.mid}; font-size:15.5px; line-height:1.65; margin:0; }
        .fh-loop { display:grid; grid-template-columns:34px minmax(0,1fr); gap:13px; padding:15px 0; border-bottom:1px solid ${C.border}; }
        .fh-loop:last-child { border-bottom:none; }
        .fh-num { width:32px; height:32px; border-radius:50%; background:${C.sageFaint}; color:${C.sageDark}; display:inline-flex; align-items:center; justify-content:center; font-size:13px; font-weight:900; }
        .fh-loop b { display:block; color:${C.ink}; font-size:18px; margin-bottom:4px; }
        .fh-loop span { color:${C.mid}; font-size:13.8px; line-height:1.55; }
        .fh-metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-top:30px; }
        .fh-metric { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; padding:16px; }
        .fh-metric b { display:block; color:${C.ink}; font-size:17px; margin-bottom:6px; }
        .fh-metric span { color:${C.mid}; font-size:13px; line-height:1.48; }
        .fh-pilot { margin-top:36px; background:${C.sageFaint}; border:1px solid ${C.sageLight}; border-radius:24px; padding:24px; display:grid; grid-template-columns:minmax(0,1fr) minmax(280px,.74fr); gap:24px; align-items:center; }
        .fh-plan { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:center; padding:12px 0; border-bottom:1px solid ${C.sageLight}; }
        .fh-plan:last-child { border-bottom:none; }
        .fh-plan-name { color:${C.ink}; font-size:17px; }
        .fh-plan-detail { color:${C.mid}; font-size:12.5px; line-height:1.45; margin-top:3px; }
        @media (max-width:760px) {
          .fh-shell { padding:18px 18px 54px; }
          .fh-hero, .fh-band-grid, .fh-pilot { grid-template-columns:1fr; min-height:auto; }
          .fh-hero { gap:22px; }
          .fh-actions { flex-direction:column; }
          .fh-button { width:100%; }
          .fh-row { grid-template-columns:1fr; gap:4px; }
          .fh-metrics { grid-template-columns:1fr; }
        }
      `}</style>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section className="fh-shell">
        <div className="fh-hero">
          <div>
            <div className="fh-kicker">For funeral homes</div>
            <h1 className="fh-title">A calmer family layer on top of the work you already do.</h1>
            <p className="fh-lede">
              Passage gives families one shared command center while your team keeps cases moving: fewer repeated calls, clearer owners, visible proof, and clean export back to your existing workflow.
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
            <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55 }}>
              Directors see the floor. Staff see their queue. Families see only what helps them move through the next step.
            </div>
          </div>
        </div>

        <section className="fh-band">
          <div className="fh-band-grid">
            <div>
              <div className="fh-kicker">Operating loop</div>
              <h2>Set up once. Reuse the spine on every case.</h2>
              <p>
                Locations, employees, roles, family records, tasks, messages, proof, and reporting all point to the same case story. Passage sits above Passare, Gather, SRS, Tribute, QuickBooks, websites, forms, and contracts.
              </p>
            </div>
            <div>
              {operatingLoop.map(([title, body], index) => (
                <div className="fh-loop" key={title}>
                  <span className="fh-num">{index + 1}</span>
                  <span>
                    <b>{title}</b>
                    <span>{body}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="fh-metrics">
            {metrics.map(([title, body]) => (
              <div className="fh-metric" key={title}>
                <b>{title}</b>
                <span>{body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="fh-pilot">
          <div>
            <div className="fh-kicker">Pilot path</div>
            <h2 style={{ fontSize: 'clamp(28px,3.3vw,40px)', lineHeight: 1.06, margin: '0 0 10px', fontWeight: 400 }}>Start with a few real cases, not a software migration.</h2>
            <p style={{ color: C.mid, fontSize: 15, lineHeight: 1.65, margin: 0 }}>
              We help you set up the organization, employees, roles, and first cases. Your staff can create from the UI or import a CSV when the pilot is ready.
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
                    style={{ background: index === 0 ? C.rose : C.sage, color: '#fff', borderRadius: 11, padding: '9px 12px', fontWeight: 900, fontSize: 12, textDecoration: 'none' }}
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
