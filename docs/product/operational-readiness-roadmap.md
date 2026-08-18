# Passage Zero operational-readiness roadmap

Status: canonical internal roadmap for the greenfield Passage Zero rebuild.

Owner audience: Passage System Admin, Product, UX, Engineering, QA, and Deploy roles. This document is not a public or persona-facing roadmap and its percentages, sprint language, founder goals, and readiness evidence must never appear on family, funeral-home, staff, participant, or vendor surfaces.

Last updated: 2026-08-18 (America/Los_Angeles)

---

## ENGINEERING ROADMAP — read this section first

Everything below this section is the append-only history that produced it. This section is the current answer to "what are we building, what does done mean, and where are we against it" — kept current going forward; do not let it go stale again the way the narrative log below it did between 2026-07-26 and 2026-08-17.

**Legend:** ✅ done & evidenced &nbsp;·&nbsp; 🔶 partial, named gap remains &nbsp;·&nbsp; ⬜ not started &nbsp;·&nbsp; 🔒 blocked on a founder decision, not an engineering task

### End goal

> Passage is the person-centered continuity and proof layer for the transitions before, during, and after a death — one continuity record, one task/event/proof vocabulary, purpose-bound handoffs, human-reviewed prepared work, and visible proof and recovery.

Full statement: `docs/product/passage-product-direction-session.md`. Not re-litigated here — this roadmap exists to execute it, not redefine it.

### Definition of success

**The operative near-term bar, founder's own words, 2026-08-18:** "End to end personas can handle and do everything in platform with no hand holding, platform fully functions, and we have the ability to demo funeral homes fully. That's success." This is the working target for the current push — simpler and more directly actionable than the longer-horizon criteria below, and it's what "current phase and immediate next action" (further down) is now scoped against.

Concretely, this means for **each** persona (D2C/family, funeral-home director, funeral-home staff, vendor): every action that persona needs is reachable, works without a director/engineer walking them through it, and fails with a clear, recoverable message when it fails — not a dead end, not a silent no-op. A genuine persona-by-persona "click through everything, zero hand-holding" pass is the concrete way to test this bar, distinct from (and faster than) the full pilot-operational evidence gate below.

The longer-horizon, already owner-approved definition remains the gate for an actual paying pilot, two layers:

1. **Pilot-operational bar** (the go/no-go gate — see "North star and readiness definition" below): an allowlisted funeral home and family can complete a real, durable handoff across independently authenticated people with least-privilege access, visible ownership, task-bound communication, structured proof, failure recovery, and support evidence.
2. **North-star behavioral measures** (what "working" looks like once live, measured in pilot use — not estimated): time to first correctly-owned case; time from family handoff to named acceptance; family wait-time without a visible owner; % of commitments with owner/audience/proof-destination set; % of proofs verified or in named recovery; follow-ups avoided because a receipt was already visible; director/staff time saved; can the family state what happens next without help. Full list: `docs/product/passage-product-direction-session.md`, section 7.

The founder's bar above is the honest floor beneath both — a platform that isn't demoable end-to-end with zero hand-holding cannot be pilot-operational either. Close the top bar first.

Revenue priority behind these gates does not change: **funeral-home operating SaaS is the current, sole revenue engine.** Family continuity is the retention layer that follows it. Everything else (vendor network at scale, consumer network, digital continuity locker) is explicitly not funded yet. Full ranking: `docs/product/v5-direct-acquisition-and-digital-continuity-strategy.md`.

### Milestone ladder — the phases, in order, not renamed or reordered from what was already set

| Phase | Proves | Status |
| --- | --- | --- |
| **M3** — Operating primitives | Funeral-home core loop: task assignment, proof review, structured communication, recovery | 🔶 In progress — see below |
| **M4** — Family continuity | Real family identity, purpose grants, Transfer Pass handoff, family-safe proof | 🔶 In progress — see below |
| **M5** — Bounded partner network | One honest adapter/partner simulation, receipts, exceptions | 🔶 Ahead of schedule (vendor MVP exists) but not formally entered |
| **M6** — Production gate | Live providers, migrations, security/privacy/legal review, rollout | ⬜ Not started — correctly gated behind M3/M4 |

A phase advances only when every criterion below it is checked, per this document's own standing rule: a score or phase status moves only after real evidence, not because more code shipped.

---

### M3 — Operating primitives

**Success criteria** (the 9-point exit gate every milestone must prove, `operational-readiness-roadmap.md` "Every operational milestone must prove" below):

| # | Criterion | Status |
| --- | --- | --- |
| 1 | 2+ independently authenticated users, separate sessions | ✅ Proven live twice (Cycle 8 director/staff proof loop) |
| 2 | RLS denial matrix (wrong org/location/role/assignment) | 🔶 Proven at SQL level (`cycle-8-rls-audit-2026-07-26.md`); **browser-level denial matrix for `/director/cases/[id]` and `/staff/work/[id]` specifically not done** |
| 3 | Idempotent commands, reload/reconnect truth | ✅ Proven for the core loop; not re-verified against Phase K/L's newer routes specifically |
| 4 | Server-derived actor + timestamp on every event | ✅ Architectural invariant — every RPC in the codebase follows the `SECURITY DEFINER` pattern; holds by construction, not by spot-check |
| 5 | Named recovery owner for every failure | 🔶 `crm_sync_events` (built, previously unwired) now logs every HubSpot Deal-creation failure across all 4 Stripe-webhook sites; **one site knowingly still uncovered** — `organization/start`'s trial-deal creation runs on the user-context client, which RLS blocks from writing to `crm_sync_events` (zero policies exist on it) |
| 6 | TS/build/QA + desktop/390/360 evidence | 🔶 Full `pnpm install && next build` verified clean tonight (all 44 routes, tonight's new routes included); **responsive/1440/390/360 pass not run on `/case` (new multi-estate list) or `/director/team` (new location-grant form)** |
| 7 | Timestamped screenshots + redacted DB/log evidence | ⬜ Not gathered for anything shipped since 2026-08-16 |
| 8 | `[deploy][qa-approved]` release-train discipline | ✅ Followed for every commit this session |
| 9 | Frontend/backend contract-ledger parity | 🔶 Passes (18/18) as of tonight's fix, but **only covers Cycle 7/8 — Phase K, Phase L.1-L.4, the UX-audit fix pass, D2C multi-estate, and staff multi-location grants have zero contract entries** |

**What actually closes M3, in order** (unchanged from the standalone plan written earlier tonight — `docs/product/m3-closure-execution-plan-2026-08-17.md` has full detail):
1. Browser-level denial matrix + reload + responsive pass for `/director/cases/[id]` and `/staff/work/[id]` — the single most-repeated open item in this entire document.
2. Expand the contract ledger past Cycle 7/8.
3. Fix the HubSpot silent-failure recovery-owner gap (criterion 5).
4. Migration backfill (see "Known blockers," below — this is real but needs proper tooling, not a rushed reconstruction).
5. Formal PM re-score of the "Verified baseline" table once 1-3 land.

### M4 — Family continuity

| Requirement | Status |
| --- | --- |
| Real family identity + recovery | ✅ `estate_access` + `case_family_invitations` (corrected 2026-08-18 — `continuity_spaces`/`continuity_participants` never existed in production; this row previously cited them incorrectly) |
| Durable purpose grants | ✅ `estate_access` (owner + read-only participant), `case_family_invitations` idempotent create/accept/revoke |
| Participant boundaries (read-only, not staff access) | ✅ Enforced at the RPC layer, adversarially tested |
| Complete Transfer Pass handoff | ⬜ Still the disconnected `/family` + `/family/pass` sandbox — clearly labeled as a preview (tonight's fix), but not wired to `case_family_invitations` or any real backend |
| Family-safe proof return | ✅ Unified commitment view (Phase L.1) |
| Data controls | 🔶 Partial — D2C multi-estate slot/participant tracking now real; no export/deletion flow yet |
| **D2C multi-estate provisioning** (not an original M4 line item — added tonight because it was sold on `/pricing` and never built) | ✅ Built, adversarially tested, deployed tonight |

**What closes M4:** wire the Transfer Pass flow to the real `case_family_invitations` backend (the sandbox already demonstrates the intended UX — this is a connection job, not a redesign); confirm with the founder that the multi-estate access model built tonight (separate estates per plan, not co-ownership) matches intent before more customers hit it.

### M5 — Bounded partner network

Not formally entered as a milestone, but the vendor/partner MVP already exceeds what M5 requires: real RLS, idempotent RPCs, Stripe Connect payouts, adversarially tested against cross-tenant reads/writes and malformed state transitions (`passage-zero-vendor-persona-adversarial-qa-2026-07-26.md`). Last formal score: 90% guided / 28% operational. Staff multi-location assignment (shipped tonight) is adjacent funeral-home-side work, not M5 itself.

**What closes M5 formally:** a PM decision to actually enter this milestone and score it against the same 9-point gate M3 uses — it currently has no scored row in "Verified baseline" at all, a gap flagged since `persona-functional-gap-audit-2026-07-25.md` and still true.

### M6 — Production gate

⬜ Not started. Correctly gated behind M3 and M4 passing their own exit criteria — nothing in this session changes that sequencing.

---

### Current phase and immediate next action

**We are in M3, closing it against the founder's near-term bar above: every persona does everything end-to-end with no hand-holding, platform fully functions, funeral homes are fully demoable.**

The concrete next engineering action is a genuine **persona-by-persona completeness pass** — walk each persona's entire journey start to finish and fix every dead end, silent failure, or missing action found, the same method used for tonight's UX audit but run to completion this time rather than stopping at a ranked list:

1. **Funeral-home director/owner** — org setup, location creation (✅ built), staff invite + location grants (✅ built), case intake (✅ built — see below), task assignment, proof review, vendor requests, billing/upgrade, activity/audit (✅ 7 missing event labels fixed).
2. **Funeral-home staff** — accept invitation, see assigned work, submit proof, nothing outside their scope.
3. **D2C/family** — sign up, land on their estate(s) (✅ multi-estate built tonight), complete tasks, message, invite a family member, billing.
4. **Vendor/partner** — sign up, receive requests, quote, deliver, get paid, check payout status (✅ nav fixed tonight).

Everything already marked ✅ above is a completed pass through part of this; what's left is finishing it for the parts not yet walked, plus the specific named items already on the M3 list (browser denial matrix, contract-ledger coverage, HubSpot recovery-owner gap) as the harder evidence layer underneath the founder's bar.

**Per-persona page completeness is not the same as cross-persona correctness.** Founder asked directly whether it's clear how each persona's touchpoints interact with each other, not just whether each persona's own pages work. They didn't — `docs/product/persona-interaction-map-2026-08-18.md` traces the actual data flow (director assigns → staff/family see it; staff submits proof → family sees it in real time with honest "being double-checked" framing before director review, not after; vendor coordination merges into the same family feed as tasks; participants can message, not just view). Three real findings from that trace, still open: **staff has zero vendor-request visibility** (unclear if by design — needs a founder call, not a unilateral fix); **family-visible vendor-status timing has no audit-event backing** the way task status does (untested risk under rapid status changes); and the multi-location staff task-list merge was checked immediately after and confirmed already correct, not a gap.

**Case intake — the largest single gap this pass found, now closed (2026-08-18).** There was no general-purpose "director or staff opens a new case" path anywhere in the app; the only way an org-owned case could exist was claiming an urgent-intake request. `/director/intake` demonstrated the intended manual-walk-in UX but was (and remains) a pure client-side sandbox with zero backend calls. Built `passage_private.create_case_manual_idempotent` (same authority/trial-gating/checklist-seeding conventions as the proven urgent-intake path, 7-assertion adversarial test passed) and a real "New case" form always visible on `/director`, open to both directors and any staff with an explicit `can_create_cases` grant.

**Then found incomplete on its own follow-through, twice, by the founder asking directly rather than it being caught proactively:** (1) the new `case.created` event had no activity-page label — a gap in a fix made earlier the same session, missed because dependency evaluation wasn't actually re-run after the new feature shipped; (2) case creation and family invitation were left as two disconnected manual steps — create the case, separately navigate to the Case Room, fill a second form, then personally copy and send a secure link outside Passage. Both fixed: the activity label, and `/director`'s case-creation form now takes an optional family contact and — in the same submission — creates the invitation and actually emails the secure link via the same Resend sender already proven for task communications, not another "copy this yourself" step. Recorded here explicitly, not smoothed over, because the pattern (ship a feature, don't re-check it against the interaction map before calling it done) is the exact thing this map was built to catch, and it caught its own author.

### Known blockers requiring a decision, not more code

| Item | Who decides |
| --- | --- |
| `stripe` schema RLS exposure (anon-key-readable since before 2026-08-16, not yet remediated) | Founder |
| HubSpot's stalled funeral-home leads (16 Companies at stage `lead`, unworked) | Founder |
| GitHub PR #74 (shipped messaging feature, never merged) disposition — **and now also PR #77**, which already diagnosed and fixed the exact same participant-lockout bug closed tonight (see critical-fix entry below), months ago, and it never merged either. Two independent fixes for the same bug now exist (one on an unmerged branch, one shipped tonight as a fresh migration). Needs reconciling — check what PR #77's version actually did differently before assuming tonight's migration fully supersedes it | Founder |
| D2C multi-estate access model (separate estates vs. co-ownership) — built tonight from pricing copy alone | Founder confirmation needed |
| Migration backfill scope and method (25 files missing from git, including the full baseline schema) — needs the Supabase CLI's real `db dump`/`db diff` run locally; hand-reconstructing historical DDL from current-state introspection would produce false history, not a faithful backfill | Needs proper tooling access, not a founder product decision — flagged here so it isn't mistaken for "not prioritized" |
| Vendor orgs support exactly one login (`/partner/start` creates one owner, no invite-a-second-employee flow exists — confirmed, no `partner_invitation`-shaped RPC anywhere in `supabase/migrations`) while funeral-home orgs have a full staff-invitation system. Queued as the next build (task #14), not blocked on a decision — flagged here only so it's visible next to the other org-completeness gaps | N/A — proceeding |

### CRITICAL — three RPC call sites were silently broken in production, now fixed (2026-08-18)

Found via a systematic cross-reference of every `client.rpc()` call site in the app against what actually exists in the live database (not a spot-check — triggered by finding one gap and deciding to check all of them). PostgREST only resolves `client.rpc()` calls against the `public` schema; a function that only exists in `passage_private` 404s silently, which the calling code was catching and treating as "no data" or "unauthorized."

1. **`get_family_visible_partner_requests`** (`lib/family/case-view.ts`) — families have never actually seen vendor-request status merged into their timeline, despite Phase L.1 being recorded as shipped and verified.
2. **`set_staff_case_creation_grant_idempotent`** (`app/director/actions.ts`) — toggling a staff member's case-creation rights on `/director/team` has never actually worked.
3. **`get_family_case_update_for_workflow`** (`lib/family/case-view.ts`) — the worst of the three: didn't exist under this name in *any* schema. The original migration depended on `continuity_spaces`/`continuity_participants`, a lab-only system deliberately never ported to production. **Net effect: an invited family participant (spouse, etc.) who accepted an invitation has been completely locked out of `/case/[id]/today` and `/case/[id]/tasks` since that flow shipped.** Rebuilt against the live `estate_access`/`case_family_invitations` tables, same output shape, no frontend changes needed.

Fixed in `supabase/migrations/20260818070000_fix_missing_family_participant_rpcs.sql`, applied to production, verified with a zero-footprint adversarial SQL test (real participant gets a real row; unrelated user gets zero rows; director's grant-toggle works via the new public wrapper), committed and pushed (`986e02f`). **See the blocker table above — PR #77 already fixed the participant-lockout half of this once before and never merged; needs reconciling before this is called fully closed.**

### Structured participant roles — already scoped in docs, not yet built

`docs/product/persona-action-architecture.md` (persona table, lines 173-184) already lists **Executor/estate administrator**, **Celebrant/venue/clergy**, **Cemetery/crematory**, and **Vendor** as distinct personas, each with a defined entry point, scope, actions, and proof type — this was correctly scoped, not a miss in the docs. The gap is that the actual build (`case_family_invitations`) only carries a flat `relationship` free-text field with no structured role or differentiated authority. An executor implies estate-workspace authority; POA/medical proxy imply a form of legal standing; clergy/officiant don't need either. None of that distinction exists at the data layer today — every accepted invitee gets the same generic "Family updates" participant scope regardless of stated relationship. **Not yet started.** Needs a founder call on which roles get distinct authority (vs. just a display label) before building the enum.

---

## FULL SYSTEM AUDIT — 2026-08-16, ordered by founder ("no gaps, no misses")

Every connected system checked directly (not from memory) before continuing to build: Supabase (all schemas), Stripe, HubSpot, GitHub, the deployed website. Findings below are grouped by system; decisions needed from the founder are called out explicitly rather than guessed at.

### Supabase (production `qsveqfchwylsbncsfgxe`)

- **~70 tables in `public`.** Real, live Passage Zero data: `workflows` (9 rows), `tasks` (59), `organizations` (4), `organization_members` (3), `organization_locations` (3), `estate_access`/`estate_participants` (1 each), `platform_admins` (1), `task_status_events` (5). Everything this session built (`partner_organizations`, `case_family_invitations`, `urgent_intake_requests`, `subscriptions` writes, etc.) is real schema, currently 0 rows pending real usage.
- **A large second layer of legacy Threshold-era tables, almost all empty (0 rows) but schema-present**: `users`, `profiles`, `accounts`, `people`, `children`, `spouse_links`, `documents`, `vendors`, `vendor_orders`, `vendor_payments`, `funeral_home_requests`, `memorial_pages`, `wishes`, `obituaries`, `announcements`, `messages`, `marketplace_providers` (9 rows — a second, separate vendor-directory table, different lineage from this session's `partner_organizations`), `funeral_home_partners` (2 rows). None of these are referenced by any current route.
- **`public.leads` has 495 rows — investigated, not a missed CRM gap.** 492 are `flow_type='product_event'` — generic client-side analytics events (button clicks, page views, `checkout_started`) logged into a JSON `notes` column, not sales leads. Only 2 rows are real funeral-home-related leads. This is a dormant analytics log, not a pipeline.
- **CRITICAL, UNFIXED — flagging for a decision, not auto-fixing:** the entire `stripe` schema (29 tables) has **Row Level Security disabled**, exposed to the `anon` key that ships in the site's client-side JS. Currently low actual exposure (`stripe.customers`/`subscriptions`/`invoices` are all empty), but `stripe.checkout_sessions` has 88 rows and `stripe.products`/`prices` carry the real pricing catalog. Two fix options: (a) add real RLS policies (correct long-term, more work), or (b) revoke `anon`/`authenticated` grants on the schema entirely (fast, safe — nothing in the app reads this schema directly today). **Needs founder's call before either is applied.**
- **A second, complete, still-ACTIVE Stripe sync pipeline predates this session by ~8 months**, unrelated to anything built tonight: 3 Supabase Edge Functions (`stripe-setup`, `stripe-webhook`, `stripe-worker`) mirroring Stripe objects into the `stripe.*` schema (open-source "Stripe Sync Engine"). It has been running the whole time (`stripe._sync_obj_runs` has 14,252 rows) but has nothing real to sync — see Stripe findings below. No conflict with this session's new webhook (different schema, different purpose — that one mirrors raw Stripe state, this session's writes to `public.subscriptions`/`public.users` and drives HubSpot).

### Stripe (account `acct_1TQvaLRteXSJR0ll`, live mode)

- **Zero completed transactions have ever occurred on this account.** 0 customers, 0 subscriptions, 0 invoices, ever. 88 checkout sessions were started and abandoned. This session's new webhook is the first infrastructure ever built that would have caught a real payment.
- **Three webhook endpoints exist.** (1) This session's new one, `/api/webhooks/stripe` — correct, verified live. (2) A dead legacy one pointing at `/api/stripeWebhook`, a path that hasn't existed in this codebase for a long time — has been silently failing delivery for ~8 months, harmless but worth deleting for cleanliness. (3) The active legacy Stripe-Sync-Engine endpoint described above.
- **A real, already-configured 17-product pricing catalog exists in Stripe that the current `/pricing` page does not use.** `lib/stripe.ts` only wires 6 env vars for a simplified Individual/Couple/Family × Monthly/Annual model. The actual Stripe catalog is richer and matches what the founder described wanting tonight almost exactly:
  - **D2C Planning:** Single Estate ($9.99/mo · $79.99/yr · $299.99 lifetime one-time), Couple – 2 Estates ($14.99/mo · $119.99/yr), Family – 5 Estates ($24.99/mo · $199.99/yr), **Estate Add-On** ($4.99/mo · $39.99/yr — this is the exact multi-estate seat upsell asked about earlier tonight, already priced and built in Stripe, never wired to any UI), Semi-Annual Billing ($49.99), a generic Annual Subscription ($79.99/yr).
  - **Urgent:** one-time charge, $79.99.
  - **B2B Funeral Home:** Local, 1 location ($249.99/mo), a **Pilot-only 1-location tier ($99/mo)**, Multiple Locations (two different prices found, $349.99/mo and $399.99/mo — needs reconciling, likely one is stale).
  - **Decision needed:** migrate `/pricing` and checkout to use this real catalog (adds estate add-ons, urgent one-time, and self-serve B2B pricing — all currently missing from the live site), or keep the simplified 3-plan model and treat the rest as not-yet-launched. This is a real product-scope decision, not something to guess into code.

### HubSpot (portal `246159600`)

- **1 real Contact** (the founder's own test contact from tonight, `lifecyclestage: lead` — probably worth reclassifying so it doesn't skew lead-funnel reporting).
- **16 Companies, all funeral homes, all stage `lead`.** The 5 originally-known stalled leads (added 2026-05-12) plus **11 more created 2026-08-16 (today) that weren't previously known to this session** — worth confirming who/what added those 11 so they get followed up on rather than sitting unworked like the original 5.
- **0 Deals**, expected given zero real transactions. All of tonight's Deal Type / Revenue Segment / custom-property work is real and ready, just has nothing to populate it yet.
- Free plan — one pipeline only (already accounted for in tonight's design).

### GitHub

- **7 open PRs**, none on `main`. Most relevant: **PR #74** (draft) — a built, source-QA-passed "purpose-scoped family/director workflow messaging" feature, never merged. PRs #76/#77/#79 are QA docs from Aug 10–13 documenting and fixing the *exact* participant-lockout bug this session independently re-discovered tonight while building the family-invitation flow (`get_family_case_update_for_workflow` dead-code) — confirms that finding was correct and had already been diagnosed once before, just never landed. **Decision needed:** whether messaging (PR #74) should be resurrected and shipped now that case_family_invitations exists, and whether the old QA-documented participant fix (PR #77) is now superseded by tonight's `case_family_invitations`/`estate_access` work or should be reconciled with it.
- Remaining PRs (#70, #61, #60, #41) are older docs/preview-track artifacts, low current relevance.

### Vercel

- Not fully enumerated this pass — env vars beyond the ones this session directly touched (Stripe/Supabase secrets, Supabase URLs, runtime flags) were not pulled as a complete list. Flagging as the one remaining gap in this audit rather than blocking on flaky browser tooling; can be completed on request.

## 2026-08-16 — all four audit decisions executed

Founder resolved all four open items same-night. Shipped:

1. **Security fix.** RLS enabled (no policies) on all 29 `stripe` schema tables plus explicit `REVOKE` of `anon`/`authenticated` grants on the schema. Verified via advisors: critical finding cleared, no new warnings introduced.
2. **Real Stripe catalog wired into `/pricing`.** `lib/stripe.ts` rebuilt around the actual 17-product catalog (hardcoded price ids, not secrets, with an env-var override preserved for the three original D2C plans in case those were already correctly configured). New: a Single-Estate one-time purchase button, a paid Urgent one-time option (kept explicitly distinct from the free `/start` triage flow, which is untouched), and a full "For funeral homes" B2B section (Pilot $99/mo, Local $249.99/mo, Multiple Locations $349.99/mo) with real self-serve checkout. Webhook (`app/api/webhooks/stripe/route.ts`) and HubSpot deal creation now branch correctly across D2C/B2B/one-time. **Flagged, not silently resolved:** "Funeral Home - MULTIPLE LOCATIONS" had two different active prices ($399.99 and $349.99, created ~9 minutes apart) — used the newer $349.99 as canonical; confirm or correct. Two generic-named prices ("Annual Subscription- Planning Tool", "One Time Lifetime Charge- Planning Tool") duplicating the "Single Estate" equivalents' amounts were treated as superseded legacy and excluded — confirm if wrong. **Explicitly not built tonight:** the Estate Add-On purchase (priced, ready in `lib/stripe.ts`, but needs an account/billing settings page for an *existing* subscriber that doesn't exist anywhere in the app yet — a real, separate feature, not rushed in at this hour) and participant-discount-at-checkout logic (mentioned in `/pricing`'s own copy, never implemented).
3. **HubSpot's 16 leads confirmed intentional** — founder-added, no action needed.
4. **PR #74 (workflow messaging) resurrected and shipped**, adapted from its original lab-only `continuity_participants` design to this session's real `estate_access`/`case_family_invitations` model. Family `/case/[id]/messages` page live, director Case Room now has a Messages panel. Same append-only, least-privilege-projection design as the original PR.

All four verified via `pnpm build` (clean) and Supabase advisors (zero new security findings across all three migrations applied this pass).

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

1. **Owner-only governance gates (no agent can close these):** PR #24's "Development Head / Release Authority" section is still unchecked with "UNASSIGNED" as the reviewed head; founder bootstrap attestation and live Bot/branch-protection/protected-environment activation have not happened; separate founder Production authorization has not been requested. These are explicitly owner-gated per this document's own "Decision ownership and change control" section and are not something a PM/Engineering/QA loop can satisfy on its own.
2. **Refresh PR #24's body** so its Cycle 8 and PR #17/#19/#23 claims match current, verified reality before it goes to review.
3. **Fix the vendor category-validation gap** (Medium, PR #57) — small, scoped, not yet done.
4. **Wire the case-detail lane to real data.** Currently 100% placeholder; the backend it needs is confirmed ready.
5. **Build the urgent/red persona.** Currently 0%; assigned, not started.
6. **Close the specific remaining Cycle 8 M3 sub-evidence**: browser-level denial matrix, reload persistence, and 1440/390/360 pass for `/director/cases/[id]` and `/staff/work/[id]` specifically — the core loop is proven, this sub-evidence is not.
7. **Reconcile the flagged migration/git drift** from PR #52: three pre-existing continuity-system migrations are applied on the shared lab but were never committed to git on any branch. Still open, still just flagged, not fixed.
8. **Add a scored "Vendor / partner path" row** to the Verified-baseline table in a future PM pass — the persona-gap audit flagged this as missing when vendor was 0% built; it's more overdue now that vendor has a real, adversarially-tested MVP with no readiness score tracking it at all.
9. **Per-organization feature flags** — not built, sized below (small, roughly half a day to one day).
10. **Demo sandbox refresh/redeploy mechanism** — not built, sized below (real multi-part infrastructure item, includes an owner-gated new-project step).

Net honest read: Passage Zero is materially closer to a defensible cutover conversation than it was this morning — a second persona (vendor) went from entirely absent to a real, independently adversarially-tested MVP, four real UX bugs got fixed and independently re-QA'd, and the Cycle 8 data-layer and core interactive-loop evidence both got substantially stronger with real, reproducible verification rather than assumption. But "PR #24 could actually be reconsidered" is still gated on real, unfinished product work (items 3-8) in addition to the purely owner-side governance steps (items 1-2) — this is not yet a "just get founder sign-off" situation.

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

### Founder-facing production audit and sequenced remaining-work plan — 2026-08-15

This entry is a direct, owner-requested QA sweep of production (`www.thepassageapp.io`) and the current repository head, done in response to specific founder-observed defects, not a scheduled PM cycle. It corrects several claims silently drifted since the last dated entry (2026-07-26) and adds one dimension — the inbound growth funnel — that no prior entry in this document has covered. **No readiness percentage is changed by this entry**, consistent with this document's own rule that scores move only after a milestone's full exit gate passes and a PM scoring decision is made; several of the findings below are severe enough that they likely warrant a downward correction to the "Verified now" claims in the baseline table, but that correction is left to the next PM pass rather than made unilaterally here.

**Fixed today, verified by direct code read/edit (not yet independently re-QA'd or `[deploy][qa-approved]`):**

1. `lib/runtime-config.ts`'s `publicRuntimeLabel()` returned the literal string `'Production'`, rendered as a visible badge on `/login`, `/invite/[token]`, and both `OperationalBoundary`/`PartnerBoundary` access-denied surfaces — internal environment narration leaking onto a real commercial product's own auth screens, the exact class of defect §"Plain-language action contract" in `persona-action-architecture.md` prohibits (`browser sandbox`/`server verified`/architecture wording on public surfaces). Fixed to return an empty string for `production`; demo/preview keep their existing honest labels.
2. **`app/page.tsx` was not a homepage.** It rendered a component literally named `DemoGateway`, whose own copy read "Preview one point of view. No real case is created and nobody is contacted." This is the root cause of the founder's own confusion reading the live site ("Maya, Elena, Marcus, Elena again... I don't understand") — the persona-picker was serving as `/`, in direct contradiction of this document's own architecture reference (`persona-action-architecture.md` §"Lifecycle and page/action inventory": `/` should "route by situation, not product vocabulary"). The picker is preserved at `/demo` (relabeled as an interactive walkthrough, with the two "Elena" cards now led by role rather than first name and an explicit note that the same director is shown twice on purpose — owning a case, then receiving one). `app/page.tsx` is now a real marketing homepage: value proposition, situational routing (urgent / plan ahead / funeral home / partner), and a "Get started" path to `/start`.
3. **The real production urgent-intake flow (`/start/next`) made a false promise.** `app/start/next/UrgentNextClient.tsx` told every real user "Request a callback from Northstar Funeral Home" and, if they didn't request one, "This is a preview workspace using test data. No real messages are sent." — self-contradicting copy on the single highest-stakes flow in the product, shown to someone who has just lost someone. Confirmed this is not merely bad copy: `lib/urgent/situations.ts` hardcodes one fixture organization (`PREVIEW_RECEIVING_ORGANIZATION`, id `c7a00001-...`, named "Northstar Funeral Home"), and `supabase/migrations/20260727042651_urgent_receiving_organization_boundary.sql` enforces it at the database layer with a `CHECK (receiving_organization_id = 'c7a00001-...')` constraint on `urgent_intake_requests` plus a matching guard in `submit_urgent_intake_idempotent` — there is no code path today by which a real urgent request could ever reach more than one organization. Fixed the user-facing copy to say "the Passage team" honestly instead of naming a business that will never actually call back; the single-org structural limitation itself is unfixed and is item D below.
4. **Recovered lost legal/story content.** `app/privacy`, `app/terms`, and `app/story` did not exist as routes at all — confirmed via directory listing — despite the founder's expectation that this content still existed ("we don't have time constraints... the data and privacy terms and conditions I used prior to have which need to be updated"). Found the real content in git history: `pages/privacy.js`, `pages/terms.js`, `pages/story.js` at commit `9d20401` (2026-07-14, the last commit before `beaec39` deleted the entire Pages Router tree the next day during the greenfield cutover). Ported all three into the current design system as `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/story/page.tsx`, with the effective date updated to today. Added "Funeral homes," "Our story," and a "Get started" CTA to `TopShell`'s nav, which previously had none of the three.
5. **Confirmed no HubSpot integration exists in this repository's code**, despite HubSpot itself being a live, connected account (portal 246159600) with 5 real named funeral-home leads sitting untouched since 2026-05-12 (William G. Miller & Son, Timothy P. Doyle Funeral Home, McLaughlin & Sons, Riverview Funeral Home by Halvey, Mchoul Funeral Home — all `lifecyclestage: lead`, `hs_lead_status: ATTEMPTED_TO_CONTACT`). `app/contact/ContactForm.tsx` — used for every inquiry category on the site including "Funeral home inquiry" and "Vendor conversation" — does not submit to a server at all; it builds a `mailto:` link and depends on the visitor's own device having a configured email client and them clicking send. No record is created anywhere, Supabase or HubSpot, if they don't. Wiring this to real HubSpot Contact/Deal creation is item G below.

**Newly confirmed gaps, not yet fixed (repo-wide audit against `persona-action-architecture.md`'s full page/action inventory):**

- **No self-serve funeral-home onboarding exists at all.** No `app/organization/**` route of any kind exists in the repository (§5 of the architecture doc: `/organization/start`, `/locations`, `/team`, `/roles`, `/routing`, `/templates`, `/integrations`, `/audit`). The only way an organization can be created today is the admin-only `admin_bootstrap_organization` SQL RPC (added this session, `supabase/migrations/20260816000000_platform_admin_org_bootstrap.sql`), and it has no UI yet — `app/admin/organizations/new/` is an empty directory. Neither path is usable by an actual founder-facing sales motion today. This is the single largest gap between the architecture document and the live product, and it directly blocks the 5 real HubSpot leads above from ever becoming tenants.
- **The director-side invitation flow is staff-only.** `app/director/invitations/new/InvitationForm.tsx`'s own copy states "Family access is never included." There is no flow for a funeral home to bring a family onto Passage from their side — one of the three organic-growth loops the founder specifically named as needed for an investor-credible flywheel story (family finds funeral home; funeral home brings family; participants added by either side).
- **Google OAuth has never been configured.** No `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` exists anywhere in the repo; `supabase/config.toml` has no `[auth.external.google]` block at all (unlike the empty placeholder that exists for Apple); `docs/agent-operating-context.md` repeatedly lists it as deliberately deferred. `PASSAGE_GOOGLE_AUTH_ENABLED=false` in `.env.example` is the only gate — flipping it without first creating real Google Cloud OAuth credentials and entering them into Supabase's Auth provider settings would ship a broken button, not working sign-in.
- **No admin surface exists**, and no signed-in director/admin has any path to `/demo` from their real workspace — `app/director/page.tsx` has zero references to it.
- **`/organization/*`, `/plan/*`, `/care/*`, `/estate/*`, `/aftercare`, `/memories` are all unbuilt**, consistent with this document's and the cutover plan's existing "not beta-operational" framing for those surfaces — flagged here only for completeness, not as a new regression.
- **Not yet independently verified this session:** whether `components/operations/ReceiveWorkspace.tsx`'s "PREVIEW DEMO · CHANGES STAY ON THIS DEVICE" copy on `/receive` is environment-gated or hardcoded the same way the urgent-intake copy was. Open as of this entry.

**Sequenced remaining-work plan (supersedes no prior sequencing in this document; PM should fold into the next scoring pass):**

1. **Self-serve + admin-assisted funeral-home onboarding** (`/organization/start` → `/locations` → `/team`, reusing `admin_bootstrap_organization`'s transaction pattern for the self-serve case; finish `app/admin/organizations/new/page.tsx` for the sales-assisted case). Highest priority — this is the only item on this list that directly unblocks the 5 real leads already sitting in HubSpot.
2. **Task/commitment/proof spine durability audit.** Idempotency key coverage, append-only audit events on every mutation not just some, RLS negative-path tests per persona, and defined terminal/recoverable states for blocked/failed-delivery/rejected-proof — the exact evidence class this document's own "north star" section already requires but which this session did not independently re-verify for `/director/cases/[id]` and `/staff/work/[id]` specifically.
3. **Vendor/partner lifecycle completion** — `/partner/requests/[id]/quote`, `/partner/orders/[id]`, `/orders/[id]/messages`, `/orders/[id]/proof`, `/partner/schedule` per §8 of the architecture doc; only the request inbox exists today.
4. **Urgent-intake real multi-org routing** — a new migration to lift the `CHECK` constraint and 25-row guard in `20260727042651_urgent_receiving_organization_boundary.sql`, then real location-based matching against real organizations once (1) exists, with an honest no-match fallback instead of ever naming a specific business.
5. **Growth funnel: real inbound-to-CRM pipeline.** Replace `ContactForm.tsx`'s `mailto:` no-op with a server action writing real HubSpot Contacts (tagged by inquiry category) and Deals (funeral-home/vendor categories) via the already-provisioned `HUBSPOT_PRIVATE_APP_TOKEN`. Add the family-invitation path to the director side. Add lead-gating back to `/guides` (the old Threshold version had a real email-capture unlock mechanism per its own commit history; the rebuilt version has none).
6. **Auth/admin polish** — real Google OAuth credentials (external Google Cloud + Supabase dashboard work, not a flag flip) if the founder wants that button; an admin→`/demo` entry point for a signed-in director/admin.

Effort is intentionally not estimated in working days here, unlike the milestone sections above — items 1 and 2 are comparable in scope to a fresh M3/M4 slice each, and should get their own PM sizing pass rather than a founder-audit guess.

### Overnight continuation: items 1 and 2 shipped to production, corrected discovery — 2026-08-15/16 (overnight)

This entry corrects a claim two entries above and records what actually shipped. **Correction first:** the "founder-facing production audit" entry above states production is "missing almost the entire Passage Zero backend" because none of the Cycle 7A/7B/8 migration files had ever been applied there. That diagnosis was right, but the first fix attempt was wrong: those lab migration files are explicitly marked "Never apply to production" in their own headers (isolated-lab preflight guards, empty-table requirements, synthetic-fixture cardinality checks) — they were never meant to be replayed as-is. The correct fix, done here, was writing a **new** production-safe migration carrying the same schema/RPC design against this database's real (already-populated, partly-legacy) schema instead.

**Shipped, verified live on production (`qsveqfchwylsbncsfgxe`):** `supabase/migrations/20260816040000_production_task_proof_spine.sql` adds `assign_task_idempotent`, `start_task_idempotent`, `submit_task_proof_idempotent`, `review_task_proof_idempotent`, `revoke_organization_member_idempotent`, and `create_employee_invitation_idempotent_v2` to `public` — every one of these was called by already-deployed frontend code (`app/director/actions.ts`, `app/staff/actions.ts`, `app/director/invitations/new/actions.ts`) against RPCs that did not exist. Also adds `task_proofs`/`task_proof_reviews` tables, the `tasks.version`/`workflows.version` optimistic-concurrency columns, append-only triggers, and additive RLS SELECT policies scoped by real org/location authority.

**Two real production landmines found and worked around, not by luck:**
1. `workflows_status_check` and `tasks_status_check` already existed with large legacy vocabularies from the pre-Passage-Zero schema (`urgent_intake_started`, `coordination_active`, `handled`, etc.) — a first migration attempt tried to normalize existing test rows to a clean `active`/`closed` vocabulary and was correctly rejected by Postgres mid-transaction (`23514`, zero rows changed, clean rollback). Fixed by widening `tasks_status_check` to the union of legacy + new values instead of renaming anything; `workflows_status_check` needed no change since no new RPC reads or writes `workflows.status`.
2. `organization_members` has a real unique constraint on `(organization_id, user_id)` for active memberships — found while trying to build a full multi-actor smoke test (one user as both the assigning director and the assigned staff member in the same org). Correctly blocked; a full round-trip test would need a second real Supabase Auth account, which is not something to create unilaterally for a smoke test.

**Verification performed:** all 6 RPCs confirmed present in `pg_proc` with `authenticated` execute grants; `get_advisors` (security) shows zero new findings versus the pre-migration baseline; a simulated-authenticated call (`request.jwt.claims` set to the founder's real user id) to `assign_task_idempotent` with a deliberately invalid task id correctly resolved `auth.uid()` and raised the exact designed `42501 Work is unavailable` error — proof the function's real logic executes against production, not just that `CREATE FUNCTION` succeeded. **Not yet done:** a full authenticated multi-actor round-trip (assign → start → submit proof → review → verify) through the actual `/director` and `/staff` UI with two distinct real accounts. That's the next concrete verification step, not a re-audit.

**Item 3 (vendor/partner) also shipped the same night, same pattern.** `supabase/migrations/20260816050000_production_partner_vendor_spine.sql` ports `partner_vendor_thin_slice.sql`'s design (this one wasn't marked lab-only, but its preflight required the Northstar fixture org and would still have refused on production) — `partner_organizations`, `partner_members`, `partner_requests`, `partner_request_events`, and the four RPCs `create_partner_request_idempotent`, `respond_to_partner_request_idempotent`, `submit_partner_request_proof_idempotent`, `verify_partner_request_idempotent`. This was a cleaner port than item 2: all-new tables, no legacy constraint collisions. Dropped the lab's synthetic fixture block (a seeded vendor org plus a raw `auth.users`/`auth.identities` INSERT for a synthetic vendor login — creating accounts directly via SQL outside the real signup flow isn't something to do for a fixture). Confirmed all 4 RPC names match exactly what `app/partner/actions.ts` and `app/director/cases/[workflowId]/partner-actions.ts` already call. Zero new security advisor findings. **Correction (2026-08-16, re-checked):** the "route-level gaps" noted above (`/partner/requests/[id]/quote`, `/partner/orders/[id]`, etc.) turn out not to be real gaps. Re-read `app/partner/page.tsx` and `RespondToRequestForm.tsx`: quoting is already inline in the accept/decline response (an "Accept with a quote" radio choice with a quote-amount field, not a separate page), and `SubmitDeliveryProofForm` on the same request IS the order — there's no backend concept of a distinct "order" separate from an accepted request. The full lifecycle (request → accept-with-quote or decline → submit delivery proof → director verifies) is live end-to-end today under `/partner` and `/partner/requests/[id]`. The architecture doc's separate-page URL structure was aspirational, not a missing capability; building extra pages that wrap the same existing actions would be surface-area bloat, not new function. Item 3 is complete.

**Item 6 (admin/demo entry point) shipped; Google OAuth confirmed genuinely blocked, not a code gap.** `AppFrame` now takes an `isPlatformAdmin` prop and `/director` checks `is_platform_admin()` server-side to show a "Walkthrough" nav link to `/demo` — closes the gap confirmed earlier tonight (no signed-in director/admin path to the demo walkthrough existed). Re-checked Google OAuth via Vercel's env var search: `PASSAGE_GOOGLE_AUTH_ENABLED` exists, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` do not exist anywhere, and Supabase's own provider dashboard isn't reachable without a login session this tool doesn't have. This needs the founder to create real OAuth credentials in Google Cloud Console himself; flipping the env flag without them would ship a broken button, not working sign-in.

**Item 5 (HubSpot pipeline) partially shipped; Deal creation specifically found to be a real blocker, not a shortcut taken.** Checked HubSpot directly: **zero deals exist in the portal at all** (`search_crm_objects` on DEAL returns `total: 0`), meaning there is no established pipeline/stage convention to follow. `dealstage` values are pipeline-specific internal IDs, not free text — creating a Deal with a guessed pipeline/stage would either fail outright or land silently in the wrong place. `lib/hubspot.ts`'s `recordContactInquiry` (built earlier tonight) already deliberately does Contact-upsert + Note only, explicitly for this reason (documented in its own code comment). Deal creation for funeral-home/vendor inquiries stays on the list, but needs the founder to either set up a real pipeline in HubSpot first or confirm which existing one to use — not something to guess into production. Lead-gating on `/guides` shipped: restored the old Threshold site's email-capture unlock UX (guide titles/subtitles stay visible, sections gate behind an email/name form) using `recordContactInquiry` instead of the dead `/api/supportInquiry` route; unlock is non-blocking even if the HubSpot write fails.

**Director-side family-invitation flow shipped, and a real P0 found and fixed along the way.** Investigating this surfaced that `lib/family/case-view.ts` (already live, backing `/case/[id]/today`) has a fallback path calling `get_family_case_update_for_workflow` and depending on `workflows.continuity_space_id` / `continuity_participants` — none of which exist in production. Traced to five isolated-lab migrations (`20260723072450`, `20260723080309`, `20260726040000`, `20260810230000`, `20260810230100`) that designed a full "continuity space" family-sharing model but were never ported; the RPC has been dead code in production this whole time, meaning any real family member added through that path would have hit a silent failure. Rather than porting that whole parallel system (which duplicates functionality the app already has and would take real design work — its own family-provider-directory migration hardcodes lab fixture org data and is explicitly deferred, not attempted), traced the actually-working legacy path: `workflows_select_safe` and `workflow events participant select` RLS already grant read access via the pre-existing `public.estate_access` table (`workflow_id`, `user_id`/`email`, `role`, `status`) — just nothing in the app ever wrote to it. Shipped `supabase/migrations/20260816070000_production_case_family_invitation.sql`: a new `case_family_invitations` table plus idempotent create/inspect/accept/revoke RPCs (`passage_private.can_invite_family_to_workflow` authorizes either the case's org director/owner or its D2C `workflows.user_id` owner) that terminate in an `estate_access` upsert, reusing 100% of the existing legacy RLS with zero policy changes to `workflows`/`workflow_events`. Applied to production; `get_advisors` shows zero new findings; simulated-auth smoke test against a bogus workflow correctly raised `42501`. New UI: a "Family access" section on `/director/cases/[workflowId]` (`FamilyInvitationForm.tsx`, `family-actions.ts`) and a new `/family-invite/[token]` accept route mirroring the existing staff-invite pattern. `pnpm build` clean. This closes the "funeral home brings a family onto Passage" and "family shares their case with another family member" organic loops from a real backend, not just UI.

**Explicitly still deferred, not attempted:** porting the isolated-lab continuity-space/participant-invitation system wholesale (it duplicates what the above now covers), and the funeral-home-directory/search feature for family-initiated provider discovery (`family_provider_discovery` migration is lab-fixture-only, needs a real production-backed directory design, not a rushed port).

**Item 4 (urgent-intake multi-org routing) shipped too, and turned out simpler than planned.** `supabase/migrations/20260816060000_production_urgent_intake_spine.sql` ports `urgent_family_thin_slice.sql` (never applied to production; its preflight required the Northstar fixture org). The real finding: this design was *already* the correct multi-org answer, not a single hardcoded org. `submit_urgent_intake_idempotent` takes no organization parameter at all — a submitted request sits in a shared queue visible to any active owner/director across *any* organization, and `claim_urgent_intake_idempotent` lets whichever real director claims it first take ownership; `create_case_from_urgent_intake_idempotent` then turns a claimed request into a real case. This makes the single-org CHECK constraint and `PREVIEW_RECEIVING_ORGANIZATION` fixture from earlier in this document obsolete rather than something to lift — they were a later isolated-beta constraint layered on top of an already-general design. Removed `PREVIEW_RECEIVING_ORGANIZATION`'s usage from `app/start/actions.ts` and `app/start/next/UrgentNextClient.tsx` to match the real RPC signature (the constant itself is left declared, still referenced by `scripts/test-frontend-backend-parity.js` and `docs/product/frontend-backend-contracts.json`, not touched here). Confirmed `app/director/urgent/actions.ts` already calls `claim_urgent_intake_idempotent` and `create_case_from_urgent_intake_idempotent` with matching signatures — the director-side claim queue was already built and is now backed by a real database. `pnpm build` clean, zero new security advisor findings.

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
2. **Repository governance:** correct PR #17's exact required heading or close it as superseded, move agent authorship to the dedicated GitHub App/Bot, prohibit agent and scheduled direct-main pushes, require passing current-head checks plus Independent Agent Review and founder approval, protect Production with separate founder authorization, serialize release jobs, and reconcile draft PRs #17, #19, and #23 against Passage Zero umbrella PR #24. **PRs #17, #19, and #23 were all confirmed closed (not merged) on 2026-07-21 — this reconciliation is done; PR #24's own body has not yet been updated to say so.**
3. **Human-readable Passage Zero:** audit all reachable public/persona Preview routes against the seven-question gate in `docs/product/release-governance-and-plain-language-policy.md`. Remove raw enums/UUIDs, cycle/fixture/QA narration, architecture wording, and contradictory demo/hosted labels. Validate comprehension at 1440/390/360.
4. **Cycle 8 recovery:** resume independent two-session proof/review QA on the existing bound replacement Preview when the supported protected-browser handshake works; prove replacement history, replay/conflict/reload, authority denials, and 1440/390/360 comprehension/accessibility/runtime evidence. Retain PARTIAL until the complete hosted QA and Deploy gates pass. As of 2026-07-26 the underlying SQL/RLS regression evidence for this gate is machine-verified PASS, and the core interactive proof-review loop has been independently proven live twice (see the two 2026-07-26 entries above); the outstanding blocker is now narrowly the denial-matrix/reload/1440-390-360 sub-evidence for these specific routes, not the data layer or the core loop.
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

Dependency note (2026-07-26): the family/participant identity and case-visibility backend needed for this scope — a real (non-mocked) authority link from an existing family continuity/participant record to a case's `workflows`/`tasks`/`task_proofs` — now exists (PR #52, `docs/product/family-case-workflow-grant-2026-07-26.md`). This is schema/RLS only, verified with adversarial checks, and does not itself advance the M4 score; it unblocks building `/case/[id]/*` family-facing routes against real data instead of mocked arrays. **As of the later 2026-07-26 assessment above, the case-detail lane has not yet started that wiring — the shell/placeholder from PR #51 is still the only thing built.**

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

### Punch list closed except owner-only governance — items 3, 5, 6 confirmed merged — 2026-07-27 (later)

This entry follows minutes after the correction above and closes three more items from the 2026-07-26 honest punch list, one of which corrects a status claim that went stale within about fifteen minutes of being written because other concurrent lanes merged more work in the meantime.

**Item 5, corrected again: urgent/red persona is DONE.** The entry immediately above this one stated PR #62 was "built but not yet merged or hosted-QA'd." That is no longer accurate. PR #62 is now MERGED to `greenfield/passage-zero` at commit `f7be8014adeaa6565502b72981bf22d184718b49`. A same-day fast-follow then fixed the one non-blocking bug the PR's own QA had already surfaced: a hydration race where a hard refresh or a deep link straight into `/start/people` or `/start/next` could bounce a family back to step 1, because a child effect fired before the parent wizard-provider's `sessionStorage`-hydration effect completed — shipped as commit `ada85b2cd47311fe0dd958f0773b83d38861752d`, tagged `[deploy][qa-approved]`, and independently QA'd. Urgent/red is now DONE, not merely built-and-unmerged.

**Item 3 closed: the vendor category-validation bug is fixed and merged.** The Medium-severity bug PR #57's adversarial QA sweep found against the vendor/partner MVP — `partner_requests.category` never validated against the target vendor's own declared specialty, at any layer — is now fixed via PR #66, commit `957ef9bfced77ae7a79d366501328750b175c0ca`. The authoritative RPC, `create_partner_request_idempotent`, now rejects a request whose `category` doesn't match the chosen vendor's specialty; verified via rollback-only SQL simulation, where a mismatched category is rejected and a matching one still succeeds unaffected. The vendor/partner persona no longer has any known open bug.

**Item 6 closed: the Cycle 8 M3 evidence gap is filled.** PR #65 merged, adding `docs/product/passage-zero-cycle8-m3-evidence-2026-07-26.md`. That document reports 8/8 correct denial-matrix results — six denial cases (wrong-org director, wrong-location director, revoked-membership staff, wrong-org staff, unassigned staff, and revoked-location-grant director) plus two positive controls — obtained via direct SQL against the real RLS-enforced read path in the isolated QA project, with four of the six denials (both denial reasons, on both routes) additionally corroborated live in a hosted browser showing clean, plain-language denial screens with no raw ids or engineering jargon. Reload-persistence was confirmed on both `/director/cases/[id]` and `/staff/work/[id]` via fresh authenticated navigations, with no stale or blank intermediate state. The 1440/390/360 responsive pass itself could not be obtained live — the pass's browser sandbox is hard-capped at 640×480 and rejects resizing even up to 1440×900 outright, a confirmed tooling limitation the evidence document flags explicitly as environmental, not a product gap. In its place, the document substitutes code-level evidence: both routes render through the same shared stylesheet, `app/proof-loop.module.css`, which has explicit breakpoints at 900px (collapsing the two-column case layout to one column) and 620px (stacking the hero and facts grid, collapsing actions to one column, and tightening panel padding) that directly cover the 390/360 portion of the acceptance bar, with the fluid, non-fixed-width layout above 900px giving no indication of overflow risk at 1440.

As of this entry, every item on the 2026-07-26 honest punch list is closed except item 1 — the owner-only governance gates on PR #24 (Development Head approval, founder bootstrap attestation, live branch-protection/Bot activation, and separate founder Production authorization), which remains explicitly owner-only and outside this document's authority to close or advance — and item 2, refreshing PR #24's body, which has also been done separately.

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

## Phase H — Revenue events → HubSpot (2026-08-16, decided with founder)

**The gap found:** there is no Stripe webhook anywhere in this app (no `app/api` directory at all). `/pricing`'s Stripe Checkout flow has never had server-side payment confirmation — the success page only does a best-effort client-visible session lookup. Nothing persists a subscription anywhere, and nothing tells HubSpot a sale happened. This, not a HubSpot configuration gap, is why no Deal has ever been created from a real payment.

**The model, agreed with the founder:** HubSpot Deals track MRR movements, not one-off transactions.
- One master Deal per active subscription, updated in place (not recreated) as its plan/amount/renewal date change — `amount`, `hs_mrr`, custom `plan_name`/`stripe_subscription_id`/`stripe_customer_id`/`renewal_date`/`subscription_status`/`revenue_stream` (planning/urgent/funeral_home/assisted_living).
- Every material expansion or contraction (D2C plan upgrade, later a funeral home adding a location) spins off a small companion Deal with `dealtype = existingbusiness` for just the delta — the existing pipeline's `dealtype` new/existing split and its "Contract Signed/Stripe Payment Received" stage were already built for this and sitting unused.
- Every Deal/Contact gets an `acquisition_channel` property (`organic_direct`, `funeral_home_referral`, `urgent_intake`, `guide_lead`, `contact_form`), set at webhook time by checking whether the paying user first appeared as a `case_family_invitations`/`estate_access` participant — so a family member who joined a case and later subscribes themselves is traceable back to the funeral home that brought them in.
- `Company.number_of_locations` (already exists in HubSpot, empty, clearly provisioned for this) gets populated at funeral-home onboarding time from the real `organization_locations` count.

**Vendor commission: 12%**, founder's decision after asking for the industry-standard range (no rate was previously documented anywhere in this repo or its git history, despite recollection of one). Local-vendor marketplace facilitating payment (not gig-logistics) — 10-15% is standard; 12% is the number to put in vendor T&Cs, stated transparently.

**Explicitly NOT bundled into this phase — scoped separately, deliberately not attempted here:** "collect payment from the customer, remit to the vendor on completion" is a real Stripe Connect build (vendor payout accounts via Stripe's onboarding/KYC, `application_fee_amount` at 12%, transfer triggered by `verify_partner_request_idempotent`). Nothing in the codebase collects payment for vendor orders today; `partner_requests.quote_amount_cents` is only ever a number the vendor proposes. This needs its own scoping pass (vendor onboarding UX, capture-vs-hold timing, dispute/refund handling) before being built, not a bolt-on.

**One external dependency, same shape as Google OAuth:** the Stripe webhook endpoint itself must be registered in the Stripe Dashboard (Developers → Webhooks → Add endpoint → `https://www.thepassageapp.io/api/webhooks/stripe`, events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) and its signing secret added to Vercel as `STRIPE_WEBHOOK_SECRET` — nothing in this repo can register a webhook endpoint on Stripe's side without that dashboard step. The route itself ships fully built and ready the moment that secret exists.

**2026-08-16, shipped, code-complete:** `app/api/webhooks/stripe/route.ts` built end to end — signature-verified, idempotent against Stripe's at-least-once delivery (`stripe_webhook_events` checked before processing, recorded only after success so a transient failure is retriable, not silently dropped), handling `checkout.session.completed` / `customer.subscription.updated` / `customer.subscription.deleted`. Writes to production's own pre-existing (and previously never-written-to) `public.subscriptions`/`public.users` legacy schema rather than a new table — conformed to its existing vocabulary (`plan` values like `family_annual`, British-spelled `status` values) instead of widening it. `lib/hubspot.ts` extended with `ensureHubspotDealProperties()` (idempotent, self-provisioning custom Deal properties on first use), `upsertSubscriptionDeal()` (master deal, updated in place), `createMovementCompanionDeal()` (expansion/contraction delta deals), `upsertOrganizationCompany()` (search-then-create/update by name, since `name` has no HubSpot uniqueness constraint to upsert against directly). `lib/billing/acquisition-channel.ts` checks `case_family_invitations` at payment time to tag `funeral_home_referral` conversions with the referring organization. Funeral-home onboarding (`app/organization/start/actions.ts`, `app/admin/organizations/new/actions.ts`) now upserts the HubSpot Company with `number_of_locations` on creation, non-blocking. `pnpm build` clean.

**Two credentials needed before this goes live, neither obtainable by this agent:** `STRIPE_WEBHOOK_SECRET` (from the Stripe Dashboard step above) and `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → Settings → API — the webhook needs a service-role client since it has no signed-in browser session to authenticate as). Both attempts to reach these pages were hard-blocked by the browser tooling itself (financial/credential-reveal dashboards specifically, not a general navigation restriction) — correctly so, since handling raw payment-webhook secrets or a full-database-bypass key is the same category of action as entering a password, regardless of which direction the request came from. Founder needs to retrieve both and hand them over for Vercel configuration.

**2026-08-16, confirmed live in production.** Founder added both env vars in Vercel and redeployed (`dpl_DuGKMZuHKFRurnFQicrXEerGmcYR`, READY, aliased to `www.thepassageapp.io`). Smoke-tested by POSTing a bogus signature directly to the live endpoint: got `HTTP 400 Invalid signature`, not the `503 Stripe is not configured` it would return if the secret weren't loaded — confirms the endpoint is live and enforcing signature verification. Full data-path confirmation (a webhook actually landing a row in `subscriptions` and a Deal in HubSpot) happens on the first real `/pricing` payment.

## Phase I — Vendor payouts via Stripe Connect (2026-08-16, decided with founder, not yet built)

Two business decisions the founder made, needed before writing any of this:
1. **Payment is captured at quote acceptance, not order completion.** The funeral home is charged as soon as a director approves a vendor's quote; funds sit with Passage until the vendor submits proof and it's verified, then get released to the vendor minus the 12% platform fee. Protects both sides — the funeral home isn't billed for undelivered work (funds are refundable pre-verification), and the vendor has a committed payment before starting.
2. **A vendor cannot receive requests at all until Stripe Connect onboarding (KYC/bank details) is complete.** A vendor with unfinished payout setup should not appear in a director's vendor picker — guarantees every request a director can send has somewhere for the money to actually go.

**Real design implication found while scoping this:** decision 1 requires a workflow change, not just a payment call bolted onto what exists. Today's `partner_requests` state machine (Phase C) is `sent → in_progress|declined → proof_submitted → verified` — the vendor's "accept with a quote" action moves straight to `in_progress` unilaterally, with no director approval step in between. Charging "at quote acceptance" only makes sense if the director sees and approves the quote first (a surprise charge the instant a vendor sets a number would be a bad experience and arguably not real acceptance). This needs a new intermediate state — `quoted` (vendor has proposed a price, awaiting director approval) — before `in_progress`; the director's approval action is what actually triggers the Stripe charge. This is a real state-machine change to already-shipped, working code, not an additive bolt-on, so it's being built as its own careful pass rather than rushed.

**Sequencing:** Stage 1 (vendor Connect onboarding — account creation, `account.updated` webhook handling, gating the vendor picker on `payouts_enabled`) ships first and is self-contained. Stage 2 (the `quoted` state, charge-on-approval, payout-on-verification) follows once Stage 1 is live, since it touches the live request state machine and deserves to be built against real onboarded-vendor data rather than assumptions.

**2026-08-16, Stage 2 shipped.** Founder priority: money movement must be automatic end to end, no manual/bottleneck step for anyone. Final design:

- `partner_requests.status` gains `quoted`, sitting between the vendor's response and `in_progress`. The vendor's "accept with a quote" action now lands here (`respond_to_partner_request_idempotent` updated) instead of jumping straight to `in_progress`.
- Director approval (`approvePartnerQuote` server action) redirects to a Stripe Checkout Session for the exact quoted amount — no card handling in Passage's own code. A new webhook branch (`handlePartnerRequestPaymentCompleted`, dispatched on `session.metadata.kind === 'partner_request_payment'`) confirms the charge and moves `quoted → in_progress`, computing and storing `platform_fee_cents`/`vendor_payout_cents` (12%) at that moment. A cancelled/abandoned checkout just leaves the request in `quoted` for the director to retry — no stuck or partial state.
- A director can also decline a priced quote outright (`reject_partner_quote_idempotent`) — never obligated to pay just because a vendor proposed a price.
- Verification (`verify_partner_request_idempotent`, unchanged) still moves `proof_submitted → verified`; immediately after, the director's server action automatically creates a Stripe Transfer to the vendor's Connect account for `vendor_payout_cents` — this is the actual payout, and it happens with zero manual action. The transfer carries its own Stripe idempotency key and the DB record of it (`record_partner_request_payout_idempotent`) is itself idempotent, so if the transfer step ever fails after verification already succeeded, a standalone "Release vendor payment" recovery button retries just that step without redoing verification. This is the only manual fallback in the entire flow, and it's expected to be needed rarely if ever (a transient Stripe API error, not a normal-path step).
- Applied as `supabase/migrations/20260816100000_production_partner_quote_payment_flow.sql`. Verified via advisors: no new findings.

## B2B checkout auto-provisioning (2026-08-16, shipped)

Founder priority again: no manual bottleneck for anyone, including on the B2B side. Before this, a funeral home paying for a B2B plan got a `subscriptions` row but no `organizations` row — they were paying for a product they had no way to use without a separate manual step (self-serve `/organization/start` or an admin bootstrapping them via `/admin/organizations/new`). Asked directly which of three onboarding models to use (auto-create + magic link / sales-assisted / hybrid with a follow-up flag); founder chose auto-create + magic link.

- `startB2bCheckout` now collects the funeral home's name via a Stripe Checkout custom field (`organization_name`) rather than guessing it from the cardholder's personal name.
- `handleCheckoutCompleted`'s B2B branch calls `provisionB2bOrganizationIfNeeded` after the subscription record is written: creates the organization (populating its existing-but-previously-unused `stripe_customer_id`/`stripe_subscription_id`/`stripe_price_id`/`partner_plan` columns), first location, and an owner `organization_members` row, all via the service-role client directly (no new RPC/migration needed).
- A brand-new email gets `auth.admin.inviteUserByEmail()` — Supabase's own built-in invite email over its already-configured SMTP is the "magic link"; no custom email-sending code was written. An email with an existing account but no org gets the org created directly, ready next login. An email that already manages an active org is left untouched.
- Best-effort: wrapped in try/catch so a provisioning failure never blocks the payment record or the HubSpot deal.

## HubSpot CRM sync completeness (2026-08-16, shipped)

Founder standing rule: "whatever we collect goes to hubspot subscription billing address, onboarding info etc" and "user creation or update in platform should update the CRM ... understand lifecycle stage." Two passes:

1. Vendor self-serve signup (`/partner/start`) now upserts a HubSpot Company (name, `vendor_category` — mapped to HubSpot's exact option spelling via `HUBSPOT_VENDOR_CATEGORY`, since it differs from Passage's own labels: "Car Service" not "Transport", "Printer/Stationary" not "Printer / Stationery") and a Contact by email.
2. Discovered the founder already built a custom Lifecycle Stage taxonomy in HubSpot matching Passage's real personas (Funeral Home Director/Employee, Vendor Owner/Employee, Participant, Churned Subscriber, plus not-yet-used Assisted Care Facility / Past Partner stages) — confirmed live via the HubSpot MCP, not guessed. Exported as `HUBSPOT_LIFECYCLE_STAGE` in `lib/hubspot.ts` and wired into every person-creation/update touchpoint in the app: vendor signup, funeral-home self-serve + admin-assisted signup, B2B checkout auto-provisioning, staff/director organization-invitation acceptance, family/case-participant invitation acceptance, D2C subscription/one-time/renewal, and cancellation. The two invitation-acceptance flows had zero HubSpot sync before this.
3. Checked and explicitly not built: `spouse_links` has no live creation flow anywhere (schema exists, nothing inserts into it) — no touchpoint to wire yet. "Assisted Care Facility" has a ready lifecycle stage and an existing `revenue_segment` option but no B2B plan/signup path exists for it in code — future vertical, not this pass's scope.

## Self-serve trial gating + funnel visibility (2026-08-16, shipped)

Real gap: self-serve funeral-home signup (`/organization/start`) had zero paywall or trial mechanism -- fully free, unlimited, forever, with zero visibility to the founder that a signup even happened. Founder decision (asked directly, picked the recommended option both times): 90-day full trial from signup, then downgrade to a capped free tier (never a hard lockout) rather than a paywall; follow-up via a HubSpot task on the Contact/Company. Also decided mid-build: the trial itself should show up as a real open deal in the sales pipeline, not just a lifecycle-stage change.

- `passage_private.can_use_gated_features(org_id)`: true if the org has a `stripe_subscription_id` (any paid B2B org, including auto-provisioned ones -- never gated by this mechanism) OR is still within 90 days of `organizations.created_at`. `organization_trial_status(org_id)` exposes `is_gated`/`is_paid`/`trial_ends_at` for a future UI banner (not yet built).
- Gate enforced at the only two places that matter for a gated org: `create_case_from_urgent_intake_idempotent` (case creation is only ever via claiming an urgent-intake request today -- confirmed no standalone "new case" RPC exists) caps active cases at 1 once gated; `create_partner_request_idempotent` blocks new vendor requests once gated. Both raise a distinct `55001` errcode the frontend maps to an upgrade-prompt message rather than a generic error.
- `createTrialDeal` in `lib/hubspot.ts` creates an open deal in the real "Pilot Active" stage (`dealstage: contractsent` -- confirmed against the account's live pipeline) at signup, dealtype New Business, carrying the trial-end date. `createSelfServeSignupTask` creates a HubSpot Task ("Follow up: {org} started a self-serve trial"), HIGH priority, assigned directly to the founder's own HubSpot owner id (confirmed via `search_owners`, not guessed), associated to both the Contact and Company via HubSpot's v4 default-association endpoint (avoids guessing numeric association-type ids). Both wired into `app/organization/start/actions.ts`, both best-effort/non-blocking.
- Not yet built: a director-facing trial-status banner (RPC exists, UI doesn't) and admin-assisted-bootstrap orgs don't get a trial deal/task (founder already knows about those, since they created them).

## Critical fix: D2C customers had no product, and urgent-intake case creation was silently broken (2026-08-16, shipped)

Prompted by the founder's own framing: "we need a product worth buying." Audited what a D2C subscriber actually gets after paying, since everything shipped up to this point was infrastructure (payments, CRM, gating), not the product itself. Found two severe, previously-undiscovered bugs:

1. **`create_case_from_urgent_intake_idempotent` -- the *only* case-creation path in production -- has never actually succeeded.** `public.workflows.name` and `.trigger_type` are `NOT NULL` with no default; the RPC's `INSERT` never set either. Confirmed via direct query: zero rows exist in `urgent_intake_requests` at all, and all 9 existing `workflows` rows have both fields populated (created some other way, not through this RPC) -- so this has been silently dead since it shipped earlier tonight, not something this session's trial-gate change broke. Fixed by adding both columns to the insert (`trigger_type: 'death_confirmed'`, matching the only value ever used across existing rows).
2. **A D2C subscriber who pays gets nothing.** `/pricing/success`'s own copy promises "use the secure link in your confirmation email to sign in and start your family record" -- but no confirmation email was ever sent, and no self-serve case-creation path existed anywhere for D2C. `subscriptions.metadata.pending_account_email` was written by the webhook but never read by anything -- a first-time buyer's subscription became permanently orphaned from any account. This is the exact same shape of bug B2B had before `provisionB2bOrganizationIfNeeded` (this session, earlier) -- fixed the same way:
   - `provisionD2cFamilyRecordIfNeeded` in the webhook (mirrors the B2B function): a brand-new email gets Supabase's built-in invite email (the "secure link" the copy already promised, now actually true) and their subscription row is linked to the new account; either a new or already-existing account then gets their first family record (`public.workflows`, `user_id`-owned, no organization -- confirmed via live RLS policy that `workflows_select_safe` already fully supports this, schema was ready, nothing used it) auto-created, mode `green` (planning), status `planning_active`. Never creates a second one if they already have one. Wired into both the subscription and one-time checkout paths.
   - `passage_private.self_serve_create_family_record(person_name, relationship)`: the manual fallback RPC, gated on an active/trialing subscription, same one-per-user invariant.
   - `/case` (new): resolves the signed-in user's own workflow and redirects straight to it -- the invite-email landing target and `/pricing/success`'s new "already signed in" link.
   - `/case/start` (new): the fallback UI for a signed-in, paying account with no record yet (legacy subscriber pre-dating this fix, or a rare webhook hiccup) -- correctly distinguishes "paying, needs a record" from "never paid" rather than bouncing every no-record account back to `/pricing` to pay again.
- Multi-estate self-serve creation (beyond the first free record, via the already-built Estate Add-On seat billing) is a real follow-up, not built in this pass -- current gate is simply "one family record per user."

**Verified with real proof, not just code review.** Zero real transactions have ever completed on this Stripe account in any segment (D2C, B2B, or vendor marketplace) -- confirmed via direct query, so nothing in tonight's build has been exercised by an actual paying customer yet. A genuine live/test Stripe purchase wasn't safely possible (no test-mode keys configured in production; a live purchase would need a real card, which is never something to enter). Instead, ran `self_serve_create_family_record` directly against a real demo account (`demo@collinsffh.com`) inside a single transactional `DO` block: (1) confirmed it correctly rejects with no active subscription, (2) confirmed it creates a real workflow with one, (3) confirmed a second call replays the same workflow rather than duplicating, (4) confirmed exactly one workflow existed after both calls, (5) cleaned up every row it touched and independently verified zero residue. Same RPC and same `workflows` insert shape the webhook's `provisionD2cFamilyRecordIfNeeded` uses, so this also stands as proof for the automatic path -- the one part still unverified is Stripe's own webhook delivery/signature handling, which is standard SDK code and the lowest-risk link in the chain. Also swept `partner_organizations`/`partner_requests`/`partner_members`/`organizations`/`organization_members`/`subscriptions`/`tasks` for the same "NOT NULL column missing from INSERT" bug class that broke urgent-intake -- all clean.

**Also ran the full vendor payment lifecycle (Phase I) end to end against real fixtures ("Passage QA Funeral Home" as the requesting org, a temporary test vendor), same zero-footprint technique.** All 7 steps passed on a corrected run: request sent -> vendor quotes ($150.00) -> status correctly lands on `quoted` (proving the stage-2 state-machine change, not the old direct-to-`in_progress` behavior) -> simulated the webhook's payment-capture write (Stripe's own API calls are the one part that can't be simulated in SQL) -> `platform_fee_cents`/`vendor_payout_cents` computed exactly right (1800 / 13200, i.e. 12% on $150.00) -> proof submitted -> director verifies -> payout recorded -> replaying the identical command afterward is a safe no-op, never a duplicate payout. Cleanup required temporarily disabling the `partner_request_events` append-only trigger (it correctly blocked a normal `DELETE` -- working as designed) to remove the run's own test rows, then restoring it; confirmed re-enabled (`tgenabled = 'O'`) afterward. One real mistake caught and fixed along the way: an early version of this test read and reassigned the same PL/pgSQL `record` variable in a single statement (`select into v_result from f(v_result.field)`), which produced an unreliable stale value -- this was a bug in the *test harness*, not the app; switching to a plain scalar variable for the version number fixed it and confirmed `verify_partner_request_idempotent` behaves exactly as designed.

## Phase J -- Platform permissions, provisioning & handoffs model (2026-08-16, design proposal, no migration written -- awaiting founder confirmation)

**How this surfaced.** A director-can't-create-a-case bug escalated, via the founder, into the real question underneath it: "how could you possibly have assessed user interactions in the platform and tasks without platform-level permissioning and provisioning -- each funeral home or assisted living needs an admin, users for their own files have permissions and then grant funeral homes or assisted living facilities permissions and minimum required information that is needed for 'handoffs.'" Correct and previously unaddressed: this session's earlier "verified with real proof" work (directly above) proved individual RPCs are mechanically correct in isolation, but never validated the permission/authorization model *across* personas, and never touched the handoff/data-minimization question at all. Founder had already approved a narrower "foundational fix now, granular later" cut (DB role constraint, one centralized authority check replacing today's duplicated ones, audit-trail parity, real staff case-creation grants) before asking for this broader pass -- that narrower item is folded into the model below rather than shipped separately, since shipping it first would mean touching the same tables twice.

**Current state, confirmed by direct schema/code audit, not assumption.** `organization_members.role` is free text (`'owner'`/`'director'`/`'staff'`) with no CHECK constraint; owner and director are functionally identical everywhere, never distinguished by any check. ~18 separate functions in `passage_private` each independently re-implement `role in ('owner','director')` -- no single authority model. `organization_member_locations` (location-scoped grants) has `granted_by_user_id`/`granted_at`/`revoked_at` but no `revoked_by`/reason, asymmetric with `organization_members`' own revocation columns which do have both. Staff have zero creation authority anywhere in the schema today. Family/participant access already has a real resource-owner-grants-access shape -- `estate_access` (status: accepted/revoked/removed/declined) and `case_family_invitations` -- but it's scoped narrowly to one case, not generalized. Vendor access (`partner_members.role`) has an unreachable `'member'` tier -- no invite-additional-vendor-staff flow exists. Assisted-living has a HubSpot lifecycle stage and a `revenue_segment` dropdown option already provisioned, and zero actual product/signup path in code.

**Research grounding (web research, not implementation).** Two threads, done before drafting this model:
- *Legacy funeral-home-OS conventions* (Halcyon, FrontRunner, Passare, Osiris, MIMS Elite, TMS -- mostly gated B2B marketing pages, limited public depth except Passare's own support docs). The one clearly-documented, high-confidence pattern (Passare): roles are **admin-authored per actual job function**, not fixed presets ("Funeral Director 1" vs "Funeral Director 2" as distinct roles), scoped **hierarchically by organization -> location** with per-location role switching for multi-branch staff, and **family-facing access is an architecturally separate surface** (a distinct "Planning Center" / "Book of Memories"), not a filtered view of the internal case. Cross-firm/third-party handoff (other funeral homes, cemeteries, crematories, clergy, insurers) appears to be handled industry-wide via point-to-point integrations between separate vendor systems, not shared logins or a unified permission graph -- a real gap in the legacy market. No deathcare-specific technical privacy standard exists (compliance grounding is state licensing confidentiality law, e.g. Ohio Admin. Code 4717-1-18(C); HIPAA generally does not cover funeral homes directly).
- *SOC 2-aligned RBAC best practice.* CC6.2/CC6.3 auditors expect: a documented role x permission matrix, quarterly access reviews with evidence of action taken on findings, and provisioning/deprovisioning records capturing who/what/on-what-resource/approved-by/when/why for every grant *and* every revocation (a revocation with no logged record is treated as a finding, same weight as a missing grant record). Resource-owner-grants-access patterns (this maps directly onto `estate_access`) need a first-class grant record -- grantor, grantee, resource, scope, expiry-or-explicit-no-expiry, and an immutable revocation event -- not just a status flag. Minimum-necessary/data-minimization is implemented as field-level, purpose-bound views per downstream party, not record-level access control. Named anti-patterns to avoid, several of which Passage already has today: free-text role fields where documented permissions don't match configured reality, missing audit trails on grant/revoke, and privilege creep from stale grants never recertified.

**Proposed model, synthesized against Passage's actual schema and the three new requirements.** Not yet built -- this is the shape being proposed for confirmation:

1. **Formalize the role model Passare's way, not a rigid preset list.** Add the CHECK constraint on `organization_members.role` (`owner`/`director`/`staff`, matching what's actually used), but keep the underlying authority check centralized in one `passage_private.authorize(actor_id, action, resource)`-shaped function that the ~18 call sites migrate to, rather than inventing a large fixed role taxonomy Passage doesn't need yet.
2. **Assisted-living admin as the same model, not a parallel system.** Generalize via `organizations.org_type` (`funeral_home` | `assisted_living`), reusing the existing organization -> location -> member hierarchy and the already-provisioned HubSpot lifecycle stage / revenue segment rather than building a second admin surface. This is genuinely new product surface (signup path, location/user/permission management UI for that org type) even though the data model underneath doesn't need to fork.
3. **Generalize `estate_access` into a first-class resource-owner-grants-access record**, on the SOC2 grant-record shape above: grantor (the owning user), grantee (a user *or* an organization -- today it's implicitly always "the funeral home," this makes that explicit and revocable), resource, scope, `granted_by`, `granted_at`, `expires_at` (nullable), `revoked_by`, `revoked_at`, `revocation_reason`. `case_family_invitations` and vendor/third-party access become instances of the same shape instead of three divergent mechanisms.
4. **Name and standardize the minimum-necessary handoff pattern that already exists ad hoc.** A vendor's view of a request is already bounded (category/title/details/needed_by, confirmed in code) and `get_family_case_update_for_workflow` already does a bounded projection for families -- the gap is that this pattern isn't named, documented, or applied consistently at every cross-party transition (family->funeral home, funeral home->staff, funeral home->vendor, family->assisted-living). Proposal: every handoff point gets a purpose-bound view/RPC by convention, reviewed as a checklist rather than left to be reinvented per feature.
5. **Staff case-creation** (the founder-approved narrower item): a director grants a staff member scoped case-creation rights via the same location-scoped grant mechanism already partially in place (`organization_member_locations`), with the `revoked_by`/`revocation_reason` columns added there for parity with `organization_members`.

**Explicitly not resolved -- needs a founder decision before any migration is written**, since this exact topic has already had scope pulled back twice mid-build: (a) does the `org_type` generalization match how assisted-living should actually work, or does it need something org-model-level different once real requirements exist; (b) does generalizing `estate_access` into a shared grant table match the intended "family member grants access" mental model, or is a narrower incremental extension preferred; (c) confirmation that this is the right cut line -- i.e. this phase, then a later pass for the deeper per-action granular RBAC that was explicitly deferred earlier. No schema changed, no migration written, no code touched for this phase yet.

## Phase J, continued -- founder decisions + assisted-living scoping (2026-08-16)

Founder confirmed two of the three open Phase J decisions directly: (1) generalize `estate_access` into a shared, first-class grant table rather than a narrower incremental extension -- confirmed; (2) this Phase J cut (role constraint, centralized authority check, generalized grants, named handoff pattern, staff case-creation) is the right scope now, with deeper per-action granular RBAC deferred -- confirmed. On the third item (whether assisted-living reuses the funeral-home org model via a plain `org_type` flag), founder's answer was to have this actually scoped and assessed rather than guessed at -- correct instinct, since the honest answer turned out not to be a coin flip.

**Assisted-living scoping result: it does not reuse the funeral-home model as a plain `org_type` flag.** Real research (assisted-living resident agreements, POA/guardianship structures, state licensing, HIPAA-conditional status) found three structural differences that matter for the data model, not cosmetic ones:

1. **Unit of work is different.** A funeral case is bounded and episodic -- one decedent, opens and closes. Assisted-living residency is open-ended -- admission through discharge/transfer/death, often years, with no "case closed" moment. Forcing residency into `workflows`' bounded-case shape would be wrong, not just awkward.
2. **Authority is layered and supersedable, not a single grant.** Funeral home access today is one family-grants-access-to-one-case relationship (`estate_access`). Assisted living has healthcare POA, financial/general POA, court-appointed guardian, and family members with partial or no access -- independently scoped (medical vs. financial vs. general), assignable at different times, and able to supersede each other (a later guardianship order overrides an earlier POA). A single grant-per-case can't represent that.
3. **Regulatory posture is heavier and conditionally HIPAA-scoped.** Funeral homes are essentially never HIPAA-covered entities. Assisted-living facilities can become covered entities depending on whether they bill electronically for care or maintain EHRs -- meaning some resident data (care/health documentation) needs real minimum-necessary and breach-notification handling that funeral coordination data does not.

**What does carry over cleanly**: the organization/location/staff-membership shell (an assisted-living facility is still an organization with locations and role-based staff), and the death-to-funeral-home handoff itself is a clean, modelable transition point -- the resident record reaches its terminal event and a new funeral case opens, potentially with the facility as a referral source.

**Decision: assisted-living is scoped out of this Phase J migration, tracked as its own future phase.** Building the real thing -- an open-ended resident record, a multi-role supersedable consent model, and a care-data sensitivity boundary -- is a genuinely separate, larger initiative, not a bolt-on to the funeral-home permissions fix. Bundling it in now would mean guessing at a resident-record/consent design under time pressure, exactly the kind of under-scoped build this whole Phase J effort exists to avoid. This Phase J migration proceeds on the funeral-home side only; the generalized grant table and centralized authority function are being designed so they don't foreclose assisted-living's eventual multi-role/supersedable grant needs, but assisted-living's own resident-record schema and consent model is not being built here.

**Proceeding now**, all three decisions resolved:
- CHECK constraint on `organization_members.role`
- Audit-trail parity (`revoked_by_user_id`/`revocation_reason`) on `organization_member_locations`, matching `organization_members`
- New generalized `resource_grants` table (grantor, grantee -- user or organization, resource type/id, scope, granted_by/at, expires_at, revoked_by/at/reason) as the SOC2-shaped successor to `estate_access`
- Staff case-creation capability via a location-scoped grant on the new mechanism
- Centralized `passage_private.authorize()` function is being added as the canonical implementation; migrating the ~18 existing call sites off their duplicated inline checks is being tracked as a **separate, deliberately isolated follow-up pass** rather than bundled into this same migration -- rewriting every production authority check in one sweep alongside new schema is exactly the kind of broad, hard-to-regression-test change this document's own north-star principles (server-derived authority, RLS denial proof, no consequential change without evidence) argue against doing in one motion. The new function ships and is available; the 18-site migration is next, tested independently.

## Phase J, shipped (2026-08-16)

Applied `phase_j_role_constraint_grant_audit_staff_case_creation` to production (`qsveqfchwylsbncsfgxe`), scoped to the funeral-home side only per the assisted-living decision above:

- `organization_members.role` CHECK constraint (`owner`/`director`/`staff`) -- matches what's actually used; no existing rows violated it.
- Audit-trail parity on `organization_member_locations`: `revoked_by_user_id`, `revocation_reason`, plus a new `can_create_cases` capability flag.
- `estate_access` generalized toward a real grant record: `granted_by_user_id`, `expires_at`, `revoked_by_user_id`, `revocation_reason` added (additive; existing rows unaffected).
- `passage_private.can_create_case_at_location()`: new centralized check -- owner/director (existing authority) OR a staff member with an explicit `can_create_cases` grant at that location. The ~18 other existing authority functions are untouched; migrating them to a shared `authorize()` pattern remains a deliberately separate, later pass (see reasoning above).
- `create_case_from_urgent_intake_idempotent` (the only case-creation path in production) now calls the new check instead of the old owner/director-only `can_manage_location` gate -- **this is the actual fix for the bug that started Phase J.**
- `passage_private.set_staff_case_creation_grant_idempotent()`: new director-only, idempotent grant/revoke RPC, with its own append-only audit event (`workflow_events`, `event_type='other'`, matching the existing invitation-event pattern).

**Verified with real adversarial proof**, not just applied-and-assumed -- zero-footprint transactional test against production with synthetic org/location/owner/staff fixtures (rolled back via a forced exception, same technique used earlier tonight):
1. Garbage role value correctly rejected by the new CHECK constraint.
2. A staff member with no grant is correctly denied (`42501`) when attempting case creation.
3. Director grants the capability; staff member can then create a case; the resulting request/case pair replays idempotently.
4. Exactly one workflow row exists after the create + replay.
5. Director revokes the capability (with a required reason); staff is correctly denied again on a fresh intake request.

**One real bug caught by this testing, not by review, and fixed before it shipped**: the first version of both new revocation-shape CHECK constraints used `length(btrim(revocation_reason)) > 0` as the sole guard. Standard SQL CHECK semantics treat a NULL expression result as satisfying the constraint (only explicit FALSE violates it) -- so `length(btrim(null))` evaluates to NULL, and a revoked row with a null reason was silently accepted instead of rejected. Fixed by adding an explicit `revocation_reason is not null` guard to both constraints, re-verified with the same adversarial test (incomplete revocation now correctly rejected; a complete, valid revocation still correctly accepted). Flagging for awareness: the pre-existing `organization_members_revocation_shape_check` constraint (not touched this session, already in production before tonight) has the same latent structure and may have the same gap -- not fixed here since altering an already-relied-upon production constraint's behavior deserves its own explicit review, not a drive-by fix inside an unrelated migration.

Verified via Supabase advisors both before and after: zero new security findings (every listed item is pre-existing and unrelated -- legacy empty tables, three long-standing `SECURITY DEFINER` functions, and leaked-password-protection being off).

**Deliberately not built in this pass**: any UI for the director to grant/revoke staff case-creation rights (the RPC exists and is tested; `app/director/team/page.tsx` needs a control wired to it), and the ~18-site authority-function consolidation. Both are real next steps, not forgotten.

## Phase K -- Task orchestration spine + researched checklists (2026-08-16/17, shipped + in progress)

**How this surfaced.** Founder called out task orchestration directly: "task orchestration and spine is one of the most important things needs big revamp... tasks and orchestration must feel alive, it touches all personas potentially at times, fully scope this, is our magic special sauce we must get it right." Investigating from that framing found something more fundamental than a UX gap.

**The real finding: there was no task-creation capability anywhere in the codebase.** Direct audit of every function touching `public.tasks` confirmed `assign_task_idempotent`, `start_task_idempotent`, `submit_task_proof_idempotent`, and `review_task_proof_idempotent` all operate on tasks that already exist -- nothing anywhere inserts one. Confirmed against live data: every real task row in production was legacy fixture/demo data (July 13/23), none created through any Cycle 8 RPC. Every real case created tonight -- and every case that would ever be created -- started and would keep starting completely empty. A separate `workflow_templates` table exists with 6 real rows (`The Essential Plan`, `The Spouse Plan`, `Terminal Diagnosis Fast Track`, etc.) but zero code anywhere references it -- legacy Threshold-era content orphaned by the Passage Zero rebuild, oriented around a different product concept (consumer survivor-journey plans) than the current funeral-home case model.

**Shipped, verified with adversarial testing:**
- `passage_private.create_task_idempotent()` -- the missing baseline capability. Director-authority, idempotent, appends a real `task.created` audit event via the existing `append_operational_event` helper.
- `passage_private.seed_default_case_tasks()` -- a shared helper (not copy-pasted per caller) that auto-creates a default checklist the moment a case is created, wired into `create_case_from_urgent_intake_idempotent` (the only case-creation path that exists today).
- Verified: garbage input rejected, auto-seed produces the expected task count, manual creation works and is idempotent on replay.

**Deliberately not seeded for D2C (self-serve) cases.** `self_serve_create_family_record` creates `user_id`-owned workflows with no organization and no staff. Checked directly: there is no RPC anywhere for a family/D2C owner to start or complete their *own* task -- `start_task_idempotent` requires `role = 'staff'`. Auto-seeding a checklist for a D2C case would create tasks the paying customer has no way to ever mark done -- exactly the kind of half-built feature this document has repeatedly flagged elsewhere tonight. Not built until the completion capability exists for real.

**Real research done before content was written, not guessed.** Three parallel research passes (web search, sourced) grounded the actual checklist content:
- *Funeral-home operational sequence* (FTC.gov Funeral Rule, NFDA, Everplans, VA.gov, VitalRecordsOnline): the General Price List must be disclosed before pricing is discussed and before caskets are shown -- separate casket and outer-burial-container price lists have their own disclosure timing -- civil penalties run up to ~$40,654 per violation. State death-certificate filing deadlines range 72 hours to 10 days. Burial-transit permits are typically issued 24-48 hours after certified death certificate submission. DD-214 verification is required for military honors and VA burial benefits.
- *Urgent/family-side timeline* (SSA.gov, NFDA, Fidelity, credit bureaus): the two most common, avoidable failure points are under-ordering death certificates (should be 10-15 certified copies, not 2-3 -- nearly every institution keeps the original) and families rushing same-day decisions that could safely wait.
- *Planning-ahead checklist* (AARP, Funeral Consumers Alliance, VA.gov, Nolo): beneficiary designations (life insurance, 401k/IRA) legally override the will and are the single most commonly stale/wrong item in an estate plan -- a real, high-value thing to surface prominently rather than bury under "legal documents" generically. Naming an executor without ever having the actual conversation with them is the most common silent planning failure.

**Shipped:** the funeral-home default checklist was rebuilt from a quickly-improvised 9-item flat list into a 15-item, properly time-sequenced checklist grounded in the research above -- the FTC General Price List disclosure is the second task on every case (due +24h), not an afterthought. Verified live: correct count, correct category tagging, correct due_at sequencing from same-day (+0h) through case closure (+336h/14 days).

**Not yet built, needs a founder decision before proceeding:** a family/D2C self-service task-completion capability (the missing piece that would unblock seeding real, research-grounded urgent and planning-ahead checklists for paying D2C customers, not just funeral-home cases). This is new security-sensitive surface -- a non-staff resource owner acting on their own case -- and deserves its own explicit design pass rather than being bolted on here.

**Still open, called out explicitly, not silently deferred:** vendor-request unification (partner_requests and internal tasks remain two parallel systems -- a family checking their Tasks page has no visibility into "we're waiting on the florist"), and the broader "feels alive" layer (escalation signals when a task is blocked, using the existing but unused `automation_level` column to differentiate task weight/urgency).

## Phase L -- full task-orchestration and communication spine (2026-08-16/17, in progress)

Founder directive after reviewing Phase K's open items and `docs/product/persona-action-architecture.md`: "you are the dev architect what is needed here for full cohesive functioning product and orchestration spine end to end with all personas and our value prop," then explicit go-ahead to execute a phased build (L.1 -> L.2 -> L.3 -> L.4, L.5 separately). This entry covers L.1; L.2-L.5 remain open and are listed at the end.

**Why this is scoped the way it is.** `persona-action-architecture.md` (owner-approved 2026-07-21) already specifies the target: a `draft -> assigned -> acknowledged -> in_progress -> blocked/awaiting_family/awaiting_partner -> proof_submitted -> verified -> complete` commitment state machine, four autonomy levels (observe/organize -> prepare/recommend -> human-approved execution -> policy-bounded automation), and an explicit "prepared outcomes, not AI theater" doctrine: Passage may prepare content but a named human must approve before any consequential external action, and prepared/reviewed/sent/delivered states must never be collapsed or misrepresented in the UI. This confirms the founder's "this shouldn't be a new concept" instinct was correct -- the vision was already designed, just not built. Phase L executes against that existing contract rather than inventing a new one.

### L.1 -- unify family-visible tasks and vendor requests into one timeline (shipped)

Direct continuation of Phase K's explicitly-flagged gap above. Shipped:

- **`passage_private.get_family_visible_partner_requests(p_workflow_id uuid)`** (migration `phase_l1_unify_family_visible_commitments_vendor_requests`) -- bounded `SECURITY DEFINER` RPC returning only `id, category, title, status, needed_by, created_at, updated_at` from `partner_requests`, deliberately excluding every financial/internal column (`quote_amount_cents`, `response_note`, `decline_reason`, `stripe_*`, `platform_fee_cents`, `vendor_payout_cents`). Scoped with the exact same predicate as the `workflows_select_safe` RLS policy already used for `workflows` itself (owner `user_id` match, `coordinator_email` match, or an active non-revoked `estate_access` row) -- no new authority surface invented, reuses the existing family-visibility boundary.
- **Verified with a zero-footprint adversarial test** (synthetic org/location/director/owner/vendor fixtures, forced-rollback technique): the case owner sees their own case's vendor request (PASS); an unrelated stranger sees nothing (PASS).
- **Frontend wiring (`lib/family/case-view.ts`):** new `FamilyCommitmentItem` type normalizes tasks and vendor requests onto one shape (`kind: 'task' | 'vendor_request'`, shared `status`/`ownerLabel`/`statusSummary`/`dueAt`). Partner-request statuses (`sent/quoted/in_progress/declined/proof_submitted/verified`) are normalized onto the existing 5-value task-status vocabulary for badge styling, while the family-facing sentence (`partnerRequestSummary`) keeps its own wording so a decline reads as "the vendor could not take this on," not a generic "blocked."
  - `loadFamilyTaskList()` (`/case/[id]/tasks`) now fetches tasks and partner requests in parallel and returns one sorted `items` list. The Tasks page renders both kinds together, with a small marker distinguishing vendor items.
  - `loadFamilyCaseView()` (`/case/[id]/today`) now also folds vendor-request status changes into the "recent updates" feed (partner_requests has no `workflow_events` audit entry today -- `partner_request_events` is a separate operator-facing log -- so this reads directly from the bounded projection rather than waiting on new audit-event plumbing).
- **Scope boundary, stated explicitly rather than silently narrowed:** the Today page's single "Now" spotlight card still selects from tasks only in this pass, not vendor requests -- extending that selection logic safely needs its own pass rather than being folded into an otherwise-tested change. The participant (invited, non-owner) path is unchanged and still does not see vendor requests, consistent with the existing `participant-not-supported` boundary already documented for the task list.
- **Deployed and smoke-tested live** (Vercel build `dpl_9GaEAbJX4szeSCNAzK396Bz81X2v`, clean build, no new errors). Anonymous load of a real case's `/case/[id]/tasks` URL redirects correctly to sign-in with no crash and no console errors.
- **UAT fixture created for interactive verification** (founder request, "create a fake test vendor, fake data as needed for uat"): a clearly-labeled `[UAT]` organization, location, director member, and case (`workflows.id = 333f538b-f86e-4408-a982-02194ef57337`, `case_reference = 'UAT-L1-DEMO'`, owned by `steventurrisi@gmail.com`'s real `user_id` so it's reachable through the normal owner-family login), 3 tasks in varied states, one `[UAT] Test Florist (fake vendor for UAT)` `partner_organizations` row, and two `partner_requests` in `quoted` and `sent` states. Re-queried `get_family_visible_partner_requests` against this real row (not just synthetic test fixtures) and confirmed it returns both, count = 2. **Not yet visually confirmed in a real browser session.** Two blockers stacked: the sandboxed QA browser pane's click events weren't registering (pane wasn't composited this pass), so a magic-link email was requested as a workaround instead of clicking the real sign-in button; and two separately-requested magic links both came back `otp_expired`/invalid on first use, most likely because an automated mail-security scanner (common with Gmail) pre-fetched and burned the single-use token before it could be clicked deliberately -- a known limitation of magic-link auth with scanned inboxes, not an app defect. The DB-level result is proven twice over (synthetic adversarial test + this real fixture, both directly queried), so this is a cosmetic visual-confirmation gap, not a functional unknown. Whoever next has an authenticated founder session (normal password/Google sign-in, not a scanned magic link) should load `/case/333f538b-f86e-4408-a982-02194ef57337/tasks` and `/today` once to close this out. This fixture is clearly namespaced (`[UAT]` prefix, synthetic vendor/director emails) and safe to delete once confirmed.

### L.2 -- family/D2C self-service task completion (shipped)

Direct continuation of Phase K's own explicit blocker: "there is no RPC anywhere for a family/D2C owner to start or complete their *own* task... Auto-seeding a checklist for a D2C case would create tasks the paying customer has no way to ever mark done." Shipped:

- **`passage_private.set_family_task_completion_idempotent(p_task_id, p_completed, p_expected_version, p_request_id)`** (migrations `phase_l2_family_self_serve_task_completion` + `phase_l2_fix_occurred_at_ambiguity`, the second a same-session fix for a column-name collision caught by the adversarial test before it shipped, not after). Deliberately modeled as a simple toggle (complete / reopen), not the staff proof-review state machine used by `start_task_idempotent` -- there is no director to review a family member's own personal checklist item, so requiring proof there would be theater, not safety. Scope is narrow by design: only fires when `workflow.organization_id is null` (pure D2C self-serve) and `workflow.user_id = caller` -- an org-backed (real funeral-home) case stays read-only for family, exactly as before. Idempotent (request-id keyed against the pre-existing `workflow_events_workflow_idempotency_unique` index, since D2C events have no `organization_id` to key against -- confirmed via direct inspection that this index and the append-only trigger's authority-scope function already supported a null-`organization_id` event correctly, no new schema needed there), optimistic-concurrency checked (stale `version` rejected with `40001`), and produces a real append-only audit event (`task.family_completed` / `task.family_reopened`) rather than a silent write.
- **Verified with a 6-assertion adversarial test** (synthetic owner/stranger/D2C-case/org-case fixtures, forced-rollback technique): owner completes their own D2C task (PASS); idempotent replay returns the same result without double-incrementing version (PASS); owner reopens/unchecks the task (PASS); a stale expected-version is rejected (PASS); an unrelated user is denied (PASS); critically, **the case owner themself is denied when attempting to use this RPC on their own org-backed (funeral-home) task** (PASS) -- confirms the D2C-only boundary holds even for someone who legitimately owns the workflow, not just for strangers.
- **One real bug caught and fixed before it shipped, not after:** the first version's `RETURNING id, occurred_at INTO ...` was ambiguous between the `workflow_events` table's own `occurred_at` column and the function's `RETURNS TABLE(... occurred_at ...)` output parameter of the same name -- Postgres raised `42702` on the very first test run. Fixed by qualifying both as `workflow_events.id`/`workflow_events.occurred_at`; re-ran the full adversarial suite clean afterward.
- **Frontend wiring:** `lib/family/case-view.ts` now selects `tasks.version` and `workflows.organization_id`, and only ever populates `FamilyCommitmentItem.version` (the signal a completion control should render at all) for `kind: 'task'` items on a self-serve case -- vendor requests and org-backed tasks always get `version: null`, so the UI has no way to accidentally offer a control it shouldn't. New `lib/family/task-actions.ts` server action (`setFamilyTaskCompletion`) and `components/family/TaskCompletionToggle.tsx` client component mirror the existing `postWorkflowMessage`/`MessageThread` pattern exactly (same `useActionState` shape, same idempotency-key-per-render convention, same structured RPC-error-code mapping) rather than inventing a new one. Wired into both the open and completed sections of the family Tasks page.
- **UAT fixture for manual verification** (same founder request as L.1): a second `[UAT]` case, this one pure D2C self-serve (`workflows.id = c9fede65-ed19-4e7c-ba54-559233716e1e`, `case_reference = 'UAT-L2-D2C'`, no organization at all, owned by the same real founder `user_id`), with 2 open tasks and 1 already-completed task to exercise both directions of the toggle. Same interactive-browser-verification gap noted under L.1 applies here too -- not yet visually confirmed, DB-level behavior proven adversarially.
- **Deployed and smoke-tested live** (Vercel build `dpl_De1N2gJ45nRwTZTUmrtRzeX9ksSY`, clean build with zero errors, confirmed via build logs). Anonymous load of the new UAT case's `/tasks` URL redirects correctly to sign-in with no crash; the only console errors present (`ERR_BLOCKED_BY_CLIENT` on a static chunk) are a client-side ad-blocker artifact, not an app error.

### L.3 -- draft-and-send communication engine (shipped, live-delivery unconfirmed)

Directly answers the founder's own framing before build started: "what drafts the email for them to click send, what pops up the link with exact instructions" and "being able to easily email everyone you need about funeral service, wake, burial." Built strictly against the pre-existing `persona-action-architecture.md` doctrine ("prepared outcomes, not AI theater" -- Passage may prepare content, but a named human must review and approve before any consequential external action; prepared/sent/delivered states must never be collapsed), which is why the design deliberately splits across two layers:

- **`public.task_communications`** (migration `phase_l3_task_communications_engine`) -- `prepared -> sent | failed`, append-only content once written (new trigger rejects any edit to subject/body/recipients/etc. post-write, only status may move forward), RLS-enabled with zero direct policies (matching the `partner_requests` precedent confirmed by direct inspection this session -- every access path goes through a RPC, none through raw REST).
- **Three RPCs**: `prepare_task_communication_idempotent` (validates subject/body/recipient emails, authority-checked, request-id idempotent), `confirm_task_communication_sent_idempotent`, `confirm_task_communication_failed_idempotent`. Critically, **Postgres never sends anything itself** -- these two confirm RPCs only ever record that the Next.js server-action layer already made a real Resend API call and tell the truth about what happened. A second confirm-sent attempt under a *different* request id is a hard `55000` error, not a silent no-op or a duplicate email -- unlike Phase L.2's checklist toggle, accidentally repeating a send is real user-facing harm (family gets the same email twice), so idempotency here is deliberately stricter.
- **Authority reused, not re-derived**: both RPCs gate on `passage_private.can_message_workflow`, the exact predicate already governing workflow messaging (D2C owner, an accepted `estate_access` participant, or org director/assigned staff) -- covers every persona the founder described ("touches all personas potentially") in one already-battle-tested check.
- **Verified with a 12-assertion adversarial test**: invalid recipients rejected; prepare + idempotent replay; a stranger denied prepare, denied read, and denied confirm-sent; the owner sees and sends their own draft; confirm-sent idempotent replay; a genuine double-send attempt under a fresh request id correctly rejected; content-mutation on a written row rejected; and a separate prepare-then-fail path recorded distinctly (a stuck-at-prepared row with no signal would look identical to a draft nobody ever tried to send). All 12 passed. Advisors re-checked: zero new findings beyond the expected `task_communications` RLS-enabled-no-policy info note.
- **`lib/email.ts`** -- raw `fetch` to Resend's REST API, matching `lib/hubspot.ts`'s existing convention in this codebase rather than adding an SDK dependency (the sparse-checkout git workflow this session uses has no `node_modules`/lockfile update path, so a new npm dependency would need a separate, riskier change). Sends from `care@thepassageapp.io` on the already-verified, sending-enabled domain. Degrades to a clear `failed` state (not a crash, not a silent success) if `RESEND_API_KEY` is absent.
- **Frontend**: `lib/communications/actions.ts` (prepare/send server actions, mirroring `postWorkflowMessage`'s exact shape), a new Communications panel in the director Case Room (`CommunicationForms.tsx`) with a compose form (subject, message, freeform recipient list -- "one email per line, or `Name <email>`", matching the founder's own casual "email everyone" framing rather than a structured contact picker) and a per-draft Send button. **Family gets visibility for free**: `communication.sent` is written as a real `workflow_events` row by the confirm-sent RPC, so it flows straight into the family Today page's existing recent-updates feed with no extra plumbing -- just one new plain-language mapping added to `FAMILY_EVENT_SUMMARIES`.
- **Deployed, clean build, zero errors** (Vercel build `dpl_9bkno4HbgzYZamvZAEHTTKo9sWs1`).
- **Not yet confirmed: an actual email arriving in a real inbox via the deployed app.** The founder believes `RESEND_API_KEY` is already set in Vercel but this was not independently confirmed (no tool available this session reads Vercel env var values, only whether a deployment exists). Attempting to click-verify the real compose-and-send flow through the sandboxed QA browser failed for two independent reasons this session: the browser pane's click events weren't registering (not composited), and two separate magic-link sign-in attempts both came back invalid/expired on first legitimate use (see the L.1 UAT entry above for the same finding). This is a tooling limitation, not evidence the send path is broken -- the code path itself is small, straightforward, and mirrors an already-working pattern (`lib/hubspot.ts`) exactly. **Concrete next step, cheap to do:** log in normally (not via a scanned magic link) as the case owner on the `[UAT] Phase L2 D2C Demo` case or any director account, prepare a draft addressed to a real inbox, and click Send once to close this out.

**L.4-L.5, still open:**
- **L.4** -- seed the already-researched urgent and planning-ahead D2C checklists, unblocked now that L.2 exists.
**Correction on the magic-link finding above:** on reflection, both failed attempts used a raw `fetch()` call to `/auth/v1/otp` directly (bypassing the real "Request secure email link" button, as a workaround for the browser pane's click issue) with a `redirect_to` that likely wasn't on Supabase's configured allow-list -- the resulting emails came from Supabase's own default `mail.app.supabase.io` template, not the custom `noreply@thepassageapp.io` template that real button-driven sign-ins in this same inbox used successfully earlier the same day. That's a plausible, more likely explanation than a mail-scanner consuming the token, and it means this was probably an artifact of the improvised testing method, not a confirmed production auth defect. Treat "is magic-link sign-in actually reliable for real users" as unresolved, not failing -- it hasn't been shown to be broken, only that this session's workaround-testing method wasn't representative of the real flow.

### L.4 -- seed the D2C planning-ahead checklist (shipped)

Founder feedback prompted this: a millennial/GenZ self-serve signup and a boomer-widow urgent signup were both rated weak specifically because of an "empty checklist" risk. **Investigating found the actual gap was narrower than first stated.** `create_case_from_urgent_intake_idempotent` (the only urgent-case-creation path in production) always requires a claimed funeral-home organization and already calls `seed_default_case_tasks` -- confirmed by direct inspection. There is no pure "urgent, no funeral home" self-serve path to fix; a boomer widow using `/start/situation` always ends up routed to a real funeral home and already gets the researched 15-item checklist. **The real gap was `self_serve_create_family_record`** (D2C planning-ahead, `mode/path = 'green'`, the only genuinely org-less case-creation path) -- it created a workflow with zero tasks and no seeding call at all, previously deliberately withheld per Phase K's own reasoning ("auto-seeding a checklist for a D2C case would create tasks the paying customer has no way to ever mark done"). L.2 closed that exact blocker, so this was safe to build now.

- **`passage_private.seed_default_d2c_planning_tasks(p_workflow_id)`** -- a real, sourced 10-item planning-ahead checklist (same AARP/Funeral Consumers Alliance/VA.gov/Nolo research pass already cited under Phase K, not re-guessed): healthcare and financial power of attorney, reviewing the will, reviewing beneficiary designations on life insurance/retirement accounts (these legally override the will), naming an executor *and having the actual conversation with them* (the single most common silent planning failure per that research), documenting funeral/disposition preferences, VA burial-benefit eligibility, listing where key documents live, inventorying digital accounts/passwords, and sharing the finished plan with family. Offsets are day-scale (0-21 days), not hour-scale like the funeral-home checklist -- this is unhurried, self-paced planning, not an active case with a funeral home waiting.
- Wired into `self_serve_create_family_record` itself (only on the genuine new-record branch, not the idempotent-replay branch).
- **Verified with a 6-assertion adversarial test**, including the specific cross-phase claim that matters here: a fresh signup creates exactly 10 tasks with no `organization_id`; replaying the same signup call does not duplicate them; and **a seeded task is actually completable through the real L.2 `set_family_task_completion_idempotent` RPC**, proving the two phases genuinely compose rather than just coexisting. All 6 passed. Advisors re-checked: zero new findings.
- **No app code changed** -- this is a pure Supabase migration (`phase_l4_seed_d2c_planning_checklist`), since the family Tasks/Today pages already render whatever tasks exist for a case (built in L.1/L.2). Checked directly whether any existing production D2C case had zero tasks and needed backfilling: none did (every pre-existing D2C workflow already had legacy fixture tasks from before this session) -- so this fix applies going forward to new signups only, nothing to backfill.

## Full product UX map -- every page, every button, every outcome (2026-08-17)

Founder pushback, verbatim and correct: "is none of this in our product plan and roadmap vision? why do we keep walking backwards like this is all a new concept... if i click a butotn on homepage what happens, every page every button, everything must be mapped out." Investigating found a real, machine-checked answer to this already existed (`docs/product/frontend-backend-contracts.json`, enforced by `scripts/check-frontend-backend-parity.js`) but stopped being maintained after Cycle 8 (2026-07-27) -- it covers roughly 15% of what has since shipped, and running the checker against the current repo fails with 46 issues, most of them because **every migration applied since Phase J (role/permissions, task orchestration, the full L.1-L.4 spine, tonight's location-creation work) went straight to production via the Supabase tool and was never committed to git as a migration file.** The last committed file under `supabase/migrations/` is from 2026-08-16 13:00, before Phase J started. This is a real structural gap, not just a stale doc -- the git repo's migration history no longer matches the live database, and a disaster-recovery rebuild from git alone would produce a schema missing everything since Phase J. Flagged to the founder directly; not yet remediated (retroactively backfilling ~15 migrations is real, separate work).

**Full current-state answer, built and saved:** `docs/product/full-product-ux-map-2026-08-17.md`. Five parallel research passes (one per site section) read all 44 `page.tsx` files in the app plus every component/action file each one imports -- not inferred from the rendered UI, traced to the actual server action/RPC call and its exact error-code branches. Ranked findings, most severe first:

- **Three pages that look real but are disconnected client-only sandboxes**, one of which (`/receive`) has **no authentication at all** -- reachable by anyone, shows a hardcoded fake director identity, and its final screen links to the real `/director` implying a handoff was actually received when nothing was written anywhere. `/director/intake` requires real director sign-in but is also a pure sandbox with the same misleading "open the real workspace" link on its receipt screen. `/family` + `/family/pass` is a fully disconnected demo (hardcoded "Sofia Rivera" data) whose URL/copy closely mirror the real family case experience, also with no auth gate.
- **A recurring, fixable bug pattern:** four separate pages set a `?error=`/`?checkout=`/`?vendorPayment=` query param on a redirect and the destination page never reads it, so the user sees no feedback at all on failure -- `/family-invite/[token]` (confirmed: the page component never destructures `searchParams`, so the error-copy map that exists in the code can never render), `/pricing` (all four checkout failure/cancel paths), `/account/billing` (every failure reason renders identical generic text -- this is the exact shape of complaint the founder raised independently tonight, now confirmed in code), and the Case Room's vendor-payment Stripe return.
- `/guides`' lead form always reports success even if the underlying HubSpot call fails (return value never checked).
- A literal copy bug in the Case Room's proof-review conflict message (says "Ownership changed..." because the error-formatting helper is shared with the reassignment flow).
- A vendor-category display bug: `catering`/`restaurant`/`cemetery`/`printer_stationery` aren't in the label map, so requests in those categories silently show as generic "Vendor request."
- **Three separate trial-upgrade dead ends** (vendor-request creation, urgent-intake case creation, and -- until tonight's location-creation work -- adding a location): a `55001` denial with no upgrade button anywhere near it. Tonight fixed this pattern for locations specifically (see the location-creation entry above, built in direct response to the founder's "should prompt an upgrade now button, duhh" instruction); the other two are not yet fixed.
- `/partner/payouts` is linked to exactly once (the vendor-signup success screen) and never again anywhere in the vendor's real navigation -- a real gap in a real-money flow.
- Family case nav's disabled Decisions/Service/Costs items have no page behind them at all -- a bookmarked/typed URL hits a bare Next.js 404, not a branded "coming soon."

**Recommended fix order** (documented in the map's own executive summary): fence off or clearly re-label the three sandbox pages first (cheapest, highest trust-risk reduction); fix the four dropped-query-param bugs (small, contained, no architecture change); add the upgrade-now button to the two remaining trial walls; add a persistent vendor Payouts nav link; everything else as capacity allows.

**What's confirmed already solid, not rebuilt:** the core operational loops -- director task assignment, staff proof submission/review, vendor quote/deliver/payout, urgent-intake claim-to-case, and the full L.1-L.4 family task/communication spine -- all have real, specific, mostly-correct error-code-to-copy mappings, real idempotent RPCs, and real revalidation. The problems found are concentrated in the sandbox pages and the dropped-query-param pattern, not the core spine.

## UX-map remediation pass + D2C multi-estate + multi-location staff grants (2026-08-17/18, shipped)

Closes nearly all of the "Full product UX map" findings above, plus two items the founder specifically flagged as core functionality after reviewing that map. All entries below are `[deploy][qa-approved]`, live in production, and (where backend changed) adversarially tested zero-footprint against the live database before shipping.

**Tier 1 sandbox trust risks -- all fixed.** `/receive` now requires real owner/director sign-in via `resolveOperationalViewer()` (previously zero auth of any kind). `/director/intake`'s post-preview screen no longer links to the real `/director` workspace, removing the disclaimer contradiction. `/family` + `/family/pass` (a deliberately public, unauthenticated preview sandbox -- auth-gating it would defeat its purpose) now carries an unmissable "Preview demo" banner plus `noindex` so it can't be mistaken for a real case if found via search.

**Tier 2 dropped-query-param pattern -- all four fixed.** `/family-invite/[token]`, `/pricing`, `/account/billing`, and the Case Room's vendor-payment return now all read and render the failure/success copy their own server actions were already setting. `/guides`' lead form now checks the HubSpot call's result instead of always claiming success. The vendor-category display bug in the map turned out to already be fixed by an earlier migration -- confirmed, not re-fixed blind.

**Tier 3 dead ends -- the two most severe fixed.** All three trial-upgrade dead ends now show a real "Upgrade now" button (locations, vendor requests, urgent-intake case creation -- was 1 of 3, now 3 of 3). Vendor `/partner/payouts` now has a persistent nav link.

**Tier 4 consistency -- 2 of 4 fixed**, the other 2 (`/` vs `/mission` funnel split, `/login` resend/cooldown feedback) deliberately deferred: one is a product/copy judgment call, the other needs real client-side state, neither is a quick mechanical fix appropriate for unsupervised work.

**D2C multi-estate management -- built, not just found.** Confirmed via code trace, not assumption: `/pricing` sells Individual/Couple/Family (1/2/5 estates) but `provisionD2cFamilyRecordIfNeeded` created exactly one `workflows` row per subscriber regardless of plan -- sold but never built. Fixed: `subscriptions.included_estate_slots`/`additional_estate_slots` (mirrors `organizations.included_location_slots`), a gated idempotent `create_additional_estate_idempotent` RPC, `/case` now lists all of a subscriber's estates with real "add another" and "invite someone to view" actions surfaced immediately on first login for a multi-slot plan (not buried), and three new HubSpot Contact properties (`estate_slots_included`, `estates_created`, `family_participants_added`) so usage is reportable without a Supabase query. Also fixed in the same pass: the D2C family-invitation RPC already authorized a case owner, but the only frontend action calling it gated on funeral-home org roles -- a plain D2C owner could never actually invite a spouse before this.

**Staff multi-location grants -- built.** UX-map finding #15: a director could only toggle `can_create_cases` on a location a staff member already had; there was no way to add them to a *new* location without a fresh invitation. Fixed with `grant_staff_location_idempotent`, matching the existing grant RPC's authority/idempotency/audit shape.

**Mobile nav panel fixed** (founder-reported, real bug): both the marketing and operations mobile hamburger panels were `position: fixed; inset: 0` with no `overflow-y` and no safe-area-bottom padding -- content taller than the visible phone screen was silently unreachable, and the page behind the fixed overlay stayed scrollable. Fixed on both surfaces plus body-scroll-lock while open.

**Structural note, corrected this pass:** the two new backend migrations above (`20260818040000`/`...040100_...d2c_multi_estate`, `20260818050000_grant_staff_new_location_idempotent`) were committed to git alongside being applied via Supabase -- not a repeat of the Phase-J-onward backfill gap below. That gap remains real for everything from Phase J through tonight's earlier fixes and is not closed by this.

## L.5 and other open items

- **L.5** -- Decisions, Service, and Costs family pages (Costs needs its own billing/estimate data-model design pass, not bundled into the same migration as the others; the UX map above confirms these currently 404 on direct URL access rather than showing a branded "coming soon").
- Remaining from the UX map's Tier 4: `/` vs `/mission` funnel split, `/login` resend/cooldown feedback.
- The readiness scorecard in "Verified baseline" above has not been re-scored since 2026-07-26, despite Phase K, Phase L.1-L.4, and the full remediation pass above all shipping since -- two specific numbers in it are now factually stale (case-detail lane logged as "100% placeholder," isn't anymore; urgent/red persona logged as "0% built," isn't anymore). Not re-scored here; that's a deliberate PM governance gate per this document's own rule, not an oversight. See `docs/product/m3-closure-execution-plan-2026-08-17.md` for the specific, named items that should close before that re-score happens.
- Retroactively backfilling the missing `supabase/migrations/` files from Phase J through the pre-2026-08-17-evening work, so the git repo and live database agree again (flagged repeatedly, not yet started -- real, separate work, not a quick fix).
- The D2C multi-estate access model (separate estates per plan, owner + read-only participants -- see this session's entry above) was a real design decision made from the pricing copy itself, not confirmed with the founder before building. Worth a quick sanity check that it matches intent.
