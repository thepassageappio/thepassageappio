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

Canonical Vercel project:

- Project ID: prj_b7CKwanQaKwFQSHInr3l6wsZy9nD
- Team ID: team_X0ta3bEEbRVGNM9xOwdBtCga

Current production: 2556914b4c16d9b27b2ca96f3f88432f92db1c6e, fix(release): repair roadmap build blocker [deploy] [qa-approved]. Deployed to dpl_XcLo42Wp2KawTPMAz3wf2MsAVPGe in the canonical Vercel project and serving on www.thepassageapp.io with X-Passage-Commit matching 2556914b4c16d9b27b2ca96f3f88432f92db1c6e.

Queued release not deployed: 5c04986381385c8821f14282e757e2209ad71e0c, fix(release): redirect plural funeral-home route [deploy] [qa-approved]. GitHub/Vercel status is failure because the canonical Vercel project is at build rate limit. Do not create more deploy-triggering commits until the Vercel gate clears.

Previous green rollback candidate: f1b928b8755f2a965b18bacddaccf1adbadc8fd9, release: deploy persona navigation and task action clarity [deploy].

## Current Release Train

Required loop: Product Manager Agent -> Development Engineer Agent -> QA Agent -> Deploy Agent -> repeat.

Auto-advance rule: once the train starts, do not stop after a role handoff if the handoff names an unresolved next role and the agent has useful work it can do. Deploy PASS returns to Product Manager for the next item. Deploy PARTIAL, failed post-deploy QA, fetch-only proof for hydrated flows, build failure, or runtime failure returns immediately to Product Manager for re-scope. Pause only for true owner gates: credentials/auth the agent cannot access, destructive production data changes, spending money, or legal/compliance/privacy/security decisions.

Dedicated role briefs:

- docs/agents/product-manager.md
- docs/agents/development-engineer.md
- docs/agents/qa-agent.md
- docs/agents/deploy-agent.md

Current cycle: Cycle 2 Deploy blocked by Vercel build rate limit.

Current batch status: Cycle 2 Product Manager and Development handoffs are complete for QA-enablement/release-closure. Source changes added stable demo proof paths to docs/funeral-home-flawless-qa.md and added Next.js redirects for `/funeral-homes` and nested plural paths to canonical `/funeral-home`. Deployment is not complete because Vercel rejected the deploy with build-rate-limit status before a deployment object appeared in the canonical project list.

Current Product Manager scope: do not add new product surface while deploy quota is blocked. When the Vercel rate-limit gate clears, Deploy Agent should re-trigger or otherwise get 5c04986381385c8821f14282e757e2209ad71e0c deployed, then QA must verify the plural redirect, X-Passage-Commit, and real browser hydrated demo paths from docs/funeral-home-flawless-qa.md. If browser/Chrome is unavailable in the agent environment, record the exact connector/auth gate instead of marking hydrated QA complete.

Failure rule: if QA fails, the next step is Product Manager re-scope before more development. A batch gets a maximum of 3 cycles before it must be split, de-scoped, or escalated instead of deployed.

Deploy rule: only use [deploy] [qa-approved] after context is updated, roadmap is current, QA passes, and Vercel canonical project is confirmed.

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
2. Once Vercel can build again, deploy queued commit 5c04986381385c8821f14282e757e2209ad71e0c or make a new coherent release commit only if code changed again.
3. Verify `/funeral-homes` redirects to `/funeral-home` and nested plural paths redirect to singular nested paths.
4. Run real browser/Chrome QA after deploy for persona-by-persona testing:
   - Public landing and nav.
   - Urgent path.
   - Funeral-home sales page.
   - Funeral-home director dashboard.
   - Funeral-home employee assigned work.
   - Family invited by funeral home.
   - Vendor request acceptance/update/quote/completion.
   - Reports/export proof.
   - System Admin owner roadmap after auth.
5. If browser/Chrome connector is unavailable, record that as a tool/auth gate and do not mark hydrated QA complete.
6. Sanity-check that System Admin visibly has one canonical roadmap and every other admin page is clearly evidence, QA, or tooling.
7. Confirm old /system/admin/sprint-2 links no longer look like a competing roadmap.
8. Keep logging any finding here before handing off, and state whether the train auto-advanced or why it could not.

## Known Watch Items

- Google sign-in and general button behavior recently showed issues and needs live browser QA.
- Smart address/location lookup during green-path onboarding was reported broken or confusing.
- Vercel rate limits were hit again on Cycle 2 release commit 5c04986381385c8821f14282e757e2209ad71e0c.
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
- Failed/blocked: deploy blocked by Vercel build rate limit. Opera browser connector is unavailable in this session (`Browser not connected. Make sure to enable "Allow AI connection"...`), so hydrated browser QA cannot be honestly completed here. Local shell also remains unavailable, so `npm run agent:check` was not run.
- Next action: Product Manager/Deploy should wait for Vercel quota reset or owner plan/quota action, then deploy 5c04986381385c8821f14282e757e2209ad71e0c and run post-deploy QA. If browser connector remains unavailable, the next agent must use a connected browser/Chrome session or record the auth/tool gate instead of closing QA.
- Auto-advance decision: loop auto-advanced through PM, Development, QA source review, and Deploy. It is now blocked by true platform/tool gates: Vercel build rate limit and unavailable browser connector. Do not create more deploy-triggering commits until the Vercel gate clears.
