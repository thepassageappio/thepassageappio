# Passage Zero persona QA sweep — 2026-07-26

Status: verified evidence from live, hosted browser testing. Not a competing roadmap or audit — complements `docs/product/persona-functional-gap-audit-2026-07-25.md` (route-tree coverage) with functional/behavioral evidence gathered by actually using each persona's flow end to end. `[skip deploy]` — docs only, no code/schema change.

## Scope and course correction

This sweep started against production (`www.thepassageapp.io`, `main`/Threshold) per the original brief, then was redirected mid-session by the owner: **production/Threshold is not what's launching, so testing it further was wasted effort.** All testing after that point targeted the **Passage Zero preview** (branch `greenfield/passage-zero`), via the most recent successful Vercel preview build for that branch:

- Preview URL: `https://thepassageappio-5mhaql7x6-thepassageappio-7018s-projects.vercel.app`
- Branch HEAD tested against: `0c060f5eaf5940d1e4fdb9b064e48e62a4a7a15e` ("Cycle 8 director case room + staff work detail"), confirmed still HEAD as of this doc via `a1554588` (a docs-only follow-up, no code change)
- No new PRs landed on `greenfield/passage-zero` for the family case-detail (`/case/[id]/*`) or vendor persona work flagged as in-flight by the owner mid-session — re-checked periodically, still unmerged as of this writing. Those two personas are noted below as **not yet built**, not tested as broken.

A handful of production/Threshold findings were already gathered before the redirect landed; they're kept in a short appendix since the evidence is real, but they're explicitly out of primary scope now.

## Test method note (read carefully — this created real data)

- Passage Zero's `/`, `/director` (top level), `/family`, and `/receive` run a **client-only, localStorage-based demo mode** ("Preview demo: this choice stays on this device") — no account needed, nothing sent, nothing persisted server-side. Used freely.
- The deeper Cycle 8 routes (`/director/cases/[id]`, `/staff`, `/staff/work/[id]`, `/director/team`, `/director/activity`, `/director/intake`) require real Supabase auth against the **isolated QA project** `passage-cycle-7a-test` (`uyacxqtsiwlvtmhxvoxr`) — explicitly separate from the production Supabase project (`qsveqfchwylsbncsfgxe`), which was never touched. Existing seeded test accounts (`cycle7a-director@passage.test`, `avery-cycle7b@passage.test`) already existed from a prior session's QA cycle; I reset their passwords via direct Admin SQL against the isolated project (the same technique the PR #30 session used) to sign in and drive the real proof-submit → review → verify loop live. This wrote real rows to the isolated test project only (one proof submission + one director verification on case NS-2053, task "Review keepsake artwork") — harmless, matches the project's own QA fixture pattern, not production.
- On production/Threshold (before the redirect), I ran the `/urgent` and `/planning` flows with obviously-fake data (`QA TEST RECORD DO NOT USE`, `steventurrisi+qaaudit@gmail.com`) and completed both "email me a secure link" steps. **This likely wrote two real rows to the production database** (an urgent family record and a planning record) tied to that email alias. Flagging for cleanup — nothing else on production was submitted.

## Findings, ranked by severity

### High — `/staff` role-mismatch screen has two dead buttons (no user recovery path)

When a director-role account lands on `/staff` (wrong workspace for their role), Passage correctly shows "This workspace is outside your role" with three actions: **Open director workspace**, **Return to sign in**, **Sign out**. The last two do nothing:

- Clicking **Sign out** fires zero network requests (confirmed via network trace) and leaves the session and URL unchanged.
- Clicking **Return to sign in** also leaves the URL and page unchanged.
- The only working exit is "Open director workspace" — a staff-role account that ends up here with no director workspace to bounce to would have no way out of this screen through the UI.

This is the same class of bug flagged twice already this week (announce.js resume dead-end, funeral-home staff-invite gap): a screen with buttons that visibly promise an action and silently don't take it.

Reproduction: sign in as any director-role account (e.g. `cycle7a-director@passage.test`), navigate to `/staff`, click **Sign out**, observe no network request and no state change.

### Medium-high — `/director/intake` renders a generic fallback instead of intake content, for a correctly authorized director

PR #30 (merged same day as this sweep) fixed exactly this bug class for two routes: `OperationalBoundary`'s route matcher checked exact static paths and could never match a dynamic segment, so `/director/cases/[id]` and `/staff/work/[id]` silently fell back to a generic "no cases assigned" screen even for correctly authorized users. That fix was scoped to those two routes only.

`/director/intake` shows what looks like the identical fallback pattern: signed in as `cycle7a-director@passage.test` (the same account that renders `/director`, `/director/team`, and `/director/activity` correctly), `/director/intake` shows a generic "You're signed in... no cases are assigned to this account yet" screen with one action, "Create a controlled staff invitation" — which correctly deep-links to a real, fully-built page (`/director/invitations/new`, a working staff-invite form). Nothing on the intake screen resembles the QR-scan / choose-location / create-case flow the route's name and the product's target contract (`persona-action-architecture.md`) describe.

This is reproducible on a fresh sign-in (re-verified by signing out and back in immediately before writing this up). I can't fully rule out "genuinely just an empty/unbuilt landing state" from the outside, but the pattern — real account, real org data displayed correctly, generic fallback copy identical in shape to the pre-PR-#30 bug, one working escape-hatch link — matches the fixed bug's signature closely enough to be worth the fix-focused task's direct attention, referencing `operational-route-gate.ts` and the pattern-matching fix in commit `73770e325ff10ab80f6a913aa2cddb5d5dc05566`.

### Medium — family handoff "Timing" step shows internally inconsistent, past-dated options

On `/family`, step 3 of 4 ("How long should the bridge stay open?"), the three duration options are:

- 24 hours → "Tomorrow at 11:30 AM"
- 3 days → "Friday at 11:30 AM"
- 7 days → **"Tuesday, July 21 at 11:30 AM"**

July 21 is earlier in the calendar than both "tomorrow" and "Friday" relative to the site's own current date, and is in the past relative to today (July 25/26, 2026). The longest access window is showing the earliest — and an already-past — expiry date. This reads as a stale/hardcoded "now" reference in the date math rather than a computed offset from the actual current date. For a product whose whole pitch is "you can trust exactly what this shares and for how long," a visibly wrong expiry date on the one screen that sets that boundary undermines the trust claim directly.

Screenshot evidence captured; reproducible by starting any `/family` handoff and reaching step 3.

### Low — two pluralization/copy bugs on the family handoff path

- `/family/pass` (after creating a pass): "**1 categories move.** Everything else stays here." — should be "1 category moves."
- `/receive` (after accepting a pass): "SCOPE — **1 selected groups**" — should read singular for a count of 1.

Cosmetic, but both are on the two screens meant to reassure a grieving family that Passage is precise about what it shares.

### Low — `/director/activity` shows "Status unavailable" for both before/after fields on a real event

The activity log entry for a real reassignment event ("Preview director reassigned Confirm the arrangement meeting with Maya Rivera") renders `BEFORE: Status unavailable` / `AFTER: Status unavailable`, even though actor, timestamp, reason, and visibility are all populated correctly. The product's own doctrine (`AGENTS.md` "what proof is saved" principle, referenced in `04-wireframes-annotated.md`) is that the activity trail should explain what changed — this entry doesn't, for what looks like a straightforward status-transition event that should have real before/after values to show.

### Scope note, not a bug — `/director` top nav is narrower than the target contract

The authenticated director nav currently shows **Today · Team · Activity** only. `persona-action-architecture.md` / the wireframes doc describe a fuller set (`Today · Cases · Decisions · Team · Partners`). Case-room access still works (via the "Review task" links from Today), so this isn't a dead end — just worth knowing the nav itself hasn't caught up to the newly-shipped case-room routes yet.

## Confirmed working end to end (positive evidence, live mutations)

- **Director ↔ staff proof loop**, independently re-verified live, matching PR #30's own claims: signed in as `avery-cycle7b@passage.test` (staff), clicked **Start work** on an assigned task (state changed `Assigned → In progress` live), submitted proof with real text, task moved to `Waiting for review`; switched to the director account, saw the submitted proof immediately at `/director/cases/[id]`, clicked **Verify proof**, task moved to `Complete` with a full audit trail (submitter, timestamp, verifier, timestamp). No console errors at any step.
- **Family handoff → receive loop**, full round trip on the client-only demo: built a handoff on `/family` (chose receiver, toggled one visible category, set a 24-hour window), generated a real pass code (`PASS-RIVERA-7K4M`), switched to `/receive`, entered that exact code, inspected the pass (correct sender/scope/destination shown), accepted it, and got a receipt referencing the same code and a new case number. Matches the "changes stay on this device, nothing sends automatically" contract precisely.
- **Urgent path** (tested before the pivot, on production, but the flow itself is the same shape Passage Zero will need): full first-response sequence through "assign owner," "prepared next step," and "save family record via secure email link" all worked with no dead ends.

## Confirmed not-yet-built (expected gaps, not bugs — do not treat the same as the findings above)

- `/start` (urgent intake sequence) — 404. Matches `persona-functional-gap-audit-2026-07-25.md`.
- `/partner` (vendor persona, any route under it) — 404. Owner flagged this as actively being built; still unmerged on `greenfield/passage-zero` as of this sweep.
- `/case/[id]` (post-handoff family case surfaces — today/decisions/tasks/messages/service/costs) — 404. Owner flagged this as actively being built; still unmerged as of this sweep.
- `/staff/schedule`, `/staff/messages` — not checked directly but not linked from anywhere in the built staff UI; consistent with the audit's finding that only the core `/staff` + `/staff/work/[id]` slice exists.
- `/director/invitations` (bare, no sub-path) — 404, but `/director/invitations/new` is a real, fully-working page. Not a gap, just no index route.

## Appendix — production/Threshold findings gathered before the pivot (secondary, not the current priority)

Kept short since production/Threshold isn't the launch target, but the evidence is real and cheap to act on if anyone revisits that lane:

- The "secure link" / magic-link emails sent from `/urgent` and `/planning` are **raw, unbranded Supabase default auth templates** ("Confirm your signup", "powered by Supabase ⚡️", "Opt out of these emails") — a jarring contrast with the calm, grief-aware copy everywhere else in the product.
- Both magic links I generated (from `/urgent` and `/planning`, clicked within roughly 10–15 minutes of being sent) came back `otp_expired` / "Email link is invalid or has expired." Worth checking whether the configured OTP expiry is unreasonably short for a product whose users are, by definition, in the middle of an acute event.
- Note: this created two likely-real rows in the **production** database (see Test method note above) tied to `steventurrisi+qaaudit@gmail.com` — flagging for cleanup since production data hygiene wasn't the point of this pass.

## What this sweep did not cover

Given the mid-session pivot, I did not get to: family/participant flows beyond pass issuance (blocked on `/case/[id]/*` not existing yet), any vendor-side testing (blocked on `/partner` not existing yet), `/director/decisions` or any `/director/cases/[id]` sub-tabs beyond Now/Tasks/Proof, and a systematic pass over `/receive/inspect`, `/receive/destination`, `/receive/receipt` as distinct sub-steps (the sweep exercised the flow through the combined `/receive` UI rather than those specific paths, which may or may not exist as separate routes). Recommend a follow-up pass once the family case-detail and vendor PRs land.
