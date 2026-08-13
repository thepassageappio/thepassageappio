-- Rollback-only least-privilege matrix for participant case updates.
-- Required caller attestation:
--   set passage.test_project_ref = 'uyacxqtsiwlvtmhxvoxr';

begin;

do $preflight$
begin
  if current_setting('passage.test_project_ref', true) is distinct from
       'uyacxqtsiwlvtmhxvoxr'
     or current_setting('passage.test_project_ref', true) =
       'qsveqfchwylsbncsfgxe'
     or session_user <> 'postgres'
     or current_user <> 'postgres' then
    raise exception 'Participant case scope test requires the exact isolated project and postgres role'
      using errcode = '42501';
  end if;

  if to_regclass('supabase_migrations.schema_migrations') is null
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'participant_case_scope_source_reconciliation'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'participant_case_update_for_workflow'
     )
     or to_regprocedure('passage_private.can_view_workflow_as_family(uuid)') is null
     or to_regprocedure('public.get_family_case_update_for_workflow(uuid)') is null then
    raise exception 'Participant case scope source stack is missing or incomplete'
      using errcode = '55000';
  end if;
end
$preflight$;

do $catalog_contract$
declare
  v_private_definition text;
  v_rpc_definition text;
begin
  select lower(pg_catalog.pg_get_functiondef(
    'passage_private.can_view_workflow_as_family(uuid)'::regprocedure
  )) into v_private_definition;
  select lower(pg_catalog.pg_get_functiondef(
    'public.get_family_case_update_for_workflow(uuid)'::regprocedure
  )) into v_rpc_definition;

  if position('space_row.owner_user_id = (select auth.uid())' in v_private_definition) = 0
     or position('continuity_participants' in v_private_definition) > 0
     or position('security definer' in v_private_definition) = 0
     or position('set search_path to ''''' in v_private_definition) = 0 then
    raise exception 'Raw family workflow predicate is not owner-only with an empty search path';
  end if;

  if position('participant_row.user_id = (select auth.uid())' in v_rpc_definition) = 0
     or position('participant_row.status = ''active''' in v_rpc_definition) = 0
     or position('''updates'' = any (participant_row.category_scope)' in v_rpc_definition) = 0
     or position('workflow_row.id = p_workflow_id' in v_rpc_definition) = 0
     or position('security definer' in v_rpc_definition) = 0
     or position('set search_path to ''''' in v_rpc_definition) = 0 then
    raise exception 'Bounded participant workflow projection authority drifted';
  end if;

  if not pg_catalog.has_function_privilege(
       'authenticated',
       'public.get_family_case_update_for_workflow(uuid)',
       'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'anon',
       'public.get_family_case_update_for_workflow(uuid)',
       'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'service_role',
       'public.get_family_case_update_for_workflow(uuid)',
       'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'authenticated',
       'passage_private.can_view_workflow_as_family(uuid)',
       'EXECUTE'
     ) then
    raise exception 'Participant projection or private predicate ACL drifted';
  end if;
end
$catalog_contract$;

create temporary table participant_case_scope_catalog_before (
  object_name text primary key,
  definition text not null,
  acl text not null
) on commit drop;

insert into participant_case_scope_catalog_before (object_name, definition, acl)
select
  namespace_row.nspname || '.' || procedure_row.proname,
  pg_catalog.pg_get_functiondef(procedure_row.oid),
  coalesce(pg_catalog.array_to_string(procedure_row.proacl, ','), '')
from pg_catalog.pg_proc as procedure_row
join pg_catalog.pg_namespace as namespace_row
  on namespace_row.oid = procedure_row.pronamespace
where procedure_row.oid in (
  'passage_private.can_view_workflow_as_family(uuid)'::regprocedure,
  'public.get_family_case_update_for_workflow(uuid)'::regprocedure
);

savepoint legacy_predicate_probe;

create or replace function passage_private.can_view_workflow_as_family(p_workflow_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workflows as workflow_row
    where workflow_row.id = p_workflow_id
      and workflow_row.continuity_space_id is not null
      and passage_private.can_view_continuity_space(workflow_row.continuity_space_id)
  )
$$;

set local role authenticated;
select pg_catalog.set_config(
  'request.jwt.claim.sub',
  'fa510003-a510-47a5-8a51-000000000003',
  true
);

do $legacy_escape_proof$
begin
  if (select count(*) from public.workflows
      where id = 'c7b10001-7b00-47b0-87b0-000000000001') <> 1 then
    raise exception 'Legacy broad participant predicate escape was not reproduced';
  end if;
end
$legacy_escape_proof$;

reset role;
rollback to savepoint legacy_predicate_probe;

do $rollback_restoration$
begin
  if exists (
    select 1
    from participant_case_scope_catalog_before as before_row
    join pg_catalog.pg_proc as procedure_row
      on procedure_row.oid in (
        'passage_private.can_view_workflow_as_family(uuid)'::regprocedure,
        'public.get_family_case_update_for_workflow(uuid)'::regprocedure
      )
    join pg_catalog.pg_namespace as namespace_row
      on namespace_row.oid = procedure_row.pronamespace
     and before_row.object_name = namespace_row.nspname || '.' || procedure_row.proname
    where procedure_row.oid in (
      'passage_private.can_view_workflow_as_family(uuid)'::regprocedure,
      'public.get_family_case_update_for_workflow(uuid)'::regprocedure
    )
      and (
        before_row.definition is distinct from pg_catalog.pg_get_functiondef(procedure_row.oid)
        or before_row.acl is distinct from
           coalesce(pg_catalog.array_to_string(procedure_row.proacl, ','), '')
      )
  ) then
    raise exception 'Savepoint rollback did not restore exact participant authority catalog';
  end if;
end
$rollback_restoration$;

insert into auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    'fa517806-a510-47a5-8a51-000000000006',
    'participant-no-updates@scope-regression.test',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"No updates participant"}',
    pg_catalog.now(),
    pg_catalog.now()
  ),
  (
    'fa517807-a510-47a5-8a51-000000000007',
    'participant-outsider@scope-regression.test',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Unrelated account"}',
    pg_catalog.now(),
    pg_catalog.now()
  );

insert into public.continuity_participants (
  id, continuity_space_id, user_id, invited_email, display_name,
  relationship, purpose, category_scope, status, accepted_at
) values (
  'fa517808-a510-47a5-8a51-000000000008',
  'fa510001-a510-47a5-8a51-000000000001',
  'fa517806-a510-47a5-8a51-000000000006',
  'participant-no-updates@scope-regression.test',
  'No updates participant',
  'Friend',
  'Help with tasks only',
  array['tasks']::text[],
  'active',
  pg_catalog.now()
);

set local role authenticated;

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  'fa510002-a510-47a5-8a51-000000000002',
  true
);

do $owner_matrix$
begin
  if (select count(*) from public.workflows
      where id = 'c7b10001-7b00-47b0-87b0-000000000001') <> 1
     or (select count(*) from public.tasks
         where workflow_id = 'c7b10001-7b00-47b0-87b0-000000000001') < 1
     or (select count(*) from public.task_proofs
         where workflow_id = 'c7b10001-7b00-47b0-87b0-000000000001') < 1
     or (select count(*) from public.task_proof_reviews
         where workflow_id = 'c7b10001-7b00-47b0-87b0-000000000001') < 1
     or (select count(*) from public.workflow_events
         where workflow_id = 'c7b10001-7b00-47b0-87b0-000000000001') < 1 then
    raise exception 'Continuity-space owner raw case access was not preserved';
  end if;
end
$owner_matrix$;

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  'fa510003-a510-47a5-8a51-000000000003',
  true
);

do $active_updates_participant_matrix$
begin
  if (select count(*) from public.get_family_case_update_for_workflow(
        'c7b10001-7b00-47b0-87b0-000000000001'
      )) <> 1 then
    raise exception 'Active updates participant did not receive one bounded case projection';
  end if;

  if exists (
       select 1 from public.workflows
       where id = 'c7b10001-7b00-47b0-87b0-000000000001'
     )
     or exists (
       select 1 from public.tasks
       where workflow_id = 'c7b10001-7b00-47b0-87b0-000000000001'
     )
     or exists (
       select 1 from public.task_proofs
       where workflow_id = 'c7b10001-7b00-47b0-87b0-000000000001'
     )
     or exists (
       select 1 from public.task_proof_reviews
       where workflow_id = 'c7b10001-7b00-47b0-87b0-000000000001'
     )
     or exists (
       select 1 from public.workflow_events
       where workflow_id = 'c7b10001-7b00-47b0-87b0-000000000001'
     ) then
    raise exception 'Active participant retained a raw workflow, task, proof, review, or case-event read';
  end if;

  if exists (
    select 1 from public.get_family_case_update_for_workflow(
      'c7b10002-7b00-47b0-87b0-000000000002'
    )
  ) then
    raise exception 'Active participant crossed the requested workflow boundary';
  end if;
end
$active_updates_participant_matrix$;

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  'fa510005-a510-47a5-8a51-000000000005',
  true
);

do $revoked_matrix$
begin
  if exists (
       select 1 from public.get_family_case_update_for_workflow(
         'c7b10001-7b00-47b0-87b0-000000000001'
       )
     )
     or exists (
       select 1 from public.workflows
       where id = 'c7b10001-7b00-47b0-87b0-000000000001'
     ) then
    raise exception 'Revoked participant retained case access';
  end if;
end
$revoked_matrix$;

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  'fa517806-a510-47a5-8a51-000000000006',
  true
);

do $wrong_category_matrix$
begin
  if exists (
       select 1 from public.get_family_case_update_for_workflow(
         'c7b10001-7b00-47b0-87b0-000000000001'
       )
     )
     or exists (
       select 1 from public.workflows
       where id = 'c7b10001-7b00-47b0-87b0-000000000001'
     ) then
    raise exception 'Participant without updates scope retained case access';
  end if;
end
$wrong_category_matrix$;

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  'fa517807-a510-47a5-8a51-000000000007',
  true
);

do $wrong_user_matrix$
begin
  if exists (
       select 1 from public.get_family_case_update_for_workflow(
         'c7b10001-7b00-47b0-87b0-000000000001'
       )
     )
     or exists (
       select 1 from public.workflows
       where id = 'c7b10001-7b00-47b0-87b0-000000000001'
     ) then
    raise exception 'Unrelated authenticated user retained case access';
  end if;
end
$wrong_user_matrix$;

reset role;
set local role anon;

do $anon_matrix$
begin
  if pg_catalog.has_function_privilege(
       'anon',
       'public.get_family_case_update_for_workflow(uuid)',
       'EXECUTE'
     ) then
    raise exception 'Anon inherited participant projection execution';
  end if;

  begin
    perform public.get_family_case_update_for_workflow(
      'c7b10001-7b00-47b0-87b0-000000000001'
    );
    raise exception 'Anon participant projection call unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end
$anon_matrix$;

reset role;

do $final_catalog_stability$
begin
  if exists (
    select 1
    from participant_case_scope_catalog_before as before_row
    join pg_catalog.pg_proc as procedure_row
      on procedure_row.oid in (
        'passage_private.can_view_workflow_as_family(uuid)'::regprocedure,
        'public.get_family_case_update_for_workflow(uuid)'::regprocedure
      )
    join pg_catalog.pg_namespace as namespace_row
      on namespace_row.oid = procedure_row.pronamespace
     and before_row.object_name = namespace_row.nspname || '.' || procedure_row.proname
    where procedure_row.oid in (
      'passage_private.can_view_workflow_as_family(uuid)'::regprocedure,
      'public.get_family_case_update_for_workflow(uuid)'::regprocedure
    )
      and (
        before_row.definition is distinct from pg_catalog.pg_get_functiondef(procedure_row.oid)
        or before_row.acl is distinct from
           coalesce(pg_catalog.array_to_string(procedure_row.proacl, ','), '')
      )
  ) then
    raise exception 'Authority matrix changed the retained function catalog';
  end if;
end
$final_catalog_stability$;

rollback;
