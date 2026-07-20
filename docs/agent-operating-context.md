# Passage Zero - Agent Operating Context

Last updated: 2026-07-18 (America/Los_Angeles)

This is the living handoff for the greenfield Passage rebuild. Read `AGENTS.md` first, then this file, then `docs/product/persona-action-architecture.md` before changing product code, data contracts, or deployment state.

## Fresh-chat kickoff

Paste this into a new Codex chat:

> Passage Release Train: start the loop. Continue Passage Zero on `greenfield/passage-zero`, draft PR #24, from the latest recorded head and dirty-state inventory. Read `AGENTS.md`, `docs/agent-operating-context.md`, `docs/release-train.md`, the canonical roadmap, persona architecture, and role briefs completely. Passage Zero is the sole feature lane; Threshold/main is reviewed P0/P1 maintenance only. Never push directly to main. After the one-time PR #25 bootstrap, agents author only through the dedicated Passage GitHub App/Bot; a distinct agent reviews the exact head, the founder reviews Bot-authored pull requests, and Production separately requires founder authorization through the protected environment. Preserve the proven Cycle 7A/7B isolated authority/work evidence and unchanged readiness scores. Cycle 8 remains FAIL/PARTIAL until its rollback-only SQL/RLS matrix passes. Enforce the seven-question plain-language gate, truthful Demo versus Secure Preview labels, human event/status copy, and 1440/390/360 comprehension. Production hydration on six public routes remains a separate P1 hotfix. Continue without asking Steve except for explicit owner gates.

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
- Browser evidence is stored under `docs/evidence/passage-zero/shared-*.png`.
- The sandbox is explicitly browser-local and is not durable, secure, multi-user, or production backend evidence.

Preview handoff:

- QA-approved commit: `f4ba31321474fbdf4620aeadc888460c914c236b`.
- Vercel deployment: `dpl_6o3NivMoyE93XY8woguxpLMQu9Yn` (`READY`, Next.js/Turbopack, preview target).
- Stable branch alias: `https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app`.
- Temporary share token generated for the July 15 demo expires July 16, 2026.
- The family/D2C journey is viable for next-week guided testing, including urgent and planning-ahead positioning, but self-serve SaaS readiness still requires authentication, durable cross-device records, account recovery, subscriptions, notifications, and production authorization.

Integrated files and contracts:

- `lib/sandbox/types.ts`, `repository.ts`, and `provider.tsx` define the shared contract and storage seam.
- `lib/passage-zero.ts` and `components/PassageZeroProvider.tsx` expose the shared slice to the App Router.
- Family, receive, director intake, director case, and staff routes now project persona-appropriate views of the same events.
- Multi-location organization switching, employee administration, vendor negotiation/fulfillment, durable Supabase persistence, and real integrations remain intentionally unimplemented.

Next execution sequence after preview verification:

1. Re-instantiate PM and UX for the multi-location funeral-home operating slice.
2. Preserve the shared event spine and add organization/location/membership/assignment concepts without widening family access.
3. Run the same static -> browser -> evidence -> single-preview loop.
4. Advance vendor fulfillment only after location and ownership semantics are coherent.

## Release-train cycle 3 - warm editorial system and onboarding

Status: COMPLETE, committed, and preview verified.

Founder feedback addressed:

- Removed the sterile martech direction across all current family and funeral-home surfaces.
- Display typography is Cormorant Garamond, chosen for its narrow editorial serif character; all navigation, controls, labels, and body copy use Montserrat as requested.
- The shared palette now begins with warm ivory paper surfaces and uses dusty, low-saturation purple, blue, and green for action and state.
- Near-black glowing pass panels, vivid iris blocks, cool gradients, and console-like intake chrome were replaced with raised paper surfaces, warm borders, quieter shadows, and accessible state bands.
- The Transfer Pass QR remains high-contrast black on white with its quiet zone preserved.
- Direct-user onboarding now acknowledges both planning-ahead and immediate-help intent before entering one honest shared handoff flow.
- Demo-only gateway labeling was replaced with product language while the browser-sandbox boundary remains explicit.

Visual QA:

- Family onboarding, family pass, receiver, funeral-home intake, director, staff, and gateway routes were inspected after the shared token change.
- All tested routes had equal document client and scroll widths at 360 pixels; family onboarding also passed at 390 pixels.
- The key warm palette pairs pass WCAG AA contrast for normal text: muted/canvas 4.75:1, signal/canvas 4.63:1, and surface text on signal 5.00:1.
- The complete issue -> inspect -> accept -> start -> proof loop still works after the visual change and produced no browser warnings or errors in the tested path.
- New evidence uses the `warm-*.png` prefix under `docs/evidence/passage-zero`.

Preview handoff:

- QA-approved commit: `ba71de6a5ea61d516e483d1a365a176a39fa3c7f`.
- Vercel deployment: `dpl_5RcB1ekoBJoPr1Jfxm6TJqL8TAnW` (`READY`, Next.js/Turbopack, preview target).
- Stable branch alias: `https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app`.
- Temporary July 15 share token expires July 16, 2026; generate a new token if the fresh chat runs later.

Readiness boundary:

- Direct-user guided testing/onboarding experience is approximately 85% complete for the current planning-ahead and immediate-help entry story.
- Funeral-home UX/workflow demonstration is approximately 85% complete for intake, ownership, staff execution, and proof return.
- Neither product is 85% operationally production-ready. Funeral-home pilot readiness still requires real auth/roles, durable multi-user storage, organization/location administration, RLS/audit enforcement, notifications/recovery, and integration reliability. D2C SaaS additionally requires account lifecycle, cross-device persistence, and subscription/billing work.

## Release-train cycle 4 - multi-location operating foundation

Status: COMPLETE, committed, and preview verified.

Branch and role audit:

- Work began from the requested PR #24 head `e8dbdd01a42c55a15ce9716d21f3fb2e3979ee3b`. The open draft PR had no review threads or requested changes. The head was a context-only commit after the cycle-3 QA-approved code commit; no parallel implementation had landed.
- PM (`/root/pm_cycle4`) constrained the batch to Northstar Funeral Home, Portland and Beaverton locations, org-wide director Elena Torres, Portland operator Marcus Lee, Beaverton operator Avery Brooks, one location-routed intake, and same-location assignment changes.
- UX (`/root/ux_cycle4`) passed the proposed All locations / Portland / Beaverton workspace, location-specific empty states, intake routing receipt, and non-leaking staff view with explicit copy and 44-pixel target conditions.
- Engineering (`/root/eng_cycle4`) extended the existing typed command/event reducer and browser repository. It did not create a second case model and did not widen family access.
- QA (`/root/qa_cycle4`) first failed six authority and state-integrity issues: destructive pass issue reset, missing actor authority, premature reassignment, invalid assignment-to-proof transition, optimistic receipt display, and undersized targets. PM kept all six in scope. Engineering corrected them, and focused static QA passed.
- Deploy (`/root/deploy_cycle4`) is instantiated only after the integrated browser and production-build gates; it may publish the one `[deploy] [qa-approved]` preview for this batch and no more.

Implemented operating contract:

- Added typed organization, location, membership, membership scope, workspace context, case accountability, assignment history, and routing events to the shared case/event spine.
- Added director workspaces for all locations, Portland, and Beaverton. Workspace choice filters presentation only and never grants authority.
- Added an atomic intake path that creates `NS-2051`, records organization/location/accountable director/first assignee, and explains the default routing reason.
- Added accepted-case reassignment with explicit actor and actor-membership identity. Reducer guards enforce role, membership, location, case state, and current-assignee boundaries.
- Added staff execution guards so only the current assignee can start work and only an in-progress commitment can submit proof.
- Preserved the family view and privacy boundary. Family proof status updates from the shared event history but never exposes organization location, staff scope, or internal routing detail.
- Kept vendor fulfillment queued. No vendor model was introduced before location and ownership semantics became coherent.
- The implementation remains an honestly labeled browser-persistent sandbox. It does not claim external synchronization, durable multi-user storage, or production authorization.

Required database migration analysis - documented before any migration:

No database migration is included in cycle 4. The following is the documentation-first gate for the next persistence batch.

| Required change | Why the frontend/pilot needs it | What breaks if skipped |
| --- | --- | --- |
| `organizations` and `locations` tables, with stable IDs and active state | Director and intake surfaces need durable funeral-home and operating-location identity. | Workspace filtering, routing, ownership, and audit records collapse into display strings and cannot be enforced. |
| Auth-backed `profiles` plus `organization_memberships` with role and active state | Every command needs a durable human actor and organization authority. | The app can impersonate seeded people; multi-user attribution and access revocation are not trustworthy. |
| `membership_locations` (or an equivalently explicit scope relation) | Location-scoped operators need least-privilege access while organization-wide directors can span locations. | A user is either overexposed to the whole organization or cannot work their assigned location. |
| Case `organization_id`, `location_id`, and `accountable_membership_id` foreign keys | The shared case must carry durable tenancy, work location, and accountability. | Cases cannot be routed, filtered, or protected consistently; family and operational projections may diverge. |
| Append-only `case_assignments` history with assignee, actor, reason, and effective timestamps | Reassignment needs an enforceable history rather than a mutable owner label. | Current ownership can be overwritten without proof of who changed it or why; recovery and audit fail. |
| Versioned `routing_rules` keyed by organization/location and intake attributes | Intake defaults must be deterministic and explainable while allowing controlled evolution. | Routing lives in UI conditionals, cannot be audited, and becomes unreliable across clients. |
| Per-user `workspace_preferences` | The selected location can persist without being mistaken for authorization. | Users repeatedly lose context, or developers are tempted to encode workspace in a security-sensitive session field. |
| Append-only `audit_events` with server-derived actor, audience, case, organization/location, command/event IDs, and timestamps | Pilot operations require tamper-resistant proof of every transition and access-relevant mutation. | Client-authored audit rows can be forged or omitted; incident review, recovery, and compliance evidence are inadequate. |

RLS and breakage expectations for that migration:

- Active organization membership is required for operational access; location-scoped members are restricted through their membership-location rows. Assignment may further narrow staff case visibility.
- Family access remains independent and grant-based. It must never be inferred from funeral-home membership or broadened by organization/location changes.
- Workspace preference is presentation state only and must never appear in an RLS predicate as authority.
- Audit insertion is server-derived and append-only; clients may not choose actor IDs, organization IDs, or timestamps.
- The migration will intentionally break browser-only seeded identity and local-storage-as-source-of-truth assumptions. It must ship with an adapter cutover, fixture/test updates, rollback notes, and verification that existing family grants still resolve to the same case projection.
- It will also surface missing membership/location records as denied access rather than silently falling back to broad organization access. Seed/backfill validation is required before enabling policies.

Verification evidence:

- TypeScript and optimized Next.js production builds pass after integration.
- Browser QA completed the receive -> accepted intake -> routed case -> reassignment -> staff start -> proof -> family proof-return path.
- Desktop, 390-pixel, and 360-pixel layouts were inspected. Tested pages had no horizontal overflow; visible interactive targets in the new slice are at least 44 pixels.
- Exact empty states were verified for Beaverton and unassigned Portland staff. The intake receipt records location, accountable director, first assignee, routing reason, proof destination, next action, and an explicit browser-only/no-external-sync boundary.
- Browser logs contained no warnings or errors from the application.
- Evidence is stored under `docs/evidence/passage-zero/cycle4-*.png`.

Preview handoff:

- QA-approved commit: `5a6f06e23bac3fd13702ec4a8f6a31d639674a62` with the required `[preview] [deploy] [qa-approved]` markers.
- Exactly one canonical preview was created: `dpl_6dJnC8jHuqDEzENrV9FwEWm7BK3v` (`READY`, Next.js project, Git branch `greenfield/passage-zero`, PR #24).
- Stable branch alias: `https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app`.
- Temporary share URL expires July 16, 2026 at 22:31 Pacific: `https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app/?_vercel_share=IlVB6d874l2GTiIjlTezoSTFGpbJBaaF`.
- Deployment-scoped Vercel error, warning, and fatal log query returned no entries after preview creation.

Readiness estimates after cycle 4:

- Family / direct-user path: **85% guided-experience readiness; 25% operational production readiness**. The shared handoff and proof-return story is coherent, but authentication, durable cross-device records, recovery, notifications, subscriptions/billing, and production authorization remain.
- Funeral-home path: **90% guided pilot-workflow readiness; 40% operational pilot readiness**. Organization/location/membership/assignment/routing semantics now exist and are demonstrable, but they are not yet backed by real authentication, RLS, durable multi-user persistence, enforced server audit, notifications/recovery, or reliable integrations.
- These percentages are goal-progress estimates, not production-readiness claims. The next loop is durable authentication and RLS-backed persistence using the documented migration gate above.

## Release-train cycle 5 - multi-employee workload and task-bound communication

Status: QA APPROVED; one guarded non-production preview is authorized for this integrated batch.

Owner direction carried forward:

- A funeral-home organization owns the operational case at a named location; the accountable director can assign specific commitments to eligible employees.
- Multi-location workload, current ownership, waiting parties, and communication must stay clear across director, employee, and family projections.
- Passage-prepared work must make the human step faster without implying that an external message was sent.
- Guided-experience progress remains separate from operational production readiness.

Release-train role record:

- PM (`/root/pm_cycle5`) first scoped durable auth/RLS plus workload communication. The environment check found no Supabase toolchain, credentials, or configured project variables, so PM re-scoped the executable batch to the typed browser sandbox and kept durable auth/RLS as the immediate backend blocker.
- UX (`/root/ux_cycle5`) passed implementation with conditions: workload -> filtered queue -> selected commitment -> prepared output; explicit audience, automation, review-required, and not-sent boundaries; seeded identity labeled preview-only; 44-pixel targets; and zero family leakage.
- Engineering (`/root/eng_cycle5`, completed by `/root/eng_cycle5_finish`) generalized the existing event spine to collections and implemented the director/staff slice. No parallel task/message model was created and family access was not widened.
- QA (`/root/qa_cycle5`) first failed stale hardcoded member totals, then failed two undersized family-header targets. PM classified both as fix-now. Engineering moved every workload label to shared derived selectors and applied a CSS-only hit-area correction. Final integrated QA passed.
- Deploy role may publish exactly one non-production `[deploy] [qa-approved]` preview from this coherent release commit. The exact deployment ID and accessible evidence are recorded on PR #24 after verification; no production release is authorized.

Implemented operating contract:

- The typed sandbox now contains five active cases and five active commitments across Northstar Portland and Beaverton: Marcus 2, Avery 1, Elena 1, and one unassigned at the canonical reset state.
- Director workload, location/owner filters, unassigned assignment, same-location reassignment, staff ownership totals, and staff queues derive from the same current commitment collection.
- Assigning the Williams commitment to Marcus changes director load, filtered queue, identity option, and staff-owned count from 2 to 3 immediately and after reload; reassignment reverses the same selectors.
- Staff can switch among explicitly labeled seeded sandbox identities and sees only commitments assigned to that identity. The switch is presentation-only and explicitly does not sign in or grant access.
- Each selected commitment exposes owner, waiting party, audience, automation level, Passage-prepared content, human action, proof destination, next state, and next owner.
- Communication stays attached to its commitment. The fixture contains two Passage-prepared review-required outputs, one automatic internal routing receipt, and zero automatically sent external messages.
- Family-facing confirmation copy and an internal escalation summary can be marked review-ready in the sandbox, but no send action exists and the event records that nothing was sent.
- The Rivera accept -> route -> staff start -> proof -> family proof-return path still passes. Family files, grants, and projection remain unchanged apart from a CSS-only expansion of existing header hit areas; internal workload, locations, assignment reasons, drafts, automation metrics, and routing receipts do not appear in the family DOM.
- Vendor fulfillment remains queued. No database migration, real authentication, RLS claim, external delivery, or integration execution is included.

Automation inventory at canonical reset:

- Human-owned or unowned commitments: **5**.
- Passage-prepared drafts requiring human review: **2**.
- Automatically recorded internal routing receipts: **1**.
- Automatically sent external messages: **0**.

Verification evidence:

- Independent TypeScript and optimized Next.js 16 production builds pass; all eight App Router routes prerender.
- Browser QA passed director, staff, and family flows at 1440x1000, 390x844, and 360x800.
- The assignment/reassignment count mutation, location eligibility, seeded identity isolation, prepared-output review/no-send boundary, Rivera proof return, and family non-leakage checks pass.
- Tested routes have no page-level horizontal overflow, console warning/error, or hydration error.
- New director/staff controls meet the 44-pixel target requirement. The existing family wordmark and profile targets now render at 99x44 and 44x44 at desktop, 390, and 360; keyboard focus and Enter activation pass.
- Real screenshots are stored under `docs/evidence/passage-zero/cycle5-*.png`.

Database and operational-readiness boundary:

- No migration was applied. The cycle-4 what/why/breakage gate remains controlling and now also requires durable `commitments` plus append-only assignment history, and contextual `communication_threads` / `prepared_outputs` with audience and review state.
- Supabase tooling, preview-safe credentials, and project environment variables were not available after local environment and canonical Vercel project checks. Browser localStorage remains the explicit source of truth for this preview.
- The next operational batch is still real authentication, RLS-backed multi-user persistence, server-derived append-only audit, then notifications/recovery and integration reliability. Do not substitute another local adapter or cosmetic surface for that cutover.

Readiness estimates after cycle 5:

- Family / direct-user path: **85% guided-experience readiness; 25% operational production readiness**. Family behavior did not expand and no durable account or delivery capability landed.
- Funeral-home path: **94% guided pilot-workflow readiness; 40% operational pilot readiness**. Workload, assignment, employee scope, contextual communication, prepared outputs, and automation boundaries are demonstrably coherent, but remain unauthenticated and browser-local.
- These are goal-progress estimates, not production-readiness claims. Operational percentages do not increase from visible sophistication alone.

Auto-advance:

- After the single preview and PR handoff are verified, Product Management returns immediately to the durable auth/RLS batch. The current external blocker is missing Supabase project/tool access; no owner question is needed until safe self-service paths are exhausted and a credential/access gate remains.

## Release-train cycle 6 - persona pressure test and persistence truth

Status: COMPLETE; QA approved and the single guarded preview is verified.

Role and branch audit:

- PM (`/root/pm_cycle6_pressure`) produced a 36-scenario persona-flow matrix and classified real authentication/invitation binding as the P0 operational dependency. Target first-use times are family Google login within 60 seconds, represented participant within 90 seconds, vendor owner within 2 minutes, vendor employee within 90 seconds, funeral-home owner within 3 minutes, and invited funeral-home director/employee within 90 seconds.
- UX (`/root/ux_cycle6_onboarding`) returned FAIL/P0 for operational onboarding until real auth, invitation binding, protected routing, role onboarding, and live address autocomplete exist. UX approved an honest browser-sandbox repair batch and prohibited fake sign-in, invitation, vendor, or address routes.
- Engineering (`/root/eng_cycle6a`, completed in the root engineering role after the delegated editor stalled) implemented only the approved sandbox repairs. The existing typed event spine remains the single state model.
- QA (`/root/qa_cycle6a`) initially returned PARTIAL because the director queue claimed due-time order without sorting and the 360-pixel brand overlapped the director navigation. Engineering sorted the visible queue and replaced the mobile header with a compact nonoverlapping grid. QA re-tested and returned PASS.
- Deploy will be instantiated only after QA PASS and may publish exactly one non-production `[deploy] [qa-approved]` preview for the integrated batch.

Implemented batch:

- Director navigation is role-pure: Today, Intake, and Receive. Staff navigation contains only My work.
- The staff identity preview excludes the accountable director in both UI derivation and reducer authority checks; legacy browser state is normalized to an active non-director employee.
- Director assignment choices derive from the selected case's operating location, exclude the current owner, and use the same effective assignee for displayed and submitted state across filtering, row selection, and repeated reassignment.
- Family planning-ahead and urgent intent now produce materially different guidance and persist only in browser local storage. The copy states that the choice creates no account, does not change sharing, and can be changed at any time.
- The inert family profile control is now a noninteractive signed-in-preview identity label.
- Human-prepared outputs begin unreviewed. Review creates one stable idempotent event, persists `reviewReady`, changes the boundary to Reviewed / Not sent, removes the repeated review action, and never exposes a send control. Existing browser records are normalized from event evidence rather than trusting stale seeded flags.
- TypeScript and the optimized Next.js 16 production build pass after final integration; all eight App Router routes prerender.

Final Cycle 6A verification:

- Browser QA passed at 1440, 390, and 360 for family intent selection/reload, director filtering/selection/reassignment/reload, staff identity isolation/empty state, and prepared-output review/reload.
- The director queue is actually ordered 10:30, 11:15, 12:20, 13:45, 15:30. The 360/390 mobile header has no wordmark/navigation collision and 55-pixel navigation targets.
- Staff options are Marcus and Avery only; Elena is absent. Reviewed state persists, changes to `Reviewed · Not sent`, removes the review button, exposes no send action, and remains one idempotent event.
- Every tested page has equal document client/scroll width, with no page-level horizontal overflow, console warning/error, or hydration issue.
- Ten real screenshots are committed under `docs/evidence/passage-zero/cycle6a-*.png` for family planning/urgent, director, and reviewed staff states at required viewports.

Cycle 6A preview handoff:

- QA-approved commit: `80e5e52b61675851d014709467db4d87d5e06891`.
- Exactly one non-production preview was created: `dpl_5FKCPc9UmQLkMRYtazQxzUu7hM2e`, `READY`, `target: null`, on `greenfield/passage-zero` in the canonical Vercel project.
- Deployment URL: `https://thepassageappio-rf007pfdz-thepassageappio-7018s-projects.vercel.app`.
- Stable branch alias: `https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app`.
- Fresh share URL: `https://thepassageappio-rf007pfdz-thepassageappio-7018s-projects.vercel.app/?_vercel_share=hBd8j6oA76QvUHv2erKzYv5HxmeZ6NA5`; Vercel reports expiry July 17, 2026 at 2:21:28 AM without labeling the displayed timezone.
- Build completed in 21 seconds. Errors-only build logs were clean; deployment-scoped preview runtime error/warning/fatal logs were empty. Protected root fetch returned HTTP 200 and rendered Passage with Cormorant Garamond and Montserrat.
- No additional preview or production deploy was created or authorized.

Operational-readiness boundary:

- Family/direct-user remains **85% guided-experience readiness and 25% operational production readiness**.
- Funeral-home remains **94% guided pilot-workflow readiness and 40% operational pilot readiness**.
- Visible UX refinement does not raise operational readiness. Real auth, durable multi-user persistence, RLS, server-enforced audit, recovery/notifications, and integration reliability remain required.

### Cycle 7 database migration contract - documentation-first gate

No migration has been applied. Supabase project `qsveqfchwylsbncsfgxe` is connected and healthy. Production contains real auth users and an established public schema, so structural work must first run on an isolated Supabase development branch. Supabase quoted that branch at **$0.01344/hour**; explicit owner cost approval is still pending.

The migration must extend `organizations`, `organization_locations`, `organization_members`, `workflows`, `tasks`, `workflow_events`, `estate_access`, `estate_participants`, `messages`, `notification_log`, `vendors`, `vendor_team_members`, and `vendor_requests` where applicable. It must not create a second case, task, communication, or event spine.

| Required structural/policy change | Why the pilot needs it | What breaks if skipped |
| --- | --- | --- |
| Normalize organization membership to an authenticated `auth.users` identity; enforce one active membership state and explicit funeral-home roles for owner/director/employee. | Google and email-invited users must resolve to a durable actor before any organization access or command. | Seeded identity remains impersonable; revocation, attribution, and multi-user persistence are not trustworthy. |
| Add an explicit membership-to-location relation and migrate away from `organization_members.location_scope` text as authority. | Directors may span approved locations while employees may be limited to one or several named locations. | RLS either overexposes the whole company or blocks legitimate multi-location work; workload and routing cannot be enforced. |
| Add hashed, expiring, single-use organization invitations with invited email, role, organization, optional location scope, inviter, accepted user/time, and revoked/expired states. Never persist a raw bearer token. | Google login and email acceptance must bind the authenticated person to the invitation and intended role in one transaction. | Forwarded/replayed links can grant the wrong role; acceptance cannot be audited or recovered safely. |
| Replace plaintext `estate_participants.invite_token` lookup with a token hash/digest transition and revoke/expiry/accepted state while preserving existing family grants. | Participant invitations currently expose a reusable bearer token pattern; represented-person access must remain independent from funeral-home membership. | Token disclosure can become record access, old invitations cannot be safely revoked, or a cutover can lock out legitimate family participants. |
| Extend `organization_locations` address fields with address line 2/unit, provider, provider place ID, original input, normalized components, validation timestamp/status, source (`provider` or `manual`), and review-required state. | Required typeahead must parse city/state/postal/country as the user types while keeping every field editable and supporting manual/international fallback. | Routing and service-location data become display strings; silent provider errors can misroute cases or overwrite user corrections. |
| Enforce durable workflow/case organization, operating location, accountable membership, current assignment, and append-only assignment history with actor, reason, effective time, and prior/next owner. | Funeral homes receive family cases and directors delegate specific commitments across employees and locations. | Ownership can be overwritten without proof; staff workload, recovery, and location routing diverge across clients. |
| Keep task communication and prepared outputs attached to the existing task/workflow identifiers, with audience/visibility, automation level, review state, recipient, delivery state, proof destination, and next owner. | Family, director, staff, participant, and later vendor communication must explain what was prepared, who acts, who waits, and whether anything was actually sent. | A parallel chat model loses task context; the UI can imply delivery without a reliable recipient/status/proof record. |
| Make `workflow_events` append-only to ordinary clients: remove owner UPDATE/DELETE, prohibit client-selected actor/organization/timestamps, and insert validated events through a server-side transaction/RPC or trigger. | Audit evidence must be derived from authenticated commands and survive retries without duplication. | Users can rewrite/delete history or forge actors; disputes, recovery, and operational QA have no trustworthy record. |
| Replace broad or overlapping public-role policies with authenticated least-privilege RLS for organization, location, assignment, family grant, participant invite, and vendor request scopes; audit exposed SECURITY DEFINER helpers with fixed `search_path`. | The current advisor reports broad inserts, exposed helpers, and overlapping policies. | Cross-tenant data may be exposed, unauthorized rows may be created, or performance degrades under pilot load. |
| Add durable notification intents/outbox rows keyed to the event spine, idempotency keys, retry/backoff, delivery provider IDs, terminal failure, and user-visible recovery state. | Invites, assignment changes, family updates, proof returns, and escalations need reliable delivery without claiming success early. | Users wait without knowing why, duplicate messages can be sent, and failed integrations have no recovery path. |
| Add required indexes and uniqueness constraints for membership/location lookups, invitation digest, workflow organization/location/assignee, event idempotency, and notification retry queries. | RLS and event/outbox lookups sit on every authenticated workflow. | Pilot latency and database load rise quickly; retries can create duplicate effects. |

Migration sequencing and breakage plan:

1. Create and validate the isolated development branch only after the exact cost approval.
2. Snapshot policy/table advisor output; add nullable structures, indexes, invitation hashing support, and backfill verification first.
3. Backfill membership/location/case references and reject ambiguous records into an explicit manual-review report; never silently broaden access.
4. Add invitation acceptance and command/event transactions, then integration tests for owner/director/employee, represented participant, family grant, and vendor boundaries.
5. Enable restrictive RLS and append-only audit on the development branch; prove denied cross-org, wrong-location, unassigned-staff, expired/replayed-invite, and family-leakage cases.
6. Cut the frontend adapter from local storage to Supabase only after the same typed event contract passes end to end. Keep an explicit rollback path until validation completes.
7. Production application remains a separate migration action. No raw production SQL, destructive data rewrite, Google provider activation, email send, or paid address provider is authorized by this plan.

Auth and integration decisions queued behind the branch gate:

- Use Supabase Auth for Google OAuth and email invitation acceptance. Resolve a pending invitation after authentication by normalized verified email; never trust a client-supplied organization, role, or location claim.
- Prefer server token-hash/OTP verification for email links because mail security scanners can prefetch and consume one-click links. Recovery must not reveal whether an email belongs to an account.
- Implement the address UI through a provider-neutral adapter, with Google Places Autocomplete (New) as the current leading provider. Billing/API activation needs separate owner approval; the UI must remain functional with manual structured entry when the provider is unavailable.
- Vendor owner/employee persistence and fulfillment remain after funeral-home location and ownership enforcement passes. Existing vendor tables are audited now but not widened into family-record access.

#### Cycle 7A exact first-migration scope

Final SQL must preflight the development branch's actual column types and names and add only missing structures; it must fail closed rather than guess.

- New `organization_invitations`: UUID primary key; organization FK; normalized invited email; constrained funeral-home role; nonempty purpose; inviting auth-user FK; unique SHA-256 token hash plus nonsecret support hint; expiry; mutually exclusive accepted/revoked timestamps and user FKs; accepted member FK; created timestamp. The raw token is returned once to the trusted server caller and is never stored or logged.
- New `organization_invitation_locations`: invitation/location composite key with FKs. The invite discloses and enforces its exact location scope before acceptance.
- New `organization_member_locations`: member/location composite key, granting auth-user FK/time, optional revoked time, and indexes for active member and location lookups. Legacy `organization_members.location_scope` remains temporarily as deprecated read-only compatibility and receives no new writes.
- Auth binding: use an existing auth-linked profile if branch preflight finds one; otherwise add `profiles(id -> auth.users, display_name, onboarding_state, created_at, updated_at)` and the standard creation trigger. Add only missing `organization_members.user_id`, lifecycle status, accepted time, and unique active `(organization_id,user_id)` enforcement.
- Existing authority columns: ensure `workflows.organization_id`, `workflows.organization_location_id`, and `tasks.assigned_organization_member_id` exist with FKs and tenant/location/assignee indexes.
- Existing `workflow_events`: add only missing organization, location, actor-user, actor-member, event type, idempotency key, audience, prior/next state, occurred time, metadata, and optional invitation FK; enforce unique `(organization_id,idempotency_key)`. Revoke client INSERT/UPDATE/DELETE, install an unconditional mutation-prevention trigger, and allow insertion only from validated server RPCs that derive actor, organization, location, and time.

Required RPC boundary:

1. `inspect_organization_invitation(raw_token)` hashes the token and returns only inviter display name, organization, role, location names, purpose, expiry, and state. It returns no invited email, roster, case/family data, or token digest.
2. `accept_organization_invitation(raw_token)` requires authentication, row-locks the invitation, compares normalized verified Auth email, atomically creates/activates the member and member-location rows, stamps acceptance, emits one event, and returns the member and `/staff` landing. Replay by the same accepted user returns the existing receipt; it never creates a second member.
3. `create_employee_invitation(org_id, invited_email, location_ids, purpose, expires_at)` requires an active authorized owner/director for every requested location, generates the raw token server-side, stores only its digest, emits an event, and does not claim an email was sent.
4. `revoke_organization_invitation(invitation_id, reason)` requires authorized owner/director scope and records revocation plus an event. Accepted invitations require the separate membership-revocation path.
5. The internal event append function is not executable by anon/authenticated clients. RLS helpers use SECURITY DEFINER only where needed, set a fixed `search_path`, and answer active membership, location access, task assignment, and invite-management predicates.

Cycle 7A RLS must prove: no public table lookup for invitations; employee reads only own membership/location rows and assigned workflows/tasks at allowed locations; managers operate only within organization/location authority; clients cannot elevate roles, locations, or assignees; workflow events are read only for accessible workflow and audience; family grant policies remain independent. Workspace preference, client-selected location, email text alone, and a role label alone are never authority.

Cycle 7B is separate and required before organization-owner onboarding: structured address line 1/2, locality, administrative area, postal code, country code, existing provider place ID, provider, validation status, suggested formatted value, validation/review timestamps and reviewer, and address version. Preserve the legacy display address until deterministic backfill. Address data never grants access. Keeping 7B separate limits the employee-invite migration while preserving the owner's mandatory live typeahead requirement for the immediately following organization/location slice.

Next highest-leverage action: after explicit Supabase branch-cost approval, create the isolated development branch and implement the invited funeral-home employee path first (invite -> Google/email authentication -> account binding -> role/location onboarding -> protected My work -> audit proof), followed by funeral-home organization onboarding with live address parsing. Until approval, continue migration tests/specification and the Case Room contract without touching production schema.

## Queued Cycle 7B/8 - Case Room, realtime coordination, and proof integrity

Owner requirement: each case needs real-time group coordination across funeral home, family, invited participant, employee, and later vendor relationships. PM (`/root/pm_cycle6_pressure`) and UX (`/root/ux_cycle6_onboarding`) converted this into a task-attached Case Room contract. It is not a detached chat product and must extend `workflows`, `tasks`, `messages`, `workflow_events`, and the existing typed event spine.

Experience and evidence contract:

- The stable Case Room information architecture is `Now · Tasks · Updates · Proof`. `Now` shows one viewer-relative action, who is waiting, the latest permitted update, and the latest proof. Default ordering is Needs action then time, not an undifferentiated social feed.
- A composer appears only inside a selected task/request/decision thread and says `Reply about [task]`. Effective recipients are server-derived from current grants and authority. The send boundary repeats the named audience beside the action.
- Every message, status, proof, prepared output, receipt, correction, and handoff shows immutable actor/role plus authoritative date and time, audience/visibility, related task, delivery/read evidence, resulting state, who is waiting, proof destination, next owner, and next action.
- Prepared external output is visibly `Passage prepared · Review required · Not sent`. After a human send, the human is the sender and preparation remains metadata. Initial external automatic sends remain zero. Internal automatic receipts are `Recorded automatically · Internal only` and never appear as human speech.
- Delivery truth progresses only from durable evidence: Not sent -> Sending -> Sent/Delivered with time -> Read by permitted named recipient/time. Failure is Not delivered with retry and escalation. Unknown is Delivery not confirmed, never inferred read/unread.
- Persona projection remains strict: director/employee internal coordination is case-team only; family sees one decision-ready question/outcome without workload/routing/vendor negotiation; participant sees only the granted task and contributes without implied approval/authority; vendor sees only the scoped request/order and never browses the family record.

Proof is a structured task outcome, not a hollow green label. Required fields are what happened, submitter, authoritative timestamp, source/artifact/reference, audience, related task/event, verification state, verifier/time where applicable, proof destination, next owner, and next action. Lifecycle is Required -> Submitted -> Under review -> Verified or Rejected/Needs replacement. Corrections supersede rather than overwrite. Family may see a translated pending/verified outcome without internal artifacts unless explicitly granted.

Data and realtime direction:

- `messages` stays bound to workflow and normally task, with parent/correction relationship, server-derived sender/time, audience/visibility, client idempotency key, prepared-output relationship, delivery state, resulting task state, and next action. Message bodies are immutable; corrections/retractions append.
- A `message_receipts` child relation is allowed for recipient-specific queued/sent/delivered/read/failed evidence without exposing hidden rosters. A `task_proofs` child relation is allowed for evidence on the existing task, including structured outcome, private artifact reference, submitter/time, audience, review state/reviewer/reason, and superseded proof. Neither is a parallel task or event model.
- `workflow_events` remains the canonical append-only spine for message, delivery, blocker, escalation, proof, status, owner, waiting, and next-action transitions.
- Realtime starts only after Cycle 7A auth/membership/location/assignment RLS passes. Subscribe to authorized Postgres changes, then reconnect by fetching after the last durable event cursor. Realtime accelerates the UI but is never the source of truth. Send/proof/status RPCs are idempotent.
- Offline/retry preserves a visibly device-local draft, never claims sent, and cannot double-send. Provider-pending, failed/bounced recipient, revoked grant, conflicting response, and failed/resumable proof upload all retain a named recovery owner and truthful state.

Phased delivery:

1. Cycle 7A: real invited-employee auth, organization membership, relational location scope, assigned-only RLS, append-only audit.
2. Cycle 7B: authenticated director/employee Case Room, structured proof review, and realtime catch-up across two sessions.
3. Cycle 8A: funeral home/family reviewed communication and family-safe verified proof after durable independent family grants.
4. Cycle 8B: family/invited-participant bounded thread after participant invitation/grant hardening.
5. Cycle 8C: funeral home/vendor room only after vendor organization/member/request authority is enforced.

Acceptance includes two-session updates within two seconds under normal preview conditions, reload/reconnect catch-up without gaps/duplicates, direct-URL denial, double-submit idempotency, revoked access, delivery failure, proof rejection/replacement, exact timestamps and audiences, and desktop/390/360 keyboard/overflow/console verification. Operational readiness does not increase from a visual chat shell; it increases only after authenticated multi-session RLS, immutable audit, real delivery/recovery, and integration evidence pass.

### Cycle 7A live Supabase preflight and isolation gate

Status: PM scope and documentation-first migration gate are complete; Engineering is drafting the additive migration; no database migration has been applied.

The owner explicitly approved the quoted Supabase development-branch cost of **$0.01344/hour**. The branch create request then failed with `PaymentRequiredException: Branching is supported only on the Pro plan or above`. No branch was created, no cost was incurred, and no production schema or data changed. Upgrading the Supabase organization is not authorized. Supabase quoted a separate isolated test project at **$0/month**; creating that project is a new explicit cost-confirmation action and remains owner-gated.

Read-only production preflight established the actual compatibility and backfill risks before SQL was written:

- `organization_members` has 3 rows. It already contains `user_id`, `email`, `role`, `status`, `display_name`, `title`, and legacy `location_scope`; one demo director row uses `location_scope = 'all'`.
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

Owner differentiation direction: Passage wins by being stakeholder-agnostic and following the person through planning, nursing/hospice/care, family coordination, funeral-home operations, service partners, disposition, aftercare, and later estate work. The vision is now documented in `docs/product/persona-action-architecture.md` as stakeholder-agnostic continuity rails. Indispensability comes from permissioned portability, destination acknowledgment, lower repeated intake, task-bound communication, structured proof, and visible exception recovery—not data lock-in or an attempt to replace every vertical system.

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

Deploy result:

- QA-approved source commit `e13bb411ec6fed64cbcc203549ffd36c971908df` was published to `greenfield/passage-zero` with `release: authenticated funeral-home invitation foundation [deploy] [qa-approved]`.
- Exactly one new non-production preview was created in canonical Vercel project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`: deployment `dpl_DWcXnAHAYvaJqfdw19awsdQQxfmg`, READY, target `null`, 37-second build window, 27-second build command. Errors-only build output is clean.
- Preview URL: `https://thepassageappio-lcoy7m45j-thepassageappio-7018s-projects.vercel.app`. Stable branch alias remains `https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app`.
- The first generated share token incorrectly redirected to Vercel login. A freshly regenerated working login-route URL is `https://thepassageappio-lcoy7m45j-thepassageappio-7018s-projects.vercel.app/login?_vercel_share=RLV41GAiZXUDOUn0w0GgpEAsYwtoReiv`; Vercel reports expiry July 18, 2026 at 12:47:45 AM without labeling the displayed timezone.
- Post-deploy browser proof: `/login` renders the warm Auth surface and truthfully reports `Environment unavailable`; `/director`, exact `/director/intake?mode=manual`, and `/staff` render `Workspace access remains closed`; invalid invitation inspection fails closed. No organization, location, roster, case, family, or seeded operator data is exposed.
- Deployed `/login` has zero horizontal overflow at 1440, 390, and 360. Project runtime error clusters are empty for the verification window; deployment-scoped error/warning/fatal runtime logs are empty. `docs/evidence/cycle-7a-auth/deployed-login-mobile-390.png` records the deployed mobile state.
- Deploy status is therefore PASS for the guarded fail-closed preview and PARTIAL for operational Auth: Vercel preview environment variables are not yet bound to isolated project `uyacxqtsiwlvtmhxvoxr`, so provider actions remain unavailable. Production is unchanged.
- Deployment-control finding after the handoff commit: Vercel also built docs-only commit `432db9a52829b55aea107c0ee62e851e5a2ac516` as READY deployment `dpl_9WN27dmHmfYvPdNrkg9QavxHTpTZ` even though its message contains `[skip deploy]`. The product tree is identical to the QA-approved preview except for context/evidence files, but this means the greenfield Vercel project is not honoring the documented ignore-build gate. No cancellation capability was exposed through the connected Vercel tools, and the pinned CLI could not complete authentication before timeout. Stop creating follow-up commits until the ignore-build configuration is restored; treat this as a deploy-process defect, not a product or build failure.
- Latest verified working share URL: `https://thepassageappio-f5r9mc6vi-thepassageappio-7018s-projects.vercel.app/login?_vercel_share=iO5wxs2enoUBBsMMfOnvSxw5yxHe1vgp`; Vercel reports expiry July 18, 2026 at 12:52:22 AM without labeling the displayed timezone. The URL was opened in the browser and rendered the expected fail-closed login surface.
- PR #24 was updated with the Cycle 7A scope, proof, readiness boundary, latest share URL, isolated-project migration state, and the unexpected docs-only rebuild. No further commit or deployment was created after this finding.

### Cycle 7A hosted-auth cutover - PM Sprint Brief

Status: PM COMPLETE; no engineering or hosted configuration change is authorized until UX receives this handoff. This is the smallest next batch that can raise funeral-home operational readiness: turn the current guarded preview from a fail-closed Auth shell into a two-person, durable invitation proof against the isolated Supabase lab. It does not widen the batch into assigned-work RLS, Case Room, D2C, vendor fulfillment, or production promotion.

Role instance and prior handoff:

- Product Manager: `/root/pm_cycle7a_hosted_cutover`, Cycle 7A hosted cutover.
- Prior handoff received: Cycle 7A Auth foundation QA PASS and guarded-preview Deploy PASS/PARTIAL. The current preview renders safely but is not bound to `uyacxqtsiwlvtmhxvoxr`; a docs-only `[skip deploy]` commit also built unexpectedly.
- Next role targets: distinct UI/UX Review -> Development/Platform Engineering -> independent QA -> Deploy. UX is focused on the hosted sign-in/invitation/recovery experience; Deploy remains distinct and may publish only the one integrated non-production preview.

Sprint goal:

- Prove that a Northstar director and an invited Northstar employee can enter the hosted `greenfield/passage-zero` preview as two independent authenticated people, accept one location-scoped invitation exactly once, land in the correct workspace, and receive durable server-timestamped authority/audit evidence without exposing production, family, or broader organization data.
- Restore source-controlled Vercel deploy gating before spending that preview so docs-only or unapproved commits cannot silently create additional builds.

Requirements and sprint components:

1. **Source-controlled deploy gate repair.** The greenfield tree currently has `scripts/vercel-ignore-build.js` but no `vercel.json`, so the documented script is not guaranteed to run. Add the canonical-project `ignoreCommand` wiring and align the script with the operating guide: preview builds require the approved release markers; `[skip deploy]`, docs-only, unmarked, deploy-without-QA, and wrong-project cases cancel. Add a deterministic environment/message/project matrix test. Do not create a sacrificial docs-only commit just to test the gate; prove the matrix locally and confirm the integrated preview build log ran the gate. Official Vercel behavior is exit `0` = canceled and exit `1` = build continues; repository `vercel.json` overrides the dashboard Ignored Build Step.
2. **Branch-scoped preview binding only.** Bind Vercel Preview variables only for Git branch `greenfield/passage-zero` to isolated Supabase project `uyacxqtsiwlvtmhxvoxr`. Required public runtime values are the isolated project URL, its publishable key, `PASSAGE_RUNTIME=preview`, the exact isolated project ref, and the existing production-ref comparison used by the fail-closed guard. Do not place a secret/service-role key in the browser or Vercel runtime. Do not modify Production variables or bind any other preview branch.
3. **Redirect and environment proof before sign-in initiation.** With Google and app email controls still disabled, verify the deployed page reports the intended preview runtime/project binding, no seeded operator data appears before authentication, protected routes still fail closed, and the isolated Supabase Auth allow-list covers the exact stable branch callback plus the current deployment callback as needed. Use one exact origin throughout each PKCE flow. Supabase recommends exact production redirects and permits Vercel preview patterns; this batch should prefer the stable branch alias for repeatable testing and explicitly record every allowed preview pattern.
4. **Synthetic hosted identities without external delivery.** Create or reuse synthetic director and staff Auth users only in `uyacxqtsiwlvtmhxvoxr`. Generate controlled test Auth links through the isolated project's trusted admin/test path; do not enable Google, do not enable a public email sign-in button, do not send real email/SMS, and do not store an admin/service credential in the application. Provider controls remain disabled throughout this batch unless a later PM brief explicitly expands scope.
5. **Two independent hosted sessions.** In separately isolated browser storage contexts, authenticate the authorized director, create one staff invitation through the authenticated invitation RPC, inspect and accept it as the invited staff user, then prove `/staff` access, `/director` denial for staff, same-user invitation replay returning the original receipt, and a different authenticated user receiving no membership. The director and staff session evidence must not come from one shared cookie jar or a seeded identity switcher.
6. **Durable evidence.** Confirm exactly one active staff membership, the exact invited location grant, one accepted invitation with server timestamp/user/member, and one immutable acceptance event in the isolated database. Reload both hosted sessions and verify truth persists. Record actor, organization, role, location, invitation state, authoritative time, audience, and next action without disclosing raw tokens, invited email on public inspection, cookies, access tokens, keys, or family data.

Development objectives:

- Make deployment control deterministic in the repository and observable in Vercel logs.
- Make the existing runtime guard accept only the intended isolated project for this branch while preserving its production-project rejection.
- Use the existing Supabase SSR/PKCE, organization invitation, membership, location, and workflow-event foundations; do not introduce another identity, invitation, audit, or event model.
- Keep Supabase clients request-scoped, Auth responses uncached, redirects origin-consistent, and authorization derived from verified Auth identity plus durable membership/location rows—not user-editable metadata, workspace selection, email text alone, or a role label alone.

Acceptance criteria:

- `vercel.json` invokes the gate; automated matrix proves that only a canonical non-production `greenfield/passage-zero` release carrying the required deploy and QA markers builds, while `[skip deploy]`, unmarked, partial-marker, wrong-branch/project, and production cases fail according to the documented policy.
- One and only one new `[deploy] [qa-approved]` preview is created after all pre-deploy checks pass; no production deployment or docs-only follow-up build is created.
- Hosted `/login` renders the bound isolated environment while Google and public email actions remain disabled. Unauthenticated `/director`, exact `/director/intake?mode=manual`, and `/staff` retain their exact safe-next/fail-closed behavior.
- Director session A and staff session B are independently authenticated on the hosted preview. The director can create one location-scoped employee invitation; staff can inspect only approved invite metadata and deliberately accept it.
- Staff lands at `/staff`; direct `/director` access is denied with a calm role-correct recovery action. The staff user cannot create/revoke invitations or gain a second location/role.
- Same-user replay returns the stable receipt without a duplicate membership, location grant, or event. Wrong-email/second-user, expired, revoked, and malformed token tests fail closed without partial rows or metadata leakage.
- After reload in both sessions, the membership/denial result persists. Database evidence shows exactly one accepted membership, exact location grant, accepted invitation receipt, and one acceptance event, all with server-derived identity and time.
- TypeScript and optimized production build pass. Browser QA passes at 1440 desktop, 390, and 360 with zero horizontal overflow, no blocking console/hydration errors, visible keyboard focus, and minimum 44-pixel enabled targets. Real timestamped screenshots and redacted database/audit evidence are committed.
- Vercel build/runtime error scans are clean, the canonical project/team and branch are recorded, and PR #24 plus this operating context are updated without a post-release docs commit.

Dependencies:

- Healthy isolated Supabase project `uyacxqtsiwlvtmhxvoxr`, its publishable key, Auth admin/test access, and already-applied Cycle 7A corrective migration.
- Vercel project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`, team `team_X0ta3bEEbRVGNM9xOwdBtCga`, branch-specific Preview environment management, Auth URL configuration, and deployment/build logs.
- Two truly isolated browser sessions or equivalent independent browser contexts; a single identity switcher does not qualify.
- Existing invitation RPCs, protected route shells, and warm Auth surfaces.
- Missing repository references noted but not recreated: `docs/release-train.md`, role briefs under `docs/agents/`, `docs/deployment-discipline.md`, `docs/UX-REDESIGN-BRIEF.md`, the rollout tracker, and `pages/system/admin/saas-roadmap.js` are absent from this greenfield workspace. `AGENTS.md`, this living context, and the persona architecture govern this batch.

QA plan:

1. Static security review of branch-scoped variables, redirect allow-list, runtime binding, server/client key placement, request-scoped SSR clients, no-store Auth responses, invitation RPC ACLs, and deploy-gate matrix.
2. Local TypeScript, optimized build, gate matrix, and focused invitation regression before any release marker.
3. Hosted environment-bound smoke with providers disabled and unauthenticated direct-route/invalid-invite denial.
4. Two independent hosted sessions: director Auth -> invitation creation -> staff Auth -> inspection -> deliberate acceptance -> `/staff` -> staff `/director` denial -> reload -> same-user replay.
5. Negative data tests: wrong user/email, expired, revoked, malformed token, repeated submit, unauthorized invite management, wrong location, and forced failure/no partial rows.
6. Redacted catalog/data proof for membership, location grant, invitation acceptance, event cardinality, server timestamps, and function/ACL invariants; run Supabase security/performance advisors and classify only expected isolated-fixture findings.
7. Visual/interaction checks at 1440, 390, and 360 plus keyboard, focus, target size, overflow, console/hydration, and exact safe-next checks.

Deploy plan:

- Engineering and QA prepare one integrated release candidate containing the gate repair and any necessary bounded runtime/redirect corrections. Preview environment and isolated Auth URL settings are configured before the release commit; public provider controls remain disabled.
- Deploy creates exactly one non-production commit on `greenfield/passage-zero` with the required `[deploy] [qa-approved]` markers only after independent QA PASS. Verify the source-controlled ignore command executes, the canonical project is used, and the resulting preview is READY.
- Complete hosted two-session verification against that deployment, capture screenshots/data/log proof, and update PR #24 and this context through the GitHub PR body/comment or by including prepared context in the integrated release commit. Do not push a separate docs/evidence follow-up while the gate repair is still being proven.
- Production promotion, Production environment changes, and production Supabase migration/application remain unauthorized and out of scope.

Risks and recovery:

- **Preview aliases and PKCE origins:** switching between the unique deployment URL, stable branch alias, share URL, or `localhost` can lose verifier/session cookies. Use one origin per flow and record it. If the protected preview requires a share token, establish protection access in each browser context before opening the Auth link.
- **Environment changes require a new deployment:** finish branch-scoped values and Auth redirect configuration before the single release. A misbound deployment is PARTIAL/FAIL, not permission for a blind deploy chain; repair source/config and re-enter PM/QA if another deploy would be required.
- **No UI team-invite surface yet:** invoking the existing authenticated RPC through a controlled test client is acceptable proof of the authority transaction, but it does not count as organization-team UX completion.
- **Additive foundation does not yet enforce assigned-work RLS:** successful membership Auth must not be described as durable case/task authorization. `/staff` is an authority shell, not proof that an employee can safely read assigned cases.
- **Deployment protection may obstruct Auth redirects:** test both sessions before declaring PASS; do not bypass protection or enter owner credentials into automation.
- **Synthetic identities and tokens:** never include credentials, links containing bearer tokens, cookie values, or private keys in screenshots, logs, commits, PR text, or user reports. Remove/expire synthetic invitations after QA if doing so does not destroy required audit evidence.

Non-goals:

- Assigned workflow/task RLS cutover, staff workload data, Case Room/realtime, notifications/outbox, address autocomplete, organization-owner onboarding, family/D2C account lifecycle, participant or vendor access, Google activation, public/external email delivery, production migration, production deployment, pricing/billing, legal/compliance claims, or broader redesign.

Owner gates:

- No new owner approval is required for branch-scoped preview variables, isolated-project Auth URL configuration, synthetic lab users, local/controlled Auth-link generation, repository deploy-gate repair, QA, or one non-production preview; these are within the approved isolated free test path and normal engineering/deploy work.
- Stop for the existing `AGENTS.md` gates only: any real external email/SMS, paid provider/plan change, production raw SQL or irreversible data change, production promotion, pricing change, or material legal/privacy/security claim. If the necessary isolated Auth admin or Vercel environment access is genuinely unavailable after connector/CLI/browser self-service, record the access blocker rather than substituting production credentials.

Readiness change rules:

- Current baseline remains funeral home **40% operational / 94% guided** and D2C **25% operational / 85% guided** until hosted evidence passes.
- Binding alone, a rendered login page, one authenticated user, a shared-cookie simulation, or fail-closed behavior earns **no increase**.
- If all hosted two-session invitation, replay, wrong-user/role denial, reload persistence, server audit, responsive QA, and deploy-control gates pass, funeral-home operational readiness may move to **45%**. This five-point increase recognizes durable hosted identity, membership, location grant, and invitation/audit proof only. D2C remains **25%** because family accounts/grants were not advanced.
- Funeral-home readiness remains capped below **50%** until assigned workflow/task RLS is enforced and two users prove authorized work plus cross-location/cross-organization denials. It remains capped below **80%** until durable notifications/recovery exist and below **85%** until the complete family-to-funeral-home handoff/proof-return path, support/observability, and pilot simulations pass.
- A PARTIAL result retains **40%/25%**, documents the failed criterion, and returns to PM. No percentage is awarded for visual polish or simulated authority.

Research grounding and scope effect:

- Supabase's current SSR guidance requires PKCE/cookie-based sessions and warns that authenticated responses must not be cached and request-specific clients must not be shared under Vercel Fluid compute: `https://supabase.com/docs/guides/auth/server-side` and `https://supabase.com/docs/guides/auth/server-side/advanced-guide`.
- Supabase's redirect guide recommends exact production callback URLs and documents Vercel preview patterns plus `NEXT_PUBLIC_VERCEL_URL`: `https://supabase.com/docs/guides/auth/redirect-urls`. This narrowed QA to one exact origin per session and made redirect configuration a pre-deploy gate.
- Vercel documents that `vercel.json` `ignoreCommand` overrides project settings and that exit `0` cancels while exit `1` continues: `https://vercel.com/docs/project-configuration/vercel-json` and `https://vercel.com/docs/project-configuration/project-settings`. The missing `vercel.json` is therefore classified FIX NOW, not a quota mystery.
- Vercel branch-specific Preview variables override general Preview values and only affect new deployments: `https://vercel.com/docs/environment-variables`. This requires completing the isolated branch binding before the single integrated preview.

Auto-advance handoff: PM scope is complete and moves to distinct UI/UX Review. No code, Vercel, Supabase, or production configuration was changed by this PM role.

### Cycle 7A hosted-auth cutover - UI/UX Review handoff

Status: **PASS TO ENGINEERING WITH CONDITIONS**. This is an experience-contract approval, not hosted QA. No product code, Vercel setting, Supabase setting, identity, or external configuration was changed by this role.

Role instance and prior handoff:

- UI/UX Review: `/root/ux_cycle7a_hosted_cutover`, Cycle 7A hosted cutover.
- Prior handoff received: PM `/root/pm_cycle7a_hosted_cutover` completed the bounded hosted director-invite -> employee-acceptance brief, retained disabled public providers, required two isolated authenticated sessions, and excluded assigned-work RLS, Case Room, D2C, vendors, and production.
- Required repository references `docs/release-train.md` and the UX role brief under `docs/agents/` are absent in this greenfield workspace, as already recorded by PM. The reviewer read the complete available `AGENTS.md`, living context, and persona action architecture; those sources govern this handoff.
- Next role target: distinct Development/Platform Engineering. Independent QA must evaluate every condition below on the integrated hosted preview before Deploy can report the cutover PASS.

Experience intent:

- A grieving or time-pressed employee should encounter one calm decision at a time: review the invitation scope, verify identity through the controlled link, deliberately accept, then enter the role-correct workspace. The UI must never make the person infer whether a disabled provider, invitation acceptance, or workspace request succeeded.
- A director and employee must understand that organization membership is not family access. The employee sees only the invited organization, role, and location scope; no case, family, roster, production-project, or broader organization data appears before durable authority is verified.
- Hosted proof must feel like an operational receipt, not a green success label: who accepted, what organization/role/location was granted, authoritative date and time with timezone, who can see the receipt, where it was saved, and what happens next.

Required screen and state sequence:

1. **Hosted preview entry:** login, invitation, and access-boundary surfaces show a plain non-production label such as `Isolated preview · no external messages`. Do not expose a Supabase project ref or other infrastructure identifier in persona-facing copy. The exact project binding belongs in redacted QA evidence. Unauthenticated protected routes continue to redirect or fail closed without flashing seeded operator content.
2. **Provider-disabled login:** Google and public email delivery remain visibly unavailable, with an adjacent explanation that no invitation or account was changed. If both are disabled, neither the email input nor its submit control may look like an available path. Remove misleading active `or` sequencing and make `Review invitation` the one obvious active action, supported by `Use the secure invitation link or paste the complete invitation code from your funeral-home administrator.` The controlled Auth link used by QA remains a test path, not a public-provider claim.
3. **Pre-auth invitation review:** show inviter, organization, role, exact active locations, purpose, and expiration date/time with timezone. Do not show invited email, roster, cases, family data, raw-token metadata, or a digest. State plainly that review does not join the workspace and never widens family access. The one primary action is `Continue to secure sign-in`.
4. **Authenticated confirmation:** repeat the organization, role, locations, and signed-in account immediately beside the consequential action. State that these values are read-only and that acceptance records the account and server time. The one primary action is `Accept invitation`; it changes to an announced `Accepting…` state and cannot be submitted again while pending. A failed response restores a usable retry without optimistic success.
5. **Accepted receipt:** show `Membership verified` only after the durable transaction is re-read. The receipt includes accepted account/actor, organization, role, locations, status, authoritative `Accepted` date/time with timezone in a semantic `time` element, audience/visibility, proof destination such as the organization membership/activity history, and next action. The primary action is role-relative (`Open My work` for staff). Same-user replay renders the same acceptance time and authority receipt; it must not imply a second acceptance.
6. **Role-correct landing and denial:** `/staff` identifies the verified account, organization, staff role, and authorized location and truthfully states that durable assigned work is not yet loaded. Direct `/director` access returns `This workspace is outside your role`, explains that employee membership opens My work, and makes `Open My work` the first recovery action. Sign-out remains available. It does not expose the director screen, seeded operator data, or a technical authorization error.

Failure and recovery acceptance:

- Malformed, expired, revoked, already-claimed-by-another-account, wrong-email/second-user, environment-mismatch, and temporary verification failures each have distinct text outcomes. Each says whether access changed (`No access was granted` or `Nothing was joined or changed`) and gives one safe next action: retry, use the accepting/invited account, or request a new invitation from the funeral-home administrator.
- Wrong-user and already-claimed states must not reveal the invited address, accepting account, valid-token hint, membership existence beyond the minimum state already permitted by the inspection contract, or any family/case detail.
- Error and success messages are persistent text, not color/icon alone; dynamic pending/result states are programmatically announced without unexpected focus movement. On a failed acceptance, focus moves to or is programmatically associated with the error summary, while the invitation details and retry action remain available.
- Provider-disabled controls use a normal unavailable cursor/state rather than a busy cursor. Only an in-flight action communicates busy state.

Responsive and accessibility bar:

- Verify the complete login -> review -> confirmation -> receipt -> staff -> director-denial sequence at 1440 desktop, 390x844, and 360x800. At 390 and 360 the details/receipt become a single readable column, the primary action stays visible in normal document flow, long names/locations/timestamps wrap, and document `scrollWidth` equals `clientWidth`.
- Every enabled control and recovery link has at least a 44-by-44 CSS-pixel hit area, clear Montserrat functional copy, visible non-obscured keyboard focus, logical focus order, and Enter/Space behavior appropriate to its semantic element. Disabled controls remain perceivable but are not focus traps or presented as working actions.
- Cormorant Garamond remains display-only; labels, timestamps, errors, helper text, controls, and receipt facts remain Montserrat. Preserve warm ivory paper and dusty low-saturation purple, blue, and green states. Error/success meaning must not rely on those colors alone.
- No blocking console error, hydration warning, duplicate-submit flash, stale receipt, or protected-content flash is acceptable. Screen-reader/status semantics are checked for unavailable provider state, acceptance pending/result, invitation errors, accepted receipt, and role denial.

Timestamp and evidence acceptance:

- Invitation expiration and membership acceptance are rendered from server values, never `Date.now()` or browser-authored proof. Each visible proof time includes calendar date, clock time, and timezone; relative time may be supplemental only.
- The replay receipt preserves the original server acceptance time. Reloading both independent sessions preserves the same organization/role/location authority and denial result without copying a cookie jar or using a seeded identity switcher.
- Screenshot evidence must include the visible system date/time or a paired redacted evidence manifest tying capture time, URL origin, session label A/B, viewport, and database event time together. Never capture bearer links, cookies, access tokens, private keys, raw invitation tokens, or real/synthetic login credentials.
- The redacted audit proof must match the receipt: actor/account, organization, role, location, invitation state, audience, acceptance time, proof destination/event, and next action. Database cardinality and ACL proof remain QA evidence rather than persona-facing copy.

UX QA stop conditions:

- FAIL if the two identities share browser storage, if a seeded identity switcher substitutes for Auth, if a provider appears available when disabled, if any pre-auth screen reveals email/family/case/roster data, if acceptance lacks a pending state, if receipt or replay lacks the original timezone-bearing server timestamp, if the proof omits audience or destination, if staff sees director content, or if mobile/keyboard/status-message checks fail.
- PARTIAL if the hosted authority flow passes but the source-controlled deploy gate or isolated branch binding cannot be proven. No readiness increase is earned by a visually correct local or shared-cookie simulation.
- PASS permits the PM-defined funeral-home operational estimate to move from 40% to 45% only when the complete two-session, replay, wrong-user/role denial, durable audit, responsive QA, and deploy-control gates also pass. D2C remains 25% operational.

Research grounding and effect on this handoff:

- W3C WCAG 2.2 Accessible Authentication requires an authentication path that does not depend on unaided recall/transcription and permits mechanisms such as email-link authentication and copy/paste: `https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html`. This preserved complete-code paste and prohibited puzzle-like or manually transcribed QA flows from becoming the product pattern.
- W3C WCAG 2.2 Error Identification and Error Suggestion require textual identification plus a known correction path: `https://www.w3.org/WAI/WCAG22/Understanding/error-identification` and `https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion`. This made each invitation failure state name both the unchanged-access truth and one recovery action.
- W3C WCAG 2.2 Status Messages requires programmatically determinable success, waiting, progress, and error updates: `https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html`. This added the announced acceptance-pending/result contract rather than relying on color or a page that appears unchanged during the server transaction.
- W3C WCAG 2.2 Focus Visible, Focus Not Obscured, Target Size, and Reflow guidance informed persistent keyboard focus, the product's stricter 44-pixel target bar, and the 360/390 no-overflow checks: `https://www.w3.org/WAI/WCAG22/Understanding/focus-visible`, `https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum`, `https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum`, and `https://www.w3.org/TR/WCAG22/#reflow`.

Auto-advance handoff: UX scope is complete and moves to distinct Development/Platform Engineering. Engineering should treat the provider-disabled hierarchy, acceptance pending state, and audience/proof-destination receipt fields as FIX NOW experience conditions inside the bounded hosted cutover; no broader onboarding or assigned-work UI is authorized.

### Canonical operational roadmap - PM decision and handoff

Status: PM COMPLETE. The owner requested one visible, focused roadmap with current scores, both product paths, demo separation, production readiness, milestones to 85-90%, and time ranges. PM `/root/pm_cycle7a_hosted_cutover` created `docs/product/operational-readiness-roadmap.md` as the single internal source of truth for this greenfield repository and updated the stale Roadmap And Planning Rules in `AGENTS.md`.

Canonical-source decision:

- The legacy Pages Router file `pages/system/admin/saas-roadmap.js` named in older guidance is absent, and Passage Zero has no secure System Admin route yet. Requiring a nonexistent path made the roadmap invisible and encouraged percentages to live only in handoff history.
- The new canonical file is internal/System-Admin source material, not a public or persona roadmap. When a secure App Router System Admin route is implemented, it must render this roadmap or one structured source extracted from it; it must not maintain a second milestone set.
- `docs/agent-operating-context.md` remains the role/evidence ledger. It may quote the current roadmap decision but is not a competing roadmap. No product page, persona navigation, deployment, database, or external system changed in this PM action.

Current verified baselines remain:

- Funeral home: **94% guided / 40% operational**.
- Family/D2C: **85% guided / 25% operational**.
- Separate demo instance: isolated Supabase lab exists, but the hosted binding, deterministic reset, communication blocking, and smoke proof are incomplete; roadmap baseline **10% operational**.
- Production readiness: build/migration discipline exists, but production-safe identity/data/delivery/integration/support controls are not proven; roadmap baseline **10% operational**.
- Greenfield pages remain preview-only. The current hosted Auth preview is fail-closed and production pages are unchanged.

Critical-path decision:

1. Hosted director/staff identity and membership proof plus deploy-control repair.
2. Organization/location/assignment RLS, durable assigned work, revocation, and append-only command audit.
3. Durable funeral-home intake, Case Room, structured proof, notification recovery, realtime/reconnect, and a deterministic isolated demo instance.
4. D2C account lifecycle, independent family/participant grants, funeral-home handoff, family-safe communication/proof, recovery, and account/data controls.
5. Observability, one reliable integration adapter, backup/restore, support/break-glass runbooks, failure drills, persona simulations, and explicit high-risk owner review before an 85-90% allowlisted pilot claim.

Roadmap time ranges, assuming focused execution and no external owner-gated delay:

- Hosted Auth preview: **2-4 focused working days**.
- Assigned-work funeral-home authority: **1-2 focused weeks cumulative**.
- End-to-end funeral-home case loop plus isolated demo: **3-5 focused weeks cumulative**.
- Funeral-home 85-90% allowlisted pilot readiness: **approximately 5-8 focused weeks**.
- D2C 85-90% allowlisted pilot readiness: **approximately 7-11 focused weeks** after reusing the stable authority/case spine.

The next three integrated sprints are now fixed in the roadmap:

1. Cycle 7A hosted authority cutover, 2-4 days; full PASS may move funeral home only from 40% to 45%.
2. Cycle 7B assigned-work RLS, 4-7 days; full PASS may move funeral home to 55-60%, D2C remains 25%.
3. Cycle 8A funeral-home case operations plus isolated demo, 7-10 days; full PASS may move funeral home to 72-78%, D2C to 30-35%, and demo to 75%.

Readiness remains evidence-gated: no partial implementation, visual preview, local-only result, or seeded/shared-cookie identity advances a score. The next active handoff remains distinct Development/Platform Engineering for Cycle 7A, followed by independent QA and Deploy. The roadmap itself requires no deployment and does not interrupt the active hosted-cutover release train.

Documentation-first hosted-QA fixture decision before engineering changes:

- **What:** Engineering may create a new idempotent `supabase/test-fixtures/cycle_7a_hosted_auth_personas.sql` for isolated project `uyacxqtsiwlvtmhxvoxr`. It may seed only the synthetic Northstar organization, Portland location, and synthetic director membership/relational location grant required for hosted QA, plus the minimum narrow self-authority SELECT policies needed by the server resolver. Director and staff Auth users are created through the isolated Auth Admin API. The staff membership, location grant, accepted invitation, and acceptance event must be created only by the real director-invite/staff-acceptance RPC path, never preseeded.
- **Why:** the isolated production-shape fixture intentionally has fail-closed tables/policies. Hosted invitation and role-landing proof needs a reproducible synthetic director authority without borrowing production data or manually inserting result rows.
- **Breakage if skipped:** the preview can prove environment binding but cannot prove authenticated invitation authority or role landing; readiness remains 40%/25%. Manual lab edits would be irreproducible and could invalidate the event/audit cardinality evidence.
- **Breakage risk and controls:** a fixture executed against the wrong project could modify real memberships or policies. Its execution must preflight the exact isolated project ref, explicitly reject production ref `qsveqfchwylsbncsfgxe`, use reserved synthetic IDs and `@passage.test` accounts, assert collision/row-count expectations, retain evidence, and provide ordered cleanup. It contains no family, participant, vendor, customer, or production data; sends no external communication; and stores no credentials, service key, bearer token, or raw invitation token.
- **Classification:** test-only reversible fixture script, not a product migration, not recorded as a production migration, and not permission for ad hoc production SQL. Production-grade self-authority and assigned-work RLS remain Cycle 7B migration work behind its own what/why/breakage and backfill gate.

### Cycle 7A hosted-QA fixture - Development/Data Engineering handoff

Status: SOURCE COMPLETE; NOT APPLIED. Development/Data Engineering role `/root/eng_cycle7a_fixture` received the completed PM hosted-cutover brief, UX conditions, and the documentation-first hosted-fixture gate. It created only `supabase/test-fixtures/cycle_7a_hosted_auth_personas.sql`; no migration, hosted project, Auth user, Vercel setting, commit, or deployment was changed by this role.

Implementation boundary:

- The fixture requires a transaction-local project-ref attestation, rejects production ref `qsveqfchwylsbncsfgxe`, and accepts only isolated lab `uyacxqtsiwlvtmhxvoxr`. Its checklist also requires the executor to verify the connector/dashboard target independently before setting that attestation; a missing or mismatched value aborts before grants, policies, or rows change.
- Reserved synthetic IDs and `cycle7a-director@passage.test` are collision-checked. Exactly one director Auth user must already exist through the supported isolated Auth Admin path. The fixture seeds one synthetic Northstar organization, one Portland location, the one director membership, and its one relational location grant.
- Three SELECT-only authenticated policies expose only the signed-in user's active membership, organization, and granted active locations required by `lib/auth/authorization.ts`. The existing Cycle 7A member-location policy remains the authority for that relation. No INSERT/UPDATE/DELETE client policy is added.
- `cycle7a-staff@passage.test` appears only in the execution checklist. The fixture contains no executable staff membership, staff location grant, invitation, acceptance, or event write. Those outcomes must come from the real authenticated create/accept RPC path.
- The ordered post-evidence cleanup deletes synthetic events/invitations/members/location/organization, removes only the fixture policies/grants, and refuses cleanup if later workflow/task fixture data is attached. Auth-user removal remains an Auth Admin action.

Static verification PASS: executable DDL/DML target review found only the three narrow grants/policies and four allowed synthetic authority inserts; a comment-stripped scan found no staff identity or insert into `auth.users`, `organization_invitations`, or `workflow_events`; dollar-quote pairing and trailing-whitespace checks passed. No SQL was executed locally or against a hosted database, so independent QA must still parse/apply it transactionally in the isolated lab, exercise idempotent re-run and cleanup rollback, inspect ACL/RLS behavior as director/staff/wrong user, and run advisors before any hosted cutover PASS.

Research grounding: current Supabase RLS guidance requires explicit Data API grants separately from RLS, `TO authenticated`, and user-relative predicates such as `(select auth.uid())`; the April 2026 Data API breaking change makes explicit table grants intentional rather than assumed (`https://supabase.com/docs/guides/database/postgres/row-level-security` and `https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically`). This kept the fixture's grants explicit and its policies narrowly self-scoped.

Next role target: independent Data/QA review and isolated-lab execution only after connector target verification. Operational readiness remains funeral home **40%** and D2C **25%** until the complete hosted two-session milestone passes.

### Cycle 7A hosted-auth cutover - Development handoff (interrupted)

- Development role instance: `/root/eng_cycle7a_fast`; received the completed PM and UI/UX handoffs.
- Work stopped on parent request before an engineering patch was applied. This role changed no product, gate, package, runtime, Vercel, Supabase, or evidence file.
- Read-only verification found `vercel.json`, `scripts/test-vercel-ignore-build.js`, and an expanded `scripts/vercel-ignore-build.js` already present in the shared working tree from parallel work. The gate still needed a strict preview rule requiring literal `[deploy]` plus `[qa-approved]`; its `release:` shortcut was too permissive for preview, and `package.json` still lacked the matrix-test script.
- The existing login/invitation surfaces still needed the UX conditions for a single obvious invitation action when both providers are disabled, an announced disabled `Accepting…` state, and receipt audience/proof-destination fields. The staff-to-director denial already placed `Open My work` first.
- No test was run by this role. No commit or deployment was created. A read-only Supabase connector lookup confirmed an enabled publishable key exists for isolated project `uyacxqtsiwlvtmhxvoxr`; no secret or service-role credential was requested, stored, or changed.
- Next handoff: Development must finish the bounded gate/runtime/UX patch, then run the deterministic gate matrix, TypeScript, and production build before independent QA. Production and family/vendor surfaces remain untouched.

### Compressed operational-pilot roadmap - PM correction

Status: PM COMPLETE. Owner rejected the prior 5-11-week operational estimate and asked what actually consumes time. PM `/root/pm_cycle7a_hosted_cutover` revised the canonical roadmap without changing current readiness scores or weakening evidence gates.

Decision:

- The core allowlisted-pilot critical path is now **10-15 focused working days**, targeting funeral home **85-88% operational** and D2C **83-87% operational** if hosted authority, RLS, recovery, cross-persona proof, demo, and QA gates all pass.
- Full production hardening is explicitly separate and continues after the pilot. The compressed target holds out live external email/SMS, paid address-provider activation, broad live integrations, production migration, billing, general-availability support, and unresolved legal/privacy/security decisions. No unapproved claim or production promotion is included.
- Current verified scores remain funeral home **40% operational / 94% guided** and D2C **25% operational / 85% guided**. No schedule-driven score increase is authorized.

Why the earlier range was too long:

- It treated authority, funeral-home operations, D2C grants, demo isolation, and QA as mostly sequential and bundled full production hardening into the pilot estimate.
- The existing warm responsive screens, typed event spine, invitation migration, isolated Supabase lab, and guided cross-persona flows remove most net-new UI work.
- Four parallel lanes now run from Day 1: hosted Auth/data/RLS; funeral-home case operations; D2C identity/grants; and demo/QA/release evidence. The final handoff integrates only after the shared authority predicates pass.

What actually consumes focused time:

- Auth redirects/cookies, organization/location/assignment RLS, deterministic fixtures/backfill, and negative authority tests: about 30-35%.
- Idempotent event/outbox/retry/reconnect behavior and truthful failure recovery: about 20-25%.
- Family/funeral-home/participant grants, handoff receipts, task-bound communication, and family-safe proof: about 20-25%.
- Independent multi-session, SQL/RLS, device, failure-injection, logging, screenshot, and deploy verification: about 20-25%.
- Net-new screens are a small remainder; visual polish is not the critical path.

Compressed three-sprint plan:

1. **Days 1-3:** deploy-gate repair, isolated hosted binding, director/staff Auth invitation proof; begin D2C grant contract and demo reset in parallel.
2. **Days 4-8:** assigned-work RLS, durable intake/commitment/revocation/audit, and durable D2C identity/family-grant foundations on the same spine.
3. **Days 9-15:** Case Room, Transfer Pass acceptance, reviewed family update, structured proof, realtime/reconnect, simulated delivery/integration failure recovery, deterministic demo smoke, and full persona/device/evidence pass.

Production-hardening follow-on: production migration/backfill/rollback, live providers, broader integrations, load/restore drills, durable monitoring and support coverage, audited break-glass, security/privacy/legal decisions, billing, and general rollout. Its estimate is deferred until those owner/external inputs exist rather than padding the pilot timeline.

Next handoff remains Development/Platform Engineering for the active Cycle 7A bounded patch, followed immediately by independent QA and Deploy. The parallel D2C/demo lanes may prepare contracts and fixtures now but may not bypass the shared authority or evidence gates.

### Cycle 7A integrated source - independent QA handoff

Status: **PARTIAL / RETURN TO PM AND ENGINEERING** at 2026-07-16 21:43:30 -07:00. QA role `/root/qa_cycle7a_integrated_source` reviewed the current uncommitted integrated source against the Cycle 7A PM brief, UI/UX conditions, roadmap M1, and `AGENTS.md`. No SQL, hosted configuration, commit, or deployment was created. The release candidate must not receive `[qa-approved]` yet.

Verified PASS in source:

- `pnpm test:deploy-gate` passed all 11 cases: canonical approved preview, skip-marker precedence, unmarked preview, each partial-marker case, `release:` without literal preview deploy marker, wrong branch, wrong project, approved production release, feature-branch production denial, and local build. `vercel.json` parses as JSON and its `ignoreCommand` points to the tested script.
- `pnpm typecheck` passed. Development/root reported the optimized production build already passed; this QA role did not repeat that completed build before returning the source blockers.
- Static review found no service-role/private/secret credential in the reviewed runtime, login, invitation, gate, or fixture files. The committed Supabase credential is explicitly a publishable browser key.
- The production runtime guard fails closed when `VERCEL_ENV=production` is paired with the preview runtime, and the gate denies a production deployment from `greenfield/passage-zero`.
- With Google and email disabled, `LoginClient` renders only the explicit non-delivery status and one controlled invitation-code action. `AcceptInvitationButton` uses the server-action pending state, changes to `Accepting...`, and disables repeated submission. The accepted receipt renders the server value with date, clock time, timezone, explicit server-time label, audience, proof destination, and next action. Staff role denial keeps `Open My work` as the first recovery.
- The hosted fixture statically rejects missing, production, and non-lab project-ref attestations, requires the one exact supported director Auth user, collision-checks reserved synthetic identities, and contains no executable staff membership, staff location grant, accepted invitation, invitation row, acceptance event, or `auth.users` insert.

Blocking findings:

1. **Branch binding is not source-correct.** `vercel.json` places the isolated Supabase URL, publishable key, project refs, and `PASSAGE_RUNTIME=preview` in the top-level `env` object. Vercel documents this as static environment passed to all invoked functions and recommends project Environment Variables; branch-specific Preview variables must be configured for the exact Git branch. The source guard makes an accidental production deployment unavailable rather than leaking operator data, but merging this file to `main` would also inject preview runtime values and intentionally make production unavailable. Remove the top-level `env` object, retain `ignoreCommand`, and prove these values as Preview-only variables scoped to `greenfield/passage-zero` before the one integrated preview. Sources: `https://vercel.com/docs/project-configuration/vercel-json` and `https://vercel.com/docs/environment-variables`.
2. **The hosted fixture violates the migration discipline it claims to avoid.** `supabase/test-fixtures/cycle_7a_hosted_auth_personas.sql` executes three `GRANT SELECT` statements and three `DROP POLICY` / `CREATE POLICY` replacements, with corresponding policy/grant cleanup. Those are structural ACL/RLS changes. `AGENTS.md` requires every schema change to be documented first and applied through real Supabase migration tooling, not classified as a non-migration fixture. The what/why/breakage analysis exists, but the artifact classification and application path do not comply. Separate the ACL/policies into a documented isolated-lab migration applied via `apply_migration`, or defer them to Cycle 7B and keep the fixture DML-only. Do not apply this fixture as written.
3. **Hosted milestone evidence remains unproven.** Because the branch binding and fixture application are blocked, independent two-session hosted Auth, same-user replay, wrong-user denial, row/event cardinality, redirect allow-list, Vercel gate-log execution, runtime logs, and 1440/390/360 hosted visual evidence were not performed. Root supplied a local smoke at an actual 704-pixel viewport for the provider-disabled login, malformed invitation, and protected-route redirect; that is useful engineering evidence but does not satisfy independent M1 hosted QA or the required three-viewport matrix.

QA decision and next role:

- Return to Product Manager for the fixture-classification correction, then Development/Platform Engineering for the two bounded fixes above. Re-enter independent QA after the source is corrected and branch-scoped Vercel/Supabase configuration is available.
- Operational readiness remains funeral home **40%** and D2C **25%**. No preview or Deploy handoff is authorized from this PARTIAL result.

### Cycle 7A QA-PARTIAL recovery - PM decision

Status: FIX NOW / ENGINEERING AUTHORIZED. PM `/root/pm_cycle7a_hosted_cutover` received independent QA PARTIAL and kept both blocking findings inside the bounded hosted-authority sprint. No readiness credit or Deploy handoff is authorized yet.

Recovery decision 1 - Vercel environment scope:

- **What:** remove the repository-wide top-level `env` object from `vercel.json`; retain only `$schema` and the tested `ignoreCommand`. Keep the isolated Supabase URL, publishable key, project refs, runtime, and disabled-provider flags out of repository-wide Vercel configuration.
- **Why:** Vercel's top-level `env` applies static values across invoked functions/deployments rather than expressing the required exact-branch Preview binding. If merged, the current values would make a production deployment intentionally unavailable and would erase the environment-separation proof this sprint is meant to establish.
- **Breakage if skipped:** every branch or production deployment can inherit the isolated-preview runtime values; production remains fail-closed but unusable, branch isolation is unproven, and M1 cannot pass.
- **Breakage risk/recovery:** removing the source values means previews without externally configured branch variables render the already-verified fail-closed environment state. That is the correct safe fallback. Engineering must rerun the gate matrix, TypeScript, and optimized build after removal.
- **External blocker:** the required Vercel variables must be configured as Preview variables scoped specifically to Git branch `greenfield/passage-zero`. Current connected access does not expose credentialed branch-environment mutation, so hosted binding remains an external credential/access blocker after the source correction. Do not reintroduce values into `vercel.json`, use Production variables, or request/store a secret/service-role key as a workaround.

Recovery decision 2 - hosted QA ACL/RLS migration discipline:

- **What:** create a new isolated-lab-only Supabase migration containing only the three authenticated SELECT grants and three narrowly self-scoped organization/membership/location policies currently embedded in `supabase/test-fixtures/cycle_7a_hosted_auth_personas.sql`. Create the migration through the Supabase migration workflow and apply it only to project `uyacxqtsiwlvtmhxvoxr` using Supabase migration tooling. Give every policy a lab-specific name. Remove all `GRANT`, `REVOKE`, `DROP POLICY`, and `CREATE POLICY` statements from the fixture, including cleanup; keep the fixture DML-only for guarded synthetic organization/location/director membership/location-grant rows.
- **Why:** Data API grants and RLS policies are structural authority changes. Recording them in migration history makes the lab state reproducible, reviewable, advisor-visible, and separable from repeatable persona data. Fixture reruns must never silently replace authorization policy.
- **Breakage if skipped:** applying the fixture as written violates the documented migration discipline, structural state can drift across reruns/cleanup, and independent QA cannot trust or reproduce hosted authority evidence.
- **Breakage risk:** an incorrect or wrong-target migration could expose organization, membership, or location rows more broadly than intended, revoke access needed by another policy, or collide with later Cycle 7B enforcement. The migration must assert the expected isolated production-shape relations, use only `TO authenticated` plus user-relative active-membership/location predicates, add no client write policy, use lab-specific names, and be applied only after connector target verification rejects production ref `qsveqfchwylsbncsfgxe`.
- **Reversibility:** structural rollback is a separate isolated-lab follow-up migration that drops only the lab-named policies and revokes only the grants introduced by this lab migration after checking no later lab policy depends on them. Persona cleanup deletes only reserved synthetic DML rows in dependency order. Production is untouched; the disposable lab may be removed after retained evidence, but that is not a substitute for migration-record clarity.
- **Data boundary:** no family, participant, vendor, customer, case, task, production row, external communication, password, bearer token, raw invitation token, service key, or production credential is added by the migration or fixture.

Engineering correction acceptance:

1. `vercel.json` contains no `env` object and the 11-case deploy-gate matrix still passes.
2. The new lab migration is independently reviewed, applies through Supabase migration tooling to `uyacxqtsiwlvtmhxvoxr`, appears once in migration history, passes catalog/ACL/RLS inspection and advisors, and is never applied to production.
3. The hosted persona fixture contains no executable DDL/ACL/policy statement and remains idempotent, project-guarded, collision-checked, and DML-cleanup reversible.
4. TypeScript and optimized production build pass; independent QA then rechecks source and hosted evidence when branch-scoped Vercel access is available.

Role handoff: PM returns immediately to Development/Platform/Data Engineering for these two corrections, then to independent QA. The Vercel branch-binding access blocker may keep hosted QA PARTIAL, but it does not block safe source/migration correction or local/isolation testing. Operational readiness remains funeral home **40%** and D2C **25%**.

### Owner-requested handoff note - 2026-07-16 21:50 -07:00

Repository and release state:

- Repository: `thepassageappio/thepassageappio`; branch: `greenfield/passage-zero`; draft PR: `#24`.
- Canonical internal roadmap: `docs/product/operational-readiness-roadmap.md`. It supersedes the older sequential estimate and targets a tightly allowlisted operational pilot in **10-15 focused working days**, with full production hardening tracked separately.
- Verified readiness remains funeral home **94% guided / 40% operational** and D2C **85% guided / 25% operational**. The full compressed-pilot evidence gate may move those to funeral home **85-88% operational** and D2C **83-87% operational**; dates alone never move a score.
- Production, family access, participant access, vendor fulfillment, pricing, and live external messaging were not changed. No new preview or production deployment was authorized in this batch.

Completed and verified in the current source batch:

- Added source-controlled Vercel ignore-build wiring in `vercel.json`; removed the unsafe repository-wide preview environment values after QA review.
- Tightened the preview release gate so only the canonical project, exact `greenfield/passage-zero` branch, literal `[deploy]` plus `[qa-approved]`, and no skip marker can build. The deterministic 11-case matrix passes.
- Added the provider-disabled isolated-preview hierarchy: Google/email actions stay unavailable and the controlled invitation-code review is the only active login action.
- Added a duplicate-safe, announced `Accepting...` invitation state and strengthened the acceptance receipt with the original timezone-bearing server timestamp, visibility/audience, proof destination, and next action.
- Preserved staff-to-director denial with `Open My work` as the primary recovery. Family and vendor surfaces remain unchanged.
- TypeScript and the optimized Next.js production build pass. Local smoke verified the isolated-preview label, one active invitation action, malformed-invitation denial, and unauthenticated `/director` redirect. The local browser was 704 pixels wide, so it is supporting evidence only, not the required 1440/390/360 release proof.
- Created the canonical roadmap and compressed four-lane plan: hosted Auth/data/RLS, funeral-home operations, D2C identity/grants, and demo/QA/release evidence advance in parallel.

Current QA decision and blockers:

- Independent QA is **PARTIAL**; no `[qa-approved]` marker and no deploy are permitted yet.
- Source blocker 1 is corrected: `vercel.json` now contains only `$schema` and `ignoreCommand`. The remaining hosted blocker is credentialed Vercel access to set the required Preview variables only for `greenfield/passage-zero`; the connected read/deploy tools do not expose branch-environment mutation. Do not work around this with repository-wide or Production variables.
- Source blocker 2 is documented and queued: the hosted persona fixture currently mixes synthetic DML with `GRANT` and RLS policy DDL. Engineering must move those six structural authority statements into a lab-named migration, keep the fixture DML-only, and apply the migration only to isolated project `uyacxqtsiwlvtmhxvoxr` through Supabase migration tooling. Production project `qsveqfchwylsbncsfgxe` is explicitly prohibited.
- Hosted director/staff two-session proof, redirect allow-list, replay/wrong-user/cardinality checks, Vercel gate log, runtime logs, and 1440/390/360 screenshots remain unproven and therefore earn no readiness increase.

Exact next handoff:

1. Development/Data Engineering splits the hosted fixture DDL into the documented isolated-lab migration and reruns static checks.
2. Independent QA reviews the migration/fixture separation; Deploy remains closed until PASS.
3. Configure exact-branch Vercel Preview variables and isolated Supabase Auth redirects without touching Production variables.
4. Create synthetic director/staff Auth users through the isolated Auth Admin path, apply the lab migration through migration tooling, and seed only the guarded director fixture.
5. Run two independent hosted sessions: director creates the location-scoped invitation; staff inspects and accepts; prove `/staff`, staff `/director` denial, reload persistence, same-user replay, wrong-user denial, and exact membership/location/invitation/event cardinality.
6. Run TypeScript/build plus hosted desktop 1440, mobile 390, and mobile 360 QA; commit timestamped screenshots and redacted audit evidence; publish exactly one `[deploy] [qa-approved]` preview; update PR `#24` and this context in the integrated release commit.
7. Auto-advance immediately to Cycle 7B assigned-work RLS, workload, reassignment, revocation, and append-only command audit. Vendor fulfillment stays queued until location and ownership semantics pass.

Role state: PM recovery is complete; UX acceptance is complete; Development source work is partially complete; independent QA returned PARTIAL; Deploy is not authorized. The release train remains active and the next role target is Development/Data Engineering for the bounded fixture/migration correction.

### Cycle 7A QA-PARTIAL recovery - isolated migration applied, hosted credentials gated - 2026-07-16 22:31 -07:00

Owner parity directive:

- Frontend/backend contract parity is now a standing release gate in `AGENTS.md` and the operational-readiness roadmap. For every slice, PM must identify the visible persona action/state, server command or query, durable rows, RLS/authority predicate, append-only event/proof for state change, failure/recovery behavior, and persona projection. Engineering advances those elements together; QA rejects either a UI claim the backend cannot prove or a backend capability presented as available before the UI truthfully exposes it.
- Cycle 7A remains bounded to current invitation authorization and hosted invitation UI. The isolated self-authority policies expose only the current user-relative organization, membership, and location reads required by that UI. Assigned-work authority is not implied by these policies and remains explicitly queued for Cycle 7B with its workload, reassignment, revocation, and append-only command-audit UI states.

Role and source disposition:

- PM classified the two QA findings as FIX NOW without changing scope or readiness. UX independently confirmed that the SQL artifact split changes no persona copy, layout, family boundary, vendor state, or established 1440/390/360 acceptance conditions.
- Development/Data Engineering created `supabase/migrations/20260717051552_cycle_7a_isolated_lab_self_authority.sql` through the migration workflow. It contains exactly three authenticated `SELECT` grants and three lab-named, user-relative self-authority policies; it adds no client write policy and fails closed on missing lab markers, schema/RLS drift, existing target grants/policies, or existing authority rows.
- Development removed every executable ACL, policy, and DDL statement from `supabase/test-fixtures/cycle_7a_hosted_auth_personas.sql`. The fixture remains project-attested, production-rejecting, collision-checked, idempotent, guarded-cleanup reversible, DML-only, and limited to the synthetic organization, location, director membership, and director location grant. It does not seed staff authority, invitations, acceptance, audit events, or `auth.users`.
- Independent QA passed the migration/fixture separation and authorized migration application only after exact isolated-project verification. The deterministic deploy-gate matrix passes all 11 cases. Root verification also passed `pnpm typecheck` and the optimized `pnpm build` after restoring frozen dependencies.

Hosted database evidence:

- Supabase target verification identified isolated project `uyacxqtsiwlvtmhxvoxr` (`passage-cycle-7a-test`) and separately identified prohibited production project `qsveqfchwylsbncsfgxe`. The new migration was applied exactly once to the isolated project through Supabase migration tooling and appears once in its migration history as `cycle_7a_isolated_lab_self_authority`.
- Post-apply catalog inspection proves exactly the three lab policies and authenticated `SELECT` on organizations, locations, and memberships, with no authenticated insert/update/delete privilege. Authority-row counts remain zero before fixture seeding. A read-only production migration-history check proves the migration name is absent from production.
- Supabase security advisors report only the expected fail-closed Cycle 7B tables with RLS enabled and no policy. Performance advisors report unused-index informational findings expected in the empty isolated lab. Neither result authorizes readiness credit.

External credential gate and exact continuation:

- No synthetic director or staff Auth user currently exists in the isolated project. The guarded fixture has not been seeded. Vercel Preview variables, Supabase Auth redirects, Auth Admin users, hosted sessions, screenshots, and hosted cardinality evidence remain untouched because neither the Vercel CLI nor the Vercel/Supabase browser sessions are authenticated in this workspace. No secret was requested or exposed, and no repository-wide or Production environment value was restored.
- Deploy remains closed: no preview was published, no `[qa-approved]` marker was added, PR `#24` was not updated, and operational readiness remains funeral home **40%** and D2C **25%**. The guided figures remain funeral home **94%** and D2C **85%**.
- Owner action required by the explicit credentials/access gate: authenticate the existing Vercel and Supabase browser/CLI sessions without sharing credentials. Then Deploy can configure only branch `greenfield/passage-zero`, configure only isolated Auth redirects, create the synthetic Auth users through Auth Admin, seed the guarded director fixture, and return to independent hosted QA for the full two-session, replay/denial/cardinality, runtime-log, and 1440/390/360 evidence gate. Exactly one non-production preview is permitted only after full PASS.

### Cycle 7A Deploy re-entry - explicit sequencing gate - 2026-07-16 22:31 -07:00

Deploy decision: **PARTIAL / CLOSED**. Deploy independently confirmed the canonical Vercel project/team, exact allowed branch, draft PR/head alignment, isolated-only migration history, production absence, and bounded migration/fixture QA PASS. It also confirmed that the deployed ignore gate predates the uncommitted repair and built the current `[skip deploy]` head; pushing before the integrated gate is ready could therefore create an unintended preview. No push is authorized.

PM re-entry identified a real release-sequencing contradiction rather than an engineering defect:

- Exact-branch Vercel Preview environment changes apply only to a new deployment, so the required hosted application sessions cannot be proven on an existing preview after those variables are staged.
- The current owner instruction permits exactly one new non-production preview only after the complete hosted evidence gate and requires that preview to carry `[deploy] [qa-approved]`.
- `AGENTS.md` and the roadmap prohibit a truthful `[qa-approved]` marker until independent hosted QA has actually passed. A throwaway preview, a second preview, a gate bypass, repository-wide or Production variables, or relabeling local/shared-context proof as hosted proof would violate the release contract.

Safe PM decision: Deploy and hosted mutation remain closed, scores remain unchanged, and no approval semantics will be weakened implicitly. All source, migration, advisor, typecheck/build, gate, runbook, and evidence-manifest preparation may continue. Before the integrated release commit, the owner must resolve this explicit sequence gate. PM recommends one narrow exception: authorize the sole new non-production deployment as a **verification preview** with a truthful pre-QA status distinct from `[qa-approved]`; run complete independent hosted QA against that same preview; if it passes, update PR/context/evidence without creating a second preview. Any implementation of that exception must also explicitly reconcile the ignore gate. The alternative is an explicit one-time redefinition of `[qa-approved]` as pre-deploy approval with hosted QA pending, which PM does not recommend because it makes the marker misleading.

The frontend/backend parity matrix for this bounded slice remains fixed: director create, staff inspect/accept, receipt, `/staff`, director denial, replay, and recovery UI map to the verified Auth session, invitation commands/RPCs, exact durable invitation/membership/location-grant rows, self-authority and invitation predicates, exactly one append-only acceptance event with server actor/time, denial without partial effects, and the correct director/staff projection. Family/vendor stay unchanged and assigned-work authority stays queued. Independent QA must reject drift in either direction.

### Cycle 7A owner-authorized verification preview and parity correction - 2026-07-17 20:04 -07:00

Owner decision: Steve explicitly authorized the PM-recommended one-preview sequencing exception. This authorizes exactly one non-production **verification preview** before hosted QA; it does not authorize `[qa-approved]`, Production, a second preview, repository-wide environment values, or any readiness increase.

PM Sprint Brief status: **COMPLETE**. Goal: close the Cycle 7A backend-ahead contract gap by adding a reachable director-only, location-scoped invitation creation surface that uses the existing `create_employee_invitation` RPC and feeds the existing staff inspect/accept flow. Requirements and acceptance are: server-derived eligible locations only; no direct table writes; explicit pending/success/denial/conflict/retry states; receipt with actor, recipient, location, server proof, visibility, delivery state, expiry, and next action; exact invitation/location/event cardinality before acceptance; exact membership/location/accepted-event cardinality afterward; replay and wrong-user denial; `/staff` persistence and `/director` denial; 1440/390/360 responsive and accessibility proof. Family/vendor, Cycle 7B assigned work, Production, and real delivery remain non-goals.

UX decision: **PARTIAL / FIX NOW**. Independent UX review found that the backend creation RPC existed but no reachable director route/component called it. Creating the hosted invitation through SQL, dashboard, or a hidden RPC would violate the new frontend/backend parity gate and cannot satisfy the owner-requested proof. The sole preview slot remains unspent until Development closes this UI/backend gap and local QA passes.

Engineering deploy-gate correction: the source gate now recognizes the literal, cycle-specific `[deploy] [cycle-7a-verification-preview]` combination only for Vercel Preview, canonical project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`, and exact branch `greenfield/passage-zero`. Skip markers still win. The exception is explicitly denied for Production even when combined with `[qa-approved]`; ordinary `[deploy] [qa-approved]` behavior remains unchanged. The expanded deterministic matrix passes all 16 cases. The exception must be removed/closed in the post-QA integrated `[skip deploy]` commit so it cannot become a standing bypass.

Credential state: current Vercel CLI has no authenticated credentials. Chrome reaches Vercel and Supabase sign-in pages but has no active dashboard session. Source implementation and local verification continue; branch environment configuration, Auth redirects, Auth Admin users, fixture seed, and the one preview remain gated on the owner signing in without sharing credentials.

Cycle 7A creation-idempotency backend correction (documentation-first gate):

- **What:** add a nullable client request UUID to `organization_invitations`, a unique organization/request index, and a new authenticated `create_employee_invitation_idempotent` RPC. The function must serialize live invitation creation by organization plus normalized email, replay an existing request or identical live pending invitation without returning the raw token again, and delegate first creation to the already-reviewed invitation command so the existing single append-only creation event remains authoritative.
- **Why the frontend needs it:** disabling a pending button prevents only a same-tab double click. Lost responses, reloads, parallel tabs, and concurrent requests could currently create multiple invitation rows and multiple `organization_invitation.created` events while the UI claims one pending invitation. The director receipt and exact-cardinality evidence cannot be truthful without database-enforced deduplication.
- **Breakage if skipped:** frontend and backend drift under retry; duplicate live credentials and audit events can exist; the one-invitation proof and hosted QA must fail.
- **Risk and recovery:** the correction is additive and leaves the existing RPC intact for compatibility. A replay returns the existing id/hint/expiry with `raw_token = null` and a truthful recovery state; it never reconstructs a stored credential digest. A request-id collision with different input fails closed. Structural application is isolated-project-only through Supabase migration tooling after independent review; Production `qsveqfchwylsbncsfgxe` remains prohibited.

Post-apply ACL hardening (documentation-first gate): the isolated migration applied successfully and postconditions proved the new authenticated RPC, revoked old entrypoints, request column/index, zero starting cardinality, and Production absence. The Supabase security advisor then correctly flagged the public wrapper because it was `SECURITY DEFINER`. **What:** a follow-up migration changes only the public wrapper to `SECURITY INVOKER` and grants authenticated execution on the new private idempotent implementation; the old private/public creation functions remain revoked. **Why:** `passage_private` is not a Data API exposed schema, already grants schema usage for the established wrapper pattern, and the private implementation performs explicit Auth, organization, location, and replay-scope checks. This preserves the required privilege chain without exposing a public security-definer RPC. **Breakage if skipped:** the advisor warning remains and the public API has a broader execution posture than needed. **Breakage if misapplied:** omitting the private grant makes the wrapper fail closed with permission denied; restoring either old creation grant reopens duplicate bypass. Apply only through migration tooling to isolated `uyacxqtsiwlvtmhxvoxr`, never Production.

### Cycle 7A parity implementation and isolated idempotency proof - 2026-07-17 20:38 -07:00

Role handoff and decisions:

- PM completed the director-invitation Sprint Brief and classified the missing preview password session path FIX NOW. UX independently found and blocked both backend-ahead creation drift and frontend-behind-Auth drift before the verification preview. Development implemented the bounded corrections. Independent QA initially failed non-idempotent creation, token prefetch, replay truth, old-RPC bypass, privilege-chain, cross-location replay, and persisted-inviter defects; each was corrected and QA then passed both migrations for isolated application.
- The director workspace now links to `/director/invitations/new`. That route derives organization and active locations from the verified server-side viewer, calls only the new idempotent RPC, and shows truthful created, replayed-pending, validation, denial, conflict, and unavailable states. The receipt uses persisted purpose, scope, inviter, expiry, state, event destination, delivery `not_sent`, and next action. Raw-token links disable Next prefetch and are absent on replay.
- The provider-disabled isolated Preview login now has a real `signInWithPassword` path for Auth Admin synthetic accounts. It is enabled only by `PASSAGE_PREVIEW_PASSWORD_AUTH_ENABLED=true` together with Vercel Preview, Passage preview runtime, and exact isolated project ref `uyacxqtsiwlvtmhxvoxr`; Production and every other project fail closed. No credential is stored in source or rendered copy.
- The one-use Vercel exception remains `[deploy] [cycle-7a-verification-preview]`, exact canonical project/branch/Preview only. It remains explicitly forbidden in Production and will be removed in the post-QA `[skip deploy]` integrated commit.

Verification:

- `pnpm typecheck`, optimized `pnpm build`, and the expanded 16-case deploy-gate matrix pass. The build includes dynamic `/director/invitations/new`.
- Migration `cycle_7a_invitation_creation_idempotency` applied once through Supabase migration tooling to isolated `uyacxqtsiwlvtmhxvoxr` as version `20260718033341`. It adds request identity, serializes organization/email creation, replays existing live invitations without reconstructing the raw token, returns persisted scope/purpose/inviter/state, rejects cross-scope replay, and revokes authenticated execution of the old duplicate-capable public/private commands.
- Follow-up `cycle_7a_invitation_idempotency_acl_hardening` applied once to the same isolated project as version `20260718033709`. Post-apply catalog proof: public wrapper `prosecdef=false`; authenticated can execute the new public and new checked private functions; anon cannot; authenticated cannot execute either old creation function. Both migration names are absent from Production `qsveqfchwylsbncsfgxe`.
- Security advisors are clear of the temporary public-security-definer warning. Remaining INFO findings are the expected fail-closed Cycle 7B tables (`tasks`, `workflows`, `workflow_events`) with RLS and no policies: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy. Empty-lab unused-index INFO remains expected: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index.
- Starting isolated cardinality remains zero invitations, zero invitation-location rows, zero memberships, and zero invitation events. Real authenticated first-create/replay/cardinality proof still requires the two Auth Admin users and director fixture.

Current external gate and next exact action:

- No verification preview has been created and no `[qa-approved]`, commit, push, PR update, screenshot claim, or readiness increase has occurred. Vercel CLI still has no credentials; Chrome Vercel and Supabase dashboard tabs are left at their sign-in screens as explicit handoffs.
- Steve must sign in to both Vercel and Supabase in those open Chrome tabs and report ready, without sharing credentials. Then Deploy configures the ten exact-branch Preview variables (the existing nine plus `PASSAGE_PREVIEW_PASSWORD_AUTH_ENABLED=true`), configures only isolated Auth redirects, creates the director/staff synthetic users through Auth Admin, runs the guarded DML fixture, and spends the sole authorized verification-preview slot. Independent hosted QA then proves create/replay/wrong-user/acceptance/denial/reload/cardinality and 1440/390/360 evidence on that same preview.
- Operational readiness remains funeral home **40%** and D2C **25%**; guided readiness remains funeral home **94%** and D2C **85%**. Production remains untouched.

### Cycle 7A hosted re-entry parity audit - FIX NOW - 2026-07-18 03:55 -07:00

Authenticated target verification:

- Vercel browser access is authenticated to the canonical `thepassageappio` project. Supabase browser access is authenticated directly to isolated project `passage-cycle-7a-test` (`uyacxqtsiwlvtmhxvoxr`). Production project `qsveqfchwylsbncsfgxe` was not opened or changed.
- The Vercel CLI still requires its separate device authorization. No Preview variable, Auth setting, Auth user, fixture row, deployment, PR marker, readiness score, or Production value has changed in this re-entry.

Independent Engineering parity audit decision: **FAIL / FIX NOW before hosted mutation**.

- **Unreachable frontend contract:** `/director/invitations/new` is nested under `app/director/layout.tsx`, but `OperationalBoundary` currently renders director children only for the demo runtime. The password-auth path is deliberately available only in the exact isolated Vercel Preview runtime. Without a narrow verified-preview route allowance, a real director session can authenticate but can never reach the invitation command UI. Engineering must permit only the real, server-authorized invitation route in the isolated Preview and must not expose the sandbox director dashboard, weaken Production, or change family/vendor access.
- **Visibility-copy drift:** the invitation receipt currently says only authorized directors and the verified invitee can see the invitation. The backend intentionally permits pre-auth inspection to anyone possessing the secure raw link until expiry or revocation; acceptance remains restricted to the exact verified invited email. The UI copy must state that boundary truthfully.
- **Timestamp-proof drift:** the Server Action currently invents `new Date().toISOString()` after the RPC and labels it a Passage server receipt. That timestamp is not the durable invitation `created_at` or append-only creation-event time. The frontend must display a persisted database timestamp and invitation ID, or stop claiming authoritative timestamp proof.

Documentation-first backend correction for timestamp proof:

- **What:** add a versioned authenticated invitation-creation receipt RPC that preserves the current idempotency, replay, organization/location authority, old-command revocations, and raw-token non-recovery behavior, while returning the persisted invitation `created_at`. The old idempotent client entrypoints will be revoked after the versioned RPC is available; the underlying checked implementation remains internal.
- **Why the frontend needs it:** the task/proof contract requires actor, recipient, state, durable timestamp, and lookup identity. A response-generation clock cannot truthfully be labeled database or append-only proof, and a replay must show the original creation time rather than the replay time.
- **Breakage if skipped:** the director UI is frontend-ahead of durable proof and can misstate when the invitation was created; same-request replay displays a different invented time while claiming the original event was preserved.
- **Failure/recovery:** first creation and replay return the same invitation ID and persisted creation time; replay still returns no raw token. Missing authority, payload conflicts, and unavailable receipts fail closed. Apply the structural RPC change only through Supabase migration tooling to isolated `uyacxqtsiwlvtmhxvoxr`; never Production `qsveqfchwylsbncsfgxe`.

External parity lane:

- A delegated agent pushed contract-ledger/checker commits through `5bb292a` to `origin/greenfield/passage-zero`. Root fetched and inspected those commits. Its ledger correctly detected the backend-only state on the remote head, but it predates the current uncommitted invitation UI and therefore must be reconciled to the real reachable route and versioned RPC before it can be accepted. Root will run the checker and its deliberately failing fixtures locally; no GitHub Workflows permission expansion is required for this Cycle 7A gate.

FIX NOW implementation and verification:

- Engineering added a server-derived pathname gate which admits only exact path `/director/invitations/new` when runtime is Preview, the configured project is isolated ref `uyacxqtsiwlvtmhxvoxr`, the preview password gate is enabled, and the existing server-side viewer resolves to owner/director with an active location. The page repeats the runtime/role guard before mounting the form. `/director`, `/director/intake`, `/staff`, subpaths, demo, Production, wrong refs, disabled-password state, and unavailable configuration remain denied. The Preview director authority placeholder exposes only the controlled invitation link; seeded dashboard/case data remains withheld.
- Engineering corrected invitation visibility to state that link possession permits inspection until expiry/revocation while acceptance requires the exact verified invited account. Root removed Cycle/QA/preview/cutover narration from persona-facing copy. Family, participant, vendor, and case access are unchanged.
- Independent QA passed migration `20260718105025_cycle_7a_invitation_receipt_timestamp.sql`. It was applied once through Supabase migration tooling only to isolated `uyacxqtsiwlvtmhxvoxr` as version `20260718105618`. Production migration history contains zero matching entries. Catalog proof shows the public v2 wrapper is `SECURITY INVOKER`, the private v2 function is checked `SECURITY DEFINER`, authenticated alone can execute v2, authenticated cannot execute v1 or either original command, and the v2 result includes persisted `created_at`.
- Post-apply security advisors introduced no new warning; only expected Cycle 7B fail-closed RLS-without-policy INFO remains for tasks/workflows/workflow_events. Empty-lab unused-index INFO remains expected. The app now calls only `create_employee_invitation_idempotent_v2`, requires `created_at`, and displays the persisted creation time plus invitation ID; replay retains the original ID/time and no raw token.
- Root verification passes: exact-route matrix, TypeScript, optimized Next.js production build including dynamic `/director/invitations/new`, and all 16 deploy-gate cases. The delegated parity checker was executed in a detached review worktree: nine deliberately passing/failing unit cases plus the remote ledger integration check all passed (10/10). Its ledger still requires reconciliation from `backend_only` to the now-implemented route/v2 receipt before merge acceptance.

Role state and next target:

- PM: FIX NOW scope remains active. Engineering: PASS on source reachability correction. Data Engineering: PASS after independent QA and isolated application. Deploy: plan PASS with hard preconditions; the sole verification-preview slot is still unspent. UX is re-reviewing the corrected current surface. Hosted QA remains unrun, so `[qa-approved]`, readiness changes, Production, and preview publication remain prohibited.
- Next: commit the verified source batch with `[skip deploy]`, merge and correct the delegated parity ledger, configure only exact-branch Vercel Preview variables, create isolated Auth users/redirects and seed the guarded DML fixture, then spend the one authorized verification preview and run the complete two-session hosted evidence gate.

### Cycle 7A parity integration and UX recovery - 2026-07-18 04:34 -07:00

- Development source batch `95e913f` (`fix: close Cycle 7A hosted parity gaps [skip deploy]`) records the reviewed route boundary, versioned persisted-timestamp receipt, isolated migrations/fixtures, Preview gate, and operating-context handoff without triggering a deployment. TypeScript, optimized production build, exact operational-route matrix, and all 16 deploy-gate cases passed immediately before commit.
- Root merged the external parity lane from remote head `5bb292a` without treating its hand-verification as execution proof. The provided unit/integration suite was run locally and passed all ten cases. The contract ledger was reconciled from `backend_only` to `implemented` only after the exact `/director/invitations/new` route, form, Server Action, v2 RPC, durable receipt timestamp, authority guards, and recovery behavior existed together. No GitHub Workflows permission expansion is needed for this release gate.
- Distinct UX re-review returned **PARTIAL / FIX NOW**. Its timestamp concern was stale because the current Server Action already requires persisted `created_at`; three valid issues remained. Engineering added an explicitly timezone-bearing date/time formatter for expiry and creation proof, an announced live pending state plus `aria-busy`, and separate unavailable-versus-active-request cursor semantics. Source inspection indicates the 48px controls and one-column mobile rules remain structurally sound. UX remains PARTIAL until the hosted 1440/390/360 render, focus, announcement, wrapping, and zero-overflow evidence is actually captured.
- The parity suite and TypeScript pass after those corrections. Hosted QA is still unrun. No Preview variable, Supabase Auth redirect/user, guarded persona fixture, Preview deployment, PR marker, `[qa-approved]`, readiness score, Production value, family access, or vendor fulfillment state changed in this integration step.
- Role state: PM scope COMPLETE; UX PARTIAL pending hosted visual proof; Engineering PASS on source; Data QA PASS on isolated migration split/application; Deploy plan PASS with hard exact-branch/isolated-project preconditions; hosted QA NOT RUN. Next role target is Deploy configuration of only exact branch `greenfield/passage-zero`, followed by isolated Auth Admin setup and the sole authorized verification Preview.

### Cycle 7A authenticated publish recovery - 2026-07-18 05:12 -07:00

- The shell push could not use the browser-only GitHub session, so root used the already-authorized GitHub connector without requesting Workflows permission. Remote commit `0303fb3` published the tested source as `[skip deploy]`. Root immediately detected that the connector's shell-output transport had truncated two large blobs at exactly 30,012 bytes; because the commit was non-deploying, no runtime or hosted data was affected.
- Root repaired all four connector-transformed blobs with chunked byte-exact uploads. Remote repair commit `e820257` (`fix: restore complete Cycle 7A source blobs [skip deploy]`) now has tree `5a1c2979e129fac64d104715f63ef70913fc557d`, exactly matching the locally tested HEAD tree. The local branch pointer was aligned only after tree identity was proven. The parity suite, TypeScript, production build, route matrix, and deploy-gate evidence remain the verification basis for this tree.
- Auth confirmation remains valid in Chrome for canonical Vercel project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD` and isolated Supabase project `uyacxqtsiwlvtmhxvoxr`. No environment value, redirect, Auth user, fixture row, deployment, PR marker, or Production resource changed. The authenticated Chrome browser had already been finalized for this logical turn; the alternate in-app browser reached Vercel/GitHub sign-in but has no authenticated session. Deploy configuration therefore remains the next auto-advance target on the fresh browser turn, without requiring another owner decision or permission expansion.

### Owner-approved canonicalization and 72-hour transformed beta brief - 2026-07-18 05:12 -07:00

Owner decision and scope:

- Steve approved the review recommendation and directed the train to proceed toward a transformed functional beta within three focused days. Passage Zero on `greenfield/passage-zero`, draft PR #24, is now the sole target architecture. Threshold/main is frozen to separately governed production P0/P1 hotfixes; no new legacy dashboard, estate, IA, schema, or redesign work may begin.
- This is a non-production, synthetic, manually supported funeral-home beta. A complete PASS may move funeral-home operational readiness from 40% to **55-60%**. D2C remains **25% operational / 85% guided** because durable family identity/grants are not in this slice. The wider evidence-gated pilot remains 10-15 focused working days at funeral home 85-88% and D2C 83-87%; no schedule alone moves a score.
- Production project `qsveqfchwylsbncsfgxe`, public relaunch, real customer data, live Google/email/SMS, durable D2C grants, full Case Room/realtime/outbox/proof lifecycle, vendor fulfillment, estate, billing, paid providers, broad integrations, and legal/privacy/security claim changes are explicit non-goals.

Role instances and handoffs:

- Product Manager `/root/pm_three_day_beta`: **COMPLETE**. It received the owner decision and latest hosted-authority handoff and produced the Sprint Brief, contract matrix, migration gate, acceptance, dependencies, risks, non-goals, owner gates, and role sequence.
- UX Review `/root/ux_three_day_beta`: **IN PROGRESS**. It received the PM scope for invitation, durable workload, assignment/reassignment, staff transition, revoked/denied states, audit, and 1440/390/360 acceptance.
- Engineering/Data root: **IN PROGRESS**. It restored Passage Zero-specific release-train/role guidance, recorded canonicalization/freeze and cutover governance, expanded the parity plan, and is preparing hosted configuration. No hosted mutation, deployment, readiness change, family/vendor change, or Production action has occurred in this documentation batch.
- Independent QA/Deploy-preflight `/root/review_threshold_main`: **ASSIGNED** for the two-session evidence script and Cycle 7B RLS/RPC negative-test matrix. Deploy remains closed until independent PASS.

PM Sprint Brief:

- **Goal:** within 72 hours, prove a transformed funeral-home beta where two hosted identities complete director invitation -> staff acceptance, then operate one real durable assigned-work loop with assignment/reassignment, staff transition, revocation, append-only audit, reload/replay truth, denial, and responsive evidence.
- **Day 1 components/objectives:** configure only exact-branch Preview variables; configure only isolated Auth redirects; create synthetic director/staff through Auth Admin; run the guarded DML-only director fixture; spend the authorized Cycle 7A verification Preview; prove create/inspect/accept, `/staff`, staff `/director` denial, reload, replay, wrong-user denial, exact membership/location/invitation/event cardinality, and 1440/390/360 evidence; then remove the temporary verification-preview exception.
- **Day 2 components/objectives:** preflight existing workflows/tasks/authority columns; document and independently review the 7B what/why/breakage migration; apply only additive isolated migrations through Supabase migration tooling; seed deterministic Sofia Rivera/Northstar workflow/task data; enforce manager organization/location workload reads, staff assigned-only reads, workspace-as-presentation, idempotent assignment/reassignment, validated staff transition, invitation/membership revocation, server-only append-only events, and family-grant preservation; replace beta director/staff sandbox projections with durable server queries and add reachable revocation/audit states.
- **Day 3 components/objectives:** prove director assignment -> staff work transition -> director activity trail -> reassignment -> revocation plus replay, stale-session, wrong-location, wrong-organization, unassigned-user, and revoked-user denial; run parity, TypeScript, optimized build, deploy gate, SQL/RLS tests, advisors, failure injection, console/hydration, keyboard/focus/target/overflow QA; commit timestamped redacted evidence; publish the one coherent non-production beta Preview only after independent QA authorization; update PR #24, roadmap, ledger, and context.

Frontend/backend beta contract:

| Persona action | UI | Server/data | Authority/event/recovery |
| --- | --- | --- | --- |
| Director creates invitation | `/director/invitations/new` | Existing v2 idempotent creation RPC; invitation + locations | Active manager and managed locations; one created event; replay preserves ID/time and no raw-token recovery |
| Staff inspects/accepts | `/invite/[token]` | Existing inspect/accept RPCs; one membership + location grant | Exact verified invited email; accepted event; invalid/expired/revoked/wrong-user/replay fail safely |
| Director views workload | Durable `/director` beta projection | Planned workflows/tasks query | Manager organization/location grant; empty/denied states reveal no other location |
| Director assigns/reassigns | Reachable workload action | Planned idempotent commands | Managed task and location-authorized assignee; one event per command; conflict/replay returns durable owner |
| Staff views/advances work | Durable `/staff` and bounded work detail | Planned assigned-only query and validated transition | Current active assignee and location; one transition event; unassigned/revoked/reassigned/invalid state denied |
| Director revokes | Pending invitation and team actions | Existing invitation revoke RPC; planned membership revoke RPC | Manager predicate; one revoke event; accepted invite routes to membership revocation; revoked access closes on next request/reload |
| Director reads audit | Bounded activity trail | Planned scoped event query | Read-only organization/location/case authority; no global or family-visible operator audit |

Cycle 7B documentation-first migration gate:

- **What:** durable organization/location/assignment references; manager workload and staff assigned-only SELECT policies; idempotent assignment/reassignment; validated staff transition; membership revocation; server-only append-only events and scoped audit reads; supporting uniqueness/indexes.
- **Why:** the transformed UI must project the same durable ownership, task state, proof, and event identifiers that the backend authorizes; browser-only state cannot support the beta claim.
- **Breakage if skipped:** director/staff surfaces drift, staff can see too much or no real work, retries duplicate effects, revocation fails to remove authority, and audit states can be forged, omitted, or invisible.
- **Risk/recovery:** workspace choice never grants access; no direct client audit writes; family grants remain independent; fixtures stay guarded DML-only and reversible; migrations apply only through tooling to `uyacxqtsiwlvtmhxvoxr`; Production `qsveqfchwylsbncsfgxe` is prohibited.

Documentation and parity decisions:

- `AGENTS.md` now carries the superseding Passage Zero canonicalization directive.
- `docs/product/passage-zero-cutover-plan.md` records route responsibility, beta/pilot/production definitions, PR #24 merge gates, hotfix ownership, and rollback principles without becoming a second roadmap.
- The canonical roadmap now includes the isolated 72-hour beta milestone and preserves the 10-15-day pilot target.
- Passage Zero-specific `docs/release-train.md` and PM/UX/Engineering/QA/Deploy role briefs now exist, closing the missing-file governance gap.
- `cycle7b.director.revoke_invitation` is classified `backend_only`; workload, assignment, staff transition, membership revocation, reassignment, assigned work, and audit remain queued until their complete reachable contracts exist. No status may move to `implemented` before the parity suite and evidence pass.

Dependencies and current evidence:

- Browser access is authenticated to the canonical Vercel project and isolated Supabase URL Configuration. The isolated project is `ACTIVE_HEALTHY`; its nine Cycle 7A migrations are present once. Current security advisors show only expected INFO for `tasks`, `workflows`, and `workflow_events` with RLS enabled and no policy; performance advisors show expected unused-index INFO in the empty lab.
- The first baseline command attempt could not execute because the fresh shell PATH omitted the bundled Node runtime. This is an environment/tooling issue, not a product test failure; Engineering must rerun the complete suite with the resolved bundled Node path before handoff.

Exact next role target: UX returns the acceptance bar; Engineering then configures branch-only Vercel variables and isolated Auth, runs the guarded director fixture, publishes only the authorized verification Preview, and hands the two independent sessions to QA. Cycle 7B migration/application cannot begin until its independent review completes. The train remains active.

### Cycle 7A/7B integrated beta candidate - hosted configuration and durable parity - 2026-07-18 06:56 -07:00

Release sequencing and role handoffs:

- The governing one-Preview sequence is now explicit: finish the combined Cycle 7A + 7B source, migration, fixture, and local/SQL gate first; publish the sole non-production verification Preview with literal `[deploy] [cycle-7a-verification-preview]`; run independent hosted QA against that same deployment; then close evidence/context/PR state with a non-deploying commit. A truthful `[qa-approved]` marker is not permitted before hosted PASS, and no second Preview is authorized.
- PM `/root/pm_three_day_beta`: **COMPLETE** with the 72-hour beta brief. UX `/root/ux_three_day_beta`: **PARTIAL / FIX NOW** until hosted viewport/accessibility evidence, but its source blockers are implemented. Engineering/Data root: **PASS on the current source + isolated SQL candidate**. Independent QA `/root/review_threshold_main`: **PASS** on Cycle 7B assigned-work migration and its separately guarded advisor migration after rejecting and correcting multiple authority/concurrency defects. Deploy remains **CLOSED pending the sole verification commit**.
- This is an isolated functional beta candidate, not a public relaunch, pilot-operational claim, or full production release. Funeral-home readiness remains **94% guided / 40% operational** and D2C remains **85% guided / 25% operational** until the entire hosted gate passes.

Hosted configuration completed without repository-wide or Production mutation:

- Canonical Vercel project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD` now has only exact-branch `greenfield/passage-zero`, Preview-only runtime, isolated-project, public URL/key, provider-disable, and controlled password-auth values needed by the beta. Repository-wide Stripe values were left untouched; no Production value was added or changed; no redeploy occurred.
- Isolated Supabase Auth now uses the stable Passage Zero branch Preview origin/callback. Exact synthetic Auth Admin accounts exist for `cycle7a-director@passage.test` and `cycle7a-staff@passage.test`; credentials are not stored in source, docs, or evidence.
- The guarded Cycle 7A persona fixture was applied as DML-only to isolated project `uyacxqtsiwlvtmhxvoxr`. Current pre-evidence cardinality is exactly one organization, one location, one active director membership, one active director location grant, zero invitations, zero events, zero workflows, and zero tasks.
- Supabase's leaked-password check remains one acknowledged security WARN because the authenticated dashboard confirms it is available only on a paid Pro plan. No purchase or plan change was authorized. All database/RLS structural advisor warnings are closed; unused-index INFO is expected in the empty lab.

Cycle 7B backend/frontend parity:

- Migration `supabase/migrations/20260718180000_cycle_7b_assigned_work.sql` (independent-review SHA-256 `4931559B0332B8B2725A5C6FE7AD258BA61900363AB61614CBA8998AB8FAC241`) adds durable workflow/task operating fields, versioned assignment/start/revocation commands, organization/location/staff-assignment RLS, server-only append-only events, historical revoked-team visibility, and accepted-token `access_ended` truth. Family grants remain unchanged.
- Independent review initially rejected cross-task idempotency, assignment/revocation races, stale/former-assignee replay, revocation ordering/replay, historical access, accepted-token truth, multi-location audit leakage, and null-assignee edges. Engineering corrected each defect before QA passed. The migration was then applied exactly once through Supabase migration tooling only to `uyacxqtsiwlvtmhxvoxr` as `cycle_7b_assigned_work`; Production `qsveqfchwylsbncsfgxe` was not touched.
- The disposable `supabase/tests/cycle_7b_assigned_work.sql` matrix passes after application and again after advisor hardening, then rolls back. It proves direct-DML closure, assignment/replay/cross-task collision/stale conflict, start/replay/former-assignee denial, revocation/replay/historical projection, accepted-token denial + `access_ended`, partial-location event denial, and cross-organization read denial.
- Advisor migration `supabase/migrations/20260718190000_cycle_7b_advisor_hardening.sql` was first rejected because a comment was not an executable isolated-project boundary. Engineering added required Cycle 7A/7B migration markers, RLS/function/column prerequisites, and exact pre/post policy-set guards. Independent QA then passed SHA-256 `82B904AA86C5C80E49EFF800AD2D7F785932A2F9A7CF218A099B58820FCCA399`; it was applied once only to the isolated lab. The resulting member policy set is exactly `cycle_7b_members_authorized_select`, and the revoker FK index is present.
- The verified app now uses durable server/RLS projections: Director Today `/director`, Team `/director/team`, Activity `/director/activity`, and Staff My work `/staff`. Assignment/reassignment, invitation revocation, membership revocation, and staff `assigned -> in_progress` use Server Actions and idempotent RPCs with stable UUIDs/expected versions, no optimistic claim, durable re-read, and server receipt. Verified navigation does not expose sandbox Intake/Receive. Family and vendor surfaces are unchanged.
- `docs/product/frontend-backend-contracts.json` is version 2 and promotes all completed Cycle 7A/7B beta contracts only after the reachable route, Server Action/query, migration/RLS, durable row/event, recovery state, and SQL/source evidence were present together. `pnpm test:parity` passes all 10 checker cases after reconciliation.

Current verification and remaining gate:

- PASS: TypeScript, runtime Preview/Production isolation matrix, operational-route fail-closed matrix, frontend/backend parity suite, 16-case Vercel deploy gate, optimized Next.js build, Cycle 7B SQL/RLS matrix, isolated migration history, post-test exact baseline cardinality, and Supabase database advisors (apart from paid-plan Auth WARN and empty-lab unused-index INFO).
- The controlled Cycle 7B workload fixture `supabase/test-fixtures/cycle_7b_hosted_workload.sql` remains unapplied. It is guarded, idempotent, reversible, DML-only, requires successful Cycle 7A staff acceptance, and will not overwrite the invitation cardinality proof.
- No Preview has been published, no screenshot/evidence artifact has been committed, PR #24 has not yet received this candidate update, no `[qa-approved]` marker exists, and no readiness score moved.
- Exact next role target: Engineering completes final worktree/source review and publishes the sole verification Preview; independent hosted QA then proves two separate director/staff sessions, create/inspect/accept, replay/wrong-user/role denial/reload/cardinality, 1440/390/360 reflow/accessibility, followed by the 7B assignment/start/reassignment/revocation/activity/negative-authority story and timestamped redacted evidence. Deploy may approve only if every gate passes.

### Cycle 7A verification-Preview runtime recovery - 2026-07-18 08:18 -07:00

Hosted QA result and role return:

- Deploy published verification commit `ecddbbf8c2b99ff99caf79efaeb6e2b5c35a5981` with the cycle-specific Preview marker and no `[qa-approved]`. Vercel deployment `dpl_B5J7iveJnaFpxyLjYdXvaTjQfisi` reached `READY` as `target: Preview`, exact branch `greenfield/passage-zero`, canonical project, and draft PR #24. This was the sole initial verification attempt; it is retained as failed evidence rather than counted as a beta PASS.
- Hosted QA signed in the synthetic director and verified the durable `/director` and `/director/invitations/new` surfaces. The first invitation submission returned a server-side exception, digest `266042502@E352`. Vercel Preview runtime logs identified the exact cause: a top-level `use server` module exported a runtime object (`A "use server" file can only export async functions`). QA marked FAIL and returned the train to PM before any Cycle 7B hosted mutation.
- PM `/root/pm_three_day_beta` classified the defect P0/FIX NOW inside Cycle 7A. Readiness remains funeral home **94% guided / 40% operational** and D2C **85% guided / 25% operational**. No `[qa-approved]`, PR readiness claim, screenshot claim, or Production action is permitted. PM authorized one bounded replacement verification Preview on the same exact branch/project/isolated environment only after the corrective local gate; this is recovery of the failed slot, not permission for a preview chain.

Frontend/backend runtime correction and proofing:

- Engineering removed runtime initial-state exports from every affected Server Action module: director workload commands, invitation creation, and staff work transition. Typed initial state now lives in the consuming client components; each top-level `use server` module runtime-exports async functions only.
- New AST-backed gate `scripts/test-use-server-exports.js` scans all App Router TypeScript/TSX modules whose directive prologue contains `use server`. It permits erased type/interface exports and immutable async function exports; it rejects runtime objects, arrays, primitives, classes, enums, mutable async bindings, synchronous functions, non-async defaults, and unprovable runtime re-exports. Ten deliberately failing fixtures and multiple passing fixtures prove both acceptance and rejection behavior. `pnpm test:parity` now includes this gate, with `pnpm test:server-actions` available for focused diagnosis.
- The first gate implementation itself missed an export declaration; its negative re-export fixture caught that defect. The checker was corrected before any PASS was recorded. The final real-repository scan passes with all ten prohibited fixtures rejected.
- Isolated data was checked immediately after the hosted 500 and again after local smokes: zero staff-recipient invitations, zero invitation-location rows, zero staff memberships, zero active staff location grants, and zero invitation events. No partial mutation, deletion, or reseed occurred.
- A production-mode Next server was built with temporary ignored Preview-only values copied from the authenticated isolated Supabase dashboard. It contained no service-role or Production credential and was removed after the smoke. The real director invitation Server Action was submitted with whitespace-only purpose and returned the intended server validation without mutation. The real staff start Server Action was submitted from a temporary local-only harness using inert valid UUIDs and returned the intended authority denial without RPC mutation. Both requests completed without a runtime digest or server-log error; the harness, local server, tabs, and temporary environment file were removed before the release candidate.

Replacement Preview acceptance:

- Required local release gates are the focused Server Action export test, parity, TypeScript, runtime isolation, operational-route matrix, 16-case deploy gate, optimized build with no temporary route, cached-diff/secret checks, and independent staged-candidate QA.
- The replacement commit may use `[deploy] [cycle-7a-verification-preview]` only. It must remain Preview-only, exact branch/project, isolated Supabase only, and must not contain `[qa-approved]`.
- Hosted QA restarts from the unmutated Cycle 7A baseline: director first-create and same-request replay, staff pre-auth inspection and exact-user acceptance, wrong-user denial, `/staff`, staff `/director` denial, reload persistence, replay, exact cardinality, runtime logs, and 1440/390/360 evidence. Cycle 7B hosted fixture/mutation remains frozen until Cycle 7A passes.

Exact next role target: Engineering runs the final clean gate and stages only the corrective source/test/context files; independent QA re-reviews the staged replacement; Deploy publishes the single PM-authorized replacement verification Preview only after that PASS. Production remains untouched.

### Owner-requested Cycle 7A hosted handoff - 2026-07-18 12:30 -07:00

Owner disposition: Steve asked this chat to finish the current task, update the living Markdown, and hand the remaining release train to a fresh chat. This is an explicit stop before any Cycle 7B hosted fixture or workflow mutation. It does not authorize Production, another readiness claim, or a misleading `[qa-approved]` marker.

Role instances and handoffs:

- PM `/root/pm_three_day_beta`: **COMPLETE**. It received the failed first Preview, classified the Server Action export failure P0/FIX NOW, and authorized the bounded replacement verification Preview.
- UX `/root/ux_three_day_beta`: **PARTIAL**. The functional authority story passed, but the exact hosted visual pass found one accepted-invitation projection defect described below.
- Engineering/Data root: **PASS for the source handoff**. It corrected the hosted runtime failure, added the Server Action export gate, completed the replacement hosted transaction, corrected the final Team projection, and passed the local release suite.
- Independent QA `/root/final_publish_qa`: **PASS** on the staged Server Action recovery candidate before its replacement Preview and **PASS** on this final handoff delta. The final review verified the pending-only source projection, targeted regression assertion, screenshot dimensions/content, redaction, and absence of passwords/tokens/share URLs; it explicitly retained **PARTIAL / no `[qa-approved]`** because the last UI correction is source-only. Independent SQL QA `/root/review_threshold_main` previously passed the isolated Cycle 7B migration candidates.
- Deploy: replacement Preview is retained as evidence; Production remains closed. The fresh chat begins with PM/Deploy re-entry, not an assumed deploy approval.

Replacement Preview and hosted Cycle 7A result:

- Corrective commit `f56f1fbf9ad8cd71f612db045d3eb0d1b2f019e5` deployed as Vercel Preview `dpl_F5J8DoQJhd2oKtm99PQ44gr4fTPs`, `READY`, canonical project, exact `greenfield/passage-zero` branch, and isolated Supabase only. Runtime error/fatal logs were empty after the full flow. No `[qa-approved]` marker was used.
- Separate hosted director and staff sessions proved director first-create, same-request replay with the original ID/time and no second raw token, staff pre-auth inspection, wrong-user denial without mutation, exact-user acceptance, `/staff`, staff `/director` denial, reload persistence, and stable same-user accepted-receipt replay without another acceptance action.
- Exact isolated post-acceptance cardinality is: organization 1; location 1; active memberships 2 (`director: 1`, `staff: 1`); active location grants 2; invitation 1; accepted invitation 1; invitation-location 1; invitation command events 2 (`metadata.event_kind` = `organization_invitation.created` and `organization_invitation.accepted`); workflows 0; tasks 0. Family/vendor data and grants were unchanged.
- Redacted evidence is recorded at `docs/evidence/cycle-7a-auth/2026-07-18-hosted-cycle-7a-redacted-evidence.md`. Sensitive invitation material, synthetic passwords, temporary share URLs, and service credentials are not committed.

Exact viewport evidence and final parity correction:

- Hosted `/director/team` was checked at 1440 x 900, 390 x 844, and 360 x 800. Each viewport reported document width equal to viewport width, no horizontal overflow, and no browser console/page errors. Timestamped screenshots are committed beside the redacted evidence.
- The 360 snapshot exposed a truthful-state defect: the already accepted invitation still rendered in the `PENDING INVITATIONS` section while the active staff membership rendered below it. The backend was correct; the director projection mapped the full invitation collection after displaying a filtered pending count.
- Engineering now derives `pendingInvitations` once and renders only that collection, with a truthful zero-pending empty state. Accepted/revoked/expired rows no longer appear as pending controls; membership and append-only Activity remain their durable destinations.
- The parity harness now reads the real Team source and rejects either removal of terminal-state filters or a return to mapping `invitations` directly. Final local results: frontend/backend parity **11 passed / 0 failed**; Server Action export gate PASS with ten prohibited fixtures rejected; runtime isolation PASS; operational route gate PASS; 16-case deploy gate PASS; optimized Next production build PASS; TypeScript PASS.
- The screenshots preserve the hosted defect as QA evidence. Because the projection fix has not been deployed and visually rechecked, hosted QA remains **PARTIAL** and the branch must not be labeled `[qa-approved]` yet.

Release/readiness state:

- Funeral home remains **94% guided / 40% operational**. D2C remains **85% guided / 25% operational**. No score was raised; this is not a pilot-operational or full-production claim.
- Production Supabase project `qsveqfchwylsbncsfgxe` was not mutated. Exact-branch Preview variables and isolated Auth configuration remain branch/lab scoped. Signed-in Vercel and Supabase admin tabs were deliberately left signed in; the synthetic hosted QA tabs were not used to sign the owner out.
- The Cycle 7B migrations are present only in isolated project `uyacxqtsiwlvtmhxvoxr` as previously recorded, but `supabase/test-fixtures/cycle_7b_hosted_workload.sql` remains unapplied. No Cycle 7B assignment, start, reassignment, revocation, or activity mutation was performed in this close.
- PR #24 must describe Cycle 7A as functionally proven with one source-only projection correction awaiting hosted re-verification. It must not claim QA approval or beta/pilot completion.

Fresh-chat next highest-leverage sequence:

1. Start from this handoff and inspect the pushed handoff commit, draft PR #24, deployments, and isolated cardinality before acting. Preserve the owner's signed-in admin sessions; do not sign out or replace branch-only/Preview-only values.
2. PM/Deploy re-enter on the source-only Team projection correction and determine the truthful non-production re-verification path under the existing preview-budget/marker rules. Do not invent `[qa-approved]` before hosted PASS and do not touch Production.
3. Reverify `/director/team` on the corrected source at 1440, 390, and 360: zero pending invitations, one active staff membership, no horizontal overflow, no console/hydration/runtime errors. Commit replacement screenshots; retain the prior screenshots as defect evidence.
4. Preserve Cycle 7A exact cardinality, then apply the guarded DML-only `supabase/test-fixtures/cycle_7b_hosted_workload.sql` only to isolated `uyacxqtsiwlvtmhxvoxr`. Exercise director workload, assignment/start/reassignment, invitation/member revocation, append-only Activity, replay/conflict, wrong-location/organization/unassigned/former/revoked-user denial, reload persistence, and exact task/event cardinality.
5. Rerun parity, Server Action export, TypeScript, optimized build, runtime/route/deploy gates, Cycle 7B SQL/RLS tests, Supabase security/performance advisors, Vercel runtime logs, and desktop/mobile accessibility/overflow QA. Commit only timestamped screenshots and redacted database/audit evidence.
6. Update this context and PR #24 in the integrated handoff/release commit. Publish no Production deployment. Add `[qa-approved]` only if the complete hosted evidence gate actually passes and the governing deploy marker/preview authorization is satisfied.

Auto-advance disposition: intentionally handed to a fresh PM role at the owner's request. The train is not blocked by credentials; it is paused at a deliberate owner-requested chat boundary with all remaining work and release truth recorded.

### Owner-requested Cycle 7A re-verification and Cycle 7B hosted loop - 2026-07-18 13:35 -07:00

Release disposition and role handoffs:

- PM `/root/pm_cycle7a_reverify` authorized exactly one truthful non-production re-verification Preview for the source-only Team projection correction and kept Cycle 7B closed until that hosted correction passed. UX `/root/ux_cycle7a_reverify` retained the Passage Zero typography, warm ivory surfaces, low-saturation state palette, privacy boundaries, persona projections, responsive reflow, and 48px target acceptance. Engineering/Data root executed only the authorized isolated flow. Independent QA `/root/qa_cycle7a_audit` returned **PASS** after the screenshot format/dimension record was made truthful and the contract ledger's membership-revocation event was aligned to the migration's actual `organization_member.revoked` semantic. QA confirmed `[qa-approved]` is truthful for this exact non-production candidate and evidence set. Deploy `/root/deploy_cycle7a_reverify` independently returned **PASS** and authorized one final `[skip deploy]` evidence/context commit plus the draft PR update, with no further Preview.
- This evidence establishes a non-production functional-beta slice only. It does not make Passage Zero pilot-operational or full-production ready. Funeral home remains **94% guided / 40% operational** and D2C remains **85% guided / 25% operational**.

Cycle 7A corrected hosted PASS:

- Verification commit `072b37df3a97714872bfdf5e89c75cda8d00d937` (`test: reverify accepted invitation projection [deploy] [cycle-7a-verification-preview]`) published Vercel Preview `dpl_5jaw5SMPekKLEPbzzRgjRJePiKMW`. It is `READY`, exact branch `greenfield/passage-zero`, canonical project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`, and isolated Supabase only. The build log explicitly recorded the owner-authorized verification exception; optimized build and TypeScript passed. Deployment-scoped warnings/errors/fatals were empty, grouped runtime errors were empty, and observed requests were 200/204 only.
- The corrected `/director/team` projection showed exactly zero pending invitations, the truthful `No pending invitations.` empty state, and one active staff membership before Cycle 7B. At configured 1440 x 900, 390 x 844, and 360 x 800 viewports, live document width equaled client width, controls met the 48px target bar, Passage typography remained intact, reload persisted the same projection, and no console, hydration, page, or runtime error occurred. The browser's JPEG page-content captures are truthfully named `.jpg` and separately documented at encoded 1425 x 891, 375 x 812, and 345 x 767; they exclude browser chrome/scrollbar and are not mislabeled as exact-size PNGs. The earlier exact-size PNG defect screenshots remain retained as evidence of the caught regression.
- Immediately before the Cycle 7B fixture, exact isolated cardinality was re-read and preserved: one organization; one location; two active memberships; two active location grants; one accepted invitation; one invitation-location row; two invitation events; zero workflows; zero tasks.

Cycle 7B hosted authority loop:

- Guarded fixture `supabase/test-fixtures/cycle_7b_hosted_workload.sql` was applied once as reversible, idempotent, DML-only SQL to isolated project `uyacxqtsiwlvtmhxvoxr`. It created two workflows and three tasks without changing the accepted-invitation proof. Production project `qsveqfchwylsbncsfgxe`, Production Vercel configuration, family access, vendor fulfillment, pricing, and readiness scores were untouched.
- Separate director and staff sessions proved director workload, assignment, staff `assigned -> in_progress`, reload persistence, reassignment to an alternate active staff member, former-assignee removal, separate pending-invitation revocation, accepted-member revocation only after zero active assignments, revoked-workspace denial, and the append-only Activity projection. Server receipts and durable re-reads agreed after every command.
- Idempotency and recovery passed: assignment, start, reassignment, and member-revocation replays returned their original event with exactly one event per command; conflicting assignment/reassignment replays returned SQLSTATE `22023`; stale start returned `40001`. Wrong-location, wrong-organization, unassigned, former-assignee, and revoked-user commands returned `42501`; the unauthorized personas projected zero tasks/workflows. Direct event insert, update, and delete each returned `42501`, and total event cardinality remained eight.
- Final isolated manifest is two invitations (the original accepted invitation and a separate revoked pending invitation), two active memberships (director and alternate staff), one revoked staff membership and grant, two workflows, three tasks, and eight append-only events. The command spine contains one assignment, one staff start, one reassignment, one member revocation, and four invitation lifecycle events.

Release, SQL, advisor, and responsive gates:

- PASS: frontend/backend parity **11/11**; Server Action export gate with all ten prohibited fixtures rejected; runtime configuration; operational route gate; Vercel deploy gate **16/16**; TypeScript; optimized production build; hosted Cycle 7B RLS matrix; authenticated replay/conflict/denial supplements; append-only proof; responsive and accessibility QA for Director Today, Team, and Activity at 1440/390/360; revoked staff at 1280 desktop and 390/360; and deployment/runtime log review.
- QA found and Engineering corrected one final documentation-only parity mismatch before approval: `docs/product/frontend-backend-contracts.json` had said `organization_membership.revoked`, while the real migration and durable E8 event are `organization_member.revoked`. Both ledger fields now match the real event semantic, and the parity/Server Action suite passed again at **11/11** with all ten prohibited fixtures rejected.
- `supabase/tests/cycle_7b_assigned_work.sql` passed rollback-only against the isolated project. The standalone Cycle 7A conflict-constraint test correctly refused to run because its documented local-only fixture identities are absent in the hosted project; its transaction rolled back. The equivalent hosted Cycle 7A acceptance, replay, wrong-user denial, and exact cardinality were already proven against the real isolated identities.
- Supabase security advisors contain one acknowledged isolated-lab WARN because leaked-password protection is disabled while public providers and external delivery remain disabled. Performance advisors contain only unused-index information for new lab paths; no RLS or exposed-write warning is present.
- Redacted evidence is recorded in `docs/evidence/cycle-7a-auth/2026-07-18-hosted-cycle-7a-redacted-evidence.md` and `docs/evidence/cycle-7a-auth/2026-07-18T13-35-00-0700-cycle-7b-redacted-evidence.md`. No synthetic password, invitation token, share URL, service credential, or raw database dump is committed.

Exact closeout sequence: commit only the timestamped screenshots, redacted evidence, corrected parity ledger, and this context with `[skip deploy]`; push; verify Vercel cancels the skipped commit rather than creating another Preview; update draft PR #24 with exact deployment, QA/Deploy PASS, gates, scope, warnings, and unchanged readiness; then finalize only agent-created browser tabs while preserving the owner's Vercel and Supabase admin sessions. Deploy PASS must auto-advance to PM for the next highest-leverage funeral-home operating slice rather than imply pilot or production readiness.

### Cycle 8 PM Sprint Brief - task-bound Case Room proof loop - 2026-07-18 13:57 -07:00

Prior closeout and role transition:

- Cycle 7A/7B closed at commit `6847076fd194aeaf4fde416ab34ccb0cf2f16e8d`; Vercel deployment `dpl_2Cm33okhvZumAJWzTGC1uUGKXvY8` is correctly `CANCELED` by `[skip deploy]`. Draft PR #24 now records independent QA **PASS**, Deploy **PASS**, exact hosted evidence, unchanged readiness, and Production separation.
- Product Manager `/root/pm_cycle7a_reverify` auto-advanced after Deploy PASS and received the owner's direction to make the next chunk impactful. PM selected **Cycle 8: Task-bound Case Room Proof Loop** as the highest-leverage two-day slice. UX Review `/root/ux_cycle8_proof_loop` is **IN PROGRESS**. Engineering/Data is **PREFLIGHT ONLY** until UX returns its acceptance bar; no Cycle 8 source, migration, fixture, isolated-hosted state, or deployment has changed.

Sprint goal and user problem:

- Within two focused days, an independently authenticated, currently assigned staff member can open one bounded commitment, submit immutable structured proof, and recover the same truth after reload; an authorized director can verify that proof or request a replacement; both personas see one durable correction/event history without cross-location or cross-organization leakage.
- Cycle 7B currently stops after `Start work`. The employee cannot record what happened or hand responsibility back, and the director cannot accept/reject an outcome. Passage therefore cannot yet answer what happened, who proved it, who can see it, whether it was accepted, and what happens next.

Requirements and components:

1. Reachable `/staff/work/[taskId]`: viewer-relative Now summary, task facts, one proof action, prior proof/review history, and no director controls; link from `/staff`.
2. Smallest consistent linked director case/task proof surface, preferably `/director/cases/[workflowId]`: owner/waiting/due state, proof queue, verify/request-replacement action, chronological proof/event history; link from `/director`.
3. Stable Case Room vocabulary may expose `Now`, `Tasks`, and `Proof`. No fake Updates/chat surface; durable task-bound Updates remain queued.
4. Add immutable `task_proofs` and append-only `task_proof_reviews`. Proof includes server-derived organization/workflow/task/submitter/time/audience, structured outcome, optional non-secret reference, request identity, and optional `supersedes_proof_id`. Replacement creates a new row; no client updates/deletes prior proof or review.
5. Add checked, versioned, idempotent submit/review commands in the existing private-command/public-wrapper pattern. Staff submit requires exact active assignment, location grant, and `in_progress`; director review requires managed organization/location. Same-key replay returns the original receipt; conflicting payload or stale version fails without partial state.
6. State/event spine: submit `in_progress -> proof_submitted` with `task.proof_submitted`; verify `proof_submitted -> completed` with `task.proof_verified`; replacement request `proof_submitted -> in_progress` with `task.proof_replacement_requested`. Server derives actor, scope, time, audience, next owner/action, and event identity.
7. Failure/recovery: pending controls disable safely; stale/conflict directs reload; changed assignment/revoked authority closes the action; replacement reason and prior proof remain visible; failure states say nothing changed; no optimistic success.
8. Staff sees only current assigned task/proof scope; director sees only managed locations; family and vendors see none. Workspace selection remains presentation-only.

Documentation-first migration gate:

- **What:** additive isolated migration for proof/review tables, proof lifecycle task status, FKs/indexes/unique command identity, narrow SELECT RLS, no client writes, checked RPC wrappers, append-only protection, and the three event types.
- **Why:** the frontend must save and review the same durable proof it claims; Cycle 7B ends at `in_progress`.
- **Breakage if skipped:** completion becomes a visual claim, retries can duplicate proof, directors cannot accept/reject, and correction history cannot be trusted.
- **Risk/recovery:** preserve the current three-task/eight-event baseline; use migration tooling only on isolated `uyacxqtsiwlvtmhxvoxr`; prohibit Production. Stop on unsafe task-status constraints, RLS recursion/BOLA, public/default function execution, schema drift, duplicate replay, cross-tenant visibility, or inability to establish a real active staff session. Reversal may remove only Cycle 8 objects after dependency checks; fixture cleanup remains DML-only.

Frontend/backend contract matrix:

| Persona action | Reachable UI | Durable/authorized contract | Proof/recovery |
| --- | --- | --- | --- |
| Staff reads task/proof history | `/staff/work/[taskId]` | Task/workflow/proof/review/event SELECT under exact assignment + active location | read-only reload truth; denied state reveals no case |
| Staff submits/replaces proof | staff proof form + Server Action | idempotent submit RPC; immutable proof + task status/version | one submit event; replay stable; stale/former/revoked/cross-task denied |
| Director reviews proof | linked director case/task proof panel + Server Action | idempotent review RPC; append-only review + task status/version | verified or replacement event; replay stable; wrong scope/conflict denied |
| Director/staff read history | proof panels + Activity | exact proof/review/event cardinality under existing scope | prior bodies/reviews immutable; family/vendor projection absent |

Acceptance and QA/deploy plan:

- From a recorded Cycle 7B baseline, establish one controlled active synthetic staff identity without erasing retained evidence. Prove assignment/start, one submit + replay, director reload + verify to completed, and a separate replacement/re-submit/verify chain whose prior proof remains immutable.
- Prove one proof/review/event per unique successful command and zero rows/events/partial task change for wrong organization, wrong location, unassigned, former, revoked, staff-direct-review, cross-task proof/supersedes, stale, conflicting replay, and direct insert/update/delete attempts.
- Two isolated browser sessions must show owner, waiting party, audience, proof destination, next action, server time, and reload truth with no family/vendor leakage. At 1440/390/360: no overflow, controls at least 48px, visible focus, semantic pending/status/error, and no console/hydration/runtime error.
- Required gates: parity ledger/checker; Server Action exports; TypeScript; optimized build; runtime/route/deploy; rollback-only SQL/RLS matrix; Supabase advisors; Vercel logs; timestamped screenshots and redacted database/event evidence. One coherent non-production Preview only after independent predeploy QA PASS under the normal gate; no verification exception or deploy chain.

Dependencies, non-goals, risks, and readiness effect:

- Dependencies: current PASS head/PR, canonical exact-branch Preview configuration, isolated lab, existing workflow/task/member/RLS/event spine, migration tooling, two browser contexts, and a controlled active staff user. The original hosted staff is revoked and the alternate lacks an Auth identity, so Engineering must solve this synthetic dependency truthfully rather than hand-wave it.
- Explicit non-goals: generic chat/Updates composer, realtime, notifications/outbox/external send, Storage/file upload, family-safe proof, D2C/participants, durable intake/Transfer Pass, vendors, integrations, demo reset, Production, pricing/billing, and legal/privacy/security claims.
- Full PASS deepens the synthetic non-production functional beta and creates the first complete assigned-work-to-verified-outcome loop. It is not an allowlisted pilot and not Production. Funeral home remains reported at **94% guided / 40% operational** until PM separately reconciles completed M2 evidence with the canonical roadmap; D2C remains **85% guided / 25% operational**.
- No owner gate applies to additive isolated migration, synthetic identity, QA, docs, or one normal QA-approved non-production Preview. Stop for Production, real communications, paid services, irreversible data loss, pricing, or material legal/privacy/security claims.

Exact next role target: UX Review returns the Case Room interaction/accessibility acceptance bar. Engineering then completes source/schema preflight and the what/why/breakage migration candidate; independent SQL QA reviews it before any isolated migration is applied.

Cycle 8 UX and Engineering live handoff:

- UX Review `/root/ux_cycle8_proof_loop`: **PASS for Engineering start**. The fixed experience order is Back -> case/location boundary -> Now -> task facts -> proof action/receipt -> immutable history. Staff copy distinguishes proof submission from completion; director copy distinguishes verify from request replacement; earlier proof never disappears. The approved director route is `/director/cases/[workflowId]`, with task query/anchor presentation-only. Pending, identical replay, stale reload, recoverable failure, denied/revoked/former, cross-task, empty, completed, and durable reload states are mandatory. At 1440 use a restrained dominant-action/supporting-facts composition; at 390/360 use one column with full-width actions and vertical history. Native semantics, announced status/error, visible focus, 48px controls, and no fake Updates/chat are FIX NOW.
- Engineering created the documentation-first additive migration candidate `supabase/migrations/20260718210000_cycle_8_task_proof_loop.sql`, added proof/review types and optional hosted queries, reachable staff/director Case Room routes, structured staff submission and director review Server Actions/forms, immutable history projections, responsive proof-loop styling, and links from current work surfaces. TypeScript passes on the uncommitted candidate.
- Independent SQL QA `/root/qa_cycle8_sql` returned **FAIL / DO NOT APPLY** on the first migration draft. It approved the core transaction model but required a stronger isolated-baseline guard, rollback-only Cycle 8 regression, privileged-insert semantic integrity, database anti-branching, a lab-bound append-only reset escape, null normalization, advisor indexes, and explicit proof-pending reassignment behavior.
- Engineering has corrected the candidate guard to require the exact synthetic organization/location plus 2 workflows, 3 tasks, 8 events, and `NS-2051`; added catalog-collision refusal, active staff/director/location checks in integrity triggers, one-replacement-per-prior uniqueness, missing FK indexes, a postgres + exact-project + exact-sentinel reset boundary, explicit null validation, proof-destination validation, and a proof-pending reassignment guard. These corrections are source-only and have not yet been independently re-reviewed.
- Current QA state remains **FAIL/PARTIAL**, not release-ready: the complete rollback-only Cycle 8 SQL/RLS/race/reversibility matrix still must be authored and passed before any migration application. No Cycle 8 DDL or DML has touched isolated Supabase, no Preview was created, and Production remains untouched.

Exact next action: Engineering authors the rollback-only Cycle 8 matrix covering preflight/catalog/ACL, submit/review/replacement/replay/conflict/stale/atomicity, supersession, BOLA projections, races, append-only checksums, proof-pending reassignment, cleanup, and advisor expectations. Independent SQL QA then re-reviews both files. Only PASS may authorize applying the additive migration to `uyacxqtsiwlvtmhxvoxr`.

### Owner-requested governance, roadmap, reliability, and plain-language correction - 2026-07-18 14:45 -07:00

Owner request and confirmed audit:

- The owner required the repository learn from and prevent recurrence of four draft PRs with zero founder approvals, self-graded release evidence, a stale red required check, direct-main agent collisions, live hydration failures, contradictory Demo/hosted language, internal persona copy, and roadmap drift.
- GitHub evidence confirmed PRs #17, #19, #23, and #24 were draft with zero submitted reviews. PR #17's release-train job failed because `## Product Manager scope` did not exactly match `## Product Manager Scope`. Main history confirmed two release commits 2 minutes 49 seconds apart.
- Live browser QA confirmed React hydration errors `#425`, `#418`, and `#423` on `/pricing`, `/resources`, `/guides`, `/care-providers`, `/trust`, and `/mission`. This is one P1 Threshold/main maintenance incident; it is not Passage Zero progress and has not been fixed in this dirty greenfield worktree.
- Greenfield browser/source QA confirmed mixed `BROWSER SANDBOX` and database-authority claims, internal terms, raw event names/states, UUID activity targets, fixture/cycle language, and ambiguous consequential buttons. The intermittent reported 30-second `/director` freeze did not reproduce: one direct load was 3.1 seconds and one in-preview navigation was 0.35 seconds with no fresh console errors. It remains a P1 watch item requiring timing/query instrumentation.

Role instances and decisions:

- Product Manager `/root/pm_governance_consolidation`: **COMPLETE**. Passage Zero/PR #24 is the sole feature lane; Threshold/main is reviewed P0/P1 maintenance only. Direct-main agent/schedule pushes, silent red CI, self-review, overlapping greenfield merges, and architecture narration are FIX NOW. Readiness remains funeral home **94% guided / 40% operational** and D2C **85% guided / 25% operational**.
- UX Review `/root/ux_plain_language_audit`: current preview **FAIL for release / PASS for Engineering start**. Every page must answer where the user is, what needs attention, what to do, what happens next, what is saved, who can see it, and recovery. Browser-only Demo and Secure Preview require distinct truthful labels. Raw enums, UUIDs, internal architecture, fixture/cycle/QA/deploy language, and raw backend errors are prohibited.
- Documentation/Engineering `/root/engineering_governance_docs`: **COMPLETE**. It updated `AGENTS.md`, `docs/release-train.md`, the canonical roadmap, cutover plan, persona architecture, and new `docs/product/release-governance-and-plain-language-policy.md` without changing Cycle 8 implementation.
- Engineering `/root`: implemented greenfield release-train controls and the first reachable-copy correction. New PR structure distinguishes drafts from merge-ready evidence, serializes same-target release-train runs, requires context, and blocks the confirmed persona vocabulary regressions. It replaced the mixed environment language, internal director/staff/team/activity copy, UUID activity fallback, and ambiguous browser-only Demo actions on the sampled routes. The original non-author `User` review inference recorded here was later rejected by the dedicated reviewer and superseded by the owner-approved Bot-author/founder-review model below. Direct-main prevention belongs to required GitHub branch rules; a post-push workflow cannot prevent a push.
- Independent QA `/root/qa_governance_language`: first returned **PARTIAL/FAIL** because the scanner missed raw enum rendering, historical Threshold language remained executable-sounding, the roadmap reintroduced two-initiative framing, the reviewer check lacked account-type/current-head proof, and candidate-head checkers were tamperable. PM re-scoped FIX NOW; Engineering added explicit human maps and regression fixtures, archived the historical directives, corrected the one-lane roadmap, required current-head `User` approval, and added a trusted base-branch immutable governance workflow. QA re-review is **PASS** for the bounded governance/roadmap/plain-language source slice and authorizes one `[skip deploy]` commit only. It does not authorize Preview, Production, `[qa-approved]`, Cycle 8 migration, or PR #24 merge.

Files and contract changes:

- Governance/docs: `AGENTS.md`, `docs/release-train.md`, `docs/product/operational-readiness-roadmap.md`, `docs/product/passage-zero-cutover-plan.md`, `docs/product/persona-action-architecture.md`, `docs/product/release-governance-and-plain-language-policy.md`, and this context.
- Enforceable repo controls: `.github/workflows/agent-release-train.yml`, `.github/workflows/governance-integrity.yml`, `.github/pull_request_template.md`, `scripts/check-agent-context.js`, `scripts/check-release-train.js`, `scripts/check-persona-language.js`, `scripts/test-release-governance.js`, and `package.json` scripts. The rejected custom review-identity inference script is removed by the solo-founder correction below.
- Plain-language source: gateway/environment shell, family intent/pass action, receive Preview flow, director intake, hosted director/team/activity, staff landing, invitation entry/creation, and operational access boundary. Existing Cycle 8 proof-loop files remain dirty and uncommitted; no migration was applied.
- Repository branch protection/rules must require Bot-authored pull requests after bootstrap, current-head checks, Independent Agent Review, founder approval, stale-approval dismissal, resolved conversations, restricted bypass, and blocked force-push/deletion. The protected Production environment separately requires founder authorization. These external controls remain explicit gates, not source-file claims.

Verification completed before independent QA:

- Historical test result: `test:release-governance` passed the then-current draft and review-inference fixtures. The dedicated reviewer later rejected the identity inference; the solo-founder correction below replaces those fixtures with separate agent-review, founder-review, and Production-authorization states.
- `test:persona-language`: PASS against current reachable TSX/JSX sources.
- Frontend/backend parity and Server Action exports: PASS, 11/11 parity and 10 prohibited export fixtures rejected.
- TypeScript: PASS.
- Deploy gate, runtime configuration, and operational route gate: PASS.
- Optimized Next.js build: PASS; all current routes compiled and page data generated.
- No browser or hosted PASS is claimed for these uncommitted copy changes. No Preview or Production deployment was created. Production Supabase and Vercel configuration remain untouched.

PR, deployment, and next-role disposition:

- PR #24 remains the draft integration umbrella. It must gain bounded review packets for identity/authority, data/RLS, director/staff operations, Transfer Pass/family boundaries, and responsive UX. Its final cutover vehicle must be Bot-authored, pass Independent Agent Review, and receive founder review before leaving draft status for merge consideration.
- PR #17 must have its exact heading corrected or be closed with the failure root cause recorded; #17/#19/#23 require diff-based incorporated/unique/superseded disposition against #24. No competing architecture merges independently.
- Governance and roadmap changes are `[skip deploy]`. The six-route Production hydration repair requires a separate clean Bot-authored main-based hotfix PR, exact-head Independent Agent Review, founder review, protected-environment Production authorization, all-route responsive/hydration/runtime evidence, and post-deploy verification.
- Cycle 8 remains source-only QA FAIL/PARTIAL. Its migration is not applied and no Cycle 8 deployment is authorized.
- Historical next-role note, now superseded: Deploy verified the `[skip deploy]` governance commit canceled. The remaining governance work is the PR #25 bootstrap, dedicated Bot identity, live rules, founder review, protected Production environment, PR dispositions, the clean-main hydration hotfix, and hosted 1440/390/360 copy QA.

### Governance bootstrap adversarial correction - 2026-07-18 15:38 -07:00

- Governance source commit `14b30029593c92e99aeeab2c6490b8af3f6b0912` was pushed to draft PR #24 with `[skip deploy]`. Distinct Deploy verification confirmed Vercel deployment `dpl_FtSrgEL2Ma6LTfxLWfh76E8p9ZRN` canceled before build and Production remained unchanged.
- A narrow main-based draft PR #25 was opened to bootstrap the controls without merging Passage Zero product code. Independent QA failed its first head `61f7a32bacddef48a86c0a72c7bdd5db546952aa`: API-created files had dirty endings; a push workflow falsely classified legitimate PR merges as direct pushes; and candidate-controlled code received a persisted/read token.
- Product Manager re-scoped all three issues FIX NOW. The corrected head `657f21e9c175adac983261eadd3a4a72ecd1c350` removed the push event and candidate credentials. Its custom review-identity inference was subsequently rejected by the dedicated reviewer and is superseded below.
- Independent QA `/root/qa_governance_language` passed the bounded source/trust checks on exact PR #25 head `657f21e9c175adac983261eadd3a4a72ecd1c350`. A later dedicated adversarial reviewer found the `User`-type identity assumption and 100-review pagination unsafe, so that head is **FAIL / not merge-ready** under the current owner-approved model.
- Distinct Deploy `/root/deploy_cycle7a_reverify`: **PASS for suppression / NO DEPLOYMENT**. Vercel canceled all three PR #25 commits; exact-head event `dpl_HJ1BKfCbLpDr3EmVYt4xndHXnz7i` stopped at the Ignored Build Step with no Preview artifact. Production still resolves to `dpl_3rAyuahrHAqcoH5KJLykL6mR2JSR` at main commit `3d881fde684fcc8cfdf5a828d2df87366364175a`.
- The hardened workflow correction is now mirrored into PR #24 source so the umbrella cannot reintroduce the rejected trust-boundary design.
- PR #25 remains open, draft, and unmerged. Direct-main protection is incomplete until the corrected governance-only bootstrap passes exact-head Independent Agent Review, receives the founder's explicit one-time bootstrap attestation, merges without deployment, and Phase B installs the Bot identity and live rules.
- Cycle 8 remains FAIL/PARTIAL and uncommitted. No migration was applied. PR #25 and Production remain blocked while the solo-founder governance correction below is reviewed and externally activated.

### Owner-approved solo-founder Bot-author governance correction - 2026-07-18 16:42 -07:00

Owner decision:

- The owner confirmed there is no second human reviewer and explicitly approved correcting the Markdown to an honest solo-founder model. Agents and schedules must author through a dedicated Passage GitHub App/Bot identity after bootstrap. The founder is the sole human reviewer of Bot-authored pull requests. Independent Agent Review is a separately named technical check, never founder or human approval. Production additionally requires the founder's authorization through the protected Production environment or release gate for the exact commit.

PM Sprint Brief and UX handoff:

- Product Manager `/root/pm_governance_consolidation`: **COMPLETE / ENGINEERING AUTHORIZED**. Remove all custom review enumeration and human/material-implementer inference, preserve read-only candidate CI and trusted-base structural checking, update every governing document and PR field, and keep PR #25 blocked during correction. The bootstrap is two-phase because the immutable workflow and Bot identity are not yet live on `main`.
- UX/Policy Language Review `/root/ux_solo_founder_governance`: rendered-product UX **N/A**; policy-language acceptance **PASS for Engineering start**. Required terms are Agent author, Independent Agent Review, Founder Review, and Founder Production Authorization. Merge approval and Production authorization must remain visibly distinct.

Dedicated reviewer failure that triggered the correction:

- Independent reviewer `/root/independent_pr25_reviewer` reviewed PR #25 exact head `657f21e9c175adac983261eadd3a4a72ecd1c350` and returned **FAIL / not merge-ready**. The custom logic could not distinguish a human from a machine-operated `User`, did not exclude material implementers, read only the first 100 reviews, and could not prove a workflow/ruleset that was not yet on base `main`. PR #25 was also draft with no founder approval and no Deploy approval.

Engineering scope in progress:

- Update `AGENTS.md`, release train, governance policy, roadmap, cutover plan, PR template, release checker, governance tests, trusted workflow, and this context to the approved model.
- Delete `scripts/check-independent-review.js`; native branch protection, not custom GitHub-account inference, enforces founder review.
- The trusted `pull_request_target` workflow becomes base-defined structure validation only: no push trigger, Reviews API, PR-head checkout, candidate execution, dependency installation, persisted credentials, secrets, or write permission.
- Preserve all dirty Cycle 8 application, route, hosted-query, CSS, and migration work as unstaged and unmodified by this governance commit. No Supabase or Vercel Production change is authorized.

Bootstrap and external enforcement contract:

1. Phase A uses only checks currently available on `main` to review the governance-only bootstrap. PR #25 remains `[skip deploy]` and draft until exact-head agent QA passes and the founder records a one-time bootstrap attestation. Direct/force-push prevention is not yet proven and cannot be claimed until the external Phase B rules are enabled and tested.
2. The exception expires when PR #25 is merged or closed and may never be reused. It is not independent review and grants no deployment approval.
3. Phase B installs the dedicated Bot identity, requires Bot-authored pull requests, current-head checks, Independent Agent Review, founder approval with stale dismissal, resolved conversations, restricted bypass, no force-push/deletion, and a protected Production environment requiring founder authorization.
4. A harmless Bot-authored validation PR must prove the complete model before product or Production work relies on it.

Readiness remains unchanged: funeral home **94% guided / 40% operational**; D2C **85% guided / 25% operational**. Governance correction is a release prerequisite, not product-readiness progress. Cycle 8 remains FAIL/PARTIAL; no migration or deployment is authorized.

Exact next role: Engineering completes the bounded source/doc correction and deterministic conflict/tests. A distinct Independent Agent Reviewer then reviews the exact diff. Independent QA must still verify the live Phase A/Phase B rules, Bot/founder separation, stale approval behavior, bypass denial, and protected Production authorization before Deploy can PASS governance.

### Cycle 8 SQL/RLS hardening - Development Engineer handoff - 2026-07-19

- Development Engineer `/root/engineering_cycle8_sql_hardening`: **SOURCE HARDENING COMPLETE / QA REQUIRED**. Prior handoff received: Cycle 8 PM Sprint Brief COMPLETE, UX PASS for Engineering start, and independent SQL QA FAIL/DO NOT APPLY on the first proof-loop migration candidate. This role inspected every current uncommitted Cycle 8 application, route, hosted-query, CSS, and migration file before changing only the migration and this context. The parallel rollback-only test matrix is assigned to a separate Engineering test specialist; there is no overlap with that file.
- `supabase/migrations/20260718210000_cycle_8_task_proof_loop.sql` now fails before DDL unless the isolated-lab-only self-authority migration and both reviewed Cycle 7B migrations exist and the complete retained synthetic manifest matches exactly: one organization/location, two workflows, three tasks, eight events, two invitations/location rows, two active plus one revoked membership, two active grants, the reserved workflow/task IDs, and `NS-2051`. This is a machine-checked lab/baseline sentinel; a caller-supplied project label alone is not treated as authority.
- Database integrity now enforces command semantics even for privileged ordinary inserts: the authenticated actor must match the proof/review actor, membership and location authority must be active, proof submit requires the current assignee plus `in_progress` and exact task version/destination/audience, review requires the latest unreviewed proof plus `proof_submitted` and exact version, and replacement proof requires the latest proof's recorded `needs_replacement` review.
- Proof-chain branching is prevented in the database by one root proof per task plus one direct replacement per prior proof. The existing append-only chain and checked commands remain the only normal write path.
- The proof/review and inherited workflow-event reset escape is now DELETE-only and requires a postgres session, exact isolated project/reset settings, exact retained organization/workflow/task IDs, and (for events) one of the three Cycle 8 proof event names. UPDATE remains prohibited even during cleanup, and the escape cannot delete retained invitation/member or prior Cycle 7B events.
- Research grounding: current Supabase RLS guidance still requires RLS on exposed tables, explicit role/grant separation, indexed policy columns, user-relative authorization rather than `TO authenticated` alone, and fixed/private security-definer helpers; the April 28, 2026 Data API change makes explicit grants intentional. PostgreSQL 18 guidance confirms cross-row invariants belong in UNIQUE/FK/trigger enforcement, referencing FK columns need explicit indexes, and transactions should acquire short, consistently ordered locks. These findings drove database uniqueness, trigger integrity, least privilege, and the retained task-row-first lock sequence.
- Source-only verification completed: targeted catalog/text inspection confirms the new sentinel, root/replacement uniqueness, semantic trigger predicates, exact-project DELETE-only reset boundary, fixed empty function `search_path`, RLS SELECT-only policy shape, and explicit authenticated wrapper grants. No SQL was executed and no Supabase project, Vercel setting/deployment, readiness score, family/vendor boundary, or Production resource changed.
- QA status remains **FAIL/PARTIAL** until the separate rollback-only Cycle 8 matrix is complete and independent SQL QA passes both artifacts. Required pending proof: preflight/catalog/ACL; submit/review/replacement/replay/conflict/stale/atomicity; root/replacement race uniqueness; wrong-organization/location/unassigned/former/revoked and staff-review denials; append-only checksums and reset-boundary denial; proof-pending reassignment; rollback cleanup/reversibility; missing-index/advisor expectations. Only independent PASS may authorize migration application to isolated project `uyacxqtsiwlvtmhxvoxr`. Production `qsveqfchwylsbncsfgxe` remains prohibited.

### Cycle 8 isolated migration application - Deploy/Evidence handoff - 2026-07-19 13:42 -07:00

- Deploy/Evidence Agent `/root/deploy_cycle7a_reverify`: **ISOLATED SQL GATE PASS / RELEASE PARTIAL**. Prior handoff received: the Cycle 8 PM Sprint Brief was complete, UX had passed Engineering start, Engineering had completed source hardening, and independent SQL QA passed the exact reviewed migration and rollback-test hashes and authorized isolated application. A later PM recovery message saying no migration application was authorized was issued without the completed SQL-gate result; it is superseded for this isolated SQL step by the earlier exact-hash SQL QA authorization, while remaining controlling for the still-pending application/UI Deploy gate.
- Target preflight identified only isolated project `uyacxqtsiwlvtmhxvoxr`, `ACTIVE_HEALTHY`, PostgreSQL 17. The exact retained baseline was one organization, one location, two workflows, three tasks, eight workflow events, two invitations, two invitation-location rows, two active plus one revoked organization member, and two active member-location grants.
- Exact reviewed migration `supabase/migrations/20260718210000_cycle_8_task_proof_loop.sql`, SHA-256 `CA860B7D3590B88FDB5D4E02CB502A9A3642B38FAE602CA25CCFC7AFBCBFA408`, was applied through migration tooling as version `20260719203647`. Exact rollback matrix `supabase/tests/cycle_8_task_proof_loop.sql`, SHA-256 `06880BE16B29006AA182D2D9EFE789D84110D8744E494F31E448CF2793E7FE62`, executed without error inside its transaction and rolled back.
- Postchecks found zero task proofs and zero proof reviews, both submit/review RPCs present, and every retained baseline count unchanged. The security advisor returned only the existing leaked-password-protection warning. The performance advisor returned INFO-level unused-index notices, including the new empty-table indexes, with no missing-index or RLS error.
- Durable/recovery evidence: the rollback matrix covered catalog/ACL/RLS, submit/review/replacement, replay/conflict/stale atomicity, wrong-organization/location/unassigned/former/revoked/staff-review denial, anti-branching, append-only checksums, proof-pending reassignment, and exact isolated cleanup. It left no proof/review rows. Redacted evidence is recorded in `docs/evidence/cycle-8-proof-loop/2026-07-19T13-42-25-0700-isolated-application-redacted-evidence.md`.
- Files changed by this role: the timestamped redacted evidence file and this context only. No application code, SQL, migration, fixture, environment, branch, PR, or deployment state was changed by this role. No Claude-in-Chrome or other external-agent assistance was used.
- QA/deploy status remains **PARTIAL**, not `[qa-approved]`: this proves only the isolated database application and rollback gate. No Vercel deployment was created, Production project `qsveqfchwylsbncsfgxe` and Production Vercel configuration were untouched, and application/browser QA at 1440, 390, and 360 remains pending. Funeral home remains **94% guided / 40% operational** and D2C remains **85% guided / 25% operational**.
- Queued but not deployed: reachable staff submission and director review integration, durable hosted reload proof, responsive/accessibility checks, console/hydration/runtime checks, full parity/export/TypeScript/build/route/deploy gates, Vercel logs, and exact-head independent QA. Auto-advance returns this Deploy PARTIAL handoff to PM/Engineering for the application/browser slice, then independent QA, then Deploy re-entry. Do not create a Preview or add `[qa-approved]` until that evidence passes.

### Cycle 8 application source QA - Deploy-prep handoff - 2026-07-19 14:19 -07:00

- Deploy-prep Agent `/root/deploy_cycle7a_reverify`: **SOURCE QA PASS / HOSTED RELEASE PARTIAL**. Earlier independent application QA rounds failed actionable defects; Engineering corrected each reported issue, and the final focused re-review passed the bounded Cycle 8 application source. The persona-language gate, frontend/backend parity **15/15**, Server Action export checks, TypeScript, optimized build, runtime configuration, operational route, and deploy-gate checks all pass. The separately recorded isolated SQL/RLS/application gate already passes.
- This exact combination authorizes preparation of a bounded Bot-authored source packet and one truthful non-production Preview/browser QA run only. It does not establish hosted behavior, permit `[qa-approved]`, authorize Production, or change the overall **PARTIAL** release status. Production Supabase project `qsveqfchwylsbncsfgxe` and Production Vercel configuration remain untouched.
- Exact next Deploy target: publish the bounded Bot-authored source packet to a non-production Preview, then verify the reachable director/staff proof loop at 1440, 390, and 360 for seven-question comprehension, responsive/accessibility behavior, clean console/hydration/runtime logs, and durable submit/review/replacement/replay state after reload. Only that hosted evidence can return to independent QA and Deploy for a later status decision.

### Cycle 8 stacked PR publication and CI classification - Deploy handoff - 2026-07-19 14:28 -07:00

- Bot-authored draft stacked PR #30 was published against base `fcf2150...` at original source head `5303892...`, containing exactly 25 files. Vercel event `dpl_JCN...` was **CANCELED** by the expected `[skip deploy]` gate; no Preview was created and Production remained untouched.
- Candidate governance failed before any product gate solely because the base-branch checker still required the legacy `## QA Handoff` heading while the PR body used the new `## Independent QA` heading. The PR body was corrected without changing source or head to retain the truthful new section and add the required legacy headings plus release-loop Cycle 1. A context-only Bot-authored `[skip deploy]` follow-up is the next publication action to retrigger checks.
- Status remains **PARTIAL**: no `[qa-approved]`, no hosted Preview PASS, and no Production authorization. After governance and product checks pass on the follow-up head, the next Deploy target remains one truthful non-production Preview followed by 1440/390/360 comprehension, runtime, accessibility, and durable-reload QA.

### PR #30 candidate-check dependency correction - CI handoff - 2026-07-19 14:42 -07:00

- PR #30 head `9009...` failed the candidate check before product gates because that job did not install dependencies while the checker required `typescript`. Product Manager classified the mismatch **FIX NOW**.
- Engineering extracted the shared, dependency-free member-identity implementation into `member-identity.js` with a matching `.d.ts`; the TypeScript wrapper now delegates to it, and the checker exercises the real helper using Node built-ins only. Independent focused QA passed the correction and authorized a Bot-authored follow-up. Persona language, parity **15/15**, Server Actions, TypeScript, optimized build, runtime, route, deploy, and focused checker gates all pass.
- Overall status remains **PARTIAL**. The Bot follow-up is authorized only to retrigger PR checks; no Preview exists, `[qa-approved]` is not authorized, and Production Supabase/Vercel remain untouched.

### Cycle 8 bound Preview and active-staff identity recovery - 2026-07-19 19:50 -07:00

Release decision: **SOURCE/SQL/SETUP PASS; HOSTED BROWSER PARTIAL**. No `[qa-approved]`, merge, Production authorization, readiness increase, or responsive hosted PASS is claimed.

Role instances and handoffs:

- Product Manager `/root/pm_cycle8_hosted_recovery`: **COMPLETE**. It received the Cycle 8 source/SQL PASS and replacement-Preview handoff, classified the QA-branch binding and controlled active-staff identity as FIX NOW, stopped an unsafe first identity assumption when the accepted invitation was proven to belong to the retained revoked member, then authorized a separate generated Auth identity bound to the existing active alternate through reviewed DML. After supported browser paths failed, PM classified the remaining gap as an external tool/access blocker and authorized this bounded PARTIAL closeout. The Cycle 8 Sprint Brief, requirements, frontend/backend parity contract, non-goals, risks, QA plan, and Deploy plan remain controlling.
- UI/UX Review `/root/ux_cycle8_proof_loop`: the existing **PASS for Engineering start** acceptance bar remains controlling; UX Review was N/A for the isolated identity/configuration mechanics because no rendered source or copy changed. Hosted comprehension, accessibility, overflow, focus, and recovery evidence at 1440/390/360 remains unproven.
- Platform/Deploy `/root/deploy_cycle8_preview` and `/root/platform_cycle8_branch_binding`: **ARTIFACT/BINDING PASS; HOSTED RELEASE PARTIAL**. The first throwaway deployment `dpl_5mTD8H7HMQuYMAmymumJ7p2UujVX` proved exact source plus one gate-only commit but could not prove inherited isolated variables. Platform therefore added ten new Sensitive, Preview-only records scoped exactly to `bot/cycle-8-preview-qa`; it did not edit or remove the existing `greenfield/passage-zero` records or any repository-wide/Production record. One corrective replacement deployment `dpl_BpB5P1zqK4FtNBBo7E2yMhbYjZ4P` is READY, `target: null`, on `bot/cycle-8-preview-qa@e62002e5601f7e06a1645e29a4d9da2476f714df`. The exact QA head is one gate-removal commit above source `e1032e557a57737fbdb0606d648a533251e07d83`. Build completed in 26 seconds with no build error; deployment-scoped warning/error/fatal runtime logs were empty. Production remains unchanged.
- Data/Auth Engineering `/root/engineering_cycle8_staff_identity` and `/root/data_auth_cycle8_staff`: **SOURCE AND ISOLATED APPLICATION PASS / SESSION HANDOFF PARTIAL**. Engineering added the guarded active-staff identity fixture, hardened Cycle 7B replay so it cannot clear an established binding, and added a rollback-only regression matrix. After independent SQL QA PASS, Auth Admin created exactly one confirmed synthetic user in isolated project `uyacxqtsiwlvtmhxvoxr` without invitation, email, or SMS delivery. The reviewed DML fixture bound that generated Auth UUID to the existing active alternate membership; same-ID replay was a no-op. No direct Auth-schema SQL, new public membership/grant, invitation rewrite, revoked-user reactivation, or product Activity event occurred. A Passage staff browser session was not established because protected Preview navigation never completed.
- Independent SQL QA `/root/qa_cycle8_staff_identity_sql`: **PASS** on exact hashes and isolated rollback execution. `supabase/test-fixtures/cycle_8_hosted_active_staff_identity.sql` SHA-256 `99D12A634F286E2379D66C250F2DDC6E8FC50EFB7E084FBAF56A8FDB701802E3`; `supabase/test-fixtures/cycle_7b_hosted_workload.sql` SHA-256 `DAB472A071104615C4FBFD65ED325515D395C3DCE56E6084784EA20435210C79`; `supabase/tests/cycle_8_hosted_active_staff_identity.sql` SHA-256 `17D22A8306560FD91EC7948BA8872F1A98DB2E98134D79041B7BEFC9ECD32268`. The rollback-only matrix covered wrong project/Production, missing/wrong/colliding Auth identity, first bind, replay, different-ID conflict, one-row atomicity, digests, cleanup, and terminal ROLLBACK. Its pre/post retained digest matched exactly.
- Hosted QA `/root/qa_cycle8_hosted`: **PARTIAL / NO HOSTED VERDICT**. Clean agent-browser/profile/share attempts were redirected to Vercel login. The already signed-in browser connector repeatedly stalled during its own authorization handshake. No staff Passage login was submitted; no proof/review mutation, replay, reload, denial matrix, viewport inspection, console/hydration check, accessibility pass, or screenshot occurred. This is not a product FAIL and cannot be promoted to PASS.
- Deploy/Evidence `/root/evidence_cycle8_identity_preview`: **COMPLETE**. Redacted setup/deployment evidence is `docs/evidence/cycle-8-proof-loop/2026-07-19T19-48-50-0700-preview-partial-redacted-evidence.md`. It excludes passwords, email addresses, Auth UUIDs, publishable keys, cookies, share tokens, and raw database output. No Claude-in-Chrome assistance was used.

Durable isolated truth after binding:

- One organization, one location, two active plus one revoked membership, two active location grants, two invitations, two invitation-location rows, two workflows, three tasks, eight retained workflow events, zero task proofs, and zero proof reviews.
- Both active members are Auth-linked; the revoked member remains revoked and Auth-linked. The accepted invitation and its acceptance/revocation chain remain attached to the revoked historical identity. The active alternate owns all three reserved tasks and is linked exactly once. The retained public digest and every public row count were unchanged by first bind and replay.
- Production Supabase `qsveqfchwylsbncsfgxe`, Production Vercel configuration/deployment, family access, vendor fulfillment, pricing, and readiness scores were untouched. Funeral home remains **94% guided / 40% operational** and D2C remains **85% guided / 25% operational**.

Source, PR, and Deploy disposition:

- PR #30 remains a Bot-authored draft. Its reviewed application head `e1032e557a57737fbdb0606d648a533251e07d83` already has exact-head source QA and dedicated merge-review checks, but those checks become stale when this closeout packet is published. The next authorized publication is one Bot-authored `[skip deploy]` commit containing only the three reviewed SQL artifacts, the redacted evidence file, this context, and the canonical-roadmap evidence wording. Generated build state, browser profiles, temporary helpers, credentials, environment values, and screenshots are excluded.
- Before publication, normalize and inspect the exact diff; rerun the focused identity SQL/static checks and all applicable deterministic release gates. After publication, wait for and classify every current-head check, then emit new exact-head Independent QA and dedicated Merge Review checks. Those roles may pass the bounded source/setup/evidence packet while explicitly withholding hosted QA and Production authorization.
- Freeze `bot/cycle-8-preview-qa` at `e62002e5601f7e06a1645e29a4d9da2476f714df`. Do not merge it or create another Preview. The throwaway branch gate remains temporarily open because hosted QA is unfinished; restore `ignoreCommand` immediately after hosted QA completes or PM formally abandons the Preview.

Exact next action and auto-advance:

- When a supported protected-browser handshake works, resume against the same READY replacement Preview with no redeploy or configuration change. Use distinct director/staff storage contexts; prove staff submit -> director requests replacement -> staff submits replacement -> director verifies, identical replay, stale/conflict recovery, reload durability, append-only history, and wrong-organization/location/unassigned/former/revoked/staff-review denials. Capture truthful 1440/390/360 screenshots plus comprehension, focus, target, overflow, console, hydration, runtime, advisor, and exact database/event evidence.
- Only distinct hosted QA PASS may authorize the later `[qa-approved]` integration step. Until then the release train auto-advances through safe source/evidence/PR work and remains **PARTIAL**. No owner question is required unless the only remaining path requires owner-supplied credentials, a protection bypass or other material security decision, paid service, Production, real communication, or another explicit `AGENTS.md` gate.

