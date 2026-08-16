-- Wires the Stripe webhook (app/api/webhooks/stripe/route.ts) to production's
-- existing, well-designed legacy subscription schema rather than duplicating
-- it. public.subscriptions and public.users (kept in lockstep with auth.users
-- via the existing on_auth_user_created -> handle_new_user() trigger) already
-- carry everything needed: stripe_customer_id, stripe_subscription_id,
-- renewal_date, plan, status, last_payment_amount, lifetime_value_cents,
-- users.referral_source/utm_*/estate_seats_*. None of this was ever written
-- to by any app code (confirmed: zero references anywhere under app/) --
-- this migration only adds the two columns actually missing: a durable link
-- from a subscription to the HubSpot Deal/Contact it produced, so replays
-- update the same Deal instead of creating a duplicate.
--
-- Note for later: public.people (owner_id, linked_user_id, estate_id,
-- converted_to_paid, converted_at, participant_discount_offered) is a second,
-- fully-designed-but-dead participant/referral model from the same Threshold
-- era -- currently empty (0 rows) and not referenced by any current route.
-- users.participant_discount_source references people(id), which is why this
-- migration does not attempt to populate it: doing so correctly needs a
-- decision on reconciling `people` against this session's live
-- case_family_invitations/estate_access model, not a guess made in passing.
-- Attribution for now is written to the unconstrained users.referral_source
-- text column instead.

alter table public.subscriptions
  add column if not exists hubspot_deal_id text,
  add column if not exists hubspot_contact_id text;

create table public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  received_at timestamp with time zone not null default pg_catalog.clock_timestamp(),
  processed_at timestamp with time zone
);

alter table public.stripe_webhook_events enable row level security;
