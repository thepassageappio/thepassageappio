# Handoff — Next Steps (written 2026-07-12, pickup target Wednesday 2026-07-15)

## Where this stands right now

Every deliverable from the original brief plus the mid-project visual-craft correction is committed to `docs/redesign/` on `main`:

- `00-system-findings.md` — live Supabase schema grounding
- `01-design-system-foundation.html` — Threshold design system (v2 craft standard)
- `02-information-architecture.md`, `03-journey-maps.md`, `04-wireframes-annotated.md`, `05-task-spine-coordination-logic.md`, `06-admin-access-demo-instance.md`, `07-sprint-plan.md`
- `08-visual-craft-standard.md` — the mandatory "Apple meets death-tech empathy" bar for all future work
- `09-end-to-end-flow-map.md` — full click-path per persona
- `hero-screens-mockup.html`, `funeral-home-demo-path-mockups.html`, `admin-and-vendor-portal-mockups.html`, `auth-flow-mockups.html`, `family-record-sections-mockups.html`, `messages-notifications-settings-mockups.html`

**Important:** every commit so far used `[skip deploy]` in the message. That was the correct call while this was pure design/docs work, but it also means **nothing has actually gone through the Vercel deploy gate** (`prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`). Nothing described above is live. Don't assume otherwise going into the next session — verify via the Vercel MCP before reporting anything as deployed.

## What's left — 5 screens, all flagged in `09-end-to-end-flow-map.md`

1. Family Dashboard "archive or keep" exit prompt (end of the urgent journey, see journey map §1 exit stage)
2. Family Dashboard "planning mode" variant (setup checklist instead of next-action card)
3. Funeral Home Reporting view (post-completion case view)
4. Vendor quote-submission form (currently only inline-implied on the request card in `admin-and-vendor-portal-mockups.html`)
5. Admin "Recent grants" audit list detail view

These are all small, well-scoped additions — each is a single screen or a variant of an existing one, not a new subsystem.

## Goal of the Wednesday 2026-07-15 session

By the end of that session:

1. All 5 screens above exist as real mockups, built to the `08-visual-craft-standard.md` bar, reusing the established component patterns (`.fam-shell`/`.fam-nav` for family screens, the operator-console patterns from `funeral-home-demo-path-mockups.html` and `admin-and-vendor-portal-mockups.html` for those contexts). Family Dashboard variants should live as new screens inside `hero-screens-mockup.html` or a clearly-named new file — use judgment, but don't scatter dashboard variants across multiple files.
2. `09-end-to-end-flow-map.md`'s "Open items" section is emptied out — each of the 5 items updated to point at its new mockup file, same pattern as the other flow-map entries.
3. A self-review pass confirms every `docs/redesign/*.html` file matches the `08-visual-craft-standard.md` checklist (layered shadows, pill radius scale, gradient buttons, real SVG icons, glass surfaces, type hierarchy, whitespace, hover states, status-pill treatment) — fix anything that's drifted.
4. **A real production deploy happens.** Follow the AGENTS.md release train (Product Manager → UI/UX Review → Development Engineer → QA → Deploy). The final commit(s) that ship this work to `main` must include both `[deploy]` and `[qa-approved]` markers — not `[skip deploy]` — so the Vercel ignore-build gate actually lets it through.
5. `docs/agent-operating-context.md` gets a dated handoff entry for this session, added as part of the same change so the release-train guard (`scripts/check-agent-context.js`) passes normally — no `[skip deploy]` bypass needed this time, since this is a "meaningful" change by design.
6. Verify the deploy actually succeeded — use the Vercel MCP (`get_deployment` / `list_deployments`) to confirm `READY` status and get the live URL. Do not report something as deployed without checking.
7. End with a short report to the owner: what shipped, the live URL, and confirmation there were no CI failures.

## Success criteria (all must be true to call this session done)

- [ ] All 5 open-item screens exist as committed files, v2 craft standard
- [ ] `09-end-to-end-flow-map.md` has zero remaining open items
- [ ] A Vercel production deployment for this project shows status `READY`, verified via tool call, not assumed
- [ ] `docs/agent-operating-context.md` handoff log is current and the CI guard passed without needing `[skip deploy]`
- [ ] No GitHub Action failure emails resulted from this session
- [ ] Owner has a concise final report with the live URL

## Ground rules for whoever (or whatever) picks this up

- Read `AGENTS.md`, `docs/UX-REDESIGN-BRIEF.md`, and this file before doing anything else.
- Read `08-visual-craft-standard.md` before producing any new screen — it's mandatory, not a suggestion.
- Ground every screen in real Supabase enums per `00-system-findings.md` — never invent categories or statuses.
- Do not spawn subagents for routine single-file edits or commits. Use `Write` + GitHub MCP `create_or_update_file` directly. The owner was explicit on 2026-07-12 that subagent delegation for routine work burns credits unnecessarily — reserve it only for something that genuinely can't be done directly (e.g., a file too large to fetch into context).
- Choose `[skip deploy]` vs `[deploy][qa-approved]` deliberately on every commit — the whole point of this session is to finally use the second one.
