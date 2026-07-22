## Later

- Vendor payments / Stripe Connect design (after pilots validate demand).
- Document upload as a funeral home pilot add-on after core demos are stable.
- Family chat only after pilot feedback confirms need.
- State-specific workflows + deeper compliance guidance.
- Marketplace revenue-share reporting for funeral homes.
- Estate/possessions inventory module (owner idea, 2026-07-21; post-M4, out of current M1-M3 scope): photo-based room walkthrough with AI-tagged item cataloging and estimated value, attached to the estate/case proof spine as a structured proof type. Two variants: pre-need (living planning user documents what they own now) and post-loss (settling family gets an assisted walkthrough instead of guessing what was in the house). Distribution through the existing funeral-home wedge as a value-add; eventual export surface for insurance/probate. Do not begin implementation: "estate" is explicitly excluded from current beta/pilot scope in `docs/product/operational-readiness-roadmap.md`, and Passage Zero's fixed critical path (hosted authority -> assigned-work RLS -> case operations/proof -> D2C handoff -> pilot hardening) takes priority.
- Government form auto-fill catalog (owner idea, 2026-07-21; post-M4): extends the existing "bank/government packets" Tier 1 output above rather than replacing it. Given stored estate/decedent/next-of-kin facts already captured on the record, identify the specific government/agency forms a family actually needs (e.g. SSA, DMV title transfer, VA benefits, state vital records requests) and pre-populate them for review. Output through the same reviewed-before-send / structured-proof pattern already used elsewhere (task -> prepared output -> human review -> proof saved), not automatic filing and not legal advice. Needs a PM what/why/breakage pass on which forms/jurisdictions are in scope before any schema or automation work begins.

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
