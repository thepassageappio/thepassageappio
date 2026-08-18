-- Found via the staff-persona completeness pass: a staff viewer's RLS on
-- organization_members only ever returns their own row
-- (org_members_select_own -- user_id = auth.uid()); the manager-visibility
-- policy (org_authority_members_manager_select) is owner/director-only. Every
-- other member id referenced elsewhere (task owner, proof reviewer) was
-- silently unresolvable from the staff side, so displayMember() fell through
-- to its 'Unassigned' default -- a staff member reviewing their own verified
-- proof always saw "Verified by Unassigned" instead of the director's real
-- name, on both /staff and /staff/work/[taskId].
--
-- Fix follows this session's established convention (RPC over loosened RLS):
-- a narrow lookup that only resolves specific member ids the caller already
-- knows about (from tasks/proofs they're independently authorized to see),
-- gated on the caller being any active member of that same organization --
-- it reveals display names only, not a browsable member list.
create or replace function passage_private.get_organization_member_display_names(p_organization_id uuid, p_member_ids uuid[])
returns table (
  id uuid,
  organization_id uuid,
  user_id uuid,
  email text,
  role text,
  status text,
  display_name text,
  title text,
  revoked_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not exists (
    select 1 from public.organization_members as m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  ) then
    raise exception 'Organization authority is required' using errcode = '42501';
  end if;

  return query
  select m.id, m.organization_id, m.user_id, m.email, m.role, m.status, m.display_name, m.title, m.revoked_at
  from public.organization_members as m
  where m.organization_id = p_organization_id
    and m.id = any(p_member_ids);
end
$function$;

revoke all on function passage_private.get_organization_member_display_names(uuid, uuid[]) from public, anon, authenticated;
grant execute on function passage_private.get_organization_member_display_names(uuid, uuid[]) to authenticated;

create or replace function public.get_organization_member_display_names(p_organization_id uuid, p_member_ids uuid[])
returns table (id uuid, organization_id uuid, user_id uuid, email text, role text, status text, display_name text, title text, revoked_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from passage_private.get_organization_member_display_names(p_organization_id, p_member_ids)
$$;

revoke all on function public.get_organization_member_display_names(uuid, uuid[]) from public, anon;
grant execute on function public.get_organization_member_display_names(uuid, uuid[]) to authenticated;
