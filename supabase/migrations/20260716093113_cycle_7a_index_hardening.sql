-- Cycle 7A follow-up: cover foreign keys used by invitation, authority, and
-- event-spine checks. Additive only; no policy or data changes.

create index if not exists organization_locations_organization_id_idx
  on public.organization_locations (organization_id);

create index if not exists organization_members_user_id_idx
  on public.organization_members (user_id)
  where user_id is not null;

create index if not exists organization_invitations_invited_by_user_id_idx
  on public.organization_invitations (invited_by_user_id);

create index if not exists organization_invitations_accepted_by_user_id_idx
  on public.organization_invitations (accepted_by_user_id)
  where accepted_by_user_id is not null;

create index if not exists organization_invitations_accepted_member_id_idx
  on public.organization_invitations (accepted_organization_member_id)
  where accepted_organization_member_id is not null;

create index if not exists organization_invitations_revoked_by_user_id_idx
  on public.organization_invitations (revoked_by_user_id)
  where revoked_by_user_id is not null;

create index if not exists organization_member_locations_granted_by_user_id_idx
  on public.organization_member_locations (granted_by_user_id)
  where granted_by_user_id is not null;

create index if not exists workflows_organization_location_id_idx
  on public.workflows (organization_location_id)
  where organization_location_id is not null;

create index if not exists tasks_workflow_id_idx
  on public.tasks (workflow_id);

create index if not exists tasks_assigned_organization_member_id_idx
  on public.tasks (assigned_organization_member_id)
  where assigned_organization_member_id is not null;

create index if not exists workflow_events_organization_location_id_idx
  on public.workflow_events (organization_location_id)
  where organization_location_id is not null;

create index if not exists workflow_events_actor_user_id_idx
  on public.workflow_events (actor_user_id)
  where actor_user_id is not null;

create index if not exists workflow_events_actor_member_id_idx
  on public.workflow_events (actor_organization_member_id)
  where actor_organization_member_id is not null;
