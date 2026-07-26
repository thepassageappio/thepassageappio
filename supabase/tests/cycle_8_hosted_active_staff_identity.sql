-- Rollback-only regression for the Cycle 8 hosted active-staff identity bind.
--
-- The production fixture remains DML-only and never writes auth.users. This
-- disposable matrix creates transaction-local Auth rows solely to prove the
-- guard and replay contract, restores the retained row exactly, and ROLLBACKs.
-- Run as postgres only after independently selecting isolated project
-- uyacxqtsiwlvtmhxvoxr and setting:
--   set passage.test_project_ref = 'uyacxqtsiwlvtmhxvoxr';

begin;

do $cycle_8_hosted_identity_preflight$
begin
  if current_setting('passage.test_project_ref', true) is distinct from
       'uyacxqtsiwlvtmhxvoxr'
     or current_setting('passage.test_project_ref', true) =
       'qsveqfchwylsbncsfgxe'
     or session_user <> 'postgres'
     or current_user <> 'postgres' then
    raise exception 'Cycle 8 hosted identity tests refused: exact isolated postgres context required'
      using errcode = '42501';
  end if;
  if (select count(*) from public.organizations) <> 1
     or (select count(*) from public.organization_locations) <> 1
     or (select count(*) from public.workflows) <> 2
     or (select count(*) from public.tasks) <> 3
     or (select count(*) from public.workflow_events) <> 8
     or (select count(*) from public.organization_invitations) <> 2
     or (select count(*) from public.organization_invitation_locations) <> 2
     or (select count(*) from public.organization_members where status = 'active') <> 2
     or (select count(*) from public.organization_members where status = 'revoked') <> 1
     or (select count(*) from public.organization_member_locations where revoked_at is null) <> 2
     or exists (select 1 from public.task_proofs)
     or exists (select 1 from public.task_proof_reviews)
     or not exists (
       select 1 from public.workflows
       where id = 'c7b10001-7b00-47b0-87b0-000000000001'
         and case_reference = 'NS-2051'
     )
     or not exists (
       select 1 from public.organization_members
       where id = 'c7b00004-7b00-47b0-87b0-000000000004'
         and user_id is null
         and lower(btrim(email)) = 'avery-cycle7b@passage.test'
         and role = 'staff' and status = 'active'
     )
     or exists (
       select 1 from auth.users
       where lower(btrim(email)) = 'avery-cycle7b@passage.test'
     ) then
    raise exception 'Cycle 8 hosted identity tests refused: retained pre-bind baseline drifted'
      using errcode = '42501';
  end if;
end
$cycle_8_hosted_identity_preflight$;

create function pg_temp.cycle_8_retained_digest(p_include_binding boolean)
returns text
language sql
stable
set search_path = pg_catalog, public, pg_temp
as $digest$
  select md5(string_agg(snapshot.entity || ':' || snapshot.row_id || ':' || snapshot.body,
                        E'\n' order by snapshot.entity, snapshot.row_id))
  from (
    select 'organization'::text entity, id::text row_id, to_jsonb(row_data)::text body
    from public.organizations row_data
    union all
    select 'location', id::text, to_jsonb(row_data)::text
    from public.organization_locations row_data
    union all
    select 'member', id::text,
      (case when not p_include_binding
                  and id = 'c7b00004-7b00-47b0-87b0-000000000004'::uuid
             then to_jsonb(row_data) - 'updated_at' - 'user_id'
             else to_jsonb(row_data)
       end)::text
    from public.organization_members row_data
    union all
    select 'member_location', organization_member_id::text || ':' || organization_location_id::text,
           to_jsonb(row_data)::text
    from public.organization_member_locations row_data
    union all
    select 'workflow', id::text, to_jsonb(row_data)::text from public.workflows row_data
    union all
    select 'task', id::text, to_jsonb(row_data)::text from public.tasks row_data
    union all
    select 'event', id::text, to_jsonb(row_data)::text from public.workflow_events row_data
    union all
    select 'invitation', id::text, to_jsonb(row_data)::text
    from public.organization_invitations row_data
    union all
    select 'invitation_location', invitation_id::text || ':' || organization_location_id::text,
           to_jsonb(row_data)::text
    from public.organization_invitation_locations row_data
  ) snapshot
$digest$;

create temporary table cycle_8_hosted_identity_snapshot as
select
  pg_temp.cycle_8_retained_digest(true) as full_digest,
  pg_temp.cycle_8_retained_digest(false) as protected_digest,
  member_row.user_id,
  member_row.updated_at,
  member_row.accepted_at,
  (select count(*) from public.organizations) as organizations,
  (select count(*) from public.organization_locations) as locations,
  (select count(*) from public.organization_members) as members,
  (select count(*) from public.organization_member_locations) as grants,
  (select count(*) from public.organization_invitations) as invitations,
  (select count(*) from public.organization_invitation_locations) as invitation_locations,
  (select count(*) from public.workflows) as workflows,
  (select count(*) from public.tasks) as tasks,
  (select count(*) from public.workflow_events) as events
from public.organization_members member_row
where member_row.id = 'c7b00004-7b00-47b0-87b0-000000000004';

create function pg_temp.cycle_8_bind_staff(p_ref text, p_user_id uuid)
returns boolean
language plpgsql
set search_path = pg_catalog, public, auth, pg_temp
as $bind$
declare
  v_member_id constant uuid := 'c7b00004-7b00-47b0-87b0-000000000004';
  v_email constant text := 'avery-cycle7b@passage.test';
  v_existing uuid;
  v_before text;
  v_changed integer;
  v_replayed boolean := false;
begin
  if p_ref is null then
    raise exception 'project attestation required' using errcode = '22023';
  end if;
  if p_ref = 'qsveqfchwylsbncsfgxe' or p_ref <> 'uyacxqtsiwlvtmhxvoxr' then
    raise exception 'isolated project required' using errcode = '42501';
  end if;
  if p_user_id is null then
    raise exception 'Auth user UUID required' using errcode = '22023';
  end if;
  if (select count(*) from public.organizations) <> 1
     or (select count(*) from public.organization_locations) <> 1
     or (select count(*) from public.workflows) <> 2
     or (select count(*) from public.tasks) <> 3
     or (select count(*) from public.workflow_events) <> 8
     or (select count(*) from public.organization_invitations) <> 2
     or (select count(*) from public.organization_invitation_locations) <> 2
     or (select count(*) from public.organization_members where status = 'active') <> 2
     or (select count(*) from public.organization_members where status = 'revoked') <> 1
     or (select count(*) from public.organization_member_locations where revoked_at is null) <> 2
     or exists (select 1 from public.task_proofs)
     or exists (select 1 from public.task_proof_reviews) then
    raise exception 'retained manifest drifted' using errcode = '42501';
  end if;
  if (select count(*) from auth.users where id = p_user_id) <> 1
     or (select count(*) from auth.users where lower(btrim(email)) = v_email) <> 1
     or not exists (
       select 1 from auth.users where id = p_user_id and lower(btrim(email)) = v_email
     ) then
    raise exception 'Auth identity/email mismatch' using errcode = '42501';
  end if;
  if exists (
       select 1 from public.organization_members
       where id <> v_member_id and (user_id = p_user_id or lower(btrim(email)) = v_email)
     )
     or not exists (
       select 1 from public.organization_members
       where id = v_member_id
         and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
         and lower(btrim(email)) = v_email
         and role = 'staff' and status = 'active'
         and display_name = 'Avery Brooks' and title = 'Care coordinator'
     ) then
    raise exception 'reserved identity collision' using errcode = '23505';
  end if;

  v_before := pg_temp.cycle_8_retained_digest(false);
  select user_id into strict v_existing
  from public.organization_members where id = v_member_id for update;
  if v_existing is null then
    update public.organization_members
    set user_id = p_user_id, updated_at = clock_timestamp()
    where id = v_member_id and user_id is null;
    get diagnostics v_changed = row_count;
    if v_changed <> 1 then
      raise exception 'concurrent bind' using errcode = '40001';
    end if;
  elsif v_existing <> p_user_id then
    raise exception 'different Auth user already bound' using errcode = '23505';
  else
    v_replayed := true;
  end if;
  if pg_temp.cycle_8_retained_digest(false) is distinct from v_before then
    raise exception 'protected digest changed';
  end if;
  return v_replayed;
end
$bind$;

do $cycle_8_hosted_identity_refusal_tests$
declare
  v_before text := pg_temp.cycle_8_retained_digest(true);
begin
  begin
    perform pg_temp.cycle_8_bind_staff('wrong-project', 'c8100001-c810-4810-8810-000000000001');
    raise exception 'wrong-project case unexpectedly passed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform pg_temp.cycle_8_bind_staff('qsveqfchwylsbncsfgxe', 'c8100001-c810-4810-8810-000000000001');
    raise exception 'production case unexpectedly passed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform pg_temp.cycle_8_bind_staff('uyacxqtsiwlvtmhxvoxr', 'c8100001-c810-4810-8810-000000000001');
    raise exception 'missing-Auth case unexpectedly passed';
  exception when insufficient_privilege then null;
  end;
  if pg_temp.cycle_8_retained_digest(true) is distinct from v_before then
    raise exception 'refusal cases changed retained data';
  end if;
end
$cycle_8_hosted_identity_refusal_tests$;

insert into auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('c8100001-c810-4810-8810-000000000001', 'avery-cycle7b@passage.test', now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Avery Brooks"}', now(), now()),
  ('c8100002-c810-4810-8810-000000000002', 'wrong-email@cycle8.test', now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Wrong Email"}', now(), now());

do $cycle_8_hosted_identity_auth_and_collision_tests$
declare
  v_before text := pg_temp.cycle_8_retained_digest(true);
  v_collision_member_id uuid;
begin
  begin
    perform pg_temp.cycle_8_bind_staff('uyacxqtsiwlvtmhxvoxr', 'c8100002-c810-4810-8810-000000000002');
    raise exception 'wrong-email case unexpectedly passed';
  exception when insufficient_privilege then null;
  end;

  select id into strict v_collision_member_id
  from public.organization_members
  where id <> 'c7b00004-7b00-47b0-87b0-000000000004'
    and status = 'revoked'
  limit 1;
  begin
    update public.organization_members
    set user_id = 'c8100001-c810-4810-8810-000000000001'
    where id = v_collision_member_id;
    perform pg_temp.cycle_8_bind_staff('uyacxqtsiwlvtmhxvoxr', 'c8100001-c810-4810-8810-000000000001');
    raise exception 'user collision unexpectedly passed';
  exception when unique_violation then null;
  end;
  begin
    update public.organization_members
    set email = 'avery-cycle7b@passage.test'
    where id = v_collision_member_id;
    perform pg_temp.cycle_8_bind_staff('uyacxqtsiwlvtmhxvoxr', 'c8100001-c810-4810-8810-000000000001');
    raise exception 'email collision unexpectedly passed';
  exception when unique_violation then null;
  end;
  if pg_temp.cycle_8_retained_digest(true) is distinct from v_before then
    raise exception 'Auth/collision refusals were not atomic';
  end if;
end
$cycle_8_hosted_identity_auth_and_collision_tests$;

do $cycle_8_hosted_identity_bind_and_replay_tests$
declare
  v_replayed boolean;
  v_bound_at timestamptz;
  v_protected_before text := pg_temp.cycle_8_retained_digest(false);
begin
  v_replayed := pg_temp.cycle_8_bind_staff(
    'uyacxqtsiwlvtmhxvoxr', 'c8100001-c810-4810-8810-000000000001'
  );
  if v_replayed then
    raise exception 'first binding reported replay';
  end if;
  select updated_at into strict v_bound_at
  from public.organization_members
  where id = 'c7b00004-7b00-47b0-87b0-000000000004'
    and user_id = 'c8100001-c810-4810-8810-000000000001';
  v_replayed := pg_temp.cycle_8_bind_staff(
    'uyacxqtsiwlvtmhxvoxr', 'c8100001-c810-4810-8810-000000000001'
  );
  if not v_replayed
     or (select updated_at from public.organization_members
         where id = 'c7b00004-7b00-47b0-87b0-000000000004')
        is distinct from v_bound_at then
    raise exception 'same-ID replay was not a timestamp-preserving no-op';
  end if;
  if pg_temp.cycle_8_retained_digest(false) is distinct from v_protected_before then
    raise exception 'binding changed protected retained data';
  end if;

  begin
    update auth.users set email = 'first-bound@cycle8.test'
    where id = 'c8100001-c810-4810-8810-000000000001';
    update auth.users set email = 'avery-cycle7b@passage.test'
    where id = 'c8100002-c810-4810-8810-000000000002';
    perform pg_temp.cycle_8_bind_staff(
      'uyacxqtsiwlvtmhxvoxr', 'c8100002-c810-4810-8810-000000000002'
    );
    raise exception 'different-ID rebind unexpectedly passed';
  exception when unique_violation then null;
  end;
  if (select user_id from public.organization_members
      where id = 'c7b00004-7b00-47b0-87b0-000000000004') <>
       'c8100001-c810-4810-8810-000000000001'::uuid
     or (select updated_at from public.organization_members
         where id = 'c7b00004-7b00-47b0-87b0-000000000004')
        is distinct from v_bound_at then
    raise exception 'different-ID refusal was not atomic';
  end if;
end
$cycle_8_hosted_identity_bind_and_replay_tests$;

-- Restore the exact retained member tuple before asserting unchanged counts and
-- digest. The final ROLLBACK is the authoritative cleanup boundary.
update public.organization_members as member_row
set user_id = snapshot.user_id,
    updated_at = snapshot.updated_at,
    accepted_at = snapshot.accepted_at
from cycle_8_hosted_identity_snapshot snapshot
where member_row.id = 'c7b00004-7b00-47b0-87b0-000000000004';

delete from auth.users
where id in (
  'c8100001-c810-4810-8810-000000000001',
  'c8100002-c810-4810-8810-000000000002'
);

do $cycle_8_hosted_identity_final_assertions$
declare
  v_snapshot cycle_8_hosted_identity_snapshot%rowtype;
begin
  select * into strict v_snapshot from cycle_8_hosted_identity_snapshot;
  if pg_temp.cycle_8_retained_digest(true) is distinct from v_snapshot.full_digest
     or (select count(*) from public.organizations) <> v_snapshot.organizations
     or (select count(*) from public.organization_locations) <> v_snapshot.locations
     or (select count(*) from public.organization_members) <> v_snapshot.members
     or (select count(*) from public.organization_member_locations) <> v_snapshot.grants
     or (select count(*) from public.organization_invitations) <> v_snapshot.invitations
     or (select count(*) from public.organization_invitation_locations) <> v_snapshot.invitation_locations
     or (select count(*) from public.workflows) <> v_snapshot.workflows
     or (select count(*) from public.tasks) <> v_snapshot.tasks
     or (select count(*) from public.workflow_events) <> v_snapshot.events then
    raise exception 'Cycle 8 hosted identity matrix failed exact restore/count/digest proof';
  end if;
end
$cycle_8_hosted_identity_final_assertions$;

rollback;
