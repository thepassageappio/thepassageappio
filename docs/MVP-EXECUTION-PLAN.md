# Passage Authority MVP execution plan

**Launched:** August 28, 2026
**Current score:** 8.9 of 10 to a working MVP
**Target score:** 9 of 10 with a hosted, independently replayable product on the approved public domain
**Active work limit:** One complete vertical slice

## Outcome

An authenticated institution can create and activate a New York financial power of attorney request. The principal, representative, and institution reviewer can complete their separate steps. Every action produces durable organization-isolated state, an append-only event, a matching receipt, and an observable notification or integration outcome.

The product is not an MVP until the hosted product completes this story. The local sandbox remains a regression and sales demonstration environment, but it is not release evidence for hosted product behavior.

## Critical path

| Order | Slice | Exit result | Status |
| --- | --- | --- | --- |
| 1 | Hosted request foundation | Authorized institution user creates a draft in the correct organization queue. A second authorized user can read it through organization RLS. A non-member and revoked member cannot. | Core evidence passed; revoked-user browser message is final hardening evidence |
| 2 | Trial and activation | First invitation starts the 10-day trial and consumes one of five transactions exactly once. Request six is blocked without hiding existing work. | Passed end to end |
| 3 | Participant access | Principal and representative receive separate expiring links and complete only their permitted actions. | Hosted real-email happy path passed; recovery hardening remains |
| 4 | Evidence boundary | Representative completes hosted requirements using private test evidence, separated provider results, source-linked findings, and human confirmation. | Core passed with two browser uploads, certification, and institution review; negative direct-access replay remains |
| 5 | Review and lifecycle | Reviewer requests information, decides, and observes withdrawal, revocation, and expiration. | Hosted decision and revocation passed; RFI/withdrawal/expiration negative-path closeout remains |
| 6 | Receipt and events | Shared receipt, durable outbox, signed webhook, retry, and replay agree with canonical state. | Hosted three-party receipt and revocation fingerprint passed; independent hosted event replay remains |
| 7 | Stripe test entitlement | Verified Stripe test events activate the correct pilot or annual entitlement once. Browser redirects never grant access. | Blocked by slices 1 through 6 |
| 8 | Independent UAT | Owner completes signup through revocation in the browser without developer intervention and with no critical or high defects. | Engineering-assisted synthetic UAT passed; owner-run public-domain replay remains |

## Slice 1 acceptance contract

### User story

An authenticated organization owner, administrator, staff member, or reviewer starts a request from the selected New York financial power of attorney template, saves it as a draft, and sees it in the organization queue.

### Durable results

- One organization-owned authority record with status `draft`.
- One immutable template key and version reference.
- One exact participant and scope snapshot.
- One append-only `authority.draft_created` event.
- One idempotency receipt for the authenticated actor and command.
- No invitation, usage debit, trial clock, or email.

### Authorization

- Owner, administrator, staff, and reviewer may create a draft.
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
- Active hardening: expiry, invitation revoke, wrong-person, post-revocation message, and safe recovery browser proofs.
- Known blocker: both real messages landed in Gmail Spam. Provider acceptance and mail-server delivery are not sufficient for commercial deliverability.

### Slice 4 hosted evidence result

- Passed: two separate synthetic PDF sources uploaded through the hosted representative browser flow and remained private storage references.
- Passed: the representative and institution saw matching source and certification states.
- Passed: institution review advanced the canonical record only after all three requirements were complete.
- Passed: a fresh unauthenticated participant browser exposed and verified the corrected anonymous command boundary.
- Remaining: negative direct-source access and independent database replay closeout.

### Slices 5 and 6: hosted transaction parity

- Passed: hosted Postgres-backed commands preserved optimistic concurrency, immutable events, the policy snapshot, decision limits, and revocation through the tested transaction.
- Passed: institution, principal, and representative observed the same current record and matching receipt from separate browser profiles.
- Passed: revocation advanced the canonical request version while preserving the saved decision fingerprint.
- Remaining: hosted negative-path closeout for request-for-information, withdrawal, expiration, and an independent event replay from the hosted adapter.
- Boundary: the SQLite adapter remains a local regression harness and is not reachable from public website calls to action.

### Slice 7: commercial entitlement

- Archive superseded Passage Stripe products without touching historical records.
- Create clean Passage Authority pilot and annual products in Stripe test mode first.
- Store customer and subscription mapping by organization.
- Verify signature, duplicate delivery, out-of-order event, failed payment, cancellation, and reconciliation behavior.
- Promote to live mode only after the complete test transaction and entitlement replay pass.

## Product, commercial, and testing readiness

| Workstream | Start gate | Current readiness | Next action |
| --- | --- | --- | --- |
| User accounts | Hosted organization signup, sign-in, onboarding, membership, and recovery happy path | Ready for final hardening now | Move Auth callbacks to the public domain; close expiry, wrong-person, revoke, and recovery tests |
| End-to-end persona UAT | One hosted transaction reaches a matching three-party receipt and lifecycle change | Engineering-assisted flow passed | Owner independently repeats institution → principal → representative → reviewer → receipt → revocation on the public domain |
| Demo | Stable public entry, resettable approved test data, and a seven-minute script | Product is demonstrable with engineering guidance | Create one resettable hosted demo record and rehearse without developer intervention |
| ICP and positioning | Narrow problem, workflow, buyer, and honest product boundary are documented | Ready to begin now | Interview regional-bank and credit-union operations/compliance leaders; test problem urgency and buying process before scaling outbound |
| Sales strategy | ICP evidence plus a repeatable demo and pilot offer | Discovery and design-partner outreach can begin; broad selling is premature | Build qualification, discovery, objection, security, pilot-success, and follow-up materials from verified claims only |
| Stripe test payments | Public Auth callback and owner-run UAT pass; entitlement mapping is approved | Not ready to connect yet | Build test-mode Checkout and verified webhook-to-organization entitlement after the release-candidate closeout |
| Live payments | Stripe duplicate, signature, ordering, failure, cancellation, refund, and reconciliation tests pass | Blocked | Owner explicitly approves live Stripe products, prices, tax, terms, and customer-support operations |
| Controlled pilot | Legal, security, retention, support, monitoring, deliverability, and institution acceptance are approved | Not ready | Complete the pilot-readiness control package after MVP UAT and Stripe test entitlement |

## Public-site quality baseline

- Responsive review covers desktop, 390px, 360px, and the WCAG 320px reflow boundary.
- Public navigation, account entry, legal routes, sitemap, robots rules, distinct page metadata, error recovery, and baseline security headers ship together.
- Public copy describes user outcomes and boundaries; database names, command names, raw identifiers, internal event names, and implementation terminology do not appear in the linked marketing or account-entry journey.
- The preferred internal target size is 44px, exceeding the WCAG 2.2 minimum, with visible focus and no horizontal page scrolling.
- Real-user Core Web Vitals, accessibility automation, CSP rollout, and production error monitoring are required before a controlled pilot; a clean build or visual inspection alone is not evidence for those controls.

## Schedule and decision gates

| Window | Target | Decision gate |
| --- | --- | --- |
| Days 1 to 3 | Hosted draft, queue, organization isolation, and event evidence | Continue only when Slice 1 passes all evidence |
| Days 4 to 6 | Activation, five-free entitlement, and participant invitation foundation. Command, data, test, and UI evidence passed; browser closeout active. | Continue only when count and invitation are atomic |
| Days 7 to 10 | Principal, representative, reviewer, receipt, and lifecycle parity | Continue only when another persona completes each received action |
| Days 11 to 12 | Signed events, replay, monitoring, and failure recovery | Continue only when state, receipt, and delivery match |
| Days 13 to 15 | Stripe test entitlement and independent browser UAT | MVP release candidate only with no critical or high defect |

The public-domain cutover, responsive smoke test, and rollback capture are complete. The remaining path to the MVP release candidate is one focused closeout: independent replay and negative-path evidence, branded Auth callback migration, and owner-run public-domain UAT. Pilot readiness still follows with deliverability, legal, security, support, monitoring, retention, payment, and written institution acceptance requirements.

External identity, document intelligence, bank integration, legal review, penetration testing, and formal compliance readiness are pilot and enterprise dependencies. They do not justify weakening the hosted MVP evidence chain.

## Commercial release boundary

The MVP may be demonstrated to prospective institutions when the hosted end-to-end story passes with approved test data. It may enter a controlled pilot only after legal terms, information handling, private storage, provider boundaries, support, monitoring, and the institution's written acceptance requirements are approved.

The product may not claim universal legal validity, automatic institution acceptance, bank integration, enterprise certification, or production readiness without evidence for that exact claim.
