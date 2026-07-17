
# Passage Zero - Agent Operating Context

Last updated: 2026-07-15 (America/Los_Angeles)

This is the living handoff for the greenfield Passage rebuild. Read `AGENTS.md` first, then this file, then `docs/product/persona-action-architecture.md` before changing product code, data contracts, or deployment state.

## Fresh-chat kickoff

Paste this into a new Codex chat:

> Passage Release Train: start the durable-auth loop. Continue the Passage Zero greenfield rebuild on `thepassageappio/thepassageappio`, branch `greenfield/passage-zero`, draft PR #24, from QA-approved head `5a6f06e23bac3fd13702ec4a8f6a31d639674a62`. Read `AGENTS.md`, `docs/agent-operating-context.md`, and `docs/product/persona-action-architecture.md` first. The shared event spine, warm editorial redesign, and browser-sandbox organization/location/membership/workspace/assignment/routing contract are complete. Preserve family boundaries and the existing visual system. Do not treat guided workflow readiness as production readiness. Re-instantiate distinct PM, UX, engineering, QA, and deploy roles. Use the cycle-4 what/why/breakage analysis before any migration, then prioritize real authentication, RLS-backed durable multi-user persistence, server-enforced append-only audit, notifications/recovery, and integration reliability. Keep workspace context presentation-only, family access grant-based, and vendor fulfillment queued until the durable authority cutover is verified. Continue without asking Steve except for explicit `AGENTS.md` gates. Verify each batch at desktop, 390, and 360, commit real screenshots, and use one preview deploy per coherent QA-approved batch.

## Founder mandate

Build Passage as an enterprise-grade coordination operating system for the period before, during, and after a death. The product should combine Apple-like clarity and empathy with serious funeral-home operational depth.

This is a genuine greenfield rebuild. There are no customers and no meaningful migration risk in the current sandbox. Do not preserve old layouts, components, information architecture, terminology, or schema merely because they exist. Preserve only validated product truth and rebuild everything else around the target experience.

The product must be sellable to funeral homes, immediately understandable to directors and employees, calm enough for families in crisis, efficient for vendors, and credible as a scalable company. It must not feel like a checklist app, memorial microsite, generic CRM, or cosmetic wrapper over the legacy application.

### Primary product wedge

The funeral-home director experience is the primary excellence bar and distribution wedge. Passage should become the director's right hand:

- A family walks in with a QR Transfer Pass.
- The director scans it and sees exactly what the family approved for this purpose.
- Passage verifies the handoff, creates the case, assigns the operating location and lead, surfaces the first commitment, and queues future system synchronization.
- If the family has no pass, the director creates a minimal case using only the person and family contact; missing information becomes guided work rather than intake friction.
- No surprises: every action shows actor, recipient or waiting party, timestamp, status, visibility, proof destination, and next action.

The long-term integration goal is to sync this case into existing funeral-home systems through adapters without changing the simple intake UX.

## Experience doctrine

- Zero hand-holding: every persona should understand the menu, next action, status, owner, and outcome immediately.
- No text-heavy pages. Prefer progressive disclosure, clear actions, compact operational summaries, and proof.
- One continuity record connects the family, funeral home, employees, hospice/care providers, cemetery, vendors, participants, estate professionals, support, and system administration.
- Communication belongs to the related task, order, approval, or handoff, not a detached chat stream.
- Families see reassurance, privacy boundaries, one next action, and who is handling what.
- Directors see case flow, risk, ownership, waiting points, staff load, family-update health, vendor state, proof gaps, and recommended action.
- Employees see assigned work, case context, one primary action, prepared communication, proof capture, and escalation.
- Vendors see only scoped opportunities/orders, negotiation, scheduling, payment readiness, and proof, not the broader family record.
- Multi-location organizations need effortless workspace/location switching, employee invites, roles, routing, assignment, templates, reporting, and audit history.
- Visual direction is "warm precision": empathetic, modern, restrained, trustworthy, and enterprise clean. Avoid clinical cobalt, literal dark-tech branding, funeral cliches, card soup, and decorative sentimentality.

## Canonical persona and action architecture

Source: `docs/product/persona-action-architecture.md`.

The target map covers the complete lifecycle and these primary actors:

- Person planning or receiving care
- Family coordinator and additional family members
- Hospice, hospital, senior-living, and care-provider staff
- Funeral-home owner/director
- Funeral-home location manager and employee
- Cemetery/crematory
- Product and service vendors
- Clergy, officiants, celebrants, and other participants
- Estate attorney, executor, financial and property professionals
- Passage support/operations
- System administration and integration actors

Permissions are an intersection of identity, organization, case, role, explicit grant, data category, purpose, workflow state, and time. A role label alone never grants broad case access.

Every meaningful action follows one contract:

1. Actor and authority
2. Case/person context
3. Intended audience or waiting party
4. Minimum data scope
5. Human action and Passage-prepared work
6. State transition
7. Timestamped proof and audit record
8. Clear next action

## Current greenfield implementation

Repository: `thepassageappio/thepassageappio`

Branch: `greenfield/passage-zero`

Draft PR: https://github.com/thepassageappio/thepassageappio/pull/24

Current verified code commit: `5a6f06e23bac3fd13702ec4a8f6a31d639674a62`

Current evidence commit: `5a6f06e23bac3fd13702ec4a8f6a31d639674a62`

Canonical Vercel project:

- Project ID: `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`
- Team ID: `team_X0ta3bEEbRVGNM9xOwdBtCga`

Verified READY deployment: `dpl_6dJnC8jHuqDEzENrV9FwEWm7BK3v`

Shareable sandbox root (token may expire):

`https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app/?_vercel_share=IlVB6d874l2GTiIjlTezoSTFGpbJBaaF`

Director intake:

`https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app/director/intake?_vercel_share=IlVB6d874l2GTiIjlTezoSTFGpbJBaaF`

### Implemented surfaces

- Persona gateway/root
- Funeral director operating view
- Employee work view
- Family coordination journey
- Family Transfer Pass wallet
- Mobile funeral-director Receive/scan experience
- Walk-in director intake at `/director/intake`
- Responsive operations shell and shared warm-precision visual tokens

### Functional walk-in intake slice

The canonical demo record is Sofia Rivera, coordinated by Maya Rivera.

Transfer Pass: `PASS-RIVERA-7K4M`

Created funeral-home case: `NS-2051`

QR path:

1. Open/scan pass.
2. Verify Sofia Rivera, Maya Rivera, expiration, and the four approved information categories.
3. Select operating location and lead director.
4. Create the case.
5. Show the case receipt, first commitment, owner, source, and queued integration state.

No-pass path:

1. Enter the person and family contact only.
2. Select operating location and lead.
3. Create a minimal case.
4. Route missing information into guided case work.

Important boundary: this is a functional client-side sandbox flow. The durable database event model, real authentication/RLS, and external funeral-home-system synchronization are not wired yet. "Sync queued" is demo UI, not a real external integration.

## Visual system

The current palette is "warm precision":

- Canvas `#f7f5f4`
- Surface `#fffcfa`
- Ink `#242128`
- Muted `#6e6671`
- Elderberry/iris signal `#4f46a5`
- Human coral `#e79b80`
- Calm mineral `#bfdce0`
- Success `#2d715e`
- Danger `#a43f46`

Primary contrast checks passed. Coral and mineral are for human/decorative emphasis and soft backgrounds, not white-text action fills.

## Verification evidence

Evidence directory:

https://github.com/thepassageappio/thepassageappio/tree/c4e01c88ae859dbe148fe1274f1d5c612e1d62f1/docs/evidence/passage-zero

Verified:

- Desktop at 1440x1000
- Mobile at 390x844
- QR pass intake through created-case receipt
- No-pass minimal intake
- Director, staff, receive, family, and family-pass mobile regression
- No application console errors in the verified routes
- No horizontal overflow in the verified routes

Each future progress report must include real screenshots. Each real persona slice must be checked at desktop, 390 mobile, and 360 mobile before release.

## Active release train - 2026-07-15

Owner authorized parallel agents and instructed the team to execute without further approval loops.

Active engineering tracks at the time of this handoff:

1. Shared case spine: create a typed sandbox case/event model and make the Sofia Rivera record consistent across family, director, and employee routes.
2. Multi-location funeral-home operations: organization/location switching, employee/team assignment, case ownership, and routing.
3. Vendor fulfillment: scoped opportunity -> accept/negotiate -> confirmed order -> schedule -> completion proof.

Agent runtimes do not transfer to a new chat. The new root agent must inspect the branch and local workspace for any landed work, then re-instantiate incomplete tracks rather than assuming these processes are still alive.

## Next execution sequence

### Batch 1 - shared operational truth

- Define canonical organization, location, team member, case, person, participant, task, message, handoff, order, proof, and audit-event types.
- Use one canonical Sofia Rivera case across family, director, and employee routes.
- Add a client-safe sandbox repository/state layer now; design it so Supabase can replace the storage adapter without rewriting screens.
- Make state changes visible across persona surfaces and preserve actor, audience, timestamp, status, proof, and next action.

### Batch 2 - funeral-home operating system

- Organization onboarding requiring minimal setup.
- Multiple locations and workspace switching.
- Employee invite, role, working hours, skills, assignment, and escalation.
- Case creation, assignment, reassignment, routing rules, templates, family access, communication health, and proof gaps.
- Director "Today" view: cases needing action, unowned waiting, service-date risk, staff load, family communication risk, and recommended next action.
- Employee "My work" view: assigned cases/tasks only, one action at a time, prepared communication, proof capture, escalation.

### Batch 3 - vendor network

- Funeral home requests a scoped service/product from the case.
- Vendor receives an opportunity with minimum required context.
- Accept, decline, or negotiate price/date/scope.
- Confirm an order and expose the same state to the case team.
- Schedule fulfillment, communicate in the order thread, and save completion proof.
- Keep payment state and future billing readiness explicit without inventing pricing or charging real money.

### Batch 4 - durable backend

Before applying schema changes, write a what/why/breakage list as required by `AGENTS.md`.

Expected data domains:

- Organizations, locations, memberships, roles, and routing rules
- Continuity records/cases and persona-scoped case access
- Tasks, dependencies, assignments, waiting states, and proofs
- Case-scoped communication threads and receipts
- Vendor opportunities, negotiations, orders, schedule events, and completion proof
- Transfer Pass tokens, consents, disclosures, scans, acceptances, expiration, and revocation
- Integration connections, outbound jobs, attempts, errors, idempotency keys, and external identifiers
- Append-only audit events

Use real Supabase migrations for structural changes. Do not apply ad hoc production SQL.

### Batch 5 - integration adapter framework

- Stable internal case-creation contract
- Provider-specific adapters behind the contract
- Mapping/version strategy
- Idempotent outbound jobs
- Retry and operator-visible failure states
- Human-readable synchronization proof
- Sandbox/mock adapter for demos before any real vendor integration

## PM Sprint Brief

Status: COMPLETE for the current parallel build batch.

Sprint goal: turn Passage Zero from separate persona demonstrations into one coherent funeral-home-led operating product where a walk-in becomes a shared, assignable case and downstream vendor work stays attached to that case.

Requirements:

- One canonical case and event contract across routes.
- Director-first, zero-hand-holding operating UX.
- Multi-location organization and employee ownership model.
- Vendor negotiation-to-proof state machine.
- Responsive desktop/mobile behavior.
- No unverified legal/compliance claims and no fake external execution.

Acceptance criteria:

- A director can scan a pass or create a minimal walk-in case.
- The resulting case is visible consistently to the allowed family/director/employee personas.
- A director can select location and owner and reassign work.
- A vendor can accept or counter a scoped request, confirm, schedule, and complete it with proof.
- Each transition records actor, time, state, audience, proof destination, and next action.
- Desktop, 390, and 360 have no horizontal overflow or blocking console/hydration errors.
- Real screenshots are committed for every completed persona path.

Dependencies:

- Current Passage Zero App Router application and shared operations shell
- Canonical Sofia Rivera demo fixtures
- GitHub connector for branch writes
- Vercel canonical preview project
- Chrome/browser automation for real visual QA
- Supabase project access before durable migrations

QA/deploy plan:

1. Static TypeScript/component review.
2. Build/lint when a runtime is available; never claim build proof if unavailable.
3. Browser exercise of the complete cross-persona story.
4. Desktop 1440, mobile 390, and mobile 360 checks.
5. Console/hydration/overflow/accessibility checks.
6. Commit screenshot evidence.
7. One coherent preview deployment after the batch is integrated; avoid deploy chains.

Risks:

- Local environment may lack Node/npm/git; use GitHub/Vercel connectors and record verification limits.
- Parallel agents share the filesystem; inspect overlaps before integration.
- Share tokens expire.
- Client-side demo state is not durable or secure; do not confuse it with production readiness.
- Exact legal, compliance, privacy, medical, authority-to-act, HIPAA, FTC Funeral Rule, retention, and disclosure claims require authoritative verification and owner review before product publication.

Non-goals for this batch:

- Charging real money or changing pricing
- Sending real customer/vendor email or SMS
- Claiming real funeral-home-system integration before an adapter exists
- Publishing unverified compliance language
- Production database writes without documented migrations

## Owner gates that remain

Steve has already approved the greenfield rebuild, frontend/backend restructuring, parallel agents, demo deployment, and normal documentation/QA work. Do not ask again for those.

Stop only for the explicit `AGENTS.md` gates:

- Changing pricing amounts
- Sending real customer/vendor/funeral-home email or SMS
- Raw/ad hoc production database SQL
- Deleting functionality rather than deprecating/redirecting
- Material legal, compliance, privacy, security, medical, or funeral-director claims
- Irreversible production data loss
- Spending money or starting paid campaigns

## Required release-train behavior

- Continue PM -> UX -> Development -> QA -> Deploy without pausing when the next action is known.
- Keep roles distinct and record their handoffs.
- Use meaningful batches and preserve the Vercel deploy budget.
- Never report a mockup as shipped product.
- Never report "working," "integrated," "secure," or "enterprise ready" without the matching functional and verification evidence.
- Update this file before final handoff and after each integrated batch.

## Immediate new-chat action

1. Read the three canonical files.
2. Confirm PR #24 head is at or after `ba71de6`; inspect any newer branch/local changes before editing.
3. Re-instantiate PM and UX around the multi-location funeral-home operating slice: organization, locations, memberships, workspace context, assignment, and case routing.
4. Extend the existing typed event spine rather than creating a parallel state model; keep family access unchanged and vendor fulfillment queued.
5. Define the durable-backend what/why/breakage plan required by `AGENTS.md` before any migration. Prefer real auth/RLS-backed persistence over cosmetic progress once the multi-location contract is coherent.
6. Run React/Next review, full cross-persona browser QA at desktop/390/360, contrast/overflow/console checks, and commit new screenshots.
7. Publish one coherent `[deploy] [qa-approved]` batch, update PR #24 and this file, then auto-advance.

## Release-train cycle 2 - shared operational truth

Status: COMPLETE and preview verified for this shared-truth batch.

Branch audit:

- PR #24 was inspected at head `5b9ce061ac320aac6b15cc87e95779369c14c201` before this batch.
- The two commits after the last verified code commit contained operating-context and screenshot changes only. None of the previously delegated shared-case, multi-location, or vendor implementation tracks had landed.
- The unfinished tracks were re-instantiated. Product and UX narrowed this batch to the smallest coherent dependency: one shared operational record. Multi-location operations and vendor fulfillment remain queued in that order.

Role handoff record:

- PM: defined Sofia Rivera / Maya Rivera / `PASS-RIVERA-7K4M` / `NS-2051` at Northstar Portland as the canonical scenario, with Elena Torres accountable and Marcus Lee assigned. Required an idempotent browser-persistent sandbox event spine; excluded multi-location, vendor, and Supabase work from this batch.
- UX: passed the concept with conditions that one event be translated by persona, family and staff boundaries remain explicit, every mutation preserve actor/time/audience/waiting/proof/next owner, sandbox-only execution be disclosed, and desktop plus 390/360 layouts be verified.
- Development: implemented typed commands, events, fixture state, a replaceable local-storage adapter, a React provider, and cross-persona issue/inspect/accept/start/proof/revoke/reset flows. Director intake, director case, staff work, family pass, and receiver surfaces now read and mutate the same canonical record.
- QA: first review failed on selectable destination divergence, premature director actions, ambiguous manual-draft state, staff navigation leakage, ownership wording, and receipt-link behavior. Those issues were fixed. Focused static QA then passed.

Verification evidence:

- TypeScript verification passed after integration.
- Final TypeScript verification and the optimized production Next.js build passed after integration and the warning-only layout adjustment.
- Browser QA exercised family issue -> receiver inspection -> acceptance into `NS-2051` -> director start -> staff proof -> director/family proof return.
- Runtime state persisted after reload. Revoked, expired, already-accepted, and invalid pass outcomes preserved a no-disclosure boundary.
- Mobile checks at nominal 390 and 360 widths had equal document client and scroll widths with no horizontal overflow.
- Browser evidence is stored under `docs/evidence/passage…11257 tokens truncated…tains `user_id`, `email`, `role`, `status`, `display_name`, `title`, and legacy `location_scope`; one demo director row uses `location_scope = 'all'`.
- The demo director organization `b36f8032-2181-5ef0-9cdf-08bcd48de6c3` has no `organization_locations` row, so its director cannot yet receive a relational location grant without an explicit seed/backfill decision.
- `workflows` has 8 rows; 2 have no `organization_id`.
- `tasks` has 47 rows; all reference a workflow, but 37 have no `organization_id`.
- `workflow_events` has 0 rows and only the legacy event fields. Current owner policies allow client `INSERT`, `UPDATE`, and `DELETE`, so it is not yet a trustworthy append-only audit source.
- Existing workflow/task policies grant broad organization-level reads through `is_org_member_of`; switching immediately to assigned-only employee policies would hide legitimate current work before the missing organization/location/assignment references are backfilled.
- `estate_participants.invite_token` is plaintext and has a public token-lookup policy. It remains a separate participant-token hardening migration so funeral-home membership work cannot accidentally change family access.
- Existing public SECURITY DEFINER helpers and broad/overlapping RLS policies require later least-privilege replacement, fixed `search_path`, and explicit grants. Current Supabase behavior no longer implies Data API grants for new tables, so every new-table grant is specified separately from RLS.

PM breakage decision: Cycle 7A is split into an additive foundation and a later enforcement cutover. The additive migration may create hashed employee invitations, invitation-location grants, member-location grants, nullable workflow/task authority columns, richer event-spine fields, indexes, and narrowly granted invitation RPCs. It must not replace legacy workflow/task read policies, enforce assigned-only RLS, or install an unconditional append-only event trigger until deterministic backfill and adapter tests prove that current records remain reachable. Skipping this split would trade an honest operational gap for silent lockout of 37 tasks and two workflows.

Engineering source artifact: `supabase/migrations/20260716035414_cycle_7a_invited_employee_foundation.sql`, created with Supabase CLI. It is a draft until independent SQL/RLS QA passes. It will not be applied to production. The next safe validation path is an isolated test project only after the owner approves the separate **$0/month** confirmation; a blank project can validate migration mechanics and security tests but is not equivalent to a branch copy of production data, so production-shaped fixtures and the read-only preflight remain required evidence.

Owner approved the **$0/month** isolated-project path. Supabase project `uyacxqtsiwlvtmhxvoxr` (`passage-cycle-7a-test`, `us-east-2`) was created in the existing Passage Supabase organization and reports `ACTIVE_HEALTHY`. It is a migration/RLS safety lab, not the customer production project and not yet the product demo instance. Production remains read-only for this batch.

### Governing priority for the next operational sprints

The owner set the utmost priority: make the funeral-home experience operational end to end, establish a genuinely separate demo instance, and then drive the D2C path toward **85-90% operational readiness**. Guided-experience percentages must remain separate and cannot substitute for operational evidence.

The release train therefore stops awarding readiness for visual completeness alone. An operational gate passes only when two independently authenticated users can complete the relevant cross-persona flow on separate sessions/devices; RLS denies the wrong organization, location, role, or family grant; commands are idempotent; reload/reconnect preserves truth; delivery or integration failure has a visible recovery owner; audit/proof contains server-derived actor and timestamp; and desktop, 390-pixel, and 360-pixel QA pass.

Current product assessment: Passage is not missing a broader feature catalog as much as it is missing proven operational trust. Current funeral-tech products already market case management, team tasks, family collaboration, mobile access, forms, reports, and integrations. Passage's differentiated product bar is the clarity and evidence of every handoff: owner, waiting party, audience, prepared work, human review/send boundary, resulting state, proof, next owner, and recovery. The product should integrate with incumbent funeral-home systems before attempting to replace their accounting, body tracking, forms, or full ERP surface.

Provisional sprint order, pending the PM role's measured brief:

1. **Funeral-home authority foundation:** Google/email authentication, hashed single-use employee invitations, organization/location membership, protected workspace context, assignment, RLS, append-only command audit, and recovery. Exit with owner/director/employee invite-to-assigned-work simulation across two sessions.
2. **Funeral-home case operations:** first call/intake to accepted case, accountable director, employee delegation/workload, task-bound Case Room, reviewed family update, structured proof, reconnect/replay, notification outbox, and one provider-failure recovery path. Exit with a complete case handoff and no cross-persona leakage.
3. **Separate demo instance:** isolated auth/database/environment/domain, deterministic seed and reset, synthetic identities, blocked production data/communications, integrations in recorded simulation mode, and an automated smoke run. It may demonstrate only flows that the real product supports and must never share production routes or customer data.
4. **D2C operational path:** Google/email onboarding, planning-versus-urgent intent, independent family record/grants, participant invitation hardening, recovery, funeral-home handoff/acceptance, family-safe updates/proof, notification failure recovery, and account/data controls. Advance toward 85-90% only after the same two-session, RLS, audit, retry, and responsive exit gates pass.
5. **Pilot hardening and evidence:** real funeral-director usability sessions, measured time-to-first-case/time-to-assign/time-to-family-update, accessibility/performance, observability/support runbooks, backup/recovery proof, integration contract tests, and explicit legal/privacy/security review for unresolved high-risk decisions. These are prerequisites to an 85-90% claim, not optional cleanup.

Non-goals until these gates pass: broad vendor fulfillment, a generic group chat, full funeral-home accounting/ERP replacement, automatic external messaging without review, additional cosmetic redesign, or production-readiness increases based on demo polish.

PM role instance `/root/pm_cycle7_operational` reviewed the operating guide, full living context, and persona architecture and converted this doctrine into the governing four-sprint brief. The canonical legacy roadmap file named in AGENTS.md (`pages/system/admin/saas-roadmap.js`) is absent from this greenfield workspace, so no competing roadmap was created. The targets are evidence-gated projections, not promises: Sprint 7A funeral home 55% / D2C 30%; Sprint 7B funeral home 72% / D2C 35%; Sprint 8A funeral home 85-88% / D2C 45%; Sprint 8B D2C 85-90% / funeral home 88-90%.

Readiness caps are now explicit: no real auth/RLS caps operational readiness at 49%; no durable notifications/recovery caps it at 79%; no complete family-to-funeral-home handoff and proof return caps it at 84%. Reaching 85-90% means pilot-operational for allowlisted accounts with monitoring, support/recovery runbooks, known non-goals, and verified persona simulations. It does not mean general availability, legal/compliance completion, live billing, or universal integration readiness.

Every sprint follows distinct PM -> UX -> Engineering -> QA -> Deploy handoffs and must include SQL/RLS persona tests, advisor review, TypeScript and optimized production build, desktop/390/360 browser QA, two-user/two-session evidence, direct-URL denial, replay/idempotency/reconnect/failure recovery, timestamped screenshots, and audit-row evidence. One `[deploy] [qa-approved]` preview per coherent batch goes only to the separately configured demo environment. Production promotion remains a distinct later decision.

Owner differentiation direction: Passage wins by being stakeholder-agnostic and following the person through planning, nursing/hospice/care, family coordination, funeral-home operations, service partners, disposition, aftercare, and later estate work. The vision is now documented in `docs/product/persona-action-architecture.md` as stakeholder-agnostic continuity rails. Indispensability comes from permissioned portability, destination acknowledgment, lower repeated intake, task-bound communication, structured proof, and visible exception recoveryâ€”not data lock-in or an attempt to replace every vertical system.

Current market grounding reviewed for this decision: Passare emphasizes cloud case management, team/family collaboration, mobile access, reports, and dozens of integrations (`https://www.passare.com/` and `/manage`); Gather emphasizes case/task visibility, mobile team coordination, family invitations, autofill/e-sign, and real-time family collaboration (`https://gather.app/case-management/`); Tribute Management Software emphasizes an operational command center spanning cases, staff, locations, schedules, facilities, families, and reporting (`https://www.tributetech.com/tribute-management-software`). This reinforced the decision not to compete on a generic feature checklist. Passage's differentiated bar is one viewer-relative continuity record with explicit purpose/scope, human-reviewed prepared outcomes, handoff receipts, proof integrity, and a named next/recovery owner across organizational boundaries.

### Cycle 7A isolated-lab application and index follow-up

The test-only production-shape fixture and additive invited-employee foundation passed independent static SQL/RLS QA and were applied, in that order, to isolated project `uyacxqtsiwlvtmhxvoxr`. Migration history records `test_fixture_cycle_7a_production_shape` and `cycle_7a_invited_employee_foundation`. Production project `qsveqfchwylsbncsfgxe` remains untouched. The first large-file transport attempt was rejected on invalid encoding before migration recording; migration history proved no partial application, and the exact QA-approved source was then reconstructed in bounded chunks and applied successfully.

Post-apply catalog proof: invitation and invitation-location tables have RLS enabled and no anon/authenticated read or write grants; member-location has authenticated SELECT only and no client writes; public invite wrappers are SECURITY INVOKER with fixed empty `search_path`; privileged Passage functions are in `passage_private` with fixed empty `search_path`; direct raw invitation-table access remains unavailable. No family, participant, or vendor table was created or changed in the isolated lab.

Security advisor output contains only expected INFO notices for the six deliberately fail-closed fixture tables that have RLS and no policies. Performance advisor output identified uncovered foreign keys in the invitation, member-location, workflow, task, and event authority paths. What: add covering indexes for those foreign keys in `20260716093113_cycle_7a_index_hardening.sql`. Why: every invite/RLS/assignment/event lookup will sit on the operational request path and FK deletes/updates otherwise require avoidable scans. Breakage if skipped: pilot latency and database load grow with memberships/events, while referential actions can lock or scan more rows. This follow-up is additive, changes no data or authority, and must pass independent review and isolated-lab advisors before it is considered ready for any production plan.

Post-apply ACL simulation also found default `service_role` EXECUTE on the public SECURITY INVOKER wrappers even though those functions require an authenticated end-user context and the role cannot access the private cores. What: `20260716093406_cycle_7a_service_role_acl.sql` explicitly revokes those four misleading default grants, and the foundation source now includes the same revocation. Why: server code must pass a real user session for invitation authority rather than imply a service-role bypass. Breakage if skipped: catalog permissions suggest a trusted server path that always fails at runtime and could encourage later bypass design. This is privilege removal only; anon inspection and authenticated create/accept/revoke grants remain unchanged.

### Cycle 7A invitation-acceptance ambiguity recovery gate

PM recovery role `/root/pm_cycle7a_auth_recovery` received a behavioral QA FAIL after the first controlled acceptance attempt against isolated project `uyacxqtsiwlvtmhxvoxr`. PostgreSQL returned `42702` because the `RETURNS TABLE` output name `organization_member_id` in `passage_private.accept_organization_invitation(text)` collides with the unqualified conflict-target column in `ON CONFLICT (organization_member_id, organization_location_id)`. PostgreSQL rolled the command back transactionally: no membership, invitation acceptance, member-location grant, or audit-event row committed. Production project `qsveqfchwylsbncsfgxe` remains untouched, and operational-readiness percentages remain unchanged.

Documentation-first what/why/breakage analysis for the corrective migration:

- **What:** add a new follow-up Supabase migration that uses `CREATE OR REPLACE FUNCTION passage_private.accept_organization_invitation(text)` with the existing signature, return contract, security mode, fixed empty `search_path`, validation, locking, idempotency, event emission, and grants unchanged. Replace only the ambiguous inference clause with `ON CONFLICT ON CONSTRAINT organization_member_locations_pkey`. Do not rewrite the already-applied lab migration or use raw/ad hoc SQL. Apply the follow-up to the isolated lab first.
- **Why:** naming the existing composite primary-key constraint removes PL/pgSQL variable/output-column ambiguity while preserving the intended member-location upsert and the transaction's existing authority boundaries. A follow-up migration keeps migration history deterministic and makes the correction independently reviewable before any production plan.
- **Breakage if skipped:** every first-time invitation acceptance that reaches the location-grant upsert can fail with `42702`, leaving the invited employee unable to enter the workspace. Retrying cannot repair the deterministic failure, so onboarding remains non-operational even though inspection and authentication may succeed.
- **Breakage risk of the correction:** an incorrect constraint name, altered function attribute, or copied-body drift could break fresh migration runs, widen execution authority, weaken verified-email/token checks, create duplicate grants, or change replay behavior. Engineering must therefore diff the replacement body against the current function and change only the conflict target; QA must recheck `SECURITY DEFINER`, empty `search_path`, execute ACLs, and transactional/idempotent behavior.

Recovery acceptance: the follow-up migration applies cleanly to the isolated lab; the controlled invite accepts exactly once; one active organization membership and the exact invited location grants exist; the invitation records the accepted user/member/server timestamp; exactly one acceptance audit event exists; same-user replay returns the existing receipt without duplicate membership, grant, or event rows; wrong-email, expired, revoked, and second-user attempts remain denied; and a forced failure still leaves no partial rows. Until this retest passes, Cycle 7A QA remains FAIL/PARTIAL, no `[deploy] [qa-approved]` preview is authorized for live invitation behavior, and funeral-home/D2C operational readiness remains 40%/25%.

### Cycle 7A Auth foundation recovery verification and deploy handoff

Distinct role instances and handoffs:

- PM recovery `/root/pm_cycle7a_auth_recovery` received the behavioral `42702` failure, classified it FIX NOW, and recorded the documentation-first what/why/breakage gate above before SQL changed.
- UX `/root/ux_cycle7a_auth_handoff` set the acceptance bar for invitation disclosure, calm recovery language, protected role landing, 44-pixel targets, responsive layout, and the demo/preview boundary.
- Engineering `/root/eng_cycle7a_auth_ui` implemented the Auth/runtime shell, server authorization, invitation UI, corrective migration, and rollback-only SQL test. The corrective function body matches the foundation except for the named primary-key conflict target.
- QA `/root/qa_cycle7a_auth_foundation` independently returned PASS for the bounded Auth/route-guard foundation and authorized one non-production `[deploy] [qa-approved]` preview with Google and email providers disabled.
- Deploy role target: publish one guarded Vercel preview from `greenfield/passage-zero`, verify the canonical project, build/runtime health, route rendering, and fail-closed environment state. No production promotion is authorized.

Behavioral and data proof:

- Local Supabase PKCE/email-capture flow passed on one exact origin: OTP callback -> authenticated invitation -> deliberate POST acceptance -> replay-verified receipt -> `/staff`. Crossing between `127.0.0.1` and `localhost` correctly did not share cookies.
- The first acceptance exposed PostgreSQL `42702`; the command rolled back with no member, grant, accepted invitation, or event. Migration `20260716130000_cycle_7a_accept_invitation_conflict_constraint.sql` replaced only the ambiguous inference target with `ON CONFLICT ON CONSTRAINT organization_member_locations_pkey`.
- Corrected first acceptance created exactly one active staff membership, one Portland location grant, one server-timestamped invitation receipt, and one acceptance event. Same-user replay returned the stable receipt without duplication. A different authenticated user received `22023` and gained zero membership.
- Rollback-only test `supabase/tests/cycle_7a_accept_invitation_conflict_constraint.sql` passed and left no QA fixture residue. Catalog proof preserved `SECURITY DEFINER`, empty `search_path`, authenticated-only private execution, and no anon/service-role execution.
- The exact corrective migration is recorded in hosted isolated project `uyacxqtsiwlvtmhxvoxr` as version `20260717004417`. Production project `qsveqfchwylsbncsfgxe` remains untouched. Hosted security advisors report only the six expected fail-closed fixture INFO notices; performance advisors report unused-index INFO only in the empty lab.
- TypeScript and optimized Next.js 16 production build pass. Browser evidence at 1440, 390, and 360 shows no horizontal overflow for login, invitation review/receipt, verified staff authority, and staff-to-director denial. Evidence is under `docs/evidence/cycle-7a-auth/`.

QA/deploy boundary:

- PASS is limited to the Auth/route-guard foundation. Google and external email delivery remain disabled. No real external message was sent; local Mailpit captured only synthetic test mail.
- Hosted two-browser Auth behavior and the deployed Vercel isolated-project environment binding are not yet proven. Post-deploy QA must verify the preview's binding and confirm a mismatched or absent binding fails closed.
- Operational readiness remains funeral home **40%** and D2C **25%**. Guided readiness remains funeral home **94%** and D2C **85%**. This preview proves a guarded foundation, not durable assigned-work, notification/recovery, complete Case Room, or production readiness.
- Next highest-leverage action after preview verification: configure and prove the isolated preview data binding, run two independent hosted sessions through director invite -> staff acceptance -> role landing/replay/denial, then cut assigned workflow/task RLS onto the same authority spine.


