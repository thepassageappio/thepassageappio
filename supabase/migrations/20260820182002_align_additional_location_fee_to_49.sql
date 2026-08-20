-- The first implementation of location gating anticipated a $99 add-on,
-- but the founder approved $49/month before billing was exposed. Keep the
-- durable organization value and future default aligned with the live Stripe
-- Price used by /director/billing.
alter table public.organizations
  alter column additional_location_fee_cents set default 4900;

update public.organizations
set additional_location_fee_cents = 4900
where additional_location_fee_cents = 9900;
