# Live Demo Script — Funeral Home Prospects

**Sandbox = production.** This script runs entirely on `www.thepassageapp.io` (the live `main`/Threshold site). There is no separate demo environment and nothing to "spin up" first — what's live right now is what you show. See "Keeping this current" at the bottom for what that means day to day.

Verified live end-to-end on 2026-07-26. No console errors, no dead links, no broken images found on any page below.

---

## Before you're in the room

- Have this doc open on a second screen or printed — don't narrate from memory.
- Start from a clean/incognito browser tab if possible, so you're not showing your own test data or a half-finished wizard draft.
- Know your one story: "a death just happened," "a family planning ahead," or "a funeral home running cases." Pick the persona that matches the prospect and don't try to show all three.

---

## Persona 1: Funeral home director (primary path — lead with this)

**Start URL:** `https://www.thepassageapp.io/funeral-home`

This is the strongest page in the product for this audience. It's got a real (anonymized) sample case, the three-step "how it fits your house" pitch, and pricing, all with zero setup required.

1. Land on `/funeral-home`. Walk the hero, then the sample case card ("Price family arrangement — waiting on family, owner Maria the arranger, next step, proof").
2. Click **"See a real sample case"** → lands on `/funeral-home/sample-case`. No sign-in. Scroll through: case clarity stats (One family / Visible next action / Drafted family update), then the case proof packet export card. This is the single best "show, don't tell" moment in the whole demo — a full intake-to-proof case with nothing to type in.
3. Back out, show the three pricing tiers (Starter Rollout $99.99/mo, Local Account $249.99/mo, Group Account $349.99/mo) so they know where this is headed.
4. If they want to see the account-creation flow: `/funeral-home/setup`. This is gated behind sign-in (Google or an emailed link) — don't try to push through it live unless you're already signed in as an owner/director test account. Show the four setup steps listed on the page (dashboard → roles/staff invite → first case → first next step) and stop there.

**Est. time:** 5–7 minutes.

## Persona 2: Family member / "someone just passed" (urgent path)

**Start URL:** `https://www.thepassageapp.io/urgent`

No sign-in needed to walk the whole thing.

1. Click a situation card, e.g. **"Unexpected at home."** ("Under hospice care" or "In a hospital" also work — pick whichever matches the prospect's own case mix.)
2. Walk the branching guidance: what to do first, who's with them, pronouncement status, funeral home status. Point out the "This is normal to not know" affordance and the "what usually happens next" numbered list — this is the emotional core of the pitch.
3. Show the "Minutes / Today / Next 72 hours" triage grouping and the "Assign owner" step.
4. Stop before the final **"Save with Google" / "Email me a secure link"** actions — those are real account-creation/email-send actions, not preview states. Narrate what they'd do instead of clicking them, unless you intend to actually create a live record.

**Est. time:** 4–5 minutes.

## Persona 3: Family member / planning ahead

**Start URL:** `https://www.thepassageapp.io/planning` (go direct — see note below on the homepage button)

1. Walk all 4 steps: who the plan protects → primary trusted contact → second trusted contact → optional details (healthcare proxy, burial/cremation preference, faith/cultural notes, documents location).
2. Narrate the "two trusted confirmations" model as you go — it's the key trust mechanic ("a planning record can't quietly become urgent from one person alone").
3. Stop at step 4's **"Email me a secure link"** — same real-send caveat as above.

**Est. time:** 3–4 minutes.

## Optional: family update / announce flow

**Start URL:** `https://www.thepassageapp.io/announce`

1. Pick an audience card ("Immediate family," etc.), click Continue.
2. Show the three message tones (Simple and direct / Warm and personal / Brief) with live preview text.
3. Stop before **"Review and send."**

**Est. time:** 2 minutes. Good filler if the prospect asks "how do updates actually go out."

## Optional: vendor request (if prospect asks about vendor coordination)

**Start URL:** `https://www.thepassageapp.io/vendors/request?demo=1&demoTour=funeral-home&demoStep=vendor`

Pre-built, labeled "Sample mode" — safe to click through freely, nothing sends. Shows a scoped vendor request end to end (owner, next expected update, request loop).

**Est. time:** 2 minutes.

---

## What NOT to click live

- **Homepage hero "Plan ahead" button** — this is a real link, not a bug, but it routes to `/pricing`, not straight into the planning wizard (the "I want to plan ahead" persona card further down the same homepage correctly links to `/planning`). If you want the wizard, start from `/planning` directly or use that lower card — don't use the hero button and then have to explain a detour through pricing mid-demo.
- **Any "Email me a secure link" / "Save with Google" / "Review and send" button** in the planning, urgent, or announce flows — these fire real emails or create real records. Fine to click if you *want* to create a live record for the prospect to log into later; otherwise narrate and move on.
- **Staff removal/deactivation** — directors can currently only *add* staff, not remove or deactivate them. If a prospect asks "what if someone leaves," answer verbally; don't try to demo it.
- **Deep staff-dashboard roster view** — the roster rendering hasn't been independently re-verified as recently as the rest of this pass. If you're demoing past sign-in into the director dashboard, do a 30-second personal check of the staff roster screen shortly before the call, just in case.
- **Anything past the `/funeral-home/setup` sign-in gate**, unless you're already signed in on a known-good test account. Don't attempt Google sign-in or email-link auth live in front of a prospect — if it hangs or the email is slow to arrive, it kills the moment. Sign in ahead of time if you plan to show the dashboard.

---

## Keeping this current

`main` **is** production — `www.thepassageapp.io` serves whatever is currently merged to `main`. There's no separate sandbox to snapshot, rebuild, or refresh before a demo. As long as you're pointing at `www.thepassageapp.io`, you're always looking at the current live state automatically.

The one thing to know: `main` is intentionally kept as a stable, maintenance-only lane while the next-generation rebuild ("Passage Zero") happens on a separate branch that never touches production until it's explicitly promoted. So this demo surface won't shift under you day to day — changes to `main` are supposed to be limited to real bug fixes, not new redesign work, and go through a QA gate before they ship. Practical takeaway: you don't need to "refresh" anything, but if you know a fix shipped to `main` since your last demo, it's worth a quick click-through of the specific page that changed (2–3 minutes) rather than assuming nothing moved.

---

## Language check

Scanned every page in this script for the kind of internal-only language that shouldn't reach a prospect — raw database IDs, UUIDs, workflow/state enum names, "QA," "deploy," "hydration," fixture/cycle labels, etc. **None found.** Every page uses plain, human language ("waiting on family," "next step," "proof," "drafted," "ready") consistent with the product's own plain-language standard. Worth a periodic re-check (this doc, re-run) after any batch of changes ships to `main`, but nothing to fix today.

---

## Known gaps in this verification pass

- Could not verify anything past the `/funeral-home/setup` sign-in gate (dashboard, staff roster, staff invite completion) without a signed-in director account — do a personal pass on that before a demo that goes past sign-in.
- True mobile-viewport (390px/360px) visual QA wasn't achievable with this session's browser tooling (window resize wasn't reflected in screenshot capture). Functional/DOM checks passed at the tested viewport with no console errors; a quick manual phone check of the homepage, `/urgent`, and `/funeral-home` before your first live demo is cheap insurance.
