create unique index if not exists account_entitlements_stripe_session_unique on public.account_entitlements(stripe_session_id) where stripe_session_id is not null;
create unique index if not exists account_entitlements_stripe_subscription_unique on public.account_entitlements(stripe_subscription_id) where stripe_subscription_id is not null;;
