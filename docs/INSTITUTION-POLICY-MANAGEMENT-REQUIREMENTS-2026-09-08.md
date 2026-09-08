# Institution policy management requirements

**Status:** required buyer-demo capability; the current hosted release uses a fixed synthetic policy and does not provide this management interface.

This document extends the authority-scope catalog contract. It governs how an institution defines requested actions, excluded actions, evidence requirements, review rules, channels, limits, exceptions, and effective versions without turning legal rules into arbitrary custom picklists.

## Current hosted truth

The current New York workflow contains fixed application and database values:

- two permitted action keys: `receive_duplicate_statements` and `discuss_service_issues`;
- a default excluded-action array covering money movement, account opening/closing, ownership, beneficiaries, investments, borrowing, and credential changes;
- three seeded requirements: power-of-attorney document, representative certification, and identity evidence;
- one selected organization template/version;
- a read-only `/app/policies` page.

The server and database enforce those fixed values, requirement completion, authorization, tenant isolation, AAL2 for privileged mutations, expected record version, and accepted-actions-as-a-subset-of-requested-actions. The institution can make the final request decision and ask for more information against an existing requirement. It cannot currently build or publish its own reusable action or evidence policy.

## Three sources of policy

The effective policy is compiled from three separately governed sources:

1. **Passage semantic catalog.** Stable action, channel, control, evidence, and outcome codes with controlled meanings. Passage can publish a new semantic version but cannot retroactively redefine an existing code.
2. **Jurisdiction package.** Counsel-reviewed state and federal rules, required notices, signatures, acknowledgments, acceptance clocks, express-authority rules, and prohibited or restricted combinations. Locked legal rules are not editable by an institution administrator.
3. **Institution policy.** The institution's supported products, risk controls, required evidence, reviewer roles, escalation paths, channel availability, limits, and operating language. Authorized owners/admins configure these within the legal and platform boundaries.

Passage must show the provenance of each effective rule: `platform`, `jurisdiction`, or `institution`.

## What an institution can manage

The onboarding policy builder begins with a versioned starter set. It uses structured controls rather than one unconstrained list.

| Control | Institution options | Enforcement |
| --- | --- | --- |
| Standard action | Activate/deactivate; edit display guidance; set supported account types | Semantic key and legal meaning remain locked |
| Custom action | Add label, description, category, account types, risk tier, and review guidance | Institution namespace; cannot impersonate a Passage standard or override a legal restriction |
| Excluded action | Mark unsupported, always excluded, or conditionally reviewable | Exclusion reason and source are saved in the request snapshot |
| Evidence requirement | Activate/deactivate where optional; choose approved evidence types/providers; add institution requirement | Locked statutory items cannot be disabled; custom items require purpose, collection method, retention class, and reviewer |
| Channel | Enable branch, phone, view-only online, transactional online, mobile, or API | Representative identity is separate from the principal; institution authentication and entitlement systems remain authoritative |
| Limits and controls | Amount/frequency limits, recipient restrictions, dual approval, duration, product boundaries | Typed values and compatibility rules; no free-text-only enforcement |
| Review rule | Assign role, escalation path, exception authority, and service target | Server command checks role and current policy version |

Free text can explain a rule but must not be the sole machine-enforced definition of an action, channel, limit, or required outcome.

## Policy-authoring workflow

1. An owner or administrator starts from the current published version.
2. Changes are saved to a private draft policy; reviewers and participants continue to use the published version.
3. Passage validates legal locks, semantic compatibility, required evidence, role separation, channel prerequisites, and missing retention/purpose fields.
4. A policy owner reviews a human-readable diff across every affected persona and signs off with a reason.
5. `Publish` creates a new immutable version and effective time. It never edits the prior version.
6. New drafts use the new version. An older unactivated draft is marked stale at activation and must be explicitly rebased or intentionally handled under an institution-configured, counsel-approved grandfather rule.
7. Rebase creates a new draft revision, shows added/removed/changed actions and requirements, requires reconfirmation, and preserves the prior snapshot and event.
8. Activation permanently locks the request's policy snapshot.

There is no silent inheritance of changed policy into a draft and no retroactive update to an activated request.

## Database and command enforcement

The durable model needs immutable version rows and request snapshots, not mutable labels joined at display time:

- `policy_versions`: organization, authority type, jurisdiction package, version, state, effective time, publisher, reason, and content hash;
- `policy_action_rules`: semantic/custom action key, state, account/product scope, risk tier, labels, guidance, and source;
- `policy_evidence_rules`: requirement key, required/optional/conditional state, accepted evidence types, provider rule, purpose, retention class, reviewer role, and source;
- `policy_channel_rules`: channel, access level, identity/MFA prerequisites, and downstream acknowledgment requirement;
- `policy_control_rules`: typed limits, combinations, approvals, duration, and exception authority;
- `authority_policy_snapshots`: complete canonical JSON plus content hash for each request revision and the final activated version.

Browser clients receive read-only policy data. Owner/admin mutations go through authenticated server commands that require AAL2, organization authorization, expected policy version, idempotency key, and an append-only audit event. Publishing and draft rebasing occur transactionally in PostgreSQL. RLS remains defense in depth; private helper functions revoke default execution and recheck the actor inside the function.

Request creation validates every selected action/channel against the effective published policy and writes the snapshot atomically with the request-created event. Activation compares the draft's policy hash to the current effective version. Institution decision commands enforce that accepted actions are a subset of the request, all mandatory evidence has an accepted result or authorized exception, limits satisfy typed rules, and the reviewer has the required role. Signed integration events distinguish `decision_recorded`, `entitlement_requested`, and `entitlement_acknowledged`.

## Legal boundary

The institution does not get an unrestricted switch that makes an action legally authorized. The authority document and applicable law define what the agent may do; the institution decides what it recognizes and operationally supports within those bounds.

State law can define broad subject powers and special express-authority categories, required execution language, agent acknowledgments, acceptance/rejection procedures, permissible requests for certification or counsel, and revocation effects. Those rules differ by jurisdiction and sometimes by document execution date. Passage therefore needs counsel-approved, effective-dated jurisdiction packages. Software may flag missing or conflicting inputs and route human review; it must not output an automatic legal-validity conclusion.

An institution may add stricter operational controls when lawful, but its configuration cannot erase a statutory acceptance obligation, invent authority absent from the instrument, or silently convert a legal rule into a business preference. Counsel must decide which items are locked, configurable, waivable with reason, or unavailable for every supported state package.

## Required UI

The policy workspace needs five views:

1. **Overview:** published version, draft version, effective date, states, authority types, policy owner, and unresolved blockers.
2. **Actions and exclusions:** grouped standard actions with activate/deactivate controls, governed custom-action creation, account/product scope, and plain-language participant preview.
3. **Evidence and review:** required/optional/conditional requirements, accepted evidence types, purpose, retention, reviewer role, exception authority, and legal locks.
4. **Channels and controls:** access channel, view/transaction level, identity/MFA prerequisites, typed limits, dual approval, and downstream integration state.
5. **Review and publish:** exact diff, affected future drafts, stale unactivated drafts, validation errors, approval reason, version, and effective time.

Dropdowns and checkboxes are appropriate for controlled values. Institutions may add custom actions or requirements through structured forms. Raw custom values must not bypass semantic keys, legal locks, purpose/retention metadata, role checks, or compatibility validation.

## Acceptance evidence

The capability remains unproven until an independent replay shows:

- owner creates a draft policy, disables one optional standard action, adds a custom action and evidence requirement, and cannot disable a locked jurisdiction requirement;
- unauthorized roles, AAL1, stale expected versions, duplicate commands, and cross-tenant identifiers fail closed;
- publication creates a new immutable version and audit event;
- a new request receives that version and an older draft is blocked with an exact diff;
- explicit rebase preserves the earlier draft snapshot and produces the current requirement/action set;
- an activated historical request remains byte-for-byte unchanged after another policy publication;
- reviewer decisions cannot exceed requested scope or bypass mandatory evidence without authorized exception evidence;
- principal, representative, reviewer, receipt, API, and signed webhook agree;
- desktop, 390px, 360px, and keyboard verification pass.
