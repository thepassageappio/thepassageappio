# Passage Zero release train

This is the App Router/Supabase release loop for Passage Zero. `AGENTS.md` controls permissions; `docs/product/operational-readiness-roadmap.md` controls priority; `docs/product/frontend-backend-contracts.json` controls frontend/backend parity; `docs/agent-operating-context.md` records the living handoff.

## Required loop

1. Product Manager writes the bounded Sprint Brief and classifies discovered work.
2. UX Review sets the responsive, accessible, truthful experience bar.
3. Engineering implements the reachable UI and its server/data/RLS/event/recovery contract together.
4. Independent QA verifies source, database authority, negative paths, browser behavior, and evidence.
5. Deploy verifies project, branch, environment scope, release marker, deployment, logs, and post-deploy behavior.
6. A distinct Independent Agent Reviewer challenges the exact head and records a required agent-review result.
7. A distinct Development Head / Release Authority reviews the exact head, all handoffs, required checks, and evidence, then records `APPROVED`, `REQUIRED`, or `STALE` through the existing `Passage Review Agent / merge-review` check. This role must not be the author/implementer, QA, Independent Agent Reviewer, or Deploy role.
8. The Deploy Agent validates the exact Vercel state and recovery/promotion evidence. The distinct Production Reviewer authorizes exact-head reversible Production promotion through `Passage Production Review / release-readiness`. The owner is not involved in ordinary Production releases and remains limited to destructive Production data work, spending, or material legal/privacy/security gates.
9. PM scopes the next highest-leverage slice immediately after Deploy PASS/PARTIAL.

No role may promote its own work to QA PASS. Agent role separation does not substitute for the distinct Independent Agent Review check, Development Head / Release Authority approval, or exact-head Production Reviewer authorization. Role instance, received handoff, decision, evidence, failures, next target, PR/packet, agent-review state, Development Head state, and Production-authorization state belong in the operating context.

## Verdict stages and reopening

Every role must use the complete status vocabulary in `docs/product/release-governance-and-plain-language-policy.md`. A bare `PASS`, `fixed`, `live`, or `resolved` is release-blocking.

The stages do not substitute for one another:

1. `SOURCE ONLY` — source/database checks may pass; no hosted claim.
2. `PREVIEW PARTIAL` or `PREVIEW VERIFIED` — the exact hosted non-production artifact is unproven or proven.
3. `PRODUCTION PARTIAL` — authorized or deployed, but post-deploy Production QA is incomplete or failed.
4. `PRODUCTION VERIFIED` — a distinct post-deploy QA role passed the exact Production deployment after propagation.
5. `INVALIDATED/REOPENED` — later credible evidence contradicts the controlling verdict.

`[qa-approved]` is candidate approval before promotion. It does not and cannot assert that the later Production deployment passed. After deployment, Deploy records `Production Deployment: DEPLOYED`, `Production QA: NOT RUN`, and `Overall release state: PRODUCTION PARTIAL`; distinct Production QA then verifies the exact alias, deployment ID, commit, and required matrix.

A later reproducible blocking contradiction immediately invalidates the old verdict, reopens the incident at its prior severity, freezes promotion/readiness reliance, and returns the issue to PM. Historical evidence is retained and annotated. No role may defend an old PASS solely because the PR merged, the commit contains `[qa-approved]`, the deployment is `READY`, the page returns 200, or runtime logs are empty.

## Branch, PR, and collision control

- Agents and schedules never push directly to `main`; every change enters through a named branch and pull request.
- After the one-time PR #25 bootstrap, agent and scheduled work is authored only through the dedicated Passage GitHub App/Bot identity. Automation must never use the founder's GitHub User credentials.
- PR #24 is the Passage Zero integration umbrella, not an indivisible review unit. Large work is split into stacked PRs or named review packets with exact dependencies, contract rows, migrations, recovery, tests, and evidence.
- Overlapping greenfield PRs are dispositioned before merge: incorporate unique bounded work, or label and close them as superseded. They never merge independently without reconciliation.
- A failing required check is classified in the same cycle as fix now, superseded, or explicitly blocked. Red checks do not age silently because a PR is draft.
- Production release automation is serialized with a single repository/environment lock. Concurrent schedules may prepare separate branches but may not race a merge, alias, or Production deployment.
- Repository protections should require passing current-head checks, the Independent Agent Review check, exact-head Development Head / Release Authority approval through `Passage Review Agent / merge-review`, stale-approval dismissal, resolved conversations, restricted bypass, and no force-push or deletion of `main`. The protected Production release gate requires exact-head approval from the distinct Production Reviewer App; routine owner authorization is prohibited.
- The pull-request author identity and merge-authority identity must be recorded and different. The author must not execute the merge. The trusted merge path is serialized and separately controlled; changing a role label without changing the acting session/identity does not satisfy independence.
- Every PR declares whether product direction or scope materially changed. Missing classification fails closed. `YES` requires the canonical roadmap and living context in the same PR.
- Independent audits record consecutive unresolved branch-divergence cycles. The second consecutive finding forces an actionable reconciliation proposal into the next PM Sprint Brief for Development Head disposition.
- GitHub Issues and legacy backlog/roadmap files are not live planning signals. Only the canonical roadmap, PM briefs, review packets, and operating context schedule Passage Zero work.

## Per-slice contract

Every user-visible action or state names:

- route and component;
- server-authorized command or query;
- durable rows and expected cardinality;
- RLS/authority predicate;
- append-only event or proof for mutations;
- failure, retry, replay, and recovery states;
- persona projection and privacy boundary;
- TypeScript/build, database, browser, and parity evidence.

It also answers, in rendered human language: where am I; what needs attention; what do I do now; what happens next; what is saved as proof; who can see it; and what do I do if it fails. Raw enums, UUIDs, fixture/cycle labels, infrastructure identifiers, and internal architecture/QA/deploy narration are release-blocking on public or persona surfaces. The complete copy and environment-label contract is in `docs/product/release-governance-and-plain-language-policy.md`.

`implemented` means the complete reachable contract exists. `backend_only` means the backend is real but no truthful reachable UI exists. `queued` means the complete contract is not built. Dates and mockups never promote status.

## Deployment discipline

Passage Zero builds only from the canonical Vercel project and exact approved branch. Preview environment variables must be branch-scoped; isolated Supabase migrations must use migration tooling; Production values and project `qsveqfchwylsbncsfgxe` are forbidden unless a later Production Reviewer-approved release explicitly names them and any separate destructive-data owner gate has been satisfied.

Use `[skip deploy]` while integrating source and evidence. Use `[deploy] [qa-approved]` only after independent QA PASS. A separately documented verification-preview exception may be used once for hosted evidence when `AGENTS.md` and the operating context authorize it; remove the exception afterward.

Production promotion creates a new verification obligation. Preview evidence cannot be reused as Production QA when Production is a separate build or alias assignment. The post-deploy verifier must use a clean browser context, prove exact alias/deployment/commit binding before and after the run, and record the incident-specific route, viewport, navigation, console, runtime, render, overflow, and recovery matrix. Missing access or one missing cell is PARTIAL; one hydration or runtime error is FAIL.

## QA minimum

- independent browser storage contexts for cross-persona flows;
- wrong-user, wrong-role, wrong-organization, wrong-location, unassigned, replay, stale-session, and revoked-access denial as applicable;
- exact durable row/event cardinality and no partial writes;
- reload/reconnect truth;
- TypeScript, optimized build, parity, deploy-gate, Supabase advisors, and SQL/RLS tests;
- 1440, 390, and 360 with no overflow, hydration/console errors, inaccessible focus, or undersized enabled targets;
- 1440, 390, and 360 comprehension proof: the page purpose, primary action, result, visibility, saved proof, and failure recovery are unambiguous without training or architecture knowledge;
- timestamped screenshots and redacted database/audit evidence.
- a named QA-infrastructure fix-it item, owner role, target milestone, and recovery test for every required cell blocked by environment or tooling; blocked required QA remains PARTIAL and is never N/A.

## Platform checkpoint cadence

The platform score uses checkpoints `0, 10, 20, 30, 40, 50, 60, 70, 75` across D2C/family/participants, directors/dashboards, funeral-home employees, vendors, public/conversion pages, and the deterministic Steve demo sandbox. No persona may be averaged away. Every advancement requires a fresh complete cross-domain E2E matrix. The final 75% checkpoint additionally requires a separate massive full-platform smoke/adversarial run. Missing participant invitation, vendor, public conversion, demo reset, durable authority, responsive, accessibility, runtime, or recovery evidence holds the prior checkpoint.

Production hydration errors are a P1 release condition. The known shared failure on `/pricing`, `/resources`, `/guides`, `/care-providers`, `/trust`, and `/mission` belongs to one separately reviewed Threshold/main hotfix PR and must pass all six routes at 1440, 390, and 360 by clean direct navigation plus relevant client navigation/redirects before closure. Browser-console proof is mandatory; `READY`, HTTP 200, build success, and empty runtime logs cannot close it. It does not advance Passage Zero readiness.
