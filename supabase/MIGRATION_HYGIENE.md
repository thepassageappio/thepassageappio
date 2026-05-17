# Supabase Migration Hygiene

## Current strategy

As of May 14, 2026, Passage uses a clean production-schema baseline:

- `supabase/migrations/20260514000000_baseline_production_public_schema.sql`
- `supabase/migrations/20260514155617_20260514123000_normalize_leads_policy_after_baseline.sql`

The earlier migration chain could not replay from an empty shadow database because the first recoverable remote migration assumed pre-existing core tables such as `workflows` and `tasks`. Those historical files are preserved in:

- `supabase/migrations_legacy_prebaseline_20260514/`

Do not move legacy files back into `supabase/migrations/` unless you are intentionally rebuilding the whole migration history.

## Before production schema work

Run:

```powershell
npx supabase migration list --linked
npx supabase db diff --linked --schema public
npx supabase db push --linked --dry-run
```

Expected healthy state:

- `migration list` shows the same local and remote versions.
- `db diff` returns `No schema changes found` before new work.
- `db push --dry-run` returns `Remote database is up to date` before new work.

Use the repeatable gate when preparing a real release:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/db-release-gate.ps1
```

The gate treats `public` schema drift as a blocker because that is Passage-owned application data. Broad diffs may show Supabase-managed integration schemas such as `stripe`, `pgmq`, `storage`, or extension objects after dashboard integrations are enabled. Those are classified as informational unless the broad diff also includes `public` schema changes.

## Before applying production migrations

Run a schema backup first:

```powershell
npx supabase db dump --linked --schema public --file supabase/backups/production_public_schema_YYYYMMDD_before_change.sql
```

Then create a new migration with a real timestamped filename:

```powershell
npx supabase migration new short_descriptive_name
```

Apply only reviewed SQL. After applying, verify:

```powershell
npx supabase migration list --linked
npx supabase db diff --linked --schema public
```

## Rules

- Do not create coarse migration names such as `20260513_feature.sql`; use `supabase migration new` so versions are unique 14-digit timestamps.
- Do not manually edit `supabase_migrations.schema_migrations` with SQL. Use `supabase migration repair` only for explicit baseline bookkeeping.
- Keep production data out of migration files.
- Keep seed/demo data out of production migrations unless the migration name and code make that intent explicit.
- Treat `db diff` failures as a blocker before Stripe Connect, vendor payments, activation-spine, or RLS-sensitive work.
- Do not copy Supabase-managed Stripe schema, `pgmq`, or extension drift into Passage-owned migrations. Keep those managed by the integration that created them.
