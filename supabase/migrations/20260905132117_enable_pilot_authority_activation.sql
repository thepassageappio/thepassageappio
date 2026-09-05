-- Paid pilot and enterprise entitlements use the same bounded activation path as
-- the free evaluation. Commercial provisioning changes the entitlement offer,
-- while status, period, and transaction limits remain the enforcement controls.

create or replace function authority_private.activate_authority_request_v1(
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_expected_version bigint,
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
  v_entitlement public.organization_entitlements%rowtype;
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_started_at timestamptz;
  v_ends_at timestamptz;
  v_principal_invitation_id uuid;
  v_representative_invitation_id uuid;
  v_principal_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_representative_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_invitation_expires_at timestamptz := now() + interval '72 hours';
  v_event_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'authority_record_id', p_authority_record_id,
    'expected_version', p_expected_version
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':activate', 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'activate_authority_request'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object(
      'replayed', true,
      'principal_token', null,
      'representative_token', null
    );
  end if;

  v_actor_role := authority_private.assert_authority_record_operator(p_organization_id);

  select * into v_record
  from public.authority_records
  where id = p_authority_record_id and organization_id = p_organization_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'authority_request_not_found';
  end if;
  if v_record.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'stale_authority_version';
  end if;
  if v_record.status <> 'draft' or v_record.activated_at is not null then
    raise exception using errcode = '22023', message = 'authority_request_not_activatable';
  end if;

  select * into v_entitlement
  from public.organization_entitlements
  where organization_id = p_organization_id
  for update;

  if not found or v_entitlement.offer not in ('free_evaluation', 'pilot', 'enterprise') then
    raise exception using errcode = '22023', message = 'evaluation_entitlement_unavailable';
  end if;
  if v_entitlement.status not in ('not_started', 'active') then
    raise exception using errcode = '22023', message = 'evaluation_not_active';
  end if;
  if v_entitlement.status = 'active' and v_entitlement.period_ends_at <= now() then
    raise exception using errcode = '22023', message = 'evaluation_expired';
  end if;
  if v_entitlement.activated_count >= v_entitlement.transaction_limit then
    raise exception using errcode = '22023', message = 'evaluation_limit_reached';
  end if;

  v_started_at := coalesce(v_entitlement.period_started_at, now());
  v_ends_at := coalesce(v_entitlement.period_ends_at, now() + interval '10 days');

  insert into public.authority_participant_invitations (
    organization_id, authority_record_id, participant_role, email_normalized,
    invited_by, expires_at
  ) values (
    p_organization_id, p_authority_record_id, 'principal',
    v_record.principal_email_normalized, v_actor, v_invitation_expires_at
  ) returning id into v_principal_invitation_id;

  insert into public.authority_participant_invitations (
    organization_id, authority_record_id, participant_role, email_normalized,
    invited_by, expires_at
  ) values (
    p_organization_id, p_authority_record_id, 'representative',
    v_record.representative_email_normalized, v_actor, v_invitation_expires_at
  ) returning id into v_representative_invitation_id;

  insert into authority_private.participant_invitation_secrets (invitation_id, token_hash)
  values
    (v_principal_invitation_id, encode(extensions.digest(convert_to(v_principal_token, 'UTF8'), 'sha256'), 'hex')),
    (v_representative_invitation_id, encode(extensions.digest(convert_to(v_representative_token, 'UTF8'), 'sha256'), 'hex'));

  insert into authority_private.notification_outbox (
    organization_id, authority_record_id, invitation_id, template_key,
    recipient_email_normalized, payload
  ) values
    (
      p_organization_id, p_authority_record_id, v_principal_invitation_id,
      'principal_authority_invitation', v_record.principal_email_normalized,
      jsonb_build_object('reference_code', v_record.reference_code, 'participant_role', 'principal')
    ),
    (
      p_organization_id, p_authority_record_id, v_representative_invitation_id,
      'representative_authority_invitation', v_record.representative_email_normalized,
      jsonb_build_object('reference_code', v_record.reference_code, 'participant_role', 'representative')
    );

  update public.authority_records
  set status = 'awaiting_principal', activated_at = now(),
      version = version + 1, updated_at = now()
  where id = p_authority_record_id
  returning * into v_record;

  update public.organization_entitlements
  set status = 'active', activated_count = activated_count + 1,
      period_started_at = v_started_at, period_ends_at = v_ends_at,
      version = version + 1, updated_at = now()
  where organization_id = p_organization_id
  returning * into v_entitlement;

  insert into public.authority_usage_events (
    organization_id, authority_record_id, event_type, quantity,
    entitlement_version, actor_user_id
  ) values (
    p_organization_id, p_authority_record_id, 'authority_activated', 1,
    v_entitlement.version, v_actor
  );

  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    p_organization_id, p_authority_record_id, 2, v_record.version,
    'authority.activated', v_actor, v_actor_role,
    'Authority request activated',
    'The evaluation clock started, one transaction was counted, and separate secure participant invitations were queued.',
    array['owner', 'admin', 'staff', 'reviewer', 'auditor']::text[],
    jsonb_build_object(
      'activated_count', v_entitlement.activated_count,
      'transaction_limit', v_entitlement.transaction_limit,
      'period_started_at', v_entitlement.period_started_at,
      'period_ends_at', v_entitlement.period_ends_at,
      'principal_invitation_id', v_principal_invitation_id,
      'representative_invitation_id', v_representative_invitation_id
    )
  ) returning event_id into v_event_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'authority.activated', 'authority_record', p_authority_record_id,
    jsonb_build_object(
      'reference_code', v_record.reference_code,
      'activated_count', v_entitlement.activated_count,
      'transaction_limit', v_entitlement.transaction_limit
    )
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'status', v_record.status,
    'version', v_record.version,
    'event_id', v_event_id,
    'activated_count', v_entitlement.activated_count,
    'transaction_limit', v_entitlement.transaction_limit,
    'period_started_at', v_entitlement.period_started_at,
    'period_ends_at', v_entitlement.period_ends_at,
    'invitation_expires_at', v_invitation_expires_at,
    'principal_invitation_id', v_principal_invitation_id,
    'representative_invitation_id', v_representative_invitation_id,
    'notifications_queued', 2
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'activate_authority_request', p_idempotency_key, v_payload_hash, v_result
  );

  return v_result || jsonb_build_object(
    'replayed', false,
    'principal_token', v_principal_token,
    'representative_token', v_representative_token
  );
end;
$$;
