# Stripe Demo QA evidence — September 4, 2026

## Scope

Test mode and the isolated Vercel Demo project only. No live Stripe products, customers, invoices, payments, or credentials were changed.

## Configuration

- Stripe product: `prod_VCZ5TIRtHX7gFp`
- One-time $5,000 USD price: `price_1UC9x5RteXSJR0llsNddPyRR`
- Webhook destination: `we_1UC9xmRteXSJR0llN32Gbane`
- Selected events: `invoice.paid`, `invoice.payment_failed`, `charge.refunded`
- Vercel Demo Production secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PILOT_PRICE_ID`
- Deployment: `9BKPQxT8H5GMn61noujC8ahJAnJ2`, Ready

## Passed evidence

Synthetic `invoice.paid` event `evt_1UCA7SRteXSJR0llbAZL13OM` was delivered to the deployed webhook route at 11:18:19 PM EDT.

- Stripe delivery result: `200 OK` / `Delivered`
- Application response: `received: true`
- Replay indicator: `replayed: false`
- Durable inbox receipt: `41d4a6bb-afe7-4c89-9187-adc7ca95dbbd`

This proves the signed-provider-event path through the deployed application to durable inbox ingestion.

The positive founding-pilot path was then replayed against the isolated Demo database and Stripe test mode:

- Owner-scoped command created order `3f1d507b-b4e9-4779-b8d5-e928264636f8` and outbox job `29d9a2ae-0fda-44f7-a8d8-769a66990477` before any provider result.
- Reusing the same command idempotency key returned the same order with `replayed: true`.
- Stripe test invoice `in_1UCAZqRteXSJR0llmqI675C4` / `NFYSMYD4-0001` was finalized for $5,000 and marked paid out of band in test mode.
- Its signed `invoice.paid` event `evt_1UCAbnRteXSJR0llBnw5VkEm` reached the deployed webhook with a valid signature and a durable inbox row.
- Applying the new V2 handler produced one paid order, one active subscription, one active contract, one 100-request allowance lot, one activation audit, and a `pilot / active` organization entitlement.
- Replaying the event left the allowance-lot and activation-audit counts at exactly one.

The new owner action, Stripe outbox worker, scoped billing-status projection, and automatic V2 webhook application pass 122 domain tests, ESLint, TypeScript, and an optimized Next.js production build in the release workspace.

## Open gates

1. Publish the green release workspace so the owner action and V2 webhook application run automatically in Vercel Demo. The connected deployment tool requires an approval path unavailable in the current host, while direct shell networking is blocked; the database and Stripe test artifacts are already live.
2. `demo.thepassageapp.io` is marked `Invalid Configuration` in Vercel. The webhook temporarily targets `https://passage-authority-demo.vercel.app/api/webhooks/stripe` until DNS is repaired and replayed successfully.
3. Prove payment-failed, partial/full refund, and out-of-order behavior against Stripe test events.
4. Reconcile Passage and Stripe and expose failures in a repair queue.

The provider connection and positive paid-pilot state transition are working in Demo. The clickable in-app automation is release-blocked until the green code artifact is published; negative-event and reconciliation gates remain.
