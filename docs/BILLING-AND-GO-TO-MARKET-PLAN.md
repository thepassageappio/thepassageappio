# Passage Authority billing and go-to-market plan

**Status:** Approved planning baseline for controlled MVP sequencing  
**Date:** September 2, 2026  
**Boundary:** No live Stripe configuration, charge, customer communication, or real institution data is authorized by this document.

## Who pays

The customer is the financial institution organization. The principal, representative, and reviewer never pay for an authority request and never enter payment details.

Only an organization owner or authorized administrator may begin or manage a paid relationship. Billing identity maps to the organization, not to an individual authority record or participant.

## Offer ladder

| Offer | Price | Payment approach | Usage treatment |
| --- | --- | --- | --- |
| Controlled evaluation | $0 | No card and no bank account | Five activated synthetic requests over 10 days |
| Founding proof-of-concept pilot | $5,000 for 60 to 90 days, credited toward year one when converted under the pilot agreement | Sales-assisted Stripe invoice or Hosted Invoice Page; card or supported bank transfer | Agreed pilot allowance; no per-participant charge |
| Institution relationship | Custom after pilot evidence | Contract plus Stripe invoice; subscription and customer portal only when operationally approved | Base price with included authority-request volume; contracted overage or tier changes only after validation |

The first paid release does not use a card-on-file requirement during signup. A bank or credit union should first qualify the workflow, approve the pilot scope, sign the applicable agreement, and then receive a Stripe-hosted payment or invoice path.

## What counts as a transaction

One billable or allowance-consuming unit is one successfully activated authority request.

- Saving or editing a draft does not count.
- Retrying a failed command does not count.
- Replaying the same idempotency key does not count twice.
- Uploading evidence, requesting information, deciding, expiring, rejecting, or revoking does not create a second transaction.
- A correction requires an explicit, audited usage adjustment rather than altering the original usage entry.

Passage's append-only organization usage ledger is canonical. Stripe receives payment state and, only if later approved, a derived usage meter. Stripe is not the authority source for request counts.

## Payment architecture

1. An authorized institution user requests or accepts a paid offer.
2. Passage creates or retrieves one Stripe Customer mapped to the organization.
3. Passage creates an approved test-mode invoice, Hosted Invoice Page, or Checkout Session.
4. Stripe collects card or supported bank-payment information on a Stripe-hosted surface; Passage stores no raw payment credentials.
5. The return page shows `Payment pending`; it does not grant access.
6. A signed Stripe webhook is stored by event identifier and processed idempotently.
7. One database transaction records the billing event, updates the organization entitlement, and appends the entitlement activity.
8. Duplicate or out-of-order events return the previously saved result or remain pending for reconciliation.
9. The organization billing view shows offer, allowance, usage, payment state, invoices, and the next action in user language.

Plaid is not part of this flow. Plaid connects or authenticates bank accounts for data or transfer use cases; it is not how customers enter a credit card. A future Plaid decision requires a separate product need and security review.

## Pricing strategy

Do not launch a low-value per-click charge or a consumer microtransaction model. Passage sells operational control, cycle-time reduction, consistent institution decisions, and current receipts.

The initial pricing hypothesis is:

- fixed-price paid pilot to prove value and implementation fit;
- annual platform price with an included authority-request allowance;
- graduated overage or pre-purchased request packs after real buyer discovery establishes expected volume, support burden, risk, procurement preference, and willingness to pay;
- professional services, custom integrations, or enhanced support priced separately when scoped.

Exact annual volume bands and per-request overage rates remain deliberately unset until at least ten qualified buyer interviews and the first design-partner pilot produce evidence.

The researched model comparison, comparable-product evidence, CRM lifecycle, and future platform vision are recorded in [PRICING-AND-PACKAGING-RESEARCH.md](./PRICING-AND-PACKAGING-RESEARCH.md).

## Future product-led growth lane

After controlled pilots prove the workflow and the service can support low-touch onboarding, test a self-service offer of one activated authority request per verified organization per calendar month.

- No card is required and unused requests do not roll over.
- Principals, representatives, and reviewers are never charged.
- The upgrade moment is the second activation in a month or a need for more team members, templates, integrations, support, or volume.
- Records and receipts remain available after the free monthly allowance is used.
- Organization-domain verification, duplicate-organization prevention, rate limits, abuse monitoring, automated onboarding, support recovery, and a durable monthly entitlement reset must exist first.
- Measure verified signup-to-activation, first completed receipt, second-request intent, qualified-pilot conversion, support burden, and abuse before expanding the offer.

This is a roadmap experiment, not the current controlled evaluation entitlement. The tested five-request, 10-day evaluation remains in place until a separately approved migration implements and verifies the monthly model end to end.

## ICP and selling sequence

Primary initial ICP hypothesis: regional banks and credit unions with manual financial-POA intake, repeated branch/contact-center handoffs, compliance review queues, and no shared current receipt.

Likely champions are deposit operations, member/customer operations, compliance operations, legal operations, or digital servicing leaders. Economic buyer and procurement path must be learned rather than assumed.

Sequence:

1. Conduct problem interviews without leading with product features.
2. Qualify annual authority volume, cycle time, exception rate, current owners, decision policy, systems, and cost of delay.
3. Demonstrate the verified seven-minute synthetic transaction.
4. Offer a narrowly scoped 90-day design-partner pilot with written success measures.
5. Convert only when the institution accepts the security, legal, data, support, and operating boundaries.
6. Use pilot evidence to finalize annual volume bands, implementation scope, and expansion strategy.

## Readiness gates

### Ready now

- ICP interviews and positioning research.
- Controlled synthetic demonstrations with honest boundaries.
- Owner-run public-domain UAT.
- Stripe data-model and negative-path test design.

### Before Stripe test implementation

- Public-domain Supabase Auth callback is verified.
- Owner completes the full persona flow without developer intervention.
- Remaining expiry, wrong-person, recovery, direct-document denial, information-request, withdrawal, and expiration tests close.
- Demo, trust, and integration proof are clear enough that billing work will not delay a sellable pilot story.
- Owner approves the clean Authority test products and prices.

### Before live payment

- Test-mode signature, duplicate, ordering, pending, paid, failed, cancellation, refund, and reconciliation evidence passes.
- Tax, refund, cancellation, invoice, support, and accounting policies are approved.
- Pilot agreement, privacy terms, subprocessor record, monitoring, retention, recovery, and security review are approved.
- Owner gives explicit authorization to create or use live Stripe products and accept a real payment.

## Remaining roadmap order

1. Owner-run end-to-end persona UAT in independent browser profiles.
2. Hosted negative-path and independent replay closeout.
3. Stable resettable seven-minute demo and plain-language copy closeout.
4. Enterprise trust, deliverability, observability, accessibility, retention, recovery, and support evidence.
5. Hosted-first integration quickstart and measured time-to-first-complete-request.
6. ICP interviews, pilot qualification, discovery, objection, and security materials.
7. Stripe test-mode invoice, webhook, entitlement, billing view, and reconciliation.
8. HubSpot fields, stages, inbound routing, and outbound automation based on the validated journey.
9. Controlled design-partner pilot and evidence-based annual pricing.
10. Verified-organization self-service experiment with one free activation per calendar month.
