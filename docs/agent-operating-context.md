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

Recent known green production before this context file: f1b928b8755f2a965b18bacddaccf1adbadc8fd9, release: deploy persona navigation and task action clarity [deploy].

Recent source batch is queued behind [skip deploy] commits. Do not create another small deploy. Consolidate, sanity-check, then use one [deploy] release commit.

## Current Release Train

Required loop: Product Manager Agent -> Development Engineer Agent -> QA Agent -> Deploy Agent.

Current cycle: 1.

Current batch status: Product Manager scope in progress for agent workflow hardening, roadmap consolidation, and funeral-home operating-loop release candidate. Development changes are queued in source with [skip deploy]. QA has not approved a production release yet.

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

1. Verify the release-train guard and PR template are present in GitHub.
2. Sanity-check that System Admin visibly has one canonical roadmap and every other admin page is clearly evidence, QA, or tooling.
3. Confirm old /system/admin/sprint-2 links no longer look like a competing roadmap.
4. Sanity-check the batched source changes remotely.
5. Create one [deploy] [qa-approved] release commit only after the Product Manager -> Development Engineer -> QA loop has passed.
6. Use browser/Chrome QA after deploy for persona-by-persona testing:
   - Public landing and nav.
   - Urgent path.
   - Funeral-home sales page.
   - Funeral-home director dashboard.
   - Funeral-home employee assigned work.
   - Family invited by funeral home.
   - Vendor request acceptance/update/quote/completion.
   - Reports/export proof.
6. Keep logging any finding here before handing off.

## Known Watch Items

- Google sign-in and general button behavior recently showed issues and needs live browser QA.
- Smart address/location lookup during green-path onboarding was reported broken or confusing.
- Vercel rate limits were hit earlier; use larger release batches.
- Support email support@thepassageapp.io is not real and should not be shown as a direct support line.
- Internal ARR/300k/roadmap/sprint/QA language must never appear on external pages.
- Demo data has been near-empty before; the funeral-home demo loop must be seeded before claims are made.

## Handoff Format For Future Agents

Append or update this section before final response:

- Date/time:
- Branch/commit(s):
- Files changed:
- Deployed: yes/no, Vercel deployment URL/status:
- Tested:
- Failed/blocked:
- Next action:

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
