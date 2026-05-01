import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader, SiteFooter } from '../../components/SiteChrome';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const C = { bg: '#f6f3ee', card: '#fffdf9', ink: '#1a1916', mid: '#6a6560', soft: '#9a9288', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#eef5ef', rose: '#c47a7a', roseFaint: '#fdf3f3', amber: '#a97832', amberFaint: '#fbf5e8' };

const needs = [
  ['Fewer repeated calls', 'Families can see what is waiting, who owns it, and what your staff already handled.'],
  ['Cleaner first intake', 'A family can arrive with the funeral prep summary instead of scattered notes and missing details.'],
  ['Act on behalf', 'Directors can mark partner-ready work in progress, request family info, or close it with a visible audit trail.'],
  ['Better handoffs', 'Staff see the case story: service details, family contact, proof, waiting items, and blocked tasks.'],
];

const workflow = [
  ['Create case', 'Add the family, deceased name, date, coordinator, and service reference.'],
  ['Guide family', 'Share the family command center or use it during arrangement calls.'],
  ['Move work', 'Handle certificates, service details, obituary review, cemetery, and provider coordination.'],
  ['Show proof', 'Families see sent, waiting, confirmed, handled, and needs-family-info states.'],
];

const tiers = [
  ['Pilot', '$99/mo', 'For one location testing Passage with real cases.', '10 active cases, co-branded family view, partner dashboard'],
  ['Local', '$249/mo', 'For a busy independent home.', 'Unlimited active cases, act-on-behalf, staff seats, proof trail'],
  ['Group', '$399/mo', 'For multi-location teams.', 'Locations, reporting, lead capture, priority onboarding'],
];

export default function FuneralHomePage() {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
  }, []);

  async function signIn() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/funeral-home/dashboard' } });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function startCheckout(planId) {
    setError('');
    if (!user) {
      await signIn();
      return;
    }
    setBusy(planId);
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
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '16px 22px 38px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .9fr) minmax(320px, .7fr)', gap: 14, alignItems: 'stretch', marginBottom: 12 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: '24px 26px' }}>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 9 }}>For funeral homes</div>
            <h1 style={{ fontSize: 'clamp(34px, 4.8vw, 60px)', lineHeight: .96, margin: '0 0 13px', fontWeight: 400 }}>
              A quieter family command center for every case.
            </h1>
            <p style={{ color: C.mid, fontSize: 15, lineHeight: 1.62, maxWidth: 720, margin: '0 0 18px' }}>
              Passage helps directors reduce phone-tag, collect cleaner family information, and show families what is being handled without adding another complicated system.
            </p>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <Link href="/funeral-home/dashboard" style={{ background: C.sage, color: '#fff', borderRadius: 12, padding: '11px 16px', textDecoration: 'none', fontWeight: 900, fontSize: 13 }}>Open partner dashboard</Link>
              <button onClick={() => startCheckout('partner_pilot')} style={{ background: C.rose, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 16px', fontWeight: 900, fontSize: 13, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>{busy === 'partner_pilot' ? 'Opening...' : 'Start pilot -> $99/mo'}</button>
            </div>
            {error && <div style={{ marginTop: 12, background: C.roseFaint, border: `1px solid ${C.rose}33`, borderRadius: 12, padding: 11, color: C.rose, fontSize: 12.5, fontWeight: 800 }}>{error}</div>}
          </div>

          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 24, padding: 22, display: 'grid', alignContent: 'center', gap: 11 }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Why this fits the job</div>
            <div style={{ fontSize: 30, lineHeight: 1.08 }}>Families need care. Staff need fewer loose ends.</div>
            <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.58, margin: 0 }}>
              Funeral service is communication-heavy, staff-constrained, and full of paperwork handoffs. Passage keeps the family-facing work visible without asking directors to become software administrators.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 12 }}>
          {needs.map(([title, body]) => (
            <div key={title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 15 }}>
              <div style={{ color: C.sage, fontSize: 10.3, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 7 }}>{title}</div>
              <div style={{ color: C.mid, fontSize: 13.2, lineHeight: 1.52 }}>{body}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .72fr) minmax(340px, .78fr)', gap: 12, marginBottom: 12 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 18 }}>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 8 }}>Partner workflow</div>
            <div style={{ display: 'grid', gap: 9 }}>
              {workflow.map(([title, body], i) => (
                <div key={title} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 999, background: C.sageFaint, border: `1px solid ${C.sage}22`, color: C.sage, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 900 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 16, lineHeight: 1.2 }}>{title}</div>
                    <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.5, marginTop: 2 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 18 }}>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 8 }}>How funeral homes pay</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {tiers.map(([name, price, body, detail], i) => (
                <div key={name} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'center', background: i === 0 ? C.roseFaint : C.sageFaint, border: `1px solid ${i === 0 ? C.rose : C.sage}22`, borderRadius: 14, padding: 12 }}>
                  <div>
                    <div style={{ fontSize: 17 }}>{name} <span style={{ color: i === 0 ? C.rose : C.sage, fontSize: 13, fontWeight: 900 }}>{price}</span></div>
                    <div style={{ color: C.mid, fontSize: 12.8, lineHeight: 1.45, marginTop: 2 }}>{body}</div>
                    <div style={{ color: C.soft, fontSize: 11.5, lineHeight: 1.4, marginTop: 3 }}>{detail}</div>
                  </div>
                  <button onClick={() => startCheckout(i === 0 ? 'partner_pilot' : i === 1 ? 'partner_local' : 'partner_group')} style={{ background: i === 0 ? C.rose : C.sage, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 10px', fontWeight: 900, fontFamily: 'Georgia,serif', cursor: 'pointer', fontSize: 12 }}>{busy ? '...' : 'Start'}</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, lineHeight: 1.18 }}>Separate module. Same proof engine.</div>
            <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.58, marginTop: 3 }}>
              The partner workflow does not disturb red path, green path, or participants. It layers funeral-home staff permissions over the same estate, task, status, and audit records.
            </div>
          </div>
          <Link href="/contact" style={{ color: C.sage, border: `1px solid ${C.border}`, background: C.card, borderRadius: 12, padding: '10px 14px', textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>Talk to Passage</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
