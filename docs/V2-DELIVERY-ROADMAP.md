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
- [x] Complete one real Demo Google sign-in and one fresh principal-to-representative email-link journey. Google sign-in reached the institution workspace; the saved Chrome site rule was corrected; both participant links opened on `demo.thepassageapp.io`.

## Execution priority — September 5, 2026

The roadmap is sequenced by the next customer commitment, not by feature breadth. Discovery outreach and synthetic demonstrations can start now. Production customer data and an enterprise-ready claim remain gated.

| Priority | Window | Outcome | Exit evidence |
| --- | --- | --- | --- |
| P0 — prove and package | Now, during independent QA | A repeatable buyer demonstration with no critical or high defects | Independent QA findings triaged; zero open critical/high defects; timed four-profile run under seven minutes; invitation, receipt, newest-link and recovery behavior confirmed; one-pager, demo script and outbound sequence receive final buyer/sender review |
| P1 — open controlled pipeline | Next 2–3 business days | Five-account discovery batch operating from one source of truth; conversations and demonstrations use synthetic data only | Twenty-account New York community-bank and credit-union target list with buyer roles and warm/referral paths ranked before cold outreach; first five accounts personalized; Passage HubSpot private app connected; additive no-delete schema applied; demo/pilot/support intake proves Company, Contact, Deal or Ticket creation plus confirmation and retry. No real institution POA, participant, account or authority data is accepted, and no live-business onboarding begins in P1 |
| P2 — qualify a real-data pilot | Before accepting customer data or live business | A narrow founding pilot can pass security, billing, legal, vendor-risk and operating review | Stripe failure/refund/out-of-order replay; remaining hosted negative paths; seven clean daily reconciliation runs; privileged MFA; retention, restore and incident evidence; buyer-specific assurance and vendor-risk evidence; privacy and scoped security review; counsel-led review of product claims, target-state POA formalities, institution decision responsibilities, and applicable electronic-signature/record requirements. If Passage ever creates or executes a POA instrument, that capability requires a separate jurisdiction-specific legal gate before release |
| P3 — customer-gated expansion | After a qualified buyer requires it | Enterprise identity and integration scope follows evidenced demand | SAML/SSO, SCIM, custom roles, hierarchy, SIEM, broad core integrations and published annual pricing remain deferred until a qualified pilot supplies requirements |

Current decision: **go** for targeted research and discovery conversations. Live synthetic demos remain conditional on one authenticated valid-input production replay of `Save draft` and team `Send invitation`; the original zero-request report was traced to empty required email fields and the missing-feedback usability defect is deployed. **No-go** remains for real institution POA data, live-business onboarding, production customer data or a full-enterprise-readiness claim. Working readiness remains **8.5/10 for the Demo experience**, **8/10 for controlled outbound**, and **5/10 for production enterprise use** until the final replay and timed rehearsal are recorded.

## Product strategy

V2 is a hybrid journey, not anonymous card-first PLG:

1. No-card synthetic evaluation.
2. First value is a completed institution decision with matching participant receipts.
3. A $5,000, 60-to-90-day founding pilot is sales-assisted and invoice-led.
4. Annual plans use a recurring base with an included activated-request allowance.
5. Top-ups are one-time non-recurring expansion until demand is committed in a later subscription term.

This follows the current product boundary and Stripe's supported hosted invoice, subscription, and webhook patterns. Passage remains the usage and entitlement source; Stripe remains the payment source; HubSpot remains the customer and revenue-workflow projection.

## V3 strategic hypothesis — not a V2 capability or public claim

The proposed long-term category is a persistent authority-status layer: an institution records its own current decision, scope, limits, effective period and later lifecycle changes once, while authorized channels and systems retrieve the same current result. The strategic wedge is **defensible, consistent handling**, not generic speed and not legal-document creation. V2 must first prove that institutions value a shared current decision and receipt before Passage commits to the integration depth required for V3.

Current internal hypotheses, pending the source-backed competitive brief and buyer discovery:

1. Document-creation, storage, identity and notarization products are upstream or point-in-time complements; the open lane may be the institution's ongoing decision and authority status.
2. A well-funded signing or identity provider could extend into the decision layer, so Passage cannot treat workflow screens alone as a moat.
3. The durable moat would require lifecycle accuracy, revocation propagation, auditable institution decisions and reliable read APIs across servicing channels—not an unsupported “safe harbor” or automated legal-validity claim.
4. Expansion order to test is trustee/trust-account authority, guardianship/conservatorship, then executor/estate access. Representative-payee workflows remain deprioritized until buyer evidence changes the fit assessment.
5. Deep core, call-center and digital-banking integrations remain customer-gated. No V3 integration-depth claim is allowed until a reproducible adapter and a qualified institution requirement exist.
6. The $5,000 founding pilot is a capped, scoped proof-of-concept fee credited toward year one. It is not Passage's published list price, annual price or evidence of market willingness to pay.

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
| V2-4 | Stripe test billing | Pilot invoice uses a hosted Stripe page and explicit service period; verified `invoice.paid` grants one entitlement; duplicate, failure, refund, and disorder tests pass | Positive path passed in Demo and the green artifact is published on the ready custom domain: owner command and outbox are idempotent; real $5,000 hosted test invoice `NFYSMYD4-0001` was paid; signed event `evt_1UCAbnRteXSJR0llBnw5VkEm` was durably received and applied; duplicate replay left exactly one 100-request allowance and one activation audit. Failure/refund/disorder replay and reconciliation remain |
| V2-5 | HubSpot revenue operations | New Business, Expansion, Renewal, and onboarding/support ticket workflows receive deterministic projections with no participant data | Passage portal `246159600` audit complete; exact no-delete migration proposed. Current free tier supports only one Deal pipeline and locks Workflows, so a developer test account or suitably licensed target, approved migration, private-app connection, and provider replay remain |
| V2-6 | Reconciliation | Passage, Stripe, and HubSpot match for seven consecutive daily test runs; variances enter a visible repair queue | Queued |
| V2-7 | Enterprise admin | Organization, users/roles, billing contacts, usage, invoice state, audit export, integration health, and recovery paths pass owner/admin/reviewer tests | In progress: owner/admin/reviewer production authorization replay passed September 5; remaining pilot controls are explicit below |
| V2-8 | Release sign-off | Desktop, 390px, 360px, keyboard, error/replay, four-persona, Demo reset, and complete provider test matrix pass independently | Independent production onboarding, free-tier gate, same-day Gmail placement and public claims audit passed. Blank required fields explained the reported zero-request form clicks; visible validation feedback is deployed. Valid-input production replay, timed four-profile rehearsal, remaining hosted negative paths and commercial provider matrix remain |

## Delivery forecast from the current state

These dates are evidence gates, not calendar-only promises. Stripe is connected in Demo; HubSpot provider credentials and an appropriate test or licensed target remain dependencies for CRM provider replay.

| Target | Earliest credible date | Included evidence |
| --- | --- | --- |
| Authority sales demonstration | Ready now | Public site, isolated Demo, fresh Demo run, complete authority journey, matching receipt, mobile/public route verification |
| Outbound and live discovery demonstrations | Ready for a controlled five-account batch after final sender review | Approved positioning, pricing hypothesis, ICP discovery fields, repeatable seven-minute authority story |
| V2 conversion and CRM intake | Passage intake live; provider target September 7, 2026 | Structured demo/pilot/support intake, deterministic Company/Contact/Deal/Ticket creation, confirmation and retry evidence |
| Stripe sandbox pilot UAT | Positive path and publication passed; negative-path completion is next | Real hosted $5,000 test invoice, signed paid event, one entitlement, idempotent duplicate and green Vercel publication passed. Finish failure/refund/disorder browser replay |
| Complete commercial persona UAT | September 12, 2026 | Prospect, owner, admin, reviewer, participants, billing owner, support/onboarding, CRM and Stripe journey agree |
| Commercial automation sign-off | No earlier than September 19, 2026 | Seven consecutive clean Passage/Stripe/HubSpot reconciliation runs plus resolved P0 defects |
| Real-data enterprise pilot approval | Target September 21–25, 2026, subject to external review | Privileged MFA, advisor closeout, retention/restore/incident evidence, privacy package, scoped independent security review, and counsel sign-off on product boundaries, target-state POA formalities and applicable electronic-signature/record requirements |

## V2-7 enterprise administration game plan

The primary-source benchmark, capability model, role recommendations and negative-test matrix are maintained in [ENTERPRISE-ORGANIZATION-ADMIN-BENCHMARK-2026-09-04.md](./ENTERPRISE-ORGANIZATION-ADMIN-BENCHMARK-2026-09-04.md). Passage currently scores **44/100 for enterprise-administration maturity**. This is a product-maturity baseline, not a security grade.

| Sub-gate | Outcome | Focused effort | Exit evidence | Status |
| --- | --- | ---: | --- | --- |
| V2-7A | Legible organization administration | Accelerated 48–72 hour sprint | Unified admin shell/readiness, visible role matrix, invitation lifecycle, protected owner transfer, member status/search, six-role persona replay | In progress: unified entry, readiness controls, effective-role presentation, capability registry, server-command guards, three-role production data, owner browser replay, admin/reviewer authorization replay, cross-tenant denial, readable access history, and deployment passed September 5; owner transfer, search, team-invitation delivery receipts, and independent browser replay for the remaining roles remain |
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
- Release state, September 5: 131 domain and security tests, TypeScript, ESLint, optimized production build, 44 public routes, and eight participant-link recovery states pass. Demo deployment `dpl_BWHK6ZdbLB7UivCd3L3jppvNFyFY` and production deployment `dpl_7FodJEgiNqg2sGA8kRMz9syD6iGz` are ready on their custom aliases and add visible feedback when browser validation blocks a required-field submission. Public-form browser checks passed on both aliases without console, framework-overlay, or runtime errors.
- Domain and authentication state, September 5: `demo.thepassageapp.io` is a ready Vercel production alias and the configured Supabase site/callback origin. Google OAuth redirects through the configured Supabase callback and a real Passage-account sign-in reached the institution workspace. Email magic-link delivery was separately accepted and confirmed by Resend.
- Fresh hosted transaction evidence, September 5: request `PA-6C4FF6F2DB` completed principal confirmation, delivered and opened the representative invitation, saved representative acceptance and certification, uploaded the two approved fictional files, completed institution evidence review, submitted the disclosure, and recorded accepted-with-limits receipt `PAR-470074AA96BC`. Both participant receipt emails were submitted for delivery. This proves the happy path with real hosted sessions; an independently timed four-profile rehearsal and hosted negative paths remain release gates.
- Mobile receipt-link evidence, September 5: the hardened email CTA opened successfully from mobile Gmail. An earlier receipt email opened the correct superseded-link recovery page after a newer receipt had been issued, proving both click compatibility and fail-closed replacement behavior.
- Enterprise persona evidence, September 5: the Passage Demo Credit Union workspace visibly contains active Owner, Administrator, and Institution Reviewer identities. Production authorization replay proved reviewer request visibility, zero cross-tenant rows, denied reviewer invite and request-create mutations, denied administrator owner creation, zero rows from denied mutations, and append-only membership lifecycle events.
- Independent QA evidence, September 5: real production signup/onboarding, the sixth-activation gate, same-day Gmail Inbox placement across three test organizations, Demo consumed-link recovery, and the coordination-not-legal-validation claims boundary passed. One authenticated valid-input production draft and team-invitation replay remains. The Vercel team has no separate active legacy funeral-home project or alias in its accessible inventory.
- HubSpot provider credentials remain unconfigured in the deployed projects. The Stripe positive path and green Demo publication are proven, but the complete commercial loop must not be described as release-complete until failure/refund/disorder plus reconciliation coverage pass.

## Outbound launch control

The customer-facing message, verified claims, asset checklist, target-account sequence, and stop/go rules are maintained in [SALES-OUTBOUND-LAUNCH-PLAN-2026-09-05.md](./SALES-OUTBOUND-LAUNCH-PLAN-2026-09-05.md). The buyer-ready [sales one-pager](./SALES-ONE-PAGER-2026-09-05.md), [seven-minute demo script](./SEVEN-MINUTE-DEMO-SCRIPT-2026-09-05.md), and [controlled outbound sequence](./OUTBOUND-SEQUENCE-2026-09-05.md) are drafted from the verified hosted flow. Website, deck, one-pager, demo script, outbound copy, and CRM fields must use those files and the selling brief as their shared source of truth.

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
