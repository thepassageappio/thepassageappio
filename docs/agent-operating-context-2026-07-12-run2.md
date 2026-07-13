# Agent Operating Context — Addendum, 2026-07-12 (scheduled run "resume Threshold, ship it")

**Note on file split:** `docs/agent-operating-context.md` is now large enough (~96K+ characters) that this session could not safely read-and-rewrite it in full without exceeding tool/context limits. Rather than risk a lossy overwrite, this run's handoff is recorded here in full per AGENTS.md's required fields, and the main file should get a trim/archive pass in the next session (move older dated entries to `docs/agent-operating-context-archive-<date>.md`, keep the living file lean). Flagged as a backlog item, not fixed this run.

## Role instances this run
Single agent session, self-differentiated by role per AGENTS.md's "distinct role rule" — each role's decision recorded below as its own step rather than blended.

- **Product Manager:** re-scoped the task's four asks against what's safely achievable in one unattended, non-interactive run with a single shared production Supabase project (no staging) and no browser-QA tooling against a live preview.
- **UI/UX Review:** the 5 new screens were checked against `08-visual-craft-standard.md` (layered shadows, pill radius scale, gradient CTAs, real SVG icons, glass nav, type hierarchy) before commit — PASS.
- **Development Engineer:** built the 5 mockups, applied one additive Supabase migration, wrote the demo reseed script.
- **QA:** self-review only for the mockup/demo work (no live browser QA performed — see Deploy section for why that's still safe here). Docs/SQL reviewed for internal consistency; migration verified via a follow-up SELECT after apply.
- **Deploy:** ran once this run, after explicit owner direction to launch — see "Release" section below.

## Prior handoff received
`docs/redesign/10-handoff-next-steps.md`, written 2026-07-12, targeted a 2026-07-15 pickup. This run picked it up early (scheduled task fired same-day). That handoff's own success criteria are addressed below, with one correction: it proposed deploying the docs-only mockup batch with `[deploy][qa-approved]`. That conflicts with `docs/deployment-discipline.md`'s explicit rule ("Do not spend a deploy on: Documentation-only changes"), so it was not followed automatically — the 5-screen batch itself stayed `[skip deploy]`. The owner then reviewed the report and explicitly asked to launch anyway; see Release section for how that was reconciled without faking QA.

## What shipped this run
1. `docs/redesign/remaining-screens-mockups.html` — the 5 previously-open screens (family exit prompt, family planning-mode, funeral-home reporting, vendor quote form, admin grant detail), v2 craft standard. `[skip deploy]`.
2. `docs/redesign/09-end-to-end-flow-map.md` — updated, zero open items remain. `[skip deploy]`.
3. One additive Supabase migration (`create_demo_funeral_home_org`) — new `organizations` row for the demo tenant, id `b36f8032-2f08-43f1-91f6-760c3c4f4ca6`, slug `rivera-funeral-home-demo`. No existing row touched. (Direct DB change, not a Vercel deploy.)
4. `scripts/demo-reseed.sql` — ready-to-run seed for demo case data, scoped entirely to the org id above, blocked on one manual step (see Owner gates). `[skip deploy]`.
5. `docs/redesign/11-funeral-home-polish-scope.md` — PM brief scoping the director/employee console rewrite as its own future cycle rather than attempting it blind this run. `[skip deploy]`.
6. This file, as the release commit — `[deploy][qa-approved]`.

## PM Sprint Brief status
No new sprint opened this run — operated within the existing `07-sprint-plan.md` Sprint 4 (demo instance + admin access) and closed its mockup/flow-map prerequisites. Sprint 2/3 (task-spine implementation) and the console rewrite scoped in item 5 above remain queued, unstarted, for a dedicated future session with interactive QA available.

## UI/UX status
PASS for all 5 new mockups against `08-visual-craft-standard.md`. UX Review: N/A for the Supabase migration, reseed script, and this release commit (no user-facing surface changed).

## Development handoff / files changed (cumulative, this run)
- `docs/redesign/remaining-screens-mockups.html` (new)
- `docs/redesign/09-end-to-end-flow-map.md` (updated)
- `docs/redesign/11-funeral-home-polish-scope.md` (new)
- `scripts/demo-reseed.sql` (new)
- `docs/agent-operating-context-2026-07-12-run2.md` (this file)
- Supabase migration `create_demo_funeral_home_org` (applied to project `qsveqfchwylsbncsfgxe`)
- **No files under `pages/`, `components/`, `lib/`, or `pages/api/` were touched at any point this run.**

## QA status
No live browser QA this run — there was no application behavior to test, by design (see Release section). Docs/SQL self-reviewed. No regressions possible against production since zero application code changed and the one database change was additive-only, verified read-back after apply.

## Release (this commit)
Owner reviewed the "why no deploy" explanation from earlier in this run and explicitly directed: finish the 5 pages (already done) and launch/deploy the milestone. Before adding `[deploy][qa-approved]` to this commit, re-verified via the GitHub API that every commit in this batch touched only files under `docs/` and `scripts/` — zero application code. That is the real basis for `[qa-approved]` here: a verified zero-blast-radius release (nothing for a user or funeral home to experience differently), not an assertion that a feature was tested end-to-end. Treat this as a one-time checkpoint release at the owner's explicit request, not a precedent for skipping QA on future docs batches — those should still default to `[skip deploy]` per `deployment-discipline.md` unless the owner asks again.

## What is queued but not deployed
The funeral-home console rewrite (`11-funeral-home-polish-scope.md`) and Sprint 2/3 task-spine implementation remain fully unstarted — no code exists yet to deploy for those.

## Current Vercel/deploy status
This commit is the first `[deploy][qa-approved]` commit since `c86ee14a9573f943ea280d82fb4936382c2e9c55` (2026-07-03). Verify `READY` via the Vercel MCP after this commit lands — do not assume success without checking (per AGENTS.md).

## Owner gates (things only Steve can finish)
1. **Demo director login.** Sign up once at `/funeral-home/setup` with a dedicated demo email (suggested `demo@thepassageapp.io`), then repoint that account's `organization_members.organization_id` to `b36f8032-2f08-43f1-91f6-760c3c4f4ca6` (the seeded demo org). Supabase Auth users can't be safely created via raw SQL and no Auth-admin MCP tool is available in this environment — this is a hard technical blocker, not a caution. Full instructions are in the header of `scripts/demo-reseed.sql`.
2. **Run `scripts/demo-reseed.sql`** after step 1, with `:owner_user_id` replaced by the new account's `auth.users.id`, to populate the 3 sample cases + task spines.
3. **Funeral-home console rewrite** — next dedicated engineering session, per `11-funeral-home-polish-scope.md`.

## Next highest-leverage action
Once the owner completes gate #1–2 above, the demo instance is sellable end-to-end. After that, the next Product Manager cycle should scope the console-rewrite punch list in `11-funeral-home-polish-scope.md` as its own sprint with a real QA checkpoint.

## Claude-in-Chrome / external-agent assistance
None used this run.
