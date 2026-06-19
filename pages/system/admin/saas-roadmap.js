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
  ['Primary buyer', 'Funeral homes', 'B2B operating workflow first; B2C becomes easier once the funeral-home workflow is solid.'],
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
  {
    title: 'Meaningful deploy batches only',
    body: 'Batch fixes into one coherent release: production build repair, one persona/functionality slice, or one roadmap milestone. Avoid small copy-only deploy chains that can trigger Vercel limits and hide the real failing commit.',
  },
];

const takeaways = [
  ['Funeral-home action-card QA', 'Deployed green / source continuing', 'Latest green production fixed the broken address component, then clarified funeral-home director/staff cards into action needed, owner, waiting on, proof/status, prepared output, and one primary action. Current source routes login, pricing, participant, vendor, funeral-home setup, and roadmap sign-in through the same client Google starter so buttons do not silently depend on mixed OAuth paths.'],
  ['Public funeral-home page', 'Reworked', 'Removed ARR/pilot-proof sales math from the funeral-home page and reframed it around calmer family/staff coordination.'],
  ['Shared navigation', 'Reworked', 'Removed scattered Roadmap, QA, Pilot health, and Abuse links from the top navigation; public navigation is now audience-led and system routes render a System Admin boundary.'],
  ['Public surface scan', 'Source green', 'Current source exact-search is clean for command center, family task, and coordination spine; customer-facing copy now favors family record, request, dashboard, next step, owner, waiting point, and proof; the shared brand tagline no longer exposes spine language.'],
  ['Live public UAT sweep', 'Production green at latest main / source QA active', 'Production is green at latest main after the SmartAddressInput build repair. Continue batching meaningful QA slices, verify X-Passage-Commit after each deploy, and keep public/customer pages free of owner-only language.'],
  ['Persona UAT matrix', 'Chrome UAT active / browser-use bridge blocked', 'Source-audited funeral-home dashboard/staff/cases, vendor onboard/login/request, participant helper requests, care-provider landing, and admin readiness gates for language clarity, action ownership, waiting point, proof, and privacy boundary. The in-app browser-use bridge still refuses the trusted connection, but Chrome-controlled UAT hydrated the funeral-home director and staff demo routes. Staff action dialogs for Mark waiting, Request family info, and Close with proof opened correctly and showed owner, waiting state, proof destination, prepared copy, and demo-safe no-send behavior. Final persona signoff still needs the queued source deployed and rechecked on www.'],
  ['Task-card and request-card clarity', 'Source and production active', 'Family and funeral-home cards now use a concrete operator contract: 1. do next, owner, waiting party, message to send or use, status/proof, and privacy boundary. Shared action confirmations, exports, owner assignment hints, bulk assignment notices, help text, dialogs, reports, communication events, reminders, assignment APIs, send/status APIs, vendor request APIs, and expected-update copy now default to next-step/request/client-step language so internal task wording is less likely to leak across personas. The visual model must always show who is involved, who owns the next step, what message Passage prepared, what the user does now, what is waiting, and where proof saves. Public/vendor/helper wording favors request, record, owner, waiting point, proof, and next step; participant confirmations and dialogs now say request instead of task, vendor/care-provider copy no longer leaks task wording or noisy payout-fee language into scoped external requests, and the funeral-home sample case now says work action/work outcomes. Latest queued source also cleans funeral-home export headers, assignment dialog labels, event labels, and close-action aria text from work/task wording into client-step language. Deploy still needs custom-domain/browser verification after Vercel rate limits and www routing are corrected.'],
  ['Form validation UAT', 'Source fixed / live domain stale', 'Vendor onboarding now requires business name, ZIPs, and email before submit state, care-provider inquiry shows required organization plus email, and funeral-home setup now requires funeral-home name plus main location before creating a dashboard. Recheck live once www points at latest main.'],
  ['Green-path onboarding lookup', 'Source fixed / batched deploy queued', 'Address entry now has a Passage-controlled fallback: server suggestions run when GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY is configured, Google script failures are handled, and users can choose Use typed address instead of getting stuck. Production currently returns configured:false from /api/addressAutocomplete, so add the Google Places server key in Vercel production before calling lookup UAT complete. Recheck urgent green-path, funeral-home setup, vendor onboarding, and any care-provider address capture once Vercel deploys.'],
  ['Support and sign-in reliability', 'Production fixed / source hardening active', 'Removed the dead support email from contact/footer surfaces, routed contact form delivery to CONTACT_TO_EMAIL first with owner email fallback, unified Google sign-in entry points through /auth/google across public, persona, funeral-home, vendor, estate, urgent, and admin surfaces, and made Google sign-in failures visible on global login, vendor login, funeral-home setup, participant access, System Admin, and this roadmap. Supabase Google provider responds with a 302 to Google Accounts for the Passage redirect; next browser pass must verify the returned session and role landing page.'],
  ['Admin session UAT', 'Production green / recheck active', 'Admin users now get a dedicated Admin action outside the public audience nav, and System Admin remains the single internal cabinet. Recheck on www after the correct production domain is pointing at latest main.'],
  ['Release configuration', 'P0 duplicate production targets', 'GitHub reports two Vercel production contexts on each commit: thepassageappio and you-are-working-on-a-production. Both targets are now rate-limited from repeated small deploys, so remove/disable the stray production target, keep meaningful deploy batches only, confirm which project owns www, and purge Cloudflare/cache before public promotion. Middleware adds X-Passage-Commit and no-store headers for non-static responses.'],
  ['Admin operating model', 'Reworked', 'Internal tools live in the System Admin cabinet with grouped accordions; enterprise readiness now uses task readiness / funeral-home workflow language instead of spine jargon, and no standalone roadmap/QA/admin top-level tabs should exist.'],
  ['Funeral-home product UX', 'Action-card pass deployed / QA active', 'Director/staff dashboard now uses Director Focus, My Day, Case at a glance, Recommended next action, quote-review attention, a case-level vendor quote decision block, client-step contracts, one primary action, one waiting action, collapsed More actions, what Passage prepared, what staff does next, waiting point, proof saves, support cues, family-visible proof, and customer-safe setup, invite, queue, vendor preference, and billing language with visible pilot/trial wording, quote-accepted labels, and raw plan ids removed from the customer dashboard. The latest source pass reframes confusing task/work-item language into client step, family request, owner, waiting point, prepared output, proof, and director support, so funeral-home teams can manage the family relationship instead of interpreting internal task mechanics. Setup now uses funeral-home/customer language, a logged-out recommended next action, a required-info gate, direct demo-dashboard access, and first next-step/client-step wording instead of partner/task wording. Inbound family requests now show clean contact separators and operator-safe accept/decline/convert controls. Chrome UAT verified My Day, Director Focus, quote-review attention, case context, prepared output, and staff action dialogs for Mark waiting, Request family info, and Close with proof on the current green production build. Latest queued source removes visible work-item/close-task wording from the funeral-home dashboard and shared action event titles; it needs Vercel deploy after the rate limit clears.'],
  ['Family, care, participant, and vendor UX', 'Production/source pass active', 'B2C, urgent, planning, hospice/care-prep, participant, vendor, and care-provider flows now favor family record, request, next step, owner, waiting point, proof, and scoped access. Family homepage/dashboard/workspace copy now says who owns each next step, prepared output, proof, active plan, request details, open items, and next-step lists without broken placeholder separators or visible task-board language. Participant and vendor surfaces now say own the request, show what is waiting, save completion proof, and approve quote before work starts instead of accept/mark-completed/task language. Vendor lifecycle labels now say Quote Approved, approval/payment next step, and approve-and-pay; scoped vendor request pages no longer say family/funeral home accepts the quote, and both visible and legacy vendor response paths now prevent schedule/complete actions before approval/payment. Vendor onboarding, care-provider inquiry, hospice/care-prep, contact, participant landing, and funeral-home public copy now use provider/care-team/request/waiting-point language and avoid vague partner/stuck/internal wording. Participant scoped-access copy now says request/timing/proof instead of task, family workspace and urgent first-hour flows now say request/open item/proof instead of task-board language, shared playbook/workspace copy now avoids partner/task leakage in prepared outputs, and care-prep dates stay visible as waiting items instead of tasks. Vendor request flow now requires the proper sequence: send quote, family/funeral-home approval and payment, mark scheduled, then save completion proof; both the request UI and response API block premature completion. Live www must still be rechecked after routing/cache is fixed and Vercel deploys resume.'],
  ['Automation layer', 'Source updated / deploy blocked by rate limit', 'Timing-aware next-action scoring now feeds funeral-home recommendations, family execution lanes use Passage prepared / guided / manual-step language, shared playbook/workspace explanations avoid task-board wording, and admin readiness quantifies automated, semi-automated, and manual work with the blockers preventing automation. Next deploy must browser-verify visible timing, why-now reasons, and automation coverage.'],
  ['Abuse and refresh controls', 'Source green / deploy blocked by rate limit', 'Outbound sends, reminders, partner invites, staff invites, prep emails, Google lookups, voice calls, family-update fanout, funeral-home requests, and admin readiness refreshes now have source-level cooldowns, QA-safe email routing, and readiness evidence.'],
];

const sprints = [
  {
    name: 'Sprint 1: Boundary and public clarity',
    status: 'Source guarded / live domain stale',
    owner: 'Product + QA',
    goal: 'Make it impossible for external users to see owner-only strategy, QA, or admin concepts.',
    tasks: [
      'Keep shared header audience-led; show the dedicated Admin action only to true system admins and keep all internal tools inside System Admin.',
      'Keep public readiness checks blocking ARR, sprint, roadmap, QA, founder/internal language, command center, family task, and coordination spine.',
      'Audit homepage, funeral-home, urgent, planning, hospice/care-prep, pricing, contact, participants, vendors, and care-provider pages after every deploy; verify the X-Passage-Commit header matches latest main; block launch if www serves older copy than the latest green main deployment.',
      'Move any internal tool discovery into System Admin instead of creating new top-level tabs.',
    ],
    acceptance: 'A prospect sees only the product value, not Passage operating commentary.',
  },
  {
    name: 'Sprint 2: Funeral-home dashboard simplification',
    status: 'Client-step UX committed / deploy queued',
    owner: 'Product + engineering',
    goal: 'Make funeral-home director and staff workflows obvious, calm, and operationally useful.',
    tasks: [
      'Director dashboard becomes My Day, cases needing action, staff load, family updates, exports, billing, and proof.',
      'Staff view shows assigned client steps first as a simple pattern: what is needed, owner does next, waiting on, prepared message/output, status, proof, and what to do when support is needed; deeper automation detail stays collapsed until needed.',
      'Remove demo/sales language from logged-in funeral-home operations.',
      'Use staff-facing terms like needs help, stuck point, family can see, earlier step, and where proof saves instead of blocker, dependency, orchestration, or audit-layer wording.',
      'Add recommended next action based on pre-death, day since death, service window, aftercare, needs-help state, stale waiting, and missing proof.',
      'Browser-verify My Day, Case at a glance, Recommended next action, vendor quote decision block, estate quote/payment handoff, Request family info, Record proof / close, Mark waiting, inbound family requests, and work-card copy.',
    ],
    acceptance: 'A funeral director or employee can open one case, know the client relationship context, exactly what Passage prepared, what they must do, who is waiting, what the family can see, how to ask for support, and where proof saves.',
  },
  {
    name: 'Sprint 3: Automation layer hardening',
    status: 'Source hardening active / live domain verification pending',
    owner: 'Engineering + QA',
    goal: 'Make Passage proactive instead of a passive task list.',
    tasks: [
      'Persist workflow state above task rows: ready, waiting, needs help, stale, proof missing, family update due, aftercare due, with persona-safe action confirmations.',
      'Generate or suggest the next task and draft the right message to the right person.',
      'Fail readiness when owner, waiting point, prepared message route, proof destination, delivery trail, privacy boundary, automation classification, or rate-limit posture is missing.',
      'Track automated, semi-automated, and manual work by case, expose the blocker preventing automation, and keep refresh/rate-limit controls visible as owner-only launch gates with UI cooldowns as well as backend throttles.',
    ],
    acceptance: 'The product tells staff what to do next, why, and what proof will be saved.',
  },
  {
    name: 'Sprint 4: Persona UAT pass',
    status: 'Active source UAT / latest batch Vercel rate-limited',
    owner: 'QA persona lead',
    goal: 'Walk every role end to end on desktop and mobile.',
    tasks: [
      'Family coordinator: urgent setup, planning setup, care-prep record, one recommended next action, request/open-item language, what Passage prepares, where proof saves, approvals, family updates, aftercare, and care-team waiting items.',
      'Participant/helper: one scoped request, one response path, privacy boundary, authority boundary, own/show-waiting/help/done-with-proof actions, saved proof, and no public task wording.',
      'Funeral-home director: cases, staff, proof, family update approval, reports, export, billing, inbound family requests, and clear work-card contracts.',
      'Funeral-home employee: assigned work, context, drafted message, waiting/stuck-point state, family-visible boundary, close-with-proof, and no unclear extra actions.',
      'Vendor: scoped request, quote/update, quote approval, scheduled work, completion proof, no family-record browsing, and required-field validation that never feels stuck.',
      'Green-path onboarding: address/funeral-home lookup must show suggestions when the Vercel Google Places server key is configured and Use typed address when Maps or server suggestions are unavailable; no user should be trapped by a silent dropdown failure.',
      'Access reliability: global login, pricing checkout, estate, urgent, funeral-home dashboard/setup/staff, vendor, participant, invite accept, and System Admin sign-in buttons must all use /auth/google, show a clear failure state and alternate path when auth is missing or OAuth fails, and land the user back in the intended role page.',
    ],
    acceptance: 'Every persona has one clear next action, action pending/status/proof language, and no internal product language.',
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
  ['Vendor', 'Apply with required-field guidance, understand the job, timing, quote/payment state, obligation boundary, recommended next action, and completion proof.'],
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
  const [authError, setAuthError] = useState('');

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
    setAuthError('');
    if (typeof window === 'undefined') return;
    const next = window.location.pathname + window.location.search;
    window.location.assign('/auth/google?next=' + encodeURIComponent(next || '/system/admin/saas-roadmap'));
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
            {authError && <div style={{ marginTop: 12, background: C.roseFaint, border: `1px solid ${C.rose}33`, color: C.rose, borderRadius: 12, padding: '10px 12px', fontSize: 13.5, lineHeight: 1.45 }}>{authError}</div>}
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
            <p style={lead}>The target is a $300k ARR Passage business with B2B funeral homes as the wedge and B2C made simple by a strong funeral-home operating workflow.</p>
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
