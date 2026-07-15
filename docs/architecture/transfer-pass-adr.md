# ADR: Transfer Pass security and consent spine

- **Status:** Proposed for sandbox validation
- **Date:** 2026-07-15
- **Decision owners:** Product, Data, Security
- **Issue:** #14

## Context

Passage needs a family-controlled, portable record that can move a deliberately limited set of estate information to a registered funeral home. The existing `provider_handoffs` table represents an internal service-provider request and is service-role-only. Expanding it into a bearer-token and consent system would blur responsibilities and make authorization difficult to audit.

The Transfer Pass must support a QR secret and a human-readable fallback secret without storing either secret in recoverable form. It must also preserve a chronological consent and access record while preventing unrelated organizations, anonymous users, expired passes, and revoked passes from reading data.

This ADR defines a product-security contract. It does not assert that a Transfer Pass is a legal authorization, proof of authority, medical authorization, or regulatory record.

## Decision

Create two purpose-built, additive tables:

- `transfer_pass_tokens`: the current pass envelope, immutable share-scope snapshot, recipient organization, lifecycle, expiry, and hashed secrets.
- `transfer_pass_consents`: append-only events for issuance, viewing, acceptance, revocation, expiry, packet generation, and later consent-safe extensions.

Keep `provider_handoffs` unchanged. A later migration may link it to an accepted Transfer Pass if a real workflow requires that relationship.

## V1 actors

### Estate controller

A signed-in user may issue or revoke a pass when they are:

- the `workflows.user_id`;
- the coordinator whose authenticated email matches `workflows.coordinator_email`; or
- an accepted `estate_access` member with role `owner` or `operator`.

### Recipient

V1 requires a registered `organizations` recipient. Inspection and acceptance require both:

1. authentication as an active member of the designated organization; and
2. possession of the valid QR or manual secret.

An anonymous user, vendor outside the designated organization, inactive member, or member of an unrelated organization receives no pass payload.

## Secrets

- QR secret: 256 random bits.
- Manual fallback secret: 80 random bits, encoded for human entry.
- Both secrets are generated inside a `SECURITY DEFINER` issue function.
- Raw secrets are returned exactly once to the issuer.
- Only SHA-256 digests are stored as `bytea`.
- Hash columns are excluded from authenticated column grants.
- Secrets are never accepted in query strings by the data contract; application APIs must use request bodies and avoid logging them.

## Share scope

The token stores an immutable JSONB snapshot:

- `scope_version`, initially 1;
- a non-empty `items` array containing explicit fields/categories;
- recipient name and organization identity at issuance;
- estate/workflow identity;
- issuer identity; and
- expiry.

A scope change revokes the old pass and issues a new pass. It never mutates the old scope.

Expiry must be in the future and no more than 30 days from issuance. Product defaults may be shorter.

## Lifecycle

Stored state is `issued`, `accepted`, or `revoked`. Expiry is derived from `expires_at`; it is not dependent on a scheduled job.

- Issuance logs `issued`.
- A valid resolve logs `viewed`.
- Acceptance is concurrency-safe and idempotent.
- Revocation blocks future resolve and acceptance immediately.
- Packet generation logs `packet_generated`.
- Audit rows cannot be updated or deleted through application roles.

## Authorization and RLS

- RLS is enabled and forced on both tables.
- Direct inserts, updates, and deletes are denied to client roles.
- Issuers may select safe token metadata for passes they issued.
- Estate controllers and designated active recipient-organization members may select relevant audit events.
- Recipient payload access occurs only through a secure resolver that validates secret, membership, state, and expiry.
- `anon` receives no table or function privileges.
- `service_role` retains operational access.
- Functions use a fixed empty `search_path` and fully qualified references.

## What changes

- Two additive tables, indexes, constraints, triggers, RLS policies, and grants.
- Four authenticated RPCs: issue, resolve, accept, and revoke.
- A stable backend contract for Transfer Wallet and funeral-home scan/accept experiences.
- No changes to existing workflow, estate-access, organization, or provider-handoff records.

## Why

The dedicated model makes the family’s scope and consent explicit, creates a defensible least-privilege boundary, supports immediate revoke/expiry behavior, and provides one auditable handoff spine across family and funeral-home experiences.

## What breaks if omitted

- Bearer secrets risk being stored or logged in plain text.
- Recipient access cannot be reliably limited to the intended organization.
- Share scope can drift after issuance.
- Revocation and expiry can become presentation-only states.
- Audit history can be edited or lost.
- `provider_handoffs` accumulates incompatible meanings and unsafe policies.

## Migration and rollout

1. Commit the migration; do not apply it to production.
2. Apply to the isolated Supabase sandbox.
3. Run the permission matrix for issuer, accepted estate controller, intended recipient member, unrelated organization, anonymous user, expired pass, revoked pass, and cross-estate access.
4. Connect application APIs only after tests pass.
5. Generate synthetic sandbox passes; never seed raw secrets into production.

## Rollback

Before real data exists, rollback may drop the new functions, triggers, policies, and tables. After real records exist, rollback requires a forward migration that preserves consent history. Production rollback must never discard audit records.

## Deferred decisions

- Non-registered recipient organizations.
- Hospice, cemetery, vendor, and estate-administration recipient types.
- Key rotation or peppering beyond SHA-256 random-secret digests.
- Packet file retention.
- Verified legal/compliance language.
