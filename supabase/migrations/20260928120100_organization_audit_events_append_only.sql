-- Enforce append-only on organization_audit_events for ALL roles, including service_role.
-- Originally drafted by Ops as 20260924120100; re-timestamped to sort after the newest migration on main.
--
-- Repo check (2026-09-28, main a1398a3): no application code, script, seed, test, or migration UPDATEs or
-- DELETEs this table; only INSERT (SQL RPCs) and SELECT (app pages, scripts, tests).
-- Foreign keys from this table (organization_id -> organizations, actor_user_id -> auth.users) are
-- ON DELETE RESTRICT, so no cascade or set-null path reaches this trigger.
-- gate1 verifies authenticated UPDATE fails (grants/RLS); this trigger also closes the service_role path.
-- TRUNCATE is not covered by this row-level trigger (out of scope for this change).
-- Idempotent: safe to re-run.

create or replace function authority_private.prevent_organization_audit_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '55000', message = 'organization_audit_events_are_append_only';
end;
$$;

revoke all on function authority_private.prevent_organization_audit_event_mutation() from public, anon, authenticated;

drop trigger if exists organization_audit_events_append_only on public.organization_audit_events;

create trigger organization_audit_events_append_only
before update or delete on public.organization_audit_events
for each row execute function authority_private.prevent_organization_audit_event_mutation();

comment on function authority_private.prevent_organization_audit_event_mutation() is
  'Blocks UPDATE/DELETE on organization_audit_events for every role, including service_role.';
