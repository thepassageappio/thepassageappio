# Permission publication and policy foundation — September 26, 2026 UTC

## Change

An owner/admin with MFA can save a new version of the two existing NY financial
POA choices. The new-request form reads that published version and submits its ID.
The database captures the full ordered permission content and version in the
request and creation event. A stale loaded form cannot silently save against newer
rules. An existing draft cannot activate until the operator reviews the differences
and explicitly saves a revision. That revision keeps the earlier snapshot in history.
Canceling an unsent stale draft remains possible without adopting new rules.

Publication and request creation/activation/revision share an organization lock.
Commands check membership, tenant, role, MFA, expected version and idempotency.
Published versions/items are immutable. Decisions take labels from the request's
frozen snapshot; later publication cannot change an existing receipt fingerprint.
Existing requests/receipts are not backfilled. Existing organizations retain their
published starter; newly created organizations receive the fixed NY starter.

The reusable source-resolution, canonical snapshot, compiler and compatibility
helpers from #109 are included with append-only source/snapshot byte storage and
hash/envelope/privilege tests. This is groundwork, not a general policy designer,
custom catalog, extra jurisdiction or legal validation claim. #143's publication
implementation is replaced by this integrated version with draft safeguards.

## Validation before release

- 340 domain tests; TypeScript, ESLint and optimized Next build passed.
- Fresh isolated Supabase stack replayed every migration, including both new files.
- All seven SQL suites passed: submission boundary, delivery recovery, public
  authorization, reviewer role, terminal/recovery, NY provenance/revision, and
  permission publication/draft binding.
- Immutable snapshot/source storage tests passed with exact UTF-8 hashes,
  malformed input rejection, tenant isolation and append-only protection.
- Actual local Supabase owner session with enrolled/verified TOTP: created synthetic
  PA-8A96D529E3, saved a new published version, saw “Review the changed rules before
  sending,” reviewed and saved the revision, then saw “The draft now uses the
  reviewed rules. The previous version stays in its history. Nothing was sent.”
- At 390 and 360 CSS pixels, document width equals viewport width. Screenshots
  captured for publication, stale draft and successful revision. No provider mail
  was sent; this was a separate synthetic local organization.

## Deployment procedure and boundaries

One reviewed PR, green release checks, two hosted migrations per database, one merge,
and one Git-triggered Production deployment per Vercel project. Verify exact SHA on
Demo and www, run hosted rollback-only publication tests, and compare historical
receipt/governing digests before/after. Hosted completion is recorded in the PR and
owner-facing final evidence once actually verified; the statements above are local.

Preflight historical digests:

| Environment | Receipts | Receipt digest | Governing snapshot digest |
|---|---:|---|---|
| Demo | 14 | 3b470601f84ade89525f67c37e98a08b | dbc1d0c72d1dc8359a3a2156bc20db40 |
| UAT | 6 | 33ed969216f35939eb92f6545f4900a4 | bf710d95c803af3380b8186ac8c0d7fd |

Guided Path B demos remain owner-approved. Outbound remains HOLD. The seven actual
reconciliation-day gate and independent provider reconciliation are not waived by
this release, and this is not a new unassisted seven-minute demo claim.
