alter table public.vendors
  add column if not exists estimated_value numeric(10,2);

alter table public.vendor_requests
  add column if not exists estimated_value numeric(10,2),
  add column if not exists final_value numeric(10,2);

alter table public.organizations
  add column if not exists marketplace_enabled boolean not null default true;
