-- Phase 0c: read/stub RPCs for ENG-JURIS-NY (#124).

create or replace function public.get_jurisdiction_pack_v1(
  p_pack_key text,
  p_pack_version text
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_pack public.jurisdiction_packs%rowtype;
  v_codes jsonb;
begin
  select * into v_pack
  from public.jurisdiction_packs
  where pack_key = btrim(p_pack_key) and pack_version = btrim(p_pack_version);
  if not found then
    raise exception using errcode = 'P0002', message = 'jurisdiction_pack_unavailable';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'code', c.code,
    'theme', c.theme,
    'label', c.label,
    'description', c.description,
    'severity', c.severity,
    'is_fi_overlay', c.is_fi_overlay,
    'warn_if_sole_refusal', c.warn_if_sole_refusal,
    'sort_ordinal', c.sort_ordinal
  ) order by c.sort_ordinal, c.code), '[]'::jsonb)
  into v_codes
  from public.jurisdiction_reason_codes c
  where c.pack_key = v_pack.pack_key
    and c.pack_version = v_pack.pack_version
    and c.status = 'active';

  return jsonb_build_object(
    'pack_key', v_pack.pack_key,
    'pack_version', v_pack.pack_version,
    'jurisdiction_code', v_pack.jurisdiction_code,
    'display_name', v_pack.display_name,
    'status', v_pack.status,
    'enabled_for_live_claims', v_pack.enabled_for_live_claims,
    'effective_at', v_pack.effective_at,
    'default_timer_initial_business_days', v_pack.default_timer_initial_business_days,
    'default_timer_followup_business_days', v_pack.default_timer_followup_business_days,
    'default_form_class', v_pack.default_form_class,
    'source_citation', v_pack.source_citation,
    'reason_codes', v_codes,
    'claim_boundary', 'Passage records workflow metadata only. The institution decides. Passage does not validate a power of attorney.'
  );
end;
$$;

create or replace function public.get_organization_jurisdiction_pack_settings_v1(
  p_organization_id uuid
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_settings public.organization_jurisdiction_pack_settings%rowtype;
begin
  if not authority_private.has_active_membership(p_organization_id) then
    raise exception using errcode = '42501', message = 'jurisdiction_pack_settings_not_allowed';
  end if;
  select * into v_settings
  from public.organization_jurisdiction_pack_settings
  where organization_id = p_organization_id;
  if not found then
    return jsonb_build_object(
      'organization_id', p_organization_id,
      'configured', false,
      'pack_key', 'us_ny_financial_poa',
      'pack_version', '2026.1',
      'timer_initial_business_days', 10,
      'timer_followup_business_days', 7
    );
  end if;
  return jsonb_build_object(
    'organization_id', v_settings.organization_id,
    'configured', true,
    'pack_key', v_settings.pack_key,
    'pack_version', v_settings.pack_version,
    'timer_initial_business_days', v_settings.timer_initial_business_days,
    'timer_followup_business_days', v_settings.timer_followup_business_days,
    'version', v_settings.version,
    'updated_at', v_settings.updated_at
  );
end;
$$;

create or replace function authority_private.request_affidavit_exchange_v1(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_request_reason text,
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
  v_record public.authority_records%rowtype;
  v_existing authority_private.command_receipts%rowtype;
  v_payload_hash text;
  v_exchange public.authority_affidavit_exchanges%rowtype;
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if char_length(btrim(coalesce(p_request_reason, ''))) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'affidavit_request_reason_required';
  end if;

  select m.role into v_actor_role
  from public.organization_memberships m
  join auth.users u on u.id = m.user_id and u.email_confirmed_at is not null
  where m.organization_id = p_organization_id
    and m.user_id = v_actor
    and m.status = 'active';
  if v_actor_role is null or v_actor_role not in ('owner', 'admin', 'reviewer') then
    raise exception using errcode = '42501', message = 'affidavit_request_not_allowed';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'authority_record_id', p_authority_record_id,
    'request_reason', btrim(p_request_reason)
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':affidavit', 0));
  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'request_affidavit_exchange'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_record
  from public.authority_records
  where id = p_authority_record_id and organization_id = p_organization_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'authority_request_not_found';
  end if;
  if v_record.status not in ('under_review', 'information_requested', 'ready_to_submit') then
    raise exception using errcode = '42501', message = 'affidavit_request_not_available';
  end if;

  insert into public.authority_affidavit_exchanges (
    organization_id, authority_record_id, status, request_reason, requested_by
  ) values (
    p_organization_id, p_authority_record_id, 'requested', btrim(p_request_reason), v_actor
  ) returning * into v_exchange;

  update public.authority_records
  set version = version + 1, updated_at = now()
  where id = v_record.id
  returning * into v_record;

  select coalesce(max(sequence), 0) + 1 into v_event_sequence
  from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    'evidence.affidavit_requested', v_actor, v_actor_role,
    'Full-force affidavit requested',
    'The institution recorded a request for a full-force affidavit. This is workflow metadata, not a legal conclusion.',
    array['owner', 'admin', 'staff', 'reviewer', 'auditor', 'representative']::text[],
    jsonb_build_object(
      'affidavit_exchange_id', v_exchange.id,
      'request_reason', v_exchange.request_reason,
      'jurisdiction_pack_key', v_record.jurisdiction_pack_key,
      'jurisdiction_pack_version', v_record.jurisdiction_pack_version
    )
  ) returning event_id into v_event_id;

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'affidavit_exchange_id', v_exchange.id,
    'status', v_exchange.status,
    'version', v_record.version,
    'event_id', v_event_id
  );
  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'request_affidavit_exchange', p_idempotency_key, v_payload_hash, v_result
  );
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.request_affidavit_exchange_service_v1(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_request_reason text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.request_affidavit_exchange_v1(
    p_actor_user_id, p_organization_id, p_authority_record_id,
    p_request_reason, p_idempotency_key
  );
$$;

revoke execute on function public.get_jurisdiction_pack_v1(text, text) from public, anon, authenticated;
revoke execute on function public.get_organization_jurisdiction_pack_settings_v1(uuid) from public, anon, authenticated;
revoke execute on function authority_private.request_affidavit_exchange_v1(uuid, uuid, uuid, text, uuid) from public, anon, authenticated;
revoke execute on function public.request_affidavit_exchange_service_v1(uuid, uuid, uuid, text, uuid) from public, anon, authenticated;

grant execute on function public.get_jurisdiction_pack_v1(text, text) to authenticated;
grant execute on function public.get_organization_jurisdiction_pack_settings_v1(uuid) to authenticated;
grant execute on function public.request_affidavit_exchange_service_v1(uuid, uuid, uuid, text, uuid) to service_role;

comment on function public.get_jurisdiction_pack_v1(text, text) is
  'Read a versioned jurisdiction pack and its active reason codes.';
comment on function public.get_organization_jurisdiction_pack_settings_v1(uuid) is
  'Read institution timer defaults for the pinned jurisdiction pack.';
comment on function public.request_affidavit_exchange_service_v1(uuid, uuid, uuid, text, uuid) is
  'Service-only stub to record a NY full-force affidavit request with idempotency and an append-only event.';

notify pgrst, 'reload schema';
