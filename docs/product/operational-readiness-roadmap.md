# Passage Zero operational-readiness roadmap

Status: canonical internal roadmap for the greenfield Passage Zero rebuild.

Owner audience: Passage System Admin, Product, UX, Engineering, QA, and Deploy roles. This document is not a public or persona-facing roadmap and its percentages, sprint language, founder goals, and readiness evidence must never appear on family, funeral-home, staff, participant, or vendor surfaces.

Last updated: 2026-07-26 (America/Los_Angeles)

## Canonical product decision — owner-approved 2026-07-18

Passage Zero is the sole target architecture and redesign implementation. Threshold/main is frozen to separately governed production P0/P1 maintenance. No new legacy dashboard, estate, Pages Router IA, schema, or redesign work may begin. PR #24 may merge only through the route/data/auth/RLS/event/evidence and rollback gates in `docs/product/passage-zero-cutover-plan.md`.

This decision does not authorize a public relaunch or Production changes. It removes duplicate implementation work while preserving a narrow hotfix lane for current live defects.

The repository and copy controls in `docs/product/release-governance-and-plain-language-policy.md` are part of every roadmap exit gate: Bot-authored agent work, no agent/schedule direct-main push, author/merge-identity separation, exact-head Independent Agent Review, exact-head Development Head / Release Authority approval before merge, distinct Production Reviewer authorization, bounded PR/review packets, one disposition for overlapping drafts, roadmap freshness, and plain-language comprehension at 1440/390/360.

## 12-hour whole-platform 75% objective — owner-directed 2026-07-22

The active objective is to reach an evidence-backed 75% platform checkpoint while continuing autonomously through the agent role chain. This is a target, not a score award. The official baseline begins at 0 until one complete six-domain matrix passes.

| Domain | Weight | Mandatory 75% evidence |
| --- | ---: | --- |
| D2C, family, and participants | 20% | Planning and urgent onboarding plus complete scoped participant invite, identity binding, least-privilege access, persistence, expiry/replay/wrong-user denial, resend, revocation, and proof |
| Funeral-home directors and dashboards | 20% | Authenticated intake/workload, assignment/reassignment, team/invitation control, activity/proof, recovery, and useful responsive decision hierarchy |
| Funeral-home employees | 15% | Invitation/onboarding, assigned-only work, start/progress/proof, replacement/revocation denial, recovery, and responsive clarity |
| Vendor experience | 10% | Reachable bounded request, response/quote, status, proof, privacy boundary, denial/recovery, and no family-record browsing |
| Public and conversion pages | 15% | Home, pricing, guides/blog, Our Story/mission, trust, resources redirects, and care-provider paths with clear next actions and clean direct/client responsive navigation |
| Deterministic Steve demo sandbox | 20% | Isolated synthetic seed/reset, repeatable funeral-home and D2C stories, full persona switching without authority leakage, blocked real outbound effects, and automated smoke |

Certified checkpoints are `0, 10, 20, 30, 40, 50, 60, 70, 75`. Platform score is the greatest checkpoint whose aggregate, domain floors, and fresh complete E2E matrix pass. No legacy funeral-home or D2C percentage seeds this score, and no strong domain may average away an absent participant, vendor, public, employee, director, or demo flow. Each 10-point advancement and the final `70 -> 75` step requires full E2E. At 75, a separate massive full-platform responsive, accessibility, smoke, adversarial, concurrency, failure-injection, security-boundary, observability, reset/restore, and rollback pass is mandatory.

| Certified checkpoint | 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 75 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Minimum score required in every domain | 0 | 5 | 10 | 20 | 30 | 40 | 50 | 60 | 65 |

Immediate product sequence: close the current urgent/messaging hosted evidence truthfully; implement the full participant invitation journey; implement the deterministic Steve demo seed/reset/smoke envelope; complete Passage Zero public/conversion and funeral-home discovery paths; then advance only through certified checkpoint gates.

### Participant invitation P1 source packet - 2026-07-29

Packet P1 now has a replacement source candidate for the invite-to-access core: authenticated `/family/people`, one `Family updates`-scoped invitation, a one-time `Not sent by Passage` copy receipt, typed staff/participant inspection, invitation-aware sign-in, participant-specific POST acceptance, and durable multi-space `/participant` reconstruction. Independent pre-freeze review invalidated the first source candidate because its raw bearer entered login/provider redirect URLs and its `updates` participant inherited direct workflow, task, event, proof, and review reads. Independent re-review then returned the replacement because terminal invitation states could still expose inviter/family/relationship/purpose/scope/expiry details, account switching did not inspect sign-out failure, immutable states could retry the same route, and participant update copy overstated a separate family publication decision. The corrected candidate immediately exchanges the raw invitation URL for a short-lived secure httpOnly intent and an opaque `/invite/continue` path, keeps the existing family workflow predicate owner-only, and gives participants one authenticated bounded projection containing human update fields and no protected record identifiers. Full invitation details render only for an actionable available invitation or a verified same-user receipt; accepted without that receipt, expired, revoked, and access-ended states render generic minimum-safe recovery. Account switching uses inspected local-only sign-out and fails closed, existing/current access routes to `/participant`, immutable states do not offer identical-route retries, and copy now says the coordinator grants the high-level updates category while Passage maps eligible progress events. Wrong-account recovery preserves the intent, accepted-state replay denial is visible, invalid acceptance controls stay suppressed, `/family` reaches People, purpose is consistently limited to 240 characters, and the form/receipt states are field-associated and announced.

This is **SOURCE PARTIAL / NOT RELEASED**. Every P1 parity row is deliberately `source_partial`; the replacement migration has not been applied, the strengthened rollback-only matrix has not run, and hosted multi-session 1440/390/360 QA has not run. Packet P2 still owns replacement-link rotation, decline, pending cancellation, accepted-access revocation, expiry recovery, and human history controls; Packet P3 still owns hosted closure. P1 earns no certified whole-platform checkpoint or Production claim.

### Required branch-reconciliation proposal after repeated divergence

Independent review recorded at least two consecutive unresolved divergence cycles: `main` contains the verified Production maintenance/governance line while `greenfield/passage-zero` contains the canonical rebuild. Development Head disposition is required on this recommendation; no owner review is requested.

1. Freeze verified `main` as the Production-maintenance baseline except separately reviewed P0/P1 repairs.
2. Reconcile installed Bot/App/check governance into Passage Zero without porting legacy Pages Router IA or product implementation.
3. Keep PR #24 as the integration/evidence umbrella only and present identity/authority, proof, participant invitation, provider discovery, public conversion, vendor, demo, and cutover as bounded review packets.
4. Treat closed PRs #17, #19, and #23 as superseded historical inputs.
5. After all bounded packets pass and the public/durable route contract is reconciled, open a fresh Bot-authored cutover PR from the exact reviewed Passage Zero head to current `main`; repeat full-platform E2E, rollback, exact-head review, and Production gates on that vehicle.

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
| Funeral home | 94% | 40% | Hosted isolated director/staff authority; accepted invitation projection; assigned workload, start, reassignment, invitation/member revocation, append-only Activity, replay/conflict/denial, reload persistence, and 1440/390/360 evidence | Task-bound proof/review Case Room, delivery/recovery, integrations, Development Head-approved Bot-authored cutover, and pilot controls |
| Family / D2C | 85% | 25% | Planning-versus-urgent entry, Transfer Pass demonstration, family-safe status/proof projection, and responsive guidance | Real account lifecycle, durable family grants, participant invitations, recovery, funeral-home handoff, notification delivery, and data controls |
| Separate demo instance | 20% | 10% | Branch-bound Preview and isolated Supabase lab prove a synthetic director/staff authority loop; production remains untouched | Deterministic full seed/reset, blocked external communications, integration simulation, automated smoke, and isolated domain/environment |
| Production readiness | 15% | 10% | Buildable Next.js application, controlled migration discipline, explicit environment guard, security preflight, and evidence habit | Production-safe migrations, monitoring, backups/restore, support/break-glass, notification/integration operations, security/privacy review, and rollout/runbooks |

Current launch truth: Passage Zero exists only in non-production Vercel Preview and the isolated Supabase project. Cycle 7A/7B is a proven synthetic functional-beta authority/work slice, not an allowlisted pilot or Production release. Production Passage Zero pages are unchanged.

**Vendor/partner path is still not tracked as its own scored row in this table** — flagged as a gap in `docs/product/persona-functional-gap-audit-2026-07-25.md` when it was 0% built, and still true now that it has a real, adversarially-tested MVP (PR #53, #56, #57). Adding a scored row is recommended for the next PM pass; not done in this entry since it requires a deliberate scoring decision, not just a status note.

### Evidence status versus readiness score — 2026-07-18

- Cycle 7A hosted director/staff authority is PASS. Before Cycle 7B the preserved isolated cardinality was exactly one organization, one location, two active memberships, two active location grants, one accepted invitation, one invitation-location row, two invitation events, zero workflows, and zero tasks. The corrected Team projection showed zero pending invitations and one active staff membership at 1440, 390, and 360.
- Cycle 7B hosted assigned work is PASS as a synthetic non-production functional-beta slice. It proved director workload and assignment, staff start, reassignment, invitation/member revocation, append-only Activity, replay/conflict behavior, reload persistence, wrong-location/organization/unassigned/former/revoked denials, parity 11/11, SQL/RLS, build, advisors, runtime logs, and responsive/accessibility QA.
- Readiness scores deliberately remain funeral home **94% guided / 40% operational** and D2C **85% guided / 25% operational**. Passing a synthetic authority/work slice does not silently promote the product to pilot-operational, and the PM has not completed a score-change gate.
- Cycle 8 task-bound Case Room proof loop is **PARTIAL**. The reviewed additive migration and rollback-only SQL/RLS/race/reversibility matrix pass in the isolated lab; the controlled active-staff identity bind and idempotent replay pass without changing the retained invitation/event digest or public cardinalities; and the exact-branch replacement Preview is READY with the isolated runtime binding and clean build/runtime logs. Interactive staff/director proof-review behavior, durable reload, authority denials, and 1440/390/360 browser evidence remain blocked by the protected-Preview browser handshake and are not yet proven.

### Cycle 8 regression-evidence correction and family/participant grant — 2026-07-26

This entry corrects the strength of the Cycle 8 SQL/RLS claim above and records one new capability. It changes no readiness score; Cycle 8 remains PARTIAL and the interactive browser-evidence gap below is unchanged.

- **Regression suite was previously unusable, not merely unverified.** `supabase/tests/cycle_8_task_proof_loop.sql` is the official Cycle 8 command/RLS/append-only/race/cleanup regression matrix. An independent audit (`docs/product/cycle-8-rls-audit-2026-07-26.md`) found the underlying schema and RLS design sound, but found the regression file itself refused to run against the shared isolated lab (`uyacxqtsiwlvtmhxvoxr`) with `retained isolated baseline drifted`. The prior "SQL/RLS/race/reversibility matrix pass" language above was accurate for schema/RLS correctness but did not mean the official regression file had been run to completion against current state — it could not be, and had not been.
- **Root cause:** `uyacxqtsiwlvtmhxvoxr` is now a shared lab used concurrently by multiple lanes by design (`docs/agent-operating-context-2026-07-24-consolidation.md`). Other lanes were legitimately exercising the same three shared Cycle 7B fixture tasks for their own real functional QA (e.g. commit `0c060f5e`, director Case Room / staff work-detail verification), which left real proof/review/event history on those tasks. The suite's preflight treated that as disqualifying drift and refused to run at all, rather than distinguishing "another lane's legitimate shared-fixture use" from "an actual regression."
- **Fix shipped and independently re-verified (PR #54, merged to `greenfield/passage-zero`):** the preflight now scopes its structural checks to this suite's own fixture IDs, and resets the three shared fixture tasks' proof/review/event history transaction-locally before testing using the suite's own pre-existing sanctioned append-only bypass mechanism — never touching real data outside the test's own `begin ... rollback` transaction. The complete, otherwise-unmodified 1000+ line regression file was then run end-to-end against live drifted state on `uyacxqtsiwlvtmhxvoxr` and completed with zero exceptions raised, through the terminal `raise notice '...passed'` and `rollback`.
- **Net effect on Cycle 8 status:** the migration/RLS/append-only/race design was already independently confirmed sound by the audit; what changed today is that the file that is supposed to prove this by machine-checkable regression evidence now actually runs and passes, rather than being blocked. This is genuine, reproducible evidence, not a "probably fine" claim. It does not close Cycle 8 — the interactive staff/director proof-review browser evidence, durable reload, authority denials, and 1440/390/360 comprehension/accessibility evidence described in the 2026-07-18 entry above remain unproven and are still blocked by the protected-Preview browser handshake, independent of this fix.
- **PR #24 relevance:** to the extent PR #24's stated blockers cited Cycle 8 SQL/RLS regression evidence as outstanding or unverifiable, that specific blocker is now resolved with reproducible evidence. The browser-handshake-blocked interactive evidence remains a real, separate, still-open blocker and PR #24 should continue to reflect Cycle 8 as PARTIAL until that is independently proven. **This "still blocked" characterization is itself corrected later the same day — see the entry below.**
- **New capability shipped (PR #52, merged to `greenfield/passage-zero`):** prior to this fix, there was zero backend surface for a family/participant identity connected to case workflows — `organization_members.role` is hard-constrained to `owner|director|staff`, and the pre-existing `continuity_spaces`/`continuity_participants` system (full token-based invite/accept flow, already live) had no link into `workflows`. A minimal, additive migration (`supabase/migrations/20260726040000_family_case_workflow_grant.sql`) adds a nullable `workflows.continuity_space_id` and a `passage_private.can_view_workflow_as_family(workflow_id)` predicate, extending the existing staff-authority functions rather than replacing them. Verified with 10/10 adversarial RLS checks (own-space owner/participant allowed; revoked participant, wrong space, wrong org, and staff-only paths correctly denied); see `docs/product/family-case-workflow-grant-2026-07-26.md`. This is schema/RLS only — no routes — and is the specific backend dependency the M4 Transfer Pass/family-continuity scope below needs before `/case/[id]/*` family-facing pages can move off mocked UI data. **Re-verified live again later the same day (direct database query): the column, function, and both call sites in `can_view_workflow`/`can_view_task` all exist exactly as described. There is no `case_participants` table — the real grant path is `continuity_spaces`/`continuity_participants`, which any consumer of this grant (e.g. the case-detail lane) should query directly.**
- **Known, separately flagged issue (not fixed today):** three migrations backing the pre-existing continuity/participant system (`participant_invitation_thin_slice`, `participant_advisor_hardening`, `family_provider_discovery`) are applied and tracked in Supabase's own migration bookkeeping on the shared lab, but their `.sql` files were never committed to git on any branch. This is a real gap between deployed lab state and the repository and should be reconciled before that system is relied on outside the shared lab; it is called out here rather than silently reconstructed from introspection. **Still open as of the later 2026-07-26 entry below.**

### Grounded remaining-scope assessment: vendor shipped, lane status, and honest PR #24 readiness — 2026-07-26 (later same day)

This entry is a PM-level assessment across everything that changed today, done specifically to answer "what's actually left before PR #24 could be reconsidered." It corrects one significant understatement in the entries above, records what shipped today, and gives a concrete, non-inflated punch list. No readiness percentage is changed here for the same reason stated throughout this document: QA evidence may move a score only after a milestone's full exit gate passes, and that full exit gate is not yet met for any milestone below.

**Correction: Cycle 8's interactive browser evidence is not fully blocked — the core loop is now independently proven live, twice.** Every entry above through the 2026-07-26 correction describes "interactive staff/director proof-review behavior... remain blocked by the protected-Preview browser handshake and are not yet proven." That is no longer accurate as written. Two independent, real, hosted-Chrome sessions have since exercised the actual director-staff proof loop end to end: commit `0c060f5e` ("Cycle 8 director case room + staff work detail (verified live)" — "Hosted-verified this session: real proof submit -> review -> verify loop, two independent synthetic sessions, live Chrome QA") and, separately, `docs/product/passage-zero-persona-qa-sweep-2026-07-26.md` (merged via PR #50), which independently re-ran the same loop fresh ("signed in as `avery-cycle7b@passage.test` (staff)... task moved to `Waiting for review`; switched to the director account, saw the submitted proof immediately... clicked Verify proof, task moved to Complete with a full audit trail... No console errors at any step"). This is genuine two-session, real-browser evidence of the exact loop M3's exit criteria describes, gathered by two different sessions, not one claim taken on faith.

This does **not** mean M3's full exit bar is met. What's still not specifically confirmed for these Cycle 8 routes: the wrong-organization/wrong-location/unassigned/revoked-user denial matrix in an actual browser (as opposed to the SQL-level RLS checks in `docs/product/cycle-8-rls-audit-2026-07-26.md`, which did pass), reload/persistence behavior, and a 1440/390/360 responsive/comprehension pass specifically on `/director/cases/[id]` and `/staff/work/[id]`. So the corrected, precise status is: **core proof-review loop proven live twice; denial-matrix/reload/responsive sub-evidence for these specific routes still outstanding.** That's a materially smaller remaining gap than "blocked by a browser handshake," and the roadmap should say so.

**Vendor/partner persona: went from 0% to a real, adversarially-tested MVP in one day.** PR #53 shipped schema (`partner_organizations`, `partner_members`, `partner_requests`, append-only `partner_request_events`), four idempotent `SECURITY DEFINER` RPCs following the exact Cycle 8 pattern, RLS, and a working `/partner` queue + respond/quote + delivery-proof UI, plus a director-side origination panel in the existing Case Room. The builder's own hosted Chrome QA passed the full loop twice. A separate, independent adversarial QA pass (PR #57, `docs/product/passage-zero-vendor-persona-adversarial-qa-2026-07-26.md`) then specifically tried to break it: cross-tenant read (RLS) — 0 rows leaked; cross-tenant write via direct RPC call bypassing the UI — denied with an explicit authorization error before any state check; vendor attempting to self-verify their own delivered work — correctly denied (verification is director-only); idempotent replay — safe, no duplicate processing; malformed/out-of-order state transitions (responding to an already-verified request, re-verifying, submitting proof on a non-in-progress request) — all cleanly rejected with specific errors, no silent no-ops or corruption; invalid input — rejected before touching a row. All of that passed.

**One real, open bug from that adversarial pass, not yet fixed:** vendor request `category` is never validated against the target vendor's own specialty, at any layer (client dropdown, server action, or either RPC). Reproduced live — a transport-shaped job was saved under `category='florist'` and accepted by a florist-only vendor with no error anywhere. Invisible with today's single seeded vendor, but will silently misroute requests the moment a real multi-vendor roster exists. This is a known, scoped, not-yet-fixed gap — tracked here so it doesn't get lost before a multi-vendor pilot.

Also fixed today, independently two-pass QA'd (PR #56): the `/staff` role-mismatch dead-button bug (Sign out / Return to sign in fixed to use a plain `<a>` + a real route-handler POST instead of a Server Action/soft-nav pair that could silently no-op), the `/director/intake` route-gate fallback bug (same fix pattern as the earlier `/director/cases/[id]` / `/staff/work/[id]` fix, now extended to `/director/intake`), the inconsistent family-handoff expiry dates (now computed from real duration + a shared `now` instead of three hand-typed strings), and two pluralization bugs plus the `/director/activity` "Status unavailable" display bug.

**Case-detail lane (`/case/[id]/*`): unchanged since PR #51 — still 100% placeholder.** Checked the lane's branch directly: no commits since the shell/placeholder PR merged. `loadFamilyCaseView()` still returns synthetic `PLACEHOLDER_CASE` regardless of the id passed in and still never calls Supabase. The backend dependency it was blocked on (the family/participant RLS grant, PR #52) has been confirmed live and correct, and the lane has been told directly that the real query path is `continuity_spaces` / `continuity_participants` (not a `case_participants` table, which does not exist). Real-query wiring has not started as of this check.

**Urgent/red persona: still 0% built, now assigned but not yet started.** No `/start/*` route, component, or branch exists anywhere in the repository as of this check. It has been assigned to the same builder who shipped the vendor MVP, using the same playbook, but no work has landed yet.

**Migration-collision watch (requested by the owner):** checked for active branches from the case-detail and vendor-adjacent lanes. `feat/family-case-detail-shell` is stale (identical to what PR #51 already merged) — no new migration work in flight there yet. No branch exists yet for the urgent/red persona. **No active collision today.** Forward-looking risk to watch: the case-detail lane's eventual real-query work will likely need to populate `workflows.continuity_space_id` (a business-logic decision explicitly left out of PR #52's migration), and the urgent/red lane will likely need its own case-creation path — both touch `workflows`-adjacent schema. Whichever lane reaches `supabase/migrations/` first should check the other's latest commits immediately before writing a migration, per the standing instruction.

**PR #24's own body is stale in two factual respects, independent of the owner-gated items below.** It still lists "Cycle 8 SQL/RLS remains FAIL/PARTIAL and was excluded" — no longer accurate given the independent RLS audit (PR #49), the hardened-and-passing regression suite (PR #54), and the twice-proven live interactive loop above. It also still lists "PRs #17/#19/#23 still require evidence-based disposition" — checked directly: all three were already closed (not merged) on 2026-07-21, five days before this entry. Neither of these blocks a real decision today, but PR #24's body should be refreshed with accurate claims before it's put in front of the Development Head reviewer, so that review is against current reality rather than a week-old snapshot.

**Honest punch list — what's actually left before PR #24 could be reconsidered:**

1. **Agent-governed release gates:** PR #24 must remain draft until its current exact head receives distinct Independent Agent Review and Development Head / Release Authority approval. Routine founder review, bootstrap attestation, and owner Production authorization are not required. Production remains a separate later gate owned by the distinct Production Reviewer, with owner involvement only for destructive data, spend, or material legal/privacy/security judgment.
2. **Refresh PR #24's body** so its Cycle 8 and PR #17/#19/#23 claims match current, verified reality before it goes to review.
3. **Fix the vendor category-validation gap** (Medium, PR #57) — small, scoped, not yet done.
4. **Wire the case-detail lane to real data.** Currently 100% placeholder; the backend it needs is confirmed ready.
5. **Build the urgent/red persona.** Currently 0%; assigned, not started.
6. **Close the specific remaining Cycle 8 M3 sub-evidence**: browser-level denial matrix, reload persistence, and 1440/390/360 pass for `/director/cases/[id]` and `/staff/work/[id]` specifically — the core loop is proven, this sub-evidence is not.
7. **Reconcile the flagged migration/git drift** from PR #52: three pre-existing continuity-system migrations are applied on the shared lab but were never committed to git on any branch. Still open, still just flagged, not fixed.
8. **Add a scored "Vendor / partner path" row** to the Verified-baseline table in a future PM pass — the persona-gap audit flagged this as missing when vendor was 0% built; it's more overdue now that vendor has a real, adversarially-tested MVP with no readiness score tracking it at all.
9. **Per-organization feature flags** — not built, sized below (small, roughly half a day to one day).
10. **Demo sandbox refresh/redeploy mechanism** — not built, sized below (real multi-part infrastructure item, includes an owner-gated new-project step).

Net honest read at the time of this dated entry: Passage Zero was materially closer to a defensible cutover conversation, but real product work in items 3-8 remained. The original reference to owner-side governance is superseded by the agent-governed Development Head and Production Reviewer model above.

### Two new near-term architecture items (owner-requested) — 2026-07-26 (later)

Sizing only, per the owner's request — neither of these is built in this entry, and neither changes any readiness score. Both are added here as real, scoped near-term backlog items rather than left as verbal asks.

**1. Per-organization feature flags — small, mirrors an already-proven pattern three times over.** No `feature_flags` table of any shape exists yet (checked directly — `to_regclass` returns null for both `public.organization_feature_flags` and `public.feature_flags`). The minimal real version:

- **Schema:** one table, `public.organization_feature_flags` (`organization_id` FK, `flag_key` text, `enabled` boolean default false, `updated_at`, `updated_by_user_id`), composite primary key on `(organization_id, flag_key)`. A separate flag-catalog table (valid keys, descriptions) is a nice-to-have, not required for v1.
- **RLS:** exactly the existing pattern, not a new one — a `passage_private.org_has_feature_flag(org_id uuid, flag_key text)` `STABLE SECURITY DEFINER` predicate mirroring `can_manage_organization`; SELECT scoped to that org's own active staff/director members; no `authenticated` write grant in v1 (flag changes are an internal ops lever via direct SQL or a future admin route, not self-serve for organizations).
- **Enforcement point:** a small server-only helper (e.g. `lib/features/flags.ts`, `hasOrgFeature(orgId, key)`) called at the same boundary points that already gate everything else — inside `OperationalBoundary`/`PartnerBoundary`-style checks or directly in the relevant server component before rendering the gated UI. Deliberately server-only so an unreleased feature's existence never leaks into the client bundle for orgs that don't have it.
- **Explicitly out of scope for v1:** a self-serve toggle UI, percentage/gradual rollout, user-level (as opposed to org-level) flags, and any client-side flag evaluation.
- **Sizing:** roughly half a day to one focused day — one migration, one predicate function, one small helper module, and wiring 1-2 initial call sites, verified with the same adversarial-RLS-check pattern already used for PR #52 and #53 (10/10-style checks: org with flag on sees the gated feature, org with flag off/unset does not, cross-org read denied). Small and low-risk specifically because it's the fourth application of a pattern this repo has already built and proven three times (`can_view_workflow_as_family`, `is_active_partner_member_for`, the staff/director authority predicates), not a new design.

**2. Demo sandbox refresh/redeploy — real infrastructure work, not a small item, and mostly not built yet.** Checked both governing files directly (`scripts/vercel-ignore-build.js`, `lib/runtime-config.ts`) rather than assuming. Findings:

- **There is no live demo runtime today.** `runtime-config.ts` supports a `'demo'` `PASSAGE_RUNTIME` value in code, but it requires its own dedicated `PASSAGE_DEMO_SUPABASE_PROJECT_REF`, distinct from both the preview project (`uyacxqtsiwlvtmhxvoxr`) and production (`qsveqfchwylsbncsfgxe`), and there is no evidence that project or those env vars exist anywhere in this account. This matches the roadmap's own "Separate demo instance" section above: "The current isolated Supabase lab is a prerequisite but does not yet qualify as the demo instance."
- **A deterministic reset script was already attempted once and never landed here.** PR #23 (`agent/demo-sandbox-foundation`, closed unmerged 2026-07-21) drafted `scripts/demo/reset-sandbox.mjs` and `docs/demo-sandbox-environment-contract.md` — fails closed unless `runtime === demo-sandbox`, refuses matching production/demo refs, refuses the production domain, recreates deterministic fixtures, verifies exact row counts. It predates Cycle 7A/7B/8, the family/participant grant, and the entire vendor schema, so even if revived it would need real rework against today's schema, not a straight re-merge.
- **The deploy gate is commit-marker-based, not a standing "redeploy" button.** `vercel-ignore-build.js` cancels every build by default and only allows one through when specific literal commit-message markers are present (`[deploy]` + `[qa-approved]` for preview, plus branch/project-id checks; a separate combination for production). There is currently no marker class or trigger path for "refresh the demo sandbox" specifically — that would need to be designed deliberately (most likely a new marker, e.g. `[demo-refresh]`, scoped narrowly the same way `[cycle-7a-verification-preview]` already is, so it can't be reused to sneak an unreviewed production or preview deploy through) rather than loosening the existing gate.
- **What "refresh as new stuff ships" actually requires, end to end:** (a) provisioning a real, separate demo Supabase project and a bound Vercel environment/domain — infrastructure setup, likely an owner-gated step since it's a new project outside the two that already exist; (b) reviving and rewriting the reset script against current schema; (c) wiring the `demo` runtime's env vars in that environment; (d) deciding and building the actual trigger mechanism (a narrowly-scoped new deploy-gate marker plus something that fires it — manual command at minimum, a lightweight authorized workflow at best) consistent with the existing gate's security intent, not a bypass of it.
- **Sizing:** this is a real multi-part infrastructure item, not a quick add — realistic estimate is 1-2 focused engineering days once the new demo Supabase project exists, plus an owner-gated step to actually provision that project, which is outside an agent's authority to do unilaterally per this document's own "Decision ownership" section (new external project/environment creation is exactly the kind of step reserved for the owner).

Readiness caps:

- Hosted Auth/membership and assigned-work RLS are proven only in the isolated synthetic Preview. Until the complete M2 score gate, plain-language review, Independent Agent Review, and Development Head / Release Authority approval of a Bot-authored cutover pass, funeral-home operational readiness remains 40%.
- No task-bound proof/review Case Room and durable failure recovery: funeral-home operational readiness remains below the M3 range.
- No durable notifications and recovery: either path remains below 80%.
- No complete family-to-funeral-home handoff and family-safe proof return: either path remains below 85%.
- No observability, backup/restore proof, support runbook, persona simulations, and explicit high-risk review: no 85-90% pilot claim.

## Immediate priority correction — 2026-07-18

Passage Zero remains the one product lane. The live-site P1 below is a narrowly governed Threshold/main maintenance lane, not a second product initiative:

Audit trigger: PRs #17, #19, #23, and #24 were all draft with zero independent merge approvals; PR #17's required release-train check had remained red because `## Product Manager scope` did not match the required `## Product Manager Scope`; and two direct-main release commits landed 2 minutes 49 seconds apart. These are confirmed control failures, not hypothetical risks.

1. **Production P1 maintenance:** one reviewed Threshold/main hotfix PR fixes the shared hydration failure on `/pricing`, `/resources`, `/guides`, `/care-providers`, `/trust`, and `/mission`; every route receives console/hydration/runtime and responsive verification. This is live-site reliability work, not Passage Zero progress.
2. **Repository governance:** keep agent authorship on the dedicated GitHub App/Bot, prohibit agent and scheduled direct-main pushes, require current-head checks plus Independent Agent Review and Development Head approval, protect reversible Production promotion with distinct Production Reviewer authorization, serialize release jobs, and preserve the recorded disposition of closed PRs #17, #19, and #23 against Passage Zero umbrella PR #24.
3. **Human-readable Passage Zero:** audit all reachable public/persona Preview routes against the seven-question gate in `docs/product/release-governance-and-plain-language-policy.md`. Remove raw enums/UUIDs, cycle/fixture/QA narration, architecture wording, and contradictory demo/hosted labels. Validate comprehension at 1440/390/360.
4. **Cycle 8 recovery:** resume independent two-session proof/review QA on the existing bound replacement Preview when the supported protected-browser handshake works; prove replacement history, replay/conflict/reload, authority denials, and 1440/390/360 comprehension/accessibility/runtime evidence. Retain PARTIAL until the complete hosted QA and Deploy gates pass. As of 2026-07-26 the underlying SQL/RLS regression evidence for this gate is machine-verified PASS, and the core interactive proof-review loop has been independently proven live twice (see the two 2026-07-26 entries above); the outstanding blocker is now narrowly the denial-matrix/reload/1440-390-360 sub-evidence for these specific routes, not the data layer or the core loop.
5. **Reviewable cutover:** retain PR #24 as the integration umbrella but present bounded packets/stacked PRs for Independent Agent Review and Development Head / Release Authority approval across identity/authority, data/RLS, director/staff operations, Transfer Pass/family boundaries, and responsive UX. The final cutover vehicle must be Bot-authored; Production remains separately closed.

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

Evidence status: Cycle 7A and Cycle 7B functional-beta behavior passed in the isolated Preview, but the readiness score remains 40% by explicit release disposition. The score does not advance merely because the three-day feature evidence exists; the canonical scoring, plain-language, review-packet, Independent Agent Review, Development Head / Release Authority, and protected-Production gates still apply.

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

Evidence status: PASS for the bounded isolated synthetic Cycle 7B slice. The score remains 40% pending the integrated roadmap scoring, Bot-author, Independent Agent Review, Development Head / Release Authority, and protected-Production gates stated above.

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

Active status: Cycle 8 task-bound proof/review is PARTIAL. Isolated migration/rollback SQL, controlled staff identity binding/replay, and the exact-branch replacement Preview setup pass; as of 2026-07-26 the official regression file (`supabase/tests/cycle_8_task_proof_loop.sql`) has also been independently hardened against shared-lab drift and re-run end-to-end to a clean PASS against live state, and the core interactive director/staff proof-review loop has been independently proven live twice via real hosted-Chrome QA (see the two 2026-07-26 entries above). What's not yet proven for these specific routes: the browser-level authority-denial matrix, reload persistence, and a 1440/390/360 comprehension/accessibility pass. No `[qa-approved]` or Production authorization exists for this milestone.

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

Dependency note (updated 2026-07-29): the family/participant identity foundation exists through the reconciled continuity migrations and PR #52. The existing owner-facing `/case/[id]/today` path stays wired to the family-owner grant. The replacement P1 packet does not extend that raw-table grant to participants; it adds the missing invitation/landing path and an `updates`-only, human-field projection across every active family space. The migration remains un-applied and unverified in hosted QA, so it does not advance M4 or the whole-platform score.

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

### Case-detail confirmed done, urgent/red status corrected, migration drift closed (item 7), vendor scoring added — 2026-07-27

This entry corrects two stale status claims from the punch list above, closes item 7 from that same list, and adds the "Vendor / partner path" score the entries above repeatedly flagged as missing. No funeral-home, D2C, demo, or production-readiness percentage above changes; the only new score is the vendor/partner line at the end of this entry.

**Item 4 correction: the family case-detail persona is done, not "still 100% placeholder."** Commit `9a8b5b11769daad154df098c073613a5cd894be6` on `greenfield/passage-zero` ("Wire /case/[id]/today to real family data (RLS-scoped, plain-language, tight layout)") replaced the `PLACEHOLDER_CASE` loader described above with a real RLS-scoped read that goes through `workflows.continuity_space_id` and `passage_private.can_view_workflow_as_family()` — the exact grant path the case-detail lane was told to use. The commit's own message records independent QA PASS: "verified RLS via impersonation against both test identities on the isolated QA project, confirmed no internal verbiage/ids leak, confirmed layout is a tight single column, confirmed no file corruption." This is merged and live on `greenfield/passage-zero`. Item 4 from the punch list above is DONE.

**Item 5 correction: the urgent/red at-need persona is built but not yet merged or hosted-QA'd, not "0% built."** PR #62 ("Passage Zero: Urgent/red family persona thin slice (/start/* at-need intake)") is open against `greenfield/passage-zero`, built on `bot/urgent-family-thin-slice`. It ships schema (`urgent_intake_requests` and an append-only `urgent_intake_events` table), three idempotent `SECURITY DEFINER` RPCs (submit/claim/create_case) following the same advisory-lock, idempotency-key, and optimistic-version pattern already proven in Cycle 8 and vendor/partner, full app code (`app/start/*` for the three-step family wizard and `app/director/urgent/*` for the claim queue and case-creation flow), and adds `/director/urgent` to the verified-operational route allowlist up front. Unlike items 1-3 above, the migration file (`supabase/migrations/20260726215450_urgent_family_thin_slice.sql`) is already committed, so there is no drift risk here. The PR's own QA section states plainly what is and is not proven yet: "Schema and RLS verified via rollback-only SQL simulation... Hosted Chrome walkthrough — real signup, real submit, real claim, real case creation, and 390px mobile rendering check — is the next step before merge... Not requesting merge until hosted QA evidence is attached." The correct status is therefore real, substantial, schema-and-RLS-verified progress that is not merged and not yet hosted-QA'd — not the "0% built, now assigned but not yet started" status above.

**Item 7 is closed.** PR #64 ("chore(migrations): reconcile 3 drifted continuity-system migrations (item 7)") merged commit `e7847c38b75c0a263c42e99f30fb8f675d01b7d6` to `greenfield/passage-zero`. The three previously-uncommitted migrations flagged above — `20260723072450_participant_invitation_thin_slice.sql`, `20260723080309_participant_advisor_hardening.sql`, and `20260723092402_family_provider_discovery.sql` — are now committed to git in correct chronological order. Each file's content was pulled verbatim from `supabase_migrations.schema_migrations.statements` on the shared isolated lab (`passage-cycle-7a-test`, `uyacxqtsiwlvtmhxvoxr`) and checked against the live column with a server-side full-string equality check, not a visual diff; all three came back exact matches on both content and length (63081, 13704, and 32018 characters respectively). Nothing was re-applied to any database — this only made git history match what was already live. The git/schema drift for these three migrations, flagged as open in the entries above, no longer exists.

**Item 8: Vendor / partner path scored at 90% guided / 28% operational.** No row for this path exists in the Verified-baseline table above; this fills that gap in prose, in the same "X% guided / Y% operational" form the table and the entries above already use, without editing the existing table. The vendor/partner MVP (PR #53, merged) shipped a full queue -> accept/quote -> delivery-proof -> verify state machine with real RLS and idempotent RPCs, and passed two rounds of QA: the builder's own hosted Chrome walkthrough of the full loop, run twice, plus an independent adversarial pass (PR #57) that specifically tried cross-tenant reads and writes, vendor self-verification, idempotent replay, and malformed state transitions — all denied or handled correctly. That is a deeper evidence bar than D2C's current 85% guided score rests on (planning-versus-urgent entry and a Transfer Pass demonstration alone), which is why guided readiness sits meaningfully above D2C here; it stays below funeral home's 94% because, unlike funeral home's evidence, no 1440/390/360 responsive or comprehension pass has been run against `/partner` specifically. Operational readiness is capped well below funeral home's 40% and close to D2C's 25% for two concrete, unresolved reasons rather than general caution: one open Medium bug, unfixed as of this entry, where vendor request `category` is never validated against the target vendor's specialty at any layer, so a request can silently misroute the moment a second vendor exists (invisible today only because a single vendor is seeded); and the complete absence of any responsive or device-QA evidence for `/partner`, the same category of sub-evidence Cycle 8's own routes are still tracked above as separately outstanding. Per this document's own rule that a score moves only after a milestone's full exit gate passes, 28% reflects real but incomplete operational proof, not a rounded-up estimate.

### Historical punch-list closeout — agent-governed release gates supersede owner-only wording — 2026-07-27 (later)

This entry follows minutes after the correction above and closes three more items from the 2026-07-26 honest punch list, one of which corrects a status claim that went stale within about fifteen minutes of being written because other concurrent lanes merged more work in the meantime.

**Item 5, corrected again: urgent/red persona is DONE.** The entry immediately above this one stated PR #62 was "built but not yet merged or hosted-QA'd." That is no longer accurate. PR #62 is now MERGED to `greenfield/passage-zero` at commit `f7be8014adeaa6565502b72981bf22d184718b49`. A same-day fast-follow then fixed the one non-blocking bug the PR's own QA had already surfaced: a hydration race where a hard refresh or a deep link straight into `/start/people` or `/start/next` could bounce a family back to step 1, because a child effect fired before the parent wizard-provider's `sessionStorage`-hydration effect completed — shipped as commit `ada85b2cd47311fe0dd958f0773b83d38861752d`, tagged `[deploy][qa-approved]`, and independently QA'd. Urgent/red is now DONE, not merely built-and-unmerged.

**Item 3 closed: the vendor category-validation bug is fixed and merged.** The Medium-severity bug PR #57's adversarial QA sweep found against the vendor/partner MVP — `partner_requests.category` never validated against the target vendor's own declared specialty, at any layer — is now fixed via PR #66, commit `957ef9bfced77ae7a79d366501328750b175c0ca`. The authoritative RPC, `create_partner_request_idempotent`, now rejects a request whose `category` doesn't match the chosen vendor's specialty; verified via rollback-only SQL simulation, where a mismatched category is rejected and a matching one still succeeds unaffected. The vendor/partner persona no longer has any known open bug.

**Item 6 closed: the Cycle 8 M3 evidence gap is filled.** PR #65 merged, adding `docs/product/passage-zero-cycle8-m3-evidence-2026-07-26.md`. That document reports 8/8 correct denial-matrix results — six denial cases (wrong-org director, wrong-location director, revoked-membership staff, wrong-org staff, unassigned staff, and revoked-location-grant director) plus two positive controls — obtained via direct SQL against the real RLS-enforced read path in the isolated QA project, with four of the six denials (both denial reasons, on both routes) additionally corroborated live in a hosted browser showing clean, plain-language denial screens with no raw ids or engineering jargon. Reload-persistence was confirmed on both `/director/cases/[id]` and `/staff/work/[id]` via fresh authenticated navigations, with no stale or blank intermediate state. The 1440/390/360 responsive pass itself could not be obtained live — the pass's browser sandbox is hard-capped at 640×480 and rejects resizing even up to 1440×900 outright, a confirmed tooling limitation the evidence document flags explicitly as environmental, not a product gap. In its place, the document substitutes code-level evidence: both routes render through the same shared stylesheet, `app/proof-loop.module.css`, which has explicit breakpoints at 900px (collapsing the two-column case layout to one column) and 620px (stacking the hero and facts grid, collapsing actions to one column, and tightening panel padding) that directly cover the 390/360 portion of the acceptance bar, with the fluid, non-fixed-width layout above 900px giving no indication of overflow risk at 1440.

As of this dated entry, the product punch-list items were closed. Its original owner-only governance wording is superseded: exact-head Independent Agent Review and Development Head approval are agent responsibilities, routine founder/bootstrap approval is not required, and reversible Production authorization belongs to the distinct Production Reviewer. PR #24 remains draft until current evidence—not a founder signature—earns release readiness.

### Urgent/red completion invalidated by receiver submit P1 — 2026-07-28

This entry supersedes the “urgent/red persona is DONE” claim immediately above. At exact PR #24 base `520a3bf2d12c51a427f7ad08a8f1dea1fe44d311`, `/start/next` does not pass the receiving-organization argument required by the receiver-bound `submit_urgent_intake_idempotent` function already present in the isolated test environment. The crisis-flow’s primary submit therefore fails before creating the family request.

The bounded repair restores the exact Northstar receiver field and server validation, stable request identity, exact-key reload/replay recovery, authoritative append-only event time, callback-versus-private audience language, requester/receiver RLS boundary, parity regression, and the retained receiver-boundary migration. Its rollback-only evidence is intentionally limited to callback/private submission, replay/conflict, request/event cardinality, and receiver/private RLS against the exact committed source stack. It is split from the separately tracked workflow-governance correction so the least-privilege Passage Release Bot can publish product work without modifying a trusted workflow; the governance correction is neither deleted nor weakened.

Independent QA rejected product-only head `ad41b55d245913e07a1ab81a57f48a785ef70413` because its broad urgent-family test required the separate first-commitment migration even though that migration is absent from the exact `greenfield/passage-zero` base. The broad test is removed from this P1 and replaced by `supabase/tests/urgent_receiver_submit_boundary.sql`, which preflights only the committed urgent thin slice and receiver-boundary migration. Claim/case/workflow/task first-commitment work remains a separate unresolved migration and evidence lane. This hotfix does not claim that broader migration drift is closed.

Reviewer then returned replacement head `55312cba131dc08ff61064bbcf967d02833244e6` because its narrow matrix omitted three PM-required runtime denials: signed-out anon submission, same-organization active-staff receiver helper/RLS/claim-command denial, and revoked-leader receiver helper/RLS/claim-command denial. The next replacement adds those exact identities and proves both callback/private request and event cardinality remain unchanged after every denial. No broader claim/case success path enters this P1.

Reviewer returned second replacement head `e00099f18e78248ff260d915bffec89dea69e76e` because it still lacked paired direct-command evidence: a wrong-organization active director must receive `42501` when claiming the callback request, and an active director of the exact receiver must receive `42501` when claiming the private `self_handling` request. The third replacement adds only those commands and then re-proves callback `submitted` version 1, private `self_handling` version 1, neither claimed, and final two-request/two-event cardinality.

Release truth for this P1:

- **Source QA:** FAIL for stale head `ad41b55...`; REVIEW RETURN for stale heads `55312cb...` and `e00099f...`; third replacement Engineering gates PASS and independent QA is required.
- **Hosted Preview QA:** NOT RUN for the product-only candidate.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE ONLY / NON-PRODUCTION PARTIAL; PR #24 is not ready.

This is a defect correction, not a product-direction, scope, milestone-order, readiness-doctrine, persona-coverage, or architecture change. No readiness score advances. The next gate is exact-head independent source/SQL/RLS review, followed by one non-production Preview and hosted first-submit/replay/reload/denial/cardinality/1440/390/360 proof.

### Post-merge urgent first-task parity invalidation — 2026-07-28

The later merge head `e25c6d2dc64e64687ec55d31d711ffeba9569266` does not restore PR #24 readiness. Exact-source parity was 16/17: the ledger referenced nonexistent `20260727030000_urgent_receiving_organization_boundary.sql` instead of the committed/applied `20260727042651` file, while the isolated database also contained `urgent_case_first_commitment` at applied version `20260727200936` with no matching source file. The earlier source-PASS and “migration drift closed” claims are therefore invalidated.

The bounded source repair restores the exact first-commitment statements under the truthful applied filename, restores the broad rollback-only authority/replay/cardinality matrix, returns both durable case and first-task receipts, opens Case Room Tasks at the returned task, and limits assignment choices to active staff with a non-revoked exact-location grant. Missing-task and no-candidate recovery remain visible, human, and non-destructive.

Roadmap classification: defect and source/database parity correction only. It changes no product direction, milestone order, readiness doctrine, persona scope, or score. Funeral home remains **94% guided / 40% operational**; D2C remains **85% guided / 25% operational**; vendor remains **90% guided / 28% operational**. Source gates, independent SQL/RLS QA, one exact-head non-production Preview, and complete hosted first-submit/replay/reload/assignment/denial/cardinality/1440/390/360 evidence remain required before any hosted PASS or cutover claim.

### Urgent first-task QA return closed in source - 2026-07-28 21:44 -07:00

The replacement urgent packet closes four source-level QA findings without changing roadmap direction or scores:

- zero-task Case Rooms show missing-first-task recovery before generic invalid-task denial, while invalid task selectors on nonempty workflows still fail closed;
- ordinary workload assignment says `Assign task`, and only the urgent first commitment says `Assign first task`;
- no-candidate recovery names the exact humanized case location and directs the director to review team access before returning;
- the rollback-only SQL matrix executes first-task assignment and proves durable assignment, one append-only event, idempotent replay, and wrong-organization, wrong-location, unaffiliated, former/revoked actor plus invalid target denials without cardinality drift.

This is a defect and frontend/backend parity correction only. It changes no product direction, scope, milestone order, readiness doctrine, persona coverage, architecture, or score. Candidate `AGENTS.md` is intentionally unchanged from exact merge source; the requested governance doctrine replacement is a separate bounded packet. Funeral home remains **94% guided / 40% operational**; D2C remains **85% guided / 25% operational**; vendor remains **90% guided / 28% operational**. Independent source/SQL/RLS QA, one non-production Preview, and complete hosted 1440/390/360 assignment/replay/reload/denial/cardinality evidence remain required.
