-- Closes M3 exit criterion 5's one knowingly-uncovered site (roadmap,
-- "Named recovery owner for every failure"): app/organization/start/actions.ts's
-- trial-deal creation runs on the user-context client (a Server Action
-- responding to a real signup request), and crm_sync_events has RLS enabled
-- with zero policies, so a direct authenticated-role insert would be
-- silently blocked -- not a real fix. The service-role client
-- (createPassageServiceClient) is explicitly documented as forbidden here
-- ("Never import this into anything that runs in response to a user
-- request"), so this follows the same SECURITY DEFINER RPC convention used
-- everywhere else in this session rather than reaching for that shortcut.
-- Deliberately narrow: only ever writes a bounded audit-log row (source,
-- event_type, email, status='failed', error), nothing else.
create or replace function passage_private.log_crm_sync_failure(p_source text, p_event_type text, p_email text, p_error text)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if nullif(btrim(coalesce(p_source, '')), '') is null or nullif(btrim(coalesce(p_event_type, '')), '') is null then
    raise exception 'A source and event type are required' using errcode = '22023';
  end if;

  insert into public.crm_sync_events (source, event_type, email, status, error)
  values (btrim(p_source), btrim(p_event_type), nullif(btrim(coalesce(p_email, '')), ''), 'failed', nullif(btrim(coalesce(p_error, '')), ''));
end
$function$;

revoke all on function passage_private.log_crm_sync_failure(text, text, text, text) from public, anon, authenticated;
grant execute on function passage_private.log_crm_sync_failure(text, text, text, text) to authenticated;

create or replace function public.log_crm_sync_failure(source text, event_type text, email text, error text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select passage_private.log_crm_sync_failure(source, event_type, email, error)
$$;

revoke all on function public.log_crm_sync_failure(text, text, text, text) from public, anon;
grant execute on function public.log_crm_sync_failure(text, text, text, text) to authenticated;
