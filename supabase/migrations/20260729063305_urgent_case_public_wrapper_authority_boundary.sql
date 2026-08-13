-- Keep the exposed command as the only authenticated entrypoint while letting
-- its unchanged typed SQL body delegate into the private schema.
do $preflight$
begin
  if to_regprocedure(
       'public.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)'
     ) is null
     or to_regprocedure(
       'passage_private.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)'
     ) is null then
    raise exception 'Urgent case command functions are missing';
  end if;
end
$preflight$;

alter function public.create_case_from_urgent_intake_idempotent(
  uuid, integer, uuid, text, text, uuid
) security definer;

alter function public.create_case_from_urgent_intake_idempotent(
  uuid, integer, uuid, text, text, uuid
) set search_path = '';

revoke all on function passage_private.create_case_from_urgent_intake_idempotent(
  uuid, integer, uuid, text, text, uuid
) from public, anon, authenticated, service_role;

revoke all on function public.create_case_from_urgent_intake_idempotent(
  uuid, integer, uuid, text, text, uuid
) from public, anon, service_role;

grant execute on function public.create_case_from_urgent_intake_idempotent(
  uuid, integer, uuid, text, text, uuid
) to authenticated;
