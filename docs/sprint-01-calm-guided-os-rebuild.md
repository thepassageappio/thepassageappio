# Sprint 1 (PM Brief) — Calm Guided OS: Public Site + App Rebuild

Status: COMPLETE
Owner: steve
PM role: this brief. Development is blocked until UI/UX derives the system from the approved prototype direction; this brief unblocks that handoff.
Direction north star: the calm, guided, mobile-first operating system shown in the owner-approved prototype. One next action per person, plain-language status, proof underneath.

## Mandate

Tear down the surface and rebuild it better — public marketing site AND the logged-in app, together, as one calm system. This is not a polish pass or a persona-by-persona patch. The current product is piecemeal: pages were stitched on over time, the task model leaks internal vocabulary (lanes, sheets, owner/waiting/prepared-output/proof/visibility facts), and mobile was retrofitted. We rebuild the experience layer on top of the working backend.

## Execution sequence (loop runbook)

This sprint executes in the push- and deploy-enabled release-train loop (the Codex environment with git push + Vercel). Cowork can do PM / UI-UX / QA / design and single-file writes, but the repo-wide rebuild and the production deploy run in the loop. Trigger phrase for a fresh loop chat: `Passage Release Train: start the loop.`

Cycle 0 — FIRST commit, before any rebuild: repo-wide line-ending normalization. Run `git add --renormalize .` then commit `chore: normalize line endings to LF [skip deploy]`. The repo .gitattributes already mandates LF but the committed blobs are CRLF, which makes every rebuild diff noisy. Normalize first so the burn-down diffs stay legible. Touch docs/agent-operating-context.md in the same commit to satisfy the agent-context guard.

Then per cycle: PM (this brief, COMPLETE) -> UI/UX derives the design system + shell -> Development rebuilds surfaces (status-derivation layer first) -> QA proves on desktop + 390x844 + 360x640 -> Deploy gate (owner approval). Migrate surface-by-surface behind the shared shell; [skip deploy] until a coherent slice is green; one owner-gated [deploy] [qa-approved] per release. The owner is not the restart mechanism; the loop returns to the owner only at the deploy gate.

## Salvage map (keep vs rebuild)

KEEP (do not rebuild — these are the foundation):
- The API surface under pages/api/* (~90 routes): tasks, estates, vendors, funeral-home, participants, Stripe, HubSpot, webhooks, system readiness.
- lib/ business logic: taskActions, taskOrchestration, taskStatus, taskPlaybooks, taskWorkspace, vendor*, funeralHome*, stripe*, hubspot, scheduling, notification/abuse controls.
- Supabase schema + migrations and RLS. Auth (auth/google, supabaseBrowser, supabaseOAuthHash).
- Brand primitives: lib/brand.js, lib/typography.js, palette (cream #fbfaf7, sage, amber, rose).

REBUILD (the surface and the presentation model):
- Every page UI: public (index, pricing, urgent, planning, hospice, assisted-living, care-providers, funeral-home, faq, contact, mission, story, trust, resources, guides) and app (estate, participating, participants, vendors/*, funeral-home/dashboard).
- The shell: components/SiteChrome (header/footer/nav), components/App.
- The task-presentation model: collapse the fact-set into one derived, human-readable status + progressive disclosure. Status is computed from existing data, never hand-set, so UI can never contradict the backend.

REPLACE / DEPRECATE:
- The piecemeal doc sprawl: this brief + the canonical roadmap supersede sprint-1/2-funeral-home, production-readiness-sprints, task-spine-rebuild-plan as the ACTIVE plan. Those remain as history only.

## Sprint goal

Ship a unified, calm, mobile-first Passage where a first-time, grieving, non-technical user — on a phone — reaches the one thing that needs them in three taps, reads plain status everywhere, and never sees internal vocabulary. The public site and the app share one design system, one shell, one voice.

## Requirements (the experience contract)

1. One design system (tokens: color, type scale, spacing, radius, motion) shared by public site and app. Single source of truth, themeable, dark-safe where applicable.
2. One shell: header, footer, nav, auth entry — identical primitives public and logged-in. Role-aware home, not separate stitched dashboards.
3. One task object surface: each task shows a single computed status line (Yours now / Waiting on {person} / In review / Done / Blocked / Not started). Facts move under Details.
4. Public site that sells calm coordination — clear value, trust, pricing — with zero owner-only/internal language (enforced by publicSurfaceReadiness).
5. Mobile-first: 44px targets, real vertical scroll on every sheet (fixes the overflow regression), thumb-reach nav, no horizontal overflow at 390x844 and 360x640.
6. Designed empty / loading / error states everywhere. Skeletons, not spinners. Recoverable errors with a next step.

## Sprint components (epics)

- E1 Design system + tokens (UI/UX-led).
- E2 Shared shell + role-aware home (replaces lane/dashboard stitching).
- E3 Task status-derivation layer over existing lib/ + API (Development-led; additive, contract-tested).
- E4 Public site rebuild on the new system (IA, copy, trust, pricing).
- E5 App surface rebuild: estate, participating, participants, vendors, funeral-home/dashboard on the new task surface.
- E6 States + a11y + performance pass.

## Development objectives

- Build E3 first; everything renders from a single status source.
- No changes to API request/response contracts or Supabase schema this sprint. Surface-and-status only. Any required backend change is logged as a backlog item for PM disposition, not done inline.
- Reuse lib/ helpers; do not fork business logic into components.
- One shell; delete per-page bespoke chrome as pages are migrated.

## Acceptance criteria

1. 3-tap rule verified on 390x844 (cold open -> the one next action).
2. Single legible status on every task; lane/sheet vocabulary absent from user-facing UI.
3. Mobile proof: scroll + tap-target + no-horizontal-overflow on 390x844 and 360x640; no overflow:hidden scroll regressions.
4. Zero hydration warnings on first load of every primary route incl. Google sign-in.
5. publicSurfaceReadiness passes: no ARR/sprint/roadmap/QA/internal language on public pages.
6. Empty/loading/error states present on every primary surface.
7. LCP < 2.5s mid-tier mobile; no layout shift on lists.
8. WCAG 2.1 AA on the core task flow (contrast, focus order, keyboard).
9. npm run agent:check, git diff --check, clean npm run build all pass.
10. Playwright desktop 1366x900 + mobile 390x844 pass for participant and vendor demo flows with screenshots.

## Dependencies

- Owner-approved direction (the prototype) — RECEIVED.
- Existing API + Supabase + auth remain stable (salvage).
- Google Places key in Vercel prod for address lookup (existing watch item; non-blocking with typed fallback).

## QA plan

Playwright participant + vendor flows at desktop + 390x844 + 360x640; scroll/tap/overflow checks per migrated surface; hydration check per route; publicSurfaceReadiness; perf + axe a11y on the core flow. QA failures loop to PM, never to the owner.

## Deploy plan

All rebuild commits [skip deploy] until the full acceptance checklist is green. Production release is a single owner-gated [deploy] [qa-approved] at the end of a coherent slice, within the existing deploy budget (max one train/hour, four deploy commits/day). Never auto-deploy.

## Non-goals (this sprint)

- No new billing/payments features; no new vendor integrations; no native app.
- No Supabase schema migration; no API contract changes.
- No new product surface area (marketplace, memorial, AI features) until the rebuilt spine is green.

## Risks & mitigations

- Status-derivation leaks into API behavior -> additive layer + contract tests on existing endpoints.
- Rebuild balloons past one sprint -> non-goals firm; migrate surface-by-surface behind the shared shell; ship in coherent slices.
- Mobile regressions reappear -> permanent overflow/scroll + tap-target regression guard added to agent:check.
- CRLF/line-ending churn obscures diffs -> Cycle 0 normalization to the .gitattributes LF policy; keep rebuild diffs legible.
- Env thrash (EPERM, .next contention) -> one build owner per cycle.

## Owner gates (the only places the loop returns to the owner)

- Final production deploy approval.
- Spending money / plan/quota changes.
- Any destructive production data change or legal/privacy/security decision.
Everything else the loop decides and runs.

## Next role agents

UI/UX Review Agent: derive the token + component system and the shell from the approved prototype; define the experience acceptance bar for E1/E2. Then Development implements E3 first. Loop order: PM -> UI/UX -> Development -> QA -> Deploy -> back to PM.
