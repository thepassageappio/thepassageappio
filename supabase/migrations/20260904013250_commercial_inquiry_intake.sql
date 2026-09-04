create table authority_private.commercial_inquiries (
  sequence_id bigint generated always as identity unique,
  id uuid primary key default gen_random_uuid(),
  reference_code text generated always as ('PAI-' || lpad(sequence_id::text, 8, '0')) stored unique,
  inquiry_type text not null check (inquiry_type in ('demo', 'pilot', 'general', 'billing', 'feature')),
  full_name text not null check (length(btrim(full_name)) between 2 and 120),
  email_normalized text not null check (email_normalized = lower(btrim(email_normalized)) and email_normalized like '%_@_%._%'),
  email_sha256 text not null check (email_sha256 ~ '^[0-9a-f]{64}$'),
  organization_name text not null check (length(btrim(organization_name)) between 2 and 200),
  organization_type text not null check (organization_type in ('bank', 'credit_union', 'law_firm', 'service_organization', 'fintech', 'other')),
  job_role text not null check (length(btrim(job_role)) between 2 and 120),
  current_process text not null check (current_process in ('email_and_documents', 'branch_or_call_center', 'case_management', 'document_platform', 'existing_vendor', 'other')),
  annual_volume_band text not null check (annual_volume_band in ('under_100', '100_499', '500_1999', '2000_plus', 'unknown')),
  message text not null default '' check (length(message) <= 1200),
  consent_version text not null,
  source_path text not null default '/contact' check (length(source_path) <= 240),
  status text not null default 'new' check (status in ('new', 'routed', 'qualified', 'closed')),
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now()
);

create index commercial_inquiries_rate_limit_idx
  on authority_private.commercial_inquiries(email_sha256, created_at desc);

create or replace function authority_private.create_commercial_inquiry_v1(
  p_inquiry_type text,
  p_full_name text,
  p_email text,
  p_organization_name text,
  p_organization_type text,
  p_job_role text,
  p_current_process text,
  p_annual_volume_band text,
  p_message text,
  p_consent_version text,
  p_source_path text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing authority_private.commercial_inquiries%rowtype;
  v_inquiry authority_private.commercial_inquiries%rowtype;
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_email_hash text;
  v_payload_hash text;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  select * into v_existing
  from authority_private.commercial_inquiries
  where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('reference_code', v_existing.reference_code, 'replayed', true);
  end if;

  if p_inquiry_type not in ('demo', 'pilot', 'general', 'billing', 'feature')
     or length(btrim(coalesce(p_full_name, ''))) not between 2 and 120
     or v_email not like '%_@_%._%'
     or length(btrim(coalesce(p_organization_name, ''))) not between 2 and 200
     or p_organization_type not in ('bank', 'credit_union', 'law_firm', 'service_organization', 'fintech', 'other')
     or length(btrim(coalesce(p_job_role, ''))) not between 2 and 120
     or p_current_process not in ('email_and_documents', 'branch_or_call_center', 'case_management', 'document_platform', 'existing_vendor', 'other')
     or p_annual_volume_band not in ('under_100', '100_499', '500_1999', '2000_plus', 'unknown')
     or length(btrim(coalesce(p_message, ''))) > 1200
     or p_consent_version <> 'commercial-contact-2026.1' then
    raise exception using errcode = '22023', message = 'commercial_inquiry_invalid';
  end if;

  v_email_hash := encode(extensions.digest(convert_to(v_email, 'UTF8'), 'sha256'), 'hex');
  if (select count(*) from authority_private.commercial_inquiries where email_sha256 = v_email_hash and created_at > now() - interval '1 hour') >= 5 then
    raise exception using errcode = 'P0001', message = 'commercial_inquiry_rate_limited';
  end if;

  insert into authority_private.commercial_inquiries (
    inquiry_type, full_name, email_normalized, email_sha256, organization_name,
    organization_type, job_role, current_process, annual_volume_band, message,
    consent_version, source_path, idempotency_key
  ) values (
    p_inquiry_type, btrim(p_full_name), v_email, v_email_hash, btrim(p_organization_name),
    p_organization_type, btrim(p_job_role), p_current_process, p_annual_volume_band,
    btrim(coalesce(p_message, '')), p_consent_version, left(coalesce(nullif(btrim(p_source_path), ''), '/contact'), 240),
    p_idempotency_key
  ) returning * into v_inquiry;

  v_payload_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'inquiry_type', v_inquiry.inquiry_type,
    'email_sha256', v_inquiry.email_sha256,
    'organization_type', v_inquiry.organization_type,
    'annual_volume_band', v_inquiry.annual_volume_band,
    'consent_version', v_inquiry.consent_version
  )::text, 'UTF8'), 'sha256'), 'hex');

  insert into authority_private.commercial_event_ledger (
    aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
  ) values (
    'commercial_inquiry', v_inquiry.id, 'commercial.inquiry_received', v_inquiry.created_at,
    'commercial-inquiry:' || v_inquiry.id::text,
    jsonb_build_object(
      'reference_code', v_inquiry.reference_code,
      'inquiry_type', v_inquiry.inquiry_type,
      'organization_type', v_inquiry.organization_type,
      'annual_volume_band', v_inquiry.annual_volume_band,
      'payload_hash', v_payload_hash
    )
  );

  insert into authority_private.integration_outbox (
    destination, operation, subject_type, subject_id, projection_version,
    idempotency_key, payload
  ) values (
    'hubspot', 'upsert_commercial_inquiry', 'commercial_inquiry', v_inquiry.id, 1,
    'hubspot:commercial-inquiry:' || v_inquiry.id::text || ':v1',
    jsonb_build_object(
      'reference_code', v_inquiry.reference_code,
      'inquiry_type', v_inquiry.inquiry_type,
      'full_name', v_inquiry.full_name,
      'email', v_inquiry.email_normalized,
      'organization_name', v_inquiry.organization_name,
      'organization_type', v_inquiry.organization_type,
      'job_role', v_inquiry.job_role,
      'current_process', v_inquiry.current_process,
      'annual_volume_band', v_inquiry.annual_volume_band,
      'message', v_inquiry.message,
      'consent_version', v_inquiry.consent_version,
      'source_path', v_inquiry.source_path
    )
  );

  return jsonb_build_object('reference_code', v_inquiry.reference_code, 'replayed', false);
end;
$$;

create or replace function public.create_commercial_inquiry_v1(
  p_inquiry_type text,
  p_full_name text,
  p_email text,
  p_organization_name text,
  p_organization_type text,
  p_job_role text,
  p_current_process text,
  p_annual_volume_band text,
  p_message text,
  p_consent_version text,
  p_source_path text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.create_commercial_inquiry_v1(
    p_inquiry_type, p_full_name, p_email, p_organization_name, p_organization_type,
    p_job_role, p_current_process, p_annual_volume_band, p_message,
    p_consent_version, p_source_path, p_idempotency_key
  );
$$;

revoke all on authority_private.commercial_inquiries from public, anon, authenticated;
revoke execute on function authority_private.create_commercial_inquiry_v1(text,text,text,text,text,text,text,text,text,text,text,uuid) from public, anon, authenticated;
revoke execute on function public.create_commercial_inquiry_v1(text,text,text,text,text,text,text,text,text,text,text,uuid) from public, anon, authenticated;
grant execute on function authority_private.create_commercial_inquiry_v1(text,text,text,text,text,text,text,text,text,text,text,uuid) to service_role;
grant execute on function public.create_commercial_inquiry_v1(text,text,text,text,text,text,text,text,text,text,text,uuid) to service_role;

comment on table authority_private.commercial_inquiries is 'Private commercial inquiries; participant and authority-record information is prohibited.';
