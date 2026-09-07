# Passage Authority V2 delivery roadmap

**Status:** Active delivery contract  
**Updated:** September 5, 2026, Google OAuth, custom SMTP, and Demo DNS configured
**V2 outcome:** A qualified institution can discover Passage, start a synthetic evaluation, reach a matching decision receipt, request a founding pilot, pay an invoice, receive the correct entitlement, invite its team, and enter onboarding with Passage, Stripe, and HubSpot in agreement.

The supporting evidence review and explicit non-priorities are maintained in [V2-BEST-PRACTICE-REVIEW.md](./V2-BEST-PRACTICE-REVIEW.md).
For a fresh-chat operational restart, use [NEW-CHAT-HANDOFF.md](./NEW-CHAT-HANDOFF.md) and the phrase `AUTHORITY PUMPKIN 246159600`.

## Owner to-do list — no due date

- [x] Enable 2-step verification for the Passage Google account so Google Cloud Console access is restored.
- [x] Connect the existing Passage Web OAuth client to the Demo Supabase callback and enable the Google provider.
- [x] Configure a dedicated, sending-only Resend credential for Supabase Auth custom SMTP and verify delivery to the Passage inbox.
- [x] Complete one real Demo Google sign-in and one fresh principal-to-representative email-link journey. Google sign-in reached the institution workspace; the saved Chrome site rule was corrected; both participant links opened on `demo.thepassageapp.io`.

## Execution priority — September 5, 2026

The roadmap is sequenced by the next customer commitment, not by feature breadth. Discovery outreach and synthetic demonstrations can start now. Production customer data and an enterprise-ready claim remain gated.

| Priority | Window | Outcome | Exit evidence |
| --- | --- | --- | --- |
| P0 — prove and package | Now, during independent QA | A repeatable buyer demonstration with no critical or high defects | Independent QA findings triaged; zero open critical/high defects; timed four-profile run under seven minutes; invitation, receipt, newest-link and recovery behavior confirmed; one-pager, demo script and outbound sequence receive final buyer/sender review |
| P1 — open controlled pipeline | Next 2–3 business days | Five-account discovery batch operating from one source of truth; conversations and demonstrations use synthetic data only | Twenty-account New York community-bank and credit-union target list with buyer roles and warm/referral paths ranked before cold outreach; first five accounts personalized; Passage HubSpot private app connected; additive no-delete schema applied; demo/pilot/support intake proves Company, Contact, Deal or Ticket creation plus confirmation and retry. No real institution POA, participant, account or authority data is accepted, and no live-business onboarding begins in P1 |
| P2 — qualify a real-data pilot | Before accepting customer data or live business | A narrow founding pilot can pass security, billing, legal, vendor-risk and operating review | Stripe failure/refund/out-of-order replay; remaining hosted negative paths; seven clean daily reconciliation runs; privileged MFA; retention, restore and incident evidence; buyer-specific assurance and vendor-risk evidence; privacy and scoped security review; counsel-led review of product claims, target-state POA formalities, institution decision responsibilities, and applicable electronic-signature/record requirements. If Passage ever creates or executes a POA instrument, that capability requires a separate jurisdiction-specific legal gate before release |
| P3 — customer-gated expansion | After a qualified buyer requires it | Enterprise identity and integration scope follows evidenced demand | SAML/SSO, SCIM, custom roles, hierarchy, SIEM, broad core integrations and published annual pricing remain deferred until a qualified pilot supplies requirements |

Current decision: **go** for targeted research and discovery conversations. Live synthetic demos remain conditional on one authenticated valid-input production replay of `Save draft` and team `Send invitation`; the original zero-request report was traced to empty required email fields and the missing-feedback usability defect is deployed. **No-go** remains for real institution POA data, live-business onboarding, production customer data or a full-enterprise-readiness claim. Working readiness remains **8.5/10 for the Demo experience**, **8/10 for controlled outbound**, and **5/10 for production enterprise use** until the final replay and timed rehearsal are recorded.

## Product strategy

V2 is a hybrid journey, not anonymous card-first PLG:

1. No-card synthetic evaluation.
2. First value is a completed institution decision with matching participant receipts.
3. A $5,000, 60-to-90-day founding pilot is sales-assisted and invoice-led.
4. Annual plans use a recurring base with an included activated-request allowance.
5. Top-ups are one-time non-recurring expansion until demand is committed in a later subscription term.

This follows the current product boundary and Stripe's supported hosted invoice, subscription, and webhook patterns. Passage remains the usage and entitlement source; Stripe remains the payment source; HubSpot remains the customer and revenue-workflow projection.

## V3 strategic hypothesis — not a V2 capability or public claim

The proposed long-term category is a persistent authority-status layer: an institution records its own current decision, scope, limits, effective period and later lifecycle changes once, while authorized channels and systems retrieve the same current result. The strategic wedge is **defensible, consistent handling**, not generic speed and not legal-document creation. V2 must first prove that institutions value a shared current decision and receipt before Passage commits to the integration depth required for V3.

Current internal hypotheses, pending the source-backed competitive brief and buyer discovery:

1. Document-creation, storage, identity and notarization products are upstream or point-in-time complements; the open lane may be the institution's ongoing decision and authority status.
2. A well-funded signing or identity provider could extend into the decision layer, so Passage cannot treat workflow screens alone as a moat.
3. The durable moat would require lifecycle accuracy, revocation propagation, auditable institution decisions and reliable read APIs across servicing channels—not an unsupported “safe harbor” or automated legal-validity claim.
4. Expansion order to test is trustee/trust-account authority, guardianship/conservatorship, then executor/estate access. Representative-payee workflows remain deprioritized until buyer evidence changes the fit assessment.
5. Deep core, call-center and digital-banking integrations remain customer-gated. No V3 integration-depth claim is allowed until a reproducible adapter and a qualified institution requirement exist.
6. The $5,000 founding pilot is a capped, scoped proof-of-concept fee credited toward year one. It is not Passage's published list price, annual price or evidence of market willingness to pay.

## Definition of V2 working

V2 is not complete until an independent replay proves:

`attributed prospect -> organization signup -> resumable onboarding -> first complete synthetic authority request -> matching receipt -> pilot request -> New Business deal -> hosted Stripe test invoice -> verified paid event -> Passage entitlement -> onboarding ticket -> Company projection -> reconciliation passes`

Every provider command is idempotent. Duplicate and out-of-order events do not duplicate money, usage, allowance, deals, or tickets. A provider outage cannot alter an authority record or hide an existing receipt.

## Delivery gates

| Gate | Scope | Pass criteria | Status |
| --- | --- | --- | --- |
| V2-0 | Research and operating contract | Source ownership, offer, activation milestone, revenue classification, failure policy, and scorecard documented | Passed |
| V2-1 | Commercial persistence | Account/workspace mapping, contract, subscription, order, allowance, usage allocation, provider inbox, outbox, and immutable event history migrate and replay | Implemented in Demo and Production; provider-command replay remains |
| V2-2 | Conversion intake | One short demo/pilot/support form creates deduplicated HubSpot Company, Contact, Deal or Ticket with attribution and a visible confirmation | Partial: live intake, confirmation, immutable event, leased HubSpot worker, privacy scan, retry, and replay passed; Passage HubSpot portal `246159600` and its current schema are audited, and the exact additive migration awaits approval, provisioning, and private-app connection |
| V2-3 | Evaluation activation | Signup resumes correctly; no more than five pre-value fields; workspace shows one next action, allowance, days, and progress to first matching receipt | Partial: live workspace guidance passed; signup/resume field audit remains |
| V2-4 | Stripe test billing | Pilot invoice uses a hosted Stripe page and explicit service period; verified `invoice.paid` grants one entitlement; duplicate, failure, refund, and disorder tests pass | Positive path passed in Demo and the green artifact is published on the ready custom domain: owner command and outbox are idempotent; real $5,000 hosted test invoice `NFYSMYD4-0001` was paid; signed event `evt_1UCAbnRteXSJR0llBnw5VkEm` was durably received and applied; duplicate replay left exactly one 100-request allowance and one activation audit. Failure/refund/disorder replay and reconciliation remain |
| V2-5 | HubSpot revenue operations | New Business, Expansion, Renewal, and onboarding/support ticket workflows receive deterministic projections with no participant data | Passage portal `246159600` audit complete; exact no-delete migration proposed. Current free tier supports only one Deal pipeline and locks Workflows, so a developer test account or suitably licensed target, approved migration, private-app connection, and provider replay remain |
| V2-6 | Reconciliation | Passage, Stripe, and HubSpot match for seven consecutive daily test runs; variances enter a visible repair queue | In progress: no reconciliation job existed anywhere before September 7, 2026. A real job (`public.run_daily_reconciliation_v1()`, added by `supabase/migrations/20260907153000_daily_reconciliation_check.sql`) was built and run for real for the first time today against both live databases. Day 1 was **not clean** in either environment — see "Reconciliation, recovery, and incident-response evidence" below and [RECONCILIATION-LOG.md](./RECONCILIATION-LOG.md) for the exact findings. The seven-consecutive-clean-day streak has not started |
| V2-7 | Enterprise admin | Organization, users/roles, billing contacts, usage, invoice state, audit export, integration health, and recovery paths pass owner/admin/reviewer tests | In progress: owner/admin/reviewer production authorization replay passed September 5; remaining pilot controls are explicit below |
| V2-8 | Release sign-off | Desktop, 390px, 360px, keyboard, error/replay, four-persona, Demo reset, and complete provider test matrix pass independently | Independent production onboarding, free-tier gate, same-day Gmail placement and public claims audit passed. Blank required fields explained the reported zero-request form clicks; visible validation feedback is deployed. Valid-input production replay, timed four-profile rehearsal, remaining hosted negative paths and commercial provider matrix remain |

## Delivery forecast from the current state

These dates are evidence gates, not calendar-only promises. Stripe is connected in Demo; HubSpot provider credentials and an appropriate test or licensed target remain dependencies for CRM provider replay.

| Target | Earliest credible date | Included evidence |
| --- | --- | --- |
| Authority sales demonstration | Ready now | Public site, isolated Demo, fresh Demo run, complete authority journey, matching receipt, mobile/public route verification |
| Outbound and live discovery demonstrations | Ready for a controlled five-account batch after final sender review | Approved positioning, pricing hypothesis, ICP discovery fields, repeatable seven-minute authority story |
| V2 conversion and CRM intake | Passage intake live; provider target September 7, 2026 | Structured demo/pilot/support intake, deterministic Company/Contact/Deal/Ticket creation, confirmation and retry evidence |
| Stripe sandbox pilot UAT | Positive path and publication passed; negative-path completion is next | Real hosted $5,000 test invoice, signed paid event, one entitlement, idempotent duplicate and green Vercel publication passed. Finish failure/refund/disorder browser replay |
| Complete commercial persona UAT | September 12, 2026 | Prospect, owner, admin, reviewer, participants, billing owner, support/onboarding, CRM and Stripe journey agree |
| Commercial automation sign-off | Revised September 7, 2026: **no earlier than September 14, 2026**, and only if the streak starts immediately | Seven consecutive clean Passage/Stripe/HubSpot reconciliation runs plus resolved P0 defects. Day 1 ran for real today and was `blocked` in both UAT and Demo (not clean — see below), so the streak has not started. September 14 is the floor: it assumes today's two blocking items (a stuck HubSpot outbox row in UAT, two unresolved Stripe inbox rows in Demo) are resolved and a clean day 1 begins tomorrow, September 8, with all seven days clean back-to-back. Any additional delay in resolving the blockers, or any broken day during the streak, pushes this date out further. September 19 (the prior estimate) remains realistic if the fix takes a few days |
| Real-data enterprise pilot approval | Target September 21–25, 2026, subject to external review — **now also gated on a new finding**: the Supabase organization is on the Free plan, which has zero automated backups and no Point-in-Time Recovery. This was not previously documented; it is a real blocker for the "retention, restore and incident evidence" exit criterion, not a formality. See "Reconciliation, recovery, and incident-response evidence" below. Closing it requires Steve to decide to upgrade at least one Supabase project to a paid plan and then a real restore drill to be run and recorded; the September 21–25 window assumes that decision happens within the next few days | Privileged MFA, advisor closeout, retention/restore/incident evidence, privacy package, scoped independent security review, and counsel sign-off on product boundaries, target-state POA formalities and applicable electronic-signature/record requirements |

## Reconciliation, recovery, and incident-response evidence — September 7, 2026

This section covers both P2 items assigned to this task: starting the seven-day reconciliation clock (V2-6), and backup/restore/incident-response evidence. Both are reported honestly below, including where the news is not good — that is the point of this gate.

### Reconciliation (V2-6)

Before today, `authority_private.reconciliation_runs`, `get_commercial_reconciliation_snapshot_v1`, and `record_commercial_reconciliation_v1` already existed in both live Supabase databases (UAT and Demo) — but nothing anywhere ever called them; `reconciliation_runs` had zero rows in both. There was no migration file for this infrastructure in `supabase/migrations/` at all (it was applied out of band under a migration named `stripe_negative_paths_and_reconciliation`, at different timestamps in each database, and never committed to this repo — real schema drift, worth a separate cleanup). No script, cron, or CI job existed to run it.

Today: built a real caller, `public.run_daily_reconciliation_v1()` (`supabase/migrations/20260907153000_daily_reconciliation_check.sql`), that (1) reuses the existing Stripe/HubSpot provider-state snapshot and (2) adds a new check — Passage-internal authority request/decision counts against the append-only organization audit log (`authority_usage_events` vs. `organization_audit_events` `authority.activated` count vs. `organization_entitlements.activated_count`; `authority_institution_decisions` vs. `organization_audit_events` `institution.decision_recorded` count) — decides `clean`/`variance`/`blocked`, and durably records one immutable run per UTC day. Applied to both UAT and Demo, then **run for real today**, not simulated:

- **UAT:** request/decision-vs-audit-log checks are fully clean (6 organizations, 14 usage events, 5 institution decisions, zero variances). Status is `blocked` solely because of one stale HubSpot outbox row that has never been claimed (no HubSpot worker/credentials connected yet, consistent with the HubSpot status already noted elsewhere in this document).
- **Demo:** the one real paid pilot order (`NFYSMYD4-0001`) is fully consistent (one activation audit, one active allowance, zero refunded). Status is `blocked` because of two unresolved Stripe provider-inbox rows, one of which is the already-known September 4 synthetic ingestion-test event (`evt_1UCA7SRteXSJR0llbAZL13OM`) and one of which (`evt_1UCA5sRteXSJR0llBpHUoQef`) appears genuinely stuck and needs an engineering look.

Full findings, exact row IDs, and the specific repair-queue actions needed to reach a clean day are in [RECONCILIATION-LOG.md](./RECONCILIATION-LOG.md), which will be updated with each subsequent day's result. **The seven-consecutive-clean-day clock has not started** — day 1 was real but not clean, and starting the clock on a blocked day would misrepresent this gate. Honest earliest completion: if the two blockers above are resolved and a clean day 1 begins tomorrow (September 8) with all seven days clean back-to-back, the earliest possible pass date is **September 14, 2026**. That is a floor, not a prediction — any slippage in fixing today's blockers, or any single broken day anywhere in the run, pushes it out further. A daily automation script exists (`pnpm reconcile:daily`, calling the same RPC), but the scheduled GitHub Actions workflow that would run it automatically could not be committed by this task — the GitHub API token available here lacks `workflow` permission scope, so GitHub rejected the write to `.github/workflows/`. The workflow's exact YAML is included in RECONCILIATION-LOG.md, ready to be added by someone with `workflow`-scoped push access (or a local git client), along with four repository secrets that also still need to be added. Until both exist, each day must be run manually (via SQL or the script) and logged.

### Recovery and incident-response readiness

No backup, restore, or incident-response documentation existed anywhere in this repository before today. Full findings and a first real incident-response runbook are in the new [RECOVERY-AND-INCIDENT-READINESS.md](./RECOVERY-AND-INCIDENT-READINESS.md). Headline findings:

- **No backups exist for either live database.** The Supabase organization (`thepassageappio's Org`) is on the **Free plan**, confirmed via the Supabase API today. Per Supabase's own documentation, Free-plan projects get zero automated daily backups and no Point-in-Time Recovery — both are Pro-plan-and-above features. This is a real, previously undocumented gap against the P2 "retention, restore and incident evidence" exit criterion, not a paperwork item.
- **Restore was not tested, because there is nothing to restore from.** Supabase's branch-creation feature was considered as a safe way to test restore, but it only copies schema/migrations, not data (confirmed from the tool's own description), so it cannot be used for a real data-restore drill. A destructive restore attempt against the only existing copies of UAT/Demo data was correctly not performed. What was verified instead: both databases are fully queryable and checksummable on demand today (real row counts and a SHA-256 over the audit-event chain for both environments are recorded in RECOVERY-AND-INCIDENT-READINESS.md), proving a manual export is technically possible right now even though no automated one exists.
- **No incident-response process existed.** A first real runbook (detection, severity classification, component-specific containment steps for a Supabase/Stripe/Resend/Vercel stack, evidence-preservation guidance, and communication/postmortem expectations) is now in place in the same document.
- **Audit-log/evidence retention is real today but fragile.** `organization_audit_events`, `authority_events`, `commercial_event_ledger`, and `authority_institution_decisions` are all append-only (enforced by database triggers, already covered by `scripts/verify-gate1-database.mjs`) and currently hold 570 audit events across both environments spanning August 28 – September 7, 2026. But there is no retention policy, no archival job, and — per the backup finding above — no redundant copy anywhere. Today's evidence is genuine and reconstructable, but it all lives in one place with no backup.

**Net effect on the P2 timeline:** the "Real-data enterprise pilot approval" row above has been updated to reflect that this is now a known, named blocker requiring Steve to decide whether to upgrade at least the UAT Supabase project to a paid plan (Pro, ~$25/month, enables daily backups; PITR is a further paid add-on) before real institution data can responsibly be accepted, followed by one real, documented restore drill.

## V2-7 enterprise administration game plan

The primary-source benchmark, capability model, role recommendations and negative-test matrix are maintained in [ENTERPRISE-ORGANIZATION-ADMIN-BENCHMARK-2026-09-04.md](./ENTERPRISE-ORGANIZATION-ADMIN-BENCHMARK-2026-09-04.md). Passage currently scores **44/100 for enterprise-administration maturity**. This is a product-maturity baseline, not a security grade.

| Sub-gate | Outcome | Focused effort | Exit evidence | Status |
| --- | --- | ---: | --- | --- |
| V2-7A | Legible organization administration | Accelerated 48–72 hour sprint | Unified admin shell/readiness, visible role matrix, invitation lifecycle, protected owner transfer, member status/search, six-role persona replay | In progress: unified entry, readiness controls, effective-role presentation, capability registry, server-command guards, three-role production data, owner browser replay, admin/reviewer authorization replay, cross-tenant denial, readable access history, and deployment passed September 5; owner transfer, search, team-invitation delivery receipts, and independent browser replay for the remaining roles remain |
| V2-7B | Centralized authorization | 4–7 working days | Canonical capability registry, no scattered role-name decisions, explicit active organization, route/command/database parity tests, billing/integration admin templates | Queued after V2-7A |
| V2-7C | Pilot administration | 5–10 working days | Billing contacts and status, audit search/export, access certification, integration health, retention/support surfaces, verified domain and privileged MFA | Queued after V2-7B; provider and security dependencies apply |
| V2-7D | Enterprise identity and scale | Customer-gated, typically 2–6 additional weeks | SAML/OIDC, SCIM/groups, IdP role mapping and any evidenced hierarchy/custom-role/SIEM requirements | Not committed until a qualified pilot supplies requirements |

For one focused implementation stream, V2-7A through V2-7C total **11–21 engineering days**. Allow **3–5 calendar weeks** for implementation, review, browser/persona QA and defect repair. A procurement-ready SSO/SCIM package is therefore a separate **5–9 calendar week** path from start, depending on identity provider, customer availability and external review. The first materially improved enterprise demo does not need to wait: V2-7A should be demonstrable within **2–4 working days**.

**Accelerated decision, September 4:** Passage will target a buyer-demonstrable V2-7A plus the authorization spine of V2-7B within 48–72 hours. SSO, SCIM, custom roles, hierarchy, SIEM streaming, and certification workflows are explicitly deferred unless a qualified buyer makes one a near-term gate. The compressed target does not reduce the independent negative-test or fail-closed requirements.

The critical path is:

`admin clarity -> centralized capabilities -> lifecycle/parity proof -> pilot operations -> privileged identity -> customer-gated SSO/SCIM`

Work may proceed without provider credentials through V2-7A and most of V2-7B. Stripe, HubSpot, email-delivery, MFA/domain and customer IdP access become gating inputs in V2-7C or V2-7D. No enterprise-ready claim is allowed until the acceptance replay and negative cases in the benchmark pass independently.

The external security assessment and customer procurement are not fully controllable engineering dates. A buyer demonstration and commercial conversation should not wait for them; production customer data and an enterprise-security claim must.

## Current configuration truth

- Passage HubSpot target: portal `246159600`, visibly confirmed as the Thepassageapp account. The installed HubSpot connector is attached to the unrelated Go Ideally portal and is prohibited for this work.
- Passage HubSpot operator state: Chrome control was restored and the read-only schema, pipeline, form, workflow-availability, Deal-count, and Ticket-count audit completed. No Passage HubSpot records or settings were modified. The exact proposed migration is in `HUBSPOT-PORTAL-AUDIT-AND-MIGRATION.md`.
- Stripe Demo provider state: Vercel Demo Production now holds server-only `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PILOT_PRICE_ID`. Stripe test product `prod_VCZ5TIRtHX7gFp`, one-time price `price_1UC9x5RteXSJR0llsNddPyRR`, and destination `we_1UC9xmRteXSJR0llN32Gbane` are active. No live-mode Stripe data was changed.
- Stripe ingestion evidence, September 4: synthetic event `evt_1UCA7SRteXSJR0llbAZL13OM` reached the deployed route with `200 OK`; the response reported `received: true`, `replayed: false`, and inbox receipt `41d4a6bb-afe7-4c89-9187-adc7ca95dbbd`. **Update, September 7:** this event is still sitting unresolved (`status: failed`, `reason: stripe_order_unmatched`) in the Demo provider-event inbox as of today's reconciliation run — see [RECONCILIATION-LOG.md](./RECONCILIATION-LOG.md).
- Stripe positive-pilot evidence, September 4: real test invoice `in_1UCAZqRteXSJR0llmqI675C4` / `NFYSMYD4-0001` was finalized for $5,000 and marked paid; signed event `evt_1UCAbnRteXSJR0llBnw5VkEm` was durably received and applied in Demo. Passage recorded one paid order, active contract/subscription, one 100-request allowance lot, one activation audit, and a `pilot / active` entitlement; duplicate replay did not add a second grant. **Update, September 7:** today's reconciliation run confirms this order is still fully consistent (one activation audit, one active allowance, zero refunded) — see RECONCILIATION-LOG.md.
- Release state, September 5: 131 domain and security tests, TypeScript, ESLint, optimized production build, 44 public routes, and eight participant-link recovery states pass. Demo deployment `dpl_BWHK6ZdbLB7UivCd3L3jppvNFyFY` and production deployment `dpl_7FodJEgiNqg2sGA8kRMz9syD6iGz` are ready on their custom aliases and add visible feedback when browser validation blocks a required-field submission. Public-form browser checks passed on both aliases without console, framework-overlay, or runtime errors.
- Domain and authentication state, September 5: `demo.thepassageapp.io` is a ready Vercel production alias and the configured Supabase site/callback origin. Google OAuth redirects through the configured Supabase callback and a real Passage-account sign-in reached the institution workspace. Email magic-link delivery was separately accepted and confirmed by Resend.
- Fresh hosted transaction evidence, September 5: request `PA-6C4FF6F2DB` completed principal confirmation, delivered and opened the representative invitation, saved representative acceptance and certification, uploaded the two approved fictional files, completed institution evidence review, submitted the disclosure, and recorded accepted-with-limits receipt `PAR-470074AA96BC`. Both participant receipt emails were submitted for delivery. This proves the happy path with real hosted sessions; an independently timed four-profile rehearsal and hosted negative paths remain release gates.
- Mobile receipt-link evidence, September 5: the hardened email CTA opened successfully from mobile Gmail. An earlier receipt email opened the correct superseded-link recovery page after a newer receipt had been issued, proving both click compatibility and fail-closed replacement behavior.
- Enterprise persona evidence, September 5: the Passage Demo Credit Union workspace visibly contains active Owner, Administrator, and Institution Reviewer identities. Production authorization replay proved reviewer request visibility, zero cross-tenant rows, denied reviewer invite and request-create mutations, denied administrator owner creation, zero rows from denied mutations, and append-only membership lifecycle events.
- Independent QA evidence, September 5: real production signup/onboarding, the sixth-activation gate, same-day Gmail Inbox placement across three test organizations, Demo consumed-link recovery, and the coordination-not-legal-validation claims boundary passed. One authenticated valid-input production draft and team-invitation replay remains. The Vercel team has no separate active legacy funeral-home project or alias in its accessible inventory.
- HubSpot provider credentials remain unconfigured in the deployed projects. The Stripe positive path and green Demo publication are proven, but the complete commercial loop must not be described as release-complete until failure/refund/disorder plus reconciliation coverage pass.
- Supabase organization plan, confirmed September 7, 2026: **Free**. No automated backups, no Point-in-Time Recovery, on either the UAT or Demo project. See "Reconciliation, recovery, and incident-response evidence" above and [RECOVERY-AND-INCIDENT-READINESS.md](./RECOVERY-AND-INCIDENT-READINESS.md).

## Outbound launch control

The customer-facing message, verified claims, asset checklist, target-account sequence, and stop/go rules are maintained in [SALES-OUTBOUND-LAUNCH-PLAN-2026-09-05.md](./SALES-OUTBOUND-LAUNCH-PLAN-2026-09-05.md). The buyer-ready [sales one-pager](./SALES-ONE-PAGER-2026-09-05.md), [seven-minute demo script](./SEVEN-MINUTE-DEMO-SCRIPT-2026-09-05.md), and [controlled outbound sequence](./OUTBOUND-SEQUENCE-2026-09-05.md) are drafted from the verified hosted flow. Website, deck, one-pager, demo script, outbound copy, and CRM fields must use those files and the selling brief as their shared source of truth.

**Cold-outreach and LinkedIn content status, September 6, 2026:** an expanded 4-email cold outreach sequence and LinkedIn thought-leadership drafts (three short posts plus one long-form post) are drafted in [OUTBOUND-CONTENT-DRAFT-2026-09-06.md](./OUTBOUND-CONTENT-DRAFT-2026-09-06.md), built only from claims already approved in the selling brief, one-pager, and outbound sequence. This content is drafted and held. It must not be sent or published until the product is confirmed 100% demo-ready (P0 exit evidence above, zero open critical/high defects) and the buyer/sender review in SALES-OUTBOUND-LAUNCH-PLAN-2026-09-05.md is complete. That draft also flags one open positioning question for Steve: whether the V3-only "defensible, not just faster" framing above should be promoted to an approved public claim before any send/publish.

## V2 scorecard

- Visitor to demo request
- Demo request to booked walkthrough
- Signup to workspace ready
- Workspace ready to first activation
- First activation to first matching receipt
- Median active time to first matching receipt
- Participant completion and recovery rate
- Reviewer active time and clarification loops
- Evaluation to qualified pilot
- Pilot requested to invoice paid
- Paid event to entitlement latency
- Onboarding time to first approved success milestone
- Support volume and staff minutes per completed request
- Stripe/Passage/HubSpot reconciliation variance

## Provider rules

- The evaluation creates no Stripe customer or zero-dollar subscription.
- Browser redirects never prove payment.
- Stripe webhooks use the unchanged raw body, signature verification, a durable inbox, and permanent internal deduplication.
- The founding pilot invoice line includes its actual service period.
- CRM writes use unique Passage IDs and a durable outbox; email address and domain alone are not upsert keys.
- No participant identity, evidence, request content, account reference, decision, or receipt content enters Stripe or HubSpot.
- Payment problems may stop a future activation only under the documented grace policy. They never interrupt active work or remove receipts.

## Persona/role audit fixes — September 6, 2026

An institution-side persona audit across all six org roles (owner, admin, staff, reviewer, developer, auditor) found two small, non-blocking gaps. Both are fixed on `agent/founding-pilot-billing`:

1. **Team-size count bug.** `memberships_authorized_select` (see `20260828211255_authority_gate_1_foundation.sql`) intentionally limits staff/reviewer/developer to seeing only their own `organization_memberships` row. The `/app/team` page counted from that same row-limited query, so staff and reviewer saw an inaccurate, undercounted "team size" instead of the true active member count. Fixed with a new `organization_member_count_v1` SECURITY DEFINER RPC (`20260906190000_organization_member_count_summary.sql`) that returns the true active-member count to any active org member without exposing other members' individual rows. `/app/team` now uses this RPC for the "N people currently have access" summary. Verified by comparing the count a staff/reviewer viewer sees against the true member count visible to an owner/admin for the same organization.
2. **Dead Developer role / integrations capability.** The `developer` org role and its `integrations.view`/`integrations.manage` capabilities exist in the data model but have no integrations UI anywhere in the product (the only related routes are the public `/integrations` marketing page and a `NODE_ENV`-gated local API sandbox at `/developer`, neither of which is the org-role feature). Selecting "Developer" for a teammate would dead-end them, and could confuse or embarrass in front of a demo prospect who lands on that role. Fixed by hiding `developer` from role-selection UI only: a new `hiddenOrganizationRoles` allow-list in `role-capabilities.ts` filters it out of `assignableRolesFor`, `invitableRolesFor`, and the "what each role can do" disclosure panel (`visibleRoleDefinitions`). The role, its capabilities, and its `roleCapabilityMap` entry remain fully intact in the data model — only the invite/role-change dropdowns and the role-description panel are affected, per the team's explicit no-build-integrations-yet scope. Verified by walking each of the six roles' rendered navigation and role-selection options after the change: no role's UI links to or offers a page that doesn't exist.

Both fixes are additive/UI-scoped; no existing role, membership, or capability was removed from the schema.

## Team invitation delivery tracking — September 6, 2026

The persona/role audit above also found a delivery-*visibility* gap, separate from the two fixes above: participant invitations (`authority_participant_invitations`) get full Resend delivery tracking through `authority_private.notification_outbox` and the `/api/webhooks/resend` receipt pipeline, but team invitations (`organization_invitations`, sent via `deliverTeamInvitation`) had none. A Resend API "accepted" response was the only signal ever recorded. The audit found 4 of 5 test team invitations were silently dropped by Gmail filtering tonight despite Resend reporting the send as accepted, with no record anywhere in the product to catch that gap short of manually checking Resend's raw logs.

Fixed on `agent/founding-pilot-billing`, scoped to this item only:

- **Migration `20260906193000_team_invitation_delivery_tracking.sql`** adds `delivery_status` / `delivery_provider` / `delivery_provider_message_id` / `delivery_error_code` / `delivery_attempts` / timestamp columns directly on `organization_invitations` (no separate outbox table needed — one invitation email per row, no retry/claim machinery the way `integration_outbox` has). It adds a service-only `record_team_invitation_delivery_service_v1` RPC that records the initial Resend submission result, and extends the existing `record_resend_delivery_event_v1` webhook handler to also match team invitations by `provider_message_id` — the participant match path, and `src/app/api/webhooks/resend/route.ts` itself, are unchanged.
- Following the lesson `20260829142746_authority_delivery_receipt_semantics.sql` already had to learn the hard way for participant invitations: "the provider accepted the send" and "the recipient's mail server delivered it" are different facts. The new code never writes `delivery_status = 'delivered'` on submission — a successful Resend API call is stored as `'processing'`; only the confirmed `email.delivered` webhook event writes `'delivered'`.
- `inviteTeamMemberAction` (`src/app/account-actions.ts`) now calls the new RPC right after `deliverTeamInvitation()` returns, when the provider is `resend` (skipped for `local`/`disabled`, which have no provider message to correlate a webhook to).
- `/app/team` now shows a **Delivery** column next to each invitation (Not sent yet / Sending… confirming delivery / Delivered / Delivery delayed / Not delivered), giving team invitations the same delivery-status visibility participant invitations already have. New `membership.invitation_submitted` / `_delivered` / `_delivery_failed` / `_delivery_delayed` activity events also appear in "Recent access activity".

**Verification, September 6, 2026:** sent a real test email through the same Resend account/domain (`thepassageapp.io`) used by `deliverTeamInvitation`, to a live Gmail address, and confirmed both that Resend reported `delivered` (`get-email` on message `65678ba2-8c37-4287-852e-c5db61cc3de6`) and, directly in Gmail (`search_threads`), that the message landed in `INBOX`, not spam — the same "does Resend's delivered status mean the inbox, or did Gmail file it in spam" question the incident turned on. This confirms the webhook-event-to-status mapping the new code checks is the right signal.

**Known gap, not yet closed:** the migration above is written and committed but has not been applied to the live UAT database. Applying it was intentionally left out of this task's scope because a separate concurrent task on this same branch is actively resolving a stale-migration issue against the same database, and four other migrations already sitting in `supabase/migrations/` ahead of this one (`founding_pilot_billing_v1`, `enable_pilot_authority_activation`, `explicit_accepted_action_scope`, `organization_member_count_summary`) are also unapplied, confirming migrations here are deployed in a deliberate batch rather than automatically on push. The application code degrades safely in the meantime: `inviteTeamMemberAction` does not throw if the tracking RPC call errors (e.g., because it doesn't exist yet), so sending team invitations keeps working exactly as before, just without tracking, until the migration is applied. Once it is applied, the `pending -> processing -> delivered`/`failed` transition should be replayed against one real invitation end-to-end (send, watch the row update to `processing`, then to `delivered` after the webhook fires) to close this out. See `docs/TEAM-INVITATION-DELIVERABILITY-FINDINGS-2026-09-06.md` for the full findings writeup.

## Backlog — not gating the demo

- **Organization branding/customization is a fully missing feature.** The persona audit found no UI anywhere for an institution to set a logo, color, or any other white-label/branding element for its workspace. This is not a current priority and should not block the demo or pilot timeline, but is recorded here so it isn't lost: a future gate (likely alongside V2-7C/V2-7D enterprise-administration work) should scope organization branding/customization once a buyer asks for it.
- **Migration drift between `supabase/migrations/` and the live databases.** Discovered September 7, 2026 while building the reconciliation job: a migration named `stripe_negative_paths_and_reconciliation` is applied in both UAT and Demo (at different timestamps in each — `20260907035519` and `20260905233220` respectively) but its SQL was never committed to `supabase/migrations/` in this repo. `authority_private.reconciliation_runs`, `authority_private.stripe_charge_refund_totals`, `get_commercial_reconciliation_snapshot_v1`, and `record_commercial_reconciliation_v1` all exist live but have no source-controlled origin. This should be reconciled (pull the actual applied SQL back into a tracked migration file) separately from today's P2 work.
- **`.github/workflows/` cannot be written by this task's GitHub token.** Discovered September 7, 2026: the token used lacks `workflow` OAuth scope, so GitHub rejects any create/update under `.github/workflows/` (`403 Resource not accessible by integration`), even though ordinary file writes elsewhere in the repo succeed. The ready-to-add `daily-reconciliation.yml` content is captured in [RECONCILIATION-LOG.md](./RECONCILIATION-LOG.md); it needs a token/user with `workflow` scope (or a local `git push`) to actually land it.
- **Supabase security-advisor findings, noted September 7, 2026, not addressed in this task:** `auth_leaked_password_protection` is disabled on at least the UAT project (HaveIBeenPwned check for compromised passwords); `authority_private.reconciliation_runs` and `authority_private.stripe_charge_refund_totals` have RLS enabled with no policies (correct default-deny behavior for server-only tables, flagged as informational by the linter, not a defect). Worth a look during the P2 scoped security review already planned.

## Research basis

- [Stripe Hosted Invoice Page](https://docs.stripe.com/invoicing/hosted-invoice-page)
- [Stripe subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Stripe webhook signatures](https://docs.stripe.com/webhooks/signature)
- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [HubSpot CRM architecture](https://developers.hubspot.com/docs/api-reference/latest/crm/understanding-the-crm)
- [HubSpot pipelines](https://developers.hubspot.com/docs/api-reference/latest/crm/pipelines/guide)
- [HubSpot properties and unique identifiers](https://developers.hubspot.com/docs/api-reference/latest/crm/properties/guide)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
