-- Backs the participant-discount promise already sitting in /pricing's own
-- copy ("Participants invited to a family's Passage record receive a
-- reduced participant rate") -- never implemented anywhere. Real Stripe
-- coupons already exist for exactly this (25% off first month, 20% off
-- first year), just never applied at checkout. Eligibility: the calling
-- user has an accepted case_family_invitations row (this session's real
-- invitation flow) or any active estate_access row where they are not the
-- workflow's own owner (covers pre-existing/legacy participant grants too).
create or replace function passage_private.is_eligible_for_participant_discount()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    (select auth.uid()) is not null
    and (
      exists (
        select 1 from public.case_family_invitations as cfi
        where cfi.accepted_by_user_id = (select auth.uid())
      )
      or exists (
        select 1 from public.estate_access as ea
        join public.workflows as w on w.id = ea.workflow_id
        where ea.user_id = (select auth.uid())
          and coalesce(ea.status, 'accepted') not in ('revoked', 'removed', 'declined')
          and w.user_id is distinct from (select auth.uid())
      )
    )
$function$;

create or replace function public.is_eligible_for_participant_discount()
returns boolean
language sql stable security invoker set search_path = ''
as $function$
  select passage_private.is_eligible_for_participant_discount()
$function$;

revoke all on function passage_private.is_eligible_for_participant_discount() from public, anon, authenticated, service_role;
revoke all on function public.is_eligible_for_participant_discount() from public, anon, authenticated, service_role;
grant execute on function passage_private.is_eligible_for_participant_discount() to authenticated;
grant execute on function public.is_eligible_for_participant_discount() to authenticated;
