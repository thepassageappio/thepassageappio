-- Staff could not see the org-member identity of whoever reviewed their own
-- submitted proof: organization_members SELECT is scoped to self-row OR
-- can_view_team_member(id), and can_view_team_member requires
-- can_manage_organization() (owner/director only). A staff member's own
-- task_proof_reviews rows are already visible to them (can_view_task already
-- grants that), so the review's decision/reason/timestamp render fine -- only
-- the reviewer's organization_members row was invisible, so
-- members.find(...) came back undefined and the staff-facing UI fell back to
-- "Unassigned" even though the director's own view of the identical event
-- resolves the name correctly (real bug, found by an independent QA sweep,
-- PR #61).
--
-- Narrow, additive grant: a staff member may view the organization_members
-- row of anyone who reviewed a proof on a task currently assigned to them.
-- Mirrors can_view_task's own scoping (assigned_organization_member_id +
-- auth.uid() + active staff), just for the reviewer's identity instead of
-- the task itself.
create or replace function passage_private.can_view_proof_reviewer(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1
    from public.task_proof_reviews as review
    join public.tasks as t on t.id = review.task_id
    join public.organization_members as viewer on viewer.id = t.assigned_organization_member_id
    where review.reviewed_by_organization_member_id = p_member_id
      and viewer.user_id = (select auth.uid())
      and viewer.status = 'active'
      and viewer.role = 'staff'
  )
$$;

-- SECURITY DEFINER changes whose table privileges apply inside the function
-- body; it does not waive the EXECUTE privilege needed to invoke the
-- function at all from an RLS USING clause (same gotcha fixed for
-- can_manage_location in the vendor/partner thin slice).
grant execute on function passage_private.can_view_proof_reviewer(uuid) to authenticated;

drop policy if exists cycle_7b_members_authorized_select on public.organization_members;

create policy cycle_7b_members_authorized_select
on public.organization_members
for select
to authenticated
using (
  (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and status = any (array['active', 'revoked'])
  )
  or passage_private.can_view_team_member(id)
  or passage_private.can_view_proof_reviewer(id)
);
