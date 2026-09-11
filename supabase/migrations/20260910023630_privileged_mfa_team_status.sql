-- Read-only enrollment inventory. Never expose factor identifiers or secrets.
create function authority_private.get_privileged_mfa_status_v1(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_members jsonb;
begin
  if not exists (
    select 1 from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = p_organization_id and m.user_id = v_actor
      and m.status = 'active' and m.role in ('owner', 'admin')
      and o.status = 'active' and o.onboarding_status = 'ready'
  ) then
    raise exception using errcode = '42501', message = 'mfa_status_not_allowed';
  end if;
  perform authority_private.require_privileged_mfa_v1(p_organization_id);

  select coalesce(jsonb_agg(jsonb_build_object(
    'membership_id', m.id, 'display_name', m.display_name,
    'email', m.email_normalized, 'role', m.role,
    'verified_totp_count', (
      select count(*) from auth.mfa_factors f
      where f.user_id = m.user_id and f.factor_type = 'totp' and f.status = 'verified'
    )
  ) order by m.role desc, m.email_normalized), '[]'::jsonb)
  into v_members
  from public.organization_memberships m
  where m.organization_id = p_organization_id and m.status = 'active'
    and m.role in ('owner', 'admin');

  return jsonb_build_object('captured_at', statement_timestamp(), 'members', v_members);
end;
$$;

create function public.get_privileged_mfa_status_v1(p_organization_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$ select authority_private.get_privileged_mfa_status_v1(p_organization_id); $$;

revoke all on function authority_private.get_privileged_mfa_status_v1(uuid) from public, anon;
revoke all on function public.get_privileged_mfa_status_v1(uuid) from public, anon;
grant execute on function authority_private.get_privileged_mfa_status_v1(uuid) to authenticated;
grant execute on function public.get_privileged_mfa_status_v1(uuid) to authenticated;
