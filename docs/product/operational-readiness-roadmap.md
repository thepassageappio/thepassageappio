# Passage Zero operational-readiness roadmap

Status: canonical internal roadmap for the greenfield Passage Zero rebuild.

Owner audience: Passage System Admin, Product, UX, Engineering, QA, and Deploy roles. This document is not a public or persona-facing roadmap and its percentages, sprint language, founder goals, and readiness evidence must never appear on family, funeral-home, staff, participant, or vendor surfaces.

Last updated: 2026-07-18 (America/Los_Angeles)

## Canonical product decision — owner-approved 2026-07-18

Passage Zero is the sole target architecture and redesign implementation. Threshold/main is frozen to separately governed production P0/P1 maintenance. No new legacy dashboard, estate, Pages Router IA, schema, or redesign work may begin. PR #24 may merge only through the route/data/auth/RLS/event/evidence and rollback gates in `docs/product/passage-zero-cutover-plan.md`.

This decision does not authorize a public relaunch or Production changes. It removes duplicate implementation work while preserving a narrow hotfix lane for current live defects.

The repository and copy controls in `docs/product/release-governance-and-plain-language-policy.md` are part of every roadmap exit gate: Bot-authored agent work, no agent/schedule direct-main push, exact-head Independent Agent Review, founder review before merge, separate founder Production authorization, bounded PR/review packets, one disposition for overlapping drafts, and plain-language comprehension at 1440/390/360.

## Single-source rule

This is the one roadmap for the greenfield repository. The legacy canonical file named in `AGENTS.md`, `pages/system/admin/saas-roadmap.js`, does not exist in this App Router rebuild, and no secure System Admin route exists yet. Until that internal route is implemented, this file is the source of truth.

When the secure System Admin roadmap surface is built, it must render this roadmap or a single structured source extracted from it; it must not create a second set of milestones or percentages. Historical plans and `docs/agent-operating-context.md` are evidence and handoff records, not competing roadmaps.

## North star and readiness definition

Passage becomes pilot-operational when an allowlisted funeral home and family can complete a real, durable handoff across independently authenticated people with least-privilege access, visible ownership, task-bound communication, structured proof, failure recovery, and support evidence.

Operational readiness is not the same as guided-experience completeness or full production hardening:

- Guided readiness measures whether the current path is understandable and demonstrable.
- Operational readiness measures whether real identities, durable shared state, RLS, audit, delivery/recovery, integration truth, responsive QA, and support controls have been proven.
- **85-ish means operational for a tightly allowlisted synthetic/partner pilot with manual support, known non-goals, and held-out external provider/legal gates.** It does not mean general availability, universal integration coverage, production billing, live external messaging, or complete legal/compliance approval.
- Full production hardening is a later track: production migration, live provider delivery, broader integrations, load/restore drills, security/privacy/legal decisions, support coverage, billing, and general rollout controls. It continues after the 10-15-day pilot target and does not block proving the core Passage operating loop.

Every operational milestone must prove:

1. At least two independently authenticated users in separate browser storage contexts.
2. RLS denial for wrong organization, location, role, assignment, or family grant.
3. Idempotent commands and reload/reconnect truth without gaps or duplicate effects.
4. Server-derived actor and timestamp on audit, message, handoff, and proof events.
5. A named recovery owner for failed delivery, integration, or workflow transitions.
6. TypeScript, optimized production build, and desktop/390/360 browser QA.
7. Timestamped screenshots plus redacted database, log, and audit evidence.
8. One coherent `[deploy] [qa-approved]` preview after distinct PM -> UX -> Engineering -> QA -> Deploy handoffs.
9. A frontend/backend contract matrix showing that each visible persona action and status is backed by the matching server command/query, durable rows, RLS/authority rule, append-only event/proof when state changes, failure/recovery state, and persona projection. QA fails the milestone if either side ships ahead of the other; intentionally internal or queued backend capability must be named as such and must not appear as completed UI functionality.

### Passage V2 north star and design program - owner-approved 2026-07-21

Passage V2 is the **verified continuity network for deathcare**: one permissioned record that helps a family, funeral home, care provider, and bounded partner understand what is happening, who owns the next commitment, what has been proven, and how a failed handoff recovers. Funeral directors remain the primary distribution and operating wedge. This is a design program within Passage Zero and the milestones below, not a second product lane, a second roadmap, or authorization to start a parallel rebuild.

The future experience is organized around three humane products and four shared rails:

- **Transition Brief:** the current, viewer-appropriate summary of approved facts, open commitments, owners, waiting parties, evidence, and the next safe action. A Transfer Pass can authorize and carry a Transition Brief; this does not silently rename or replace the current Transfer Pass contract.
- **Director Right Hand:** a calm operating view that identifies workload, risk, family waiting, proof gaps, failed handoffs, and the one action that will move each case safely.
- **Family Companion:** one reassuring next step, a clear view of what professionals are handling, understandable receipts, privacy boundaries, and recovery help without exposing operator complexity.
- **Continuity rail:** stable identity, consent, scope, ownership, and handoff history across permitted organizations and people.
- **Proof rail:** append-only evidence, review state, correction history, audience, and a human-readable receipt.
- **Partner rail:** purpose-limited participation and provider-neutral adapters that report queued, accepted, delivered, rejected, and failed states truthfully.
- **Recovery rail:** every failed delivery, integration, or workflow transition remains visible, retriable where safe, and assigned to a named recovery owner.

Autonomy advances only with evidence: **observe and organize -> prepare and recommend -> human-approved execution -> policy-bounded automation**. Every level must preserve the human actor, authorization, resulting event, audience, and recovery owner. No consequential external action may be described as sent, approved, delivered, or completed before its distinct proof exists.

Dependency incorporation into the existing milestones:

1. **Cycle 8 stays unchanged.** Close the hosted task-bound proof/review loop and its authority, recovery, responsive, and comprehension evidence before broadening the active implementation scope.
2. **M3 establishes the operating primitives.** Durable case intake, `Now / Tasks / Updates / Proof`, task-bound communication, structured proof, outbox/retry, realtime recovery, and the isolated demo become the first usable Transition Brief, Director Right Hand, Proof rail, and Recovery rail.
3. **M4 establishes family continuity.** Real family identity/recovery, durable purpose grants, participant boundaries, the complete Transfer Pass handoff, family-safe proof return, and data controls make the Family Companion and Continuity rail operational.
4. **M5 establishes bounded network participation.** One honest adapter simulation, partner scopes, integration receipts/exceptions, coordination-health evidence, support controls, and pilot simulations make the Partner rail testable without claiming universal coverage.
5. **M6 remains the Production gate.** Live providers, production migrations, retention/deletion decisions, security/privacy/legal review, load/restore drills, support coverage, and rollout controls precede policy-bounded automation or a full-production claim.

Architecture work must preserve seams for stable continuity/case/work/task/message/proof/event identifiers; versioned handoff manifests and receipts; explicit purpose grants; common command receipts; prepared/reviewed/sent/delivered state separation; provider-neutral external mappings; workflow template identity and version; event cursors; proof references outside sensitive event metadata; and named recovery ownership. `docs/product/persona-action-architecture.md` holds the detailed future contract.

Explicit non-goals for this program are replacing funeral-home ERPs, a generic chat or social feed, autonomous AI sending or approval, broad family or partner record access, separate persona databases, a data marketplace, blockchain storage of sensitive records, a general workflow builder before repeatable pilot evidence, universal integrations, and Production automation before the applicable owner and evidence gates.

#### V4 horizon - consumer-directed deathcare network (non-executable)

The long-horizon product ladder is **V1 trusted record -> V2 supervised coordination intelligence -> V3 verified partner and integration rails -> V4 consumer-directed deathcare network**. V4 helps funeral homes digitize while giving consumers one guided, transparent, permissioned experience across planning, care transition, funeral-home service, disposition, aftercare, and other explicitly chosen participants. It is a horizon for architectural coherence and research, not an active implementation lane, milestone change, launch promise, or permission to skip V1-V3 evidence.

V4 is a network, not a lead marketplace. The consumer directs permission and participation, while the selected funeral home retains the service relationship and professional responsibility. Passage does not rank providers by commission, sell preferential placement, resell family data, or route a family to the highest bidder.

The network cannot advance until its barriers are resolved with evidence and explicit gates:

- **Provider trust and channel conflict:** demonstrate that Passage strengthens funeral-home relationships, avoids disintermediation, and makes responsibility and economics understandable.
- **Transparent price truth:** version general price lists, service/package prices, third-party cash advances, effective dates, jurisdiction, source, and acknowledgement without presenting stale or incomparable numbers as a quote.
- **Authority and consent:** establish who may plan, disclose, decide, revoke, correct, and transfer each category of information, with purpose, recipient, duration, and provenance.
- **State and jurisdiction variance:** model location-specific rules and hold legal, preneed, disposition, licensing, and claim decisions behind applicable expert and owner gates.
- **Fragmented systems:** support versioned adapters, acknowledgements, exceptions, and manual recovery for EDRS, funeral-home ERPs, care systems, and other legacy or closed workflows without claiming universal interoperability.
- **Identity and fraud:** prove account recovery, representative authority, duplicate/mismatch handling, document and payment safeguards, abuse controls, and auditable intervention.
- **Physical operations and recovery:** connect digital commitments to transport, custody, timing, inventory, service, disposition, and partner fulfillment with a named recovery owner when the real-world step fails.
- **Payments, preneed, and legal boundaries:** keep money movement, funding, insurance, preneed, refunds, tax, and regulated disclosures outside autonomous operation until the complete product, legal, compliance, security, and Production gates pass.
- **AI authorization:** preserve human approval for consequential recommendations, communications, routing, prices, and decisions until a narrow policy boundary has been explicitly approved and independently proven.
- **Regional cold start:** earn density region by region through trusted funeral-home anchors, useful consumer continuity, and verified partner coverage; do not manufacture network claims from unverified listings or purchased leads.

This incorporation changes no Cycle 8 scope or status, current milestone status or target, July 23 operating target, readiness score, or Production state.

#### V5 horizon - direct acquisition and digital continuity (non-executable)

V5 researches a direct household/helper entry and an authority-aware Digital Continuity Locker and Brief for account references, subscriptions, social identity, cloud photos, custodial crypto, and other provider-specific after-death work. Implementation is downstream of M3-M6 and the V4 consumer-directed network; gated research may run earlier without creating a product, provider relationship, acquisition campaign, or Production change. Passage may organize intent, permissioned tasks, official provider routes, receipts, exceptions, and recovery, but it does not become a password/private-key vault, executor, provider marketplace, grief-content funnel, or autonomous account actor. Online-first/direct-cremation providers and death-positive educators are research channels, not proven distribution; community rules, sponsorship, professional responsibility, consumer choice, and no-promotion boundaries control every experiment.

Revenue portfolio order, based on likely time to first Passage revenue and explicitly **hypothetical until paid-pilot evidence exists**, is: **(1)** Passage Zero/Cycle 8 funeral-home operating SaaS, **(2)** M3 Director Right Hand/Transition Brief, **(3)** M4 family continuity/Transfer Pass, **(4)** online-first/direct-cremation provider handoff, **(5)** V3 partner/integration rails, **(6)** Digital Continuity Locker, **(7)** Help a Friend, **(8)** V5 creator/community distribution, and **(9)** V4 consumer-directed provider network. The first two are the near-term revenue engine; M4, the provider handoff, V3 rails, and the Locker are retention/expansion candidates; Help a Friend and creator/community work are acquisition hypotheses rather than required revenue lines; V4 is a future network option. Market evidence validates digital funeral adoption, institutional sponsorship, digital-estate products, and community activity, but it does not prove Passage willingness to pay, sales velocity, CAC/LTV, margin, conversion, or retention.

Allocation is **Now:** close Cycle 8 and then fund the first bounded M3 slice; **Next:** M4 plus research-only provider-handoff/V3 simulation and isolated Locker/Help a Friend prototypes; **Later:** one evidence-backed integration, a bounded non-custodial Locker pilot, and disclosed community education; **Do not fund yet:** V4 network infrastructure, paid ranking/marketplace behavior, live custodian actions, secret custody, paid creator acquisition, or a standalone viral helper loop. Each initiative advances or stops only at the buyer, authority, recovery, comprehension, support-burden, and ethical kill gates in `docs/product/v5-direct-acquisition-and-digital-continuity-strategy.md`.

This V5 link creates no active sprint, score, milestone, implementation authorization, pricing change, acquisition campaign, provider relationship, or Production change. Cycle 8 remains PARTIAL, the July 23 owner-testable Preview target is unchanged, and the M3-M6/V4 gates remain controlling.

## Verified baseline

| Path | Guided readiness | Operational readiness | Verified now | Principal gap |
| --- | ---: | ---: | --- | --- |
| Funeral home | 94% | 40% | Hosted isolated director/staff authority; accepted invitation projection; assigned workload, start, reassignment, invitation/member revocation, append-only Activity, replay/conflict/denial, reload persistence, and 1440/390/360 evidence | Task-bound proof/review Case Room, delivery/recovery, integrations, founder-reviewed Bot-authored cutover, and pilot controls |
| Family / D2C | 85% | 25% | Planning-versus-urgent entry, Transfer Pass demonstration, family-safe status/proof projection, and responsive guidance | Real account lifecycle, durable family grants, participant invitations, recovery, funeral-home handoff, notification delivery, and data controls |
| Separate demo instance | 20% | 10% | Branch-bound Preview and isolated Supabase lab prove a synthetic director/staff authority loop; production remains untouched | Deterministic full seed/reset, blocked external communications, integration simulation, automated smoke, and isolated domain/environment |
| Production readiness | 15% | 10% | Buildable Next.js application, controlled migration discipline, explicit environment guard, security preflight, and evidence habit | Production-safe migrations, monitoring, backups/restore, support/break-glass, notification/integration operations, security/privacy review, and rollout/runbooks |

Current launch truth: Passage Zero exists only in non-production Vercel Preview and the isolated Supabase project. Cycle 7A/7B is a proven synthetic functional-beta authority/work slice, not an allowlisted pilot or Production release. Production Passage Zero pages are unchanged.

### Evidence status versus readiness score — 2026-07-18

- Cycle 7A hosted director/staff authority is PASS. Before Cycle 7B the preserved isolated cardinality was exactly one organization, one location, two active memberships, two active location grants, one accepted invitation, one invitation-location row, two invitation events, zero workflows, and zero tasks. The corrected Team projection showed zero pending invitations and one active staff membership at 1440, 390, and 360.
- Cycle 7B hosted assigned work is PASS as a synthetic non-production functional-beta slice. It proved director workload and assignment, staff start, reassignment, invitation/member revocation, append-only Activity, replay/conflict behavior, reload persistence, wrong-location/organization/unassigned/former/revoked denials, parity 11/11, SQL/RLS, build, advisors, runtime logs, and responsive/accessibility QA.
- Readiness scores deliberately remain funeral home **94% guided / 40% operational** and D2C **85% guided / 25% operational**. Passing a synthetic authority/work slice does not silently promote the product to pilot-operational, and the PM has not completed a score-change gate.
- Cycle 8 task-bound Case Room proof loop is **PARTIAL**. The reviewed additive migration and rollback-only SQL/RLS/race/reversibility matrix pass in the isolated lab; the controlled active-staff identity bind and idempotent replay pass without changing the retained invitation/event digest or public cardinalities; and the exact-branch replacement Preview is READY with the isolated runtime binding and clean build/runtime logs. Interactive staff/director proof-review behavior, durable reload, authority denials, and 1440/390/360 browser evidence remain blocked by the protected-Preview browser handshake and are not yet proven.

Readiness caps:

- Hosted Auth/membership and assigned-work RLS are proven only in the isolated synthetic Preview. Until the complete M2 score gate, plain-language review, Independent Agent Review, and founder review of a Bot-authored cutover pass, funeral-home operational readiness remains 40%.
- No task-bound proof/review Case Room and durable failure recovery: funeral-home operational readiness remains below the M3 range.
- No durable notifications and recovery: either path remains below 80%.
- No complete family-to-funeral-home handoff and family-safe proof return: either path remains below 85%.
- No observability, backup/restore proof, support runbook, persona simulations, and explicit high-risk review: no 85-90% pilot claim.

## Immediate priority correction — 2026-07-18

Passage Zero remains the one product lane. The live-site P1 below is a narrowly governed Threshold/main maintenance lane, not a second product initiative:

Audit trigger: PRs #17, #19, #23, and #24 were all draft with zero founder approvals; PR #17's required release-train check had remained red because `## Product Manager scope` did not match the required `## Product Manager Scope`; and two direct-main release commits landed 2 minutes 49 seconds apart. These are confirmed control failures, not hypothetical risks.

1. **Production P1 maintenance:** one reviewed Threshold/main hotfix PR fixes the shared hydration failure on `/pricing`, `/resources`, `/guides`, `/care-providers`, `/trust`, and `/mission`; every route receives console/hydration/runtime and responsive verification. This is live-site reliability work, not Passage Zero progress.
2. **Repository governance:** correct PR #17's exact required heading or close it as superseded, move agent authorship to the dedicated GitHub App/Bot, prohibit agent and scheduled direct-main pushes, require passing current-head checks plus Independent Agent Review and founder approval, protect Production with separate founder authorization, serialize release jobs, and reconcile draft PRs #17, #19, and #23 against Passage Zero umbrella PR #24.
3. **Human-readable Passage Zero:** audit all reachable public/persona Preview routes against the seven-question gate in `docs/product/release-governance-and-plain-language-policy.md`. Remove raw enums/UUIDs, cycle/fixture/QA narration, architecture wording, and contradictory demo/hosted labels. Validate comprehension at 1440/390/360.
4. **Cycle 8 recovery:** resume independent two-session proof/review QA on the existing bound replacement Preview when the supported protected-browser handshake works; prove replacement history, replay/conflict/reload, authority denials, and 1440/390/360 comprehension/accessibility/runtime evidence. Retain PARTIAL until the complete hosted QA and Deploy gates pass.
5. **Reviewable cutover:** retain PR #24 as the integration umbrella but present bounded packets/stacked PRs for Independent Agent Review and founder review across identity/authority, data/RLS, director/staff operations, Transfer Pass/family boundaries, and responsive UX. The final cutover vehicle must be Bot-authored; Production remains separately closed.

## Critical path

```text
deploy control + isolated hosted binding
  -> director/staff hosted identity and membership
  -> organization/location/assignment RLS + append-only command audit
  -> durable intake, workload, Case Room, proof, outbox, recovery
  -> isolated deterministic demo instance
  -> D2C account + family/participant grants
  -> family-to-funeral-home acceptance and proof return
  -> observability, integration reliability, backup/recovery, pilot simulations
  -> 85-90% allowlisted pilot readiness
```

The funeral-home authority path is the primary wedge and a dependency for the final D2C handoff, but the work is not fully sequential. Demo isolation, D2C account/grant foundations, and QA automation can advance as soon as the shared identity/event contracts are fixed. D2C must reuse the same event, message, proof, and recovery spine; it must not create a parallel family backend.

### Compressed parallel lanes

| Lane | Starts | Delivers | Critical dependency |
| --- | --- | --- | --- |
| A - hosted authority/data | Day 1 | Vercel binding, Auth, organization/location membership, assigned-work RLS, append-only command audit | Existing Cycle 7A migrations and isolated lab |
| B - funeral-home operations | Day 2 | Durable intake, assignment/workload, Case Room, structured proof, recovery states | Stable IDs and authority predicates from Lane A |
| C - D2C continuity | Day 2 | Account/recovery shell, family grants, participant scope, Transfer Pass handoff and family-safe proof | Shared Auth/event contracts; final acceptance waits for Lane A recipient authority |
| D - demo/QA/release | Day 1 | Deterministic seed/reset, blocked external sends, RLS persona matrix, failure injection, device QA, screenshots and deploy evidence | Runs continuously; integrates after each coherent sprint |

The work that consumes time is not drawing more screens:

- Hosted Auth, redirect/cookie correctness, RLS predicates, deterministic fixtures/backfill, and negative authority tests: roughly 30-35% of focused effort.
- Idempotent event/outbox/retry/reconnect behavior and honest failure recovery: roughly 20-25%.
- Cross-persona grants, handoff receipts, task-bound communication, and family-safe proof projection: roughly 20-25%.
- Independent two-session, SQL/RLS, 1440/390/360, failure-injection, logging, screenshot, and deploy verification: roughly 20-25%.
- Net-new visual screen construction is a small remainder because the guided surfaces and warm responsive system already exist.

## Evidence-gated milestones

### 72-hour transformed funeral-home beta — Cycle 7A recovery + Cycle 7B operating slice

Target after complete evidence: funeral home **55–60% operational**; D2C remains **25% operational / 85% guided**. This is an isolated, non-production, synthetic, manually supported functional beta. It is not the 85-ish allowlisted pilot and is not full production readiness.

Evidence status: Cycle 7A and Cycle 7B functional-beta behavior passed in the isolated Preview, but the readiness score remains 40% by explicit release disposition. The score does not advance merely because the three-day feature evidence exists; the canonical scoring, plain-language, review-packet, Independent Agent Review, founder review, and protected-Production gates still apply.

Day 1 closes hosted authority: exact-branch Preview variables, isolated Auth redirects and synthetic users, guarded director fixture, independent director/staff invitation creation and acceptance, reload, replay, denial, exact cardinality, and 1440/390/360 evidence.

Day 2 makes assigned work operational: director organization/location workload reads, staff assigned-only reads, idempotent assignment and reassignment, task transition, invitation and membership revocation, server-only append-only events, deterministic Sofia Rivera/Northstar data, and durable director/staff projections. Family grants remain unchanged.

Day 3 proves the integrated beta: director assignment -> staff work transition -> director activity trail -> reassignment -> revocation, including wrong-organization, wrong-location, unassigned, wrong-user, stale-session, replay, and revoked-user tests. TypeScript, optimized build, parity, deploy-gate, SQL/RLS tests, advisors, failure recovery, console/hydration checks, and timestamped redacted evidence must all pass before the single coherent non-production beta Preview is approved.

The beta does not include Production migration or promotion, public relaunch, live Google/email/SMS, durable D2C grants, full Case Room/realtime/outbox/proof lifecycle, vendors, estate, billing, paid providers, broad integrations, or legal/privacy/security claim changes. The broader 10–15 focused-day pilot target remains unchanged.

### M1 - Hosted funeral-home authority

Evidence status: PASS for the isolated synthetic Cycle 7A slice. Production and public-provider authorization remain held out; no score is changed by this status line.

Target: funeral home 45%; D2C 25%; demo 25%; production readiness 12%.

Scope:

- Restore source-controlled Vercel ignore-build gating.
- Bind only `greenfield/passage-zero` Preview to isolated Supabase project `uyacxqtsiwlvtmhxvoxr`.
- Keep Google and public email delivery disabled; use controlled synthetic Auth links with no external message.
- Prove independent director and staff sessions: authenticated invite creation, inspection, deliberate acceptance, `/staff`, staff `/director` denial, reload, same-user replay, and wrong-user denial.
- Prove exactly one membership, invited location grant, accepted invitation receipt, and server-timestamped event.

Exit evidence: all Cycle 7A hosted-auth cutover criteria in `docs/agent-operating-context.md` pass on one QA-approved preview.

Effort: 1-2 focused working days, assuming Vercel and isolated Supabase environment access remains available.

Documentation-first synthetic hosted-QA fixture gate:

- **What:** split hosted QA structure from data. Create a dedicated isolated-lab-only migration for the minimum self-membership/organization/granted-location authenticated SELECT grants and policies required by the hosted authority resolver, and apply it only to `uyacxqtsiwlvtmhxvoxr` through Supabase migration tooling. Keep `supabase/test-fixtures/cycle_7a_hosted_auth_personas.sql` DML-only: project/collision guards plus one synthetic Northstar organization, Portland location, director membership, and director location grant bound to an Auth Admin-created synthetic user. Create the invited staff identity through Auth Admin and create/accept its membership through the real RPC; do not seed an accepted staff membership or audit event.
- **Why:** the isolated production-shape fixture deliberately fails closed. Without a synthetic authorized director and narrow self-authority reads, the hosted app cannot authorize invitation creation or resolve the director/staff role landing, so the two-session proof stops at infrastructure binding.
- **Breakage if skipped:** `/director` and `/staff` remain safely closed, the director cannot exercise the invitation RPC as a real user, and M1 earns no readiness increase. Ad hoc manual rows would make the result irreproducible and weaken audit evidence.
- **Breakage risk and boundary:** applying the lab policy migration to the wrong project could expose organization/membership/location tables to authenticated Data API reads under the new predicates; applying fixture DML to the wrong project could collide with real rows. Engineering and QA must independently verify target ref `uyacxqtsiwlvtmhxvoxr`, reject production `qsveqfchwylsbncsfgxe`, use lab-specific migration/policy names and reserved synthetic IDs, inspect grants/policies after application, run advisors, and stop on collisions. Neither artifact contains family, participant, vendor, customer, or production data, sends email/SMS, or stores credentials/tokens.
- **Reversibility:** the fixture provides ordered DML cleanup for its synthetic rows only. Structural reversal is a separate isolated-lab follow-up migration that drops only the lab-named policies and revokes only the grants introduced by the lab migration after dependency checks; fixture cleanup must never execute DDL. The free lab can also be discarded after evidence, but no production rollback assumption may depend on that.
- **Artifact classification:** the policy/grant artifact is an isolated-lab-only Supabase migration applied with migration tooling and recorded in that lab's migration history. The persona fixture is test-only, reversible, and DML-only. Neither is a production policy plan; production-grade authority/RLS remains Cycle 7B work behind its own what/why/breakage and backfill gate.

### M2 - Assigned work and authority enforcement

Evidence status: PASS for the bounded isolated synthetic Cycle 7B slice. The score remains 40% pending the integrated roadmap scoring, Bot-author, Independent Agent Review, founder-review, and protected-Production gates stated above.

Target: funeral home 55-60%; D2C 25%; demo 35%; production readiness 25%.

Scope:

- Complete deterministic backfill fixtures for organization, locations, memberships, workflows, tasks, and assignments in the isolated environment.
- Enforce manager organization/location authority and employee assigned-only workflow/task RLS.
- Make workspace context presentation-only; prove it cannot widen access.
- Route intake to accountable director and employee, persist workload and reassignment history, and emit server-derived append-only command events.
- Add membership revocation and session/access recovery; revoked users lose direct-route and realtime access.
- Preserve independent family grants unchanged.

Exit evidence:

- Director assigns one real durable commitment to an employee; the employee sees only assigned work at allowed locations.
- Wrong-organization, wrong-location, unassigned employee, role elevation, stale session, and revoked membership tests fail closed.
- Reassignment, retry, and replay produce one durable outcome and complete history.
- Two-session reload proof, SQL/RLS tests, advisors, responsive UI, screenshots, and audit rows pass.

Effort: 2-4 focused working days, beginning in parallel on Day 2 and completing after M1 authority proof.

### M3 - Funeral-home case operations and isolated demo

Active status: Cycle 8 task-bound proof/review is PARTIAL. Isolated migration/rollback SQL, controlled staff identity binding/replay, and the exact-branch replacement Preview setup pass. Hosted interactive proof/review, reload, denial, and 1440/390/360 evidence remain unproven because protected-browser access did not complete; no `[qa-approved]` or Production authorization exists.

Target: funeral home 72-78%; D2C 30-35%; demo 75%; production readiness 45%.

Scope:

- Make first-call/manual intake and Transfer Pass acceptance durable from accepted case -> accountable director -> assigned employee commitment.
- Implement authenticated `Now · Tasks · Updates · Proof` Case Room using existing workflows, tasks, messages, proofs, and `workflow_events`.
- Add reviewed/not-sent family update, human send boundary, notification outbox, idempotency, retry/backoff, terminal failure, and named recovery owner. No automatic consequential external send.
- Add structured proof submit -> review -> verify/reject/replace with immutable timestamps and correction history.
- Prove realtime delivery plus cursor-based reconnect catch-up; realtime remains acceleration, not source of truth.
- Turn the isolated environment into a genuine demo instance with deterministic synthetic identities/data, reset, blocked production data and communications, simulated integration receipts/failures, and automated smoke.

Exit evidence:

- Two authenticated funeral-home users complete intake -> assignment -> task update/message -> proof review -> family-safe prepared update across separate sessions.
- Realtime appears within two seconds under normal preview conditions and reconnect has no missing/duplicate events.
- Provider failure is visible, retryable, timestamped, and owned.
- Demo reset restores the canonical Sofia Rivera/Northstar story without touching production or sending external communication.

Effort: 3-5 focused working days in parallel lanes after the authority predicates stabilize; target cumulative Day 6-10.

### M4 - D2C operational handoff

Target: funeral home 82-84%; D2C 60-70%; demo 90%; production readiness 60%.

Scope:

- Real Google/email account onboarding for planning and urgent entry, recovery, sign-out, reauthentication for sensitive actions, and cross-device persistence.
- Independent family continuity record and explicit grants; harden participant invitations with digest, expiry, revoke, purpose, and category scope.
- Complete family -> funeral-home Transfer Pass issue, inspect, accept, case destination, acknowledgment, and proof return.
- Family and participant task-bound communication with audience, delivery truth, reviewed prepared output, and structured proof translation.
- Account/data controls: collaborator removal, invitation revoke, export receipt, correction path, and deletion request workflow without promising unapproved retention outcomes.

Exit evidence:

- Independently authenticated family coordinator, participant, director, and employee complete the bounded handoff without cross-persona leakage.
- Wrong grant, expired/revoked pass, duplicate destination, notification failure, recovery, replay, and reconnect tests pass.
- The family sees one humane next action and translated proof, never operator workload or internal artifacts.

Effort: 3-5 focused working days. Account/grant foundations begin on Day 2; final handoff/recovery integrates after funeral-home recipient authority is stable. Target cumulative Day 8-12.

### M5 - Allowlisted pilot hardening

Target: funeral home 85-88%; D2C 83-87%; demo 90%; full production readiness 60-70%.

Scope:

- Run moderated funeral-director, employee, family, and participant simulations; measure time to first case, assignment, update, proof, and recovery.
- Prove the notification outbox and one integration-adapter contract in recorded simulation mode, including mapping/version/idempotency/retry/exception proof and operator recovery UI; live providers remain held out.
- Add preview/pilot structured logs, error ownership, basic abuse/rate controls, deterministic reset/restore proof, a manual support/recovery playbook, and environment/secrets review appropriate to an allowlisted pilot.
- Complete performance, accessibility, browser/device, concurrency, and failure-injection tests.
- Hold unresolved live email/SMS, address-provider, retention, production-data, and broad legal/privacy/security decisions outside the pilot contract; expose no unapproved claims.
- Define the synthetic/partner allowlist, manual support window, rollback, known non-goals, pilot success measures, and explicit no-production-promotion boundary.

Exit evidence:

- Every core persona simulation passes from fresh account to durable outcome and recovery.
- Reset/restore, revoke, retry, simulated integration failure, and support-recovery drills have timestamped evidence and named owners.
- No P0/P1 issue remains open; accepted P2/P3 gaps are explicit pilot non-goals with workarounds or recovery.
- Production promotion remains a separate Deploy decision after all owner gates are satisfied.

Effort: 2-4 focused working days integrated across cumulative Days 10-15.

### M6 - Full production hardening after pilot

Target: separate from the 10-15-day pilot target; production readiness advances from 60-70% toward 85-90% only with real production evidence.

Scope includes production migration/backfill and rollback, live Google/email/SMS and address-provider configuration, broader integration contracts, load/concurrency and disaster-restore drills, durable monitoring/alerting/support coverage, audited break-glass operations, security/privacy/legal decisions, billing, and production rollout controls. These items are materially time-consuming because they depend on third parties, owner gates, real production behavior, and longer-running reliability evidence; they should not be disguised as core product build time.

Effort: estimate separately after provider, legal/privacy/security, support, and production-migration decisions are available. This phase continues after the allowlisted pilot rather than extending the pilot estimate.

## Path scorecards

### Funeral-home path to 85-90%

| Gate | Target score | Required outcome |
| --- | ---: | --- |
| Current verified baseline | 40% | Guided operations and local Auth transaction only |
| Hosted authority | 45% | Two real hosted identities, membership/location receipt, replay/denial |
| Assigned-work RLS | 55-60% | Durable case/task access, assignment history, revocation, append-only audit |
| Case operations + recovery | 72-78% | Intake, Case Room, structured proof, outbox, realtime/reconnect, failure ownership |
| Cross-boundary family handoff | 82-84% | Durable family acceptance/update/proof without leakage |
| Allowlisted pilot evidence | 85-90% | Persona simulations, observability, integration/notification reliability, runbooks |

### D2C path to 85-90%

| Gate | Target score | Required outcome |
| --- | ---: | --- |
| Current verified baseline | 25% | Guided entry, Transfer Pass demonstration, family-safe projection |
| Shared authority spine available | 30-35% | Funeral-home recipient and proof destination are durable; no D2C account credit yet |
| Account and family grants | 50-60% | Cross-device account, recovery, family record, bounded participants |
| End-to-end funeral-home handoff | 70-78% | Issue/accept/acknowledge, task-bound updates, family-safe proof, failure recovery |
| Account/data controls + delivery | 80-84% | Revoke/remove/export/correct, durable notification recovery, responsive simulations |
| Allowlisted pilot evidence | 85-90% | Multi-person persona tests, support/observability, known non-goals and rollout controls |

### Separate demo instance

The demo instance is infrastructure and evidence, not a persona feature. It must have:

- An isolated Supabase Auth/database project and Vercel branch/environment binding.
- Synthetic identities and deterministic canonical data only.
- Seed and reset that never touches production.
- No production secrets, customer data, domains, outbound messages, or live billing.
- Recorded simulation mode for integrations with success, delay, and failure receipts.
- Automated smoke for director -> staff -> family-safe outcome plus direct-route denials.
- A visible non-production boundary that does not expose infrastructure identifiers.

The current isolated Supabase lab is a prerequisite but does not yet qualify as the demo instance.

### Production-readiness track

This track advances alongside product milestones but never converts a preview into production automatically.

| Control area | Required before allowlisted pilot |
| --- | --- |
| Environment | Explicit preview/demo/production separation, correct domains/redirects, scoped secrets, no cross-project binding |
| Data | Reviewed migrations, deterministic backfill/report, RLS and ACL tests, indexes/advisors, rollback plan |
| Identity | Provider configuration, account recovery, revoke/session response, sensitive-action confirmation |
| Audit/proof | Server-derived append-only events, immutable corrections, retention decision, exportable support evidence |
| Delivery | Outbox, idempotency, retry/backoff, provider IDs, bounce/failure state, named recovery owner |
| Integrations | Versioned mapping, idempotency, destination IDs, retry, exception queue, simulation and contract tests |
| Reliability | Structured logs, error monitoring, alert owners, performance budgets, failure injection, concurrency tests |
| Recovery | Backup and restore proof, incident/support runbooks, rollback, audited break-glass access |
| Safety | Abuse/rate controls, dependency review, accessibility, privacy/security/legal owner gates |
| Rollout | Allowlist, support coverage, success metrics, known non-goals, go/no-go and rollback decision |

## Next three integrated sprints

### Sprint 1 - Days 1-3: hosted authority and parallel foundations

Duration: 2-3 focused days.

Integrated deliverable: deploy-gate repair + branch-only isolated binding + two-session director invite/staff acceptance proof, while the D2C account/grant contract and deterministic demo fixture/reset begin in parallel.

Roles:

- PM: `/root/pm_cycle7a_hosted_cutover` complete.
- UX: `/root/ux_cycle7a_hosted_cutover` complete with conditions.
- Engineering/Platform: implement source/config and controlled hosted test setup; no production mutation.
- QA: independently prove security, two-session behavior, database cardinality, redirects, responsive UX, and logs.
- Deploy: one QA-approved non-production preview, no follow-up deploy chain.

Score rule: full PASS -> funeral home 45%; anything less -> remains 40%.

### Sprint 2 - Days 4-8: assigned work plus durable case/D2C spine

Duration: 4-5 focused days.

Integrated deliverable: durable organization/location/workflow/task authority, assigned-only staff queue, reassignment/revocation/audit, durable funeral-home intake/commitment, and D2C identity/family-grant persistence on the same event spine.

Role handoff:

- PM writes the enforcement/backfill what/why/breakage gate and freezes the persona matrix.
- UX defines verified workspace, empty/denied/revoked states, and workload clarity.
- Engineering applies only reviewed migrations through Supabase migration tooling and cuts the existing typed adapter to durable data.
- QA runs SQL/RLS personas plus two-session assignment/revocation/replay and 1440/390/360 regression.
- Deploy publishes one isolated preview only after PASS.

Score rule: full PASS -> funeral home 55-60%; D2C may move only to 45-55% if real account/family-grant and denial evidence also passes, otherwise it stays 25%.

### Sprint 3 - Days 9-15: end-to-end handoff, recovery, and pilot proof

Duration: 5-7 focused days.

Integrated deliverable: director/employee Case Room, D2C/funeral-home Transfer Pass acceptance, reviewed family update, structured proof, realtime/reconnect, simulated notification/integration failure recovery, deterministic demo reset/smoke, and complete allowlisted-pilot evidence.

Role handoff:

- PM freezes the case event/proof/outbox contract, automation inventory, demo boundary, and measurable time-to-outcome targets.
- UX pressure-tests director, employee, family-safe update, proof, failure, and reset flows.
- Engineering extends the existing event spine, never a generic chat or parallel case model.
- QA runs four-person projections where authorized, two-session realtime/reconnect, delivery failure, idempotency, privacy, and device matrices.
- Deploy publishes one demo preview only after proof and recovery PASS.

Score rule: only the complete cross-persona, failure-recovery, RLS, audit, demo, and QA PASS may move funeral home to 85-88% and D2C to 83-87%. Partial evidence retains the last fully passed score.

## Time projection

Assuming four coordinated lanes, focused execution, connector access, existing UI reuse, synthetic/controlled Auth, simulated external delivery/integration, and no owner-gated provider/legal delay:

- Hosted Auth and deploy-control proof: cumulative Day 1-3.
- Assigned-work RLS plus durable funeral-home/D2C authority foundations: cumulative Day 4-8.
- End-to-end funeral-home and D2C handoff, recovery, isolated demo, and pilot evidence: cumulative Day 9-15.
- **Tightly scoped allowlisted operational pilot target: approximately 10-15 focused working days for funeral home 85-88% and D2C 83-87%.**

This compressed target holds live external messaging, paid address integration, broad third-party integration coverage, production migration, billing, general-availability support, and unresolved legal/privacy/security decisions outside the pilot. Full production hardening continues afterward under M6 and receives its own estimate once those external decisions are known.

These are focused-work ranges, not promises. A failed RLS, replay, recovery, or cross-persona evidence gate retains the prior score rather than advancing to preserve Day 15.

## Decision ownership and change control

- Product Manager owns scope, critical-path order, acceptance, readiness scoring, and backlog classification.
- UI/UX Review owns zero-hand-holding clarity, persona boundaries, accessibility, responsive behavior, and proof/recovery comprehension.
- Engineering owns implementation, migrations, adapters, server authority, reliability mechanisms, and truthful execution states.
- QA owns independent functional, SQL/RLS, security, accessibility, device, failure, replay, and evidence verification.
- Deploy owns canonical-project/environment validation, deploy budget, logs/observability, release markers, preview proof, and production separation.
- Steve/owner is required only for the explicit `AGENTS.md` gates: pricing, real external customer/vendor/funeral-home communication, paid services, production raw/ad hoc SQL, irreversible production data changes, production promotion when requested, and material legal/privacy/security/medical/funeral-director claims.

Roadmap changes require a PM decision recorded here and a handoff entry in `docs/agent-operating-context.md`. QA evidence may update a score only after the milestone's full exit gate passes. A partial implementation, visual preview, local-only result, or simulated identity never earns readiness credit.
