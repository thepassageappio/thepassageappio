-- Structural rollback-order proof for A16 provider discovery.
-- This script never commits and refuses every non-isolated target.
begin;

do $provider_reversal_preflight$
begin
  if current_setting('passage.test_project_ref', true) is distinct from
       'uyacxqtsiwlvtmhxvoxr'
     or current_setting('passage.test_project_ref', true) =
       'qsveqfchwylsbncsfgxe'
     or session_user <> 'postgres'
     or current_user <> 'postgres'
     or (
       select system_identifier
       from pg_catalog.pg_control_system()
     ) is distinct from 7656983981618135123::bigint then
    raise exception 'Provider reversal refused: isolated postgres attestation is required'
      using errcode = '42501';
  end if;
  if to_regclass('public.family_provider_selections') is null
     or to_regclass('passage_private.synthetic_provider_directory') is null then
    raise exception 'Provider reversal refused: A16 relations are missing';
  end if;
  if exists (select 1 from public.family_provider_selections)
     or exists (
       select 1 from public.workflow_events
       where family_provider_selection_id is not null
          or previous_family_provider_selection_id is not null
     ) then
    raise exception 'Provider reversal refused: durable A16 evidence exists'
      using errcode = '55000';
  end if;
end
$provider_reversal_preflight$;

drop policy workflow_events_authorized_select on public.workflow_events;
create policy workflow_events_authorized_select
  on public.workflow_events for select to authenticated
  using (
    passage_private.can_view_workflow_event(id)
    or (
      continuity_space_id is not null
      and passage_private.can_manage_continuity_space(continuity_space_id)
    )
  );
drop policy family_provider_selection_authorized_select
  on public.family_provider_selections;

drop function public.get_family_provider_selection_projection(uuid);
drop function public.confirm_family_provider_selection(
  uuid,uuid,timestamp with time zone,text,text,text,text,text,text,text,text,text
);
drop function passage_private.get_family_provider_selection_projection(uuid);
drop function passage_private.confirm_family_provider_selection(
  uuid,uuid,timestamp with time zone,text,text,text,text,text,text,text,text,text
);

drop index public.workflow_events_previous_family_provider_selection_idx;
drop index public.workflow_events_family_provider_selection_idx;
alter table public.workflow_events
  drop constraint workflow_events_previous_family_provider_selection_id_fkey,
  drop constraint workflow_events_family_provider_selection_id_fkey,
  drop column previous_family_provider_selection_id,
  drop column family_provider_selection_id;

drop table public.family_provider_selections;
drop table passage_private.synthetic_provider_directory;

do $provider_reversal_assertions$
begin
  if to_regclass('public.family_provider_selections') is not null
     or to_regclass('passage_private.synthetic_provider_directory') is not null
     or exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'workflow_events'
         and column_name in (
           'family_provider_selection_id',
           'previous_family_provider_selection_id'
         )
     )
     or (select count(*)
         from pg_policies
         where schemaname = 'public'
           and tablename = 'workflow_events'
           and permissive = 'PERMISSIVE'
           and cmd = 'SELECT') <> 1
     or not exists (
       select 1 from pg_policies
       where schemaname = 'public'
         and tablename = 'workflow_events'
         and policyname = 'workflow_events_authorized_select'
         and qual like '%can_view_workflow_event(id)%'
         and qual like '%can_manage_continuity_space(continuity_space_id)%'
         and qual not like '%family_provider_selection_id%'
     )
     or (select count(*) from public.organizations) <> 1
     or (select count(*) from public.organization_locations) <> 1
     or (select count(*) from public.workflows) <> 2
     or (select count(*) from public.tasks) <> 3
     or (select count(*) from public.workflow_events) <> 8
     or (select count(*) from public.organizations
         where id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 1
     or (select count(*) from public.organization_locations
         where id = 'c7a00002-7a00-47a0-87a0-000000000002'
           and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 1
     or (select count(*) from public.workflows
         where id in (
           'c7b10001-7b00-47b0-87b0-000000000001',
           'c7b10002-7b00-47b0-87b0-000000000002'
         )
           and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 2
     or (select count(*) from public.tasks
         where id in (
           'c7b20001-7b00-47b0-87b0-000000000001',
           'c7b20002-7b00-47b0-87b0-000000000002',
           'c7b20003-7b00-47b0-87b0-000000000003'
         )
           and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 3
     or (select count(*) from public.workflow_events
         where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 8
     or not exists (
       select 1 from public.workflows
       where case_reference = 'NS-2051'
         and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
     ) then
    raise exception 'Provider reversal left A16 structural residue';
  end if;
end
$provider_reversal_assertions$;

rollback;
