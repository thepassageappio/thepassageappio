# Passage Authority engineering contract

This repository is a greenfield application. It does not inherit the retired Passage product's personas, cases, tasks, pricing, or database model.

## Product boundary

Passage Authority operationalizes one delegated-authority request between a principal, representative, and relying party. Identity, authority evidence, and relying-party acceptance are separate concepts in code and copy.

The controlled MVP is synthetic and local. It must never imply legal validity, production security, or institutional acceptance.

## Definition of working

A feature is working only when the full evidence chain passes:

`browser action -> authenticated server command -> durable state -> append-only event -> other persona sees and acts -> receipt matches -> independent replay passes`

A rendered screen, successful build, HTTP 200, optimistic client state, or sender-only confirmation is insufficient.

## Engineering rules

- One canonical `authority_record` state machine owns every transition.
- UI code never writes state directly. All mutations pass through a validated command service.
- Every successful mutation writes state and an immutable event in one transaction.
- Commands require actor identity, role authorization, expected version, and idempotency key.
- Identity proof, authority evidence, and relying-party acceptance remain separate.
- Human-facing copy never exposes raw IDs, enums, internal event names, database terms, or unsupported legal conclusions.
- Every persona screen answers: where am I, what needs attention, what do I do, what happens next, what is saved, who can see it, and how do I recover?
- Error, replay, stale-version, unauthorized-role, missing-evidence, rejection, limitation, revocation, and expiration paths are first-class tests.
- Desktop, 390px, and 360px layouts ship together with visible focus and 44px minimum interactive targets.
- No production deployment, production data, real messages, paid provider, or external institution action without explicit owner authorization.

## Architecture boundary

The first adapter uses server-side SQLite for durable local verification on Node.js 24. It is replaceable through the repository interface. Production will use a separately reviewed Supabase/Postgres adapter with RLS, authenticated actors, and a real migration. Browser storage is never an authority source.

## Change sequence

1. Update the product contract and state transition table.
2. Add or update domain tests, including negative paths.
3. Implement server command and persistence changes.
4. Implement persona projections.
5. Run typecheck, lint, domain/API tests, optimized build, and full browser verification.
6. Record evidence and remaining boundary truthfully.

