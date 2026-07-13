# Funeral-Home Director/Employee Polish — Scoping Note (2026-07-12, run 2)

Written during the "resume and ship Threshold" scheduled run, as the Product Manager re-scope for the funeral-home persona-priority item in that task. This is a PM Sprint Brief for the next dedicated engineering session, not a completed rewrite — see rationale below.

## What exists today (verified this run)
- `pages/funeral-home/dashboard.js` — **449KB**, the live director/staff console. This is the file AGENTS.md's own "current-state read" already flags: UI that "grew by accretion into per-persona monoliths."
- `pages/funeral-home/index.js` — the B2B marketing page (not the console), already redesigned onto the calm design system (`lib/designSystem`), unrelated to this item.
- `pages/funeral-home/{cases,staff,setup,summary,sample-case,workspace-demo,login,pilot-proof}.js` — supporting operator pages, sizes ranging 5.5KB–17KB, not yet individually audited this run.
- Two organizations exist in the live database: "Passage QA Funeral Home" and "Willow Creek Funeral Home" (both appear to be test/pilot orgs, not confirmed production-paying customers) with 5 workflows and 37 tasks total across them.

## Why this run did not attempt a full rewrite of dashboard.js
A blind rewrite of a 449KB file that's live and RLS-connected to real database rows, with no test suite found in the repo, no ability to run a real browser-QA pass against a deployed preview in this non-interactive session, and no staging Supabase project (one production project only) is exactly the kind of change AGENTS.md's own deploy discipline exists to prevent ("if QA fails... anything looks broken, DO NOT force it"). Rewriting UI at this scale needs the full release-train loop (PM → UI/UX → Dev → QA → Deploy) across its own dedicated sprint, matching Sprint 2/3 in `07-sprint-plan.md` — not a single autonomous pass bolted onto a docs/mockup batch and a demo-seed script.

## Concrete punch list for the next Development Engineer session
Grounded in the Persona Priorities in AGENTS.md and the Threshold visual-craft standard (`08-visual-craft-standard.md`):

1. **Split the monolith.** Extract `dashboard.js` into: a director-scope shell (case list, stat row, staff load, reporting entry), a per-case operator console (Today/Tasks/People/Documents — matching the A2/A3 wireframes in `04-wireframes-annotated.md`), and a staff-scope variant that hides org-wide reporting/settings per AGENTS.md's employee persona priority ("assigned client work only... no admin noise").
2. **Apply Threshold tokens.** The console currently runs on the pre-Threshold styling; re-skin onto the `--pine/--clay/--bone` token set and the `.op-shell/.op-nav/.op-main` pattern already proven out in `funeral-home-demo-path-mockups.html` and `remaining-screens-mockups.html` (this run), so the shipped console matches the approved mockups instead of drifting from them.
3. **Wire the reporting view.** `remaining-screens-mockups.html` Screen 3 (this run) has no live equivalent yet — `pages/funeral-home/summary.js` (7.7KB) is the closest existing page and should be evaluated as the implementation target or replacement.
4. **Mobile pass.** Per AGENTS.md's dual-viewport rule, every one of the above needs desktop (>=1366) and mobile (390/360) QA in the same slice — zero horizontal overflow, tap targets >= DS.tap.min.
5. **Ground every status label in real data.** Use the real `tasks.status`/`workflows.status` values (confirmed this run: free-text columns, not Postgres enums — audit actual distinct values in use via `select distinct status from tasks` / `workflows` before finalizing the viewer-relative status mapping) rather than assuming the placeholder vocabulary used in mockups.

## Recommendation
Treat this as its own release-train cycle (PM brief above → dedicated UI/UX review against the mockups already shipped → Development Engineer implementation in reviewable batches → QA at both viewports → deploy). Do not attempt it inside a single unattended run — the blast radius (live director console, real org data) is too high for a rewrite with no interactive QA checkpoint.
