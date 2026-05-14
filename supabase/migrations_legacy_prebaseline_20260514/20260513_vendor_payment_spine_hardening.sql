alter table public.vendor_requests
  drop constraint if exists vendor_requests_status_check;

alter table public.vendor_requests
  add constraint vendor_requests_status_check
  check (status in (
    'requested',
    'viewed',
    'quoted',
    'family_accepted',
    'payment_pending',
    'paid',
    'scheduled',
    'completed',
    'declined',
    'cancelled',
    'refunded',
    'accepted',
    'in_progress'
  ));

alter table public.vendor_requests
  drop constraint if exists vendor_requests_payment_collection_status_check;

alter table public.vendor_requests
  add constraint vendor_requests_payment_collection_status_check
  check (payment_collection_status in (
    'not_required',
    'quote_needed',
    'quote_ready',
    'family_accepted',
    'checkout_created',
    'payment_pending',
    'paid',
    'failed',
    'refunded',
    'cancelled',
    'tracking_only',
    'passage_collects',
    'paid_to_passage',
    'vendor_paid',
    'waived',
    'payment_due'
  ));

alter table public.vendor_requests
  add column if not exists service_date date,
  add column if not exists service_start_at timestamptz,
  add column if not exists service_end_at timestamptz,
  add column if not exists service_location text,
  add column if not exists service_notes text,
  add column if not exists family_contact_name text,
  add column if not exists family_contact_phone text,
  add column if not exists gross_amount numeric(10,2),
  add column if not exists passage_fee_percent numeric(5,2) not null default 12,
  add column if not exists passage_fee_amount numeric(10,2),
  add column if not exists stripe_fee_estimate numeric(10,2),
  add column if not exists vendor_net_amount numeric(10,2),
  add column if not exists family_accepted_at timestamptz,
  add column if not exists scheduled_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists refunded_at timestamptz,
  add column if not exists last_vendor_reminder_at timestamptz,
  add column if not exists completion_reminder_at timestamptz;

alter table public.vendors
  add column if not exists stripe_connect_onboarding_url text,
  add column if not exists stripe_connect_onboarding_expires_at timestamptz,
  add column if not exists stripe_details_submitted boolean not null default false,
  add column if not exists stripe_connect_last_checked_at timestamptz,
  add column if not exists marketplace_fee_default_percent numeric(5,2) not null default 12;

alter table public.vendor_payments
  add column if not exists payout_status text not null default 'pending'
    check (payout_status in ('pending', 'available', 'paid', 'failed', 'not_applicable')),
  add column if not exists payout_available_at timestamptz,
  add column if not exists payout_paid_at timestamptz,
  add column if not exists failure_reason text;

create index if not exists vendor_requests_payment_status_idx
  on public.vendor_requests(payment_collection_status, status, requested_at desc);

create index if not exists vendor_requests_service_start_idx
  on public.vendor_requests(service_start_at)
  where service_start_at is not null;
