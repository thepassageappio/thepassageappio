-- TEST-ONLY Cycle 7A local Auth/RLS personas.
--
-- WHAT: add the minimum self-membership, organization, and granted-location
-- SELECT policies needed by the app's server authority resolver, then seed one
-- synthetic director and one synthetic funeral-home location.
-- WHY: the production-shape fixture deliberately revokes all legacy access;
-- without these narrow policies a supported local Auth user can accept an
-- invitation but the app cannot independently resolve the resulting authority.
-- BREAKAGE IF SKIPPED: invite acceptance can be tested only at the RPC layer;
-- role landing and revoked/locationless denial remain unproven.
--
-- This is not a product migration, branch copy, or production policy plan.
-- Apply only after cycle_7a_production_shape.sql and the Cycle 7A migrations in
-- a disposable local Supabase stack. It expects director@passage.test to have
-- been created through the supported local Auth Admin API.

grant select on table public.organizations to authenticated;
grant select on table public.organization_locations to authenticated;
grant select on table public.organization_members to authenticated;

drop policy if exists organizations_active_member_select on public.organizations;
create policy organizations_active_member_select
  on public.organizations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members as member
      where member.organization_id = organizations.id
        and member.user_id = (select auth.uid())
        and member.status = 'active'
    )
  );

drop policy if exists organization_locations_granted_member_select
  on public.organization_locations;
create policy organization_locations_granted_member_select
  on public.organization_locations
  for select
  to authenticated
  using (
    status = 'active'
    and exists (
      select 1
      from public.organization_members as member
      join public.organization_member_locations as grant_row
        on grant_row.organization_member_id = member.id
       and grant_row.organization_location_id = organization_locations.id
       and grant_row.revoked_at is null
      where member.user_id = (select auth.uid())
        and member.status = 'active'
    )
  );

drop policy if exists organization_members_self_select on public.organization_members;
create policy organization_members_self_select
  on public.organization_members
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and status = 'active'
  );

insert into public.organizations (id, name)
values ('11111111-1111-4111-8111-111111111111', 'Northstar Funeral Home')
on conflict (id) do update set name = excluded.name;

insert into public.organization_locations (id, organization_id, name, status)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Portland',
  'active'
)
on conflict (id) do update
set name = excluded.name, status = excluded.status;

insert into public.organization_members (
  id,
  organization_id,
  user_id,
  email,
  role,
  status,
  display_name,
  title,
  location_scope
)
select
  '33333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111',
  user_row.id,
  'director@passage.test',
  'director',
  'active',
  'Elena Local',
  'Funeral home director',
  'legacy-local-only'
from auth.users as user_row
where lower(user_row.email) = 'director@passage.test'
on conflict (id) do update
set user_id = excluded.user_id,
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    display_name = excluded.display_name,
    title = excluded.title;

insert into public.organization_member_locations (
  organization_member_id,
  organization_location_id,
  granted_by_user_id
)
select
  '33333333-3333-4333-8333-333333333333',
  '22222222-2222-4222-8222-222222222222',
  user_row.id
from auth.users as user_row
where lower(user_row.email) = 'director@passage.test'
on conflict (organization_member_id, organization_location_id) do update
set revoked_at = null,
    granted_by_user_id = excluded.granted_by_user_id;
