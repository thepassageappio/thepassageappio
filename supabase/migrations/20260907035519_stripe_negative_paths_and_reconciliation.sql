-- Demo negative-path hardening. No live payments or authority-state changes.
-- Existing adjustments are append-only. Refuse rollout over refund history requiring a reviewed backfill.
do $$ begin
  if exists(select 1 from authority_private.commercial_adjustments where adjustment_type='refund') then
    raise exception 'refund_history_requires_reviewed_backfill';
  end if;
end $$;
create table authority_private.stripe_charge_refund_totals (
  charge_id text primary key,
  order_id uuid not null references authority_private.commercial_orders(id),
  amount_minor bigint not null check(amount_minor>=0),
  updated_at timestamptz not null default now()
);
alter table authority_private.stripe_charge_refund_totals enable row level security;
revoke all on authority_private.stripe_charge_refund_totals from public, anon, authenticated;
create index stripe_refund_order_idx on authority_private.stripe_charge_refund_totals(order_id);

create table authority_private.reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  run_key uuid not null unique,
  recorded_at timestamptz not null default now(),
  report jsonb not null check(jsonb_typeof(report)='object')
);
alter table authority_private.reconciliation_runs enable row level security;
revoke all on authority_private.reconciliation_runs from public, anon, authenticated;
create trigger reconciliation_runs_append_only before update or delete on authority_private.reconciliation_runs
  for each row execute function authority_private.prevent_commercial_history_mutation();

create or replace function public.get_commercial_reconciliation_snapshot_v1()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'captured_at',now(),
    'orders',coalesce((select jsonb_agg(jsonb_build_object(
      'id',o.id,'organization_id',o.organization_id,'status',o.status,'amount_minor',o.amount_minor,'currency',o.currency,
      'stripe_invoice_id',o.stripe_invoice_id,'stripe_customer_id',o.stripe_customer_id,'hubspot_deal_id',o.hubspot_deal_id,
      'quantity',o.quantity,
      'refund_total',(select coalesce(sum(a.amount_minor),0) from authority_private.commercial_adjustments a where a.order_id=o.id and a.adjustment_type='refund'),
      'allowance_count',(select count(*) from authority_private.commercial_allowance_lots l where l.source_order_id=o.id),
      'active_allowance_count',(select count(*) from authority_private.commercial_allowance_lots l where l.source_order_id=o.id and l.status='active'),
      'activation_audits',(select count(*) from public.organization_audit_events e where e.subject_id=o.id and e.event_type='billing.pilot_activated')
    ) order by o.created_at,o.id) from authority_private.commercial_orders o),'[]'::jsonb),
    'inbox_unresolved',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'provider',i.provider,'event_id',i.provider_event_id,'status',i.status,'reason',i.last_error_code)) from authority_private.provider_event_inbox i where i.status not in ('applied','ignored')),'[]'::jsonb),
    'outbox_unresolved',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'provider',o.destination,'status',o.status,'reason',o.last_error_code)) from authority_private.integration_outbox o where o.status not in ('applied','canceled')),'[]'::jsonb)
  );
$$;
revoke all on function public.get_commercial_reconciliation_snapshot_v1() from public,anon,authenticated;
grant execute on function public.get_commercial_reconciliation_snapshot_v1() to service_role;

create or replace function public.record_commercial_reconciliation_v1(p_run_key uuid,p_report jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row authority_private.reconciliation_runs%rowtype;
begin
  if p_run_key is null or jsonb_typeof(p_report) is distinct from 'object' or octet_length(p_report::text)>500000
    or coalesce(p_report->>'status','') not in ('clean','blocked','variance') then raise exception 'reconciliation_report_invalid'; end if;
  insert into authority_private.reconciliation_runs(run_key,report) values(p_run_key,p_report) on conflict(run_key) do nothing;
  select * into strict v_row from authority_private.reconciliation_runs where run_key=p_run_key;
  if v_row.report<>p_report then raise exception 'reconciliation_replay_mismatch'; end if;
  return jsonb_build_object('id',v_row.id,'run_key',v_row.run_key,'recorded_at',v_row.recorded_at,'status',v_row.report->>'status');
end $$;
revoke all on function public.record_commercial_reconciliation_v1(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.record_commercial_reconciliation_v1(uuid,jsonb) to service_role;

create or replace function authority_private.ingest_and_apply_stripe_event_v2(
  p_provider_event_id text,
  p_provider_created_at timestamptz,
  p_body_sha256 text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inbox authority_private.provider_event_inbox%rowtype;
  v_event_type text := p_payload->>'type';
  v_object jsonb := p_payload#>'{data,object}';
  v_invoice_id text;
  v_order authority_private.commercial_orders%rowtype;
  v_order_hint text;
  v_first_transition boolean := false;
  v_refund_amount bigint;
  v_previous_refund bigint;
  v_charge_id text;
begin
  if length(btrim(coalesce(p_provider_event_id, ''))) = 0
     or p_body_sha256 !~ '^[0-9a-f]{64}$' or jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'stripe_event_invalid';
  end if;
  insert into authority_private.provider_event_inbox (
    provider, provider_event_id, signature_status, body_sha256, provider_created_at, payload
  ) values ('stripe', p_provider_event_id, 'valid', p_body_sha256, p_provider_created_at, p_payload)
  on conflict (provider, provider_event_id) do nothing;
  select * into v_inbox from authority_private.provider_event_inbox
  where provider = 'stripe' and provider_event_id = p_provider_event_id for update;
  if v_inbox.body_sha256 <> p_body_sha256 or v_inbox.payload <> p_payload then
    return jsonb_build_object('received', true, 'applied', false, 'code', 'stripe_event_payload_mismatch', 'inbox_id', v_inbox.id);
  end if;
  if v_inbox.status in ('applied','ignored') then
    return jsonb_build_object('received', true, 'replayed', true, 'applied', v_inbox.status = 'applied', 'inbox_id', v_inbox.id);
  end if;
  update authority_private.provider_event_inbox set status = 'processing', attempts = attempts + 1 where id = v_inbox.id;

  if p_payload->'livemode' is distinct from 'false'::jsonb or p_payload->>'id' is distinct from p_provider_event_id or v_event_type not in ('invoice.paid','invoice.payment_failed','charge.refunded') then
    update authority_private.provider_event_inbox set status = 'ignored', processed_at = now() where id = v_inbox.id;
    return jsonb_build_object('received', true, 'replayed', false, 'applied', false, 'ignored', true, 'inbox_id', v_inbox.id);
  end if;

  if v_event_type in ('invoice.paid','invoice.payment_failed') then
    v_invoice_id := v_object->>'id';
    v_order_hint := v_object#>>'{metadata,passage_order_id}';
  else
    v_invoice_id := v_object->>'invoice';
  end if;
  select * into v_order from authority_private.commercial_orders where stripe_invoice_id = v_invoice_id for update;
  if v_order.id is null and v_order_hint ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    select * into v_order from authority_private.commercial_orders where id = v_order_hint::uuid for update;
  end if;
  if v_order.id is null then
    update authority_private.provider_event_inbox set status = 'failed', last_error_code = 'stripe_order_unmatched', processed_at = now() where id = v_inbox.id;
    return jsonb_build_object('received', true, 'applied', false, 'code', 'stripe_order_unmatched', 'inbox_id', v_inbox.id);
  end if;

  if (v_order.stripe_invoice_id is not null and v_invoice_id is distinct from v_order.stripe_invoice_id)
     or v_object->>'currency' is distinct from v_order.currency
     or (v_order.stripe_customer_id is not null and v_object->>'customer' is distinct from v_order.stripe_customer_id)
     or (v_event_type = 'invoice.paid' and (v_object->>'status' is distinct from 'paid'
       or coalesce((v_object->>'amount_paid')::bigint,-1) <> v_order.amount_minor
       or coalesce((v_object->>'total')::bigint,-1) <> v_order.amount_minor))
     or (v_event_type = 'charge.refunded' and (coalesce((v_object->>'amount')::bigint,-1) <> v_order.amount_minor
       or coalesce((v_object->>'amount_refunded')::bigint,-1) not between 0 and v_order.amount_minor
       or coalesce(v_object->>'id','') = '')) then
    update authority_private.provider_event_inbox set status = 'failed', last_error_code = 'stripe_order_mismatch', processed_at = now() where id = v_inbox.id;
    return jsonb_build_object('received', true, 'applied', false, 'code', 'stripe_order_mismatch', 'inbox_id', v_inbox.id);
  end if;

  if v_event_type = 'invoice.paid' then
    update authority_private.commercial_orders
    set status = 'paid', paid_at = coalesce(p_provider_created_at, now()), version = version + 1, updated_at = now()
    where id = v_order.id and status in ('pending','invoiced','failed');
    v_first_transition := found;
    if v_first_transition then
      update authority_private.commercial_subscriptions
      set status = 'active', version = version + 1, updated_at = now() where id = v_order.subscription_id;
      update authority_private.commercial_contracts
      set status = 'active', version = version + 1, updated_at = now()
      where id = (select contract_id from authority_private.commercial_subscriptions where id = v_order.subscription_id);
      insert into authority_private.commercial_allowance_lots (
        subscription_id, source_order_id, organization_id, units_granted, effective_at, expires_at
      ) values (
        v_order.subscription_id, v_order.id, v_order.organization_id, v_order.quantity,
        v_order.service_period_start::timestamptz, v_order.service_period_end::timestamptz
      ) on conflict (source_order_id) do nothing;
      update public.organization_entitlements
      set offer = 'pilot', status = 'active', transaction_limit = v_order.quantity, activated_count = 0,
          period_started_at = v_order.service_period_start::timestamptz,
          period_ends_at = v_order.service_period_end::timestamptz,
          version = version + 1, updated_at = now()
      where organization_id = v_order.organization_id;
      insert into public.organization_audit_events (
        organization_id, event_type, subject_type, subject_id, payload
      ) values (
        v_order.organization_id, 'billing.pilot_activated', 'commercial_order', v_order.id,
        jsonb_build_object('request_allowance', v_order.quantity, 'service_period_start', v_order.service_period_start, 'service_period_end', v_order.service_period_end)
      );
    end if;
    insert into authority_private.commercial_event_ledger (
      aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
    ) values (
      'commercial_order', v_order.id, 'commercial.stripe_invoice_paid', coalesce(p_provider_created_at, now()),
      'stripe-invoice-paid:' || v_invoice_id, jsonb_build_object('provider_event_id', p_provider_event_id)
    ) on conflict (idempotency_key) do nothing;
  elsif v_event_type = 'invoice.payment_failed' then
    update authority_private.commercial_orders set status = 'failed', version = version + 1, updated_at = now()
    where id = v_order.id and status in ('pending','invoiced');
    insert into authority_private.commercial_event_ledger (
      aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
    ) values (
      'commercial_order', v_order.id, 'commercial.stripe_invoice_payment_failed', coalesce(p_provider_created_at, now()),
      'stripe-invoice-failed:' || p_provider_event_id, jsonb_build_object('stripe_invoice_id', v_invoice_id)
    ) on conflict (idempotency_key) do nothing;
  else
    v_refund_amount := (v_object->>'amount_refunded')::bigint;
    v_charge_id := v_object->>'id';
    insert into authority_private.stripe_charge_refund_totals(charge_id,order_id,amount_minor)
      values(v_charge_id,v_order.id,0) on conflict (charge_id) do nothing;
    select amount_minor into v_previous_refund from authority_private.stripe_charge_refund_totals
      where charge_id=v_charge_id and order_id=v_order.id for update;
    if not found then raise exception 'stripe_refund_order_mismatch'; end if;
    if v_refund_amount > v_previous_refund then
      update authority_private.stripe_charge_refund_totals set amount_minor=v_refund_amount, updated_at=now() where charge_id=v_charge_id;
      insert into authority_private.commercial_adjustments (
        account_id, order_id, adjustment_type, amount_minor, currency, provider_reference, occurred_at, reason_code
      ) values (
        v_order.account_id, v_order.id, 'refund', v_refund_amount - v_previous_refund, v_order.currency,
        p_provider_event_id, coalesce(p_provider_created_at, now()), 'stripe_charge_refunded'
      ) on conflict (provider_reference) do nothing;
    end if;
    if v_refund_amount >= v_order.amount_minor and v_order.status in ('pending','invoiced','failed','paid') then
      update authority_private.commercial_orders set status = 'refunded', version = version + 1, updated_at = now() where id = v_order.id;
      update authority_private.commercial_allowance_lots set status = 'reversed' where source_order_id = v_order.id and status in ('pending','active','exhausted');
      update authority_private.commercial_subscriptions set status = 'canceled', version = version + 1, updated_at = now() where id = v_order.subscription_id;
      update authority_private.commercial_contracts set status = 'canceled', version = version + 1, updated_at = now()
      where id = (select contract_id from authority_private.commercial_subscriptions where id = v_order.subscription_id);
      update public.organization_entitlements set status = 'canceled', version = version + 1, updated_at = now()
      where organization_id = v_order.organization_id and offer = 'pilot'
        and not exists (select 1 from authority_private.commercial_subscriptions s where s.organization_id=v_order.organization_id and s.id<>v_order.subscription_id and s.status='active');
    end if;
    insert into authority_private.commercial_event_ledger (
      aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
    ) values (
      'commercial_order', v_order.id, 'commercial.stripe_charge_refunded', coalesce(p_provider_created_at, now()),
      'stripe-charge-refunded:' || p_provider_event_id, jsonb_build_object('amount_refunded', v_refund_amount)
    ) on conflict (idempotency_key) do nothing;
  end if;

  update authority_private.provider_event_inbox
  set status = 'applied', processed_at = now(), last_error_code = null where id = v_inbox.id;
  return jsonb_build_object('received', true, 'replayed', not v_first_transition and v_event_type = 'invoice.paid', 'applied', true, 'inbox_id', v_inbox.id, 'order_id', v_order.id);
exception when others then
  if v_inbox.id is not null then
    update authority_private.provider_event_inbox
    set status = 'failed', last_error_code = 'stripe_event_apply_failed', processed_at = now()
    where id = v_inbox.id;
  end if;
  raise;
end;
$$;
