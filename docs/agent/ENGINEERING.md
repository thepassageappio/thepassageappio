# Engineering playbook

Load for product, API, database, or domain changes.

## Required sequence

1. Identify the canonical state transition and affected personas.
2. Update the narrow contract or transition table when behavior changes.
3. Add meaningful negative/idempotency tests for durable mutations.
4. Route UI mutations through authenticated server commands.
5. Write state and append-only event atomically.
6. Verify authorization, expected version, idempotency, tenant isolation, receipt agreement, and replay.
7. Run focused tests, then TypeScript, lint, domain tests, and optimized build when the change is release-bound.

## Current structural fixes

- Notification history: add immutable per-send attempts; mutable outbox remains current work only.
- Commercial reconciliation: classify provider-backed and synthetic-fixture orders explicitly.
- Pending lifecycle gap: institutions cannot cancel an awaiting-principal request. Add an institution-authorized cancel/withdraw command after current release blockers, with expected-version and idempotency checks, an append-only event, notification handling, all-persona visibility, and a durable terminal receipt. The rehearsal duplicate was closed as `declined` only because this action does not exist.

Consult only as needed:

- [../PRODUCT-SOURCE-OF-TRUTH.md](../PRODUCT-SOURCE-OF-TRUTH.md) for detailed behavior.
- [../IMPLEMENTATION-TRACEABILITY.md](../IMPLEMENTATION-TRACEABILITY.md) for route/function mapping.
- [../BUILD-CONTRACT.md](../BUILD-CONTRACT.md) for fictional MVP regression behavior.
