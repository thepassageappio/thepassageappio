-- Bug fix found during live hosted QA: partner_organizations_visible_select
-- called passage_private.can_manage_location(...) directly from its USING
-- clause. SECURITY DEFINER only changes whose table privileges apply inside
-- a function body -- it does NOT waive the EXECUTE privilege check needed to
-- invoke the function at all, and `authenticated` was never granted EXECUTE
-- on that shared private helper (by design -- it's meant to be called only
-- from wrapped, narrowly-granted entry points, per this schema's existing
-- convention). Confirmed live: SELECT ... JOIN partner_organizations failed
-- with "permission denied for function can_manage_location" when simulated
-- as the authenticated vendor role.
--
-- Fix: add a narrow SECURITY DEFINER wrapper (matching can_view_partner_request's
-- existing pattern) and grant EXECUTE on the wrapper, not on the shared helper.
create or replace function passage_private.director_can_view_partner_organization(p_partner_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.partner_requests as r
    where r.partner_organization_id = p_partner_organization_id
      and passage_private.can_manage_location(r.organization_id, r.organization_location_id)
  )
$$;

grant execute on function passage_private.director_can_view_partner_organization(uuid) to authenticated;

drop policy if exists partner_organizations_visible_select on public.partner_organizations;

create policy partner_organizations_visible_select on public.partner_organizations
  for select to authenticated
  using (
    passage_private.is_active_partner_member_for(id)
    or passage_private.director_can_view_partner_organization(id)
  );
