-- Founder decision 2026-08-20: the D2C "green" (planning-ahead) self-serve
-- signup path had zero free-trial allowance -- self_serve_create_family_record
-- required an active public.subscriptions row (status active/trialing), but
-- no code path anywhere creates that row before a real Stripe payment. A
-- brand-new signed-in user with no subscription hit a hard "An active plan
-- is required" dead end at /case/start, confirmed live by the founder.
-- Mirrors the existing B2B org trial pattern
-- (passage_private.organization_trial_status, self_serve_trial_gating
-- migration) but for an individual D2C account: 7 days from account
-- creation (auth.users.created_at), full access, never a hard lockout --
-- an existing paid subscription always overrides regardless of trial age.
create or replace function passage_private.d2c_trial_status(p_user_id uuid)
returns table (is_gated boolean, is_paid boolean, trial_ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    not (
      exists (select 1 from public.subscriptions as s where s.user_id = p_user_id and s.status in ('active', 'trialing'))
      or u.created_at >= (pg_catalog.clock_timestamp() - interval '7 days')
    ),
    exists (select 1 from public.subscriptions as s where s.user_id = p_user_id and s.status in ('active', 'trialing')),
    u.created_at + interval '7 days'
  from auth.users as u
  where u.id = p_user_id
$function$;

revoke all on function passage_private.d2c_trial_status(uuid) from public, anon, authenticated;
grant execute on function passage_private.d2c_trial_status(uuid) to authenticated;

create or replace function public.d2c_trial_status()
returns table (is_gated boolean, is_paid boolean, trial_ends_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $function$
  select * from passage_private.d2c_trial_status((select auth.uid()))
$function$;

revoke all on function public.d2c_trial_status() from public, anon, authenticated;
grant execute on function public.d2c_trial_status() to authenticated;

create or replace function passage_private.self_serve_create_family_record(p_person_name text, p_relationship_to_deceased text)
returns table (workflow_id uuid, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_person_name text := btrim(coalesce(p_person_name, ''));
  v_relationship text := nullif(btrim(coalesce(p_relationship_to_deceased, '')), '');
  v_can_create boolean;
  v_existing_workflow_id uuid;
  v_new_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_person_name = '' or length(v_person_name) > 200 then
    raise exception 'A valid name is required' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.subscriptions
    where user_id = v_actor_user_id and status in ('active', 'trialing')
  ) or exists (
    select 1 from auth.users as u
    where u.id = v_actor_user_id and u.created_at >= (pg_catalog.clock_timestamp() - interval '7 days')
  ) into v_can_create;
  if not v_can_create then
    raise exception 'An active subscription is required to start a family record' using errcode = '42501';
  end if;

  select id into v_existing_workflow_id from public.workflows where user_id = v_actor_user_id limit 1;
  if v_existing_workflow_id is not null then
    return query select v_existing_workflow_id, true;
    return;
  end if;

  insert into public.workflows (
    user_id, name, person_name, relationship_to_deceased, trigger_type, mode, path, status, phase
  ) values (
    v_actor_user_id, v_person_name, v_person_name, v_relationship, 'death_confirmed', 'green', 'green', 'planning_active', 'Planning started'
  ) returning id into v_new_id;

  perform passage_private.seed_default_d2c_planning_tasks(v_new_id);

  return query select v_new_id, false;
end
$function$;

-- Second, independent bug found while testing the trial fix:
-- passage_private.self_serve_create_family_record has NEVER had EXECUTE
-- granted to authenticated (confirmed via has_function_privilege -- false
-- before this migration). The public wrapper is SECURITY INVOKER, so
-- calling it as an authenticated user requires the caller to also have
-- EXECUTE on the inner passage_private function itself, not just the
-- wrapper. The primary auto-provisioning path (Stripe webhook, service_role
-- client) was never affected since it bypasses grants entirely, but the
-- /case/start fallback path (a real signed-in user calling this RPC
-- directly) has been broken this whole time regardless of subscription
-- status -- confirmed via a real zero-footprint adversarial test (5/5
-- assertions passed after this grant was added, all failed before it).
grant execute on function passage_private.self_serve_create_family_record(text, text) to authenticated;
