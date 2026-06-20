# Passage Rebuild — Migration Plan (strangler-fig scope for the loop)

Last updated: 2026-06-20. Companion to docs/rebuild-progress.md, docs/sprint-01-calm-guided-os-rebuild.md, docs/passage-end-state-vision.md.

## Strategy: strangler-fig, route by route

Do NOT big-bang rewrite. Stand up new surfaces on the design system (lib/designSystem) + CalmKit + CalmControls, keep the old app live, migrate one route at a time, and cut over only after that route passes build + Playwright. Old files stay until their replacement is green (instant rollback = repoint the route back).

Cutover mechanic per route: build the new surface as a component/route, prove it, then repoint the thin page (e.g., pages/index.js is 5 lines) or swap the imported component. Keep the old component in the repo one release for rollback, then remove.

## Division of labor (best practice for this repo)

- Cowork track (single-file GitHub API, sandbox Babel verify; NEW files only, no giant-file edits): the CalmKit/CalmControls library, reference preview surfaces, and the SMALL public pages (<= ~300 lines) rebuilt as new files. Safe, reliable, Babel-verified.
- Loop track (Codex release-train: git push + full next build + Playwright + Vercel deploy): the LARGE existing app surfaces (1k-6k lines). Only the loop can safely edit these and prove them. Run Cycle 0 (LF normalization) first.

## Backlog (ordered; size = current lines)

### Loop track — large app surfaces (build + Playwright + owner-gated deploy)
1. components/App.js (5127) — family app + logged-out landing. Highest leverage. Strangler: build new family "Today" + task flow on CalmKit wired to existing /api/myEstates + task APIs; cut pages/index.js over when green. Preserve all existing API calls and auth.
2. pages/funeral-home/dashboard.js (5892) — director + employee. Split: director "My Day" (ref: /preview/my-day) then employee "My Work" (ref: /preview/my-work). Dense desktop posture, CalmStatusPill from the spine.
3. pages/estate.js (4786) — estate operating surface. Ref: /preview/calm-os task sheet. Single computed status; fix the overflow:hidden scroll bug in the migration.
4. pages/urgent.js (1296) — first-hour red path. Grief-aware: directive, staged, one action; ref doctrine in vision section 2.
5. pages/participating.js (1236) — participant scoped. Ref: /preview/scoped participant.
6. pages/vendors/request.js (795) — vendor scoped quote->approve->pay->proof. Ref: /preview/scoped vendor.
7. pages/hospice.js (599) — warm pre-need path.

### Cowork track — small public pages (rebuild as new files on AppShell/CalmControls)
8. pages/pricing.js (270), pages/planning.js (273), pages/mission.js (109), pages/faq.js (115), pages/participants.js (119). Rebuild on the public web shell + CalmControls; keep publicSurfaceReadiness clean (no internal language). Tiny re-export pages (index 5, care-providers 6, contact 1) cut over with their target component.

### New build (either track) — reporting + dashboards
9. Per-persona reporting (operational health, family comms, staff load, vendor reliability, owner revenue) on CalmControls cards + the spine + proof trail. Vision section 5. Build after the operating surfaces migrate.

## Acceptance per migrated surface (gate before cutover)

1. Renders status only via present()/deriveCalmStatus (no hand-set labels).
2. 3-tap-to-next-action on mobile for family/scoped; one command surface for operators.
3. No internal vocabulary (lanes/sheets/spine) on user-facing UI; publicSurfaceReadiness clean for public pages.
4. Designed empty/loading/error states; mobile scroll/tap/overflow at 390x844 + 360x640; zero hydration warnings.
5. Preserves existing API contracts + auth + data (salvage); no schema changes.
6. npm run agent:check + clean next build + Playwright (desktop 1366x900 + mobile 390x844/360x640) green.
7. Owner-gated [deploy] [qa-approved] for the coherent slice.

## Loop runbook

`Passage Release Train: start the loop`. Cycle 0: LF normalization (git add --renormalize ., touch docs/agent-operating-context.md, [skip deploy]) + apply the staged direction/context patch. Then take the next loop-track item, run PM -> UI/UX -> Development -> QA -> Deploy against this plan + the matching /preview reference, and migrate behind a clean build + Playwright. Return to PM after each cycle; owner only at the deploy gate.

## Library available now (built in Cowork)

- lib/designSystem.js — tokens, TYPE scale, SANS, motion, deriveCalmStatus/present (single status).
- components/calm/CalmKit.js — AppShell, CalmStatusPill, ProgressLine, SectionLabel, HeroTask, TaskRow, TaskSheet.
- components/calm/CalmControls.js — Button, Field, Input, Textarea, Select, Card, Banner.
- Reference surfaces: /preview/calm-os, /preview/my-day, /preview/my-work, /preview/scoped.
