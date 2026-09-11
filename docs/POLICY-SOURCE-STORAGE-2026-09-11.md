# Private policy source storage

September 11, 2026. Local-only migration `20260911113719_policy_source_content_storage.sql`, pending in PR 109. Applied once through local development DDL; there is no local migration-history row. Do not blindly reapply it. Not applied to Demo or UAT.

`authority_private.policy_source_contents` preserves canonical source text and independently checks its SHA-256 over UTF-8 bytes. Source kind, organization, jurisdiction, authority type, key, version and effective time are generated from the saved content, so callers cannot submit separate mismatched metadata. Institution organizations have a restrictive foreign key. Version and effective-time uniqueness includes shared sources whose organization is null.

The envelope validator checks the source fields, UTC dates, ownership shape, content and exact upstream dependency-reference shapes. It does not establish that referenced packages exist, validate complete semantics or prove canonical ordering. The TypeScript source reader remains required before registration and when reading saved content.

The table is private with RLS enabled and no browser grants or policies. The service role can insert and read; it cannot update, delete or truncate. Triggers also reject accidental rewrites through the table owner. The owner can still alter the schema or disable triggers; this is not protection against a malicious database administrator.

This is source-content storage, not a trusted publication registry. No public RPC, publisher approval, request binding, history loader, policy publication command or backfill was added. An insertion is not a legal signoff or institution publication. The future authenticated publication command must establish approved source provenance, dependency existence, complete validation and atomic append-only audit evidence.

## Verification

`scripts/verify-policy-source-storage.mjs` captures three fictional source kinds with exact dependency pins and Unicode/apostrophe text, validates them with the resolver, then tests PostgreSQL. It proves byte/hash agreement, generated metadata, duplicate version/effective-time rejection for shared and institution sources, a missing-organization foreign-key failure, malformed envelopes, browser access denial, service insert/read, service mutation denial, owner trigger denial and rollback cleanup. No fixture rows remain.

`--replay` recreated only this migration's new empty table and two functions inside an isolated transaction, ran the tests, then rolled back to restore the original objects. This is not a full database reset. Both modes passed. All 229 domain tests, TypeScript, lint and optimized build passed.

Local security advisors returned zero warnings/errors and 24 informational `rls_enabled_no_policy` notices, including this deliberately private table. That does not replace hosted advisor evidence. Grants and RLS were reviewed against the [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security); the changelog review found no applicable break for these objects.

Next: authenticated source registration/history loading with approved provenance, then complete semantic/disclosure/exception validation and transactional policy publication. Bind request revisions to full snapshots and enforce stale activation/rebase before claiming POL1 complete.

Related: [source resolver](POLICY-SOURCE-RESOLUTION-2026-09-11.md), [operational compatibility](POLICY-OPERATIONAL-COMPATIBILITY-2026-09-11.md), [snapshot storage](POLICY-SNAPSHOT-STORAGE-2026-09-11.md).
