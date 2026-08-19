-- Founder decision 2026-08-19: staff assigned to a case should see vendor
-- coordination status on it, read-only, the same way family does. Was
-- previously director-only by omission, not by design -- flagged twice via
-- docs/product/persona-interaction-map-2026-08-18.md's finding #1 ("staff
-- has zero vendor-request visibility"), never actioned until now.
--
-- Widens the existing authority predicate (picked up automatically by the
-- partner_requests_authorized_select RLS policy, which already delegates to
-- this function -- no new policy or table needed) with the same
-- staff-assigned-task branch already used by
-- passage_private.can_message_workflow.
create or replace function passage_private.can_view_partner_request(p_partner_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.partner_requests as r
    where r.id = p_partner_request_id
      and (
        passage_private.can_manage_location(r.organization_id, r.organization_location_id)
        or passage_private.is_active_partner_member_for(r.partner_organization_id)
        or exists (
          select 1
          from public.organization_members as m
          join public.organization_member_locations as ml
            on ml.organization_member_id = m.id
           and ml.organization_location_id = r.organization_location_id
           and ml.revoked_at is null
          where m.organization_id = r.organization_id
            and m.user_id = (select auth.uid())
            and m.status = 'active'
            and m.role = 'staff'
            and exists (
              select 1 from public.tasks as t
              where t.workflow_id = r.workflow_id and t.assigned_organization_member_id = m.id
            )
        )
      )
  )
$function$;

-- Adversarial verification (zero-footprint transaction against production,
-- rolled back, combined with the set_task_blocked_idempotent test above):
-- staff assigned to a task on the request's workflow can now view it (was
-- previously denied); staff with no assigned task on that workflow still
-- cannot; director authority is unaffected.
