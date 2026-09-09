create or replace function authority_private.create_sample_access_lead_v2(
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
  v_source_path text;
begin
  if p_actor_user_id is null or p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'sample_access_lead_invalid';
  end if;

  select * into v_existing
  from authority_private.sample_access_leads
  where idempotency_key = p_idempotency_key;

  if found then
    if v_existing.actor_user_id <> p_actor_user_id
       or v_existing.consent_version <> p_consent_version then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return jsonb_build_object('reference_code', v_existing.reference_code, 'replayed', true);
  end if;

  select * into v_existing
  from authority_private.sample_access_leads
  where actor_user_id = p_actor_user_id
    and consent_version = p_consent_version;

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
  v_source_path := left(coalesce(nullif(btrim(p_source_path), ''), '/sample/access'), 240);

  if v_email not like '%_@_%._%'
     or length(v_name) < 1
     or p_consent_version <> 'sample-access-contact-2026.2' then
    raise exception using errcode = '22023', message = 'sample_access_lead_invalid';
  end if;

  v_email_hash := encode(extensions.digest(convert_to(v_email, 'UTF8'), 'sha256'), 'hex');

  insert into authority_private.sample_access_leads (
    actor_user_id, full_name, email_normalized, email_sha256,
    consent_version, source_path, idempotency_key
  ) values (
    p_actor_user_id, v_name, v_email, v_email_hash,
    p_consent_version, v_source_path, p_idempotency_key
  ) returning * into v_lead;

  insert into authority_private.commercial_event_ledger (
    aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
  ) values
  (
    'sample_access_lead', v_lead.id, 'commercial.sample_access_opted_in', v_lead.created_at,
    'sample-access-lead:' || v_lead.id::text || ':consent-v2',
    jsonb_build_object(
      'reference_code', v_lead.reference_code,
      'email_sha256', v_lead.email_sha256,
      'consent_version', v_lead.consent_version,
      'privacy_notice_version', 'evaluation-2026.2',
      'source_path', v_lead.source_path,
      'acquisition_source', 'website_sample_gated'
    )
  ),
  (
    'sample_access_lead', v_lead.id, 'commercial.nurture_enrolled', v_lead.created_at,
    'sample-access-lead:' || v_lead.id::text || ':nurture-v1',
    jsonb_build_object(
      'reference_code', v_lead.reference_code,
      'email_sha256', v_lead.email_sha256,
      'consent_version', v_lead.consent_version,
      'privacy_notice_version', 'evaluation-2026.2',
      'source_path', v_lead.source_path,
      'acquisition_source', 'website_sample_gated',
      'nurture_program', 'sample_evaluator',
      'nurture_status', 'held_until_p1_p2'
    )
  );

  insert into authority_private.integration_outbox (
    destination, operation, subject_type, subject_id, projection_version,
    idempotency_key, payload
  ) values (
    'hubspot', 'upsert_sample_access_lead', 'sample_access_lead', v_lead.id, 2,
    'hubspot:sample-access-lead:' || v_lead.id::text || ':v2',
    jsonb_build_object(
      'reference_code', v_lead.reference_code,
      'full_name', v_lead.full_name,
      'email', v_lead.email_normalized,
      'consent_version', v_lead.consent_version,
      'privacy_notice_version', 'evaluation-2026.2',
      'source_path', v_lead.source_path,
      'acquisition_source', 'website_sample_gated',
      'acquisition_source_label', 'Website - Gated Sample',
      'nurture_program', 'sample_evaluator',
      'nurture_status', 'held_until_p1_p2'
    )
  );

  return jsonb_build_object('reference_code', v_lead.reference_code, 'replayed', false);
end;
$$;

create or replace function public.create_sample_access_lead_v2(
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
  select authority_private.create_sample_access_lead_v2(
    p_actor_user_id, p_consent_version, p_source_path, p_idempotency_key
  );
$$;

revoke execute on function authority_private.create_sample_access_lead_v2(uuid, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.create_sample_access_lead_v2(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function authority_private.create_sample_access_lead_v2(uuid, text, text, uuid) to service_role;
grant execute on function public.create_sample_access_lead_v2(uuid, text, text, uuid) to service_role;

comment on function public.create_sample_access_lead_v2(uuid, text, text, uuid) is
  'Service-only boundary that records sample consent, gated-website attribution, held nurture enrollment, and a HubSpot Contact projection.';
