# Policy source version selection

September 11, 2026. Local implementation on PR 109; not a product release.

The resolver selects the platform, jurisdiction and institution versions in effect at a supplied UTC time. Each source has canonical bytes and a SHA-256 hash covering its kind, key, version, owner, jurisdiction, authority type, publication time, effective time, dependencies and content. Institution sources require an organization; shared sources cannot carry one.

Selection uses the latest effective time, not a sortable version name or array order. The exact effective instant belongs to the new version. Missing sources fail closed. A different organization, jurisdiction, authority type or package key cannot supply a missing version. Conflicting version names or effective times fail, including conflicts in future entries. Backdated publication, malformed dates, changed hashes and noncanonical bytes fail.

Jurisdiction packages must pin the exact platform key, version and hash. Institution policies must pin both platform and jurisdiction sources. The platform has no upstream dependencies. A changed upstream version stops resolution at its effective instant until new matching downstream versions exist. A matching name with different bytes also stops. A source cannot depend on a package published after it. There is no fallback to older sources when the current combination fails.

This is a pure `sources-only` resolver. Its caller must provide complete published history from an authenticated server-side registry and a server-controlled selection time. Hashes prove byte consistency, not publisher identity or counsel approval. Dependency pins prevent mixing unprepared versions; they do not validate the substance of the rules. This module cannot detect an omitted registry row or authorize a browser-supplied catalog. No registry, publication command, legal approval or semantic compatibility is implied. Source resolution alone must never enable request activation.

## Verification

Fourteen source tests cover boundary timing, input order, detached results, missing/future packages, tenant/state/authority isolation, conflicting versions, tampering, ownership and malformed metadata. Dependency cases cover independent platform/jurisdiction changes, changed bytes under the same name, revised downstream packages, preserved prior bytes, missing/self dependencies and future-publication references. All 221 domain tests, TypeScript, lint and optimized build passed.

The local PostgreSQL verifier resolves three explicitly fictional sources with exact dependency pins, compiles their configuration, includes the full resolved source bodies and hashes in the snapshot, then checks saved canonical bytes and permissions. All fixtures roll back. This is a test composition, not a production package-merging rule. No migration was applied or repeated; existing storage remains local only. The unreleased source format has no retained fixture rows or production consumers; no saved historical source was rewritten to add dependency metadata.

## Remaining implementation

Build the authenticated immutable source registry and validate compatibility between its packages. Complete disclosure, exception, product and semantic rules before allowing policy publication. Then implement transactional owner/admin publication with AAL2, expected version, idempotency and audit events; request revision binding; stale activation rejection; and explicit rebase preserving prior history. Verify the complete browser/persona/receipt path before claiming POL1 done.

Related contracts: [configuration validation](POLICY-CHANNEL-CONTROLS-2026-09-11.md), [action/evidence rules](POLICY-RULE-VALIDATION-2026-09-11.md), [byte storage](POLICY-SNAPSHOT-STORAGE-2026-09-11.md), [encoding](POLICY-SNAPSHOT-ENCODING-2026-09-11.md).
