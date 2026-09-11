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

## Forward-only policy invariant

- Treat policy, template, catalog, requirement, label, control, and integration-mapping changes as new effective-dated versions.
- Pin the complete effective snapshot when a request draft is created.
- At first activation, compare the draft snapshot with the current effective version. A stale draft must fail closed and show an exact diff.
- Permit an authorized coordinator to explicitly rebase a stale, unactivated draft into a new draft revision. Revalidate actions, channels, controls, disclosures, and requirements; append an event naming both versions and the actor; preserve the prior snapshot.
- Activation permanently locks the governing snapshot. Apply later published versions only to newly created drafts or explicit pre-activation rebases.
- Never update an activated request, event, decision, receipt, or replay merely because configuration changed.
- Make migration backfills preserve historical meaning. If an old row lacks a snapshot, derive and record the version that actually governed it rather than assigning the newest version.
- Test the boundary with a request created before publication, an explicit pre-activation rebase, a declined rebase, and a request created after publication. Prove an activated request is unchanged.

## Current structural fixes

- Notification history: add immutable per-send attempts; mutable outbox remains current work only.
- Commercial reconciliation: classify provider-backed and synthetic-fixture orders explicitly.
- Awaiting-principal cancellation is now shipped and verified; see [release evidence](../RELEASE-AND-DEMO-STATUS-2026-09-11.md). Broader cancellation states remain separate work.
- Policy byte encoding and exact comparison are implemented; see [snapshot contract](../POLICY-SNAPSHOT-ENCODING-2026-09-11.md). Persist exact canonical text, never substitute PostgreSQL JSON reserialization for those hashed bytes. Compiler, transactional publication and request snapshot/rebase enforcement are still required.

Consult only as needed:

- [../PRODUCT-SOURCE-OF-TRUTH.md](../PRODUCT-SOURCE-OF-TRUTH.md) for detailed behavior.
- [../IMPLEMENTATION-TRACEABILITY.md](../IMPLEMENTATION-TRACEABILITY.md) for route/function mapping.
- [../BUILD-CONTRACT.md](../BUILD-CONTRACT.md) for fictional MVP regression behavior.
