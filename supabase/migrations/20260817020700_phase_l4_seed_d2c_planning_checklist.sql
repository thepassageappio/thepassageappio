-- Backfill: applied directly to production via the Supabase MCP tool on 2026-08-17/18,
-- never committed to git until now (2026-08-19). This file's content is the verified
-- live production definition (via pg_get_functiondef / information_schema), reconstructed
-- to close the gap tracked in docs/product/operational-readiness-roadmap.md item 10 --
-- it is NOT a re-authored guess and NOT meant to be re-applied (the version above is
-- already recorded as applied in this project's remote migration history).
--
-- Phase L.4: D2C planning checklist seed. Creates
-- passage_private.seed_default_d2c_planning_tasks (a 10-item advance-planning
-- checklist, distinct from the 15-item funeral-home checklist seeded on the org side
-- by seed_default_case_tasks) and wires it into self_serve_create_family_record --
-- verified the immediately-prior committed version of that function
-- (supabase/migrations/20260816130000_fix_urgent_intake_case_creation.sql) has zero
-- task-seeding calls, so this migration is confidently where the wiring was added.
--
-- Both verified live via pg_get_functiondef on 2026-08-19; self_serve_create_family_record
-- is not touched by any later migration. High confidence throughout.

CREATE OR REPLACE FUNCTION passage_private.seed_default_d2c_planning_tasks(p_workflow_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_count integer;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  insert into public.tasks (workflow_id, title, category, status, version, due_at)
  select p_workflow_id, item.title, item.category, 'assigned', 1, v_now + item.offset
  from (values
    ('Name your healthcare power of attorney', 'legal', interval '0 days'),
    ('Name your financial power of attorney', 'legal', interval '0 days'),
    ('Review and update your will', 'legal', interval '3 days'),
    ('Review beneficiary designations on life insurance and retirement accounts -- these legally override your will', 'financial', interval '5 days'),
    ('Name an executor and have the actual conversation with them', 'personal', interval '5 days'),
    ('Document your funeral and disposition preferences', 'memorial', interval '7 days'),
    ('Check veteran status for VA burial benefits, if applicable', 'government', interval '7 days'),
    ('List and share where key documents are kept (will, deed, insurance policies)', 'property', interval '10 days'),
    ('Inventory your digital accounts and passwords', 'digital', interval '14 days'),
    ('Share the finished plan with your family or executor', 'personal', interval '21 days')
  ) as item(title, category, "offset");
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION passage_private.self_serve_create_family_record(p_person_name text, p_relationship_to_deceased text)
 RETURNS TABLE(workflow_id uuid, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_person_name text := btrim(coalesce(p_person_name, ''));
  v_relationship text := nullif(btrim(coalesce(p_relationship_to_deceased, '')), '');
  v_has_active_subscription boolean;
  v_existing_workflow_id uuid;
  v_new_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_person_name = '' or length(v_person_name) > 200 then
    raise exception 'A valid name is required' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.subscriptions
    where user_id = v_actor_user_id and status in ('active', 'trialing')
  ) into v_has_active_subscription;
  if not v_has_active_subscription then
    raise exception 'An active subscription is required to start a family record' using errcode = '42501';
  end if;

  select id into v_existing_workflow_id from public.workflows where user_id = v_actor_user_id limit 1;
  if v_existing_workflow_id is not null then
    return query select v_existing_workflow_id, true;
    return;
  end if;

  insert into public.workflows (
    user_id, name, person_name, relationship_to_deceased, trigger_type, mode, path, status, phase
  ) values (
    v_actor_user_id, v_person_name, v_person_name, v_relationship, 'death_confirmed', 'green', 'green', 'planning_active', 'Planning started'
  ) returning id into v_new_id;

  perform passage_private.seed_default_d2c_planning_tasks(v_new_id);

  return query select v_new_id, false;
end
$function$;

CREATE OR REPLACE FUNCTION public.self_serve_create_family_record(p_person_name text, p_relationship_to_deceased text)
 RETURNS TABLE(workflow_id uuid, replayed boolean)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select * from passage_private.self_serve_create_family_record(p_person_name, p_relationship_to_deceased)
$function$;
