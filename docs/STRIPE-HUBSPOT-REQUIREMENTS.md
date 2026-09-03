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

## Company segmentation and customer 360

Each Company must have explicit segmentation fields that do not depend on free-text company names or individual contacts:

| Company field | Purpose |
| --- | --- |
| Institution category | Regional bank, community bank, credit union, elder-law firm, authorized service organization, fintech/platform partner, or other |
| ICP fit | ICP A, ICP B, ICP C, non-ICP, or unassessed |
| ICP reason | Standardized reason the organization fits or does not fit the current POA wedge |
| Size segment | Standardized employee, asset, member/customer, or servicing-volume band as appropriate |
| Geography | Headquarters and operating regions relevant to the supported policy |
| Current process | Email/manual, branch handoff, ticketing, document platform, existing vendor, or other |
| Estimated annual authority volume | Discovery estimate, stored separately from measured Passage usage |
| Current subscription bucket | Evaluation, founding pilot, Core, Scale, Enterprise, expired, suspended, or churned |
| Current contract start/end | Active commercial service period |
| Customer lifecycle | Prospect, evaluating, pilot, customer, at risk, renewing, churned, or former customer |

Institution category, ICP fit, subscription bucket, and customer lifecycle are separate dimensions. For example, a credit union may be ICP A, on a founding pilot, and currently renewing.

## Contact role separation

Every Contact may carry multiple clearly separated role dimensions:

| Contact dimension | Examples |
| --- | --- |
| Job function | Deposit operations, compliance, legal, digital servicing, IT/security, finance, procurement, executive |
| Buying role | Champion, economic buyer, decision maker, influencer, technical evaluator, security reviewer, procurement, billing contact |
| Customer role | Executive sponsor, day-to-day owner, administrator, success contact, support contact |
| Passage product role | Owner, administrator, operations staff, institution reviewer, developer, auditor, or no product access |
| Relationship status | Active, former, unresponsive, or do-not-contact |

Job title must not be used as a substitute for buying role or product permission. Passage product role comes from authenticated membership data; HubSpot cannot grant or change product access. Multiple Contacts can hold the same buying or customer role, and one Contact can hold several commercial roles.

## Usage definitions and Company summary

Use **authority request** in customer-facing and commercial reporting. Avoid generic “platform transaction.” Two different metrics are required:

- **Activated authority request:** counted once when the first participant invitation is issued. This is the allowance-consuming and potentially billable unit.
- **Completed authority request:** an activated request that reaches a saved final institution decision and matching decision receipt. This is the primary outcome and adoption metric.

The Company record stores the current summary, synchronized from Passage:

| Company usage field | Definition |
| --- | --- |
| Lifetime activated authority requests | All activated requests since organization creation |
| Lifetime completed authority requests | All requests with a final institution decision receipt |
| Activated requests this contract term | Billable/allowance usage within the active term |
| Completed requests this contract term | Outcomes completed within the active term |
| Activated requests trailing 12 months | Rolling 12-month activity independent of contract boundaries |
| Completed requests trailing 12 months | Rolling 12-month completed outcomes |
| Purchased allowance this term | Base allowance plus paid top-up units |
| Remaining allowance | Purchased allowance minus activated requests this term |
| Allowance utilization | Activated requests this term ÷ purchased allowance |
| Completion rate | Completed requests ÷ activated requests for the selected period |
| Current 30-day burn rate | Activated requests per day over the trailing 30 days |
| Current 90-day burn rate | Activated requests per day over the trailing 90 days |
| Forecast term-end usage | Projected activated requests by contract end using the approved forecast method |
| Forecast allowance exhaustion date | Projected date remaining allowance reaches zero |
| Peak usage month/quarter | Highest measured activated-request period |
| Last activation/completion date | Most recent usage and outcome milestones |

Undefined or insufficient-history values remain blank and display as “Not enough history”; they are never replaced with zero or an invented forecast.

## Usage history and segmentation architecture

HubSpot Company fields show the current account summary; they are not the historical analytics ledger. Passage must preserve:

1. The append-only event for every activation and completion.
2. A daily organization usage snapshot containing organization, contract, subscription bucket, ICP bucket, activated count, completed count, purchased allowance, remaining allowance, utilization, 30/90-day burn, and forecast exhaustion date.
3. Historical contract-term snapshots that do not change when a customer renews or changes tier.
4. A reporting model that joins usage to institution category, ICP fit, size band, geography, plan, cohort, acquisition source, contract term, and account owner.

This supports monthly, quarterly, annual, cohort, and seasonal reporting without overwriting history in HubSpot. Only approved Company-level aggregates and milestone dates synchronize to HubSpot; participant or request-level sensitive data does not.

### Required usage reporting

- Activated and completed authority requests by day, week, month, quarter, and year.
- Activation-to-completion rate and median completion time.
- Usage by institution category, ICP fit, size segment, geography, subscription bucket, cohort, and contract year.
- Seasonal and month-of-year patterns by segment.
- Allowance utilization, remaining allowance, 30/90-day burn, forecast exhaustion, and forecast term-end usage.
- Top-up frequency, time to first top-up, units purchased, and top-up-to-renewal conversion.
- Underutilized customers, inactive customers, fast-burn customers, and customers forecast to exceed allowance.
- Renewal expansion, flat, downgrade, and churn outcomes against prior usage and spend.

Usage alerts create customer-success or expansion actions at approved thresholds. The initial standard is 70%, 90%, and 100% allowance utilization, projected exhaustion before contract end, unexpected inactivity, and materially lower usage than the prior comparable period.

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
- A one-time top-up is permanently classified as **non-recurring expansion revenue**. It contributes to contract-term spend and total revenue, but its ARR impact is zero.
- A tier upgrade or permanently increased contracted allowance is expansion ARR.
- The final closed-won Renewal deal becomes the next term's recurring contract value.
- When prior top-up demand is committed into a renewal allowance, recurring revenue begins on the new renewal term. The historical top-up deals remain non-recurring and are never reclassified retroactively.
- Renewal reporting must distinguish retained base, recurring expansion, contraction, churn, and newly added products.

### Required classification fields

Every Closed Won deal must carry:

| Property | Required values or rule |
| --- | --- |
| Revenue motion | New business, expansion, or renewal |
| Revenue type | Recurring subscription, non-recurring top-up, non-recurring services, or recurring expansion |
| Booked amount | Total value of that deal |
| ARR impact | Annual recurring increase or decrease; always `0` for one-time top-ups |
| Non-recurring revenue | One-time revenue attributable to the deal; equals the paid amount for a top-up |
| Service-period start/end | Period to which the purchase applies |
| Renewal conversion source | Prior top-up, tier expansion, new workflow, or none |

The Company record must keep `Current recurring contract value`, `Current non-recurring top-up revenue`, `Current other non-recurring revenue`, and `Current contract total spend` as separate rollups. Total spend must never be presented as ARR.

### Required reporting

HubSpot reporting must provide four separate views:

1. **Bookings:** New business, recurring expansion, non-recurring top-ups, services, and renewals by period.
2. **ARR bridge:** Starting ARR + new ARR + recurring expansion − contraction − churn = ending ARR. Non-recurring top-ups are excluded.
3. **Expansion behavior:** Top-up count, top-up revenue, purchased units, utilization, time between top-ups, and customers likely to require a higher tier.
4. **Renewal conversion:** Prior recurring value, prior non-recurring top-up spend, renewal baseline, final renewed ARR, and the amount of prior top-up demand converted into recurring commitment.

Net revenue retention uses recurring revenue only. A separate total-revenue view may include top-ups, but it must be labeled clearly and must not be used as ARR or NRR.

## Required deal properties

All three pipelines share: Passage organization reference, associated Company, deal type, amount, currency, owner, source, created date, expected close date, actual close date, service-period start/end, Stripe customer reference, Stripe invoice reference, payment status, and predecessor deal.

Expansion deals additionally store: expansion type, revenue type, top-up quantity, activated-request unit, prior tier, resulting allowance, self-service flag, booked amount, ARR impact, non-recurring revenue, refund amount, and net expansion revenue.

Renewal deals additionally store: renewal baseline amount, prior base value, prior top-up revenue, prior other expansion, prior refunds/credits, prior total contract spend, prior usage, prior allowance, utilization, recommended tier, proposed allowance, renewal risk, churn/contraction reason, and final renewed ARR.

## Renewal recurring-revenue calculation

Every Renewal deal must calculate the net recurring-revenue impact of the new subscription against the immediately preceding subscription term. Total contract spend and non-recurring top-ups inform the renewal proposal, but they are not included in the prior recurring baseline.

| Renewal property | Calculation |
| --- | --- |
| Prior subscription ARR | Normalized recurring value of the immediately preceding subscription term |
| Prior subscription MRR | Prior subscription ARR ÷ 12 |
| Renewed subscription ARR | Normalized recurring value committed for the new subscription term |
| Renewed subscription MRR | Renewed subscription ARR ÷ 12 |
| Net renewal ARR impact | Renewed subscription ARR − prior subscription ARR |
| Net renewal MRR impact | Renewed subscription MRR − prior subscription MRR |
| Prior-term non-recurring top-ups | Informational total only; excluded from prior ARR and MRR |
| Top-up demand converted to recurring | Portion of prior top-up-supported volume included in the new recurring commitment |

For a standard 12-month agreement, contracted recurring value equals ARR. For a term that is not 12 months, normalize the recurring service value to a 12-month equivalent and keep total contract value in a separate field. Currency conversions, if introduced, must use a documented reporting currency and effective-date exchange-rate policy.

### Renewal deal classification

Each Renewal deal receives exactly one reporting classification when it closes:

- **Renewal — expansion:** renewed ARR is greater than prior ARR. Net renewal ARR and MRR impact are positive.
- **Renewal — flat:** renewed ARR equals prior ARR to currency precision. Net renewal ARR and MRR impact are zero.
- **Renewal — downgrade:** renewed ARR is greater than zero but less than prior ARR. Net renewal ARR and MRR impact are negative contraction.
- **Renewal — churn:** renewed ARR is zero because the customer does not renew. The full prior ARR and MRR become churn.

A renewal that converts prior non-recurring top-up demand into committed allowance is classified from the resulting ARR comparison. The historical top-ups remain non-recurring; the increased commitment appears as positive renewal ARR impact.

### Recurring-revenue reporting

The monthly recurring revenue report must roll forward:

`Beginning MRR + new-business MRR + expansion MRR + renewal expansion MRR − downgrade MRR − churned MRR = ending MRR`

Required companion metrics are beginning ARR, ending ARR, gross revenue retention, net revenue retention, logo renewal rate, logo churn, renewal expansion, renewal downgrade, and top-up-to-recurring conversion. Reports must be filterable by cohort, plan, institution type, owner, contract start month, and renewal month.

MRR and ARR are recurring-revenue operating metrics. They remain separate from bookings, invoiced amounts, cash collected, non-recurring revenue, deferred revenue, and accounting revenue recognized during the month.

## Day-one operating requirements

The three deal pipelines are necessary but not sufficient. The following controls complete the commercial operating baseline.

### Product catalog and deal governance

- One versioned catalog defines the evaluation, founding pilot, annual tiers, top-up packs, and approved add-ons.
- Every price has a stable product/price reference, currency, billing cadence, activated-request allowance, effective date, and retirement date.
- Discounts require a reason, approver, approved range, and expiration. Discounted deals retain list price, discount amount, and net price separately.
- Quotes and order forms use the same product names, units, service periods, and totals as Stripe and HubSpot.
- Deal stage entry/exit criteria, forecast category, required next step, owner, and close-date rules are written for every pipeline stage.
- Lost, churned, and downgraded deals require standardized reason codes plus optional notes.

### Billing policy

- Decide supported currency, card and bank-payment methods, invoice terms, tax handling, billing contact requirements, and purchase-order handling before the first real invoice.
- Define whether allowances expire at term end, whether unused units roll over, and how mid-term upgrades, top-ups, downgrades, cancellation, refunds, credits, disputes, and proration behave.
- Define payment-failure reminders, retry schedule, grace period, escalation owner, and the exact point at which new activations stop.
- Never stop an in-progress authority request or remove historical receipts because of billing status.
- The institution workspace must show plan, allowance, usage, purchased top-ups, renewal date, invoice/payment state, billing contact, and the next available action.
- Manual billing or entitlement exceptions require an owner, reason, expiration, and immutable audit entry.

### Funnel and attribution

- Contacts and Companies require normalized acquisition source, original source, latest source, campaign when known, ICP status, disqualification reason, territory, commercial owner, and customer-success owner.
- Duplicate Companies are controlled by verified organization domain plus Passage organization reference; duplicate Contacts are controlled by normalized work email.
- Buying roles are explicit: champion, economic buyer, technical/security reviewer, legal/procurement, billing contact, executive sponsor, and administrator.
- Lead-response and opportunity follow-up service levels have a named owner and overdue escalation.
- Product-qualified status comes from verified product behavior and never replaces the standard Company/contact lifecycle stage.

### Post-sale operations without a fourth deal pipeline

- Customer onboarding is managed through a dedicated HubSpot ticket pipeline or implementation object, not through an additional revenue pipeline.
- Required onboarding milestones are agreement complete, invoice state confirmed, organization verified, owner activated, team invited, policy selected, sample completed, integration path selected, security items closed, first production request approved, and success review scheduled.
- Support uses a separate ticket pipeline with inquiry type, severity, response target, affected organization, product area, owner, status, resolution, and root-cause category.
- Billing issue, product request, security inquiry, and general inquiry submissions route to the correct owner and preserve consent/source context.
- Customer health combines product adoption, request completion, support burden, payment state, stakeholder engagement, and renewal readiness. It never includes participant-sensitive content.

### Automation reliability

- Stripe events enter a durable inbox; HubSpot writes leave through a durable outbox with idempotency, retry, replay, and a visible failure queue.
- A daily reconciliation compares Stripe payments, Passage entitlements and usage, HubSpot deals, Company rollups, and renewal records.
- Every automated commercial change records source event, prior value, new value, timestamp, result, and correction history.
- Alerts cover failed payment sync, missing deal association, unmatched Company, incorrect rollup, renewal not created, stale opportunity, and reconciliation variance.
- Backfill tools can recreate CRM projections from Stripe and Passage without duplicating deals or changing authority records.

### Minimum dashboards

1. Funnel conversion and velocity by source, ICP, owner, and stage.
2. New business, expansion, renewal, and churn bookings.
3. ARR/MRR bridge, gross retention, net retention, logo retention, and churn.
4. Contract-term spend split into recurring base, non-recurring top-ups, other expansion, refunds, and net total.
5. Usage, allowance, top-up frequency, utilization, completion, and expansion signals.
6. Renewal forecast, baseline versus proposed versus booked value, and top-up-to-recurring conversion.
7. Invoice aging, failed payments, refunds, disputes, and Stripe/Passage/HubSpot reconciliation status.
8. Onboarding progress, time to first activation, time to first completed receipt, support response, and unresolved risks.

## Commercial launch gates

### Before the first real paid pilot

- Approved pilot SKU, success criteria, agreement, service period, invoice terms, refund/cancellation policy, tax/accounting review, billing contact, support owner, and data boundary.
- New Business Company, Contacts, and Deal associated correctly.
- Stripe test invoice-to-paid-to-entitlement replay passes before the equivalent live workflow is authorized.
- Institution workspace and internal reconciliation show the same paid state.
- Customer onboarding and support tickets route to named owners.

### Before self-service top-ups

- Approved top-up products and allowance behavior.
- Verified payment webhook, idempotent Closed Won Expansion creation, Company rollups, receipts, refunds, replay, reconciliation, usage alerts, and visible customer purchase history.
- No purchase can exceed an approved quantity or create access for the wrong organization.

### Before the first renewal

- Renewal generation, prior-term snapshots, spend baseline, ARR/MRR calculations, classification, forecast stages, reminders, approval rules, contraction/churn handling, and close-won/closed-lost tests all pass.
- Finance and the commercial owner approve bookings, recurring-revenue, deferred-revenue, and recognized-revenue definitions.

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
6. A top-up reports booked and non-recurring revenue with zero ARR impact.
7. The final renewal records retained, expanded, contracted, or churned recurring revenue correctly without rewriting historical top-ups.
8. The ARR bridge excludes one-time top-ups while the contract-spend report includes them.
9. Renewal expansion, flat, downgrade, and churn scenarios calculate the correct net ARR and MRR impact against the preceding subscription.
10. A top-up converted into the next committed allowance increases renewed ARR without changing the historical top-up classification.
11. Stripe, HubSpot, Passage, and the reconciliation report agree.
12. No prohibited participant data appears in Stripe or HubSpot.
13. Company segmentation distinguishes institution category, ICP fit, subscription bucket, and customer lifecycle.
14. Contact job function, buying role, customer role, and Passage product role remain independently reportable.
15. Activated and completed authority-request totals reconcile to the Passage event ledger for current term, trailing 12 months, and lifetime.
16. Daily snapshots reproduce segment, seasonality, burn-rate, utilization, exhaustion, expansion, and renewal reports without relying on overwritten HubSpot fields.
