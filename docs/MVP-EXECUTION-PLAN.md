# Passage Authority MVP execution plan

**Launched:** August 28, 2026
**Current score:** 9.8 of 10 to a fully functioning hosted synthetic MVP
**Controlled MVP threshold:** Achieved on the approved public domain with a hosted synthetic transaction; independent owner replay remains the release-candidate gate, and commercial implementation begins only after all P0/P1 gates pass
**Active work limit:** One complete vertical slice

## Release path and measurable success gates

Work proceeds in this order. A later gate may be designed early, but it does not displace an unfinished earlier gate.

| Priority | Gate | Success criteria | Current status |
| --- | --- | --- | --- |
| P0 | Clear journeys and copy | Every public and persona page names the user, current status, next action, saved result, visibility, and recovery path in plain language. No raw IDs, database terms, event names, unexplained security jargon, or unsupported enterprise claims are visible. Primary tasks fit in the first useful viewport; history and audit detail are secondary disclosures. Desktop, 390px, 360px, keyboard, link, and empty/error-state checks pass. | Public routes pass at desktop, 390px, and 360px; authenticated and participant keyboard/error closeout remains |
| P0 | Repeatable enterprise demo | A fresh synthetic organization and request can be reset and completed from institution signup through revocation in 7 minutes or less using a written script, without developer intervention, critical defects, or manual database changes. | Dedicated Demo Vercel and clean Supabase boundaries are live from the same release. A second fresh one-click run passed the complete product-state story through correction, matching receipts, and revocation without a manual database edit. Branded DNS and an owner-operated timed rehearsal across independent profiles remain |
| P0 | Independent persona UAT | Institution owner, account holder, representative, and reviewer use separate browser profiles or devices. Each receives the right message, completes only authorized actions, sees the same final receipt, and sees the same later lifecycle change. Wrong-role, reused-link, stale-page, rejected, withdrawn, expired, and recovery paths leave correct durable state and activity. | Fresh Demo owner, principal, and representative browser journey passed through private uploads, correction recovery, decision, matching receipts, and revocation. A separate hosted reviewer account passed review-only navigation and direct create/activate denial at desktop, 390px, and 360px with durable state unchanged. An independent database read matched status, versions, events, decision fingerprint, and usage, and automated proof covers the full seven-case negative matrix. The owner-timed four-profile rehearsal, recovery inbox placement, and hosted expiration initiation remain |
| P1 | Enterprise trust and volume proof | Organization isolation, least privilege, private-file denial, signed-delivery replay, retry/idempotency, backup/restore, monitoring, and incident evidence pass. A documented synthetic load test meets an approved concurrency, latency, and error budget without duplicate transitions or mismatched receipts. Claims on the site match collected evidence. | Core transaction controls passed. The legacy SQLite UI, mutation actions, and sandbox API are denied on the public deployment; live probes confirmed generic 404 responses and private no-store/no-index headers. Hosted negative-access, operating, and load evidence remain |
| P1 | Integration proof | A buyer can choose hosted or API-led adoption. A sandbox quickstart, sample request, authenticated API example, signed webhook example, retry instructions, and system diagram are published. A developer reaches the first complete synthetic request from clean credentials against a measured time target. | Product boundary exists; public quickstart and measured integration replay remain |
| P1 | Controlled-pilot operations | Email authentication and inbox placement, accessibility, performance, retention/deletion, support ownership, incident response, security review, legal terms, and pilot exit criteria are documented and tested. | Partially complete |
| P2 | Billing and revenue operations | Stripe test invoices and entitlement webhooks pass signature, duplicate, ordering, failure, refund, cancellation, and reconciliation tests. Each paid top-up creates one Closed Won Expansion deal; Company current-contract spend rolls up paid base and expansion; Renewal is seeded from that value. Company segmentation, contact roles, subscription bucket, activated/completed usage, daily snapshots, seasonality, burn rate, expansion, and recurring-revenue reporting reconcile to Passage. | Requirements and architecture are documented. The strict C01–C11 backlog in `COMMERCIAL-DATA-ARCHITECTURE.md` remains queued until every P0/P1 gate is marked passed with evidence. |

### Demo-ready definition

The product is ready for enterprise demonstrations when the first three P0 gates pass and the demo uses only approved synthetic data. It is ready for a controlled institution pilot only when the P1 trust, integration, and operating gates also pass. Stripe, HubSpot, CRM automation, scaled inbound, and scaled outbound follow those gates so commercial traffic does not outrun the product and support system.

Execution references: [product vision and onboarding](./PRODUCT-VISION-AND-ONBOARDING.md), [demo readiness](./DEMO-READY-CHECKLIST.md), [demo environment architecture](./DEMO-ENVIRONMENT-ARCHITECTURE.md), [owner UAT runbook](./OWNER-UAT-RUNBOOK.md), [prospect-to-pilot journey](./CUSTOMER-JOURNEY-AND-GTM.md), [selling and pricing decisions](./SELLING-AND-PRICING-DECISION-BRIEF.md), and [commercial data architecture](./COMMERCIAL-DATA-ARCHITECTURE.md).

## Outcome

An authenticated institution can create and activate a New York financial power of attorney request. The principal, representative, and institution reviewer can complete their separate steps. Every action produces durable organization-isolated state, an append-only event, a matching receipt, and an observable notification or integration outcome.

The hosted product has completed this synthetic story through correction recovery, matching receipts, and revocation, with an independent database read matching the browser result. The local sandbox remains a regression harness; owner-operated independent-profile timing, hosted negative-access evidence, deliverability hardening, and the remaining P1 controls precede commercial implementation.

## Critical path

| Order | Slice | Exit result | Status |
| --- | --- | --- | --- |
| 1 | Hosted request foundation | Authorized institution user creates a draft in the correct organization queue. A second authorized user can read it through organization RLS. A non-member and revoked member cannot. | Core evidence passed; revoked-user browser message is final hardening evidence |
| 2 | Trial and activation | First invitation starts the 10-day trial and consumes one of five transactions exactly once. Request six is blocked without hiding existing work. | Passed end to end |
| 3 | Participant access | Principal and representative receive separate expiring links and complete only their permitted actions. | Hosted real-email happy path and 30-minute-session recovery passed; deliverability hardening remains |
| 4 | Evidence boundary | Representative completes hosted requirements using private test evidence, separated provider results, source-linked findings, and human confirmation. | Core passed with two browser uploads, certification, and institution review; negative direct-access replay remains |
| 5 | Review and lifecycle | Reviewer requests information, decides, and observes withdrawal, revocation, and expiration. | Hosted RFI, response, limited decision, and revocation passed; withdrawal/expiration negative-path closeout remains |
| 6 | Receipt and events | Shared receipt, durable outbox, signed webhook, retry, and replay agree with canonical state. | Hosted three-party receipt and lifecycle synchronization passed; an independent hosted read matched the final record, decision, fingerprint, event sequence, and usage. Delivery retry and inbox-placement evidence remain |
| 7 | Independent UAT and P1 closeout | Owner completes signup through revocation in the browser without developer intervention; trust, integration, load, and controlled-pilot operating evidence have no critical or high defects. | Engineering-operated fresh Demo replay passed end to end without database edits; owner-run timed replay and remaining P1 evidence remain. |
| 8 | Commercial foundation | After P0/P1 pass, the C01–C11 backlog implements Passage commercial truth, Stripe test billing, HubSpot projections, top-ups, renewals, and reporting in strict order. | Requirements and architecture complete; implementation queued. |

## Slice 1 acceptance contract

### User story

An authenticated organization owner, administrator, or staff member starts a request from the selected New York financial power of attorney template, saves it as a draft, and sees it in the organization queue. A reviewer enters only after the representative submits evidence for institution review.

### Durable results

- One organization-owned authority record with status `draft`.
- One immutable template key and version reference.
- One exact participant and scope snapshot.
- One append-only `authority.draft_created` event.
- One idempotency receipt for the authenticated actor and command.
- No invitation, usage debit, trial clock, or email.

### Authorization

- Owner, administrator, and staff may create and activate a draft. Reviewer access begins with submitted evidence and excludes request creation and activation.
- Auditor may read authorized organization records but may not create or change them.
- Developer has no personal-data access in the first hosted slice.
- A non-member, revoked member, or member of another organization receives no record existence signal.
- Organization and actor identity come from the authenticated session and database membership, never from trusted browser fields.

### Negative paths

- Invalid or reused idempotency key with different content.
- Duplicate participant email.
- Unsupported action.
- Missing selected template.
- Organization not ready.
- Revoked membership.
- Cross-organization record identifier.
- Invalid or past end date.

### Release evidence

1. Browser action creates the draft.
2. Database query proves organization, actor, status, version, and policy snapshot.
3. Event query proves sequence 1 and matching record identifier.
4. Queue displays the saved draft after a fresh page load.
5. Another authorized institution user sees the same draft.
6. A revoked or unrelated user cannot list or open the draft.
7. Replaying the same idempotency key returns the same record without a duplicate event.
8. TypeScript, lint, domain tests, optimized build, database advisors, and browser console checks pass.

## Current Slice 2 evidence

### Slice 2: activation and free usage

- Organization entitlements and append-only usage events are hosted.
- The request detail previews the principal, representative, scope, and exact trial consequence before activation.
- Activation atomically checks entitlement and record version, counts usage, advances status, creates two hashed invitations, writes one event and audit entry, queues principal delivery, and keeps representative delivery held.
- The 10-day clock started once on the first successful activation and remained unchanged through transaction five.
- Five activations completed with exactly five usage events, ten participant invitation records, ten hashed secrets, and ten outbox records. Principal delivery is first; representative delivery remains held until principal confirmation.
- The sixth activation returned `evaluation_limit_reached`, preserved the request as draft version 1, kept usage at 5 of 5, and created no activation side effect.
- Idempotent replay returns the same record without raw participant tokens or duplicate side effects.
- TypeScript, ESLint, 52 automated tests, the optimized build, and database security and performance review pass. The one missing outbox organization index found by the advisor was added.

### Browser closeout passed

- The owner browser shows 5 of 5 activated requests, five waiting requests, and one saved draft.
- An activated request shows principal-first sequencing and two separate role records.
- The sixth draft shows no activation button, explains that it remains saved, and links to the 90-day pilot.
- A direct sixth activation attempt returned the friendly evaluation-limit error before the proactive UI fix and produced no database side effect.
- Fresh-page state and browser logs passed after the corrected production rebuild.

### Slice 3: participant journeys

- Passed: invitation secrets are hashed and single-use invitation exchange creates a 30-minute record-bound, role-bound session.
- Passed: invitation reuse and wrong-record access fail safely without mutating the request.
- Passed: the principal decision requires explicit acknowledgment, writes one append-only decision and event, advances the canonical record, rotates representative access, and releases its notification only after confirmation.
- Passed: the representative receives the upstream change, opens separate access, explicitly accepts responsibility, and advances the same request to requirements.
- Passed: the institution browser sees both participant access events, both decisions, and the current record state with no browser log errors.
- Passed: independent replay returns the original results, produces no duplicate decision or event, preserves the same representative token, rejects idempotency payload mismatch, and rejects a stale version.
- Passed: real principal and representative messages were delivered through Resend from the hosted product, signed delivery webhooks changed durable state, and the owner saw confirmed delivery.
- Passed: principal acted first and the representative received access only after principal confirmation.
- Passed: audited fresh-link issuance revoked the old session and token. A schema defect that rejected the replacement session was found in hosted UAT, corrected to enforce one active session while preserving revoked history, and retested successfully.
- Passed: an intentionally expired 30-minute representative session recovered through a fresh single-use link without changing the prior decision or evidence.
- Active hardening: invitation revoke, wrong-person, post-revocation message, and remaining recovery browser proofs.
- Known blocker: initial invitation and resume messages landed in Gmail Spam, while the later decision receipt landed in Inbox. Provider acceptance and mail-server delivery are not sufficient for commercial deliverability.

### Slice 4 hosted evidence result

- Passed: two separate synthetic PDF sources uploaded through the hosted representative browser flow and remained private storage references.
- Passed: the representative and institution saw matching source and certification states.
- Passed: institution review advanced the canonical record only after all three requirements were complete.
- Passed: a fresh unauthenticated participant browser exposed and verified the corrected anonymous command boundary.
- Remaining: negative direct-source access and independent database replay closeout.

### Slices 5 and 6: hosted transaction parity

- Passed: hosted Postgres-backed commands preserved optimistic concurrency, immutable events, the policy snapshot, decision limits, and revocation through the tested transaction.
- Passed: institution, principal, and representative sequentially observed the same receipt code, fingerprint, decision, scope, limits, and lifecycle. Two participant tabs in one profile intentionally share one role-bound cookie and are not independent users.
- Passed: the institution requested clarification after representative disclosure, the representative responded, and the later institution decision preserved the disclosure in the receipt.
- Passed: revocation advanced the canonical request version while preserving the saved decision fingerprint.
- Remaining: hosted negative-path closeout for withdrawal and expiration plus an independent event replay from the hosted adapter.
- Boundary: the SQLite adapter remains a local regression harness and is not reachable from public website calls to action.

### Slice 7: commercial entitlement

- Archive superseded Passage Stripe products without touching historical records.
- Create clean Passage Authority pilot and annual products in Stripe test mode first.
- Default the $5,000 founding proof-of-concept pilot to a sales-assisted Stripe invoice or Hosted Invoice Page; credit it toward year one when converted and do not require a consumer-style checkout.
- Model the annual relationship as a contracted base price with included authority-request volume and graduated overage. Validate exact bands and overage pricing before encoding them.
- Passed: authenticated institution workspace now shows organization identity, role, offer, status, usage, period, payment approach, and the evaluation-to-pilot path in plain language.
- Store Stripe customer, invoice, payment, and optional subscription mapping by organization.
- Treat the existing Passage activation ledger as canonical usage; send a derived meter event to Stripe only if usage billing is later approved.
- Verify signature, duplicate delivery, out-of-order event, failed payment, cancellation, and reconciliation behavior.
- Never activate access from a success redirect, and never charge a principal or representative.
- Do not add Plaid to the billing flow; Stripe-hosted card and bank-payment surfaces are the first payment boundary.
- Promote to live mode only after the complete test transaction and entitlement replay pass.
- After controlled pilots and low-touch operations pass, test a separate PLG entitlement of one free activation per verified organization per calendar month. This is not part of the current controlled evaluation or MVP release gate.

Research and architecture reference: [pricing, packaging, and commercial-system recommendation](./PRICING-AND-PACKAGING-RESEARCH.md).

## Product, commercial, and testing readiness

| Workstream | Start gate | Current readiness | Next action |
| --- | --- | --- | --- |
| User accounts | Hosted organization signup, sign-in, onboarding, membership, and recovery happy path | Production callback, session persistence, revoked-member sign-out, branded SMTP, and fresh synthetic organization onboarding passed | Close expiry, wrong-person, revoke, recovery replay, and inbox-placement hardening |
| End-to-end persona UAT | One hosted transaction reaches a matching three-party receipt and lifecycle change | Engineering-assisted full story and isolated reviewer-role boundary passed | Owner independently repeats institution → principal → representative → reviewer → receipt → revocation on the public domain in four profiles or devices |
| Demo | Stable public entry, resettable approved test data, and a seven-minute script | Dedicated isolated app/database and namespaced fresh-run provisioning are live at the stable Vercel fallback; authenticated three-size verification passed | Add the Cloudflare record and rehearse without developer intervention |
| ICP and positioning | Narrow problem, workflow, buyer, and honest product boundary are documented | Ready to begin now | Interview regional-bank and credit-union operations/compliance leaders; test problem urgency and buying process before scaling outbound |
| Sales strategy | ICP evidence plus a repeatable demo and pilot offer | Discovery and design-partner outreach can begin; broad selling is premature | Build qualification, discovery, objection, security, pilot-success, and follow-up materials from verified claims only |
| Stripe test payments | Every P0/P1 gate is marked passed with linked evidence and commercial policy C01 is approved | Requirements and architecture ready; all implementation remains queued | Begin C02, then follow the strict commercial backlog through Stripe test-mode work at C06 |
| Live payments | Stripe duplicate, signature, ordering, failure, cancellation, refund, and reconciliation tests pass | Blocked | Owner explicitly approves live Stripe products, prices, tax, terms, and customer-support operations |
| Controlled pilot | Legal, security, retention, support, monitoring, deliverability, and institution acceptance are approved | Not ready | Complete the pilot-readiness control package after MVP UAT and Stripe test entitlement |

## Public-site quality baseline

- Responsive review covers desktop, 390px, 360px, and the WCAG 320px reflow boundary.
- Public navigation, account entry, legal routes, sitemap, robots rules, distinct page metadata, error recovery, and baseline security headers ship together.
- Public copy describes user outcomes and boundaries; database names, command names, raw identifiers, internal event names, and implementation terminology do not appear in the linked marketing or account-entry journey.
- The preferred internal target size is 44px, exceeding the WCAG 2.2 minimum, with visible focus and no horizontal page scrolling.
- Real-user Core Web Vitals, accessibility automation, CSP rollout, and production error monitoring are required before a controlled pilot; a clean build or visual inspection alone is not evidence for those controls.
- The SQLite regression harness is a development/test surface only. Production requests to its pages, server actions, and API stop before repository access and return no record-existence signal.

## Schedule and decision gates

| Window | Target | Decision gate |
| --- | --- | --- |
| Days 1 to 3 | Hosted draft, queue, organization isolation, and event evidence | Continue only when Slice 1 passes all evidence |
| Days 4 to 6 | Activation, five-free entitlement, and participant invitation foundation. Command, data, test, and UI evidence passed; browser closeout active. | Continue only when count and invitation are atomic |
| Days 7 to 10 | Principal, representative, reviewer, receipt, and lifecycle parity | Continue only when another persona completes each received action |
| Days 11 to 12 | Signed events, replay, monitoring, and failure recovery | Continue only when state, receipt, and delivery match |
| Days 13 to 15 | Independent browser UAT and P1 evidence closeout | Commercial backlog starts only when all P0/P1 gates pass with no critical or high defect |

The public-domain cutover, responsive smoke test, rollback capture, production Auth callback migration, branded SMTP, revoked-account recovery, fresh synthetic organization setup, engineering-assisted hosted transaction through revocation, and deployed reviewer least-privilege proof are complete. The remaining path to the release candidate is focused: perform the owner-timed four-profile public-domain UAT, verify inbox recovery and hosted expiration, and close the remaining P1 trust, integration, load, deliverability, legal, security, support, monitoring, retention, and written institution-acceptance requirements. Commercial schema and provider implementation do not run in parallel with that closeout; they begin at C01 only after every P0/P1 gate passes.

External identity, document intelligence, bank integration, legal review, penetration testing, and formal compliance readiness are pilot and enterprise dependencies. They do not justify weakening the hosted MVP evidence chain.

## Commercial release boundary

The MVP may be demonstrated to prospective institutions when the hosted end-to-end story passes with approved test data. It may enter a controlled pilot only after legal terms, information handling, private storage, provider boundaries, support, monitoring, and the institution's written acceptance requirements are approved.

The product may not claim universal legal validity, automatic institution acceptance, bank integration, enterprise certification, or production readiness without evidence for that exact claim.
