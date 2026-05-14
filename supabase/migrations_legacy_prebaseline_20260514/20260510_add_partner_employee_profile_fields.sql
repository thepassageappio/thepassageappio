alter table public.organization_members
  add column if not exists display_name text,
  add column if not exists title text,
  add column if not exists location_scope text;

create index if not exists organization_members_location_scope_idx
  on public.organization_members(organization_id, location_scope);
