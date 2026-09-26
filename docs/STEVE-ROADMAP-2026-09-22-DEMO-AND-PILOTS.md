# Passage Authority — owner roadmap update, September 22, 2026

## September 26 UTC implementation update

The owner resumed and requested completion of the remaining Authority release work.
Permission publication now binds new drafts to the published version, rejects stale
activation, and requires an explicit revision that preserves prior history. The
two existing NY choices are the supported scope; custom policy authoring is not
being advertised. Immutable policy bytes, source resolution and validation from
#109 have been selectively integrated and tested rather than merging its obsolete
branch. See [release evidence](POLICY-PUBLICATION-COMPLETION-2026-09-26.md).

The remaining elapsed-day reconciliation gate cannot be completed by replaying
tests. Independent provider reconciliation, broader policy authoring and real-data
pilot approval remain separate work. Guided demos remain approved; outbound stays
HOLD. No new commercial send is authorized by this engineering release.

## September 25 status update

The [release audit](RELEASE-AUDIT-2026-09-25.md) supersedes the current-state
statements below. Main and both live domains match `1af3a1a`; 267 domain tests
and fresh public smoke passed. Guided Path B demos are owner-approved; outbound
and real-data pilots remain separate gates. Do not re-open resolved participant
receipt and staff source-download issues without a fresh failure.

The immediate commercial work is local institutional discovery, a short synthetic
follow-up video, and a small consumer discovery experiment. The $5,000 / 60–90-day
sales-assisted pilot remains the offer; no sends are authorized by this update.
No new feature is implied by consumer discovery. Permission publication #143
still needs draft binding and activation/rebase verification. #119's additional
scheduler is superseded by main's Vercel cron. Hosted evidence now confirms **4/7
clean internal days**, September 22–25 UTC, in both environments. Day seven is
possible September 28 if the next three days are clean. The older sequence below is
historical and must not reset the approved guided-demo scope.

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
