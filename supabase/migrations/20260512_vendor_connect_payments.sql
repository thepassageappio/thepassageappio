alter table public.vendors
  add column if not exists stripe_connect_account_id text,
  add column if not exists stripe_connect_status text not null default 'not_connected'
    check (stripe_connect_status in ('not_connected', 'onboarding', 'charges_enabled', 'payouts_enabled', 'restricted')),
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false,
  add column if not exists vendor_terms_accepted_at timestamptz,
  add column if not exists vendor_terms_version text;

alter table public.vendor_requests
  drop constraint if exists vendor_requests_status_check;

alter table public.vendor_requests
  add constraint vendor_requests_status_check
  check (status in ('requested', 'accepted', 'in_progress', 'declined', 'completed'));

alter table public.vendor_requests
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_connected_account_id text,
  add column if not exists quote_approved_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists payout_status text not null default 'not_applicable'
    check (payout_status in ('not_applicable', 'pending', 'available', 'paid', 'failed')),
  add column if not exists payout_amount numeric(10,2),
  add column if not exists payment_url_created_at timestamptz;

create table if not exists public.vendor_payments (
  id uuid primary key default gen_random_uuid(),
  vendor_request_id uuid not null references public.vendor_requests(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  workflow_id uuid references public.workflows(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  gross_amount numeric(10,2) not null default 0,
  application_fee_amount numeric(10,2) not null default 0,
  vendor_net_amount numeric(10,2) not null default 0,
  currency text not null default 'usd',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_transfer_destination text,
  status text not null default 'checkout_created'
    check (status in ('checkout_created', 'paid', 'failed', 'refunded', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists vendor_payments_session_idx
  on public.vendor_payments(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists vendor_payments_vendor_status_idx
  on public.vendor_payments(vendor_id, status, created_at desc);

create index if not exists vendor_payments_workflow_idx
  on public.vendor_payments(workflow_id, created_at desc);

alter table public.vendor_payments enable row level security;

drop policy if exists "service role manages vendor payments" on public.vendor_payments;
create policy "service role manages vendor payments"
on public.vendor_payments for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "estate users view vendor payments" on public.vendor_payments;
create policy "estate users view vendor payments"
on public.vendor_payments for select
to authenticated
using (
  exists (
    select 1 from public.workflows w
    where w.id = vendor_payments.workflow_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.estate_access ea
          where ea.workflow_id = w.id
            and coalesce(ea.status, 'active') <> 'revoked'
            and (ea.user_id = auth.uid() or lower(ea.email) = lower(auth.jwt() ->> 'email'))
        )
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);
