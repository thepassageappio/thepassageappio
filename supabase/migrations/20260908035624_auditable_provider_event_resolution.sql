alter table authority_private.provider_event_inbox
  add column if not exists resolution_code text,
  add column if not exists resolved_at timestamptz;

alter table authority_private.provider_event_inbox
  drop constraint if exists provider_event_inbox_resolution_code_check;

alter table authority_private.provider_event_inbox
  add constraint provider_event_inbox_resolution_code_check
  check (resolution_code is null or resolution_code ~ '^[a-z0-9_]{3,80}$');

alter table authority_private.integration_outbox
  add column if not exists cancellation_code text,
  add column if not exists canceled_at timestamptz;

alter table authority_private.integration_outbox
  drop constraint if exists integration_outbox_cancellation_code_check;

alter table authority_private.integration_outbox
  add constraint integration_outbox_cancellation_code_check
  check (cancellation_code is null or cancellation_code ~ '^[a-z0-9_]{3,80}$');

create or replace function authority_private.resolve_provider_event_v1(
  p_provider text,
  p_provider_event_id text,
  p_resolution_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event authority_private.provider_event_inbox%rowtype;
  v_code text := btrim(coalesce(p_resolution_code, ''));
begin
  if btrim(coalesce(p_provider, '')) not in ('stripe', 'hubspot')
     or length(btrim(coalesce(p_provider_event_id, ''))) = 0
     or v_code !~ '^[a-z0-9_]{3,80}$' then
    raise exception using errcode = '22023', message = 'provider_event_resolution_invalid';
  end if;

  select * into v_event
  from authority_private.provider_event_inbox
  where provider = btrim(p_provider)
    and provider_event_id = btrim(p_provider_event_id)
  for update;

  if v_event.id is null then
    raise exception using errcode = 'P0002', message = 'provider_event_not_found';
  end if;

  if v_event.status = 'ignored' and v_event.resolution_code = v_code then
    return jsonb_build_object(
      'inbox_id', v_event.id,
      'provider', v_event.provider,
      'provider_event_id', v_event.provider_event_id,
      'status', v_event.status,
      'resolution_code', v_event.resolution_code,
      'replayed', true
    );
  end if;

  if v_event.status not in ('received', 'failed') then
    raise exception using errcode = '55000', message = 'provider_event_not_resolvable';
  end if;

  update authority_private.provider_event_inbox
  set status = 'ignored',
      resolution_code = v_code,
      resolved_at = now(),
      processed_at = coalesce(processed_at, now())
  where id = v_event.id;

  insert into authority_private.commercial_event_ledger (
    aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
  ) values (
    'provider_event', v_event.id, 'commercial.provider_event_resolved', now(),
    'provider-event-resolution:' || v_event.id::text,
    jsonb_build_object(
      'provider', v_event.provider,
      'provider_event_id', v_event.provider_event_id,
      'previous_status', v_event.status,
      'previous_error_code', v_event.last_error_code,
      'resolution_code', v_code
    )
  );

  return jsonb_build_object(
    'inbox_id', v_event.id,
    'provider', v_event.provider,
    'provider_event_id', v_event.provider_event_id,
    'status', 'ignored',
    'resolution_code', v_code,
    'replayed', false
  );
end;
$$;

create or replace function authority_private.cancel_integration_outbox_v1(
  p_outbox_id uuid,
  p_cancellation_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job authority_private.integration_outbox%rowtype;
  v_code text := btrim(coalesce(p_cancellation_code, ''));
begin
  if p_outbox_id is null or v_code !~ '^[a-z0-9_]{3,80}$' then
    raise exception using errcode = '22023', message = 'integration_outbox_cancellation_invalid';
  end if;

  select * into v_job
  from authority_private.integration_outbox
  where id = p_outbox_id
  for update;

  if v_job.id is null then
    raise exception using errcode = 'P0002', message = 'integration_outbox_not_found';
  end if;

  if v_job.status = 'canceled' and v_job.cancellation_code = v_code then
    return jsonb_build_object(
      'outbox_id', v_job.id,
      'destination', v_job.destination,
      'operation', v_job.operation,
      'status', v_job.status,
      'cancellation_code', v_job.cancellation_code,
      'replayed', true
    );
  end if;

  if v_job.status not in ('pending', 'retrying', 'failed') then
    raise exception using errcode = '55000', message = 'integration_outbox_not_cancelable';
  end if;

  update authority_private.integration_outbox
  set status = 'canceled',
      cancellation_code = v_code,
      canceled_at = now(),
      next_attempt_at = null,
      updated_at = now()
  where id = v_job.id;

  insert into authority_private.commercial_event_ledger (
    aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
  ) values (
    v_job.subject_type, v_job.subject_id, 'commercial.integration_outbox_canceled', now(),
    'integration-outbox-canceled:' || v_job.id::text,
    jsonb_build_object(
      'outbox_id', v_job.id,
      'destination', v_job.destination,
      'operation', v_job.operation,
      'previous_status', v_job.status,
      'previous_error_code', v_job.last_error_code,
      'cancellation_code', v_code
    )
  );

  return jsonb_build_object(
    'outbox_id', v_job.id,
    'destination', v_job.destination,
    'operation', v_job.operation,
    'status', 'canceled',
    'cancellation_code', v_code,
    'replayed', false
  );
end;
$$;

create or replace function public.resolve_provider_event_v1(
  p_provider text,
  p_provider_event_id text,
  p_resolution_code text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.resolve_provider_event_v1(p_provider, p_provider_event_id, p_resolution_code);
$$;

create or replace function public.cancel_integration_outbox_v1(
  p_outbox_id uuid,
  p_cancellation_code text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.cancel_integration_outbox_v1(p_outbox_id, p_cancellation_code);
$$;

revoke execute on function authority_private.resolve_provider_event_v1(text, text, text) from public, anon, authenticated;
revoke execute on function authority_private.cancel_integration_outbox_v1(uuid, text) from public, anon, authenticated;
revoke execute on function public.resolve_provider_event_v1(text, text, text) from public, anon, authenticated;
revoke execute on function public.cancel_integration_outbox_v1(uuid, text) from public, anon, authenticated;

grant execute on function authority_private.resolve_provider_event_v1(text, text, text) to service_role;
grant execute on function authority_private.cancel_integration_outbox_v1(uuid, text) to service_role;
grant execute on function public.resolve_provider_event_v1(text, text, text) to service_role;
grant execute on function public.cancel_integration_outbox_v1(uuid, text) to service_role;

comment on function public.resolve_provider_event_v1(text, text, text) is
  'Service-only, idempotent resolution of an unhandled provider event. Marks it ignored and records the prior state and reason in the append-only commercial ledger.';
comment on function public.cancel_integration_outbox_v1(uuid, text) is
  'Service-only, idempotent cancellation of an unhandled integration projection. Records the prior state and reason in the append-only commercial ledger.';

-- A refunded order can legitimately retain its one historical activation audit.
-- The original daily check incorrectly treated that normal paid-then-refunded
-- sequence as a variance. Active allowances and duplicate activations remain
-- invalid after a refund.
create or replace function authority_private.compute_daily_reconciliation_v1()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_billing jsonb;
  v_billing_variances jsonb;
  v_usage_variances jsonb;
  v_decision_variances jsonb;
  v_status text := 'clean';
  v_report jsonb;
begin
  v_billing := public.get_commercial_reconciliation_snapshot_v1();

  select coalesce(jsonb_agg(jsonb_build_object(
      'order_id', o->>'id',
      'status', o->>'status',
      'activation_audits', (o->>'activation_audits')::int,
      'active_allowance_count', (o->>'active_allowance_count')::int
    )), '[]'::jsonb)
  into v_billing_variances
  from jsonb_array_elements(coalesce(v_billing->'orders', '[]'::jsonb)) o
  where ((o->>'status') = 'paid' and (o->>'activation_audits')::int <> 1)
     or ((o->>'status') <> 'paid' and (o->>'active_allowance_count')::int > 0)
     or ((o->>'status') = 'refunded' and (o->>'activation_audits')::int > 1)
     or ((o->>'status') not in ('paid', 'refunded') and (o->>'activation_audits')::int > 0);

  select coalesce(jsonb_agg(row_to_json(x)), '[]'::jsonb)
  into v_usage_variances
  from (
    select
      e.organization_id,
      count(*) as usage_events,
      (select count(*) from public.organization_audit_events a
        where a.organization_id = e.organization_id and a.event_type = 'authority.activated') as audit_activated_events,
      (select ent.activated_count from public.organization_entitlements ent
        where ent.organization_id = e.organization_id) as entitlement_activated_count
    from public.authority_usage_events e
    group by e.organization_id
  ) x
  where x.usage_events <> x.audit_activated_events
     or x.usage_events <> x.entitlement_activated_count;

  select coalesce(jsonb_agg(row_to_json(y)), '[]'::jsonb)
  into v_decision_variances
  from (
    select
      d.organization_id,
      count(*) as decision_count,
      (select count(*) from public.organization_audit_events a
        where a.organization_id = d.organization_id and a.event_type = 'institution.decision_recorded') as audit_decision_events
    from public.authority_institution_decisions d
    group by d.organization_id
  ) y
  where y.decision_count <> y.audit_decision_events;

  if jsonb_array_length(coalesce(v_billing->'inbox_unresolved', '[]'::jsonb)) > 0
     or jsonb_array_length(coalesce(v_billing->'outbox_unresolved', '[]'::jsonb)) > 0 then
    v_status := 'blocked';
  elsif jsonb_array_length(v_billing_variances) > 0
     or jsonb_array_length(v_usage_variances) > 0
     or jsonb_array_length(v_decision_variances) > 0 then
    v_status := 'variance';
  end if;

  v_report := jsonb_build_object(
    'schema_version', 'daily-reconciliation-v1',
    'status', v_status,
    'run_date', to_char(now() at time zone 'utc', 'YYYY-MM-DD'),
    'captured_at', now(),
    'billing_snapshot', v_billing,
    'billing_variances', v_billing_variances,
    'usage_vs_audit_vs_entitlement_variances', v_usage_variances,
    'decision_vs_audit_variances', v_decision_variances,
    'scope_note', 'Reconciles Passage-internal authority request/decision counts against the append-only organization audit log, plus Stripe/HubSpot provider state already ingested into authority_private (provider_event_inbox, integration_outbox, commercial_orders). Does not call live Stripe/HubSpot APIs directly. Full three-way Passage/Stripe/HubSpot reconciliation per V2-6 additionally requires HubSpot provider credentials, which remain unconfigured as of this run.'
  );

  return v_report;
end;
$$;

notify pgrst, 'reload schema';
