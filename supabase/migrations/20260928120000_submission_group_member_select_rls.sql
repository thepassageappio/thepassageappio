-- Submission-group tables: add own-organization SELECT policies for signed-in members.
-- Originally drafted by Ops as 20260924120000; re-timestamped to sort after the newest migration on main.
--
-- Writes stay denied for anon/authenticated: no INSERT/UPDATE/DELETE policies and no write grants.
-- App mutation paths use SECURITY DEFINER RPCs and/or service_role (createAuthorityAdminClient),
-- which bypass RLS, so they are unaffected by these policies.
-- Phase 0 intentionally had RLS + zero policies; advisors flag rls_enabled_no_policy. This closes that
-- while keeping default-deny for anon, for non-members, and for other organizations' rows.
-- Idempotent: safe to re-run.

revoke all on public.authority_submission_groups from anon;
revoke all on public.authority_submission_group_targets from anon;
revoke all on public.authority_submission_group_evidence from anon;

revoke insert, update, delete, truncate, references, trigger on public.authority_submission_groups from authenticated;
revoke insert, update, delete, truncate, references, trigger on public.authority_submission_group_targets from authenticated;
revoke insert, update, delete, truncate, references, trigger on public.authority_submission_group_evidence from authenticated;

grant select on public.authority_submission_groups to authenticated;
grant select on public.authority_submission_group_targets to authenticated;
grant select on public.authority_submission_group_evidence to authenticated;

drop policy if exists authority_submission_groups_member_select on public.authority_submission_groups;
create policy authority_submission_groups_member_select
on public.authority_submission_groups
for select
to authenticated
using (
  exists (
    select 1
    from public.authority_submission_group_targets t
    where t.group_id = authority_submission_groups.id
      and t.organization_id is not null
      and authority_private.has_active_membership(t.organization_id)
  )
);

drop policy if exists authority_submission_group_targets_member_select on public.authority_submission_group_targets;
create policy authority_submission_group_targets_member_select
on public.authority_submission_group_targets
for select
to authenticated
using (
  organization_id is not null
  and authority_private.has_active_membership(organization_id)
);

drop policy if exists authority_submission_group_evidence_member_select on public.authority_submission_group_evidence;
create policy authority_submission_group_evidence_member_select
on public.authority_submission_group_evidence
for select
to authenticated
using (
  exists (
    select 1
    from public.authority_submission_group_targets t
    where t.group_id = authority_submission_group_evidence.group_id
      and t.organization_id is not null
      and authority_private.has_active_membership(t.organization_id)
  )
);

comment on policy authority_submission_groups_member_select on public.authority_submission_groups is
  'Members of any matched target org may read the shared group header. Unmatched/no-org groups stay invisible via PostgREST.';
comment on policy authority_submission_group_targets_member_select on public.authority_submission_group_targets is
  'Members see only their own organization target rows.';
comment on policy authority_submission_group_evidence_member_select on public.authority_submission_group_evidence is
  'Members of any matched target org may read shared group evidence metadata. File bytes still go through server/service_role paths.';
