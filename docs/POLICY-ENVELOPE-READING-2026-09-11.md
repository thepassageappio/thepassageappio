# Strict reading of saved policy records

September 11, 2026. Unreleased policy groundwork in PR 109.

Snapshot and source readers now validate the containing record before reading its strings. It must be a plain or null-prototype object with exactly two enumerable data properties: canonicalJson and sha256. Getters, inherited values, hidden fields, symbol fields, extra metadata, arrays and class instances fail before content parsing. The two strings are copied into a detached record, then the existing hash, canonical-byte and body checks run.

Previously the snapshot reader ignored extra properties, and both readers could invoke property getters while examining the record. The new shared guard reads property descriptors instead. It does not run a getter to obtain the saved text or hash.

The one-million-byte limit still applies to the stored UTF-8 JSON text itself, not to a second JSON encoding of that string. Frozen records and null-prototype records remain valid. No stored bytes, hash algorithm, source format, table, migration or existing request changes.

This is an integrity check for in-process records. It does not authenticate a source, approve publication or provide isolation from hostile JavaScript proxies, whose reflection traps can execute code. A trusted server history loader, publication commands and request snapshot/rebase enforcement remain unfinished.

## Verification

Eight new tests exercise both readers: getters never execute; inherited, hidden, symbol and extra fields fail; normal/frozen/null-prototype records preserve meaning; UTF-8 and exact size limits apply; the returned record is detached. Existing content/hash verification remains required after the envelope guard.

All 237 domain tests, TypeScript, lint and the optimized production build passed. No hosted database query, migration, provider send or product release is part of this change.
