-- Team invitation "Resend invite" / "Copy invite link" (reissue_member_invitation_v1).
-- All synthetic fixtures and assertions roll back; run with psql -v ON_ERROR_STOP=1.
begin;
insert into auth.users(id,email,email_confirmed_at,created_at,updated_at)
select ('14000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  'reissue-'||n||'@local.authority.test',now(),now(),now()
from generate_series(1,8) n;
insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status)
select ('24000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
'Reissue Test','Reissue Test','regional_bank','1 Test Way','Albany','NY','12207',
'14000000-0000-4000-8000-000000000001','ready' from generate_series(1,2) n;
-- 1 owner, 2 admin, 3 staff, 4 reviewer (org 1); 6 owner (org 2). 5, 7 and 8 are invitees.
insert into public.organization_memberships(organization_id,user_id,email_normalized,display_name,role)
select ('24000000-0000-4000-8000-'||lpad((case when n=6 then 2 else 1 end)::text,12,'0'))::uuid,
('14000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
'reissue-'||n||'@local.authority.test','Member '||n,
case n when 1 then 'owner' when 2 then 'admin' when 3 then 'staff' when 4 then 'reviewer' else 'owner' end
from (values (1),(2),(3),(4),(6)) v(n);

create temporary table reissue_results(label text primary key);
create temporary table reissue_tokens(label text primary key, invitation_id uuid, token text, version bigint);
grant all on reissue_results, reissue_tokens to authenticated;

create function pg_temp.as_user(p_n int, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub','14000000-0000-4000-8000-'||lpad(p_n::text,12,'0'),'role','authenticated','aal',p_aal)::text, true);
$$;
create function pg_temp.expect_reissue_error(p_label text, p_invitation uuid, p_version bigint, p_purpose text, p_message text, p_org uuid default '24000000-0000-4000-8000-000000000001')
returns void language plpgsql security invoker as $$
declare v_message text;
begin
  begin
    perform public.reissue_member_invitation_v1(p_org, p_invitation, p_version, p_purpose, gen_random_uuid());
    raise exception 'unexpected success';
  exception when others then
    get stacked diagnostics v_message = message_text;
    if v_message <> p_message then raise exception '%: expected %, got %', p_label, p_message, v_message; end if;
  end;
  insert into reissue_results values (p_label);
end $$;
grant execute on function pg_temp.as_user(int, text) to authenticated;
grant execute on function pg_temp.expect_reissue_error(text, uuid, bigint, text, text, uuid) to authenticated;

do $$
begin
  if has_function_privilege('anon','public.reissue_member_invitation_v1(uuid,uuid,bigint,text,uuid)','EXECUTE')
    or has_function_privilege('anon','authority_private.reissue_member_invitation_v1(uuid,uuid,bigint,text,uuid)','EXECUTE') then
    raise exception 'anonymous execute exposed';
  end if;
  if (select prosecdef from pg_proc where oid='public.reissue_member_invitation_v1(uuid,uuid,bigint,text,uuid)'::regprocedure)
    or not (select prosecdef from pg_proc where oid='authority_private.reissue_member_invitation_v1(uuid,uuid,bigint,text,uuid)'::regprocedure) then
    raise exception 'wrong definer boundary';
  end if;
  insert into reissue_results values ('anon denied and invoker boundary');
end $$;

-- Owner creates three invitations: staff (5), admin (7), reviewer (8).
set local role authenticated;
select pg_temp.as_user(1, 'aal2');
do $$
declare v jsonb;
begin
  v := public.invite_member_v1('24000000-0000-4000-8000-000000000001','reissue-5@local.authority.test','staff',gen_random_uuid());
  insert into reissue_tokens values ('staff-original', (v->>'invitation_id')::uuid, v->>'token', 1);
  v := public.invite_member_v1('24000000-0000-4000-8000-000000000001','reissue-7@local.authority.test','admin',gen_random_uuid());
  insert into reissue_tokens values ('admin-invite', (v->>'invitation_id')::uuid, v->>'token', 1);
  v := public.invite_member_v1('24000000-0000-4000-8000-000000000001','reissue-8@local.authority.test','reviewer',gen_random_uuid());
  insert into reissue_tokens values ('reviewer-invite', (v->>'invitation_id')::uuid, v->>'token', 1);
end $$;

-- Role gating.
select pg_temp.as_user(1, 'aal1');
select pg_temp.expect_reissue_error('owner without aal2 denied', (select invitation_id from reissue_tokens where label='staff-original'), 1, 'copy_link', 'mfa_verification_required');
select pg_temp.as_user(3, 'aal2');
select pg_temp.expect_reissue_error('staff denied', (select invitation_id from reissue_tokens where label='staff-original'), 1, 'copy_link', 'member_management_not_allowed');
select pg_temp.as_user(4, 'aal2');
select pg_temp.expect_reissue_error('reviewer denied', (select invitation_id from reissue_tokens where label='staff-original'), 1, 'resend', 'member_management_not_allowed');
select pg_temp.as_user(6, 'aal2');
select pg_temp.expect_reissue_error('other organization owner denied', (select invitation_id from reissue_tokens where label='staff-original'), 1, 'copy_link', 'member_management_not_allowed');
select pg_temp.expect_reissue_error('other organization id cannot reach invitation', (select invitation_id from reissue_tokens where label='staff-original'), 1, 'copy_link', 'invitation_not_available', '24000000-0000-4000-8000-000000000002');
select pg_temp.as_user(2, 'aal2');
select pg_temp.expect_reissue_error('admin cannot reissue admin invitation', (select invitation_id from reissue_tokens where label='admin-invite'), 1, 'copy_link', 'member_management_not_allowed');
select pg_temp.expect_reissue_error('bad purpose rejected', (select invitation_id from reissue_tokens where label='reviewer-invite'), 1, 'email_everyone', 'invitation_reissue_purpose_invalid');
select pg_temp.expect_reissue_error('stale version rejected', (select invitation_id from reissue_tokens where label='reviewer-invite'), 9, 'copy_link', 'stale_invitation_version');
do $$
declare v jsonb;
begin
  v := public.reissue_member_invitation_v1('24000000-0000-4000-8000-000000000001',
    (select invitation_id from reissue_tokens where label='reviewer-invite'), 1, 'resend', gen_random_uuid());
  if v->>'token' is null or (v->>'version')::bigint <> 2 then raise exception 'admin reissue of reviewer invitation failed: %', v; end if;
  insert into reissue_results values ('admin can reissue reviewer invitation');
end $$;
reset role;

-- Seed delivery tracking on the staff invitation so the reset is observable.
update public.organization_invitations
set delivery_status='delivered', delivery_provider='resend', delivery_provider_message_id='msg-old',
    delivery_confirmed_at=now(), delivery_last_event_at=now(), delivery_attempts=1
where id=(select invitation_id from reissue_tokens where label='staff-original');

-- Owner copies a fresh link for the staff invitation.
set local role authenticated;
select pg_temp.as_user(1, 'aal2');
create temporary table reissue_replay_key(k uuid);
insert into reissue_replay_key values (gen_random_uuid());
do $$
declare v jsonb; r jsonb; v_key uuid := (select k from reissue_replay_key);
begin
  v := public.reissue_member_invitation_v1('24000000-0000-4000-8000-000000000001',
    (select invitation_id from reissue_tokens where label='staff-original'), 1, 'copy_link', v_key);
  if v->>'token' is null or v->>'token' !~ '^[0-9a-f]{64}$' then raise exception 'no fresh token'; end if;
  if v->>'token' = (select token from reissue_tokens where label='staff-original') then raise exception 'token was not rotated'; end if;
  if (v->>'replayed')::boolean then raise exception 'first call marked replayed'; end if;
  if (v->>'version')::bigint <> 2 then raise exception 'version not bumped'; end if;
  if (v->>'expires_at')::timestamptz < now() + interval '6 days 23 hours' then raise exception 'expiry window not restarted'; end if;
  insert into reissue_tokens values ('staff-rotated', (v->>'invitation_id')::uuid, v->>'token', 2);

  r := public.reissue_member_invitation_v1('24000000-0000-4000-8000-000000000001',
    (select invitation_id from reissue_tokens where label='staff-original'), 1, 'copy_link', v_key);
  if not (r->>'replayed')::boolean or r->'token' <> 'null'::jsonb then raise exception 'replay must not return a token: %', r; end if;
  insert into reissue_results values ('fresh token returned once, replay returns no token');
end $$;
reset role;

do $$
declare v_inv public.organization_invitations%rowtype; v_hash text; v_events int; v_payload jsonb;
begin
  select * into v_inv from public.organization_invitations where id=(select invitation_id from reissue_tokens where label='staff-original');
  if v_inv.delivery_status<>'pending' or v_inv.delivery_provider<>'manual_link' or v_inv.delivery_provider_message_id is not null
    or v_inv.delivery_confirmed_at is not null or v_inv.delivery_error_code is not null then
    raise exception 'delivery tracking not reset: %', row_to_json(v_inv);
  end if;
  select token_hash into v_hash from authority_private.organization_invitation_secrets where invitation_id=v_inv.id;
  if v_hash <> encode(extensions.digest(convert_to((select token from reissue_tokens where label='staff-rotated'),'UTF8'),'sha256'),'hex') then
    raise exception 'stored hash does not match the new token';
  end if;
  if v_hash = encode(extensions.digest(convert_to((select token from reissue_tokens where label='staff-original'),'UTF8'),'sha256'),'hex') then
    raise exception 'old hash still stored';
  end if;
  insert into reissue_results values ('stored hash replaced');

  select count(*) into v_events from public.organization_audit_events
  where subject_type='organization_invitation' and subject_id=v_inv.id and event_type='membership.invitation_link_copied';
  if v_events <> 1 then raise exception 'expected exactly one link_copied audit event (replay must not add one), got %', v_events; end if;
  select payload into v_payload from public.organization_audit_events
  where subject_id=v_inv.id and event_type='membership.invitation_link_copied';
  if (select actor_user_id from public.organization_audit_events where subject_id=v_inv.id and event_type='membership.invitation_link_copied')
    <> '14000000-0000-4000-8000-000000000001' then raise exception 'wrong audit actor'; end if;
  if v_payload ? 'token' or v_payload ? 'token_hash' or v_payload::text ~ '[0-9a-f]{64}' then raise exception 'audit payload leaks token material'; end if;
  if v_payload->>'purpose' <> 'copy_link' or (v_payload->>'previous_version')::int <> 1 or (v_payload->>'version')::int <> 2 then
    raise exception 'audit payload incomplete: %', v_payload;
  end if;
  if (select count(*) from public.organization_audit_events where subject_id=(select invitation_id from reissue_tokens where label='reviewer-invite') and event_type='membership.invitation_resent') <> 1 then
    raise exception 'resend audit event missing';
  end if;
  insert into reissue_results values ('one audit row inserted per reissue, no token material');

  begin
    update public.organization_audit_events set payload='{}'::jsonb where subject_id=v_inv.id;
    raise exception 'audit update unexpectedly allowed';
  exception when others then
    if sqlerrm <> 'organization_audit_events_are_append_only' then raise; end if;
  end;
  insert into reissue_results values ('audit stays append-only');
end $$;

-- The invitee: old token fails, new token works.
set local role authenticated;
select pg_temp.as_user(5, 'aal1');
do $$
declare v_message text; v jsonb;
begin
  begin
    perform public.accept_member_invitation_v1((select invitation_id from reissue_tokens where label='staff-original'),
      (select token from reissue_tokens where label='staff-original'), gen_random_uuid());
    raise exception 'old token unexpectedly accepted';
  exception when others then
    get stacked diagnostics v_message = message_text;
    if v_message <> 'invitation_not_available' then raise exception 'old token failed for the wrong reason: %', v_message; end if;
  end;
  insert into reissue_results values ('old token no longer accepted');
  v := public.accept_member_invitation_v1((select invitation_id from reissue_tokens where label='staff-original'),
    (select token from reissue_tokens where label='staff-rotated'), gen_random_uuid());
  insert into reissue_results values ('new token accepted');
end $$;

-- Accepted invitations cannot be reissued.
select pg_temp.as_user(1, 'aal2');
select pg_temp.expect_reissue_error('accepted invitation cannot be reissued', (select invitation_id from reissue_tokens where label='staff-original'), 3, 'copy_link', 'invitation_not_available');

-- Rate limit: reviewer invitation already has one reissue; four more pass, the next fails.
do $$
declare v jsonb; v_version bigint := 2;
begin
  for i in 1..4 loop
    v := public.reissue_member_invitation_v1('24000000-0000-4000-8000-000000000001',
      (select invitation_id from reissue_tokens where label='reviewer-invite'), v_version, 'copy_link', gen_random_uuid());
    v_version := (v->>'version')::bigint;
  end loop;
  insert into reissue_tokens values ('reviewer-latest', (v->>'invitation_id')::uuid, v->>'token', v_version);
end $$;
select pg_temp.expect_reissue_error('sixth reissue in an hour is refused', (select invitation_id from reissue_tokens where label='reviewer-invite'), (select version from reissue_tokens where label='reviewer-latest'), 'copy_link', 'invitation_reissue_limit_reached');
reset role;

-- Expired invitations are not reissued; they need a new invitation.
update public.organization_invitations
set created_at = now() - interval '9 days', expires_at = now() - interval '2 days'
where id=(select invitation_id from reissue_tokens where label='admin-invite');
set local role authenticated;
select pg_temp.as_user(1, 'aal2');
select pg_temp.expect_reissue_error('expired invitation refused', (select invitation_id from reissue_tokens where label='admin-invite'), 1, 'copy_link', 'invitation_expired');
reset role;

do $$
declare v_count int;
begin
  select count(*) into v_count from reissue_results;
  if v_count <> 19 then raise exception 'expected 19 passing checks, got %', v_count; end if;
end $$;
select label from reissue_results order by label;
rollback;
