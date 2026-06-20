# Passage Rebuild — Progress & Pickup Guide

Last updated: 2026-06-20 (Cycle 5 role handoffs recorded; Cycle 0 normalization still pending). Keep this current at the end of every cycle.
Purpose: any agent can read this and know exactly where the calm-OS rebuild stands, how it is built, and how to continue. This is agent infrastructure — do not route progress bookkeeping to the owner.

## Read order for a fresh agent

1. AGENTS.md (rules)
2. docs/agent-operating-context.md (loop mandate + latest handoff)
3. docs/passage-end-state-vision.md (the end state every sprint converges on)
4. docs/sprint-01-calm-guided-os-rebuild.md (active sprint brief, salvage map, Cycle 0 normalization)
5. THIS FILE (what is shipped + what is next)
6. docs/cycle-5-app-migration-handoff.md (PM/UI/UX/Development handoff for the first real App.js migration slice)

## North star (one line)

One calm spine, every seat: families get a guided mobile experience; directors and employees get dense desktop operator surfaces; vendors and participants get scoped single-slice views — all rendered from one design system and one computed status model.

## Architecture (what to build on, do not reinvent)

- lib/designSystem.js — DS tokens (color/space/radius/tap/shadow/motion) + TYPE scale + SANS + the single-status model. Use deriveCalmStatus(task, { viewer, operatingStatus }) and present(key, { who, proof }). Status keys: yours_now, blocked, in_review, waiting, not_started, done. Built ON the salvaged operatingStatus model (lib/taskWorkspace operatingStatus / taskOperatingContractFor) — do not fork it.
- components/calm/CalmKit.js — reusable presentational components: AppShell, CalmStatusPill, ProgressLine, SectionLabel, HeroTask, TaskRow, TaskSheet. Pure (no data fetching). Public site + app surfaces migrate onto these. Polish lives here so every surface inherits it.
- components/calm/CalmControls.js — shared Button, Field, Input, Textarea, Select, Card, Banner on the same tokens. Use these instead of new bespoke controls in migrated surfaces.
- pages/preview/* — deployable, self-contained reference surfaces (sample data, noindex). These are the visual + behavioral target for migrating the real pages.

## Salvage boundary (from the brief)

KEEP: pages/api/* (~90 routes), lib/* business logic (taskActions, taskOrchestration, taskStatus, taskWorkspace, vendor*, funeralHome*, stripe*, hubspot), Supabase schema/RLS, auth, brand. REBUILD: every page surface + components/SiteChrome + the task-presentation model. No API contract or schema changes this sprint.

## Conventions

- Single-status rule: every task surface renders status via present()/deriveCalmStatus — never hand-set a label. UI must never contradict the spine.
- Mobile-first AND desktop-first-class: AppShell is the mobile/family/scoped posture; operator pages use a dense desktop layout with the SAME DS tokens + CalmStatusPill.
- Verify before push: every JS/JSX file is Babel-checked in-sandbox (preset-env + preset-react automatic runtime) before it goes up. Eventual gates: npm run agent:check, clean next build, Playwright desktop 1366x900 + mobile 390x844 + 360x640.
- Commits: all rebuild commits are [skip deploy]. Production deploy is the owner's single gate ([deploy] [qa-approved]).
- CI note: code/doc commits pushed from Cowork (single-file API) can trip scripts/check-agent-context.js because they do not touch a read-chain file (AGENTS.md / agent-operating-context.md / release-train.md) in the same commit. This is cosmetic on [skip deploy] commits. Workflow checkout has been bumped to actions/checkout@v5 in commit 994aed7. Cycle 0 still must run from a writable push-capable checkout to normalize line endings and touch docs/agent-operating-context.md in the same commit.

## 2026-06-20 Cycle 5 / App Migration Handoff

- Remote main verified: the calm-OS foundation docs and reference files are present on main: docs/passage-end-state-vision.md, docs/sprint-01-calm-guided-os-rebuild.md, docs/migration-plan.md, lib/designSystem.js, components/calm/CalmKit.js, components/calm/CalmControls.js, and preview routes.
- CI housekeeping completed through the GitHub connector: .github/workflows/agent-context.yml now uses actions/checkout@v5 in commit 994aed7 (`ci: bump agent checkout action [skip deploy]`).
- Full Cycle 0 is NOT complete. The active Codex workspace was read-only, stale/dirty, and missing the calm-OS docs locally, so it could not run `git add --renormalize .`, commit LF normalization, run build/checks, install/verify Playwright, or update docs/agent-operating-context.md safely.
- Dedicated role handoffs have now run and are recorded in docs/cycle-5-app-migration-handoff.md: PM (`Dewey`) COMPLETE for UI/UX, UI/UX (`Archimedes`) PASS for the App.js acceptance bar, Development (`Cicero`) BLOCKED from implementation until writable Cycle 0.
- The first real migration slice is defined: rebuild `components/App.js` into the family Today app + logged-out landing on CalmKit/CalmControls/status spine, preserve `/api`, Supabase, auth, checkout, task status/send APIs, and keep old App for one release as rollback.
- `pages/index.js` is a thin import of `components/App`, so the cutover seam is clean once the new App slice is green.
- The owner is not the restart mechanism or bottleneck. The next writable release-train agent should fetch current main, run Cycle 0, then begin Development implementation from docs/cycle-5-app-migration-handoff.md. Owner returns only for deploy/permission gates.
- The owner-staged patch `passage-direction-context-roadmap.patch` was not available in this Codex session or on main. A writable PM/Development agent should locate it from owner outputs if present; if unavailable after self-service search, classify it explicitly as `missing-context / superseded unless new roadmap doctrine is found` in docs/agent-operating-context.md before implementation begins.
- Latest product direction from owner: the next sprint is a complete product, website, task functionality, and mobile experience overhaul toward the best death-tech tool ever made, with the mantra/slogan: "The operating system for life's hardest logistics."

## How to continue (mechanics)

- Push/deploy-capable env (Codex release-train, has git push + Vercel): run `Passage Release Train: start the loop`. First fetch current main, then run Cycle 0 (`git add --renormalize . && git commit -m "chore: normalize line endings to LF [skip deploy]"`, touching docs/agent-operating-context.md in the same commit). Apply or explicitly classify the missing `passage-direction-context-roadmap.patch`.
- Then continue directly from docs/cycle-5-app-migration-handoff.md. Do not re-run PM discovery unless new source state contradicts the handoff. Development starts with the documented App.js file plan: preserve legacy App, add the family Today adapter/surface, render status through deriveCalmStatus()/present(), preserve backend contracts, and keep pages/index.js thin.
- Cowork env (single-file GitHub API, sandbox build/test, no push of repo-wide commits): keep shipping NEW files (components, preview routes, docs) verified via Babel. Avoid rewriting large existing files by hand (corruption risk) — that work belongs in the push-capable loop. Note: Cowork-style GitHub app tokens may not edit .github/workflows/* (403, missing `workflows` permission); this Codex GitHub connector already completed the checkout v5 bump.

## Shipped (commits on main)

- docs(pm) Sprint 1 brief + Cycle 0 runbook — c89ca4a, deff859
- docs(vision) end-state north star — 67ff1a4
- feat E1/E3 lib/designSystem.js (tokens + single-status) — 83cce51
- feat E2 components/calm/CalmKit.js (shell + task components) — 869a94b
- feat E2 pages/preview/calm-os.js (family mobile experience) — b768d1c
- feat Cycle 2 pages/preview/my-day.js (director desktop My Day) — 06b5e41
- feat Cycle 3 pages/preview/scoped.js (vendor + participant scoped) — 464c7f9
- docs(agents) rebuild progress + pickup guide — f4213e4
- refine Cycle 4 design tokens (type scale, motion, hairline) — 11d083d
- refine Cycle 4 sleekness pass on CalmKit — cefa32a
- feat Cycle 4 pages/preview/my-work.js (employee surface) — 001fc00
- ci Cycle 5 checkout v5 housekeeping — 994aed7
- docs Cycle 5 continuation gate — e44feec
- docs Cycle 5 App.js role handoff — c3af931

Preview routes (deployable, noindex): /preview/calm-os (family), /preview/my-day (director), /preview/scoped (vendor + participant), /preview/my-work (employee). Staged patch status: roadmap + context + AGENTS pointer edits were described as held in owner outputs as passage-direction-context-roadmap.patch, but that patch was not available in the read-only Cycle 5 Codex session and still needs to be located or classified during Cycle 0.

## Status by persona surface

- Family (mobile): reference shipped (/preview/calm-os). First real migration slice is scoped and ready for writable Development: components/App.js + pages/index.js cutover seam.
- Director (desktop): reference shipped (/preview/my-day). Next later: migrate pages/funeral-home/dashboard.js director view onto DS + CalmStatusPill.
- Employee (desktop/mobile): reference shipped (/preview/my-work). Next later: migrate the staff view of funeral-home/dashboard.js onto CalmKit.
- Vendor + participant (scoped): reference shipped (/preview/scoped). Next later: migrate pages/vendors/request.js + pages/participating.js scoped paths.
- Public site: first public landing touchpoint is included in the App.js slice. Remaining marketing pages not started.
- Reporting/dashboards: design pass after surfaces migrate; read from spine + proof.

## Next actions (Cycle 5 and beyond)

1. Writable Cycle 0: normalize LF line endings, touch docs/agent-operating-context.md, commit `[skip deploy]`, and apply or classify the missing passage-direction-context-roadmap.patch.
2. Record the Cycle 5 role handoffs from docs/cycle-5-app-migration-handoff.md into docs/agent-operating-context.md from the writable checkout.
3. Begin Development implementation of the first real migration slice:
   - copy `components/App.js` to `components/AppLegacy.js` for one-release rollback;
   - rebuild `components/App.js` as the calm entry wrapper;
   - add `components/family/FamilyTodayApp.js`;
   - add `components/family/familyTodayAdapter.js`;
   - add `components/family/FamilyTaskSheet.js` only if CalmKit TaskSheet cannot support review/save/send flows cleanly;
   - keep `pages/index.js` thin.
4. Validate the App.js slice against docs/migration-plan.md and docs/cycle-5-app-migration-handoff.md: single status via spine, 3-tap mobile, no internal vocabulary, designed empty/loading/error states, mobile scroll/tap/overflow at 390x844 + 360x640, zero hydration warnings, npm run agent:check, clean next build, and Playwright desktop/mobile green.
5. Keep all work `[skip deploy]` until the App.js slice is green. Owner-gated production deploy only with `[deploy] [qa-approved]`.
6. After App.js, return to PM for the next migration item: estate / participating / vendors / funeral-home dashboard, one verified slice at a time.

## Known polish items (owner feedback)

- Sleekness pass (Cycle 4, DONE for the kit): type scale + hairline borders + motion tokens added and applied in CalmKit so every surface inherits them. Keep refining density/motion as real surfaces migrate; treat sleekness as a standing UI/UX acceptance item, not a one-off page tweak.

## Definition of done

See docs/passage-end-state-vision.md §8. In short: every public + app surface rebuilt on the shared system, single status everywhere, all persona journeys green on seeded data, a11y AA, LCP < 2.5s mobile, agent:check + build + Playwright green, owner-gated release.
