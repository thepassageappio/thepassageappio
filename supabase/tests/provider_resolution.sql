-- Executable coverage for auditable provider/integration remediation.
-- Run only against a disposable local database. Everything rolls back.

begin;

do $$
declare
  v_subject_id uuid := gen_random_uuid();
  v_outbox_id uuid := gen_random_uuid();
  v_provider_id uuid;
  v_result jsonb;
  v_count integer;
begin
  insert into authority_private.provider_event_inbox (
    provider, provider_event_id, signature_status, body_sha256, status, payload
  ) values (
    'stripe', 'evt_test_operator_resolution', 'valid', repeat('a', 64), 'failed',
    jsonb_build_object('id', 'evt_test_operator_resolution', 'livemode', false)
  ) returning id into v_provider_id;

  insert into authority_private.integration_outbox (
    id, destination, operation, subject_type, subject_id, projection_version,
    idempotency_key, payload, status
  ) values (
    v_outbox_id, 'hubspot', 'upsert_commercial_inquiry', 'commercial_inquiry',
    v_subject_id, 1, 'test-provider-resolution-outbox', '{}'::jsonb, 'pending'
  );

  v_result := public.resolve_provider_event_v1(
    'stripe', 'evt_test_operator_resolution', 'synthetic_test_event'
  );
  if v_result->>'status' <> 'ignored' or (v_result->>'replayed')::boolean then
    raise exception 'provider resolution did not apply: %', v_result;
  end if;

  v_result := public.resolve_provider_event_v1(
    'stripe', 'evt_test_operator_resolution', 'synthetic_test_event'
  );
  if not (v_result->>'replayed')::boolean then
    raise exception 'provider resolution was not idempotent: %', v_result;
  end if;

  select count(*) into v_count
  from authority_private.commercial_event_ledger
  where idempotency_key = 'provider-event-resolution:' || v_provider_id::text
    and payload->>'previous_status' = 'failed'
    and payload->>'resolution_code' = 'synthetic_test_event';
  if v_count <> 1 then
    raise exception 'provider resolution audit event missing or duplicated: %', v_count;
  end if;

  v_result := public.cancel_integration_outbox_v1(v_outbox_id, 'internal_demo_no_worker');
  if v_result->>'status' <> 'canceled' or (v_result->>'replayed')::boolean then
    raise exception 'outbox cancellation did not apply: %', v_result;
  end if;

  v_result := public.cancel_integration_outbox_v1(v_outbox_id, 'internal_demo_no_worker');
  if not (v_result->>'replayed')::boolean then
    raise exception 'outbox cancellation was not idempotent: %', v_result;
  end if;

  select count(*) into v_count
  from authority_private.commercial_event_ledger
  where idempotency_key = 'integration-outbox-canceled:' || v_outbox_id::text
    and payload->>'previous_status' = 'pending'
    and payload->>'cancellation_code' = 'internal_demo_no_worker';
  if v_count <> 1 then
    raise exception 'outbox cancellation audit event missing or duplicated: %', v_count;
  end if;
end;
$$;

-- Browser and ordinary authenticated sessions cannot perform operator cleanup.
set local role authenticated;
do $$
begin
  begin
    perform public.resolve_provider_event_v1('stripe', 'evt_missing', 'synthetic_test_event');
    raise exception 'authenticated role unexpectedly resolved a provider event';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;
reset role;

rollback;
