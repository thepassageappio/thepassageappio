# Policy snapshot encoding and comparison

The first POL1 code slice now captures detached policy bytes, computes their SHA-256, verifies saved bytes, and compares two snapshots from the same organization. It does not yet save policies in the database, publish a policy, rebase a request, or change an application screen.

## Contract

`src/lib/authority/policy-snapshot.ts` defines the `passage-policy-snapshot-v1` envelope: organization UUID, institution policy version, effective time, platform/jurisdiction/institution source identifiers and versions, and the compiled policy content. Effective time must be a complete UTC timestamp with milliseconds. Bare dates and ambiguous time-zone representations are rejected.

The encoding is project-specific, not a claim of conformance with another canonical-JSON standard. Object keys sort by UTF-16 code unit; arrays preserve order. Numbers and strings use JavaScript JSON encoding. Cycles, getters, non-plain objects, undefined values, symbols, bigint, non-finite numbers, negative zero, malformed Unicode, sparse/extended arrays, excessive depth/node count and payloads over one million UTF-8 bytes are rejected. No field is silently dropped. The envelope rejects unknown top-level/source fields so schema changes require a new deliberate format.

The returned snapshot contains a canonical text string and SHA-256. It holds no references to the caller's mutable policy. Reading independently verifies the hash, shape and canonical encoding, then returns a new object. Formatting changes or duplicate JSON keys cannot pass as canonical bytes even with a recomputed matching hash. Comparing two valid snapshots rejects different organization IDs and reports exact added, removed and changed paths. Missing values remain distinct from null. Arrays compare as whole ordered values; the code does not invent stable identities from array positions.

Content is structurally valid JSON, not a validated legal or institution policy. The future compiler must enforce complete rule sets, source provenance, legal locks, typed limits, namespace ownership, evidence requirements, channel compatibility and allowed custom fields. A supplied source identifier is not evidence of counsel approval. Hashing is integrity evidence, not a signature or a substitute for authorization and immutable storage. An actor who can replace both bytes and hash must still be prevented by database permissions and append-only rules.

## Verification

Eleven focused tests cover fixed encoding bytes, independent hashing, stable object-key ordering, meaningful array ordering, detached history, labels/version/effective-time changes, corruption, duplicate-key and noncanonical payloads, legacy-reference rejection, invalid dates, unsupported JSON, size/depth bounds, exact escaped diff paths, null/missing distinctions and cross-organization comparison denial. The full domain suite now contains 183 passing tests. TypeScript, lint and optimized build also pass.

The tests use explicitly fictional policy content. They establish encoding/comparison behavior only. They do not establish database immutability, activation enforcement, a complete policy compiler, legal sufficiency or an end-to-end user journey.

## Next integration step

1. Persist immutable publication and request-revision records with the exact `canonicalJson` text and SHA-256. PostgreSQL must verify `sha256(convert_to(canonical_text, 'UTF8'))`; do not hash a reserialized `jsonb::text` representation and expect it to match this encoding. A parsed JSON projection may support queries but must not replace the authoritative saved bytes.
2. Build the governed compiler and validation before accepting arbitrary institution content. Resolve the effective policy under the same transaction/lock used to create a request and save its snapshot/event atomically.
3. Compare a draft's pinned version/content with the current effective publication before activation. Present the exact difference and require an authorized, versioned, idempotent explicit rebase. This comparison function alone does not authorize or perform that command.
4. Preserve prior request revisions and activated history. Existing template references stay explicitly historical; do not backfill today's policy and claim it governed an old request.
5. Verify owner/admin AAL2, wrong roles, cross-tenant IDs, stale versions, retries, publication races and unchanged historical receipts before exposing authoring controls.

No migration, provider send, reconciliation rerun or production release occurred in this slice. PR 109 remains pending release; production was reverified at `c64299e5ed3fa49b43e7ca62278b9c5c59088264`. Both Vercel checks passed for the preceding auditor-control commit `e9989276faf8ed61fb0d475891d4f8c2e4024c0d`; the new commit needs its own checks.
