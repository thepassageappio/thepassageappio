# Agent Operating Context — Addendum, 2026-07-12 (scheduled run "resume Threshold, ship it")

**Note on file split:** `docs/agent-operating-context.md` is now large enough (~96K+ characters) that this session could not safely read-and-rewrite it in full without exceeding tool/context limits. Rather than risk a lossy overwrite, this run's handoff is recorded here in full per AGENTS.md's required fields, and the main file should get a trim/archive pass in the next session (move older dated entries to `docs/agent-operating-context-archive-<date>.md`, keep the living file lean). Flagged as a backlog item, not fixed this run.

## Role instances this run
Single agent session, self-differentiated by role per AGENTS.md's "distinct role rule" — each role's decision recorded below as its own step rather than blended.

- **Product Manager:** re-scoped the task's four asks against what's safely achievable in one unattended, non-interactive run with a single shared production Supabase project (no staging) and no browser-QA tooling against a live preview.
- **UI/UX Review:** the 5 new screens were checked against `08-visual-craft-standard.md` (layered shadows, pill radius scale, gradient CTAs, real SVG icons, glass nav, type hierarchy) before commit — PASS.
- **Development Engineer:** built the 5 mockups, applied one additive Supabase migration, wrote the demo reseed script.
- **QA:** self-review only (no live browser QA performed — see Deploy section). Docs/SQL reviewed for internal consistency; migration verified via a follow-up SELECT after apply.
- **Deploy:** did not run — no deploy-worthy release candidate this run (see below).

## Prior handoff received
`docs/redesign/10-handoff-next-steps.md`, written 2026-07-12, targeted a 2026-07-15 pickup. This run picked it up early (scheduled task fired same-day). That handoff's own success criteria are addressed below, with one correction: it proposed deploying the docs-only mockup batch with `[deploy][qa-approved]`. That conflicts with `docs/deployment-discipline.md`'s explicit rule ("Do not spend a deploy on: Documentation-only changes") and was not followed — the 5-screen batch stayed `[skip deploy]` as the stable rule requires.

## What shipped this run (all `[skip deploy]`, all on `main`)
1. `docs/redesign/remaining-screens-mockups.html` — the 5 previously-open screens (family exit prompt, family planning-mode, funeral-home reporting, vendor quote form, admin grant detail), v2 craft standard.
2. `docs/redesign/09-end-to-end-flow-map.md` — updated, zero open items remain.
3. One additive Supabase migration (`create_demo_funeral_home_org`) — new `organizations` row for the demo tenant, id `b36f8032-2f08-43f1-91f6-760c3c4f4ca6`, slug `rivera-funeral-home-demo`. No existing row touched.
4. `scripts/demo-reseed.sql` — ready-to-run seed for demo case data, scoped entirely to the org id above, blocked on one manual step (see Owner gates).
5. `docs/redesign/11-funeral-home-polish-scope.md` — PM brief scoping the director/employee console rewrite as its own future cycle rather than attempting it blind this run.

## PM Sprint Brief status
No new sprint opened this run — operated within the existing `07-sprint-plan.md` Sprint 4 (demo instance + admin access) and closed its mockup/flow-map prerequisites. Sprint 2/3 (task-spine implementation) and the console rewrite scoped in item 5 above remain queued, unstarted, for a dedicated future session with interactive QA available.

## UI/UX status
PASS for all 5 new mockups against `08-visual-craft-standard.md`. UX Review: N/A for the Supabase migration and reseed script (backend-only, no user-facing surface).

## Development handoff / files changed
- `docs/redesign/remaining-screens-mockups.html` (new)
- `docs/redesign/09-end-to-end-flow-map.md` (updated)
- `docs/redesign/11-funeral-home-polish-scope.md` (new)
- `scripts/demo-reseed.sql` (new)
- Supabase migration `create_demo_funeral_home_org` (applied to project `qsveqfchwylsbncsfgxe`)

## QA status
No live browser QA this run — no deployed preview existed to test against (see Deploy). Docs/SQL self-reviewed. No regressions possible against production since zero application code changed and the one database change was additive-only, verified read-back after apply.

## What is queued but not deployed
Everything above stayed `[skip deploy]`. Nothing from this run has gone through the Vercel deploy gate. Production is unchanged app-code-wise from before this run.

## What was tested and what failed
Not applicable in the traditional sense — no code change existed that required a build/runtime test. The one live-system change (the migration) was tested by re-querying the new row post-apply; it returned correctly.

## Current Vercel/deploy status
Not touched this run. Last known production state is whatever `main` was at the start of this session (commit `90648e51a2b6487378fdc67147c060dd4268c1a0` and earlier `[deploy][qa-approved]` releases from 2026-06-21 / 2026-07-03 — see `git log`). No new deploy attempted or verified this run because there was no deploy-worthy, QA'd, user-visible release candidate — see "Why no deploy" below.

## Why no deploy happened this run (the task's explicit safety clause)
The scheduled task's own instructions say: *"if QA fails, or the deploy can't be verified READY, or anything looks broken, DO NOT force it — stop, keep [skip deploy] state, and report exactly what blocked."* Applying that here:
- The mockup/flow-map work is documentation-only — `deployment-discipline.md` explicitly forbids spending a deploy on it, regardless of what `10-handoff-next-steps.md` (an earlier session's aspirational plan) suggested.
- The demo-org migration is a backend-only, additive database change with no corresponding application code change to deploy.
- A full rewrite of the 449KB funeral-home console was deliberately not attempted blind (see `11-funeral-home-polish-scope.md`) — there is nothing there to ship either.
- Net result: no coherent, QA'd, user-visible release candidate existed at any point this run. Creating a `[deploy][qa-approved]` commit without one would mean faking the QA-approved marker, which the deploy gate documentation explicitly prohibits ("Never add `[qa-approved]` to a commit before QA has actually passed").

## Owner gates (things only Steve can finish)
1. **Demo director login.** Sign up once at `/funeral-home/setup` with a dedicated demo email (suggested `demo@thepassageapp.io`), then repoint that account's `organization_members.organization_id` to `b36f8032-2f08-43f1-91f6-760c3c4f4ca6` (the seeded demo org). Supabase Auth users can't be safely created via raw SQL (bypasses GoTrue password hashing) and no Auth-admin MCP tool is available in this environment — this is a hard technical blocker, not a caution. Full instructions are in the header of `scripts/demo-reseed.sql`.
2. **Run `scripts/demo-reseed.sql`** after step 1, with `:owner_user_id` replaced by the new account's `auth.users.id`, to populate the 3 sample cases + task spines.
3. **Funeral-home console rewrite** — next dedicated engineering session, per `11-funeral-home-polish-scope.md`. Not owner-gated exactly, but flagged as too large/risky for another unattended pass.

## Next highest-leverage action
Once the owner completes gate #1–2 above, the demo instance is sellable end-to-end. After that, the next Product Manager cycle should scope the console-rewrite punch list in `11-funeral-home-polish-scope.md` as its own sprint with a real QA checkpoint (interactive session or throwaway-branch Vercel preview per AGENTS.md's QA exception).

## Auto-advance
Did not auto-advance into a deploy because no deploy-worthy candidate existed (see above) — this is the documented exception ("the next... action requires explicit approval... or the same external blocker has repeated"), specifically the Auth-admin tooling gap, which is a real environment limitation, not a repeated-and-ignorable blocker.

## Claude-in-Chrome / external-agent assistance
None used this run — no browser QA was possible/attempted (no deployed preview to point it at).
