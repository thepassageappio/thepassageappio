alter table public.subscriptions
  add column if not exists stripe_checkout_session_id text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan = any (array[
    'monthly'::text,
    'annual'::text,
    'lifetime'::text,
    'semiannual'::text,
    'survivor'::text,
    'funeral_home'::text,
    'single_monthly'::text,
    'single_annual'::text,
    'single_lifetime'::text,
    'couple_monthly'::text,
    'couple_annual'::text,
    'family_monthly'::text,
    'family_annual'::text,
    'addon_monthly'::text,
    'addon_annual'::text,
    'urgent'::text,
    'partner_pilot'::text,
    'partner_local'::text,
    'partner_group'::text,
    'partner_location_addon'::text
  ]));

create unique index if not exists subscriptions_stripe_subscription_unique
  on public.subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

create unique index if not exists subscriptions_stripe_checkout_session_unique
  on public.subscriptions(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists subscriptions_user_status_idx
  on public.subscriptions(user_id, status, created_at desc);

create index if not exists subscriptions_plan_status_idx
  on public.subscriptions(plan, status, created_at desc);
