-- P0 security hardening: prevent anonymous RPC probing and restore owner
-- visibility for subscription rows created by Stripe webhooks.

begin;

-- These helper functions are used inside RLS policies. They must remain
-- callable by authenticated users, but anonymous callers should not be able
-- to use them as workflow / organization existence oracles.
create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog, pg_temp
as $$
  select coalesce(auth.uid(), null) is not null
    and exists (
      select 1
      from public.organization_members
      where organization_id = org_id
        and coalesce(status, 'active') = 'active'
        and role in ('owner', 'admin')
        and (
          user_id = auth.uid()
          or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    );
$$;

create or replace function public.is_org_member_of(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog, pg_temp
as $$
  select coalesce(auth.uid(), null) is not null
    and exists (
      select 1
      from public.organization_members
      where organization_id = org_id
        and coalesce(status, 'active') = 'active'
        and (
          user_id = auth.uid()
          or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    );
$$;

create or replace function public.is_workflow_owner(wf_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog, pg_temp
as $$
  select coalesce(auth.uid(), null) is not null
    and exists (
      select 1
      from public.workflows
      where id = wf_id
        and user_id = auth.uid()
    );
$$;

-- Normalize execution grants on the security-definer surface. Service role
-- keeps operational/admin access. Authenticated keeps policy helper access.
revoke all on function public.is_org_admin(uuid) from public;
revoke all on function public.is_org_member_of(uuid) from public;
revoke all on function public.is_workflow_owner(uuid) from public;
revoke all on function public.is_org_admin(uuid) from anon;
revoke all on function public.is_org_member_of(uuid) from anon;
revoke all on function public.is_workflow_owner(uuid) from anon;
grant execute on function public.is_org_admin(uuid) to authenticated, service_role;
grant execute on function public.is_org_member_of(uuid) to authenticated, service_role;
grant execute on function public.is_workflow_owner(uuid) to authenticated, service_role;

-- Keep activation and compliance/admin-only routines unavailable to browser
-- roles. Triggers and API routes use owner/service-role execution paths.
revoke all on function public.activate_estate(uuid, text) from public;
revoke all on function public.passage_compliance_snapshot() from public;
revoke all on function public.auto_activate_on_status_change() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.recalculate_user_completion(uuid) from public;
revoke all on function public.trigger_user_completion_update() from public;
revoke all on function public.rls_auto_enable() from public;
revoke all on function public.activate_estate(uuid, text) from anon, authenticated;
revoke all on function public.passage_compliance_snapshot() from anon, authenticated;
revoke all on function public.auto_activate_on_status_change() from anon, authenticated;
revoke all on function public.handle_new_user() from anon, authenticated;
revoke all on function public.recalculate_user_completion(uuid) from anon, authenticated;
revoke all on function public.trigger_user_completion_update() from anon, authenticated;
revoke all on function public.rls_auto_enable() from anon, authenticated;
grant execute on function public.activate_estate(uuid, text) to service_role;
grant execute on function public.passage_compliance_snapshot() to service_role;
grant execute on function public.auto_activate_on_status_change() to service_role;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.recalculate_user_completion(uuid) to service_role;
grant execute on function public.trigger_user_completion_update() to service_role;
grant execute on function public.rls_auto_enable() to service_role;

-- Pin search_path on the current security-definer functions so future dumps
-- and advisor checks keep the same posture.
alter function public.activate_estate(uuid, text) set search_path = public, pg_catalog, pg_temp;
alter function public.auto_activate_on_status_change() set search_path = public, pg_catalog, pg_temp;
alter function public.handle_new_user() set search_path = public, pg_catalog, pg_temp;
alter function public.passage_compliance_snapshot() set search_path = public, pg_catalog, pg_temp;
alter function public.recalculate_user_completion(uuid) set search_path = public, pg_catalog, pg_temp;
alter function public.rls_auto_enable() set search_path = pg_catalog, pg_temp;
alter function public.trigger_user_completion_update() set search_path = public, pg_catalog, pg_temp;

-- subscriptions is written by server-side Stripe/service-role code. Owners
-- should be able to read their own subscription status from client surfaces,
-- but client inserts/updates/deletes remain blocked by RLS.
drop policy if exists "subscriptions owner read" on public.subscriptions;
create policy "subscriptions owner read"
on public.subscriptions
for select
to authenticated
using (user_id = (select auth.uid()));

comment on policy "subscriptions owner read" on public.subscriptions
is 'Lets signed-in users read only their own billing/subscription rows; writes stay server-side.';

commit;
