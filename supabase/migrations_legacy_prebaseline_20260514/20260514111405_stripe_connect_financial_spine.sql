alter table public.vendors
  add column if not exists stripe_account_id text;

update public.vendors
set stripe_account_id = stripe_connect_account_id
where stripe_account_id is null
  and stripe_connect_account_id is not null;

update public.vendors
set stripe_connect_account_id = stripe_account_id
where stripe_connect_account_id is null
  and stripe_account_id is not null;

create table if not exists public.vendor_orders (
  id uuid primary key default gen_random_uuid(),
  vendor_request_id uuid references public.vendor_requests(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  workflow_id uuid references public.workflows(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  total_amount numeric(12,2) not null default 0,
  platform_fee numeric(12,2) not null default 0,
  platform_fee_percent numeric(5,2) not null default 12,
  net_vendor_amount numeric(12,2) not null default 0,
  currency text not null default 'usd',
  payment_status text not null default 'draft'
    check (payment_status in ('draft', 'checkout_created', 'payment_pending', 'paid', 'failed', 'cancelled', 'refunded')),
  payout_status text not null default 'pending'
    check (payout_status in ('pending', 'automatic_transfer', 'available', 'paid', 'failed', 'not_applicable')),
  stripe_account_id text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_transfer_group text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists vendor_orders_checkout_session_idx
  on public.vendor_orders(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists vendor_orders_vendor_status_idx
  on public.vendor_orders(vendor_id, payment_status, created_at desc);

create index if not exists vendor_orders_workflow_idx
  on public.vendor_orders(workflow_id, created_at desc);

create table if not exists public.vendor_transfers (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete set null,
  vendor_order_id uuid references public.vendor_orders(id) on delete set null,
  vendor_request_id uuid references public.vendor_requests(id) on delete set null,
  stripe_transfer_id text unique,
  amount numeric(12,2) not null default 0,
  currency text not null default 'usd',
  status text not null default 'created'
    check (status in ('created', 'paid', 'failed', 'cancelled', 'reversed')),
  milestone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_transfers_vendor_idx
  on public.vendor_transfers(vendor_id, created_at desc);

create index if not exists vendor_transfers_order_idx
  on public.vendor_transfers(vendor_order_id, created_at desc);

alter table public.vendor_orders enable row level security;
alter table public.vendor_transfers enable row level security;

drop policy if exists "service role manages vendor orders" on public.vendor_orders;
create policy "service role manages vendor orders"
on public.vendor_orders for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "estate users view vendor orders" on public.vendor_orders;
create policy "estate users view vendor orders"
on public.vendor_orders for select
to authenticated
using (
  exists (
    select 1 from public.workflows w
    where w.id = vendor_orders.workflow_id
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

drop policy if exists "vendor contacts view vendor orders" on public.vendor_orders;
create policy "vendor contacts view vendor orders"
on public.vendor_orders for select
to authenticated
using (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_orders.vendor_id
      and coalesce(v.status, 'pending') = 'active'
      and lower(v.contact_email) = lower(auth.jwt() ->> 'email')
  )
  or exists (
    select 1 from public.vendor_team_members vtm
    where vtm.vendor_id = vendor_orders.vendor_id
      and coalesce(vtm.status, 'active') = 'active'
      and lower(vtm.email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists "service role manages vendor transfers" on public.vendor_transfers;
create policy "service role manages vendor transfers"
on public.vendor_transfers for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "vendor contacts view vendor transfers" on public.vendor_transfers;
create policy "vendor contacts view vendor transfers"
on public.vendor_transfers for select
to authenticated
using (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_transfers.vendor_id
      and coalesce(v.status, 'pending') = 'active'
      and lower(v.contact_email) = lower(auth.jwt() ->> 'email')
  )
  or exists (
    select 1 from public.vendor_team_members vtm
    where vtm.vendor_id = vendor_transfers.vendor_id
      and coalesce(vtm.status, 'active') = 'active'
      and lower(vtm.email) = lower(auth.jwt() ->> 'email')
  )
);
