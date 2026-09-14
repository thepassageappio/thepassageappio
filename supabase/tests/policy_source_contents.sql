DO $test$
declare
  org uuid := '__SOURCE_ORG__'; actor uuid := gen_random_uuid(); fixtures jsonb := '__SOURCE_FIXTURES__';
  fixture jsonb; body jsonb; changed text; saved text; row_id uuid; role_name text; operation text; privilege text;
  registered_ids uuid[] := '{}';
begin
 begin
  insert into auth.users(id,email,email_confirmed_at,created_at,updated_at)
  values(actor,actor::text||'@local.authority.test',now(),now(),now());
  insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status)
  values(org,'Source Storage Test','Source Storage Test','regional_bank','1 Sample Way','Albany','NY','12207',actor,'ready');
  foreach role_name in array array['anon','authenticated'] loop
    foreach privilege in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
      if has_table_privilege(role_name,'authority_private.policy_source_contents',privilege) then raise exception 'browser grant'; end if;
    end loop;
    if has_function_privilege(role_name,'authority_private.policy_source_envelope_valid_v1(text)','EXECUTE')
      or has_function_privilege(role_name,'authority_private.prevent_policy_source_rewrite_v1()','EXECUTE') then raise exception 'browser helper grant'; end if;
    perform set_config('role',role_name,true);
    begin execute 'select count(*) from authority_private.policy_source_contents'; raise exception 'browser read allowed'; exception when insufficient_privilege then null; end;
    begin execute 'insert into authority_private.policy_source_contents(canonical_text,sha256) values($1,$2)' using fixtures->0->>'canonicalJson',fixtures->0->>'sha256'; raise exception 'browser insert allowed'; exception when insufficient_privilege then null; end;
    perform set_config('role','postgres',true);
  end loop;
  if not (select relrowsecurity from pg_class where oid='authority_private.policy_source_contents'::regclass)
    or exists(select 1 from pg_policy where polrelid='authority_private.policy_source_contents'::regclass) then raise exception 'default-deny RLS missing'; end if;
  perform set_config('role','service_role',true);
  for fixture in select value from jsonb_array_elements(fixtures) loop
    body := (fixture->>'canonicalJson')::jsonb;
    insert into authority_private.policy_source_contents(canonical_text,sha256)
    values(fixture->>'canonicalJson',fixture->>'sha256') returning id into row_id;
    registered_ids := array_append(registered_ids,row_id);
    select canonical_text into saved from authority_private.policy_source_contents where id=row_id
      and source_kind=body->>'kind' and source_key=body->>'key' and source_version='1'
      and organization_id is not distinct from (body->>'organizationId')::uuid
      and jurisdiction='NY' and authority_type='fixture' and effective_from=body->>'effectiveFrom';
    if saved is distinct from fixture->>'canonicalJson' then raise exception 'bytes or generated metadata mismatch'; end if;
    begin insert into authority_private.policy_source_contents(canonical_text,sha256) values(saved,fixture->>'sha256'); raise exception 'duplicate allowed'; exception when unique_violation then null; end;
    changed := jsonb_set(body,'{version}','"2"')::text;
    begin insert into authority_private.policy_source_contents(canonical_text,sha256) values(changed,encode(sha256(convert_to(changed,'UTF8')),'hex')); raise exception 'same effective time allowed'; exception when unique_violation then null; end;
    changed := jsonb_set(body,'{effectiveFrom}','"2026-09-12T00:00:00.000Z"')::text;
    begin insert into authority_private.policy_source_contents(canonical_text,sha256) values(changed,encode(sha256(convert_to(changed,'UTF8')),'hex')); raise exception 'same version allowed'; exception when unique_violation then null; end;
    begin insert into authority_private.policy_source_contents(canonical_text,sha256) values(saved,repeat('0',64)); raise exception 'bad hash allowed'; exception when check_violation then null; end;
    if authority_private.policy_source_envelope_valid_v1(jsonb_set(body,'{content}','{}')::text)
      or authority_private.policy_source_envelope_valid_v1(jsonb_set(body,'{publishedAt}','"2026-09-12T00:00:00.000Z"')::text)
      or authority_private.policy_source_envelope_valid_v1('not json') then raise exception 'invalid envelope allowed'; end if;
  end loop;
  changed := jsonb_set(body,'{organizationId}',to_jsonb(gen_random_uuid()::text))::text;
  begin insert into authority_private.policy_source_contents(canonical_text,sha256) values(changed,encode(sha256(convert_to(changed,'UTF8')),'hex')); raise exception 'missing tenant allowed'; exception when foreign_key_violation then null; end;
  if authority_private.policy_source_envelope_valid_v1(jsonb_set(body,'{dependencies}','{}')::text) then raise exception 'missing dependency pins allowed'; end if;
  foreach operation in array array['update authority_private.policy_source_contents set canonical_text=canonical_text','delete from authority_private.policy_source_contents','truncate authority_private.policy_source_contents'] loop
    begin execute operation; raise exception 'service rewrite allowed'; exception when insufficient_privilege then null; end;
  end loop;
  perform set_config('role','postgres',true);
  foreach operation in array array['update authority_private.policy_source_contents set canonical_text=canonical_text','delete from authority_private.policy_source_contents','truncate authority_private.policy_source_contents'] loop
    begin execute operation; raise exception 'owner rewrite allowed'; exception when sqlstate '55000' then if sqlerrm <> 'policy_source_contents_are_append_only' then raise; end if; end;
  end loop;
  if (select count(*) from authority_private.policy_source_contents where id=any(registered_ids)) <> 3 then raise exception 'history changed'; end if;
  raise exception using errcode='P9001',message='source_fixture_rollback';
 exception when sqlstate 'P9001' then if sqlerrm <> 'source_fixture_rollback' then raise; end if;
 end;
 if exists(select 1 from authority_private.policy_source_contents where id=any(registered_ids))
   or exists(select 1 from public.organizations where id=org) or exists(select 1 from auth.users where id=actor) then raise exception 'cleanup failed'; end if;
end;
$test$;
