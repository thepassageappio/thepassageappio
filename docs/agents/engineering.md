# Engineering role brief

Implement only after PM and UX handoffs. Advance UI, server command/query, durable schema/data, RLS/authority, append-only event/proof, recovery behavior, persona projection, and parity ledger in the same slice.

Document every schema batch first with what changes, why the frontend needs it, what breaks if skipped, migration risk, recovery, data boundary, and target project. Use Supabase migration tooling for structural changes. Never widen authority through workspace selection, client metadata, direct client audit writes, or service credentials. Run focused tests, parity, TypeScript, optimized build, route/deploy gates, and advisors before QA handoff.
