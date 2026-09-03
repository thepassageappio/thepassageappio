# Passage Authority pricing, packaging, and commercial-system recommendation

**Decision audience:** founder and product owner  
**Date:** September 2, 2026  
**Market scope:** United States business-to-business software for financial institutions, beginning with New York financial power-of-attorney requests

## Executive decision

Passage Authority should use **a base platform subscription with included activated authority requests, followed by graduated overage pricing**. Do not launch with usage-only, unlimited flat pricing, or per-seat pricing.

The near-term offer remains a **$5,000, 60-to-90-day founding pilot**, invoiced to the institution and credited toward year one if the customer converts under the pilot agreement. It should include one workflow, a defined request allowance, implementation help, named success criteria, and a final results review. Exact annual price bands and overage rates remain private hypotheses until at least 10 qualified buyer conversations and the first three pilots produce real volume, willingness-to-pay, support-cost, and conversion evidence.

## Why the hybrid model wins

A Passage customer receives meaningful value before and beyond any single request: a controlled workspace, role-based access, policy configuration, auditable history, consistent participant journeys, and integration support. That supports a base fee. Value and delivery cost also grow with authority-request volume, so included usage plus an overage captures expansion without forcing a renegotiation every time volume rises.

Stripe identifies hybrid base-and-usage pricing as the fit when a product has baseline platform value plus variable consumption, while noting that it improves predictability compared with pure usage pricing. Its billing model directly supports a fixed fee, included allowance, and overage. [Stripe SaaS pricing guide](https://stripe.com/resources/more/saas-pricing-and-packaging-strategy), [Stripe subscription design](https://docs.stripe.com/billing/subscriptions/design-an-integration)

Comparable trust and workflow platforms reinforce this shape:

- Persona starts self-guided access with a platform commitment and reserves more configurable controls, permissions, and multi-organization capabilities for higher plans; it charges successful verifications rather than user retries. [Persona pricing](https://withpersona.com/pricing)
- Veriff combines a monthly minimum with per-verification pricing and moves scaled buyers to a custom enterprise plan. [Veriff self-serve plans](https://www.veriff.com/plans/self-serve)
- Plaid moves from trial to pay-as-you-go, then to annual minimum commitments and volume discounts with enhanced support and enterprise features. [Plaid pricing](https://plaid.com/pricing/), [Plaid billing documentation](https://plaid.com/docs/account/billing/)
- Document-workflow products commonly meter a recognizable business object. Docusign uses an envelope allowance with additional-envelope charges, while OneSpan offers enterprise transaction bands and volume pricing. [Docusign envelope pricing](https://ecom.docusign.com/plans-and-pricing/esignature), [OneSpan pricing](https://www.onespan.com/products/esignature/plans-pricing)

## Model comparison

| Model | Entry friction | Customer predictability | Passage revenue fit | Expansion fit | Decision |
| --- | --- | --- | --- | --- | --- |
| Flat platform fee only | Medium to high | Excellent | Underprices heavy use or overprices small teams | Weak | Reject as the long-term default |
| Usage only | Low | Weak at variable volume | Ignores the standing value of controls, auditability, and support | Strong but volatile | Use only for a later developer/pay-as-you-go path |
| Per seat | Medium | Good | Poor value metric; the work is the request, not headcount | Discourages collaboration and audit access | Reject |
| Tiered subscription only | Medium | Excellent | Simple, but creates hard cliffs and renegotiation | Moderate | Acceptable temporary model |
| Base fee + included usage + graduated overage | Low to medium | Good | Pays for platform value and scales with use | Strong | **Recommended** |
| Percentage of account or asset value | High | Weak | Difficult to attribute and explain | Potentially strong | Reject for this wedge |

Use **graduated** overage bands, where only incremental units receive the lower rate. Do not use a volume cliff that reprices every unit when one threshold is crossed; Stripe's documentation distinguishes these models, and graduated tiers avoid surprising bill decreases or threshold gaming. [Stripe pricing models](https://docs.stripe.com/products-prices/pricing-models)

## The billable unit

Call the unit an **activated authority request**, not a transaction, case, API call, user, page view, document, or signature.

An activated authority request counts once when the institution issues the first participant invitation. The following never create another billable unit:

- saving or editing a draft;
- sending or resending participant access;
- participant retries and recovery;
- evidence uploads or review actions;
- requesting more information;
- institution decisions, receipt views, lifecycle changes, or webhook retries;
- institution users, participant users, or auditor access.

This rule is understandable, difficult to game, already supported by the append-only Passage usage ledger, and aligned with an institution choosing to put a real request into motion. The workspace should always show the current allowance, usage, billing period, and what will count before activation.

## Offer ladder

### 1. Synthetic evaluation — now

- No card and no production claim.
- Current controlled limit: five activated requests or 10 days from first activation.
- Synthetic data only until pilot controls are approved.
- Goal: prove the complete participant-to-institution receipt journey.

### 2. Founding pilot — sell first

- $5,000 for 60 to 90 days, credited toward year one on conversion under the agreement.
- One institution, one approved POA workflow, named operational team, and a negotiated activated-request allowance.
- Guided setup, weekly review, integration discovery, security review, support path, and final results report.
- No surprise overage during the pilot. Pause and agree on an expansion if the allowance is reached.
- Success measures: completion rate, median time to decision, information-request rate, participant abandonment, support burden, receipt consistency, and institution acceptance of the workflow.

### 3. Annual institution plan — after evidence

- Annual base commitment with a pooled yearly request allowance so seasonal volume is not punished.
- Graduated overage or pre-purchased request packs.
- Unlimited reasonable institution users; role-based access should not be monetized per seat.
- Core audit history, receipts, standard retention, and baseline support included.
- SSO/SCIM, longer or custom retention, premium support/SLA, multi-entity partitioning, dedicated environments, data residency, and custom integrations may be enterprise add-ons only after they exist and are verified.

### 4. Product-led path — later

- A verified organization can complete one free synthetic or otherwise approved low-risk request each month, with no card.
- A self-serve paid plan can add a small base subscription plus included requests and transparent overage.
- Card or bank payment belongs to the institution owner; principals and representatives never pay and do not need billing accounts.
- Product-led access launches only after automated organization verification, abuse controls, low-touch onboarding, support routing, billing reconciliation, retention rules, and reliable reset/recovery all pass.

Plaid and WorkOS both separate no-cost testing from production commitments and add volume economics, support, or enterprise controls as customers mature. That is the appropriate structural precedent; Passage should not copy their price points. [Plaid pricing](https://plaid.com/pricing/), [WorkOS pricing](https://workos.com/pricing)

## Price discovery—not invented certainty

Do not publish three precise annual prices yet. Test these variables in discovery and pilots:

1. Annual POA request volume by institution and business unit.
2. Current handling time, rework, escalation, abandonment, and complaint cost.
3. Whether budget ownership sits with deposit operations, legal, compliance, digital, or customer experience.
4. Procurement thresholds, preferred annual commitment, invoice terms, and security requirements.
5. Which controls are table stakes versus genuine premium value.
6. Support and implementation effort per institution.
7. Willingness to pay for a faster decision, fewer handoffs, and a defensible receipt.

Maintain three private annual hypotheses—small institution, scaled institution, and enterprise—then update them after every qualified conversation. The price should increase when verified customer value, usage, integration depth, or support commitment increases, not because the customer adds an auditor or participant.

## Billing architecture

For the founding pilot, use a sales-assisted Stripe invoice and Stripe-hosted invoice page. Stripe hosts the payment surface, can present card or ACH options when enabled, and lets the institution view status and download an invoice or receipt. Passage does not need Plaid to collect a card or bank payment. [Stripe Hosted Invoice Page](https://docs.stripe.com/invoicing/hosted-invoice-page)

For future subscriptions:

1. Passage creates a commercial account mapping for the organization; Stripe owns customers, invoices, payment methods, payments, and subscriptions.
2. Passage remains the source of truth for product access, request usage, and immutable product events.
3. A verified Stripe webhook may request an entitlement change. A browser success page never grants access.
4. Provision paid access only after a verified `invoice.paid` event and an active subscription or approved paid pilot invoice. Stripe recommends provisioning from the webhook lifecycle, not the redirect. [Stripe subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks)
5. Verify the Stripe signature against the unmodified raw request body, store the provider event ID, process idempotently, tolerate duplicate and out-of-order events, and reconcile Stripe to Passage on a schedule. [Stripe webhook verification](https://docs.stripe.com/webhooks/signature)
6. If metered overage launches, derive one idempotent meter event from each canonical Passage activation event. Stripe's meter events are asynchronous, so the Passage ledger—not Stripe's delayed summary—drives the in-product usage display. [Stripe usage recording](https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api)

## CRM architecture across the lifecycle

HubSpot is the commercial system of engagement, not the product-access authority.

| Lifecycle | Passage event | HubSpot result | Owner action |
| --- | --- | --- | --- |
| Visitor → lead | Demo, contact, or pilot form submitted | Contact + company, source, inquiry type, consent, ICP fields | Qualify and schedule discovery |
| Lead → qualified | ICP and pain confirmed | Lead status and qualification fields | Run discovery and security fit |
| Qualified → opportunity | Pilot scope requested | Deal associated to company and buying contacts | Confirm success plan and commercial terms |
| Evaluation → product-qualified | Organization verified; first activation or first complete receipt | Aggregate activation milestone and last-product-activity date | Contact with context, not raw participant data |
| Opportunity → pilot | Pilot agreement/invoice created | Deal stage, pilot dates, allowance, expected value | Launch onboarding |
| Pilot → customer | Paid invoice and written pilot acceptance | Closed-won deal and customer lifecycle | Start annual onboarding and success plan |
| Customer → expansion | Allowance threshold, second team/workflow interest, sustained use | Expansion signal or expansion deal | Review volume and adjacent need |
| Customer → renewal | Renewal window and health score | Renewal deal/task | Review outcomes, support, risk, and next term |
| At risk → churn | Low adoption, unresolved support issue, nonpayment, or cancellation | Risk reason, churn reason, end date | Recovery or controlled offboarding |

HubSpot's lifecycle stage is designed for contact/company progression, while deals represent opportunities. Use standard lifecycle stages for broad funnel reporting and separate Passage fields for product qualification, pilot health, renewal, and churn. [HubSpot lifecycle stages](https://knowledge.hubspot.com/records/use-lifecycle-stages)

Minimum company fields: Passage organization reference, institution type, geography, employee or asset-size band when legitimately sourced, estimated POA volume, current process, primary use case, product stage, evaluation start/end, activated-request count, first and latest completed receipt dates, pilot start/end, annual allowance, health status, renewal date, expansion signal, and churn reason.

Minimum contact fields: work email, name, role, buying role, communication consent, source, and owner. Minimum deal fields: offer, amount, stage, target close, pilot dates, success criteria, security/procurement status, loss reason, and next step. Support issues belong in tickets associated to the company and relevant contacts.

Never send participant names or emails, account descriptions, authority documents, identity evidence, receipt contents, decision reasons, or legal-status data to HubSpot or Stripe. Send organization-level commercial data, aggregate usage, milestone dates, and an opaque Passage organization reference only.

## Future product vision

The long-term product is an **external-authority operating layer for institutions**: one place to intake authority, separate identity from evidence and institutional acceptance, coordinate every party, preserve the decision trail, and return a consistent status through a hosted workspace or API.

The sequence should be:

1. Nail New York financial POA intake and limited servicing end to end.
2. Add embedded/API adoption for the same POA workflow, without changing the canonical evidence chain.
3. Expand geography and POA policy only after legal, operational, and buyer evidence support each addition.
4. Evaluate the next adjacent authority wedge—such as trustee, guardian, conservator, or court-appointed fiduciary intake—using separate policy models and tests rather than pretending all documents are the same.
5. Become the institution's shared authority layer across branch, contact center, operations, compliance, and core systems, with one auditable decision receipt and lifecycle.

Do not choose the second wedge until POA has repeatable activation, completion, institutional acceptance, paid conversion, and low-touch support. The platform vision is broad; the selling message stays narrow.

## Decision gates

### Implement now

- Institution account, plan, usage, period, billing owner, and team-role visibility.
- The $5,000 pilot scope and success-plan template.
- Canonical activation ledger and visible usage definition.
- HubSpot field map and event privacy contract on paper.
- Stripe test data model and negative-path test design.

### Implement after independent UAT

- Stripe test customer/invoice mapping and signed webhook ingestion.
- Duplicate, ordering, payment-failure, cancellation, refund, and reconciliation tests.
- HubSpot sandbox/test sync for website inquiries and organization-level milestones.
- Pilot health and renewal views.

### Implement only after controlled pilots

- Public self-serve paid plan and product-led monthly allowance.
- Automatic metered overage and customer billing portal.
- Published annual bands.
- Enterprise add-ons, multi-workflow packaging, and adjacent authority wedges.

## Success criteria

The commercial system is ready when an institution owner can see the correct plan, allowance, period, invoice state, and billing contact; Stripe and Passage reconcile under duplicate and out-of-order events; HubSpot shows the correct funnel/customer stage without participant data; product-qualified, expansion, retention, renewal, and churn signals create the right owner action; and an independent replay proves that payment state never silently corrupts authority records or receipts.

