-- Allow staff to correct draft contact details before send.
-- After activate, emails stay immutable on the record; use invitation reissue instead.

create or replace function authority_private.update_authority_draft_v1(
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_principal_name text,
  p_principal_email text,
  p_representative_name text,
  p_representative_email text,
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
  v_principal_email text := authority_private.normalized_email(p_principal_email);
  v_representative_email text := authority_private.normalized_email(p_representative_email);
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_record public.authority_records%rowtype;
  v_sequence bigint;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if p_expected_version is null or p_expected_version < 1 or p_authority_record_id is null then
    raise exception using errcode = '22023', message = 'draft_update_input_invalid';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'authority_record_id', p_authority_record_id,
    'expected_version', p_expected_version,
    'principal_name', btrim(p_principal_name),
    'principal_email', v_principal_email,
    'representative_name', btrim(p_representative_name),
    'representative_email', v_representative_email
  ));

  perform pg_advisory_xact_lock(hashtextextended(
    v_actor::text || ':update_authority_draft:' || p_idempotency_key::text, 0
  ));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'update_authority_draft'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  v_actor_role := authority_private.assert_authority_record_operator(p_organization_id);

  if nullif(btrim(p_principal_name), '') is null or char_length(btrim(p_principal_name)) not between 2 and 160
    or nullif(btrim(p_representative_name), '') is null or char_length(btrim(p_representative_name)) not between 2 and 160 then
    raise exception using errcode = '22023', message = 'participant_name_invalid';
  end if;
  if v_principal_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    or v_representative_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception using errcode = '22023', message = 'participant_email_invalid';
  end if;
  if v_principal_email = v_representative_email then
    raise exception using errcode = '22023', message = 'participant_roles_must_be_distinct';
  end if;

  select * into v_record
  from public.authority_records
  where id = p_authority_record_id
    and organization_id = p_organization_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'authority_request_not_found';
  end if;
  if v_record.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'request_changed';
  end if;
  if v_record.status <> 'draft' then
    raise exception using errcode = '22023', message = 'draft_update_not_available';
  end if;

  update public.authority_records
  set
    principal_name = btrim(p_principal_name),
    principal_email_normalized = v_principal_email,
    representative_name = btrim(p_representative_name),
    representative_email_normalized = v_representative_email,
    version = version + 1,
    updated_at = now()
  where id = v_record.id
  returning * into v_record;

  select coalesce(max(sequence), 0) + 1 into v_sequence
  from public.authority_events
  where authority_record_id = v_record.id;

  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    p_organization_id, v_record.id, v_sequence, v_record.version, 'authority.draft_updated',
    v_actor, v_actor_role, 'Authority request draft contact details updated',
    'Staff corrected names or emails on the saved draft before send. Nothing was sent or counted.',
    array['owner', 'admin', 'staff', 'reviewer', 'auditor']::text[],
    jsonb_build_object(
      'reference_code', v_record.reference_code,
      'principal_name', v_record.principal_name,
      'representative_name', v_record.representative_name
    )
  );

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'authority.draft_updated', 'authority_record', v_record.id,
    jsonb_build_object(
      'reference_code', v_record.reference_code,
      'status', v_record.status,
      'version', v_record.version
    )
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'status', v_record.status,
    'version', v_record.version
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'update_authority_draft', p_idempotency_key, v_payload_hash, v_result
  );

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.update_authority_draft_v1(
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_principal_name text,
  p_principal_email text,
  p_representative_name text,
  p_representative_email text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.update_authority_draft_v1(
    p_organization_id, p_authority_record_id, p_expected_version,
    p_principal_name, p_principal_email, p_representative_name, p_representative_email,
    p_idempotency_key
  );
end;
$$;

revoke all on function authority_private.update_authority_draft_v1(uuid, uuid, bigint, text, text, text, text, uuid)
  from public, anon, authenticated;
revoke all on function public.update_authority_draft_v1(uuid, uuid, bigint, text, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function authority_private.update_authority_draft_v1(uuid, uuid, bigint, text, text, text, text, uuid)
  to authenticated;
grant execute on function public.update_authority_draft_v1(uuid, uuid, bigint, text, text, text, text, uuid)
  to authenticated;

notify pgrst, 'reload schema';
