create or replace function authority_private.retry_integration_outbox_v1(
  p_outbox_id uuid,
  p_retry_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job authority_private.integration_outbox%rowtype;
  v_code text := lower(btrim(coalesce(p_retry_code, '')));
begin
  if p_outbox_id is null or v_code !~ '^[a-z0-9_]{3,80}$' then
    raise exception using errcode = '22023', message = 'integration_outbox_retry_invalid';
  end if;

  select * into v_job
  from authority_private.integration_outbox
  where id = p_outbox_id
  for update;

  if v_job.id is null then
    raise exception using errcode = 'P0002', message = 'integration_outbox_job_not_found';
  end if;
  if v_job.status = 'pending' then
    return jsonb_build_object('outbox_id', v_job.id, 'status', 'pending', 'replayed', true);
  end if;
  if v_job.status <> 'failed' then
    raise exception using errcode = '55000', message = 'integration_outbox_job_not_retryable';
  end if;

  update authority_private.integration_outbox
  set status = 'pending',
      next_attempt_at = null,
      last_error_code = null,
      updated_at = now()
  where id = v_job.id;

  insert into authority_private.commercial_event_ledger (
    aggregate_type,
    aggregate_id,
    event_type,
    occurred_at,
    idempotency_key,
    payload
  ) values (
    v_job.subject_type,
    v_job.subject_id,
    'commercial.integration_outbox_retried',
    now(),
    'integration-outbox-retry:' || v_job.id::text || ':' || v_job.attempts::text || ':' || v_code,
    jsonb_build_object(
      'outbox_id', v_job.id,
      'destination', v_job.destination,
      'operation', v_job.operation,
      'prior_status', v_job.status,
      'prior_error_code', v_job.last_error_code,
      'prior_attempts', v_job.attempts,
      'retry_code', v_code
    )
  ) on conflict (idempotency_key) do nothing;

  return jsonb_build_object('outbox_id', v_job.id, 'status', 'pending', 'replayed', false);
end;
$$;

create or replace function public.retry_integration_outbox_v1(
  p_outbox_id uuid,
  p_retry_code text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.retry_integration_outbox_v1(p_outbox_id, p_retry_code);
$$;

revoke execute on function authority_private.retry_integration_outbox_v1(uuid, text) from public, anon, authenticated;
revoke execute on function public.retry_integration_outbox_v1(uuid, text) from public, anon, authenticated;
grant execute on function authority_private.retry_integration_outbox_v1(uuid, text) to service_role;
grant execute on function public.retry_integration_outbox_v1(uuid, text) to service_role;

comment on function public.retry_integration_outbox_v1(uuid, text) is
  'Service-only, append-only-audited retry for an integration outbox job that ended in failed state.';
