-- Adds honest, buildable-today location matching for the director's urgent
-- queue: city/state (no street address, no geocoding -- that's not what's
-- collected) so requests can be sorted same-city/same-state-first instead
-- of a fully unordered global queue where any org anywhere sees every
-- family's request with equal weight.
alter table public.urgent_intake_requests
  add column if not exists person_city text,
  add column if not exists person_state text;

CREATE OR REPLACE FUNCTION passage_private.submit_urgent_intake_idempotent(
  p_situation_category text, p_person_name text, p_person_location text, p_person_timing text,
  p_coordinator_name text, p_coordinator_phone text, p_coordinator_email text, p_callback_notes text,
  p_wants_callback boolean, p_request_id uuid, p_person_city text default null, p_person_state text default null
)
 RETURNS TABLE(urgent_intake_request_id uuid, status text, version integer, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_existing public.urgent_intake_requests%rowtype;
  v_new_id uuid;
  v_status text;
  v_timing text := nullif(btrim(coalesce(p_person_timing, '')), '');
  v_phone text := nullif(btrim(coalesce(p_coordinator_phone, '')), '');
  v_email text := nullif(btrim(coalesce(p_coordinator_email, '')), '');
  v_notes text := nullif(btrim(coalesce(p_callback_notes, '')), '');
  v_city text := nullif(btrim(coalesce(p_person_city, '')), '');
  v_state text := nullif(btrim(coalesce(p_person_state, '')), '');
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_request_id is null
     or p_situation_category is null or p_situation_category not in ('home_unexpected', 'hospice', 'hospital', 'care_facility', 'already_handled', 'other')
     or length(btrim(coalesce(p_person_name, ''))) not between 1 and 200
     or length(btrim(coalesce(p_person_location, ''))) not between 1 and 300
     or length(btrim(coalesce(p_coordinator_name, ''))) not between 1 and 200
     or (v_phone is null and v_email is null)
     or p_wants_callback is null
     or (v_city is not null and length(v_city) > 100)
     or (v_state is not null and length(v_state) > 56) then
    raise exception 'Valid situation and contact details are required' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_actor_user_id::text || ':urgent_intake_create:' || p_request_id::text, 0)
  );

  select r.* into v_existing from public.urgent_intake_requests as r
  where r.requester_user_id = v_actor_user_id and r.creation_request_id = p_request_id;
  if found then
    if v_existing.situation_category is distinct from p_situation_category
       or v_existing.person_name is distinct from btrim(p_person_name)
       or v_existing.coordinator_name is distinct from btrim(p_coordinator_name) then
      raise exception 'Request conflicts with an earlier command' using errcode = '22023';
    end if;
    return query select v_existing.id, v_existing.status, v_existing.version, true;
    return;
  end if;

  v_status := 'submitted';

  insert into public.urgent_intake_requests (
    requester_user_id, situation_category, person_name, person_location, person_timing,
    coordinator_name, coordinator_phone, coordinator_email, callback_notes, wants_callback,
    status, version, creation_request_id, submitted_at, person_city, person_state
  ) values (
    v_actor_user_id, p_situation_category, btrim(p_person_name), btrim(p_person_location), v_timing,
    btrim(p_coordinator_name), v_phone, v_email, v_notes, p_wants_callback,
    v_status, 1, p_request_id, pg_catalog.clock_timestamp(), v_city, v_state
  ) returning id into v_new_id;

  insert into public.urgent_intake_events (
    urgent_intake_request_id, actor_user_id, name, previous_state, next_state, idempotency_key, metadata
  ) values (
    v_new_id, v_actor_user_id, 'urgent_intake.submitted', null, v_status,
    'urgent_intake_create:' || p_request_id::text,
    pg_catalog.jsonb_build_object('situation_category', p_situation_category, 'wants_callback', p_wants_callback)
  );

  return query select v_new_id, v_status, 1, false;
end
$function$;

grant execute on function passage_private.submit_urgent_intake_idempotent(text,text,text,text,text,text,text,text,boolean,uuid,text,text) to authenticated;

CREATE OR REPLACE FUNCTION public.submit_urgent_intake_idempotent(
  p_situation_category text, p_person_name text, p_person_location text, p_person_timing text,
  p_coordinator_name text, p_coordinator_phone text, p_coordinator_email text, p_callback_notes text,
  p_wants_callback boolean, p_request_id uuid, p_person_city text default null, p_person_state text default null
)
 RETURNS TABLE(urgent_intake_request_id uuid, status text, version integer, replayed boolean)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select * from passage_private.submit_urgent_intake_idempotent(
    p_situation_category, p_person_name, p_person_location, p_person_timing,
    p_coordinator_name, p_coordinator_phone, p_coordinator_email, p_callback_notes,
    p_wants_callback, p_request_id, p_person_city, p_person_state
  )
$function$;

grant execute on function public.submit_urgent_intake_idempotent(text,text,text,text,text,text,text,text,boolean,uuid,text,text) to authenticated;
