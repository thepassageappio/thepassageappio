# Passage Agent Operating Guide

This file is the first-read contract for agents working on Passage. It is stable guidance. The living status and handoff lives in docs/agent-operating-context.md.

## Read Before Work

Before changing product, code, copy, docs, roadmap, or deployment state:

1. Read this file.
2. Read docs/agent-operating-context.md.
3. Read docs/release-train.md and follow Product Manager -> Development Engineer -> QA -> Deploy.
4. If the work affects roadmap, sprint order, product vision, or priorities, read pages/system/admin/saas-roadmap.js. That owner-only page is the only website roadmap.
5. If the work affects deployment, read docs/deployment-discipline.md and verify the canonical Vercel project before creating a deploy-triggering commit.
6. If browser QA is needed, use the available browser or Chrome skill and record what was actually verified.

Before handoff or final commit, update docs/agent-operating-context.md with:

- Product Manager scope and cycle number.
- Development handoff and files changed.
- QA status, failures, and whether the loop returned to Product Manager.
- What is queued but not deployed.
- What was tested and what failed.
- Current Vercel/deploy status.
- The next highest-leverage action.

The repository enforces this loop with scripts/check-agent-context.js, scripts/check-release-train.js, the Agent release train GitHub Action, and the PR template.

## Product Context

Passage is the family coordination layer for life-to-death transitions. When someone is dying or has died, Passage gives the family, funeral home, participants, care providers, and vendors one shared record of what the next step is, who owns it, what is waiting, and what is already proven done.

Passage is not a checklist app, memorial site, generic CRM, or chat tool. It is a coordination OS that sits between funeral homes and families.

Primary wedge: funeral homes as distribution. B2B must be strong enough that B2C feels easier, calmer, and safer.

Internal business goal: support a Passage SaaS company capable of $300k ARR within one year and growing. This goal is internal only. Do not expose ARR, sprint, roadmap, QA, founder narration, pilot conversion, or admin language on public or persona-facing pages.

## What Good Looks Like

Every meaningful screen should answer in plain language:

- What is this?
- What do I do now?
- Who owns it?
- Who is waiting?
- What will Passage prepare or automate?
- What proof is saved?
- Who can see this?
- What happens after I click?

The product should feel smart underneath and simple enough for a five-year-old to understand. It should be calm, restrained, warm, and enterprise-clean.

## Persona Priorities

Families and urgent users see reassurance, authority, one next action, privacy boundaries, and proof that help is coordinated. They should not see operator complexity.

Planning users see how to make things easier for loved ones later, with clear ownership, saved preferences, and low-pressure progress.

Funeral-home directors see risk, case flow, staff load, family-update health, unowned waiting points, proof gaps, vendor quotes, exports, reporting, billing readiness, and ROI.

Funeral-home employees see assigned client work only: case context, one primary action, prepared message or request, waiting state, proof field, escalation path, and no admin noise.

Vendors see scoped requests, quote/update/payment/proof states, and no family-record browsing.

Care providers see handoff duties, family contact boundaries, and only the coordination details needed for their role.

System admins see roadmap, QA, pilot health, automation readiness, abuse controls, refresh/rate-limit readiness, and demo tools under System Admin only.

## Task And Communication Contract

Every task-facing surface should behave like one operating step, not a vague card. It must show:

- Owner.
- Waiting party.
- Audience or visibility.
- Automation level: manual, semi-automated, or automated.
- What Passage prepared.
- What the human does now.
- Related case, person, vendor, service date, or proof context.
- Review-before-send boundary.
- Proof destination.
- Next status after action.

Communication belongs to the task spine. A message, vendor request, family update, employee note, proof save, waiting state, or escalation must stay attached to the related step and produce visible status/proof.

## Roadmap And Planning Rules

The website has one roadmap only: pages/system/admin/saas-roadmap.js, visible at /system/admin/saas-roadmap behind System Admin. Do not create a second roadmap tab, public roadmap, demo roadmap, or persona-facing roadmap.

Other admin pages are evidence or tools, not competing plans: Pilot Health, Conversion Plan, Enterprise Readiness, Funeral-home QA, Automation Readiness, Refresh Controls, Abuse Controls, and demo sandboxes.

Repo docs may contain historical plans. When they conflict, the canonical roadmap and this operating guide win.

## Deployment Rules

Use meaningful batches. Avoid small deploy chains that cause Vercel rate limiting and hide the real failing commit.

Use [skip deploy] for source batching and documentation/context updates. Use one [deploy] [qa-approved] release commit only when a coherent release candidate has passed the release train.

Canonical Vercel project:

- Project ID: prj_b7CKwanQaKwFQSHInr3l6wsZy9nD
- Team ID: team_X0ta3bEEbRVGNM9xOwdBtCga

Canceled Vercel deployments from [skip deploy] commits are expected. Treat failed builds, runtime errors, or wrong-project deploys as blockers.

## Agent Permissions

Agents may proceed without asking for:

- Bug fixes.
- Build and lint fixes.
- UX changes that reduce confusion and match the current roadmap.
- Copy edits that increase clarity, trust, and role separation.
- Demo-data hardening.
- Test and QA improvements.
- Documentation, roadmap, backlog, and handoff updates.
- Drafting outreach, demo scripts, handouts, and customer interview guides.

Agents must not proceed without explicit owner approval for:

- Changing pricing amounts.
- Sending real emails or SMS to customers, vendors, funeral homes, or leads.
- Applying production database SQL.
- Deleting user-facing functionality instead of deprecating or redirecting it.
- Material legal, compliance, privacy, security, medical, or funeral-director claim changes.
- Irreversible production data changes.
- Spending money or starting paid campaigns.

## Engineering Rules

- Keep changes consistent with existing patterns.
- Prefer existing helpers, tables, routes, and design language.
- Do not invent a new system when the task/status/audit pattern can carry the work.
- Never fake execution states. Unknown means unknown.
- All real actions should create visible proof: recipient, timestamp, actor, status, and next action.
- Public and persona-facing pages must stay free of internal language.
- Internal tools belong under System Admin.
- Verification matters: build, deploy, browser QA, API/data proof, and screenshots where useful.
