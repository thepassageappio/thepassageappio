# Compliance roadmap — demo-ready then enterprise-ready

**Date:** 2026-09-15  
**Status:** Steve approved (Milestone 1). Not legal advice. Not certification.  
**Boundary:** Passage = workflow + saved decision record. Does not create legal authority, validate POAs, move money, or grant account access.

Companion: [NY-only demo truth pack](./NY-ONLY-DEMO-TRUTH-PACK-2026-09-15.md) · [Counsel questions queue](./COUNSEL-QUESTIONS-QUEUE-FOR-STEVE-2026-09-15.md) · [Jurisdiction playbook](./agent/JURISDICTIONS.md)

## Product jurisdiction set

| State | Status |
| --- | --- |
| New York (`US-NY`) | **Live** — only claimable jurisdiction in M1 |
| Pennsylvania (`US-PA`) | Validation roadmap; **disabled**; § 5601(d) Acknowledgment gap documented |
| New Jersey / Connecticut / Massachusetts | Validation roadmap; not enabled |

**Separate R&D wave (do not market):** CA, TX, FL, IL acceptance/refusal clock modeling.

## Demo-ready / M1 (minimum supportable)

1. NY-only public, sales, and demo claims.
2. Fixed synthetic NY policy + decision receipt OK.
3. PA unavailable; never relabel `representative_certification` as PA compliance.
4. Five-state language = roadmap only, not availability.
5. Counsel engagement **off active plan** (Steve 2026-09-15). Full-50 encode matrix = clarity track; M1 claims stay NY-only. Synthetic PII for demo.
6. Plain-language external copy (Steve bar).

## Enterprise-ready

1. Counsel-approved versioned jurisdiction packages (citation, effective date, counsel status).
2. PA separate acknowledgment workflow after counsel.
3. Institution policy authoring + immutable request snapshots (POL1).
4. Optional counsel-approved state reviewer prompts / clocks.
5. ESIGN/ESRA determination; retention/export for exam.
6. Per-state synthetic QA (positive, refusal, stale, revocation, cross-jurisdiction).
7. Ops audit / vendor-risk / SOC2 narrative (coordinate Ops).

## Encode vs institution

Passage supports gates, locked statutory evidence (when counsel-defined), optional prompts, configurable clocks, receipt wording, retention metadata. Institution decides enablement, exceptions, accept/refuse, IDV/fraud, and legal validity.

## False claims (never ship)

Multi-state available; PA live; Passage validates/creates POA; safe harbor; “counsel-approved” badges; CA/TX/FL/IL as product set in M1; real PII in demo.
