alter table public.scheduled_deliveries
  add column if not exists to_phone text,
  add column if not exists delivery_channel text not null default 'email';

alter table public.scheduled_deliveries
  drop constraint if exists scheduled_deliveries_delivery_channel_check;

alter table public.scheduled_deliveries
  add constraint scheduled_deliveries_delivery_channel_check
  check (delivery_channel in ('email', 'sms', 'email_and_sms'));
;
