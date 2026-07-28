# Passage Zero — internal-verbiage and density re-sweep — 2026-07-26

Status: verified evidence from live hosted-browser testing against the current `greenfield/passage-zero` READY preview (`https://thepassageappio-athhqhtoi-thepassageappio-7018s-projects.vercel.app`, commit `c7c28924` — includes Cycle 8 director/staff proof loop and the PR #50/#56 fix round; predates the vendor persona and family-real-data merges, which have no READY preview yet). `[skip deploy]` — docs only.

## Why this pass exists

New explicit bar from the owner, applied retroactively, not just to new work: **no internal-only verbiage should ever be visible to external users/personas** — no raw workflow/state/internal ids, no engineering jargon. Also: pages that scroll excessively or feel dense/cluttered are real UX issues worth reporting, not just functional bugs. This is a targeted re-check of already-shipped, already-merged director/staff/family surfaces against that bar, since it wasn't the explicit lens used when those surfaces first shipped.

## Findings, ranked by severity

### High — `/staff` "My work" list shows a raw internal state string to staff, on every task card

Both task cards on the staff "My work" list render a field literally labeled **"Next state"** with the value **"in_progress with the assigned staff member"** — `in_progress` is the raw backend status enum, not humanized copy, shown verbatim to a funeral-home staff member. This isn't a one-off: it renders identically on both cards currently in the fixture (NS-2051 and NS-2053).

Reproduction: sign in as staff (`avery-cycle7b@passage.test`), land on `/staff`, read either task card's "Next state" row.

This is exactly the class of leak the owner's new bar is aimed at — every other field on the same card (Owner, Waiting, Case boundary, Human action, Proof destination) is properly humanized; this one field was evidently missed.

### Medium-high — `/staff/work/[id]` shows "Verified by Unassigned" for a real, named verification — contradicts the director's own view of the identical event

On the staff task-detail page for a completed task, the proof history reads: **"Director decision: Verified by Unassigned · Jul 26, 2:47 AM UTC."** The same proof-verification event, viewed on the director's own Case Room page (`/director/cases/[id]`) for the identical task, correctly reads: **"Director decision: Verified by Preview director · Jul 26, 2:47 AM UTC."**

Same event, same timestamp, two different "who verified this" answers depending on which persona is looking — and the staff-facing one falls back to "Unassigned," a status word that actively implies nobody has claimed this yet, directly under a heading that already says "Verified — task complete." That's confusing on its face (task is complete and verified, but verified by "Unassigned"?) independent of the internal-verbiage angle: a name-resolution path that works on the director surface is silently failing and falling back to a placeholder on the staff surface for the same underlying data.

Reproduction: as staff (`avery-cycle7b@passage.test`), open `/staff/work/c7b20001-7b00-47b0-87b0-000000000001`, compare the "Director decision" line against the same event on `/director/cases/c7b10001-7b00-47b0-87b0-000000000001?task=c7b20001-7b00-47b0-87b0-000000000001` (director view) — the verifier name differs.

### Low — recurring "Status unavailable" on `/director/activity`, for an event type PR #56's fix didn't cover

PR #56 fixed "Status unavailable" for `task.assigned`/`task.reassigned` events specifically (resolving before/after to member names). That fix is confirmed working live — the "Task reassigned" entry now correctly shows "Before: Preview staff member / After: Avery Brooks."

But the same symptom is still present for a different event type: the "Staff invitation accepted" entry reads **"Before: Waiting for acceptance / After: Status unavailable."** Root cause is presumably the same shape of bug (a non-status-enum value in `next_state` for this event type that `humanState` doesn't know how to render) — just not the two event types the original fix scoped to. Worth a follow-up pass through `humanState`/`humanBeforeAfter` for the remaining event types (`staff_invitation.*`, `team_access.*`) rather than fixing one event type at a time as each is spotted.

## Environment correction — a density claim I have to retract

I initially measured `/director/cases/[id]` at ~10,725px of scroll height for a handful of short paragraphs and treated that as a "very dense/cluttered page" finding. Before reporting it, I checked why, and found the actual cause: in this browser session, that page's content area was rendering at **0–36px wide** (confirmed via `getBoundingClientRect()` on the container elements), so ordinary sentences were wrapping character-by-character into a near-zero-width column, artificially inflating height by roughly 30–50x. This is the same viewport-floor problem already flagged (this sandbox's browser won't report a usable width on some pages), not a real product bug — retracting that specific claim rather than let a tooling artifact pass as a finding. Per the owner's guidance, not spending further time fighting this; noting it and moving on.

## Density observation that is not a rendering artifact (content-count based, not pixel-based)

To avoid relying on the same unreliable pixel measurements, this checks actual information volume via the accessibility tree instead of scroll height. The director's `/director` "Today" triage page — meant to answer "what needs your attention today" at a glance — renders 3 task cards, and each one carries: category, status badge, case name, owner, waiting-party, due date, visibility, a "How Passage helps" narrative line, a "Passage prepared" narrative line, a proof-destination line, and (for the one unassigned task) a full inline reassignment form with its own dropdown, reason field, and submit button. That's 9+ distinct labeled facts plus two narrative sentences per card, for a page whose stated job is a fast daily scan. Worth a design pass on whether every field needs to be inline on the triage view versus disclosed on click-through to the Case Room (which already exists as a separate, less-dense surface one click away).

## What this pass did not cover

- Vendor (`/partner`) and the new family real-data (`/case/[id]/today`) surfaces — no READY preview exists for either right now (vendor's preview branch had its build gate restored after QA completed; family real-data branch hasn't merged and has no READY build). Vendor was already checked for verbiage/density under the old bar in the prior sweep and read clean at the time; worth a fresh pass once a preview exists.
- `/director/intake` and `/director/invitations/new` — not re-checked this pass.
- A systematic per-string audit of every screen; this pass focused on the surfaces with the most fields per screen (task cards, activity log, case room) since that's where a stray raw value is most likely to hide.
