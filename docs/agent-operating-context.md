# Passage Agent Operating Context

Last updated: 2026-06-19

This is the living handoff for future agents. Read AGENTS.md first, then this file, before changing the product. Update this file before final handoff or before creating a deploy-triggering commit.

Magic phrase for a fresh Codex chat: `Passage Release Train: start the loop.`

## Current Objective

Make Passage a clear, enterprise-grade funeral-home coordination SaaS capable of supporting a $300k ARR business within one year, with B2B funeral homes as the wedge and B2C family experiences made easier by strong funeral-home workflows.

The product must be smart underneath and simple on the surface: one owner, one waiting point, one next action, one prepared output, one proof trail, and one clear communication boundary across families, funeral-home directors, employees, vendors, care providers, participants, and system admins.

## Canonical Sources

- Agent rules: AGENTS.md
- Agent handoff/status: docs/agent-operating-context.md
- Website roadmap: pages/system/admin/saas-roadmap.js at /system/admin/saas-roadmap
- Deployment discipline: docs/deployment-discipline.md
- Funeral-home QA script: docs/funeral-home-flawless-qa.md

Do not create a second website roadmap. Older repo docs are useful history, but the website roadmap and this context file are the current operating truth.

## Current Deployment Model

Vercel builds are controlled by commit message:

- [skip deploy] means Vercel cancels by design.
- [deploy] without [qa-approved] should not release going forward.
- [deploy] [qa-approved] means one meaningful production release should build after Product Manager, Development Engineer, and QA handoffs are complete.

Deploy budget:

- Default maximum one production deploy train per hour.
- Default maximum four deploy-triggering commits per calendar day.
- Bundle two or three compatible small/medium fixes into one release candidate.
- Never deploy docs-only, roadmap-only, context-only, QA-note-only, or source-only setup commits.
- If Vercel returns build-rate-limit, deployment-rate-limit, quota, or upgrade-to-Pro, stop deploy-triggering commits, record the blocked release here, and continue only with [skip deploy] source/docs/QA prep until the reset window or explicit owner plan/quota approval.

Canonical Vercel project:

- Project ID: prj_b7CKwanQaKwFQSHInr3l6wsZy9nD
- Team ID: team_X0ta3bEEbRVGNM9xOwdBtCga

Current production: 4baa0d50a3496137ec1d627dbc7c1a56c8b8f125, release: deploy plural route and automation readiness [deploy] [qa-approved]. Deployed to dpl_FH9gdBDRejwZqJft1znrrsFcYqUQ in the canonical Vercel project and aliased to www.thepassageapp.io, thepassageapp.io, and the Vercel production aliases.

Queued release not deployed: none. The plural funeral-home redirect and automation-readiness source batch shipped together in release commit 4baa0d50a3496137ec1d627dbc7c1a56c8b8f125.

Previous green rollback candidate: f1b928b8755f2a965b18bacddaccf1adbadc8fd9, release: deploy persona navigation and task action clarity [deploy].

## Current Release Train

Required loop for user-facing work: Product Manager Agent -> UI/UX Review Agent -> Development Engineer Agent -> QA Agent -> Deploy Agent -> repeat. Backend-only, process-only, docs-only, or invisible API changes record `UX Review: N/A` with the reason.

Every loop requires distinct role instances or explicit delegations. Record each role handoff separately; do not merge PM, UI/UX, Development, QA, and Deploy into one untracked agent judgment. If a true sub-agent cannot be spawned, record the explicit role context and why delegation was unavailable.

Development is blocked until the Product Manager Agent records a PM Sprint Brief with status COMPLETE. The brief must include sprint goal, requirements, sprint components, development objectives, acceptance criteria, dependencies, QA plan, deploy plan, risks, non-goals, owner gates, and the next role agents to involve.

Auto-advance rule: once the train starts, do not stop after a role handoff if the handoff names an unresolved next role and the agent has useful work it can do. A successful `[skip deploy]` commit/push is source-state preservation, not loop completion; after pushing it, immediately continue to Product Manager consolidation or the next scoped UI/UX/Development/QA slice if the next action is known and not owner-gated. Deploy PASS returns to Product Manager for the next item. Deploy PARTIAL, failed post-deploy QA, fetch-only proof for hydrated flows, build failure, runtime failure, or rate-limit gate returns immediately to Product Manager for re-scope or [skip deploy] consolidation. Pause only for true owner gates: credentials/auth the agent cannot access after safe browser/Chrome/Claude-in-Chrome paths were tried, destructive production data changes, spending money/plan approval, or legal/compliance/privacy/security decisions.

Self-service rule: user is last resort. Before asking the owner to restart, decide, click, verify, research, or unblock, agents must try safe available paths: repo docs, source review, tests/builds, GitHub/Vercel connectors, browser/Chrome automation, and a signed-in Claude session in Chrome when available. Claude in Chrome may assist with research, handoff review, agent-to-agent coordination, or authenticated browser-state checking, but it must not bypass Agent Permissions, spend money, reveal/request secrets, send real communications, make destructive production changes, or decide legal/privacy/security/compliance matters. Record whether Claude in Chrome was available or used.

Best-practice research rule: every role must perform a research pass before its handoff is complete. Product Manager checks customer/domain/business/comparable workflow fit; UI/UX checks current usability, accessibility, responsive, visual, interaction, and performance standards; Development checks official framework/library/API/platform behavior before unfamiliar implementation; QA checks expected behavior, accessibility/browser/device risk, and regression history; Deploy checks current Vercel/project/log/quota/rollback behavior. Repo/source review is enough for stable internal facts. Use current external sources for changing, high-risk, user-facing, platform-specific, legal/security/privacy-adjacent, or time/money-impacting decisions. Record sources and decisions here.

Backlog hygiene rule: issues found outside the active sprint must be classified by Product Manager as fix now, backlog, roadmap update, watch item, or owner gate. Record source evidence, severity, and disposition here; update the single roadmap only when priority, sprint order, milestone wording, product doctrine, or a meaningful future backlog item changes.

Dedicated role briefs:

- docs/agents/product-manager.md
- docs/agents/ui-ux-agent.md
- docs/agents/development-engineer.md
- docs/agents/qa-agent.md
- docs/agents/deploy-agent.md

Current cycle: Cycle 4 Sprint 4 source prep active; PM scope expanded from address lookup into the full task-card/persona overhaul. Address lookup is fixed in source, and the family coordinator task-list surface is now being replaced with contract-driven operating-step cards.

Current batch status: Cycle 3 deployed the queued QA-enablement/release-closure work plus Sprint 3 automation-readiness hardening. Cycle 4 source prep adds native `<datalist>` full-address recommendations to the shared SmartAddressInput and replaces the family coordinator plan rows with `FamilyOperatingStepCard`, driven by `taskOperatingContractFor`: status, owner, waiting on, prepared output, proof destination, visibility, one primary action, and details behind the action. The opened family step now renders as a visually distinct `Family operating sheet` with a dark status header, fact grid, prepared-output/action panels, review-before-send message workspace, primary action lane, secondary action lane, and proof/status save area. The estate detail modal now opens as an `Estate operating sheet` with a dark status header, owner/waiting/prepared-output/proof/visibility facts, operating path, and the existing save/send/attach behaviors preserved underneath. Vendor requests are being converted from a simple request path into a `Vendor operating lane` and `Vendor operating sheet` with owner, waiting, proof destination, payment gate, scoped access, and one recommended response. Participant requests now use `taskOperatingContractFor` in a `Participant operating lane` and `Participant operating sheet` with owner, waiting point, prepared output, proof destination, visibility, one scoped response path, and the full family record kept hidden. Public-surface readiness now guards the full-address suggestion requirement, family operating-step/sheet structure, estate operating-sheet structure, vendor operating-lane structure, and participant operating-lane/sheet structure. This is not deployed yet; keep it [skip deploy] until batched with one or two compatible Sprint 4 fixes or until Product Manager approves a release candidate.

Chrome hydrated QA against current production 4baa0d50a3496137ec1d627dbc7c1a56c8b8f125: homepage, `/funeral-homes` redirect to `/funeral-home`, plural nested director demo route, singular director demo route, employee demo route, vendor request demo, owner roadmap, and owner Automation Readiness all hydrated past loading shells. Automation Readiness displayed blocked / 79%, 12% automation ready, owner-missing blockers, Next automation improvements, Why now, and Focus tasks. Vercel production runtime logs showed no error/fatal logs for the release window. Chrome console errors observed were from a browser extension URL, not Passage app source.

Current Product Manager scope: continue Sprint 4 persona UAT/source prep with the full task-card/persona overhaul as the product bar. The standard is not renamed cards; it is a different interaction model per persona: one recommended action, owner, waiting point, prepared output, proof, visibility boundary, and hidden secondary controls. Group this source hardening with one or two compatible small/medium fixes before another production deploy unless production is broken.

Current PM Sprint Brief: status COMPLETE for source-prep consolidation, not production release. Sprint goal: finish the persona operating-lane overhaul and make each affected role's next action, owner, waiting point, prepared output, proof destination, and visibility boundary testable before the next deploy candidate. Requirements: no public/internal language leaks; one primary action per role; secondary controls hidden or de-emphasized; family, estate, vendor, and participant surfaces use operating-lane/sheet patterns; readiness guards enforce markers. Sprint components: address lookup source hardening; family operating-step cards/sheet; estate operating sheet; vendor operating lane/sheet; participant operating lane/sheet; desktop/mobile Chrome QA; release-candidate deploy proof after `[deploy] [qa-approved]`. Development objectives: preserve existing APIs/actions, reuse shared task operating contracts where available, update readiness guards and roadmap/context only when they reflect sprint truth. Acceptance criteria: local checks/build pass; desktop and mobile browser QA proves affected demo routes render, open expected sheets, and avoid console/runtime blockers; live production QA remains required after deploy. Dependencies: Vercel deploy budget, Google Places production key for live address suggestions, authenticated Chrome/session for owner-only admin checks where needed. QA plan: `npm run agent:check`, `git diff --check`, `npm run build`, local Chrome/Playwright desktop/mobile, then production X-Passage-Commit and persona route checks after release. Deploy plan: keep source-prep commits `[skip deploy]` until the combined release candidate is QA-approved and deploy-budget rules are satisfied.

Failure rule: if QA fails, the next step is Product Manager re-scope before more development. A batch gets a maximum of 3 cycles before it must be split, de-scoped, or escalated instead of deployed.

Deploy rule: only use [deploy] [qa-approved] after context is updated, roadmap is current, QA passes, Vercel canonical project is confirmed, and the Deploy Budget Gate in docs/deployment-discipline.md is satisfied or an emergency/owner-approved exception is recorded.

## Recently Completed In Source

- Added the operating-system transformation roadmap in pages/system/admin/saas-roadmap.js.
- Added automation maturity doctrine: manual, semi-automated, automated, with a goal to safely move repeat work toward automation over time.
- Added task operating contracts in lib/taskWorkspace.js: owner, waiting party, audience, automation level, Passage-prepared output, human action, proof destination, and reassurance.
- Reworked funeral-home dashboard task details into operating-step cards with one primary action and collapsed secondary options.
- Added communication contracts: audience-aware message context, related step, review-before-send boundary, and proof state.
- Added demo family participants and automation levels to partner context data.
- Added communication/reporting/export fields for audience, automation level, and review boundary.
- Added employee and vendor reporting surfaces for automation coverage, stale waiting, unassigned work, vendor request state, payment, value, and next proof point.
- Updated the roadmap with director, employee, vendor, reporting, and export release-candidate takeaways.
- Updated AGENTS.md, docs/release-train.md, docs/deployment-discipline.md, and the PM/Deploy role briefs so the release train auto-advances instead of stopping after partial deploy QA handoff.
- Added stable release-train demo proof paths to docs/funeral-home-flawless-qa.md.
- Added `/funeral-homes` -> `/funeral-home` and `/funeral-homes/:path*` -> `/funeral-home/:path*` redirects in next.config.js; deployed in release commit 4baa0d50a3496137ec1d627dbc7c1a56c8b8f125.
- Added a deploy-budget rule to AGENTS.md, docs/release-train.md, docs/deployment-discipline.md, docs/agents/deploy-agent.md, and this context file so agents batch two or three compatible small/medium fixes and stop creating deploy-triggering commits on Vercel quota gates.
- Added the owner-last-resort / Claude-in-Chrome self-service rule to the scheduled automation prompt, AGENTS.md, docs/release-train.md, docs/agents/product-manager.md, and this context file.
- Added source hardening for automation-spine readiness: why-now reasons, next automation improvements, case-level automation blockers, and focus tasks for owner-only admin QA.
- Added backlog hygiene rules so unrelated loop findings are classified into fix now, backlog, roadmap update, watch item, or owner gate instead of being lost or silently pulled into the sprint.
- Added source hardening for shared address lookup: SmartAddressInput now exposes Google address predictions through native full-address datalist recommendations while typing, keeps the custom full-address suggestion menu, and preserves the Use this typed address fallback when Maps suggestions are unavailable.
- Began the non-cosmetic task-card overhaul on the family coordinator surface: the family plan list now renders contract-driven operating-step cards instead of legacy checkbox/task rows, the estate detail modal now opens as an Estate operating sheet rather than a dense task update panel, the vendor request page now has a Vendor operating lane/sheet structure, and participant requests now have a Participant operating lane/sheet structure in source.

## Current Product/UX Truth

The task-card model is being replaced conceptually by an operating-step model. Future work should continue that direction: no card soup, no mystery buttons, no unclear ownership, no messages detached from the related task.

Funeral-home director experience should prioritize:

- Cases needing action.
- Staff ownership and stale waiting.
- Family communication risk.
- Vendor quote/payment/proof states.
- Export/report proof.
- Recommended next action.

Funeral-home employee experience should prioritize:

- My assigned work.
- Client/case context.
- One primary action.
- Prepared message/request.
- Proof save.
- Escalation to director.

Vendor experience should prioritize:

- Scoped request.
- Accept/decline/update/quote/complete states.
- Payment and proof clarity.
- No broad family data access.

Family experience should prioritize:

- Calm next action.
- Who is handling what.
- What is waiting.
- What was proven done.
- Nothing sends without clear review where sensitivity matters.

## Open Work / Next Actions

1. Before asking the owner for help, try safe self-service paths including Chrome/browser automation and Claude in Chrome if available.
2. Group the next two or three compatible small/medium fixes before another production deploy unless production is broken.
3. Continue Sprint 4 persona UAT/source prep:
   - Public landing and nav.
   - Urgent path.
   - Funeral-home sales page.
   - Funeral-home director dashboard.
   - Funeral-home employee assigned work.
   - Family invited by funeral home.
   - Vendor request acceptance/update/quote/completion.
   - Reports/export proof.
   - System Admin owner roadmap after auth.
4. Sanity-check that System Admin visibly has one canonical roadmap and every other admin page is clearly evidence, QA, or tooling.
5. Confirm old /system/admin/sprint-2 links no longer look like a competing roadmap.
6. Keep logging any finding here before handing off, and state whether the train auto-advanced or why it could not.
7. Recheck address lookup after the next deploy with the Vercel production Google Places server key configured. Native full-address recommendations should appear while typing in every SmartAddressInput usage; if the key is missing, the typed-address fallback must remain obvious and non-blocking.
8. Continue the task-card/persona overhaul beyond the first family, estate, vendor, and participant source slices: Chrome-QA desktop and mobile before claiming the overhaul complete.

## Known Watch Items

- Google sign-in and general button behavior recently showed issues and needs live browser QA.
- Smart address/location lookup during green-path onboarding was reported broken or confusing. Current source adds native full-address datalist recommendations across shared SmartAddressInput usages, but live Google suggestions still require `GOOGLE_PLACES_API_KEY` or `GOOGLE_MAPS_API_KEY` in Vercel production.
- Vercel rate limits were hit on Cycle 2 release commit 5c04986381385c8821f14282e757e2209ad71e0c, then cleared before Cycle 3 release 4baa0d50a3496137ec1d627dbc7c1a56c8b8f125.
- Deploy discipline now requires batching two or three compatible small/medium fixes where possible; docs/context/QA notes/source-only setup stay [skip deploy].
- Owner escalation should be last resort after repo docs, connectors, browser/Chrome, and Claude in Chrome have been tried where safe.
- Dependency watch item from local QA: npm ci reports 3 audit findings (1 moderate, 2 high). Do not force unrelated dependency churn into an active sprint; Product Manager should classify this in a security/dependency hardening batch after reviewing `npm audit` detail.
- Support email support@thepassageapp.io is not real and should not be shown as a direct support line.
- Internal ARR/300k/roadmap/sprint/QA language must never appear on external pages.
- Demo data has been near-empty before; the funeral-home demo loop must be seeded before claims are made.
- Fetch-only Vercel checks cannot prove hydrated client flows. Use Chrome/browser with auth or seeded demo state before marking director, employee, vendor request, roadmap, or reports/export complete.

## Handoff Format For Future Agents

Append or update this section before final response:

- Date/time:
- Branch/commit(s):
- Role instance / delegated agent:
- Prior role handoff received:
- PM Sprint Brief: complete/incomplete
- Sprint goal:
- Requirements:
- Sprint components:
- Development objectives:
- Acceptance criteria:
- Dependencies:
- QA/deploy plan:
- Files changed:
- UI/UX status:
- Best-practice research:
- Deployed: yes/no, Vercel deployment URL/status:
- Tested:
- Failed/blocked:
- Self-service attempted / Claude in Chrome:
- Next action:
- Auto-advance decision:

## Latest Handoff Updates

### 2026-07-01 - Public chrome hydration repair ready for release

- Date/time: 2026-07-01 06:27 -04:00.
- Branch/commit(s): clean worktree `C:\Users\steve\Documents\GitHub\thepassageappio-originmain` on `codex/fix-public-chrome-hydration`, based on `origin/main`/production `da18ab6f07136acf6bb509e008587636ef75ded4`; not committed yet at the time of this context update. Stale checkout `C:\Users\steve\Documents\GitHub\thepassageappio` remains behind `origin/main` by 51 commits with dirty local state and was not used for code work.
- Role instances / delegation: distinct in-session Product Manager, UI/UX Review, Development Engineer, QA, and Deploy role contexts. The multi-agent tool was discoverable, but its callable policy says not to spawn subagents unless the user explicitly asks for subagents/delegation, so true sub-agent delegation was not used.
- Prior role handoff received: 2026-06-30 public-chrome hydration repair staged on clean `origin/main` branch; next action was to commit the prepared fix, rerun build/diff/browser QA, and deploy only after release-train gates pass.
- PM Sprint Brief: COMPLETE. Sprint goal: repair production React hydration page errors on the calm public home and funeral-home routes. Requirements: use the clean `origin/main` worktree, preserve route/copy/auth/analytics behavior, change only the CSS rendering mechanism causing the server/client mismatch, prove local hydrated render, and confirm current Vercel production state before any deploy-triggering commit. Sprint components: evidence pass, Vercel/project check, React/Next hydration research, scoped patch review, build/check/browser QA, context update, release decision. Development objectives: keep shared/page CSS as static strings and render with a shared raw style helper instead of React text children that hydrate differently. Acceptance criteria: `/` and `/funeral-home` render locally with zero console errors and zero page errors, production baseline still identifies the affected commit, `npm run build` and `git diff --check` pass, `npm run agent:check` passes after context update, and any deploy uses `[deploy] [qa-approved]`. Dependencies: local Next/Playwright, Vercel connector, GitHub remote, official React/Next docs. QA plan: local Playwright on both affected routes and post-deploy production Playwright after Vercel READY. Deploy plan: this is a production repair and is large enough to spend one deploy slot if final checks pass; current Vercel production is `dpl_6ZpsxH774isxAUbQY3CwXsbVe2Cg` READY at commit `da18ab6f07136acf6bb509e008587636ef75ded4` with no error/fatal runtime logs in the last 24 hours. Risks: raw CSS helper must remain restricted to trusted internal CSS strings; post-deploy browser proof is still required. Non-goals: no redesign, no copy changes, no auth/data/API changes, no roadmap priority change, no owner-only surface changes. Owner gates: none.
- UI/UX status: PASS. This is user-facing because hydration replacement can cause page instability, but the intended experience is no visual/content change. Acceptance bar: preserve current calm public layout, readable hierarchy, public/internal language boundary, and one-primary-action structure on `/` and `/funeral-home`; QA should prove the routes hydrate without page errors.
- Development handoff: `components/calm/CalmPublicChrome.js` now exports `RawStyle({ css })` and uses it for shared calm CSS. `pages/funeral-home/index.js` imports `RawStyle`, stores page-scoped CSS in `pageCss`, and renders it through the same helper. No data/API behavior changed. Files changed: `components/calm/CalmPublicChrome.js`, `pages/funeral-home/index.js`, `docs/agent-operating-context.md`.
- Best-practice research: official Next.js hydration guidance says server-rendered and first client-rendered content must match to avoid hydration errors; official React `hydrateRoot` guidance says mismatches should be treated as bugs. Applied decision: fix the markup mismatch rather than suppressing warnings or deferring render to the client. Vercel evidence came from the canonical project connector; official limits were already verified in `docs/deployment-discipline.md` and no active rate-limit gate appeared in current deployment evidence.
- Tested: `git diff --check` passed. `npm run build` passed with Next.js 14.2.35 and generated 71 static pages. Local dev server ran at `http://localhost:3057`. Local Playwright loaded `/` and `/funeral-home`: both returned titles, visible Passage content, zero console errors, zero page errors, and no escaped style text marker. Production baseline Playwright loaded `https://www.thepassageapp.io/` and `/funeral-home`: both returned HTTP 200 with `X-Passage-Commit` `da18ab6f07136acf6bb509e008587636ef75ded4` and reproduced React page errors `#425`, `#418`, and `#423`. `npm run agent:check` initially failed only because this context update was not yet recorded; rerun after context update is required.
- Failed/blocked: in-app browser automation was attempted but unavailable with a trusted bridge error, so local Playwright was used. Claude in Chrome was not used because repo/source/Vercel/Playwright evidence was sufficient and no owner-gated or external-agent decision remained. No production deploy has been attempted yet in this run.
- Current Vercel/deploy status: canonical Vercel project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`, team `team_X0ta3bEEbRVGNM9xOwdBtCga`; latest production deployment `dpl_6ZpsxH774isxAUbQY3CwXsbVe2Cg` is READY at `da18ab6f07136acf6bb509e008587636ef75ded4`; runtime log query for production `error`/`fatal` entries over the last 24 hours returned no logs. Deployment remains pending until final local checks and a `[deploy] [qa-approved]` release commit.
- Next action: rerun `npm run agent:check`; if it passes, create the release commit for the hydration fix, push it, wait for Vercel READY, then run production Playwright on `/` and `/funeral-home` to confirm `X-Passage-Commit` matches the release commit and React page errors are gone.
- Auto-advance decision: QA local PASS; auto-advance to Deploy Agent for final gate checks and release attempt unless final checks or Vercel status fail.

### 2026-06-20 - Role-agent and PM Sprint Brief gate hardening

- Date/time: 2026-06-20 04:45 -04:00.
- Branch/commit(s): main 7ad3323, `docs(release): require role agents and sprint brief [skip deploy]`; not deployed by design.
- Role instance / delegated agent: main agent plus process-review sub-agent `019ee429-0280-76b2-becf-8e9fe392e7ba`, which reviewed the release-train/PM contract and recommended file/section targets.
- Prior role handoff received: owner clarified that every loop should create or delegate a distinct agent per role and that PM must work with agents to outline a world-class sprint with clear development objectives before implementation.
- PM Sprint Brief: COMPLETE for process hardening. Sprint goal: make the next release-train loop unambiguous that role separation and PM Sprint Brief completion are required gates before development.
- Requirements: AGENTS.md, docs/release-train.md, docs/agents/product-manager.md, and this context must require distinct role instances/delegations; PM must produce sprint goal, requirements, sprint components, development objectives, acceptance criteria, dependencies, QA plan, deploy plan, risks, non-goals, owner gates, and next role agents.
- Sprint components: stable operating guide rule, release-train gate, PM role output shape, living-context handoff fields, current PM Sprint Brief, local `passage-release-train` Codex skill installation for future clean chats, and Playwright Chromium install for future browser QA.
- Development objectives: documentation/process-only update; no product surface changes; keep future development blocked until PM Sprint Brief status is COMPLETE.
- Acceptance criteria: docs clearly prohibit collapsing PM/UI/UX/Development/QA/Deploy into one untracked judgment; PM brief fields are present in stable docs and living context; Playwright Chromium install path is ready for future QA.
- Dependencies: multi-agent tool availability for true sub-agent delegation; if unavailable, explicit role context must be recorded. Local Codex skill installed at `C:\Users\steve\.codex\skills\passage-release-train`. Playwright browser install completed with `npx playwright install chromium`, and managed Chromium launch smoke returned version 147.0.7727.15.
- QA/deploy plan: run `npm run agent:check`, `git diff --check`, verify the installed skill file, and run a Playwright Chromium launch smoke after edits. Commit as `[skip deploy]`; no production deploy because this is governance/tooling prep.
- UI/UX status: N/A, process-only.
- Best-practice research: Scrum Guide 2020 for Sprint Goal/Sprint Backlog/Definition of Done and cross-functional accountability; Atlassian sprint planning guidance for sprint goal/backlog planning; NN/g heuristics for role-quality gates that require status visibility, real-world language, user control, consistency, and error prevention.
- Failed/blocked: none currently. Production deploy intentionally not applicable.
- Self-service attempted / Claude in Chrome: repo docs/source review, multi-agent process-review sub-agent, and external best-practice research. Claude in Chrome was not needed.
- Next action: run checks, commit `[skip deploy]`, then future loops must instantiate/delegate distinct PM, UI/UX, Development, QA, and Deploy roles and block Development until PM Sprint Brief is COMPLETE.
- Auto-advance decision: process hardening can stop after checks/commit because no product development slice is being opened by this owner instruction; next release-train loop starts from the hardened PM gate.

### 2026-06-20 - Cycle 4 participant operating lane source prep

- Date/time: 2026-06-20 04:22 -04:00.
- Branch/commit(s): main working tree in `repo-raw`; participant operating-lane source changes are ready for a `[skip deploy]` commit and are not deployed.
- Product Manager scope: finish the participant detail gap in the active Sprint 4 persona/task-card overhaul. The participant helper must see one scoped request, one owner, one waiting point, prepared output, proof destination, visibility boundary, and one response path without seeing the full family record.
- UI/UX status: PASS for source prep. The participant surface now changes the interaction model, not only the words: the request card is a `Participant operating lane`, and the details/response dialog is a `Participant operating sheet` with a dark status header, fact grid, prepared-output panel, what-you-do panel, proof/visibility panel, and the existing save/help/waiting/done actions preserved.
- Best-practice research: repo docs/source review plus current external baselines: NN/g 10 usability heuristics for status visibility, real-world language, user control, consistency, error prevention, recognition, and minimalist design; W3C WCAG 2.2 for labels, focus visibility, target size, predictable dialogs, and accessible names; web.dev Core Web Vitals for keeping the modal visually stable and responsive. Product decision: make the scoped request state visible in the sheet header and keep destructive/secondary controls behind explicit buttons.
- Files changed: pages/participating.js, pages/api/system/publicSurfaceReadiness.js, pages/system/admin/saas-roadmap.js, docs/agent-operating-context.md.
- Development handoff: pages/participating.js now imports `taskOperatingContractFor` and uses it for participant requests. The card exposes a Participant operating lane, and the response/details modal is now labeled `Participant operating sheet` with owner, waiting, prepared output, proof saves to, visibility, and next status facts. The Google sign-in `next` link now hydrates from a stable `/participating` value before updating to `router.asPath`, fixing the demo-route hydration warning found during Chrome QA. The existing participant action API calls, note validation, save-note pulse, help/waiting/done actions, and no-email/no-SMS boundary are preserved.
- QA status: PASS for source prep. `npm run agent:check` passed, `git diff --check` passed, and `npm run build` passed. Chrome/Playwright against local dev server verified desktop 1366x900 and mobile 390x844 on `/participating?demo=1&persona=participant&demoTour=funeral-home&demoStep=participant`: Participant operating lane, Your one request, Owner, Waiting on, Status and proof, Open details/proof/visibility, Participant operating sheet, Prepared output, What you do now, Proof and visibility, Proof saves to, and Visibility all rendered. Initial QA found a Google-link hydration mismatch; source was fixed and rerun showed only expected React DevTools/HMR console messages.
- Failed/blocked: not deployed by design; this is source prep for the combined Sprint 4 release batch. Live production QA remains pending until the next `[deploy] [qa-approved]` batch.
- Self-service attempted / Claude in Chrome: repo docs/source review, GitHub connector, local source inspection, and current external research. Claude in Chrome was not needed.
- Next action: commit `[skip deploy]`, then continue Product Manager/QA consolidation for the remaining Sprint 4 release candidate and live production QA after the next deploy.
- Auto-advance decision: source QA passed; deploy is intentionally deferred by batch discipline, so the loop returns to Product Manager/QA consolidation rather than a production deploy.

### 2026-06-20 - UI/UX and best-practice research loop hardening plus vendor operating lane

- Date/time: 2026-06-20 04:01 -04:00.
- Branch/commit(s): main working tree after pushed 502afb3; UI/UX role, research-rule, and vendor operating-lane source changes are not committed or deployed yet.
- Product Manager scope: owner asked whether the release train needs a UI/UX agent and then required best-in-class research/best-practice assessment in every role. PM disposition: fix now as process hardening, and continue the active task-card/persona overhaul into the vendor request surface.
- UI/UX status: PASS for source prep. New UI/UX Review Agent is required for user-facing work, with UX Review: N/A allowed only for backend/process/docs-only changes. Vendor request surface now has a visibly different operating lane/sheet, not only copy changes.
- Best-practice research: repo docs/source review plus current external baselines: NN/g 10 usability heuristics for status visibility, real-world language, user control, consistency, error prevention, recognition, and minimalist design; W3C WCAG 2.2 for navigability, labels, focus visibility, and target-size expectations; web.dev Core Web Vitals for loading/interactivity/visual-stability quality signals; Vercel deployment docs for deployment methods/environments and why deploy slots should be treated as scarce.
- Files changed: AGENTS.md, docs/release-train.md, docs/agents/ui-ux-agent.md, docs/agents/product-manager.md, docs/agents/development-engineer.md, docs/agents/qa-agent.md, docs/agents/deploy-agent.md, docs/agent-operating-context.md, pages/vendors/request.js, pages/api/system/publicSurfaceReadiness.js, pages/system/admin/saas-roadmap.js.
- Development handoff: docs now add UI/UX Review as a first-class role and require every role to record best-practice research. Vendor request source replaces the simple request path with a `Vendor operating lane` and response modal with a `Vendor operating sheet`, showing owner, waiting, proof destination, payment gate, scoped access, and one recommended response while preserving existing quote/schedule/proof actions.
- Tested: `npm run agent:check` passed, `git diff --check` passed, and `npm run build` passed.
- Failed/blocked: not deployed by design; this is source/process prep for the next combined Sprint 4 release.
- Self-service attempted / Claude in Chrome: repo docs/source review and external research from NN/g, W3C, web.dev, and Vercel docs. Claude in Chrome was not needed.
- Next action: run checks, commit `[skip deploy]`, then continue PM/UI-UX for any remaining participant/vendor detail gaps and Chrome visual QA before claiming the persona overhaul complete.
- Auto-advance decision: continue after the skip-deploy commit; do not stop at GitHub/source preservation.

### 2026-06-19 - Skip-deploy continuation rule hardening

- Date/time: 2026-06-19 20:43 -04:00.
- Branch/commit(s): main working tree on top of origin/main 968adfe; documentation fix pending commit.
- Product Manager scope: owner identified a process failure: after source/doc commits, the train still paused instead of returning immediately to PM/Development/QA for the next known slice.
- Files changed: AGENTS.md, docs/release-train.md, docs/agent-operating-context.md.
- Development handoff: the agent contract now states that a successful `[skip deploy]` commit/push is not a terminal state. It preserves source/docs/QA/context state, then must immediately continue to PM consolidation or the next useful Development/QA role when the next action is known and not owner-gated.
- Tested: `npm run agent:check` passed and `git diff --check` passed after this docs update.
- Failed/blocked: no owner gate. This is a process-doc repair only and must stay `[skip deploy]`.
- Self-service attempted / Claude in Chrome: repo docs and source review. Claude in Chrome was not needed.
- Next action: commit and push as `[skip deploy]`, then auto-advance to Product Manager for the next task-card/persona overhaul slice instead of stopping.
- Auto-advance decision: continue immediately after the docs push; do not use the push itself as a final stopping point.

### 2026-06-19 - Cycle 4 estate operating-sheet source prep

- Date/time: 2026-06-19 20:47 -04:00.
- Branch/commit(s): main working tree after pushed e8c32ee; estate operating-sheet source changes are not committed or deployed yet.
- Product Manager scope: continue the non-cosmetic task-card/persona overhaul into `/estate`, because the opened estate step still behaved like a dense task update panel instead of a persona-safe operating lane.
- Files changed: pages/estate.js, pages/api/system/publicSurfaceReadiness.js, pages/system/admin/saas-roadmap.js, docs/agent-operating-context.md.
- Development handoff: pages/estate.js now imports `taskOperatingContractFor` and turns the opened estate step into an `Estate operating sheet` with a dark status header, status/owner/automation pills, owner/waiting/prepared-output/proof/visibility/next-status facts, operating path, and preserved owner save, prepared draft, send, attachment, proof, waiting, and needs-help actions. Public-surface readiness now guards the estate operating-sheet markers.
- Tested: `npm run agent:check` passed, `git diff --check` passed, and `npm run build` passed after the estate source update.
- Failed/blocked: not deployed by design; this remains Sprint 4 source prep for a combined release batch.
- Self-service attempted / Claude in Chrome: repo docs and source review. Claude in Chrome was not needed.
- Next action: run checks, commit `[skip deploy]`, then continue Product Manager scope for participant/vendor detail surfaces and Chrome visual QA before claiming the overhaul complete.
- Auto-advance decision: continue the release train after this source commit; do not stop merely because the skip-deploy commit preserves the slice.

### 2026-06-19 - Cycle 4 address lookup native suggestions source prep

- Date/time: 2026-06-19 21:05 -04:00.
- Branch/commit(s): main working tree on top of origin/main 8bca1a0; source prep not deployed yet.
- Product Manager scope: Sprint 4 persona UAT found the shared address dropdown did not natively recommend full addresses while typing, which is a cross-site requirement for green-path onboarding and care/funeral/vendor address entry.
- Files changed: components/SmartAddressInput.js, pages/api/system/publicSurfaceReadiness.js, pages/system/admin/saas-roadmap.js, docs/agent-operating-context.md.
- Development handoff: SmartAddressInput now connects server autocomplete predictions to a native `<datalist>` with full address values, chooses the matching Google suggestion when a native option is selected, displays full-address text in the custom suggestion menu, and keeps Use this typed address as the fallback. Public-surface readiness now guards the shared component for addressAutocomplete, datalist, full-address suggestion copy, and fallback copy.
- Tested: `npm run agent:check` passed, `npm run build` passed, and `git diff --check` passed after the source and documentation updates.
- Failed/blocked: live Google recommendations still depend on `GOOGLE_PLACES_API_KEY` or `GOOGLE_MAPS_API_KEY` being configured server-side in Vercel production. Source is ready; production env/config must be verified during deploy QA.
- Self-service attempted / Claude in Chrome: repo docs, source review, local build/check path. Chrome UAT identified the gap; Claude in Chrome was not used.
- Next action: commit as [skip deploy] source prep, continue Sprint 4 PM/QA for one or two compatible fixes, then deploy one combined [deploy] [qa-approved] batch and verify native full-address suggestions in Chrome.
- Auto-advance decision: QA finding became fix-now source prep; deploy is intentionally deferred by budget discipline, so the train continues in Product Manager/QA consolidation mode.

### 2026-06-19 - Cycle 4 family operating-step overhaul source prep

- Date/time: 2026-06-19 21:28 -04:00.
- Branch/commit(s): main working tree after pushed 88ff157; current family overhaul source changes are not committed or deployed yet.
- Product Manager scope: owner rejected a cosmetic task-card wording pass and reset the bar to a real persona experience overhaul. PM disposition: fix now for the family coordinator plan surface because it remained the largest legacy task-row island after the funeral-home director/staff redesign.
- Files changed: components/App.js, pages/api/system/publicSurfaceReadiness.js, pages/system/admin/saas-roadmap.js, docs/agent-operating-context.md.
- Development handoff: components/App.js now imports `taskOperatingContractFor`, normalizes family next-step rows into operating contracts, and renders `FamilyOperatingStepCard` for the primary "Just do this now" lane plus every tier row. Each family card shows status, owner/needs-owner state, prepared output, waiting on, proof destination, visibility, one primary action, and detail context behind the action. The opened step now uses a visually different family operating sheet with a dark header, status facts, prepared-output/what-you-do panels, a review-before-send message workspace, separated primary/secondary actions, and a proof/status save area. The source guard now requires `FamilyOperatingStepCard`, `taskOperatingContractFor`, one-owner/one-waiting/one-proof copy, hidden-detail copy, Family operating sheet, Prepared message workspace, and Review before send.
- Tested: `npm run agent:check` passed, `git diff --check` passed, and `npm run build` passed after the family operating-step source and docs/roadmap updates.
- Failed/blocked: not deployed by design; this is source prep for the next combined Sprint 4 release. Chrome visual QA still needs to run after this source is deployed or against a local dev server with a seeded family plan.
- Self-service attempted / Claude in Chrome: repo docs, source review, local checks. Claude in Chrome was not used.
- Next action: commit [skip deploy], continue converting remaining estate/persona detail surfaces before claiming the task-card/persona overhaul complete, then Chrome-QA desktop/mobile.
- Auto-advance decision: PM -> Development -> QA source pass for this slice; deploy deferred by budget discipline.

### 2026-06-19 - Cycle 3 release deployed and loop continued

- Date/time: 2026-06-19 20:19 -04:00.
- Branch/commit(s): main 4baa0d50a3496137ec1d627dbc7c1a56c8b8f125, `release: deploy plural route and automation readiness [deploy] [qa-approved]`.
- Product Manager scope: deploy one coherent batch containing the queued plural funeral-home redirect and Sprint 3 automation-readiness source hardening after Vercel accepted builds again.
- Files changed since previous release: next.config.js plural redirects; pages/api/system/automationSpineReadiness.js; pages/system/admin/automation-spine-readiness.js; pages/api/system/publicSurfaceReadiness.js; pages/system/admin/saas-roadmap.js; AGENTS.md; docs/release-train.md; docs/agents/product-manager.md; docs/agent-operating-context.md; related QA/context docs from queued commits.
- Deployed: yes. Canonical Vercel project prj_b7CKwanQaKwFQSHInr3l6wsZy9nD, deployment dpl_FH9gdBDRejwZqJft1znrrsFcYqUQ, status READY, aliased to www.thepassageapp.io and thepassageapp.io.
- Tested: local `npm run agent:check` PASS and `npm run build` PASS before deploy. Vercel build logs showed release marker allowed, compiled successfully, generated static pages 64/64, and deployment READY. Chrome QA on production verified homepage hydrated, `/funeral-homes` redirected to `/funeral-home`, plural nested director demo route redirected/rendered, singular director demo route rendered Hudson Valley Funeral Group/My Day content, employee demo rendered staff/assigned work content, vendor request demo rendered Livestream support / One request copy, System Admin roadmap rendered owner-only roadmap, and Automation Readiness rendered blocked / 79%, 12% automation ready, owner-missing blockers, Next automation improvements, Why now, and Focus tasks. Vercel runtime logs for production showed no error/fatal logs in the release window.
- Failed/blocked: direct shell fetch/header checks failed from this Windows environment due local TLS/proxy receive errors and curl Schannel credential errors. Use Vercel deployment metadata plus Chrome for current proof; retry shell header checks later from a clean network context if needed. Chrome console errors observed were from a browser extension URL and async extension listener noise, not Passage source.
- Self-service attempted / Claude in Chrome: repo docs, local source/build checks, Vercel connector, Chrome automation, runtime logs. Claude in Chrome was not used.
- Next action: auto-advance to Product Manager for Sprint 4 persona UAT/source prep. Group the next two or three compatible fixes before another deploy slot unless production breaks.
- Auto-advance decision: Deploy PASS; return to Product Manager immediately for Sprint 4 rather than stopping.

### 2026-06-19 - Cycle 3 automation readiness source hardening

- Date/time: 2026-06-19 20:06 -04:00.
- Branch/commit(s): local main working tree on top of origin/main 7f518e4; not committed or deployed.
- Product Manager scope: Sprint 3 Automation layer hardening while Vercel remains rate-limited. Source-only batch; no new product surface; no deploy-triggering commit.
- Files changed: pages/api/system/automationSpineReadiness.js, pages/system/admin/automation-spine-readiness.js, pages/api/system/publicSurfaceReadiness.js, pages/system/admin/saas-roadmap.js, AGENTS.md, docs/release-train.md, docs/agents/product-manager.md, docs/agent-operating-context.md.
- Development handoff: automation readiness API now returns task/case why-now reasons, next automation improvements, top improvements, case automation blockers, and focus tasks. Owner-only admin readiness page now displays those signals. Public-surface readiness source check now requires the new API/admin signals.
- Backlog hygiene update: AGENTS.md, release train, Product Manager brief, owner roadmap, and this context now require unrelated loop findings to be classified as fix now, backlog, roadmap update, watch item, or owner gate with evidence.
- Tested: `git diff --check` passed with only a CRLF normalization warning for pages/api/system/automationSpineReadiness.js. `npm run agent:check` passed. `npm ci` installed dependencies from lockfile and reported 3 audit findings (1 moderate, 2 high). `npm run build` passed, including /api/system/automationSpineReadiness, /system/admin/automation-spine-readiness, and /system/admin/saas-roadmap.
- Failed/blocked: not deployed because Vercel build-rate-limit is still the active release gate; queued redirect release 5c04986381385c8821f14282e757e2209ad71e0c remains undeployed. Dependency audit findings were classified as a watch item/security backlog, not current sprint scope.
- Self-service attempted / Claude in Chrome: repo docs, source review, local checks, and local build. Claude in Chrome was not used.
- Next action: keep this source batch queued with the existing rate-limit-blocked release. When Vercel clears, PM should decide whether to combine this automation-readiness batch with the plural-route release and any other compatible small/medium fixes into one deploy slot.
- Auto-advance decision: QA source PASS; Deploy remains blocked by Vercel rate limit, so the train should stay in Product Manager consolidation mode until a deploy slot is available.

### 2026-06-19 - Release train enforcement

- Added docs/release-train.md as the required Product Manager -> Development Engineer -> QA -> Deploy loop.
- Added a maximum of 3 QA failure cycles before a batch must be split, de-scoped, or escalated.
- Added scripts/check-agent-context.js to require AGENTS.md, release train, and living context updates for meaningful changes.
- Added scripts/check-release-train.js to require PR body sections and completed handoff checklist before sign-off.
- Added .github/workflows/agent-context.yml and .github/pull_request_template.md for PR/push enforcement.
- Updated deployment discipline so production release commits require [deploy] [qa-approved] going forward.
- Deployed: no. This is still queued with [skip deploy] pending sanity checks and QA approval.

### 2026-06-19 - Fresh-agent trigger phrase

- Added the magic phrase `Passage Release Train: start the loop.` to AGENTS.md, docs/release-train.md, and this context file.
- Future fresh chats should begin with that phrase plus the concrete roadmap item or defect to run through Product Manager -> Development Engineer -> QA Agent -> Deploy Agent.
- Deployed: no. Source-only process hardening remains [skip deploy] until a QA-approved release batch is ready.

### 2026-06-19 - Dedicated agent role briefs

- Added dedicated role playbooks under docs/agents/ for Product Manager, Development Engineer, QA Agent, and Deploy Agent.
- Updated AGENTS.md and docs/release-train.md so the magic phrase triggers the dedicated role loop, not a generic all-purpose agent flow.
- Deployed: no. Source-only governance hardening remains [skip deploy] pending sanity checks and a QA-approved release batch.

### 2026-06-19 - Cycle 1 QA review, release-gate fix, agent write path

- Date/time: 2026-06-19.
- Branch/commit(s): main, working from HEAD 7518bead.
- Production verified GREEN at f1b928b8 (release: deploy persona navigation and task action clarity [deploy]) on the canonical Vercel project; www.thepassageapp.io and the Vercel alias both serve that commit. The duplicate "you-are-working-on-a-production" project is gone.
- Source-level QA of the queued operating-loop batch: PASS. lib/taskWorkspace.js taskOperatingContractFor returns the full Sprint 2/4 acceptance shape (owner, waiting party, audience, automation level + reason + next improvement, prepared output, human action, proof destination, one primary action with secondaries collapsed) with customer-safe copy and no internal-language leak. communicationContractFor resolves end to end. The taskNeedsHelp / taskIsWaiting helpers are pre-existing, so the dashboard render block does not crash on missing references.
- Gate bug found and FIXED: scripts/vercel-ignore-build.js used /[qa-approved]/i and /[qa approved]/i, which are regex character classes (match any one of those characters), not literal strings. The [qa-approved] requirement was therefore a no-op, which is why a prior [deploy] commit released without QA sign-off. Escaped to /\[qa-approved\]/i and /\[qa approved\]/i so the release-train gate is real. The duplicate-project guard and the two check scripts (check-agent-context.js, check-release-train.js) were reviewed and escape correctly; no other regex changes needed.
- Process gap recorded in docs/release-train.md: a green Vercel build is not proof a page renders. Every release now requires a live post-deploy render check per persona plus an X-Passage-Commit match before the cycle closes.
- Agent write path: the official remote GitHub MCP connector ("Claude Github MCP Connector" GitHub App, installation 141421148) is write-capable, but its repository access must include thepassageappio/thepassageappio. Because the repo is public, the app reads it via public read-only but returns 403 "Resource not accessible by integration" on writes until the repo is granted to the installation. Until then, agents edit the connected local clone and the owner pushes.
- Open caveat before release: the operating-loop batch has never rendered in a browser (no preview env; all post-green builds canceled). Source review clears the crash risks, but the real proof is the post-deploy persona render check above.
- Deployed: no. These changes are [skip deploy] and remain queued; the production release still requires owner approval and a [deploy] [qa-approved] commit.
- Next action: owner pushes this [skip deploy] batch, then approves the [deploy] [qa-approved] release; immediately after READY, run the per-persona render check and log results here.

### 2026-06-19 - Cycle 1 release shipped

- Date/time: 2026-06-19.
- Branch/commit(s): main, release commit "release: ship Cycle 1 funeral-home operating-loop batch [deploy] [qa-approved]" on top of gate fix e8a4587 and docs 3693d37.
- Deployed: triggered to the canonical Vercel project (prj_b7CKwanQaKwFQSHInr3l6wsZy9nD). Build status and production URL to be recorded once READY.
- Tested: source-level PASS. Live post-deploy per-persona render check + X-Passage-Commit match pending build completion, per docs/release-train.md.
- Failed/blocked: none at commit time. Rollback candidate is green f1b928b8 if any persona page white-screens.
- Next action: confirm Vercel READY, verify X-Passage-Commit equals the release commit, run director/employee/family/vendor/reporting render checks, then log results and update the roadmap and next-sprint scope here for the next Codex or Claude agent.

### 2026-06-19 - Cycle 1 production repair and smoke checks

- Date/time: 2026-06-19 19:15 America/New_York.
- Branch/commit(s): main. Failed release commit c1df99afa5abac2d7f6394e1623769708ccde01a; repair commit 2556914b4c16d9b27b2ca96f3f88432f92db1c6e (`fix(release): repair roadmap build blocker [deploy] [qa-approved]`).
- Files changed: pages/system/admin/saas-roadmap.js in the repair commit; docs/agent-operating-context.md in this handoff commit.
- Deployed: yes. Canonical Vercel project prj_b7CKwanQaKwFQSHInr3l6wsZy9nD, deployment dpl_XcLo42Wp2KawTPMAz3wf2MsAVPGe, status READY, production aliases active. www.thepassageapp.io serves X-Passage-Commit 2556914b4c16d9b27b2ca96f3f88432f92db1c6e.
- Tested: Vercel build logs show compiled successfully, generated static pages 64/64, and deployment READY. GitHub/Vercel status for 2556914b4c16d9b27b2ca96f3f88432f92db1c6e is success. Fetch smoke checks returned 200 plus matching X-Passage-Commit for `/`, `/urgent`, `/funeral-home`, `/funeral-home/sample-case`, `/participating`, `/vendors`, `/care-providers`, `/funeral-home/dashboard?demo=1`, `/vendors/request?demo=1&demoTour=funeral-home&demoStep=vendor`, and `/system/admin/saas-roadmap`.
- Failed/blocked: original Cycle 1 release build failed before deploy because `pages/system/admin/saas-roadmap.js` used an unescaped apostrophe in the owner-only roadmap copy (`Today's risk`). The plural `/funeral-homes` route returns 404; the canonical route is `/funeral-home`. Fetch-only checks cannot prove hydrated/authenticated flows: `/funeral-home/dashboard?demo=1` server-rendered the funeral-home sign-in state, `/vendors/request?...` server-rendered `Loading request...`, and `/system/admin/saas-roadmap` server-rendered `Loading owner roadmap...` due auth/client-side loading. Local shell was unavailable in this Codex session, so checks used the GitHub and Vercel connectors rather than local `npm run agent:check`.
- Next action: run real browser/Chrome hydrated QA with seeded/demo or authenticated state for funeral-home director dashboard, employee assigned work, family invited-by-funeral-home, vendor request accept/update/quote/complete, reports/export proof, and System Admin roadmap. If any of those fail, Product Manager should re-scope Cycle 1 instead of stacking another deploy; also decide whether `/funeral-homes` should redirect to `/funeral-home`.

### 2026-06-19 - Release train auto-advance hardening

- Date/time: 2026-06-19 19:30 America/New_York.
- Branch/commit(s): main docs commits 4933a517, e2378681, adee0631, fc674b3, e74eb0f, and this context update.
- Files changed: AGENTS.md, docs/release-train.md, docs/agents/product-manager.md, docs/agents/deploy-agent.md, docs/deployment-discipline.md, docs/agent-operating-context.md.
- Deployed: no. All changes are documentation/process updates with [skip deploy]. Latest production remains repair commit 2556914b4c16d9b27b2ca96f3f88432f92db1c6e on dpl_XcLo42Wp2KawTPMAz3wf2MsAVPGe.
- Tested: documentation reviewed via GitHub fetch/update path. No local `npm run agent:check` because local shell remained unavailable in this Codex session.
- Failed/blocked: none for docs. The underlying release remains PARTIAL until hydrated browser QA proves director, employee, vendor request, reports/export, and owner roadmap flows.
- Next action: auto-advance to Product Manager scope for the next smallest cycle: make hydrated post-deploy QA runnable/provable and fix the `/funeral-homes` plural route mismatch unless Product Manager finds a reason to split it.
- Auto-advance decision: continue to Product Manager automatically. Do not pause for owner approval unless the next implementation requires credentials/auth, destructive production action, spending money, or legal/compliance/privacy/security judgment.

### 2026-06-19 - Cycle 2 QA-enablement release blocked by Vercel rate limit

- Date/time: 2026-06-19 19:48 America/New_York.
- Branch/commit(s): main. Docs commit cf196bb1db253ec599e9a10adfa7d4be7258e798 (`docs(qa): add release-train demo proof paths [skip deploy]`); queued release commit 5c04986381385c8821f14282e757e2209ad71e0c (`fix(release): redirect plural funeral-home route [deploy] [qa-approved]`).
- Files changed: docs/funeral-home-flawless-qa.md and next.config.js.
- Deployed: no. GitHub combined status for 5c04986381385c8821f14282e757e2209ad71e0c is Vercel failure with target URL `https://vercel.com/thepassageappio-7018s-projects?upgradeToPro=build-rate-limit`. No new deployment appeared in the canonical Vercel project list; current production remains 2556914b4c16d9b27b2ca96f3f88432f92db1c6e on dpl_XcLo42Wp2KawTPMAz3wf2MsAVPGe.
- Tested: source-level review of next.config.js confirmed plural redirect rules are present on commit 5c04986381385c8821f14282e757e2209ad71e0c. docs/funeral-home-flawless-qa.md now lists stable proof paths and explicitly requires real browser hydration proof. scripts/vercel-ignore-build.js allows `[deploy] [qa-approved]`, so the deploy blocker is Vercel rate limit, not release marker logic.
- Failed/blocked: deploy blocked by Vercel build rate limit. Opera browser connector is unavailable in this session (`Browser not connected. Make sure to enable "Allow AI connection"...`). Local shell also remains unavailable, so `npm run agent:check` was not run.
- Next action: Product Manager/Deploy should wait for Vercel quota reset or owner plan/quota action, then deploy 5c04986381385c8821f14282e757e2209ad71e0c and run post-deploy QA. If browser connector remains unavailable, the next agent must use a connected browser/Chrome session or record the auth/tool gate instead of closing QA.
- Auto-advance decision: loop auto-advanced through PM, Development, QA source review, and Deploy. It is now blocked by true platform/tool gates: Vercel build rate limit and unavailable browser connector. Do not create more deploy-triggering commits until the Vercel gate clears.

### 2026-06-19 - Chrome hydrated QA correction

- Date/time: 2026-06-19 19:58 America/New_York.
- Branch/commit(s): production still 2556914b4c16d9b27b2ca96f3f88432f92db1c6e; queued redirect release still 5c04986381385c8821f14282e757e2209ad71e0c and not deployed because of Vercel build rate limit.
- Files changed: docs/agent-operating-context.md only.
- Deployed: no. This is a [skip deploy] context correction. Vercel production remains dpl_XcLo42Wp2KawTPMAz3wf2MsAVPGe.
- Tested: Chrome connected successfully. Current production hydrated director demo dashboard at `/funeral-home/dashboard?demo=1&persona=fh-director&demoTour=funeral-home&demoStep=dashboard`: no loading/sign-in shell, markers present for `Hudson Valley Funeral Group` and `My Day`. Employee demo dashboard at `/funeral-home/dashboard?demo=1&persona=fh-employee&demoTour=funeral-home&demoStep=task&role=staff&email=arranger@samplefuneralhome.example`: no loading/sign-in shell, markers present for `Demo staff member` and `assigned`. Vendor request demo at `/vendors/request?demo=1&persona=vendor&demoTour=funeral-home&demoStep=vendor`: no loading shell, markers present for `Livestream support`, `Send quote`, and `One request, not a family file`. Owner roadmap at `/system/admin/saas-roadmap`: hydrated for the current signed-in Chrome session with `SYSTEM ADMIN / SAAS ROADMAP`, `ARR TARGET`, `Director dashboard`, and `One roadmap only` visible. Current production `/funeral-homes` still returns 404, as expected until 5c04986381385c8821f14282e757e2209ad71e0c deploys.
- Failed/blocked: Vercel build rate limit still blocks the queued redirect release. Chrome console noise seen was from browser/extension messaging, not enough to mark a Passage app runtime blocker. Local `npm run agent:check` still not run because local shell is unreliable in this session.
- Next action: when Vercel build quota clears, deploy 5c04986381385c8821f14282e757e2209ad71e0c and verify `/funeral-homes` redirect plus X-Passage-Commit. Then re-run Chrome hydrated QA on the deployed commit and close Cycle 2 if redirect and persona pages pass.
- Auto-advance decision: loop is blocked only at Deploy by Vercel build-rate-limit. No further Development work is needed for this narrow Cycle 2 unless the queued deploy later fails build/runtime QA.

### 2026-06-19 - Deploy budget rule hardening

- Date/time: 2026-06-19 20:15 America/New_York.
- Branch/commit(s): main docs commits 6049fc43, b858308a, ea6b1ee2, 56e82b49, and this context update.
- Files changed: docs/deployment-discipline.md, AGENTS.md, docs/release-train.md, docs/agents/deploy-agent.md, docs/agent-operating-context.md.
- Deployed: no. All changes are documentation/process updates with [skip deploy]. Latest production remains 2556914b4c16d9b27b2ca96f3f88432f92db1c6e on dpl_XcLo42Wp2KawTPMAz3wf2MsAVPGe. Queued redirect release 5c04986381385c8821f14282e757e2209ad71e0c remains not deployed.
- Tested: checked official Vercel limits documentation: rate limits are hard limits that reset after duration; Hobby build limit is 32 builds per 3600 seconds and deployment limit is 100 per 86400 seconds. Documentation updated through GitHub connector.
- Failed/blocked: Vercel build rate limit still blocks the queued redirect release. No new deploy was attempted by this docs hardening.
- Next action: keep all prep [skip deploy] until Vercel quota clears. Then deploy the existing queued redirect commit if unchanged, or create one coherent release commit only if new code changed and the Deploy Budget Gate is satisfied.
- Auto-advance decision: return to Product Manager only for [skip deploy] consolidation while quota is blocked; Deploy must not create another deploy-triggering commit until the rate-limit gate clears or the owner explicitly approves plan/quota action.

### 2026-06-19 - Claude in Chrome self-service hardening

- Date/time: 2026-06-19 20:35 America/New_York.
- Branch/commit(s): main docs commits 520743eb, 3c0b7e61, fc98552e, and this context update. Automation `passage-release-train-loop` prompt was also updated.
- Files changed: AGENTS.md, docs/release-train.md, docs/agents/product-manager.md, docs/agent-operating-context.md. Automation prompt changed in Codex app.
- Deployed: no. All changes are documentation/process updates with [skip deploy]. Latest production remains 2556914b4c16d9b27b2ca96f3f88432f92db1c6e on dpl_XcLo42Wp2KawTPMAz3wf2MsAVPGe. Queued redirect release 5c04986381385c8821f14282e757e2209ad71e0c remains not deployed.
- Tested: automation prompt updated to include user-last-resort/self-service rule. Docs updated through GitHub connector. No production deploy attempted.
- Failed/blocked: Vercel build rate limit may still mark [skip deploy] docs commits as failed status noise. This did not represent an intended production deploy.
- Self-service attempted / Claude in Chrome: no Claude-in-Chrome task was needed for this docs hardening. Rule now says future agents should try Claude in Chrome when safely available before owner escalation.
- Next action: scheduled loop should use docs as source of truth, try repo/connectors/browser/Chrome/Claude-in-Chrome self-service before owner escalation, and wait for Vercel quota before deploying the queued redirect release.
- Auto-advance decision: no product development should start solely from this instruction update. The next scheduled release-train run can continue from Product Manager with the owner-last-resort rule active.
