-- Disposable local-lab behavioral check. The transaction is always rolled
-- back so the controlled invitation and accepted membership do not persist.
begin;

do $test$
declare
  v_invitation_id uuid;
  v_raw_token text;
  v_first record;
  v_replay record;
  v_count integer;
begin
  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    '1ff4fc4f-2914-4189-8a87-c16d3ed53c95',
    true
  );

  select created.invitation_id, created.raw_token
    into v_invitation_id, v_raw_token
  from public.create_employee_invitation_idempotent_v2(
    '11111111-1111-4111-8111-111111111111'::uuid,
    'qa-staff@passage.test',
    array['22222222-2222-4222-8222-222222222222'::uuid],
    'Cycle 7A local acceptance and replay verification',
    pg_catalog.clock_timestamp() + interval '1 day',
    '55555555-5555-4555-8555-555555555555'::uuid
  ) as created;

  insert into auth.users (
    id,
    email,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    '44444444-4444-4444-8444-444444444444'::uuid,
    'qa-staff@passage.test',
    pg_catalog.clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"QA Staff"}'::jsonb,
    pg_catalog.clock_timestamp(),
    pg_catalog.clock_timestamp()
  );

  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    '44444444-4444-4444-8444-444444444444',
    true
  );

  select accepted.* into v_first
  from public.accept_organization_invitation(v_raw_token) as accepted;

  if v_first.replayed
     or v_first.member_role <> 'staff'
     or v_first.landing_path <> '/staff'
     or v_first.organization_location_ids <> array['22222222-2222-4222-8222-222222222222'::uuid] then
    raise exception 'First acceptance returned an unexpected receipt';
  end if;

  select replayed.* into v_replay
  from public.accept_organization_invitation(v_raw_token) as replayed;

  if not v_replay.replayed
     or v_replay.organization_member_id <> v_first.organization_member_id
     or v_replay.organization_id <> v_first.organization_id
     or v_replay.accepted_at <> v_first.accepted_at then
    raise exception 'Same-user replay did not return the stable acceptance receipt';
  end if;

  select count(*)::integer into v_count
  from public.organization_members as m
  where m.organization_id = v_first.organization_id
    and m.user_id = '44444444-4444-4444-8444-444444444444'::uuid
    and m.status = 'active';
  if v_count <> 1 then raise exception 'Expected exactly one active accepted membership, found %', v_count; end if;

  select count(*)::integer into v_count
  from public.organization_member_locations as ml
  where ml.organization_member_id = v_first.organization_member_id
    and ml.organization_location_id = '22222222-2222-4222-8222-222222222222'::uuid
    and ml.revoked_at is null;
  if v_count <> 1 then raise exception 'Expected exactly one active invited location grant, found %', v_count; end if;

  select count(*)::integer into v_count
  from public.organization_invitations as i
  where i.id = v_invitation_id
    and i.accepted_by_user_id = '44444444-4444-4444-8444-444444444444'::uuid
    and i.accepted_organization_member_id = v_first.organization_member_id
    and i.accepted_at = v_first.accepted_at;
  if v_count <> 1 then raise exception 'Invitation acceptance fields do not match the receipt'; end if;

  select count(*)::integer into v_count
  from public.workflow_events as e
  where e.invitation_id = v_invitation_id
    and e.name = 'organization_invitation.accepted';
  if v_count <> 1 then raise exception 'Expected exactly one acceptance event, found %', v_count; end if;

  raise notice 'Cycle 7A local acceptance/replay check passed for invitation %', v_invitation_id;
end
$test$;

rollback;
