create table public.authority_information_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null references public.authority_records(id) on delete restrict,
  requirement_id uuid not null references public.authority_requirements(id) on delete restrict,
  requirement_key text not null,
  message text not null check (char_length(btrim(message)) between 3 and 500),
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_by_role text not null check (requested_by_role in ('owner', 'admin', 'reviewer')),
  record_version bigint not null check (record_version > 0),
  requested_at timestamptz not null default now()
);

create index authority_information_requests_record_idx
  on public.authority_information_requests(authority_record_id, requested_at desc);
create index authority_information_requests_org_idx
  on public.authority_information_requests(organization_id, requested_at desc);
create index authority_information_requests_requirement_idx
  on public.authority_information_requests(requirement_id);
create index authority_information_requests_requested_by_idx
  on public.authority_information_requests(requested_by, requested_at desc);

create table public.authority_information_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null references public.authority_records(id) on delete restrict,
  information_request_id uuid not null unique references public.authority_information_requests(id) on delete restrict,
  invitation_id uuid not null references public.authority_participant_invitations(id) on delete restrict,
  response text not null check (char_length(btrim(response)) between 3 and 1000),
  record_version bigint not null check (record_version > 0),
  responded_at timestamptz not null default now()
);

create index authority_information_responses_record_idx
  on public.authority_information_responses(authority_record_id, responded_at desc);
create index authority_information_responses_org_idx
  on public.authority_information_responses(organization_id, responded_at desc);
create index authority_information_responses_invitation_idx
  on public.authority_information_responses(invitation_id, responded_at desc);

create or replace function authority_private.prevent_information_record_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '55000', message = 'authority_information_records_are_append_only';
end;
$$;

create trigger authority_information_requests_append_only
before update or delete on public.authority_information_requests
for each row execute function authority_private.prevent_information_record_mutation();

create trigger authority_information_responses_append_only
before update or delete on public.authority_information_responses
for each row execute function authority_private.prevent_information_record_mutation();

alter table public.authority_information_requests enable row level security;
alter table public.authority_information_requests force row level security;
alter table public.authority_information_responses enable row level security;
alter table public.authority_information_responses force row level security;

create policy authority_information_requests_organization_select
on public.authority_information_requests for select to authenticated
using ((select authority_private.has_active_membership(organization_id)));

create policy authority_information_responses_organization_select
on public.authority_information_responses for select to authenticated
using ((select authority_private.has_active_membership(organization_id)));

revoke all on public.authority_information_requests from public, anon, authenticated;
revoke all on public.authority_information_responses from public, anon, authenticated;
grant select on public.authority_information_requests to authenticated;
grant select on public.authority_information_responses to authenticated;

create or replace function authority_private.request_authority_information_service_v1(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_requirement_key text,
  p_message text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role text;
  v_record public.authority_records%rowtype;
  v_requirement public.authority_requirements%rowtype;
  v_request public.authority_information_requests%rowtype;
  v_existing authority_private.command_receipts%rowtype;
  v_message text := btrim(coalesce(p_message, ''));
  v_payload_hash text;
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
begin
  if p_actor_user_id is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  if p_idempotency_key is null then raise exception using errcode = '22023', message = 'idempotency_key_required'; end if;
  if char_length(v_message) not between 3 and 500 then raise exception using errcode = '22023', message = 'information_request_message_required'; end if;

  select m.role into v_actor_role
  from public.organization_memberships m
  join auth.users u on u.id = m.user_id and u.email_confirmed_at is not null
  where m.organization_id = p_organization_id and m.user_id = p_actor_user_id and m.status = 'active';
  if v_actor_role is null or v_actor_role not in ('owner', 'admin', 'reviewer') then
    raise exception using errcode = '42501', message = 'information_request_not_allowed';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'actor_user_id', p_actor_user_id, 'organization_id', p_organization_id,
    'authority_record_id', p_authority_record_id, 'expected_version', p_expected_version,
    'requirement_key', p_requirement_key, 'message', v_message
  ));
  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':information_request', 0));
  select * into v_existing from authority_private.command_receipts
  where actor_user_id = p_actor_user_id and command_name = 'request_authority_information'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.payload_hash <> v_payload_hash then raise exception using errcode = '22023', message = 'idempotency_payload_mismatch'; end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_record from public.authority_records
  where id = p_authority_record_id and organization_id = p_organization_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'authority_request_not_found'; end if;
  if v_record.version <> p_expected_version then raise exception using errcode = 'P0001', message = 'request_changed'; end if;
  if v_record.status <> 'under_review' then raise exception using errcode = '42501', message = 'information_request_not_available'; end if;

  select * into v_requirement from public.authority_requirements
  where authority_record_id = v_record.id and requirement_key = p_requirement_key;
  if not found then raise exception using errcode = '22023', message = 'information_request_requirement_invalid'; end if;
  if exists (
    select 1 from public.authority_information_requests q
    where q.authority_record_id = v_record.id
      and not exists (select 1 from public.authority_information_responses a where a.information_request_id = q.id)
  ) then raise exception using errcode = '22023', message = 'information_request_already_open'; end if;

  update public.authority_records set status = 'information_requested', version = version + 1, updated_at = now()
  where id = v_record.id returning * into v_record;
  insert into public.authority_information_requests (
    organization_id, authority_record_id, requirement_id, requirement_key, message,
    requested_by, requested_by_role, record_version
  ) values (
    v_record.organization_id, v_record.id, v_requirement.id, v_requirement.requirement_key, v_message,
    p_actor_user_id, v_actor_role, v_record.version
  ) returning * into v_request;

  select coalesce(max(sequence), 0) + 1 into v_event_sequence from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    'review.information_requested', p_actor_user_id, v_actor_role,
    'Institution requested more information', v_message,
    array['owner','admin','staff','reviewer','auditor','principal','representative']::text[],
    jsonb_build_object('information_request_id', v_request.id, 'requirement_key', v_request.requirement_key)
  ) returning event_id into v_event_id;
  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, p_actor_user_id, 'review.information_requested', 'authority_record', v_record.id,
    jsonb_build_object('information_request_id', v_request.id, 'requirement_key', v_request.requirement_key, 'event_id', v_event_id)
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id, 'version', v_record.version, 'status', v_record.status,
    'information_request_id', v_request.id, 'event_id', v_event_id
  );
  insert into authority_private.command_receipts (actor_user_id, command_name, idempotency_key, payload_hash, result)
  values (p_actor_user_id, 'request_authority_information', p_idempotency_key, v_payload_hash, v_result);
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.get_participant_information_request_v1(
  p_session_token text,
  p_authority_record_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_token_hash text;
  v_session authority_private.participant_sessions%rowtype;
  v_request public.authority_information_requests%rowtype;
begin
  if lower(btrim(coalesce(p_session_token, ''))) !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;
  v_token_hash := encode(extensions.digest(convert_to(lower(btrim(p_session_token)), 'UTF8'), 'sha256'), 'hex');
  select * into v_session from authority_private.participant_sessions
  where token_hash = v_token_hash and authority_record_id = p_authority_record_id
    and participant_role = 'representative' and status = 'active' and expires_at > now();
  if not found then raise exception using errcode = 'P0002', message = 'participant_session_unavailable'; end if;
  select q.* into v_request from public.authority_information_requests q
  where q.authority_record_id = p_authority_record_id
    and not exists (select 1 from public.authority_information_responses a where a.information_request_id = q.id)
  order by q.requested_at desc limit 1;
  if not found then return null; end if;
  return jsonb_build_object(
    'id', v_request.id, 'requirement_key', v_request.requirement_key,
    'message', v_request.message, 'requested_at', v_request.requested_at
  );
end;
$$;

create or replace function authority_private.respond_to_authority_information_v1(
  p_session_token text,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_response text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token_hash text;
  v_session authority_private.participant_sessions%rowtype;
  v_record public.authority_records%rowtype;
  v_request public.authority_information_requests%rowtype;
  v_receipt authority_private.participant_command_receipts%rowtype;
  v_response text := btrim(coalesce(p_response, ''));
  v_payload_hash text;
  v_response_row public.authority_information_responses%rowtype;
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null then raise exception using errcode = '22023', message = 'idempotency_key_required'; end if;
  if char_length(v_response) not between 3 and 1000 then raise exception using errcode = '22023', message = 'information_response_required'; end if;
  if lower(btrim(coalesce(p_session_token, ''))) !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;
  v_token_hash := encode(extensions.digest(convert_to(lower(btrim(p_session_token)), 'UTF8'), 'sha256'), 'hex');
  select * into v_session from authority_private.participant_sessions
  where token_hash = v_token_hash and authority_record_id = p_authority_record_id
    and participant_role = 'representative' and status = 'active' and expires_at > now();
  if not found then raise exception using errcode = 'P0002', message = 'participant_session_unavailable'; end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'authority_record_id', p_authority_record_id, 'expected_version', p_expected_version, 'response', v_response
  ));
  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':information_response', 0));
  select * into v_receipt from authority_private.participant_command_receipts
  where invitation_id = v_session.invitation_id and command_name = 'respond_to_authority_information'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.payload_hash <> v_payload_hash then raise exception using errcode = '22023', message = 'idempotency_payload_mismatch'; end if;
    return v_receipt.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_record from public.authority_records
  where id = p_authority_record_id and organization_id = v_session.organization_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'authority_request_not_found'; end if;
  if v_record.version <> p_expected_version then raise exception using errcode = 'P0001', message = 'participant_record_changed'; end if;
  if v_record.status <> 'information_requested' then raise exception using errcode = '42501', message = 'information_response_not_available'; end if;
  select q.* into v_request from public.authority_information_requests q
  where q.authority_record_id = v_record.id
    and not exists (select 1 from public.authority_information_responses a where a.information_request_id = q.id)
  order by q.requested_at desc limit 1;
  if not found then raise exception using errcode = 'P0002', message = 'information_request_unavailable'; end if;

  update public.authority_records set status = 'under_review', version = version + 1, updated_at = now()
  where id = v_record.id returning * into v_record;
  insert into public.authority_information_responses (
    organization_id, authority_record_id, information_request_id, invitation_id, response, record_version
  ) values (
    v_record.organization_id, v_record.id, v_request.id, v_session.invitation_id, v_response, v_record.version
  ) returning * into v_response_row;
  select coalesce(max(sequence), 0) + 1 into v_event_sequence from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    'review.information_resolved', null, 'representative',
    'Representative answered the information request', v_response,
    array['owner','admin','staff','reviewer','auditor','principal','representative']::text[],
    jsonb_build_object('information_request_id', v_request.id, 'information_response_id', v_response_row.id, 'requirement_key', v_request.requirement_key)
  ) returning event_id into v_event_id;
  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, null, 'review.information_resolved', 'authority_record', v_record.id,
    jsonb_build_object('information_request_id', v_request.id, 'information_response_id', v_response_row.id, 'event_id', v_event_id)
  );
  v_result := jsonb_build_object(
    'authority_record_id', v_record.id, 'version', v_record.version, 'status', v_record.status,
    'information_request_id', v_request.id, 'information_response_id', v_response_row.id, 'event_id', v_event_id
  );
  insert into authority_private.participant_command_receipts (invitation_id, command_name, idempotency_key, payload_hash, result)
  values (v_session.invitation_id, 'respond_to_authority_information', p_idempotency_key, v_payload_hash, v_result);
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.withdraw_authority_responsibility_v1(
  p_session_token text,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_reason text,
  p_acknowledged boolean,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token_hash text;
  v_session authority_private.participant_sessions%rowtype;
  v_record public.authority_records%rowtype;
  v_receipt authority_private.participant_command_receipts%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_payload_hash text;
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null then raise exception using errcode = '22023', message = 'idempotency_key_required'; end if;
  if not coalesce(p_acknowledged, false) then raise exception using errcode = '22023', message = 'withdrawal_acknowledgment_required'; end if;
  if char_length(v_reason) not between 3 and 500 then raise exception using errcode = '22023', message = 'withdrawal_reason_required'; end if;
  if lower(btrim(coalesce(p_session_token, ''))) !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;
  v_token_hash := encode(extensions.digest(convert_to(lower(btrim(p_session_token)), 'UTF8'), 'sha256'), 'hex');
  select * into v_session from authority_private.participant_sessions
  where token_hash = v_token_hash and authority_record_id = p_authority_record_id
    and participant_role = 'representative' and status = 'active' and expires_at > now();
  if not found then raise exception using errcode = 'P0002', message = 'participant_session_unavailable'; end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'authority_record_id', p_authority_record_id, 'expected_version', p_expected_version,
    'reason', v_reason, 'acknowledged', true
  ));
  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':representative_withdrawal', 0));
  select * into v_receipt from authority_private.participant_command_receipts
  where invitation_id = v_session.invitation_id and command_name = 'withdraw_authority_responsibility'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.payload_hash <> v_payload_hash then raise exception using errcode = '22023', message = 'idempotency_payload_mismatch'; end if;
    return v_receipt.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_record from public.authority_records
  where id = p_authority_record_id and organization_id = v_session.organization_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'authority_request_not_found'; end if;
  if v_record.version <> p_expected_version then raise exception using errcode = 'P0001', message = 'participant_record_changed'; end if;
  if v_record.status not in ('evidence_required','ready_to_submit','under_review','information_requested','accepted','accepted_with_limits') then
    raise exception using errcode = '42501', message = 'withdrawal_not_available';
  end if;

  update public.authority_records set status = 'withdrawn', version = version + 1, updated_at = now()
  where id = v_record.id returning * into v_record;
  select coalesce(max(sequence), 0) + 1 into v_event_sequence from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    'representative.withdrawn', null, 'representative',
    'Representative withdrew from the responsibility', v_reason,
    array['owner','admin','staff','reviewer','auditor','principal','representative']::text[],
    jsonb_build_object('reason', v_reason)
  ) returning event_id into v_event_id;
  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, null, 'representative.withdrawn', 'authority_record', v_record.id,
    jsonb_build_object('reason', v_reason, 'event_id', v_event_id)
  );
  v_result := jsonb_build_object(
    'authority_record_id', v_record.id, 'version', v_record.version, 'status', v_record.status, 'event_id', v_event_id
  );
  insert into authority_private.participant_command_receipts (invitation_id, command_name, idempotency_key, payload_hash, result)
  values (v_session.invitation_id, 'withdraw_authority_responsibility', p_idempotency_key, v_payload_hash, v_result);
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.request_authority_information_service_v1(
  p_actor_user_id uuid, p_organization_id uuid, p_authority_record_id uuid,
  p_expected_version bigint, p_requirement_key text, p_message text, p_idempotency_key uuid
)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.request_authority_information_service_v1(
  p_actor_user_id, p_organization_id, p_authority_record_id, p_expected_version,
  p_requirement_key, p_message, p_idempotency_key
); $$;

create or replace function public.get_participant_information_request_v1(p_session_token text, p_authority_record_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.get_participant_information_request_v1(p_session_token, p_authority_record_id); $$;

create or replace function public.respond_to_authority_information_v1(
  p_session_token text, p_authority_record_id uuid, p_expected_version bigint,
  p_response text, p_idempotency_key uuid
)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.respond_to_authority_information_v1(
  p_session_token, p_authority_record_id, p_expected_version, p_response, p_idempotency_key
); $$;

create or replace function public.withdraw_authority_responsibility_v1(
  p_session_token text, p_authority_record_id uuid, p_expected_version bigint,
  p_reason text, p_acknowledged boolean, p_idempotency_key uuid
)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.withdraw_authority_responsibility_v1(
  p_session_token, p_authority_record_id, p_expected_version, p_reason, p_acknowledged, p_idempotency_key
); $$;

revoke execute on function authority_private.prevent_information_record_mutation() from public, anon, authenticated;
revoke execute on function authority_private.request_authority_information_service_v1(uuid,uuid,uuid,bigint,text,text,uuid) from public, anon, authenticated;
revoke execute on function authority_private.get_participant_information_request_v1(text,uuid) from public, anon, authenticated;
revoke execute on function authority_private.respond_to_authority_information_v1(text,uuid,bigint,text,uuid) from public, anon, authenticated;
revoke execute on function authority_private.withdraw_authority_responsibility_v1(text,uuid,bigint,text,boolean,uuid) from public, anon, authenticated;
revoke execute on function public.request_authority_information_service_v1(uuid,uuid,uuid,bigint,text,text,uuid) from public, anon, authenticated;
revoke execute on function public.get_participant_information_request_v1(text,uuid) from public, anon, authenticated;
revoke execute on function public.respond_to_authority_information_v1(text,uuid,bigint,text,uuid) from public, anon, authenticated;
revoke execute on function public.withdraw_authority_responsibility_v1(text,uuid,bigint,text,boolean,uuid) from public, anon, authenticated;

grant usage on schema authority_private to service_role;
grant execute on function authority_private.request_authority_information_service_v1(uuid,uuid,uuid,bigint,text,text,uuid) to service_role;
grant execute on function authority_private.get_participant_information_request_v1(text,uuid) to service_role;
grant execute on function authority_private.respond_to_authority_information_v1(text,uuid,bigint,text,uuid) to service_role;
grant execute on function authority_private.withdraw_authority_responsibility_v1(text,uuid,bigint,text,boolean,uuid) to service_role;
grant execute on function public.request_authority_information_service_v1(uuid,uuid,uuid,bigint,text,text,uuid) to service_role;
grant execute on function public.get_participant_information_request_v1(text,uuid) to service_role;
grant execute on function public.respond_to_authority_information_v1(text,uuid,bigint,text,uuid) to service_role;
grant execute on function public.withdraw_authority_responsibility_v1(text,uuid,bigint,text,boolean,uuid) to service_role;

comment on table public.authority_information_requests is 'Append-only, requirement-linked institution requests for more information.';
comment on table public.authority_information_responses is 'Append-only representative responses that resolve an exact institution information request.';
comment on function public.withdraw_authority_responsibility_v1(text,uuid,bigint,text,boolean,uuid) is 'Server-only representative withdrawal command with role-bound session, version, acknowledgment, idempotency, and append-only event.';

notify pgrst, 'reload schema';
