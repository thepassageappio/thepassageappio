alter table public.vendors
  add column if not exists family_review_snippet text,
  add column if not exists review_count integer not null default 0,
  add column if not exists average_rating numeric(3,2),
  add column if not exists recently_helped_count integer not null default 0;

alter table public.vendor_requests
  add column if not exists viewed_at timestamptz,
  add column if not exists in_progress_at timestamptz,
  add column if not exists estimated_value numeric(10,2),
  add column if not exists final_value numeric(10,2),
  add column if not exists platform_fee_amount numeric(10,2),
  add column if not exists funeral_home_share_amount numeric(10,2),
  add column if not exists passage_share_amount numeric(10,2),
  add column if not exists payment_collection_status text not null default 'tracking_only';

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'vendor_requests'
      and constraint_name = 'vendor_requests_status_check'
  ) then
    alter table public.vendor_requests drop constraint vendor_requests_status_check;
  end if;
end $$;

alter table public.vendor_requests
  add constraint vendor_requests_status_check
  check (status in ('requested', 'accepted', 'in_progress', 'declined', 'completed'));

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'vendor_requests'
      and constraint_name = 'vendor_requests_payment_collection_status_check'
  ) then
    alter table public.vendor_requests drop constraint vendor_requests_payment_collection_status_check;
  end if;
end $$;

alter table public.vendor_requests
  add constraint vendor_requests_payment_collection_status_check
  check (payment_collection_status in ('tracking_only', 'quote_needed', 'passage_collects', 'paid_to_passage', 'vendor_paid', 'waived'));

create index if not exists vendor_requests_payment_status_idx
  on public.vendor_requests(payment_collection_status, requested_at desc);
