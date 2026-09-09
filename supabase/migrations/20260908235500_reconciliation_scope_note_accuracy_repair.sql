-- The immediately preceding hosted wording migration copied the pre-refund
-- invariant before verification caught it. Reapply the same truthful scope note
-- with the already source-controlled refunded-order invariant restored.
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
    'scope_note', 'Reconciles Passage-internal authority request/decision counts against the append-only organization audit log, plus Stripe/HubSpot provider state already ingested into authority_private (provider_event_inbox, integration_outbox, commercial_orders). It does not call live Stripe or HubSpot APIs. Credential configuration and live provider comparison are separate V2-6 evidence.'
  );

  return v_report;
end;
$$;

revoke execute on function authority_private.compute_daily_reconciliation_v1() from public, anon, authenticated;
grant execute on function authority_private.compute_daily_reconciliation_v1() to service_role;

comment on function authority_private.compute_daily_reconciliation_v1() is
  'Computes current internal reconciliation state without asserting deployment credential configuration or live provider comparison.';
