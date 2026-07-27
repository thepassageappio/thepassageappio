-- Rollback-only vendor category compatibility regression.
-- Caller must attest the exact isolated project before execution:
--   set passage.test_project_ref = 'uyacxqtsiwlvtmhxvoxr';
begin;

do $preflight$
begin
  if current_setting('passage.test_project_ref', true) is distinct from 'uyacxqtsiwlvtmhxvoxr'
     or current_setting('passage.test_project_ref', true) = 'qsveqfchwylsbncsfgxe'
     or session_user <> 'postgres'
     or current_user <> 'postgres' then
    raise exception 'Vendor category test requires the exact isolated project and postgres role'
      using errcode = '42501';
  end if;
  if to_regclass('public.partner_requests') is null
     or to_regprocedure('passage_private.enforce_partner_request_category()') is null
     or exists (
       select 1
       from pg_catalog.pg_proc as proc
       where proc.oid =
         'passage_private.enforce_partner_request_category()'::regprocedure
         and (
           proc.prosecdef
           or array_to_string(proc.proconfig, ',') not like '%search_path=%'
         )
     )
     or has_function_privilege(
       'authenticated',
       'passage_private.enforce_partner_request_category()',
       'EXECUTE'
     )
     or not exists (
       select 1 from pg_trigger
       where tgrelid = 'public.partner_requests'::regclass
         and tgname = 'partner_requests_category_guard'
         and not tgisinternal
     ) then
    raise exception 'Vendor category guard is incomplete' using errcode = '55000';
  end if;
  if not exists (
       select 1
       from public.partner_organizations
       where id = 'c9a00001-9a00-49a0-89a0-000000000001'
         and category = 'florist'
         and status = 'active'
     )
     or not exists (
       select 1
       from public.organization_members
       where id = 'c7a00003-7a00-47a0-87a0-000000000003'
         and role in ('owner', 'director')
         and status = 'active'
     ) then
    raise exception 'Vendor category fixture baseline drifted'
      using errcode = '42501';
  end if;
end
$preflight$;

-- A second suspended vendor exists only inside this rollback transaction. An
-- existing-key vendor change must conflict before mutable vendor validation,
-- while a genuinely new request to it must return PS001 without partial rows.
insert into public.partner_organizations (
  id, name, category, status
) values (
  'c9b00001-9b00-49b0-89b0-000000000001',
  'Rollback-only remembrance transport',
  'transport',
  'suspended'
);

select set_config(
  'request.jwt.claim.sub',
  (
    select user_id::text
    from public.organization_members
    where id = 'c7a00003-7a00-47a0-87a0-000000000003'
  ),
  true
);
set local role authenticated;

do $new_request_matrix$
declare
  v_denied boolean := false;
  v_first record;
begin
  -- A fresh key must use the selected active vendor's current specialty and
  -- must leave no request or event when that service does not match.
  begin
    perform *
    from public.create_partner_request_idempotent(
      'c7b10002-7b00-47b0-87b0-000000000002',
      'c9a00001-9a00-49a0-89a0-000000000001',
      'transport',
      'Arrange transportation',
      'A deliberately incompatible request for the florist fixture.',
      null,
      'c9c00001-9c00-49c0-89c0-000000000001'
    );
  exception when sqlstate '23514' then
    v_denied := true;
  end;
  if not v_denied then
    raise exception 'RPC accepted a category outside the selected vendor specialty';
  end if;

  if exists (
    select 1 from public.partner_requests
    where creation_request_id = 'c9c00001-9c00-49c0-89c0-000000000001'
  ) or exists (
    select 1 from public.partner_request_events
    where idempotency_key = 'partner_request_create:c9c00001-9c00-49c0-89c0-000000000001'
  ) then
    raise exception 'Denied category mismatch left a partial write';
  end if;

  select * into v_first
  from public.create_partner_request_idempotent(
    'c7b10002-7b00-47b0-87b0-000000000002',
    'c9a00001-9a00-49a0-89a0-000000000001',
    'florist',
    'Prepare a remembrance arrangement',
    'Use the family-approved color palette.',
    '2030-01-10 18:00:00+00'::timestamptz,
    'c9c00002-9c00-49c0-89c0-000000000002'
  );

  if v_first.partner_request_id is null
     or v_first.replayed
     or (select count(*) from public.partner_requests
         where creation_request_id = 'c9c00002-9c00-49c0-89c0-000000000002') <> 1
     or (select count(*) from public.partner_request_events
         where idempotency_key = 'partner_request_create:c9c00002-9c00-49c0-89c0-000000000002') <> 1 then
    raise exception 'Matching new vendor request cardinality failed';
  end if;
end
$new_request_matrix$;

reset role;

-- Mutate only the current vendor-directory specialty. The sent request keeps
-- its original immutable category and an exact same-key replay must remain
-- stable because replay resolves before current vendor validation.
update public.partner_organizations
set category = 'catering'
where id = 'c9a00001-9a00-49a0-89a0-000000000001';

set local role authenticated;
do $specialty_change_replay_and_conflict_matrix$
declare
  v_case record;
  v_conflict boolean;
  v_existing_digest text;
  v_existing_event_digest text;
  v_replay record;
begin
  select md5(row_to_json(request_row)::text)
    into strict v_existing_digest
  from public.partner_requests as request_row
  where creation_request_id =
    'c9c00002-9c00-49c0-89c0-000000000002';

  select md5(row_to_json(event_row)::text)
    into strict v_existing_event_digest
  from public.partner_request_events as event_row
  where idempotency_key =
    'partner_request_create:c9c00002-9c00-49c0-89c0-000000000002';

  select * into strict v_replay
  from public.create_partner_request_idempotent(
    'c7b10002-7b00-47b0-87b0-000000000002',
    'c9a00001-9a00-49a0-89a0-000000000001',
    'florist',
    'Prepare a remembrance arrangement',
    'Use the family-approved color palette.',
    '2030-01-10 18:00:00+00'::timestamptz,
    'c9c00002-9c00-49c0-89c0-000000000002'
  );

  if not v_replay.replayed
     or (select count(*) from public.partner_requests
         where creation_request_id =
           'c9c00002-9c00-49c0-89c0-000000000002') <> 1
     or (select count(*) from public.partner_request_events
         where idempotency_key =
           'partner_request_create:c9c00002-9c00-49c0-89c0-000000000002') <> 1 then
    raise exception 'Specialty-changed exact replay was not cardinality-stable';
  end if;

  for v_case in
    select *
    from (
      values
        (
          'workflow',
          'c7b10001-7b00-47b0-87b0-000000000001'::uuid,
          'c9a00001-9a00-49a0-89a0-000000000001'::uuid,
          'florist'::text,
          'Prepare a remembrance arrangement'::text,
          'Use the family-approved color palette.'::text,
          '2030-01-10 18:00:00+00'::timestamptz
        ),
        (
          'vendor',
          'c7b10002-7b00-47b0-87b0-000000000002'::uuid,
          'c9b00001-9b00-49b0-89b0-000000000001'::uuid,
          'florist'::text,
          'Prepare a remembrance arrangement'::text,
          'Use the family-approved color palette.'::text,
          '2030-01-10 18:00:00+00'::timestamptz
        ),
        (
          'category',
          'c7b10002-7b00-47b0-87b0-000000000002'::uuid,
          'c9a00001-9a00-49a0-89a0-000000000001'::uuid,
          'catering'::text,
          'Prepare a remembrance arrangement'::text,
          'Use the family-approved color palette.'::text,
          '2030-01-10 18:00:00+00'::timestamptz
        ),
        (
          'title',
          'c7b10002-7b00-47b0-87b0-000000000002'::uuid,
          'c9a00001-9a00-49a0-89a0-000000000001'::uuid,
          'florist'::text,
          'Changed remembrance title'::text,
          'Use the family-approved color palette.'::text,
          '2030-01-10 18:00:00+00'::timestamptz
        ),
        (
          'details',
          'c7b10002-7b00-47b0-87b0-000000000002'::uuid,
          'c9a00001-9a00-49a0-89a0-000000000001'::uuid,
          'florist'::text,
          'Prepare a remembrance arrangement'::text,
          'Changed request details.'::text,
          '2030-01-10 18:00:00+00'::timestamptz
        ),
        (
          'needed_by',
          'c7b10002-7b00-47b0-87b0-000000000002'::uuid,
          'c9a00001-9a00-49a0-89a0-000000000001'::uuid,
          'florist'::text,
          'Prepare a remembrance arrangement'::text,
          'Use the family-approved color palette.'::text,
          '2030-01-11 18:00:00+00'::timestamptz
        )
    ) as conflict_case(
      field_name,
      workflow_id,
      partner_organization_id,
      category,
      title,
      details,
      needed_by
    )
  loop
    v_conflict := false;
    begin
      perform *
      from public.create_partner_request_idempotent(
        v_case.workflow_id,
        v_case.partner_organization_id,
        v_case.category,
        v_case.title,
        v_case.details,
        v_case.needed_by,
        'c9c00002-9c00-49c0-89c0-000000000002'
      );
    exception when sqlstate '22023' then
      v_conflict := true;
    end;
    if not v_conflict then
      raise exception 'Changed % replay did not return 22023',
        v_case.field_name;
    end if;
  end loop;

  if (select md5(row_to_json(request_row)::text)
      from public.partner_requests as request_row
      where creation_request_id =
        'c9c00002-9c00-49c0-89c0-000000000002')
       is distinct from v_existing_digest
     or (select md5(row_to_json(event_row)::text)
         from public.partner_request_events as event_row
         where idempotency_key =
           'partner_request_create:c9c00002-9c00-49c0-89c0-000000000002')
       is distinct from v_existing_event_digest then
    raise exception 'Conflicting replay changed the retained request or event';
  end if;
end
$specialty_change_replay_and_conflict_matrix$;

reset role;

-- Exact replay must continue to use the immutable saved category even when
-- the selected vendor is no longer available for genuinely new work.
update public.partner_organizations
set status = 'suspended'
where id = 'c9a00001-9a00-49a0-89a0-000000000001';

set local role authenticated;
do $suspended_vendor_replay_matrix$
declare
  v_replay record;
begin
  select * into strict v_replay
  from public.create_partner_request_idempotent(
    'c7b10002-7b00-47b0-87b0-000000000002',
    'c9a00001-9a00-49a0-89a0-000000000001',
    'florist',
    'Prepare a remembrance arrangement',
    'Use the family-approved color palette.',
    '2030-01-10 18:00:00+00'::timestamptz,
    'c9c00002-9c00-49c0-89c0-000000000002'
  );

  if not v_replay.replayed
     or (select count(*) from public.partner_requests
         where creation_request_id =
           'c9c00002-9c00-49c0-89c0-000000000002') <> 1
     or (select count(*) from public.partner_request_events
         where idempotency_key =
           'partner_request_create:c9c00002-9c00-49c0-89c0-000000000002') <> 1 then
    raise exception 'Suspended vendor exact replay was not cardinality-stable';
  end if;
end
$suspended_vendor_replay_matrix$;

reset role;
update public.partner_organizations
set status = 'active'
where id = 'c9a00001-9a00-49a0-89a0-000000000001';
set local role authenticated;

do $current_specialty_new_request_matrix$
declare
  v_denied boolean := false;
  v_matching record;
  v_unavailable boolean := false;
begin
  begin
    perform *
    from public.create_partner_request_idempotent(
      'c7b10002-7b00-47b0-87b0-000000000002',
      'c9b00001-9b00-49b0-89b0-000000000001',
      'transport',
      'Fresh suspended-vendor request',
      'This request must fail before any request or event is written.',
      null,
      'c9c00006-9c00-49c0-89c0-000000000006'
    );
  exception when sqlstate 'PS001' then
    v_unavailable := true;
  end;
  if not v_unavailable
     or exists (
       select 1 from public.partner_requests
       where creation_request_id =
         'c9c00006-9c00-49c0-89c0-000000000006'
     )
     or exists (
       select 1 from public.partner_request_events
       where idempotency_key =
         'partner_request_create:c9c00006-9c00-49c0-89c0-000000000006'
     ) then
    raise exception 'Suspended fresh vendor was not rejected atomically';
  end if;

  begin
    perform *
    from public.create_partner_request_idempotent(
      'c7b10002-7b00-47b0-87b0-000000000002',
      'c9a00001-9a00-49a0-89a0-000000000001',
      'florist',
      'Fresh stale-specialty request',
      'This new request must use the vendor current specialty.',
      null,
      'c9c00003-9c00-49c0-89c0-000000000003'
    );
  exception when sqlstate '23514' then
    v_denied := true;
  end;
  if not v_denied
     or exists (
       select 1 from public.partner_requests
       where creation_request_id =
         'c9c00003-9c00-49c0-89c0-000000000003'
     )
     or exists (
       select 1 from public.partner_request_events
       where idempotency_key =
         'partner_request_create:c9c00003-9c00-49c0-89c0-000000000003'
     ) then
    raise exception 'Fresh specialty mismatch was not atomic';
  end if;

  select * into strict v_matching
  from public.create_partner_request_idempotent(
    'c7b10002-7b00-47b0-87b0-000000000002',
    'c9a00001-9a00-49a0-89a0-000000000001',
    'catering',
    'Arrange family refreshments',
    'Use the family-approved menu.',
    null,
    'c9c00004-9c00-49c0-89c0-000000000004'
  );
  if v_matching.replayed
     or (select count(*) from public.partner_requests
         where creation_request_id =
           'c9c00004-9c00-49c0-89c0-000000000004') <> 1
     or (select count(*) from public.partner_request_events
         where idempotency_key =
           'partner_request_create:c9c00004-9c00-49c0-89c0-000000000004') <> 1 then
    raise exception 'Matching current-specialty request cardinality failed';
  end if;
end
$current_specialty_new_request_matrix$;

-- Direct client event insertion remains denied by ACL/RLS. Command-created
-- event rows are mutated only in the postgres trigger checks below.
do $direct_client_event_insert_denial$
begin
  begin
    insert into public.partner_request_events (
      partner_request_id,
      organization_id,
      partner_organization_id,
      actor_user_id,
      actor_organization_member_id,
      name,
      previous_state,
      next_state,
      idempotency_key,
      metadata
    )
    select
      request.id,
      request.organization_id,
      request.partner_organization_id,
      null,
      request.created_by_organization_member_id,
      'partner_request.sent',
      null,
      'sent',
      'partner_request_create:c9c00005-9c00-49c0-89c0-000000000005',
      '{}'::jsonb
    from public.partner_requests as request
    where request.creation_request_id =
      'c9c00004-9c00-49c0-89c0-000000000004';
    raise exception 'Expected direct authenticated event insert denial';
  exception when sqlstate '42501' then
    null;
  end;
end
$direct_client_event_insert_denial$;

reset role;

do $direct_write_and_append_only_matrix$
declare
  v_event_digest text;
begin
  begin
    insert into public.partner_requests (
      organization_id, organization_location_id, workflow_id,
      partner_organization_id, created_by_organization_member_id,
      category, title, details, status, version, creation_request_id
    ) values (
      'c7a00001-7a00-47a0-87a0-000000000001',
      'c7a00002-7a00-47a0-87a0-000000000002',
      'c7b10002-7b00-47b0-87b0-000000000002',
      'c9a00001-9a00-49a0-89a0-000000000001',
      'c7a00003-7a00-47a0-87a0-000000000003',
      'florist',
      'Direct incompatible write',
      'Must be denied by the database trigger.',
      'sent',
      1,
      'c9c00003-9c00-49c0-89c0-000000000003'
    );
    raise exception 'Expected direct insert category denial';
  exception when sqlstate '23514' then
    null;
  end;

  begin
    update public.partner_requests
    set category = 'transport'
    where creation_request_id =
      'c9c00004-9c00-49c0-89c0-000000000004';
    raise exception 'Expected direct update category denial';
  exception when sqlstate '23514' then
    null;
  end;

  select md5(row_to_json(event_row)::text)
    into strict v_event_digest
  from public.partner_request_events as event_row
  where idempotency_key =
    'partner_request_create:c9c00004-9c00-49c0-89c0-000000000004';

  begin
    update public.partner_request_events
    set metadata = metadata || '{"tampered":true}'::jsonb
    where idempotency_key =
      'partner_request_create:c9c00004-9c00-49c0-89c0-000000000004';
    raise exception 'Expected append-only event update denial'
      using errcode = 'P0002';
  exception when sqlstate 'P0001' then
    null;
  end;

  begin
    delete from public.partner_request_events
    where idempotency_key =
      'partner_request_create:c9c00004-9c00-49c0-89c0-000000000004';
    raise exception 'Expected append-only event delete denial'
      using errcode = 'P0002';
  exception when sqlstate 'P0001' then
    null;
  end;

  if (select md5(row_to_json(event_row)::text)
      from public.partner_request_events as event_row
      where idempotency_key =
        'partner_request_create:c9c00004-9c00-49c0-89c0-000000000004')
       is distinct from v_event_digest then
    raise exception 'Append-only denials changed the retained vendor event';
  end if;

  if (select count(*) from public.partner_requests
      where creation_request_id in (
        'c9c00002-9c00-49c0-89c0-000000000002',
        'c9c00004-9c00-49c0-89c0-000000000004'
      )) <> 2
     or (select count(*) from public.partner_request_events
         where idempotency_key in (
           'partner_request_create:c9c00002-9c00-49c0-89c0-000000000002',
           'partner_request_create:c9c00004-9c00-49c0-89c0-000000000004'
         )) <> 2 then
    raise exception 'Vendor compatibility final cardinality changed';
  end if;

  raise notice 'Vendor specialty create/replay/RLS/append-only matrix passed';
end
$direct_write_and_append_only_matrix$;

rollback;
