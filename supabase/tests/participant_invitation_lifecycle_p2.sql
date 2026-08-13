-- Rollback-only participant invitation P2 lifecycle and revocation matrix.
--
-- Run only against isolated project uyacxqtsiwlvtmhxvoxr after setting:
--   set passage.test_project_ref = 'uyacxqtsiwlvtmhxvoxr';
-- Production project qsveqfchwylsbncsfgxe is always refused.
begin;

do $p2_preflight$
declare
  v_required_functions regprocedure[] := array[
    'public.rotate_participant_invitation_idempotent(uuid,timestamp with time zone,uuid)'::regprocedure,
    'public.decline_participant_invitation(text,text)'::regprocedure,
    'public.revoke_participant_invitation(uuid,text)'::regprocedure,
    'public.revoke_continuity_participant_idempotent(uuid,text,uuid)'::regprocedure,
    'public.list_participant_family_updates()'::regprocedure,
    'public.list_workflow_messages_client_safe(uuid)'::regprocedure,
    'public.post_workflow_message_idempotent(uuid,text,uuid)'::regprocedure
  ];
  v_function regprocedure;
begin
  if current_setting('passage.test_project_ref', true) is distinct from
       'uyacxqtsiwlvtmhxvoxr'
     or current_setting('passage.test_project_ref', true) =
       'qsveqfchwylsbncsfgxe'
     or session_user <> 'postgres'
     or current_user <> 'postgres' then
    raise exception 'P2 lifecycle tests refused: exact isolated postgres attestation is required'
      using errcode = '42501';
  end if;

  if not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'participant_invitation_thin_slice'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'participant_advisor_hardening'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'family_case_workflow_grant'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'workflow_messages_client_projection'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'participant_updates_case_scope'
     ) then
    raise exception 'P2 lifecycle tests refused: reviewed migration lineage is incomplete';
  end if;

  foreach v_function in array v_required_functions loop
    if not has_function_privilege('authenticated', v_function, 'EXECUTE') then
      raise exception 'Authenticated execute grant is missing for %', v_function;
    end if;
    if not exists (
      select 1
      from pg_proc as function_row
      where function_row.oid = v_function
        and function_row.proconfig @> array['search_path=""']::text[]
        and (
          (
            v_function = 'public.list_participant_family_updates()'::regprocedure
            and function_row.prosecdef
          )
          or (
            v_function <> 'public.list_participant_family_updates()'::regprocedure
            and not function_row.prosecdef
          )
        )
    ) then
      raise exception 'Public P2 function posture drifted for %', v_function;
    end if;
  end loop;

  if to_regclass('public.partner_members') is null
     or to_regclass('public.workflow_messages') is null
     or to_regclass('public.task_proofs') is null
     or to_regclass('public.task_proof_reviews') is null
     or not exists (
       select 1 from pg_trigger
       where tgrelid = 'public.workflow_events'::regclass
         and tgname = 'workflow_events_cycle_7b_append_only'
         and not tgisinternal
         and tgenabled in ('O', 'A')
     )
     or not exists (
       select 1 from public.workflows
       where id = 'c7b10001-7b00-47b0-87b0-000000000001'
     ) then
    raise exception 'P2 lifecycle tests refused: reviewed tables, append-only trigger, or synthetic workflow is missing';
  end if;

  if has_table_privilege('authenticated', 'public.participant_invitations', 'SELECT')
     or has_table_privilege('authenticated', 'public.participant_invitations', 'INSERT')
     or has_table_privilege('authenticated', 'public.participant_invitations', 'UPDATE')
     or has_table_privilege('authenticated', 'public.participant_invitations', 'DELETE')
     or has_table_privilege('authenticated', 'public.continuity_participants', 'SELECT')
     or has_table_privilege('authenticated', 'public.continuity_participants', 'INSERT')
     or has_table_privilege('authenticated', 'public.continuity_participants', 'UPDATE')
     or has_table_privilege('authenticated', 'public.continuity_participants', 'DELETE') then
    raise exception 'P2 direct participant-table grants are wider than the reviewed RPC boundary';
  end if;
end
$p2_preflight$;

insert into auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('82000001-8200-4200-8200-000000000001', 'owner@p2-lifecycle.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"P2 Family Coordinator"}', now(), now()),
  ('82000002-8200-4200-8200-000000000002', 'decline@p2-lifecycle.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"P2 Declining Person"}', now(), now()),
  ('82000003-8200-4200-8200-000000000003', 'active@p2-lifecycle.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"P2 Active Person"}', now(), now()),
  ('82000004-8200-4200-8200-000000000004', 'wrong@p2-lifecycle.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"P2 Wrong Person"}', now(), now()),
  ('82000005-8200-4200-8200-000000000005', 'other-owner@p2-lifecycle.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"P2 Other Coordinator"}', now(), now()),
  ('82000006-8200-4200-8200-000000000006', 'staff@p2-lifecycle.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"P2 Staff"}', now(), now()),
  ('82000007-8200-4200-8200-000000000007', 'vendor@p2-lifecycle.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"P2 Vendor"}', now(), now()),
  ('82000008-8200-4200-8200-000000000008', 'cancel@p2-lifecycle.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"P2 Canceled Person"}', now(), now()),
  ('82000009-8200-4200-8200-000000000009', 'expired@p2-lifecycle.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"P2 Expired Person"}', now(), now());

insert into public.organizations (id, name)
values ('82000011-8200-4200-8200-000000000011', 'P2 unrelated funeral home');

insert into public.organization_members (
  id, organization_id, user_id, email, role, status, display_name, accepted_at
) values (
  '82000012-8200-4200-8200-000000000012',
  '82000011-8200-4200-8200-000000000011',
  '82000006-8200-4200-8200-000000000006',
  'staff@p2-lifecycle.test', 'staff', 'active', 'P2 Staff', now()
);

insert into public.partner_organizations (
  id, name, category, status, contact_email
) values (
  '82000013-8200-4200-8200-000000000013',
  'P2 unrelated vendor', 'other', 'active', 'vendor@p2-lifecycle.test'
);

insert into public.partner_members (
  id, partner_organization_id, user_id, email, display_name, role, status
) values (
  '82000014-8200-4200-8200-000000000014',
  '82000013-8200-4200-8200-000000000013',
  '82000007-8200-4200-8200-000000000007',
  'vendor@p2-lifecycle.test', 'P2 Vendor', 'owner', 'active'
);

do $p2_space_and_invitations$
declare
  v_space record;
  v_rotate record;
  v_decline record;
  v_cancel record;
  v_accept record;
  v_accept_receipt record;
  v_expired record;
begin
  perform set_config('request.jwt.claim.sub', '82000001-8200-4200-8200-000000000001', true);
  select * into strict v_space
  from public.create_family_space_idempotent(
    'P2 lifecycle family', '82000101-8200-4200-8200-000000000101'
  );
  perform set_config('passage.p2_space_id', v_space.continuity_space_id::text, true);

  select * into strict v_rotate from public.create_participant_invitation_idempotent(
    v_space.continuity_space_id, 'wrong@p2-lifecycle.test', 'P2 Rotation Person',
    'Friend', 'Receive family updates', array['updates'],
    now() + interval '7 days', '82000102-8200-4200-8200-000000000102'
  );
  perform set_config('passage.p2_rotate_id', v_rotate.invitation_id::text, true);
  perform set_config('passage.p2_rotate_token', v_rotate.raw_token, true);

  select * into strict v_decline from public.create_participant_invitation_idempotent(
    v_space.continuity_space_id, 'decline@p2-lifecycle.test', 'P2 Declining Person',
    'Friend', 'Receive family updates', array['updates'],
    now() + interval '7 days', '82000103-8200-4200-8200-000000000103'
  );
  perform set_config('passage.p2_decline_id', v_decline.invitation_id::text, true);
  perform set_config('passage.p2_decline_token', v_decline.raw_token, true);

  select * into strict v_cancel from public.create_participant_invitation_idempotent(
    v_space.continuity_space_id, 'cancel@p2-lifecycle.test', 'P2 Canceled Person',
    'Friend', 'Receive family updates', array['updates'],
    now() + interval '7 days', '82000104-8200-4200-8200-000000000104'
  );
  perform set_config('passage.p2_cancel_id', v_cancel.invitation_id::text, true);
  perform set_config('passage.p2_cancel_token', v_cancel.raw_token, true);

  select * into strict v_accept from public.create_participant_invitation_idempotent(
    v_space.continuity_space_id, 'active@p2-lifecycle.test', 'P2 Active Person',
    'Sibling', 'Receive family updates', array['updates'],
    now() + interval '7 days', '82000105-8200-4200-8200-000000000105'
  );
  perform set_config('passage.p2_accept_id', v_accept.invitation_id::text, true);
  perform set_config('passage.p2_accept_token', v_accept.raw_token, true);

  perform set_config('request.jwt.claim.sub', '82000003-8200-4200-8200-000000000003', true);
  select * into strict v_accept_receipt
  from public.accept_participant_invitation(v_accept.raw_token);
  perform set_config('passage.p2_participant_id', v_accept_receipt.participant_id::text, true);
  begin
    perform public.decline_participant_invitation(
      v_accept.raw_token, 'Invited person declined the invitation'
    );
    raise exception 'Expected accepted invitation decline denial';
  exception when sqlstate '55000' then null;
  end;

  perform set_config('request.jwt.claim.sub', '82000001-8200-4200-8200-000000000001', true);
  begin
    perform public.revoke_participant_invitation(
      v_accept.invitation_id, 'Family coordinator canceled the invitation'
    );
    raise exception 'Expected accepted invitation cancellation denial';
  exception when sqlstate '55000' then null;
  end;
  begin
    perform public.rotate_participant_invitation_idempotent(
      v_accept.invitation_id, date_trunc('second', now() + interval '7 days'),
      '82000107-8200-4200-8200-000000000107'
    );
    raise exception 'Expected accepted invitation rotation denial';
  exception when sqlstate '55000' then null;
  end;

  select * into strict v_expired from public.create_participant_invitation_idempotent(
    v_space.continuity_space_id, 'expired@p2-lifecycle.test', 'P2 Expired Person',
    'Friend', 'Receive family updates', array['updates'],
    now() + interval '7 days', '82000106-8200-4200-8200-000000000106'
  );
  update public.participant_invitations
  set created_at = now() - interval '2 days', expires_at = now() - interval '1 day'
  where id = v_expired.invitation_id;
  perform set_config('passage.p2_expired_id', v_expired.invitation_id::text, true);
  perform set_config('passage.p2_expired_token', v_expired.raw_token, true);
end
$p2_space_and_invitations$;

do $p2_rotation$
declare
  v_old_id uuid := current_setting('passage.p2_rotate_id')::uuid;
  v_expired_id uuid := current_setting('passage.p2_expired_id')::uuid;
  v_first record;
  v_replay record;
  v_expired_replacement record;
  v_expiry timestamptz := date_trunc('second', now() + interval '8 days');
  v_before_invitations integer := (select count(*) from public.participant_invitations);
  v_before_events integer := (select count(*) from public.workflow_events);
begin
  perform set_config('request.jwt.claim.sub', '82000009-8200-4200-8200-000000000009', true);
  begin
    perform public.decline_participant_invitation(
      current_setting('passage.p2_expired_token'), 'Invited person declined the invitation'
    );
    raise exception 'Expected expired invitation decline denial';
  exception when sqlstate '22023' then null;
  end;

  perform set_config('request.jwt.claim.sub', '82000001-8200-4200-8200-000000000001', true);
  select * into strict v_first from public.rotate_participant_invitation_idempotent(
    v_old_id, v_expiry, '82000201-8200-4200-8200-000000000201'
  );
  select * into strict v_replay from public.rotate_participant_invitation_idempotent(
    v_old_id, v_expiry, '82000201-8200-4200-8200-000000000201'
  );
  if v_first.replayed or v_first.raw_token is null
     or not v_replay.replayed or v_replay.raw_token is not null
     or v_replay.invitation_id is distinct from v_first.invitation_id
     or (select count(*) from public.participant_invitations) <> v_before_invitations + 1
     or (select count(*) from public.workflow_events) <> v_before_events + 2
     or (select count(*) from public.participant_invitations where rotates_invitation_id = v_old_id) <> 1
     or (select count(*) from public.workflow_events where participant_invitation_id = v_old_id and name = 'participant_invitation.rotated') <> 1
     or (select count(*) from public.workflow_events where participant_invitation_id = v_first.invitation_id and name = 'participant_invitation.created') <> 1 then
    raise exception 'P2 rotation receipt, replay, or exact cardinality failed';
  end if;
  begin
    perform public.rotate_participant_invitation_idempotent(
      v_old_id, v_expiry + interval '1 day', '82000201-8200-4200-8200-000000000201'
    );
    raise exception 'Expected altered rotation replay conflict';
  exception when sqlstate '22023' then null;
  end;
  if (select invitation_state from public.inspect_passage_invitation(current_setting('passage.p2_rotate_token'))) <> 'revoked' then
    raise exception 'Old rotation link did not close';
  end if;
  perform set_config('request.jwt.claim.sub', '82000004-8200-4200-8200-000000000004', true);
  begin
    perform public.accept_participant_invitation(current_setting('passage.p2_rotate_token'));
    raise exception 'Expected old rotated-link acceptance denial';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.decline_participant_invitation(
      current_setting('passage.p2_rotate_token'), 'Invited person declined the invitation'
    );
    raise exception 'Expected old rotated-link decline denial';
  exception when sqlstate '22023' then null;
  end;

  perform set_config('request.jwt.claim.sub', '82000001-8200-4200-8200-000000000001', true);
  select * into strict v_expired_replacement
  from public.rotate_participant_invitation_idempotent(
    v_expired_id, date_trunc('second', now() + interval '7 days'),
    '82000202-8200-4200-8200-000000000202'
  );
  if v_expired_replacement.raw_token is null
     or (select invitation_state from public.inspect_passage_invitation(current_setting('passage.p2_expired_token'))) <> 'revoked' then
    raise exception 'Expired invitation replacement failed';
  end if;
end
$p2_rotation$;

do $p2_decline$
declare
  v_id uuid := current_setting('passage.p2_decline_id')::uuid;
  v_first record;
  v_replay record;
  v_before_participants integer := (select count(*) from public.continuity_participants);
  v_before_events integer := (select count(*) from public.workflow_events);
begin
  perform set_config('request.jwt.claim.sub', '82000004-8200-4200-8200-000000000004', true);
  begin
    perform public.decline_participant_invitation(
      current_setting('passage.p2_decline_token'), 'Invited person declined the invitation'
    );
    raise exception 'Expected wrong-email decline denial';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '82000002-8200-4200-8200-000000000002', true);
  select * into strict v_first from public.decline_participant_invitation(
    current_setting('passage.p2_decline_token'), 'Invited person declined the invitation'
  );
  select * into strict v_replay from public.decline_participant_invitation(
    current_setting('passage.p2_decline_token'), 'Invited person declined the invitation'
  );
  if v_first.replayed or not v_replay.replayed
     or v_first.event_id is distinct from v_replay.event_id
     or (select count(*) from public.continuity_participants) <> v_before_participants
     or (select count(*) from public.workflow_events) <> v_before_events + 1
     or (select count(*) from public.workflow_events where participant_invitation_id = v_id and name = 'participant_invitation.declined') <> 1 then
    raise exception 'P2 decline replay, zero-grant, or exact cardinality failed';
  end if;
  begin
    perform public.decline_participant_invitation(
      current_setting('passage.p2_decline_token'), 'Altered decline reason'
    );
    raise exception 'Expected altered decline replay conflict';
  exception when sqlstate '22023' then null;
  end;
end
$p2_decline$;

do $p2_cancel_and_role_denials$
declare
  v_id uuid := current_setting('passage.p2_cancel_id')::uuid;
  v_first record;
  v_replay record;
  v_before_participants integer := (select count(*) from public.continuity_participants);
  v_before_events integer := (select count(*) from public.workflow_events);
  v_actor uuid;
begin
  foreach v_actor in array array[
    '82000005-8200-4200-8200-000000000005'::uuid,
    '82000003-8200-4200-8200-000000000003'::uuid,
    '82000006-8200-4200-8200-000000000006'::uuid,
    '82000007-8200-4200-8200-000000000007'::uuid
  ] loop
    perform set_config('request.jwt.claim.sub', v_actor::text, true);
    begin
      perform public.revoke_participant_invitation(
        v_id, 'Family coordinator canceled the invitation'
      );
      raise exception 'Expected unrelated owner, participant, staff, or vendor cancellation denial';
    exception when sqlstate '42501' then null;
    end;
  end loop;

  perform set_config('request.jwt.claim.sub', '82000001-8200-4200-8200-000000000001', true);
  select * into strict v_first from public.revoke_participant_invitation(
    v_id, 'Family coordinator canceled the invitation'
  );
  select * into strict v_replay from public.revoke_participant_invitation(
    v_id, 'Family coordinator canceled the invitation'
  );
  if v_first.replayed or not v_replay.replayed
     or v_first.event_id is distinct from v_replay.event_id
     or (select count(*) from public.continuity_participants) <> v_before_participants
     or (select count(*) from public.workflow_events) <> v_before_events + 1
     or (select count(*) from public.workflow_events where participant_invitation_id = v_id and name = 'participant_invitation.revoked') <> 1 then
    raise exception 'P2 cancellation replay, zero-grant, or exact cardinality failed';
  end if;
  begin
    perform public.revoke_participant_invitation(v_id, 'Altered cancellation reason');
    raise exception 'Expected altered cancellation replay conflict';
  exception when sqlstate '22023' then null;
  end;
  if (select invitation_state from public.inspect_passage_invitation(current_setting('passage.p2_cancel_token'))) <> 'revoked' then
    raise exception 'Canceled invitation link did not close';
  end if;

  perform set_config('request.jwt.claim.sub', '82000008-8200-4200-8200-000000000008', true);
  begin
    perform public.decline_participant_invitation(
      current_setting('passage.p2_cancel_token'), 'Invited person declined the invitation'
    );
    raise exception 'Expected canceled invitation decline denial';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.accept_participant_invitation(current_setting('passage.p2_cancel_token'));
    raise exception 'Expected canceled invitation acceptance denial';
  exception when sqlstate '22023' then null;
  end;
end
$p2_cancel_and_role_denials$;

do $p2_accept_for_revocation$
declare
  v_participant_id uuid := current_setting('passage.p2_participant_id')::uuid;
begin
  perform set_config('request.jwt.claim.sub', '82000003-8200-4200-8200-000000000003', true);
  if not exists (
    select 1 from public.list_continuity_participant_projection()
    where id = v_participant_id and status = 'active'
  ) then
    raise exception 'Accepted participant positive control is missing';
  end if;

  update public.workflows
  set continuity_space_id = current_setting('passage.p2_space_id')::uuid
  where id = 'c7b10001-7b00-47b0-87b0-000000000001';

  perform public.post_workflow_message_idempotent(
    'c7b10001-7b00-47b0-87b0-000000000001',
    'Participant message before access ends.',
    '82000401-8200-4200-8200-000000000401'
  );
  if (select count(*) from public.list_workflow_messages_client_safe(
        'c7b10001-7b00-47b0-87b0-000000000001'
      )) < 1 then
    raise exception 'Pre-revocation participant message positive control failed';
  end if;
end
$p2_accept_for_revocation$;

do $p2_revocation_role_denials$
declare
  v_participant_id uuid := current_setting('passage.p2_participant_id')::uuid;
  v_actor uuid;
begin
  foreach v_actor in array array[
    '82000005-8200-4200-8200-000000000005'::uuid,
    '82000003-8200-4200-8200-000000000003'::uuid,
    '82000006-8200-4200-8200-000000000006'::uuid,
    '82000007-8200-4200-8200-000000000007'::uuid
  ] loop
    perform set_config('request.jwt.claim.sub', v_actor::text, true);
    begin
      perform public.revoke_continuity_participant_idempotent(
        v_participant_id, 'Family coordinator ended participant access',
        '82000402-8200-4200-8200-000000000402'
      );
      raise exception 'Expected unrelated coordinator, participant, staff, or vendor access-ending denial';
    exception when sqlstate '42501' then null;
    end;
  end loop;
end
$p2_revocation_role_denials$;

do $p2_revocation_and_denials$
declare
  v_participant_id uuid := current_setting('passage.p2_participant_id')::uuid;
  v_first record;
  v_replay record;
  v_before_events integer := (select count(*) from public.workflow_events);
  v_before_messages integer := (select count(*) from public.workflow_messages);
begin
  perform set_config('request.jwt.claim.sub', '82000001-8200-4200-8200-000000000001', true);
  select * into strict v_first from public.revoke_continuity_participant_idempotent(
    v_participant_id, 'Family coordinator ended participant access',
    '82000403-8200-4200-8200-000000000403'
  );
  select * into strict v_replay from public.revoke_continuity_participant_idempotent(
    v_participant_id, 'Family coordinator ended participant access',
    '82000403-8200-4200-8200-000000000403'
  );
  if v_first.replayed or not v_replay.replayed
     or v_first.event_id is distinct from v_replay.event_id
     or (select count(*) from public.continuity_participants where id = v_participant_id and status = 'revoked') <> 1
     or (select count(*) from public.workflow_events) <> v_before_events + 1
     or (select count(*) from public.workflow_events where continuity_participant_id = v_participant_id and name = 'continuity_participant.revoked') <> 1 then
    raise exception 'P2 access revocation replay or exact cardinality failed';
  end if;
  begin
    perform public.revoke_continuity_participant_idempotent(
      v_participant_id, 'Altered access reason',
      '82000403-8200-4200-8200-000000000403'
    );
    raise exception 'Expected altered access-revocation replay conflict';
  exception when sqlstate '22023' then null;
  end;

  perform set_config('request.jwt.claim.sub', '82000003-8200-4200-8200-000000000003', true);
  if (select count(*) from public.list_participant_continuity_spaces()) <> 0
     or (select count(*) from public.list_continuity_participant_projection()) <> 0
     or (select count(*) from public.list_participant_family_updates()) <> 0 then
    raise exception 'Revoked participant retained a participant projection';
  end if;
  begin
    perform public.list_workflow_messages_client_safe(
      'c7b10001-7b00-47b0-87b0-000000000001'
    );
    raise exception 'Expected revoked participant message-list denial';
  exception when sqlstate '42501' then null;
  end;
  begin
    perform public.post_workflow_message_idempotent(
      'c7b10001-7b00-47b0-87b0-000000000001',
      'This message must not be saved.',
      '82000404-8200-4200-8200-000000000404'
    );
    raise exception 'Expected revoked participant message-post denial';
  exception when sqlstate '42501' then null;
  end;
  if (select count(*) from public.workflow_messages) <> v_before_messages then
    raise exception 'Revoked message denial changed message cardinality';
  end if;
end
$p2_revocation_and_denials$;

set local role authenticated;

do $p2_direct_relation_denials$
begin
  perform set_config('request.jwt.claim.sub', '82000003-8200-4200-8200-000000000003', true);
  begin
    if exists (select 1 from public.workflows) then
      raise exception 'Revoked participant retained a raw workflow row';
    end if;
  exception when insufficient_privilege then null;
  end;
  begin
    if exists (select 1 from public.tasks) then
      raise exception 'Revoked participant retained a raw task row';
    end if;
  exception when insufficient_privilege then null;
  end;
  begin
    if exists (select 1 from public.workflow_events) then
      raise exception 'Revoked participant retained a raw event row';
    end if;
  exception when insufficient_privilege then null;
  end;
  begin
    if exists (select 1 from public.task_proofs) then
      raise exception 'Revoked participant retained a raw proof row';
    end if;
  exception when insufficient_privilege then null;
  end;
  begin
    if exists (select 1 from public.task_proof_reviews) then
      raise exception 'Revoked participant retained a raw review row';
    end if;
  exception when insufficient_privilege then null;
  end;
end
$p2_direct_relation_denials$;

reset role;

do $p2_owner_history_and_append_only$
declare
  v_space_id uuid := current_setting('passage.p2_space_id')::uuid;
  v_participant_id uuid := current_setting('passage.p2_participant_id')::uuid;
  v_event_id uuid;
  v_event_count integer;
begin
  perform set_config('request.jwt.claim.sub', '82000001-8200-4200-8200-000000000001', true);
  if not exists (
       select 1 from public.list_owned_continuity_participant_projection()
       where id = v_participant_id and status = 'revoked' and revoked_at is not null
     )
     or not exists (
       select 1 from public.list_participant_invitation_projection()
       where id = current_setting('passage.p2_decline_id')::uuid and lifecycle_state = 'declined'
     )
     or not exists (
       select 1 from public.list_participant_invitation_projection()
       where id = current_setting('passage.p2_cancel_id')::uuid and lifecycle_state = 'revoked'
     ) then
    raise exception 'Coordinator terminal invitation or Past access projection failed';
  end if;

  select id into strict v_event_id
  from public.workflow_events
  where continuity_space_id = v_space_id
  order by occurred_at
  limit 1;
  select count(*) into v_event_count
  from public.workflow_events
  where continuity_space_id = v_space_id;
  begin
    update public.workflow_events set name = 'tampered' where id = v_event_id;
    raise exception 'Expected append-only update denial';
  exception when sqlstate '42501' then null;
  end;
  begin
    delete from public.workflow_events where id = v_event_id;
    raise exception 'Expected append-only delete denial';
  exception when sqlstate '42501' then null;
  end;
  if (select count(*) from public.workflow_events where continuity_space_id = v_space_id) <> v_event_count then
    raise exception 'Append-only denial changed P2 event cardinality';
  end if;
end
$p2_owner_history_and_append_only$;

rollback;
