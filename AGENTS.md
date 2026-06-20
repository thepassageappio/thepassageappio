# Passage Agent Operating Guide

This file is the first-read contract for agents working on Passage. It is stable guidance. The living status and handoff lives in docs/agent-operating-context.md.

## Magic Phrase

Use this exact phrase in a fresh Codex chat to trigger the process:

`Passage Release Train: start the loop.`

When an agent sees that phrase, it must read this file, docs/agent-operating-context.md, docs/release-train.md, and the relevant dedicated role brief in docs/agents/ before proposing or changing anything. It must instantiate or delegate to a distinct Product Manager Agent first, then distinct UI/UX Review, Development Engineer, QA, and Deploy role agents as the loop advances. A single undifferentiated agent must not approve multiple role responsibilities without a recorded role handoff in docs/agent-operating-context.md.

## Auto-Advance Rule

The release train is a loop, not a single handoff. Once started, the agent must keep moving to the next role in the same session whenever it has enough context and tool access to do useful work.

Distinct role rule: auto-advance means delegate to the next distinct role agent or explicit role context, not silently continue as the same role. Each role must record its role instance or delegation, cycle, brief or handoff received, decision, and next-role target.

Do not stop after writing a handoff if that handoff names an unresolved next role. Do not stop after a successful `[skip deploy]` commit or push either. A `[skip deploy]` update preserves source, docs, QA, or context state; it does not close the loop. If the next PM, Development, QA, or Deploy-prep action is known and not owner-gated, immediately continue to that role:

- Deploy PASS -> Product Manager scopes the next highest-leverage item.
- Deploy PARTIAL or post-deploy QA incomplete -> Product Manager re-scopes the failed or unproven acceptance area.
- QA FAIL or PARTIAL -> Product Manager decides fix now, split, de-scope, or escalate before Development continues.
- UI/UX FAIL or PARTIAL -> Product Manager re-scopes the experience bar before Development continues.
- Development gap -> Product Manager re-scopes before more implementation.
- Product Manager scope complete for user-facing work -> UI/UX Review Agent defines the experience acceptance bar.
- UI/UX PASS or UX Review: N/A -> Development Engineer implements the scoped batch.

Only pause for the owner when the next step requires explicit approval under Agent Permissions, live credentials/auth the agent cannot access after safe self-service paths were tried, destructive production data changes, spending money, legal/compliance/privacy/security judgment, or the same external blocker has repeated and no useful repo/docs/QA work remains. Otherwise proceed, log the transition in docs/agent-operating-context.md, and keep the train moving.

## Self-Service Before Owner

The owner is the last resort, not the default next step. Before asking the owner to restart, decide, click, verify, research, or unblock, agents must first try the safe self-service paths already available in the environment:

- Repo docs and the living context.
- Local source review, build/lint/test commands when available.
- GitHub and Vercel connectors.
- Browser or Chrome automation for QA and authenticated browser state.
- A signed-in Claude session in Chrome, when available, for agent-to-agent coordination, research, handoff review, or tool-assisted checking.

Claude in Chrome is an assistant path, not a permission bypass. Use it only within existing owner-approved access. Do not use Claude in Chrome to spend money, reveal or request secrets, send real customer/vendor/funeral-home communications, make destructive production data changes, bypass auth, or decide legal, privacy, security, medical, compliance, or funeral-director claims. If Claude in Chrome helps, record what it was asked to do and what it returned in docs/agent-operating-context.md.

Ask the owner only after those paths are unavailable, unsafe, or insufficient and a true Agent Permissions gate remains.

## Best-Practice Research Rule

Every role must ground decisions in best-in-class practice before locking scope, design, code, QA, or deployment.

- Product Manager researches the customer, market, domain, workflow, business objective, and comparable product pattern when the decision is not already settled by the roadmap.
- UI/UX Review researches current UX, accessibility, responsive, interaction, and visual standards before approving user-facing work. Default references include NN/g usability heuristics, W3C WCAG 2.2, and web.dev Core Web Vitals when applicable.
- Development Engineer researches framework, library, API, browser, security, and platform behavior from official docs or source before implementing unfamiliar or unstable behavior.
- QA Agent researches expected behavior, accessibility expectations, browser/device risk, and regression patterns before marking PASS.
- Deploy Agent researches current Vercel/project/deployment behavior, quotas, logs, and platform guidance before spending a deploy slot.

Research can be repo/source review when the answer is stable and internal. Use current external sources when the topic is changing, high-risk, user-facing, platform-specific, legal/security/privacy-adjacent, or likely to affect time or money. Record sources, assumptions, and how the research changed the handoff in docs/agent-operating-context.md.

## Read Before Work

Before changing product, code, copy, docs, roadmap, or deployment state:

1. Read this file.
2. Read docs/agent-operating-context.md.
3. Read docs/release-train.md and follow Product Manager -> UI/UX Review -> Development Engineer -> QA -> Deploy for user-facing work; record UX Review: N/A for invisible backend/process-only changes.
4. Read the dedicated role brief in docs/agents/ for the role being played.
5. If the work affects roadmap, sprint order, product vision, or priorities, read pages/system/admin/saas-roadmap.js. That owner-only page is the only website roadmap.
6. If the work affects deployment, read docs/deployment-discipline.md and verify the canonical Vercel project before creating a deploy-triggering commit.
7. If browser QA is needed, use the available browser or Chrome skill and record what was actually verified.
8. If an owner ask seems likely, first check whether browser/Chrome automation, Claude in Chrome, connectors, or source review can safely resolve it without owner involvement.

Development cannot begin until the Product Manager Agent has produced a PM Sprint Brief with a clear sprint goal, requirements, sprint components, development objectives, acceptance criteria, dependencies, QA plan, deploy plan, risks, non-goals, owner gates, and the next role agents to involve.

Before handoff, final response, or final commit, update docs/agent-operating-context.md with:

- Role instance or delegated agent for each role involved.
- Prior role handoff received.
- PM Sprint Brief status, goal, requirements, sprint components, development objectives, acceptance criteria, dependencies, and QA/deploy plan.
- Product Manager scope and cycle number.
- UI/UX status when work affects user-facing surfaces, or UX Review: N/A with reason.
- Development handoff and files changed.
- QA status, failures, and whether the loop returned to Product Manager.
- What is queued but not deployed.
- What was tested and what failed.
- Current Vercel/deploy status.
- The next highest-leverage action.
- Whether the train auto-advanced to the next role or why it could not.
- Any Claude-in-Chrome or external-agent assistance used.

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

When any loop uncovers an issue outside the active sprint, do not drop it and do not silently expand scope. The Product Manager Agent must classify it as fix now, backlog, roadmap update, watch item, or owner gate; record source evidence and the decision in docs/agent-operating-context.md, and update the single roadmap when priority, sprint order, milestone, or product doctrine changes.

Repo docs may contain historical plans. When they conflict, the canonical roadmap and this operating guide win.

## Deployment Rules

Use meaningful batches. Avoid small deploy chains that cause Vercel rate limiting and hide the real failing commit.

Default deploy budget: one production deploy train per hour and no more than four deploy-triggering commits per day unless production is broken or the owner explicitly approves a quota exception.

Batch rule: bundle two or three compatible small/medium fixes into one release candidate. Do not deploy docs-only, roadmap-only, context-only, QA-note-only, or source-only setup commits.

Use [skip deploy] for source batching and documentation/context updates. Use one [deploy] [qa-approved] release commit only when a coherent release candidate has passed the release train.

If Vercel returns a build-rate-limit, deployment-rate-limit, quota, or upgrade-to-Pro status, stop creating deploy-triggering commits. Record the blocked commit and current production state in docs/agent-operating-context.md, continue only with [skip deploy] prep, and wait for the reset window or explicit owner plan/quota approval before the next deploy attempt.

Canonical Vercel project:

- Project ID: prj_b7CKwanQaKwFQSHInr3l6wsZy9nD
- Team ID: team_X0ta3bEEbRVGNM9xOwdBtCga

Canceled Vercel deployments from [skip deploy] commits are expected. Treat failed builds, runtime errors, wrong-project deploys, and quota/rate-limit gates as blockers.

### Vercel build gate (scripts/vercel-ignore-build.js) — read before assuming deploys are broken

Vercel runs `scripts/vercel-ignore-build.js` as the Ignore Build Step (configured via `ignoreCommand` in vercel.json) on EVERY git deployment, production and preview alike. Exit 0 = build canceled; exit 1 = build allowed. A `CANCELED` deployment is this gate doing its job — it is NOT a broken pipeline, a Vercel outage, or a read-only/credential problem. Decode the commit message before reacting:

- Message contains `[skip deploy]`, `[no deploy]`, `[skip ci]`, or `[ci skip]` -> canceled.
- Message contains a deploy marker (`[deploy]`, `[force deploy]`, `[prod deploy]`, `[production deploy]`, or starts with `deploy:` / `release:`) but NO `[qa-approved]` (or `[qa approved]`) -> canceled (finish PM/Dev/QA first).
- Message contains a deploy marker AND `[qa-approved]` -> build allowed.
- Any other message (no markers at all) -> canceled.
- Non-canonical Vercel project id -> canceled (canonical is prj_b7CKwanQaKwFQSHInr3l6wsZy9nD only).

Consequences every session must know:

- You CANNOT get a Vercel preview URL — even on a non-main branch — without a commit whose message has both a deploy marker and `[qa-approved]`. The gate keys on markers, not on branch; branch only decides production vs preview AFTER a build is allowed. (Exception for QA: you may remove `ignoreCommand` from vercel.json ON A THROWAWAY BRANCH ONLY to get a preview build; never merge that branch to main, and restore the gate when done.)
- `[deploy] [qa-approved]` on `main` = PRODUCTION deploy. The same markers on a non-main branch (e.g. `qa-app-slice`) = a non-production PREVIEW deploy.
- Never add `[qa-approved]` to a commit before QA has actually passed — that marker asserts QA passed and faking it defeats the gate. Earn it through the release train, then add it.
- To browser-QA before deploy approval, run locally (`npm run dev`) and drive Chrome at localhost:3000, or use the throwaway-branch preview above, or have the owner open the gate. Do not force a build by tagging an unproven commit.
- To actually ship after the loop is green: one release commit on `main` whose message contains both markers, e.g. `release: <summary> [deploy] [qa-approved]`, within the deploy budget above.

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
- Mobile + web in tandem (cohesive responsive — REQUIRED): every real persona surface is built and QA'd at BOTH desktop (>=1366) and mobile (390 and 360) within the SAME slice — never ship one viewport without the other. Same status spine, same CalmKit/CalmControls components and copy across viewports so mobile and web stay cohesive; only layout (widths, stacking, density) adapts. Per-slice hard checks: zero horizontal overflow at 360/390/desktop, tap targets >= DS.tap.min, no hydration warnings.
- Real app vs. preview shell: real signed-in/persona surfaces use `AppShell frame="app"` (clean, centered, responsive panel). The default `frame="device"` renders a phone mockup (fake "9:41" status bar + bottom tab bar) and is ONLY for /preview reference pages. Never ship the device mockup on a real surface (regression shipped + fixed 2026-06-20, commit 7dba2214).
