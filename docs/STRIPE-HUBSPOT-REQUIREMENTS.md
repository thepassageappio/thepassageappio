# Passage Authority Stripe and HubSpot requirements

**Status:** Approved commercial-system requirements  
**Date:** September 3, 2026  
**Boundary:** These requirements define the future integration. They do not authorize live charges, real customer communications, or production CRM writes before the applicable release gates pass.

## Commercial object model

Passage uses three HubSpot deal pipelines:

1. **New Business** — first qualified opportunity, paid pilot, and first customer purchase.
2. **Expansion** — every self-service top-up, tier upgrade, additional workflow, business unit, integration, or support expansion.
3. **Renewals** — one renewal opportunity per expiring contract term.

The HubSpot Company is the commercial account summary. Contacts represent people involved in buying, administration, billing, security review, or success. Deals represent revenue events. Stripe is the source of truth for invoices and payments; Passage is the source of truth for product access and activated-request usage.

## Approved top-up behavior

Every successfully paid self-service top-up creates or updates one distinct HubSpot Expansion deal. Deal volume is intentional evidence of product adoption and must not be consolidated merely to reduce record count.

The automation must:

1. Wait for a signature-verified Stripe `invoice.paid` event. Checkout creation, invoice creation, browser return, or an unverified event is insufficient.
2. Use the Stripe invoice identifier as the external idempotency key so retries cannot create duplicate deals.
3. Associate the Expansion deal to the correct Company and purchasing Contact when known.
4. Create the deal directly in **Closed Won** with the actual paid amount and close timestamp.
5. Record the top-up quantity, unit type, active contract start and end, original plan, source `self_service_top_up`, Passage organization reference, Stripe customer reference, Stripe invoice reference, and Stripe payment reference.
6. Recalculate the Company's active-contract revenue totals after the deal is saved.
7. Preserve refunds and credits as explicit financial adjustments. Do not delete the original revenue event.

## Company revenue rollups

The Company record must expose the complete economic relationship for the active 12-month contract term:

| Company property | Definition |
| --- | --- |
| Current contract start | Start of the active service term |
| Current contract end | End of the active service term |
| Current base contract value | Recurring base amount contracted for the active term |
| Current top-up revenue | Sum of paid top-up Expansion deals attributable to the active term |
| Current other expansion revenue | Paid tier, workflow, integration, or support expansion attributable to the active term |
| Current refunds and credits | Financial reductions attributable to the active term |
| **Current contract total spend** | Base contract value + paid top-ups + other paid expansion − refunds and credits |
| Activated requests this term | Canonical Passage activated-request count for the active term |
| Purchased request allowance | Base allowance plus paid top-up units for the active term |
| Latest paid expansion date | Most recent paid Expansion deal close date |

`Current contract total spend` is calculated from associated revenue records and Stripe payment state. It is never a manually maintained estimate. Historical contract terms must remain reportable after a new term begins.

## Renewal creation

One Renewal deal is created automatically 120 days before the active contract end date. Creation is idempotent on Company plus contract-end date.

At creation:

- `Amount` equals the Company's **Current contract total spend**.
- `Renewal baseline amount` stores the same value and remains immutable as the original renewal seed.
- Base contract value, top-up revenue, other expansion, refunds/credits, activated-request usage, purchased allowance, and utilization percentage are copied into separate renewal properties.
- The proposed renewal tier and allowance are recommended from actual usage and purchasing behavior, but remain editable during the renewal process.
- The Renewal deal is associated with the Company, billing owner, executive sponsor, customer-success owner, and prior New Business or Renewal deal.

The commercial owner may later change the proposed Renewal amount after right-sizing, negotiation, added workflows, or contraction. Reporting must preserve both the original spend-based baseline and final booked renewal amount.

## Revenue classification

- A paid top-up is Closed Won expansion revenue.
- A one-time top-up is not automatically recurring revenue or ARR.
- A tier upgrade or permanently increased contracted allowance is expansion ARR.
- The final closed-won Renewal deal becomes the next term's recurring contract value.
- Renewal reporting must distinguish retained base, recurring expansion, contraction, churn, and newly added products.

## Required deal properties

All three pipelines share: Passage organization reference, associated Company, deal type, amount, currency, owner, source, created date, expected close date, actual close date, service-period start/end, Stripe customer reference, Stripe invoice reference, payment status, and predecessor deal.

Expansion deals additionally store: expansion type, top-up quantity, activated-request unit, prior tier, resulting allowance, self-service flag, refund amount, and net expansion revenue.

Renewal deals additionally store: renewal baseline amount, prior base value, prior top-up revenue, prior other expansion, prior refunds/credits, prior total contract spend, prior usage, prior allowance, utilization, recommended tier, proposed allowance, renewal risk, churn/contraction reason, and final renewed ARR.

## Reconciliation and failure requirements

- Stripe and HubSpot are reconciled at least daily for paid, failed, refunded, disputed, and canceled invoice states.
- Missing HubSpot deals are recreated idempotently from verified Stripe and Passage records.
- Duplicate or out-of-order webhooks cannot duplicate revenue or reduce the canonical usage ledger.
- A HubSpot outage cannot block payment confirmation or Passage product operation; CRM synchronization retries from a durable outbox.
- A HubSpot edit cannot grant Passage access or alter an authority record.
- Payment delinquency never deletes receipts or interrupts an already activated request. The approved entitlement policy controls future activation.
- Participant identity, documents, evidence, account descriptions, decision contents, and receipt contents never enter Stripe or HubSpot.

## Acceptance evidence

The integration is working only when test-mode replays prove all of the following:

1. A paid top-up creates exactly one Closed Won Expansion deal.
2. Two paid top-ups create two deals and the Company total equals base plus both payments.
3. A duplicate payment event changes nothing.
4. A refund updates Company net contract spend without deleting the original deal.
5. Renewal creation copies the exact Company current-contract total into both Amount and the immutable baseline.
6. The final renewal records retained, expanded, contracted, or churned revenue correctly.
7. Stripe, HubSpot, Passage, and the reconciliation report agree.
8. No prohibited participant data appears in Stripe or HubSpot.

