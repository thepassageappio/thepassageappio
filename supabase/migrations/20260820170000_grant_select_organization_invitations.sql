-- organization_invitations and organization_invitation_locations had correct
-- RLS SELECT policies but were missing the base table GRANT to `authenticated`,
-- so any query against them failed with 42501 regardless of RLS -- found live:
-- /director/team threw "We couldn't verify Team" for every account. Writes go
-- through SECURITY DEFINER RPCs (no direct table writes in app/), so SELECT
-- only, matching organization_member_locations' existing grant.
grant select on public.organization_invitations to authenticated;
grant select on public.organization_invitation_locations to authenticated;
