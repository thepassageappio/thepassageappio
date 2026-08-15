-- Rollback-only workflow-message projection, authority, replay, and
-- append-only regression matrix.
--
-- Run after:
--   20260727020000_workflow_messages_thin_slice
--   20260729034001_workflow_messages_client_projection
--   20260729053000_workflow_messages_trigger_search_path
-- and the retained Cycle 7B workload fixture in isolated Passage Zero lab
-- uyacxqtsiwlvtmhxvoxr. Every test row and mutation rolls back.

begin;

do $message_projection_preflight$
begin
  if to_regclass('public.workflow_messages') is null
     or to_regprocedure(
       'public.list_workflow_messages_client_safe(uuid)'
     ) is null
     or to_regprocedure(
       'public.post_workflow_message_idempotent(uuid,text,uuid)'
     ) is null
     or to_regprocedure(
       'passage_private.can_message_workflow(uuid)'
     ) is null
     or not exists (
       select 1
       from public.workflows
       where id = 'c7b10001-7b00-47b0-87b0-000000000001'
     )
     or not exists (
       select 1
       from public.organization_members as member_row
       join public.workflows as workflow_row
         on workflow_row.organization_id = member_row.organization_id
       where workflow_row.id =
           'c7b10001-7b00-47b0-87b0-000000000001'
         and member_row.status = 'revoked'
         and member_row.role = 'staff'
         and member_row.user_id is not null
     ) then
    raise exception using
      errcode = '55000',
      message = 'Workflow message projection test refused: reviewed isolated messaging/workload lineage is missing';
  end if;

  if pg_catalog.has_table_privilege(
       'authenticated',
       'public.workflow_messages',
       'SELECT'
     ) then
    raise exception 'Authenticated direct workflow_messages SELECT leaked';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_proc as function_row
    join pg_catalog.pg_namespace as namespace_row
      on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'passage_private'
      and function_row.proname = 'reject_workflow_message_mutation'
      and function_row.pronargs = 0
  ) <> 1 then
    raise exception 'Expected exactly one zero-argument message mutation trigger function';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_proc as function_row
    join pg_catalog.pg_namespace as namespace_row
      on namespace_row.oid = function_row.pronamespace
    cross join lateral pg_catalog.pg_options_to_table(
      function_row.proconfig
    ) as function_option
    where namespace_row.nspname = 'passage_private'
      and function_row.proname = 'reject_workflow_message_mutation'
      and function_row.pronargs = 0
      and function_option.option_name = 'search_path'
      -- Do not compare function_option.option_value = ''; an empty
      -- search_path is represented as the quoted empty identifier.
      and function_option.option_value = pg_catalog.quote_ident('')
  ) <> 1 then
    raise exception 'Message mutation trigger function search_path is not empty';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_trigger as trigger_row
    join pg_catalog.pg_proc as function_row
      on function_row.oid = trigger_row.tgfoid
    join pg_catalog.pg_namespace as namespace_row
      on namespace_row.oid = function_row.pronamespace
    where trigger_row.tgrelid = 'public.workflow_messages'::regclass
      and trigger_row.tgname = 'workflow_messages_append_only'
      and not trigger_row.tgisinternal
      and trigger_row.tgenabled in ('O', 'A')
      and trigger_row.tgtype = 27
      and namespace_row.nspname = 'passage_private'
      and function_row.proname = 'reject_workflow_message_mutation'
      and function_row.pronargs = 0
  ) <> 1 then
    raise exception 'BEFORE UPDATE OR DELETE message trigger is missing or changed';
  end if;

  if not pg_catalog.has_function_privilege(
       'authenticated',
       'public.list_workflow_messages_client_safe(uuid)',
       'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'anon',
       'public.list_workflow_messages_client_safe(uuid)',
       'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'service_role',
       'public.list_workflow_messages_client_safe(uuid)',
       'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'authenticated',
       'passage_private.can_message_workflow(uuid)',
       'EXECUTE'
     ) then
    raise exception 'Client-safe list RPC or private authority ACL drifted';
  end if;

  if pg_catalog.pg_get_function_result(
       'public.list_workflow_messages_client_safe(uuid)'::regprocedure
     ) ~* 'sender_user_id|sender_organization_member_id|sender_continuity_participant_id|creation_request_id|organization_id' then
    raise exception 'Client-safe list RPC exposes an internal identity column';
  end if;
end
$message_projection_preflight$;

insert into auth.users (
  id,
  email,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '74000011-7400-4400-8400-000000000011',
    'family-owner@message.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Family Owner"}',
    now(),
    now()
  ),
  (
    '74000012-7400-4400-8400-000000000012',
    'participant@message.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Family Participant"}',
    now(),
    now()
  ),
  (
    '74000013-7400-4400-8400-000000000013',
    'revoked-participant@message.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Revoked Participant"}',
    now(),
    now()
  ),
  (
    '74000014-7400-4400-8400-000000000014',
    'other-director@message.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Other Director"}',
    now(),
    now()
  ),
  (
    '74000015-7400-4400-8400-000000000015',
    'non-updates-participant@message.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Non-updates Participant"}',
    now(),
    now()
  ),
  (
    '74000016-7400-4400-8400-000000000016',
    'unassigned-staff@message.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Unassigned Staff"}',
    now(),
    now()
  ),
  (
    '74000017-7400-4400-8400-000000000017',
    'wrong-location-director@message.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Wrong Location Director"}',
    now(),
    now()
  );

insert into public.continuity_spaces (
  id,
  owner_user_id,
  display_name,
  status,
  creation_request_id
) values (
  '74000021-7400-4400-8400-000000000021',
  '74000011-7400-4400-8400-000000000011',
  'Message projection family',
  'active',
  '74000022-7400-4400-8400-000000000022'
);

insert into public.continuity_participants (
  id,
  continuity_space_id,
  user_id,
  invited_email,
  display_name,
  relationship,
  purpose,
  category_scope,
  status,
  accepted_at,
  revoked_at,
  revoked_by_user_id,
  revocation_reason
) values
  (
    '74000023-7400-4400-8400-000000000023',
    '74000021-7400-4400-8400-000000000021',
    '74000012-7400-4400-8400-000000000012',
    'participant@message.test',
    'Family Participant',
    repeat('a', 80),
    'Coordinate this case',
    array['updates']::text[],
    'active',
    now(),
    null,
    null,
    null
  ),
  (
    '74000024-7400-4400-8400-000000000024',
    '74000021-7400-4400-8400-000000000021',
    '74000013-7400-4400-8400-000000000013',
    'revoked-participant@message.test',
    'Revoked Participant',
    'Friend',
    'Coordinate this case',
    array['updates']::text[],
    'revoked',
    now(),
    now(),
    '74000011-7400-4400-8400-000000000011',
    'Access no longer needed'
  ),
  (
    '74000025-7400-4400-8400-000000000025',
    '74000021-7400-4400-8400-000000000021',
    '74000015-7400-4400-8400-000000000015',
    'non-updates-participant@message.test',
    'Non-updates Participant',
    'Friend',
    'Help with documents only',
    array['documents']::text[],
    'active',
    now(),
    null,
    null,
    null
  );

insert into public.organizations (id, name)
values (
  '74000031-7400-4400-8400-000000000031',
  'Other message organization'
);

insert into public.organization_locations (
  id,
  organization_id,
  name,
  status
) values (
  '74000032-7400-4400-8400-000000000032',
  '74000031-7400-4400-8400-000000000031',
  'Other location',
  'active'
);

insert into public.organization_members (
  id,
  organization_id,
  user_id,
  email,
  role,
  status,
  display_name,
  accepted_at
) values (
  '74000033-7400-4400-8400-000000000033',
  '74000031-7400-4400-8400-000000000031',
  '74000014-7400-4400-8400-000000000014',
  'other-director@message.test',
  'director',
  'active',
  'Other Director',
  now()
);

insert into public.organization_member_locations (
  organization_member_id,
  organization_location_id,
  granted_by_user_id
) values (
  '74000033-7400-4400-8400-000000000033',
  '74000032-7400-4400-8400-000000000032',
  '74000014-7400-4400-8400-000000000014'
);

update public.workflows
set continuity_space_id = '74000021-7400-4400-8400-000000000021'
where id = 'c7b10001-7b00-47b0-87b0-000000000001';

insert into public.organization_locations (
  id,
  organization_id,
  name,
  status
)
select
  '74000036-7400-4400-8400-000000000036',
  workflow_row.organization_id,
  'Wrong message location',
  'active'
from public.workflows as workflow_row
where workflow_row.id = 'c7b10001-7b00-47b0-87b0-000000000001';

insert into public.organization_members (
  id,
  organization_id,
  user_id,
  email,
  role,
  status,
  display_name,
  accepted_at
)
select
  '74000034-7400-4400-8400-000000000034'::uuid,
  workflow_row.organization_id,
  '74000016-7400-4400-8400-000000000016'::uuid,
  'unassigned-staff@message.test',
  'staff',
  'active',
  'Unassigned Staff',
  now()
from public.workflows as workflow_row
where workflow_row.id = 'c7b10001-7b00-47b0-87b0-000000000001'
union all
select
  '74000035-7400-4400-8400-000000000035'::uuid,
  workflow_row.organization_id,
  '74000017-7400-4400-8400-000000000017'::uuid,
  'wrong-location-director@message.test',
  'director',
  'active',
  'Wrong Location Director',
  now()
from public.workflows as workflow_row
where workflow_row.id = 'c7b10001-7b00-47b0-87b0-000000000001';

insert into public.organization_member_locations (
  organization_member_id,
  organization_location_id,
  granted_by_user_id
)
select
  '74000034-7400-4400-8400-000000000034'::uuid,
  workflow_row.organization_location_id,
  '74000016-7400-4400-8400-000000000016'::uuid
from public.workflows as workflow_row
where workflow_row.id = 'c7b10001-7b00-47b0-87b0-000000000001'
union all
select
  '74000035-7400-4400-8400-000000000035'::uuid,
  '74000036-7400-4400-8400-000000000036'::uuid,
  '74000017-7400-4400-8400-000000000017'::uuid;

select pg_catalog.set_config(
  'passage.test_message_director_user_id',
  (
    select member_row.user_id::text
    from public.organization_members as member_row
    where member_row.id = 'c7a00003-7a00-47a0-87a0-000000000003'
  ),
  true
);

select pg_catalog.set_config(
  'passage.test_message_staff_user_id',
  (
    select member_row.user_id::text
    from public.tasks as task_row
    join public.organization_members as member_row
      on member_row.id = task_row.assigned_organization_member_id
    where task_row.workflow_id =
        'c7b10001-7b00-47b0-87b0-000000000001'
      and member_row.status = 'active'
      and member_row.role = 'staff'
    order by task_row.id
    limit 1
  ),
  true
);

select pg_catalog.set_config(
  'passage.test_message_organization_id',
  (
    select workflow_row.organization_id::text
    from public.workflows as workflow_row
    where workflow_row.id =
      'c7b10001-7b00-47b0-87b0-000000000001'
  ),
  true
);

select pg_catalog.set_config(
  'passage.test_message_revoked_staff_user_id',
  (
    select member_row.user_id::text
    from public.organization_members as member_row
    join public.workflows as workflow_row
      on workflow_row.organization_id = member_row.organization_id
    where workflow_row.id =
        'c7b10001-7b00-47b0-87b0-000000000001'
      and member_row.status = 'revoked'
      and member_row.role = 'staff'
      and member_row.user_id is not null
    order by member_row.id
    limit 1
  ),
  true
);

set local role authenticated;

do $message_projection_commands$
declare
  v_workflow_id constant uuid :=
    'c7b10001-7b00-47b0-87b0-000000000001';
  v_owner_request constant uuid :=
    '74000101-7400-4400-8400-000000000101';
  v_participant_request constant uuid :=
    '74000102-7400-4400-8400-000000000102';
  v_director_request constant uuid :=
    '74000103-7400-4400-8400-000000000103';
  v_staff_request constant uuid :=
    '74000104-7400-4400-8400-000000000104';
  v_director_user_id uuid :=
    current_setting('passage.test_message_director_user_id')::uuid;
  v_staff_user_id uuid :=
    current_setting('passage.test_message_staff_user_id')::uuid;
  v_organization_id uuid :=
    current_setting('passage.test_message_organization_id')::uuid;
  v_revoked_staff_user_id uuid :=
    current_setting('passage.test_message_revoked_staff_user_id')::uuid;
  v_expected_message_count constant integer := 4;
  v_first record;
  v_replay record;
  v_row record;
begin
  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    '74000011-7400-4400-8400-000000000011',
    true
  );

  begin
    perform * from public.workflow_messages;
    raise exception 'Direct authenticated message-table SELECT unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  select *
  into strict v_first
  from public.post_workflow_message_idempotent(
    v_workflow_id,
    'We are ready to review the next step.',
    v_owner_request
  );
  if v_first.replayed or v_first.message_id is null then
    raise exception 'Family owner first post receipt is incorrect';
  end if;

  select *
  into strict v_replay
  from public.post_workflow_message_idempotent(
    v_workflow_id,
    'We are ready to review the next step.',
    v_owner_request
  );
  if not v_replay.replayed
     or v_replay.message_id <> v_first.message_id
     or v_replay.occurred_at <> v_first.occurred_at then
    raise exception 'Identical family-owner replay was not stable';
  end if;

  begin
    perform *
    from public.post_workflow_message_idempotent(
      v_workflow_id,
      'A conflicting body must not replay.',
      v_owner_request
    );
    raise exception 'Conflicting replay unexpectedly succeeded';
  exception
    when sqlstate '22023' then null;
  end;

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    '74000012-7400-4400-8400-000000000012',
    true
  );
  perform *
  from public.post_workflow_message_idempotent(
    v_workflow_id,
    'I can help with the next step.',
    v_participant_request
  );

  begin
    perform *
    from public.post_workflow_message_idempotent(
      v_workflow_id,
      'We are ready to review the next step.',
      v_owner_request
    );
    raise exception 'Changed-actor replay unexpectedly succeeded';
  exception
    when sqlstate '22023' then null;
  end;

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    v_director_user_id::text,
    true
  );
  perform *
  from public.post_workflow_message_idempotent(
    v_workflow_id,
    'Your care team received the update.',
    v_director_request
  );

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    v_staff_user_id::text,
    true
  );
  perform *
  from public.post_workflow_message_idempotent(
    v_workflow_id,
    'I completed the assigned update.',
    v_staff_request
  );
  if (
    select count(*)
    from public.list_workflow_messages_client_safe(v_workflow_id)
  ) <> v_expected_message_count
     or (
       select count(*)
       from public.list_workflow_messages_client_safe(v_workflow_id)
       where is_own
     ) <> 1 then
    raise exception 'Assigned staff backend message authority is incorrect';
  end if;

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    v_director_user_id::text,
    true
  );
  for v_row in
    select *
    from public.list_workflow_messages_client_safe(v_workflow_id)
  loop
    if v_row.message_id is null
       or v_row.sender_kind not in ('staff', 'family')
       or length(btrim(v_row.sender_label)) not between 1 and 48
       or v_row.body is null
       or v_row.occurred_at is null then
      raise exception 'Client-safe message projection returned an invalid row';
    end if;
  end loop;

  if (
    select count(*)
    from public.list_workflow_messages_client_safe(v_workflow_id)
  ) <> v_expected_message_count
     or (
       select count(*)
       from public.list_workflow_messages_client_safe(v_workflow_id)
       where is_own
     ) <> 1
     or (
       select count(*)
       from public.list_workflow_messages_client_safe(v_workflow_id)
       where sender_label = 'Director'
     ) <> 1 then
    raise exception 'Director cross-direction projection is incorrect';
  end if;

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    '74000011-7400-4400-8400-000000000011',
    true
  );
  if (
    select count(*)
    from public.list_workflow_messages_client_safe(v_workflow_id)
  ) <> v_expected_message_count
     or (
       select count(*)
       from public.list_workflow_messages_client_safe(v_workflow_id)
       where is_own
     ) <> 1 then
    raise exception 'Family-owner cross-direction projection is incorrect';
  end if;

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    '74000012-7400-4400-8400-000000000012',
    true
  );
  if (
    select count(*)
    from public.list_workflow_messages_client_safe(v_workflow_id)
  ) <> v_expected_message_count
     or (
       select count(*)
       from public.list_workflow_messages_client_safe(v_workflow_id)
       where is_own
     ) <> 1
     or (
       select max(length(sender_label))
       from public.list_workflow_messages_client_safe(v_workflow_id)
       where is_own
     ) <> 48 then
    raise exception 'Participant projection or sender-label bound is incorrect';
  end if;

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    '74000014-7400-4400-8400-000000000014',
    true
  );
  begin
    perform *
    from public.list_workflow_messages_client_safe(v_workflow_id);
    raise exception 'Cross-tenant director read unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;
  begin
    perform *
    from public.post_workflow_message_idempotent(
      v_workflow_id,
      'Cross-tenant write must fail.',
      '74000105-7400-4400-8400-000000000105'
    );
    raise exception 'Cross-tenant director post unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    '74000013-7400-4400-8400-000000000013',
    true
  );
  begin
    perform *
    from public.list_workflow_messages_client_safe(v_workflow_id);
    raise exception 'Revoked participant read unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;
  begin
    perform *
    from public.post_workflow_message_idempotent(
      v_workflow_id,
      'Revoked participant write must fail.',
      '74000106-7400-4400-8400-000000000106'
    );
    raise exception 'Revoked participant post unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    '74000015-7400-4400-8400-000000000015',
    true
  );
  begin
    perform *
    from public.list_workflow_messages_client_safe(v_workflow_id);
    raise exception 'Non-updates participant read unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;
  begin
    perform *
    from public.post_workflow_message_idempotent(
      v_workflow_id,
      'Documents-only access must not allow a message.',
      '74000107-7400-4400-8400-000000000107'
    );
    raise exception 'Non-updates participant post unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    '74000016-7400-4400-8400-000000000016',
    true
  );
  begin
    perform *
    from public.list_workflow_messages_client_safe(v_workflow_id);
    raise exception 'Unassigned staff read unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;
  begin
    perform *
    from public.post_workflow_message_idempotent(
      v_workflow_id,
      'Unassigned staff must not add a message.',
      '74000108-7400-4400-8400-000000000108'
    );
    raise exception 'Unassigned staff post unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    '74000017-7400-4400-8400-000000000017',
    true
  );
  begin
    perform *
    from public.list_workflow_messages_client_safe(v_workflow_id);
    raise exception 'Wrong-location director read unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;
  begin
    perform *
    from public.post_workflow_message_idempotent(
      v_workflow_id,
      'A director for another location must not add a message.',
      '74000109-7400-4400-8400-000000000109'
    );
    raise exception 'Wrong-location director post unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    v_revoked_staff_user_id::text,
    true
  );
  begin
    perform *
    from public.list_workflow_messages_client_safe(v_workflow_id);
    raise exception 'Revoked staff read unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;
  begin
    perform *
    from public.post_workflow_message_idempotent(
      v_workflow_id,
      'Revoked staff must not add a message.',
      '74000111-7400-4400-8400-000000000111'
    );
    raise exception 'Revoked staff post unexpectedly succeeded';
  exception
    when sqlstate '42501' then null;
  end;

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    '74000011-7400-4400-8400-000000000011',
    true
  );
  begin
    insert into public.workflow_messages (
      id,
      workflow_id,
      organization_id,
      sender_kind,
      sender_user_id,
      sender_label,
      body,
      creation_request_id
    ) values (
      '74000110-7400-4400-8400-000000000110',
      v_workflow_id,
      v_organization_id,
      'family',
      '74000011-7400-4400-8400-000000000011',
      'Family',
      'Direct insert must fail.',
      '74000110-7400-4400-8400-000000000110'
    );
    raise exception 'Direct authenticated message INSERT unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.workflow_messages
    set body = 'Mutated';
    raise exception 'Direct authenticated message UPDATE unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
  begin
    delete from public.workflow_messages;
    raise exception 'Direct authenticated message DELETE unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  if (
    select count(*)
    from public.list_workflow_messages_client_safe(v_workflow_id)
  ) <> v_expected_message_count then
    raise exception 'Denied or conflicting requests changed message cardinality';
  end if;
end
$message_projection_commands$;

reset role;

do $message_projection_append_only$
begin
  if (
    select count(*)
    from public.workflow_messages
    where workflow_id = 'c7b10001-7b00-47b0-87b0-000000000001'
      and creation_request_id in (
        '74000101-7400-4400-8400-000000000101',
        '74000102-7400-4400-8400-000000000102',
        '74000103-7400-4400-8400-000000000103',
        '74000104-7400-4400-8400-000000000104'
      )
  ) <> 4 then
    raise exception 'Successful message cardinality is not exactly four';
  end if;

  begin
    update public.workflow_messages
    set body = 'Owner mutation must fail'
    where creation_request_id =
      '74000101-7400-4400-8400-000000000101';
    raise exception 'Append-only trigger allowed an owner UPDATE';
  exception
    when raise_exception then
      if sqlerrm <> 'workflow_messages is append-only' then
        raise;
      end if;
  end;

  begin
    delete from public.workflow_messages
    where creation_request_id =
      '74000101-7400-4400-8400-000000000101';
    raise exception 'Append-only trigger allowed an owner DELETE';
  exception
    when raise_exception then
      if sqlerrm <> 'workflow_messages is append-only' then
        raise;
      end if;
  end;
end
$message_projection_append_only$;

rollback;
