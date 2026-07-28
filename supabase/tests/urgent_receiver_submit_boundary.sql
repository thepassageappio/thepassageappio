-- Rollback-only regression for the receiver-bound urgent family submit slice.
-- This deliberately covers submission only. Claiming a request and turning it
-- into a case belong to a separate migration/test packet.
--
-- Run only against the isolated Passage Zero project after applying:
--   20260726215450_urgent_family_thin_slice.sql
--   20260727030000_urgent_receiving_organization_boundary.sql
--
-- Required session guard:
--   set passage.test_project_ref = 'uyacxqtsiwlvtmhxvoxr';

begin;

do $preflight$
begin
  if current_setting('passage.test_project_ref', true) is distinct from 'uyacxqtsiwlvtmhxvoxr'
     or current_setting('passage.test_project_ref', true) = 'qsveqfchwylsbncsfgxe'
     or session_user <> 'postgres'
     or current_user <> 'postgres' then
    raise exception 'Urgent receiver-submit tests require the isolated project and postgres test role'
      using errcode = '42501';
  end if;

  if to_regclass('public.urgent_intake_requests') is null
     or to_regclass('public.urgent_intake_events') is null
     or to_regclass('supabase_migrations.schema_migrations') is null
     or not exists (
       select 1
       from supabase_migrations.schema_migrations
       where name = 'urgent_family_thin_slice'
     )
     or not exists (
       select 1
       from supabase_migrations.schema_migrations
       where name = 'urgent_receiving_organization_boundary'
     )
     or to_regprocedure(
       'public.submit_urgent_intake_idempotent(uuid,text,text,text,text,text,text,text,text,boolean,uuid)'
     ) is null then
    raise exception 'Receiver-bound urgent submission source stack is missing or incomplete';
  end if;
end
$preflight$;

do $catalog_boundary$
declare
  v_function regprocedure;
  v_definition text;
  v_request_policy text;
  v_event_policy text;
  v_receiver_constraint text;
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'urgent_intake_requests'
      and column_name = 'receiving_organization_id'
      and is_nullable = 'NO'
  ) or not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.urgent_intake_requests'::regclass
      and conname in (
        'urgent_intake_requests_claim_matches_receiver',
        'urgent_intake_requests_packet1_receiver'
      )
    group by conrelid
    having count(*) = 2
  ) then
    raise exception 'Receiving-organization column or invariants are incomplete';
  end if;

  if to_regprocedure(
    'public.submit_urgent_intake_idempotent(text,text,text,text,text,text,text,text,boolean,uuid)'
  ) is not null then
    raise exception 'The organization-agnostic urgent submission overload is still executable';
  end if;

  select lower(pg_get_expr(policy_row.polqual, policy_row.polrelid))
  into v_request_policy
  from pg_policy policy_row
  where policy_row.polrelid = 'public.urgent_intake_requests'::regclass
    and policy_row.polname = 'urgent_intake_requests_authorized_select';

  select lower(pg_get_expr(policy_row.polqual, policy_row.polrelid))
  into v_event_policy
  from pg_policy policy_row
  where policy_row.polrelid = 'public.urgent_intake_events'::regclass
    and policy_row.polname = 'urgent_intake_events_authorized_select';

  select lower(pg_get_constraintdef(constraint_row.oid))
  into v_receiver_constraint
  from pg_constraint constraint_row
  where constraint_row.conrelid = 'public.urgent_intake_requests'::regclass
    and constraint_row.conname = 'urgent_intake_requests_packet1_receiver';

  if position('wants_callback' in coalesce(v_request_policy, '')) = 0
     or position('self_handling' in coalesce(v_request_policy, '')) = 0
     or position('is_active_urgent_leader_of_organization' in coalesce(v_request_policy, '')) = 0
     or position('can_view_urgent_intake_request' in coalesce(v_event_policy, '')) = 0
     or position(
       'c7a00001-7a00-47a0-87a0-000000000001'
       in coalesce(v_receiver_constraint, '')
     ) = 0 then
    raise exception 'Receiver callback/private RLS or exact receiver constraint drifted';
  end if;

  select lower(pg_get_functiondef(
    'passage_private.submit_urgent_intake_idempotent(uuid,text,text,text,text,text,text,text,text,boolean,uuid)'::regprocedure
  ))
  into v_definition;

  if position('p_receiving_organization_id is distinct from' in v_definition) = 0
     or position('v_existing.receiving_organization_id is distinct from p_receiving_organization_id' in v_definition) = 0
     or position('v_existing.person_location is distinct from btrim(p_person_location)' in v_definition) = 0
     or position('v_existing.person_timing is distinct from v_timing' in v_definition) = 0
     or position('v_existing.coordinator_phone is distinct from v_phone' in v_definition) = 0
     or position('v_existing.coordinator_email is distinct from v_email' in v_definition) = 0
     or position('v_existing.callback_notes is distinct from v_notes' in v_definition) = 0
     or position('v_existing.wants_callback is distinct from p_wants_callback' in v_definition) = 0
     or position('urgent_intake_create:' in v_definition) = 0 then
    raise exception 'Receiver-bound submit validation, replay comparison, or event proof drifted';
  end if;

  if not exists (
    select 1
    from pg_trigger trigger_row
    where trigger_row.tgrelid = 'public.urgent_intake_events'::regclass
      and trigger_row.tgname = 'urgent_intake_events_append_only'
      and not trigger_row.tgisinternal
  ) then
    raise exception 'Urgent intake append-only trigger is missing';
  end if;

  for v_function in
    select function_oid
    from unnest(array[
      'passage_private.is_active_urgent_leader_of_organization(uuid)'::regprocedure,
      'passage_private.can_view_urgent_intake_request(uuid)'::regprocedure,
      'passage_private.submit_urgent_intake_idempotent(uuid,text,text,text,text,text,text,text,text,boolean,uuid)'::regprocedure,
      'public.submit_urgent_intake_idempotent(uuid,text,text,text,text,text,text,text,text,boolean,uuid)'::regprocedure
    ]) as functions(function_oid)
  loop
    if not has_function_privilege('authenticated', v_function, 'EXECUTE')
       or has_function_privilege('anon', v_function, 'EXECUTE')
       or has_function_privilege('service_role', v_function, 'EXECUTE')
       or not exists (
         select 1
         from pg_proc procedure_row
         where procedure_row.oid = v_function
           and array_to_string(procedure_row.proconfig, ',') like 'search_path=%'
       ) then
      raise exception 'Urgent receiver-submit ACL/search_path posture drifted for %', v_function;
    end if;
  end loop;
end
$catalog_boundary$;

insert into auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    'b2000011-b200-4100-8100-000000000011',
    'family@urgent-receiver-submit.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Family"}',
    now(),
    now()
  ),
  (
    'b2000012-b200-4100-8100-000000000012',
    'director@urgent-receiver-submit.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Northstar Director"}',
    now(),
    now()
  ),
  (
    'b2000013-b200-4100-8100-000000000013',
    'wrong-director@urgent-receiver-submit.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Wrong Director"}',
    now(),
    now()
  ),
  (
    'b2000014-b200-4100-8100-000000000014',
    'outsider@urgent-receiver-submit.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Outsider"}',
    now(),
    now()
  ),
  (
    'b2000015-b200-4100-8100-000000000015',
    'staff@urgent-receiver-submit.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Northstar Staff"}',
    now(),
    now()
  ),
  (
    'b2000016-b200-4100-8100-000000000016',
    'revoked-director@urgent-receiver-submit.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Revoked Northstar Director"}',
    now(),
    now()
  );

insert into public.organizations (id, name)
values ('b2000021-b200-4100-8100-000000000021', 'Wrong Organization');

insert into public.organization_members (
  id, organization_id, user_id, email, role, status, display_name, accepted_at,
  revoked_at, revoked_by_user_id, revocation_reason
) values
  (
    'b2000031-b200-4100-8100-000000000031',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'b2000012-b200-4100-8100-000000000012',
    'director@urgent-receiver-submit.test',
    'director',
    'active',
    'Northstar Director',
    now(),
    null,
    null,
    null
  ),
  (
    'b2000032-b200-4100-8100-000000000032',
    'b2000021-b200-4100-8100-000000000021',
    'b2000013-b200-4100-8100-000000000013',
    'wrong-director@urgent-receiver-submit.test',
    'director',
    'active',
    'Wrong Director',
    now(),
    null,
    null,
    null
  ),
  (
    'b2000033-b200-4100-8100-000000000033',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'b2000015-b200-4100-8100-000000000015',
    'staff@urgent-receiver-submit.test',
    'staff',
    'active',
    'Northstar Staff',
    now(),
    null,
    null,
    null
  ),
  (
    'b2000034-b200-4100-8100-000000000034',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'b2000016-b200-4100-8100-000000000016',
    'revoked-director@urgent-receiver-submit.test',
    'director',
    'revoked',
    'Revoked Northstar Director',
    now(),
    clock_timestamp(),
    'b2000012-b200-4100-8100-000000000012',
    'Rollback-only receiver authority regression'
  );

set local role anon;

do $anon_submit_denial$
begin
  begin
    perform public.submit_urgent_intake_idempotent(
      'c7a00001-7a00-47a0-87a0-000000000001',
      'hospice',
      'Signed Out Example',
      'Portland, Oregon',
      null,
      'Alex Example',
      '555-0100',
      null,
      null,
      true,
      'b2000104-b200-4100-8100-000000000104'
    );
    raise exception 'Signed-out anon submit denial failed';
  exception
    when insufficient_privilege then null;
  end;
end
$anon_submit_denial$;

reset role;

do $anon_denial_cardinality$
begin
  if exists (
    select 1
    from public.urgent_intake_requests
    where creation_request_id = 'b2000104-b200-4100-8100-000000000104'
  ) then
    raise exception 'Signed-out anon denial created partial request state';
  end if;
end
$anon_denial_cardinality$;

set local role authenticated;

do $receiver_submit_matrix$
declare
  v_northstar constant uuid := 'c7a00001-7a00-47a0-87a0-000000000001';
  v_wrong_organization constant uuid := 'b2000021-b200-4100-8100-000000000021';
  v_family constant uuid := 'b2000011-b200-4100-8100-000000000011';
  v_northstar_director constant uuid := 'b2000012-b200-4100-8100-000000000012';
  v_wrong_director constant uuid := 'b2000013-b200-4100-8100-000000000013';
  v_outsider constant uuid := 'b2000014-b200-4100-8100-000000000014';
  v_northstar_staff constant uuid := 'b2000015-b200-4100-8100-000000000015';
  v_revoked_director constant uuid := 'b2000016-b200-4100-8100-000000000016';
  v_callback_key constant uuid := 'b2000101-b200-4100-8100-000000000101';
  v_private_key constant uuid := 'b2000102-b200-4100-8100-000000000102';
  v_wrong_receiver_key constant uuid := 'b2000103-b200-4100-8100-000000000103';
  v_staff_claim_key constant uuid := 'b2000105-b200-4100-8100-000000000105';
  v_revoked_claim_key constant uuid := 'b2000106-b200-4100-8100-000000000106';
  v_private_claim_key constant uuid := 'b2000107-b200-4100-8100-000000000107';
  v_wrong_director_claim_key constant uuid := 'b2000108-b200-4100-8100-000000000108';
  v_callback_request_id uuid;
  v_private_request_id uuid;
  v_receipt record;
begin
  perform set_config('request.jwt.claim.sub', v_family::text, true);

  begin
    perform public.submit_urgent_intake_idempotent(
      v_wrong_organization,
      'hospice',
      'Wrong Receiver',
      'Portland, Oregon',
      null,
      'Alex Example',
      '555-0100',
      'family@urgent-receiver-submit.test',
      null,
      true,
      v_wrong_receiver_key
    );
    raise exception 'Expected non-allowlisted receiver denial';
  exception
    when sqlstate '22023' then null;
  end;

  if exists (
    select 1
    from public.urgent_intake_requests
    where requester_user_id = v_family
      and creation_request_id = v_wrong_receiver_key
  ) then
    raise exception 'Wrong receiver denial created partial request state';
  end if;

  select *
  into strict v_receipt
  from public.submit_urgent_intake_idempotent(
    v_northstar,
    'hospice',
    'Morgan Example',
    'Portland, Oregon',
    null,
    'Alex Example',
    '555-0100',
    'family@urgent-receiver-submit.test',
    null,
    true,
    v_callback_key
  );
  v_callback_request_id := v_receipt.urgent_intake_request_id;

  if v_receipt.replayed
     or v_receipt.status <> 'submitted'
     or v_receipt.version <> 1
     or not exists (
       select 1
       from public.urgent_intake_requests
       where id = v_callback_request_id
         and requester_user_id = v_family
         and receiving_organization_id = v_northstar
         and wants_callback
         and status = 'submitted'
         and version = 1
         and claimed_organization_id is null
     )
     or (
       select count(*)
       from public.urgent_intake_events
       where urgent_intake_request_id = v_callback_request_id
         and name = 'urgent_intake.submitted'
         and idempotency_key = 'urgent_intake_create:' || v_callback_key::text
         and metadata ->> 'receiving_organization_id' = v_northstar::text
         and metadata ->> 'wants_callback' = 'true'
     ) <> 1 then
    raise exception 'Callback submission lost exact receiver, receipt, or event cardinality';
  end if;

  select *
  into strict v_receipt
  from public.submit_urgent_intake_idempotent(
    v_northstar,
    'hospice',
    'Morgan Example',
    'Portland, Oregon',
    null,
    'Alex Example',
    '555-0100',
    'family@urgent-receiver-submit.test',
    null,
    true,
    v_callback_key
  );

  if not v_receipt.replayed
     or v_receipt.urgent_intake_request_id <> v_callback_request_id
     or (
       select count(*)
       from public.urgent_intake_events
       where urgent_intake_request_id = v_callback_request_id
     ) <> 1 then
    raise exception 'Exact callback replay was not idempotent';
  end if;

  begin
    perform public.submit_urgent_intake_idempotent(
      v_northstar,
      'hospice',
      'Morgan Example',
      'Portland, Oregon',
      null,
      'Alex Example',
      '555-0100',
      'family@urgent-receiver-submit.test',
      'changed payload',
      true,
      v_callback_key
    );
    raise exception 'Expected changed callback replay conflict';
  exception
    when sqlstate '22023' then null;
  end;

  if not exists (
    select 1
    from public.urgent_intake_requests
    where id = v_callback_request_id
      and version = 1
      and callback_notes is null
  ) or (
    select count(*)
    from public.urgent_intake_events
    where urgent_intake_request_id = v_callback_request_id
  ) <> 1 then
    raise exception 'Callback conflict changed request or event cardinality';
  end if;

  select *
  into strict v_receipt
  from public.submit_urgent_intake_idempotent(
    v_northstar,
    'already_handled',
    'Private Example',
    'Portland, Oregon',
    null,
    'Alex Example',
    '555-0100',
    'family@urgent-receiver-submit.test',
    'Keep private',
    false,
    v_private_key
  );
  v_private_request_id := v_receipt.urgent_intake_request_id;

  if v_receipt.replayed
     or v_receipt.status <> 'self_handling'
     or v_receipt.version <> 1
     or not exists (
       select 1
       from public.urgent_intake_requests
       where id = v_private_request_id
         and requester_user_id = v_family
         and receiving_organization_id = v_northstar
         and not wants_callback
         and status = 'self_handling'
         and version = 1
         and claimed_organization_id is null
     )
     or (
       select count(*)
       from public.urgent_intake_events
       where urgent_intake_request_id = v_private_request_id
         and name = 'urgent_intake.submitted'
         and idempotency_key = 'urgent_intake_create:' || v_private_key::text
         and metadata ->> 'receiving_organization_id' = v_northstar::text
         and metadata ->> 'wants_callback' = 'false'
     ) <> 1 then
    raise exception 'Private submission lost exact receiver, state, or event cardinality';
  end if;

  select *
  into strict v_receipt
  from public.submit_urgent_intake_idempotent(
    v_northstar,
    'already_handled',
    'Private Example',
    'Portland, Oregon',
    null,
    'Alex Example',
    '555-0100',
    'family@urgent-receiver-submit.test',
    'Keep private',
    false,
    v_private_key
  );

  if not v_receipt.replayed
     or v_receipt.urgent_intake_request_id <> v_private_request_id
     or (
       select count(*)
       from public.urgent_intake_events
       where urgent_intake_request_id = v_private_request_id
     ) <> 1 then
    raise exception 'Exact private replay was not idempotent';
  end if;

  if (
    select count(*)
    from public.urgent_intake_requests
    where id in (v_callback_request_id, v_private_request_id)
  ) <> 2 or (
    select count(*)
    from public.urgent_intake_events
    where urgent_intake_request_id in (v_callback_request_id, v_private_request_id)
  ) <> 2 then
    raise exception 'Requester does not see exact two-request/two-event cardinality';
  end if;

  begin
    update public.urgent_intake_events
    set next_state = 'tampered'
    where urgent_intake_request_id = v_callback_request_id;
    raise exception 'Expected append-only event update denial';
  exception
    when insufficient_privilege then null;
  end;

  begin
    delete from public.urgent_intake_events
    where urgent_intake_request_id = v_callback_request_id;
    raise exception 'Expected append-only event delete denial';
  exception
    when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', v_northstar_director::text, true);
  if (
    select count(*)
    from public.urgent_intake_requests
    where id = v_callback_request_id
  ) <> 1 or (
    select count(*)
    from public.urgent_intake_events
    where urgent_intake_request_id = v_callback_request_id
  ) <> 1 or (
    select count(*)
    from public.urgent_intake_requests
    where id = v_private_request_id
  ) <> 0 or (
    select count(*)
    from public.urgent_intake_events
    where urgent_intake_request_id = v_private_request_id
  ) <> 0 then
    raise exception 'Exact receiving director callback/private RLS boundary failed';
  end if;
  begin
    perform public.claim_urgent_intake_idempotent(
      v_private_request_id,
      1,
      v_private_claim_key
    );
    raise exception 'Exact receiver director private-request command denial failed';
  exception
    when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', v_wrong_director::text, true);
  if (
    select count(*)
    from public.urgent_intake_requests
    where id in (v_callback_request_id, v_private_request_id)
  ) <> 0 or (
    select count(*)
    from public.urgent_intake_events
    where urgent_intake_request_id in (v_callback_request_id, v_private_request_id)
  ) <> 0 then
    raise exception 'Wrong-organization director can see receiver-bound rows';
  end if;
  begin
    perform public.claim_urgent_intake_idempotent(
      v_callback_request_id,
      1,
      v_wrong_director_claim_key
    );
    raise exception 'Wrong-organization active director claim command denial failed';
  exception
    when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', v_northstar_staff::text, true);
  if passage_private.is_active_urgent_leader_of_organization(v_northstar)
     or (
       select count(*)
       from public.urgent_intake_requests
       where id in (v_callback_request_id, v_private_request_id)
     ) <> 0
     or (
       select count(*)
       from public.urgent_intake_events
       where urgent_intake_request_id in (v_callback_request_id, v_private_request_id)
     ) <> 0 then
    raise exception 'Same-organization active staff helper or RLS denial failed';
  end if;
  begin
    perform public.claim_urgent_intake_idempotent(
      v_callback_request_id,
      1,
      v_staff_claim_key
    );
    raise exception 'Same-organization active staff command denial failed';
  exception
    when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', v_revoked_director::text, true);
  if passage_private.is_active_urgent_leader_of_organization(v_northstar)
     or (
       select count(*)
       from public.urgent_intake_requests
       where id in (v_callback_request_id, v_private_request_id)
     ) <> 0
     or (
       select count(*)
       from public.urgent_intake_events
       where urgent_intake_request_id in (v_callback_request_id, v_private_request_id)
     ) <> 0 then
    raise exception 'Revoked Northstar leader helper or RLS denial failed';
  end if;
  begin
    perform public.claim_urgent_intake_idempotent(
      v_callback_request_id,
      1,
      v_revoked_claim_key
    );
    raise exception 'Revoked Northstar leader command denial failed';
  exception
    when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', v_family::text, true);
  if not exists (
    select 1
    from public.urgent_intake_requests
    where id = v_callback_request_id
      and status = 'submitted'
      and version = 1
      and claimed_organization_id is null
  ) or (
    select count(*)
    from public.urgent_intake_events
    where urgent_intake_request_id = v_callback_request_id
  ) <> 1 or not exists (
    select 1
    from public.urgent_intake_requests
    where id = v_private_request_id
      and status = 'self_handling'
      and version = 1
      and claimed_organization_id is null
  ) or (
    select count(*)
    from public.urgent_intake_events
    where urgent_intake_request_id = v_private_request_id
  ) <> 1 then
    raise exception 'Receiver command denials changed request status, version, or event cardinality';
  end if;

  perform set_config('request.jwt.claim.sub', v_outsider::text, true);
  if (
    select count(*)
    from public.urgent_intake_requests
    where id in (v_callback_request_id, v_private_request_id)
  ) <> 0 or (
    select count(*)
    from public.urgent_intake_events
    where urgent_intake_request_id in (v_callback_request_id, v_private_request_id)
  ) <> 0 then
    raise exception 'Unrelated user can see receiver-bound rows';
  end if;

  perform set_config('passage.test_callback_request_id', v_callback_request_id::text, true);
  perform set_config('passage.test_private_request_id', v_private_request_id::text, true);
end
$receiver_submit_matrix$;

reset role;

do $postgres_final_cardinality$
declare
  v_callback_request_id uuid :=
    current_setting('passage.test_callback_request_id')::uuid;
  v_private_request_id uuid :=
    current_setting('passage.test_private_request_id')::uuid;
begin
  if (
    select count(*)
    from public.urgent_intake_requests
    where id in (v_callback_request_id, v_private_request_id)
  ) <> 2 or (
    select count(*)
    from public.urgent_intake_events
    where urgent_intake_request_id in (v_callback_request_id, v_private_request_id)
  ) <> 2 or (
    select count(*)
    from public.urgent_intake_events
    where urgent_intake_request_id = v_callback_request_id
  ) <> 1 or (
    select count(*)
    from public.urgent_intake_events
    where urgent_intake_request_id = v_private_request_id
  ) <> 1 then
    raise exception 'Final receiver-submit request/event cardinality changed';
  end if;
end
$postgres_final_cardinality$;

rollback;
