alter table authority_private.notification_outbox
  add column provider text check (provider is null or provider in ('resend')),
  add column provider_message_id text,
  add column last_attempt_at timestamptz;

create unique index notification_outbox_provider_message_idx
  on authority_private.notification_outbox(provider, provider_message_id)
  where provider_message_id is not null;

create or replace function authority_private.record_operator_participant_delivery_v1(
  p_organization_id uuid,
  p_invitation_id uuid,
  p_expected_invitation_version bigint,
  p_delivery_status text,
  p_provider text,
  p_provider_message_id text,
  p_error_code text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_actor_role text;
  v_invitation public.authority_participant_invitations%rowtype;
  v_record public.authority_records%rowtype;
  v_outbox authority_private.notification_outbox%rowtype;
  v_receipt authority_private.command_receipts%rowtype;
  v_payload_hash text;
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if p_delivery_status not in ('delivered', 'failed') or p_provider <> 'resend' then
    raise exception using errcode = '22023', message = 'participant_delivery_result_invalid';
  end if;
  if p_delivery_status = 'delivered' and nullif(btrim(coalesce(p_provider_message_id, '')), '') is null then
    raise exception using errcode = '22023', message = 'participant_delivery_result_invalid';
  end if;
  if p_delivery_status = 'failed' and nullif(btrim(coalesce(p_error_code, '')), '') is null then
    raise exception using errcode = '22023', message = 'participant_delivery_result_invalid';
  end if;

  v_actor_role := authority_private.assert_authority_record_operator(p_organization_id);
  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'invitation_id', p_invitation_id,
    'expected_invitation_version', p_expected_invitation_version,
    'delivery_status', p_delivery_status,
    'provider', p_provider,
    'provider_message_id', nullif(btrim(coalesce(p_provider_message_id, '')), ''),
    'error_code', nullif(btrim(coalesce(p_error_code, '')), '')
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_invitation_id::text || ':delivery', 0));

  select * into v_receipt
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'record_operator_participant_delivery'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_receipt.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_invitation
  from public.authority_participant_invitations
  where id = p_invitation_id and organization_id = p_organization_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_invitation_unavailable';
  end if;

  select * into v_record
  from public.authority_records
  where id = v_invitation.authority_record_id
  for update;

  select * into v_invitation
  from public.authority_participant_invitations
  where id = p_invitation_id and organization_id = p_organization_id
  for update;
  if v_invitation.version <> p_expected_invitation_version then
    raise exception using errcode = 'P0001', message = 'participant_invitation_changed';
  end if;

  select * into v_outbox
  from authority_private.notification_outbox
  where invitation_id = v_invitation.id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_notification_unavailable';
  end if;

  update authority_private.notification_outbox
  set status = p_delivery_status,
      attempts = attempts + 1,
      provider = p_provider,
      provider_message_id = case when p_delivery_status = 'delivered' then btrim(p_provider_message_id) else null end,
      last_error_code = case when p_delivery_status = 'failed' then btrim(p_error_code) else null end,
      next_attempt_at = case when p_delivery_status = 'failed' then now() + interval '5 minutes' else null end,
      delivered_at = case when p_delivery_status = 'delivered' then now() else null end,
      last_attempt_at = now(),
      updated_at = now()
  where id = v_outbox.id
  returning * into v_outbox;

  select coalesce(max(sequence), 0) + 1 into v_event_sequence
  from public.authority_events where authority_record_id = v_record.id;

  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    case when p_delivery_status = 'delivered' then 'participant.invitation_delivered' else 'participant.invitation_delivery_failed' end,
    v_actor, v_actor_role,
    case when p_delivery_status = 'delivered' then 'Secure participant invitation delivered' else 'Secure participant invitation needs attention' end,
    case when p_delivery_status = 'delivered' then 'The email provider accepted the secure invitation.' else 'The provider did not accept the invitation. The request remains available for a safe resend.' end,
    array['owner', 'admin', 'staff', 'reviewer', 'auditor']::text[],
    jsonb_build_object('invitation_id', v_invitation.id, 'participant_role', v_invitation.participant_role, 'delivery_status', p_delivery_status, 'attempts', v_outbox.attempts)
  ) returning event_id into v_event_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, v_actor,
    case when p_delivery_status = 'delivered' then 'participant.invitation_delivered' else 'participant.invitation_delivery_failed' end,
    'authority_record', v_record.id,
    jsonb_build_object('invitation_id', v_invitation.id, 'participant_role', v_invitation.participant_role, 'delivery_status', p_delivery_status, 'event_id', v_event_id)
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'invitation_id', v_invitation.id,
    'participant_role', v_invitation.participant_role,
    'delivery_status', v_outbox.status,
    'attempts', v_outbox.attempts,
    'event_id', v_event_id
  );
  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'record_operator_participant_delivery', p_idempotency_key, v_payload_hash, v_result
  );
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.get_released_representative_delivery_context_v1(
  p_session_token text,
  p_authority_record_id uuid,
  p_invitation_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_token text := lower(btrim(coalesce(p_session_token, '')));
  v_session authority_private.participant_sessions%rowtype;
  v_record public.authority_records%rowtype;
  v_invitation public.authority_participant_invitations%rowtype;
  v_organization public.organizations%rowtype;
begin
  if v_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  select * into v_session
  from authority_private.participant_sessions
  where token_hash = encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex')
    and authority_record_id = p_authority_record_id
    and participant_role = 'principal'
    and status = 'active'
    and expires_at > now();
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  select * into v_record from public.authority_records where id = p_authority_record_id;
  select * into v_invitation
  from public.authority_participant_invitations
  where id = p_invitation_id
    and authority_record_id = p_authority_record_id
    and participant_role = 'representative'
    and status = 'pending'
    and expires_at > now();
  if not found or v_record.status <> 'awaiting_representative' then
    raise exception using errcode = 'P0002', message = 'participant_notification_unavailable';
  end if;
  select * into v_organization from public.organizations where id = v_record.organization_id and status = 'active';
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_notification_unavailable';
  end if;

  return jsonb_build_object(
    'invitation_id', v_invitation.id,
    'invitation_version', v_invitation.version,
    'email', v_invitation.email_normalized,
    'participant_role', v_invitation.participant_role,
    'participant_name', v_record.representative_name,
    'other_person_name', v_record.principal_name,
    'institution_name', v_organization.display_name,
    'purpose', v_record.purpose,
    'account_boundary', v_record.account_boundary,
    'expires_at', v_invitation.expires_at
  );
end;
$$;

create or replace function authority_private.record_representative_delivery_v1(
  p_session_token text,
  p_authority_record_id uuid,
  p_invitation_id uuid,
  p_expected_invitation_version bigint,
  p_delivery_status text,
  p_provider text,
  p_provider_message_id text,
  p_error_code text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := lower(btrim(coalesce(p_session_token, '')));
  v_session authority_private.participant_sessions%rowtype;
  v_record public.authority_records%rowtype;
  v_invitation public.authority_participant_invitations%rowtype;
  v_outbox authority_private.notification_outbox%rowtype;
  v_receipt authority_private.participant_command_receipts%rowtype;
  v_payload_hash text;
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null or v_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;
  if p_delivery_status not in ('delivered', 'failed') or p_provider <> 'resend' then
    raise exception using errcode = '22023', message = 'participant_delivery_result_invalid';
  end if;
  if p_delivery_status = 'delivered' and nullif(btrim(coalesce(p_provider_message_id, '')), '') is null then
    raise exception using errcode = '22023', message = 'participant_delivery_result_invalid';
  end if;
  if p_delivery_status = 'failed' and nullif(btrim(coalesce(p_error_code, '')), '') is null then
    raise exception using errcode = '22023', message = 'participant_delivery_result_invalid';
  end if;

  select * into v_session
  from authority_private.participant_sessions
  where token_hash = encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex')
    and authority_record_id = p_authority_record_id
    and participant_role = 'principal';
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'authority_record_id', p_authority_record_id,
    'invitation_id', p_invitation_id,
    'expected_invitation_version', p_expected_invitation_version,
    'delivery_status', p_delivery_status,
    'provider', p_provider,
    'provider_message_id', nullif(btrim(coalesce(p_provider_message_id, '')), ''),
    'error_code', nullif(btrim(coalesce(p_error_code, '')), '')
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_invitation_id::text || ':delivery', 0));

  select * into v_receipt
  from authority_private.participant_command_receipts
  where invitation_id = v_session.invitation_id
    and command_name = 'record_representative_delivery'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_receipt.result || jsonb_build_object('replayed', true);
  end if;

  if v_session.status <> 'active' or v_session.expires_at <= now() then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  select * into v_record from public.authority_records where id = p_authority_record_id for update;
  select * into v_invitation
  from public.authority_participant_invitations
  where id = p_invitation_id
    and authority_record_id = p_authority_record_id
    and participant_role = 'representative'
  for update;
  if not found or v_record.status <> 'awaiting_representative' then
    raise exception using errcode = 'P0002', message = 'participant_notification_unavailable';
  end if;
  if v_invitation.version <> p_expected_invitation_version then
    raise exception using errcode = 'P0001', message = 'participant_invitation_changed';
  end if;

  select * into v_outbox from authority_private.notification_outbox where invitation_id = v_invitation.id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_notification_unavailable';
  end if;

  update authority_private.notification_outbox
  set status = p_delivery_status,
      attempts = attempts + 1,
      provider = p_provider,
      provider_message_id = case when p_delivery_status = 'delivered' then btrim(p_provider_message_id) else null end,
      last_error_code = case when p_delivery_status = 'failed' then btrim(p_error_code) else null end,
      next_attempt_at = case when p_delivery_status = 'failed' then now() + interval '5 minutes' else null end,
      delivered_at = case when p_delivery_status = 'delivered' then now() else null end,
      last_attempt_at = now(), updated_at = now()
  where id = v_outbox.id
  returning * into v_outbox;

  select coalesce(max(sequence), 0) + 1 into v_event_sequence
  from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    case when p_delivery_status = 'delivered' then 'participant.invitation_delivered' else 'participant.invitation_delivery_failed' end,
    null, 'principal',
    case when p_delivery_status = 'delivered' then 'Representative invitation delivered' else 'Representative invitation needs attention' end,
    case when p_delivery_status = 'delivered' then 'The email provider accepted the representative invitation.' else 'The provider did not accept the invitation. The institution can send a fresh link.' end,
    array['owner', 'admin', 'staff', 'reviewer', 'auditor', 'principal']::text[],
    jsonb_build_object('invitation_id', v_invitation.id, 'participant_role', 'representative', 'delivery_status', p_delivery_status, 'attempts', v_outbox.attempts)
  ) returning event_id into v_event_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, null,
    case when p_delivery_status = 'delivered' then 'participant.invitation_delivered' else 'participant.invitation_delivery_failed' end,
    'authority_record', v_record.id,
    jsonb_build_object('invitation_id', v_invitation.id, 'participant_role', 'representative', 'delivery_status', p_delivery_status, 'event_id', v_event_id)
  );

  v_result := jsonb_build_object('authority_record_id', v_record.id, 'invitation_id', v_invitation.id, 'participant_role', 'representative', 'delivery_status', v_outbox.status, 'attempts', v_outbox.attempts, 'event_id', v_event_id);
  insert into authority_private.participant_command_receipts (
    invitation_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_session.invitation_id, 'record_representative_delivery', p_idempotency_key, v_payload_hash, v_result
  );
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.reissue_participant_invitation_v1(
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_participant_role text,
  p_expected_record_version bigint,
  p_expected_invitation_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_actor_role text;
  v_record public.authority_records%rowtype;
  v_invitation public.authority_participant_invitations%rowtype;
  v_receipt authority_private.command_receipts%rowtype;
  v_payload_hash text;
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null or p_participant_role not in ('principal', 'representative') then
    raise exception using errcode = '22023', message = 'participant_invitation_reissue_invalid';
  end if;
  v_actor_role := authority_private.assert_authority_record_operator(p_organization_id);
  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'authority_record_id', p_authority_record_id,
    'participant_role', p_participant_role,
    'expected_record_version', p_expected_record_version,
    'expected_invitation_version', p_expected_invitation_version
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':invitation_reissue:' || p_participant_role, 0));
  select * into v_receipt
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'reissue_participant_invitation'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_receipt.result || jsonb_build_object('replayed', true, 'invitation_token', null);
  end if;

  select * into v_record
  from public.authority_records
  where id = p_authority_record_id and organization_id = p_organization_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'authority_request_not_found';
  end if;
  if v_record.version <> p_expected_record_version then
    raise exception using errcode = 'P0001', message = 'participant_record_changed';
  end if;
  if (p_participant_role = 'principal' and v_record.status <> 'awaiting_principal')
     or (p_participant_role = 'representative' and v_record.status <> 'awaiting_representative') then
    raise exception using errcode = '22023', message = 'participant_invitation_reissue_not_allowed';
  end if;

  select * into v_invitation
  from public.authority_participant_invitations
  where authority_record_id = v_record.id and participant_role = p_participant_role
  for update;
  if not found or v_invitation.version <> p_expected_invitation_version then
    raise exception using errcode = 'P0001', message = 'participant_invitation_changed';
  end if;

  update authority_private.participant_sessions
  set status = 'revoked', updated_at = now()
  where invitation_id = v_invitation.id and status = 'active';

  update authority_private.participant_invitation_secrets
  set token_hash = encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex'), created_at = now()
  where invitation_id = v_invitation.id;

  update public.authority_participant_invitations
  set status = 'pending', accepted_at = null, revoked_at = null,
      expires_at = now() + interval '72 hours', version = version + 1, updated_at = now()
  where id = v_invitation.id
  returning * into v_invitation;

  update authority_private.notification_outbox
  set status = 'pending', provider = null, provider_message_id = null,
      last_error_code = null, next_attempt_at = now(), delivered_at = null,
      payload = payload || jsonb_build_object('invitation_version', v_invitation.version),
      updated_at = now()
  where invitation_id = v_invitation.id;

  select coalesce(max(sequence), 0) + 1 into v_event_sequence
  from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    'participant.invitation_reissued', v_actor, v_actor_role,
    case when p_participant_role = 'principal' then 'Fresh principal invitation prepared' else 'Fresh representative invitation prepared' end,
    'The previous link and active session were revoked. A new single-use link is ready for delivery.',
    array['owner', 'admin', 'staff', 'reviewer', 'auditor']::text[],
    jsonb_build_object('invitation_id', v_invitation.id, 'participant_role', p_participant_role, 'invitation_version', v_invitation.version)
  ) returning event_id into v_event_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, v_actor, 'participant.invitation_reissued', 'authority_record', v_record.id,
    jsonb_build_object('invitation_id', v_invitation.id, 'participant_role', p_participant_role, 'invitation_version', v_invitation.version, 'event_id', v_event_id)
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'invitation_id', v_invitation.id,
    'invitation_version', v_invitation.version,
    'participant_role', v_invitation.participant_role,
    'email', v_invitation.email_normalized,
    'expires_at', v_invitation.expires_at,
    'event_id', v_event_id
  );
  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'reissue_participant_invitation', p_idempotency_key, v_payload_hash, v_result
  );
  return v_result || jsonb_build_object('replayed', false, 'invitation_token', v_token);
end;
$$;

create or replace function authority_private.get_authority_notification_status_v1(
  p_organization_id uuid,
  p_authority_record_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform authority_private.assert_authority_record_operator(p_organization_id);
  if not exists (
    select 1 from public.authority_records
    where id = p_authority_record_id and organization_id = p_organization_id
  ) then
    raise exception using errcode = 'P0002', message = 'authority_request_not_found';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'invitation_id', i.id,
      'invitation_version', i.version,
      'participant_role', i.participant_role,
      'invitation_status', i.status,
      'delivery_status', o.status,
      'attempts', o.attempts,
      'delivered_at', o.delivered_at,
      'last_error_code', o.last_error_code
    ) order by i.participant_role)
    from public.authority_participant_invitations i
    join authority_private.notification_outbox o on o.invitation_id = i.id
    where i.organization_id = p_organization_id
      and i.authority_record_id = p_authority_record_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.record_operator_participant_delivery_v1(
  p_organization_id uuid, p_invitation_id uuid, p_expected_invitation_version bigint,
  p_delivery_status text, p_provider text, p_provider_message_id text,
  p_error_code text, p_idempotency_key uuid
)
returns jsonb language sql security definer set search_path = ''
as $$ select authority_private.record_operator_participant_delivery_v1(
  p_organization_id, p_invitation_id, p_expected_invitation_version,
  p_delivery_status, p_provider, p_provider_message_id, p_error_code, p_idempotency_key
); $$;

create or replace function public.get_released_representative_delivery_context_v1(
  p_session_token text, p_authority_record_id uuid, p_invitation_id uuid
)
returns jsonb language sql security definer set search_path = ''
as $$ select authority_private.get_released_representative_delivery_context_v1(
  p_session_token, p_authority_record_id, p_invitation_id
); $$;

create or replace function public.record_representative_delivery_v1(
  p_session_token text, p_authority_record_id uuid, p_invitation_id uuid,
  p_expected_invitation_version bigint, p_delivery_status text, p_provider text,
  p_provider_message_id text, p_error_code text, p_idempotency_key uuid
)
returns jsonb language sql security definer set search_path = ''
as $$ select authority_private.record_representative_delivery_v1(
  p_session_token, p_authority_record_id, p_invitation_id,
  p_expected_invitation_version, p_delivery_status, p_provider,
  p_provider_message_id, p_error_code, p_idempotency_key
); $$;

create or replace function public.reissue_participant_invitation_v1(
  p_organization_id uuid, p_authority_record_id uuid, p_participant_role text,
  p_expected_record_version bigint, p_expected_invitation_version bigint,
  p_idempotency_key uuid
)
returns jsonb language sql security definer set search_path = ''
as $$ select authority_private.reissue_participant_invitation_v1(
  p_organization_id, p_authority_record_id, p_participant_role,
  p_expected_record_version, p_expected_invitation_version, p_idempotency_key
); $$;

create or replace function public.get_authority_notification_status_v1(
  p_organization_id uuid, p_authority_record_id uuid
)
returns jsonb language sql security definer set search_path = ''
as $$ select authority_private.get_authority_notification_status_v1(
  p_organization_id, p_authority_record_id
); $$;

revoke execute on function authority_private.record_operator_participant_delivery_v1(uuid, uuid, bigint, text, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.get_released_representative_delivery_context_v1(text, uuid, uuid) from public, anon, authenticated;
revoke execute on function authority_private.record_representative_delivery_v1(text, uuid, uuid, bigint, text, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.reissue_participant_invitation_v1(uuid, uuid, text, bigint, bigint, uuid) from public, anon, authenticated;
revoke execute on function authority_private.get_authority_notification_status_v1(uuid, uuid) from public, anon, authenticated;

revoke execute on function public.record_operator_participant_delivery_v1(uuid, uuid, bigint, text, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.get_released_representative_delivery_context_v1(text, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.record_representative_delivery_v1(text, uuid, uuid, bigint, text, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.reissue_participant_invitation_v1(uuid, uuid, text, bigint, bigint, uuid) from public, anon, authenticated;
revoke execute on function public.get_authority_notification_status_v1(uuid, uuid) from public, anon, authenticated;

grant execute on function public.record_operator_participant_delivery_v1(uuid, uuid, bigint, text, text, text, text, uuid) to authenticated;
grant execute on function public.get_released_representative_delivery_context_v1(text, uuid, uuid) to anon, authenticated;
grant execute on function public.record_representative_delivery_v1(text, uuid, uuid, bigint, text, text, text, text, uuid) to anon, authenticated;
grant execute on function public.reissue_participant_invitation_v1(uuid, uuid, text, bigint, bigint, uuid) to authenticated;
grant execute on function public.get_authority_notification_status_v1(uuid, uuid) to authenticated;

comment on function public.reissue_participant_invitation_v1(uuid, uuid, text, bigint, bigint, uuid) is 'Revokes prior participant access and returns one new raw token without storing it.';
