# Agent Operating Context — Addendum, 2026-07-13 (Run 8)

This is a dated addendum to `docs/agent-operating-context.md`, per the established pattern (the canonical file is too large to safely read-and-rewrite each run). Read the canonical file first, then this addendum for what changed today.

## What shipped this run

Batch 8 of the Threshold re-skin (Tier 1, family/core-auth section): `pages/planning.js`, `pages/packet.js`, `pages/contact.js`, `pages/faq.js`. All four are presentation-only re-skins onto Threshold tokens — state, effects, handlers, and API contracts preserved byte-identical. `pages/today.js` was deliberately excluded (see below). QA-branch build reached `READY` on Vercel on the first attempt for all four pages before this release.

## GitHub Actions "Agent release train guard" fix (owner-reported, explicit "fix it" direction)

The owner reported seeing repeated GitHub Actions failures — "several github failures all train guard agent release failures" — and asked directly why and to fix it.

**Root cause:** `.github/workflows/agent-context.yml` runs `scripts/check-agent-context.js` on every push to `main`. That script fails the build unless either (a) the commit message contains `[skip deploy]`, or (b) the commit's diff touches one of four exact-named files: `docs/agent-operating-context.md`, `AGENTS.md`, `docs/release-train.md`, or `docs/rebuild-progress.md`. Since run 2, the team's actual sanctioned practice for documenting handoffs has been to write a dated addendum (`docs/agent-operating-context-YYYY-MM-DD-runN.md`) instead of rewriting the oversized canonical file — but the script was never updated to recognize that pattern. Combined with the established habit of shipping the release commit (pages only, tagged `[deploy][qa-approved]`, not skip-deploy) and the docs/tracker update as a *separate* follow-up commit, every real release commit from runs 3 through 7 — including the confirm.js hotfix — failed this check and triggered a failure notification to the owner. This had been silently accumulating across every run; it was previously flagged internally as "deliberately left unchanged pending explicit owner direction," which has now been given.

**Fix (commit `ab025406352c9977ac527a76b2b417f24c022004`, tagged `[skip deploy]` since it only touches `scripts/`, which is itself in the script's own ignore-list):** widened `contextTouched` in `scripts/check-agent-context.js` to also accept any `docs/agent-operating-context-*.md` dated addendum, and `docs/redesign/12-threshold-rollout-tracker.md` (the actual status source of truth for this work).

**What this does and does not do:** it stops future release commits from failing when they touch the addendum/tracker in the same commit. It does not retroactively clear the failed check runs already recorded on the historical release commits (`77afae6...`, `358fd0a...`, `0ab27a9c...`, `815ad94...`) — those already ran and failed; GitHub does not re-run completed checks. The owner should expect no new failures/emails from this workflow on future `[deploy][qa-approved]` commits, provided the addendum/tracker touch lands in the same commit as the release.

## Execution mistake this run — the fix's benefit was not actually realized for batch 8

The plan was to land all six batch-8 files (four pages + this addendum + the tracker update) in one combined `push_files` call, so the release commit itself would satisfy the widened `contextTouched` check without depending on a follow-up commit. In execution, two consecutive `push_files` calls each omitted files that should have been included, so batch 8 landed as three separate commits instead of one:

- `586031920627b125a7b7c8faecae44753e464f95` — `pages/planning.js` only
- `5ddb597537a187954179abf60de1fdfbaa370127` — `pages/packet.js`, `pages/contact.js`, `pages/faq.js`
- (this commit) — tracker + this addendum, `[skip deploy]`

The first two commits are tagged `[deploy][qa-approved]` and do not touch any context file in their own diff, so each will independently fail the "Agent release train guard" check when it runs against them — the same failure mode the fix was meant to prevent, just caused by my own tool-call error rather than a flaw in the fix. The fix itself is correctly implemented and verified by inspection; it simply wasn't exercised correctly this run. Future release commits should double-check that the `files` array in `push_files` includes every intended file before sending, especially when the goal is specifically to bundle a release with its context-doc touch.

## pages/today.js — deliberately not batched

`pages/today.js` is a thin wrapper around `components/AppCalm.js`, which routes between `LegacyApp`, `components/family/FamilyTodayApp.js`, and `Landing`, and imports the shared `lib/designSystem` tokens plus `components/calm/CalmControls`/`CalmKit`. This is the same shared-design-system risk already flagged for `pages/funeral-home/index.js` in run 6 — re-skinning it naively risks bleeding into every other consumer of those shared modules. Needs its own PM-scoped slice, not a blind batch inclusion. Recorded in the tracker.

## Deploy budget note

Today's self-imposed deploy budget (max 4 production release commits/day) was already exhausted by run 7's four commits before this run started. The owner explicitly authorized shipping batch 8 anyway ("ship it") when asked whether to hold or override. This run's release used two additional deploy-tagged commits (unintentionally split, see above) plus the skip-deploy docs commit.

## Next action for a future run

Continue down Tier 1: the marketing/public pages (`mission.js`, `story.js`, `trust.js`, `privacy.js`, `terms.js`, `resources.js`, `guides.js`, `pricing.js`, `care-providers.js`, `assisted-living.js`, `hospice.js`) are next and have no data-layer risk. `pages/today.js`/`AppCalm.js` and `pages/funeral-home/index.js` still need their own dedicated PM-scoped slices due to shared-chrome/shared-design-system risk — not blocking, just not blindly batchable. `components/vendor/VendorRequestApp.js` and `components/participant/ParticipantApp.js` still need to be added as their own tracker line items (read/size first).
