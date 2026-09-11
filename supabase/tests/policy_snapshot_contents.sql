-- Run through scripts/verify-policy-snapshot-storage.mjs; it supplies TypeScript-canonical fixture bytes.
DO $test$
declare
  v_org uuid := '__POLICY_ORGANIZATION__'; v_other uuid := gen_random_uuid(); v_actor uuid := gen_random_uuid();
  v_text text := '__POLICY_CANONICAL_TEXT__'; v_hash text := '__POLICY_SHA256__';
  v_id uuid; v_saved text; v_role text; v_operation text; v_privilege text; v_count bigint;
begin
 begin
  insert into auth.users(id,email,email_confirmed_at,created_at,updated_at)
  values(v_actor,v_actor::text||'@local.authority.test',now(),now(),now());
  insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status)
  select id,'Policy Storage Test','Policy Storage Test','regional_bank','1 Sample Way','Albany','NY','12207',v_actor,'ready'
  from unnest(array[v_org,v_other]) id;
  if encode(sha256(convert_to(v_text,'UTF8')),'hex') <> v_hash then raise exception 'Node/PostgreSQL UTF-8 hash mismatch'; end if;
  if not authority_private.policy_snapshot_envelope_valid_v1(v_text,v_org) then raise exception 'valid envelope denied'; end if;
  if authority_private.policy_snapshot_envelope_valid_v1(v_text,v_other) then raise exception 'cross-tenant envelope allowed'; end if;
  if authority_private.policy_snapshot_envelope_valid_v1('{}',v_org)
    or authority_private.policy_snapshot_envelope_valid_v1('null',v_org)
    or authority_private.policy_snapshot_envelope_valid_v1('not json',v_org)
    or authority_private.policy_snapshot_envelope_valid_v1(replace(v_text,'2026-09-11T00:00:00.000Z','2026-02-30T00:00:00.000Z'),v_org)
    or authority_private.policy_snapshot_envelope_valid_v1(jsonb_set(v_text::jsonb,'{sources,platform}','{}')::text,v_org)
    or authority_private.policy_snapshot_envelope_valid_v1(jsonb_set(v_text::jsonb,'{content}','{}')::text,v_org)
    then raise exception 'invalid envelope allowed'; end if;
  foreach v_role in array array['anon','authenticated'] loop
    foreach v_privilege in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
      if has_table_privilege(v_role,'authority_private.policy_snapshot_contents',v_privilege) then raise exception 'browser grant: % %',v_role,v_privilege; end if;
    end loop;
    if has_function_privilege(v_role,'authority_private.policy_snapshot_envelope_valid_v1(text,uuid)','EXECUTE')
      or has_function_privilege(v_role,'authority_private.prevent_policy_snapshot_rewrite_v1()','EXECUTE') then raise exception 'browser helper execute'; end if;
    perform set_config('role',v_role,true);
    begin execute 'select count(*) from authority_private.policy_snapshot_contents'; raise exception 'browser read allowed';
    exception when insufficient_privilege then null; end;
    begin execute 'insert into authority_private.policy_snapshot_contents(organization_id,canonical_text,sha256) values($1,$2,$3)' using v_org,v_text,v_hash; raise exception 'browser insert allowed';
    exception when insufficient_privilege then null; end;
    perform set_config('role','postgres',true);
  end loop;
  if not (select relrowsecurity from pg_class where oid='authority_private.policy_snapshot_contents'::regclass)
    or exists(select 1 from pg_policy where polrelid='authority_private.policy_snapshot_contents'::regclass) then raise exception 'default-deny RLS missing'; end if;
  perform set_config('role','service_role',true);
  insert into authority_private.policy_snapshot_contents(organization_id,canonical_text,sha256)
  values(v_org,v_text,v_hash) returning id into v_id;
  select canonical_text into v_saved from authority_private.policy_snapshot_contents where id=v_id;
  if v_saved is distinct from v_text then raise exception 'stored bytes changed'; end if;
  begin insert into authority_private.policy_snapshot_contents(organization_id,canonical_text,sha256) values(v_org,v_text,v_hash); raise exception 'duplicate content allowed';
  exception when unique_violation then null; end;
  begin insert into authority_private.policy_snapshot_contents(organization_id,canonical_text,sha256) values(v_other,v_text,v_hash); raise exception 'wrong organization allowed';
  exception when check_violation then null; end;
  begin insert into authority_private.policy_snapshot_contents(organization_id,canonical_text,sha256) values(v_org,v_text,repeat('0',64)); raise exception 'bad hash allowed';
  exception when check_violation then null; end;
  foreach v_operation in array array['update authority_private.policy_snapshot_contents set canonical_text=canonical_text', 'delete from authority_private.policy_snapshot_contents', 'truncate authority_private.policy_snapshot_contents'] loop
    begin execute v_operation; raise exception 'service mutation allowed'; exception when insufficient_privilege then null; end;
  end loop;
  perform set_config('role','postgres',true);
  -- Triggers protect against accidental writes even through a role with table-owner privileges.
  foreach v_operation in array array['update authority_private.policy_snapshot_contents set organization_id=organization_id', 'delete from authority_private.policy_snapshot_contents', 'truncate authority_private.policy_snapshot_contents'] loop
    begin execute v_operation; raise exception 'owner mutation allowed';
    exception when sqlstate '55000' then if sqlerrm <> 'policy_snapshot_contents_are_append_only' then raise; end if; end;
  end loop;
  select canonical_text into v_saved from authority_private.policy_snapshot_contents where id=v_id;
  select count(*) into v_count from authority_private.policy_snapshot_contents where organization_id=v_org;
  if v_saved is distinct from v_text or v_count <> 1 then raise exception 'history changed after denials'; end if;
  raise exception using errcode='P9001',message='policy_storage_fixture_rollback';
 exception when sqlstate 'P9001' then
  if sqlerrm <> 'policy_storage_fixture_rollback' then raise; end if;
 end;
 if exists(select 1 from authority_private.policy_snapshot_contents where organization_id=v_org)
   or exists(select 1 from public.organizations where id=v_org)
   or exists(select 1 from auth.users where id=v_actor) then raise exception 'fixture cleanup failed'; end if;
end;
$test$;
