-- Rollback-only Passage Zero P1 participant family-safe updates matrix.
-- Requires the retained isolated Cycle 7B workload and migration
-- 20260730021524_participant_updates_case_scope. Every fixture change rolls back.

begin;

do $participant_updates_preflight$
begin
  if to_regprocedure('public.list_participant_family_updates()') is null
     or to_regprocedure('passage_private.can_view_workflow_as_family(uuid)') is null
     or to_regclass('public.task_proofs') is null
     or to_regclass('public.task_proof_reviews') is null
     or not exists (
       select 1
       from supabase_migrations.schema_migrations
       where version = '20260730021524'
         and name = 'participant_updates_case_scope'
     )
     or not exists (
       select 1
       from public.workflows
       where id = 'c7b10001-7b00-47b0-87b0-000000000001'
     ) then
    raise exception using
      errcode = '55000',
      message = 'Participant family-safe updates test refused: reviewed isolated lineage is missing';
  end if;

  if pg_catalog.has_function_privilege(
       'authenticated',
       'passage_private.can_view_workflow_as_family(uuid)',
       'EXECUTE'
     ) then
    raise exception 'Authenticated client can execute the private family workflow predicate';
  end if;
  if not pg_catalog.has_function_privilege(
       'authenticated',
       'public.list_participant_family_updates()',
       'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'anon',
       'public.list_participant_family_updates()',
       'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'service_role',
       'public.list_participant_family_updates()',
       'EXECUTE'
     ) then
    raise exception 'Family-safe updates public command ACL is not authenticated-only';
  end if;
end
$participant_updates_preflight$;

insert into auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('75000011-7500-4500-8500-000000000011', 'owner@participant-scope.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Family Coordinator"}', now(), now()),
  ('75000012-7500-4500-8500-000000000012', 'updates@participant-scope.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Updates Participant"}', now(), now()),
  ('75000013-7500-4500-8500-000000000013', 'documents@participant-scope.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Documents Participant"}', now(), now()),
  ('75000014-7500-4500-8500-000000000014', 'revoked@participant-scope.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Revoked Participant"}', now(), now()),
  ('75000015-7500-4500-8500-000000000015', 'unrelated@participant-scope.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Unrelated Account"}', now(), now());

insert into public.continuity_spaces (
  id, owner_user_id, display_name, status, creation_request_id
) values
  ('75000021-7500-4500-8500-000000000021', '75000011-7500-4500-8500-000000000011', 'Participant scope family', 'active', '75000022-7500-4500-8500-000000000022'),
  ('75000031-7500-4500-8500-000000000031', '75000011-7500-4500-8500-000000000011', 'Second family space', 'active', '75000032-7500-4500-8500-000000000032');

insert into public.continuity_participants (
  id, continuity_space_id, user_id, invited_email, display_name,
  relationship, purpose, category_scope, status, accepted_at,
  revoked_at, revoked_by_user_id, revocation_reason
) values
  ('75000023-7500-4500-8500-000000000023', '75000021-7500-4500-8500-000000000021', '75000012-7500-4500-8500-000000000012', 'updates@participant-scope.test', 'Updates Participant', 'Friend', 'Review family updates', array['updates']::text[], 'active', now(), null, null, null),
  ('75000033-7500-4500-8500-000000000033', '75000031-7500-4500-8500-000000000031', '75000012-7500-4500-8500-000000000012', 'updates@participant-scope.test', 'Updates Participant', 'Friend', 'Review another family update', array['updates']::text[], 'active', now(), null, null, null),
  ('75000024-7500-4500-8500-000000000024', '75000021-7500-4500-8500-000000000021', '75000013-7500-4500-8500-000000000013', 'documents@participant-scope.test', 'Documents Participant', 'Friend', 'Review documents only', array['documents']::text[], 'active', now(), null, null, null),
  ('75000025-7500-4500-8500-000000000025', '75000021-7500-4500-8500-000000000021', '75000014-7500-4500-8500-000000000014', 'revoked@participant-scope.test', 'Revoked Participant', 'Friend', 'Former updates helper', array['updates']::text[], 'revoked', now(), now(), '75000011-7500-4500-8500-000000000011', 'Access ended for the authority test');

update public.workflows
set continuity_space_id = '75000021-7500-4500-8500-000000000021'
where id = 'c7b10001-7b00-47b0-87b0-000000000001';

select pg_catalog.set_config('passage.participant_workflow_count', (select count(*)::text from public.workflows), true);
select pg_catalog.set_config('passage.participant_task_count', (select count(*)::text from public.tasks), true);
select pg_catalog.set_config('passage.participant_event_count', (select count(*)::text from public.workflow_events), true);
select pg_catalog.set_config('passage.participant_proof_count', (select count(*)::text from public.task_proofs), true);
select pg_catalog.set_config('passage.participant_review_count', (select count(*)::text from public.task_proof_reviews), true);

set local role authenticated;

do $participant_updates_matrix$
declare
  v_workflow constant uuid := 'c7b10001-7b00-47b0-87b0-000000000001';
  projection_row record;
begin
  perform pg_catalog.set_config('request.jwt.claim.sub', '75000011-7500-4500-8500-000000000011', true);
  if (select count(*) from public.workflows where id = v_workflow) <> 1 then
    raise exception 'Active continuity-space owner cannot read the linked workflow';
  end if;

  perform pg_catalog.set_config('request.jwt.claim.sub', '75000012-7500-4500-8500-000000000012', true);
  if (select count(*) from public.list_participant_family_updates()) <> 2 then
    raise exception 'Updates participant did not receive both active family spaces';
  end if;
  if (select count(*) from public.list_participant_family_updates() where space_name = 'Participant scope family') <> 1 then
    raise exception 'Updates participant did not receive the bounded linked family update';
  end if;
  for projection_row in select * from public.list_participant_family_updates() loop
    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(pg_catalog.to_jsonb(projection_row)) as key_name
      where key_name ~ '(workflow|task|event|proof|review|organization|member)_id$'
         or key_name in ('workflow_id', 'task_id', 'event_id', 'proof_id', 'review_id', 'organization_id', 'organization_member_id')
    ) then
      raise exception 'Family-safe projection exposed a protected identifier';
    end if;
  end loop;

  if (select count(*) from public.workflows) <> 0
     or (select count(*) from public.tasks) <> 0
     or (select count(*) from public.workflow_events) <> 0
     or (select count(*) from public.task_proofs) <> 0
     or (select count(*) from public.task_proof_reviews) <> 0 then
    raise exception 'Updates participant can directly read raw workflow, task, event, proof, or review rows';
  end if;

  begin
    perform passage_private.can_view_workflow_as_family(v_workflow);
    raise exception 'Authenticated participant executed the private family workflow predicate';
  exception
    when insufficient_privilege then null;
  end;

  perform pg_catalog.set_config('request.jwt.claim.sub', '75000013-7500-4500-8500-000000000013', true);
  if (select count(*) from public.list_participant_family_updates()) <> 0
     or (select count(*) from public.workflows) <> 0
     or (select count(*) from public.tasks) <> 0
     or (select count(*) from public.workflow_events) <> 0
     or (select count(*) from public.task_proofs) <> 0
     or (select count(*) from public.task_proof_reviews) <> 0 then
    raise exception 'Non-updates participant can read the bounded or raw family update';
  end if;

  perform pg_catalog.set_config('request.jwt.claim.sub', '75000014-7500-4500-8500-000000000014', true);
  if (select count(*) from public.list_participant_family_updates()) <> 0
     or (select count(*) from public.workflows) <> 0
     or (select count(*) from public.tasks) <> 0
     or (select count(*) from public.workflow_events) <> 0
     or (select count(*) from public.task_proofs) <> 0
     or (select count(*) from public.task_proof_reviews) <> 0 then
    raise exception 'Revoked participant can read the bounded or raw family update';
  end if;

  perform pg_catalog.set_config('request.jwt.claim.sub', '75000015-7500-4500-8500-000000000015', true);
  if (select count(*) from public.list_participant_family_updates()) <> 0
     or (select count(*) from public.workflows) <> 0
     or (select count(*) from public.tasks) <> 0
     or (select count(*) from public.workflow_events) <> 0
     or (select count(*) from public.task_proofs) <> 0
     or (select count(*) from public.task_proof_reviews) <> 0 then
    raise exception 'Unrelated account can read the bounded or raw family update';
  end if;
end
$participant_updates_matrix$;

reset role;

do $participant_updates_cardinality$
begin
  if (select count(*) from public.workflows)::text
       <> current_setting('passage.participant_workflow_count')
     or (select count(*) from public.tasks)::text
       <> current_setting('passage.participant_task_count')
     or (select count(*) from public.workflow_events)::text
       <> current_setting('passage.participant_event_count')
     or (select count(*) from public.task_proofs)::text
       <> current_setting('passage.participant_proof_count')
     or (select count(*) from public.task_proof_reviews)::text
       <> current_setting('passage.participant_review_count') then
    raise exception 'Read authority matrix changed retained workflow, task, event, proof, or review cardinality';
  end if;
end
$participant_updates_cardinality$;

rollback;
