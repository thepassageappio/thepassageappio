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
  v_payload_hash := authority_private.payload_hash(jsonb_build_object('invitation_id', v_invitation.id));
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

comment on function authority_private.exchange_participant_invitation_v1(text, uuid) is
  'Exchanges one role-bound invitation once. Replays are bound by invitation, command, idempotency key, token-derived session, and active expiry.';

select pg_notify('pgrst', 'reload schema');
