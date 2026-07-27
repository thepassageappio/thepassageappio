-- ISOLATED-PROJECT participant invitation advisor hardening.
--
-- This follow-up preserves the complete participant invitation lifecycle while
-- removing exposed SECURITY DEFINER wrappers and overlapping permissive event
-- SELECT policies. Apply only after independent exact-hash review to isolated
-- project uyacxqtsiwlvtmhxvoxr. Never apply to Production
-- qsveqfchwylsbncsfgxe.

do $participant_advisor_preflight$
declare
  v_public_name text;
  v_private_name text;
begin
  if session_user <> 'postgres'
     or current_user <> 'postgres'
     or not exists (
       select 1
       from supabase_migrations.schema_migrations
       where name = 'participant_invitation_thin_slice'
     )
     or to_regclass('public.continuity_spaces') is null
     or to_regclass('public.continuity_participants') is null
     or to_regclass('public.participant_invitations') is null then
    raise exception using
      errcode = '42501',
      message = 'Participant advisor hardening refused: isolated participant foundation is missing';
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
     or exists (select 1 from public.continuity_spaces)
     or exists (select 1 from public.continuity_participants)
     or exists (select 1 from public.participant_invitations)
     or exists (
       select 1
       from public.workflow_events
       where continuity_space_id is not null
          or participant_invitation_id is not null
          or continuity_participant_id is not null
     ) then
    raise exception using
      errcode = '42501',
      message = 'Participant advisor hardening refused: exact isolated cardinality drifted';
  end if;

  if (select count(*) from public.organizations
      where id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 1
     or (select count(*) from public.organization_locations
         where id = 'c7a00002-7a00-47a0-87a0-000000000002'
           and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 1
     or (select count(*) from public.workflows
         where id in (
           'c7b10001-7b00-47b0-87b0-000000000001',
           'c7b10002-7b00-47b0-87b0-000000000002'
         )) <> 2
     or (select count(*) from public.tasks
         where id in (
           'c7b20001-7b00-47b0-87b0-000000000001',
           'c7b20002-7b00-47b0-87b0-000000000002',
           'c7b20003-7b00-47b0-87b0-000000000003'
         )) <> 3 then
    raise exception using
      errcode = '42501',
      message = 'Participant advisor hardening refused: exact isolated identities are missing';
  end if;

  foreach v_public_name in array array[
    'list_owned_continuity_spaces',
    'list_participant_continuity_spaces',
    'list_continuity_participant_projection',
    'list_owned_continuity_participant_projection',
    'list_participant_invitation_projection'
  ]
  loop
    if not exists (
      select 1
      from pg_proc as p
      join pg_namespace as n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = v_public_name
        and p.pronargs = 0
        and p.prosecdef
        and p.proconfig @> array['search_path=""']
    ) then
      raise exception 'Participant advisor hardening refused: expected public definer wrapper % is absent',
        v_public_name using errcode = '55000';
    end if;
  end loop;

  foreach v_private_name in array array[
    'list_owned_continuity_spaces',
    'list_participant_continuity_spaces',
    'list_continuity_participant_projection',
    'list_owned_continuity_participant_projection',
    'list_participant_invitation_projection'
  ]
  loop
    if not exists (
      select 1
      from pg_proc as p
      join pg_namespace as n on n.oid = p.pronamespace
      where n.nspname = 'passage_private'
        and p.proname = v_private_name
        and p.pronargs = 0
        and p.prosecdef
        and p.proconfig @> array['search_path=""']
    ) then
      raise exception 'Participant advisor hardening refused: expected private helper % is absent',
        v_private_name using errcode = '55000';
    end if;
  end loop;

  if (select count(*)
      from pg_policies
      where schemaname = 'public'
        and tablename = 'workflow_events'
        and permissive = 'PERMISSIVE'
        and cmd = 'SELECT'
        and policyname in (
          'cycle_7b_events_authorized_select',
          'participant_events_authorized_select'
        )) <> 2
     or not exists (
       select 1 from pg_policies
       where schemaname = 'public'
         and tablename = 'workflow_events'
         and policyname = 'cycle_7b_events_authorized_select'
         and qual like '%can_view_workflow_event(id)%'
     )
     or not exists (
       select 1 from pg_policies
       where schemaname = 'public'
         and tablename = 'workflow_events'
         and policyname = 'participant_events_authorized_select'
         and qual like '%can_manage_continuity_space(continuity_space_id)%'
     ) then
    raise exception using
      errcode = '55000',
      message = 'Participant advisor hardening refused: expected event policy baseline drifted';
  end if;
end
$participant_advisor_preflight$;

create or replace function public.list_owned_continuity_spaces()
returns table (
  id uuid, display_name text, created_at timestamp with time zone
)
language sql stable security invoker set search_path = ''
as $function$
  select * from passage_private.list_owned_continuity_spaces()
$function$;

create or replace function public.list_participant_continuity_spaces()
returns table (
  id uuid, display_name text, created_at timestamp with time zone
)
language sql stable security invoker set search_path = ''
as $function$
  select * from passage_private.list_participant_continuity_spaces()
$function$;

create or replace function public.list_continuity_participant_projection()
returns table (
  id uuid, continuity_space_id uuid, display_name text, relationship text,
  purpose text, category_scope text[], status text,
  accepted_at timestamp with time zone, revoked_at timestamp with time zone
)
language sql stable security invoker set search_path = ''
as $function$
  select * from passage_private.list_continuity_participant_projection()
$function$;

create or replace function public.list_owned_continuity_participant_projection()
returns table (
  id uuid, continuity_space_id uuid, display_name text, relationship text,
  purpose text, category_scope text[], status text,
  accepted_at timestamp with time zone, revoked_at timestamp with time zone,
  outcome_note text
)
language sql stable security invoker set search_path = ''
as $function$
  select * from passage_private.list_owned_continuity_participant_projection()
$function$;

create or replace function public.list_participant_invitation_projection()
returns table (
  id uuid, continuity_space_id uuid, invited_email text, display_name text,
  relationship text, purpose text, category_scope text[], token_hint text,
  delivery_state text, expires_at timestamp with time zone,
  accepted_at timestamp with time zone, revoked_at timestamp with time zone,
  created_at timestamp with time zone, lifecycle_state text,
  outcome_note text
)
language sql stable security invoker set search_path = ''
as $function$
  select * from passage_private.list_participant_invitation_projection()
$function$;

revoke all on function passage_private.list_owned_continuity_spaces()
  from public, anon, authenticated, service_role;
revoke all on function passage_private.list_participant_continuity_spaces()
  from public, anon, authenticated, service_role;
revoke all on function passage_private.list_continuity_participant_projection()
  from public, anon, authenticated, service_role;
revoke all on function passage_private.list_owned_continuity_participant_projection()
  from public, anon, authenticated, service_role;
revoke all on function passage_private.list_participant_invitation_projection()
  from public, anon, authenticated, service_role;

grant execute on function passage_private.list_owned_continuity_spaces()
  to authenticated;
grant execute on function passage_private.list_participant_continuity_spaces()
  to authenticated;
grant execute on function passage_private.list_continuity_participant_projection()
  to authenticated;
grant execute on function passage_private.list_owned_continuity_participant_projection()
  to authenticated;
grant execute on function passage_private.list_participant_invitation_projection()
  to authenticated;

revoke all on function public.list_owned_continuity_spaces()
  from public, anon, authenticated, service_role;
revoke all on function public.list_participant_continuity_spaces()
  from public, anon, authenticated, service_role;
revoke all on function public.list_continuity_participant_projection()
  from public, anon, authenticated, service_role;
revoke all on function public.list_owned_continuity_participant_projection()
  from public, anon, authenticated, service_role;
revoke all on function public.list_participant_invitation_projection()
  from public, anon, authenticated, service_role;

grant execute on function public.list_owned_continuity_spaces()
  to authenticated;
grant execute on function public.list_participant_continuity_spaces()
  to authenticated;
grant execute on function public.list_continuity_participant_projection()
  to authenticated;
grant execute on function public.list_owned_continuity_participant_projection()
  to authenticated;
grant execute on function public.list_participant_invitation_projection()
  to authenticated;

drop policy cycle_7b_events_authorized_select on public.workflow_events;
drop policy participant_events_authorized_select on public.workflow_events;
create policy workflow_events_authorized_select
  on public.workflow_events for select to authenticated
  using (
    passage_private.can_view_workflow_event(id)
    or (
      continuity_space_id is not null
      and passage_private.can_manage_continuity_space(continuity_space_id)
    )
  );

do $participant_advisor_postflight$
declare
  v_function_name text;
begin
  foreach v_function_name in array array[
    'list_owned_continuity_spaces',
    'list_participant_continuity_spaces',
    'list_continuity_participant_projection',
    'list_owned_continuity_participant_projection',
    'list_participant_invitation_projection'
  ]
  loop
    if not exists (
      select 1
      from pg_proc as p
      join pg_namespace as n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = v_function_name
        and p.pronargs = 0
        and not p.prosecdef
        and p.proconfig @> array['search_path=""']
        and has_function_privilege('authenticated', p.oid, 'EXECUTE')
        and not has_function_privilege('anon', p.oid, 'EXECUTE')
        and not has_function_privilege('service_role', p.oid, 'EXECUTE')
    ) or not exists (
      select 1
      from pg_proc as p
      join pg_namespace as n on n.oid = p.pronamespace
      where n.nspname = 'passage_private'
        and p.proname = v_function_name
        and p.pronargs = 0
        and p.prosecdef
        and p.proconfig @> array['search_path=""']
        and has_function_privilege('authenticated', p.oid, 'EXECUTE')
        and not has_function_privilege('anon', p.oid, 'EXECUTE')
        and not has_function_privilege('service_role', p.oid, 'EXECUTE')
    ) then
      raise exception 'Participant advisor hardening failed: wrapper/helper boundary % is incorrect',
        v_function_name;
    end if;
  end loop;

  if exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'workflow_events'
         and policyname in (
           'cycle_7b_events_authorized_select',
           'participant_events_authorized_select'
         )
     )
     or (select count(*)
         from pg_policies
         where schemaname = 'public'
           and tablename = 'workflow_events'
           and permissive = 'PERMISSIVE'
           and cmd = 'SELECT') <> 1
     or not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'workflow_events'
         and policyname = 'workflow_events_authorized_select'
         and roles = array['authenticated']::name[]
         and qual like '%can_view_workflow_event(id)%'
         and qual like '%can_manage_continuity_space(continuity_space_id)%'
     ) then
    raise exception 'Participant advisor hardening failed: consolidated event policy is incorrect';
  end if;

  if (select count(*) from public.organizations) <> 1
     or (select count(*) from public.organization_locations) <> 1
     or (select count(*) from public.workflows) <> 2
     or (select count(*) from public.tasks) <> 3
     or (select count(*) from public.workflow_events) <> 8
     or exists (select 1 from public.continuity_spaces)
     or exists (select 1 from public.continuity_participants)
     or exists (select 1 from public.participant_invitations) then
    raise exception 'Participant advisor hardening changed retained cardinality';
  end if;
end
$participant_advisor_postflight$;
