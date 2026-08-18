-- active_estate_slots previously took an arbitrary p_user_id with no
-- ownership check -- any authenticated caller could look up any other
-- user's plan capacity. Found during adversarial testing of the migration
-- immediately before this one. Nothing legitimate needs another user's slot
-- count (the only caller, create_additional_estate_idempotent, always
-- passed its own v_actor), so this drops the parameter and pins the
-- function to auth.uid() instead of trusting caller input.

drop function if exists passage_private.active_estate_slots(uuid);

create or replace function passage_private.active_estate_slots()
returns integer
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    (
      select s.included_estate_slots + s.additional_estate_slots
      from public.subscriptions as s
      where s.user_id = (select auth.uid()) and s.status in ('active', 'trialing')
      order by s.started_at desc
      limit 1
    ),
    1
  )
$function$;

revoke all on function passage_private.active_estate_slots() from public, anon, authenticated;
grant execute on function passage_private.active_estate_slots() to authenticated;

create or replace function public.active_estate_slots()
returns integer
language sql stable security invoker set search_path = ''
as $function$
  select passage_private.active_estate_slots()
$function$;

revoke all on function public.active_estate_slots() from public, anon, authenticated, service_role;
grant execute on function public.active_estate_slots() to authenticated;

create or replace function passage_private.create_additional_estate_idempotent(
  p_person_name text,
  p_relationship text,
  p_request_id uuid
)
returns table (workflow_id uuid, seat_index integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_existing public.workflows%rowtype;
  v_slots integer;
  v_count integer;
  v_new_seat integer;
  v_source text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_request_id is null
     or length(btrim(coalesce(p_person_name, ''))) not between 1 and 200
     or length(btrim(coalesce(p_relationship, ''))) > 80 then
    raise exception 'Enter who this estate is for' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_actor::text || ':estate-create:' || p_request_id::text, 0)
  );

  select * into v_existing from public.workflows
  where user_id = v_actor and creation_request_id = p_request_id;
  if v_existing.id is not null then
    return query select v_existing.id, v_existing.seat_index, true;
    return;
  end if;

  select count(*) into v_count from public.workflows where user_id = v_actor;
  select passage_private.active_estate_slots() into v_slots;
  if v_count >= v_slots then
    raise exception 'Your plan includes % estate%. Upgrade to add another.',
      v_slots, (case when v_slots = 1 then '' else 's' end)
      using errcode = '55001';
  end if;

  v_new_seat := v_count + 1;
  select case when v_new_seat <= s.included_estate_slots then 'plan_included' else 'estate_addon' end
  into v_source
  from public.subscriptions as s
  where s.user_id = v_actor and s.status in ('active', 'trialing')
  order by s.started_at desc
  limit 1;

  insert into public.workflows (
    user_id, name, person_name, relationship_to_deceased, trigger_type, mode, path, status, phase,
    seat_index, seat_status, entitlement_source, creation_request_id
  ) values (
    v_actor, btrim(p_person_name), btrim(p_person_name), nullif(btrim(coalesce(p_relationship, '')), ''),
    'death_confirmed', 'green', 'green', 'planning_active', 'Planning started',
    v_new_seat, 'active', coalesce(v_source, 'plan_included'), p_request_id
  ) returning * into v_existing;

  return query select v_existing.id, v_existing.seat_index, false;
end
$function$;
