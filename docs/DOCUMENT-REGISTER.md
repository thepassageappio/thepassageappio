# Passage Authority document register

**Date:** September 3, 2026

## Authoritative build documents

| Order | Document | Purpose |
| ---: | --- | --- |
| 1 | `PRODUCT-SOURCE-OF-TRUTH.md` | Current mission, wedge, pricing, personas, access, use cases, screens, wireframes, provider boundaries, enterprise target, and roadmap |
| 2 | `IMPLEMENTATION-TRACEABILITY.md` | Screen controls, server commands, durable results, receiving-person effects, state rules, negative tests, and release evidence |
| 3 | `CURRENT-STATE-GAP-MAP.md` | Exact difference between the fictional controlled MVP and the UAT product, with gate ownership |
| 4 | `BUILD-CONTRACT.md` | Controlled fictional MVP regression contract |
| 5 | `UI-SYSTEM.md` | Visual, responsive, content, and accessibility rules |
| 6 | `RELEASE-EVIDENCE.md` | Evidence already produced for the fictional controlled MVP |
| 7 | `GATE-1-EVIDENCE.md` | Local account, organization, access-control, receiving-member, defect, and remaining hosted release evidence |
| 8 | `MVP-EXECUTION-PLAN.md` | Current gate order, working-MVP score, release criteria, and active build slice |
| 9 | `PRODUCT-VISION-AND-ONBOARDING.md` | Decided account model, first-use journey, product promise, demo moments, and onboarding success criteria |
| 10 | `DEMO-READY-CHECKLIST.md` | Seven-minute demonstration and independent persona UAT acceptance checklist |
| 11 | `CUSTOMER-JOURNEY-AND-GTM.md` | Prospect-to-pilot journey, ICP hypothesis, pilot offer, and later CRM gate |
| 12 | `SELLING-AND-PRICING-DECISION-BRIEF.md` | Pitch, market rationale, differentiation, discovery, qualification, objections, and pricing hypotheses |
| 13 | `BILLING-AND-GO-TO-MARKET-PLAN.md` | Approved billing boundary, offer ladder, payment architecture, and commercial sequencing |
| 14 | `OWNER-UAT-RUNBOOK.md` | Independent four-session demo script, negative checks, evidence capture, and pass/fail rule |
| 15 | `PRICING-AND-PACKAGING-RESEARCH.md` | Evidence-backed pricing model, offer ladder, billable unit, Stripe boundary, CRM lifecycle, and future product vision |
| 16 | `STRIPE-HUBSPOT-REQUIREMENTS.md` | Approved three-pipeline CRM model, top-up deals, company contract-spend rollups, renewal seeding, reconciliation, and acceptance evidence |

When documents conflict, the lower order number controls.

## Current decisions that supersede earlier assumptions

| Topic | Current decision | Superseded assumption |
| --- | --- | --- |
| Free offer | 10 days from first real activation or 5 real authority transactions, with no card | Fictional-only developer evaluation as the only free offer |
| Trial transaction | Count once when the first participant invitation is issued | Count drafts, API calls, or completed decisions |
| Pilot | $5,000 for 60 to 90 days, credited toward year one when converted under the pilot agreement | $2,500 for 60 days and 20 real transactions |
| Institution relationship | Custom after pilot evidence; included volume finalized from qualified discovery and pilot results | $7,500 per year |
| Account model | Organization users have accounts. Principals and representatives use secure role-bound invitations without passwords. | Local role-switch cookie as a real access model |
| Data environment | New isolated Authority Supabase environment | Reuse or migrate the legacy Passage production schema |
| Product wedge | New York financial POA intake and limited account servicing | Broad death-care, family, vendor, estate, or universal delegated-authority scope |
| Build sequence | Product contract and traceability before production feature code | Screen-first expansion |
| Commercial website | Passage Authority is live on the main Passage domain for synthetic evaluation and demonstrations; controlled-pilot readiness still requires the P1 gates | Treat a domain cutover as evidence of enterprise production readiness |

## Historical strategy and deliverables

Earlier pivot, market, wireframe, investor, and product-vision documents remain useful research history. They are not the implementation source of truth when their pricing, schedule, access, scope, or release sequence conflicts with the authoritative documents above.

Before reusing any historical statement in product copy, sales material, investor material, code, pricing, or a live integration, compare it to the current source of truth.
