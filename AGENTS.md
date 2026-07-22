# Passage Agent Operating Guide

## Passage Zero canonicalization — 2026-07-18 (owner-approved; supersedes conflicting Threshold execution directives)

Passage Zero on `greenfield/passage-zero`, draft PR #24, is the sole target architecture and redesign implementation. Threshold on `main` is now a production-maintenance lane only: separately governed P0/P1 live defects may be fixed, but no new Threshold dashboard, estate, information-architecture, schema, or redesign work may begin.

Do not port the legacy Pages Router structure into Passage Zero. The historical Threshold sections below remain useful context only where they do not conflict with this directive. The canonical greenfield roadmap is `docs/product/operational-readiness-roadmap.md`; the cutover contract is `docs/product/passage-zero-cutover-plan.md`.

Every Passage Zero slice must advance the reachable persona UI, server-authorized command or query, durable state, RLS/authority predicate, append-only event or proof for mutations, recovery behavior, responsive projection, and parity-ledger entry together. A backend-only capability must be labeled `backend_only`; a UI state without durable proof fails QA. Production remains untouched until an explicitly approved production release train passes.

## Dedicated-agent repository and language controls — 2026-07-19 (owner-approved)

The durable policy is `docs/product/release-governance-and-plain-language-policy.md`. It supersedes every historical directive that permits agents or schedules to push directly to `main`, requires founder/human merge review, allows self-graded QA, or exposes internal implementation language on persona surfaces.

- Agents and schedules author only through the installed `Passage Release Bot` GitHub App on named branches and draft pull requests. They never use the owner's GitHub User credentials and receive no `main` bypass, check-write, merge, deployment, environment, secret, variable, or administration permission.
- Independent QA is a distinct task instance and the installed `Passage QA Reviewer` App emits `Passage QA / independent-qa` for the exact current head. Candidate-controlled workflows are deterministic CI, never Independent QA.
- Development Head / Release Authority is the dedicated merge-readiness role. It is a separate task instance, and the installed `Passage Release Reviewer` App emits `Passage Review Agent / merge-review` for the exact current head. It cannot author, edit, merge, deploy, administer, or access secrets. A new commit invalidates both QA and Development Head results. `Dedicated Merge Review` is the legacy control label for this same function, not a separate or founder-review step.
- Production Review is a third independent identity. The installed `Passage Production Reviewer` App emits `Passage Production Review / release-readiness` for the exact release commit and cannot deploy. Merge Review PASS never implies Production Review PASS.
- PR bodies are informational. Required checks pinned to their expected Apps are authoritative. GitHub `User` type, native review enumeration, PR-body checkboxes, or same-name checks from another source never prove independence.
- GitHub rules require current-head trusted governance, deterministic candidate CI, external Independent QA, external Dedicated Merge Review, up-to-date branches, resolved conversations, no bypass, no force push, no deletion, and serialized merge/release operations. Merge queue stays disabled until every required external App re-attests the merge-group SHA.
- True owner gates remain only where `Agent Permissions` requires them: Production promotion, pricing, paid services/campaigns, real external communications, raw/ad hoc Production SQL, irreversible Production data loss, and material legal/privacy/security/medical/compliance/funeral-director claims. Merge review is not an owner dependency.
- Never send the owner a routine approval request for planning, design, source changes, tests, GitHub branches/commits/pull requests, CI, Independent QA, Development Head review, merge readiness, documentation, roadmap sequencing, non-production Preview work, or an already-authorized reversible incident recovery. The agent chain decides and executes those actions. Ask only when the exact next action is one of the true owner gates above and cannot safely advance without new authority.
- PR #24 remains the Passage Zero integration umbrella. Large work is presented as bounded Bot-authored stacked PRs or named review packets. PRs #17, #19, #23, #25, and #26 must be incorporated, uniquely bounded, or closed as superseded; overlapping drafts never merge independently.
- The hydration failures on `/pricing`, `/resources`, `/guides`, `/care-providers`, `/trust`, and `/mission` remain a separate Threshold/main P1 hotfix lane and do not count as Passage Zero progress.
- Every public and persona surface must pass the seven-question plain-language gate: Where am I? What needs attention? What do I do now? What happens after I act? What is saved as proof? Who can see it? What do I do if it fails? Raw enums, UUIDs, infrastructure identifiers, cycle/fixture labels, QA/deploy narration, readiness scores, and architecture terms are prohibited there.
- `Demo`, browser-only demo, `Preview`, functional beta, allowlisted pilot, and `Production` remain distinct states. Comprehension at 1440, 390, and 360 is a release gate alongside authority, recovery, overflow, focus, console, hydration, runtime, accessibility, and parity.

## Historical Threshold archive — non-executable context only

Historical record: on 2026-07-11 the then-active redesign was called "Threshold." It is no longer an executable initiative, source of work, or scheduling instruction. `docs/UX-REDESIGN-BRIEF.md` and the sections below are background evidence only where they do not conflict with Passage Zero canonicalization.

The owner (Steve) has explicitly authorized a complete teardown and rebuild of the UI/UX/IA. For redesign work this supersedes the "prefer existing design language / CalmKit" guidance below: keep the Supabase data model, roles, and feature scope as fixed truth, but treat visual design, UX, and IA as greenfield per the brief. Retain only viewer-relative status from CalmKit; rebuild it.

**This "fixed data model" constraint is itself superseded as of 2026-07-14 — see the section immediately below. Read it before assuming the backend is off-limits.**

Deliverable priority: the funeral-home demo path must be production-ready first. Also design the admin-access model (dedicated Admin Portal + secure view/impersonate) and a demo-instance strategy that never exposes demo pages in production. Details in the brief.

## Backend Authorization Update — 2026-07-14 (owner-approved, supersedes the fixed-data-model constraint)

Owner's own words, verbatim, in response to a diagnosis showing the redesign had been executed as a re-skin (colors/fonts/shadows) rather than a real IA rebuild, preserving old page structure "byte-identical": *"It's ideas, our job is to turn it into emotional warmth but modern, millennial and Gen Z, and funeral homes. It's ok to break things, the backend needs to follow the frontend, I gave it greenfield permission, as long as we are clear on what needs to be done backend to keep up let's make sure it's clear. But I want this greenfield now, redo the whole thing, I'm not happy."*

What this changes, precisely:

- The line above ("keep the Supabase data model, roles, and feature scope as fixed truth") and the matching line in `docs/UX-REDESIGN-BRIEF.md`'s Mandate section are **no longer absolute constraints**. The owner has explicitly authorized backend/schema changes where the frontend rebuild genuinely requires them — e.g. the IA doc's ten-section record model, new roles like `support_view`, or data shapes the current schema doesn't cleanly support.
- **"OK to break things" means OK to restructure and redesign, not license for reckless or undocumented destruction of real data.** Every schema change still goes through a real Supabase migration (use the Supabase MCP's migration tooling — `apply_migration`, not raw `execute_sql` for structural changes), stays reversible where reasonably possible, and gets logged in `docs/agent-operating-context.md` like any other change.
- The owner's own condition, stated in the same breath as the authorization: *"let's make sure it's clear"* what backend/schema changes are actually required and why, **before** they're applied. Practical rule: any batch of schema changes needs a short explicit list (what table/column/role, why the frontend needs it, what breaks if it's skipped) written down first — in a plan doc or the PM Sprint Brief — not applied blind in the same motion as discovering the need. This is a documentation-first gate, not a permission-to-ask-again gate; the owner does not want to be asked again, he wants the list to exist so everyone (including him) can see what changed and why.
- Production DB writes still require the same discipline as always: real migrations, not ad hoc SQL against live data; irreversible production data changes and applying raw production SQL remain owner-approval items per the Agent Permissions section below unless the owner has explicitly pre-approved a specific migration in writing (as with this authorization for schema evolution generally — the specific migrations still get listed and reasoned through first, per the paragraph above).

This authorization applies going forward from 2026-07-14. It does not retroactively bless any specific migration already applied — none had been, as of this update.

### Definition of done: mockup is not shipped — added 2026-07-12 after owner correction

`docs/redesign/*.html` files are **reference mockups only** — static design artifacts for review, never rendered by the live app, never linked from any real route. Producing or updating a mockup file is design/spec work, not implementation, and must never be reported to the owner as "shipped," "launched," "revamped," or "live." The owner has been explicit: what he wants is the actual site — real pages under `pages/` and `components/`, styled with the Threshold tokens, wired to live Supabase data through the app's real auth/RLS, built and QA'd at both viewports, and deployed to production so a real visitor sees the new design. Nothing short of that counts as "the redesign" being live, no matter how many mockup files exist in `docs/redesign/`.

Practical rule for every future session (scheduled or interactive) working this initiative:
- Treat each mockup file as a spec for a page/component implementation task, not the deliverable itself.
- A sprint or session is not "done" until the corresponding `pages/*.js` (and any new `components/*.js`) exist, match the mockup, pull real data, and have gone through a **verified** `[deploy][qa-approved]` release — verified via the Vercel MCP, not assumed.
- If a session only has time to build mockups (design/spec work) and not the real implementation, say so plainly in the report: "mockups only, no live surface changed" — do not let that read as progress toward "launched."
- Large real-page implementation work (e.g. re-skinning `pages/funeral-home/dashboard.js`) should be broken into reviewable batches across sessions per `07-sprint-plan.md`, each with real browser QA before its own deploy — not attempted as one blind rewrite with no QA checkpoint.

### Scale and ambition — added 2026-07-12 (run 3), owner directive: full transformation, greenfield

The owner's goal is the **entire app transformed onto Threshold, greenfield** — not an indefinite trickle of one small page per day forever. Run 3 (2026-07-12) proved the safe end-to-end pattern for shipping a real page (presentation-only re-skin, throwaway-branch build proof, deploy, live post-deploy render check) on `pages/funeral-home/summary.js`. That pattern is now the default unit of work, but the *batch size* per run should scale up, not stay at one file forever.

**As of 2026-07-14, "presentation-only re-skin, byte-identical structure" is no longer the target pattern for remaining work — see the Backend Authorization Update above and the density/IA findings in `docs/redesign-diagnosis-2026-07-14.md`. Re-skinning was the safe default while the data model was fixed; now that real IA and backend changes are authorized, remaining Tier 1/Tier 2 work should aim for genuine rebuilds where the diagnosis or brief calls for one, not another coat of paint.**

**Historical tracker only:** `docs/redesign/12-threshold-rollout-tracker.md`, `07-sprint-plan.md`, and `11-funeral-home-polish-scope.md` are archived rationale/evidence. They are not active backlogs, must not schedule work, and must not be updated as Passage Zero ships.

Rules for every future run on this initiative:
- Default to taking the **next 2–5 unshipped Tier 1 items** from the tracker per run (not just one), when they are independent, low-risk, presentation-only re-skins following the proven `summary.js` pattern. This still respects the Deployment Rules' batch guidance below (bundle compatible fixes into one release candidate) — it just raises the default batch size for this specific proven-safe, repeatable pattern.
- Reserve genuine "smallest possible slice" caution for Tier 2 items only — the handful of large monoliths (`dashboard.js`, `estate.js`, `App.js`, `urgent.js`, and similar) that need PM-scoped splitting before any code changes, per `11-funeral-home-polish-scope.md`'s method. Do not let Tier 2's caution bleed into Tier 1's pace — most of Tier 1 is small, static-content-adjacent, or already-isolated pages where a full-file re-skin in one sitting is low risk.
- Do not stop a run after shipping one Tier 1 item if there is remaining time, budget (deploy budget gate below still applies), and more independent Tier 1 items queued. Keep working the list.
- Once all of Tier 1 is checked off in the tracker, the default next action becomes Tier 2 (`pages/funeral-home/dashboard.js` first, per the brief's funeral-home-first priority), split into its own reviewable sub-batches.
- Still never fake QA, never skip the live post-deploy render check, never exceed the deploy budget gate below, and never treat "the tracker still has unchecked items" as license to rush an unsafe batch. Speed comes from taking more *independent, low-risk* items per run, not from cutting the safety steps that made the `summary.js` slice trustworthy.

A scheduled agent run resumes this redesign work on 2026-07-12 at ~12:30pm ET. Prior artifacts are in the workspace folder `Passage-UX-Redesign/`.

---

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

Claude in Chrome is an assistant path, not a permission bypass. Use it only within existing owner-approved access. Do not use Claude in Chrome to spend money, reveal or request secrets, send real customer/vendor/funeral-home communications, make destructive production data changes, bypass auth, or decide legal, privacy, security, medical, or funeral-director claims. If Claude in Chrome helps, record what it was asked to do and what it returned in docs/agent-operating-context.md.

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
5. If the work affects roadmap, sprint order, product vision, or priorities, read `docs/product/operational-readiness-roadmap.md`. It is the sole canonical roadmap. Any legacy `pages/system/admin/saas-roadmap.js` copy is historical until it is replaced by a secure App Router System Admin surface sourced from the canonical roadmap.
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

The greenfield repository has one roadmap only: `docs/product/operational-readiness-roadmap.md`. It is internal/System-Admin source material and must never appear on public or persona-facing pages. The legacy Pages Router source `pages/system/admin/saas-roadmap.js` does not exist in Passage Zero. When the secure App Router System Admin roadmap surface is implemented, it must render this roadmap or a single structured source extracted from it rather than create a second milestone/percentage set. Do not create a second roadmap tab, public roadmap, demo roadmap, or persona-facing roadmap.

Other admin pages are evidence or tools, not competing plans: Pilot Health, Conversion Plan, Enterprise Readiness, Funeral-home QA, Automation Readiness, Refresh Controls, Abuse Controls, and demo sandboxes.

When any loop uncovers an issue outside the active sprint, do not drop it and do not silently expand scope. The Product Manager Agent must classify it as fix now, backlog, roadmap update, watch item, or owner gate; record source evidence and the decision in docs/agent-operating-context.md, and update the single roadmap when priority, sprint order, milestone, or product doctrine changes.

Repo docs may contain historical plans. When they conflict, the canonical roadmap and this operating guide win.

## Deployment Rules

Use meaningful batches. Avoid small deploy chains that cause Vercel rate limiting and hide the real failing commit.

Default deploy budget: one production deploy train per hour and no more than four deploy-triggering commits per day unless production is broken or the owner explicitly approves a quota exception.

Batch rule: bundle two or three compatible small/medium fixes into one release candidate — for the Threshold rollout specifically, see "Scale and ambition" above, which raises this to up to 5 same-pattern presentation-only re-skins per batch. Do not deploy docs-only, roadmap-only, context-only, QA-note-only, or source-only setup commits.

Use [skip deploy] for source batching and documentation/context updates. Use one [deploy] [qa-approved] release commit only when a coherent release candidate has passed the release train.

Agents and schedules never create a Production release commit directly on `main`. The reviewed pull request is the unit of promotion. Repository rules require Bot-authored pull requests, trusted and deterministic current-head checks, expected-source Independent QA, expected-source Dedicated Merge Review, resolved conversations, strict up-to-date state, restricted bypass/force-push, and serialized release work. Production additionally requires expected-source Production Review plus any applicable owner authorization through the protected Production environment or release gate.

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

- You CANNOT get a Vercel preview URL — even on a non-main branch — without a commit whose message has both a deploy marker and `[qa-approved]`. The gate keys on markers, not on branch; branch only decides production vs preview AFTER a build is allowed. (Exception for QA: you may remove `ignoreCommand` from vercel.json ON A THROWAWAY BRANCH ONLY to get a preview build; never merge that branch to main, and restore the gate when done. Note, observed 2026-07-12: even with the gate open, this project's preview deployments sit behind Vercel's own account/team SSO wall — `vercel.com/login?next=/sso-api...` — which blocks unauthenticated browser QA tools. Do not enter Vercel credentials to get past this. Treat pre-deploy preview QA as best-effort; the live post-deploy render check on production is the QA step that actually gates `[qa-approved]` in practice for this project.)
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
- As of 2026-07-14: frontend IA/component rebuilds and backend/schema migrations that implement the Threshold greenfield redesign, provided the migration is done via the Supabase MCP's real migration tooling and the explicit "what and why" list required by the Backend Authorization Update above has been written down first.

Agents must not proceed without explicit owner approval for:

- Changing pricing amounts.
- Sending real emails or SMS to customers, vendors, funeral homes, or leads.
- Applying raw/ad hoc production database SQL outside a real migration.
- Deleting user-facing functionality instead of deprecating or redirecting it.
- Material legal, compliance, privacy, security, medical, or funeral-director claim changes.
- Irreversible production data changes (data loss, not schema evolution via migration).
- Spending money or starting paid campaigns.

## Engineering Rules

- Keep changes consistent with existing patterns.
- Prefer existing helpers, tables, routes, and design language.
- Do not invent a new system when the task/status/audit pattern can carry the work.
- Never fake execution states. Unknown means unknown.
- All real actions should create visible proof: recipient, timestamp, actor, status, and next action.
- Frontend/backend contract parity is a release gate for every slice. Every user-visible action or state must map to a server-authorized command or query, durable persisted state, the applicable RLS/authority predicate, append-only event or proof where the action changes state, explicit failure/recovery behavior, and the correct persona projection. Backend capability must have a truthful reachable UI or be explicitly documented as internal/queued; the UI must never claim a state the backend cannot prove. PM defines the contract matrix, Engineering maintains both sides in the same slice, and QA rejects either frontend-ahead or backend-ahead drift.
- Public and persona-facing pages must stay free of internal language.
- Public and persona-facing pages must answer the seven plain-language questions in `docs/product/release-governance-and-plain-language-policy.md`; render human outcomes instead of raw enum/event keys, UUIDs, fixture/cycle labels, or database/agent narration.
- Internal tools belong under System Admin.
- Verification matters: build, deploy, browser QA, API/data proof, and screenshots where useful.
- Mobile + web in tandem (cohesive responsive — REQUIRED): every real persona surface is built and QA'd at BOTH desktop (>=1366) and mobile (390 and 360) within the SAME slice — never ship one viewport without the other. Same status spine, same CalmKit/CalmControls components and copy across viewports so mobile and web stay cohesive; only layout (widths, stacking, density) adapts. Per-slice hard checks: zero horizontal overflow at 360/390/desktop, tap targets >= DS.tap.min, no hydration warnings. If a session's browser tooling cannot actually resize to these viewports (record the attempt and the actual behavior observed), fall back to verifying the responsive CSS rules shipped correctly (e.g. inspect `document.styleSheets` for the expected media-query rule and selectors) and flag the visual-only gap explicitly rather than skipping the check silently.
- Real app vs. preview shell: real signed-in/persona surfaces use `AppShell frame="app"` (clean, centered, responsive panel). The default `frame="device"` renders a phone mockup (fake "9:41" status bar + bottom tab bar) and is ONLY for /preview reference pages. Never ship the device mockup on a real surface (regression shipped + fixed 2026-06-20, commit 7dba2214).
