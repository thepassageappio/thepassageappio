import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#fff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  amber: '#b07d2e',
  amberFaint: '#fdf8ee',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
};

const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];

const headlineMetrics = [
  ['ARR target', '$300k', 'Owner-only target. Never show this on external pages.'],
  ['Primary buyer', 'Funeral homes', 'B2B operating workflow first; B2C becomes easier once the partner workflow is solid.'],
  ['Revenue wedge', '72-100 accounts', 'Local and group accounts, with services/vendor revenue as upside.'],
  ['North star', 'Proof-ready cases', 'Every account has locations, staff, cases, owners, waiting points, proof, exports, billing, and next action.'],
];

const governanceRules = [
  {
    title: 'One roadmap only',
    body: 'The owner roadmap lives here: /system/admin/saas-roadmap. Do not create a second roadmap tab, public roadmap, demo roadmap, or persona-facing roadmap.',
  },
  {
    title: 'Internal tools stay under System Admin',
    body: 'Roadmap, QA, pilot health, abuse controls, refresh/rate-limit readiness, demo tooling, destructive actions, and internal metrics must be reached from System Admin only.',
  },
  {
    title: 'No internal language on customer surfaces',
    body: 'Public and persona-facing pages must not say ARR, 300k, sprint, founder narration, pilot conversion, QA checklist, internal note, or roadmap.',
  },
  {
    title: 'Every workflow needs an action contract',
    body: 'Before a flow is enterprise-ready it must show the same simple contract: what Passage is doing, what the human should do, who to ask, what proof saves, and what stays private.',
  },
];

const takeaways = [
  ['Public funeral-home page', 'Reworked', 'Removed ARR/pilot-proof sales math from the funeral-home page and reframed it around calmer family/staff coordination.'],
  ['Shared navigation', 'Reworked', 'Removed scattered Roadmap, QA, Pilot health, and Abuse links from the top navigation; public navigation is now audience-led and system routes render a System Admin boundary.'],
  ['Public surface scan', 'Source green', 'Current source exact-search is clean for command center, family task, and coordination spine; customer-facing copy now favors family record, request, dashboard, next step, owner, waiting point, and proof.'],
  ['Live public UAT sweep', 'P0 release routing', 'Latest source deploy 2dd90bb is green in both Vercel production contexts, but www.thepassageapp.io still serves older homepage copy including sample funeral-home console and Spine labels. Treat custom domain, alias, Cloudflare, and cache routing as P0 before LinkedIn promotion, paid pilots, or final persona QA signoff.'],
  ['Persona UAT matrix', 'Source audit active / browser blocked', 'Source-audited funeral-home dashboard/staff/cases, vendor onboard/login/request, participant helper requests, care-provider landing, and admin readiness gates for language clarity, action ownership, waiting point, proof, and privacy boundary. Browser-controlled UAT is still blocked by local Chrome/in-app browser bridge and www remains stale, so final persona signoff is not complete.'],
  ['Task-card and request-card clarity', 'Source hardened / deploy green', 'Shared cards now have a concrete readiness contract: action needed, owner, waiting party, prepared message, status/proof, and privacy boundary. Public/vendor/helper wording favors request, record, owner, waiting point, and proof; participant confirmations now say request instead of task, and vendor/care-provider copy no longer leaks task wording into scoped external requests. Latest green deploy still needs custom-domain verification after www routing is corrected.'],
  ['Form validation UAT', 'Source fixed / live domain stale', 'Vendor onboarding now requires business name, ZIPs, and email before submit state, and care-provider inquiry shows required organization plus email. Recheck live once www points at latest main.'],
  ['Admin session UAT', 'Source fixed / live recheck blocked', 'Admin users now get a visible System Admin entrance from normal signed-in pages. Recheck on www after the correct production domain is pointing at latest main.'],
  ['Release configuration', 'P0 duplicate production targets', 'GitHub reports two Vercel production contexts on each commit: thepassageappio and you-are-working-on-a-production. Middleware now adds X-Passage-Commit and no-store headers for non-static responses; still confirm which project owns www, remove or disable the stray production target, and purge Cloudflare/cache before public promotion.'],
  ['Admin operating model', 'Reworked', 'Internal tools live in the System Admin cabinet with grouped accordions; enterprise readiness now uses task readiness / partner workflow language instead of spine jargon, and no standalone roadmap/QA/admin top-level tabs should exist.'],
  ['Funeral-home product UX', 'Source simplified / deploy green', 'Director/staff dashboard now uses Case at a glance, Recommended next action, action-contract cards, one primary action, one waiting action, collapsed More actions, what Passage prepared, what staff does next, waiting point, proof saves, needs-help wording, family-visible proof, and customer-safe setup/billing language with visible pilot wording removed from the customer dashboard. Authenticated UAT must verify My Day and task cards once browser/domain access is usable.'],
  ['Family, care, and participant UX', 'Source simplified / live domain stale', 'B2C, urgent, planning, hospice/care-prep, and participant requests now favor family record, request, next step, owner, waiting point, and proof. Exact source search is clean for command center and family task; live www must still be rechecked after routing/cache is fixed.'],
  ['Automation layer', 'Source updated / deploy verification pending', 'Timing-aware next-action scoring now feeds funeral-home recommendations; next deploy must browser-verify the visible timing label and why-now reason.'],
  ['Abuse and refresh controls', 'Source green / deploy verification pending', 'Outbound sends, reminders, partner invites, staff invites, prep emails, Google lookups, voice calls, family-update fanout, funeral-home requests, and admin readiness refreshes now have source-level cooldowns, QA-safe email routing, and readiness evidence.'],
];

const sprints = [
  {
    name: 'Sprint 1: Boundary and public clarity',
    status: 'Source green / live domain stale',
    owner: 'Product + QA',
    goal: 'Make it impossible for external users to see owner-only strategy, QA, or admin concepts.',
    tasks: [
      'Keep shared header free of internal tabs; show System Admin only to true admin users and on system routes.',
      'Keep public readiness checks blocking ARR, sprint, roadmap, QA, founder/internal language, command center, family task, and coordination spine.',
      'Audit homepage, funeral-home, urgent, planning, hospice/care-prep, pricing, contact, participants, vendors, and care-provider pages after every deploy; verify the X-Passage-Commit header matches latest main; block launch if www serves older copy than the latest green main deployment.',
      'Move any internal tool discovery into System Admin instead of creating new top-level tabs.',
    ],
    acceptance: 'A prospect sees only the product value, not Passage operating commentary.',
  },
  {
    name: 'Sprint 2: Funeral-home dashboard simplification',
    status: 'Source simplified / live domain stale',
    owner: 'Product + engineering',
    goal: 'Make funeral-home director and staff workflows obvious, calm, and operationally useful.',
    tasks: [
      'Director dashboard becomes My Day, cases needing action, staff load, family updates, exports, billing, and proof.',
      'Staff view shows assigned work first as a simple pattern: what is needed, owner does next, waiting on, status and proof; deeper automation detail stays collapsed until needed.',
      'Remove demo/sales language from logged-in funeral-home operations.',
      'Use staff-facing terms like needs help, stuck point, family can see, earlier step, and where proof saves instead of blocker, dependency, orchestration, or audit-layer wording.',
      'Add recommended next action based on pre-death, day since death, service window, aftercare, needs-help state, stale waiting, and missing proof.',
      'Browser-verify My Day, Case at a glance, Recommended next action, Request family info, Record proof / close, and Mark waiting once Vercel rate limiting clears.',
    ],
    acceptance: 'A funeral director or employee can open one case, know exactly what Passage prepared, what they must do, who is waiting, what the family can see, and where proof saves.',
  },
  {
    name: 'Sprint 3: Automation layer hardening',
    status: 'Source hardening active / live domain verification pending',
    owner: 'Engineering + QA',
    goal: 'Make Passage proactive instead of a passive task list.',
    tasks: [
      'Persist workflow state above task rows: ready, waiting, needs help, stale, proof missing, family update due, aftercare due.',
      'Generate or suggest the next task and draft the right message to the right person.',
      'Fail readiness when owner, waiting point, prepared message route, proof destination, delivery trail, privacy boundary, or rate-limit posture is missing.',
      'Keep refresh/rate-limit controls visible as owner-only launch gates with UI cooldowns as well as backend throttles.',
    ],
    acceptance: 'The product tells staff what to do next, why, and what proof will be saved.',
  },
  {
    name: 'Sprint 4: Persona UAT pass',
    status: 'Active UAT / release routing P0',
    owner: 'QA persona lead',
    goal: 'Walk every role end to end on desktop and mobile.',
    tasks: [
      'Family coordinator: urgent setup, planning setup, care-prep record, one recommended next action, what Passage prepares, where proof saves, approvals, family updates, and aftercare.',
      'Participant/helper: one scoped request, one response path, privacy boundary, authority boundary, needs-help/waiting state, and saved proof.',
      'Funeral-home director: cases, staff, proof, family update approval, reports, export, billing, and clear task-card contracts.',
      'Funeral-home employee: assigned work, context, drafted message, waiting/stuck-point state, family-visible boundary, close-with-proof, and no unclear extra actions.',
      'Vendor: scoped request, quote/update, payment state, service proof, no family-record browsing, and required-field validation that never feels stuck.',
    ],
    acceptance: 'Every persona has one clear next action and no internal product language.',
  },
  {
    name: 'Sprint 5: Pilot-to-revenue operating system',
    status: 'Planned',
    owner: 'Founder + sales ops',
    goal: 'Make pilots measurable, convertible, and expandable toward $300k ARR.',
    tasks: [
      'HubSpot stages map to demo booked, pilot invited, pilot active, value proven, paid conversion, expansion, and churn risk.',
      'Pilot health tracks launch grade, cases, staff, locations, proof, exports, usage, risk, next action, and ARR potential.',
      'Stripe plan assignment and billing state are visible before a conversion ask.',
      'Destructive/reset tools are disabled or two-party gated once real records exist.',
    ],
    acceptance: 'Admin can name every account, stage, proof, risk, next action, billing state, and conversion ask.',
  },
];

const personaChecks = [
  ['Funeral-home director', 'Open My Day, identify the next case action, assign staff, approve/draft a family update, export proof, review billing.'],
  ['Funeral-home employee', 'Open assigned work, understand context, mark waiting or complete, draft the message, save proof.'],
  ['Family coordinator', 'Understand what needs attention now, approve or request changes, see what the funeral home is waiting on.'],
  ['Participant/helper', 'Open one scoped request, respond without seeing the full estate, confirm proof saved.'],
  ['Vendor', 'Understand the job, timing, quote/payment state, obligation boundary, and completion proof.'],
  ['System admin', 'Operate readiness, metrics, pilot health, QA, abuse controls, and roadmap from one internal surface.'],
];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSystemAdmin(user) {
  return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email));
}

export default function SaasRoadmapPage() {
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
    return <Shell><section style={wrap}><Panel>Loading owner roadmap...</Panel></section></Shell>;
  }

  if (!admin) {
    return (
      <Shell user={user} onSignIn={signIn} onSignOut={signOut}>
        <section style={wrap}>
          <Panel>
            <div style={eyebrow}>Owner-only roadmap</div>
            <h1 style={h1}>This plan is restricted.</h1>
            <p style={lead}>Sign in with the Passage owner account to view the internal SaaS roadmap.</p>
            <button onClick={signIn} style={primaryButton}>Sign in</button>
          </Panel>
        </section>
      </Shell>
    );
  }

  return (
    <Shell user={user} onSignIn={signIn} onSignOut={signOut}>
      <section style={wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={eyebrow}>System Admin / SaaS Roadmap</div>
            <h1 style={h1}>Build the funeral-home operating system first.</h1>
            <p style={lead}>The target is a $300k ARR Passage business with B2B funeral homes as the wedge and B2C made simple by a strong partner operating workflow.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/system/admin" style={secondaryLink}>System Admin</Link>
            <Link href="/system/admin/pilot-health" style={secondaryLink}>Pilot Health</Link>
            <Link href="/system/admin/automation-spine-readiness" style={secondaryLink}>Automation Readiness</Link>
            <Link href="/system/admin/rate-limit-readiness" style={secondaryLink}>Refresh Controls</Link>
          </div>
        </div>

        <section style={grid4}>{headlineMetrics.map(([label, value, detail]) => <Metric key={label} label={label} value={value} detail={detail} />)}</section>

        <Panel tone="sage">
          <div style={eyebrow}>Governance</div>
          <h2 style={h2}>The admin and customer boundaries are now explicit.</h2>
          <div style={cardGrid}>{governanceRules.map(rule => <ProofCard key={rule.title} title={rule.title} body={rule.body} />)}</div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Current takeaways</div>
          <h2 style={h2}>Where we are right now.</h2>
          <div style={{ display: 'grid', gap: 9 }}>{takeaways.map(([label, status, body]) => <StatusRow key={label} label={label} status={status} body={body} />)}</div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Sprint plan</div>
          <h2 style={h2}>Execution path to enterprise-grade funeral-home readiness.</h2>
          <div style={{ display: 'grid', gap: 12 }}>{sprints.map((sprint, index) => <SprintAccordion key={sprint.name} sprint={sprint} open={index < 2} />)}</div>
        </Panel>

        <Panel tone="sage">
          <div style={eyebrow}>Persona UAT</div>
          <h2 style={h2}>Every role gets one job, one next action, and one proof path.</h2>
          <div style={cardGrid}>{personaChecks.map(([label, body]) => <ProofCard key={label} title={label} body={body} />)}</div>
        </Panel>
      </section>
    </Shell>
  );
}

function Shell({ children, user, onSignIn, onSignOut }) {
  return <main style={{ background: C.bg, minHeight: '100vh', color: C.ink, fontFamily: 'Georgia,serif' }}><SiteHeader user={user} onSignIn={onSignIn} onSignOut={onSignOut} />{children}<SiteFooter /></main>;
}

function Panel({ children, tone = 'default' }) {
  return <section style={{ background: tone === 'sage' ? C.sageFaint : C.card, border: '1px solid ' + (tone === 'sage' ? '#c8deca' : C.border), borderRadius: 18, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.04)', marginTop: 18 }}>{children}</section>;
}

function Metric({ label, value, detail }) {
  return <div style={metricCard}><div style={eyebrow}>{label}</div><strong style={{ display: 'block', color: C.ink, fontSize: 26, lineHeight: 1.05, marginTop: 8 }}>{value}</strong><p style={smallText}>{detail}</p></div>;
}

function ProofCard({ title, body }) {
  return <div style={subPanel}><h3 style={h3}>{title}</h3><p style={{ ...smallText, margin: '7px 0 0', color: C.ink }}>{body}</p></div>;
}

function StatusRow({ label, status, body }) {
  const isGreen = status === 'Green' || status === 'Reworked';
  const isActive = status === 'In progress' || status === 'Active now' || status === 'Next code focus';
  const pill = isGreen ? goodPill : isActive ? activePill : plannedPill;
  return (
    <div style={rowCard}>
      <div><strong style={{ color: C.ink }}>{label}</strong><p style={{ ...smallText, margin: '4px 0 0' }}>{body}</p></div>
      <span style={pill}>{status}</span>
    </div>
  );
}

function SprintAccordion({ sprint, open }) {
  const badge = sprint.status === 'Active now' || sprint.status === 'Next code focus' ? activePill : plannedPill;
  return (
    <details open={open} style={accordionPanel}>
      <summary style={accordionSummary}>
        <span>{sprint.name}</span>
        <span style={badge}>{sprint.status}</span>
      </summary>
      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
        <p style={{ ...smallText, margin: 0, color: C.ink }}>{sprint.goal}</p>
        <MetricRow label="Owner" value={sprint.owner} />
        <div style={innerPanel}>
          <div style={eyebrow}>Tasks</div>
          <ul style={ul}>{sprint.tasks.map(task => <li key={task}>{task}</li>)}</ul>
        </div>
        <div style={doneBox}><strong>Acceptance:</strong> {sprint.acceptance}</div>
      </div>
    </details>
  );
}

function MetricRow({ label, value }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderTop: '1px solid ' + C.border, padding: '8px 0', alignItems: 'flex-start' }}><span style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.35 }}>{label}</span><strong style={{ color: C.ink, fontSize: 12.5, textAlign: 'right', lineHeight: 1.35 }}>{value}</strong></div>;
}

const wrap = { maxWidth: 1180, margin: '0 auto', padding: '42px 18px 80px' };
const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginTop: 22 };
const cardGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 14 };
const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 52, lineHeight: 1.04, margin: '8px 0 10px', fontWeight: 400, maxWidth: 880 };
const h2 = { fontSize: 28, lineHeight: 1.12, margin: '8px 0 10px', fontWeight: 400 };
const h3 = { color: C.ink, fontSize: 18, lineHeight: 1.18, margin: 0, fontWeight: 900 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 780 };
const smallText = { color: C.mid, fontSize: 14, lineHeight: 1.5, marginTop: 8 };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', marginTop: 16 };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
const metricCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 16, boxShadow: '0 4px 20px rgba(0,0,0,.035)' };
const subPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14 };
const rowCard = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 13 };
const accordionPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14 };
const accordionSummary = { cursor: 'pointer', color: C.ink, fontSize: 16, fontWeight: 900, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' };
const innerPanel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 12 };
const doneBox = { background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 10, color: C.ink, fontSize: 13, lineHeight: 1.4 };
const ul = { margin: '8px 0 0', paddingLeft: 18, color: C.mid, fontSize: 13, lineHeight: 1.45 };
const goodPill = { background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '6px 9px', fontSize: 12, fontWeight: 900, height: 'fit-content', whiteSpace: 'nowrap' };
const activePill = { background: C.amberFaint, color: C.amber, border: '1px solid #ead8b8', borderRadius: 999, padding: '6px 9px', fontSize: 12, fontWeight: 900, height: 'fit-content', whiteSpace: 'nowrap' };
const plannedPill = { background: C.card, color: C.mid, border: '1px solid ' + C.border, borderRadius: 999, padding: '6px 9px', fontSize: 12, fontWeight: 900, height: 'fit-content', whiteSpace: 'nowrap' };