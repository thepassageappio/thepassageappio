-- Real, executable negative-path coverage for
-- authority_private.ingest_and_apply_stripe_event_v2 (see
-- 20260905033528_founding_pilot_billing_v1.sql and
-- 20260907035519_stripe_negative_paths_and_reconciliation.sql).
--
-- This is not a regex check against migration text -- it seeds a real order
-- through the real schema and fires fabricated (test-mode, livemode=false)
-- Stripe event payloads at the real RPC, then asserts on the resulting
-- database rows. Run with `supabase test db` (or psql against a disposable
-- database with all migrations applied). Everything rolls back at the end.
--
-- These exact 8 scenarios were run for real against a live branch of the
-- "Passage Authority UAT" Supabase project on 2026-09-07 and all passed;
-- see docs/V2-DELIVERY-ROADMAP.md for the recorded results.

begin;

create temporary table stripe_negpath_results (step text primary key, result jsonb);

do $$
declare
  v_org_id uuid := gen_random_uuid();
  v_owner_id uuid := gen_random_uuid();
  v_account_id uuid := gen_random_uuid();
  v_contract_id uuid := gen_random_uuid();
  v_subscription_id uuid := gen_random_uuid();
  v_order_id uuid := gen_random_uuid();
  v_invoice_id text := 'in_test_negpath_1';
  v_customer_id text := 'cus_test_negpath_1';
  v_amount bigint := 500000;
  v_charge_id text := 'ch_test_negpath_1';
  v_body_hash text := encode(sha256('fixture'::bytea),'hex');
  v_res jsonb;
  v_order authority_private.commercial_orders%rowtype;
  v_ent public.organization_entitlements%rowtype;
  v_adj_count int;
  v_adj_sum bigint;
  v_lot_count int;
  v_lot_reversed int;
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
  values (v_owner_id, 'authenticated','authenticated','p2-negpath-owner@example.test', now(), now(), now());

  insert into public.organizations (
    id, legal_name, display_name, organization_type, website_domain,
    address_line_1, locality, region, postal_code, country_code,
    status, onboarding_status, created_by
  ) values (
    v_org_id, 'P2 Negative Path Test Org', 'P2 Negative Path Test Org', 'credit_union', 'p2-negpath-core.example.test',
    '1 Test Way', 'Testville', 'NY', '10000', 'US', 'active', 'ready', v_owner_id
  );

  insert into authority_private.commercial_accounts (id, legal_name, display_name, account_type)
  values (v_account_id, 'P2 Negative Path Test Org', 'P2 Negative Path Test Org', 'financial_institution');
  insert into authority_private.commercial_account_workspaces (account_id, organization_id)
  values (v_account_id, v_org_id);
  insert into authority_private.commercial_contracts (
    id, account_id, contract_number, status, service_period_start, service_period_end, committed_amount_minor, payment_terms
  ) values (v_contract_id, v_account_id, 'PILOT-TESTNEGPATH1', 'pending_payment', current_date, current_date + 90, v_amount, 'net_30');
  insert into authority_private.commercial_subscriptions (
    id, account_id, contract_id, organization_id, plan_bucket, status, starts_on, ends_on, recurring_amount_minor, stripe_customer_id
  ) values (v_subscription_id, v_account_id, v_contract_id, v_org_id, 'founding_pilot', 'pending', current_date, current_date + 90, 0, v_customer_id);
  insert into authority_private.commercial_orders (
    id, account_id, subscription_id, organization_id, order_type, status, quantity, amount_minor,
    service_period_start, service_period_end, stripe_customer_id, stripe_invoice_id, billing_email, idempotency_key
  ) values (
    v_order_id, v_account_id, v_subscription_id, v_org_id, 'pilot', 'invoiced', 100, v_amount,
    current_date, current_date + 90, v_customer_id, v_invoice_id, 'owner@example.test', gen_random_uuid()
  );

  -- 1. Failed payment
  v_res := public.ingest_and_apply_stripe_event_v2(
    'evt_test_failed_1', now(), v_body_hash,
    jsonb_build_object('id','evt_test_failed_1','type','invoice.payment_failed','livemode',false,
      'data',jsonb_build_object('object', jsonb_build_object(
        'id', v_invoice_id, 'currency','usd','customer', v_customer_id,
        'metadata', jsonb_build_object('passage_order_id', v_order_id::text))))
  );
  insert into stripe_negpath_results values ('1_payment_failed_applied', v_res);
  select * into v_order from authority_private.commercial_orders where id = v_order_id;
  if v_order.status <> 'failed' then raise exception 'SCENARIO 1 FAILED: expected order status failed, got %', v_order.status; end if;

  -- 2. invoice.paid after a failed attempt activates the pilot exactly once
  v_res := public.ingest_and_apply_stripe_event_v2(
    'evt_test_paid_1', now(), v_body_hash,
    jsonb_build_object('id','evt_test_paid_1','type','invoice.paid','livemode',false,
      'data',jsonb_build_object('object', jsonb_build_object(
        'id', v_invoice_id, 'currency','usd','customer', v_customer_id, 'status','paid',
        'amount_paid', v_amount, 'total', v_amount,
        'metadata', jsonb_build_object('passage_order_id', v_order_id::text))))
  );
  insert into stripe_negpath_results values ('2_invoice_paid_applied', v_res);
  select * into v_order from authority_private.commercial_orders where id = v_order_id;
  select * into v_ent from public.organization_entitlements where organization_id = v_org_id;
  select count(*) into v_lot_count from authority_private.commercial_allowance_lots where source_order_id = v_order_id;
  if v_order.status <> 'paid' then raise exception 'SCENARIO 2 FAILED: order not paid, got %', v_order.status; end if;
  if v_ent.status <> 'active' or v_ent.offer <> 'pilot' or v_ent.transaction_limit <> 100 then
    raise exception 'SCENARIO 2 FAILED: entitlement not activated correctly: %', to_jsonb(v_ent);
  end if;
  if v_lot_count <> 1 then raise exception 'SCENARIO 2 FAILED: expected exactly 1 allowance lot, got %', v_lot_count; end if;

  -- 3. Exact duplicate delivery of the same invoice.paid event is a no-op
  v_res := public.ingest_and_apply_stripe_event_v2(
    'evt_test_paid_1', now(), v_body_hash,
    jsonb_build_object('id','evt_test_paid_1','type','invoice.paid','livemode',false,
      'data',jsonb_build_object('object', jsonb_build_object(
        'id', v_invoice_id, 'currency','usd','customer', v_customer_id, 'status','paid',
        'amount_paid', v_amount, 'total', v_amount,
        'metadata', jsonb_build_object('passage_order_id', v_order_id::text))))
  );
  insert into stripe_negpath_results values ('3_duplicate_invoice_paid', v_res);
  if (v_res->>'replayed')::boolean <> true then raise exception 'SCENARIO 3 FAILED: duplicate event not marked replayed: %', v_res; end if;
  select count(*) into v_lot_count from authority_private.commercial_allowance_lots where source_order_id = v_order_id;
  if v_lot_count <> 1 then raise exception 'SCENARIO 3 FAILED: duplicate event created extra allowance lot(s): %', v_lot_count; end if;

  -- 4. Partial refund records only the refunded amount and does not touch the order
  v_res := public.ingest_and_apply_stripe_event_v2(
    'evt_test_refund_1', now(), v_body_hash,
    jsonb_build_object('id','evt_test_refund_1','type','charge.refunded','livemode',false,
      'data',jsonb_build_object('object', jsonb_build_object(
        'id', v_charge_id, 'invoice', v_invoice_id, 'currency','usd','customer', v_customer_id,
        'amount', v_amount, 'amount_refunded', 1000)))
  );
  insert into stripe_negpath_results values ('4_partial_refund_1', v_res);
  select * into v_order from authority_private.commercial_orders where id = v_order_id;
  select count(*), coalesce(sum(amount_minor),0) into v_adj_count, v_adj_sum from authority_private.commercial_adjustments where order_id = v_order_id;
  if v_order.status <> 'paid' then raise exception 'SCENARIO 4 FAILED: partial refund incorrectly changed order status to %', v_order.status; end if;
  if v_adj_count <> 1 or v_adj_sum <> 1000 then raise exception 'SCENARIO 4 FAILED: adjustment ledger wrong after first partial refund: count=%, sum=%', v_adj_count, v_adj_sum; end if;

  -- 5. A second event with Stripe's *cumulative* amount_refunded must book only
  --    the delta, not double-count the earlier partial refund
  v_res := public.ingest_and_apply_stripe_event_v2(
    'evt_test_refund_2', now(), v_body_hash,
    jsonb_build_object('id','evt_test_refund_2','type','charge.refunded','livemode',false,
      'data',jsonb_build_object('object', jsonb_build_object(
        'id', v_charge_id, 'invoice', v_invoice_id, 'currency','usd','customer', v_customer_id,
        'amount', v_amount, 'amount_refunded', v_amount)))
  );
  insert into stripe_negpath_results values ('5_full_refund_after_partial', v_res);
  select * into v_order from authority_private.commercial_orders where id = v_order_id;
  select * into v_ent from public.organization_entitlements where organization_id = v_org_id;
  select count(*), coalesce(sum(amount_minor),0) into v_adj_count, v_adj_sum from authority_private.commercial_adjustments where order_id = v_order_id;
  select count(*) into v_lot_reversed from authority_private.commercial_allowance_lots where source_order_id = v_order_id and status = 'reversed';
  if v_order.status <> 'refunded' then raise exception 'SCENARIO 5 FAILED: order not refunded after cumulative full refund, got %', v_order.status; end if;
  if v_adj_count <> 2 or v_adj_sum <> v_amount then
    raise exception 'SCENARIO 5 FAILED: ledger not delta-based -- count=%, sum=% (want count=2, sum=%)', v_adj_count, v_adj_sum, v_amount;
  end if;
  if v_ent.status <> 'canceled' then raise exception 'SCENARIO 5 FAILED: entitlement not canceled on full refund, got %', v_ent.status; end if;
  if v_lot_reversed <> 1 then raise exception 'SCENARIO 5 FAILED: allowance lot not reversed on refund'; end if;

  -- 6. Duplicate/replayed refund event must not double-book the ledger
  v_res := public.ingest_and_apply_stripe_event_v2(
    'evt_test_refund_2', now(), v_body_hash,
    jsonb_build_object('id','evt_test_refund_2','type','charge.refunded','livemode',false,
      'data',jsonb_build_object('object', jsonb_build_object(
        'id', v_charge_id, 'invoice', v_invoice_id, 'currency','usd','customer', v_customer_id,
        'amount', v_amount, 'amount_refunded', v_amount)))
  );
  insert into stripe_negpath_results values ('6_duplicate_refund_event', v_res);
  if (v_res->>'replayed')::boolean <> true then raise exception 'SCENARIO 6 FAILED: duplicate refund event not marked replayed: %', v_res; end if;
  select count(*), coalesce(sum(amount_minor),0) into v_adj_count, v_adj_sum from authority_private.commercial_adjustments where order_id = v_order_id;
  if v_adj_count <> 2 or v_adj_sum <> v_amount then raise exception 'SCENARIO 6 FAILED: duplicate refund event changed ledger -- count=%, sum=%', v_adj_count, v_adj_sum; end if;

  insert into stripe_negpath_results values ('scenarios_1_through_6_passed', jsonb_build_object('ok', true));
end;
$$;

-- Out-of-order delivery: the refund webhook can legitimately reach us before
-- the invoice.paid webhook for the same underlying payment (Stripe does not
-- guarantee delivery order). A late invoice.paid must never re-activate an
-- order that a refund has already closed out.
do $$
declare
  v_org_id uuid := gen_random_uuid();
  v_owner_id uuid := gen_random_uuid();
  v_account_id uuid := gen_random_uuid();
  v_contract_id uuid := gen_random_uuid();
  v_subscription_id uuid := gen_random_uuid();
  v_order_id uuid := gen_random_uuid();
  v_invoice_id text := 'in_test_negpath_2';
  v_customer_id text := 'cus_test_negpath_2';
  v_amount bigint := 500000;
  v_charge_id text := 'ch_test_negpath_2';
  v_body_hash text := encode(sha256('fixture2'::bytea),'hex');
  v_res jsonb;
  v_order authority_private.commercial_orders%rowtype;
  v_ent public.organization_entitlements%rowtype;
  v_lot_count int;
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
  values (v_owner_id, 'authenticated','authenticated','p2-negpath-owner2@example.test', now(), now(), now());
  insert into public.organizations (
    id, legal_name, display_name, organization_type, website_domain,
    address_line_1, locality, region, postal_code, country_code, status, onboarding_status, created_by
  ) values (
    v_org_id, 'P2 Negative Path Test Org 2', 'P2 Negative Path Test Org 2', 'credit_union', 'p2-negpath-outoforder.example.test',
    '1 Test Way', 'Testville', 'NY', '10000', 'US', 'active', 'ready', v_owner_id
  );
  insert into authority_private.commercial_accounts (id, legal_name, display_name, account_type)
  values (v_account_id, 'P2 Negative Path Test Org 2', 'P2 Negative Path Test Org 2', 'financial_institution');
  insert into authority_private.commercial_account_workspaces (account_id, organization_id) values (v_account_id, v_org_id);
  insert into authority_private.commercial_contracts (
    id, account_id, contract_number, status, service_period_start, service_period_end, committed_amount_minor, payment_terms
  ) values (v_contract_id, v_account_id, 'PILOT-TESTNEGPATH2', 'pending_payment', current_date, current_date + 90, v_amount, 'net_30');
  insert into authority_private.commercial_subscriptions (
    id, account_id, contract_id, organization_id, plan_bucket, status, starts_on, ends_on, recurring_amount_minor, stripe_customer_id
  ) values (v_subscription_id, v_account_id, v_contract_id, v_org_id, 'founding_pilot', 'pending', current_date, current_date + 90, 0, v_customer_id);
  insert into authority_private.commercial_orders (
    id, account_id, subscription_id, organization_id, order_type, status, quantity, amount_minor,
    service_period_start, service_period_end, stripe_customer_id, stripe_invoice_id, billing_email, idempotency_key
  ) values (
    v_order_id, v_account_id, v_subscription_id, v_org_id, 'pilot', 'invoiced', 100, v_amount,
    current_date, current_date + 90, v_customer_id, v_invoice_id, 'owner2@example.test', gen_random_uuid()
  );

  v_res := public.ingest_and_apply_stripe_event_v2(
    'evt_test_ooo_refund_1', now(), v_body_hash,
    jsonb_build_object('id','evt_test_ooo_refund_1','type','charge.refunded','livemode',false,
      'data',jsonb_build_object('object', jsonb_build_object(
        'id', v_charge_id, 'invoice', v_invoice_id, 'currency','usd','customer', v_customer_id,
        'amount', v_amount, 'amount_refunded', v_amount)))
  );
  insert into stripe_negpath_results values ('7a_refund_before_paid', v_res);
  select * into v_order from authority_private.commercial_orders where id = v_order_id;
  if v_order.status <> 'refunded' then
    raise exception 'SCENARIO 7a FAILED: out-of-order refund did not immediately mark order refunded, got %', v_order.status;
  end if;

  v_res := public.ingest_and_apply_stripe_event_v2(
    'evt_test_ooo_paid_1', now(), v_body_hash,
    jsonb_build_object('id','evt_test_ooo_paid_1','type','invoice.paid','livemode',false,
      'data',jsonb_build_object('object', jsonb_build_object(
        'id', v_invoice_id, 'currency','usd','customer', v_customer_id, 'status','paid',
        'amount_paid', v_amount, 'total', v_amount,
        'metadata', jsonb_build_object('passage_order_id', v_order_id::text))))
  );
  insert into stripe_negpath_results values ('7b_late_paid_after_refund', v_res);
  select * into v_order from authority_private.commercial_orders where id = v_order_id;
  select * into v_ent from public.organization_entitlements where organization_id = v_org_id;
  select count(*) into v_lot_count from authority_private.commercial_allowance_lots where source_order_id = v_order_id;
  if v_order.status <> 'refunded' then
    raise exception 'SCENARIO 7b FAILED: late invoice.paid re-opened a refunded order, status=%', v_order.status;
  end if;
  if v_ent.status = 'active' then
    raise exception 'SCENARIO 7b FAILED: entitlement was activated by a late invoice.paid after refund: %', to_jsonb(v_ent);
  end if;
  if v_lot_count <> 0 then
    raise exception 'SCENARIO 7b FAILED: an allowance lot was granted despite the order being refunded: %', v_lot_count;
  end if;
  insert into stripe_negpath_results values ('7_out_of_order_refund_before_paid_passed', jsonb_build_object('ok', true));
end;
$$;

-- Tampered/mismatched event guard: an event whose amount does not match the
-- order on file must be rejected outright, not silently applied.
do $$
declare
  v_org_id uuid := gen_random_uuid();
  v_owner_id uuid := gen_random_uuid();
  v_account_id uuid := gen_random_uuid();
  v_contract_id uuid := gen_random_uuid();
  v_subscription_id uuid := gen_random_uuid();
  v_order_id uuid := gen_random_uuid();
  v_invoice_id text := 'in_test_negpath_3';
  v_customer_id text := 'cus_test_negpath_3';
  v_body_hash text := encode(sha256('fixture3'::bytea),'hex');
  v_res jsonb;
  v_order authority_private.commercial_orders%rowtype;
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
  values (v_owner_id, 'authenticated','authenticated','p2-negpath-owner3@example.test', now(), now(), now());
  insert into public.organizations (
    id, legal_name, display_name, organization_type, website_domain,
    address_line_1, locality, region, postal_code, country_code, status, onboarding_status, created_by
  ) values (
    v_org_id, 'P2 Negative Path Test Org 3', 'P2 Negative Path Test Org 3', 'credit_union', 'p2-negpath-mismatch.example.test',
    '1 Test Way', 'Testville', 'NY', '10000', 'US', 'active', 'ready', v_owner_id
  );
  insert into authority_private.commercial_accounts (id, legal_name, display_name, account_type)
  values (v_account_id, 'P2 Negative Path Test Org 3', 'P2 Negative Path Test Org 3', 'financial_institution');
  insert into authority_private.commercial_account_workspaces (account_id, organization_id) values (v_account_id, v_org_id);
  insert into authority_private.commercial_contracts (
    id, account_id, contract_number, status, service_period_start, service_period_end, committed_amount_minor, payment_terms
  ) values (v_contract_id, v_account_id, 'PILOT-TESTNEGPATH3', 'pending_payment', current_date, current_date + 90, 500000, 'net_30');
  insert into authority_private.commercial_subscriptions (
    id, account_id, contract_id, organization_id, plan_bucket, status, starts_on, ends_on, recurring_amount_minor, stripe_customer_id
  ) values (v_subscription_id, v_account_id, v_contract_id, v_org_id, 'founding_pilot', 'pending', current_date, current_date + 90, 0, v_customer_id);
  insert into authority_private.commercial_orders (
    id, account_id, subscription_id, organization_id, order_type, status, quantity, amount_minor,
    service_period_start, service_period_end, stripe_customer_id, stripe_invoice_id, billing_email, idempotency_key
  ) values (
    v_order_id, v_account_id, v_subscription_id, v_org_id, 'pilot', 'invoiced', 100, 500000,
    current_date, current_date + 90, v_customer_id, v_invoice_id, 'owner3@example.test', gen_random_uuid()
  );

  v_res := public.ingest_and_apply_stripe_event_v2(
    'evt_test_mismatch_1', now(), v_body_hash,
    jsonb_build_object('id','evt_test_mismatch_1','type','invoice.paid','livemode',false,
      'data',jsonb_build_object('object', jsonb_build_object(
        'id', v_invoice_id, 'currency','usd','customer', v_customer_id, 'status','paid',
        'amount_paid', 250000, 'total', 250000,
        'metadata', jsonb_build_object('passage_order_id', v_order_id::text))))
  );
  insert into stripe_negpath_results values ('8_mismatched_amount_event', v_res);
  select * into v_order from authority_private.commercial_orders where id = v_order_id;
  if v_order.status <> 'invoiced' then
    raise exception 'SCENARIO 8 FAILED: mismatched-amount event changed order state, status=%', v_order.status;
  end if;
  if v_res->>'code' <> 'stripe_order_mismatch' then
    raise exception 'SCENARIO 8 FAILED: mismatched event was not rejected with stripe_order_mismatch: %', v_res;
  end if;
  insert into stripe_negpath_results values ('8_tampered_event_guard_passed', jsonb_build_object('ok', true));
end;
$$;

select step, result from stripe_negpath_results order by step;

rollback;
