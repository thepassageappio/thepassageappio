create table authority_private.sample_access_leads (
  sequence_id bigint generated always as identity unique,
  id uuid primary key default gen_random_uuid(),
  reference_code text generated always as ('PAS-' || lpad(sequence_id::text, 8, '0')) stored unique,
  actor_user_id uuid not null references auth.users(id),
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  email_normalized text not null check (email_normalized = lower(btrim(email_normalized)) and email_normalized like '%_@_%._%'),
  email_sha256 text not null check (email_sha256 ~ '^[0-9a-f]{64}$'),
  consent_version text not null,
  source_path text not null default '/sample/access' check (length(source_path) <= 240),
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  unique (actor_user_id)
);

create or replace function authority_private.prevent_sample_access_lead_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '55000', message = 'sample_access_leads_are_append_only';
end;
$$;

create trigger sample_access_leads_append_only
before update or delete on authority_private.sample_access_leads
for each row execute function authority_private.prevent_sample_access_lead_change();

create or replace function authority_private.create_sample_access_lead_v1(
  p_actor_user_id uuid,
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
  v_user auth.users%rowtype;
  v_existing authority_private.sample_access_leads%rowtype;
  v_lead authority_private.sample_access_leads%rowtype;
  v_email text;
  v_name text;
  v_email_hash text;
begin
  if p_actor_user_id is null or p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'sample_access_lead_invalid';
  end if;

  select * into v_existing
  from authority_private.sample_access_leads
  where idempotency_key = p_idempotency_key;

  if found then
    if v_existing.actor_user_id <> p_actor_user_id then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return jsonb_build_object('reference_code', v_existing.reference_code, 'replayed', true);
  end if;

  select * into v_existing
  from authority_private.sample_access_leads
  where actor_user_id = p_actor_user_id;

  if found then
    return jsonb_build_object('reference_code', v_existing.reference_code, 'replayed', true);
  end if;

  select * into v_user from auth.users where id = p_actor_user_id;
  if v_user.id is null or v_user.email_confirmed_at is null then
    raise exception using errcode = '22023', message = 'sample_access_identity_unverified';
  end if;

  v_email := lower(btrim(coalesce(v_user.email, '')));
  v_name := left(btrim(coalesce(
    nullif(v_user.raw_user_meta_data->>'full_name', ''),
    nullif(v_user.raw_user_meta_data->>'name', ''),
    split_part(v_email, '@', 1)
  )), 120);

  if v_email not like '%_@_%._%'
     or length(v_name) < 1
     or p_consent_version <> 'sample-access-contact-2026.1' then
    raise exception using errcode = '22023', message = 'sample_access_lead_invalid';
  end if;

  v_email_hash := encode(extensions.digest(convert_to(v_email, 'UTF8'), 'sha256'), 'hex');

  insert into authority_private.sample_access_leads (
    actor_user_id, full_name, email_normalized, email_sha256,
    consent_version, source_path, idempotency_key
  ) values (
    p_actor_user_id, v_name, v_email, v_email_hash,
    p_consent_version, left(coalesce(nullif(btrim(p_source_path), ''), '/sample/access'), 240), p_idempotency_key
  ) returning * into v_lead;

  insert into authority_private.commercial_event_ledger (
    aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
  ) values (
    'sample_access_lead', v_lead.id, 'commercial.sample_access_opted_in', v_lead.created_at,
    'sample-access-lead:' || v_lead.id::text,
    jsonb_build_object(
      'reference_code', v_lead.reference_code,
      'email_sha256', v_lead.email_sha256,
      'consent_version', v_lead.consent_version,
      'source_path', v_lead.source_path
    )
  );

  insert into authority_private.integration_outbox (
    destination, operation, subject_type, subject_id, projection_version,
    idempotency_key, payload
  ) values (
    'hubspot', 'upsert_sample_access_lead', 'sample_access_lead', v_lead.id, 1,
    'hubspot:sample-access-lead:' || v_lead.id::text || ':v1',
    jsonb_build_object(
      'reference_code', v_lead.reference_code,
      'full_name', v_lead.full_name,
      'email', v_lead.email_normalized,
      'consent_version', v_lead.consent_version,
      'source_path', v_lead.source_path
    )
  );

  return jsonb_build_object('reference_code', v_lead.reference_code, 'replayed', false);
end;
$$;

create or replace function public.create_sample_access_lead_v1(
  p_actor_user_id uuid,
  p_consent_version text,
  p_source_path text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.create_sample_access_lead_v1(
    p_actor_user_id, p_consent_version, p_source_path, p_idempotency_key
  );
$$;

create or replace function authority_private.has_sample_access_lead_v1(p_actor_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from authority_private.sample_access_leads where actor_user_id = p_actor_user_id
  );
$$;

create or replace function public.has_sample_access_lead_v1(p_actor_user_id uuid)
returns boolean
language sql
security invoker
set search_path = ''
stable
as $$
  select authority_private.has_sample_access_lead_v1(p_actor_user_id);
$$;

create or replace function authority_private.claim_hubspot_outbox_v1()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job authority_private.integration_outbox%rowtype;
  v_projection jsonb;
begin
  with candidate as (
    select id
    from authority_private.integration_outbox
    where destination = 'hubspot'
      and operation in ('upsert_commercial_inquiry', 'upsert_sample_access_lead')
      and (
        (status in ('pending', 'retrying') and coalesce(next_attempt_at, now()) <= now())
        or (status = 'processing' and updated_at < now() - interval '15 minutes')
      )
    order by created_at
    for update skip locked
    limit 1
  )
  update authority_private.integration_outbox as outbox
  set status = 'processing', attempts = attempts + 1, updated_at = now(), last_error_code = null
  from candidate
  where outbox.id = candidate.id
  returning outbox.* into v_job;

  if v_job.id is null then return null; end if;

  v_projection := v_job.payload || jsonb_build_object(
    'contact_key', encode(extensions.digest(convert_to(lower(btrim(v_job.payload->>'email')), 'UTF8'), 'sha256'), 'hex')
  );

  if v_job.operation = 'upsert_commercial_inquiry' then
    v_projection := v_projection || jsonb_build_object(
      'company_key', encode(extensions.digest(convert_to(
        lower(btrim(v_job.payload->>'organization_type')) || ':' || lower(btrim(v_job.payload->>'organization_name')),
        'UTF8'
      ), 'sha256'), 'hex')
    );
  end if;

  return jsonb_build_object(
    'id', v_job.id,
    'operation', v_job.operation,
    'attempts', v_job.attempts,
    'idempotency_key', v_job.idempotency_key,
    'payload', v_projection
  );
end;
$$;

revoke all on authority_private.sample_access_leads from public, anon, authenticated;
revoke execute on function authority_private.prevent_sample_access_lead_change() from public, anon, authenticated;
revoke execute on function authority_private.create_sample_access_lead_v1(uuid, text, text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.has_sample_access_lead_v1(uuid) from public, anon, authenticated;
revoke execute on function public.create_sample_access_lead_v1(uuid, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.has_sample_access_lead_v1(uuid) from public, anon, authenticated;
grant execute on function authority_private.create_sample_access_lead_v1(uuid, text, text, uuid) to service_role;
grant execute on function authority_private.has_sample_access_lead_v1(uuid) to service_role;
grant execute on function public.create_sample_access_lead_v1(uuid, text, text, uuid) to service_role;
grant execute on function public.has_sample_access_lead_v1(uuid) to service_role;

comment on table authority_private.sample_access_leads is 'Append-only sample-access contact consents, kept separate from authority records and participant data.';
comment on function public.create_sample_access_lead_v1(uuid, text, text, uuid) is 'Service-only boundary that records verified sample-access consent and queues a HubSpot Contact projection.';
