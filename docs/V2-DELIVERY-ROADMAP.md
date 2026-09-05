# Passage Authority V2 delivery roadmap

**Status:** Active delivery contract  
**Updated:** September 5, 2026, Google OAuth, custom SMTP, and Demo DNS configured
**V2 outcome:** A qualified institution can discover Passage, start a synthetic evaluation, reach a matching decision receipt, request a founding pilot, pay an invoice, receive the correct entitlement, invite its team, and enter onboarding with Passage, Stripe, and HubSpot in agreement.

The supporting evidence review and explicit non-priorities are maintained in [V2-BEST-PRACTICE-REVIEW.md](./V2-BEST-PRACTICE-REVIEW.md).
For a fresh-chat operational restart, use [NEW-CHAT-HANDOFF.md](./NEW-CHAT-HANDOFF.md) and the phrase `AUTHORITY PUMPKIN 246159600`.

## Owner to-do list — no due date

- [x] Enable 2-step verification for the Passage Google account so Google Cloud Console access is restored.
- [x] Connect the existing Passage Web OAuth client to the Demo Supabase callback and enable the Google provider.
- [x] Configure a dedicated, sending-only Resend credential for Supabase Auth custom SMTP and verify delivery to the Passage inbox.
- [ ] User-complete one Demo Google sign-in and open the latest email link through onboarding and recovery. Configuration and email delivery are verified; the controlled Chrome session blocked the Google authorization endpoint locally before the account prompt.

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
| V2-2 | Conversion intake | One short demo/pilot/support form creates deduplicated HubSpot Company, Contact, Deal or Ticket with attribution and a visible confirmation | Partial: live intake, confirmation, immutable event, leased HubSpot worker, privacy scan, retry, and replay passed; Passage HubSpot portal `246159600` and its current schema are audited, and the exact additive migration awaits approval, provisioning, and private-app connection |
| V2-3 | Evaluation activation | Signup resumes correctly; no more than five pre-value fields; workspace shows one next action, allowance, days, and progress to first matching receipt | Partial: live workspace guidance passed; signup/resume field audit remains |
| V2-4 | Stripe test billing | Pilot invoice uses a hosted Stripe page and explicit service period; verified `invoice.paid` grants one entitlement; duplicate, failure, refund, and disorder tests pass | Positive path passed in Demo: owner command and outbox are idempotent; real $5,000 hosted test invoice `NFYSMYD4-0001` was paid; signed event `evt_1UCAbnRteXSJR0llBnw5VkEm` was durably received and applied; duplicate replay left exactly one 100-request allowance and one activation audit. Green Vercel code publication, failure/refund/disorder replay, reconciliation, and custom-domain repair remain |
| V2-5 | HubSpot revenue operations | New Business, Expansion, Renewal, and onboarding/support ticket workflows receive deterministic projections with no participant data | Passage portal `246159600` audit complete; exact no-delete migration proposed. Current free tier supports only one Deal pipeline and locks Workflows, so a developer test account or suitably licensed target, approved migration, private-app connection, and provider replay remain |
| V2-6 | Reconciliation | Passage, Stripe, and HubSpot match for seven consecutive daily test runs; variances enter a visible repair queue | Queued |
| V2-7 | Enterprise admin | Organization, users/roles, billing contacts, usage, invoice state, audit export, integration health, and recovery paths pass owner/admin/reviewer tests | In planning: 44/100 baseline benchmark complete; V2-7A through V2-7D sequenced below |
| V2-8 | Release sign-off | Desktop, 390px, 360px, keyboard, error/replay, four-persona, Demo reset, and complete provider test matrix pass independently | Core product matrix passed; commercial provider matrix remains |

## Delivery forecast from the current state

These dates assume the separate Stripe sandbox and HubSpot test application credentials are available to the deployed Demo project by September 4, 2026. They are evidence gates, not calendar-only promises.

| Target | Earliest credible date | Included evidence |
| --- | --- | --- |
| Authority sales demonstration | Ready now | Public site, isolated Demo, fresh Demo run, complete authority journey, matching receipt, mobile/public route verification |
| Outbound and live discovery demonstrations | September 4, 2026 | Approved positioning, pricing hypothesis, ICP discovery fields, repeatable seven-minute authority story |
| V2 conversion and CRM intake | Passage intake live; provider target September 7, 2026 | Structured demo/pilot/support intake, deterministic Company/Contact/Deal/Ticket creation, confirmation and retry evidence |
| Stripe sandbox pilot UAT | Positive path passed; release target within 24 hours of restored publication path | Real hosted $5,000 test invoice, signed paid event, one entitlement, and idempotent duplicate passed. Publish the green Vercel artifact, then finish failure/refund/disorder browser replay |
| Complete commercial persona UAT | September 12, 2026 | Prospect, owner, admin, reviewer, participants, billing owner, support/onboarding, CRM and Stripe journey agree |
| Commercial automation sign-off | No earlier than September 19, 2026 | Seven consecutive clean Passage/Stripe/HubSpot reconciliation runs plus resolved P0 defects |
| Real-data enterprise pilot approval | Target September 21–25, 2026, subject to external review | Privileged MFA, advisor closeout, retention/restore/incident evidence, legal/privacy package and scoped independent security review |

## V2-7 enterprise administration game plan

The primary-source benchmark, capability model, role recommendations and negative-test matrix are maintained in [ENTERPRISE-ORGANIZATION-ADMIN-BENCHMARK-2026-09-04.md](./ENTERPRISE-ORGANIZATION-ADMIN-BENCHMARK-2026-09-04.md). Passage currently scores **44/100 for enterprise-administration maturity**. This is a product-maturity baseline, not a security grade.

| Sub-gate | Outcome | Focused effort | Exit evidence | Status |
| --- | --- | ---: | --- | --- |
| V2-7A | Legible organization administration | Accelerated 48–72 hour sprint | Unified admin shell/readiness, visible role matrix, invitation lifecycle, protected owner transfer, member status/search, six-role persona replay | In progress: unified entry, readiness controls, effective-role presentation, capability registry, server-command guards, and owner/admin tests pass in the September 4 working copy; owner transfer, search, delivery receipts, browser persona replay, and deployment remain |
| V2-7B | Centralized authorization | 4–7 working days | Canonical capability registry, no scattered role-name decisions, explicit active organization, route/command/database parity tests, billing/integration admin templates | Queued after V2-7A |
| V2-7C | Pilot administration | 5–10 working days | Billing contacts and status, audit search/export, access certification, integration health, retention/support surfaces, verified domain and privileged MFA | Queued after V2-7B; provider and security dependencies apply |
| V2-7D | Enterprise identity and scale | Customer-gated, typically 2–6 additional weeks | SAML/OIDC, SCIM/groups, IdP role mapping and any evidenced hierarchy/custom-role/SIEM requirements | Not committed until a qualified pilot supplies requirements |

For one focused implementation stream, V2-7A through V2-7C total **11–21 engineering days**. Allow **3–5 calendar weeks** for implementation, review, browser/persona QA and defect repair. A procurement-ready SSO/SCIM package is therefore a separate **5–9 calendar week** path from start, depending on identity provider, customer availability and external review. The first materially improved enterprise demo does not need to wait: V2-7A should be demonstrable within **2–4 working days**.

**Accelerated decision, September 4:** Passage will target a buyer-demonstrable V2-7A plus the authorization spine of V2-7B within 48–72 hours. SSO, SCIM, custom roles, hierarchy, SIEM streaming, and certification workflows are explicitly deferred unless a qualified buyer makes one a near-term gate. The compressed target does not reduce the independent negative-test or fail-closed requirements.

The critical path is:

`admin clarity -> centralized capabilities -> lifecycle/parity proof -> pilot operations -> privileged identity -> customer-gated SSO/SCIM`

Work may proceed without provider credentials through V2-7A and most of V2-7B. Stripe, HubSpot, email-delivery, MFA/domain and customer IdP access become gating inputs in V2-7C or V2-7D. No enterprise-ready claim is allowed until the acceptance replay and negative cases in the benchmark pass independently.

The external security assessment and customer procurement are not fully controllable engineering dates. A buyer demonstration and commercial conversation should not wait for them; production customer data and an enterprise-security claim must.

## Current configuration truth

- Passage HubSpot target: portal `246159600`, visibly confirmed as the Thepassageapp account. The installed HubSpot connector is attached to the unrelated Go Ideally portal and is prohibited for this work.
- Passage HubSpot operator state: Chrome control was restored and the read-only schema, pipeline, form, workflow-availability, Deal-count, and Ticket-count audit completed. No Passage HubSpot records or settings were modified. The exact proposed migration is in `HUBSPOT-PORTAL-AUDIT-AND-MIGRATION.md`.
- Stripe Demo provider state: Vercel Demo Production now holds server-only `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PILOT_PRICE_ID`. Stripe test product `prod_VCZ5TIRtHX7gFp`, one-time price `price_1UC9x5RteXSJR0llsNddPyRR`, and destination `we_1UC9xmRteXSJR0llN32Gbane` are active. No live-mode Stripe data was changed.
- Stripe ingestion evidence, September 4: synthetic event `evt_1UCA7SRteXSJR0llbAZL13OM` reached the deployed route with `200 OK`; the response reported `received: true`, `replayed: false`, and inbox receipt `41d4a6bb-afe7-4c89-9187-adc7ca95dbbd`.
- Stripe positive-pilot evidence, September 4: real test invoice `in_1UCAZqRteXSJR0llmqI675C4` / `NFYSMYD4-0001` was finalized for $5,000 and marked paid; signed event `evt_1UCAbnRteXSJR0llBnw5VkEm` was durably received and applied in Demo. Passage recorded one paid order, active contract/subscription, one 100-request allowance lot, one activation audit, and a `pilot / active` entitlement; duplicate replay did not add a second grant.
- Release state: owner action, Stripe outbox worker, scoped billing view, and automatic V2 webhook handler pass 122 tests, ESLint, TypeScript, and production build locally. Publishing is blocked by the current host's unavailable deployment-approval path and blocked direct shell network; this is an artifact-publication blocker, not a code or provider failure.
- Domain issue: Vercel reports `demo.thepassageapp.io` as `Invalid Configuration`. The test destination temporarily targets the valid project domain `passage-authority-demo.vercel.app`; DNS repair and a successful custom-domain replay remain required.
- HubSpot provider credentials remain unconfigured in the deployed projects. The Stripe positive path is proven in Demo, but the complete commercial loop must not be described as release-complete until the green artifact is published and failure/refund/disorder plus reconciliation coverage pass.

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
