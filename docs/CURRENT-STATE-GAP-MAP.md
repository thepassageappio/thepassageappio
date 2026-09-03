# Passage Authority current-state gap map

**Date:** September 2, 2026
**Baseline:** Greenfield controlled MVP in this repository
**Target:** UAT-ready product defined in `PRODUCT-SOURCE-OF-TRUTH.md`

## 1. Executive status

The current application combines a strong fictional transaction harness with a deployed hosted account, organization, request, entitlement, activation, participant-delivery, participant-decision, secure-resume, evidence, institution-decision, receipt, and lifecycle implementation. The hosted product has now carried one synthetic request from institution authentication through browser uploads, separate participant roles, human evidence review, a limited institution decision, a shared fingerprinted receipt, and revocation. Both public Passage domains now serve Authority with a preserved legacy rollback deployment. The remaining MVP release work is independent replay/negative-path closeout, branded Auth callback migration, delivery hardening, and operating evidence; commercial payment and enterprise controls remain later gates.

The reusable core is:

- one complete financial POA transaction state machine;
- institution request setup;
- role-specific principal, representative, and reviewer actions;
- evidence and source-finding presentation;
- information request and response;
- scoped decision and shared receipt;
- revocation;
- local durable events, webhooks, retries, and replay;
- a commercial website shell;
- desktop and mobile styling;
- domain, persistence, and browser verification evidence.

Gate 1 now provides in the isolated hosted Authority Supabase project:

- passwordless organization-user accounts;
- isolated organizations and least-privilege memberships;
- versioned evaluation terms and authorized-use acceptance;
- one approved organization template selection;
- recipient-bound, hashed, expiring team invitations;
- organization access administration and append-only access activity;
- database replay evidence and a real owner-to-staff browser acceptance journey.

The remaining commercial foundation is:

- reliable inbox placement plus the remaining expiry, wrong-person, and revocation recovery proofs;
- negative direct-document-access evidence plus retention and recovery controls;
- real provider adapters;
- Stripe test-mode entitlement activation;
- billing and full organization audit surfaces;
- production observability and enterprise controls.

## 2. Surface-by-surface status

| Target screen | Current surface | Current status | Main gap | Delivery gate |
| --- | --- | --- | --- | --- |
| W-01 Homepage | `/` | Public and responsive | Owner message approval and real-user performance data | Gate 7 |
| W-02 How it works | Homepage and integrations content | Partial | Dedicated cross-person transaction explanation | Gate 7 |
| W-03 Templates | `/templates` | Demonstration ready | Active template detail and honest availability states | Gate 7 |
| W-04 Pricing | `/pricing` | Current approved commercial copy | Behavior must prove $0 for 10 days and 5 activated requests, a $5,000 founding pilot, and a custom post-pilot institution relationship | Gate 7 after Gate 2 and Gate 6 behavior passes |
| W-05 Security | `/security` | Controlled-boundary ready with user-facing control copy | Real control status and trust package as controls are implemented | Gate 7 |
| W-06 Developers | `/developer`, `/integrations` | Demonstration ready | Account-bound keys and production-safe environment separation | Gate 5 and Gate 7 |
| W-07 Demo | Existing sandbox routes | Strong | One stable, resettable seven-minute entry route | Gate 7 |
| W-08 Pilot | `/pilot` | Commercial hypothesis | Approved 60-to-90-day, $5,000 founding pilot credited toward year one and qualified workflow | Gate 6 and Gate 7 |
| O-01 Start | `/start` | Hosted vertical slice passed | Production email and MFA hardening remain pilot controls | Gate 1 passed |
| O-02 Auth confirm | `/auth/confirm` | Hosted vertical slice passed | Session recovery and MFA hardening remain pilot controls | Gate 1 passed |
| O-03 Organization | `/onboarding/organization` | Hosted vertical slice passed | Organization verification operations remain pilot controls | Gate 1 passed |
| O-04 Terms | `/onboarding/terms` and versioned legal pages | Local vertical slice passed | Counsel-approved production documents | Gate 7 and pilot legal readiness |
| O-05 Template onboarding | `/onboarding/template` | Hosted read model passed | Hosted request creation consumes the immutable selection | Gate 2 passed |
| O-06 Complete | `/onboarding/complete` | Local vertical slice passed | First-draft handoff | Gate 2 |
| I-01 Institution home | `/app` plus fictional `/institution` harness | Hosted queue, evaluation usage, participant delivery, and receiving-person status passed | Next owner, assignee, and filters | Gate 4 and Gate 5 |
| I-02 New request | `/app/requests/new` plus fictional `/institution/new` | Hosted draft creation passed | Editing and duplicate warning | Gate 3 and pilot hardening |
| I-03 Preview | `/app/requests/[id]` | Hosted preview, activation, principal-first sequencing, and blocked-limit interface passed | None for Gate 2 | Gate 2 passed |
| I-04 Reviewer record | `/workspace/[id]` reviewer mode | Strong fictional skeleton | Real authorization, private evidence, assignment, organization scope | Gate 4 and Gate 5 |
| I-05 Decision | Reviewer action panel | Strong fictional skeleton | Real policy rules, account identity, notifications | Gate 5 |
| I-06 Institution receipt | `/workspace/[id]/receipt` | Strong fictional skeleton | Real tenancy, export, access logging | Gate 5 |
| I-07 Team | `/app/team` | Hosted invitation and acceptance passed | Final role-change, revocation browser replay, and broader audit export | Gate 1 closeout and Gate 5 |
| I-08 Policies | `/app/policies` and `/templates` | Hosted selection is consumed by request creation | Policy authoring waits for pilot | Pilot |
| I-09 Usage and billing | `/app` evaluation summary | Hosted 10-day and five-activation entitlement passed | Stripe state, invoices, and upgrade | Gate 6 |
| I-10 Integrations | `/developer` | Fictional demo only | Organization endpoints, secret rotation, live delivery controls | Gate 5 |
| I-11 Audit | Receipt and event timeline | Partial | Organization-wide access and administrative audit export | Gate 5 and pilot hardening |
| H-01 Invitation intro | `/r/[token]` | Real hosted delivery and browser path passed | Inbox placement, help, expiry, and revoke recovery | Gate 3 hardening and Gate 7 |
| H-02 Invitation confirm | `/r/[token]` exchange | Hosted single-use exchange, safe reuse, resend, and reissued-session recovery passed | Complete expiry, wrong-person, and revoke matrix | Gate 3 hardening |
| H-03 Overview | `/request/[id]/overview` | Hosted role-bound session and status projection passed | Resume and lifecycle states | Gate 3 and Gate 5 |
| H-04 Grant | `/request/[id]/grant` | Hosted explicit confirm journey passed | Decline browser replay and pilot identity assurance | Gate 3 and Gate 4 |
| H-05 Responsibility | `/request/[id]/responsibility` | Hosted explicit acceptance journey passed | Decline browser replay and delivery recovery | Gate 3 |
| H-06 Requirements | Hosted participant requirements page | Three dynamic requirements, two browser uploads, and certification passed | External identity-provider completion is post-MVP | Gate 4 core passed |
| H-07 Evidence task | Private storage and reviewer foundation | Browser upload, private path, metadata, institution review, and cross-persona projection passed | Negative direct-access replay remains closeout | Gate 4 core passed |
| H-08 Review share | Existing minimum-disclosure panel | Strong fictional skeleton | Real artifact references and disclosure enforcement | Gate 4 |
| H-09 Respond | Existing RFI response | Strong fictional skeleton | Real email and secure resume | Gate 3 and Gate 5 |
| H-10 Status | Existing status card | Strong fictional skeleton | Real session, delivery state, and reminders | Gate 3 and Gate 5 |
| H-11 Receipt | Hosted role-bound receipt | Principal, representative, and institution matched through revocation | Export and scheduled expiration remain | Gate 5 core passed |
| D-01 Sandbox | `/developer` scenarios | Strong local regression harness | Public CTAs route to hosted Authority; keep the SQLite harness local-only | Gate 5 |
| D-02 Quickstart | Developer page and REST routes | Strong fictional skeleton | Account-bound test keys and hosted-link creation | Gate 5 |
| D-03 Webhooks | Delivery log and replay | Strong local skeleton | Durable Postgres outbox, real signing secret, endpoint verification | Gate 5 |
| D-04 API documentation | Developer page snippets | Partial | Complete versioned reference and error catalog | Gate 5 and Gate 7 |

## 3. Backend status

| Capability | Current | Target | Gate |
| --- | --- | --- | --- |
| State machine | Implemented and tested locally | Preserve as canonical transaction logic | Continuous |
| Optimistic concurrency | Enforced for hosted draft, activation, principal decision, and representative decision | Extend through evidence, review, receipt, and lifecycle | Gate 4 and Gate 5 |
| Idempotency | Implemented for organization, access, draft, activation, invitation exchange, and both participant decisions | Extend to email dispatch, Stripe, and provider callbacks | Gate 3 through Gate 6 |
| Organizations | Real isolated hosted organizations plus fictional transaction catalog | Add verification and enterprise lifecycle controls | Gate 1 passed and pilot hardening |
| Memberships | Real hosted least-privilege memberships and append-only access activity | Complete role-change, revocation replay, and enterprise lifecycle controls | Gate 1 closeout and pilot hardening |
| Entitlements | Hosted free-evaluation period, status, five-activation limit, and append-only usage passed | Add pilot and annual states through verified Stripe events | Gate 6 |
| Draft activation | Hosted atomic activation, optimistic versioning, usage count, invitations, event, audit, outbox, replay, blocked sixth, and owner-browser closeout passed | Preserve as regression contract | Gate 2 passed |
| Team invitations | Recipient-bound, hashed, expiring, single-use local implementation | Hosted transactional delivery and security replay | Gate 1 hosted exit |
| Participant invitations | Hashed single-use exchange, role-bound session, principal-first release, real delivery, immutable decisions, institution visibility, resend, and reissued-session recovery passed | Expiry, wrong-person, revoke, and remaining recovery matrix | Gate 3 hardening |
| Email | Real principal and representative Resend delivery plus signed delivery receipts passed | Inbox placement, suppression and failure operations, templates, complaint handling, and provider monitoring | Gate 7 and pilot hardening |
| Evidence artifacts | Deterministic JSON | Private storage references and provider results | Gate 4 |
| Findings | Deterministic page citations | Extracted, sourced, corrected, and human-reviewed findings | Gate 4 |
| Webhooks | Real signed Resend delivery callbacks are durable and idempotent; authority lifecycle deliveries remain local | Durable outbound authority outbox, signing, retry, replay, and endpoint verification | Gate 5 |
| Expiration | State exists | Scheduled durable lifecycle transition | Gate 5 |
| Stripe | Live products configured externally, no app integration | Test-mode payment to verified webhook to entitlement | Gate 6 |
| Audit | Record history plus Gate 1 organization and membership access events | Add request, billing, support, export, and retention controls | Gate 5 and pilot hardening |

## 4. Data and environment decision

The legacy Passage production Supabase project contains the funeral, family, vendor, workflow, billing, and CRM schema. It is not an Authority development target.

Authority requires:

1. a new Supabase project or an explicitly approved isolated Authority environment;
2. a new migration history whose first migration creates only Authority objects;
3. no copy of legacy users, cases, people, organizations, subscriptions, or test fixtures;
4. fictional seed data only in sandbox;
5. separately approved controlled real data in UAT;
6. a documented shutdown and retention process for legacy Passage that remains separate from this build.

The two inactive Supabase projects discovered during read-only inventory may be evaluated for reuse only after confirming their billing, environment status, secrets, migration state, and absence of retained legacy data. Reactivation or destructive reset is not authorized by this document.

## 5. Definition of progress

Progress is measured by complete vertical slices, not the number of pages or integrations touched.

| Milestone | Observable progress |
| --- | --- |
| Gate 0 approved | One product, pricing, persona, screen, state, and roadmap contract |
| Gate 1 local vertical slice passed | A second fictional organization member receives a locally delivered secure invitation, accepts it in the browser, and gains only intended access; database replay proves revocation and tenant denial |
| Gate 1 release exit | Hosted account, organization, terms, template, invitation, role change, revocation, audit, and database denial passed; only the revoked-user browser message remains closeout evidence |
| Gate 2 Slice 1 passed | An authenticated owner creates one organization-owned draft; durable record, event, audit entry, idempotency receipt, fresh queue load, authorized staff read, and non-member denial agree |
| Gate 2 passed | Browser, command, and database evidence prove five real requests activate once, request six cannot activate, and existing work remains available |
| Gate 3 hosted happy path passed | Principal and representative begin from separate real delivered messages, complete separate hosted decisions, and advance one canonical record to evidence requirements; institution state and signed provider receipts agree |
| Gate 3 hardening passed | Resend, reuse, reissue, expiry, revoke, wrong-person, and recovery tests pass with no stale browser copy or duplicate effect. Stale notice rendering is already corrected. |
| Gate 4 core passed | Two private synthetic documents create authorized, sourced, human-reviewed evidence visible to the submitting representative and institution |
| Gate 5 core passed | Institution decision, principal receipt, representative receipt, fingerprint, and revocation match across isolated browser profiles |
| Gate 6 passed | Stripe test payment changes the right organization's entitlement once |
| Gate 7 passed | Owner runs the complete deployed demo and UAT suite without developer intervention |

## 6. Next controlled build action

Close the hosted release candidate without touching legacy Passage data: finish the active fresh synthetic cross-persona request, independently replay its hosted event chain and negative direct-access cases, and complete the owner-run public-domain UAT. The public Auth callback allowlist, production Site URL, `AUTHORITY_APP_URL`, branded SMTP, revoked-account recovery, and fresh organization onboarding are verified. New authority types, broad AI features, real customer data, and live Stripe remain blocked.

The controlled fictional MVP remains available throughout as the regression and demonstration harness.
