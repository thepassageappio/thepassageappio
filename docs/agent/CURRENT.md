# Current Passage checkpoint

September 22 resume: the owner has resumed work and requested completion of all four roadmap steps. The pause below is historical. Hosted synthetic email testing is authorized to the inbox supplied in the task; extra role aliases require confirmation. Recovery rollout now uses an explicit queued-submission RPC so old inline senders cannot also enqueue. Source checks and all five SQL suites pass after this handover change. No new hosted recovery acceptance is claimed yet.

## September 22 — implementation paused for owner review

The owner asked to pause implementation and review the overall journey. Roadmap documentation may be updated; do not start another feature, migration, provider send, or rollout until work is resumed. See [Journey and north star](../JOURNEY-AND-NORTH-STAR-2026-09-22.md) and the [active delivery plan](../OUTREACH-READY-DELIVERY-PLAN-2026-09-10.md).

PR #144 is merged and live on Production and Demo at `7a3a09dfa6ce0f3e1ae1c6f97edace5bb34dea62`. The submission security migration is applied and verified on both. Both deployments and merge-commit CI passed. Production owner workspace, saved case/receipt and both submission entry forms passed browser smoke. Demo's inactivity pause was restored. A fresh full participant/provider acceptance run remains open.

PR #145 targets main and remains draft. Durable submission delivery recovery is implemented and locally verified: 228 domain tests, typecheck, lint, build, full migration replay, five SQL suites, and authenticated browser failure/retry persistence. Implementation CI/previews passed. No hosted recovery migration, worker rollout, or external email was performed. Documentation-only follow-ups do not change that implementation evidence.

We are between a proven core workflow and a dependable, uncoached synthetic New York demo. On resume: recovery hosted acceptance, NY provenance and draft pinning/rebase, complete hosted persona/accessibility/recovery rehearsal, then operating evidence and explicit demo-release review. General configuration, complete commercial-provider reconciliation, seven actual clean days, and branch-check enforcement remain open.

Latest owner decisions supersede historical counsel/paid-backup gates: counsel engagement is outside active M1; Free/no-PITR is accepted risk; synthetic data remains the current boundary; state build order is NY → PA → NJ → CT → MA. A named real-data pilot is a later separate decision.

## Historical checkpoint — not current execution instructions

Updated September 15, 2026 UTC after eng scoping aggregation. Codeword: **AUTHORITY COMPASS 771204**.

## Latest tip

GitHub `main` tip: `b1ba96cfbba00f9e0c3d4335018e3de866445be0` (2026-09-14). Same product SHA is intended for both Vercel projects (`passage-authority-uat` → `thepassageapp.io`, `passage-authority-demo` → `demo.thepassageapp.io`). **Supabase migration heads differ:** demo (`bklrclpertdtmhycpqlz`) includes multi-institution Phase 0; prod/UAT (`ywlrxdjibngroycwnujg`) does not.

## Owner writing rule (hard)

Every website and product screen must use clear, natural, everyday language. Follow the [plain-language standard](../PLAIN-LANGUAGE-STANDARD.md). **Steve, 2026-09-15:** no AI fluff, AI slop, or AI verbiage on the website or any external-facing surface. A five-year-old must fully understand and be able to use the product. Enforce especially on orientation UX, multi-institution UI, and document-review controls. Preserve the meaning of legal text and saved decisions.

## What landed since the prior CURRENT

- **Multi-institution Phase 0 (demo only):** schema + RPCs + RLS + requester wizard at `/start/multi-institution/**` + institution case-detail origin badge. See [scope](../USER-INITIATED-MULTI-INSTITUTION-SCOPE-2026-09-13.md) and [Phase 0 progress](../MULTI-INSTITUTION-PHASE0-PROGRESS-2026-09-15.md). Screenshot walkthrough still pending resume — do not recreate from scratch.
- **Orientation:** request-detail “Where this stands” (2026-09-12) and [reviewer/admin orientation pass](../REVIEWER-ADMIN-ORIENTATION-PASS-2026-09-13.md) (2026-09-13). First-time uncoached walkthrough still open (UX2).
- **PR [#109](https://github.com/thepassageappio/thepassageappio/pull/109)** remains open: policy validation / immutable storage **groundwork only**. Do **not** merge wholesale. Do **not** market as complete POL1. Authenticated publication, request binding, and activation/rebase enforcement remain unfinished; some migrations were local-only.
- **Never recreate** demo case `PA-F39449782D`.

## Prior evidence still true (do not erase)

- [Policy snapshot baseline](../POLICY-SNAPSHOT-BASELINE-2026-09-11.md): hosted creation events have template identifiers; **none** contain a full `policy_snapshot` object. Inventory only; authoring/publication/rebase unbuilt.
- [Policy overview](../POLICY-OVERVIEW-2026-09-11.md): distinguishes saved / missing / failed / unsupported selections.
- [Hosted cancellation](../PENDING-CANCELLATION-HOSTED-2026-09-11.md): migrations applied on Demo and UAT; **hosted authenticated browser replay still open**.
- [JavaScript recovery](../JAVASCRIPT-RECOVERY-2026-09-11.md), [public keyboard navigation](../PUBLIC-KEYBOARD-NAVIGATION-2026-09-11.md), [workspace guidance](../WORKSPACE-GUIDANCE-2026-09-10.md), [plain-language review](../PLAIN-LANGUAGE-REVIEW-2026-09-10.md), [draft recovery](../DRAFT-RECOVERY-2026-09-10.md).
- Core synthetic NY persona journey and scoped receipts pass. Pennsylvania, general policy configuration, and incapacitated-principal path are not shipped capabilities.
- **P1 open; P2 open; outreach and buyer-demo release not approved** without explicit owner signoff. Real-data pilot approval remains separate.
- Reconciliation and backup/PITR counts: re-verify before citing a day number (prior docs disagree across dates).

## Owner objective

Finish a beautiful, simple, user-friendly product that supports truthful one-pagers and outreach. Follow the [active delivery plan](../OUTREACH-READY-DELIVERY-PLAN-2026-09-10.md), informed by the [market research](../MARKET-RESEARCH-2026-09-10.md). Use evidence and completion criteria, not a readiness score.

**Demo-ready (= pilot-sellable):** product works end-to-end without hand-holding, and the demo environment is an identical walkthrough environment for a live client. Multi-institution Phase 0 may appear only on demo until promoted.

## Execute next

**M0 (allowed now — docs/resume only; no new product claims):**

1. Resume interrupted multi-institution demo walkthrough and screenshots; keep [Phase 0 progress](../MULTI-INSTITUTION-PHASE0-PROGRESS-2026-09-15.md) current.
2. Plain-language audit of `/start/multi-institution/**`, origin badge, and document-review controls against the hard bar above.
3. Keep PR #109 as groundwork only.

**M1 (hold product build until owner green-lights aggregated roadmap):**

1. UX2: guided journey, keyboard/zoom/screen-reader, independent first-time walkthrough — five-year-old bar must pass.
2. WF1: exact-candidate hosted authenticated browser release for cancellation.
3. Env identity + presenter runbook; truthful claim ledger (NY sample; multi-inst demo-only if shown).
4. REL1: timed rehearsal with matching receipts.

**M2 / later (enterprise; Ops leads bar):**

1. POL1 beyond inventory: governed publish, snapshots on new requests, stale-draft rebase — not a wholesale merge of #109.
2. WF2/LEG1 prep with Compliance: jurisdiction packages and product supportability hooks.
3. SEC1 / OPS1 / OPS2 / ASS1 with accurate scope.

## Persistent boundaries

The institution decides; no automatic legal acceptance, universal registry, inferred consent, customer credential sharing or unacknowledged access-change claim. Keep identity evidence, authority evidence, and institution acceptance separate. Preserve activated history. No new spending, real customer data, live payments, external messages or invented signoffs. Research and unsent asset preparation may proceed. Do not repeat migrations or provider sends to recover context.

## Read only what the task needs

- [Memory index](MEMORY-INDEX.md)
- [Delivery plan](../OUTREACH-READY-DELIVERY-PLAN-2026-09-10.md)
- [Prior evidence ledger](../P1-P2-CONTINUATION-2026-09-10.md)
- [Engineering](ENGINEERING.md), [QA](QA.md), [releases](RELEASES.md), [commercial](COMMERCIAL.md), [providers](PROVIDERS.md), [jurisdictions](JURISDICTIONS.md)

The previous checkpoint body before this refresh is historical; older scores and stale counts in archived CURRENT files remain historical only.
