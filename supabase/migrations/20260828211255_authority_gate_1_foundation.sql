create extension if not exists pgcrypto with schema extensions;

create schema if not exists authority_private;
revoke all on schema authority_private from public, anon, authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (char_length(btrim(legal_name)) between 2 and 200),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 120),
  organization_type text not null check (
    organization_type in ('regional_bank', 'credit_union', 'elder_law_firm', 'authorized_service_organization')
  ),
  website_domain text,
  address_line_1 text not null check (char_length(btrim(address_line_1)) between 2 and 160),
  address_line_2 text,
  locality text not null check (char_length(btrim(locality)) between 2 and 120),
  region text not null check (char_length(btrim(region)) between 2 and 80),
  postal_code text not null check (char_length(btrim(postal_code)) between 3 and 20),
  country_code text not null default 'US' check (country_code ~ '^[A-Z]{2}$'),
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  onboarding_status text not null default 'terms_required' check (
    onboarding_status in ('terms_required', 'template_required', 'ready')
  ),
  created_by uuid not null references auth.users(id) on delete restrict,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_created_by_idx on public.organizations(created_by);
create index organizations_status_idx on public.organizations(status);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  email_normalized text not null check (email_normalized = lower(btrim(email_normalized))),
  display_name text,
  role text not null check (role in ('owner', 'admin', 'staff', 'reviewer', 'developer', 'auditor')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  version bigint not null default 1 check (version > 0),
  activated_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id),
  check (
    (status = 'active' and revoked_at is null and revoked_by is null)
    or (status = 'revoked' and revoked_at is not null and revoked_by is not null)
  )
);

create index organization_memberships_user_status_idx
  on public.organization_memberships(user_id, status, organization_id);
create index organization_memberships_org_role_status_idx
  on public.organization_memberships(organization_id, role, status);
create unique index organization_memberships_one_active_org_per_user_idx
  on public.organization_memberships(user_id)
  where status = 'active';

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email_normalized text not null check (email_normalized = lower(btrim(email_normalized))),
  role text not null check (role in ('admin', 'staff', 'reviewer', 'developer', 'auditor')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted_by uuid references auth.users(id) on delete restrict,
  accepted_at timestamptz,
  revoked_by uuid references auth.users(id) on delete restrict,
  revoked_at timestamptz,
  expires_at timestamptz not null,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (
    (status = 'pending' and accepted_by is null and accepted_at is null and revoked_by is null and revoked_at is null)
    or (status = 'accepted' and accepted_by is not null and accepted_at is not null and revoked_by is null and revoked_at is null)
    or (status = 'revoked' and accepted_by is null and accepted_at is null and revoked_by is not null and revoked_at is not null)
    or (status = 'expired' and accepted_by is null and accepted_at is null)
  )
);

create unique index organization_invitations_one_pending_email_idx
  on public.organization_invitations(organization_id, email_normalized)
  where status = 'pending';
create index organization_invitations_org_status_idx
  on public.organization_invitations(organization_id, status, created_at desc);
create index organization_invitations_email_status_idx
  on public.organization_invitations(email_normalized, status, expires_at);

create table authority_private.organization_invitation_secrets (
  invitation_id uuid primary key references public.organization_invitations(id) on delete cascade,
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create table public.terms_documents (
  id uuid primary key default gen_random_uuid(),
  document_kind text not null check (document_kind in ('terms', 'privacy', 'authorized_use')),
  version text not null check (char_length(btrim(version)) between 1 and 40),
  title text not null,
  content_path text not null check (content_path like '/%'),
  status text not null default 'current' check (status in ('current', 'superseded')),
  effective_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (document_kind, version)
);

create unique index terms_documents_one_current_kind_idx
  on public.terms_documents(document_kind)
  where status = 'current';

create table public.organization_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  terms_document_id uuid not null references public.terms_documents(id) on delete restrict,
  request_ip text,
  user_agent text,
  accepted_at timestamptz not null default now(),
  unique (organization_id, user_id, terms_document_id)
);

create index organization_terms_acceptances_org_user_idx
  on public.organization_terms_acceptances(organization_id, user_id, accepted_at desc);
create index organization_terms_acceptances_document_idx
  on public.organization_terms_acceptances(terms_document_id);

create table public.organization_template_selections (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  template_key text not null,
  template_version text not null,
  selected_by uuid not null references auth.users(id) on delete restrict,
  selected_at timestamptz not null default now()
);

create index organization_template_selections_selected_by_idx
  on public.organization_template_selections(selected_by);

create table public.organization_audit_events (
  sequence_id bigint generated always as identity primary key,
  event_id uuid not null unique default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete restrict,
  event_type text not null,
  subject_type text not null,
  subject_id uuid,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  occurred_at timestamptz not null default now()
);

create index organization_audit_events_org_sequence_idx
  on public.organization_audit_events(organization_id, sequence_id desc);
create index organization_audit_events_actor_idx
  on public.organization_audit_events(actor_user_id, occurred_at desc);
create index organization_audit_events_subject_idx
  on public.organization_audit_events(subject_type, subject_id, occurred_at desc);

create table authority_private.command_receipts (
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  command_name text not null,
  idempotency_key uuid not null,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_at timestamptz not null default now(),
  primary key (actor_user_id, command_name, idempotency_key)
);

create or replace function authority_private.normalized_email(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(btrim(p_email));
$$;

create or replace function authority_private.payload_hash(p_payload jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(convert_to(p_payload::text, 'UTF8'), 'sha256'), 'hex');
$$;

create or replace function authority_private.current_actor_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_confirmed_at timestamptz;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select email_confirmed_at into v_confirmed_at
  from auth.users
  where id = v_actor;

  if v_confirmed_at is null then
    raise exception using errcode = '42501', message = 'verified_email_required';
  end if;

  return v_actor;
end;
$$;

create or replace function authority_private.current_actor_email()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_email text;
begin
  select lower(btrim(email)) into v_email
  from auth.users
  where id = v_actor;

  if v_email is null then
    raise exception using errcode = '42501', message = 'verified_email_required';
  end if;

  return v_email;
end;
$$;

create or replace function authority_private.has_active_membership(
  p_organization_id uuid,
  p_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = p_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and (p_roles is null or membership.role = any(p_roles))
  );
$$;

create or replace function authority_private.assert_member_manager(
  p_organization_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_role text;
begin
  select role into v_role
  from public.organization_memberships
  where organization_id = p_organization_id
    and user_id = v_actor
    and status = 'active';

  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'member_management_not_allowed';
  end if;

  return v_role;
end;
$$;

create or replace function authority_private.create_organization_v1(
  p_legal_name text,
  p_display_name text,
  p_organization_type text,
  p_website_domain text,
  p_address_line_1 text,
  p_address_line_2 text,
  p_locality text,
  p_region text,
  p_postal_code text,
  p_country_code text,
  p_authorized_use boolean,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_email text := authority_private.current_actor_email();
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_organization_id uuid;
  v_membership_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if p_authorized_use is not true then
    raise exception using errcode = '22023', message = 'authorized_use_required';
  end if;
  if p_organization_type is null
    or p_organization_type not in ('regional_bank', 'credit_union', 'elder_law_firm', 'authorized_service_organization') then
    raise exception using errcode = '22023', message = 'organization_type_invalid';
  end if;
  if nullif(btrim(p_legal_name), '') is null
    or nullif(btrim(p_display_name), '') is null
    or nullif(btrim(p_address_line_1), '') is null
    or nullif(btrim(p_locality), '') is null
    or nullif(btrim(p_region), '') is null
    or nullif(btrim(p_postal_code), '') is null then
    raise exception using errcode = '22023', message = 'organization_details_incomplete';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'legal_name', btrim(p_legal_name),
    'display_name', btrim(p_display_name),
    'organization_type', p_organization_type,
    'website_domain', lower(nullif(btrim(p_website_domain), '')),
    'address_line_1', btrim(p_address_line_1),
    'address_line_2', nullif(btrim(p_address_line_2), ''),
    'locality', btrim(p_locality),
    'region', upper(btrim(p_region)),
    'postal_code', upper(btrim(p_postal_code)),
    'country_code', upper(coalesce(nullif(btrim(p_country_code), ''), 'US')),
    'authorized_use', p_authorized_use
  ));

  perform pg_advisory_xact_lock(hashtextextended(v_actor::text || ':create_organization', 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'create_organization'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  if exists (
    select 1 from public.organization_memberships
    where user_id = v_actor and status = 'active'
  ) then
    raise exception using errcode = '23505', message = 'active_organization_already_exists';
  end if;

  insert into public.organizations (
    legal_name, display_name, organization_type, website_domain,
    address_line_1, address_line_2, locality, region, postal_code, country_code,
    created_by
  ) values (
    btrim(p_legal_name), btrim(p_display_name), p_organization_type,
    lower(nullif(btrim(p_website_domain), '')),
    btrim(p_address_line_1), nullif(btrim(p_address_line_2), ''),
    btrim(p_locality), upper(btrim(p_region)), upper(btrim(p_postal_code)),
    upper(coalesce(nullif(btrim(p_country_code), ''), 'US')),
    v_actor
  ) returning id into v_organization_id;

  insert into public.organization_memberships (
    organization_id, user_id, email_normalized, display_name, role
  ) values (
    v_organization_id, v_actor, v_email, null, 'owner'
  ) returning id into v_membership_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values
    (v_organization_id, v_actor, 'organization.created', 'organization', v_organization_id,
      jsonb_build_object('organization_type', p_organization_type)),
    (v_organization_id, v_actor, 'membership.activated', 'membership', v_membership_id,
      jsonb_build_object('role', 'owner')),
    (v_organization_id, v_actor, 'authorized_use.attested', 'organization', v_organization_id,
      jsonb_build_object('attested', true));

  v_result := jsonb_build_object(
    'organization_id', v_organization_id,
    'membership_id', v_membership_id,
    'onboarding_status', 'terms_required'
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'create_organization', p_idempotency_key, v_payload_hash, v_result
  );

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.accept_terms_v1(
  p_organization_id uuid,
  p_terms_document_id uuid,
  p_privacy_document_id uuid,
  p_authorized_use_document_id uuid,
  p_terms_accepted boolean,
  p_privacy_acknowledged boolean,
  p_data_use_attested boolean,
  p_request_ip text,
  p_user_agent text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_document_count integer;
  v_result jsonb;
begin
  if not authority_private.has_active_membership(p_organization_id, array['owner']) then
    raise exception using errcode = '42501', message = 'terms_acceptance_requires_owner';
  end if;
  if p_terms_accepted is not true or p_privacy_acknowledged is not true or p_data_use_attested is not true then
    raise exception using errcode = '22023', message = 'required_acceptances_missing';
  end if;
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'terms_document_id', p_terms_document_id,
    'privacy_document_id', p_privacy_document_id,
    'authorized_use_document_id', p_authorized_use_document_id
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text || ':accept_terms', 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'accept_terms'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select count(*) into v_document_count
  from public.terms_documents
  where status = 'current'
    and (
      (document_kind = 'terms' and id = p_terms_document_id)
      or (document_kind = 'privacy' and id = p_privacy_document_id)
      or (document_kind = 'authorized_use' and id = p_authorized_use_document_id)
    );

  if v_document_count <> 3 then
    raise exception using errcode = '22023', message = 'terms_version_changed';
  end if;

  insert into public.organization_terms_acceptances (
    organization_id, user_id, terms_document_id, request_ip, user_agent
  )
  select p_organization_id, v_actor, document_id, nullif(btrim(p_request_ip), ''), left(nullif(p_user_agent, ''), 1000)
  from unnest(array[p_terms_document_id, p_privacy_document_id, p_authorized_use_document_id]) as document_id
  on conflict (organization_id, user_id, terms_document_id) do nothing;

  update public.organizations
  set onboarding_status = 'template_required', updated_at = now(), version = version + 1
  where id = p_organization_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'organization.terms_accepted', 'organization', p_organization_id,
    jsonb_build_object(
      'terms_document_id', p_terms_document_id,
      'privacy_document_id', p_privacy_document_id,
      'authorized_use_document_id', p_authorized_use_document_id
    )
  );

  v_result := jsonb_build_object(
    'organization_id', p_organization_id,
    'onboarding_status', 'template_required'
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (v_actor, 'accept_terms', p_idempotency_key, v_payload_hash, v_result);

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.select_template_v1(
  p_organization_id uuid,
  p_template_key text,
  p_template_version text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_result jsonb;
begin
  if not authority_private.has_active_membership(p_organization_id, array['owner', 'admin']) then
    raise exception using errcode = '42501', message = 'template_selection_not_allowed';
  end if;
  if p_template_key <> 'ny_financial_poa' or p_template_version <> '2026.1' then
    raise exception using errcode = '22023', message = 'template_not_available';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'template_key', p_template_key,
    'template_version', p_template_version
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text || ':select_template', 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'select_template'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  insert into public.organization_template_selections (
    organization_id, template_key, template_version, selected_by
  ) values (
    p_organization_id, p_template_key, p_template_version, v_actor
  )
  on conflict (organization_id) do update
  set template_key = excluded.template_key,
      template_version = excluded.template_version,
      selected_by = excluded.selected_by,
      selected_at = now();

  update public.organizations
  set onboarding_status = 'ready', updated_at = now(), version = version + 1
  where id = p_organization_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'organization.template_selected', 'organization', p_organization_id,
    jsonb_build_object('template_key', p_template_key, 'template_version', p_template_version)
  );

  v_result := jsonb_build_object(
    'organization_id', p_organization_id,
    'onboarding_status', 'ready',
    'template_key', p_template_key,
    'template_version', p_template_version
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (v_actor, 'select_template', p_idempotency_key, v_payload_hash, v_result);

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.invite_member_v1(
  p_organization_id uuid,
  p_email text,
  p_role text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_actor_role text := authority_private.assert_member_manager(p_organization_id);
  v_email text := authority_private.normalized_email(p_email);
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_invitation_id uuid;
  v_expires_at timestamptz := now() + interval '7 days';
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_result jsonb;
begin
  if v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception using errcode = '22023', message = 'work_email_invalid';
  end if;
  if p_role is null or p_role not in ('admin', 'staff', 'reviewer', 'developer', 'auditor') then
    raise exception using errcode = '22023', message = 'membership_role_invalid';
  end if;
  if v_actor_role = 'admin' and p_role = 'admin' then
    raise exception using errcode = '42501', message = 'role_escalation_not_allowed';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'email', v_email,
    'role', p_role
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text || ':invite:' || v_email, 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'invite_member'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true, 'token', null);
  end if;

  if exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = p_organization_id
      and membership.email_normalized = v_email
  ) then
    raise exception using errcode = '23505', message = 'membership_already_exists';
  end if;

  if exists (
    select 1
    from public.organization_invitations invitation
    where invitation.organization_id = p_organization_id
      and invitation.email_normalized = v_email
      and invitation.status = 'pending'
  ) then
    raise exception using errcode = '23505', message = 'member_invitation_already_pending';
  end if;

  insert into public.organization_invitations (
    organization_id, email_normalized, role, invited_by, expires_at
  ) values (
    p_organization_id, v_email, p_role, v_actor, v_expires_at
  ) returning id into v_invitation_id;

  insert into authority_private.organization_invitation_secrets (invitation_id, token_hash)
  values (v_invitation_id, encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex'));

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'membership.invited', 'organization_invitation', v_invitation_id,
    jsonb_build_object('email', v_email, 'role', p_role, 'expires_at', v_expires_at)
  );

  v_result := jsonb_build_object(
    'organization_id', p_organization_id,
    'invitation_id', v_invitation_id,
    'email', v_email,
    'role', p_role,
    'expires_at', v_expires_at
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (v_actor, 'invite_member', p_idempotency_key, v_payload_hash, v_result);

  return v_result || jsonb_build_object('replayed', false, 'token', v_token);
end;
$$;

create or replace function authority_private.accept_member_invitation_v1(
  p_invitation_id uuid,
  p_token text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_email text := authority_private.current_actor_email();
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_invitation public.organization_invitations%rowtype;
  v_stored_hash text;
  v_membership_id uuid;
  v_result jsonb;
begin
  if nullif(btrim(p_token), '') is null then
    raise exception using errcode = '22023', message = 'invitation_token_required';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'invitation_id', p_invitation_id,
    'token_hash', encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex')
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_invitation_id::text || ':accept_member_invitation', 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'accept_member_invitation'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_invitation
  from public.organization_invitations
  where id = p_invitation_id
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'invitation_not_available';
  end if;
  if v_invitation.status <> 'pending' then
    raise exception using errcode = '22023', message = 'invitation_not_available';
  end if;
  if v_invitation.expires_at <= now() then
    raise exception using errcode = '22023', message = 'invitation_expired';
  end if;
  if v_invitation.email_normalized <> v_email then
    raise exception using errcode = '42501', message = 'invitation_email_mismatch';
  end if;

  select token_hash into v_stored_hash
  from authority_private.organization_invitation_secrets
  where invitation_id = p_invitation_id;

  if v_stored_hash is null
    or v_stored_hash <> encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex') then
    raise exception using errcode = '42501', message = 'invitation_not_available';
  end if;

  if exists (
    select 1 from public.organization_memberships
    where user_id = v_actor and status = 'active'
  ) then
    raise exception using errcode = '23505', message = 'active_organization_already_exists';
  end if;

  if exists (
    select 1 from public.organization_memberships
    where organization_id = v_invitation.organization_id and user_id = v_actor
  ) then
    raise exception using errcode = '23505', message = 'membership_already_exists';
  end if;

  insert into public.organization_memberships (
    organization_id, user_id, email_normalized, display_name, role
  ) values (
    v_invitation.organization_id, v_actor, v_email, null, v_invitation.role
  ) returning id into v_membership_id;

  update public.organization_invitations
  set status = 'accepted', accepted_by = v_actor, accepted_at = now(), updated_at = now(), version = version + 1
  where id = p_invitation_id;

  delete from authority_private.organization_invitation_secrets
  where invitation_id = p_invitation_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_invitation.organization_id, v_actor, 'membership.activated', 'membership', v_membership_id,
    jsonb_build_object('role', v_invitation.role, 'invitation_id', p_invitation_id)
  );

  v_result := jsonb_build_object(
    'organization_id', v_invitation.organization_id,
    'membership_id', v_membership_id,
    'role', v_invitation.role
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (v_actor, 'accept_member_invitation', p_idempotency_key, v_payload_hash, v_result);

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.get_member_invitation_summary_v1(
  p_invitation_id uuid,
  p_token text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor_email text := authority_private.current_actor_email();
  v_token_hash text;
  v_result jsonb;
begin
  if nullif(btrim(p_token), '') is null then
    raise exception using errcode = '22023', message = 'invitation_not_available';
  end if;

  v_token_hash := encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');

  select jsonb_build_object(
    'invitation_id', invitation.id,
    'organization_id', invitation.organization_id,
    'organization_name', organization.display_name,
    'email', invitation.email_normalized,
    'role', invitation.role,
    'expires_at', invitation.expires_at,
    'status', invitation.status
  ) into v_result
  from public.organization_invitations invitation
  join public.organizations organization on organization.id = invitation.organization_id
  join authority_private.organization_invitation_secrets secret on secret.invitation_id = invitation.id
  where invitation.id = p_invitation_id
    and invitation.status = 'pending'
    and invitation.expires_at > now()
    and invitation.email_normalized = v_actor_email
    and secret.token_hash = v_token_hash;

  if v_result is null then
    raise exception using errcode = '42501', message = 'invitation_not_available';
  end if;

  return v_result;
end;
$$;

create or replace function authority_private.change_member_role_v1(
  p_organization_id uuid,
  p_membership_id uuid,
  p_role text,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_actor_role text := authority_private.assert_member_manager(p_organization_id);
  v_membership public.organization_memberships%rowtype;
  v_owner_count integer;
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_result jsonb;
begin
  if p_role is null or p_role not in ('owner', 'admin', 'staff', 'reviewer', 'developer', 'auditor') then
    raise exception using errcode = '22023', message = 'membership_role_invalid';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'membership_id', p_membership_id,
    'role', p_role,
    'expected_version', p_expected_version
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text || ':membership_change', 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'change_member_role'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_membership
  from public.organization_memberships
  where id = p_membership_id and organization_id = p_organization_id
  for update;

  if not found or v_membership.status <> 'active' then
    raise exception using errcode = '22023', message = 'membership_not_available';
  end if;
  if v_membership.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'stale_membership_version';
  end if;
  if v_actor_role = 'admin'
    and (v_membership.role in ('owner', 'admin') or p_role in ('owner', 'admin')) then
    raise exception using errcode = '42501', message = 'role_escalation_not_allowed';
  end if;
  if (v_membership.role = 'owner' or p_role = 'owner') and v_actor_role <> 'owner' then
    raise exception using errcode = '42501', message = 'owner_role_requires_owner';
  end if;

  if v_membership.role = 'owner' and p_role <> 'owner' then
    select count(*) into v_owner_count
    from public.organization_memberships
    where organization_id = p_organization_id and role = 'owner' and status = 'active';
    if v_owner_count <= 1 then
      raise exception using errcode = '23514', message = 'last_owner_protected';
    end if;
  end if;

  update public.organization_memberships
  set role = p_role, version = version + 1, updated_at = now()
  where id = p_membership_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'membership.role_changed', 'membership', p_membership_id,
    jsonb_build_object('from_role', v_membership.role, 'to_role', p_role)
  );

  v_result := jsonb_build_object(
    'organization_id', p_organization_id,
    'membership_id', p_membership_id,
    'role', p_role,
    'version', p_expected_version + 1
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (v_actor, 'change_member_role', p_idempotency_key, v_payload_hash, v_result);

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.revoke_member_v1(
  p_organization_id uuid,
  p_membership_id uuid,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_actor_role text := authority_private.assert_member_manager(p_organization_id);
  v_membership public.organization_memberships%rowtype;
  v_owner_count integer;
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_result jsonb;
begin
  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'membership_id', p_membership_id,
    'expected_version', p_expected_version
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text || ':membership_revoke', 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'revoke_member'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_membership
  from public.organization_memberships
  where id = p_membership_id and organization_id = p_organization_id
  for update;

  if not found or v_membership.status <> 'active' then
    raise exception using errcode = '22023', message = 'membership_not_available';
  end if;
  if v_membership.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'stale_membership_version';
  end if;
  if v_actor_role = 'admin' and v_membership.role in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'member_revocation_not_allowed';
  end if;
  if v_membership.role = 'owner' and v_actor_role <> 'owner' then
    raise exception using errcode = '42501', message = 'owner_role_requires_owner';
  end if;

  if v_membership.role = 'owner' then
    select count(*) into v_owner_count
    from public.organization_memberships
    where organization_id = p_organization_id and role = 'owner' and status = 'active';
    if v_owner_count <= 1 then
      raise exception using errcode = '23514', message = 'last_owner_protected';
    end if;
  end if;

  update public.organization_memberships
  set status = 'revoked', revoked_at = now(), revoked_by = v_actor,
      version = version + 1, updated_at = now()
  where id = p_membership_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'membership.revoked', 'membership', p_membership_id,
    jsonb_build_object('role', v_membership.role)
  );

  v_result := jsonb_build_object(
    'organization_id', p_organization_id,
    'membership_id', p_membership_id,
    'status', 'revoked',
    'version', p_expected_version + 1
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (v_actor, 'revoke_member', p_idempotency_key, v_payload_hash, v_result);

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.revoke_member_invitation_v1(
  p_organization_id uuid,
  p_invitation_id uuid,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_actor_role text := authority_private.assert_member_manager(p_organization_id);
  v_invitation public.organization_invitations%rowtype;
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_result jsonb;
begin
  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'invitation_id', p_invitation_id,
    'expected_version', p_expected_version
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_invitation_id::text || ':invitation_revoke', 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'revoke_member_invitation'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_invitation
  from public.organization_invitations
  where id = p_invitation_id and organization_id = p_organization_id
  for update;

  if not found or v_invitation.status <> 'pending' then
    raise exception using errcode = '22023', message = 'invitation_not_available';
  end if;
  if v_invitation.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'stale_invitation_version';
  end if;
  if v_actor_role = 'admin' and v_invitation.role = 'admin' then
    raise exception using errcode = '42501', message = 'member_revocation_not_allowed';
  end if;

  update public.organization_invitations
  set status = 'revoked', revoked_by = v_actor, revoked_at = now(),
      version = version + 1, updated_at = now()
  where id = p_invitation_id;

  delete from authority_private.organization_invitation_secrets
  where invitation_id = p_invitation_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'membership.invitation_revoked', 'organization_invitation', p_invitation_id,
    jsonb_build_object('email', v_invitation.email_normalized, 'role', v_invitation.role)
  );

  v_result := jsonb_build_object(
    'organization_id', p_organization_id,
    'invitation_id', p_invitation_id,
    'status', 'revoked',
    'version', p_expected_version + 1
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (v_actor, 'revoke_member_invitation', p_idempotency_key, v_payload_hash, v_result);

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.create_organization_v1(
  p_legal_name text,
  p_display_name text,
  p_organization_type text,
  p_website_domain text,
  p_address_line_1 text,
  p_address_line_2 text,
  p_locality text,
  p_region text,
  p_postal_code text,
  p_country_code text,
  p_authorized_use boolean,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.create_organization_v1(
    p_legal_name, p_display_name, p_organization_type, p_website_domain,
    p_address_line_1, p_address_line_2, p_locality, p_region, p_postal_code,
    p_country_code, p_authorized_use, p_idempotency_key
  );
$$;

create or replace function public.accept_terms_v1(
  p_organization_id uuid,
  p_terms_document_id uuid,
  p_privacy_document_id uuid,
  p_authorized_use_document_id uuid,
  p_terms_accepted boolean,
  p_privacy_acknowledged boolean,
  p_data_use_attested boolean,
  p_request_ip text,
  p_user_agent text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.accept_terms_v1(
    p_organization_id, p_terms_document_id, p_privacy_document_id,
    p_authorized_use_document_id, p_terms_accepted, p_privacy_acknowledged,
    p_data_use_attested, p_request_ip, p_user_agent, p_idempotency_key
  );
$$;

create or replace function public.select_template_v1(
  p_organization_id uuid,
  p_template_key text,
  p_template_version text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.select_template_v1(
    p_organization_id, p_template_key, p_template_version, p_idempotency_key
  );
$$;

create or replace function public.invite_member_v1(
  p_organization_id uuid,
  p_email text,
  p_role text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.invite_member_v1(
    p_organization_id, p_email, p_role, p_idempotency_key
  );
$$;

create or replace function public.accept_member_invitation_v1(
  p_invitation_id uuid,
  p_token text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.accept_member_invitation_v1(
    p_invitation_id, p_token, p_idempotency_key
  );
$$;

create or replace function public.get_member_invitation_summary_v1(
  p_invitation_id uuid,
  p_token text
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select authority_private.get_member_invitation_summary_v1(p_invitation_id, p_token);
$$;

create or replace function public.change_member_role_v1(
  p_organization_id uuid,
  p_membership_id uuid,
  p_role text,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.change_member_role_v1(
    p_organization_id, p_membership_id, p_role, p_expected_version, p_idempotency_key
  );
$$;

create or replace function public.revoke_member_v1(
  p_organization_id uuid,
  p_membership_id uuid,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.revoke_member_v1(
    p_organization_id, p_membership_id, p_expected_version, p_idempotency_key
  );
$$;

create or replace function public.revoke_member_invitation_v1(
  p_organization_id uuid,
  p_invitation_id uuid,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.revoke_member_invitation_v1(
    p_organization_id, p_invitation_id, p_expected_version, p_idempotency_key
  );
$$;

alter table public.organizations enable row level security;
alter table public.organizations force row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_memberships force row level security;
alter table public.organization_invitations enable row level security;
alter table public.organization_invitations force row level security;
alter table public.terms_documents enable row level security;
alter table public.terms_documents force row level security;
alter table public.organization_terms_acceptances enable row level security;
alter table public.organization_terms_acceptances force row level security;
alter table public.organization_template_selections enable row level security;
alter table public.organization_template_selections force row level security;
alter table public.organization_audit_events enable row level security;
alter table public.organization_audit_events force row level security;

create policy organizations_member_select
on public.organizations for select to authenticated
using ((select authority_private.has_active_membership(id)));

create policy memberships_authorized_select
on public.organization_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or (select authority_private.has_active_membership(
    organization_id, array['owner', 'admin', 'auditor']
  ))
);

create policy invitations_manager_select
on public.organization_invitations for select to authenticated
using ((select authority_private.has_active_membership(
  organization_id, array['owner', 'admin', 'auditor']
)));

create policy terms_documents_public_select
on public.terms_documents for select to anon, authenticated
using (status = 'current');

create policy terms_acceptances_authorized_select
on public.organization_terms_acceptances for select to authenticated
using (
  user_id = (select auth.uid())
  or (select authority_private.has_active_membership(
    organization_id, array['owner', 'admin', 'auditor']
  ))
);

create policy template_selections_member_select
on public.organization_template_selections for select to authenticated
using ((select authority_private.has_active_membership(organization_id)));

create policy audit_events_authorized_select
on public.organization_audit_events for select to authenticated
using ((select authority_private.has_active_membership(
  organization_id, array['owner', 'admin', 'auditor']
)));

revoke all on all tables in schema public from anon, authenticated;
grant select on public.terms_documents to anon, authenticated;
grant select on public.organizations to authenticated;
grant select on public.organization_memberships to authenticated;
grant select on public.organization_invitations to authenticated;
grant select on public.organization_terms_acceptances to authenticated;
grant select on public.organization_template_selections to authenticated;
grant select on public.organization_audit_events to authenticated;

revoke all on all tables in schema authority_private from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;

revoke execute on all functions in schema authority_private from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant usage on schema authority_private to authenticated;
grant execute on function authority_private.has_active_membership(uuid, text[]) to authenticated;
grant execute on function authority_private.create_organization_v1(text, text, text, text, text, text, text, text, text, text, boolean, uuid) to authenticated;
grant execute on function authority_private.accept_terms_v1(uuid, uuid, uuid, uuid, boolean, boolean, boolean, text, text, uuid) to authenticated;
grant execute on function authority_private.select_template_v1(uuid, text, text, uuid) to authenticated;
grant execute on function authority_private.invite_member_v1(uuid, text, text, uuid) to authenticated;
grant execute on function authority_private.accept_member_invitation_v1(uuid, text, uuid) to authenticated;
grant execute on function authority_private.get_member_invitation_summary_v1(uuid, text) to authenticated;
grant execute on function authority_private.change_member_role_v1(uuid, uuid, text, bigint, uuid) to authenticated;
grant execute on function authority_private.revoke_member_v1(uuid, uuid, bigint, uuid) to authenticated;
grant execute on function authority_private.revoke_member_invitation_v1(uuid, uuid, bigint, uuid) to authenticated;

grant execute on function public.create_organization_v1(text, text, text, text, text, text, text, text, text, text, boolean, uuid) to authenticated;
grant execute on function public.accept_terms_v1(uuid, uuid, uuid, uuid, boolean, boolean, boolean, text, text, uuid) to authenticated;
grant execute on function public.select_template_v1(uuid, text, text, uuid) to authenticated;
grant execute on function public.invite_member_v1(uuid, text, text, uuid) to authenticated;
grant execute on function public.accept_member_invitation_v1(uuid, text, uuid) to authenticated;
grant execute on function public.get_member_invitation_summary_v1(uuid, text) to authenticated;
grant execute on function public.change_member_role_v1(uuid, uuid, text, bigint, uuid) to authenticated;
grant execute on function public.revoke_member_v1(uuid, uuid, bigint, uuid) to authenticated;
grant execute on function public.revoke_member_invitation_v1(uuid, uuid, bigint, uuid) to authenticated;

insert into public.terms_documents (
  document_kind, version, title, content_path, status, effective_at
) values
  ('terms', 'evaluation-2026.1', 'Evaluation Terms', '/legal/terms', 'current', '2026-08-27T00:00:00Z'),
  ('privacy', 'evaluation-2026.1', 'Evaluation Privacy Notice', '/legal/privacy', 'current', '2026-08-27T00:00:00Z'),
  ('authorized_use', 'evaluation-2026.1', 'Authorized Use Attestation', '/legal/authorized-use', 'current', '2026-08-27T00:00:00Z');

comment on schema authority_private is 'Non-exposed Authority command and secret boundary.';
comment on table public.organizations is 'Isolated customer organizations for Passage Authority.';
comment on table public.organization_memberships is 'Durable organization authorization. User metadata is not an authorization source.';
comment on table public.organization_invitations is 'Expiring team invitations. Raw tokens are never stored in this table.';
comment on table public.organization_audit_events is 'Append-only organization access and administrative events.';
