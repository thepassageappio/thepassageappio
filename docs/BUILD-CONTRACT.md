# Passage Authority controlled MVP build contract

> **Document status, August 27, 2026:** This remains the regression contract for the fictional controlled MVP. `PRODUCT-SOURCE-OF-TRUTH.md` controls current commercial pricing, accounts, secure invitations, real-data UAT, enterprise readiness, and the implementation roadmap.

**Approved direction:** greenfield authority-acceptance workflow and API  
**Environment:** isolated local sandbox  
**Production impact:** none

## Successful controlled transaction

An institution starts from the New York financial power of attorney template, identifies the principal and representative, chooses the account boundary and permitted actions, and creates a governed request under a versioned policy. Eleanor Carter confirms the request. Maya Carter accepts the responsibility, provides the illustrative power of attorney, completes an agent certification, completes the institution's identity and address requirements, reviews the exact disclosure, and submits. The institution requests requirement-specific information, Maya resolves it, and the institution records a limited acceptance. Eleanor revokes the authority. Every mutation creates a durable receipt event and an observable signed demonstration webhook delivery.

## Product surfaces

- **Hosted participant workspace:** principal grant/revocation, representative acceptance/decline/withdrawal, requirements, disclosure review, remediation, decision, receipt.
- **Institution setup:** choose the financial power of attorney template, identify the participants, set the account boundary and duration, and create a durable request.
- **Institution workspace:** multi-record queue, role-owned status, policy requirements, evidence provenance, RFI, acceptance/limits/rejection, and receipt.
- **Decision receipt:** participant-readable outcome, exact accepted actions, limits, policy version, dates, lifecycle state, and append-only history.
- **Developer workspace:** deterministic scenario creation, API quickstart, signed event payloads, attempts, failures, and replay.
- **REST API:** record list/create, role-authorized record commands/projections, receipts, webhook log, and replay.
- **Commercial website:** product, templates, pricing, security, pilot, and integration pages that state the controlled boundary truthfully.

## Canonical objects

The record keeps identity, authority source, institution policy, runtime requirement, evidence artifact, consent snapshot, disclosure receipt, institutional decision, lifecycle event, and webhook delivery separate.

No object or UI label may collapse identity proof, legal/authority evidence, policy satisfaction, and institutional acceptance into one generic “verified” state.

## Canonical status model

| Status | Owner | Allowed next transitions |
|---|---|---|
| `awaiting_principal` | Principal | confirm grant |
| `awaiting_representative` | Representative | accept or decline; principal may revoke |
| `evidence_required` | Representative | complete owned requirements or withdraw; principal may revoke |
| `ready_to_submit` | Representative | review disclosure and submit or withdraw; principal may revoke |
| `under_review` | Reviewer | request information, accept, accept with limits, reject; representative may withdraw; principal may revoke |
| `information_requested` | Representative | resolve, withdraw; principal may revoke |
| `accepted` | none | principal may revoke; representative may withdraw |
| `accepted_with_limits` | none | principal may revoke; representative may withdraw |
| `rejected` | none | receipt remains available |
| `declined` | none | receipt remains available |
| `withdrawn` | none | receipt remains available |
| `revoked` | none | receipt remains available and webhook is emitted |
| `expired` | none | receipt remains available |

## Policy and requirement contract

The demonstration institution owns policy `policy_hvcu_financial_poa_v1_3`. Its runtime requirements are:

1. principal identity-session result;
2. representative acceptance;
3. financial power of attorney document result;
4. agent certification;
5. representative identity result;
6. current-address result.

Every requirement exposes its owner, reason, accepted methods, current status, completion actor and time, evidence references, and any document findings with page citations. The illustrative identity-mismatch scenario must fail as a named requirement error and must not advance durable state.

## Command and persistence contract

Every command requires actor identity, server-resolved role, expected record version, and idempotency key. Every successful command runs in one SQLite transaction:

1. load and authorize current record;
2. reject stale version or invalid transition;
3. return a prior result for an identical idempotency replay;
4. update the canonical record;
5. append one immutable event;
6. create one signed webhook delivery;
7. persist the command result;
8. commit all or none.

Browser state is presentation state only. The local signed actor cookie is a demonstration isolation mechanism, not production authentication.

## Webhook contract

Every lifecycle event produces a versioned payload with event ID/type, record ID/version/status, next owner, policy version, and relying party. The sandbox stores its signature, endpoint, attempts, response code, last attempt, next retry, and replay state.

The `webhook_retry` scenario deterministically fails the submission webhook twice. Manual replay must deliver it exactly once more and refuse replay after success.

## Release evidence

The controlled MVP cannot be called complete until these pass:

- domain transition, consent, disclosure, decline, withdrawal, and authorization tests;
- requirement ownership and identity-mismatch rollback;
- idempotency, stale-version, SQLite atomicity, schema replacement, and restart persistence;
- multi-record queue and deterministic scenario creation;
- signed webhook creation, retry, replay, and replay refusal;
- REST request/response and role-projection contract tests;
- TypeScript, ESLint, React review, and optimized build;
- principal → representative → reviewer → representative → reviewer → revocation browser transaction;
- institution template setup creates the same canonical record and opening receipt event;
- reviewer RFI visible and actionable in the representative context;
- decision and revocation visible in all role-appropriate views;
- the dedicated receipt matches the canonical decision, accepted actions, limits, policy version, and revocation state;
- API/webhook delivery matches the durable event and receipt sequence;
- reload and independent browser-context proof;
- 1440px, 390px, and 360px checks with no console errors, failed requests, overflow, inaccessible focus, or sub-44px enabled controls.
- commercial navigation has no dead routes and no unsupported production, legal, security, or traction claims.

## Stop conditions

Stop expansion and return to this contract when:

- the UI and persisted state disagree;
- a sender sees success but the receiver or webhook does not;
- policy logic is hard-coded in a component instead of stored in the record/policy;
- a role can perform another role's command;
- an error advances state;
- a receipt can be rewritten instead of appended;
- the product needs a legal or institutional assumption not supplied by an external pilot partner.
