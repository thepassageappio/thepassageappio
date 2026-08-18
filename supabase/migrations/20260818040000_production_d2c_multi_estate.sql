-- D2C multi-estate provisioning.
--
-- Problem, confirmed by reading provisionD2cFamilyRecordIfNeeded end to end:
-- /pricing sells Individual (1 estate), Couple (2 estates), and Family
-- (5 estates), but the auto-provisioning webhook creates exactly one
-- `workflows` row per subscriber no matter which plan was bought. There is
-- no code path anywhere that creates a second, third, fourth, or fifth
-- estate. The Estate Add-On Stripe price is billable but nothing in Supabase
-- tracks how many slots a subscription actually includes or has purchased.
--
-- Fix: track included/additional estate slots on `subscriptions` (mirroring
-- organizations.included_location_slots' existing pattern for the B2B side),
-- and add an idempotent, gated estate-creation RPC. `workflows` already has
-- seat_index/seat_status/entitlement_source columns from an earlier schema
-- pass that anticipated exactly this and were never wired up -- reused here
-- rather than inventing parallel columns.
--
-- Ownership model (deliberately not changed here): one workflow keeps
-- exactly one owning user_id, no co-ownership. A "Couple"/"Family" plan
-- means the purchasing account can create up to N separate estates (each
-- for a different person being planned for), not that a second person
-- becomes a co-owner of the same estate -- that remains the existing
-- read-only estate_access/case_family_invitations participant model. This
-- was a real design decision, made from the pricing copy itself ("Family --
-- for families coordinating care across several loved ones"), not assumed.

alter table public.subscriptions
  add column if not exists included_estate_slots integer not null default 1,
  add column if not exists additional_estate_slots integer not null default 0;

alter table public.subscriptions
  add constraint subscriptions_included_estate_slots_check check (included_estate_slots >= 0),
  add constraint subscriptions_additional_estate_slots_check check (additional_estate_slots >= 0);

alter table public.workflows
  add column if not exists creation_request_id uuid;

create unique index if not exists workflows_user_creation_request_unique
  on public.workflows (user_id, creation_request_id)
  where creation_request_id is not null and user_id is not null;

-- One subscription per active D2C user is the existing assumption throughout
-- this codebase (app/account/billing/actions.ts already selects exactly one
-- active/trialing row per user_id) -- reused here, not a new assumption.
create or replace function passage_private.active_estate_slots(p_user_id uuid)
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
      where s.user_id = p_user_id and s.status in ('active', 'trialing')
      order by s.started_at desc
      limit 1
    ),
    1
  )
$function$;

revoke all on function passage_private.active_estate_slots(uuid) from public, anon, authenticated;
grant execute on function passage_private.active_estate_slots(uuid) to authenticated;

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
  select passage_private.active_estate_slots(v_actor) into v_slots;
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

create or replace function public.create_additional_estate_idempotent(
  p_person_name text, p_relationship text, p_request_id uuid
)
returns table (workflow_id uuid, seat_index integer, replayed boolean)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.create_additional_estate_idempotent(p_person_name, p_relationship, p_request_id)
$function$;

revoke all on function passage_private.create_additional_estate_idempotent(text, text, uuid) from public, anon, authenticated, service_role;
grant execute on function passage_private.create_additional_estate_idempotent(text, text, uuid) to authenticated;

revoke all on function public.create_additional_estate_idempotent(text, text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.create_additional_estate_idempotent(text, text, uuid) to authenticated;

-- Backfill: existing D2C subscribers' single provisioned workflow becomes
-- seat 1 with the correct included-slot count for their actual plan, so the
-- new gating function has accurate state for accounts that predate this
-- migration instead of silently defaulting everyone to 1 included slot.
update public.subscriptions
set included_estate_slots = case
  when plan like 'couple_%' then 2
  when plan like 'family_%' then 5
  else 1
end
where included_estate_slots = 1;

update public.workflows as w
set seat_index = 1, entitlement_source = coalesce(w.entitlement_source, 'plan_included')
where w.seat_index is null
  and w.user_id is not null
  and w.organization_id is null;
