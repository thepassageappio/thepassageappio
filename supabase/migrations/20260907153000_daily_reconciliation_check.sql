-- Daily reconciliation job (P2 gate V2-6 support).
-- Combines the existing Stripe/HubSpot provider-state snapshot
-- (public.get_commercial_reconciliation_snapshot_v1, already present) with
-- Passage-internal request/decision-vs-audit-log invariants, computes a
-- status, and durably records exactly one immutable run per UTC calendar day
-- via the existing public.record_commercial_reconciliation_v1.
--
-- This does not call live Stripe/HubSpot APIs. It reconciles Passage's own
-- durable record of provider state (authority_private.provider_event_inbox,
-- authority_private.integration_outbox, authority_private.commercial_orders)
-- against Passage's own authority/audit tables. Full three-way Passage /
-- Stripe / HubSpot reconciliation per V2-6 additionally requires HubSpot
-- provider credentials to be configured, which is out of scope here.
--
-- Applied directly to the UAT (ywlrxdjibngroycwnujg) and Demo
-- (bklrclpertdtmhycpqlz) projects on 2026-09-07; see docs/RECONCILIATION-LOG.md
-- for day-1 results and the ongoing streak. authority_private.reconciliation_runs,
-- get_commercial_reconciliation_snapshot_v1, and record_commercial_reconciliation_v1
-- already existed in both databases before this migration (applied out of band
-- under a migration named stripe_negative_paths_and_reconciliation that was never
-- committed to this repo -- see docs/RECONCILIATION-LOG.md for that drift note).

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

  -- Billing invariant: a paid order has exactly one activation audit event;
  -- a refunded/failed order has no active allowance lots; a non-paid order
  -- has no activation audit events.
  select coalesce(jsonb_agg(jsonb_build_object(
      'order_id', o->>'id',
      'status', o->>'status',
      'activation_audits', (o->>'activation_audits')::int,
      'active_allowance_count', (o->>'active_allowance_count')::int
    )), '[]'::jsonb)
  into v_billing_variances
  from jsonb_array_elements(coalesce(v_billing->'orders', '[]'::jsonb)) o
  where ((o->>'status') = 'paid' and (o->>'activation_audits')::int <> 1)
     or ((o->>'status') in ('refunded', 'failed') and (o->>'active_allowance_count')::int > 0)
     or ((o->>'status') <> 'paid' and (o->>'activation_audits')::int > 0);

  -- Usage invariant: activated-transaction usage events, the append-only
  -- audit log, and the entitlement's running counter must all agree per org.
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

  -- Decision invariant: immutable institution-decision receipts and the
  -- audit log must agree per org.
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

create or replace function authority_private.run_daily_reconciliation_v1()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run_date text := to_char(now() at time zone 'utc', 'YYYY-MM-DD');
  v_run_key uuid := md5('passage-daily-reconciliation:' || v_run_date)::uuid;
  v_existing authority_private.reconciliation_runs%rowtype;
  v_report jsonb;
  v_recorded jsonb;
begin
  select * into v_existing from authority_private.reconciliation_runs where run_key = v_run_key;
  if found then
    return v_existing.report || jsonb_build_object(
      'run_key', v_existing.run_key, 'recorded_at', v_existing.recorded_at, 'already_recorded_today', true
    );
  end if;

  v_report := authority_private.compute_daily_reconciliation_v1();
  v_recorded := public.record_commercial_reconciliation_v1(v_run_key, v_report);

  return v_report || jsonb_build_object(
    'run_key', v_recorded->'run_key', 'recorded_at', v_recorded->'recorded_at', 'already_recorded_today', false
  );
end;
$$;

create or replace function public.run_daily_reconciliation_v1()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.run_daily_reconciliation_v1();
$$;

revoke execute on function authority_private.compute_daily_reconciliation_v1() from public, anon, authenticated;
revoke execute on function authority_private.run_daily_reconciliation_v1() from public, anon, authenticated;
revoke execute on function public.run_daily_reconciliation_v1() from public, anon, authenticated;
grant execute on function authority_private.compute_daily_reconciliation_v1() to service_role;
grant execute on function authority_private.run_daily_reconciliation_v1() to service_role;
grant execute on function public.run_daily_reconciliation_v1() to service_role;

comment on function public.run_daily_reconciliation_v1() is 'Server-only daily reconciliation job: Stripe/HubSpot provider-state snapshot plus request/decision-vs-audit-log invariants, recorded as one immutable run per UTC calendar day.';

notify pgrst, 'reload schema';
