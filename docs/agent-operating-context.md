# Passage Agent Operating Context

Last updated: 2026-06-19

This is the living handoff for future agents. Read AGENTS.md first, then this file, before changing the product. Update this file before final handoff or before creating a deploy-triggering commit.

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
- [deploy] means one meaningful production release should build.

Canonical Vercel project:

- Project ID: prj_b7CKwanQaKwFQSHInr3l6wsZy9nD
- Team ID: team_X0ta3bEEbRVGNM9xOwdBtCga

Recent known green production before this context file: f1b928b8755f2a965b18bacddaccf1adbadc8fd9, release: deploy persona navigation and task action clarity [deploy].

Recent source batch is queued behind [skip deploy] commits. Do not create another small deploy. Consolidate, sanity-check, then use one [deploy] release commit.

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

1. Consolidate visible website roadmap/navigation so System Admin has one canonical roadmap and every other admin page is clearly evidence, QA, or tooling.
2. Check that old /system/admin/sprint-2 links no longer look like a competing roadmap.
3. Sanity-check the batched source changes remotely.
4. Create one [deploy] release commit when the batch is coherent and Vercel is ready.
5. Use browser/Chrome QA after deploy for persona-by-persona testing:
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
