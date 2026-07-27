# Passage release governance and plain-language policy

Status: owner-approved operating policy, 2026-07-18.

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
3. Require a distinct Independent QA role and a distinct Independent Agent Reviewer to verify the exact current head.
4. Require a distinct Development Head / Release Authority to approve or reject that exact reviewed head before merge readiness. The Development Head must be separate from the author/implementer, QA, Independent Agent Reviewer, and Deploy role.
5. Dismiss every stale agent approval when the head, base, evidence, or required-check result changes; require conversation resolution.
6. Record a separately controlled merge-executor identity and prohibit the pull-request author identity from executing its own merge.
7. Require a distinct Production Reviewer to authorize any later exact-head reversible Production promotion through `Passage Production Review / release-readiness`.
8. Restrict bypass, force-push, and branch deletion; scheduled agents and the author Bot receive no bypass.
9. Serialize Production release jobs with one repository/environment lock so two schedules cannot release concurrently.

Distinct PM, UX, Engineering, QA, Deploy, Independent Agent Reviewer, Development Head, merge executor, and Production Reviewer responsibilities remain mandatory. Independent QA verifies behavior and evidence; Independent Agent Review supplies technical challenge; Development Head authorizes merge readiness; Production Reviewer authorizes a reversible Production promotion. None substitutes for another. The owner is not a routine review role and must not be prompted for ordinary planning, source changes, tests, pull requests, CI, Preview work, merge readiness, or reversible Production promotion.

The repository must not attempt to infer human operation or implementation independence from GitHub's account type. Custom scripts verify exact-head role structure and separation; repository rules and separately controlled automation enforce the author/merge boundary.

Owner involvement is limited to irreversible or destructive Production-data work, spending or paid commitments, and material legal, privacy, or security judgment. Pricing, external communications, family/vendor access, and other consequential but reversible scope changes remain agent-chain decisions requiring explicit PM scope, applicable specialist review, Development Head disposition, and Production Reviewer authorization where Production is affected; they do not create a routine owner-review step unless they cross one of the three owner gates.

Historical bootstrap record, non-executable: the one-time PR #25 exception is expired and may never be reused. It does not authorize any current merge or Production action.

CI failures are owned work. The PR owner must classify a failing required check in the same release-train cycle as fix now, superseded, or explicitly blocked. A draft PR may remain unmerged, but it may not accumulate an unexplained red required check.

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

Automated string and parity checks support this gate but never replace distinct UX review, Independent QA, Independent Agent Review, Development Head approval, or Production Review.

## Enforcement and evidence

PM puts the seven-question answers and PR/review disposition in the Sprint Brief. UX rewrites ambiguous or internal copy before Engineering starts. Engineering keeps internal values behind typed translation helpers and exposes human labels. QA records the rendered answers, denial/recovery behavior, and viewport evidence. Deploy verifies the exact approved commit and required checks. Development Head verifies merge readiness; the distinct Production Reviewer verifies the exact reversible Production candidate before promotion.

A violation is release-blocking for the affected slice. Production P0/P1 defects return through their own hotfix PR; Passage Zero defects return to PM without inflating readiness scores. Unknown or PARTIAL stays explicit.
