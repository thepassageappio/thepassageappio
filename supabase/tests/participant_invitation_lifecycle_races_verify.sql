-- Read-only privileged verifier for the Participant P2 ordinary-session races.
-- Run as postgres only after participant_p2_race_reset.sql mode=reset and the
-- ordinary-session race harness complete. The output contains no Auth IDs,
-- email addresses, invitation tokens, or message bodies. Cleanup remains the
-- separate reviewed fixture mode.

do $p2_race_verify_guard$
declare
  v_ref text := nullif(current_setting('passage.fixture_project_ref', true), '');
  v_attestation text := nullif(current_setting('passage.p2_race_verify_attestation', true), '');
begin
  if session_user <> 'postgres' or current_user <> 'postgres' then
    raise exception 'Participant P2 race verification refused: postgres role required'
      using errcode = '42501';
  end if;
  if v_ref is null or v_ref = 'qsveqfchwylsbncsfgxe' or v_ref <> 'uyacxqtsiwlvtmhxvoxr' then
    raise exception 'Participant P2 race verification refused: exact isolated project attestation is required'
      using errcode = '42501';
  end if;
  if v_attestation <> 'participant-p2-race-read-only-verification-approved' then
    raise exception 'Participant P2 race verification refused: exact read-only attestation is required'
      using errcode = '42501';
  end if;
  if to_regclass('public.participant_invitations') is null
     or to_regclass('public.continuity_participants') is null
     or to_regclass('public.workflow_events') is null
     or to_regclass('public.workflow_messages') is null then
    raise exception 'Participant P2 race verification refused: reviewed relations are incomplete'
      using errcode = '55000';
  end if;
end
$p2_race_verify_guard$;

do $p2_race_verify_outcomes$
declare
  v_rotate_accept_rotated integer;
  v_rotate_accept_accepted integer;
  v_rotate_accept_children integer;
  v_rotate_accept_participants integer;
  v_rotate_cancel_rotated integer;
  v_rotate_cancel_revoked integer;
  v_rotate_cancel_children integer;
  v_decline_accept_declined integer;
  v_decline_accept_accepted integer;
  v_decline_accept_participants integer;
  v_cancel_accept_revoked integer;
  v_cancel_accept_accepted integer;
  v_cancel_accept_participants integer;
begin
  select
    count(*) filter (where name = 'participant_invitation.rotated'),
    count(*) filter (where name = 'participant_invitation.accepted')
  into v_rotate_accept_rotated, v_rotate_accept_accepted
  from public.workflow_events
  where participant_invitation_id = '82a10001-82a1-42a1-82a1-000000000001';
  select count(*) into v_rotate_accept_children
  from public.participant_invitations
  where rotates_invitation_id = '82a10001-82a1-42a1-82a1-000000000001';
  select count(*) into v_rotate_accept_participants
  from public.continuity_participants
  where accepted_from_invitation_id = '82a10001-82a1-42a1-82a1-000000000001';
  if v_rotate_accept_rotated + v_rotate_accept_accepted <> 1
     or v_rotate_accept_children <> v_rotate_accept_rotated
     or v_rotate_accept_participants <> v_rotate_accept_accepted then
    raise exception 'Participant P2 race verification failed: rotate versus accept cardinality drifted';
  end if;

  select
    count(*) filter (where name = 'participant_invitation.rotated'),
    count(*) filter (where name = 'participant_invitation.revoked')
  into v_rotate_cancel_rotated, v_rotate_cancel_revoked
  from public.workflow_events
  where participant_invitation_id = '82a10002-82a1-42a1-82a1-000000000002';
  select count(*) into v_rotate_cancel_children
  from public.participant_invitations
  where rotates_invitation_id = '82a10002-82a1-42a1-82a1-000000000002';
  if v_rotate_cancel_rotated + v_rotate_cancel_revoked <> 1
     or v_rotate_cancel_children <> v_rotate_cancel_rotated
     or exists (
       select 1 from public.continuity_participants
       where accepted_from_invitation_id = '82a10002-82a1-42a1-82a1-000000000002'
     ) then
    raise exception 'Participant P2 race verification failed: rotate versus cancel cardinality drifted';
  end if;

  select
    count(*) filter (where name = 'participant_invitation.declined'),
    count(*) filter (where name = 'participant_invitation.accepted')
  into v_decline_accept_declined, v_decline_accept_accepted
  from public.workflow_events
  where participant_invitation_id = '82a10003-82a1-42a1-82a1-000000000003';
  select count(*) into v_decline_accept_participants
  from public.continuity_participants
  where accepted_from_invitation_id = '82a10003-82a1-42a1-82a1-000000000003';
  if v_decline_accept_declined + v_decline_accept_accepted <> 1
     or v_decline_accept_participants <> v_decline_accept_accepted then
    raise exception 'Participant P2 race verification failed: decline versus accept cardinality drifted';
  end if;

  select
    count(*) filter (where name = 'participant_invitation.revoked'),
    count(*) filter (where name = 'participant_invitation.accepted')
  into v_cancel_accept_revoked, v_cancel_accept_accepted
  from public.workflow_events
  where participant_invitation_id = '82a10004-82a1-42a1-82a1-000000000004';
  select count(*) into v_cancel_accept_participants
  from public.continuity_participants
  where accepted_from_invitation_id = '82a10004-82a1-42a1-82a1-000000000004';
  if v_cancel_accept_revoked + v_cancel_accept_accepted <> 1
     or v_cancel_accept_participants <> v_cancel_accept_accepted then
    raise exception 'Participant P2 race verification failed: cancel versus accept cardinality drifted';
  end if;

  if exists (
       select 1
       from public.participant_invitations as replacement
       where replacement.rotates_invitation_id in (
         '82a10001-82a1-42a1-82a1-000000000001',
         '82a10002-82a1-42a1-82a1-000000000002'
       )
         and (
           replacement.accepted_at is not null
           or replacement.revoked_at is not null
           or replacement.expires_at <= pg_catalog.clock_timestamp()
           or (select count(*) from public.workflow_events as event_row
               where event_row.participant_invitation_id = replacement.id
                 and event_row.name = 'participant_invitation.created') <> 1
         )
     ) then
    raise exception 'Participant P2 race verification failed: orphan replacement detected';
  end if;

  if (select count(*) from public.continuity_participants
      where id = '82a20005-82a2-42a2-82a2-000000000005'
        and status = 'revoked' and revoked_at is not null) <> 1
     or (select count(*) from public.workflow_events
         where continuity_participant_id = '82a20005-82a2-42a2-82a2-000000000005'
           and name = 'continuity_participant.revoked') <> 1
     or exists (select 1 from public.workflow_messages
                where workflow_id = '82a30001-82a3-42a3-82a3-000000000001') then
    raise exception 'Participant P2 race verification failed: committed revocation evidence drifted';
  end if;

  if (select count(*) from public.participant_invitations
      where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001')
       <> 5 + v_rotate_accept_rotated + v_rotate_cancel_rotated
     or (select count(*) from public.continuity_participants
         where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001')
       <> 1 + v_rotate_accept_accepted + v_decline_accept_accepted + v_cancel_accept_accepted
     or (select count(*) from public.workflow_events
         where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001')
       <> 5 + v_rotate_accept_rotated + v_rotate_cancel_rotated then
    raise exception 'Participant P2 race verification failed: reserved-scope total cardinality drifted';
  end if;
end
$p2_race_verify_outcomes$;

select
  case
    when exists (
      select 1 from public.workflow_events
      where participant_invitation_id = '82a10001-82a1-42a1-82a1-000000000001'
        and name = 'participant_invitation.rotated'
    ) then 'rotation committed'
    else 'acceptance committed'
  end as rotate_accept_outcome,
  case
    when exists (
      select 1 from public.workflow_events
      where participant_invitation_id = '82a10002-82a1-42a1-82a1-000000000002'
        and name = 'participant_invitation.rotated'
    ) then 'rotation committed'
    else 'cancellation committed'
  end as rotate_cancel_outcome,
  case
    when exists (
      select 1 from public.workflow_events
      where participant_invitation_id = '82a10003-82a1-42a1-82a1-000000000003'
        and name = 'participant_invitation.declined'
    ) then 'decline committed'
    else 'acceptance committed'
  end as decline_accept_outcome,
  case
    when exists (
      select 1 from public.workflow_events
      where participant_invitation_id = '82a10004-82a1-42a1-82a1-000000000004'
        and name = 'participant_invitation.revoked'
    ) then 'cancellation committed'
    else 'acceptance committed'
  end as cancel_accept_outcome,
  (select count(*) from public.participant_invitations
   where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001') as invitation_rows,
  (select count(*) from public.continuity_participants
   where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001') as participant_rows,
  (select count(*) from public.workflow_events
   where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001') as event_rows,
  (select count(*) from public.workflow_messages
   where workflow_id = '82a30001-82a3-42a3-82a3-000000000001') as message_rows;
