import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';

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

const SYSTEM_ADMIN_EMAILS = ['thepassageappio@gmail.com', 'steventurrisi@gmail.com'];

const demoSteps = [
  {
    id: 'overview',
    kicker: 'Open',
    title: 'Show Passage as the coordination layer.',
    point: 'Start with the buyer pain: fewer repeated calls, clearer ownership, visible proof, warm family handoffs, and export back to the funeral home system.',
    action: 'Passage sits on top of the existing case system: it imports what the team already has, reduces repeated calls, and exports cleanly.',
    href: '/funeral-home?demoTour=funeral-home&demoStep=overview',
  },
  {
    id: 'warm',
    kicker: 'Warm handoff',
    title: 'Show how families arrive prepared.',
    point: 'A family may enter before death through hospice, home care, senior living, assisted care, or serious illness. Passage preserves contacts, dates, preferences, and the first-hour plan so the funeral home does not start from zero.',
    action: 'Passage can bring warm, organized family handoffs. Providers rotate in and out; the family record stays continuous.',
    href: '/hospice?demoTour=funeral-home&demoStep=warm',
  },
  {
    id: 'dashboard',
    kicker: 'Command',
    title: 'Open the operating console.',
    point: 'A director should see the floor in one pane: cases, waiting responses, blocked work, location scope, and the next action.',
    action: 'Show the command center first. Avoid dashboard wandering. The value is "what needs attention without another status call."',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=dashboard',
  },
  {
    id: 'team',
    kicker: 'Setup',
    title: 'Show locations, employees, and permissions.',
    point: 'A signed pilot owner should know what to do in minute one: confirm workspace, set locations/case scope, add employees and roles, then import CSV or create the first case fresh.',
    action: 'Show Management, not an onboarding overlay: locations, role permissions, assignable staff, and the reusable owner dropdown.',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=team',
  },
  {
    id: 'case',
    kicker: 'Case',
    title: 'Create or open a family case.',
    point: 'Add the family contact and known facts. Passage creates the command center and starts the same task spine.',
    action: 'Show at-need versus pre-need as case states. Prepaid is a funding detail, not a separate case type.',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=case',
  },
  {
    id: 'task',
    kicker: 'Work',
    title: 'Move one task, then show the proof.',
    point: 'Each task has a next action, an owner, a waiting state, and proof. Unknown never pretends to be done.',
    action: 'Show prepared output, owner assignment, request family info, close task, and proof. This is the product loop.',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=task',
  },
  {
    id: 'coordinate',
    kicker: 'Coordinate',
    title: 'Coordinate without mixing messages, notifications, and proof.',
    point: 'Mock the real-life handoff: director asks family once, staff sees the work, cemetery/vendor gets a scoped request, and proof is recorded separately.',
    action: 'Notifications get attention. Conversation coordinates the work. Proof records what happened.',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=chat',
  },
  {
    id: 'vendor',
    kicker: 'Local support',
    title: 'Request trusted help inside the task.',
    point: 'Vendors are task-native: no directory, no browsing, just trusted help where it belongs.',
    action: 'Show requested, viewed, accepted, in progress, completed, or declined. Passage stays in the transaction trail.',
    href: '/vendors/request?demo=1&demoTour=funeral-home&demoStep=vendor',
  },
  {
    id: 'export',
    kicker: 'Close',
    title: 'End with ROI and portability.',
    point: 'Calls avoided, waiting items, active cases, import mapping, case-summary export, full-spine export, date ranges, and the family-facing audit trail are the adoption story.',
    action: 'Passage does not trap case data. Bring case data in, coordinate the family work, then export the record back out.',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=export',
  },
];

const staff = [
  ['Location admin', 'Sees roll-up metrics, location performance, and export controls.'],
  ['Funeral director', 'Owns arrangement decisions, family status, and sensitive handoffs.'],
  ['Coordinator', 'Moves routine tasks, chases missing info, records proof.'],
  ['Aftercare lead', 'Handles first-week and long-tail family follow-up.'],
];

const cases = [
  ['Marian Ellis', 'At-need', 'Hospital release waiting', 'Beacon'],
  ['Robert Alvarez', 'At-need', 'Cemetery and clergy coordination', 'Poughkeepsie'],
  ['Eleanor Price', 'Pre-need', 'Planning file in progress', 'Main location'],
];

const mockChats = [
  {
    title: 'Family request',
    messages: [
      ['Director', 'We need the cemetery plot section and lot number before we can finalize Thursday.'],
      ['Family', 'It is Section B, Lot 18. I uploaded the deed from my mother.'],
      ['Status', 'Waiting state cleared. Staff can now confirm with cemetery.'],
    ],
  },
  {
    title: 'Cemetery handoff',
    messages: [
      ['Coordinator', 'The family prefers Thursday afternoon if the cemetery can confirm availability.'],
      ['Cemetery', 'Thursday at 2:00 PM is available. Permit must be received first.'],
      ['Status', 'Cemetery availability recorded. Permit remains a blocker.'],
    ],
  },
  {
    title: 'Participant help',
    messages: [
      ['Family', 'Paul can bring the framed photo and confirm pallbearer names.'],
      ['Participant', 'I have the photo and will send names by 6 PM.'],
      ['Status', 'Participant task remains assigned. Next update expected this evening.'],
    ],
  },
];

const coordinationLayers = [
  ['Conversation', 'The human request and reply attached to the task.'],
  ['Notification', 'Email/SMS/in-app routing that tells the right person attention is needed.'],
  ['Proof', 'The recorded outcome: actor, timestamp, note, file, status, and destination.'],
];

const demoMetrics = [
  ['Active cases', '20'],
  ['Waiting responses', '7'],
  ['Staff tasks today', '14'],
  ['Calls avoided', '38'],
  ['Hours saved', '5 hr'],
  ['CSV exports', '5'],
  ['Import mappings', '3'],
  ['Avg next update', '18 hrs'],
];

const fullLoop = [
  ['1', 'Family enters through the right door', 'Planning, care preparation, urgent death guidance, or funeral-home intake starts the same spine.'],
  ['2', 'Set up once', 'Partner confirms workspace, locations/case scope, employees, roles, and preferred support before work gets assigned.'],
  ['3', 'Load cases two ways', 'Import existing cases by CSV with preview, or create the first family case fresh in UI.'],
  ['4', 'Assign the first owner', 'A saved employee, family coordinator, participant, vendor, clergy, or cemetery contact receives only the work they own.'],
  ['5', 'Ask family once', 'Missing cemetery, obituary, policy, or service details are requested from the task.'],
  ['6', 'Record proof and show ROI', 'Staff saves what happened, what is waiting, calls avoided, and exportable case data.'],
];

const demoRail = [
  {
    n: '01',
    title: 'Funeral home promise',
    persona: 'Funeral-home owner/director',
    route: '/funeral-home?demoTour=funeral-home&demoStep=overview',
    proof: 'Fewer repeated calls, clearer ownership, visible proof, warm handoffs, and export back to the existing case system.',
    value: 'Frames Passage as the coordination layer around the work they already do.',
  },
  {
    n: '02',
    title: 'Director sees the operating read',
    persona: 'Funeral-home owner/director',
    route: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=dashboard',
    proof: 'Active cases, waiting responses, blocked items, calls avoided, and the single director focus.',
    value: 'Shows the buyer what gets quieter today.',
  },
  {
    n: '03',
    title: 'Director completes first-day setup',
    persona: 'Director / location manager',
    route: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=team',
    proof: 'Workspace, locations/case scope, employees, roles, import-vs-create branches, and reusable owner dropdown.',
    value: 'Shows what a signed pilot does in minute one without needing operator narration.',
  },
  {
    n: '04',
    title: 'Director creates or opens a case',
    persona: 'Arranger / coordinator',
    route: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=case',
    proof: 'At-need and pre-need case states, case value, prepaid funding detail, location, dates, and family contact captured when known.',
    value: 'Shows “add only what you know” without blocking urgent work.',
  },
  {
    n: '05',
    title: 'Staff moves one task',
    persona: 'Funeral-home employee',
    route: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=task',
    proof: 'Owner, next action, prepared output, waiting state, and proof destination are on one task.',
    value: 'Shows Passage doing work instead of showing a checklist.',
  },
  {
    n: '06',
    title: 'Family or helper responds once',
    persona: 'Family participant',
    route: '/participating?demoTour=funeral-home&demoStep=participant',
    proof: 'Assigned work only: accept, waiting, handled, or ask for help.',
    value: 'Shows a scoped slice of the same truth without funeral-home clutter.',
  },
  {
    n: '07',
    title: 'Family prepares the next update',
    persona: 'Family coordinator',
    route: '/share?dn=Eleanor%20Price&cn=Price%20family&demoTour=funeral-home&demoStep=announcement',
    proof: 'Family-record one-pager, platform-specific copy, recipient parsing, email/text lists, and CSV export. Nothing sends automatically.',
    value: 'Shows the practical "tell many people once" output without turning Passage into generic chat or a blast tool.',
  },
  {
    n: '08',
    title: 'Vendor handles scoped local support',
    persona: 'Vendor / service provider',
    route: '/vendors/request?demo=1&demoTour=funeral-home&demoStep=vendor',
    proof: 'Viewed, accepted, in progress, completed, or declined stays tied to the task.',
    value: 'Shows vendors as task-native support, not a directory.',
  },
  {
    n: '09',
    title: 'Director closes with reporting',
    persona: 'Owner/director',
    route: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=export',
    proof: 'Import mapping, case-summary CSV, full-spine CSV, date ranges, staff workload, calls avoided, and family-visible proof.',
    value: 'Shows ROI and data portability for the B2B close without promising a rip-and-replace migration.',
  },
];

const ecosystemPaths = [
  {
    title: 'Warm path',
    body: 'Hospice or serious illness preparation: first-hour plan, family update list, and funeral-home handoff packet.',
    label: 'Open warm path',
    href: '/hospice?demoTour=funeral-home&demoStep=warm',
  },
  {
    title: 'Family command center',
    body: 'Estate operating spine first: one selected family record, one next move, proof destination, and an estate switcher when there are multiple records.',
    label: 'Open estate spine',
    href: '/?dashboard=1',
  },
  {
    title: 'Participant view',
    body: 'Assigned work only: accept it, mark waiting, record handled, or ask for help. No funeral-home admin clutter.',
    label: 'Open helper view',
    href: '/participating?demoTour=funeral-home&demoStep=participant',
  },
  {
    title: 'Funeral-home dashboard',
    body: 'Case inbox, staff work, waiting items, location metrics, calls avoided, and CSV export.',
    label: 'Open partner view',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=dashboard',
  },
  {
    title: 'Vendor page',
    body: 'Task-native request portal: viewed, accepted, in-progress, completed, and referral value tracking.',
    label: 'Open vendor loop',
    href: '/vendors/request?demo=1&demoTour=funeral-home&demoStep=vendor',
  },
  {
    title: 'Vendor admin',
    body: 'System-admin approval and vendor trust controls. Not visible to families or partner funeral homes.',
    label: 'System admin only',
    href: '/vendors/admin?demoTour=funeral-home&demoStep=vendor',
  },
];

const readinessChecks = [
  'Demo studio is separate from the partner funeral-home dashboard.',
  'System-admin nav rolls demo, vendor approval, vendor QA, reporting, and support intake under one Passage-only command center.',
  'Guided coach stays in dummy demo data and does not depend on real estates.',
  'Family, participant, funeral-home, and vendor surfaces reuse the same task/proof/audit language and task authority guidance.',
  'The family dashboard opens as an estate operating spine, not a detached index or portfolio dashboard.',
  'Warm path, announcements, packets, vendors, and funeral-home work all attach to one family record instead of becoming separate product islands.',
  'First-day launch rails exist for family, funeral-home partner, employee, vendor, participant, and future hospice/assisted-care setup patterns.',
  'Import mapping, preview, case-summary export, and full-spine export remain the adoption-trust close.',
  'Demo notification states stay exact: prepared, requested, copied, failed, delivered, and sent are not interchangeable.',
  'Email and SMS delivery APIs support authenticated dry runs for QA. Dry run means no provider call, no fallback send, and no production record change.',
];

const productionReadiness = [
  ['Mission lock', 'Strong', 'Passage is now the family continuity and orchestration layer across green, warm, red, funeral-home, vendor, announcement, participant, and aftercare surfaces.'],
  ['Orchestration believability', 'Medium-high', 'The demo now has the spine: owner, request, waiting, proof, output, lifecycle state, and reporting. Keep tightening until every task feels authoritative.'],
  ['Funeral-home founder-led sales', 'Ready', 'Pitch and demo the coordination layer now: first-day setup, import/create, assign owner, record proof, and export back out. Founder should guide onboarding.'],
  ['Notification QA', 'Dry-run ready', 'Email/SMS endpoints can be exercised without contacting a real recipient or changing production records. Live sends still require explicit controlled approval.'],
  ['Hospice / care-facility discovery', 'Ready for conversations', 'Pitch the upstream family coordination bridge, not hospice or facility software. Use discovery to validate care-team setup, family communication, and funeral-home handoff.'],
  ['Unassisted paid rollout', 'Not yet', 'Needs delivery monitoring, support operations, more task outputs, billing/admin cleanup, and messy real CSV import QA before self-serve live usage.'],
];

const salesReadiness = [
  ['Sell now', 'Progressive independent funeral homes', 'Founder-led pilot with 3-10 cases, CSV bridge, staff setup, family task handoff, proof, and export.'],
  ['Discover now', 'Hospice and senior living', 'Validate family coordination burden, warm-path setup, and handoff value without entering clinical workflow.'],
  ['Do not sell yet', 'Self-serve enterprise rollout', 'Wait for support playbooks, instrumentation, live delivery audit, deeper outputs, and admin tooling.'],
];

const nextSprintQueue = [
  ['Sprint 1: first-day setup', 'Signed pilot owner, employee, participant, vendor, red-path family, and green-path planner know what to do first without founder narration.'],
  ['Sprint 2: action consistency', 'Case creation, task actions, participant updates, vendor responses, staff setup, and exports use the same bounded action pattern.'],
  ['Sprint 3: trust and outputs', 'Permission visibility, proof destinations, prepared outputs, CSVs, family updates, and reporting all feel safe and explicit.'],
  ['Sprint 4: full QA and grade', 'Walk every persona on desktop/mobile, smoke production, grade pilot readiness, and separate blockers from broader scale work.'],
];

const productionSprintPlan = [
  ['Sprint 1: first-day setup', 'Workspace, locations/case source, employees, roles, import/create, first owner, first proof, first export.'],
  ['Sprint 2: action/proof system', 'One action surface pattern, in-place results, proof capture, waiting state, and next expected update.'],
  ['Sprint 3: trust/reporting', 'Who can see what, delivery boundaries, output packets, vendor status, support posture, and ROI explanation.'],
  ['Sprint 4: visual QA', 'Founder demo loop, red/green/participant/vendor/partner/admin surfaces, mobile, production smoke, and readiness grade.'],
];

const valueStory = [
  {
    title: 'For funeral directors',
    body: 'Passage turns repeated status calls into one family command center: what is done, what is waiting, who owns it, and proof.',
    metric: 'Fewer repeated calls',
  },
  {
    title: 'For employees',
    body: 'Staff see the next case task, what Passage prepared, what they must do, and where to record the outcome.',
    metric: 'Clear delegated work',
  },
  {
    title: 'For families',
    body: 'Families see one calm next step and can invite helpers without losing control or wondering what happened.',
    metric: 'Less confusion',
  },
  {
    title: 'For adoption',
    body: 'CSV export and demo-safe onboarding show Passage can sit on top of existing funeral-home systems.',
    metric: 'No lock-in',
  },
];

const tomorrowWorkflow = [
  'Create a case or import mapped case data with the family contact and known lifecycle dates.',
  'Move the single next task: handle it, assign it, or mark what is waiting.',
  'Use messages to coordinate family, staff, cemetery, clergy, or vendor context.',
  'Watch the activity trail instead of answering another "where are we?" call.',
  'Export the case record when the funeral home needs it in its existing system.',
];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSystemAdmin(user) {
  return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email));
}

function studioStepFromQuery(value) {
  const clean = String(value || '').toLowerCase();
  if (clean === 'tasks') return 'task';
  if (clean === 'hospice' || clean === 'during-care') return 'warm';
  if (clean === 'chat') return 'coordinate';
  if (clean === 'participant') return 'coordinate';
  if (demoSteps.some(step => step.id === clean)) return clean;
  return '';
}

export default function SystemDemo() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [selectedStep, setSelectedStep] = useState('overview');
  const [selectedChat, setSelectedChat] = useState(0);
  const [notice, setNotice] = useState('');
  const [demoStaffRows, setDemoStaffRows] = useState(staff);
  const [demoCaseRows, setDemoCaseRows] = useState(cases);
  const [urlDemoMode, setUrlDemoMode] = useState(false);
  const demoMode = urlDemoMode || router.query.demo === '1' || router.query.demoTour === 'funeral-home';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === '1' || params.get('demoTour') === 'funeral-home') {
        setUrlDemoMode(true);
        setUser({ email: 'steventurrisi@gmail.com' });
        return undefined;
      }
    }
    if (router.isReady && demoMode) {
      setUser({ email: 'steventurrisi@gmail.com' });
      return undefined;
    }
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, [router.isReady, demoMode]);

  useEffect(() => {
    if (!router.isReady) return;
    const routedStep = studioStepFromQuery(router.query.demoStep);
    if (routedStep) setSelectedStep(routedStep);
  }, [router.isReady, router.query.demoStep]);

  const activeStep = useMemo(() => demoSteps.find(step => step.id === selectedStep) || demoSteps[0], [selectedStep]);
  const currentIndex = demoSteps.findIndex(step => step.id === activeStep.id);
  const previousStep = demoSteps[Math.max(currentIndex - 1, 0)];
  const nextStep = demoSteps[Math.min(currentIndex + 1, demoSteps.length - 1)];
  const admin = isSystemAdmin(user);

  async function signIn() {
    if (!supabase || typeof window === 'undefined') return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  function demoAction(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  }

  function addDemoEmployee() {
    setDemoStaffRows((rows) => [...rows, ['Demo arranger', 'Added during this demo only. Routes service-prep tasks and family follow-up.']]);
    demoAction('Demo employee added locally. No staff account or production record was created.');
  }

  function addDemoFamily() {
    setDemoCaseRows((rows) => [...rows, ['Turrisi Family', 'At-need', 'First 48 hours active', 'Demo location']]);
    demoAction('Demo family case added locally. No real estate or Supabase row was created.');
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader user={user} onSignIn={signIn} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '30px 28px 64px' }}>
        {!user && (
          <Panel>
            <div style={eyebrow}>System admin demo</div>
            <h1 style={h1}>Sign in to open the Passage demo studio.</h1>
            <p style={lead}>This surface is for Passage system admins only. Real funeral homes and families should not see demo controls.</p>
            <button onClick={signIn} style={primaryButton}>Continue with Google</button>
          </Panel>
        )}

        {user && !admin && (
          <Panel>
            <div style={eyebrow}>System admin only</div>
            <h1 style={h1}>This demo studio is not available for this account.</h1>
            <p style={lead}>Use the normal funeral-home dashboard for partner work.</p>
            <Link href="/funeral-home/dashboard" style={secondaryLink}>Open funeral-home dashboard</Link>
          </Panel>
        )}

        {user && admin && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 22, alignItems: 'start' }}>
              <Panel>
                <div style={eyebrow}>System admin sales demo</div>
                <h1 style={{ ...h1, maxWidth: 720 }}>A guided walkthrough for funeral-home directors.</h1>
                <p style={{ ...lead, maxWidth: 760 }}>A clean, dummy-only walkthrough. Each step shows one screen and one sales point so the director is not overwhelmed.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
                  <button onClick={() => router.push('/funeral-home?demoTour=funeral-home&demoStep=overview')} style={primaryButton}>Start guided product tour</button>
                  <Link href="/funeral-home/dashboard?demoTour=funeral-home&demoStep=dashboard" style={primaryLink}>Open live dashboard demo</Link>
                  <button onClick={() => demoAction('Demo reset: use the dummy cases, staff, messages, vendor loop, and export close below. No real estate data is touched.')} style={secondaryButton}>Reset dummy demo</button>
                </div>
              </Panel>

              <Panel>
                <div style={eyebrow}>Demo order</div>
                <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 16, padding: 14, marginBottom: 10 }}>
                  <div style={{ color: C.sage, fontSize: 11, fontWeight: 900 }}>STEP {currentIndex + 1} OF {demoSteps.length}</div>
                  <div style={{ fontSize: 19, fontWeight: 900, marginTop: 4 }}>{activeStep.title}</div>
                </div>
                <details>
                  <summary style={{ cursor: 'pointer', color: C.sage, fontWeight: 900 }}>Show full order</summary>
                  <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  {demoSteps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => setSelectedStep(step.id)}
                      style={{ textAlign: 'left', border: '1px solid ' + (activeStep.id === step.id ? C.sage : C.border), background: activeStep.id === step.id ? C.sageFaint : C.card, borderRadius: 14, padding: 12, cursor: 'pointer', fontFamily: 'Georgia,serif' }}
                    >
                      <div style={{ color: activeStep.id === step.id ? C.sage : C.soft, fontSize: 11, fontWeight: 900 }}>Step {index + 1} - {step.kicker}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, marginTop: 3 }}>{step.title}</div>
                    </button>
                  ))}
                  </div>
                </details>
              </Panel>

              <Panel>
                <div style={eyebrow}>Production-readiness loop</div>
                <h2 style={{ ...h2, fontSize: 28 }}>Four sprints to pilot confidence.</h2>
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  {productionSprintPlan.map(([label, body], index) => (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', gap: 9, alignItems: 'start', background: C.bg, border: '1px solid ' + C.border, borderRadius: 12, padding: '9px 10px' }}>
                      <span style={{ width: 24, height: 24, borderRadius: 999, background: C.sageFaint, color: C.sage, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11 }}>{index + 1}</span>
                      <span>
                        <strong style={{ color: C.ink }}>{label}</strong>
                        <span style={{ display: 'block', ...smallText }}>{body}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {notice && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 14, padding: 14, marginTop: 16, fontWeight: 900 }}>{notice}</div>}

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 22, marginTop: 22, alignItems: 'start' }}>
              <Panel>
                <div style={eyebrow}>{activeStep.kicker}</div>
                <h2 style={h2}>{activeStep.title}</h2>
                <p style={lead}>{activeStep.point}</p>
                <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 16, padding: 16, marginTop: 14 }}>
                  <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Say this</div>
                  <div style={{ fontSize: 17, lineHeight: 1.45, marginTop: 6 }}>{activeStep.action}</div>
                </div>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 16 }}>
                  <button onClick={() => setSelectedStep(previousStep.id)} style={secondaryButton} disabled={currentIndex === 0}>Back</button>
                  <button onClick={() => setSelectedStep(nextStep.id)} style={primaryButton} disabled={currentIndex === demoSteps.length - 1}>Next demo moment</button>
                  <Link href={activeStep.href} style={secondaryLink}>Open this product moment</Link>
                </div>
              </Panel>

              <DemoStage
                activeStepId={activeStep.id}
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
                demoAction={demoAction}
                staffRows={demoStaffRows}
                caseRows={demoCaseRows}
                addDemoEmployee={addDemoEmployee}
                addDemoFamily={addDemoFamily}
              />
            </section>

            <details style={{ marginTop: 22 }}>
              <summary style={{ cursor: 'pointer', color: C.sage, fontWeight: 900, background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 16 }}>Show full guided demo: nine product moments</summary>
              <Panel style={{ marginTop: 12 }}>
                <div style={eyebrow}>Guided demo path</div>
                <h2 style={h2}>One story, nine product moments.</h2>
                <p style={{ ...lead, maxWidth: 820 }}>Use this as the operator-safe spine for demos. Every stop opens the actual product surface that should prove the claim, with dummy-safe links where the flow touches participants or vendors.</p>
                <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
                {demoRail.map(step => (
                  <div key={step.n} style={{ display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 12, alignItems: 'center', background: C.bg, border: '1px solid ' + C.border, borderRadius: 15, padding: 12 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.sageFaint, color: C.sage, fontWeight: 900 }}>{step.n}</span>
                    <span style={{ minWidth: 0 }}>
                      <strong style={{ color: C.ink, fontSize: 16 }}>{step.title}</strong>
                      <span style={{ display: 'block', color: C.soft, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900, marginTop: 2 }}>{step.persona}</span>
                      <span style={{ display: 'block', color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}><strong>What to highlight:</strong> {step.proof}</span>
                      <span style={{ display: 'block', color: C.sage, fontSize: 12.5, lineHeight: 1.45, marginTop: 2 }}><strong>Why it matters:</strong> {step.value}</span>
                      <Link href={step.route} style={{ ...tinyPill, textDecoration: 'none', display: 'inline-flex', marginTop: 8 }}>Open step</Link>
                    </span>
                  </div>
                ))}
                </div>
              </Panel>
            </details>

            <details style={{ marginTop: 22 }}>
              <summary style={{ cursor: 'pointer', color: C.sage, fontWeight: 900, background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 16 }}>Demo appendix: product map, readiness checks, and close</summary>
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 22, marginTop: 16, alignItems: 'start' }}>
                <Panel>
                  <div style={eyebrow}>Connected product map</div>
                  <h2 style={h2}>Every demo stop points to the same task spine.</h2>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {ecosystemPaths.map((path) => (
                      <div key={path.title} style={{ ...smallCard, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 900 }}>{path.title}</div>
                          <div style={smallText}>{path.body}</div>
                        </div>
                        <Link href={path.href} style={{ ...tinyPill, textDecoration: 'none' }}>{path.label}</Link>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <div style={eyebrow}>Readiness checks</div>
                  <h2 style={h2}>Demo boundaries.</h2>
                  <div style={{ display: 'grid', gap: 9 }}>
                    {readinessChecks.map((check) => (
                      <div key={check} style={{ display: 'grid', gridTemplateColumns: '24px minmax(0,1fr)', gap: 9, alignItems: 'start', color: C.mid, lineHeight: 1.45 }}>
                        <span style={{ color: C.sage, fontWeight: 900 }}>OK</span>
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </section>
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 22, marginTop: 16, alignItems: 'start' }}>
                <Panel>
                  <div style={eyebrow}>Production readiness</div>
                  <h2 style={h2}>Where Passage is now.</h2>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {productionReadiness.map(([label, status, body]) => (
                      <div key={label} style={{ ...smallCard, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: 12 }}>
                        <div>
                          <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                          <div style={{ color: status === 'Strong' || status === 'Ready' ? C.sage : C.amber, fontWeight: 900, marginTop: 4 }}>{status}</div>
                        </div>
                        <div style={smallText}>{body}</div>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <div style={eyebrow}>Sales readiness</div>
                  <h2 style={h2}>What to sell, discover, and avoid.</h2>
                  <div style={{ display: 'grid', gap: 9, marginBottom: 12 }}>
                    {salesReadiness.map(([label, audience, body]) => (
                      <div key={label} style={{ ...smallCard, background: label === 'Sell now' ? C.sageFaint : label === 'Do not sell yet' ? C.roseFaint : C.bg }}>
                        <strong style={{ color: C.ink }}>{label}: {audience}</strong>
                        <div style={smallText}>{body}</div>
                      </div>
                    ))}
                  </div>
                  <div style={eyebrow}>Next sprint queue</div>
                  <h2 style={{ ...h2, fontSize: 28 }}>What still closes the loop.</h2>
                  <div style={{ display: 'grid', gap: 9 }}>
                    {nextSprintQueue.map(([label, body]) => (
                      <div key={label} style={{ borderTop: '1px solid ' + C.border, paddingTop: 9 }}>
                        <strong style={{ color: C.ink }}>{label}</strong>
                        <div style={smallText}>{body}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 16, padding: 14 }}>
                    <div style={eyebrow}>Production-readiness loop</div>
                    <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                      {productionSprintPlan.map(([label, body], index) => (
                        <div key={label} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', gap: 9, alignItems: 'start', background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: '9px 10px' }}>
                          <span style={{ width: 24, height: 24, borderRadius: 999, background: C.sageFaint, color: C.sage, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11 }}>{index + 1}</span>
                          <span>
                            <strong style={{ color: C.ink }}>{label}</strong>
                            <span style={{ display: 'block', ...smallText }}>{body}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>
              </section>
            </details>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

function DemoStage({ activeStepId, selectedChat, setSelectedChat, demoAction, staffRows, caseRows, addDemoEmployee, addDemoFamily }) {
  if (activeStepId === 'overview') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>The 12-minute loop.</h2>
        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          {fullLoop.map(([n, title, body]) => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: '32px minmax(0, 1fr)', gap: 10, background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 999, background: C.sageFaint, color: C.sage, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{n}</span>
              <span>
                <strong style={{ color: C.ink }}>{title}</strong>
                <span style={{ display: 'block', color: C.mid, fontSize: 13, lineHeight: 1.4, marginTop: 2 }}>{body}</span>
              </span>
            </div>
          ))}
        </div>
        <h2 style={{ ...h2, fontSize: 24 }}>The one-sentence value story.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {valueStory.map((item) => (
            <div key={item.title} style={smallCard}>
              <span style={tinyPill}>{item.metric}</span>
              <div style={{ fontSize: 18, fontWeight: 900, marginTop: 10 }}>{item.title}</div>
              <div style={smallText}>{item.body}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <Link href="/vendors/request?demo=1" style={{ ...tinyButton, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Open vendor demo request
          </Link>
          <button onClick={() => demoAction('Demo: vendor accepts, updates progress, then marks complete. Family and funeral home see status without a sales directory.')} style={tinyButton}>
            Explain vendor loop
          </button>
        </div>
      </Panel>
    );
  }

  if (activeStepId === 'warm') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>Warm path continuity.</h2>
        <p style={{ ...lead, marginBottom: 14 }}>Use this stop to show that Passage can start before the death event without becoming hospice, facility, or clinical software. The family owns the record, prepares the first-hour plan, and approves any handoff.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 14 }}>
          {[
            ['Family enters during care', 'Hospice or facility contact, caregiver, family coordinator, and preferred funeral home if known.'],
            ['Passage prepares', 'First-hour plan, family update list, and funeral-home handoff packet.'],
            ['Red path activates', 'When death occurs, the urgent path starts with existing context.'],
            ['Funeral home receives context', 'Director sees dates, authority, preferences, blockers, and missing items after family approval.'],
          ].map(([title, body]) => (
            <div key={title} style={smallCard}>
              <div style={{ fontSize: 17, fontWeight: 900 }}>{title}</div>
              <div style={smallText}>{body}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/hospice?demoTour=funeral-home&demoStep=warm" style={{ ...tinyButton, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Open warm path</Link>
          <Link href="/share?dn=Jack%20Taylor&cn=Taylor%20family" style={{ ...tinyButton, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Show family-record one-pager</Link>
          <Link href="/packet?demoTour=funeral-home&demoStep=warm" style={{ ...tinyButton, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Show packet outputs</Link>
          <button onClick={() => demoAction('Demo: care preparation becomes a reviewed handoff packet. Nothing is shared until the family approves it.')} style={tinyButton}>Explain handoff</button>
        </div>
      </Panel>
    );
  }

  if (activeStepId === 'team') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>First-day pilot setup.</h2>
        <p style={{ ...lead, marginBottom: 14 }}>Show the signed-in owner what to do first: confirm the workspace, set location/case scope, add employees and roles, then either import existing cases by CSV or create the first family case fresh in the UI.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 9, marginBottom: 14 }}>
          {[
            ['Workspace', 'Partner record and operating spine are active.'],
            ['Locations', 'Case/import data becomes the location filter and reporting scope.'],
            ['Employees', 'Roles make people assignable before work is delegated.'],
            ['Cases', 'Import CSV with preview or create a first case fresh.'],
            ['Proof loop', 'Every first action closes back to status and reporting.'],
          ].map(([title, body]) => (
            <div key={title} style={smallCard}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{title}</div>
              <div style={smallText}>{body}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {staffRows.map(([role, body], index) => (
            <div key={role + index} style={smallCard}>
              <div style={{ fontSize: 17, fontWeight: 900 }}>{role}</div>
              <div style={smallText}>{body}</div>
            </div>
          ))}
        </div>
        <button onClick={addDemoEmployee} style={{ ...tinyButton, marginTop: 12 }}>Add dummy employee</button>
      </Panel>
    );
  }

  if (activeStepId === 'case') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>Dummy case inbox.</h2>
        <p style={{ ...lead, marginBottom: 14 }}>Only dummy families appear here. This is where you show a case can be opened quickly without touching real estate data.</p>
        <div style={{ display: 'grid', gap: 9 }}>
          {caseRows.map(([name, type, status, location], index) => (
            <div key={name + index} style={{ ...smallCard, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{name}</div>
                <div style={smallText}>{type} - {location} - {status}</div>
              </div>
              <button onClick={() => demoAction(`${name} opened in the dummy talk track. No real case record was opened or changed.`)} style={tinyButton}>Preview</button>
            </div>
          ))}
        </div>
        <button onClick={addDemoFamily} style={{ ...tinyButton, marginTop: 12 }}>Add dummy family</button>
      </Panel>
    );
  }

  if (activeStepId === 'task') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>One task, one outcome.</h2>
        <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 16, padding: 16 }}>
          <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Do this next</div>
          <h3 style={{ margin: '7px 0 5px', fontSize: 24 }}>Confirm hospital release process</h3>
          <p style={{ color: C.mid, lineHeight: 1.55, margin: 0 }}>Passage gives the staff script, tracks who owns it, and records release proof before marking it handled.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button onClick={() => demoAction('Demo: task assigned to the coordinator. Family sees "waiting on funeral home."')} style={tinyButton}>Assign to coordinator</button>
            <button onClick={() => demoAction('Demo: proof recorded. The audit log shows actor, note, and timestamp.')} style={tinyButton}>Record proof</button>
            <button onClick={() => demoAction('Demo: family information requested. The family sees exactly what is missing.')} style={tinyButton}>Need family info</button>
          </div>
        </div>
      </Panel>
    );
  }

  if (activeStepId === 'delegation') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>Delegation without confusion.</h2>
        <p style={{ ...lead, marginBottom: 14 }}>Employees, family helpers, vendors, clergy, cemetery, and funeral-home staff are not the same actor. The task spine keeps the action the same while the view changes by role.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {[
            ['Employee task', 'Appears in the funeral-home work queue.'],
            ['Family helper task', 'Appears in the participant view with accept, waiting, handled, and help.'],
            ['Vendor task', 'Appears in the vendor request loop only when the task needs local support.'],
          ].map(([title, body]) => (
            <div key={title} style={smallCard}>
              <div style={{ fontSize: 17, fontWeight: 900 }}>{title}</div>
              <div style={smallText}>{body}</div>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  if (activeStepId === 'coordinate') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>Task-native coordination.</h2>
        <p style={{ ...lead, marginBottom: 14 }}>The demo should prove the director can coordinate family, staff, cemetery, clergy, and vendors from one case task without creating another phone tree.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 9, marginBottom: 14 }}>
          {coordinationLayers.map(([title, body]) => (
            <div key={title} style={smallCard}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{title}</div>
              <div style={smallText}>{body}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {mockChats.map((chat, index) => (
            <button key={chat.title} onClick={() => setSelectedChat(index)} style={{ ...tinyButton, background: selectedChat === index ? C.sage : C.sageFaint, color: selectedChat === index ? '#fff' : C.sage }}>{chat.title}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {mockChats[selectedChat].messages.map(([sender, body], index) => (
            <div key={sender + index} style={{ background: index % 2 ? C.bg : C.sageFaint, border: '1px solid ' + C.border, borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 12, color: C.sage, fontWeight: 900 }}>{sender}</div>
              <div style={{ fontSize: 15, color: C.mid, lineHeight: 1.45, marginTop: 3 }}>{body}</div>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  if (activeStepId === 'vendor') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>Vendor support stays inside the task.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {[
            ['Preferred local support', 'Vendor appears inside the task only.'],
            ['Viewed -> Quoted -> Accepted', 'Response loop stays visible to family and home.'],
            ['Passage stays central', 'The family does not get pushed into a vendor directory.'],
          ].map(([title, body]) => (
            <div key={title} style={smallCard}>
              <div style={{ fontSize: 17, fontWeight: 900 }}>{title}</div>
              <div style={smallText}>{body}</div>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div style={eyebrow}>Demo screen</div>
      <h2 style={h2}>ROI, portability, and daily use.</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 9, marginBottom: 16 }}>
        {demoMetrics.map(([label, value]) => (
          <div key={label} style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 12 }}>
            <div style={{ color: C.sage, fontSize: 21, fontWeight: 900, lineHeight: 1 }}>{value}</div>
            <div style={{ color: C.mid, fontSize: 11.5, fontWeight: 900, marginTop: 5 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 16 }}>
        {[
          ['Import mapping', 'Upload a case export, map columns, preview rows, then import only after review.'],
          ['Case summary CSV', 'Clean handoff for existing case systems: contacts, dates, references, counts, status.'],
          ['Full spine CSV', 'Operational proof export: tasks, messages, vendors, proof requirements, and activity.'],
          ['Date range reports', 'Weekly, monthly, or last-30-day exports for directors and location managers.'],
        ].map(([title, body]) => (
          <div key={title} style={smallCard}>
            <div style={{ fontSize: 17, fontWeight: 900 }}>{title}</div>
            <div style={smallText}>{body}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {tomorrowWorkflow.map((item, index) => (
          <div key={item} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr)', gap: 10, alignItems: 'start' }}>
            <span style={{ width: 30, height: 30, borderRadius: 999, background: C.sageFaint, color: C.sage, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{index + 1}</span>
            <span style={{ color: C.mid, lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
      </div>
      <button onClick={() => demoAction('Demo: mapped import plus summary/full-spine exports show Passage can sit on top of the funeral home system without locking data in.')} style={{ ...tinyButton, marginTop: 14 }}>Show portability close</button>
    </Panel>
  );
}

function Panel({ children, style }) {
  return <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.05)', ...(style || {}) }}>{children}</div>;
}

const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 36, lineHeight: 1.08, margin: '8px 0 10px', fontWeight: 400 };
const h2 = { fontSize: 30, lineHeight: 1.12, margin: '8px 0 10px', fontWeight: 400 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0 };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const primaryLink = { ...primaryButton, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
const secondaryButton = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
const smallCard = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 15, padding: 14 };
const smallText = { color: C.mid, fontSize: 13.5, lineHeight: 1.5, marginTop: 4 };
const tinyButton = { border: '1px solid #c8deca', background: C.sageFaint, color: C.sage, borderRadius: 11, padding: '8px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const tinyPill = { border: '1px solid #c8deca', background: C.sageFaint, color: C.sage, borderRadius: 11, padding: '8px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, whiteSpace: 'nowrap', fontSize: 13 };
