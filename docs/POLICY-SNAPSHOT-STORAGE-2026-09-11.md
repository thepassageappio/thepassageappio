# Private policy snapshot storage

Migration `20260911072009_policy_snapshot_content_storage.sql` adds the local storage foundation for POL1. It has not been applied to Demo or UAT and is not used by the application yet.

`authority_private.policy_snapshot_contents` saves exact canonical text and its SHA-256 under one organization. PostgreSQL independently hashes the original UTF-8 bytes; it never replaces them with a JSON reserialization. An envelope check validates required metadata, source references, effective time and organization identity. The organization foreign key uses restrictive deletion, and the unique organization/hash key prevents duplicate content rows. A composite organization/id key is available for future publication and request-revision foreign keys.

Browser roles have no table or helper-function grants. RLS is enabled with no permissive policies, following the [Supabase access-control guidance](https://supabase.com/docs/guides/database/postgres/row-level-security). The service role has insert/read only. Update, delete and truncate triggers also reject accidental changes by a role with table-owner privileges. A database administrator can still alter schema or disable triggers; these controls are not a claim of protection against a malicious database administrator.

The envelope check does not implement the TypeScript canonical ordering algorithm or validate complete policy meaning. Future trusted commands must use the canonical reader and governed compiler before insertion. A stored blob is not a published policy, legal approval or a request snapshot binding. There is no public RPC, authenticated write path, historical backfill, active-policy pointer or change to existing requests.

## Verification

`scripts/verify-policy-snapshot-storage.mjs` passed against local PostgreSQL. It supplies real TypeScript-canonical content, including Unicode and an apostrophe, and verifies the independent database hash, exact stored bytes, malformed envelope/date/source rejection, organization mismatch rejection, anonymous/authenticated access denial, service insert/read, duplicate rejection, update/delete/truncate denial and unchanged history. All synthetic users, organizations and content rows roll back.

The `--replay` option also passed: it checks that the new local table is empty, recreates only the new storage objects from the migration inside a transaction, runs the same assertions, then rolls back to restore the original objects. It does not reset the local database or remove existing application fixtures. This is clean object recreation, not a full database-reset test.

Local security advisors returned no issues. All 183 domain tests, TypeScript, lint and optimized build passed. The final replay-only verifier edit passed its database run and lint. Local DDL was applied directly during development without a migration-history row; do not blindly reapply it to that local database. The checked-in migration is the source for future clean/hosted application. No hosted migration, provider send, reconciliation rerun or production deployment occurred.

Next: implement the governed compiler and immutable publication/request-revision records. Publish and explicit rebase must authenticate the owner/admin at AAL2, enforce expected version and idempotency, lock concurrent changes, bind the organization, and append audit history in the same transaction. Existing request/template references remain historical until a supported migration path is verified. Snapshot storage alone does not close those requirements.
