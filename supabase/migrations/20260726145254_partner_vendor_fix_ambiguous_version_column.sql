-- Bug fix found during live hosted QA: all three UPDATE-based RPCs declare
-- `returns table (partner_request_id uuid, status text, version integer, replayed boolean)`,
-- which implicitly creates a PL/pgSQL variable named `version` in scope. The
-- bare expression `version + 1` inside `update public.partner_requests set
-- version = version + 1, ...` is therefore ambiguous between that OUT
-- variable and the table column, and Postgres rejects it with 42702 at
-- runtime (only surfaced once a real call was attempted -- CREATE OR REPLACE
-- FUNCTION does not catch this since the SQL is only parsed/planned when
-- executed, not at function-definition time). Fixed by aliasing the updated
-- table and qualifying the column reference in the SET clause.

create or replace function passage_private.respond_to_partner_request_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_decision text,
  p_quote_amount_cents integer,
  p_note text,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_partner_member public.partner_members%rowtype;
  v_request public.partner_requests%rowtype;
  v_existing_event public.partner_request_events%rowtype;
  v_key text;
  v_next_status text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_partner_request_id is null or p_request_id is null
     or p_expected_version is null or p_expected_version < 1
     or p_decision is null or p_decision not in ('accept', 'decline')
     or (p_decision = 'accept' and (p_quote_amount_cents is null or p_quote_amount_cents < 0))
     or (p_decision = 'decline' and (v_note is null or length(v_note) > 500)) then
    raise exception 'Valid response and version are required' using errcode = '22023';
  end if;

  select r.* into v_request from public.partner_requests as r where r.id = p_partner_request_id for update;
  if v_request.id is null then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;

  select pm.* into v_partner_member from public.partner_members as pm
  where pm.partner_organization_id = v_request.partner_organization_id
    and pm.user_id = v_actor_user_id and pm.status = 'active';
  if v_partner_member.id is null then
    raise exception 'Vendor authority for this request is required' using errcode = '42501';
  end if;

  v_key := 'partner_request_respond:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_request.organization_id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.partner_request_events as e
  where e.organization_id = v_request.organization_id and e.idempotency_key = v_key;
  if found then
    return query select v_request.id, v_existing_event.next_state, (v_existing_event.metadata ->> 'version')::integer, true;
    return;
  end if;

  if v_request.version <> p_expected_version then
    raise exception 'Request changed before your response was saved' using errcode = '40001';
  end if;
  if v_request.status <> 'sent' then
    raise exception 'This request is no longer waiting for a response' using errcode = '55000';
  end if;

  v_next_status := case when p_decision = 'accept' then 'in_progress' else 'declined' end;

  update public.partner_requests as pr set
    status = v_next_status,
    version = pr.version + 1,
    quote_amount_cents = case when p_decision = 'accept' then p_quote_amount_cents else pr.quote_amount_cents end,
    response_note = case when p_decision = 'accept' then v_note else pr.response_note end,
    decline_reason = case when p_decision = 'decline' then v_note else pr.decline_reason end,
    responded_at = pg_catalog.clock_timestamp(),
    started_at = case when p_decision = 'accept' then pg_catalog.clock_timestamp() else pr.started_at end,
    updated_at = pg_catalog.clock_timestamp()
  where pr.id = v_request.id;

  insert into public.partner_request_events (
    partner_request_id, organization_id, partner_organization_id,
    actor_user_id, actor_partner_member_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_request.id, v_request.organization_id, v_request.partner_organization_id,
    v_actor_user_id, v_partner_member.id,
    case when p_decision = 'accept' then 'partner_request.accepted' else 'partner_request.declined' end,
    'sent', v_next_status, v_key,
    pg_catalog.jsonb_build_object('version', v_request.version + 1, 'quote_amount_cents', p_quote_amount_cents, 'note', coalesce(v_note, ''))
  );

  return query select v_request.id, v_next_status, v_request.version + 1, false;
end
$function$;

create or replace function passage_private.submit_partner_request_proof_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_proof_summary text,
  p_proof_reference text,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_partner_member public.partner_members%rowtype;
  v_request public.partner_requests%rowtype;
  v_existing_event public.partner_request_events%rowtype;
  v_key text;
  v_reference text := nullif(btrim(coalesce(p_proof_reference, '')), '');
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_partner_request_id is null or p_request_id is null or p_expected_version is null or p_expected_version < 1
     or length(btrim(coalesce(p_proof_summary, ''))) not between 1 and 2000
     or (v_reference is not null and length(v_reference) > 240) then
    raise exception 'Valid proof and version are required' using errcode = '22023';
  end if;

  select r.* into v_request from public.partner_requests as r where r.id = p_partner_request_id for update;
  if v_request.id is null then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;

  select pm.* into v_partner_member from public.partner_members as pm
  where pm.partner_organization_id = v_request.partner_organization_id
    and pm.user_id = v_actor_user_id and pm.status = 'active';
  if v_partner_member.id is null then
    raise exception 'Vendor authority for this request is required' using errcode = '42501';
  end if;

  v_key := 'partner_request_proof:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_request.organization_id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.partner_request_events as e
  where e.organization_id = v_request.organization_id and e.idempotency_key = v_key;
  if found then
    return query select v_request.id, v_existing_event.next_state, (v_existing_event.metadata ->> 'version')::integer, true;
    return;
  end if;

  if v_request.version <> p_expected_version then
    raise exception 'Work changed before proof was saved' using errcode = '40001';
  end if;
  if v_request.status <> 'in_progress' then
    raise exception 'Only in-progress work can receive proof' using errcode = '55000';
  end if;

  update public.partner_requests as pr set
    status = 'proof_submitted',
    version = pr.version + 1,
    proof_summary = btrim(p_proof_summary),
    proof_reference = v_reference,
    proof_submitted_by_partner_member_id = v_partner_member.id,
    proof_submitted_at = pg_catalog.clock_timestamp(),
    updated_at = pg_catalog.clock_timestamp()
  where pr.id = v_request.id;

  insert into public.partner_request_events (
    partner_request_id, organization_id, partner_organization_id,
    actor_user_id, actor_partner_member_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_request.id, v_request.organization_id, v_request.partner_organization_id,
    v_actor_user_id, v_partner_member.id, 'partner_request.proof_submitted',
    'in_progress', 'proof_submitted', v_key,
    pg_catalog.jsonb_build_object('version', v_request.version + 1)
  );

  return query select v_request.id, 'proof_submitted'::text, v_request.version + 1, false;
end
$function$;

create or replace function passage_private.verify_partner_request_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_request public.partner_requests%rowtype;
  v_existing_event public.partner_request_events%rowtype;
  v_key text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_partner_request_id is null or p_request_id is null or p_expected_version is null or p_expected_version < 1 then
    raise exception 'Valid request and version are required' using errcode = '22023';
  end if;

  select r.* into v_request from public.partner_requests as r where r.id = p_partner_request_id for update;
  if v_request.id is null then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;
  if not passage_private.can_manage_location(v_request.organization_id, v_request.organization_location_id) then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;
  v_actor_member_id := passage_private.current_active_member_id(v_request.organization_id);
  if v_actor_member_id is null then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;

  v_key := 'partner_request_verify:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_request.organization_id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.partner_request_events as e
  where e.organization_id = v_request.organization_id and e.idempotency_key = v_key;
  if found then
    return query select v_request.id, v_existing_event.next_state, (v_existing_event.metadata ->> 'version')::integer, true;
    return;
  end if;

  if v_request.version <> p_expected_version then
    raise exception 'Request changed before it was verified' using errcode = '40001';
  end if;
  if v_request.status <> 'proof_submitted' then
    raise exception 'No proof is waiting for review' using errcode = '55000';
  end if;

  update public.partner_requests as pr set
    status = 'verified', version = pr.version + 1, verified_at = pg_catalog.clock_timestamp(), updated_at = pg_catalog.clock_timestamp()
  where pr.id = v_request.id;

  insert into public.partner_request_events (
    partner_request_id, organization_id, partner_organization_id,
    actor_user_id, actor_organization_member_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_request.id, v_request.organization_id, v_request.partner_organization_id,
    v_actor_user_id, v_actor_member_id, 'partner_request.verified',
    'proof_submitted', 'verified', v_key, pg_catalog.jsonb_build_object('version', v_request.version + 1)
  );

  return query select v_request.id, 'verified'::text, v_request.version + 1, false;
end
$function$;

grant execute on function passage_private.respond_to_partner_request_idempotent(uuid, integer, text, integer, text, uuid) to authenticated;
grant execute on function passage_private.submit_partner_request_proof_idempotent(uuid, integer, text, text, uuid) to authenticated;
grant execute on function passage_private.verify_partner_request_idempotent(uuid, integer, uuid) to authenticated;
