# Contact inquiry replay verification

September 11, 2026 UTC.

Local database verification passed: the first public RPC call as service_role returned a new reference. Three identical retries and one retry with an edited message returned that same reference with replayed=true. The saved message stayed unchanged. Exactly one inquiry, one commercial event and one HubSpot outbox item existed. Both browser roles were denied direct command access.

All fixture rows rolled back and cleanup was asserted. Identity sequence increments do not roll back. No provider worker, email or hosted database was involved.

Run node scripts/verify-contact-replay.mjs with LOCAL_SUPABASE_CLI set to the installed CLI path. The database target is fixed to local port 55322. Node syntax and git whitespace checks passed.

This sequential SQL test runs inside a rollback transaction. It does not prove committed HTTP response loss, concurrency, provider delivery or hosted replay. The original key identifies the saved submission; edited fields on a retry do not amend it.

No application or schema change was needed. Live release remains ee3a5fb. Next buyer milestone: a fresh seven-minute presenter-created rehearsal with invitation arrival and matching receipts, using two owner-approved inboxes.
