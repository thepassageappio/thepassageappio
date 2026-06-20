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
    title: 'Agent handoff lives in the repo',
    body: 'Future agents must read AGENTS.md and docs/agent-operating-context.md before work, then update that context before handoff. Agent notes are not public pages and must not become a second roadmap.',
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
  {
    title: 'Findings become backlog',
    body: 'When the loop finds an issue outside the active sprint, Product Manager classifies it as fix now, backlog, roadmap update, watch item, or owner gate. Roadmap changes happen here only when priority, sprint order, milestone wording, or product doctrine changes.',
  },
];



const experienceDoctrine = [
  {
    title: 'Five-year-old clarity',
    body: 'Every screen should answer: what is this, what do I do now, who is waiting, and what happens after I click? Use plain words, one primary action, and visible confirmation.',
  },
  {
    title: 'Smart below the surface',
    body: 'The system can use timing, role, service dates, authority, dependencies, stale waiting, proof gaps, and automation maturity internally, but the user should see a calm recommendation instead of exposed machinery.',
  },
  {
    title: 'Empathetic by default',
    body: 'Assume users are grieving, busy, interrupted, or not technical. Copy should reduce shame and uncertainty: nothing sends without review, proof is saved, and help/escalation is always available.',
  },
  {
    title: 'Proactive, not passive',
    body: 'Passage should recommend the next move, prepare the message or packet, name the owner, prevent premature actions, and keep waiting points from disappearing.',
  },
  {
    title: 'Automation improves over time',
    body: 'Every operating step should be tagged manual, semi-automated, or automated. The product goal is to safely move more repeated work into prepared drafts, routed requests, logged updates, and eventually full automation where review is no longer needed.',
  },
  {
    title: 'Future-ready without noise',
    body: 'Build for multi-location funeral homes, vendors, care facilities, families, permissions, reporting, billing, and automation, but reveal only what each role needs in that moment.',
  },
  {
    title: 'Beautiful because it is calm',
    body: 'The experience should feel organized, restrained, warm, and dependable. Beauty comes from hierarchy, spacing, clarity, predictable actions, and not making people decode the product.',
  },
];

const operatingArchitecture = [
  {
    title: 'Shared case record',
    body: 'One case record sits underneath family, funeral-home, care-provider, participant, and vendor views. Each persona sees only their role, permissions, next step, messages, proof, and status trail.',
  },
  {
    title: 'Operating step contract',
    body: 'Every step has the same contract: what is happening, owner, waiting party, prepared output, human action, visibility, proof destination, automation level, and next status. This replaces vague task cards with one predictable interaction model.',
  },
  {
    title: 'Persona dashboards',
    body: 'Dashboards are role-specific views over the same record: directors manage risk and staff load, employees complete assigned work, families see reassurance and one ask, vendors see scoped requests, and care providers see handoff duties only.',
  },
  {
    title: 'Proof, automation, and reporting layer',
    body: 'Every meaningful action creates proof: status event, owner, timestamp, message or packet, delivery/visibility boundary, vendor quote/payment state, automation classification, and export/report inclusion.',
  },
];

const funeralHomeDashboardModel = [
  {
    title: 'Director dashboard',
    body: "First screen: Today's risk, cases needing action, unowned waiting points, staff load, family updates due, vendor quotes needing approval, proof gaps, service-window pressure, and reports/export controls.",
  },
  {
    title: 'Employee dashboard',
    body: 'First screen: assigned client steps only, case context, one primary action, prepared message/output, waiting state, proof field, escalation to director, and no billing/admin noise.',
  },
  {
    title: 'Case dashboard',
    body: 'One case page organized by operating state: next move, family relationship status, timeline, staff ownership, vendor support, proof trail, messages, exports, and reporting impact.',
  },
  {
    title: 'Relationship dashboard',
    body: 'A funeral home should know what the family has heard, what they are waiting on, who owns the next communication, what can be said safely, and which proof backs it up.',
  },
];


const communicationArchitecture = [
  {
    title: 'Audience-aware messages',
    body: 'Every operating step must know who the message is for: family coordinator, participant, funeral director, employee, care team, vendor, or admin. The user should never wonder who will see it.',
  },
  {
    title: 'Review before send',
    body: 'Passage should prepare thoughtful drafts, but sensitive family, funeral-home, vendor, and care-team communication must show what will be sent, who receives it, and whether it is saved only or delivered.',
  },
  {
    title: 'Related-step context',
    body: 'A message should show what it is connected to: case, operating step, vendor request, care handoff, proof, owner, waiting point, service date, and next expected update.',
  },
  {
    title: 'Employee management',
    body: 'Directors need visibility into staff ownership, reassignment, stale waiting, support requests, proof quality, and family communication risk without burying employees in admin dashboards.',
  },
  {
    title: 'Vendor coordination',
    body: 'Vendor messages must be scoped: request, quote, approval/payment, scheduled work, completion proof, and exception handling. Vendors should not see full family records or unclear next actions.',
  },
  {
    title: 'Communication proof trail',
    body: 'Prepared, copied, sent, delivered, replied, approved, declined, waiting, and completed states should log to the case so reports can prove what happened and what is still waiting.',
  },
];

const reportingArchitecture = [
  {
    title: 'Operational health',
    body: 'Open cases, overdue service-window work, stale waiting points, unassigned steps, blocked cases, proof gaps, family update due, automation coverage, and average time-to-close by location and staff member.',
  },
  {
    title: 'Family communication',
    body: 'Requests sent, replies waiting, approvals received, updates prepared, notifications delivered, messages not sent, and family-visible proof by case.',
  },
  {
    title: 'Staff performance',
    body: 'Assigned load, completed client steps, waiting items by owner, stale ownership, proof quality, escalations, and director reassignment history without turning it into punitive surveillance.',
  },
  {
    title: 'Vendor and services',
    body: 'Requests created, quotes received, approvals/payment status, scheduled work, completion proof, vendor response time, service category demand, and preferred-vendor reliability.',
  },
  {
    title: 'Revenue readiness',
    body: 'Pilot usage, active locations, cases with proof, family-update usage, export/report usage, service revenue opportunities, subscription/billing state, renewal risk, and conversion next action. Owner-only only.',
  },
];

const transformationPhases = [
  {
    name: 'Phase 1: Operating-step foundation',
    status: 'Next build batch',
    owner: 'Product + engineering',
    goal: 'Replace confusing task-card mechanics with one reusable operating-step contract across personas.',
    milestones: [
      'Create a shared operating-step helper/model used by funeral-home, family, participant, vendor, and care-provider views.',
      'Tag each operating step as manual, semi-automated, or automated, with a reason and the next improvement that would move it up one automation level.',
      'Convert funeral-home task cards into operating steps with one primary action, owner, waiting party, prepared output, communication audience, proof destination, automation level, and visibility boundary.',
      'Move history, automation notes, dependency logic, and advanced controls into details accordions.',
      'Seed the demo loop with accepted family participants, vendor request states, proof events, and exports so the product can be demoed end to end.',
    ],
    acceptance: 'A director, employee, family coordinator, vendor, participant, and care provider can each understand their page\'s next action without explanation: what this is, what to do now, who is waiting, what Passage prepared, what is automated or semi-automated, and what proof saves.',
  },
  {
    name: 'Phase 2: Funeral-home command workflow',
    status: 'Planned after Phase 1 deploy',
    owner: 'Product + QA',
    goal: 'Make funeral-home directors and staff able to run real cases with confidence.',
    milestones: [
      'Director My Day shows case risk, staff load, waiting points, family updates, quote decisions, service-window pressure, proof gaps, employee support needs, and export/report actions.',
      'Employee My Work shows assigned client steps, prepared message/output, related-step context, communication audience, proof save, and escalation to director.',
      'Case dashboard becomes the single operating page for family relationship context, step status, vendor state, proof, timeline, and exports.',
      'Inbound family requests can be accepted, assigned, converted into case steps, declined with reason, or escalated.',
    ],
    acceptance: 'A funeral home can onboard one real case, assign work, communicate with the family, handle vendor support, save proof, and export/report the result.',
  },
  {
    name: 'Phase 3: Reporting and accountability',
    status: 'Planned',
    owner: 'Engineering + ops',
    goal: 'Turn activity into decision-grade reports for directors, staff, and owner-only business health.',
    milestones: [
      'Create operational-health reports for open work, overdue/stale waiting, owner gaps, proof gaps, and time-to-close.',
      'Create family-communication reports for sent/prepared/not-sent messages, replies waiting, approvals, related operating steps, and visibility boundaries.',
      'Create employee-management reports for ownership load, reassignment, stale waiting, support requests, communication risk, proof gaps, and completed client steps.',
      'Create vendor reports for quote response, approval/payment status, scheduled/completed work, proof, related case steps, and vendor reliability.',
      'Create owner-only revenue readiness reports for pilots, usage, conversion, expansion, billing state, and renewal risk.',
    ],
    acceptance: 'A director can run the funeral home from reports, and Passage can prove value to convert pilots without exposing internal revenue goals externally.',
  },
  {
    name: 'Phase 4: Automation and proactive guidance',
    status: 'Planned',
    owner: 'Engineering + product',
    goal: 'Move Passage from task storage to proactive coordination.',
    milestones: [
      'Classify every operating step as automated, semi-automated, or manual and show what prevents further automation.',
      'Track automation coverage over time by persona, case type, and account so Passage visibly improves from manual guidance to semi-automated preparation to safe automation.',
      'Recommend next action based on days since death or pre-death state, service dates, stale waiting, missing proof, role, authority, and emotional load.',
      'Draft the right message to the right party, linked to the related operating step, with review-before-send, approval boundary, and delivery logging.',
      'Add cooldowns/rate limits and abuse controls to all sends, refreshes, lookups, and invites.',
    ],
    acceptance: 'The product tells each persona what to do next, prepares the work, prevents unsafe sends, and records proof automatically wherever possible.',
  },
  {
    name: 'Phase 5: Enterprise beta readiness',
    status: 'Planned',
    owner: 'Founder + engineering + QA',
    goal: 'Support multiple funeral-home betas with reliable permissions, data, support, and billing.',
    milestones: [
      'Harden org/location/staff roles, invite flows, RLS, notification logs, exports, audit history, and support escalation.',
      'Add demo-data recovery and seeded UAT environments so demos never depend on wiped production data.',
      'Verify Stripe, HubSpot, Resend, Twilio, Supabase, Vercel logs, security headers, and runtime errors in one release checklist.',
      'Create beta launch dashboards for account health, usage, proof, risk, support issues, billing readiness, and conversion next action.',
    ],
    acceptance: 'Passage can onboard and support multiple funeral homes without founder-only manual recovery or unclear product state.',
  },
];

const takeaways = [
  ['Director/employee/vendor operating loop', 'Source queued / deploy candidate ready', 'Assessment: director workflow now has operating-step cards, owner/waiting/audience/automation/proof fields, unassigned/stale waiting reporting, and exportable proof. Employee workflow now has assigned client steps, one primary action, communication audience/review boundary, stale waiting, and automation coverage by employee. Vendor workflow now has scoped request lifecycle, quote/approval/payment/completion proof language, export columns, and a Vendor coordination report. Remaining UAT after deploy: prove director assigns a case step, employee updates waiting/request/close-with-proof, family-visible proof remains clear, vendor quote is approved/paid before scheduled/completed work, and reports/export reflect all actions.',],
  ['Current browser UAT release', 'Production green / next batch queued', 'Chrome UAT verified the latest deployed release: single Vercel project, Care providers in the public nav, System admin owner-only label, funeral-home demo dashboard, director My Day, staff persona dashboard, participant scoped request, vendor doorway, pre-need typed-address fallback, and Save proof + close action language. Next queued batch removes a bare Guide mystery button, adds a visible staff work-email label, and removes internal-sounding care-page meta copy before the next combined deploy.'],
  ['Security QA pass', 'Source hardening batched / deploy blocked', 'Source scan found no literal Stripe, GitHub, Google, Twilio, Slack, or JWT-style secrets, no RLS disable statements, and 102 RLS enable statements across migrations. Current batch signs Twilio voice callbacks and adds the missing CSV-template method guard. Remaining live security QA needs Supabase log review, Vercel runtime logs, and endpoint smoke tests after the real production deploy is unblocked.'],
  ['Full QA script pass', 'Source fixes batched / Vercel rate-limited', 'The live checklist now drives release work. Current source batch fixes homepage QA labels/routes, urgent triage labels and Nothing sends trust copy, shared-header Google entry, and the family participant insert that blocked family access in the funeral-home demo loop. Next live pass after Vercel rate limits clear must verify the exact PASS/FAIL ledger across landing, urgent, funeral-home, demo loop, and infrastructure.'],
  ['Funeral-home action-card QA', 'Deployed green / source continuing', 'Latest green production fixed the broken address component, then clarified funeral-home director/staff cards into action needed, owner, waiting on, proof/status, prepared output, and one primary action. Current source routes login, pricing, participant, vendor, funeral-home setup, and roadmap sign-in through the same client Google starter so buttons do not silently depend on mixed OAuth paths.'],
  ['Public funeral-home page', 'Reworked', 'Removed ARR/pilot-proof sales math from the funeral-home page and reframed it around calmer family/staff coordination.'],
  ['Shared navigation', 'Reworked', 'Removed scattered Roadmap, QA, Pilot health, and Abuse links from the top navigation; public navigation is now audience-led and system routes render a System Admin boundary.'],
  ['Public surface scan', 'Source green', 'Current source exact-search is clean for command center, family task, and coordination spine; customer-facing copy now favors family record, request, dashboard, next step, owner, waiting point, and proof; the shared brand tagline no longer exposes spine language.'],
  ['Live public UAT sweep', 'Production green at latest main / source QA active', 'Production is green at latest main after the SmartAddressInput build repair. Continue batching meaningful QA slices, verify X-Passage-Commit after each deploy, and keep public/customer pages free of owner-only language.'],
  ['Persona UAT matrix', 'Chrome UAT active / production green', 'Live persona pass verified the public funeral-home page, care-provider doorway, vendor doorway, participant scoped request, urgent triage entry, director demo dashboard, staff demo dashboard, pre-need case modal, and proof-save action. Remaining UAT focus: sign-in failure states on unauthenticated browsers, mobile nav/stacking, full vendor quote approval/payment/completion sequence, real notification delivery, and seeded real-data funeral-home demo loop.'],
  ['Task-card and request-card clarity', 'Source overhaul active', 'This is now a product-model overhaul, not a copy pass. Funeral-home director/staff cards already use the concrete operator contract: do next, owner, waiting party, prepared message/output, status/proof, and privacy boundary. Latest queued source starts the same change on the family coordinator plan: legacy list rows now render as FamilyOperatingStepCard components driven by taskOperatingContractFor, opened steps now use a visually distinct Family operating sheet with a dark status header, fact grid, prepared-output/action panels, review-before-send message workspace, separated primary/secondary actions, and proof/status save area, estate detail steps now open as an Estate operating sheet with owner/waiting/prepared-output/proof/visibility facts plus the existing save/send/attach behaviors, and vendor requests now use a Vendor operating lane/sheet with proof destination, payment gate, scoped access, and one recommended response. Remaining work before claiming complete: finish participant detail gaps and Chrome-QA desktop/mobile so every role gets a calmer operating lane rather than a renamed task list.'],
  ['Form validation UAT', 'Source fixed / live domain stale', 'Vendor onboarding now requires business name, ZIPs, and email before submit state, care-provider inquiry shows required organization plus email, and funeral-home setup now requires funeral-home name plus main location before creating a dashboard. Recheck live once www points at latest main.'],
  ['Green-path onboarding lookup', 'Source hardened / config still required', 'Shared address entry now exposes Google predictions through native full-address recommendations as users type, keeps the custom full-address suggestion menu, and preserves Use this typed address when Maps suggestions are unavailable. Google suggestions still require the Vercel production server key and should be rechecked in Chrome after the next combined deploy before marking lookup UAT complete.'],
  ['Support and sign-in reliability', 'Production fixed / source hardening active', 'Removed the dead support email from contact/footer surfaces, routed contact form delivery to CONTACT_TO_EMAIL first with owner email fallback, unified Google sign-in entry points through /auth/google across public, persona, funeral-home, vendor, estate, urgent, and admin surfaces, and made Google sign-in failures visible on global login, vendor login, funeral-home setup, participant access, System Admin, and this roadmap. Live UAT found Google returning successfully but leaving the OAuth session fragment on the funeral-home dashboard; source now consumes the Supabase hash, stores the session, strips the URL fragment, and routes staff/directors to the intended dashboard. Recheck after Vercel rate limits clear.'],
  ['Admin session UAT', 'Production green / recheck active', 'Admin users now get a dedicated Admin action outside the public audience nav, and System Admin remains the single internal cabinet. Recheck on www after the correct production domain is pointing at latest main.'],
  ['Release configuration', 'Single production target fixed', 'Duplicate Vercel project/build contexts have been removed. GitHub now reports one Vercel context only, the ignored-build step cancels [skip deploy] commits by design, and explicit [deploy] release commits build the canonical thepassageappio project. Continue using meaningful release batches: one persona/functionality slice or one blocker fix per deploy, then verify the Vercel status and live www behavior before the next release.'],
  ['Admin operating model', 'Reworked', 'Internal tools live in the System Admin cabinet with grouped accordions; enterprise readiness now uses task readiness / funeral-home workflow language instead of spine jargon, and no standalone roadmap/QA/admin top-level tabs should exist.'],
  ['Funeral-home product UX', 'Action-card pass deployed / QA active', 'Director/staff dashboard now uses Director Focus, My Day, Case at a glance, Recommended next action, quote-review attention, a case-level vendor quote decision block, client-step contracts, one primary action, one waiting action, collapsed More actions, what Passage prepared, what staff does next, waiting point, proof saves, support cues, family-visible proof, and customer-safe setup, invite, queue, vendor preference, and billing language with visible pilot/trial wording, quote-accepted labels, and raw plan ids removed from the customer dashboard. The latest source pass reframes confusing task/work-item language into client step, family request, owner, waiting point, prepared output, proof, and director support, so funeral-home teams can manage the family relationship instead of interpreting internal task mechanics. Setup now uses funeral-home/customer language, a logged-out recommended next action, a required-info gate, direct demo-dashboard access, and first next-step/client-step wording instead of partner/task wording. Inbound family requests now show clean contact separators and operator-safe accept/decline/convert controls. Chrome UAT verified My Day, Director Focus, quote-review attention, case context, prepared output, and staff action dialogs for Mark waiting, Request family info, and Close with proof on the current green production build. Latest queued source removes visible work-item/close-task wording from the funeral-home dashboard and shared action event titles; it needs Vercel deploy after the rate limit clears.'],
  ['Family, care, participant, and vendor UX', 'Production/source pass active', 'B2C, urgent, planning, hospice/care-prep, participant, vendor, and care-provider flows now favor family record, request, next step, owner, waiting point, proof, and scoped access. Latest queued source makes the family coordinator plan feel structurally and visually different: the first action and tier rows are operating-step cards, opened steps become a family operating sheet with owner, waiting, prepared output, proof, visibility, review-before-send messages, and one primary action lane, estate detail steps now open as an Estate operating sheet instead of a dense task update panel, and vendor requests now use an operating lane/sheet rather than a simple request path. Participant and vendor surfaces now say own the request, show what is waiting, save completion proof, and approve quote before work starts instead of accept/mark-completed/task language. Vendor lifecycle labels now say Quote Approved, approval/payment next step, and approve-and-pay; scoped vendor request pages no longer say family/funeral home accepts the quote, and both visible and legacy vendor response paths now prevent schedule/complete actions before approval/payment. Remaining source work: participant detail surfaces and Chrome visual QA need the same non-cosmetic operating-lane standard before the persona overhaul is complete.'],
  ['Automation layer', 'Production green / Sprint 4 QA continues', 'Timing-aware next-action scoring now feeds funeral-home recommendations, family execution lanes use Passage prepared / guided / manual-step language, shared playbook/workspace explanations avoid task-board wording, and admin readiness quantifies automated, semi-automated, and manual work with blockers, why-now reasons, next automation improvements, and focus tasks. Chrome QA verified the production Automation Readiness page shows why-now reasons, focus tasks, next automation improvements, and automation coverage.'],
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
    status: 'Release candidate queued / deploy next',
    owner: 'Product + engineering',
    goal: 'Make funeral-home director, employee, and vendor workflows obvious, calm, measurable, and operationally useful.',
    tasks: [
      'Director dashboard becomes My Day, cases needing action, staff load, family updates, exports, billing, and proof.',
      'Staff view shows assigned client steps first as a simple pattern: what is needed, owner does next, waiting on, prepared message/output, status, proof, and what to do when support is needed; deeper automation detail stays collapsed until needed.',
      'Remove demo/sales language from logged-in funeral-home operations.',
      'Use staff-facing terms like needs help, stuck point, family can see, earlier step, and where proof saves instead of blocker, dependency, orchestration, or audit-layer wording.',
      'Add recommended next action based on pre-death, day since death, service window, aftercare, needs-help state, stale waiting, and missing proof.',
      'Browser-verify My Day, Case at a glance, Recommended next action, vendor quote decision block, estate quote/payment handoff, Request family info, Record proof / close, Mark waiting, inbound family requests, employee stale-waiting reporting, vendor coordination reporting, automation coverage, and operating-step export columns.',
    ],
    acceptance: 'A funeral director or employee can open one case, know the client relationship context, exactly what Passage prepared, what they must do, who is waiting, what the family/vendor can see, how to ask for support, where proof saves, and how reports/export prove the work.',
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
      'When readiness or QA uncovers unrelated issues, classify them into fix now, backlog, roadmap update, watch item, or owner gate with source evidence instead of losing them or widening the sprint silently.',
    ],
    acceptance: 'The product tells staff what to do next, why, and what proof will be saved.',
  },
  {
    name: 'Sprint 4: Persona UAT pass',
    status: 'Active Chrome UAT / current release green',
    owner: 'QA persona lead',
    goal: 'Walk every role end to end on desktop and mobile.',
    tasks: [
      'Family coordinator: urgent setup, planning setup, care-prep record, one recommended next action, request/open-item language, what Passage prepares, where proof saves, approvals, family updates, aftercare, and care-team waiting items.',
      'Participant/helper: one scoped request, one response path, privacy boundary, authority boundary, own/show-waiting/help/done-with-proof actions, saved proof, and no public task wording.',
      'Funeral-home director: cases, staff, proof, family update approval, reports, export, billing, inbound family requests, clear operating-step contracts, stale waiting, unassigned ownership, automation coverage, and vendor coordination.',
      'Funeral-home employee: assigned work, context, drafted message, communication audience, review boundary, waiting/stuck-point state, family-visible boundary, close-with-proof, and no unclear extra actions.',
      'Vendor: scoped request, quote/update, quote approval, scheduled work, completion proof, payment/approval boundary, no family-record browsing, and required-field validation that never feels stuck.',
      'Green-path onboarding: address/funeral-home lookup must show native full-address recommendations while typing when the Vercel Google Places server key is configured, and Use typed address when Maps or server suggestions are unavailable; no user should be trapped by a silent dropdown failure.',
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
  ['Vendor', 'Apply with required-field guidance, understand the job, timing, quote/payment state, obligation boundary, recommended next action, completion proof, and how the request reports back to the case without exposing the full family record.'],
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
          <div style={eyebrow}>Product architecture</div>
          <h2 style={h2}>Rethink Passage as one shared operating record with persona-specific dashboards.</h2>
          <div style={cardGrid}>{operatingArchitecture.map(item => <ProofCard key={item.title} title={item.title} body={item.body} />)}</div>
        </Panel>

        <Panel tone="sage">
          <div style={eyebrow}>Funeral-home dashboards</div>
          <h2 style={h2}>Director, employee, case, and relationship views each get one clear job.</h2>
          <div style={cardGrid}>{funeralHomeDashboardModel.map(item => <ProofCard key={item.title} title={item.title} body={item.body} />)}</div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Communication architecture</div>
          <h2 style={h2}>Thoughtful messages connect the right people to the right step.</h2>
          <div style={cardGrid}>{communicationArchitecture.map(item => <ProofCard key={item.title} title={item.title} body={item.body} />)}</div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Reporting architecture</div>
          <h2 style={h2}>Reports must prove the work, not just count activity.</h2>
          <div style={cardGrid}>{reportingArchitecture.map(item => <ProofCard key={item.title} title={item.title} body={item.body} />)}</div>
        </Panel>

        <Panel tone="sage">
          <div style={eyebrow}>Transformation phases</div>
          <h2 style={h2}>The rebuild path from confusing cards to enterprise-grade operating system.</h2>
          <div style={{ display: 'grid', gap: 12 }}>{transformationPhases.map((phase, index) => <PhaseAccordion key={phase.name} phase={phase} open={index < 2} />)}</div>
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

function PhaseAccordion({ phase, open }) {
  const badge = phase.status === 'Next build batch' ? activePill : plannedPill;
  return (
    <details open={open} style={accordionPanel}>
      <summary style={accordionSummary}>
        <span>{phase.name}</span>
        <span style={badge}>{phase.status}</span>
      </summary>
      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
        <p style={{ ...smallText, margin: 0, color: C.ink }}>{phase.goal}</p>
        <MetricRow label="Owner" value={phase.owner} />
        <div style={innerPanel}>
          <div style={eyebrow}>Milestones</div>
          <ul style={ul}>{phase.milestones.map(milestone => <li key={milestone}>{milestone}</li>)}</ul>
        </div>
        <div style={doneBox}><strong>Acceptance:</strong> {phase.acceptance}</div>
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
