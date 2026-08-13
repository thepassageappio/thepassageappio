# Passage release governance and plain-language policy

Status: owner-approved operating policy, updated 2026-07-22.

This policy prevents initiative drift, self-approval, direct-main collisions, oversized unreviewable releases, and persona-facing copy that exposes internal implementation language. `AGENTS.md` controls permissions, `docs/release-train.md` controls the role loop, and `docs/product/operational-readiness-roadmap.md` remains the only roadmap.

## One product lane

- Passage Zero on `greenfield/passage-zero`, integrated through draft PR #24, is the sole target architecture and redesign implementation.
- Threshold on `main` is maintenance-only. Only separately scoped live P0/P1 defect, security, or availability work may enter that lane. A Threshold hotfix is never counted as Passage Zero progress.
- Production hydration failures on `/pricing`, `/resources`, `/guides`, `/care-providers`, `/trust`, and `/mission` are a P1 production-maintenance incident until one reviewed hotfix proves the shared cause corrected across every affected route.
- Historical roadmaps and backlogs are evidence only. They must carry an explicit superseded/archive notice or point to the canonical operational-readiness roadmap; they must never compete with it.

## Repository and review controls

Agents and schedules must never push directly to `main`. They work on a named branch and open or update a pull request. The repository control target is:

1. Require a pull request before `main` changes.
2. Require agents and schedules to author through the dedicated Passage GitHub App/Bot identity, never through the owner's GitHub User credentials.
3. Require a distinct Independent Agent Review check for the exact head.
4. Require a distinct Development Head / Release Authority to approve that exact head through the existing `Passage Review Agent / merge-review` check. That role must be separate from the author/implementer, QA, Independent Agent Reviewer, and Deploy role.
5. Make Development Head approval stale when the head, base, evidence, or required checks change, and require conversation resolution.
6. Restrict bypass, force-push, and branch deletion; scheduled agents and the Bot receive no bypass.
7. Require separate exact-head authorization from the distinct Production Reviewer through `Passage Production Review / release-readiness` before reversible Production promotion. Do not prompt the owner for ordinary releases; retain owner gates only for destructive Production data work, spending, and material legal/privacy/security judgment.
8. Serialize Production release jobs with one repository/environment lock so two schedules cannot release concurrently.

The pull-request author GitHub identity may never execute the merge. The ready-for-review record must name the actual author identity and the separately controlled merge-authority identity, and the trusted gate must reject equality. The same implementation role/session also cannot masquerade as QA, Independent Agent Review, Development Head, Deploy, or Production Review. A role label is not evidence of independence.

Distinct PM, UX, Engineering, QA, Deploy, Independent Agent Reviewer, and Development Head / Release Authority roles remain mandatory. Independent Agent Review supplies technical challenge; Development Head approval authorizes merge readiness; the distinct Production Reviewer exact-head check authorizes reversible Production promotion. None substitutes for another. An agent may not approve or merge its own implementation, and automation must not operate through a human GitHub User identity. There is no routine founder or human code-review gate.

The repository must not attempt to infer human operation or implementation independence from GitHub's `User` account type. Trusted checks enforce exact-head Independent Agent Review and Development Head / Release Authority approval. Custom scripts must not treat an arbitrary non-author `User` review as release authority.

Historical bootstrap note: the one-time PR #25 exception is expired and may never be reused. The installed Bot-author, Independent QA, Release Reviewer, and Production Reviewer controls are the active model. This historical exception grants no current merge or Production approval.

CI failures are owned work. The PR owner must classify a failing required check in the same release-train cycle as fix now, superseded, or explicitly blocked. A draft PR may remain unmerged, but it may not accumulate an unexplained red required check.

## Roadmap, tracker, divergence, and QA-infrastructure controls

- Every PR explicitly declares `Material Product Direction or Scope Change: YES|NO`. Missing means stale and fails closed. `YES` requires the same PR to update `docs/product/operational-readiness-roadmap.md` and `docs/agent-operating-context.md`; a separate follow-up is not sufficient.
- `pages/system/admin/saas-roadmap.js`, `docs/backlog.md`, and historical Threshold trackers are archived and non-canonical. GitHub Issues are also formally deprecated as a live backlog until PM records a reactivation contract with a synchronization owner, PR linkage, aging rules, and roadmap integration.
- Each independent repository audit records consecutive unresolved `main`/Passage Zero divergence cycles. At two or more, the next PM Sprint Brief must include an actionable reconciliation proposal for Development Head disposition.
- A required QA cell blocked by browser policy, host policy, runner capability, fixture, credentialed test identity, or provider behavior stays `PARTIAL` and creates a named QA-infrastructure fix-it item with owner role, milestone, affected evidence, and recovery test. `QA: N/A` is prohibited for a required but blocked gate.

## Whole-platform readiness checkpoints

Certified platform checkpoints are `0, 10, 20, 30, 40, 50, 60, 70, 75`. The six scored domains are: D2C/family/participants; funeral-home directors/dashboards; funeral-home employees; vendors; public/conversion pages; and the deterministic Steve demo sandbox. The score is the greatest checkpoint whose weighted aggregate, domain floors, and fresh full-platform E2E matrix all pass. An absent or unproven domain cannot be averaged away.

Every increase through 70 requires a fresh cross-domain E2E pass; `70 -> 75` does too. At 75, a second, distinct massive full-platform QA/smoke/adversarial pass is mandatory. Required evidence includes full participant invitation and revocation, cross-persona handoff, exact database/event cardinality, least-privilege denials, replay/conflict/reload/recovery, demo seed/reset isolation, public direct/client navigation, 1440/390/360, keyboard and screen-reader checks, console/hydration/runtime logs, and timestamped redacted proof.

## Release verdict lifecycle

Every PR, release handoff, roadmap update, and incident record uses this complete status block. Bare `PASS`, `fixed`, `live`, `resolved`, and `qa-approved` claims are prohibited.

```text
Source QA: PASS | PARTIAL | FAIL | NOT RUN | UNKNOWN
Hosted Preview QA: PASS | PARTIAL | FAIL | NOT RUN | INVALIDATED | UNKNOWN
Independent Agent Review: PASS | FAIL | NOT RUN | STALE
Development Head / Release Authority: APPROVED | REQUIRED | STALE | NOT REQUIRED
Owner Gate: REQUIRED | NOT REQUIRED | BLOCKED
Production Authorization: APPROVED | REQUIRED | NOT REQUESTED | STALE
Production Deployment: NOT DEPLOYED | DEPLOYED
Production QA: PASS | PARTIAL | FAIL | NOT RUN | INVALIDATED | UNKNOWN
Overall release state: SOURCE ONLY | PREVIEW PARTIAL | PREVIEW VERIFIED | PRODUCTION PARTIAL | PRODUCTION VERIFIED | INVALIDATED/REOPENED
```

- `Source QA PASS` proves repository and applicable database checks only.
- Vercel `READY` proves that an artifact built. It is not hosted user-flow or Production QA.
- `Hosted Preview QA PASS` proves the exact non-production product tree in the hosted environment with the required identities, durable state, denials, recovery, logs, and responsive browser matrix.
- `Production Authorization APPROVED` permits promotion of the exact commit. It does not claim that promotion completed or works.
- `Production Deployment: DEPLOYED` states only that the exact artifact is live. Until Production QA passes, `Production QA` remains `NOT RUN`, `PARTIAL`, or `FAIL` and the overall release state remains `PRODUCTION PARTIAL`.
- `Production QA PASS` and `PRODUCTION VERIFIED` require a distinct post-deploy QA role to verify the exact Production alias, deployment ID, commit, and complete incident-specific matrix after propagation.
- An incident is `resolved` only after `PRODUCTION VERIFIED`. Before that, use `fix prepared`, `verified in Preview`, or the complete `Production Deployment: DEPLOYED` plus `Production QA: NOT RUN/PARTIAL` and `Overall release state: PRODUCTION PARTIAL` fields.

`[qa-approved]` remains a pre-promotion candidate marker. It never substitutes for `Production QA PASS` and cannot be cited as current proof after contradictory Production evidence.

## Contradictory evidence and false-closure prevention

A single reproducible release-blocking contradiction automatically invalidates the earlier verdict while investigation proceeds. The incident returns to its prior severity, promotion and readiness claims freeze, and Product Manager owns re-scope. The record must name who found the contradiction, when, the exact environment/domain/deployment/commit, the observed evidence, and which earlier assumption failed.

Earlier screenshots, logs, and reviews remain preserved as historical evidence and are annotated `INVALIDATED`; replacement evidence never overwrites them. Investigation may later show that the report was environmental, but the old PASS does not remain controlling during that investigation.

For a named multi-route incident, sampling is prohibited. Production proof must cover every named route and viewport in a clean browser context, including direct navigation and any relevant client navigation or redirect. It records raw browser-console warnings/errors, page errors, unhandled rejections, failed requests, final URL, rendered purpose/action, width/overflow, browser/version, reviewer, timestamps, alias, deployment ID, and commit. Empty Vercel runtime logs are complementary server evidence and never replace browser-console proof.

Rollback or repair-forward is selected by PM and Deploy after comparing the failing deployment with the last exact known-good deployment. Either path remains `PRODUCTION PARTIAL` until the full post-production matrix passes again. Documentation alone cannot eliminate defects; this policy permits zero tolerated false closures.

## PR consolidation and review packets

PR #24 is the Passage Zero integration and acceptance umbrella, not one indivisible review unit. Large changes are presented as bounded stacked PRs or named review packets with:

- a single product outcome and persona boundary;
- the exact base/head and dependency order;
- route and component scope;
- command/query, durable rows, RLS predicate, event/proof, and recovery contract;
- migrations and rollback notes;
- focused tests and 1440/390/360 evidence;
- a disposition: merge into the Passage Zero stack, superseded by a named PR/commit, or closed with a written reason.

Open greenfield PRs #17, #19, and #23 must be reconciled against #24 before merge. Unique work becomes a bounded stacked PR or review packet. Duplicated work is labeled and closed as superseded. Four overlapping draft branches must never be merged independently into `main`.

## Plain-language release gate

Every public or persona-facing page must let the intended user answer these seven questions without interpreting product or engineering vocabulary:

1. Where am I?
2. What needs my attention?
3. What do I do now?
4. What happens after I act?
5. What will be saved as proof?
6. Who can see it?
7. What should I do if it fails or I cannot continue?

The first useful screenful should state the situation, the one primary action, and its outcome. Instructions sit beside the control they govern. Empty, pending, success, replay, stale, denied, revoked, and recovery states must name the safe next action. A page that requires training, release-history knowledge, or architecture knowledge fails UX and QA.

Persona surfaces must not expose raw UUIDs, database identifiers, enum/event keys, SQL/RLS terminology, fixture names, cycle labels, QA/deploy narration, readiness scores, agent language, or phrases such as `projection`, `authority predicate`, `event spine`, `durable assignment`, or `server verified`. Translate them into the person's outcome, for example “Avery started this task” or “You no longer have access; ask a director for help.” Technical identifiers may appear only in a deliberately revealed support detail when a user needs a reference, with a human label and copy action.

Buttons use verbs that match the real command. Status copy distinguishes prepared, reviewed, sent, delivered, submitted, verified, and completed. No UI may imply that an external message was sent, a task was completed, or a proof was accepted before durable evidence exists.

## Demo, sandbox, preview, pilot, and Production labels

- `Demo` means synthetic data and simulated or blocked external effects.
- `Preview` means a non-production hosted build. It may still use durable server-authorized data.
- `Browser-only demo` means state exists only in that browser and is not shared, secure multi-user evidence.
- `Functional beta` means the bounded synthetic flow works with its stated evidence.
- `Allowlisted pilot` means independently authenticated users, operational controls, recovery, monitoring, and support gates have passed for a named limited cohort.
- `Production` means the separately approved live environment and evidence gate.

Do not place `browser sandbox` beside a durable hosted database-authority claim. State one truthful boundary in human terms, such as “Preview workspace—uses synthetic data; no customer records or messages.” Infrastructure project IDs, branch names, and database narration stay in System Admin/evidence surfaces.

## Comprehension and responsive QA

Plain-language comprehension is tested at 1440, 390, and 360 in the same slice. At each viewport, QA verifies:

- the page purpose and primary action are visible and unambiguous;
- action labels, result, visibility, proof, and recovery language are consistent;
- no critical instruction is hidden by truncation, overflow, hover-only help, or desktop-only layout;
- controls retain visible focus and at least the design-system minimum target size;
- no horizontal overflow, hydration warning, console error, or runtime error occurs;
- a reviewer can restate the seven answers from rendered copy alone.

Automated string and parity checks support this gate but never replace distinct UX review, independent QA, Independent Agent Review, Development Head review, or exact-head Production Reviewer authorization.

## Enforcement and evidence

PM puts the seven-question answers and PR/review disposition in the Sprint Brief. UX rewrites ambiguous or internal copy before Engineering starts. Engineering keeps internal values behind typed translation helpers and exposes human labels. QA records the rendered answers, denial/recovery behavior, and viewport evidence. Deploy verifies the exact approved commit, required checks, Development Head review, and distinct Production Reviewer exact-head authorization before Production promotion.

A violation is release-blocking for the affected slice. Production P0/P1 defects return through their own hotfix PR; Passage Zero defects return to PM without inflating readiness scores. Unknown or PARTIAL stays explicit.
