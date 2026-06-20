# Passage Rebuild — Progress & Pickup Guide

Last updated: 2026-06-20 (Cycle 5 App slice implemented remotely; Cycle 0/build/Playwright still pending). Keep this current at the end of every cycle.
Purpose: any agent can read this and know exactly where the calm-OS rebuild stands, how it is built, and how to continue. This is agent infrastructure — do not route progress bookkeeping to the owner.

## Read order for a fresh agent

1. AGENTS.md (rules)
2. docs/agent-operating-context.md (loop mandate + latest handoff)
3. docs/passage-end-state-vision.md (the end state every sprint converges on)
4. docs/sprint-01-calm-guided-os-rebuild.md (active sprint brief, salvage map, Cycle 0 normalization)
5. THIS FILE (what is shipped + what is next)
6. docs/cycle-5-app-migration-handoff.md (PM/UI/UX/Development/QA handoff for the first real App slice)

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
- CI note: code/doc commits pushed from a single-file API can trip scripts/check-agent-context.js because they do not touch a read-chain file (AGENTS.md / agent-operating-context.md / release-train.md) in the same commit. This is expected noise on these [skip deploy] commits. Cycle 0 still must run from a writable push-capable checkout to normalize line endings and touch docs/agent-operating-context.md in the same commit.

## 2026-06-20 Cycle 5 / App Slice Implementation

Remote main verified: the calm-OS foundation docs and reference files are present on main. CI housekeeping completed: `.github/workflows/agent-context.yml` now uses `actions/checkout@v5` in commit `994aed7`.

Full Cycle 0 is NOT complete. The active Codex workspace was read-only/stale, so it could not run repo-wide LF normalization, local build, or Playwright. That is not an owner gate. The train moved forward through the available GitHub write path.

Dedicated role handoffs are recorded in docs/cycle-5-app-migration-handoff.md:

- PM (`Dewey`) COMPLETE for the first App slice.
- UI/UX (`Archimedes`) PASS for the App acceptance bar.
- Development remote implementation completed through GitHub commits.
- QA is READY for source/build/browser validation, but NOT deploy approval.

Implemented remote source slice:

- `components/AppCalm.js`: new calm app entry with logged-out landing, session handling, Google sign-in, magic-link email, legacy fallback, and signed-in routing to Family Today.
- `components/family/familyTodayAdapter.js`: maps existing workflow/task rows through `taskOperatingContractFor()` underneath and `deriveCalmStatus()` on top; produces CalmKit view models for `Start here`, `When you're ready`, `Waiting on others`, and `Proof saved`.
- `components/family/FamilyTodayApp.js`: signed-in family Today surface using `/api/myEstates`, Supabase `workflows` fallback, Supabase `tasks`, CalmKit AppShell/HeroTask/TaskRow/ProgressLine, and `/api/tasks/:id/status` saves.
- `components/family/FamilyTaskSheet.js`: review/save sheet with `CalmStatusPill`, `Passage prepared`, `Nothing sends without your review`, private note, status choices, and save-to-family-record action.
- `pages/index.js`: thin route seam now imports `AppCalm`.

Implementation commits:

- `e921925` family Today adapter
- `5bad282` family task sheet
- `f542449` family Today app
- `f7336ea` calm App entry
- `ab38681` home route to calm app slice
- `4b2a2df` responsive landing grid fix
- `fe10cde` email form accessibility cleanup
- `de85e51` cycle handoff doc update

Rollback:

- Old `components/App.js` was not modified.
- `/?legacy=1` renders the old App.
- Full rollback is a one-line `pages/index.js` import change back to `../components/App`.

Still pending:

- Cycle 0 LF normalization from a writable checkout.
- Record this cycle into `docs/agent-operating-context.md` from a writable checkout.
- Locate or classify `passage-direction-context-roadmap.patch` as `missing-context / superseded unless new roadmap doctrine is found`.
- Run `git diff --check`, `npm run agent:check`, `npm run build`, and Playwright desktop/mobile.
- Browser QA for logged-out `/`, `/?legacy=1`, Google/auth entry, signed-in Family Today, empty/loading/error/no-next-action states, task sheet open/close, and `/api/tasks/:id/status` save.

## How to continue (mechanics)

- Push/deploy-capable env: fetch current main, run Cycle 0 (`git add --renormalize . && git commit -m "chore: normalize line endings to LF [skip deploy]"`, touching docs/agent-operating-context.md in the same commit), then QA/build this App slice.
- Do not re-run PM discovery unless source state contradicts docs/cycle-5-app-migration-handoff.md. The next useful role is QA/build validation. If QA fails, return to PM with the exact defects.
- Keep all work `[skip deploy]` until the App slice is green. Production deploy remains owner-gated with `[deploy] [qa-approved]`.

## Shipped / Preserved On Main

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
- feat Cycle 5 remote App source slice — e921925, 5bad282, f542449, f7336ea, ab38681, 4b2a2df, fe10cde

Preview routes (deployable, noindex): /preview/calm-os (family), /preview/my-day (director), /preview/scoped (vendor + participant), /preview/my-work (employee).

## Status by persona surface

- Family (mobile): reference shipped (/preview/calm-os). First real migration source slice now exists on `/` via `AppCalm`, pending build/browser QA.
- Director (desktop): reference shipped (/preview/my-day). Next later: migrate pages/funeral-home/dashboard.js director view onto DS + CalmStatusPill.
- Employee (desktop/mobile): reference shipped (/preview/my-work). Next later: migrate the staff view of funeral-home/dashboard.js onto CalmKit.
- Vendor + participant (scoped): reference shipped (/preview/scoped). Next later: migrate pages/vendors/request.js + pages/participating.js scoped paths.
- Public site: first public landing touchpoint is included in the AppCalm slice. Remaining marketing pages not started.
- Reporting/dashboards: design pass after surfaces migrate; read from spine + proof.

## Next Actions

1. Writable Cycle 0: normalize LF line endings, touch docs/agent-operating-context.md, commit `[skip deploy]`, and apply or classify the missing patch.
2. QA/build the AppCalm slice:
   - `git diff --check`
   - `npm run agent:check`
   - `npm run build`
   - install Chromium with `npx playwright install chromium` if missing
   - Playwright desktop `1366x900`, mobile `390x844`, mobile `360x640`
3. Verify user-facing behavior:
   - `/` logged out
   - `/?legacy=1` fallback
   - Google/auth entry
   - signed-in Family Today
   - empty/loading/error/no-next-action states
   - task sheet open/close
   - save status/proof through `/api/tasks/:id/status`
   - zero hydration warnings and no horizontal overflow
4. If QA passes, keep `[skip deploy]` until a coherent owner-gated release candidate is approved. If QA fails, return to PM before more development.
5. After App slice is green, return to PM for the next migration item: estate / participating / vendors / funeral-home dashboard, one verified slice at a time.

## Known polish items (owner feedback)

- Sleekness pass (Cycle 4, DONE for the kit): type scale + hairline borders + motion tokens added and applied in CalmKit so every surface inherits them. Keep refining density/motion as real surfaces migrate; treat sleekness as a standing UI/UX acceptance item, not a one-off page tweak.

## Definition of done

See docs/passage-end-state-vision.md §8. In short: every public + app surface rebuilt on the shared system, single status everywhere, all persona journeys green on seeded data, a11y AA, LCP < 2.5s mobile, agent:check + build + Playwright green, owner-gated release.
