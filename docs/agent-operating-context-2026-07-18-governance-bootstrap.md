# Dedicated-agent governance handoff — 2026-07-19

## Owner decision and scope

The owner approved a dedicated-agent release model. Merge review is no longer a founder dependency and no agent may impersonate the founder. The governance bootstrap remains product-, runtime-, database-, Preview-, and Production-neutral.

Three responsibilities are separate:

- Author: `Passage Release Bot` creates non-protected branches, commits, and pull requests.
- Merge review: `Passage Release Reviewer` reads the exact candidate and writes only `Passage Review Agent / merge-review` Check Runs.
- Production review: a separately installed production-review identity must write `Passage Production Review / release-readiness`; it may not deploy. Any true owner gate in `AGENTS.md` remains separate.

## Installed identity evidence

Author App:

- Slug: `passage-release-bot`
- App ID: `4336683`
- Installation ID: `147538305`
- Login: `passage-release-bot[bot]`
- Repository selection: only `thepassageappio/thepassageappio`
- Persistent permissions: metadata read, contents write, pull requests write
- Checks, merge bypass, administration, deployments, environments, secrets, variables, and organization access: none

Merge Review App:

- Slug: `passage-release-reviewer`
- App ID: `4340300`
- Installation ID: `147645985`
- Repository selection: only `thepassageappio/thepassageappio`
- Permissions: metadata read, contents read, pull requests read, checks write
- Contents write, pull-request write, merge, Actions/workflow write, deployments, environments, secrets, variables, and administration: none
- Required check: `Passage Review Agent / merge-review`

Independent QA App:

- Slug: `passage-qa-reviewer`
- App ID: `4340450`
- Installation ID: `147650693`
- Repository selection: only `thepassageappio/thepassageappio`
- Permissions: metadata read, contents read, pull requests read, checks write
- Contents write, pull-request write, merge, Actions/workflow write, deployments, environments, secrets, variables, and administration: none
- Required check: `Passage QA / independent-qa`

Production Review App:

- Slug: `passage-production-reviewer`
- App ID: `4340400`
- Installation ID: `147649311`
- Repository selection: only `thepassageappio/thepassageappio`
- Permissions: metadata read, contents read, pull requests read, checks write
- Contents write, pull-request write, merge, Actions/workflow write, deployments, environments, secrets, variables, and administration: none
- Required release check: `Passage Production Review / release-readiness`

Each App has a distinct private key held outside the repository and product configuration. No key, JWT, or installation token is printed, committed, added to PR text, or exposed to candidate-controlled workflows. An unused Review App key created during setup was revoked immediately; one current key remains.

## PR #26 disposition

PR #26 is the governance-only bootstrap and is authored by `passage-release-bot[bot]`. Former head `0070083d23eacc90f9ba5e00be5e12db9b92acab` is superseded because it encoded founder merge review. The corrected head must remain draft until exact-head independent QA and the Review App check pass.

PR #25 is expired, unmerged, and superseded. PR #24 remains the Passage Zero umbrella and is not authorized to merge or deploy by this bootstrap.

The PR body is informational. It cannot claim merge-review PASS. GitHub required checks are authoritative and bind results to the exact head SHA. A new commit makes the prior Review App result irrelevant.

## Trusted and candidate boundaries

- `pull_request_target` checks out only the exact trusted base commit, persists no credentials, and runs no candidate code.
- Candidate checks use read-only repository permission, an exact candidate or merge-group SHA, and no App key.
- The Author App cannot create the merge-review check.
- The Review App cannot edit, merge, or deploy the candidate.
- The Review App key is never stored in GitHub Actions or any candidate-controlled location.
- No Reviews API enumeration, GitHub `User` inference, PR-body checkbox, or founder review is accepted as identity proof.

## Role handoff

- Product Manager: `/root/pm_governance_consolidation`; dedicated Author, Merge Review, and Production Review separation approved.
- UX Review: N/A; no public or persona surface changes.
- Governance Engineering: corrected PR #26 contracts, transition checks, machine-readable identity record, and adversarial fixtures.
- Independent QA: exact corrected head required before ready state.
- Dedicated Merge Reviewer: exact corrected head required through App `passage-release-reviewer`.
- Deploy Governance: `[skip deploy]`; no Vercel or Supabase action authorized.

## Live-control sequence

1. Keep the Bot-authored governance bootstrap PR draft while source checks run. PR #26 is superseded if GitHub does not bind its live head to the Bot branch; never reopen it.
2. Run independent QA on the exact head.
3. Have the distinct Review Agent inspect the exact base/head and emit `Passage Review Agent / merge-review` from App `passage-release-reviewer`.
4. Pin the required check to the expected App source, retain no-bypass/no-force-push/no-delete/up-to-date/conversation rules, and remove the superseded founder approval requirement.
5. Merge only through GitHub after every required current-head check passes.
6. Verify trusted governance from `main`, then run a harmless Bot-authored validation PR before relying on the new check set.
7. Prove the separate Production Review App before any Production release; its PASS never deploys and never replaces an applicable owner gate.

No Vercel or Supabase deployment is authorized. Cycle 8 remains FAIL/PARTIAL and its local application and migration files remain untouched.
