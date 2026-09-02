insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'authority-evidence', 'authority-evidence', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.authority_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null references public.authority_records(id) on delete restrict,
  requirement_key text not null check (requirement_key in ('power_of_attorney', 'representative_certification', 'identity_evidence')),
  title text not null,
  reason text not null,
  input_kind text not null check (input_kind in ('document', 'attestation')),
  status text not null default 'not_started' check (status in ('not_started', 'review_pending', 'completed', 'needs_attention')),
  ordinal integer not null check (ordinal between 1 and 20),
  version bigint not null default 1 check (version > 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (authority_record_id, requirement_key),
  unique (authority_record_id, ordinal),
  check ((status = 'completed' and completed_at is not null) or (status <> 'completed' and completed_at is null))
);

create index authority_requirements_org_status_idx
  on public.authority_requirements(organization_id, status, created_at);

create table public.authority_evidence_artifacts (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null references public.authority_records(id) on delete restrict,
  requirement_id uuid not null references public.authority_requirements(id) on delete restrict,
  storage_bucket text not null default 'authority-evidence' check (storage_bucket = 'authority-evidence'),
  storage_path text not null unique,
  original_filename text not null check (char_length(btrim(original_filename)) between 1 and 180),
  media_type text not null check (media_type in ('application/pdf', 'image/jpeg', 'image/png')),
  byte_size bigint not null check (byte_size between 1 and 10485760),
  sha256_hex text not null check (sha256_hex ~ '^[0-9a-f]{64}$'),
  upload_status text not null default 'received' check (upload_status in ('received', 'rejected')),
  provider_status text not null default 'not_started' check (provider_status in ('not_started', 'processing', 'completed', 'failed')),
  review_status text not null default 'pending' check (review_status in ('pending', 'accepted', 'needs_attention')),
  reviewer_user_id uuid references auth.users(id) on delete restrict,
  reviewer_note text,
  reviewed_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (review_status = 'pending' and reviewer_user_id is null and reviewed_at is null)
    or (review_status <> 'pending' and reviewer_user_id is not null and reviewed_at is not null)
  )
);

create index authority_evidence_record_requirement_idx
  on public.authority_evidence_artifacts(authority_record_id, requirement_id, created_at desc);
create index authority_evidence_org_review_idx
  on public.authority_evidence_artifacts(organization_id, review_status, created_at);

create table public.authority_attestations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null references public.authority_records(id) on delete restrict,
  requirement_id uuid not null references public.authority_requirements(id) on delete restrict,
  participant_role text not null check (participant_role = 'representative'),
  text_version text not null check (text_version = 'representative-certification-v1'),
  acknowledged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (authority_record_id, requirement_id)
);

create or replace function authority_private.seed_authority_requirements_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'evidence_required' and old.status is distinct from new.status then
    insert into public.authority_requirements (
      organization_id, authority_record_id, requirement_key, title, reason, input_kind, ordinal
    ) values
      (new.organization_id, new.id, 'power_of_attorney', 'Power of attorney document', 'The institution needs the source document to review names, powers, dates, and signing details.', 'document', 1),
      (new.organization_id, new.id, 'representative_certification', 'Representative certification', 'The representative must confirm the duty to act only within the authority requested.', 'attestation', 2),
      (new.organization_id, new.id, 'identity_evidence', 'Identity evidence', 'The institution needs an approved identity source before it can make its own recognition decision.', 'document', 3)
    on conflict (authority_record_id, requirement_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger authority_records_seed_requirements
after update of status on public.authority_records
for each row execute function authority_private.seed_authority_requirements_v1();

insert into public.authority_requirements (
  organization_id, authority_record_id, requirement_key, title, reason, input_kind, ordinal
)
select r.organization_id, r.id, requirement_key, title, reason, input_kind, ordinal
from public.authority_records r
cross join (values
  ('power_of_attorney', 'Power of attorney document', 'The institution needs the source document to review names, powers, dates, and signing details.', 'document', 1),
  ('representative_certification', 'Representative certification', 'The representative must confirm the duty to act only within the authority requested.', 'attestation', 2),
  ('identity_evidence', 'Identity evidence', 'The institution needs an approved identity source before it can make its own recognition decision.', 'document', 3)
) as required(requirement_key, title, reason, input_kind, ordinal)
where r.status in ('evidence_required', 'ready_to_submit', 'under_review', 'information_requested')
on conflict (authority_record_id, requirement_key) do nothing;

create or replace function authority_private.get_participant_evidence_context_v1(
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
  v_requirements jsonb;
begin
  if v_token !~ '^[0-9a-f]{64}$' or p_authority_record_id is null then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;
  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');
  select * into v_session from authority_private.participant_sessions
  where token_hash = v_token_hash and authority_record_id = p_authority_record_id
    and participant_role = 'representative' and status = 'active' and expires_at > now();
  if not found then raise exception using errcode = 'P0002', message = 'participant_session_unavailable'; end if;
  select * into v_record from public.authority_records where id = p_authority_record_id;
  if v_record.status not in ('evidence_required', 'ready_to_submit', 'information_requested') then
    raise exception using errcode = '42501', message = 'evidence_not_available';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id,
    'requirement_key', q.requirement_key,
    'title', q.title,
    'reason', q.reason,
    'input_kind', q.input_kind,
    'status', q.status,
    'ordinal', q.ordinal,
    'version', q.version,
    'artifact', case when a.id is null then null else jsonb_build_object(
      'id', a.id,
      'original_filename', a.original_filename,
      'media_type', a.media_type,
      'byte_size', a.byte_size,
      'provider_status', a.provider_status,
      'review_status', a.review_status,
      'reviewer_note', a.reviewer_note,
      'created_at', a.created_at
    ) end
  ) order by q.ordinal), '[]'::jsonb) into v_requirements
  from public.authority_requirements q
  left join lateral (
    select artifact.* from public.authority_evidence_artifacts artifact
    where artifact.requirement_id = q.id order by artifact.created_at desc limit 1
  ) a on true
  where q.authority_record_id = p_authority_record_id;

  return jsonb_build_object(
    'authority_record_id', v_record.id,
    'record_version', v_record.version,
    'status', v_record.status,
    'requirements', v_requirements
  );
end;
$$;

create or replace function authority_private.record_participant_evidence_upload_v1(
  p_session_token text,
  p_authority_record_id uuid,
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
  v_token_hash text;
  v_session authority_private.participant_sessions%rowtype;
  v_record public.authority_records%rowtype;
  v_requirement public.authority_requirements%rowtype;
  v_receipt authority_private.participant_command_receipts%rowtype;
  v_payload_hash text;
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null or p_artifact_id is null then raise exception using errcode = '22023', message = 'idempotency_key_required'; end if;
  if lower(btrim(coalesce(p_session_token, ''))) !~ '^[0-9a-f]{64}$' then raise exception using errcode = 'P0002', message = 'participant_session_unavailable'; end if;
  if p_media_type not in ('application/pdf', 'image/jpeg', 'image/png') or p_byte_size not between 1 and 10485760 or lower(p_sha256_hex) !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'evidence_file_invalid';
  end if;
  if p_storage_path <> (
    p_authority_record_id::text || '/' || p_artifact_id::text || '/' ||
    (case p_media_type when 'application/pdf' then 'source.pdf' when 'image/jpeg' then 'source.jpg' else 'source.png' end)
  ) then
    raise exception using errcode = '22023', message = 'evidence_path_invalid';
  end if;
  v_token_hash := encode(extensions.digest(convert_to(lower(btrim(p_session_token)), 'UTF8'), 'sha256'), 'hex');
  select * into v_session from authority_private.participant_sessions
  where token_hash = v_token_hash and authority_record_id = p_authority_record_id
    and participant_role = 'representative' and status = 'active' and expires_at > now();
  if not found then raise exception using errcode = 'P0002', message = 'participant_session_unavailable'; end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'record_id', p_authority_record_id, 'expected_version', p_expected_version,
    'requirement_key', p_requirement_key, 'artifact_id', p_artifact_id,
    'storage_path', p_storage_path, 'original_filename', btrim(p_original_filename),
    'media_type', p_media_type, 'byte_size', p_byte_size, 'sha256_hex', lower(p_sha256_hex)
  ));
  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':evidence', 0));
  select * into v_receipt from authority_private.participant_command_receipts
  where invitation_id = v_session.invitation_id and command_name = 'evidence_upload:' || p_requirement_key and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.payload_hash <> v_payload_hash then raise exception using errcode = '22023', message = 'idempotency_payload_mismatch'; end if;
    return v_receipt.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_record from public.authority_records where id = p_authority_record_id for update;
  if not found or v_record.status not in ('evidence_required', 'information_requested') then raise exception using errcode = '42501', message = 'evidence_not_available'; end if;
  if v_record.version <> p_expected_version then raise exception using errcode = 'P0001', message = 'participant_record_changed'; end if;
  select * into v_requirement from public.authority_requirements
  where authority_record_id = p_authority_record_id and requirement_key = p_requirement_key and input_kind = 'document' for update;
  if not found then raise exception using errcode = 'P0002', message = 'evidence_requirement_unavailable'; end if;
  if v_requirement.status not in ('not_started', 'needs_attention') then raise exception using errcode = '22023', message = 'evidence_requirement_not_uploadable'; end if;

  insert into public.authority_evidence_artifacts (
    id, organization_id, authority_record_id, requirement_id, storage_path,
    original_filename, media_type, byte_size, sha256_hex
  ) values (
    p_artifact_id, v_record.organization_id, v_record.id, v_requirement.id, p_storage_path,
    btrim(p_original_filename), p_media_type, p_byte_size, lower(p_sha256_hex)
  );
  update public.authority_requirements set status = 'review_pending', version = version + 1, completed_at = null, updated_at = now()
  where id = v_requirement.id returning * into v_requirement;
  update public.authority_records set version = version + 1, updated_at = now() where id = v_record.id returning * into v_record;

  select coalesce(max(sequence), 0) + 1 into v_event_sequence from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    'evidence.source_received', null, 'representative',
    v_requirement.title || ' received',
    'The source file is stored privately and is waiting for institution review. Upload does not establish legal validity.',
    array['owner','admin','staff','reviewer','auditor','representative']::text[],
    jsonb_build_object('requirement_key', v_requirement.requirement_key, 'artifact_id', p_artifact_id, 'review_status', 'pending')
  ) returning event_id into v_event_id;
  insert into public.organization_audit_events (organization_id, actor_user_id, event_type, subject_type, subject_id, payload)
  values (v_record.organization_id, null, 'evidence.source_received', 'authority_record', v_record.id,
    jsonb_build_object('requirement_key', v_requirement.requirement_key, 'artifact_id', p_artifact_id, 'event_id', v_event_id));

  v_result := jsonb_build_object('authority_record_id', v_record.id, 'artifact_id', p_artifact_id, 'requirement_key', v_requirement.requirement_key, 'status', v_requirement.status, 'version', v_record.version, 'event_id', v_event_id);
  insert into authority_private.participant_command_receipts (invitation_id, command_name, idempotency_key, payload_hash, result)
  values (v_session.invitation_id, 'evidence_upload:' || p_requirement_key, p_idempotency_key, v_payload_hash, v_result);
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.submit_representative_certification_v1(
  p_session_token text,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_acknowledged boolean,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token_hash text;
  v_session authority_private.participant_sessions%rowtype;
  v_record public.authority_records%rowtype;
  v_requirement public.authority_requirements%rowtype;
  v_receipt authority_private.participant_command_receipts%rowtype;
  v_payload_hash text;
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null then raise exception using errcode = '22023', message = 'idempotency_key_required'; end if;
  if not coalesce(p_acknowledged, false) then raise exception using errcode = '22023', message = 'certification_acknowledgment_required'; end if;
  if lower(btrim(coalesce(p_session_token, ''))) !~ '^[0-9a-f]{64}$' then raise exception using errcode = 'P0002', message = 'participant_session_unavailable'; end if;
  v_token_hash := encode(extensions.digest(convert_to(lower(btrim(p_session_token)), 'UTF8'), 'sha256'), 'hex');
  select * into v_session from authority_private.participant_sessions
  where token_hash = v_token_hash and authority_record_id = p_authority_record_id
    and participant_role = 'representative' and status = 'active' and expires_at > now();
  if not found then raise exception using errcode = 'P0002', message = 'participant_session_unavailable'; end if;
  v_payload_hash := authority_private.payload_hash(jsonb_build_object('record_id', p_authority_record_id, 'expected_version', p_expected_version, 'acknowledged', true, 'text_version', 'representative-certification-v1'));
  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':evidence', 0));
  select * into v_receipt from authority_private.participant_command_receipts
  where invitation_id = v_session.invitation_id and command_name = 'representative_certification' and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.payload_hash <> v_payload_hash then raise exception using errcode = '22023', message = 'idempotency_payload_mismatch'; end if;
    return v_receipt.result || jsonb_build_object('replayed', true);
  end if;
  select * into v_record from public.authority_records where id = p_authority_record_id for update;
  if v_record.status not in ('evidence_required', 'information_requested') then raise exception using errcode = '42501', message = 'evidence_not_available'; end if;
  if v_record.version <> p_expected_version then raise exception using errcode = 'P0001', message = 'participant_record_changed'; end if;
  select * into v_requirement from public.authority_requirements
  where authority_record_id = p_authority_record_id and requirement_key = 'representative_certification' for update;
  if not found then raise exception using errcode = 'P0002', message = 'evidence_requirement_unavailable'; end if;
  if v_requirement.status = 'completed' then raise exception using errcode = '22023', message = 'certification_already_saved'; end if;

  insert into public.authority_attestations (organization_id, authority_record_id, requirement_id, participant_role, text_version)
  values (v_record.organization_id, v_record.id, v_requirement.id, 'representative', 'representative-certification-v1');
  update public.authority_requirements set status = 'completed', version = version + 1, completed_at = now(), updated_at = now()
  where id = v_requirement.id returning * into v_requirement;
  update public.authority_records set version = version + 1, updated_at = now() where id = v_record.id returning * into v_record;
  select coalesce(max(sequence), 0) + 1 into v_event_sequence from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    'evidence.certification_completed', null, 'representative',
    'Representative certification completed',
    'The representative confirmed the duty to act only within this request. The exact certification version and time are preserved.',
    array['owner','admin','staff','reviewer','auditor','representative']::text[],
    jsonb_build_object('requirement_key', 'representative_certification', 'text_version', 'representative-certification-v1')
  ) returning event_id into v_event_id;
  insert into public.organization_audit_events (organization_id, actor_user_id, event_type, subject_type, subject_id, payload)
  values (v_record.organization_id, null, 'evidence.certification_completed', 'authority_record', v_record.id,
    jsonb_build_object('text_version', 'representative-certification-v1', 'event_id', v_event_id));
  v_result := jsonb_build_object('authority_record_id', v_record.id, 'requirement_key', 'representative_certification', 'status', 'completed', 'version', v_record.version, 'event_id', v_event_id);
  insert into authority_private.participant_command_receipts (invitation_id, command_name, idempotency_key, payload_hash, result)
  values (v_session.invitation_id, 'representative_certification', p_idempotency_key, v_payload_hash, v_result);
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.review_evidence_artifact_v1(
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_artifact_id uuid,
  p_expected_record_version bigint,
  p_expected_artifact_version bigint,
  p_outcome text,
  p_note text,
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
  v_artifact public.authority_evidence_artifacts%rowtype;
  v_requirement public.authority_requirements%rowtype;
  v_receipt authority_private.command_receipts%rowtype;
  v_payload_hash text;
  v_event_sequence bigint;
  v_event_id uuid;
  v_next_status text;
  v_result jsonb;
begin
  if p_idempotency_key is null then raise exception using errcode = '22023', message = 'idempotency_key_required'; end if;
  if p_outcome not in ('accepted', 'needs_attention') then raise exception using errcode = '22023', message = 'evidence_review_outcome_invalid'; end if;
  if p_outcome = 'needs_attention' and char_length(btrim(coalesce(p_note, ''))) not between 3 and 500 then raise exception using errcode = '22023', message = 'evidence_review_note_required'; end if;
  v_actor_role := authority_private.assert_authority_record_operator(p_organization_id);
  if v_actor_role not in ('owner', 'admin', 'reviewer') then raise exception using errcode = '42501', message = 'evidence_review_not_allowed'; end if;
  v_payload_hash := authority_private.payload_hash(jsonb_build_object('record_id', p_authority_record_id, 'artifact_id', p_artifact_id, 'expected_record_version', p_expected_record_version, 'expected_artifact_version', p_expected_artifact_version, 'outcome', p_outcome, 'note', nullif(btrim(coalesce(p_note, '')), '')));
  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':evidence', 0));
  select * into v_receipt from authority_private.command_receipts where actor_user_id = v_actor and command_name = 'review_evidence_artifact' and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.payload_hash <> v_payload_hash then raise exception using errcode = '22023', message = 'idempotency_payload_mismatch'; end if;
    return v_receipt.result || jsonb_build_object('replayed', true);
  end if;
  select * into v_record from public.authority_records where id = p_authority_record_id and organization_id = p_organization_id for update;
  if not found or v_record.status not in ('evidence_required', 'information_requested') then raise exception using errcode = '42501', message = 'evidence_review_not_available'; end if;
  if v_record.version <> p_expected_record_version then raise exception using errcode = 'P0001', message = 'request_changed'; end if;
  select * into v_artifact from public.authority_evidence_artifacts where id = p_artifact_id and authority_record_id = v_record.id for update;
  if not found or v_artifact.version <> p_expected_artifact_version or v_artifact.review_status <> 'pending' then raise exception using errcode = 'P0001', message = 'evidence_artifact_changed'; end if;
  select * into v_requirement from public.authority_requirements where id = v_artifact.requirement_id for update;

  update public.authority_evidence_artifacts set review_status = p_outcome, reviewer_user_id = v_actor,
    reviewer_note = nullif(btrim(coalesce(p_note, '')), ''), reviewed_at = now(), version = version + 1, updated_at = now()
  where id = v_artifact.id returning * into v_artifact;
  update public.authority_requirements set status = case when p_outcome = 'accepted' then 'completed' else 'needs_attention' end,
    completed_at = case when p_outcome = 'accepted' then now() else null end, version = version + 1, updated_at = now()
  where id = v_requirement.id returning * into v_requirement;

  if p_outcome = 'accepted' and not exists (
    select 1 from public.authority_requirements where authority_record_id = v_record.id and status <> 'completed'
  ) then v_next_status := 'ready_to_submit'; else v_next_status := 'evidence_required'; end if;
  update public.authority_records set status = v_next_status, version = version + 1, updated_at = now()
  where id = v_record.id returning * into v_record;
  select coalesce(max(sequence), 0) + 1 into v_event_sequence from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    case when p_outcome = 'accepted' then 'evidence.source_accepted' else 'evidence.more_information_needed' end,
    v_actor, v_actor_role,
    case when p_outcome = 'accepted' then v_requirement.title || ' accepted for this review' else v_requirement.title || ' needs attention' end,
    case when p_outcome = 'accepted' then 'The institution reviewer accepted this source for the current request. This is not a universal legal-validity decision.' else btrim(p_note) end,
    array['owner','admin','staff','reviewer','auditor','representative']::text[],
    jsonb_build_object('requirement_key', v_requirement.requirement_key, 'artifact_id', v_artifact.id, 'review_status', p_outcome, 'next_status', v_next_status)
  ) returning event_id into v_event_id;
  insert into public.organization_audit_events (organization_id, actor_user_id, event_type, subject_type, subject_id, payload)
  values (v_record.organization_id, v_actor, case when p_outcome = 'accepted' then 'evidence.source_accepted' else 'evidence.more_information_needed' end,
    'authority_record', v_record.id, jsonb_build_object('artifact_id', v_artifact.id, 'event_id', v_event_id));
  v_result := jsonb_build_object('authority_record_id', v_record.id, 'artifact_id', v_artifact.id, 'requirement_key', v_requirement.requirement_key, 'review_status', p_outcome, 'status', v_next_status, 'version', v_record.version, 'event_id', v_event_id);
  insert into authority_private.command_receipts (actor_user_id, command_name, idempotency_key, payload_hash, result)
  values (v_actor, 'review_evidence_artifact', p_idempotency_key, v_payload_hash, v_result);
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.authorize_evidence_view_v1(
  p_organization_id uuid,
  p_artifact_id uuid,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_artifact public.authority_evidence_artifacts%rowtype;
begin
  if not exists (
    select 1 from public.organization_memberships
    where organization_id = p_organization_id and user_id = p_actor_user_id and status = 'active'
      and role in ('owner','admin','staff','reviewer','auditor')
  ) then raise exception using errcode = '42501', message = 'evidence_view_not_allowed'; end if;
  select * into v_artifact from public.authority_evidence_artifacts where id = p_artifact_id and organization_id = p_organization_id;
  if not found then raise exception using errcode = 'P0002', message = 'evidence_artifact_unavailable'; end if;
  insert into public.organization_audit_events (organization_id, actor_user_id, event_type, subject_type, subject_id, payload)
  values (p_organization_id, p_actor_user_id, 'evidence.source_viewed', 'authority_evidence_artifact', p_artifact_id,
    jsonb_build_object('authority_record_id', v_artifact.authority_record_id));
  return jsonb_build_object('storage_bucket', v_artifact.storage_bucket, 'storage_path', v_artifact.storage_path, 'original_filename', v_artifact.original_filename, 'media_type', v_artifact.media_type);
end;
$$;

create or replace function public.get_participant_evidence_context_v1(p_session_token text, p_authority_record_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.get_participant_evidence_context_v1(p_session_token, p_authority_record_id); $$;

create or replace function public.record_participant_evidence_upload_v1(
  p_session_token text, p_authority_record_id uuid, p_expected_version bigint,
  p_requirement_key text, p_artifact_id uuid, p_storage_path text,
  p_original_filename text, p_media_type text, p_byte_size bigint,
  p_sha256_hex text, p_idempotency_key uuid
)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.record_participant_evidence_upload_v1(p_session_token, p_authority_record_id, p_expected_version, p_requirement_key, p_artifact_id, p_storage_path, p_original_filename, p_media_type, p_byte_size, p_sha256_hex, p_idempotency_key); $$;

create or replace function public.submit_representative_certification_v1(
  p_session_token text, p_authority_record_id uuid, p_expected_version bigint,
  p_acknowledged boolean, p_idempotency_key uuid
)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.submit_representative_certification_v1(p_session_token, p_authority_record_id, p_expected_version, p_acknowledged, p_idempotency_key); $$;

create or replace function public.review_evidence_artifact_v1(
  p_organization_id uuid, p_authority_record_id uuid, p_artifact_id uuid,
  p_expected_record_version bigint, p_expected_artifact_version bigint,
  p_outcome text, p_note text, p_idempotency_key uuid
)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.review_evidence_artifact_v1(p_organization_id, p_authority_record_id, p_artifact_id, p_expected_record_version, p_expected_artifact_version, p_outcome, p_note, p_idempotency_key); $$;

create or replace function public.authorize_evidence_view_v1(p_organization_id uuid, p_artifact_id uuid, p_actor_user_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.authorize_evidence_view_v1(p_organization_id, p_artifact_id, p_actor_user_id); $$;

alter table public.authority_requirements enable row level security;
alter table public.authority_requirements force row level security;
alter table public.authority_evidence_artifacts enable row level security;
alter table public.authority_evidence_artifacts force row level security;
alter table public.authority_attestations enable row level security;
alter table public.authority_attestations force row level security;

create policy authority_requirements_member_select on public.authority_requirements for select to authenticated
using (authority_private.has_active_membership(organization_id));
create policy authority_evidence_member_select on public.authority_evidence_artifacts for select to authenticated
using (authority_private.has_active_membership(organization_id));
create policy authority_attestations_member_select on public.authority_attestations for select to authenticated
using (authority_private.has_active_membership(organization_id));

revoke all on public.authority_requirements from public, anon, authenticated;
revoke all on public.authority_evidence_artifacts from public, anon, authenticated;
revoke all on public.authority_attestations from public, anon, authenticated;
grant select on public.authority_requirements to authenticated;
grant select on public.authority_evidence_artifacts to authenticated;
grant select on public.authority_attestations to authenticated;

revoke execute on function authority_private.seed_authority_requirements_v1() from public, anon, authenticated;
revoke execute on function authority_private.get_participant_evidence_context_v1(text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.record_participant_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.submit_representative_certification_v1(text, uuid, bigint, boolean, uuid) from public, anon, authenticated;
revoke execute on function authority_private.review_evidence_artifact_v1(uuid, uuid, uuid, bigint, bigint, text, text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.authorize_evidence_view_v1(uuid, uuid, uuid) from public, anon, authenticated;

revoke execute on function public.get_participant_evidence_context_v1(text, uuid) from public, anon, authenticated;
revoke execute on function public.record_participant_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) from public, anon, authenticated;
revoke execute on function public.submit_representative_certification_v1(text, uuid, bigint, boolean, uuid) from public, anon, authenticated;
revoke execute on function public.review_evidence_artifact_v1(uuid, uuid, uuid, bigint, bigint, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.authorize_evidence_view_v1(uuid, uuid, uuid) from public, anon, authenticated;

grant execute on function public.get_participant_evidence_context_v1(text, uuid) to anon, authenticated;
grant execute on function public.record_participant_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) to service_role;
grant execute on function public.submit_representative_certification_v1(text, uuid, bigint, boolean, uuid) to service_role;
grant execute on function public.review_evidence_artifact_v1(uuid, uuid, uuid, bigint, bigint, text, text, uuid) to authenticated;
grant execute on function public.authorize_evidence_view_v1(uuid, uuid, uuid) to service_role;

revoke all on storage.objects from anon, authenticated;

comment on table public.authority_evidence_artifacts is 'Private source metadata. Upload, provider processing, human review, and institution decision remain separate.';
comment on function public.record_participant_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) is 'Service-only participant evidence receipt after private storage upload.';
