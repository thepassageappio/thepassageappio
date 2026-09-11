# Policy snapshot migration baseline

The next POL1 migration must distinguish complete newly captured policies from historical template references. Existing requests store a template key/version and requested/prohibited action keys. The original creation command records the template identifiers and requested actions in its event; it does not save the complete effective policy body there. Do not manufacture a historical full policy by joining an old record to today's labels or rules.

## Read-only observations

`supabase/queries/policy_snapshot_readiness.sql` ran successfully against local, Demo and UAT on September 11 UTC. It returns aggregate counts only. All observed records use `ny_financial_poa` / `2026.1`.

| Environment | Records | Activated | Without creation event | Multiple creation events | Creation events missing/differing identifiers | Creation events with policy_snapshot object |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Demo | 9 | 8 | 0 | 0 | 0 / 0 | 0 |
| UAT | 17 | 15 | 0 | 0 | 0 / 0 | 0 |
| Local | 6 | 5 | 5 | 0 | 0 / 0 | 0 |

The local test database includes retained synthetic test records and is not a hosted readiness substitute. Classify missing events before any migration; do not invent events to make a count pass. Hosted identifier agreement does not prove legal validity, complete policy capture, or unchanged policy meaning. The snapshot count only detects a JSON object under that event field; even an empty object would count and would still fail future snapshot validation. This audit does not search unrelated storage or prove that a policy body could never be reconstructed from authoritative archived sources.

`scripts/verify-policy-snapshot-audit.mjs` runs the same query with read-only VALUES fixtures. It passed expected counts for missing events, duplicates, incomplete identifiers, version differences, cross-organization events, malformed snapshot values and an empty dataset. No fixture rows or audit tables were written. This change adds a query and its verifier; the application and database schema are unchanged.

## Required first migration behavior

1. Preserve existing requests, decisions, receipts and events byte-for-byte. Do not update their template version or imply they already have a complete policy snapshot.
2. Represent historical references explicitly as legacy provenance. Any future reconstruction needs identified authoritative source/version evidence; an assumed default or current policy is insufficient.
3. Capture complete, validated, canonical policy content for new requests atomically with creation. Include semantic catalog, jurisdiction package and institution-rule versions, actions, evidence, channels, controls, labels and sources. Give this content its own hash; a template identifier alone is not that hash.
4. Store immutable revisions and publication history. Separate editable draft state from immutable publication evidence. Resolve the effective policy by organization, jurisdiction, authority type and effective time without mutating earlier published content.
5. Before activation, compare the draft's pinned policy against the effective published version. A difference requires explicit reviewed rebase with a preserved prior snapshot/event. Never rebase an activated request.
6. Add owner/admin AAL2, expected-version, idempotency, tenant-isolation and concurrent-publication tests before exposing authoring controls. Prove historical receipts are unchanged after publication.

This baseline closes the inventory step only. Policy editing, publication, snapshot persistence and rebase are not implemented by it. Existing policy requirements remain authoritative. Both Vercel checks on prior commit `f572d70261eda91afb106b4058edb49ad8a2b59b` were successful; the next commit needs its own status check. Hosted cancellation replay and UAT preview authentication remain open. No migration, provider send, merge, outreach or production release occurred.
