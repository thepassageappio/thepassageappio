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

Current production: 2556914b4c16d9b27b2ca96f3f88432f92db1c6e, fix(release): repair roadmap build blocker [deploy] [qa-approved]. Deployed to dpl_XcLo42Wp2KawTPMAz3wf2MsAVPGe in the canonical Vercel project and serving on www.thepassageapp.io with X-Passage-Commit matching 2556914b4c16d9b27b2ca96f3f88432f92db1c6e.

Queued release not deployed: 5c04986381385c8821f14282e757e2209ad71e0c, fix(release): redirect plural funeral-home route [deploy] [qa-approved]. GitHub/Vercel status is failure because the canonical Vercel project is at build rate limit. Do not create more deploy-triggering commits until the Vercel gate clears.

Previous green rollback candidate: f1b928b8755f2a965b18bacddaccf1adbadc8fd9, release: deploy persona navigation and task action clarity [deploy].

## Current Release Train

Required loop: Product Manager Agent -> Development Engineer Agent -> QA Agent -> Deploy Agent -> repeat.

Auto-advance rule: once the train starts, do not stop after a role handoff if the handoff names an unresolved next role and the agent has useful work it can do. Deploy PASS returns to Product Manager for the next item. Deploy PARTIAL, failed post-deploy QA, fetch-only proof for hydrated flows, build failure, runtime failure, or rate-limit gate returns immediately to Product Manager for re-scope or [skip deploy] consolidation. Pause only for true owner gates: credentials/auth the agent cannot access after safe browser/Chrome/Claude-in-Chrome paths were tried, destructive production data changes, spending money/plan approval, or legal/compliance/privacy/security decisions.

Self-service rule: user is last resort. Before asking the owner to restart, decide, click, verify, research, or unblock, agents must try safe available paths: repo docs, source review, tests/builds, GitHub/Vercel connectors, browser/Chrome automation, and a signed-in Claude session in Chrome when available. Claude in Chrome may assist with research, handoff review, agent-to-agent coordination, or authenticated browser-state checking, but it must not bypass Agent Permissions, spend money, reveal/request secrets, send real communications, make destructive production changes, or decide legal/privacy/security/compliance matters. Record whether Claude in Chrome was available or used.

Dedicated role briefs:

- docs/agents/product-manager.md
- docs/agents/development-engineer.md
- docs/agents/qa-agent.md
- docs/agents/deploy-agent.md

Current cycle: Cycle 2 Deploy blocked by Vercel build rate limit.

Current batch status: Cycle 2 Product Manager and Development handoffs are complete for QA-enablement/release-closure. Source changes added stable demo proof paths to docs/funeral-home-flawless-qa.md and added Next.js redirects for `/funeral-homes` and nested plural paths to canonical `/funeral-home`. Deployment is not complete because Vercel rejected the deploy with build-rate-limit status before a deployment object appeared in the canonical project list.

Chrome hydrated QA against current production 2556914b4c16d9b27b2ca96f3f88432f92db1c6e: director demo dashboard, employee demo dashboard, vendor request demo, and owner roadmap all hydrated past loading/sign-in shells. The plural `/funeral-homes` route still returns 404 in current production because queued redirect commit 5c04986381385c8821f14282e757e2209ad71e0c has not deployed.

Current Product Manager scope: do not add new product surface while deploy quota is blocked. When the Vercel rate-limit gate clears, Deploy Agent should re-trigger or otherwise get 5c04986381385c8821f14282e757e2209ad71e0c deployed, then QA must verify the plural redirect, X-Passage-Commit, and real browser hydrated demo paths from docs/funeral-home-flawless-qa.md.

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
- Added `/funeral-homes` -> `/funeral-home` and `/funeral-homes/:path*` -> `/funeral-home/:path*` redirects in next.config.js; queued for deploy at 5c04986381385c8821f14282e757e2209ad71e0c but blocked by Vercel rate limit.
- Added a deploy-budget rule to AGENTS.md, docs/release-train.md, docs/deployment-discipline.md, docs/agents/deploy-agent.md, and this context file so agents batch two or three compatible small/medium fixes and stop creating deploy-triggering commits on Vercel quota gates.
- Added the owner-last-resort / Claude-in-Chrome self-service rule to the scheduled automation prompt, AGENTS.md, docs/release-train.md, docs/agents/product-manager.md, and this context file.

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

1. Do not create additional deploy-triggering commits until the Vercel build-rate-limit gate clears.
2. Keep any new docs, context, QA prep, or source consolidation commits [skip deploy] while quota is blocked.
3. Before asking the owner for help, try safe self-service paths including Chrome/browser automation and Claude in Chrome if available.
4. Once Vercel can build again, deploy queued commit 5c04986381385c8821f14282e757e2209ad71e0c or make a new coherent release commit only if code changed again and the Deploy Budget Gate is satisfied.
5. Verify `/funeral-homes` redirects to `/funeral-home` and nested plural paths redirect to singular nested paths.
6. Run real browser/Chrome QA after deploy for persona-by-persona testing:
   - Public landing and nav.
   - Urgent path.
   - Funeral-home sales page.
   - Funeral-home director dashboard.
   - Funeral-home employee assigned work.
   - Family invited by funeral home.
   - Vendor request acceptance/update/quote/completion.
   - Reports/export proof.
   - System Admin owner roadmap after auth.
7. Sanity-check that System Admin visibly has one canonical roadmap and every other admin page is clearly evidence, QA, or tooling.
8. Confirm old /system/admin/sprint-2 links no longer look like a competing roadmap.
9. Keep logging any finding here before handing off, and state whether the train auto-advanced or why it could not.

## Known Watch Items

- Google sign-in and general button behavior recently showed issues and needs live browser QA.
- Smart address/location lookup during green-path onboarding was reported broken or confusing.
- Vercel rate limits were hit again on Cycle 2 release commit 5c04986381385c8821f14282e757e2209ad71e0c.
- Deploy discipline now requires batching two or three compatible small/medium fixes where possible; docs/context/QA notes/source-only setup stay [skip deploy].
- Owner escalation should be last resort after repo docs, connectors, browser/Chrome, and Claude in Chrome have been tried where safe.
- Support email support@thepassageapp.io is not real and should not be shown as a direct support line.
- Internal ARR/300k/roadmap/sprint/QA language must never appear on external pages.
- Demo data has been near-empty before; the funeral-home demo loop must be seeded before claims are made.
- Fetch-only Vercel checks cannot prove hydrated client flows. Use Chrome/browser with auth or seeded demo state before marking director, employee, vendor request, roadmap, or reports/export complete.

## Handoff Format For Future Agents

Append or update this section before final response:

- Date/time:
- Branch/commit(s):
- Files changed:
- Deployed: yes/no, Vercel deployment URL/status:
- Tested:
- Failed/blocked:
- Self-service attempted / Claude in Chrome:
- Next action:
- Auto-advance decision:

## Latest Handoff Updates

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
