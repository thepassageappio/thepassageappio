# Passage release governance and plain-language policy

Status: owner-approved operating policy, 2026-07-18.

This policy prevents initiative drift, self-approval, direct-main collisions, oversized unreviewable releases, and persona-facing copy that exposes internal implementation language. `AGENTS.md` controls permissions, `docs/release-train.md` controls the role loop, and `docs/product/operational-readiness-roadmap.md` remains the only roadmap.

## One product lane

- Passage Zero on `greenfield/passage-zero`, integrated through draft PR #24, is the sole target architecture and redesign implementation.
- Threshold on `main` is maintenance-only. Only separately scoped live P0/P1 defect, security, or availability work may enter that lane. A Threshold hotfix is never counted as Passage Zero progress.
- Production hydration failures on `/pricing`, `/resources`, `/guides`, `/care-providers`, `/trust`, and `/mission` are a P1 production-maintenance incident until one reviewed hotfix proves the shared cause corrected across every affected route.
- Historical roadmaps and backlogs are evidence only. They must carry an explicit superseded/archive notice or point to the canonical operational-readiness roadmap; they must never compete with it.

## Repository and review controls

Agents and schedules never push directly to `main` and never operate through the owner's GitHub User identity. Four repository-scoped GitHub Apps separate authority:

1. `passage-release-bot` authors branches, commits, and pull requests; it cannot write checks, merge, deploy, administer, or bypass rules.
2. `passage-qa-reviewer` reads the exact candidate and writes only `Passage QA / independent-qa`; it cannot edit, merge, or deploy.
3. `passage-release-reviewer` reads the exact candidate and writes only `Passage Review Agent / merge-review`; it cannot edit, merge, or deploy.
4. `passage-production-reviewer` reads the exact release evidence and writes only `Passage Production Review / release-readiness`; it cannot deploy.

The App IDs, installations, required contexts, and least-privilege contract are recorded in `.github/passage-review-identities.json` and verified by the trusted checker. Live rules additionally pin each required context to its expected App source. A new head commit invalidates prior QA and review results. PR bodies, native human reviews, GitHub `User` type, review enumeration, and same-name checks from another source are never identity proof.

Distinct PM, UX, Engineering, Independent QA, Development Head / Release Authority, Deploy, and Production Review roles remain mandatory. The installed `Dedicated Merge Review` label is the Release Reviewer App control for the Development Head role. A role recuses if it authored or materially edited the candidate it must judge. Candidate-controlled workflows are deterministic CI only. Development Head PASS never means Production Review PASS, and neither authorizes deployment. There is no routine founder/human code-review gate.

Branch protection requires a pull request, exact-current-head required checks, strict up-to-date state, resolved conversations, no App/agent bypass, no force push, no deletion, and serialized merge/release work. Merge queue remains disabled until every external App can re-attest the merge-group SHA.

True owner gates are limited to the explicit `AGENTS.md` permission list. Production promotion retains applicable owner authorization through the protected environment, separate from the Production Review App check.

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

Automated string and parity checks support this gate but never replace distinct UX review, expected-source Independent QA, Dedicated Merge Review, Production Review, or an applicable owner Production gate.

## Enforcement and evidence

PM puts the seven-question answers and PR/review disposition in the Sprint Brief. UX rewrites ambiguous or internal copy before Engineering starts. Engineering keeps internal values behind typed translation helpers and exposes human labels. Independent QA records the rendered answers, denial/recovery behavior, and viewport evidence. Deploy verifies the exact approved commit, expected-source QA and Merge Review checks, Production Review, and any applicable protected-environment owner gate before Production promotion.

A violation is release-blocking for the affected slice. Production P0/P1 defects return through their own hotfix PR; Passage Zero defects return to PM without inflating readiness scores. Unknown or PARTIAL stays explicit.
