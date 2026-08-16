-- Closes a critical Supabase advisor finding: the entire stripe schema (29
-- tables, populated by the pre-existing Stripe Sync Engine Edge Functions)
-- had RLS disabled. Verified anon/authenticated never actually had schema
-- USAGE here (has_schema_privilege returned false for both), so live
-- exposure was near-zero -- but enabling RLS with no policies plus an
-- explicit revoke closes the gap permanently and defensively, so a future
-- migration accidentally granting schema access can never expose this data
-- without also adding real policies first.
ALTER TABLE stripe._migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe._managed_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe._sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe._sync_obj_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe._rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.active_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.checkout_session_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.early_fraud_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.setup_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.subscription_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.tax_ids ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA stripe FROM anon, authenticated;
REVOKE ALL ON SCHEMA stripe FROM anon, authenticated;
