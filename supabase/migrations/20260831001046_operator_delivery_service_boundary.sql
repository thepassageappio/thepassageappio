create or replace function authority_private.record_operator_participant_delivery_service_v1(
  p_actor_user_id uuid,
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
  v_actor uuid := p_actor_user_id;
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
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select m.role into v_actor_role
  from public.organization_memberships m
  join auth.users u on u.id = m.user_id and u.email_confirmed_at is not null
  where m.organization_id = p_organization_id
    and m.user_id = v_actor
    and m.status = 'active';

  if v_actor_role is null or v_actor_role not in ('owner', 'admin', 'staff', 'reviewer') then
    raise exception using errcode = '42501', message = 'authority_request_creation_not_allowed';
  end if;
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

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'actor_user_id', v_actor,
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

create or replace function public.record_operator_participant_delivery_service_v1(
  p_actor_user_id uuid,
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
language sql
security definer
set search_path = ''
as $$
  select authority_private.record_operator_participant_delivery_service_v1(
    p_actor_user_id, p_organization_id, p_invitation_id,
    p_expected_invitation_version, p_delivery_status, p_provider,
    p_provider_message_id, p_error_code, p_idempotency_key
  );
$$;

revoke execute on function authority_private.record_operator_participant_delivery_service_v1(uuid, uuid, uuid, bigint, text, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.record_operator_participant_delivery_service_v1(uuid, uuid, uuid, bigint, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.record_operator_participant_delivery_service_v1(uuid, uuid, uuid, bigint, text, text, text, text, uuid) to service_role;

comment on function public.record_operator_participant_delivery_service_v1(uuid, uuid, uuid, bigint, text, text, text, text, uuid) is 'Server-only provider delivery receipt with a verified organization actor.';

notify pgrst, 'reload schema';
