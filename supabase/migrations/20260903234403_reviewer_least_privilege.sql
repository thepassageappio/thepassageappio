create or replace function authority_private.prevent_reviewer_request_coordination()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_actor uuid := coalesce((select auth.uid()), new.created_by);
  v_role text;
begin
  if not (
    (tg_op = 'INSERT' and new.status = 'draft')
    or (tg_op = 'UPDATE' and old.status = 'draft' and new.status = 'awaiting_principal')
  ) then
    return new;
  end if;

  select role into v_role
  from public.organization_memberships
  where organization_id = new.organization_id
    and user_id = v_actor
    and status = 'active';

  if v_role = 'reviewer' then
    raise exception using
      errcode = '42501',
      message = case when tg_op = 'INSERT'
        then 'authority_request_creation_not_allowed'
        else 'authority_request_activation_not_allowed'
      end;
  end if;

  return new;
end;
$$;

drop trigger if exists authority_records_reviewer_coordination_boundary on public.authority_records;

create trigger authority_records_reviewer_coordination_boundary
before insert or update on public.authority_records
for each row execute function authority_private.prevent_reviewer_request_coordination();

revoke execute on function authority_private.prevent_reviewer_request_coordination()
from public, anon, authenticated;

comment on function authority_private.prevent_reviewer_request_coordination() is
  'Keeps the controlled-MVP reviewer role independent from request creation and activation while preserving review and decision access.';
