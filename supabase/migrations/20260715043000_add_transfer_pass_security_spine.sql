-- Passage Transfer Pass security spine.
-- Additive only. Apply to an isolated Supabase sandbox and run the permission
-- matrix before any production consideration. This migration makes no legal or
-- compliance assertion about the meaning of a Transfer Pass.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.transfer_pass_scope_is_valid(p_scope jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $
  select coalesce(
    jsonb_typeof(p_scope) = 'object'
    and jsonb_typeof(p_scope -> 'items') = 'array'
    and jsonb_array_length(p_scope -> 'items') > 0,
    false
  );
$;

create table public.transfer_pass_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete restrict,
  issuer_user_id uuid not null references auth.users(id) on delete restrict,
  recipient_organization_id uuid not null references public.organizations(id) on delete restrict,
  recipient_display_name text,
  scope_version smallint not null default 1 check (scope_version > 0),
  scope_snapshot jsonb not null check (public.transfer_pass_scope_is_valid(scope_snapshot)),
  qr_token_hash bytea not null unique,
  manual_code_hash bytea not null unique,
  state text not null default 'issued' check (state in ('issued', 'accepted', 'revoked')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transfer_pass_id_workflow_unique unique (id, workflow_id),
  constraint transfer_pass_expiry_after_creation check (expires_at > created_at),
  constraint transfer_pass_acceptance_consistent check (
    (state <> 'accepted') or (accepted_at is not null and accepted_by is not null)
  ),
  constraint transfer_pass_revocation_consistent check (
    (state <> 'revoked') or (revoked_at is not null and revoked_by is not null)
  )
);

create index transfer_pass_tokens_workflow_created_idx
  on public.transfer_pass_tokens (workflow_id, created_at desc);
create index transfer_pass_tokens_recipient_state_expiry_idx
  on public.transfer_pass_tokens (recipient_organization_id, state, expires_at);
create index transfer_pass_tokens_issuer_created_idx
  on public.transfer_pass_tokens (issuer_user_id, created_at desc);

create table public.transfer_pass_consents (
  id uuid primary key default extensions.gen_random_uuid(),
  transfer_pass_id uuid not null references public.transfer_pass_tokens(id) on delete restrict,
  workflow_id uuid not null references public.workflows(id) on delete restrict,
  event_type text not null check (
    event_type in ('issued', 'viewed', 'accepted', 'revoked', 'expired', 'packet_generated')
  ),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_organization_id uuid references public.organizations(id) on delete set null,
  actor_kind text not null check (actor_kind in ('family', 'recipient', 'system')),
  channel text not null check (channel in ('qr', 'manual', 'system')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now(),
  constraint transfer_pass_consent_matches_workflow
    foreign key (transfer_pass_id, workflow_id)
    references public.transfer_pass_tokens(id, workflow_id)
    on delete restrict
);

create index transfer_pass_consents_pass_occurred_idx
  on public.transfer_pass_consents (transfer_pass_id, occurred_at desc);
create index transfer_pass_consents_workflow_occurred_idx
  on public.transfer_pass_consents (workflow_id, occurred_at desc);

create or replace function public.transfer_pass_is_controller(p_workflow_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    exists (
      select 1
      from public.workflows w
      where w.id = p_workflow_id
        and (
          w.user_id = auth.uid()
          or (
            w.coordinator_email is not null
            and lower(w.coordinator_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          )
        )
    )
    or exists (
      select 1
      from public.estate_access ea
      where ea.workflow_id = p_workflow_id
        and ea.status = 'accepted'
        and ea.role in ('owner', 'operator')
        and (
          ea.user_id = auth.uid()
          or (
            ea.email is not null
            and lower(ea.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          )
        )
    )
  );
$$;

create or replace function public.transfer_pass_is_active_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.status = 'active'
      and (
        om.user_id = auth.uid()
        or (
          om.email is not null
          and lower(om.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
      )
  );
$$;

create or replace function public.prevent_transfer_pass_identity_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.workflow_id is distinct from old.workflow_id
    or new.issuer_user_id is distinct from old.issuer_user_id
    or new.recipient_organization_id is distinct from old.recipient_organization_id
    or new.recipient_display_name is distinct from old.recipient_display_name
    or new.scope_version is distinct from old.scope_version
    or new.scope_snapshot is distinct from old.scope_snapshot
    or new.qr_token_hash is distinct from old.qr_token_hash
    or new.manual_code_hash is distinct from old.manual_code_hash
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Transfer Pass identity and scope are immutable; revoke and issue a new pass';
  end if;
  return new;
end;
$$;

create trigger transfer_pass_tokens_immutable_identity
before update on public.transfer_pass_tokens
for each row execute function public.prevent_transfer_pass_identity_mutation();

create or replace function public.prevent_transfer_pass_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Transfer Pass consent events are append-only';
end;
$$;

create trigger transfer_pass_consents_append_only
before update or delete on public.transfer_pass_consents
for each row execute function public.prevent_transfer_pass_event_mutation();

alter table public.transfer_pass_tokens enable row level security;
alter table public.transfer_pass_tokens force row level security;
alter table public.transfer_pass_consents enable row level security;
alter table public.transfer_pass_consents force row level security;

create policy transfer_pass_tokens_issuer_select
on public.transfer_pass_tokens
for select
to authenticated
using (issuer_user_id = auth.uid());

create policy transfer_pass_consents_controller_or_recipient_select
on public.transfer_pass_consents
for select
to authenticated
using (
  public.transfer_pass_is_controller(workflow_id)
  or exists (
    select 1
    from public.transfer_pass_tokens t
    where t.id = transfer_pass_id
      and public.transfer_pass_is_active_org_member(t.recipient_organization_id)
  )
);

revoke all on public.transfer_pass_tokens from anon, authenticated;
revoke all on public.transfer_pass_consents from anon, authenticated;
grant select (
  id, workflow_id, issuer_user_id, recipient_organization_id,
  recipient_display_name, scope_version, scope_snapshot, state, expires_at,
  accepted_at, accepted_by, revoked_at, revoked_by, created_at, updated_at
) on public.transfer_pass_tokens to authenticated;
grant select (
  id, transfer_pass_id, workflow_id, event_type, actor_user_id,
  actor_organization_id, actor_kind, channel, metadata, occurred_at
) on public.transfer_pass_consents to authenticated;
grant all on public.transfer_pass_tokens to service_role;
grant all on public.transfer_pass_consents to service_role;

create or replace function public.issue_transfer_pass(
  p_workflow_id uuid,
  p_recipient_organization_id uuid,
  p_recipient_display_name text,
  p_scope_snapshot jsonb,
  p_expires_at timestamptz
)
returns table (
  pass_id uuid,
  qr_secret text,
  manual_code text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pass_id uuid := extensions.gen_random_uuid();
  v_qr_secret text := encode(extensions.gen_random_bytes(32), 'hex');
  v_manual_code text := upper(encode(extensions.gen_random_bytes(10), 'hex'));
begin
  if auth.uid() is null or coalesce(auth.role(), '') = 'anon' then
    raise exception 'Authentication required';
  end if;
  if not public.transfer_pass_is_controller(p_workflow_id) then
    raise exception 'Estate controller access required';
  end if;
  if not exists (select 1 from public.organizations o where o.id = p_recipient_organization_id) then
    raise exception 'Recipient organization not found';
  end if;
  if not public.transfer_pass_scope_is_valid(p_scope_snapshot) then
    raise exception 'Transfer Pass scope must contain a non-empty items array';
  end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '30 days' then
    raise exception 'Expiry must be in the future and no more than 30 days away';
  end if;

  insert into public.transfer_pass_tokens (
    id, workflow_id, issuer_user_id, recipient_organization_id,
    recipient_display_name, scope_snapshot, qr_token_hash,
    manual_code_hash, expires_at
  ) values (
    v_pass_id, p_workflow_id, auth.uid(), p_recipient_organization_id,
    nullif(trim(p_recipient_display_name), ''), p_scope_snapshot,
    extensions.digest(convert_to(v_qr_secret, 'UTF8'), 'sha256'),
    extensions.digest(convert_to(v_manual_code, 'UTF8'), 'sha256'),
    p_expires_at
  );

  insert into public.transfer_pass_consents (
    transfer_pass_id, workflow_id, event_type, actor_user_id,
    actor_kind, channel, metadata
  ) values (
    v_pass_id, p_workflow_id, 'issued', auth.uid(),
    'family', 'system', jsonb_build_object('scope_version', 1)
  );

  return query select v_pass_id, v_qr_secret, v_manual_code, p_expires_at;
end;
$$;

create or replace function public.resolve_transfer_pass(
  p_secret text,
  p_channel text
)
returns table (
  pass_id uuid,
  workflow_id uuid,
  recipient_organization_id uuid,
  recipient_display_name text,
  scope_version smallint,
  scope_snapshot jsonb,
  state text,
  expires_at timestamptz,
  accepted_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pass public.transfer_pass_tokens%rowtype;
  v_hash bytea;
  v_channel text := lower(trim(p_channel));
begin
  if auth.uid() is null or v_channel not in ('qr', 'manual') then
    raise exception 'Authenticated QR or manual resolution required';
  end if;
  v_hash := extensions.digest(convert_to(trim(p_secret), 'UTF8'), 'sha256');

  select t.* into v_pass
  from public.transfer_pass_tokens t
  where (v_channel = 'qr' and t.qr_token_hash = v_hash)
     or (v_channel = 'manual' and t.manual_code_hash = v_hash)
  limit 1;

  if v_pass.id is null
    or v_pass.state = 'revoked'
    or v_pass.expires_at <= now()
    or not public.transfer_pass_is_active_org_member(v_pass.recipient_organization_id)
  then
    raise exception 'Transfer Pass is invalid, unavailable, expired, or revoked';
  end if;

  insert into public.transfer_pass_consents (
    transfer_pass_id, workflow_id, event_type, actor_user_id,
    actor_organization_id, actor_kind, channel
  ) values (
    v_pass.id, v_pass.workflow_id, 'viewed', auth.uid(),
    v_pass.recipient_organization_id, 'recipient', v_channel
  );

  return query select
    v_pass.id, v_pass.workflow_id, v_pass.recipient_organization_id,
    v_pass.recipient_display_name, v_pass.scope_version,
    v_pass.scope_snapshot, v_pass.state, v_pass.expires_at,
    v_pass.accepted_at;
end;
$$;

create or replace function public.accept_transfer_pass(
  p_secret text,
  p_channel text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pass public.transfer_pass_tokens%rowtype;
  v_hash bytea;
  v_channel text := lower(trim(p_channel));
begin
  if auth.uid() is null or v_channel not in ('qr', 'manual') then
    raise exception 'Authenticated QR or manual acceptance required';
  end if;
  v_hash := extensions.digest(convert_to(trim(p_secret), 'UTF8'), 'sha256');

  select t.* into v_pass
  from public.transfer_pass_tokens t
  where ((v_channel = 'qr' and t.qr_token_hash = v_hash)
     or (v_channel = 'manual' and t.manual_code_hash = v_hash))
  for update;

  if v_pass.id is null
    or v_pass.state = 'revoked'
    or v_pass.expires_at <= now()
    or not public.transfer_pass_is_active_org_member(v_pass.recipient_organization_id)
  then
    raise exception 'Transfer Pass is invalid, unavailable, expired, or revoked';
  end if;

  if v_pass.state = 'issued' then
    update public.transfer_pass_tokens
    set state = 'accepted', accepted_at = now(), accepted_by = auth.uid(), updated_at = now()
    where id = v_pass.id;

    insert into public.transfer_pass_consents (
      transfer_pass_id, workflow_id, event_type, actor_user_id,
      actor_organization_id, actor_kind, channel
    ) values (
      v_pass.id, v_pass.workflow_id, 'accepted', auth.uid(),
      v_pass.recipient_organization_id, 'recipient', v_channel
    );
  end if;

  return v_pass.id;
end;
$$;

create or replace function public.revoke_transfer_pass(p_pass_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pass public.transfer_pass_tokens%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select t.* into v_pass
  from public.transfer_pass_tokens t
  where t.id = p_pass_id
  for update;

  if v_pass.id is null
    or not (
      v_pass.issuer_user_id = auth.uid()
      or public.transfer_pass_is_controller(v_pass.workflow_id)
    )
  then
    raise exception 'Transfer Pass not found or access denied';
  end if;

  if v_pass.state <> 'revoked' then
    update public.transfer_pass_tokens
    set state = 'revoked', revoked_at = now(), revoked_by = auth.uid(), updated_at = now()
    where id = v_pass.id;

    insert into public.transfer_pass_consents (
      transfer_pass_id, workflow_id, event_type, actor_user_id,
      actor_kind, channel
    ) values (
      v_pass.id, v_pass.workflow_id, 'revoked', auth.uid(),
      'family', 'system'
    );
  end if;

  return true;
end;
$$;

revoke all on function public.transfer_pass_scope_is_valid(jsonb) from public;
revoke all on function public.transfer_pass_is_controller(uuid) from public;
revoke all on function public.transfer_pass_is_active_org_member(uuid) from public;
revoke all on function public.issue_transfer_pass(uuid, uuid, text, jsonb, timestamptz) from public, anon;
revoke all on function public.resolve_transfer_pass(text, text) from public, anon;
revoke all on function public.accept_transfer_pass(text, text) from public, anon;
revoke all on function public.revoke_transfer_pass(uuid) from public, anon;

grant execute on function public.transfer_pass_scope_is_valid(jsonb) to authenticated, service_role;
grant execute on function public.transfer_pass_is_controller(uuid) to authenticated, service_role;
grant execute on function public.transfer_pass_is_active_org_member(uuid) to authenticated, service_role;
grant execute on function public.issue_transfer_pass(uuid, uuid, text, jsonb, timestamptz) to authenticated;
grant execute on function public.resolve_transfer_pass(text, text) to authenticated;
grant execute on function public.accept_transfer_pass(text, text) to authenticated;
grant execute on function public.revoke_transfer_pass(uuid) to authenticated;
