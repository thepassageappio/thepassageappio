-- Required so the Stripe webhook can upsert by stripe_subscription_id
-- (ON CONFLICT needs a matching unique/exclusion constraint). Table is
-- empty in production today, so this is a safe additive constraint.
alter table public.subscriptions
  add constraint subscriptions_stripe_subscription_id_unique unique (stripe_subscription_id);
