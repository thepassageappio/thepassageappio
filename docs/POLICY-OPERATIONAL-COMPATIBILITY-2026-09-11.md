# Operational policy combinations

September 11, 2026. Local POL1 implementation on PR 109, not a product release.

`compileCompatiblePolicyConfiguration` runs structural compilation and checks the result against a separate server-controlled contract. The contract lists supported account types, retention classes and currencies. Each standard action must have an explicit contract naming required evidence, allowed channel/access-level pairs and allowed control kinds. Unknown fields, references and duplicates fail closed.

An enabled action cannot lose evidence that its contract requires, even if that evidence is optional in the base catalog. A disabled action may stop requiring that evidence unless another enabled action or a locked requirement still needs it. Every channel and control must fit all of its referenced actions, including disabled definitions, so later enabling cannot reveal an unchecked combination. Currency codes must both have the correct shape and appear in the supplied supported set.

Custom actions fail this path until a governed semantic definition and review process exists. The earlier structural compiler can still represent them for draft development; it is not a publication gate. Custom evidence must use a supported retention class and still passes the original purpose, method and reviewer checks.

The result retains `stage: configuration-only` and adds `compatibility: operational-references-checked`. This is not legal compatibility, counsel approval, a retention-duration check or permission to activate a request. The trusted contract must ultimately come from the immutable versioned registry; the function does not authenticate a supplied contract. It does not establish complete workflow feasibility, provider readiness, disclosure/exception rules or semantic approval of custom text.

## Verification

Eight new tests cover detached output, action/evidence dependencies, supported metadata, channel/access-level mismatches, incompatible controls, missing/unknown/duplicate action contracts, blocked custom actions and malformed contracts. All 229 domain tests, TypeScript, lint and optimized build passed.

The local PostgreSQL verifier includes a fictional compatibility contract in a hash-pinned jurisdiction source, resolves dependencies, compiles and checks the configuration, then stores the complete source bodies and configuration in canonical snapshot bytes. Hash, tenant, permission, append-only and rollback checks pass. No migration was applied or repeated; no fixture records remain.

## Next

Implement the trusted immutable registry and transactional publication. Complete semantic, disclosure, exception, product and review rules before making publication available. Bind requests to full snapshots, block stale activation with a diff, preserve explicit rebase revisions, and verify the full persona/receipt path. POL1 remains open.

Related: [source dependency pins](POLICY-SOURCE-RESOLUTION-2026-09-11.md), [structural compiler](POLICY-CHANNEL-CONTROLS-2026-09-11.md), [byte storage](POLICY-SNAPSHOT-STORAGE-2026-09-11.md).
