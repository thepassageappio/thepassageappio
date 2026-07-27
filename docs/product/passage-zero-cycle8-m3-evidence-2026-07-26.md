# Cycle 8 M3 evidence — denial-matrix, reload-persistence, and responsive pass for `/director/cases/[id]` and `/staff/work/[id]` — 2026-07-26

Status: verified evidence from direct SQL/RLS testing against the isolated QA Supabase project (`uyacxqtsiwlvtmhxvoxr`), live hosted-browser corroboration against the current `greenfield/passage-zero` READY preview (`https://thepassageappio-adlacsyx0-thepassageappio-7018s-projects.vercel.app`, commit `0a3d5660`), and code-level responsive review. `[skip deploy]` — docs only, no code/schema change.

## Why this pass exists

PR #24's punch list names the "1440 / 390 / 360 acceptance bar" as a mandatory hosted gate for user-facing release candidates, and separately calls out a Cycle 8 evidence gap: denial-matrix, reload-persistence, and responsive coverage for `/director/cases/[id]` and `/staff/work/[id]` were the specific remaining blocker (see PR #55, PR #58 commit messages) after the interactive proof-review core loop itself was proven live. This pass closes that named gap with real evidence, not a re-assertion that the RLS layer is "probably fine."

## Part 1 — denial matrix (8 cases: 6 denials + 2 positive controls)

Method: direct SQL against the actual RLS-enforced read path the app itself exercises (`SELECT count(*) FROM public.workflows/tasks WHERE id = ...`), run as the impersonated user via `SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims = '{"sub":"<uuid>","role":"authenticated"}'` inside rollback-only transactions — never against production. Target fixtures: workflow `c7b10001-7b00-47b0-87b0-000000000001` and its task `c7b20001-7b00-47b0-87b0-000000000001`, in the seeded funeral-home org `c7a00001-7a00-47a0-87a0-000000000001`.

| Case | Persona / fixture | Expected | SQL result | Live browser corroboration |
|---|---|---|---|---|
| D1 | Wrong-org director (`qa-rival-director@passage.test`, director of a rival org) opens `/director/cases/[id]` | Denied | 0 visible rows | Confirmed — clean "This case is not available to your account." denial, working "Return to Today" link |
| D2 | Wrong-location, same-org director (`qa-wronglocation-director@passage.test`, active director role but no grant for this case's location) opens `/director/cases/[id]` | Denied | 0 visible rows | Confirmed — identical clean denial screen and copy as D1 |
| D3 | Revoked-membership staff (`cycle7a-staff@passage.test`, `organization_members.status = 'revoked'`) opens `/staff/work/[id]` | Denied | 0 visible rows | Confirmed — clean "Workspace access remains closed... Your team access has ended. No funeral-home work is visible." |
| D4 | Wrong-org staff (`qa-rival-staff@passage.test`, staff of a rival org) opens `/staff/work/[id]` | Denied | 0 visible rows | Confirmed — clean "This work is not available to your account." denial, working "Return to My work" link |
| D5 | Unassigned same-org staff (`qa-unassigned-staff@passage.test`, active staff role, not the task's assigned member) opens `/staff/work/[id]` | Denied | 0 visible rows | Not attempted live — SQL-verified only |
| D6 | Revoked-location-grant director (`qa-revokedgrant-director@passage.test`, active director role, location grant explicitly revoked) opens `/director/cases/[id]` | Denied | 0 visible rows | Not attempted live — SQL-verified only |
| Control A | Correct director (`cycle7a-director@passage.test`, active, granted this location) opens `/director/cases/[id]` | Allowed | 1 visible row | Confirmed throughout this and prior sweeps |
| Control B | Correct, assigned staff (`avery-cycle7b@passage.test`, active, this task's assignee) opens `/staff/work/[id]` | Allowed | 1 visible row | Confirmed throughout this and prior sweeps |

All 8/8 results are correct: every denial case returns zero visible rows through the actual enforced read path, and both positive controls return exactly the one expected row. Live browser corroboration was obtained for the four highest-value cases (both denial reasons — wrong-org and wrong-location/revoked — on both routes); D5 and D6 share the same underlying authorization predicate as D1–D4 (`can_manage_location` / `can_view_task`, both of which gate on active membership + role + non-revoked location grant) and were not independently re-verified in the browser given that predicate overlap, but are fully SQL-verified against the real enforced path.

Every live denial screen observed was plain-language and correctly worded — no raw ids, state enums, or engineering jargon — consistent with the verbiage bar from the prior re-sweep (PR #61).

## Part 2 — reload-persistence

Both routes were re-verified via fresh full navigations while authenticated (equivalent to a hard reload): session persisted correctly, no re-login prompt, no blank or stale intermediate state, and the same correct content rendered each time.

- `/director/cases/c7b10001-7b00-47b0-87b0-000000000001` — confirmed.
- `/staff/work/c7b20001-7b00-47b0-87b0-000000000001` — confirmed.

## Part 3 — 1440 / 390 / 360 responsive pass

**Environment limitation, confirmed and worse than previously scoped.** In this browser sandbox, `window.screen.width/height` report a hard `640×480` regardless of `resize_window` calls. This pass additionally found that `resize_window` to 1440×900 — a size *larger* than the reported screen — is rejected outright (`Invalid value for bounds. Bounds must be at least 50% within visible screen space.`), so the floor isn't only a "can't go below 640px" problem as previously logged; **no width in the 1440/390/360 acceptance bar is currently achievable live in this sandbox.** Per prior guidance, not spending further time fighting this — noting it here as the confirmed, current state of the limitation for whoever picks up a fix.

**Code-level substitute evidence.** Both target routes render through the identical shared stylesheet — `app/proof-loop.module.css` — confirmed via direct source read of `app/director/cases/[workflowId]/page.tsx` and `app/staff/work/[taskId]/page.tsx` (both `import styles from '../../../proof-loop.module.css'`). That stylesheet's responsive rules:

- `@media (max-width: 900px)`: the two-column `.layout` grid (`minmax(0, 1.35fr) minmax(300px, .65fr)`) collapses to a single column — covers the transition toward narrow/tablet widths.
- `@media (max-width: 620px)`: hero stacks to one column, the two-column `.facts` grid collapses to one, `.actions`/`.formActions` stack to one column, and panel padding tightens from `clamp(20px, 3vw, 32px)` to `20px 16px` — directly covers the 390/360 range in the acceptance bar.
- Above 900px (covering 1440), the layout is fluid (`minmax()`/`clamp()`-based, no fixed pixel widths), so nothing in the stylesheet suggests overflow or breakage risk at wider desktop widths; this was also visually spot-checked with no horizontal overflow at the 640px width available in this sandbox during the prior vendor-persona sweep.

This is the same class of evidence (well-targeted, explicit breakpoints in the actual CSS shipped for these exact two routes) previously accepted as substitute evidence for `/proof-loop` and `/operations-beta` surfaces. It is not a replacement for a real rendered screenshot at 1440/390/360, which still requires a tool that can actually resize below/above this sandbox's fixed 640×480 screen.

## What this pass did not cover

- Live-rendered screenshots at 1440, 390, or 360 — blocked by the sandbox's screen cap; see above.
- Live browser corroboration of D5 (unassigned same-org staff) and D6 (revoked-location-grant director) — SQL-verified only, sharing the same authorization predicate as the four browser-corroborated cases.
- Any authorization path other than `can_view_task`/`can_manage_location` (e.g., the family-access branch of `can_view_workflow_as_family`) — out of scope for this pass, which was scoped specifically to the director/staff denial matrix named in the punch list.

## Bottom line for the PR #24 punch list

The Cycle 8 M3 evidence gap — denial-matrix, reload-persistence, and 1440/390/360 responsive coverage for `/director/cases/[id]` and `/staff/work/[id]` — is now substantively closed: 8/8 correct denial-matrix results (SQL) with live corroboration on the four highest-value cases, confirmed reload-persistence on both routes, and code-level responsive evidence for the exact shared stylesheet both routes render through. The one remaining open item is genuine live-rendered screenshots at the three acceptance-bar widths, which depends on a sandbox/tooling fix outside this pass's control.
