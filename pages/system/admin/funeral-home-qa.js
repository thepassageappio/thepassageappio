import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#fff',
  ink: '#1a1916',
  mid: '#6a6560',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  amber: '#b07d2e',
  amberFaint: '#fdf8ee',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
};

const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSystemAdmin(user) {
  return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email));
}

const qaRoutes = [
  {
    persona: 'Prospect funeral director',
    route: '/funeral-home',
    promise: 'Understands operational relief and knows whether to open the sample console or book a walkthrough.',
    pass: [
      'First viewport says fewer repeated calls, clearer owners, visible proof, approved handoffs, and export.',
      'Primary actions are sample console, book walkthrough, director sign-in, and staff sign-in.',
      'No internal admin, roadmap, smoke-test, scaffold, or QA language appears publicly.',
      'Sample console opens without login and does not leak owner-only controls.',
    ],
    evidence: ['First viewport screenshot', 'Sample-console CTA result', 'Booking CTA result'],
    priority: 'P0',
  },
  {
    persona: 'Funeral-home director',
    route: '/funeral-home/dashboard?demo=1&persona=fh-director&demoTour=funeral-home&demoStep=dashboard',
    promise: 'Runs today from My Day: next case, waiting items, coverage, family requests, proof, and reports.',
    pass: [
      'Director identifies the recommended next case in under 10 seconds.',
      'Case pane shows family handoff context before work-card clutter.',
      'Director can assign work to staff and see the owner change.',
      'Reviewed family update cannot leave without clear approval/proof state.',
      'Completed or waiting work leaves proof and drops out of active attention.',
    ],
    evidence: ['My Day screenshot', 'Selected case screenshot', 'Work owner/proof screenshot', 'Reports/export screenshot'],
    priority: 'P0',
  },
  {
    persona: 'Funeral-home employee',
    route: '/funeral-home/dashboard?demo=1&persona=fh-employee&demoTour=funeral-home&demoStep=task&role=staff',
    promise: 'Sees assigned work only and can act without learning the director workspace.',
    pass: [
      'Assigned work appears first, not owner/admin clutter.',
      'Work card shows ask, owner, waiting point, proof destination, and notification state.',
      'Waiting requires a meaningful waiting reason.',
      'Handled requires proof or detail.',
      'The saved state is visible immediately after action.',
    ],
    evidence: ['Staff queue screenshot', 'Work action screenshot', 'Post-save screenshot'],
    priority: 'P0',
  },
  {
    persona: 'Family coordinator',
    route: '/urgent?demo=1&persona=red-family',
    promise: 'A grieving user sees what to do now and what can wait.',
    pass: [
      'Urgent path starts with immediate stabilization, not abstract setup.',
      'Pronouncement, who is present, funeral-home readiness, authority, owner, waiting point, and next update are visible.',
      'Family can approve updates or assign help without losing proof trail.',
      'Product language never implies unreviewed automatic sends.',
    ],
    evidence: ['Urgent stabilization screenshot', 'Estate spine waiting/proof screenshot', 'Notification awareness screenshot'],
    priority: 'P0',
  },
  {
    persona: 'Participant/helper',
    route: '/participating?demo=1&persona=participant&demoTour=funeral-home&demoStep=participant',
    promise: 'Completes one scoped request in under one minute.',
    pass: [
      'Participant understands the request in under 10 seconds.',
      'Participant can respond, mark waiting, or leave proof without seeing full estate.',
      'Saved note or proof remains visible immediately.',
      'Missing scope or expired link state is warm and clear.',
    ],
    evidence: ['Scoped request screenshot', 'Response/proof screenshot'],
    priority: 'P0',
  },
  {
    persona: 'Vendor/local support',
    route: '/vendors/request?demo=1&persona=vendor&demoTour=funeral-home&demoStep=vendor',
    promise: 'Coordinates outside support without exposing family records.',
    pass: [
      'Vendor sees only scoped request context.',
      'Timing, location, obligation, quote, payment state, and contact boundary are clear.',
      'Vendor can quote, decline, update status, or mark completion proof.',
      'Family/funeral-home can see status change without exposing full record.',
    ],
    evidence: ['Vendor request screenshot', 'Quote/payment/status screenshot'],
    priority: 'P1',
  },
  {
    persona: 'System admin',
    route: '/system/admin/saas-roadmap',
    promise: 'Founder can operate readiness, revenue, CRM health, abuse controls, and sprint signoff from one control room.',
    pass: [
      'Roadmap names ARR target, active sprint, owner, acceptance criteria, and next action.',
      'Rate-limit readiness names wired and unwired protections.',
      'Pilot health names account stage, blocker, next action, and ARR gap.',
      'Conversion Plan names ask-ready accounts, target plan, ARR impact, blocked asks, and the next paid conversion action.',
      'Partner Checkout Readiness names Stripe price, pilot discount, webhook, auth, metadata, and billing mirror status before paid asks scale.',
      'Automation Readiness Readiness names task assignment, waiting hygiene, blockers, stale work, proof gaps, delivery telemetry, and reminder runtime status.',
      'Production reset is disabled, removed, or two-party gated once real customer data exists.',
    ],
    evidence: ['Roadmap screenshot', 'Rate-limit readiness result', 'Pilot-health result', 'Conversion-plan result', 'Partner-checkout-readiness result', 'Automation-spine-readiness result'],
    priority: 'P0',
  },
];

const viewportChecks = ['1440px desktop', '1280px laptop', '900px tablet-ish', '390px mobile'];
const launchBlockers = [
  'Sample console needs founder narration to make ROI clear.',
  'Staff workspace shows director/admin clutter instead of assigned work first.',
  'Handled or waiting states can be saved without meaningful detail.',
  'Family update, reminder, vendor update, or work assignment can send repeatedly without throttling.',
  'HubSpot cannot show funeral-home lead or pilot stage.',
  'Stripe live webhook readiness is unknown for paid partner conversion.',
  'Proof-ready pilots do not have a named paid conversion ask, target plan, and ARR impact.',
  'Partner checkout readiness is blocked or unknown before paid conversion asks.',
  'Automation readiness is blocked or unknown before pilots expand.',
  'Public pages imply HIPAA, SOC 1, SOC 2, legal, payment, or SMS readiness before review.',
  'Production reset can remove real customer, lead, estate, vendor, or partner records.',
];

export default function FuneralHomeQaPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const admin = useMemo(() => isSystemAdmin(user), [user]);

  async function signIn() {
    if (!supabase || typeof window === 'undefined') return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  if (loading) {
    return <Shell user={user}><Panel>Loading funeral-home QA...</Panel></Shell>;
  }

  if (!admin) {
    return (
      <Shell user={user}>
        <Panel>
          <div style={eyebrow}>Owner-only QA</div>
          <h1 style={h1}>This checklist is restricted.</h1>
          <p style={lead}>Sign in with the Passage owner account to run funeral-home QA.</p>
          <button onClick={signIn} style={primaryButton}>Sign in</button>
        </Panel>
      </Shell>
    );
  }

  return (
    <Shell user={user} onSignOut={signOut}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={eyebrow}>System admin / funeral-home QA</div>
          <h1 style={h1}>Prove the funeral-home loop is flawless enough for pilots.</h1>
          <p style={lead}>Run this checklist before every funeral-home demo, pilot invite, or release touching funeral-home setup, staff work, work cards, notifications, exports, vendors, or family updates.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/system/admin/saas-roadmap" style={secondaryLink}>SaaS roadmap</Link>
          <Link href="/system/admin/automation-spine-readiness" style={secondaryLink}>Automation Readiness</Link>
          <Link href="/system/admin" style={secondaryLink}>System Admin</Link>
        </div>
      </div>

      <Panel tone="sage">
        <div style={eyebrow}>Success standard</div>
        <h2 style={h2}>Director and employee can complete the core loop without narration.</h2>
        <div style={grid}>
          {['Open sample console', 'See My Day', 'Inspect case context', 'Resolve coverage', 'Move work with proof', 'Preview family update', 'See delivery trail', 'Export/report status', 'Know next account step'].map(item => (
            <div key={item} style={miniCard}>{item}</div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div style={eyebrow}>Persona scripts</div>
        <h2 style={h2}>Run every role as a real user.</h2>
        <div style={{ display: 'grid', gap: 14 }}>
          {qaRoutes.map(item => <QaCard key={item.persona} item={item} />)}
        </div>
      </Panel>

      <Panel>
        <div style={eyebrow}>Viewport matrix</div>
        <h2 style={h2}>Every primary action must survive these widths.</h2>
        <div style={grid}>{viewportChecks.map(item => <div key={item} style={miniCard}>{item}</div>)}</div>
      </Panel>

      <Panel tone="sage">
        <div style={eyebrow}>Launch blockers</div>
        <h2 style={h2}>Do not expand pilots if any of these are true.</h2>
        <ul style={ul}>{launchBlockers.map(item => <li key={item}>{item}</li>)}</ul>
      </Panel>
    </Shell>
  );
}

function Shell({ children, user, onSignOut }) {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader user={user} onSignOut={onSignOut} />
      <section style={wrap}>{children}</section>
      <SiteFooter />
    </main>
  );
}

function Panel({ children, tone = 'default' }) {
  return <section style={{ background: tone === 'sage' ? C.sageFaint : C.card, border: '1px solid ' + (tone === 'sage' ? '#c8deca' : C.border), borderRadius: 18, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.04)', marginTop: 18 }}>{children}</section>;
}

function QaCard({ item }) {
  return (
    <div style={subPanel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={eyebrow}>{item.persona}</div>
          <h3 style={h3}>{item.promise}</h3>
        </div>
        <span style={item.priority === 'P0' ? riskPill : plannedPill}>{item.priority}</span>
      </div>
      <Link href={item.route} style={primaryLink}>Open route</Link>
      <TwoColumnList leftTitle="Pass criteria" left={item.pass} rightTitle="Evidence" right={item.evidence} />
    </div>
  );
}

function TwoColumnList({ leftTitle, left, rightTitle, right }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 12 }}>
      <div style={innerPanel}><div style={eyebrow}>{leftTitle}</div><ul style={ul}>{left.map(item => <li key={item}>{item}</li>)}</ul></div>
      <div style={innerPanel}><div style={eyebrow}>{rightTitle}</div><ul style={ul}>{right.map(item => <li key={item}>{item}</li>)}</ul></div>
    </div>
  );
}

const wrap = { maxWidth: 1180, margin: '0 auto', padding: '42px 18px 80px' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 12 };
const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 50, lineHeight: 1.04, margin: '8px 0 10px', fontWeight: 400, maxWidth: 880 };
const h2 = { fontSize: 28, lineHeight: 1.12, margin: '8px 0 10px', fontWeight: 400 };
const h3 = { color: C.ink, fontSize: 21, lineHeight: 1.15, margin: '6px 0 0', fontWeight: 900, maxWidth: 720 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 790 };
const subPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14 };
const innerPanel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 12 };
const miniCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 12, color: C.ink, fontWeight: 900, fontSize: 14 };
const ul = { margin: '8px 0 0', paddingLeft: 18, color: C.mid, fontSize: 13, lineHeight: 1.45 };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', marginTop: 16 };
const primaryLink = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 42, padding: '0 14px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginTop: 12 };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 44, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
const plannedPill = { background: C.amberFaint, color: C.amber, border: '1px solid #ead8b8', borderRadius: 999, padding: '6px 9px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
const riskPill = { background: C.roseFaint, color: C.rose, border: '1px solid #efc7c7', borderRadius: 999, padding: '6px 9px', fontSize: 12, fontWeight: 900, height: 'fit-content' };