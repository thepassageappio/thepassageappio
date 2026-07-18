# Passage Zero cutover plan

Status: owner-approved canonical product decision, 2026-07-18.

This document is a cutover contract, not a second roadmap. `docs/product/operational-readiness-roadmap.md` remains the single roadmap.

## Decision and freeze

Passage Zero on `greenfield/passage-zero`, draft PR #24, is the sole target architecture. Threshold/main is maintenance-only. New Threshold dashboard, estate, IA, schema, or redesign work is frozen; only separately governed production P0/P1 hotfixes may proceed.

The beta is isolated and non-production. Production project `qsveqfchwylsbncsfgxe`, real customer data, family grants, vendor fulfillment, pricing, and live external delivery are outside this cutover until their own approval and evidence gates pass.

## Release definitions

| State | Meaning | Required evidence |
| --- | --- | --- |
| Functional beta | Synthetic, manually supported, non-production funeral-home operating loop | Hosted director/staff identities, durable assigned work, RLS, audit, revocation, recovery, 1440/390/360 QA |
| Allowlisted pilot | Evidence-gated partner/synthetic pilot with the complete cross-persona coordination loop | Roadmap 10–15-day target; funeral home 85–88% and D2C 83–87% only after full gate |
| Production readiness | Public launch and real operational support | Production migration/rollback, providers, monitoring, restore, support, security/privacy/legal, billing, rollout controls |

## Route and capability cutover matrix

| Current production responsibility | Passage Zero target | Current parity | Cutover requirement | Rollback owner |
| --- | --- | --- | --- | --- |
| Marketing and entry routes | App Router public entry set | Not in 72-hour beta | Inventory content, SEO, analytics, redirects, and visual parity before merge | Deploy |
| Funeral-home sign-in | `/login` + `/auth/callback` | Implemented for isolated Preview; production providers held out | Production provider/configuration plan and post-deploy Auth proof | Engineering + Deploy |
| Legacy funeral-home dashboard | `/director`, `/director/intake`, `/director/invitations/*`, case routes | Guided surfaces exist; durable workload slice queued | Director workload, assignment/reassignment, revocation, audit, RLS, proof, and recovery pass | PM + Engineering |
| Legacy employee console | `/staff`, `/staff/work/[id]` | Role landing exists; durable assigned work queued | Assigned-only query, work transition, direct-route denial, reload/revocation proof | Engineering + QA |
| Legacy family/estate surfaces | `/family`, `/family/pass`, future case/estate routes | Guided only; not beta-operational | No cutover until durable family identity/grants and estate scope pass | PM |
| System admin and roadmap | Future secure App Router System Admin | Not implemented | Render the one roadmap source with audited admin authority | PM + Security review |

No legacy route is deleted or redirected in Production until its Passage Zero replacement satisfies the parity ledger and rollback evidence. PR #24 can remain a clean-room replacement while the merge plan preserves an immediately recoverable last-known-good Production deployment.

## PR #24 merge gate

PR #24 must remain draft until:

1. Every route that will own a production responsibility has an explicit implemented, backend-only, queued, redirected, or held-out classification.
2. Frontend/backend parity passes for every implemented action.
3. Supabase migrations are documented first, independently reviewed, applied through migration tooling to the intended environment, and proven absent from Production unless a later production release explicitly authorizes them.
4. Auth/RLS negative tests, append-only event cardinality, idempotency, reload/reconnect, and recovery pass.
5. TypeScript, optimized build, deployment gate, advisors, and 1440/390/360 browser QA pass with timestamped redacted evidence.
6. Production aliases, environment variables, data migration/backfill, redirects, monitoring, rollback, and support owners are written down.
7. A final distinct PM -> UX -> Engineering -> QA -> Deploy release train records PASS. Draft status alone is never release authorization.
8. The implementation has been presented in bounded stacked PRs or named review packets for identity/authority, data/RLS, director/staff operations, Transfer Pass/family boundaries, and responsive UX, with exact dependencies and dispositions for PRs #17, #19, and #23.
9. At least one human GitHub reviewer who neither authored nor materially implemented the change approves the reviewed packet and final integration. Agent QA, Deploy PASS, self-graded evidence, and multiple roles operated by one automation account do not satisfy this gate.
10. Every reachable public and persona surface passes the seven-question plain-language and 1440/390/360 comprehension gate in `docs/product/release-governance-and-plain-language-policy.md`, including truthful Demo/Preview/Pilot/Production labeling and removal of raw enums, UUIDs, fixture/cycle labels, and architecture/QA/deploy narration.

Agents and schedules must never push or merge directly to `main`. The Production cutover occurs only through the protected, reviewed PR path with passing required checks and a serialized release job.

## Frontend/backend convergence rule

Each slice owns one matrix row containing: visible persona action/state; reachable route/component; server command/query; durable rows and cardinality; RLS/authority predicate; append-only event/proof; failure and recovery behavior; persona projection; and tests/evidence. Engineering changes both sides in the same slice. QA rejects frontend-ahead and backend-ahead drift. Internal or queued backend capability must be labeled truthfully and excluded from readiness claims.

## Production hotfix lane

Current live P0/P1 defects may be fixed on `main` under a separate release train. A hotfix must not extend Threshold IA or redesign scope, change Passage Zero contracts, or be reported as greenfield progress. The hotfix owner records the defect, affected live routes, verification, deployment, and rollback independently from PR #24.

The known hydration failures on `/pricing`, `/resources`, `/guides`, `/care-providers`, `/trust`, and `/mission` are one P1 production-maintenance incident. They require one bounded hotfix branch/PR, independent human review, shared-cause correction, and route-by-route post-deploy console/hydration/runtime proof. No agent or schedule may bypass the PR by committing the fix directly to `main`.

## Rollback principle

The first Passage Zero production release, when separately approved, must retain the last-known-good Vercel deployment and a documented alias rollback. Database changes must be backward-compatible during cutover or have a verified migration rollback/backfill plan. No rollback may depend on deleting customer data or applying ad hoc Production SQL.
