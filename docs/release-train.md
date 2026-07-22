# Passage Zero release train

This is the App Router/Supabase release loop for Passage Zero. `AGENTS.md` controls permissions; `docs/product/operational-readiness-roadmap.md` controls priority; `docs/product/frontend-backend-contracts.json` controls frontend/backend parity; `docs/agent-operating-context.md` records the living handoff.

## Required loop

The role names are Product Manager, UX Review, Development Engineer, QA Agent, Deploy Agent, and Development Head / Release Authority. The installed `Dedicated Merge Review` control label is the exact-head GitHub check implementation for the Development Head role; it is not a founder/human review requirement. The train advances for a maximum of 3 correction cycles before escalation, and every Product Manager instance reads `docs/agents/product-manager.md`. Exact-head external checks remain authoritative after every source or documentation correction.

1. Product Manager writes the bounded Sprint Brief and classifies discovered work.
2. UX Review sets the responsive, accessible, truthful experience bar.
3. Engineering implements the reachable UI and its server/data/RLS/event/recovery contract together.
4. Independent QA verifies source, database authority, negative paths, browser behavior, and evidence.
5. Deploy verifies project, branch, environment scope, release marker, deployment, logs, and post-deploy behavior.
6. A distinct Independent QA instance reviews the exact head and the `Passage QA Reviewer` App records `Passage QA / independent-qa`. Candidate-controlled CI never substitutes for this check.
7. A distinct Development Head / Release Authority instance challenges the exact head and the `Passage Release Reviewer` App records `Passage Review Agent / merge-review`. It never authors, edits, merges, or deploys.
8. Production separately requires `Passage Production Review / release-readiness` from the distinct Production Review App plus any applicable owner authorization through the protected Production environment for the exact release commit.
9. PM scopes the next highest-leverage slice immediately after Deploy PASS/PARTIAL.

No role may promote its own work to QA or review PASS. Role separation, a PR-body statement, or a same-name check from another source cannot substitute for the expected-App exact-head checks. Role instance, received handoff, decision, evidence, failures, next target, PR/packet, QA/review check state, Production-review state, and true owner-gate state belong in the operating context.

## Branch, PR, and collision control

- Agents and schedules never push directly to `main`; every change enters through a named branch and pull request.
- Agent and scheduled work is authored only through the dedicated Passage Release Bot identity. Automation must never use the owner's GitHub User credentials.
- PR #24 is the Passage Zero integration umbrella, not an indivisible review unit. Large work is split into stacked PRs or named review packets with exact dependencies, contract rows, migrations, recovery, tests, and evidence.
- Overlapping greenfield PRs are dispositioned before merge: incorporate unique bounded work, or label and close them as superseded. They never merge independently without reconciliation.
- A failing required check is classified in the same cycle as fix now, superseded, or explicitly blocked. Red checks do not age silently because a PR is draft.
- Production release automation is serialized with a single repository/environment lock. Concurrent schedules may prepare separate branches but may not race a merge, alias, or Production deployment.
- Repository protections require passing current-head trusted/candidate checks, expected-source Independent QA and Development Head / Release Authority checks, resolved conversations, strict up-to-date state, restricted bypass, and no force-push or deletion of `main`. Production separately requires the exact-commit Production Review check plus any applicable owner gate.

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

Passage Zero builds only from the canonical Vercel project and exact approved branch. Preview environment variables must be branch-scoped; isolated Supabase migrations must use migration tooling; Production values and project `qsveqfchwylsbncsfgxe` are forbidden unless a later owner-approved production release explicitly names them.

Use `[skip deploy]` while integrating source and evidence. Use `[deploy] [qa-approved]` only after independent QA PASS. A separately documented verification-preview exception may be used once for hosted evidence when `AGENTS.md` and the operating context authorize it; remove the exception afterward.

## QA minimum

- independent browser storage contexts for cross-persona flows;
- wrong-user, wrong-role, wrong-organization, wrong-location, unassigned, replay, stale-session, and revoked-access denial as applicable;
- exact durable row/event cardinality and no partial writes;
- reload/reconnect truth;
- TypeScript, optimized build, parity, deploy-gate, Supabase advisors, and SQL/RLS tests;
- 1440, 390, and 360 with no overflow, hydration/console errors, inaccessible focus, or undersized enabled targets;
- 1440, 390, and 360 comprehension proof: the page purpose, primary action, result, visibility, saved proof, and failure recovery are unambiguous without training or architecture knowledge;
- timestamped screenshots and redacted database/audit evidence.

Production hydration errors are a P1 release condition. The known shared failure on `/pricing`, `/resources`, `/guides`, `/care-providers`, `/trust`, and `/mission` belongs to one separately reviewed Threshold/main hotfix PR and must pass all six routes before closure; it does not advance Passage Zero readiness.
