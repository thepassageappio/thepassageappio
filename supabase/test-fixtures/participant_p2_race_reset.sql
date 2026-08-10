-- TEST-ONLY participant P2 ordinary-session race fixture.
--
-- This fixture is DML-only, deterministic, reversible, and restricted to the
-- isolated project uyacxqtsiwlvtmhxvoxr. It never creates or edits Auth users.
-- Create the six reserved accounts through Supabase Auth Admin, then run this
-- file as postgres in one transaction with the exact local attestations below.
-- Production project qsveqfchwylsbncsfgxe is always prohibited.
--
-- Reset:
--   begin;
--   set local passage.fixture_project_ref = 'uyacxqtsiwlvtmhxvoxr';
--   set local passage.p2_race_fixture_mode = 'reset';
--   set local passage.p2_race_fixture_attestation = 'participant-p2-race-isolated-reset-approved';
--   -- execute this file
--   commit;
--
-- Cleanup uses the same transaction with mode 'cleanup'. It removes only rows
-- bound to the reserved space/workflow IDs. Auth accounts remain owned by Auth
-- Admin and may be disabled there after evidence retention.

do $p2_race_project_guard$
declare
  v_ref text := nullif(current_setting('passage.fixture_project_ref', true), '');
  v_mode text := nullif(current_setting('passage.p2_race_fixture_mode', true), '');
  v_attestation text := nullif(current_setting('passage.p2_race_fixture_attestation', true), '');
begin
  if session_user <> 'postgres' or current_user <> 'postgres' then
    raise exception 'Participant P2 race fixture refused: postgres fixture role required'
      using errcode = '42501';
  end if;
  if v_ref is null then
    raise exception 'Participant P2 race fixture refused: target project attestation is required'
      using errcode = '22023';
  end if;
  if v_ref = 'qsveqfchwylsbncsfgxe' or v_ref <> 'uyacxqtsiwlvtmhxvoxr' then
    raise exception 'Participant P2 race fixture refused: only the isolated project is allowed'
      using errcode = '42501';
  end if;
  if v_mode not in ('reset', 'cleanup') then
    raise exception 'Participant P2 race fixture refused: mode must be reset or cleanup'
      using errcode = '22023';
  end if;
  if v_attestation <> 'participant-p2-race-isolated-reset-approved' then
    raise exception 'Participant P2 race fixture refused: exact disposable attestation is required'
      using errcode = '42501';
  end if;
  if to_regclass('auth.users') is null
     or to_regclass('public.continuity_spaces') is null
     or to_regclass('public.participant_invitations') is null
     or to_regclass('public.continuity_participants') is null
     or to_regclass('public.workflows') is null
     or to_regclass('public.workflow_events') is null
     or to_regclass('public.workflow_messages') is null
     or to_regprocedure('public.rotate_participant_invitation_idempotent(uuid,timestamp with time zone,uuid)') is null
     or to_regprocedure('public.decline_participant_invitation(text,text)') is null
     or to_regprocedure('public.revoke_participant_invitation(uuid,text)') is null
     or to_regprocedure('public.revoke_continuity_participant_idempotent(uuid,text,uuid)') is null
     or to_regprocedure('public.accept_participant_invitation(text)') is null
     or to_regprocedure('public.post_workflow_message_idempotent(uuid,text,uuid)') is null then
    raise exception 'Participant P2 race fixture refused: reviewed schema or commands are incomplete'
      using errcode = '55000';
  end if;
end
$p2_race_project_guard$;

-- The existing isolated-lab append-only trigger exposes this transaction-local
-- reset escape. No persistent bypass is created, and the project guard above
-- executes before it is set.
select set_config('passage.fixture_reset', 'cycle_7b_isolated_lab', true);

delete from public.workflow_events
where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001'
   or workflow_id = '82a30001-82a3-42a3-82a3-000000000001';

do $p2_race_message_guard$
begin
  if exists (
    select 1 from public.workflow_messages
    where workflow_id = '82a30001-82a3-42a3-82a3-000000000001'
  ) then
    raise exception 'Participant P2 race cleanup refused: an unexpected message exists on the reserved workflow'
      using errcode = '55000';
  end if;
end
$p2_race_message_guard$;

delete from public.workflows
where id = '82a30001-82a3-42a3-82a3-000000000001';

update public.participant_invitations
set accepted_at = null,
    accepted_by_user_id = null,
    accepted_participant_id = null
where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001'
  and accepted_participant_id is not null;

delete from public.continuity_participants
where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001';

delete from public.participant_invitations
where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001';

delete from public.continuity_spaces
where id = '82a00001-82a0-42a0-82a0-000000000001';

select set_config('passage.fixture_reset', '', true);

do $p2_race_identity_guard$
declare
  v_mode text := current_setting('passage.p2_race_fixture_mode');
begin
  if v_mode = 'cleanup' then
    return;
  end if;
  if (
    select count(*)
    from auth.users
    where lower(btrim(email)) in (
      'p2-race-owner@passage.test',
      'p2-race-rotate-accept@passage.test',
      'p2-race-rotate-cancel@passage.test',
      'p2-race-decline-accept@passage.test',
      'p2-race-cancel-accept@passage.test',
      'p2-race-revoke@passage.test'
    )
      and email_confirmed_at is not null
  ) <> 6
     or exists (
       select 1
       from auth.users
       where lower(btrim(email)) in (
         'p2-race-owner@passage.test',
         'p2-race-rotate-accept@passage.test',
         'p2-race-rotate-cancel@passage.test',
         'p2-race-decline-accept@passage.test',
         'p2-race-cancel-accept@passage.test',
         'p2-race-revoke@passage.test'
       )
       group by lower(btrim(email))
       having count(*) <> 1
     ) then
    raise exception 'Participant P2 race fixture refused: six unique verified Auth Admin accounts are required'
      using errcode = '55000';
  end if;
  if exists (
    select 1 from public.continuity_spaces
    where owner_user_id = (
      select id from auth.users where lower(btrim(email)) = 'p2-race-owner@passage.test'
    ) and status = 'active'
  ) then
    raise exception 'Participant P2 race fixture refused: reserved owner has an unrelated active space'
      using errcode = '23505';
  end if;
end
$p2_race_identity_guard$;

insert into public.continuity_spaces (
  id, owner_user_id, display_name, status, creation_request_id
)
select
  '82a00001-82a0-42a0-82a0-000000000001',
  id,
  'Participant P2 race family',
  'active',
  '82a00002-82a0-42a0-82a0-000000000002'
from auth.users
where lower(btrim(email)) = 'p2-race-owner@passage.test'
  and current_setting('passage.p2_race_fixture_mode') = 'reset';

insert into public.participant_invitations (
  id, continuity_space_id, invited_email, display_name, relationship,
  purpose, category_scope, invited_by_user_id, token_digest, token_hint,
  delivery_state, expires_at, creation_request_id
)
select
  fixture.invitation_id,
  '82a00001-82a0-42a0-82a0-000000000001',
  fixture.email,
  fixture.display_name,
  'Friend',
  'Receive family updates',
  array['updates']::text[],
  owner_user.id,
  passage_private.hash_invitation_token(fixture.raw_token),
  right(passage_private.hash_invitation_token(fixture.raw_token), 8),
  'not_sent',
  date_trunc('second', pg_catalog.clock_timestamp() + interval '7 days'),
  fixture.request_id
from (
  values
    ('82a10001-82a1-42a1-82a1-000000000001'::uuid, 'p2-race-rotate-accept@passage.test'::text, 'Rotate Accept Racer'::text, 'p2-race-rotate-accept-token-20260810'::text, '82a11001-82a1-42a1-82a1-000000000001'::uuid),
    ('82a10002-82a1-42a1-82a1-000000000002'::uuid, 'p2-race-rotate-cancel@passage.test'::text, 'Rotate Cancel Racer'::text, 'p2-race-rotate-cancel-token-20260810'::text, '82a11002-82a1-42a1-82a1-000000000002'::uuid),
    ('82a10003-82a1-42a1-82a1-000000000003'::uuid, 'p2-race-decline-accept@passage.test'::text, 'Decline Accept Racer'::text, 'p2-race-decline-accept-token-20260810'::text, '82a11003-82a1-42a1-82a1-000000000003'::uuid),
    ('82a10004-82a1-42a1-82a1-000000000004'::uuid, 'p2-race-cancel-accept@passage.test'::text, 'Cancel Accept Racer'::text, 'p2-race-cancel-accept-token-20260810'::text, '82a11004-82a1-42a1-82a1-000000000004'::uuid),
    ('82a10005-82a1-42a1-82a1-000000000005'::uuid, 'p2-race-revoke@passage.test'::text, 'Revocation Racer'::text, 'p2-race-revoke-token-20260810-000'::text, '82a11005-82a1-42a1-82a1-000000000005'::uuid)
) as fixture(invitation_id, email, display_name, raw_token, request_id)
cross join auth.users as owner_user
where lower(btrim(owner_user.email)) = 'p2-race-owner@passage.test'
  and current_setting('passage.p2_race_fixture_mode') = 'reset';

insert into public.continuity_participants (
  id, continuity_space_id, user_id, invited_email, display_name,
  relationship, purpose, category_scope, status,
  accepted_from_invitation_id, accepted_at
)
select
  '82a20005-82a2-42a2-82a2-000000000005',
  '82a00001-82a0-42a0-82a0-000000000001',
  participant_user.id,
  'p2-race-revoke@passage.test',
  'Revocation Racer',
  'Friend',
  'Receive family updates',
  array['updates']::text[],
  'active',
  '82a10005-82a1-42a1-82a1-000000000005',
  date_trunc('second', pg_catalog.clock_timestamp())
from auth.users as participant_user
where lower(btrim(participant_user.email)) = 'p2-race-revoke@passage.test'
  and current_setting('passage.p2_race_fixture_mode') = 'reset';

update public.participant_invitations
set accepted_at = participant.accepted_at,
    accepted_by_user_id = participant.user_id,
    accepted_participant_id = participant.id
from public.continuity_participants as participant
where participant.id = '82a20005-82a2-42a2-82a2-000000000005'
  and participant_invitations.id = '82a10005-82a1-42a1-82a1-000000000005'
  and current_setting('passage.p2_race_fixture_mode') = 'reset';

insert into public.workflows (
  id, organization_id, organization_location_id,
  accountable_organization_member_id, case_reference, family_name,
  person_name, phase, status, continuity_space_id
)
select
  '82a30001-82a3-42a3-82a3-000000000001',
  'c7a00001-7a00-47a0-87a0-000000000001',
  'c7a00002-7a00-47a0-87a0-000000000002',
  'c7a00003-7a00-47a0-87a0-000000000003',
  'P2-RACE-20260810',
  'Race family',
  'Synthetic person',
  'Participant message revocation',
  'active',
  '82a00001-82a0-42a0-82a0-000000000001'
where current_setting('passage.p2_race_fixture_mode') = 'reset';

do $p2_race_postcondition$
declare
  v_mode text := current_setting('passage.p2_race_fixture_mode');
begin
  if v_mode = 'cleanup' then
    if exists (select 1 from public.continuity_spaces where id = '82a00001-82a0-42a0-82a0-000000000001')
       or exists (select 1 from public.workflows where id = '82a30001-82a3-42a3-82a3-000000000001') then
      raise exception 'Participant P2 race cleanup postcondition failed';
    end if;
    return;
  end if;
  if (select count(*) from public.continuity_spaces where id = '82a00001-82a0-42a0-82a0-000000000001' and status = 'active') <> 1
     or (select count(*) from public.participant_invitations where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001') <> 5
     or (select count(*) from public.participant_invitations where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001' and accepted_at is null and revoked_at is null) <> 4
     or (select count(*) from public.continuity_participants where id = '82a20005-82a2-42a2-82a2-000000000005' and status = 'active') <> 1
     or (select count(*) from public.workflows where id = '82a30001-82a3-42a3-82a3-000000000001' and continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001') <> 1
     or exists (select 1 from public.workflow_events where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001')
     or exists (select 1 from public.workflow_messages where workflow_id = '82a30001-82a3-42a3-82a3-000000000001') then
    raise exception 'Participant P2 race reset postcondition failed';
  end if;
end
$p2_race_postcondition$;

select fixture_key, fixture_value
from (
  values
    ('PASSAGE_P2_RACE_ROTATE_ACCEPT_INVITATION_ID', '82a10001-82a1-42a1-82a1-000000000001'),
    ('PASSAGE_P2_RACE_ROTATE_ACCEPT_TOKEN', 'p2-race-rotate-accept-token-20260810'),
    ('PASSAGE_P2_RACE_ROTATE_CANCEL_INVITATION_ID', '82a10002-82a1-42a1-82a1-000000000002'),
    ('PASSAGE_P2_RACE_DECLINE_ACCEPT_INVITATION_ID', '82a10003-82a1-42a1-82a1-000000000003'),
    ('PASSAGE_P2_RACE_DECLINE_ACCEPT_TOKEN', 'p2-race-decline-accept-token-20260810'),
    ('PASSAGE_P2_RACE_CANCEL_ACCEPT_INVITATION_ID', '82a10004-82a1-42a1-82a1-000000000004'),
    ('PASSAGE_P2_RACE_CANCEL_ACCEPT_TOKEN', 'p2-race-cancel-accept-token-20260810'),
    ('PASSAGE_P2_RACE_REVOKE_PARTICIPANT_ID', '82a20005-82a2-42a2-82a2-000000000005'),
    ('PASSAGE_P2_RACE_WORKFLOW_ID', '82a30001-82a3-42a3-82a3-000000000001')
) as output(fixture_key, fixture_value)
where current_setting('passage.p2_race_fixture_mode') = 'reset'
order by fixture_key;
