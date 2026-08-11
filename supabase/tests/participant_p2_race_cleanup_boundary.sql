-- Rollback-only contract for the Participant P2 race cleanup boundary.
-- Run as postgres against isolated project uyacxqtsiwlvtmhxvoxr only, after
-- participant_p2_race_reset.sql mode=cleanup has returned reserved rows to zero.

begin;

select set_config('passage.fixture_project_ref', 'uyacxqtsiwlvtmhxvoxr', true);
select set_config('passage.fixture_reset', 'participant_p2_race_isolated_cleanup', true);
select set_config(
  'passage.p2_race_cleanup_attestation',
  'participant-p2-race-event-cleanup-approved',
  true
);

do $p2_cleanup_test_guard$
begin
  if session_user <> 'postgres' or current_user <> 'postgres' then
    raise exception 'Participant P2 cleanup test refused: postgres role required'
      using errcode = '42501';
  end if;
  if current_setting('passage.fixture_project_ref', true) <> 'uyacxqtsiwlvtmhxvoxr'
     or current_setting('passage.fixture_project_ref', true) = 'qsveqfchwylsbncsfgxe' then
    raise exception 'Participant P2 cleanup test refused: exact isolated project is required'
      using errcode = '42501';
  end if;
  if to_regprocedure('passage_private.reject_workflow_event_mutation()') is null
     or pg_catalog.pg_get_functiondef(
       to_regprocedure('passage_private.reject_workflow_event_mutation()')
     ) not like '%participant_p2_race_isolated_cleanup%'
     or pg_catalog.pg_get_functiondef(
       to_regprocedure('passage_private.reject_workflow_event_mutation()')
     ) not like '%participant-p2-race-event-cleanup-approved%' then
    raise exception 'Participant P2 cleanup test refused: reviewed trigger contract is absent'
      using errcode = '55000';
  end if;
  if exists (
    select 1 from public.continuity_spaces
    where id = '82a00001-82a0-42a0-82a0-000000000001'
  ) or exists (
    select 1 from public.workflow_events
    where continuity_space_id = '82a00001-82a0-42a0-82a0-000000000001'
  ) then
    raise exception 'Participant P2 cleanup test refused: reserved fixture rows are not clean'
      using errcode = '55000';
  end if;
  if (
    select count(*) from auth.users
    where lower(btrim(email)) in (
      'p2-race-owner@passage.test',
      'p2-race-rotate-accept@passage.test',
      'p2-race-rotate-cancel@passage.test',
      'p2-race-decline-accept@passage.test',
      'p2-race-cancel-accept@passage.test',
      'p2-race-revoke@passage.test'
    ) and email_confirmed_at is not null
  ) <> 6 then
    raise exception 'Participant P2 cleanup test refused: six verified reserved Auth users are required'
      using errcode = '55000';
  end if;
end
$p2_cleanup_test_guard$;

insert into public.continuity_spaces (
  id, owner_user_id, display_name, status, creation_request_id
)
select
  '82a00001-82a0-42a0-82a0-000000000001',
  id,
  'Participant P2 cleanup boundary test',
  'active',
  '82af0001-82af-42af-82af-000000000001'
from auth.users
where lower(btrim(email)) = 'p2-race-owner@passage.test';

insert into public.participant_invitations (
  id, continuity_space_id, invited_email, display_name, relationship,
  purpose, category_scope, invited_by_user_id, token_digest, token_hint,
  delivery_state, expires_at, revoked_at, revoked_by_user_id,
  revocation_reason, creation_request_id
)
select
  fixture.invitation_id,
  '82a00001-82a0-42a0-82a0-000000000001',
  fixture.email,
  fixture.display_name,
  'Friend',
  'Cleanup boundary test',
  array['updates']::text[],
  owner_user.id,
  fixture.token_digest,
  right(fixture.token_digest, 8),
  'not_sent',
  pg_catalog.clock_timestamp() + interval '7 days',
  pg_catalog.clock_timestamp(),
  owner_user.id,
  fixture.reason,
  fixture.request_id
from (
  values
    (
      '82a10002-82a1-42a1-82a1-000000000002'::uuid,
      'p2-race-rotate-cancel@passage.test'::text,
      'Exact cleanup event'::text,
      repeat('a', 64)::text,
      'Family canceled this invitation'::text,
      '82af1002-82af-42af-82af-000000000002'::uuid
    ),
    (
      '82a10004-82a1-42a1-82a1-000000000004'::uuid,
      'p2-race-cancel-accept@passage.test'::text,
      'Production denial event'::text,
      repeat('b', 64)::text,
      'Family canceled this invitation'::text,
      '82af1004-82af-42af-82af-000000000004'::uuid
    ),
    (
      '82af0002-82af-42af-82af-000000000002'::uuid,
      'p2-race-owner@passage.test'::text,
      'Foreign cleanup event'::text,
      repeat('c', 64)::text,
      'Family canceled this invitation'::text,
      '82aff002-82af-42af-82af-000000000002'::uuid
    )
) as fixture(
  invitation_id, email, display_name, token_digest, reason, request_id
)
cross join auth.users as owner_user
where lower(btrim(owner_user.email)) = 'p2-race-owner@passage.test';

insert into public.workflow_events (
  id, workflow_id, event_type, name, actor_user_id, idempotency_key,
  audience, previous_state, next_state, metadata,
  continuity_space_id, participant_invitation_id
)
select
  fixture.event_id,
  null,
  'other',
  fixture.name,
  owner_user.id,
  fixture.idempotency_key,
  'family_space',
  fixture.previous_state,
  fixture.next_state,
  pg_catalog.jsonb_build_object('proof_destination', 'family_access_history'),
  '82a00001-82a0-42a0-82a0-000000000001',
  fixture.invitation_id
from (
  values
    (
      '82ae0001-82ae-42ae-82ae-000000000001'::uuid,
      '82a10002-82a1-42a1-82a1-000000000002'::uuid,
      'participant_invitation.revoked'::text,
      'participant_invitation:82a10002-82a1-42a1-82a1-000000000002:revoked'::text,
      'available'::text,
      'revoked'::text
    ),
    (
      '82ae0002-82ae-42ae-82ae-000000000002'::uuid,
      '82a10004-82a1-42a1-82a1-000000000004'::uuid,
      'participant_invitation.revoked'::text,
      'participant_invitation:82a10004-82a1-42a1-82a1-000000000004:revoked'::text,
      'available'::text,
      'revoked'::text
    ),
    (
      '82ae0003-82ae-42ae-82ae-000000000003'::uuid,
      '82a10002-82a1-42a1-82a1-000000000002'::uuid,
      'foreign.event'::text,
      'participant-p2-cleanup-foreign-name'::text,
      'available'::text,
      'revoked'::text
    ),
    (
      '82ae0004-82ae-42ae-82ae-000000000004'::uuid,
      '82af0002-82af-42af-82af-000000000002'::uuid,
      'participant_invitation.revoked'::text,
      'participant_invitation:82af0002-82af-42af-82af-000000000002:revoked'::text,
      'available'::text,
      'revoked'::text
    )
) as fixture(
  event_id, invitation_id, name, idempotency_key, previous_state, next_state
)
cross join auth.users as owner_user
where lower(btrim(owner_user.email)) = 'p2-race-owner@passage.test';

-- Exact reserved deletion succeeds.
delete from public.workflow_events
where id = '82ae0001-82ae-42ae-82ae-000000000001';

do $p2_cleanup_exact_delete_assertion$
begin
  if exists (
    select 1 from public.workflow_events
    where id = '82ae0001-82ae-42ae-82ae-000000000001'
  ) then
    raise exception 'Participant P2 cleanup test failed: exact reserved event was not deleted';
  end if;
end
$p2_cleanup_exact_delete_assertion$;

-- Production attestation is always rejected.
select set_config('passage.fixture_project_ref', 'qsveqfchwylsbncsfgxe', true);
do $p2_cleanup_production_denial$
begin
  begin
    delete from public.workflow_events
    where id = '82ae0002-82ae-42ae-82ae-000000000002';
    raise exception 'Expected Production cleanup denial';
  exception when sqlstate '42501' then null;
  end;
end
$p2_cleanup_production_denial$;
select set_config('passage.fixture_project_ref', 'uyacxqtsiwlvtmhxvoxr', true);

-- Foreign event names and foreign invitation rows remain append-only.
do $p2_cleanup_foreign_denials$
begin
  begin
    delete from public.workflow_events
    where id = '82ae0003-82ae-42ae-82ae-000000000003';
    raise exception 'Expected foreign-name cleanup denial';
  exception when sqlstate '42501' then null;
  end;
  begin
    delete from public.workflow_events
    where id = '82ae0004-82ae-42ae-82ae-000000000004';
    raise exception 'Expected foreign-invitation cleanup denial';
  exception when sqlstate '42501' then null;
  end;
end
$p2_cleanup_foreign_denials$;

-- UPDATE remains prohibited even for an otherwise exact reserved event.
do $p2_cleanup_update_denial$
begin
  begin
    update public.workflow_events
    set updated_at = pg_catalog.clock_timestamp()
    where id = '82ae0002-82ae-42ae-82ae-000000000002';
    raise exception 'Expected participant cleanup UPDATE denial';
  exception when sqlstate '42501' then null;
  end;
end
$p2_cleanup_update_denial$;

-- The exact cleanup attestation is mandatory.
select set_config('passage.p2_race_cleanup_attestation', '', true);
do $p2_cleanup_attestation_denial$
begin
  begin
    delete from public.workflow_events
    where id = '82ae0002-82ae-42ae-82ae-000000000002';
    raise exception 'Expected missing-attestation cleanup denial';
  exception when sqlstate '42501' then null;
  end;
end
$p2_cleanup_attestation_denial$;
select set_config(
  'passage.p2_race_cleanup_attestation',
  'participant-p2-race-event-cleanup-approved',
  true
);

do $p2_cleanup_denial_postconditions$
begin
  if (
    select count(*) from public.workflow_events
    where id in (
      '82ae0002-82ae-42ae-82ae-000000000002',
      '82ae0003-82ae-42ae-82ae-000000000003',
      '82ae0004-82ae-42ae-82ae-000000000004'
    )
  ) <> 3 then
    raise exception 'Participant P2 cleanup test failed: a denied row changed';
  end if;
  raise notice 'Participant P2 exact cleanup and Production/foreign/update/attestation denials passed';
end
$p2_cleanup_denial_postconditions$;

rollback;
