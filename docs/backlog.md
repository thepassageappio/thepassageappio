# Passage Backlog

## Reality Check — 2026-07-24 (read this before treating anything below as current)

This file predates the Passage Zero pivot and does not reflect current architecture status. Recorded here per AGENTS.md's roadmap/backlog staleness finding (independently proposed as a hard release gate in open, unmerged PR #37 — "Governance: codify 5 binding process corrections from 2026-07-22 review").

- **Passage Zero is the sole target architecture**, built on `greenfield/passage-zero` (draft integration PR #24). It is not reflected anywhere below. The canonical roadmap for that work is `docs/product/operational-readiness-roadmap.md`, not this file.
- **Threshold on `main` is a production-maintenance lane only** (per AGENTS.md, "Passage Zero canonicalization — 2026-07-18"): separately governed P0/P1 live-defect fixes are allowed; no new Threshold dashboard, estate, information-architecture, schema, or redesign work may begin on `main`. The "Now"/"Next"/"Later" items below that describe new Threshold-era product build-out (task-card spine, dashboard simplification, etc.) are stale under this freeze and should not be treated as active instructions without an explicit owner decision to resume Threshold work.
- **`pages/funeral-home/dashboard.js` and `pages/estate.js` remain unconverted to any post-Threshold design system** — both are still 100% legacy hardcoded-hex/inline-style/Georgia-serif styling (dashboard.js alone has 156 literal `Georgia` references). This is a known, verified gap, not yet scheduled as Passage Zero work.
- **Transfer Pass** consent/security and deterministic demo-reset requirements are recorded in `docs/agent-operating-context.md` as a future Passage Zero input; not yet designed or scheduled here.
- **Governance PR #37** (open, unmerged as of 2026-07-24) proposes 5 binding process rules: no same-identity PR merge ever; roadmap/backlog touch required on every material-scope release; GitHub Issues tracker formally deprecated as a live signal (roadmap + backlog are sole sources of truth); a two-strikes rule requiring an explicit reconciliation proposal for `main` vs `greenfield/passage-zero` divergence; and QA-infrastructure gaps must get their own ticket rather than being absorbed into "QA: N/A." Treat these as pending, not yet binding, until the PR merges — but see the QA-infra ticket added below, which is worth tracking regardless of merge status.
- **QA infrastructure gap (tracking ahead of PR #37 merge, per its rule #5):** PR #30's hosted QA has been stuck PARTIAL/NOT RUN because an enterprise browser policy rejects the preview hostname. This is infrastructure debt, not a product defect — needs an owner-assigned fix-it item, not to be silently folded into "QA: N/A" on future PRs.
- **Live status snapshot (2026-07-24):** a "mission mobile repair" release candidate (PR #32-adjacent work) is recorded in `docs/agent-operating-context.md` as PREVIEW VERIFIED — hosted QA passed a full 36-cell route/viewport matrix — and is waiting only on protected owner authorization to deploy to production, followed by a repeat post-deploy QA pass. This is currently the fastest available path to a visible production change, independent of any work in this PR.

## Now (May 4-May 6, 2026)

- Round 14 ironclad spine pass: treat `docs/ironclad-operating-spine-roadmap.md` as the readiness contract for families, participants, funeral homes, funeral-home staff, vendors, Passage system admins, messaging, permissions, demo, and task orchestration.
- Hold every sprint to the scorecard loops: red path closes, funeral-home partner activates, payment entitlement works, and vendor marketplace connects. Schema presence alone is not success.
- Sprint 2 entry point: build the shared task action spine so assigned/unassigned tasks route through the same assign, send, proof, waiting, help, output, and audit behavior across every persona.
- Public trust/demo blockers from external QA: FAQ/Trust/Privacy/Terms overview destinations are now present as product-boundary scaffolding; formal owner/counsel-approved legal copy is still required before serious pilots. Funeral-home feature tab smoke tests and any remaining mobile nav simplification still need recurring green-deploy QA.
- Product-audit north star: Passage must bias toward crisis coordination and workflow confidence over memorial/social/AI feature expansion. Next gains come from restraint, emotional pacing, mobile usability, trust/security, and one clear next action per screen.
- Post-simplification QA sweep (0d2bc3a..11902d0): command center hierarchy + nav, wishes save, comms center parity; no dead ends.
- Stop-the-line regressions: estate persistence, invite confirmation, partner case creation/load, task action feedback (no "Confirmed" without proof).
- B2B activation gap: verify the newly seeded test funeral-home `organization` + `funeral_home_partner`, family/estate participation join, and terminal task status persistence through live app flows before calling any funeral-home demo ready.
- Terminal task status QA: marking handled must update the task row used by dashboards/reports, not only write `task_status_events`.
- Auth/RLS bridge from contract proof: create a real auth user or invite path for `demo@collinsffh.com`, bridge accepted `estate_participants` into `estate_access`, and route all task completion/status writes through service-role API endpoints rather than direct client inserts into `task_status_events`.
- Canonical data-source guardrails: app code should ignore `people.invitation_token`, use `estate_participants.invite_token` for invites, use `organization_case_reference` for current location demos until a location foreign key exists, and treat per-case dollar value as roadmap-only until schema exists.
- Partner billing org-link migration is drafted but not approved/applied: add `funeral_home_partners.organization_id`, backfill Collins/HVFG, scope RLS by org, and expose `partnerPlan`/`activationStatus` from `/api/partnerContext`. Open owner gate: confirm HVFG plan/fee/trial values before any production SQL.
- Current RLS risk: until the org-link migration ships, app code must never rely on client-side reads from `funeral_home_partners`; use the server/service-role partner context and return only the matched plan.
- Collins activation blocker: `demo@collinsffh.com` needs an Auth user/invite path and member `user_id` backfill before staff login QA can pass.
- Participant acceptance blocker: invite acceptance must upsert both `estate_participants` and `estate_access` so the participant can see the task plus funeral-home activity/events.
- Vendor request action blocker: vendor `Accept request`, `Mark in progress`, `Mark completed`, and `Decline` must update one coherent current status, proof trail, owner notification, task status event, and family/funeral-home-visible activity without contradictory states like declined plus completed.
- Repo hygiene: `.gitattributes` now normalizes LF line endings; monitor for any remaining phantom dirty files after Windows edits.
- QA infrastructure: Browser plugin / local Playwright visual QA is currently blocked in this desktop session by a missing app-server path and no repo-local Playwright package. Add a durable QA setup so every deploy can run Browser/Chrome screenshots plus direct backend smoke without manual repair.
- Persona QA: red-path (home/hospice/hospital/past-first-steps) + funeral-home demo (one-location + multi-location) + invited family view; always one clear next action.
- Webhook-as-proof QA: Resend + Twilio `webhook_events` record provider + timestamp + actor and are surfaced as proof; vendor requests show Sent/Received/Accepted/Declined with visible activity.
- Partner + vendor access policy (minimal): roles + org membership (multi-location admin vs staff vs vendor vs Passage admin) + who can act-on-behalf.

## Next

- P0 Self-Service and Production Readiness Sprint:
  - P0: make funeral-home owner/director invitation a real setup loop: Passage admin sends invite, director signs in, confirms co-branded family view, adds locations, adds employees, sends employee invites, creates/imports first case, invites family, and reaches first proof without founder narration.
  - P0: make employee/vendor/hospice/care-facility staff creation consistent across the spine: save person, review invite, send Passage email, recipient authenticates, lands in the correct role-native workspace, and appears in assignment dropdowns where allowed.
  - P0: make family handoff ownership explicit. A funeral home can start or manage a case, but the family coordinator owns the durable family record after acceptance and after service. Post-service copy must say the record continues for estate, notifications, remembrance, vendors, and future handoffs.
  - P0: add family-to-funeral-home request pipeline. Direct red/green users can search for or request a funeral home from the estate spine; partner funeral homes see warm inbound requests in their dashboard; non-partner requests create Passage admin leads for outreach.
  - P0: add a shared smart address component and normalized address model for funeral homes, funeral-home locations, vendors, hospice locations, care facilities, and family-requested providers. Address autocomplete should populate city, state, zip, country, and external place id when available.
  - P0: propagate co-branding to all external-facing partner surfaces: family invite, employee invite, accepted family command center, packet outputs, reports, and exports. Remove all internal setup/demo language from customer-visible UI.
  - P0: add funeral-home management and reporting as first-class tabs: locations, employees, role permissions, warm inbound requests, cases, tasks, response time, case value, calls avoided, exports, and source-data labels.
  - P0: verify the loop across backend and frontend together: every invite/request/status row must have a visible UI state, next action, proof/audit trail, and role-scoped permission explanation.
- Demo-Ready Continuity Spine Sprint:
  - P0: add task authority language to task workspaces so every priority task explains why it matters, usual owner, timing, next step, Passage output, and what to do when overwhelmed.
  - P0: make the red-path first three minutes read as stabilize -> coordinate -> organize, with authority before dashboard complexity.
  - P0: harden role separation: family sees one calm next action; director sees risk/ROI; staff sees assigned work; participant sees one delegated action; vendor sees scoped request/response.
  - P0: keep notification and announcement truth strict: prepared, copied, failed, skipped, delivered, and sent must remain separate states.
  - P0: make the guided demo tell Green -> Warm -> Red -> Funeral Home -> After in under 12 minutes with DEMO DATA boundaries and no real sends.
  - P1: productize more Tier 1 outputs through existing task packets before introducing new persistent packet schema.
  - P1: add visible trust affordances around permissions, audit/proof, export ownership, document visibility, and human support.
  - Owner gates: do not apply a `document_packets` production schema, materially rewrite legal/privacy claims, send real email/SMS, change pricing, or make irreversible production data changes without approval.
- Operational Calm hardening sprint, only where it supports task-spine demo readiness:
  - P0: remove remaining card soup and normalize visual hierarchy across estate, red path, participant, funeral-home, and vendor surfaces.
  - P0: make the red path first 3 minutes feel like guided family incident response: situation -> immediate authority guidance -> coordination activation.
  - P0: strengthen workflow visibility everywhere: owner, waiting reason, proof destination, last actor/time, next action.
  - P1: mobile task completion and invite acceptance QA at 100% Chrome viewport.
  - P1: visible trust layer: permissions, audit trail, data ownership, export confidence, document visibility.
  - P2: favicon and console hygiene, including repeated Supabase client warnings.
- Add a public Resources / How Passage works section for educational content, workflow explainers, funeral-home demo education, and user guidance so role workspaces can stay action-first instead of instructional.
- Build shared `TaskActionModal` so family, participant, funeral-home staff, and vendor-adjacent task surfaces use the same assign/send/proof/waiting/help/handled interaction.
- Build shared notification preference resolution for the task spine: in-app/email/text availability, consent, fallback, skipped-channel logging, role visibility, and a simple preference setup for family coordinators, participants, funeral-home staff/admins, and vendors.
- Build shared communication event router: Assign / Ask / Update / Prove / Escalate events should update task truth, communication/proof trail, notification attempts, role-scoped visibility, and reports from one model.
- Critical pilot gate: participant and funeral-home employee onboarding reliability. Assignment notifications must land on a role-appropriate work page with one clear action, visible scope, service/case context, and a proof/waiting/help path before any broader pilot claim.
- Critical pilot gate: first-day partner launch reliability. A signed funeral-home pilot owner must see exactly how to set up organization context, locations/case scope, employees/roles, preferred vendors, and the first family case, with two clear branches: import cases by CSV or create fresh in UI. Future hospice and assisted-care pilots should reuse this same launch pattern around locations/care teams, staff roles, family workspaces, warm tasks, handoff, and reporting.
- Continue rebuilding `My estate` as an estate operating spine first, with a compact estate switcher and per-estate command center tabs: Today, Tasks, People, Events, Documents and outputs, Obituary and wishes, Messages, Audit.
- Productize Tier 1 outputs: obituary draft, funeral-home packet, family notification set, clergy outreach, bank/government packets, executor summary, and home/assets checklist.
- Add communication command center: task messages, family/funeral-home updates, vendor/cemetery/clergy threads, and internal funeral-home staff notes must all write to one visible event/message spine.
- Restore urgent path crisis posture: triage first, authority second, only minimum save fields third, no empty progress dashboard as first impression, and no sign-in wall before a useful first-step plan.
- Add B2B closed-loop pilot gate: funeral home creates case -> family command center opens -> funeral home acts on behalf -> family sees proof -> export/report works.
- Add schema activation smoke: `funeral_home_partners`, `estate_participants`, `vendor_requests`, `marketplace_interactions`, `subscriptions`, `accounts`, and `account_entitlements` either receive test/demo rows from live flows or are explicitly omitted from demo claims.
- Wire or visibly defer the payment loop: Pilot/Local/Group pricing CTAs must either reach checkout/test checkout and write entitlement state, or route to a contact/pilot fallback with no dead end.
- Turn system-admin demo into a one-step-at-a-time guided sales studio with dummy-only data and a stronger prospect narrative.
- Split the header/nav shell by audience: public users see only core paths, signed-in users see role-appropriate work areas, and Passage system-admin utilities like Demo, Vendor page, and Vendor admin move behind a system-admin menu so the banner stays calm at desktop and mobile sizes.
- Clean up the public guide unlock page: move the email/name/guide selector into the locked article module so the page reads as one contained "pick guide -> unlock article" action instead of a floating form plus disconnected locked preview.
- Fix vendor admin/provisioning loop: submitted applications load, system admin approves/declines, approved vendors get profile setup and vendor-owned dashboard access.
- Harden vendor request actions: token-based vendor actions and system-admin demo actions must share the same status transition rules, visible proof trail, and no-real-record demo copy so the marketplace loop can be trusted in demos.
- Define funeral-home staff role UX: director/admin, location manager, and employee dashboards with location/assigned-work scope and reporting.
- Add ROI/reporting fields plan: case value, location, employee, tasks completed, time saved, marketplace revenue share, and CSV exports.
- Add an AI execution spine only after task/output contracts are stable: there is no active OpenAI integration today, so start future AI work with a server-side Responses API adapter, current recommended GPT model default, strict structured-output schemas, prompt fixtures, audit/proof logging, and no direct client-side model calls.
- Tighten and freeze the 15-minute funeral home demo script + objection answers (doc-only until owner approves outreach).
- Produce a one-page pilot handout (offer terms placeholders; no pricing changes).
- After the current funeral-home coordination roadmap is tighter, use `docs/b2b-wedge-expansion-notes.md` to contemplate hospice and senior living / assisted care as earlier activation wedges for the same family operating system, plus controlled outbound campaign tooling for funeral homes, hospice locations, and assisted care facilities. Do not widen the active product until the current spine is pilot-ready.
- Replace draft trust/legal scaffolding with owner/counsel-reviewed policy language: final Privacy Policy, Terms of Service, vendor terms, funeral-home partner terms, data retention, upload/document policy, and urgent-path liability boundaries before serious pilots.
- Deepen Trust & Security page after schema/storage hardening: role-based access proof, audit trail screenshots, document handling, encryption/security posture, privacy, and plain-language boundaries around emergency/legal/medical/funeral guidance.
- Add Passage system-admin shell and business health dashboard: one admin tab for demo, vendor admin, vendor page QA, leads/support inbox, raw data exports, ARR/MRR/NRR/churn, pilot conversion, contact inquiry types, engagement, marketplace value, rev share, and customer health metrics.
- Map top red-path tasks into automated / assisted / guided-manual tiers; list proof required + follow-up loop for each.
- Identify owner-facing notification gaps for participant/vendor/funeral-home completion events (inventory only).
- Define trusted vendor criteria + an approval/override process for funeral homes.
- Add a demo-visible Release / Certificate Pipeline: pronouncement, ME/coroner involvement, hospital or hospice release, death certificate submitted/certified, permit/authorization collected, each with owner, timestamp, and proof.
- Create a Funeral-Rule-safe after-hours info pack: GPL link, itemized price guidance, cash-advance clarity, and a phone-safe script that reduces repeat calls without turning Passage into a pricing app.
- Make hybrid planning the default posture: self-serve intake plus director-assisted handoff that pre-fills known facts, especially for funeral homes where families start online and still need human help.
- Add a Faith & Care Team cluster: chaplain/officiant, service preferences, livestream owner, clergy contact, and proof fields for outreach/status.
- Add an after-death admin hub downstream of death certificates: SSA/Medicare, banks, insurance, credit bureaus, scam/debt-collector guardrails, owner, and done-proof.

## Later

- Vendor payments / Stripe Connect design (after pilots validate demand).
- Document upload as a funeral home pilot add-on after core demos are stable.
- Family chat only after pilot feedback confirms need.
- State-specific workflows + deeper compliance guidance.
- Marketplace revenue-share reporting for funeral homes.

## Questions

- Which local funeral homes are first pilot targets (one-location vs multi-location mix)?
- What is the pilot offer structure (length, trial, price) as of May 2026?
- Which vendor categories get seeded first in Hudson Valley (1-2 per task only)?
- Which parts of healthcare proxy guidance require legal review before demos?
- What are the 5 must-have analytics events before broader outreach?

## Blocked / Needs Owner

- Production SQL changes require owner approval and manual Supabase execution (unless deployment pipeline changes).
- Real customer/vendor/funeral-home emails or SMS require owner approval.
- Pricing changes require owner approval.
- QA infrastructure gap: PR #30 hosted QA blocked PARTIAL/NOT RUN by an enterprise browser policy rejecting the preview hostname — needs an owner-assigned infra fix, not a silent "QA: N/A."
- `main` vs `greenfield/passage-zero` reconciliation: flagged across multiple reviews with no plan yet; needs an explicit owner decision on sequencing/timeline.
- Whether to lift the Threshold-on-main freeze for a scoped `pages/funeral-home/dashboard.js` / `pages/estate.js` visual pass is an owner decision, not an agent one — see PR opened 2026-07-24 for the concrete ask.
