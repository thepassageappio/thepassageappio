# Passage Backlog

## Now (May 4-May 6, 2026)

- Red-path QA (home, hospice, hospital, already past first steps): one clear next action, estate persists, lands in command center, never shows "Confirmed" without proof.
- Funeral-home demo QA (one-location + multi-location): create/load case, act-on-behalf, family view, CSV export visible + correct, no dead ends.
- Vendor request proof loop QA (test mode): request "Sent", webhook receipt logged, accept/decline recorded, activity proof visible on the case.
- Resend + Twilio webhook QA with test payloads: confirm `webhook_events` include timestamp, actor, provider; surface as proof where relevant.
- Define partner + vendor access policy (minimal): roles + org membership (multi-location admin vs staff vs vendor vs Passage admin).

## Next

- Tighten and freeze the 15-minute funeral home demo script + objection answers (doc-only until owner approves outreach).
- Produce a one-page pilot handout (offer terms placeholders; no pricing changes).
- Map top red-path tasks into automated / assisted / guided-manual tiers; list proof required + follow-up loop for each.
- Identify owner-facing notification gaps for participant/vendor/funeral-home completion events (inventory only).
- Define trusted vendor criteria + an approval/override process for funeral homes.

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
