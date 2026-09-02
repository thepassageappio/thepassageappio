create or replace function public.get_participant_evidence_context_v1(p_session_token text, p_authority_record_id uuid)
returns jsonb language sql security definer set search_path = ''
as $$ select authority_private.get_participant_evidence_context_v1(p_session_token, p_authority_record_id); $$;

create or replace function public.record_participant_evidence_upload_v1(
  p_session_token text, p_authority_record_id uuid, p_expected_version bigint,
  p_requirement_key text, p_artifact_id uuid, p_storage_path text,
  p_original_filename text, p_media_type text, p_byte_size bigint,
  p_sha256_hex text, p_idempotency_key uuid
)
returns jsonb language sql security definer set search_path = ''
as $$ select authority_private.record_participant_evidence_upload_v1(p_session_token, p_authority_record_id, p_expected_version, p_requirement_key, p_artifact_id, p_storage_path, p_original_filename, p_media_type, p_byte_size, p_sha256_hex, p_idempotency_key); $$;

create or replace function public.submit_representative_certification_v1(
  p_session_token text, p_authority_record_id uuid, p_expected_version bigint,
  p_acknowledged boolean, p_idempotency_key uuid
)
returns jsonb language sql security definer set search_path = ''
as $$ select authority_private.submit_representative_certification_v1(p_session_token, p_authority_record_id, p_expected_version, p_acknowledged, p_idempotency_key); $$;

create or replace function public.review_evidence_artifact_v1(
  p_organization_id uuid, p_authority_record_id uuid, p_artifact_id uuid,
  p_expected_record_version bigint, p_expected_artifact_version bigint,
  p_outcome text, p_note text, p_idempotency_key uuid
)
returns jsonb language sql security definer set search_path = ''
as $$ select authority_private.review_evidence_artifact_v1(p_organization_id, p_authority_record_id, p_artifact_id, p_expected_record_version, p_expected_artifact_version, p_outcome, p_note, p_idempotency_key); $$;

create or replace function public.authorize_evidence_view_v1(p_organization_id uuid, p_artifact_id uuid, p_actor_user_id uuid)
returns jsonb language sql security definer set search_path = ''
as $$ select authority_private.authorize_evidence_view_v1(p_organization_id, p_artifact_id, p_actor_user_id); $$;

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

comment on function public.get_participant_evidence_context_v1(text, uuid) is
  'Public boundary for a role-bound participant session. The private implementation validates the hashed token and record state.';
comment on function public.record_participant_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) is
  'Service-only boundary that records immutable metadata after a private storage upload.';
comment on function public.submit_representative_certification_v1(text, uuid, bigint, boolean, uuid) is
  'Service-only boundary that records a representative certification after validating the role-bound session.';
comment on function public.review_evidence_artifact_v1(uuid, uuid, uuid, bigint, bigint, text, text, uuid) is
  'Authenticated institution boundary. The private implementation enforces membership, reviewer role, concurrency, and idempotency.';
comment on function public.authorize_evidence_view_v1(uuid, uuid, uuid) is
  'Service-only boundary that verifies institution access and appends an evidence view audit event.';
