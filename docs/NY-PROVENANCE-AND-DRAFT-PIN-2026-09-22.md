# New York provenance and draft revisions

The September 15 NY metadata backfill cannot establish which rules governed earlier requests. This change preserves those records, events and receipts. Historical screens explicitly say when a governing rules version was not saved; they no longer infer it from later record labels.

New NY requests save the fixed workflow, jurisdiction definition, effective date, source, review reasons, timers, supported actions and evidence requirements at creation. Activation rejects a draft if the current configuration differs. A coordinator must inspect the before/after values, acknowledge them and save a new draft revision. The command checks organization membership, coordinator role, privileged MFA, record version, current configuration hash and idempotency. It preserves the previous snapshot in append-only events. It sends no invitations and consumes no evaluation usage.

Published jurisdiction definitions and reasons cannot be edited in place. New versions start as drafts. Configuration writes serialize against snapshot capture, so activation cannot silently race a publication. Activated snapshots remain locked; later decision receipts freeze their saved provenance and actual form classification. This is the fixed synthetic NY workflow, not a general policy authoring or publication product.

Validation: 231 domain tests, TypeScript, lint and production build passed. The complete migration chain and all six rollback SQL suites passed on the isolated local database. Hosted migration, browser rebase acceptance and release provenance are not yet claimed.

Release procedure: verify CI, record pre-migration record/event/receipt fingerprints on both environments, apply the additive migration once, run the rollback NY test, and compare historical fingerprints. Release the matching application, verify both live SHAs, and check an old receipt plus a stale draft in the browser. Do not rewrite old snapshots to make missing provenance look complete.
