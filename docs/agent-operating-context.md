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

