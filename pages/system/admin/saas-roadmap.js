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

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSystemAdmin(user) {
  return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email));
}

const revenueTargets = [
  { label: 'ARR target', value: '$300k', detail: 'Primary success target for the next operating phase.' },
  { label: 'Core wedge', value: 'Funeral homes', detail: 'Sell operational relief: My Day, family updates, proof, staff clarity, and exports.' },
  { label: 'Account math', value: '100 at $249/mo', detail: 'Or 72 group accounts at $349/mo; vendor and family revenue become upside.' },
  { label: 'North-star proof', value: 'Cases coordinated', detail: 'Active partner cases with visible task closure, family updates, staff proof, and exports.' },
];

const operatingPrinciples = [
  'Do not build a prettier task board. Build a workflow spine that knows case phase, owner, waiting point, proof, next state, and revenue impact.',
  'Funeral-home functionality must be demoable without narration and usable by a director or staff member under real daily pressure.',
  'Every persona gets one job, one proof path, one scoped view, and one next action. Remove anything that makes a user learn the whole product before acting.',
  'Every sprint ends with browser QA, readiness evidence, owner-visible blockers, and a changed business metric or a removed buyer objection.',
];

const milestoneBoard = [
  {
    title: 'Milestone 1: Demo-to-pilot conversion ready',
    timing: 'Days 1-15',
    owner: 'Founder + product QA',
    outcome: 'A funeral director can open the sample console, understand the operating value in 90 seconds, and book a pilot without founder narration.',
    deliverables: [
      'Reframe homepage and funeral-home page around operational ROI, not only emotional mission.',
      'Make sample console the primary funeral-home CTA and tighten each tour stop around My Day, family update, proof, reporting, staff, and rollout.',
      'Add HubSpot-ready lead capture for funeral-home demo interest with source, plan intent, location count, and next action.',
      'Browser-QA desktop and mobile public CTAs, booking flow, sample console, and logged-out admin leakage.',
    ],
    acceptance: [
      'A cold funeral-home prospect can explain what Passage does after the sample console tour.',
      'Every funeral-home CTA resolves to sample console, booking, pricing, or contact with no dead end.',
      'Admin metrics show identifiable funeral-home leads, not anonymous product_event noise only.',
    ],
  },
  {
    title: 'Milestone 2: Funeral-home pilot workspace flawless',
    timing: 'Days 16-35',
    owner: 'Product + engineering',
    outcome: 'A partner can go from blank account to first location, staff invite, first case, assigned task, family update, proof, and export.',
    deliverables: [
      'Director onboarding: plan, location slots, first location, staff invite, first case/import, My Day setup.',
      'Staff workspace: assigned work only, location scope, case context, waiting point, proof action, no director clutter.',
      'Case pane: active workflow state, blockers, family handoff context, next expected update, and exportable packet.',
      'ROI dashboard: call avoidance proxy, tasks closed, family updates sent, staff load, response time, and export count.',
    ],
    acceptance: [
      'Director completes first-case setup without Steve explaining where to click.',
      'Employee can close or mark waiting on assigned work in under one minute with proof saved.',
      'Director sees operational relief in metrics that map to a buyer objection.',
    ],
  },
  {
    title: 'Milestone 3: Automation spine assessment and hardening',
    timing: 'Days 36-55',
    owner: 'Engineering + QA',
    outcome: 'The spine reliably turns workflow states into tasks, notifications, proof, outputs, and repair paths across every persona.',
    deliverables: [
      'Persist workflow_state rows or equivalent durable state snapshots above tasks.',
      'Generate or suggest tasks from state transitions instead of relying on static task lists.',
      'Add admin-editable dependency rules for certificate, authority, funeral-home selection, transfer, service, vendor, and aftercare phases.',
      'Extend smoke tests to fail when owner, waiting point, proof destination, notification trail, or next state is missing.',
      'Add refresh/rate-limit policy to high-risk routes: tracking, contact, auth, admin checks, sends, reminders, vendor quote/payment, and dashboard polling.',
    ],
    acceptance: [
      'Each case phase explains why it is ready, waiting, blocked, or complete.',
      'No handled, waiting, blocked, send, or reminder action can create fake progress without meaningful detail.',
      'Admin readiness shows abuse controls and refresh limits as launch gates, not as a future security note.',
    ],
  },
  {
    title: 'Milestone 4: Persona UX perfection pass',
    timing: 'Days 56-75',
    owner: 'QA persona lead',
    outcome: 'Every persona has a complete, scoped, emotionally appropriate workflow with no product-internal language leaking into the experience.',
    deliverables: [
      'Family coordinator: urgent setup, planning activation, task ownership, reviewed family updates, proof, and aftercare continuity.',
      'Participant/helper: one scoped task, one response path, saved note/proof visibility, and clear privacy boundary.',
      'Funeral-home director: My Day, unassigned work, staff load, locations, reports, exports, and pilot ROI.',
      'Funeral-home employee: today queue, case context, proof, waiting path, and no admin clutter.',
      'Vendor: scoped request, quote, payment state, service details, obligation reminders, and completion proof.',
      'Admin: readiness, revenue dashboard, abuse controls, CRM health, and sprint signoff.',
    ],
    acceptance: [
      'Each persona can complete their primary job from a phone-sized viewport and desktop viewport.',
      'Every persona view exposes the same spine contract in plain language: ask, owner, waiting, proof, next.',
      'Browser QA produces a pass/fail note and screenshot for each persona before pilots expand.',
    ],
  },
  {
    title: 'Milestone 5: Pilot-to-revenue machine',
    timing: 'Days 76-90',
    owner: 'Founder + sales ops',
    outcome: 'Passage can sell, onboard, measure, and retain funeral-home pilots toward $300k ARR.',
    deliverables: [
      'Pilot scorecard: locations, cases, staff seats, family updates, tasks closed, exports, active days, and expansion risk.',
      'HubSpot pipeline: demo booked, pilot invited, pilot active, value proven, paid conversion, expansion, churn risk.',
      'Billing readiness: plan assignment, live Stripe subscription path, upgrade/downgrade, location-slot expansion, and invoice clarity.',
      'Reset production test data tool lifecycle gate: disable or two-party gate destructive reset after real customer data exists.',
    ],
    acceptance: [
      'Admin can name every active account, stage, next action, ARR potential, blocker, and product proof.',
      'A pilot has explicit success criteria before it starts and an upgrade ask before it ends.',
      'Production reset can no longer threaten real customers or leads.',
    ],
  },
];

const sprintBacklog = [
  {
    sprint: 'Sprint 0: Control room and baseline',
    timing: 'Start now',
    goal: 'Make the $300k plan visible, measurable, and ready for execution inside System Admin.',
    tasks: [
      'Publish this owner-only SaaS roadmap under System Admin.',
      'Capture current baseline: $0 MRR, 0 active subscriptions, 0 pilots, anonymous product_event volume, current readiness scores.',
      'Create funeral-home QA script covering sample console, director onboarding, employee queue, family update, proof, export, and booking.',
      'Define P0 abuse controls and refresh-rate rules for implementation sprint.',
    ],
    done: 'The roadmap exists, baseline is named, and every next sprint has an acceptance test tied to revenue or buyer trust.',
  },
  {
    sprint: 'Sprint 1: Funeral-home sales surface',
    timing: 'Week 1-2',
    goal: 'Turn public interest into qualified funeral-home demo/pilot conversations.',
    tasks: [
      'Update homepage and funeral-home page copy to lead with operational proof and ROI.',
      'Promote sample console CTA above softer brand language.',
      'Add or tighten funeral-home lead capture fields: organization, locations, role, case volume, current pain, email, phone.',
      'Send contactable funeral-home leads into HubSpot with source and pipeline stage.',
    ],
    done: 'Funeral-home prospect can understand value, try demo, and become a qualified lead without founder explanation.',
  },
  {
    sprint: 'Sprint 2: Director and staff flawless loop',
    timing: 'Week 3-5',
    goal: 'Make funeral-home operations feel production-grade from first login to first proof.',
    tasks: [
      'Browser-QA blank director workspace to first location, staff invite, first case, assigned task, and proof.',
      'Remove any staff-facing director clutter from employee queue.',
      'Add ROI cards based on actual activity signals, not hypothetical claims.',
      'Make export/reporting visible as a proof artifact for directors.',
    ],
    done: 'Director and employee flows pass without narration on desktop and mobile-sized viewport.',
  },
  {
    sprint: 'Sprint 3: Spine and automation hardening',
    timing: 'Week 6-8',
    goal: 'Upgrade Passage from task coordination to dependency-aware workflow automation.',
    tasks: [
      'Persist workflow state or state snapshots above task rows.',
      'Attach generated tasks, dependencies, waiting conditions, and output suggestions to workflow states.',
      'Make smoke tests assert persona contracts and workflow-state contracts.',
      'Implement route-level rate limits and client refresh throttles for abuse-prone flows.',
    ],
    done: 'Readiness fails when state, owner, waiting point, proof, notification, dependency, or abuse control is missing.',
  },
  {
    sprint: 'Sprint 4: Persona perfection QA',
    timing: 'Week 9-11',
    goal: 'Pressure-test every role as if real customers are watching over your shoulder.',
    tasks: [
      'Run family coordinator, participant, funeral-home director, funeral-home employee, vendor, and admin scripts.',
      'Record screenshot, blocker, copy friction, missing proof, and time-to-primary-action for each persona.',
      'Patch any flow that needs founder narration or exposes internal language.',
      'Confirm mobile-sized experience for each primary persona action.',
    ],
    done: 'Each persona can perform their primary job with one clear next action and one visible proof path.',
  },
  {
    sprint: 'Sprint 5: Pilot revenue operating system',
    timing: 'Week 12-13',
    goal: 'Make pilot conversion and ARR movement visible in admin before scaling outreach.',
    tasks: [
      'Add pilot account health dashboard with ARR potential, stage, next action, usage, blockers, and proof.',
      'Map HubSpot stages to admin metrics and readiness checks.',
      'Finalize subscription/location-slot billing and pilot conversion path.',
      'Gate production reset and destructive admin tools once real customer records exist.',
    ],
    done: 'Admin can answer: who is in pipeline, who is active, who is at risk, what proof exists, and what action grows ARR.',
  },
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
  'Use this roadmap as the sprint source of truth until the main admin roadmap absorbs these cards.',
  'Run a full browser QA pass on the funeral-home sample console and record every step that still needs narration.',
  'Patch the public funeral-home CTA path so sample console and booking are unmistakable.',
  'Implement a shared rate-limit policy for tracking/contact/send/admin-check endpoints before broader outreach.',
  'Convert anonymous product_event volume into useful funnel telemetry: CTA click, route, persona, source, and contactability.',
];

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
    return (
      <main style={{ background: C.bg, minHeight: '100vh', color: C.ink, fontFamily: 'Georgia,serif' }}>
        <SiteHeader />
        <section style={wrap}><Panel>Loading Passage roadmap...</Panel></section>
      </main>
    );
  }

  if (!admin) {
    return (
      <main style={{ background: C.bg, minHeight: '100vh', color: C.ink, fontFamily: 'Georgia,serif' }}>
        <SiteHeader />
        <section style={wrap}>
          <Panel>
            <div style={eyebrow}>Owner-only roadmap</div>
            <h1 style={h1}>This sprint plan is restricted.</h1>
            <p style={lead}>Sign in with the Passage owner account to view the $300k ARR SaaS roadmap.</p>
            <button onClick={signIn} style={primaryButton}>Sign in</button>
          </Panel>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main style={{ background: C.bg, minHeight: '100vh', color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader user={user} onSignIn={signIn} onSignOut={signOut} />
      <section style={wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={eyebrow}>System admin / SaaS roadmap</div>
            <h1 style={h1}>Build Passage into a $300k ARR funeral-home SaaS business.</h1>
            <p style={lead}>This is the execution plan for turning the current product spine into a repeatable funeral-home sales, onboarding, workflow, proof, and retention engine.</p>
          </div>
          <Link href="/system/admin" style={secondaryLink}>Back to System Admin</Link>
        </div>

        <section style={grid4}>
          {revenueTargets.map((target) => (
            <div key={target.label} style={metricCard}>
              <div style={eyebrow}>{target.label}</div>
              <strong style={{ display: 'block', color: C.ink, fontSize: 26, lineHeight: 1.05, marginTop: 8 }}>{target.value}</strong>
              <p style={smallText}>{target.detail}</p>
            </div>
          ))}
        </section>

        <Panel tone="sage">
          <div style={eyebrow}>Operating doctrine</div>
          <h2 style={h2}>What changes now.</h2>
          <div style={listGrid}>
            {operatingPrinciples.map((item) => <ProofCard key={item} label="Principle" text={item} />)}
          </div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Tangible milestones</div>
          <h2 style={h2}>Five milestones to reach a scalable pilot-to-revenue machine.</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {milestoneBoard.map((item) => <MilestoneCard key={item.title} item={item} />)}
          </div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Sprint plan</div>
          <h2 style={h2}>Sprints assigned to revenue, UX, spine, and funeral-home perfection.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {sprintBacklog.map((item) => <SprintCard key={item.sprint} item={item} />)}
          </div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Persona UX assessment</div>
          <h2 style={h2}>Every persona gets one job, one proof path, and one next action.</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {personaScorecards.map(([persona, job, acceptance, priority]) => (
              <div key={persona} style={rowCard}>
                <div>
                  <strong style={{ color: C.ink }}>{persona}</strong>
                  <p style={{ ...smallText, margin: '4px 0 0' }}>{job}</p>
                </div>
                <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.4 }}>{acceptance}</div>
                <span style={priority === 'P0' ? riskPill : plannedPill}>{priority}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel tone="sage">
          <div style={eyebrow}>Start now</div>
          <h2 style={h2}>First execution actions.</h2>
          <div style={listGrid}>
            {firstActions.map((item, index) => <ProofCard key={item} label={`Action ${index + 1}`} text={item} />)}
          </div>
        </Panel>
      </section>
      <SiteFooter />
    </main>
  );
}

function Panel({ children, tone = 'default' }) {
  return <section style={{ background: tone === 'sage' ? C.sageFaint : C.card, border: '1px solid ' + (tone === 'sage' ? '#c8deca' : C.border), borderRadius: 18, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.04)', marginTop: 18 }}>{children}</section>;
}

function ProofCard({ label, text }) {
  return (
    <div style={subPanel}>
      <div style={eyebrow}>{label}</div>
      <p style={{ ...smallText, margin: '7px 0 0', color: C.ink }}>{text}</p>
    </div>
  );
}

function MilestoneCard({ item }) {
  return (
    <div style={subPanel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={eyebrow}>{item.timing}</div>
          <h3 style={h3}>{item.title}</h3>
        </div>
        <span style={plannedPill}>{item.owner}</span>
      </div>
      <p style={{ ...smallText, color: C.ink }}>{item.outcome}</p>
      <TwoColumnList leftTitle="Deliverables" left={item.deliverables} rightTitle="Acceptance" right={item.acceptance} />
    </div>
  );
}

function SprintCard({ item }) {
  return (
    <div style={{ ...subPanel, display: 'grid', gap: 8 }}>
      <div style={eyebrow}>{item.timing}</div>
      <h3 style={h3}>{item.sprint}</h3>
      <p style={{ ...smallText, color: C.ink, margin: 0 }}>{item.goal}</p>
      <ul style={ul}>{item.tasks.map((task) => <li key={task}>{task}</li>)}</ul>
      <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 10, color: C.ink, fontSize: 13, lineHeight: 1.4 }}><strong>Done:</strong> {item.done}</div>
    </div>
  );
}

function TwoColumnList({ leftTitle, left, rightTitle, right }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 12 }}>
      <div style={innerPanel}>
        <div style={eyebrow}>{leftTitle}</div>
        <ul style={ul}>{left.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div style={innerPanel}>
        <div style={eyebrow}>{rightTitle}</div>
        <ul style={ul}>{right.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>
  );
}

const wrap = { maxWidth: 1180, margin: '0 auto', padding: '42px 18px 80px' };
const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginTop: 22 };
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
const ul = { margin: '8px 0 0', paddingLeft: 18, color: C.mid, fontSize: 13, lineHeight: 1.45 };
const plannedPill = { background: C.amberFaint, color: C.amber, border: '1px solid #ead8b8', borderRadius: 999, padding: '6px 9px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
const riskPill = { background: C.roseFaint, color: C.rose, border: '1px solid #efc7c7', borderRadius: 999, padding: '6px 9px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
const rowCard = { display: 'grid', gridTemplateColumns: 'minmax(220px, 1.2fr) minmax(220px, 1fr) auto', gap: 12, alignItems: 'center', background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 13 };
