import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../../components/SiteChrome';

const C = {
  bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', border: '#e4ddd4',
  sage: '#6b8f71', sageFaint: '#f0f5f1', amber: '#b07d2e', amberFaint: '#fdf8ee', rose: '#c47a7a', roseFaint: '#fdf3f3'
};
const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];

const revenueTargets = [
  { label: 'ARR target', value: '$300k', detail: 'Primary success target for this operating phase.' },
  { label: 'Core wedge', value: 'Funeral homes', detail: 'Sell operational relief: My Day, family updates, proof, staff clarity, and exports.' },
  { label: 'Account math', value: '100 at $249/mo', detail: 'Or 72 group accounts at $349/mo; vendor and family revenue become upside.' },
  { label: 'North-star proof', value: 'Cases coordinated', detail: 'Active partner cases with task closure, family updates, staff proof, and exports.' },
];

const readinessGates = [
  { label: 'Pilot health', status: 'Shipped', href: '/system/admin/pilot-health', detail: 'Owner can see account stage, ARR potential, launch grade, readiness score, export-ready pilots, open/waiting/blocked/handled task spine, and proof snippets.' },
  { label: 'Partner export proof', status: 'Shipped', href: '/api/partnerExport?view=summary', detail: 'Exports include waiting detail, blocker detail, recent proof detail, and saved notes so a director can inspect value outside Passage.' },
  { label: 'Rate-limit readiness', status: 'Shipped', href: '/system/admin/rate-limit-readiness', detail: 'Admin can review launch decision and refresh/abuse controls for high-risk routes before broader outreach.' },
  { label: 'Public proof console', status: 'Shipped', href: '/funeral-home/pilot-proof', detail: 'Cold funeral-home prospects have a visible proof path instead of needing founder narration.' },
  { label: 'Authenticated browser QA', status: 'Active', href: '/system/admin/funeral-home-qa', detail: 'Next gate is logged-in, persona-by-persona validation with real owner session, screenshots, and pass/fail notes.' },
  { label: 'Paid conversion path', status: 'Active', href: '/system/admin/pilot-health', detail: 'Pilot health must connect proof-ready accounts to Stripe plan, billing status, renewal risk, and named next action.' },
];

const milestoneBoard = [
  {
    title: 'Milestone 1: Demo-to-pilot conversion ready', timing: 'Days 1-15', owner: 'Founder + product QA',
    outcome: 'A funeral director can open the sample console, understand the operating value in 90 seconds, and book a pilot without narration.',
    deliverables: ['Public funeral-home CTA path points to proof console, booking, pricing, or contact.', 'HubSpot-ready lead capture records role, location count, plan intent, and source.', 'Browser QA covers public CTAs, mobile layout, booking path, and logged-out admin leakage.'],
    acceptance: ['A cold prospect can explain what Passage does after the proof console.', 'Every funeral-home CTA has no dead end.', 'Admin sees identifiable funeral-home lead intent.'],
  },
  {
    title: 'Milestone 2: Funeral-home pilot workspace flawless', timing: 'Days 16-35', owner: 'Product + engineering',
    outcome: 'A partner can go from blank account to first location, staff invite, first case, assigned task, family update, proof, and export.',
    deliverables: ['Director onboarding covers plan, location slots, staff invite, first case/import, and My Day setup.', 'Staff workspace shows assigned work only, location scope, case context, waiting point, and proof action.', 'Case pane exposes active state, blockers, family handoff context, next expected update, and export packet.'],
    acceptance: ['Director completes first-case setup without explanation.', 'Employee can close or mark waiting in under one minute with proof saved.', 'Director sees metrics that answer a buyer objection.'],
  },
  {
    title: 'Milestone 3: Automation spine hardening', timing: 'Days 36-55', owner: 'Engineering + QA',
    outcome: 'Workflow states reliably create tasks, notifications, proof, outputs, and repair paths across every persona.',
    deliverables: ['Persist durable workflow state snapshots above tasks.', 'Generate or suggest tasks from state transitions.', 'Add admin-editable dependency rules for certificate, authority, transfer, service, vendor, and aftercare phases.', 'Extend smoke tests to fail when owner, waiting point, proof destination, notification trail, or next state is missing.'],
    acceptance: ['Each case phase explains why it is ready, waiting, blocked, or complete.', 'No handled, waiting, blocked, send, or reminder action can create fake progress without meaningful detail.', 'Readiness shows abuse controls and refresh limits as launch gates.'],
  },
  {
    title: 'Milestone 4: Persona UX perfection pass', timing: 'Days 56-75', owner: 'QA persona lead',
    outcome: 'Every persona has a complete, scoped, emotionally appropriate workflow with no product-internal language leaking into the experience.',
    deliverables: ['Family coordinator sees urgent setup, task ownership, reviewed updates, proof, and aftercare.', 'Participant/helper sees one scoped request, one response path, saved note/proof, and privacy boundary.', 'Funeral-home director and employee each get their proper queue, context, proof, reports, and exports.', 'Vendor sees request, quote, payment state, service details, reminders, and completion proof.'],
    acceptance: ['Each persona completes their primary job on mobile and desktop.', 'Every view exposes the same spine contract: ask, owner, waiting, proof, next.', 'Browser QA produces pass/fail evidence for each persona before pilots expand.'],
  },
  {
    title: 'Milestone 5: Pilot-to-revenue machine', timing: 'Days 76-90', owner: 'Founder + sales ops',
    outcome: 'Passage can sell, onboard, measure, and retain funeral-home pilots toward $300k ARR.',
    deliverables: ['Pilot scorecard tracks locations, cases, staff seats, family updates, tasks closed, exports, active days, and expansion risk.', 'HubSpot stages map to demo booked, pilot invited, pilot active, value proven, paid conversion, expansion, and churn risk.', 'Billing path supports plan assignment, live subscription, upgrade/downgrade, location-slot expansion, and invoice clarity.', 'Production reset and destructive admin tools are disabled or two-party gated once real records exist.'],
    acceptance: ['Admin can name every active account, stage, next action, ARR potential, blocker, and proof.', 'A pilot has success criteria before it starts and an upgrade ask before it ends.', 'Production reset can no longer threaten real customers or leads.'],
  },
];

const sprintBacklog = [
  { sprint: 'Sprint 0: Control room and baseline', status: 'Shipped', timing: 'Done', goal: 'Make the $300k plan visible and measurable inside System Admin.', tasks: ['Owner-only SaaS roadmap exists.', 'Funeral-home QA script exists.', 'Rate-limit readiness page exists.', 'Pilot-health control room exists.'], done: 'Roadmap, QA, rate-limit readiness, and pilot health are live in admin source.' },
  { sprint: 'Sprint 1: Funeral-home sales surface', status: 'Shipped', timing: 'Done', goal: 'Turn public interest into qualified demo/pilot conversations.', tasks: ['Proof console exists as the primary sample experience.', 'Old demo dashboard redirects to proof console.', 'Public CTA path can be verified unauthenticated.', 'Lead capture remains a conversion-path follow-up.'], done: 'Cold prospects have a visible proof console and demo route.' },
  { sprint: 'Sprint 2: Director and staff flawless loop', status: 'Active', timing: 'Now', goal: 'Make first login to first proof production-grade.', tasks: ['Use pilot health to find missing cases, staff, proof, family updates, billing, and exports.', 'Run logged-in director and employee browser QA.', 'Patch any flow that needs narration.', 'Keep export evidence visible as pilot proof.'], done: 'Director and employee flows pass on desktop and mobile with proof saved and exportable.' },
  { sprint: 'Sprint 3: Spine and automation hardening', status: 'Active', timing: 'Next', goal: 'Upgrade Passage from task coordination to dependency-aware workflow automation.', tasks: ['Persist workflow state snapshots above task rows.', 'Attach generated tasks, dependencies, waiting conditions, and output suggestions to states.', 'Make smoke tests assert persona and workflow-state contracts.', 'Keep route-level rate limits and client refresh throttles visible as launch gates.'], done: 'Readiness fails when state, owner, waiting point, proof, notification, dependency, or abuse control is missing.' },
  { sprint: 'Sprint 4: Persona perfection QA', status: 'Planned', timing: 'Week 9-11', goal: 'Pressure-test every role as if real customers are watching.', tasks: ['Run family coordinator, participant, funeral-home director, funeral-home employee, vendor, and admin scripts.', 'Record screenshot, blocker, copy friction, missing proof, and time-to-primary-action.', 'Patch internal language and dead ends.', 'Confirm mobile-sized primary actions.'], done: 'Each persona has one clear next action and one visible proof path.' },
  { sprint: 'Sprint 5: Pilot revenue operating system', status: 'Planned', timing: 'Week 12-13', goal: 'Make pilot conversion and ARR movement visible before scaling outreach.', tasks: ['Map HubSpot stages to admin metrics and readiness checks.', 'Finalize subscription/location-slot billing and pilot conversion path.', 'Add conversion ask timing from launch grade and proof-ready status.', 'Gate production reset and destructive admin tools once real records exist.'], done: 'Admin can answer who is in pipeline, who is active, who is at risk, what proof exists, and what action grows ARR.' },
];

const personaScorecards = [
  ['Family coordinator', 'Create urgent/planning record, assign work, approve updates, see waiting/proof.', 'User knows what to do now and what can wait.', 'P0'],
  ['Participant/helper', 'Open one scoped request, respond, save note/proof, see what Passage recorded.', 'Under one minute from link open to useful response.', 'P0'],
  ['Funeral-home director', 'Run My Day, assign work, review family handoff, export proof, measure staff load.', 'No-narration demo and pilot-ready operations.', 'P0'],
  ['Funeral-home employee', 'See assigned work, context, waiting point, proof action, and completion state.', 'No director clutter and no ambiguous next action.', 'P0'],
  ['Vendor', 'Quote/respond to one scoped job, understand payment and obligation boundary.', 'No family-record leakage; payment/proof state clear.', 'P1'],
  ['System admin', 'Run readiness, revenue pipeline, CRM health, abuse controls, and sprint signoff.', 'Founder can operate from one control room.', 'P0'],
];

const firstActions = [
  'Use Pilot Health every day until each active account has a launch grade, next action, blocker list, and export-ready proof.',
  'Run logged-in browser QA for director and employee personas against one real pilot workspace.',
  'Patch the first flow where a funeral-home user needs founder narration.',
  'Tie proof-ready accounts to a dated conversion ask and Stripe plan assignment.',
  'Keep rate-limit readiness green before scaling public outreach or admin refresh usage.',
];

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function isSystemAdmin(user) { return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email)); }

export default function SaasRoadmapPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return undefined; }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user || null); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); setLoading(false); });
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

  if (loading) return <Shell><section style={wrap}><Panel>Loading Passage roadmap...</Panel></section></Shell>;
  if (!admin) return <Shell><section style={wrap}><Panel><div style={eyebrow}>Owner-only roadmap</div><h1 style={h1}>This sprint plan is restricted.</h1><p style={lead}>Sign in with the Passage owner account to view the $300k ARR SaaS roadmap.</p><button onClick={signIn} style={primaryButton}>Sign in</button></Panel></section></Shell>;

  return (
    <Shell user={user} onSignIn={signIn} onSignOut={signOut}>
      <section style={wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={eyebrow}>System admin / SaaS roadmap</div>
            <h1 style={h1}>Build Passage into a $300k ARR funeral-home SaaS business.</h1>
            <p style={lead}>This is the operating plan for turning the product spine into a repeatable funeral-home sales, onboarding, workflow, proof, and retention engine.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/system/admin" style={secondaryLink}>System Admin</Link>
            <Link href="/system/admin/pilot-health" style={secondaryLink}>Pilot Health</Link>
          </div>
        </div>

        <section style={grid4}>{revenueTargets.map((target) => <Metric key={target.label} item={target} />)}</section>

        <Panel tone="sage">
          <div style={eyebrow}>Control-room gates</div>
          <h2 style={h2}>Roadmap progress must show up as owner-visible launch evidence.</h2>
          <div style={gateGrid}>{readinessGates.map((gate) => <GateCard key={gate.label} gate={gate} />)}</div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Tangible milestones</div>
          <h2 style={h2}>Five milestones to reach a scalable pilot-to-revenue machine.</h2>
          <div style={{ display: 'grid', gap: 14 }}>{milestoneBoard.map((item) => <MilestoneCard key={item.title} item={item} />)}</div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Sprint plan</div>
          <h2 style={h2}>Sprints assigned to revenue, UX, spine, and funeral-home perfection.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>{sprintBacklog.map((item) => <SprintCard key={item.sprint} item={item} />)}</div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Persona UX assessment</div>
          <h2 style={h2}>Every persona gets one job, one proof path, and one next action.</h2>
          <div style={{ display: 'grid', gap: 8 }}>{personaScorecards.map(([persona, job, acceptance, priority]) => <PersonaRow key={persona} persona={persona} job={job} acceptance={acceptance} priority={priority} />)}</div>
        </Panel>

        <Panel tone="sage">
          <div style={eyebrow}>Start now</div>
          <h2 style={h2}>First execution actions.</h2>
          <div style={listGrid}>{firstActions.map((item, index) => <ProofCard key={item} label={`Action ${index + 1}`} text={item} />)}</div>
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

function Metric({ item }) {
  return <div style={metricCard}><div style={eyebrow}>{item.label}</div><strong style={{ display: 'block', color: C.ink, fontSize: 26, lineHeight: 1.05, marginTop: 8 }}>{item.value}</strong><p style={smallText}>{item.detail}</p></div>;
}

function GateCard({ gate }) {
  const badge = gate.status === 'Shipped' ? goodPill : gate.status === 'Active' ? activePill : plannedPill;
  return <Link href={gate.href} style={{ ...subPanel, textDecoration: 'none', color: C.ink }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}><div style={eyebrow}>{gate.label}</div><span style={badge}>{gate.status}</span></div><p style={{ ...smallText, color: C.ink }}>{gate.detail}</p></Link>;
}

function ProofCard({ label, text }) {
  return <div style={subPanel}><div style={eyebrow}>{label}</div><p style={{ ...smallText, margin: '7px 0 0', color: C.ink }}>{text}</p></div>;
}

function MilestoneCard({ item }) {
  return <div style={subPanel}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><div style={eyebrow}>{item.timing}</div><h3 style={h3}>{item.title}</h3></div><span style={plannedPill}>{item.owner}</span></div><p style={{ ...smallText, color: C.ink }}>{item.outcome}</p><TwoColumnList leftTitle="Deliverables" left={item.deliverables} rightTitle="Acceptance" right={item.acceptance} /></div>;
}

function SprintCard({ item }) {
  const badge = item.status === 'Shipped' ? goodPill : item.status === 'Active' ? activePill : plannedPill;
  return <div style={{ ...subPanel, display: 'grid', gap: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}><div style={eyebrow}>{item.timing}</div><span style={badge}>{item.status}</span></div><h3 style={h3}>{item.sprint}</h3><p style={{ ...smallText, color: C.ink, margin: 0 }}>{item.goal}</p><ul style={ul}>{item.tasks.map((task) => <li key={task}>{task}</li>)}</ul><div style={doneBox}><strong>Done:</strong> {item.done}</div></div>;
}

function PersonaRow({ persona, job, acceptance, priority }) {
  return <div style={rowCard}><div><strong style={{ color: C.ink }}>{persona}</strong><p style={{ ...smallText, margin: '4px 0 0' }}>{job}</p></div><div style={{ color: C.mid, fontSize: 13, lineHeight: 1.4 }}>{acceptance}</div><span style={priority === 'P0' ? riskPill : plannedPill}>{priority}</span></div>;
}

function TwoColumnList({ leftTitle, left, rightTitle, right }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 12 }}><div style={innerPanel}><div style={eyebrow}>{leftTitle}</div><ul style={ul}>{left.map((item) => <li key={item}>{item}</li>)}</ul></div><div style={innerPanel}><div style={eyebrow}>{rightTitle}</div><ul style={ul}>{right.map((item) => <li key={item}>{item}</li>)}</ul></div></div>;
}

const wrap = { maxWidth: 1180, margin: '0 auto', padding: '42px 18px 80px' };
const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginTop: 22 };
const gateGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginTop: 14 };
const listGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 14 };
const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 52, lineHeight: 1.04, margin: '8px 0 10px', fontWeight: 400, maxWidth: 880 };
const h2 = { fontSize: 28, lineHeight: 1.12, margin: '8px 0 10px', fontWeight: 400 };
const h3 = { color: C.ink, fontSize: 21, lineHeight: 1.15, margin: '6px 0 0', fontWeight: 900 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 780 };
const smallText = { color: C.mid, fontSize: 14, lineHeight: 1.5, marginTop: 8 };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', marginTop: 16 };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
const metricCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 16, boxShadow: '0 4px 20px rgba(0,0,0,.035)' };
const subPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14 };
const innerPanel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 12 };
const doneBox = { background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 10, color: C.ink, fontSize: 13, lineHeight: 1.4 };
const ul = { margin: '8px 0 0', paddingLeft: 18, color: C.mid, fontSize: 13, lineHeight: 1.45 };
const goodPill = { background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '6px 9px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
const activePill = { background: C.amberFaint, color: C.amber, border: '1px solid #ead8b8', borderRadius: 999, padding: '6px 9px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
const plannedPill = { background: C.card, color: C.mid, border: '1px solid ' + C.border, borderRadius: 999, padding: '6px 9px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
const riskPill = { background: C.roseFaint, color: C.rose, border: '1px solid #efc7c7', borderRadius: 999, padding: '6px 9px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
const rowCard = { display: 'grid', gridTemplateColumns: 'minmax(220px, 1.2fr) minmax(220px, 1fr) auto', gap: 12, alignItems: 'center', background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 13 };
