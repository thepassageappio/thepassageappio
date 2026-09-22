# Passage Authority — owner roadmap update, September 22, 2026

Owner-directed session. Supersedes nothing evidentiary in `RELEASE-AND-JOURNEY-CHECKPOINT-2026-09-22.md` or `JOURNEY-AND-NORTH-STAR-2026-09-22.md`; this doc records a sequencing decision on top of that evidence.

## Ground truth at time of writing

- PR #145 (delivery recovery) and PR #146 (NY provenance/draft safeguards) merged and live on Production and Demo at `9ec4313200e8c8938458b6c0a7b70a3dbecc36e6`.
- **Buyer-demo release: HOLD. Real-data pilot: HOLD.** (owner's own prior recorded decision, unchanged by this doc)
- Reconciliation streak: 1/7 as of September 22.
- Zero institutions contacted. Target list exists (`P1-TARGET-ACCOUNT-LIST-2026-09-07.md`, corrected September 10); Tier 1 = Municipal Credit Union and Visions Federal Credit Union (FiLab sponsors, no confirmed warm intro).
- `BILLING-AND-GO-TO-MARKET-PLAN.md` specifies sales-assisted pilot ($5,000 / 60–90 days) as the initial paid motion. Full self-serve signup is documented there as a **later PLG experiment**, gated on org-domain verification, duplicate-org prevention, abuse monitoring, and a durable monthly entitlement reset — none of which exist yet.

## Decision (owner, 2026-09-22)

**Option A selected.** Do not build full self-serve signup infrastructure before pilots. Use the existing $0 controlled-evaluation offer (five activated synthetic requests over 10 days, no card) as the low-friction top of funnel. Pilots remain sales-assisted per the existing GTM plan. Full self-serve (org verification, abuse monitoring, monthly entitlement reset) is deferred to a later, separately scoped workstream and is explicitly not in scope for the current push to 2–3 pilots.

## Sequence to demo release

1. Close hosted delivery recovery: shared-file submission, actual participant delivery, forced-failure/retry recovery, all-persona acceptance on PR #145's shipped SHA. Empty-queue execution does not count as proof.
2. Repair NY provenance + draft pinning: require explicit rebase when governing configuration changes; preserve old decisions/receipts.
3. Run the full uncoached journey: complete requester/principal/representative/institution/cancellation/receipt replay on the exact released SHA, keyboard/zoom/screen-reader checks, and a timed seven-minute rehearsal run by someone other than the owner.
4. Reach seven consecutive clean reconciliation days (currently 1/7). Do not waive this gate under pilot pressure.
5. Make the explicit release decision to lift the buyer-demo HOLD.

## Sequence to pilots

6. Confirm the $0/5-request evaluation flow is presentable as the top-of-funnel offer (no new infra beyond what's shipped).
7. Open outreach: check personal/advisor network for a warm path into Municipal Credit Union or Visions FCU (Tier 1, FiLab-sponsored) before cold contact. In parallel, begin outreach to 3–4 Tier 2 NY credit unions from the target list.
8. Convert interest to the sales-assisted $5,000 / 60–90-day pilot per `BILLING-AND-GO-TO-MARKET-PLAN.md`. Real customer data remains a separate, explicit owner decision per prior recorded boundaries.

## Explicitly out of scope for this push

- Full self-serve signup / PLG infrastructure (org verification, abuse monitoring, entitlement reset).
- Waiving the reconciliation-streak or accessibility gates to accelerate demo release.
- Any real customer data, live payments, or external messages beyond the sales-assisted outreach described above.
