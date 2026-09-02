create table authority_private.participant_sessions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references public.authority_participant_invitations(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null references public.authority_records(id) on delete restrict,
  participant_role text not null check (participant_role in ('principal', 'representative')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index participant_sessions_record_status_idx
  on authority_private.participant_sessions(authority_record_id, status, expires_at);
create index participant_sessions_organization_id_idx
  on authority_private.participant_sessions(organization_id);

create table authority_private.participant_command_receipts (
  invitation_id uuid not null references public.authority_participant_invitations(id) on delete restrict,
  command_name text not null,
  idempotency_key uuid not null,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_at timestamptz not null default now(),
  primary key (invitation_id, command_name, idempotency_key)
);

create or replace function authority_private.preview_participant_invitation_v1(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_token text := lower(btrim(coalesce(p_token, '')));
  v_token_hash text;
  v_invitation public.authority_participant_invitations%rowtype;
  v_record public.authority_records%rowtype;
  v_organization public.organizations%rowtype;
  v_entry_status text;
begin
  if v_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'participant_invitation_unavailable';
  end if;

  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');

  select i.* into v_invitation
  from public.authority_participant_invitations i
  join authority_private.participant_invitation_secrets s on s.invitation_id = i.id
  where s.token_hash = v_token_hash;

  if not found or v_invitation.status = 'revoked' then
    raise exception using errcode = 'P0002', message = 'participant_invitation_unavailable';
  end if;

  select * into v_record
  from public.authority_records
  where id = v_invitation.authority_record_id;

  select * into v_organization
  from public.organizations
  where id = v_invitation.organization_id and status = 'active';

  if not found then
    raise exception using errcode = 'P0002', message = 'participant_invitation_unavailable';
  end if;

  v_entry_status := case
    when v_invitation.status = 'accepted' then 'already_used'
    when v_invitation.status = 'expired' or v_invitation.expires_at <= now() then 'expired'
    when v_invitation.participant_role = 'principal' and v_record.status = 'awaiting_principal' then 'ready'
    when v_invitation.participant_role = 'representative' and v_record.status = 'awaiting_principal' then 'waiting'
    when v_invitation.participant_role = 'representative' and v_record.status = 'awaiting_representative' then 'ready'
    else 'unavailable'
  end;

  if v_entry_status in ('already_used', 'unavailable') then
    return jsonb_build_object('entry_status', v_entry_status);
  end if;

  return jsonb_build_object(
    'entry_status', v_entry_status,
    'institution_name', v_organization.display_name,
    'reference_code', v_record.reference_code,
    'participant_role', v_invitation.participant_role,
    'participant_name', case when v_invitation.participant_role = 'principal' then v_record.principal_name else v_record.representative_name end,
    'other_person_name', case when v_invitation.participant_role = 'principal' then v_record.representative_name else v_record.principal_name end,
    'purpose', v_record.purpose,
    'account_boundary', v_record.account_boundary,
    'allowed_action_keys', to_jsonb(v_record.allowed_action_keys),
    'valid_until', v_record.valid_until,
    'invitation_expires_at', v_invitation.expires_at
  );
end;
$$;

create or replace function authority_private.exchange_participant_invitation_v1(
  p_token text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := lower(btrim(coalesce(p_token, '')));
  v_token_hash text;
  v_invitation_id uuid;
  v_invitation public.authority_participant_invitations%rowtype;
  v_record public.authority_records%rowtype;
  v_receipt authority_private.participant_command_receipts%rowtype;
  v_payload_hash text;
  v_session_token text;
  v_session_hash text;
  v_session authority_private.participant_sessions%rowtype;
  v_session_expires_at timestamptz;
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if v_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'participant_invitation_unavailable';
  end if;

  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');

  select s.invitation_id into v_invitation_id
  from authority_private.participant_invitation_secrets s
  where s.token_hash = v_token_hash;

  if not found then
    raise exception using errcode = 'P0002', message = 'participant_invitation_unavailable';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_invitation_id::text || ':participant_exchange', 0));

  select * into v_invitation
  from public.authority_participant_invitations
  where id = v_invitation_id;

  select * into v_record
  from public.authority_records
  where id = v_invitation.authority_record_id
  for update;

  select * into v_invitation
  from public.authority_participant_invitations
  where id = v_invitation_id
  for update;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'invitation_id', v_invitation.id,
    'authority_record_id', v_invitation.authority_record_id,
    'participant_role', v_invitation.participant_role
  ));

  v_session_token := encode(extensions.digest(convert_to(
    v_token || ':' || p_idempotency_key::text || ':' || v_invitation.id::text,
    'UTF8'
  ), 'sha256'), 'hex');
  v_session_hash := encode(extensions.digest(convert_to(v_session_token, 'UTF8'), 'sha256'), 'hex');

  select * into v_receipt
  from authority_private.participant_command_receipts
  where invitation_id = v_invitation.id
    and command_name = 'exchange_participant_invitation'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_receipt.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    select * into v_session
    from authority_private.participant_sessions
    where invitation_id = v_invitation.id
      and token_hash = v_session_hash
      and status = 'active'
      and expires_at > now();
    if not found then
      raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
    end if;
    return v_receipt.result || jsonb_build_object('replayed', true, 'session_token', v_session_token);
  end if;

  if v_invitation.status = 'accepted' then
    raise exception using errcode = '22023', message = 'participant_invitation_already_used';
  end if;
  if v_invitation.status = 'revoked' then
    raise exception using errcode = 'P0002', message = 'participant_invitation_unavailable';
  end if;
  if v_invitation.status = 'expired' or v_invitation.expires_at <= now() then
    raise exception using errcode = '22023', message = 'participant_invitation_expired';
  end if;
  if v_invitation.status <> 'pending' then
    raise exception using errcode = 'P0002', message = 'participant_invitation_unavailable';
  end if;

  if v_invitation.participant_role = 'principal' and v_record.status <> 'awaiting_principal' then
    raise exception using errcode = '22023', message = 'participant_invitation_not_ready';
  end if;
  if v_invitation.participant_role = 'representative' and v_record.status <> 'awaiting_representative' then
    raise exception using errcode = '22023', message = 'participant_invitation_not_ready';
  end if;

  v_session_expires_at := least(v_invitation.expires_at, now() + interval '30 minutes');

  update public.authority_participant_invitations
  set status = 'accepted', accepted_at = now(), version = version + 1, updated_at = now()
  where id = v_invitation.id
  returning * into v_invitation;

  insert into authority_private.participant_sessions (
    invitation_id, organization_id, authority_record_id, participant_role,
    token_hash, status, expires_at
  ) values (
    v_invitation.id, v_invitation.organization_id, v_invitation.authority_record_id,
    v_invitation.participant_role, v_session_hash, 'active', v_session_expires_at
  ) returning * into v_session;

  select coalesce(max(sequence), 0) + 1 into v_event_sequence
  from public.authority_events
  where authority_record_id = v_record.id;

  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    'participant.access_established', null, v_invitation.participant_role,
    case when v_invitation.participant_role = 'principal' then 'Person granting authority opened secure access' else 'Representative opened secure access' end,
    'A role-bound participant session was established from a valid one-time invitation.',
    array['owner', 'admin', 'staff', 'reviewer', 'auditor', v_invitation.participant_role]::text[],
    jsonb_build_object('invitation_id', v_invitation.id, 'session_expires_at', v_session_expires_at)
  ) returning event_id into v_event_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, null, 'participant.access_established',
    'authority_record', v_record.id,
    jsonb_build_object('participant_role', v_invitation.participant_role, 'invitation_id', v_invitation.id)
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'participant_role', v_invitation.participant_role,
    'session_expires_at', v_session_expires_at,
    'event_id', v_event_id
  );

  insert into authority_private.participant_command_receipts (
    invitation_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_invitation.id, 'exchange_participant_invitation', p_idempotency_key,
    v_payload_hash, v_result
  );

  return v_result || jsonb_build_object('replayed', false, 'session_token', v_session_token);
end;
$$;

create or replace function authority_private.get_participant_session_context_v1(
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
  v_token text := lower(btrim(coalesce(p_session_token, '')));
  v_token_hash text;
  v_session authority_private.participant_sessions%rowtype;
  v_record public.authority_records%rowtype;
  v_organization public.organizations%rowtype;
begin
  if v_token !~ '^[0-9a-f]{64}$' or p_authority_record_id is null then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');

  select * into v_session
  from authority_private.participant_sessions
  where token_hash = v_token_hash
    and authority_record_id = p_authority_record_id
    and status = 'active'
    and expires_at > now();

  if not found then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  select * into v_record from public.authority_records where id = v_session.authority_record_id;
  select * into v_organization from public.organizations where id = v_session.organization_id and status = 'active';

  if not found then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  return jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'institution_name', v_organization.display_name,
    'participant_role', v_session.participant_role,
    'participant_name', case when v_session.participant_role = 'principal' then v_record.principal_name else v_record.representative_name end,
    'other_person_name', case when v_session.participant_role = 'principal' then v_record.representative_name else v_record.principal_name end,
    'status', v_record.status,
    'purpose', v_record.purpose,
    'account_boundary', v_record.account_boundary,
    'allowed_action_keys', to_jsonb(v_record.allowed_action_keys),
    'prohibited_action_keys', to_jsonb(v_record.prohibited_action_keys),
    'valid_until', v_record.valid_until,
    'session_expires_at', v_session.expires_at
  );
end;
$$;

create or replace function public.preview_participant_invitation_v1(p_token text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.preview_participant_invitation_v1(p_token);
$$;

create or replace function public.exchange_participant_invitation_v1(
  p_token text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.exchange_participant_invitation_v1(p_token, p_idempotency_key);
$$;

create or replace function public.get_participant_session_context_v1(
  p_session_token text,
  p_authority_record_id uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.get_participant_session_context_v1(p_session_token, p_authority_record_id);
$$;

revoke all on authority_private.participant_sessions from public, anon, authenticated;
revoke all on authority_private.participant_command_receipts from public, anon, authenticated;

revoke execute on function authority_private.preview_participant_invitation_v1(text) from public, anon, authenticated;
revoke execute on function authority_private.exchange_participant_invitation_v1(text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.get_participant_session_context_v1(text, uuid) from public, anon, authenticated;
revoke execute on function public.preview_participant_invitation_v1(text) from public, anon, authenticated;
revoke execute on function public.exchange_participant_invitation_v1(text, uuid) from public, anon, authenticated;
revoke execute on function public.get_participant_session_context_v1(text, uuid) from public, anon, authenticated;

grant execute on function authority_private.preview_participant_invitation_v1(text) to anon, authenticated;
grant execute on function authority_private.exchange_participant_invitation_v1(text, uuid) to anon, authenticated;
grant execute on function authority_private.get_participant_session_context_v1(text, uuid) to anon, authenticated;
grant execute on function public.preview_participant_invitation_v1(text) to anon, authenticated;
grant execute on function public.exchange_participant_invitation_v1(text, uuid) to anon, authenticated;
grant execute on function public.get_participant_session_context_v1(text, uuid) to anon, authenticated;

comment on table authority_private.participant_sessions is 'Non-exposed, hashed, record-bound participant browser sessions.';
comment on table authority_private.participant_command_receipts is 'Non-exposed idempotency receipts for participant commands.';
