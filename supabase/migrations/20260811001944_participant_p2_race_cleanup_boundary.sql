-- TEST-ONLY participant P2 race cleanup boundary.
--
-- Cycle 8 narrowed the inherited workflow-event cleanup escape to its own
-- retained proof events. Participant P2 ordinary-session races create a
-- separate, reserved family-space history, so their DML-only cleanup fixture
-- also needs an exact append-only exception. This replacement preserves the
-- Cycle 8 clause byte-for-byte and adds only a DELETE-only, postgres-only,
-- isolated-project-only participant clause. UPDATE remains prohibited.

do $participant_p2_cleanup_preflight$
begin
  if to_regprocedure('passage_private.reject_workflow_event_mutation()') is null
     or to_regclass('public.workflow_events') is null
     or to_regclass('public.continuity_spaces') is null
     or to_regclass('public.participant_invitations') is null
     or to_regclass('public.continuity_participants') is null
     or not exists (
       select 1
       from pg_catalog.pg_trigger
       where tgrelid = 'public.workflow_events'::regclass
         and tgname = 'workflow_events_cycle_7b_append_only'
         and not tgisinternal
         and tgenabled = 'O'
     ) then
    raise exception 'Participant P2 cleanup boundary refused: reviewed append-only lineage is incomplete'
      using errcode = '55000';
  end if;
end
$participant_p2_cleanup_preflight$;

create or replace function passage_private.reject_workflow_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  -- Preserve the reviewed Cycle 8 proof cleanup boundary unchanged.
  if tg_op = 'DELETE'
     and session_user = 'postgres'
     and current_user = 'postgres'
     and current_setting('passage.fixture_reset', true) = 'cycle_8_isolated_lab'
     and current_setting('passage.fixture_project_ref', true) = 'uyacxqtsiwlvtmhxvoxr'
     and old.organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
     and old.workflow_id in (
       'c7b10001-7b00-47b0-87b0-000000000001',
       'c7b10002-7b00-47b0-87b0-000000000002'
     )
     and old.task_id in (
       'c7b20001-7b00-47b0-87b0-000000000001',
       'c7b20002-7b00-47b0-87b0-000000000002',
       'c7b20003-7b00-47b0-87b0-000000000003'
     )
     and old.name in (
       'task.proof_submitted',
       'task.proof_verified',
       'task.proof_replacement_requested'
     ) then
    return old;
  end if;

  if tg_op = 'DELETE'
     and session_user = 'postgres'
     and current_user = 'postgres'
     and current_setting('passage.fixture_reset', true) = 'participant_p2_race_isolated_cleanup'
     and current_setting('passage.fixture_project_ref', true) = 'uyacxqtsiwlvtmhxvoxr'
     and current_setting('passage.p2_race_cleanup_attestation', true) =
       'participant-p2-race-event-cleanup-approved'
     and old.continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001'
     and old.organization_id is null
     and old.organization_location_id is null
     and old.workflow_id is null
     and old.task_id is null
     and old.invitation_id is null
     and old.actor_organization_member_id is null
     and old.family_provider_selection_id is null
     and old.previous_family_provider_selection_id is null
     and old.event_type = 'other'
     and old.audience = 'family_space'
     and old.actor_user_id is not null
     and exists (
       select 1
       from auth.users as actor
       where actor.id = old.actor_user_id
         and lower(btrim(actor.email)) in (
           'p2-race-owner@passage.test',
           'p2-race-rotate-accept@passage.test',
           'p2-race-rotate-cancel@passage.test',
           'p2-race-decline-accept@passage.test',
           'p2-race-cancel-accept@passage.test',
           'p2-race-revoke@passage.test'
         )
     )
     and (
       (
         old.name = 'participant_invitation.created'
         and old.previous_state is null
         and old.next_state = 'available'
         and old.continuity_participant_id is null
         and old.idempotency_key =
           'participant_invitation:' || old.participant_invitation_id::text || ':created'
         and exists (
           select 1
           from public.participant_invitations as replacement
           where replacement.id = old.participant_invitation_id
             and replacement.continuity_space_id = old.continuity_space_id
             and replacement.invited_by_user_id = old.actor_user_id
             and replacement.rotates_invitation_id in (
               '82a10001-82a1-42a1-82a1-000000000001',
               '82a10002-82a1-42a1-82a1-000000000002'
             )
         )
       )
       or (
         old.name = 'participant_invitation.rotated'
         and old.previous_state = 'available'
         and old.next_state = 'revoked'
         and old.continuity_participant_id is null
         and old.participant_invitation_id in (
           '82a10001-82a1-42a1-82a1-000000000001',
           '82a10002-82a1-42a1-82a1-000000000002'
         )
         and old.idempotency_key =
           'participant_invitation:' || old.participant_invitation_id::text || ':rotated'
         and exists (
           select 1
           from public.participant_invitations as invitation
           where invitation.id = old.participant_invitation_id
             and invitation.continuity_space_id = old.continuity_space_id
             and invitation.revoked_by_user_id = old.actor_user_id
             and invitation.revocation_reason = 'Replaced with a new secure link'
         )
       )
       or (
         old.name = 'participant_invitation.accepted'
         and old.previous_state = 'available'
         and old.next_state = 'accepted'
         and old.participant_invitation_id in (
           '82a10001-82a1-42a1-82a1-000000000001',
           '82a10003-82a1-42a1-82a1-000000000003',
           '82a10004-82a1-42a1-82a1-000000000004'
         )
         and old.continuity_participant_id is not null
         and old.idempotency_key =
           'participant_invitation:' || old.participant_invitation_id::text || ':accepted'
         and exists (
           select 1
           from public.continuity_participants as participant
           where participant.id = old.continuity_participant_id
             and participant.continuity_space_id = old.continuity_space_id
             and participant.accepted_from_invitation_id = old.participant_invitation_id
             and participant.user_id = old.actor_user_id
         )
       )
       or (
         old.name = 'participant_invitation.declined'
         and old.previous_state = 'available'
         and old.next_state = 'revoked'
         and old.participant_invitation_id = '82a10003-82a1-42a1-82a1-000000000003'
         and old.continuity_participant_id is null
         and old.idempotency_key =
           'participant_invitation:' || old.participant_invitation_id::text || ':declined'
         and exists (
           select 1
           from public.participant_invitations as invitation
           where invitation.id = old.participant_invitation_id
             and invitation.continuity_space_id = old.continuity_space_id
             and invitation.revoked_by_user_id = old.actor_user_id
         )
       )
       or (
         old.name = 'participant_invitation.revoked'
         and old.previous_state = 'available'
         and old.next_state = 'revoked'
         and old.participant_invitation_id in (
           '82a10002-82a1-42a1-82a1-000000000002',
           '82a10004-82a1-42a1-82a1-000000000004'
         )
         and old.continuity_participant_id is null
         and old.idempotency_key =
           'participant_invitation:' || old.participant_invitation_id::text || ':revoked'
         and exists (
           select 1
           from public.participant_invitations as invitation
           where invitation.id = old.participant_invitation_id
             and invitation.continuity_space_id = old.continuity_space_id
             and invitation.revoked_by_user_id = old.actor_user_id
         )
       )
       or (
         old.name = 'continuity_participant.revoked'
         and old.previous_state = 'active'
         and old.next_state = 'revoked'
         and old.participant_invitation_id = '82a10005-82a1-42a1-82a1-000000000005'
         and old.continuity_participant_id = '82a20005-82a2-42a2-82a2-000000000005'
         and old.idempotency_key =
           'continuity_participant:' || old.continuity_participant_id::text || ':revoked'
         and exists (
           select 1
           from public.continuity_participants as participant
           where participant.id = old.continuity_participant_id
             and participant.continuity_space_id = old.continuity_space_id
             and participant.accepted_from_invitation_id = old.participant_invitation_id
             and participant.revoked_by_user_id = old.actor_user_id
         )
       )
     ) then
    return old;
  end if;

  raise exception 'Workflow events are append-only' using errcode = '42501';
end
$function$;

revoke all on function passage_private.reject_workflow_event_mutation()
  from public, anon, authenticated;
