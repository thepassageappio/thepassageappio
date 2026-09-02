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
  v_access_purpose text;
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
  select * into v_record from public.authority_records where id = v_invitation.authority_record_id;
  select * into v_organization from public.organizations
  where id = v_invitation.organization_id and status = 'active';
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_invitation_unavailable';
  end if;

  v_access_purpose := case
    when v_record.status in ('accepted', 'accepted_with_limits', 'rejected', 'revoked', 'expired') then 'receipt'
    when v_invitation.participant_role = 'representative'
      and v_record.status in ('evidence_required', 'ready_to_submit', 'information_requested') then 'resume'
    else 'decision'
  end;
  v_entry_status := case
    when v_invitation.status = 'accepted' then 'already_used'
    when v_invitation.status = 'expired' or v_invitation.expires_at <= now() then 'expired'
    when v_record.status in ('accepted', 'accepted_with_limits', 'rejected', 'revoked', 'expired') then 'ready'
    when v_invitation.participant_role = 'principal' and v_record.status = 'awaiting_principal' then 'ready'
    when v_invitation.participant_role = 'representative' and v_record.status = 'awaiting_principal' then 'waiting'
    when v_invitation.participant_role = 'representative'
      and v_record.status in ('awaiting_representative', 'evidence_required', 'ready_to_submit', 'information_requested') then 'ready'
    else 'unavailable'
  end;
  if v_entry_status in ('already_used', 'unavailable') then
    return jsonb_build_object('entry_status', v_entry_status, 'access_purpose', v_access_purpose);
  end if;
  return jsonb_build_object(
    'entry_status', v_entry_status,
    'access_purpose', v_access_purpose,
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
  v_is_resume boolean;
  v_is_receipt boolean;
  v_access_purpose text;
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
  select * into v_invitation from public.authority_participant_invitations where id = v_invitation_id;
  select * into v_record from public.authority_records where id = v_invitation.authority_record_id for update;
  select * into v_invitation from public.authority_participant_invitations where id = v_invitation_id for update;

  v_is_resume := v_invitation.participant_role = 'representative'
    and v_record.status in ('evidence_required', 'ready_to_submit', 'information_requested');
  v_is_receipt := v_record.status in ('accepted', 'accepted_with_limits', 'rejected', 'revoked', 'expired');
  v_access_purpose := case when v_is_receipt then 'receipt' when v_is_resume then 'resume' else 'decision' end;
  v_payload_hash := authority_private.payload_hash(
    jsonb_build_object(
      'invitation_id', v_invitation.id,
      'authority_record_id', v_invitation.authority_record_id,
      'participant_role', v_invitation.participant_role,
      'invitation_version', v_invitation.version,
      'resume', v_is_resume
    ) || case when v_is_receipt then jsonb_build_object('receipt', true) else '{}'::jsonb end
  );
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
    select * into v_session from authority_private.participant_sessions
    where invitation_id = v_invitation.id and token_hash = v_session_hash
      and status = 'active' and expires_at > now();
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
  if not v_is_receipt and v_invitation.participant_role = 'principal' and v_record.status <> 'awaiting_principal' then
    raise exception using errcode = '22023', message = 'participant_invitation_not_ready';
  end if;
  if not v_is_receipt and v_invitation.participant_role = 'representative'
    and v_record.status not in ('awaiting_representative', 'evidence_required', 'ready_to_submit', 'information_requested') then
    raise exception using errcode = '22023', message = 'participant_invitation_not_ready';
  end if;

  v_session_expires_at := least(v_invitation.expires_at, now() + interval '30 minutes');
  update public.authority_participant_invitations
  set status = 'accepted', accepted_at = now(), version = version + 1, updated_at = now()
  where id = v_invitation.id returning * into v_invitation;
  insert into authority_private.participant_sessions (
    invitation_id, organization_id, authority_record_id, participant_role,
    token_hash, status, expires_at
  ) values (
    v_invitation.id, v_invitation.organization_id, v_invitation.authority_record_id,
    v_invitation.participant_role, v_session_hash, 'active', v_session_expires_at
  ) returning * into v_session;

  select coalesce(max(sequence), 0) + 1 into v_event_sequence
  from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    case
      when v_is_receipt then 'participant.receipt_access_established'
      when v_is_resume then 'participant.access_resumed'
      else 'participant.access_established'
    end,
    null, v_invitation.participant_role,
    case
      when v_is_receipt and v_invitation.participant_role = 'principal' then 'Person granting authority opened the institution decision receipt'
      when v_is_receipt then 'Representative opened the institution decision receipt'
      when v_is_resume then 'Representative resumed secure access'
      when v_invitation.participant_role = 'principal' then 'Person granting authority opened secure access'
      else 'Representative opened secure access'
    end,
    case
      when v_is_receipt then 'A role-bound session was established for the immutable institution decision receipt.'
      when v_is_resume then 'A new role-bound session was established without changing the saved authority decision.'
      else 'A role-bound participant session was established from a valid one-time invitation.'
    end,
    array['owner', 'admin', 'staff', 'reviewer', 'auditor', v_invitation.participant_role]::text[],
    jsonb_build_object(
      'invitation_id', v_invitation.id,
      'session_expires_at', v_session_expires_at,
      'resume', v_is_resume,
      'receipt', v_is_receipt,
      'access_purpose', v_access_purpose
    )
  ) returning event_id into v_event_id;
  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, null,
    case
      when v_is_receipt then 'participant.receipt_access_established'
      when v_is_resume then 'participant.access_resumed'
      else 'participant.access_established'
    end,
    'authority_record', v_record.id,
    jsonb_build_object(
      'participant_role', v_invitation.participant_role,
      'invitation_id', v_invitation.id,
      'resume', v_is_resume,
      'receipt', v_is_receipt,
      'access_purpose', v_access_purpose
    )
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'participant_role', v_invitation.participant_role,
    'session_expires_at', v_session_expires_at,
    'event_id', v_event_id,
    'resume', v_is_resume,
    'receipt', v_is_receipt,
    'access_purpose', v_access_purpose
  );
  insert into authority_private.participant_command_receipts (
    invitation_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_invitation.id, 'exchange_participant_invitation', p_idempotency_key, v_payload_hash, v_result
  );
  return v_result || jsonb_build_object('replayed', false, 'session_token', v_session_token);
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
  v_is_resume boolean;
  v_is_receipt boolean;
  v_access_purpose text;
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
  select * into v_receipt from authority_private.command_receipts
  where actor_user_id = v_actor and command_name = 'reissue_participant_invitation'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_receipt.result || jsonb_build_object('replayed', true, 'invitation_token', null);
  end if;

  select * into v_record from public.authority_records
  where id = p_authority_record_id and organization_id = p_organization_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'authority_request_not_found'; end if;
  if v_record.version <> p_expected_record_version then
    raise exception using errcode = 'P0001', message = 'participant_record_changed';
  end if;
  v_is_resume := p_participant_role = 'representative'
    and v_record.status in ('evidence_required', 'ready_to_submit', 'information_requested');
  v_is_receipt := v_record.status in ('accepted', 'accepted_with_limits', 'rejected', 'revoked', 'expired');
  v_access_purpose := case when v_is_receipt then 'receipt' when v_is_resume then 'resume' else 'decision' end;
  if not v_is_receipt and (
    (p_participant_role = 'principal' and v_record.status <> 'awaiting_principal')
    or (p_participant_role = 'representative'
      and v_record.status not in ('awaiting_representative', 'evidence_required', 'ready_to_submit', 'information_requested'))
  ) then
    raise exception using errcode = '22023', message = 'participant_invitation_reissue_not_allowed';
  end if;

  select * into v_invitation from public.authority_participant_invitations
  where authority_record_id = v_record.id and participant_role = p_participant_role for update;
  if not found or v_invitation.version <> p_expected_invitation_version then
    raise exception using errcode = 'P0001', message = 'participant_invitation_changed';
  end if;
  update authority_private.participant_sessions set status = 'revoked', updated_at = now()
  where invitation_id = v_invitation.id and status = 'active';
  update authority_private.participant_invitation_secrets
  set token_hash = encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex'), created_at = now()
  where invitation_id = v_invitation.id;
  update public.authority_participant_invitations
  set status = 'pending', accepted_at = null, revoked_at = null,
    expires_at = now() + interval '72 hours', version = version + 1, updated_at = now()
  where id = v_invitation.id returning * into v_invitation;
  update authority_private.notification_outbox
  set status = 'pending', provider = null, provider_message_id = null,
    last_error_code = null, next_attempt_at = now(), delivered_at = null,
    payload = payload || jsonb_build_object(
      'invitation_version', v_invitation.version,
      'resume', v_is_resume,
      'receipt', v_is_receipt,
      'access_purpose', v_access_purpose
    ),
    updated_at = now()
  where invitation_id = v_invitation.id;

  select coalesce(max(sequence), 0) + 1 into v_event_sequence
  from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    case
      when v_is_receipt then 'participant.receipt_invitation_prepared'
      when v_is_resume then 'participant.resume_invitation_prepared'
      else 'participant.invitation_reissued'
    end,
    v_actor, v_actor_role,
    case
      when v_is_receipt and p_participant_role = 'principal' then 'Secure principal decision receipt prepared'
      when v_is_receipt then 'Secure representative decision receipt prepared'
      when v_is_resume then 'Secure representative resume link prepared'
      when p_participant_role = 'principal' then 'Fresh principal invitation prepared'
      else 'Fresh representative invitation prepared'
    end,
    case
      when v_is_receipt then 'Prior sessions were revoked. A new single-use link is ready for the immutable institution decision receipt.'
      when v_is_resume then 'Prior sessions were revoked. The saved authority decision was preserved and a new single-use evidence link is ready.'
      else 'The previous link and active session were revoked. A new single-use link is ready for delivery.'
    end,
    array['owner', 'admin', 'staff', 'reviewer', 'auditor']::text[],
    jsonb_build_object(
      'invitation_id', v_invitation.id,
      'participant_role', p_participant_role,
      'invitation_version', v_invitation.version,
      'resume', v_is_resume,
      'receipt', v_is_receipt,
      'access_purpose', v_access_purpose
    )
  ) returning event_id into v_event_id;
  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, v_actor,
    case
      when v_is_receipt then 'participant.receipt_invitation_prepared'
      when v_is_resume then 'participant.resume_invitation_prepared'
      else 'participant.invitation_reissued'
    end,
    'authority_record', v_record.id,
    jsonb_build_object(
      'invitation_id', v_invitation.id,
      'participant_role', p_participant_role,
      'invitation_version', v_invitation.version,
      'event_id', v_event_id,
      'resume', v_is_resume,
      'receipt', v_is_receipt,
      'access_purpose', v_access_purpose
    )
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'invitation_id', v_invitation.id,
    'invitation_version', v_invitation.version,
    'participant_role', v_invitation.participant_role,
    'email', v_invitation.email_normalized,
    'expires_at', v_invitation.expires_at,
    'event_id', v_event_id,
    'resume', v_is_resume,
    'receipt', v_is_receipt,
    'access_purpose', v_access_purpose
  );
  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'reissue_participant_invitation', p_idempotency_key, v_payload_hash, v_result
  );
  return v_result || jsonb_build_object('replayed', false, 'invitation_token', v_token);
end;
$$;

create or replace function authority_private.get_participant_decision_receipt_v1(
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
  v_decision public.authority_institution_decisions%rowtype;
  v_lifecycle public.authority_events%rowtype;
begin
  if v_token !~ '^[0-9a-f]{64}$' or p_authority_record_id is null then
    raise exception using errcode = '22023', message = 'participant_receipt_unavailable';
  end if;
  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');
  select * into v_session
  from authority_private.participant_sessions
  where token_hash = v_token_hash
    and authority_record_id = p_authority_record_id
    and participant_role in ('principal', 'representative')
    and status = 'active'
    and expires_at > now();
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_receipt_unavailable';
  end if;

  select * into v_record from public.authority_records where id = v_session.authority_record_id;
  select * into v_organization from public.organizations
  where id = v_session.organization_id and status = 'active';
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_receipt_unavailable';
  end if;
  select * into v_decision from public.authority_institution_decisions
  where authority_record_id = v_record.id and organization_id = v_record.organization_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_receipt_unavailable';
  end if;

  select * into v_lifecycle
  from public.authority_events
  where authority_record_id = v_record.id
    and event_type in ('authority.revocation_recorded', 'authority.expiration_recorded')
  order by sequence desc
  limit 1;

  return jsonb_build_object(
    'receipt_code', v_decision.receipt_code,
    'reference_code', v_record.reference_code,
    'institution_name', v_organization.display_name,
    'participant_role', v_session.participant_role,
    'participant_name', case when v_session.participant_role = 'principal' then v_record.principal_name else v_record.representative_name end,
    'other_person_name', case when v_session.participant_role = 'principal' then v_record.representative_name else v_record.principal_name end,
    'current_status', v_record.status,
    'current_version', v_record.version,
    'decision_record_version', v_decision.record_version,
    'purpose', v_record.purpose,
    'account_boundary', v_record.account_boundary,
    'requested_action_keys', to_jsonb(v_record.allowed_action_keys),
    'decision_outcome', v_decision.outcome,
    'decision_reason', v_decision.reason,
    'accepted_action_keys', to_jsonb(v_decision.accepted_action_keys),
    'limitations', to_jsonb(v_decision.limitations),
    'decided_at', v_decision.decided_at,
    'valid_until', v_record.valid_until,
    'receipt_sha256', v_decision.receipt_sha256,
    'lifecycle_summary', case when v_lifecycle.event_id is null then null else v_lifecycle.summary end,
    'lifecycle_reason', case when v_lifecycle.event_id is null then null else nullif(v_lifecycle.payload ->> 'reason', '') end,
    'lifecycle_effective_at', case when v_lifecycle.event_id is null then null else v_lifecycle.payload ->> 'effective_at' end
  );
end;
$$;

create or replace function public.get_participant_decision_receipt_v1(
  p_session_token text,
  p_authority_record_id uuid
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select authority_private.get_participant_decision_receipt_v1(p_session_token, p_authority_record_id);
$$;

revoke execute on function authority_private.get_participant_decision_receipt_v1(text, uuid) from public, anon, authenticated;
revoke execute on function public.get_participant_decision_receipt_v1(text, uuid) from public, anon, authenticated;
grant execute on function authority_private.get_participant_decision_receipt_v1(text, uuid) to service_role;
grant execute on function public.get_participant_decision_receipt_v1(text, uuid) to service_role;

comment on function public.get_participant_decision_receipt_v1(text, uuid) is
  'Server-only role-bound view of the immutable institution decision receipt and its current lifecycle.';
comment on function public.reissue_participant_invitation_v1(uuid, uuid, text, bigint, bigint, uuid) is
  'Rotates participant access for a pending decision, active evidence work, or an institution decision receipt.';

select pg_notify('pgrst', 'reload schema');
