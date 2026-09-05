create or replace function authority_private.record_institution_decision_service_v2(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_outcome text,
  p_reason text,
  p_accepted_action_keys text[],
  p_limitations text[],
  p_acknowledged boolean,
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
  v_organization public.organizations%rowtype;
  v_decision public.authority_institution_decisions%rowtype;
  v_existing authority_private.command_receipts%rowtype;
  v_payload_hash text;
  v_limitations text[];
  v_accepted_action_keys text[];
  v_receipt_code text := 'PAR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  v_receipt_snapshot jsonb;
  v_receipt_sha256 text;
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
  if not coalesce(p_acknowledged, false) then
    raise exception using errcode = '22023', message = 'institution_decision_acknowledgment_required';
  end if;
  if p_outcome not in ('accepted', 'accepted_with_limits', 'rejected') then
    raise exception using errcode = '22023', message = 'institution_decision_outcome_invalid';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'institution_decision_reason_required';
  end if;

  select coalesce(array_agg(item order by item), '{}'::text[])
  into v_accepted_action_keys
  from (
    select distinct btrim(value) as item
    from unnest(coalesce(p_accepted_action_keys, '{}'::text[])) as value
    where nullif(btrim(value), '') is not null
  ) normalized_actions;

  select coalesce(array_agg(item order by item), '{}'::text[])
  into v_limitations
  from (
    select distinct btrim(value) as item
    from unnest(coalesce(p_limitations, '{}'::text[])) as value
    where nullif(btrim(value), '') is not null
  ) normalized_limits;

  if cardinality(v_limitations) > 10 or exists (
    select 1 from unnest(v_limitations) as item where char_length(item) > 240
  ) then
    raise exception using errcode = '22023', message = 'institution_decision_limit_invalid';
  end if;
  if p_outcome = 'accepted_with_limits' and cardinality(v_limitations) = 0 then
    raise exception using errcode = '22023', message = 'institution_decision_limit_required';
  end if;
  if p_outcome <> 'accepted_with_limits' and cardinality(v_limitations) > 0 then
    raise exception using errcode = '22023', message = 'institution_decision_limit_not_allowed';
  end if;

  select m.role into v_actor_role
  from public.organization_memberships m
  join auth.users u on u.id = m.user_id and u.email_confirmed_at is not null
  where m.organization_id = p_organization_id
    and m.user_id = v_actor
    and m.status = 'active';
  if v_actor_role is null or v_actor_role not in ('owner', 'admin', 'reviewer') then
    raise exception using errcode = '42501', message = 'institution_decision_not_allowed';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':institution_decision', 0));
  select * into v_record
  from public.authority_records
  where id = p_authority_record_id and organization_id = p_organization_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'authority_request_not_found';
  end if;

  if not (v_accepted_action_keys <@ v_record.allowed_action_keys) then
    raise exception using errcode = '22023', message = 'institution_decision_scope_invalid';
  end if;
  if p_outcome = 'rejected' and cardinality(v_accepted_action_keys) > 0 then
    raise exception using errcode = '22023', message = 'institution_decision_scope_not_allowed';
  end if;
  if p_outcome in ('accepted', 'accepted_with_limits') and cardinality(v_accepted_action_keys) = 0 then
    raise exception using errcode = '22023', message = 'institution_decision_scope_required';
  end if;
  if p_outcome = 'accepted' and not (
    v_accepted_action_keys <@ v_record.allowed_action_keys
    and v_record.allowed_action_keys <@ v_accepted_action_keys
  ) then
    raise exception using errcode = '22023', message = 'institution_decision_full_scope_required';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'actor_user_id', v_actor,
    'organization_id', p_organization_id,
    'authority_record_id', p_authority_record_id,
    'expected_version', p_expected_version,
    'outcome', p_outcome,
    'reason', btrim(p_reason),
    'accepted_action_keys', to_jsonb(v_accepted_action_keys),
    'limitations', to_jsonb(v_limitations),
    'acknowledged', true
  ));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'record_institution_decision_v2'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  if v_record.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'request_changed';
  end if;
  if v_record.status not in ('ready_to_submit', 'under_review') then
    raise exception using errcode = '42501', message = 'institution_decision_not_ready';
  end if;
  if v_record.valid_until <= now() then
    raise exception using errcode = '22023', message = 'institution_decision_request_expired';
  end if;
  if not exists (
    select 1 from public.authority_requirements r where r.authority_record_id = v_record.id
  ) or exists (
    select 1 from public.authority_requirements r
    where r.authority_record_id = v_record.id and r.status <> 'completed'
  ) then
    raise exception using errcode = '42501', message = 'institution_decision_requirements_incomplete';
  end if;
  if exists (
    select 1 from public.authority_institution_decisions d where d.authority_record_id = v_record.id
  ) then
    raise exception using errcode = '22023', message = 'institution_decision_already_recorded';
  end if;

  select * into v_organization from public.organizations where id = v_record.organization_id;
  update public.authority_records
  set status = p_outcome,
      assigned_reviewer_id = v_actor,
      version = version + 1,
      updated_at = now()
  where id = v_record.id
  returning * into v_record;

  v_receipt_snapshot := jsonb_build_object(
    'schema_version', 'institution-decision-receipt-v2',
    'receipt_code', v_receipt_code,
    'reference_code', v_record.reference_code,
    'institution', jsonb_build_object(
      'display_name', v_organization.display_name,
      'legal_name', v_organization.legal_name
    ),
    'participants', jsonb_build_object(
      'principal_name', v_record.principal_name,
      'representative_name', v_record.representative_name
    ),
    'purpose', v_record.purpose,
    'account_boundary', v_record.account_boundary,
    'policy', jsonb_build_object(
      'template_key', v_record.template_key,
      'template_version', v_record.template_version
    ),
    'requested_action_keys', to_jsonb(v_record.allowed_action_keys),
    'prohibited_action_keys', to_jsonb(v_record.prohibited_action_keys),
    'valid_until', v_record.valid_until,
    'decision', jsonb_build_object(
      'outcome', p_outcome,
      'reason', btrim(p_reason),
      'accepted_action_keys', to_jsonb(v_accepted_action_keys),
      'limitations', to_jsonb(v_limitations),
      'decided_by_role', v_actor_role,
      'decided_at', now()
    ),
    'claim_boundary', 'This receipt records the institution decision for this request. Passage did not create legal authority or provide a legal opinion.'
  );
  v_receipt_sha256 := encode(extensions.digest(convert_to(v_receipt_snapshot::text, 'UTF8'), 'sha256'), 'hex');

  insert into public.authority_institution_decisions (
    receipt_code, organization_id, authority_record_id, record_version,
    outcome, reason, accepted_action_keys, limitations, decided_by,
    decided_by_role, receipt_snapshot, receipt_sha256
  ) values (
    v_receipt_code, v_record.organization_id, v_record.id, v_record.version,
    p_outcome, btrim(p_reason), v_accepted_action_keys, v_limitations, v_actor,
    v_actor_role, v_receipt_snapshot, v_receipt_sha256
  ) returning * into v_decision;

  select coalesce(max(sequence), 0) + 1 into v_event_sequence
  from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    'institution.decision_recorded', v_actor, v_actor_role,
    case
      when p_outcome = 'accepted' then 'Institution accepted the request'
      when p_outcome = 'accepted_with_limits' then 'Institution accepted the request with limits'
      else 'Institution did not accept the request'
    end,
    'The institution decision, exact accepted actions, limits, reason, policy version, and receipt fingerprint were saved together.',
    array['owner', 'admin', 'staff', 'reviewer', 'auditor', 'principal', 'representative']::text[],
    jsonb_build_object(
      'decision_id', v_decision.id,
      'receipt_code', v_decision.receipt_code,
      'receipt_sha256', v_decision.receipt_sha256,
      'outcome', v_decision.outcome,
      'reason', v_decision.reason,
      'accepted_action_keys', to_jsonb(v_decision.accepted_action_keys),
      'limitations', to_jsonb(v_decision.limitations)
    )
  ) returning event_id into v_event_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, v_actor, 'institution.decision_recorded',
    'authority_record', v_record.id,
    jsonb_build_object(
      'decision_id', v_decision.id,
      'receipt_code', v_decision.receipt_code,
      'receipt_sha256', v_decision.receipt_sha256,
      'outcome', v_decision.outcome,
      'accepted_action_keys', to_jsonb(v_decision.accepted_action_keys),
      'event_id', v_event_id
    )
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'version', v_record.version,
    'status', v_record.status,
    'decision_id', v_decision.id,
    'receipt_code', v_decision.receipt_code,
    'receipt_sha256', v_decision.receipt_sha256,
    'event_id', v_event_id
  );
  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'record_institution_decision_v2', p_idempotency_key, v_payload_hash, v_result
  );
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.record_institution_decision_service_v2(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_outcome text,
  p_reason text,
  p_accepted_action_keys text[],
  p_limitations text[],
  p_acknowledged boolean,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.record_institution_decision_service_v2(
    p_actor_user_id, p_organization_id, p_authority_record_id,
    p_expected_version, p_outcome, p_reason, p_accepted_action_keys,
    p_limitations, p_acknowledged, p_idempotency_key
  );
$$;

revoke execute on function authority_private.record_institution_decision_service_v2(uuid, uuid, uuid, bigint, text, text, text[], text[], boolean, uuid) from public, anon, authenticated;
revoke execute on function public.record_institution_decision_service_v2(uuid, uuid, uuid, bigint, text, text, text[], text[], boolean, uuid) from public, anon, authenticated;
grant execute on function authority_private.record_institution_decision_service_v2(uuid, uuid, uuid, bigint, text, text, text[], text[], boolean, uuid) to service_role;
grant execute on function public.record_institution_decision_service_v2(uuid, uuid, uuid, bigint, text, text, text[], text[], boolean, uuid) to service_role;

comment on function public.record_institution_decision_service_v2(uuid, uuid, uuid, bigint, text, text, text[], text[], boolean, uuid) is
  'Server-only institution decision command with explicit accepted-action scope, immutable receipt snapshot, and idempotency.';
