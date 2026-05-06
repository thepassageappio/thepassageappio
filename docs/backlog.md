# Passage Backlog

## Now (May 4-May 6, 2026)

- Round 14 ironclad spine pass: make funeral-home work, staff roles, and reporting visible from the same task/audit data; see `docs/ironclad-operating-spine-roadmap.md`.
- Post-simplification QA sweep (0d2bc3a..11902d0): command center hierarchy + nav, wishes save, comms center parity; no dead ends.
- Stop-the-line regressions: estate persistence, invite confirmation, partner case creation/load, task action feedback (no "Confirmed" without proof).
- Persona QA: red-path (home/hospice/hospital/past-first-steps) + funeral-home demo (one-location + multi-location) + invited family view; always one clear next action.
- Webhook-as-proof QA: Resend + Twilio `webhook_events` record provider + timestamp + actor and are surfaced as proof; vendor requests show Sent/Received/Accepted/Declined with visible activity.
- Partner + vendor access policy (minimal): roles + org membership (multi-location admin vs staff vs vendor vs Passage admin) + who can act-on-behalf.

## Next

- Build shared `TaskActionModal` so family, participant, funeral-home staff, and vendor-adjacent task surfaces use the same assign/send/proof/waiting/help/handled interaction.
- Add participant and funeral-home employee onboarding reliability: assignment notifications land on a role-appropriate work page with one clear action.
- Productize Tier 1 outputs: obituary draft, funeral-home packet, family notification set, clergy outreach, bank/government packets, executor summary, and home/assets checklist.
- Turn system-admin demo into a one-step-at-a-time guided sales studio with dummy-only data and a stronger prospect narrative.
- Tighten and freeze the 15-minute funeral home demo script + objection answers (doc-only until owner approves outreach).
- Produce a one-page pilot handout (offer terms placeholders; no pricing changes).
- Map top red-path tasks into automated / assisted / guided-manual tiers; list proof required + follow-up loop for each.
- Identify owner-facing notification gaps for participant/vendor/funeral-home completion events (inventory only).
- Define trusted vendor criteria + an approval/override process for funeral homes.
- Add a demo-visible Release / Certificate Pipeline: pronouncement, ME/coroner involvement, hospital or hospice release, death certificate submitted/certified, permit/authorization collected, each with owner, timestamp, and proof.
- Create a Funeral-Rule-safe after-hours info pack: GPL link, itemized price guidance, cash-advance clarity, and a phone-safe script that reduces repeat calls without turning Passage into a pricing app.
- Make hybrid planning the default posture: self-serve intake plus director-assisted handoff that pre-fills known facts, especially for funeral homes where families start online and still need human help.
- Add a Faith & Care Team cluster: chaplain/officiant, service preferences, livestream owner, clergy contact, and proof fields for outreach/status.
- Add an after-death admin hub downstream of death certificates: SSA/Medicare, banks, insurance, credit bureaus, scam/debt-collector guardrails, owner, and done-proof.

## Later

- Vendor payments / Stripe Connect design (after pilots validate demand).
- Document upload as a funeral home pilot add-on after core demos are stable.
- Family chat only after pilot feedback confirms need.
- State-specific workflows + deeper compliance guidance.
- Marketplace revenue-share reporting for funeral homes.

## Questions

- Which local funeral homes are first pilot targets (one-location vs multi-location mix)?
- What is the pilot offer structure (length, trial, price) as of May 2026?
- Which vendor categories get seeded first in Hudson Valley (1-2 per task only)?
- Which parts of healthcare proxy guidance require legal review before demos?
- What are the 5 must-have analytics events before broader outreach?

## Blocked / Needs Owner

- Production SQL changes require owner approval and manual Supabase execution (unless deployment pipeline changes).
- Real customer/vendor/funeral-home emails or SMS require owner approval.
- Pricing changes require owner approval.
