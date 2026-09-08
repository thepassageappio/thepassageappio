# Institution authority-scope catalog

**Status:** required product capability; not implemented in the current hosted release.

Evidence requirements, review rules, legal locks, and publication controls are specified in [INSTITUTION-POLICY-MANAGEMENT-REQUIREMENTS-2026-09-08.md](./INSTITUTION-POLICY-MANAGEMENT-REQUIREMENTS-2026-09-08.md).

The current two-action New York template is a deliberately narrow synthetic-evaluation fixture. It is not the intended product model for an institution launch. Passage must let each institution begin with a controlled, versioned action catalog for each authority type and configure that catalog during onboarding.

## Product boundary

Passage records requested powers, the institution's decision, and the resulting operational scope. Passage does not interpret a power of attorney, grant digital-banking access, execute a transaction, or move money. The receiving institution retains legal, identity, fraud, policy, entitlement, and transaction responsibility.

The product must keep four layers distinct:

1. **Requested legal powers:** what the principal and representative ask the institution to recognize.
2. **Institution-approved actions:** the subset the institution accepts, limits, or rejects after review.
3. **Channel entitlements:** where an approved representative may act, such as branch, phone, online banking, mobile application, or an institution API.
4. **Operational controls:** account boundaries, amount and frequency limits, recipient restrictions, dual approval, expiration, escalation, and revocation behavior.

Online and mobile access must belong to the representative's separately identified user, with the institution's authentication, MFA, device, and monitoring controls. Passage must never instruct a representative to use or share the principal's credentials.

## Installed starter catalogs

Each supported authority type receives its own Passage-maintained starter catalog. Initial authority types are financial power of attorney, trustee authority, guardianship or conservatorship, and executor or estate authority. A state package can add requirements or restrict availability without silently changing the semantic meaning of an action.

The financial-power-of-attorney starter catalog should cover these configurable groups:

| Group | Example standard actions |
| --- | --- |
| Information | View balances and transactions; receive statements, tax documents, notices, and correspondence |
| Service | Discuss account-service issues; change an approved mailing address; order records |
| Deposits and cash | Make deposits; endorse items where permitted; withdraw cash |
| Payments and transfers | Pay bills; transfer between owned accounts; initiate ACH; initiate domestic or international wires |
| Checks and cards | Write or stop checks; request or manage a representative card, where the institution supports it |
| Account administration | Open, close, rename, or retitle accounts when the instrument, law, product, and institution policy permit |
| Credit | Borrow, renew, or manage credit only when expressly supported and separately reviewed |
| Investments | Trade or manage investments only for supported account types and separately reviewed powers |
| Digital channels | View-only online access; transactional online access; mobile-app access; phone-banking access |

The catalog is a review and decision vocabulary. Listing an action never means that a document authorizes it or that an institution will enable it.

## Institution onboarding and administration

During onboarding, an owner or administrator must be able to:

- install a versioned starter catalog for each enabled authority type;
- activate or deactivate standard actions;
- customize institution-facing and participant-facing labels and guidance without changing the underlying semantic key;
- add institution-defined custom actions with a namespace owned by that institution;
- group actions by authority type, account or product type, channel, and risk tier;
- define default limits, prohibited combinations, required evidence, approval roles, and escalation rules;
- preview exactly what staff, principal, representative, and reviewer will see;
- publish a new catalog version with an effective time and change reason.

Changing the meaning of a standard action is not a label edit. It requires either a new Passage semantic version or a separately named institution-defined custom action.

## Request and receipt invariants

Creating a draft must snapshot the selected template version, catalog version, action semantic keys, rendered labels and descriptions, channel requests, controls, and account boundary. If a newer policy becomes effective before activation, activation must stop and show the exact change. An authorized coordinator may explicitly rebase the unactivated draft into a new revision, reselect or confirm affected scope, and append a version-change event; the prior draft snapshot remains historical evidence. Activation permanently locks the governing version. Later catalog edits must not rewrite an activated request, event, decision, receipt, or replay.

The institution decision must record an outcome for every requested action and channel: accepted, accepted with limits, rejected, or more information required. Accepted actions must remain a subset of requested actions. Every mutation requires authorization, expected-version checking, idempotency, tenant isolation, and an append-only event.

The final receipt and integration event must state:

- requested and accepted actions;
- requested and approved channels;
- account or relationship boundaries;
- limits, conditions, dates, and decision owner;
- catalog and policy versions;
- current lifecycle status, including revocation or expiration;
- whether a downstream entitlement was merely requested, acknowledged as applied, or not integrated.

## Acceptance evidence

This capability is not complete until all of the following pass:

1. An owner configures a starter catalog, deactivates one standard action, adds one custom action, and publishes a new version.
2. An operations user creates a request from the published version; inactive actions are absent and the custom action is present.
3. A reviewer accepts one action, limits one, and rejects one; principal and representative receipts match the decision.
4. A stale unactivated draft cannot activate silently. Its exact policy diff is shown; an explicit rebase creates a new draft revision and preserves the earlier snapshot.
5. A later catalog edit leaves an already activated request, events, receipt, and replay unchanged.
6. Unauthorized roles, stale versions, cross-tenant identifiers, duplicate commands, and invalid action/channel combinations fail closed.
7. Desktop, 390px, 360px, and keyboard QA pass for catalog administration, request selection, review, and receipts.
8. A signed integration event distinguishes the Passage decision from acknowledged downstream entitlement state.

## Release consequence

The existing two-action synthetic rehearsal remains valid evidence for the controlled evaluation flow. It does not prove this configurable launch catalog. Buyer-facing demonstrations and outbound materials must not imply that institutions can configure transaction or channel authority until the capability above is implemented and replayed end to end.
