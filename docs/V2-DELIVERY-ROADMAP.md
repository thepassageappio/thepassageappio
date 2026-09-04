# Passage Authority V2 delivery roadmap

**Status:** Active delivery contract  
**Updated:** September 3, 2026, conversion-intake release  
**V2 outcome:** A qualified institution can discover Passage, start a synthetic evaluation, reach a matching decision receipt, request a founding pilot, pay an invoice, receive the correct entitlement, invite its team, and enter onboarding with Passage, Stripe, and HubSpot in agreement.

The supporting evidence review and explicit non-priorities are maintained in [V2-BEST-PRACTICE-REVIEW.md](./V2-BEST-PRACTICE-REVIEW.md).

## Product strategy

V2 is a hybrid journey, not anonymous card-first PLG:

1. No-card synthetic evaluation.
2. First value is a completed institution decision with matching participant receipts.
3. A $5,000, 60-to-90-day founding pilot is sales-assisted and invoice-led.
4. Annual plans use a recurring base with an included activated-request allowance.
5. Top-ups are one-time non-recurring expansion until demand is committed in a later subscription term.

This follows the current product boundary and Stripe's supported hosted invoice, subscription, and webhook patterns. Passage remains the usage and entitlement source; Stripe remains the payment source; HubSpot remains the customer and revenue-workflow projection.

## Definition of V2 working

V2 is not complete until an independent replay proves:

`attributed prospect -> organization signup -> resumable onboarding -> first complete synthetic authority request -> matching receipt -> pilot request -> New Business deal -> hosted Stripe test invoice -> verified paid event -> Passage entitlement -> onboarding ticket -> Company projection -> reconciliation passes`

Every provider command is idempotent. Duplicate and out-of-order events do not duplicate money, usage, allowance, deals, or tickets. A provider outage cannot alter an authority record or hide an existing receipt.

## Delivery gates

| Gate | Scope | Pass criteria | Status |
| --- | --- | --- | --- |
| V2-0 | Research and operating contract | Source ownership, offer, activation milestone, revenue classification, failure policy, and scorecard documented | Passed |
| V2-1 | Commercial persistence | Account/workspace mapping, contract, subscription, order, allowance, usage allocation, provider inbox, outbox, and immutable event history migrate and replay | Implemented in Demo and Production; provider-command replay remains |
| V2-2 | Conversion intake | One short demo/pilot/support form creates deduplicated HubSpot Company, Contact, Deal or Ticket with attribution and a visible confirmation | Partial: live private intake, reference confirmation, immutable event, and HubSpot outbox passed; provider delivery awaits app credentials |
| V2-3 | Evaluation activation | Signup resumes correctly; no more than five pre-value fields; workspace shows one next action, allowance, days, and progress to first matching receipt | Partial: live workspace guidance passed; signup/resume field audit remains |
| V2-4 | Stripe test billing | Pilot invoice uses a hosted Stripe page and explicit service period; verified `invoice.paid` grants one entitlement; duplicate, failure, refund, and disorder tests pass | Blocked on app credentials after V2-1 |
| V2-5 | HubSpot revenue operations | New Business, Expansion, Renewal, and onboarding/support ticket workflows receive deterministic projections with no participant data | Blocked on app credentials after V2-1 |
| V2-6 | Reconciliation | Passage, Stripe, and HubSpot match for seven consecutive daily test runs; variances enter a visible repair queue | Queued |
| V2-7 | Enterprise admin | Organization, users/roles, billing contacts, usage, invoice state, audit export, integration health, and recovery paths pass owner/admin/reviewer tests | Queued |
| V2-8 | Release sign-off | Desktop, 390px, 360px, keyboard, error/replay, four-persona, Demo reset, and complete provider test matrix pass independently | Core product matrix passed; commercial provider matrix remains |

## Delivery forecast from the current state

These dates assume the separate Stripe sandbox and HubSpot test application credentials are available to the deployed Demo project by September 4, 2026. They are evidence gates, not calendar-only promises.

| Target | Earliest credible date | Included evidence |
| --- | --- | --- |
| Authority sales demonstration | Ready now | Public site, isolated Demo, fresh Demo run, complete authority journey, matching receipt, mobile/public route verification |
| Outbound and live discovery demonstrations | September 4, 2026 | Approved positioning, pricing hypothesis, ICP discovery fields, repeatable seven-minute authority story |
| V2 conversion and CRM intake | Passage intake live; provider target September 7, 2026 | Structured demo/pilot/support intake, deterministic Company/Contact/Deal/Ticket creation, confirmation and retry evidence |
| Stripe sandbox pilot UAT | September 9, 2026 | Hosted pilot invoice, verified paid event, one entitlement, duplicate/failure/refund/disorder replay |
| Complete commercial persona UAT | September 12, 2026 | Prospect, owner, admin, reviewer, participants, billing owner, support/onboarding, CRM and Stripe journey agree |
| Commercial automation sign-off | No earlier than September 19, 2026 | Seven consecutive clean Passage/Stripe/HubSpot reconciliation runs plus resolved P0 defects |
| Real-data enterprise pilot approval | Target September 21–25, 2026, subject to external review | Privileged MFA, advisor closeout, retention/restore/incident evidence, legal/privacy package and scoped independent security review |

The external security assessment and customer procurement are not fully controllable engineering dates. A buyer demonstration and commercial conversation should not wait for them; production customer data and an enterprise-security claim must.

## Current configuration truth

- HubSpot operator connection: connected with Company, Contact, Deal, Ticket, Product, and Line Item read/write capability.
- Deployed application: no `STRIPE_*` or `HUBSPOT_*` server credentials are configured in the current Production Vercel project.
- Therefore the CRM and Stripe consoles may exist, but the product-to-provider loop is not yet connected and must not be described as working.

## V2 scorecard

- Visitor to demo request
- Demo request to booked walkthrough
- Signup to workspace ready
- Workspace ready to first activation
- First activation to first matching receipt
- Median active time to first matching receipt
- Participant completion and recovery rate
- Reviewer active time and clarification loops
- Evaluation to qualified pilot
- Pilot requested to invoice paid
- Paid event to entitlement latency
- Onboarding time to first approved success milestone
- Support volume and staff minutes per completed request
- Stripe/Passage/HubSpot reconciliation variance

## Provider rules

- The evaluation creates no Stripe customer or zero-dollar subscription.
- Browser redirects never prove payment.
- Stripe webhooks use the unchanged raw body, signature verification, a durable inbox, and permanent internal deduplication.
- The founding pilot invoice line includes its actual service period.
- CRM writes use unique Passage IDs and a durable outbox; email address and domain alone are not upsert keys.
- No participant identity, evidence, request content, account reference, decision, or receipt content enters Stripe or HubSpot.
- Payment problems may stop a future activation only under the documented grace policy. They never interrupt active work or remove receipts.

## Research basis

- [Stripe Hosted Invoice Page](https://docs.stripe.com/invoicing/hosted-invoice-page)
- [Stripe subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Stripe webhook signatures](https://docs.stripe.com/webhooks/signature)
- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [HubSpot CRM architecture](https://developers.hubspot.com/docs/api-reference/latest/crm/understanding-the-crm)
- [HubSpot pipelines](https://developers.hubspot.com/docs/api-reference/latest/crm/pipelines/guide)
- [HubSpot properties and unique identifiers](https://developers.hubspot.com/docs/api-reference/latest/crm/properties/guide)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
