-- Fixes an inaccurate "team size" count on the institution team page.
--
-- memberships_authorized_select (see 20260828211255_authority_gate_1_foundation.sql)
-- intentionally lets a member see only their own organization_memberships row
-- unless they are owner/admin/auditor. staff, reviewer, and developer are not
-- in that allow-list, so a plain `select ... from organization_memberships`
-- performed as one of those roles returns only their own row and undercounts
-- the team on the /app/team page.
--
-- This adds a SECURITY DEFINER summary function that returns the true active
-- member count for an organization to any of its active members, regardless
-- of their row-level visibility into other members' individual records. It
-- does not change memberships_authorized_select and does not expose any
-- individual member row -- only a count.

create or replace function authority_private.organization_member_count_v1(
  p_organization_id uuid
)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not authority_private.has_active_membership(p_organization_id) then
    raise exception using errcode = '42501', message = 'organization_membership_required';
  end if;

  select count(*) into v_count
  from public.organization_memberships
  where organization_id = p_organization_id
    and status = 'active';

  return v_count;
end;
$$;

revoke execute on function authority_private.organization_member_count_v1(uuid)
from public, anon, authenticated;

create or replace function public.organization_member_count_v1(
  p_organization_id uuid
)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select authority_private.organization_member_count_v1(p_organization_id);
$$;

grant execute on function authority_private.organization_member_count_v1(uuid) to authenticated;
grant execute on function public.organization_member_count_v1(uuid) to authenticated;

comment on function authority_private.organization_member_count_v1(uuid) is
  'Returns the true active member count for an organization for any of its active members, independent of the row-level visibility limits in memberships_authorized_select. Keeps summary counts accurate for staff/reviewer/developer without exposing individual member rows to them.';
