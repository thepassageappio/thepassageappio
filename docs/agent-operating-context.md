# Threshold six-route hydration P1 source candidate - 2026-07-21 05:40 -07:00

- Lane and base: separately governed Threshold/main production-maintenance lane from exact protected main `55d3334a12c7a372d4c207192e9f2970c760311e`; Passage Zero source, PR #24/#30, isolated Supabase, readiness scores, and Production data remain untouched.
- Prior role handoff: the owner-directed repository/language audit identified live hydration failures on `/pricing`, `/resources`, `/guides`, `/care-providers`, `/trust`, and `/mission`. PM selected this live conversion/reliability P1 ahead of more greenfield implementation without counting it as Passage Zero progress.
- Product Manager: `/root/pm_next_impactful_block`; PM Sprint Brief COMPLETE. Goal: remove the demonstrated shared hydration mismatch and preserve current public behavior. Requirements/components: six affected routes; clean comparisons on `/`, `/funeral-home`, and `/contact`; stable header/auth return path; global font delivery; 44x44 controls on the six scoped routes; deterministic prevention check. Acceptance: 1440/390/360, zero console/hydration/page/runtime errors, no blank page or overflow, exact query preservation, loaded Passage fonts, no copy/pricing/checkout/auth/analytics/route redesign. Dependencies: exact main base, existing `_document` font source, shared `SiteChrome`, current CSP and Vercel marker gate. Non-goals: Passage Zero features, legacy redesign, pricing, checkout, data/schema, Production configuration, family/vendor work, readiness-score changes, and comparison-route P2 accessibility repairs.
- PM FIX NOW dispositions: harden the regression to reject every `console.error`/`pageerror` and either target dimension under 44px; allow only `https://fonts.gstatic.com` in `font-src`; make scoped shared-footer links at least 44x44; remove redundant Google font imports from `/contact` and `/funeral-home`; and, after dedicated review exposed the global stylesheet requirement, allow only `https://fonts.googleapis.com` in `style-src`. The last bounded PM resolution was recorded by `/root` because the dedicated PM agent thread limit was exhausted; source inspection proved `_document` loads that exact stylesheet. No wildcard or other CSP directive changed, so no material security/owner gate was introduced.
- UI/UX Review: `/root/ux_threshold_hydration_p1` PASS TO ENGINEERING WITH CONDITIONS. Preserve headings, CTAs, prices, actions, warm Passage presentation, auth meaning, and comprehension. Require stable server/first-client DOM, 1440/390/360 reflow/focus/target checks, and no speculative redesign.
- Development Engineering: `/root/engineering_threshold_hydration_p1` implemented the root-cause correction and prevention gate; it was interrupted only after a Windows patch operation stalled. Replacement `/root/engineering_threshold_hydration_finish` completed the two already-authorized legacy import removals. Files changed before docs: `components/SiteChrome.js`, `components/CareProviderLanding.js`, `pages/pricing.js`, `pages/resources.js`, `pages/guides.js`, `pages/trust.js`, `pages/mission.js`, `pages/contact.js`, `pages/funeral-home/index.js`, `next.config.js`, and new `scripts/check-threshold-hydration-p1.js`.
- Root cause and repair: raw route-level font-style content encoded differently between server HTML and the client, while shared chrome also read the browser URL during render. Redundant imports were removed in favor of `_document`; exact browser pathname/query is read only after hydration; query-bearing sign-in returns remain intact; the CSP permits only the two required Google font hosts; and shared/scoped control geometry meets the release bar. No suppress-hydration escape hatch or SSR disablement was used.
- Independent QA: `/root/qa_threshold_hydration_p1` PASS for source candidate. Exact 11-file source/test scope; optimized Next 14.2.35 build 69/69; hardened production-server matrix 10 navigations x 3 viewports PASS; zero console, page, hydration, runtime, blank-page, or overflow errors; Inter/Fraunces loaded; six scoped routes meet 44x44; `/pricing?participant=1` preserves `/login?next=%2Fpricing%3Fparticipant%3D1`; governance and persona-language checks PASS. This is source QA, not hosted or Production approval.
- Dedicated Merge/Code Review: `/root/review_threshold_hydration_p1` PASS for draft publication eligibility on the final 11-file source/test candidate. It confirmed narrow CSP hosts, deterministic first render, exact query recovery, durable test coverage, no broader CSP change, and no copy, pricing, checkout, auth-command, analytics, route, data, schema, privacy, or visual-design drift.
- Deploy: `/root/deploy_threshold_hydration_p1` PARTIAL by design. Canonical project/team confirmed; main had not moved; Production remains READY on `dpl_3rAyuahrHAqcoH5KJLykL6mR2JSR` at source `3d881fde684fcc8cfdf5a828d2df87366364175a`; runtime error clusters/logs were clean but cannot prove client hydration; no quota blocker and deploy budget is clear. Required next step is a Bot-authored non-production Preview, then hosted 1440/390/360 proof before merge. Rollback remains that READY Production deployment.
- Backlog/roadmap: pre-existing undersized controls on `/`, `/funeral-home`, and `/contact`, plus pre-existing missing visible focus on `/guides` name/email inputs, are P2 accessibility follow-up in the canonical roadmap. They are not P1 regressions and must ship as a later bounded Bot-authored packet.
- Repository consolidation completed this cycle: PRs #17, #19, #23, and #25 were commented and closed as superseded/incorporated. Their unique Transfer Pass consent/security and deterministic demo-reset requirements remain future Passage Zero inputs; stale branches/migrations do not merge independently. Open drafts are now PR #24 and PR #30.
- QA/deploy plan: add this context and the single roadmap backlog line, publish a Passage Release Bot-authored draft from exact main with `[deploy] [qa-approved]` to obtain a non-production Preview, require trusted current-head candidate/Independent QA/Dedicated Merge Review checks, then run hosted browser proof on all scoped routes at 1440/390/360. A failed hosted check returns to PM; no merge or Production claim is allowed.
- Owner gates: no owner gate for source correction, Bot draft PR, or non-production Preview. The remaining true gate is protected Production authorization for the exact release commit after hosted PASS and exact-head trusted checks. Production, pricing, real communications, irreversible data, and material legal/privacy/security claims remain untouched.
- Auto-advance: PM -> UX -> Engineering -> Independent QA -> Dedicated Review -> Deploy-prep completed. The train is advancing to Bot publication and hosted Preview QA; it has not stopped at source PASS.

# Post-bootstrap trusted-contract validation cycle — 2026-07-19 12:45 -07:00

- Prior protected result: governance PR #28 passed exact-head Independent QA and Dedicated Merge Review App checks, was released from draft only after those checks, and GitHub completed the Bot-enabled protected squash auto-merge. The resulting main commit is `8856515b7f7b0962cb168ce3e8f5fd16319887a3`.
- Dedicated identities: Passage Release Bot authors branches, commits, and pull requests; Passage QA Reviewer emits only the independent-QA check; Passage Release Reviewer emits only the merge-review check; Passage Production Reviewer emits only the separate release-readiness check. The four GitHub Apps are distinct and least-privileged.
- Merge authority: no founder or human merge-review dependency remains. The exact-head Independent QA and Dedicated Merge Review checks are the technical merge gates; true owner gates remain only where `AGENTS.md` explicitly requires them, including Production authorization when applicable.
- Live protection: the main ruleset requires a protected, up-to-date pull request with resolved conversations, denies force-push/deletion and bypass, and pins required check names to their expected GitHub App sources. The harmless validation PR in this cycle must now prove the base-defined `Passage Governance / trusted-contract` path before product work relies on it.
- Deploy truth: every PR #28 candidate commit used `[skip deploy]`; Vercel canceled at the Ignore Build Step, created no Preview or Production deployment, and Production remained unchanged.
- Product Manager `/root`: **COMPLETE** for post-bootstrap validation. Sprint goal: prove the merged trusted governance contract and live source-pinned rules on one harmless Bot-authored pull request.
- Requirements and components: branch from the exact main squash commit; change only this living context; use the Passage Release Bot; keep the pull request draft with QA NOT RUN, Dedicated Merge Review required, Production NOT REQUESTED, Owner Gate NOT REQUIRED, and Deploy NOT APPROVED; collect current-head candidate, trusted-contract, Independent QA, Merge Review, and deploy-suppression evidence in later role handoffs.
- Development objectives and acceptance criteria: one-file context diff, one `[skip deploy]` commit, Bot PR authorship, exact PR/branch head alignment, no source or check spoofing, and no workflow, product, Cycle 8, database, Vercel configuration, Production, pricing, family/vendor, or readiness change.
- Dependencies: main commit `8856515b7f7b0962cb168ce3e8f5fd16319887a3`, the merged base-defined workflows and identity contract, the live main ruleset, and the four installed GitHub Apps.
- UX Review: **N/A** because this is an internal context-only governance proof with no rendered surface or persona copy.
- Development Engineer `/root/engineering_validation_fast`: received the complete PM brief and is authorized to create the bounded Bot branch, commit, and draft PR only. QA, Dedicated Merge Review, and Deploy decisions remain pending and may not be self-approved by Engineering.
- QA plan: independently verify exact base/head, Bot author, one-file diff, body structure, current-head checks and expected App sources, live ruleset enforcement, and no Product or Production mutation. Dedicated Merge Review then challenges the same exact head.
- Deploy plan: verify Vercel cancels the `[skip deploy]` commit and that no Preview or Production deployment occurs. Production Review remains not requested.
- Risks and recovery: stale checks, unexpected App source, branch/head drift, candidate-controlled trust, or an unintended deployment returns the cycle to Product Manager and blocks readiness. Close or supersede a misbound PR rather than relabeling evidence.
- Non-goals and readiness: no application, roadmap score, Cycle 8, Supabase, Vercel configuration, Production, pricing, family access, vendor fulfillment, or legal/privacy/security claim changes. Funeral-home and D2C readiness remain unchanged.
- Next roles: Independent QA, Dedicated Merge Review, then Deploy. No owner gate is required for this non-production governance validation.

# Dedicated-agent governance correction — 2026-07-19 11:30 -07:00

- Product Manager: `/root/pm_governance_consolidation`; dedicated Author, Independent QA, Merge Review, and Production Review identities approved.
- UX Review: N/A; governance-only.
- Engineering: Bot-authored governance candidate; no product/runtime/database/deployment changes.
- Independent QA: exact-head external check required from App `passage-qa-reviewer`.
- Dedicated Merge Review: exact-head external check required from App `passage-release-reviewer`.
- Deploy: `[skip deploy]`; Production remains closed.
- PR #25 is expired. PRs #26 and #27 are closed/superseded because GitHub did not bind their live heads to later Bot branch updates. PR #28 is the only active governance bootstrap and must remain draft until exact-head checks pass.
- No founder/human merge-review dependency remains. True owner gates remain only for the explicit `AGENTS.md` permission list.
- Passage Zero PR #24 remains draft; Cycle 8 remains FAIL/PARTIAL and untouched.

# Passage Agent Operating Context

Last updated: 2026-07-12

This is the living handoff for future agents. Read AGENTS.md first, then this file, before changing the product. Update this file before final handoff or before creating a deploy-triggering commit.

Magic phrase for a fresh Codex chat: `Passage Release Train: start the loop.`

## Current Objective

Make Passage a clear, enterprise-grade funeral-home coordination SaaS capable of supporting a $300k ARR business within one year, with B2B funeral homes as the wedge and B2C family experiences made easier by strong funeral-home workflows.

The product must be smart underneath and simple on the surface: one owner, one waiting point, one next action, one prepared output, one proof trail, and one clear communication boundary across families, funeral-home directors, employees, vendors, care providers, participants, and system admins.

## Canonical Sources

- Agent rules: AGENTS.md
- Agent handoff/status: docs/agent-operating-context.md
- Canonical roadmap: `docs/product/operational-readiness-roadmap.md`; any legacy `/system/admin/saas-roadmap` surface is historical until a secure App Router System Admin view renders the canonical source.
- Deployment discipline: docs/deployment-discipline.md
- Funeral-home QA script: docs/funeral-home-flawless-qa.md

Do not create a second roadmap. Older repo docs and the legacy Pages Router roadmap are historical evidence only; `docs/product/operational-readiness-roadmap.md` and this living context are the current operating truth.

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

Current production: c86ee14a9573f943ea280d82fb4936382c2e9c55, release: fix(auth): keep /today family sign-in returns coherent [deploy] [qa-approved]. Deployed on July 3, 2026 to `dpl_FkT6rtY8qJWVfcNzAxWq5fbLUcEZ` in the canonical Vercel project and aliased to `www.thepassageapp.io`, `thepassageapp.io`, and the Vercel production aliases.

Queued release not deployed: none from current GitHub/Vercel production metadata. The `/today` family-auth consistency batch is now live on production.

Previous green rollback candidate: 67b71e8c11bec2ccd05b0dfe089225bfd8640686, release: full homepage redesign (new UX+visual) [deploy] [qa-approved].

Workspace drift alert: the scheduled-run checkout at `C:\Users\steve\Documents\GitHub\thepassageappio` is behind `origin/main` by 51 commits and still contains a dirty `pages/participating.js` working-tree diff that resolves clean under `git diff --ignore-space-at-eol`. Preserve that file state and do not reset or rebase that checkout blindly. Future code work should continue from a clean worktree on `origin/main` unless that dirty state is intentionally reconciled.

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

Current cycle: 2026-07-03 post-deploy closeout for the `/today` family-auth consistency release, then Product Manager re-scope onto the next highest-leverage family surface.

Current batch status: production is green on commit `c86ee14a9573f943ea280d82fb4936382c2e9c55`, and July 3, 2026 verification proved the intended return-path behavior across the four required seams: `/today` now requests `/auth/google?next=%2Ftoday`, `/today?legacy=1` now renders shared-header sign-in as `/login?next=%2Ftoday%3Flegacy%3D1`, `/login?next=%2Ftoday` now server-renders `Continue with Google -> /auth/google?next=%2Ftoday`, and `/auth/google?next=%2Ftoday` now server-renders `Use login page -> /login?next=%2Ftoday`. No queued family-auth release remains.

Vercel evidence on July 3, 2026: canonical project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD` now shows latest production deployment `dpl_FkT6rtY8qJWVfcNzAxWq5fbLUcEZ` READY on commit `c86ee14a9573f943ea280d82fb4936382c2e9c55`. GitHub combined-status checks report `Vercel: success` with description `Deployment has completed`, `get_project` reports the same deployment as the latest production target, and production runtime logs show no error/fatal entries for that deployment.

Current Product Manager scope: deploy PASS. Return immediately to Product Manager and scope the next highest-leverage family-facing batch, with `/estate` calm migration and auth-entry consistency as the leading candidate unless fresher production evidence surfaces a more urgent seam.

Current PM Sprint Brief: status COMPLETE for the deployed family-auth consistency batch. Sprint goal met: Passage now preserves the intended family return path across calm `/today`, the legacy rollback seam, `/login`, and `/auth/google`. No new PM sprint brief is open yet; the next PM action is to scope `/estate` calm migration/auth-entry consistency, define acceptance, and decide whether it should batch with one or two compatible family workflow fixes before another deploy slot.

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

1. Apply the v2 visual-craft standard (docs/redesign/08-visual-craft-standard.md) to the three Threshold mockup files still at v1 flat styling: docs/redesign/hero-screens-mockup.html, docs/redesign/funeral-home-demo-path-mockups.html, and docs/redesign/admin-and-vendor-portal-mockups.html. These predate the 2026-07-12 v2 craft pass on 01-design-system-foundation.html (layered shadows, pill-radius scale, gradient buttons, inline SVG icons, glass sticky nav, refined type scale, hover/lift micro-interactions) and still use flat color-box icon placeholders and flat surfaces that the owner explicitly flagged as substandard. This is UX Review / design-system work; no app code, no deploy implication.
2. Before asking the owner for help, keep trying safe self-service paths: repo docs, local checks, Vercel/GitHub connectors, and browser/Chrome automation when available.
3. Preserve the stale scheduled-run checkout at `C:\Users\steve\Documents\GitHub\thepassageappio`; continue product work from the clean `origin/main` worktree unless the dirty `pages/participating.js` state is intentionally reconciled first.
4. Start Product Manager discovery for the next family-facing batch, with `/estate` calm migration/auth-entry consistency as the first candidate; the Threshold redesign work (items 1 above) is currently running in parallel as owner-directed UX Review work outside that loop.
5. Keep using live browser QA plus direct HTML/header checks after every family-auth deploy; this run proved the four `/today` route-preservation seams and should be the template for the next family workflow batch.
6. Re-run authenticated browser QA for full family sign-in completion when a safe session path is available. This run proved route preservation and post-deploy production behavior, not a complete signed-in family session.
7. Keep logging any finding here before handing off, and state whether the train auto-advanced or why it could not.

## Known Watch Items

- Family route-consistency watch item resolved on July 3, 2026: production commit `c86ee14a9573f943ea280d82fb4936382c2e9c55` now preserves `/today` through calm entry, `/today?legacy=1` shared-header sign-in, `/login?next=%2Ftoday`, and `/auth/google?next=%2Ftoday`. Remaining auth QA should focus on successful end-to-end sign-in completion with a safe session, not return-path routing.
- Browser-tool watch item: Opera browser connector was unavailable in this session (`Browser not connected...`). No signed-in Chrome or Claude-in-Chrome path was available.
- Local-env watch item: this worktree has no `.env*` file and no exported `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, so calm family auth cannot complete end to end locally. `AppCalm` now degrades safely instead of crashing, which is enough for browser proof of the auth-entry URLs, but not for real sign-in completion.
- Workspace drift watch item: the scheduled-run checkout is 51 commits behind `origin/main` and contains a dirty `pages/participating.js` line-ending-only diff. Do not reset that checkout blindly.
- Cycle 0 LF normalization from the calm rebuild docs is still outstanding in a push-capable writable checkout.
- Smart address/location lookup during green-path onboarding was reported broken or confusing. Current source adds native full-address datalist recommendations across shared SmartAddressInput usages, but live Google suggestions still require `GOOGLE_PLACES_API_KEY` or `GOOGLE_MAPS_API_KEY` in Vercel production.
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

### 2026-07-12 - Threshold UX redesign docs backfilled, funeral-home + admin/vendor mockups added, v2 visual-craft standard introduced (agent-context catch-up)

- Date/time: 2026-07-12 (retroactive catch-up entry; underlying commits span roughly 2026-07-12T18:50Z-19:13Z).
- Branch/commit(s): main, docs-only commits: e7ad585d9dd390c72f0043c23fd84b6d3075c845 (rebuild Threshold artifacts [skip deploy]), 776d2a4edf24b97a7b58b6d5c61fc500cebca4fb + aa2e9d72d79b1f162d9719540e0d0c8c0ccdf48d (placeholder-content corrections [skip deploy]), 70d7b7d9fd782fd4e2bc6f473259b7cc87ac47bf (hero-screens-mockup.html [skip deploy]), 47c0247418afb268fa66c3116dbfcb2c97646445 (funeral-home-demo-path-mockups.html, no [skip deploy]), b1ef9803b23b61ae314e8768c1e4dd3d0b595691 (admin-and-vendor-portal-mockups.html, no [skip deploy]), ef1143f3ede8daa18b02987add83686850222ae3 (01-design-system-foundation.html v2 visual-craft pass, no [skip deploy]), 082f8666e70e0cd3993e35ae43fa60acd1e99061 (08-visual-craft-standard.md, no [skip deploy]), 970477dce9ae80bebf0af60084bbbe787f606a0c (UX-REDESIGN-BRIEF.md pointer + craft-standard requirement, no [skip deploy]). All changes are confined to docs/redesign/ and docs/UX-REDESIGN-BRIEF.md; no app code touched.
- Role instance / delegated agent: UI/UX Review role only (design-system/mockup authoring); no Product Manager, Development Engineer, QA, or Deploy role instance was engaged because no app code changed.
- Prior role handoff received: 2026-07-03 family auth consistency deploy PASS handoff (Product Manager scoped `/estate` as the next candidate; that scope remains open and is unaffected by this docs-only work).
- PM Sprint Brief: N/A — this was owner-directed design-system/visual-quality work, not a PM-scoped development sprint.
- Sprint goal: N/A. Requirements: N/A. Sprint components: N/A. Development objectives: N/A. Acceptance criteria: N/A. Dependencies: N/A. QA/deploy plan: N/A (UX Review / design-artifact work, not a Development Engineer change).
- Files changed: docs/redesign/00-system-findings.md, 01-design-system-foundation.html (rebuilt, then rewritten again as v2), 02-information-architecture.md, 03-journey-maps.md, 04-wireframes-annotated.md, 05-task-spine-coordination-logic.md, 06-admin-access-demo-instance.md, 07-sprint-plan.md, hero-screens-mockup.html, funeral-home-demo-path-mockups.html (new), admin-and-vendor-portal-mockups.html (new), 08-visual-craft-standard.md (new); docs/UX-REDESIGN-BRIEF.md (updated to point at docs/redesign/ in-repo as the durable source of truth and to require reading 08-visual-craft-standard.md alongside the brief).
- UI/UX status: Mixed / in progress. Owner (Steve) reviewed the initial mockups and gave direct visual-quality feedback that they "looked like shit" and needed to be "much sleeker apple with empathy." In response, 01-design-system-foundation.html was rewritten as v2 with real visual craft: layered soft shadows, generous pill-radius scale, gradient buttons with depth, inline SVG icons (replacing flat color-box placeholders), glass sticky nav, refined type scale with negative letter-spacing, and hover/lift micro-interactions. 08-visual-craft-standard.md now codifies this as a mandatory checklist for all future Threshold deliverables. hero-screens-mockup.html, funeral-home-demo-path-mockups.html, and admin-and-vendor-portal-mockups.html are still at v1 flat styling and have NOT yet had the v2 pass applied — see Open Work item 1.
- Development: N/A (docs/design artifacts only, no app code changed).
- Best-practice research: none beyond direct owner feedback; this was a visual-craft response to explicit human review rather than an external research pass.
- Deployed: N/A (no app code, no deploy-triggering change). Every commit above is docs-only; four of the nine carried `[skip deploy]`, but five (47c0247, b1ef980, ef1143f, 082f866, 970477d) did not include `[skip deploy]` and also did not update this context file at commit time, which tripped `scripts/check-agent-context.js` and failed the "Agent release train guard - main" GitHub Action. This entry is the catch-up fix for that gate failure; no code or deploy behavior was affected by the gate failure itself.
- Tested: N/A — pure markdown/HTML design artifacts, no build, no app code, no QA loop applies.
- Failed/blocked: CI gate (`scripts/check-agent-context.js`) was red on `main` going into this entry because the commits listed above changed "meaningful" files without updating docs/agent-operating-context.md and without `[skip deploy]`. Resolved by this commit.
- Self-service attempted / Claude in Chrome: repo/source review via GitHub MCP tools (`get_file_contents`, `list_commits`) to reconstruct the commit history and confirm which commits tripped the gate. Claude in Chrome was not used/needed for this docs-only catch-up.
- Next action: apply the v2 visual-craft standard (docs/redesign/08-visual-craft-standard.md) to the three remaining v1-styled mockup files — hero-screens-mockup.html, funeral-home-demo-path-mockups.html, and admin-and-vendor-portal-mockups.html — so all Threshold mockups meet the same visual bar before the redesign moves back into the Product Manager -> UI/UX -> Development Engineer loop for implementation.
- Auto-advance decision: Held at UX Review. This was owner-directed design-system work outside the standard release train; the standard Product Manager -> UI/UX -> Development -> QA -> Deploy loop resumes once the Threshold mockups are visually consistent and Product Manager scopes them (or the `/estate` batch) into a development sprint.

### 2026-07-03 - Family auth consistency release deployed and verified

- Date/time: 2026-07-03 13:24 -04:00.
- Branch/commit(s): production release commit c86ee14a9573f943ea280d82fb4936382c2e9c55 (ix(auth): keep /today family sign-in returns coherent [deploy] [qa-approved]), deployed to canonical Vercel deployment dpl_FkT6rtY8qJWVfcNzAxWq5fbLUcEZ. Source-prep branch codex/today-route-consistency remains preserved locally at 1fd09fb8c49ba11ec5373dd340f8d8a886cd38d6 with the full docs handoff. Scheduled-run checkout C:\Users\steve\Documents\GitHub\thepassageappio remains stale local main with preserved unrelated drift and was not mutated.
- Role instance / delegated agent: explicit in-session Product Manager, UI/UX Review, Development Engineer, QA, and Deploy contexts only; true sub-agent delegation was unavailable in this run.
- Prior role handoff received: 2026-07-03 family-auth release-candidate handoff with QA PASS and Deploy READY.
- PM Sprint Brief: COMPLETE for the deployed family-auth consistency batch. The next PM scope is not started yet.
- Product Manager scope: Deploy PASS. Return to Product Manager and scope the next highest-leverage family-facing batch, with /estate calm migration/auth-entry consistency currently the leading candidate.
- UI/UX status: PASS. The family sign-in flow now keeps route context across entry, recovery, and rollback seams instead of dropping users onto public or generic login surfaces.
- Best-practice research: repo/source review across the family auth-entry files; current GitHub commit-status evidence; current Vercel canonical project/deployment/runtime-log evidence; direct production HTML/header checks; live Playwright verification on production; and current Next.js request-time rendering behavior via getServerSideProps for query-dependent server HTML.
- Development handoff: release commit carried six source-file changes only: components/App.js, components/AppCalm.js, components/SiteChrome.js, components/family/FamilyTodayApp.js, pages/auth/google.js, and pages/login.js. No schema, API, or data-model changes.
- Files changed in deployed release: components/App.js, components/AppCalm.js, components/SiteChrome.js, components/family/FamilyTodayApp.js, pages/auth/google.js, pages/login.js.
- Tested: GitHub status for c86ee14 -> Vercel: success; Vercel get_project -> latest production deployment dpl_FkT6rtY8qJWVfcNzAxWq5fbLUcEZ READY; X-Passage-Commit headers on https://www.thepassageapp.io/today, /today?legacy=1, /login?next=%2Ftoday, and /auth/google?next=%2Ftoday all match c86ee14a9573f943ea280d82fb4936382c2e9c55; direct HTML fetches prove prod-login-preserves-next and prod-auth-fallback-preserves-next; Playwright on production shows Continue with Google -> /auth/google?next=%2Ftoday, /today?legacy=1 shared-header sign-in -> /login?next=%2Ftoday%3Flegacy%3D1, and /today now requests /auth/google?next=%2Ftoday before handing off to Google; production browser console/page errors were zero on the verified routes; Vercel runtime logs for deployment dpl_FkT6rtY8qJWVfcNzAxWq5fbLUcEZ returned no error/fatal lines.
- QA status: PASS. The targeted production auth seams are fixed and verified live.
- Deploy status: PASS. Canonical project prj_b7CKwanQaKwFQSHInr3l6wsZy9nD, deployment dpl_FkT6rtY8qJWVfcNzAxWq5fbLUcEZ, READY, production aliases updated.
- Failed/blocked: local end-to-end sign-in completion remains unproven because the clean worktree lacks local public Supabase env vars; that did not block route-consistency acceptance or production verification.
- Self-service attempted / Claude in Chrome: repo docs, local source review, local build/checks, GitHub CLI, Vercel connector, direct production HTML/header checks, and Playwright browser automation on both local and production routes. Claude in Chrome was not used.
- Next action: auto-advance to Product Manager and scope /estate calm migration/auth-entry consistency or another higher-leverage family-facing batch if new production evidence appears.
- Auto-advance decision: Deploy PASS; return immediately to Product Manager for the next batch rather than stopping on deploy success.
### 2026-07-03 - Family auth consistency batch expanded and browser-proven in source

- Date/time: 2026-07-03 09:26 -04:00.
- Branch/commit(s): clean worktree `C:\Users\steve\Documents\GitHub\thepassageappio-origin-main` on `codex/today-route-consistency` still based on committed branch tip `490310db8a5af03f042bc5d628dd132da2e60e52`, now with uncommitted source/doc changes in `components/AppCalm.js`, `components/SiteChrome.js`, `pages/auth/google.js`, `pages/login.js`, and `docs/agent-operating-context.md`. Scheduled-run checkout remains local `main` at `d0c046c7f773aae2d7cc68cf65ade52cee38a462`, still behind `origin/main` and still preserving the unrelated `pages/participating.js` line-ending-only drift.
- Role instance / delegated agent: explicit in-session Product Manager, UI/UX Review, Development Engineer, QA, and Deploy contexts only; true sub-agent delegation was unavailable in this run.
- Prior role handoff received: 2026-06-30 shared-header `/today` auth-seam handoff with QA PARTIAL and Deploy HOLD.
- PM Sprint Brief: COMPLETE for the same family-auth batch, now expanded from source prep into a coherent release candidate. Sprint goal: make all family `/today` auth-entry seams preserve the intended family return path, including the fallback auth pages that still drop `next` in server HTML on production.
- Product Manager scope: fix now and prepare for release. The live production auth mismatch is still proven, and the newly found `/login`/`/auth/google` fallback seam is the same family-auth slice rather than a new roadmap item. Product Manager decision: fix now, keep the batch coherent, and stop before deploy because the branch remains unpushed/undeployed.
- UI/UX status: PASS. The experience bar is unchanged but now broader: every family sign-in surface should start and finish from the current family route, including rollback seams and auth fallback pages, so users never lose context during sign-in recovery.
- Best-practice research: repo/source review across `components/AppCalm.js`, `components/App.js`, `components/SiteChrome.js`, `pages/login.js`, `pages/auth/google.js`, and the living context; production GitHub/Vercel metadata (`22de7dc` success on canonical deploy `dpl_GphyoAGTEsqi6kh26WEpZCPycpdo` with no runtime errors in the last 24h); Playwright browser proof on live production and local source; direct HTML fetches of `/login?next=%2Ftoday` and `/auth/google?next=%2Ftoday`; and current official Next.js docs on Automatic Static Optimization and `getServerSideProps`, which explain that statically optimized pages do not have query data during prerender while request-time rendering does.
- Development handoff: `components/AppCalm.js` now guards absent local Supabase public auth instead of crashing the calm family route; `components/SiteChrome.js` preserves the current route in shared-header sign-in; `pages/auth/google.js` and `pages/login.js` now use `getServerSideProps` to keep request-time `next` in server-rendered fallback links; prior committed branch work still preserves `/today` and `/today?legacy=1` in the calm and legacy auth-entry flows. No schema or API changes.
- Files changed: `components/AppCalm.js`, `components/SiteChrome.js`, `pages/auth/google.js`, `pages/login.js`, `docs/agent-operating-context.md`.
- Data/API behavior changed: none. Existing Supabase auth endpoints, auth callbacks, checkout flow, and task/workflow APIs are preserved.
- UX behavior changed: the queued source branch now keeps family auth attached to `/today` or `/today?legacy=1` across calm entry buttons, shared-header sign-in, `/auth/google` fallback recovery, and `/login` recovery, instead of dropping users to `/`, bare `/login`, or bare `/auth/google`.
- Tested: `git status --short --branch`; `git log --oneline --decorate -8`; `git diff --check` PASS; `npm run agent:check` PASS; `npm run build` PASS after the auth-page SSR update (`/login` and `/auth/google` now build as dynamic pages); Vercel `get_project`, `list_deployments`, and production runtime-log checks on the canonical project; GitHub combined status for production commit `22de7dc` -> Vercel success; direct production HTML checks proved `/login?next=%2Ftoday` still server-renders bare `/auth/google` and `/auth/google?next=%2Ftoday` still server-renders bare `/login`; Playwright on production proved `/today` still requests `/auth/google?next=%2F` and `/today?legacy=1` still renders `Sign in -> /login`; local Playwright on `http://127.0.0.1:3001` proved the queued branch now requests `/auth/google?next=%2Ftoday` from calm `/today`, renders `/today?legacy=1` header sign-in as `/login?next=%2Ftoday%3Flegacy%3D1`, renders `/auth/google?next=%2Ftoday` fallback as `/login?next=%2Ftoday`, and renders `/login?next=%2Ftoday` Google CTA as `/auth/google?next=%2Ftoday`; direct HTML fetch on local `http://127.0.0.1:3001/login?next=%2Ftoday` and `http://127.0.0.1:3001/auth/google?next=%2Ftoday` confirmed those server-rendered links now preserve `next`.
- QA status: PASS for source-level release readiness, with deploy still pending. The branch behavior is browser-proven locally and the live production defect is browser-proven remotely. Remaining gap is only undeployed-state verification after a real release.
- Deploy status: READY pending release packaging and push. The batch is now large enough to justify a dedicated family-auth deploy slot, and no Vercel rate-limit or quota blocker is active.
- Failed/blocked: the clean worktree still lacks local public Supabase env vars, so real sign-in completion cannot be proven locally beyond route/request preservation. `next start` and earlier `next dev` runs also produced stale-process/build-artifact noise until the QA pass was rerouted onto a fresh dev port; that was an environment artifact, not a source regression.
- Self-service attempted / Claude in Chrome: repo docs, local source review, local build/checks, Vercel connector, GitHub connector, direct HTML fetches, and Playwright browser automation on both production and local routes. Claude in Chrome was not used.
- Next action: package this branch onto `origin/main` as the next `[deploy] [qa-approved]` family-auth release candidate, then rerun browser QA on production for `/today`, `/today?legacy=1`, `/auth/google?next=%2Ftoday`, and `/login?next=%2Ftoday`.
- Auto-advance decision: Product Manager, UI/UX, Development, and QA are complete for this batch. Continue directly into Deploy packaging in the same run.

### 2026-06-30 - Shared-header sign-in seam added to the `/today` auth batch

- Date/time: 2026-06-30 09:20 -04:00.
- Branch/commit(s): clean worktree `codex/today-route-consistency` still based on committed source-prep branch tip `490310db8a5af03f042bc5d628dd132da2e60e52`; new uncommitted working-tree changes in `components/SiteChrome.js` and `docs/agent-operating-context.md`. Scheduled-run checkout remains local `main` at d0c046c7f773aae2d7cc68cf65ade52cee38a462 and 51 commits behind.
- Role instance / delegated agent: explicit in-session Product Manager, UI/UX Review, Development Engineer, QA, and Deploy contexts only; true sub-agent delegation was unavailable in this run.
- Prior role handoff received: 2026-06-30 legacy `/today?legacy=1` auth-seam handoff with QA PARTIAL and Deploy HOLD.
- PM Sprint Brief: COMPLETE for the same source-only family auth-entry batch. Sprint goal: finish the queued `/today` route-consistency slice by closing the last shared-header sign-in path that still discarded family return context.
- Product Manager scope: fix now, hold deploy. Production Playwright still proves `/today` routes Google auth with `next=/`, and source review plus production browser proof showed `/today?legacy=1` still used a plain `/login` header path with no family return context. This is a same-slice auth-entry gap, not a new roadmap item.
- UI/UX status: PASS. The experience bar is unchanged: family users should start sign-in from the route they are on and come back to that same route, whether the route is the calm family page or the temporary legacy rollback seam.
- Best-practice research: repo source review (`components/SiteChrome.js`, `components/App.js`, `components/AppCalm.js`, `pages/login.js`, `docs/cycle-5-app-migration-handoff.md`), live production Playwright on `/today` and `/today?legacy=1`, GitHub branch/open-PR/status evidence, and current Vercel project/deployment/runtime-log metadata on June 30, 2026. Product doctrine remains aligned with the migration rule that `/` is public marketing, `/today` is the family app, and auth should preserve the intended role route.
- Development handoff: `components/SiteChrome.js` now computes a route-aware `/login?next=...` fallback for unauthenticated shared-header sign-in and calls the page-specific `onSignIn` handler when one exists, instead of always linking to bare `/login`. This lets the legacy `/today?legacy=1` seam preserve family context and keeps direct family pages using their custom Google-auth return handlers. No API or schema changes.
- Files changed: `components/SiteChrome.js`, `docs/agent-operating-context.md`.
- Data/API behavior changed: none. Existing Supabase auth, `/auth/google`, `/api/myEstates`, `/api/tasks/:id/status`, `/api/checkout`, and all schema/contracts are preserved.
- UX behavior changed: unauthenticated shared-header sign-in now preserves the current route instead of dropping users onto the generic login route with no return context. On family routes, that means the queued branch keeps sign-in attached to `/today` or `/today?legacy=1` rather than sending users back toward the public homepage/login seam.
- Tested: `git fetch origin --prune`; `git status --short --branch`; `git diff origin/main...HEAD --stat`; `gh pr list --limit 10 --state open --json number,title,headRefName,baseRefName,url` -> `[]`; GitHub combined status for queued branch tip `490310d` -> no remote statuses yet; GitHub combined status for production commit `da18ab6` -> Vercel success; Vercel canonical project/deployment checks confirm latest production deployment `dpl_6ZpsxH774isxAUbQY3CwXsbVe2Cg` READY on `da18ab6`; Vercel production runtime logs for the last 24h returned no error/fatal lines; Playwright production snapshot/click on `https://www.thepassageapp.io/today` confirmed Google auth still uses `next=/`; Playwright production snapshot on `https://www.thepassageapp.io/today?legacy=1` confirmed shared-header sign-in still routes to plain `/login`; local `npm run build` PASS (`next build`, static pages 71/71); `git diff --check` PASS; `npm run agent:check` PASS; local `next start --port 3100` plus Playwright on `http://127.0.0.1:3100/login?next=%2Ftoday%3Flegacy%3D1` confirmed the login page preserves `Continue with Google -> /auth/google?next=%2Ftoday%3Flegacy%3D1`.
- QA status: PARTIAL. Production browser proof confirms the current bug, source/build checks are green for the queued fix, and local login-route proof shows the preserved `next` path works once it reaches `/login`; however, local `/today` remains blocked by missing public Supabase auth config, and the branch is still undeployed.
- Deploy status: HOLD / no deploy. The batch is still `[skip deploy]` prep and remains too small to spend a production slot by itself under deploy-budget discipline unless Product Manager later classifies the proven family auth mismatch as urgent enough for a standalone release.
- Failed/blocked: local `/today` still recovers with `Cannot read properties of null (reading 'auth')`, so this worktree cannot prove hydrated family auth end to end. Opera browser connector and signed-in Chrome/Claude-in-Chrome were unavailable for authenticated verification. The queued branch still has no remote PR or deployment because it has not been pushed.
- Self-service attempted / Claude in Chrome: repo docs, local source review, GitHub CLI, GitHub connector, Vercel connector, local build/checks, local Next.js start, and Playwright browser automation on both production and local routes. Claude in Chrome was not used.
- Next action: keep the branch queued as `[skip deploy]` source prep, then either add one more compatible family-route/auth-entry slice or obtain a runnable authenticated/browser QA path so Product Manager can decide whether this batch is ready to promote toward a `[deploy] [qa-approved]` release.
- Auto-advance decision: QA remains PARTIAL and Deploy remains HOLD, so the loop returns to Product Manager consolidation rather than deployment.

### 2026-06-30 - Legacy `/today?legacy=1` auth seam fixed; source batch still held

- Date/time: 2026-06-30 07:40 -04:00.
- Branch/commit(s): clean worktree `codex/today-route-consistency` on top of `origin/main` da18ab6f07136acf6bb509e008587636ef75ded4; scheduled-run checkout remains local `main` at d0c046c7f773aae2d7cc68cf65ade52cee38a462 and 51 commits behind.
- Role instance / delegated agent: explicit in-session Product Manager, UI/UX Review, Development Engineer, QA, and Deploy contexts only; true sub-agent delegation was unavailable in this run.
- Prior role handoff received: 2026-06-29 `/today` auth mismatch handoff with QA PARTIAL and Deploy HOLD.
- PM Sprint Brief: COMPLETE for the smallest useful follow-up inside the same family-route batch. Sprint goal: finish the undeployed `/today` route-consistency batch by preserving auth returns when the legacy App is opened through `/today?legacy=1`.
- Product Manager scope: fix now, hold deploy. Development uncovered that the queued fallback-button change was incomplete because legacy App auth still hardcoded `/`; that is a same-slice gap, not a new roadmap item.
- UI/UX status: PASS. The experience bar is unchanged: whether the user stays on the calm family route or temporarily uses the rollback seam, sign-in should bring them back to the same family entry context instead of dumping them onto the public homepage.
- Best-practice research: repo source review (`components/App.js`, `components/AppCalm.js`, `components/family/FamilyTodayApp.js`, `docs/site-migration-plan.md`, `docs/cycle-5-app-migration-handoff.md`), current GitHub/Vercel production metadata, and current official Vercel limits guidance already recorded on June 29, 2026. Product doctrine stays aligned with the migration rule that `/` remains public marketing and `/today` is the family app.
- Development handoff: added `currentAuthReturnPath()` in `components/App.js` so legacy Google sign-in, OTP sign-in, and pending-checkout sign-in preserve the current route instead of hardcoding `/`; removed the old explicit `redirectPath="/"` usage in legacy sign-in prompts so `/today?legacy=1` remains sticky. Existing APIs, Supabase contracts, and route structure are unchanged.
- Files changed: `components/App.js`, `docs/agent-operating-context.md`.
- Data/API behavior changed: none. Existing Supabase auth, `/api/myEstates`, `/api/tasks/:id/status`, `/api/checkout`, and schema/contracts are preserved.
- UX behavior changed: the queued source branch now keeps family auth on `/today` for the calm entry and on `/today?legacy=1` for the legacy rollback seam, instead of letting legacy sign-in bounce the user back to `/`.
- Tested: `git diff --check` PASS; `npm run agent:check` PASS; isolated local `npm run build` completed cleanly after clearing overlapping local build processes and stale `.next` artifacts; Vercel canonical-project checks still show production READY on `dpl_6ZpsxH774isxAUbQY3CwXsbVe2Cg` / commit `da18ab6f07136acf6bb509e008587636ef75ded4` with no production runtime errors in the last 24h; `gh pr list --state open` still returned `[]`; local `next start --port 3100` plus Playwright against `/today?legacy=1` still hit the recovery state `Cannot read properties of null (reading 'auth')`, confirming this worktree cannot prove hydrated auth flows without valid local public Supabase config.
- QA status: PARTIAL. Source/build validation is green and the legacy seam bug is fixed in code, but local browser QA remains blocked by the missing local public auth config, and the branch is not deployed yet.
- Deploy status: HOLD / no deploy. The batch is still `[skip deploy]` prep and remains too small to spend a production slot by itself under deploy-budget discipline unless Product Manager later classifies the proven auth mismatch as urgent enough for a standalone release.
- Failed/blocked: local browser QA is still not representative because `/today` and `/today?legacy=1` recover with `Cannot read properties of null (reading 'auth')` in this worktree; foreground `npm run build` timed out until overlapping local build/start processes were cleared, but the isolated clean build completed afterward. Opera browser connector and signed-in Chrome/Claude-in-Chrome were unavailable for authenticated verification.
- Self-service attempted / Claude in Chrome: repo docs, local source review, local process cleanup, isolated local build/start runs, GitHub CLI, Vercel connector, and local Playwright. Claude in Chrome was not used.
- Next action: keep the branch queued as `[skip deploy]` source prep, scope one more compatible family-route/auth-entry fix or QA-enablement slice, then browser-QA the combined batch before any `[deploy] [qa-approved]` release.
- Auto-advance decision: QA is PARTIAL and Deploy is HOLD, so the loop returns to Product Manager consolidation rather than deployment.

### 2026-06-29 - Production `/today` auth mismatch proven; route-fix batch stays queued

- Date/time: 2026-06-29 13:35 -04:00.
- Branch/commit(s): clean worktree `codex/today-route-consistency` at ca24859e19978f9fa8665ae4046b98619fc3581d on top of `origin/main` da18ab6f07136acf6bb509e008587636ef75ded4. Scheduled-run checkout remains local `main` at d0c046c7f773aae2d7cc68cf65ade52cee38a462 and 51 commits behind.
- Role instance / delegated agent: explicit in-session Product Manager, UI/UX Review, Development Engineer, QA, and Deploy contexts only; true sub-agent delegation was unavailable in this run.
- Prior role handoff received: 2026-06-28 `/today` route-consistency source-fix handoff plus the older Cycle 5 app-migration handoff.
- PM Sprint Brief: COMPLETE for a source-only family-route consistency batch plus deployment-discipline doc correction. Sprint goal: prove whether the `/today` auth-return bug is real in production, validate the existing source fix branch, and correct stale deployment-limit documentation from the current official Vercel source.
- Product Manager scope: fix now, but hold deploy. The `/today` family-entry mismatch is proven live, yet still small enough to batch with the next compatible family-route/auth-entry slice under Passage deploy-discipline.
- UI/UX status: PASS. The product intent is unchanged: `/today` must behave like one calm family front door where sign in starts here and returns here. No broader UX re-scope is needed for this narrow fix.
- Best-practice research: repo source review (`docs/cycle-5-app-migration-handoff.md`, `docs/deployment-discipline.md`, `components/AppCalm.js`, `components/family/FamilyTodayApp.js`), Vercel project/deployment/runtime-log metadata, Playwright browser proof on production, `gh pr list` for open PR state, and the current official Vercel limits page on June 29, 2026. Official Vercel limits now document 100 deployments created per hour and 100 per day on the referenced limits page, so the repo doc was corrected while keeping Passage's stricter internal budget unchanged.
- Development handoff: no new product-code edits were needed in this run because branch `codex/today-route-consistency` already contains the route fix. Docs were updated to reflect current production evidence, current GitHub/Vercel state, the local-env QA caveat, and the corrected Vercel limits.
- Files changed: `docs/agent-operating-context.md`, `docs/deployment-discipline.md`.
- Data/API behavior changed: none in this run. Existing Supabase auth, `/api/myEstates`, `/api/tasks/:id/status`, and schema/contracts remain unchanged.
- UX behavior changed: none in this run. Existing branch behavior remains queued: Google auth and OTP return paths should resolve back to `/today`, and the legacy fallback should stay on `/today?legacy=1`.
- Tested: `git fetch origin --prune`; `git branch -vv`; `gh pr list --state open --json number,title,headRefName,baseRefName,isDraft,url` -> `[]`; Vercel project/deployment/runtime-log checks on the canonical project; `git diff --check`; `npm run agent:check`; `npm run build` PASS (`next build`, static pages 71/71); local `npm run start -- --port 3100`; Playwright production snapshots for `https://www.thepassageapp.io/today` and `https://www.thepassageapp.io/today?legacy=1`; Playwright click on `Open your family record` showing Google auth with `next=/`; local `/today` snapshot showing recovery state with `Cannot read properties of null (reading 'auth')`.
- QA status: PARTIAL. Production proof now confirms the current bug, but the fix itself is still undeployed and could not be browser-proven locally because the local worktree lacks the public Supabase auth config needed to exercise `/today` end to end.
- Deploy status: HOLD / no deploy. The route fix remains `[skip deploy]` source prep and should be grouped with the next compatible family-route or auth-entry slice unless Product Manager later classifies the proven production mismatch as urgent enough for its own release slot.
- Failed/blocked: local `/today` browser QA is not representative without local Supabase public auth config; Opera browser connector remained unavailable; no signed-in Chrome or Claude-in-Chrome session was available for authenticated browser proof. `npm ci` audit findings remain a watch item outside this sprint.
- Self-service attempted / Claude in Chrome: repo docs, local git/source review, local build/checks, Vercel connector, GitHub CLI, and Playwright browser automation. Claude in Chrome was not used.
- Next action: keep the current branch queued as `[skip deploy]` source prep, scope one more compatible family-route/auth-entry fix or QA-enablement slice from Product Manager, then browser-QA the combined batch before any `[deploy] [qa-approved]` release.
- Auto-advance decision: QA is PARTIAL and Deploy is HOLD, so the loop returns to Product Manager consolidation rather than deployment.

### 2026-06-28 - `/today` route-consistency source fix and live-context repair

- Date/time: 2026-06-28 19:05 -04:00.
- Branch/commit(s): clean detached worktree at `origin/main` / da18ab6f07136acf6bb509e008587636ef75ded4; scheduled-run checkout remains local `main` at d0c046c7f773aae2d7cc68cf65ade52cee38a462 and 51 commits behind.
- Role instance / delegated agent: explicit in-session Product Manager, UI/UX Review, Development Engineer, QA, and Deploy contexts only; true sub-agent delegation was unavailable in this run.
- Prior role handoff received: stale `origin/main` living context that still claimed June 19-20 Cycle 4/Sprint 4 production facts despite newer calm migration releases already deployed on `main`.
- PM Sprint Brief: COMPLETE for a small source-only family-route consistency batch plus docs correction. Objective: restore the docs as truthful release-train state, preserve the stale scheduled-run checkout, and fix `/today` so its auth entry points route back to the calm family app rather than the public homepage.
- Product Manager scope: fix now. Route consistency on `/today` is a concrete family-facing bug surface and is small enough to batch without widening into `/estate` or global portal-routing decisions.
- UI/UX status: PASS. This is a narrow but user-facing workflow correction, not a cosmetic change. `/today` must behave like one coherent family front door: sign in here, return here, and keep the legacy fallback reachable from here.
- Best-practice research: repo source review (`docs/site-migration-plan.md`, `docs/migration-plan.md`, `docs/rebuild-progress.md`, `docs/cycle-5-app-migration-handoff.md`), current Git/Vercel production metadata, and current role-brief/release-train rules. Product decision: honor the documented `/today` route baseline rather than broadening scope into the unresolved `/today` vs `/estate` convergence decision.
- Development handoff: updated `components/AppCalm.js` so Google auth `next` and OTP `emailRedirectTo` both return to `/today`; updated `components/family/FamilyTodayApp.js` so the legacy fallback opens `/today?legacy=1`. Updated this context file to current production/deploy reality and recorded the stale-workspace warning.
- Files changed: `components/AppCalm.js`, `components/family/FamilyTodayApp.js`, `docs/agent-operating-context.md`.
- Data/API behavior changed: none. Existing Supabase auth, `/api/myEstates`, `/api/tasks/:id/status`, and all schema/contracts are preserved.
- UX behavior changed: signed-out family users entering through `/today` now return to the calm family app after Google sign-in or magic-link auth instead of landing on the public homepage. The in-app legacy setup fallback now stays on the `/today` route family.
- Tested: `git fetch origin --prune`; `git worktree add --detach C:\Users\steve\Documents\GitHub\thepassageappio-origin-main origin/main`; `git diff --ignore-space-at-eol -- pages/participating.js`; Vercel project/deployment/runtime-log checks for the canonical project; `npm ci`; `git diff --check`; `npm run build` PASS (`next build`, static pages 71/71); source diff review of the `/today` route seams.
- QA status: PARTIAL. Source/build validation is green for this batch, but live browser verification of `/today` sign-in, magic-link return, and legacy fallback was not possible because Opera browser automation was unavailable and no signed-in Chrome/Claude-in-Chrome path was available in this session.
- Deploy status: HOLD / no deploy. The current change is too small to spend a production slot alone under deploy-budget rules unless a live auth regression is proven severe. Production remains da18ab6f07136acf6bb509e008587636ef75ded4 on `dpl_6ZpsxH774isxAUbQY3CwXsbVe2Cg`.
- Failed/blocked: `npm run agent:check` initially failed because this living context file on `origin/main` had not been updated for the newer calm migration releases. Browser verification remains blocked by unavailable browser tooling, not by an owner gate. `npm ci` reported 3 audit findings (1 moderate, 2 high), which remain a watch item outside this sprint.
- Self-service attempted / Claude in Chrome: repo docs, local source review, local git worktree, Vercel connector, local `npm ci`, `git diff --check`, and `npm run build`. Opera browser connector returned `Browser not connected`. Claude in Chrome was not used.
- Next action: rerun `npm run agent:check` after this context update, then keep this fix queued as `[skip deploy]` source prep and scope the next compatible family-route/auth-entry slice or browser-QA-enablement step from Product Manager.
- Auto-advance decision: QA is PARTIAL and Deploy is HOLD, so the loop returns to Product Manager consolidation after checks instead of deploying.

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

### 2026-07-22 - Development Head authority and no-routine-approval contract

- Owner directive: there is no founder/human code-review requirement and no routine owner approval queue. Product, UX, Engineering, QA, GitHub/PR/CI work, merge readiness, documentation, roadmap sequencing, non-production Preview work, and already-authorized reversible incident recovery auto-advance through the agent chain.
- The specific merge-readiness authority is Development Head / Release Authority. The installed `Dedicated Merge Review` control and `Passage Review Agent / merge-review` exact-head check implement this role. It remains distinct from the Bot author, implementation, Independent QA, Deploy, and Production Review.
- A head, base, evidence, required-check, or material-scope change makes the Development Head result stale. PASS authorizes merge readiness only and never Production.
- Owner interaction is limited to true `AGENTS.md` gates: exact Production authorization, destructive Production data work, spending money, real external communications, pricing, and material legal/privacy/security/medical/compliance/funeral-director judgment.
- Source QA: governance regression fixtures and agent-context checks pass. Deploy decision: `[skip deploy]`; Production unchanged by this documentation packet.
- Next action: distinct Independent QA and Development Head review the exact head, then resume the revenue-ranked Passage Zero roadmap without asking the owner for routine approvals.

### Mission mobile occlusion repair hosted handoff - 2026-07-22 17:42 -07:00

- Supersession: PR #32 previously carried a source-parent handoff describing Production at dpl_3rA..., no Preview, and hosted proof pending. That text is preserved in Git history and defect evidence but is not copied into this current-main resolution because it is no longer the release truth.
- Product Manager /root/pm_p1_and_roadmap_return: **REPAIR-FORWARD BRIEF COMPLETE**. Another rollback was rejected because the preceding artifact has known hydration failures. Scope remains only the /mission responsive grid repair.
- UX /root/ux_mission_responsive_repair: **PASS FOR ENGINEERING START** with mission -> promise -> proof -> paths -> selected destination -> footer in normal flow at 390/360 and exact 1440 preservation.
- Engineering /root/engineering_pr32_mission_repair: **COMPLETE**. Application source parent 9434e779628b3b20ed25b575b1ca3efa2ba7fc86 contains the bounded CSS fix; no additional runtime source was required.
- Hosted QA /root/qa_pr32_hosted_preview: **PASS** on READY non-production Preview dpl_3EDEQAJTQ3aGHN8yw7sMyAsvQTr6, Preview head a58d2c564110f5a38cc1e81e0f412ae5237521df. The six-route x three-width direct/client matrix passed 36/36 cells; every screenshot content was covered; the mobile occlusion is absent; Vercel build and runtime logs are clean.
- Evidence publication: Passage Bot retained 77 timestamped/redacted defect and replacement evidence files. Share tokens, credentials, cookies, private identities, and database output are excluded.
- Current Production remains dpl_5GVpgdmZ6oqLkVeWcgcrwSpGPNmj, commit 09ddb9e5601432f9dd2c36bbdbd829719dd66859, with **Production QA FAIL** because /mission overlaps at 390/360. Overall Production state remains **INVALIDATED/REOPENED**. Production was not changed by this repair.

Source QA: PASS
Hosted Preview QA: PASS
Independent Agent Review: REQUIRED
Development Head / Release Authority: REQUIRED
Owner Gate: NOT REQUIRED
Production Authorization: NOT REQUESTED
Production Deployment: NOT DEPLOYED
Production QA: NOT RUN
Overall release state: PREVIEW VERIFIED

- Exact next action: current-head CI, Independent QA, and Development Head review must pass after this current-main conflict resolution. Merge readiness does not authorize Production. A later exact-commit Production promotion remains a separate owner gate.
- Production Supabase, Production Vercel configuration, pricing, family/vendor access, readiness scores, and Passage Zero/Cycle 8 source were untouched. No owner question or owner browser action was used.
