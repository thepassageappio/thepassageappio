-- Admin compliance-readiness snapshot for Passage system checks.
-- Returns metadata only. Does not expose customer row data.

create or replace function public.passage_compliance_snapshot()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  with public_tables as (
    select c.relname as table_name,
           c.relrowsecurity as rls_enabled,
           count(p.polname)::int as policy_count
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_policy p on p.polrelid = c.oid
    where n.nspname = 'public'
      and c.relkind = 'r'
    group by c.relname, c.relrowsecurity
  ),
  sensitive_tables(table_name) as (
    values
      ('workflows'),
      ('tasks'),
      ('estate_events'),
      ('task_status_events'),
      ('notification_log'),
      ('estate_access'),
      ('estate_participants'),
      ('activation_requests'),
      ('activation_witnesses'),
      ('vendor_requests'),
      ('vendor_orders'),
      ('vendor_payments'),
      ('documents'),
      ('messages'),
      ('announcements')
  ),
  allow_all as (
    select schemaname,
           tablename,
           policyname,
           cmd,
           roles,
           qual,
           with_check
    from pg_policies
    where schemaname = 'public'
      and tablename in (select table_name from sensitive_tables)
      and (
        trim(coalesce(qual, '')) = 'true'
        or trim(coalesce(with_check, '')) = 'true'
      )
  ),
  zero_policy as (
    select table_name, rls_enabled, policy_count
    from public_tables
    where policy_count = 0
  ),
  no_rls as (
    select table_name, rls_enabled, policy_count
    from public_tables
    where rls_enabled is not true
  )
  select jsonb_build_object(
    'generated_at', now(),
    'tables_total', (select count(*) from public_tables),
    'rls_disabled', coalesce((select jsonb_agg(to_jsonb(no_rls) order by table_name) from no_rls), '[]'::jsonb),
    'zero_policy_tables', coalesce((select jsonb_agg(to_jsonb(zero_policy) order by table_name) from zero_policy), '[]'::jsonb),
    'sensitive_allow_all_policies', coalesce((select jsonb_agg(to_jsonb(allow_all) order by tablename, policyname) from allow_all), '[]'::jsonb),
    'sensitive_tables', (select jsonb_agg(table_name order by table_name) from sensitive_tables),
    'status', case
      when exists (select 1 from no_rls) then 'fail'
      when exists (select 1 from allow_all) then 'fail'
      else 'review'
    end
  );
$$;

revoke all on function public.passage_compliance_snapshot() from public;
grant execute on function public.passage_compliance_snapshot() to service_role;
