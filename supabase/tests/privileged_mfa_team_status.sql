-- All synthetic fixtures and assertions roll back; run with psql -v ON_ERROR_STOP=1.
begin;
insert into auth.users(id,email,email_confirmed_at,created_at,updated_at)
select ('13000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  'mfa-team-'||n||'@local.authority.test',now(),now(),now()
from generate_series(1,6) n;
insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status)
select ('23000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
'MFA Team Test','MFA Team Test','regional_bank','1 Test Way','Albany','NY','12207',
'13000000-0000-4000-8000-000000000001','ready' from generate_series(1,2) n;
insert into public.organization_memberships(organization_id,user_id,email_normalized,display_name,role)
select ('23000000-0000-4000-8000-'||lpad((case when n=6 then 2 else 1 end)::text,12,'0'))::uuid,
('13000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
'mfa-team-'||n||'@local.authority.test','Member '||n,
case n when 1 then 'owner' when 4 then 'staff' when 6 then 'owner' else 'admin' end
from generate_series(1,6) n;
update public.organization_memberships set status='revoked',revoked_at=now(),revoked_by='13000000-0000-4000-8000-000000000001'
where user_id='13000000-0000-4000-8000-000000000005';
insert into auth.mfa_factors(id,user_id,friendly_name,factor_type,status,created_at,updated_at,secret)
select gen_random_uuid(),('13000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
'Test factor '||s,'totp',case when s=3 then 'unverified'::auth.factor_status else 'verified'::auth.factor_status end,
now(),now(),'synthetic-secret'
from (values (1,1),(1,2),(1,3),(2,1),(3,3),(5,1),(6,1)) v(n,s);

create temporary table mfa_status_results(label text primary key);
grant all on mfa_status_results to authenticated;
create function pg_temp.expect_mfa_denied(p_label text,p_org uuid,p_message text)
returns void language plpgsql security invoker as $$
declare v_message text;
begin
  begin
    perform public.get_privileged_mfa_status_v1(p_org);
    raise exception 'unexpected success';
  exception when others then
    get stacked diagnostics v_message=message_text;
    if v_message<>p_message then raise exception '%: %',p_label,v_message; end if;
  end;
  insert into mfa_status_results values(p_label);
end $$;

do $$
begin
  if has_function_privilege('anon','public.get_privileged_mfa_status_v1(uuid)','EXECUTE')
    or has_function_privilege('anon','authority_private.get_privileged_mfa_status_v1(uuid)','EXECUTE') then
    raise exception 'anonymous execute exposed';
  end if;
  if (select prosecdef from pg_proc where oid='public.get_privileged_mfa_status_v1(uuid)'::regprocedure)
    or not (select prosecdef from pg_proc where oid='authority_private.get_privileged_mfa_status_v1(uuid)'::regprocedure) then
    raise exception 'wrong definer boundary';
  end if;
  insert into mfa_status_results values('anon denied and invoker boundary');
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"13000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}',true);
select pg_temp.expect_mfa_denied('owner aal1','23000000-0000-4000-8000-000000000001','mfa_verification_required');
select set_config('request.jwt.claims','{"sub":"13000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}',true);
select pg_temp.expect_mfa_denied('admin aal1','23000000-0000-4000-8000-000000000001','mfa_verification_required');
select set_config('request.jwt.claims','{"sub":"13000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}',true);
select pg_temp.expect_mfa_denied('foreign organization','23000000-0000-4000-8000-000000000002','mfa_status_not_allowed');
do $$
declare v jsonb; counts jsonb;
begin
  v:=public.get_privileged_mfa_status_v1('23000000-0000-4000-8000-000000000001');
  if jsonb_array_length(v->'members')<>3 then raise exception 'membership scope leaked'; end if;
  select jsonb_agg((m->>'verified_totp_count')::int order by m->>'email') into counts from jsonb_array_elements(v->'members') m;
  if counts<>'[2,1,0]'::jsonb then raise exception 'wrong verified counts: %',counts; end if;
  if exists(select 1 from jsonb_array_elements(v->'members') m where
    (select array_agg(k order by k) from jsonb_object_keys(m) k) <>
    array['display_name','email','membership_id','role','verified_totp_count']::text[]) then
    raise exception 'unexpected sensitive fields';
  end if;
  if v->>'captured_at' is null then raise exception 'missing timestamp'; end if;
  insert into mfa_status_results values('owner aal2: scope, counts, minimal fields');
end $$;
select set_config('request.jwt.claims','{"sub":"13000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal2"}',true);
do $$ begin
  if jsonb_array_length(public.get_privileged_mfa_status_v1('23000000-0000-4000-8000-000000000001')->'members')<>3 then raise exception 'admin result mismatch'; end if;
  insert into mfa_status_results values('admin aal2 allowed');
end $$;
select set_config('request.jwt.claims','{"sub":"13000000-0000-4000-8000-000000000004","role":"authenticated","aal":"aal2"}',true);
select pg_temp.expect_mfa_denied('staff denied','23000000-0000-4000-8000-000000000001','mfa_status_not_allowed');
select set_config('request.jwt.claims','{"sub":"13000000-0000-4000-8000-000000000005","role":"authenticated","aal":"aal2"}',true);
select pg_temp.expect_mfa_denied('revoked admin denied','23000000-0000-4000-8000-000000000001','mfa_status_not_allowed');
reset role;
update public.organizations set status='suspended' where id='23000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"13000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}',true);
select pg_temp.expect_mfa_denied('suspended organization','23000000-0000-4000-8000-000000000001','mfa_status_not_allowed');
reset role;
update public.organizations set status='active',onboarding_status='terms_required' where id='23000000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.expect_mfa_denied('incomplete onboarding','23000000-0000-4000-8000-000000000001','mfa_status_not_allowed');
reset role;
update auth.users set email_confirmed_at=null where id='13000000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.expect_mfa_denied('unverified email','23000000-0000-4000-8000-000000000001','verified_email_required');
reset role;
select count(*) as passed_assertion_groups from mfa_status_results;
rollback;
