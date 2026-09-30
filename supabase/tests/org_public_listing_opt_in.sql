-- Public listing opt-in: column default, search filter, set_organization_public_listing_v1.
-- All synthetic fixtures and assertions roll back; run with psql -v ON_ERROR_STOP=1.
begin;
insert into auth.users(id,email,email_confirmed_at,created_at,updated_at)
select ('15000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  'listing-'||n||'@local.authority.test',now(),now(),now()
from generate_series(1,5) n;

insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status,status)
values
  ('25000000-0000-4000-8000-000000000001','Listing Alpha Bank','Listing Alpha Bank','regional_bank','1 Test Way','Albany','NY','12207','15000000-0000-4000-8000-000000000001','ready','active'),
  ('25000000-0000-4000-8000-000000000002','Listing Beta Credit','Listing Beta Credit','credit_union','2 Test Way','Albany','NY','12207','15000000-0000-4000-8000-000000000001','ready','active'),
  ('25000000-0000-4000-8000-000000000003','Listing Gamma Firm','Listing Gamma Firm','elder_law_firm','3 Test Way','Albany','NY','12207','15000000-0000-4000-8000-000000000001','ready','active');

-- 1 owner, 2 admin, 3 staff on org 1; 4 owner on org 2.
insert into public.organization_memberships(organization_id,user_id,email_normalized,display_name,role)
values
  ('25000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000001','listing-1@local.authority.test','Owner 1','owner'),
  ('25000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000002','listing-2@local.authority.test','Admin 2','admin'),
  ('25000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000003','listing-3@local.authority.test','Staff 3','staff'),
  ('25000000-0000-4000-8000-000000000002','15000000-0000-4000-8000-000000000004','listing-4@local.authority.test','Owner 4','owner');

create temporary table listing_results(label text primary key);
grant all on listing_results to authenticated;

create function pg_temp.as_user(p_n int, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub','15000000-0000-4000-8000-'||lpad(p_n::text,12,'0'),'role','authenticated','aal',p_aal)::text, true);
$$;
create function pg_temp.expect_listing_error(
  p_label text, p_org uuid, p_listed boolean, p_version bigint, p_message text
) returns void language plpgsql security invoker as $$
declare v_message text;
begin
  begin
    perform public.set_organization_public_listing_v1(p_org, p_listed, p_version, gen_random_uuid());
    raise exception 'unexpected success';
  exception when others then
    get stacked diagnostics v_message = message_text;
    if v_message <> p_message then raise exception '%: expected %, got %', p_label, p_message, v_message; end if;
  end;
  insert into listing_results values (p_label);
end $$;
grant execute on function pg_temp.as_user(int, text) to authenticated;
grant execute on function pg_temp.expect_listing_error(text, uuid, boolean, bigint, text) to authenticated;

do $$
declare v_default boolean; v_count int;
begin
  select listed_for_public_requests into v_default
  from public.organizations where id = '25000000-0000-4000-8000-000000000001';
  if v_default is distinct from false then
    raise exception 'new org column default must be false, got %', v_default;
  end if;
  select count(*) into v_count from public.organizations
  where id in (
    '25000000-0000-4000-8000-000000000001',
    '25000000-0000-4000-8000-000000000002',
    '25000000-0000-4000-8000-000000000003'
  ) and listed_for_public_requests = true;
  if v_count <> 0 then raise exception 'no backfill: expected 0 listed rows, got %', v_count; end if;
  insert into listing_results values ('column defaults false with no backfill');
end $$;

do $$
begin
  if has_function_privilege('anon','public.set_organization_public_listing_v1(uuid,boolean,bigint,uuid)','EXECUTE')
    or has_function_privilege('anon','authority_private.set_organization_public_listing_v1(uuid,boolean,bigint,uuid)','EXECUTE') then
    raise exception 'anonymous execute exposed';
  end if;
  if (select prosecdef from pg_proc where oid='public.set_organization_public_listing_v1(uuid,boolean,bigint,uuid)'::regprocedure)
    or not (select prosecdef from pg_proc where oid='authority_private.set_organization_public_listing_v1(uuid,boolean,bigint,uuid)'::regprocedure) then
    raise exception 'wrong definer boundary';
  end if;
  insert into listing_results values ('anon denied and invoker boundary');
end $$;

-- Unlisted orgs stay out of search; listed orgs appear.
do $$
declare v jsonb;
begin
  v := authority_private.search_institutions_v1('Listing');
  if jsonb_array_length(v) <> 0 then raise exception 'unlisted orgs must not appear in search: %', v; end if;

  update public.organizations set listed_for_public_requests = true
  where id = '25000000-0000-4000-8000-000000000001';

  v := authority_private.search_institutions_v1('Listing');
  if jsonb_array_length(v) <> 1 then raise exception 'expected one listed org, got %', v; end if;
  if v->0->>'organization_id' <> '25000000-0000-4000-8000-000000000001' then
    raise exception 'wrong listed org returned: %', v;
  end if;

  -- Restore default-off for later mutation tests.
  update public.organizations set listed_for_public_requests = false
  where id = '25000000-0000-4000-8000-000000000001';

  insert into listing_results values ('search hides unlisted and shows listed');
end $$;

-- Role and MFA gating via public wrapper.
set local role authenticated;
select pg_temp.as_user(1, 'aal1');
select pg_temp.expect_listing_error(
  'owner without aal2 denied',
  '25000000-0000-4000-8000-000000000001', true, 1, 'mfa_verification_required'
);
select pg_temp.as_user(3, 'aal2');
select pg_temp.expect_listing_error(
  'staff denied',
  '25000000-0000-4000-8000-000000000001', true, 1, 'member_management_not_allowed'
);
select pg_temp.as_user(4, 'aal2');
select pg_temp.expect_listing_error(
  'other organization owner denied',
  '25000000-0000-4000-8000-000000000001', true, 1, 'member_management_not_allowed'
);
select pg_temp.as_user(2, 'aal2');
select pg_temp.expect_listing_error(
  'stale version rejected',
  '25000000-0000-4000-8000-000000000001', true, 9, 'stale_organization_version'
);
reset role;

-- Real change, idempotent replay, no-op without audit.
set local role authenticated;
select pg_temp.as_user(1, 'aal2');
create temporary table listing_replay_key(k uuid);
insert into listing_replay_key values (gen_random_uuid());
do $$
declare
  v jsonb;
  r jsonb;
  n jsonb;
  v_key uuid := (select k from listing_replay_key);
  v_event_id uuid;
  v_events int;
  v_version bigint;
begin
  v := public.set_organization_public_listing_v1(
    '25000000-0000-4000-8000-000000000001', true, 1, v_key
  );
  if (v->>'replayed')::boolean then raise exception 'first call marked replayed'; end if;
  if (v->>'listed')::boolean is not true then raise exception 'listed not set: %', v; end if;
  if (v->>'version')::bigint <> 2 then raise exception 'version not bumped: %', v; end if;
  if v->>'event_id' is null then raise exception 'event_id missing on change: %', v; end if;
  v_event_id := (v->>'event_id')::uuid;
  v_version := (v->>'version')::bigint;

  r := public.set_organization_public_listing_v1(
    '25000000-0000-4000-8000-000000000001', true, 1, v_key
  );
  if not (r->>'replayed')::boolean then raise exception 'replay must set replayed: %', r; end if;
  if (r->>'event_id')::uuid is distinct from v_event_id then raise exception 'replay changed event_id: %', r; end if;
  if (r->>'version')::bigint <> v_version then raise exception 'replay changed version: %', r; end if;

  select count(*) into v_events from public.organization_audit_events
  where organization_id = '25000000-0000-4000-8000-000000000001'
    and event_type = 'organization_public_listing_changed';
  if v_events <> 1 then raise exception 'expected one audit row after change+replay, got %', v_events; end if;

  -- No-op: already listed=true. Must not bump version or add audit.
  n := public.set_organization_public_listing_v1(
    '25000000-0000-4000-8000-000000000001', true, v_version, gen_random_uuid()
  );
  if (n->>'replayed')::boolean then raise exception 'no-op marked replayed'; end if;
  if n->>'event_id' is not null and n->>'event_id' <> 'null' then
    raise exception 'no-op must return null event_id: %', n;
  end if;
  if (n->>'version')::bigint <> v_version then raise exception 'no-op bumped version: %', n; end if;

  select count(*) into v_events from public.organization_audit_events
  where organization_id = '25000000-0000-4000-8000-000000000001'
    and event_type = 'organization_public_listing_changed';
  if v_events <> 1 then raise exception 'no-op must not add audit row, got %', v_events; end if;

  insert into listing_results values ('change bumps version, replay and no-op are clean');
end $$;

-- Admin can opt out; search follows.
select pg_temp.as_user(2, 'aal2');
do $$
declare v jsonb; v_events int;
begin
  v := public.set_organization_public_listing_v1(
    '25000000-0000-4000-8000-000000000001', false, 2, gen_random_uuid()
  );
  if (v->>'listed')::boolean is not false or (v->>'version')::bigint <> 3 then
    raise exception 'opt-out failed: %', v;
  end if;
  select count(*) into v_events from public.organization_audit_events
  where organization_id = '25000000-0000-4000-8000-000000000001'
    and event_type = 'organization_public_listing_changed';
  if v_events <> 2 then raise exception 'expected two audit rows after opt-out, got %', v_events; end if;

  v := authority_private.search_institutions_v1('Listing Alpha');
  if jsonb_array_length(v) <> 0 then raise exception 'opted-out org still in search: %', v; end if;
  insert into listing_results values ('admin opt-out updates search and audit');
end $$;
reset role;

-- Private path rejects non-manager without needing MFA (staff).
set local role authenticated;
select pg_temp.as_user(3, 'aal2');
do $$
declare v_message text;
begin
  begin
    perform authority_private.set_organization_public_listing_v1(
      '25000000-0000-4000-8000-000000000001', true, 3, gen_random_uuid()
    );
    raise exception 'unexpected success';
  exception when others then
    get stacked diagnostics v_message = message_text;
    if v_message <> 'member_management_not_allowed' then
      raise exception 'private staff deny failed: %', v_message;
    end if;
  end;
  insert into listing_results values ('private rejects non-manager');
end $$;
reset role;

do $$
declare v_count int;
begin
  select count(*) into v_count from listing_results;
  if v_count <> 10 then raise exception 'expected 10 passing checks, got %', v_count; end if;
end $$;
select label from listing_results order by label;
rollback;
