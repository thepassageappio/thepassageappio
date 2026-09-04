alter table authority_private.integration_outbox
  add column if not exists provider_result jsonb;

create or replace function authority_private.claim_hubspot_outbox_v1()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job authority_private.integration_outbox%rowtype;
begin
  with candidate as (
    select id
    from authority_private.integration_outbox
    where destination = 'hubspot'
      and operation = 'upsert_commercial_inquiry'
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

  return jsonb_build_object(
    'id', v_job.id,
    'attempts', v_job.attempts,
    'idempotency_key', v_job.idempotency_key,
    'payload', v_job.payload || jsonb_build_object(
      'company_key', encode(extensions.digest(convert_to(
        lower(btrim(v_job.payload->>'organization_type')) || ':' || lower(btrim(v_job.payload->>'organization_name')),
        'UTF8'
      ), 'sha256'), 'hex'),
      'contact_key', encode(extensions.digest(convert_to(lower(btrim(v_job.payload->>'email')), 'UTF8'), 'sha256'), 'hex')
    )
  );
end;
$$;

create or replace function authority_private.complete_hubspot_outbox_v1(
  p_outbox_id uuid,
  p_provider_result jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job authority_private.integration_outbox%rowtype;
begin
  if p_outbox_id is null or jsonb_typeof(p_provider_result) <> 'object' then
    raise exception using errcode = '22023', message = 'hubspot_result_invalid';
  end if;

  select * into v_job from authority_private.integration_outbox where id = p_outbox_id for update;
  if v_job.id is null then raise exception using errcode = 'P0002', message = 'hubspot_job_not_found'; end if;
  if v_job.status = 'applied' then
    return jsonb_build_object('outbox_id', v_job.id, 'replayed', true, 'status', v_job.status);
  end if;
  if v_job.status <> 'processing' then raise exception using errcode = '55000', message = 'hubspot_job_not_claimed'; end if;

  update authority_private.integration_outbox
  set status = 'applied', provider_result = p_provider_result, updated_at = now(), next_attempt_at = null
  where id = v_job.id;

  insert into authority_private.commercial_event_ledger (
    aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
  ) values (
    v_job.subject_type, v_job.subject_id, 'commercial.hubspot_projection_applied', now(),
    'hubspot-outbox-applied:' || v_job.id::text,
    jsonb_build_object('outbox_id', v_job.id, 'operation', v_job.operation, 'provider_result', p_provider_result)
  ) on conflict (idempotency_key) do nothing;

  return jsonb_build_object('outbox_id', v_job.id, 'replayed', false, 'status', 'applied');
end;
$$;

create or replace function authority_private.fail_hubspot_outbox_v1(
  p_outbox_id uuid,
  p_error_code text,
  p_retryable boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job authority_private.integration_outbox%rowtype;
  v_status text;
begin
  if p_outbox_id is null or btrim(coalesce(p_error_code, '')) !~ '^[a-z0-9_]{3,80}$' then
    raise exception using errcode = '22023', message = 'hubspot_failure_invalid';
  end if;
  select * into v_job from authority_private.integration_outbox where id = p_outbox_id for update;
  if v_job.id is null then raise exception using errcode = 'P0002', message = 'hubspot_job_not_found'; end if;
  if v_job.status = 'applied' then return jsonb_build_object('outbox_id', v_job.id, 'status', 'applied'); end if;
  if v_job.status <> 'processing' then raise exception using errcode = '55000', message = 'hubspot_job_not_claimed'; end if;

  v_status := case when p_retryable and v_job.attempts < 8 then 'retrying' else 'failed' end;
  update authority_private.integration_outbox
  set status = v_status,
      last_error_code = btrim(p_error_code),
      next_attempt_at = case when v_status = 'retrying'
        then now() + make_interval(secs => least(3600, (15 * power(2, greatest(0, v_job.attempts - 1)))::integer))
        else null end,
      updated_at = now()
  where id = v_job.id;
  return jsonb_build_object('outbox_id', v_job.id, 'status', v_status, 'attempts', v_job.attempts);
end;
$$;

create or replace function public.claim_hubspot_outbox_v1()
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.claim_hubspot_outbox_v1(); $$;

create or replace function public.complete_hubspot_outbox_v1(p_outbox_id uuid, p_provider_result jsonb)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.complete_hubspot_outbox_v1(p_outbox_id, p_provider_result); $$;

create or replace function public.fail_hubspot_outbox_v1(p_outbox_id uuid, p_error_code text, p_retryable boolean)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.fail_hubspot_outbox_v1(p_outbox_id, p_error_code, p_retryable); $$;

revoke execute on function authority_private.claim_hubspot_outbox_v1() from public, anon, authenticated;
revoke execute on function authority_private.complete_hubspot_outbox_v1(uuid, jsonb) from public, anon, authenticated;
revoke execute on function authority_private.fail_hubspot_outbox_v1(uuid, text, boolean) from public, anon, authenticated;
revoke execute on function public.claim_hubspot_outbox_v1() from public, anon, authenticated;
revoke execute on function public.complete_hubspot_outbox_v1(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.fail_hubspot_outbox_v1(uuid, text, boolean) from public, anon, authenticated;
grant execute on function authority_private.claim_hubspot_outbox_v1() to service_role;
grant execute on function authority_private.complete_hubspot_outbox_v1(uuid, jsonb) to service_role;
grant execute on function authority_private.fail_hubspot_outbox_v1(uuid, text, boolean) to service_role;
grant execute on function public.claim_hubspot_outbox_v1() to service_role;
grant execute on function public.complete_hubspot_outbox_v1(uuid, jsonb) to service_role;
grant execute on function public.fail_hubspot_outbox_v1(uuid, text, boolean) to service_role;
