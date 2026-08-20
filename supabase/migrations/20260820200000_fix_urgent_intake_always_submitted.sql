-- submit_urgent_intake_idempotent set status='self_handling' whenever
-- p_wants_callback was false, and both loadUrgentIntakeQueue (lib/urgent/hosted.ts)
-- and claim_urgent_intake_idempotent treat only status='submitted' as
-- visible/claimable by a director. The frontend (app/start/next/UrgentNextClient.tsx)
-- hardcodes wantsCallback to "false" since an earlier session removed the
-- callback UI choice -- meaning every urgent intake submission since then
-- silently became invisible to every funeral home, permanently. No director
-- could ever see or claim a real crisis submission. Found live via a
-- founder-directed critical read-through of the urgent persona pipeline,
-- 2026-08-20. Status is now always 'submitted'; wants_callback is still
-- recorded on the row for history but no longer drives claimability.
CREATE OR REPLACE FUNCTION passage_private.submit_urgent_intake_idempotent(p_situation_category text, p_person_name text, p_person_location text, p_person_timing text, p_coordinator_name text, p_coordinator_phone text, p_coordinator_email text, p_callback_notes text, p_wants_callback boolean, p_request_id uuid)
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
     or p_wants_callback is null then
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
    status, version, creation_request_id, submitted_at
  ) values (
    v_actor_user_id, p_situation_category, btrim(p_person_name), btrim(p_person_location), v_timing,
    btrim(p_coordinator_name), v_phone, v_email, v_notes, p_wants_callback,
    v_status, 1, p_request_id, pg_catalog.clock_timestamp()
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

-- Backfill the only 2 rows ever created under the broken window (both
-- 2026-08-20, both from this session's own testing, no real customer data
-- affected) so they become visible/claimable now too.
update public.urgent_intake_requests set status = 'submitted', version = version + 1, updated_at = now()
where status = 'self_handling';
