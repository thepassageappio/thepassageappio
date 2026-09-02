create index organization_invitations_accepted_by_idx
  on public.organization_invitations(accepted_by);

create index organization_invitations_invited_by_idx
  on public.organization_invitations(invited_by);

create index organization_invitations_revoked_by_idx
  on public.organization_invitations(revoked_by);

create index organization_memberships_revoked_by_idx
  on public.organization_memberships(revoked_by);

create index organization_terms_acceptances_user_id_idx
  on public.organization_terms_acceptances(user_id);
