-- Phase 0 multi-institution submission: functions and anon grant boundary.
-- Mirrors the existing participant-access pattern exactly: security-definer
-- functions in authority_private, thin security-invoker SQL wrappers in
-- public, everything revoked by default, then a narrow explicit allow-list
-- granted to anon.

create or replace function authority_private.start_submission_group_v1(
  p_requester_name text,
  p_requester_email text,
  p_requester_relationship text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := authority_private.normalized_email(p_requester_email);
  v_name text := btrim(p_requester_name);
  v_relationship text := btrim(coalesce(p_requester_relationship, ''));
  v_group public.authority_submission_groups%rowtype;
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_token_hash text;
  v_expires_at timestamptz := now() + interval '24 hours';
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if nullif(v_name, '') is null or char_length(v_name) not between 2 and 160 then
    raise exception using errcode = '22023', message = 'requester_name_invalid';
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception using errcode = '22023', message = 'requester_email_invalid';
  end if;
  if v_relationship not in ('representative', 'principal_self', 'other') then
    raise exception using errcode = '22023', message = 'requester_relationship_invalid';
  end if;

  if (
    select count(*) from public.authority_submission_groups
    where requester_email_normalized = v_email
      and status <> 'withdrawn'
      and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception using errcode = '42501', message = 'requester_submission_rate_limited';
  end if;

  insert into public.authority_submission_groups (
    requester_name, requester_email_normalized, requester_relationship, status
  ) values (
    v_name, v_email, v_relationship, 'email_pending'
  ) returning * into v_group;

  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');

  insert into authority_private.requester_verification_links (group_id, token_hash, expires_at)
  values (v_group.id, v_token_hash, v_expires_at);

  return jsonb_build_object(
    'group_id', v_group.id,
    'reference_code', v_group.reference_code,
    'verification_token', v_token,
    'verification_expires_at', v_expires_at
  );
end;
$$;

create or replace function authority_private.verify_requester_email_v1(
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
  v_link authority_private.requester_verification_links%rowtype;
  v_group public.authority_submission_groups%rowtype;
  v_session_token text;
  v_session_hash text;
  v_session_expires_at timestamptz;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if v_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'requester_verification_unavailable';
  end if;

  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');

  select * into v_link from authority_private.requester_verification_links where token_hash = v_token_hash;
  if not found then
    raise exception using errcode = 'P0002', message = 'requester_verification_unavailable';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_link.id::text || ':requester_verify', 0));

  select * into v_link from authority_private.requester_verification_links where id = v_link.id for update;
  select * into v_group from public.authority_submission_groups where id = v_link.group_id for update;

  v_session_token := encode(extensions.digest(convert_to(
    v_token || ':' || p_idempotency_key::text || ':' || v_link.id::text, 'UTF8'
  ), 'sha256'), 'hex');
  v_session_hash := encode(extensions.digest(convert_to(v_session_token, 'UTF8'), 'sha256'), 'hex');

  if v_link.status = 'accepted' then
    select expires_at into v_session_expires_at
    from authority_private.requester_sessions
    where group_id = v_group.id and token_hash = v_session_hash and status = 'active' and expires_at > now();

    if v_session_expires_at is not null then
      return jsonb_build_object(
        'group_id', v_group.id, 'reference_code', v_group.reference_code,
        'session_token', v_session_token, 'session_expires_at', v_session_expires_at, 'replayed', true
      );
    end if;
  elsif v_link.status <> 'pending' or v_link.expires_at <= now() then
    raise exception using errcode = '22023', message = 'requester_verification_expired';
  end if;

  v_session_expires_at := least(v_link.expires_at, now() + interval '45 minutes');

  update authority_private.requester_verification_links
  set status = 'accepted', accepted_at = coalesce(accepted_at, now())
  where id = v_link.id;

  insert into authority_private.requester_sessions (group_id, token_hash, status, expires_at)
  values (v_group.id, v_session_hash, 'active', v_session_expires_at);

  if v_group.status = 'email_pending' then
    update public.authority_submission_groups
    set status = 'draft', version = version + 1, updated_at = now()
    where id = v_group.id;
  end if;

  return jsonb_build_object(
    'group_id', v_group.id, 'reference_code', v_group.reference_code,
    'session_token', v_session_token, 'session_expires_at', v_session_expires_at, 'replayed', false
  );
end;
$$;

create or replace function authority_private.get_requester_session_context_v1(
  p_session_token text,
  p_group_id uuid
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
  v_session authority_private.requester_sessions%rowtype;
  v_group public.authority_submission_groups%rowtype;
  v_targets jsonb;
  v_evidence jsonb;
begin
  if v_token !~ '^[0-9a-f]{64}$' or p_group_id is null then
    raise exception using errcode = 'P0002', message = 'requester_session_unavailable';
  end if;

  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');

  select * into v_session from authority_private.requester_sessions
  where token_hash = v_token_hash and group_id = p_group_id and status = 'active' and expires_at > now();
  if not found then
    raise exception using errcode = 'P0002', message = 'requester_session_unavailable';
  end if;

  select * into v_group from public.authority_submission_groups where id = p_group_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'requester_session_unavailable';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id, 'ordinal', t.ordinal, 'target_label', t.target_label,
    'target_institution_type', t.target_institution_type, 'match_status', t.match_status,
    'organization_id', t.organization_id, 'authority_record_id', t.authority_record_id,
    'version', t.version
  ) order by t.ordinal), '[]'::jsonb) into v_targets
  from public.authority_submission_group_targets t where t.group_id = p_group_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id, 'requirement_key', e.requirement_key, 'original_filename', e.original_filename,
    'media_type', e.media_type, 'byte_size', e.byte_size
  )), '[]'::jsonb) into v_evidence
  from public.authority_submission_group_evidence e where e.group_id = p_group_id;

  return jsonb_build_object(
    'group_id', v_group.id, 'reference_code', v_group.reference_code, 'status', v_group.status,
    'version', v_group.version,
    'requester_name', v_group.requester_name, 'requester_relationship', v_group.requester_relationship,
    'principal_name', v_group.principal_name, 'principal_email_normalized', v_group.principal_email_normalized,
    'representative_name', v_group.representative_name, 'representative_email_normalized', v_group.representative_email_normalized,
    'principal_confirmation_available', v_group.principal_confirmation_available,
    'principal_confirmation_unavailable_reason', v_group.principal_confirmation_unavailable_reason,
    'review_flag', v_group.review_flag,
    'session_expires_at', v_session.expires_at,
    'targets', v_targets, 'evidence', v_evidence
  );
end;
$$;

create or replace function authority_private.update_submission_group_details_v1(
  p_session_token text,
  p_group_id uuid,
  p_expected_version bigint,
  p_principal_name text,
  p_principal_email text,
  p_representative_name text,
  p_representative_email text,
  p_principal_confirmation_available boolean,
  p_principal_confirmation_unavailable_reason text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.authority_submission_groups%rowtype;
  v_principal_email text := authority_private.normalized_email(p_principal_email);
  v_representative_email text := authority_private.normalized_email(p_representative_email);
  v_review_flag text;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  perform authority_private.get_requester_session_context_v1(p_session_token, p_group_id);

  select * into v_group from public.authority_submission_groups where id = p_group_id for update;
  if v_group.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'submission_group_changed';
  end if;
  if v_group.status <> 'draft' then
    raise exception using errcode = '22023', message = 'submission_group_not_editable';
  end if;

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
  if p_principal_confirmation_available is null then
    raise exception using errcode = '22023', message = 'principal_confirmation_basis_required';
  end if;
  if p_principal_confirmation_available is false
     and nullif(btrim(p_principal_confirmation_unavailable_reason), '') is null then
    raise exception using errcode = '22023', message = 'principal_confirmation_reason_required';
  end if;

  v_review_flag := case when p_principal_confirmation_available is false then 'light_review' else 'standard' end;

  update public.authority_submission_groups
  set principal_name = btrim(p_principal_name),
      principal_email_normalized = v_principal_email,
      representative_name = btrim(p_representative_name),
      representative_email_normalized = v_representative_email,
      principal_confirmation_available = p_principal_confirmation_available,
      principal_confirmation_unavailable_reason = nullif(btrim(coalesce(p_principal_confirmation_unavailable_reason, '')), ''),
      review_flag = v_review_flag,
      version = version + 1,
      updated_at = now()
  where id = p_group_id
  returning * into v_group;

  return jsonb_build_object('group_id', v_group.id, 'version', v_group.version, 'review_flag', v_group.review_flag);
end;
$$;

create or replace function authority_private.search_institutions_v1(p_query text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'organization_id', o.id, 'display_name', o.display_name, 'organization_type', o.organization_type
  ) order by o.display_name), '[]'::jsonb)
  from public.organizations o
  where o.status = 'active'
    and o.onboarding_status = 'ready'
    and char_length(btrim(coalesce(p_query, ''))) >= 2
    and o.display_name ilike '%' || btrim(p_query) || '%'
  limit 10;
$$;

create or replace function authority_private.add_submission_target_v1(
  p_session_token text,
  p_group_id uuid,
  p_expected_version bigint,
  p_target_label text,
  p_target_institution_type text,
  p_organization_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.authority_submission_groups%rowtype;
  v_organization public.organizations%rowtype;
  v_target_count int;
  v_next_ordinal int;
  v_match_status text;
  v_target public.authority_submission_group_targets%rowtype;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  perform authority_private.get_requester_session_context_v1(p_session_token, p_group_id);

  select * into v_group from public.authority_submission_groups where id = p_group_id for update;
  if v_group.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'submission_group_changed';
  end if;
  if v_group.status <> 'draft' then
    raise exception using errcode = '22023', message = 'submission_group_not_editable';
  end if;

  select count(*) into v_target_count from public.authority_submission_group_targets where group_id = p_group_id;
  if v_target_count >= 5 then
    raise exception using errcode = '22023', message = 'submission_group_target_limit_reached';
  end if;

  if nullif(btrim(p_target_label), '') is null or char_length(btrim(p_target_label)) not between 2 and 160 then
    raise exception using errcode = '22023', message = 'target_label_invalid';
  end if;
  if nullif(btrim(p_target_institution_type), '') is null then
    raise exception using errcode = '22023', message = 'target_institution_type_invalid';
  end if;

  if p_organization_id is not null then
    select * into v_organization from public.organizations where id = p_organization_id;
    if not found or v_organization.status <> 'active' or v_organization.onboarding_status <> 'ready' then
      raise exception using errcode = '22023', message = 'target_organization_not_available';
    end if;
    if exists (
      select 1 from public.authority_submission_group_targets
      where group_id = p_group_id and organization_id = p_organization_id
    ) then
      raise exception using errcode = '23505', message = 'target_already_added';
    end if;
    v_match_status := 'matched';
  else
    v_match_status := 'unmatched';
  end if;

  select coalesce(max(ordinal), 0) + 1 into v_next_ordinal
  from public.authority_submission_group_targets where group_id = p_group_id;

  insert into public.authority_submission_group_targets (
    group_id, ordinal, organization_id, target_label, target_institution_type, match_status
  ) values (
    p_group_id, v_next_ordinal, p_organization_id,
    coalesce(v_organization.display_name, btrim(p_target_label)),
    btrim(p_target_institution_type), v_match_status
  ) returning * into v_target;

  update public.authority_submission_groups set version = version + 1, updated_at = now() where id = p_group_id;

  return jsonb_build_object(
    'target_id', v_target.id, 'ordinal', v_target.ordinal, 'match_status', v_target.match_status,
    'group_version', v_group.version + 1
  );
end;
$$;

create or replace function authority_private.remove_submission_target_v1(
  p_session_token text,
  p_group_id uuid,
  p_target_id uuid,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.authority_submission_groups%rowtype;
  v_deleted int;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  perform authority_private.get_requester_session_context_v1(p_session_token, p_group_id);

  select * into v_group from public.authority_submission_groups where id = p_group_id for update;
  if v_group.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'submission_group_changed';
  end if;
  if v_group.status <> 'draft' then
    raise exception using errcode = '22023', message = 'submission_group_not_editable';
  end if;

  delete from public.authority_submission_group_targets where id = p_target_id and group_id = p_group_id;
  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then
    raise exception using errcode = 'P0002', message = 'target_not_found';
  end if;

  update public.authority_submission_groups set version = version + 1, updated_at = now() where id = p_group_id;

  return jsonb_build_object('group_version', v_group.version + 1);
end;
$$;

create or replace function authority_private.record_submission_group_evidence_upload_v1(
  p_session_token text,
  p_group_id uuid,
  p_expected_version bigint,
  p_requirement_key text,
  p_artifact_id uuid,
  p_storage_path text,
  p_original_filename text,
  p_media_type text,
  p_byte_size bigint,
  p_sha256_hex text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.authority_submission_groups%rowtype;
begin
  if p_idempotency_key is null or p_artifact_id is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if p_requirement_key not in ('power_of_attorney', 'identity_evidence') then
    raise exception using errcode = '22023', message = 'requirement_key_invalid';
  end if;
  if p_media_type not in ('application/pdf', 'image/jpeg', 'image/png')
     or p_byte_size not between 1 and 10485760
     or lower(p_sha256_hex) !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'evidence_file_invalid';
  end if;
  if p_storage_path <> (
    p_group_id::text || '/' || p_artifact_id::text || '/' ||
    (case p_media_type when 'application/pdf' then 'source.pdf' when 'image/jpeg' then 'source.jpg' else 'source.png' end)
  ) then
    raise exception using errcode = '22023', message = 'evidence_path_invalid';
  end if;

  perform authority_private.get_requester_session_context_v1(p_session_token, p_group_id);

  select * into v_group from public.authority_submission_groups where id = p_group_id for update;
  if v_group.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'submission_group_changed';
  end if;
  if v_group.status <> 'draft' then
    raise exception using errcode = '22023', message = 'submission_group_not_editable';
  end if;

  insert into public.authority_submission_group_evidence (
    id, group_id, requirement_key, storage_path, original_filename, media_type, byte_size, sha256_hex
  ) values (
    p_artifact_id, p_group_id, p_requirement_key, p_storage_path,
    btrim(p_original_filename), p_media_type, p_byte_size, lower(p_sha256_hex)
  )
  on conflict (group_id, requirement_key) do update
  set storage_path = excluded.storage_path, original_filename = excluded.original_filename,
      media_type = excluded.media_type, byte_size = excluded.byte_size, sha256_hex = excluded.sha256_hex,
      id = excluded.id;

  update public.authority_submission_groups set version = version + 1, updated_at = now() where id = p_group_id;

  return jsonb_build_object('artifact_id', p_artifact_id, 'group_version', v_group.version + 1);
end;
$$;

create or replace function authority_private.submit_submission_group_v1(
  p_session_token text,
  p_group_id uuid,
  p_expected_version bigint,
  p_requester_attestation_text_version text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_system_actor uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_group public.authority_submission_groups%rowtype;
  v_payload_hash text;
  v_existing authority_private.submission_group_command_receipts%rowtype;
  v_target public.authority_submission_group_targets%rowtype;
  v_organization public.organizations%rowtype;
  v_template public.organization_template_selections%rowtype;
  v_record public.authority_records%rowtype;
  v_principal_token text;
  v_representative_token text;
  v_principal_invitation_id uuid;
  v_representative_invitation_id uuid;
  v_poa_evidence public.authority_submission_group_evidence%rowtype;
  v_id_evidence public.authority_submission_group_evidence%rowtype;
  v_poa_requirement_id uuid;
  v_id_requirement_id uuid;
  v_new_artifact_id uuid;
  v_new_path text;
  v_event_sequence bigint;
  v_spawned jsonb := '[]'::jsonb;
  v_copy_ops jsonb := '[]'::jsonb;
  v_matched_count int := 0;
  v_unmatched_count int := 0;
  v_target_count int;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if nullif(btrim(p_requester_attestation_text_version), '') is null then
    raise exception using errcode = '22023', message = 'requester_attestation_required';
  end if;

  perform authority_private.get_requester_session_context_v1(p_session_token, p_group_id);
  perform pg_advisory_xact_lock(hashtextextended(p_group_id::text || ':submit_submission_group', 0));

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'group_id', p_group_id, 'expected_version', p_expected_version,
    'attestation_text_version', btrim(p_requester_attestation_text_version)
  ));

  select * into v_existing from authority_private.submission_group_command_receipts
  where group_id = p_group_id and command_name = 'submit_submission_group' and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_group from public.authority_submission_groups where id = p_group_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'submission_group_not_found';
  end if;
  if v_group.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'submission_group_changed';
  end if;
  if v_group.status <> 'draft' then
    raise exception using errcode = '22023', message = 'submission_group_not_submittable';
  end if;
  if v_group.principal_name is null or v_group.representative_name is null
     or v_group.principal_confirmation_available is null then
    raise exception using errcode = '22023', message = 'submission_group_details_incomplete';
  end if;

  select count(*) into v_target_count from public.authority_submission_group_targets where group_id = p_group_id;
  if v_target_count < 2 or v_target_count > 5 then
    raise exception using errcode = '22023', message = 'submission_group_target_count_invalid';
  end if;

  select * into v_poa_evidence from public.authority_submission_group_evidence
  where group_id = p_group_id and requirement_key = 'power_of_attorney';
  select * into v_id_evidence from public.authority_submission_group_evidence
  where group_id = p_group_id and requirement_key = 'identity_evidence';
  if v_poa_evidence.id is null or v_id_evidence.id is null then
    raise exception using errcode = '22023', message = 'submission_group_evidence_incomplete';
  end if;

  for v_target in
    select * from public.authority_submission_group_targets where group_id = p_group_id order by ordinal
  loop
    if v_target.match_status = 'matched' and v_target.organization_id is not null then
      select * into v_organization from public.organizations where id = v_target.organization_id;
      select * into v_template from public.organization_template_selections where organization_id = v_target.organization_id;

      if not found or v_organization.status <> 'active' or v_organization.onboarding_status <> 'ready'
         or v_template.template_key <> 'ny_financial_poa' then
        update public.authority_submission_group_targets
        set match_status = 'unmatched', organization_id = null, version = version + 1, updated_at = now()
        where id = v_target.id;
        insert into authority_private.submission_group_concierge_tasks (group_id, target_id, notes)
        values (p_group_id, v_target.id, 'Organization became ineligible between selection and submission.')
        on conflict (target_id, task_type) do nothing;
        v_unmatched_count := v_unmatched_count + 1;
        continue;
      end if;

      v_principal_token := encode(extensions.gen_random_bytes(32), 'hex');
      v_representative_token := encode(extensions.gen_random_bytes(32), 'hex');

      insert into public.authority_records (
        organization_id, created_by, status, template_key, template_version,
        purpose, account_boundary, principal_name, principal_email_normalized,
        representative_name, representative_email_normalized,
        allowed_action_keys, valid_until, activated_at, origin_group_id
      ) values (
        v_target.organization_id, v_system_actor, 'awaiting_principal',
        v_template.template_key, v_template.template_version,
        'Request recognition of limited financial power of attorney authority (submitted alongside other institutions in one multi-institution request)',
        'All accounts and relationships held with this institution',
        v_group.principal_name, v_group.principal_email_normalized,
        v_group.representative_name, v_group.representative_email_normalized,
        array['receive_duplicate_statements', 'discuss_service_issues']::text[],
        now() + interval '1 year', now(), v_group.id
      ) returning * into v_record;

      insert into public.authority_participant_invitations (
        organization_id, authority_record_id, participant_role, email_normalized, invited_by, expires_at
      ) values (
        v_record.organization_id, v_record.id, 'principal', v_record.principal_email_normalized,
        v_system_actor, now() + interval '72 hours'
      ) returning id into v_principal_invitation_id;

      insert into public.authority_participant_invitations (
        organization_id, authority_record_id, participant_role, email_normalized, invited_by, expires_at
      ) values (
        v_record.organization_id, v_record.id, 'representative', v_record.representative_email_normalized,
        v_system_actor, now() + interval '72 hours'
      ) returning id into v_representative_invitation_id;

      insert into authority_private.participant_invitation_secrets (invitation_id, token_hash) values
        (v_principal_invitation_id, encode(extensions.digest(convert_to(v_principal_token, 'UTF8'), 'sha256'), 'hex')),
        (v_representative_invitation_id, encode(extensions.digest(convert_to(v_representative_token, 'UTF8'), 'sha256'), 'hex'));

      insert into public.authority_requirements (
        organization_id, authority_record_id, requirement_key, title, reason, input_kind, ordinal
      ) values
        (v_record.organization_id, v_record.id, 'power_of_attorney', 'Power of attorney document', 'The institution needs the source document to review names, powers, dates, and signing details.', 'document', 1),
        (v_record.organization_id, v_record.id, 'representative_certification', 'Representative certification', 'The representative must confirm the duty to act only within the authority requested.', 'attestation', 2),
        (v_record.organization_id, v_record.id, 'identity_evidence', 'Identity evidence', 'The institution needs an approved identity source before it can make its own recognition decision.', 'document', 3)
      on conflict (authority_record_id, requirement_key) do nothing;

      select id into v_poa_requirement_id from public.authority_requirements
      where authority_record_id = v_record.id and requirement_key = 'power_of_attorney';
      select id into v_id_requirement_id from public.authority_requirements
      where authority_record_id = v_record.id and requirement_key = 'identity_evidence';

      v_new_artifact_id := gen_random_uuid();
      v_new_path := v_record.id::text || '/' || v_new_artifact_id::text || '/' ||
        (case v_poa_evidence.media_type when 'application/pdf' then 'source.pdf' when 'image/jpeg' then 'source.jpg' else 'source.png' end);
      insert into public.authority_evidence_artifacts (
        id, organization_id, authority_record_id, requirement_id, storage_bucket, storage_path,
        original_filename, media_type, byte_size, sha256_hex
      ) values (
        v_new_artifact_id, v_record.organization_id, v_record.id, v_poa_requirement_id, 'authority-evidence', v_new_path,
        v_poa_evidence.original_filename, v_poa_evidence.media_type, v_poa_evidence.byte_size, v_poa_evidence.sha256_hex
      );
      update public.authority_requirements set status = 'review_pending', updated_at = now() where id = v_poa_requirement_id;
      v_copy_ops := v_copy_ops || jsonb_build_object(
        'from_bucket', v_poa_evidence.storage_bucket, 'from_path', v_poa_evidence.storage_path,
        'to_bucket', 'authority-evidence', 'to_path', v_new_path
      );

      v_new_artifact_id := gen_random_uuid();
      v_new_path := v_record.id::text || '/' || v_new_artifact_id::text || '/' ||
        (case v_id_evidence.media_type when 'application/pdf' then 'source.pdf' when 'image/jpeg' then 'source.jpg' else 'source.png' end);
      insert into public.authority_evidence_artifacts (
        id, organization_id, authority_record_id, requirement_id, storage_bucket, storage_path,
        original_filename, media_type, byte_size, sha256_hex
      ) values (
        v_new_artifact_id, v_record.organization_id, v_record.id, v_id_requirement_id, 'authority-evidence', v_new_path,
        v_id_evidence.original_filename, v_id_evidence.media_type, v_id_evidence.byte_size, v_id_evidence.sha256_hex
      );
      update public.authority_requirements set status = 'review_pending', updated_at = now() where id = v_id_requirement_id;
      v_copy_ops := v_copy_ops || jsonb_build_object(
        'from_bucket', v_id_evidence.storage_bucket, 'from_path', v_id_evidence.storage_path,
        'to_bucket', 'authority-evidence', 'to_path', v_new_path
      );

      select coalesce(max(sequence), 0) + 1 into v_event_sequence from public.authority_events where authority_record_id = v_record.id;
      insert into public.authority_events (
        organization_id, authority_record_id, sequence, record_version, event_type,
        actor_user_id, actor_role, summary, detail, audience, payload
      ) values (
        v_record.organization_id, v_record.id, v_event_sequence, v_record.version, 'authority.multi_institution_case_spawned',
        v_system_actor, 'system',
        'Case created from a multi-institution submission',
        'The requester submitted one shared packet naming multiple institutions. This institution''s case is independent: its evidence is a private copy, and its decision has no effect on any other institution''s case.',
        array['owner', 'admin', 'staff', 'reviewer', 'auditor', 'principal', 'representative']::text[],
        jsonb_build_object('origin_group_id', v_group.id, 'origin_reference_code', v_group.reference_code)
      );
      insert into public.organization_audit_events (organization_id, actor_user_id, event_type, subject_type, subject_id, payload)
      values (v_record.organization_id, v_system_actor, 'authority.multi_institution_case_spawned', 'authority_record', v_record.id,
        jsonb_build_object('origin_group_id', v_group.id));

      update public.authority_submission_group_targets
      set match_status = 'matched', authority_record_id = v_record.id, version = version + 1, updated_at = now()
      where id = v_target.id;

      v_matched_count := v_matched_count + 1;
      v_spawned := v_spawned || jsonb_build_object(
        'target_id', v_target.id, 'organization_id', v_record.organization_id,
        'institution_name', v_organization.display_name, 'authority_record_id', v_record.id,
        'reference_code', v_record.reference_code,
        'principal_token', v_principal_token, 'representative_token', v_representative_token
      );
    else
      insert into authority_private.submission_group_concierge_tasks (group_id, target_id)
      values (p_group_id, v_target.id)
      on conflict (target_id, task_type) do nothing;
      v_unmatched_count := v_unmatched_count + 1;
    end if;
  end loop;

  update public.authority_submission_groups
  set status = 'fanned_out', submitted_at = now(),
      requester_attestation_text_version = btrim(p_requester_attestation_text_version),
      requester_attestation_acknowledged_at = now(),
      version = version + 1, updated_at = now()
  where id = p_group_id
  returning * into v_group;

  v_result := jsonb_build_object(
    'group_id', v_group.id, 'reference_code', v_group.reference_code, 'status', v_group.status,
    'matched_count', v_matched_count, 'unmatched_count', v_unmatched_count,
    'spawned', v_spawned, 'evidence_copy_operations', v_copy_ops
  );

  insert into authority_private.submission_group_command_receipts (
    group_id, command_name, idempotency_key, payload_hash, result
  ) values (p_group_id, 'submit_submission_group', p_idempotency_key, v_payload_hash, v_result);

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.start_submission_group_v1(p_requester_name text, p_requester_email text, p_requester_relationship text, p_idempotency_key uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select authority_private.start_submission_group_v1(p_requester_name, p_requester_email, p_requester_relationship, p_idempotency_key);
$$;

create or replace function public.verify_requester_email_v1(p_token text, p_idempotency_key uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select authority_private.verify_requester_email_v1(p_token, p_idempotency_key);
$$;

create or replace function public.get_requester_session_context_v1(p_session_token text, p_group_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select authority_private.get_requester_session_context_v1(p_session_token, p_group_id);
$$;

create or replace function public.update_submission_group_details_v1(p_session_token text, p_group_id uuid, p_expected_version bigint, p_principal_name text, p_principal_email text, p_representative_name text, p_representative_email text, p_principal_confirmation_available boolean, p_principal_confirmation_unavailable_reason text, p_idempotency_key uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select authority_private.update_submission_group_details_v1(p_session_token, p_group_id, p_expected_version, p_principal_name, p_principal_email, p_representative_name, p_representative_email, p_principal_confirmation_available, p_principal_confirmation_unavailable_reason, p_idempotency_key);
$$;

create or replace function public.search_institutions_v1(p_query text)
returns jsonb language sql security invoker set search_path = '' as $$
  select authority_private.search_institutions_v1(p_query);
$$;

create or replace function public.add_submission_target_v1(p_session_token text, p_group_id uuid, p_expected_version bigint, p_target_label text, p_target_institution_type text, p_organization_id uuid, p_idempotency_key uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select authority_private.add_submission_target_v1(p_session_token, p_group_id, p_expected_version, p_target_label, p_target_institution_type, p_organization_id, p_idempotency_key);
$$;

create or replace function public.remove_submission_target_v1(p_session_token text, p_group_id uuid, p_target_id uuid, p_expected_version bigint, p_idempotency_key uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select authority_private.remove_submission_target_v1(p_session_token, p_group_id, p_target_id, p_expected_version, p_idempotency_key);
$$;

create or replace function public.record_submission_group_evidence_upload_v1(p_session_token text, p_group_id uuid, p_expected_version bigint, p_requirement_key text, p_artifact_id uuid, p_storage_path text, p_original_filename text, p_media_type text, p_byte_size bigint, p_sha256_hex text, p_idempotency_key uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select authority_private.record_submission_group_evidence_upload_v1(p_session_token, p_group_id, p_expected_version, p_requirement_key, p_artifact_id, p_storage_path, p_original_filename, p_media_type, p_byte_size, p_sha256_hex, p_idempotency_key);
$$;

create or replace function public.submit_submission_group_v1(p_session_token text, p_group_id uuid, p_expected_version bigint, p_requester_attestation_text_version text, p_idempotency_key uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select authority_private.submit_submission_group_v1(p_session_token, p_group_id, p_expected_version, p_requester_attestation_text_version, p_idempotency_key);
$$;

revoke execute on function authority_private.start_submission_group_v1(text, text, text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.verify_requester_email_v1(text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.get_requester_session_context_v1(text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.update_submission_group_details_v1(text, uuid, bigint, text, text, text, text, boolean, text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.search_institutions_v1(text) from public, anon, authenticated;
revoke execute on function authority_private.add_submission_target_v1(text, uuid, bigint, text, text, uuid, uuid) from public, anon, authenticated;
revoke execute on function authority_private.remove_submission_target_v1(text, uuid, uuid, bigint, uuid) from public, anon, authenticated;
revoke execute on function authority_private.record_submission_group_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.submit_submission_group_v1(text, uuid, bigint, text, uuid) from public, anon, authenticated;

grant execute on function authority_private.start_submission_group_v1(text, text, text, uuid) to anon, authenticated;
grant execute on function authority_private.verify_requester_email_v1(text, uuid) to anon, authenticated;
grant execute on function authority_private.get_requester_session_context_v1(text, uuid) to anon, authenticated;
grant execute on function authority_private.update_submission_group_details_v1(text, uuid, bigint, text, text, text, text, boolean, text, uuid) to anon, authenticated;
grant execute on function authority_private.search_institutions_v1(text) to anon, authenticated;
grant execute on function authority_private.add_submission_target_v1(text, uuid, bigint, text, text, uuid, uuid) to anon, authenticated;
grant execute on function authority_private.remove_submission_target_v1(text, uuid, uuid, bigint, uuid) to anon, authenticated;
grant execute on function authority_private.record_submission_group_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) to anon, authenticated;
grant execute on function authority_private.submit_submission_group_v1(text, uuid, bigint, text, uuid) to anon, authenticated;

revoke execute on function public.start_submission_group_v1(text, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.verify_requester_email_v1(text, uuid) from public, anon, authenticated;
revoke execute on function public.get_requester_session_context_v1(text, uuid) from public, anon, authenticated;
revoke execute on function public.update_submission_group_details_v1(text, uuid, bigint, text, text, text, text, boolean, text, uuid) from public, anon, authenticated;
revoke execute on function public.search_institutions_v1(text) from public, anon, authenticated;
revoke execute on function public.add_submission_target_v1(text, uuid, bigint, text, text, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.remove_submission_target_v1(text, uuid, uuid, bigint, uuid) from public, anon, authenticated;
revoke execute on function public.record_submission_group_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) from public, anon, authenticated;
revoke execute on function public.submit_submission_group_v1(text, uuid, bigint, text, uuid) from public, anon, authenticated;

grant execute on function public.start_submission_group_v1(text, text, text, uuid) to anon, authenticated;
grant execute on function public.verify_requester_email_v1(text, uuid) to anon, authenticated;
grant execute on function public.get_requester_session_context_v1(text, uuid) to anon, authenticated;
grant execute on function public.update_submission_group_details_v1(text, uuid, bigint, text, text, text, text, boolean, text, uuid) to anon, authenticated;
grant execute on function public.search_institutions_v1(text) to anon, authenticated;
grant execute on function public.add_submission_target_v1(text, uuid, bigint, text, text, uuid, uuid) to anon, authenticated;
grant execute on function public.remove_submission_target_v1(text, uuid, uuid, bigint, uuid) to anon, authenticated;
grant execute on function public.record_submission_group_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) to anon, authenticated;
grant execute on function public.submit_submission_group_v1(text, uuid, bigint, text, uuid) to anon, authenticated;

create policy "requester evidence upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'authority-submission-evidence');

create policy "requester evidence read own" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'authority-submission-evidence');
