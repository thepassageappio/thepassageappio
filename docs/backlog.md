# Passage Backlog

## Now

- Run red-path QA (home, hospice, hospital, already-past-first-steps): one clear next action, persisted estate, lands in command center, no false “Confirmed”.
- Run funeral-home demo QA (one-location + multi-location): create/load case, act-on-behalf, family view, CSV export visibility + correctness.
- Validate vendor request proof loop end-to-end in test mode: request “Sent”, delivery/webhook receipt, accept/decline recorded, activity proof visible.
- Validate Resend/Twilio webhook handling in dev/staging using test payloads; confirm `webhook_events` populate with timestamps and actors.
- Inventory any remaining “unknown / waiting” states that should show a next action CTA (reminder, assign, or escalate).

- Define partner and vendor account access: user creation, organization membership, and role-based permissions for funeral home staff, multi-location admins, vendors, and Passage admins.

## Next

- Tighten and freeze the 15-minute funeral home demo script + objection answers (doc-only until owner approves outreach).
- Produce a one-page pilot handout (offer terms placeholders; no pricing changes).
- Map top red-path tasks into automated / assisted / guided-manual tiers; list proof required + follow-up loop for each.
- Identify owner-facing notification gaps for participant/vendor/funeral-home completion events (inventory only).
- Define trusted vendor criteria + an approval/override process for funeral homes.
- Design vendor onboarding as a real account flow, not only a contact form: apply, approve, create user, assign role, and manage requests.

## Later

- Vendor payments / Stripe Connect design (after pilots validate demand).
- Document upload as a funeral home pilot add-on after core demos are stable.
- Family chat only after pilot feedback confirms need.
- State-specific workflows + deeper compliance guidance.
- Marketplace revenue-share reporting for funeral homes.

## Questions

- Which local funeral homes are first pilot targets (one-location vs multi-location mix)?
- What is the pilot offer structure (length, trial, price) as of May 2026?
- Which vendor categories get seeded first in Hudson Valley (1–2 per task only)?
- Which parts of healthcare proxy guidance require legal review before demos?
- What are the 5 must-have analytics events before broader outreach?

## Blocked / Needs Owner

- Production SQL changes require owner approval and manual Supabase execution (unless deployment pipeline changes).
- Real customer/vendor/funeral-home emails or SMS require owner approval.
- Pricing changes require owner approval.
