# Comparing a draft with current rules

September 11, 2026. Local policy groundwork in open PR 109.

`compareDraftPolicy` compares a draft's saved policy with the current approved snapshot supplied by its caller. It verifies both snapshots, binds both to the supplied institution and checks that both are effective at the supplied server time. It rejects an older replacement rather than offering to move a draft backwards.

Identical content returns `current`; changed content returns `review-required`, both hashes and exact added, removed or changed paths. Matching version labels cannot hide different content. The result and difference list do not modify either saved snapshot.

The output is explicitly `draft-comparison-only`. Neither status authorizes activation, publication or rebase. This function cannot prove that the caller supplied the latest approved publication. The eventual authenticated command must resolve that publication under its transaction lock, verify role/AAL2, expected request version and idempotency, require explicit review/rebase and append the new revision and event atomically. Activated requests keep their original snapshots and must not be passed through this draft workflow to rewrite history.

No command, UI, database object, migration or provider action is introduced. The function is not wired into the released activation path. POL1 remains open.

## Verification

Six new tests cover identical content, the exact effective-time boundary, exact differences and detached results, equal names with changed content, both sides of institution isolation, future/older replacements, malformed context and altered hashes. All 243 domain tests, TypeScript, lint and the optimized production build passed.
