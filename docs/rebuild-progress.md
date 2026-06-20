# Passage Rebuild — Progress & Pickup Guide

Last updated: 2026-06-20 (through Cycle 4). Keep this current at the end of every cycle.
Purpose: any agent can read this and know exactly where the calm-OS rebuild stands, how it is built, and how to continue. This is agent infrastructure — do not route progress bookkeeping to the owner.

## Read order for a fresh agent

1. AGENTS.md (rules)
2. docs/agent-operating-context.md (loop mandate + latest handoff)
3. docs/passage-end-state-vision.md (the end state every sprint converges on)
4. docs/sprint-01-calm-guided-os-rebuild.md (active sprint brief, salvage map, Cycle 0 normalization)
5. THIS FILE (what is shipped + what is next)

## North star (one line)

One calm spine, every seat: families get a guided mobile experience; directors and employees get dense desktop operator surfaces; vendors and participants get scoped single-slice views — all rendered from one design system and one computed status model.

## Architecture (what to build on, do not reinvent)

- lib/designSystem.js — DS tokens (color/space/radius/tap/shadow/motion) + TYPE scale + SANS + the single-status model. Use deriveCalmStatus(task, { viewer, operatingStatus }) and present(key, { who, proof }). Status keys: yours_now, blocked, in_review, waiting, not_started, done. Built ON the salvaged operatingStatus model (lib/taskWorkspace operatingStatus / taskOperatingContractFor) — do not fork it.
- components/calm/CalmKit.js — reusable presentational components: AppShell, CalmStatusPill, ProgressLine, SectionLabel, HeroTask, TaskRow, TaskSheet. Pure (no data fetching). Public site + app surfaces migrate onto these. Polish lives here so every surface inherits it.
- pages/preview/* — deployable, self-contained reference surfaces (sample data, noindex). These are the visual + behavioral target for migrating the real pages.

## Salvage boundary (from the brief)

KEEP: pages/api/* (~90 routes), lib/* business logic (taskActions, taskOrchestration, taskStatus, taskWorkspace, vendor*, funeralHome*, stripe*, hubspot), Supabase schema/RLS, auth, brand. REBUILD: every page surface + components/SiteChrome + the task-presentation model. No API contract or schema changes this sprint.

## Conventions

- Single-status rule: every task surface renders status via present()/deriveCalmStatus — never hand-set a label. UI must never contradict the spine.
- Mobile-first AND desktop-first-class: AppShell is the mobile/family/scoped posture; operator pages use a dense desktop layout with the SAME DS tokens + CalmStatusPill.
- Verify before push: every JS/JSX file is Babel-checked in-sandbox (preset-env + preset-react automatic runtime) before it goes up. Eventual gates: npm run agent:check, clean next build, Playwright desktop 1366x900 + mobile 390x844 + 360x640.
- Commits: all rebuild commits are [skip deploy]. Production deploy is the owner's single gate ([deploy] [qa-approved]).
- CI note: code/doc commits pushed from Cowork (single-file API) trip scripts/check-agent-context.js because they do not touch a read-chain file (AGENTS.md / agent-operating-context.md / release-train.md) in the same commit. This is cosmetic on [skip deploy] commits. Cycle 0 (line-ending normalization, which touches the context file) clears it. The push/deploy-capable release-train loop (Codex env) should run Cycle 0 first.

## How to continue (mechanics)

- Push/deploy-capable env (Codex release-train, has git push + Vercel): run `Passage Release Train: start the loop`. Do Cycle 0 first (`git add --renormalize . && git commit -m "chore: normalize line endings to LF [skip deploy]"`, touch docs/agent-operating-context.md in the same commit), then migrate real pages onto CalmKit and run full build + Playwright before any owner-gated deploy.
- Cowork env (single-file GitHub API, sandbox build/test, no push of repo-wide commits): keep shipping NEW files (components, preview routes, docs) verified via Babel. Avoid rewriting large existing files by hand (corruption risk) — that work belongs in the push-capable loop. Note: the Cowork GitHub App token cannot edit .github/workflows/* (403, missing `workflows` permission).

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

Preview routes (deployable, noindex): /preview/calm-os (family), /preview/my-day (director), /preview/scoped (vendor + participant), /preview/my-work (employee). Staged (not yet on main): roadmap + context + AGENTS pointer edits — applied by the loop in Cycle 0 (patch held in the owner's outputs as passage-direction-context-roadmap.patch).

## Status by persona surface

- Family (mobile): reference shipped (/preview/calm-os). Next: migrate real pages/index.js + pages/estate.js + pages/participating.js onto CalmKit.
- Director (desktop): reference shipped (/preview/my-day). Next: migrate pages/funeral-home/dashboard.js director view onto DS + CalmStatusPill.
- Employee (desktop/mobile): reference shipped (/preview/my-work). Next: migrate the staff view of funeral-home/dashboard.js onto CalmKit.
- Vendor + participant (scoped): reference shipped (/preview/scoped). Next: migrate pages/vendors/request.js + pages/participating.js scoped paths.
- Public site: not started. Rebuild pages/index.js + marketing pages on AppShell/DS; keep publicSurfaceReadiness clean.
- Reporting/dashboards: design pass after surfaces migrate; read from spine + proof.

## Next actions (Cycle 5 and beyond)

1. CI housekeeping (push-capable env only): bump .github/workflows/agent-context.yml actions/checkout@v4 -> v5 (Node 20 deprecation). The Cowork GitHub App token cannot edit workflow files (403, missing `workflows` permission).
2. Begin REAL migration: in the push-capable loop, rebuild pages/index.js (public home) on AppShell/DS as the first production surface, behind a clean build + Playwright.
3. Migrate estate / participating / vendors / funeral-home dashboard surfaces onto CalmKit, one verified slice each, [skip deploy] until a coherent slice is green.
4. Reporting + dashboards pass per persona from spine + proof.
5. Owner-gated production deploy of the first coherent slice.

## Known polish items (owner feedback)

- Sleekness pass (Cycle 4, DONE for the kit): type scale + hairline borders + motion tokens added and applied in CalmKit so every surface inherits them. Keep refining density/motion as real surfaces migrate; treat sleekness as a standing UI/UX acceptance item, not a one-off page tweak.

## Definition of done

See docs/passage-end-state-vision.md §8. In short: every public + app surface rebuilt on the shared system, single status everywhere, all persona journeys green on seeded data, a11y AA, LCP < 2.5s mobile, agent:check + build + Playwright green, owner-gated release.
