-- Inactive storage foundation: no browser grants, public RPC, publication or request backfill.
-- Store the exact bytes from capturePolicySnapshot, not a jsonb reserialization.
create function authority_private.policy_snapshot_envelope_valid_v1(p_text text, p_org uuid)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare body jsonb; source jsonb; item text; parsed_time timestamptz;
begin
  if p_text is null or p_org is null or octet_length(p_text) > 1000000 then return false; end if;
  body := p_text::jsonb;
  if jsonb_typeof(body) is distinct from 'object'
    or not (body ?& array['format','organizationId','policyVersion','effectiveFrom','sources','content'])
    or (select count(*) from jsonb_object_keys(body)) <> 6
    or body->>'format' is distinct from 'passage-policy-snapshot-v1'
    or body->>'organizationId' is distinct from p_org::text
    or jsonb_typeof(body->'content') is distinct from 'object' or body->'content' = '{}'::jsonb
    or jsonb_typeof(body->'sources') is distinct from 'object' then return false; end if;
  foreach item in array array['policyVersion','effectiveFrom'] loop
    if jsonb_typeof(body->item) is distinct from 'string' or length(body->>item) not between 1 and 200
      or btrim(body->>item) <> body->>item then return false; end if;
  end loop;
  if body->>'effectiveFrom' !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' then return false; end if;
  parsed_time := (body->>'effectiveFrom')::timestamptz;
  if to_char(parsed_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') <> body->>'effectiveFrom' then return false; end if;
  if not (body->'sources' ?& array['platform','jurisdiction','institution'])
    or (select count(*) from jsonb_object_keys(body->'sources')) <> 3 then return false; end if;
  foreach item in array array['platform','jurisdiction','institution'] loop
    source := body->'sources'->item;
    if jsonb_typeof(source) is distinct from 'object' or not (source ?& array['key','version'])
      or (select count(*) from jsonb_object_keys(source)) <> 2
      or jsonb_typeof(source->'key') is distinct from 'string'
      or jsonb_typeof(source->'version') is distinct from 'string'
      or length(source->>'key') not between 1 and 200 or length(source->>'version') not between 1 and 200
      or btrim(source->>'key') <> source->>'key' or btrim(source->>'version') <> source->>'version' then return false; end if;
  end loop;
  return true;
exception when invalid_text_representation or invalid_datetime_format or datetime_field_overflow
  or invalid_parameter_value or untranslatable_character then return false;
end;
$$;
revoke all on function authority_private.policy_snapshot_envelope_valid_v1(text,uuid) from public, anon, authenticated;
grant execute on function authority_private.policy_snapshot_envelope_valid_v1(text,uuid) to service_role;

create table authority_private.policy_snapshot_contents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  canonical_text text not null,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  captured_at timestamptz not null default clock_timestamp(),
  constraint policy_snapshot_envelope_valid check (authority_private.policy_snapshot_envelope_valid_v1(canonical_text,organization_id)),
  constraint policy_snapshot_bytes_match_hash check (sha256 = encode(sha256(convert_to(canonical_text,'UTF8')),'hex')),
  unique (organization_id, sha256),
  -- Future publication/request revision FKs must carry organization_id too.
  unique (organization_id, id)
);
alter table authority_private.policy_snapshot_contents enable row level security;
revoke all on table authority_private.policy_snapshot_contents from public, anon, authenticated, service_role;
grant select, insert on table authority_private.policy_snapshot_contents to service_role;

create function authority_private.prevent_policy_snapshot_rewrite_v1()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception using errcode = '55000', message = 'policy_snapshot_contents_are_append_only';
end;
$$;
revoke all on function authority_private.prevent_policy_snapshot_rewrite_v1() from public, anon, authenticated, service_role;
create trigger policy_snapshot_no_rewrite before update or delete on authority_private.policy_snapshot_contents
for each row execute function authority_private.prevent_policy_snapshot_rewrite_v1();
create trigger policy_snapshot_no_truncate before truncate on authority_private.policy_snapshot_contents
for each statement execute function authority_private.prevent_policy_snapshot_rewrite_v1();

comment on table authority_private.policy_snapshot_contents is
'Private append-only policy bytes. An inserted row is not publication or legal approval. No historical backfill. Future publication/request commands must authenticate, validate complete rules, write audit history and bind tenant-scoped revisions transactionally.';
comment on function authority_private.policy_snapshot_envelope_valid_v1(text,uuid) is
'Checks storage envelope shape and tenant identity, not canonical ordering or complete policy semantics. Trusted server commands must call the versioned TypeScript canonical reader/compiler before insertion. Hash constraint independently verifies exact UTF-8 bytes.';

-- Private source bytes only. Registration is not policy publication or legal approval.
create function authority_private.policy_source_envelope_valid_v1(p_text text)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare body jsonb; item text; pin jsonb; expected text[]; stamp timestamptz;
begin
  if p_text is null or octet_length(p_text) > 1000000 then return false; end if;
  body := p_text::jsonb;
  if jsonb_typeof(body) is distinct from 'object'
    or not (body ?& array['format','kind','key','version','organizationId','jurisdiction','authorityType','publishedAt','effectiveFrom','dependencies','content'])
    or (select count(*) from jsonb_object_keys(body)) <> 11
    or body->>'format' is distinct from 'passage-policy-source-v1'
    or body->>'kind' not in ('platform','jurisdiction','institution')
    or jsonb_typeof(body->'kind') is distinct from 'string'
    or jsonb_typeof(body->'content') is distinct from 'object' or body->'content' = '{}'::jsonb
    or jsonb_typeof(body->'dependencies') is distinct from 'object' then return false; end if;
  if body->>'kind' = 'institution' then
    if jsonb_typeof(body->'organizationId') is distinct from 'string'
      or body->>'organizationId' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  elsif body->'organizationId' is distinct from 'null'::jsonb then return false; end if;
  foreach item in array array['key','version','jurisdiction','authorityType','publishedAt','effectiveFrom'] loop
    if jsonb_typeof(body->item) is distinct from 'string' or length(body->>item) not between 1 and 200
      or btrim(body->>item) <> body->>item or body->>item ~ '[[:cntrl:]]' then return false; end if;
  end loop;
  foreach item in array array['publishedAt','effectiveFrom'] loop
    if body->>item !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' then return false; end if;
    stamp := (body->>item)::timestamptz;
    if to_char(stamp at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') <> body->>item then return false; end if;
  end loop;
  if body->>'publishedAt' > body->>'effectiveFrom' then return false; end if;
  expected := case body->>'kind' when 'platform' then array[]::text[] when 'jurisdiction' then array['platform'] else array['platform','jurisdiction'] end;
  if not (body->'dependencies' ?& expected) or (select count(*) from jsonb_object_keys(body->'dependencies')) <> cardinality(expected) then return false; end if;
  foreach item in array expected loop
    pin := body->'dependencies'->item;
    if jsonb_typeof(pin) is distinct from 'object' or not (pin ?& array['key','version','sha256'])
      or (select count(*) from jsonb_object_keys(pin)) <> 3
      or jsonb_typeof(pin->'key') is distinct from 'string' or length(pin->>'key') not between 1 and 200
      or btrim(pin->>'key') <> pin->>'key' or pin->>'key' ~ '[[:cntrl:]]'
      or jsonb_typeof(pin->'version') is distinct from 'string' or length(pin->>'version') not between 1 and 200
      or btrim(pin->>'version') <> pin->>'version' or pin->>'version' ~ '[[:cntrl:]]'
      or jsonb_typeof(pin->'sha256') is distinct from 'string' or pin->>'sha256' !~ '^[0-9a-f]{64}$' then return false; end if;
  end loop;
  return true;
exception when invalid_text_representation or invalid_datetime_format or datetime_field_overflow
  or invalid_parameter_value or untranslatable_character then return false;
end;
$$;
revoke all on function authority_private.policy_source_envelope_valid_v1(text) from public, anon, authenticated;
grant execute on function authority_private.policy_source_envelope_valid_v1(text) to service_role;

create table authority_private.policy_source_contents (
  id uuid primary key default gen_random_uuid(),
  canonical_text text not null check (authority_private.policy_source_envelope_valid_v1(canonical_text)),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$' and sha256 = encode(sha256(convert_to(canonical_text,'UTF8')),'hex')),
  source_kind text generated always as (canonical_text::jsonb->>'kind') stored,
  organization_id uuid generated always as ((canonical_text::jsonb->>'organizationId')::uuid) stored references public.organizations(id) on delete restrict,
  jurisdiction text generated always as (canonical_text::jsonb->>'jurisdiction') stored,
  authority_type text generated always as (canonical_text::jsonb->>'authorityType') stored,
  source_key text generated always as (canonical_text::jsonb->>'key') stored,
  source_version text generated always as (canonical_text::jsonb->>'version') stored,
  effective_from text generated always as (canonical_text::jsonb->>'effectiveFrom') stored,
  registered_at timestamptz not null default clock_timestamp(),
  unique nulls not distinct (source_kind, organization_id, jurisdiction, authority_type, source_key, source_version),
  unique nulls not distinct (source_kind, organization_id, jurisdiction, authority_type, source_key, effective_from)
);
alter table authority_private.policy_source_contents enable row level security;
revoke all on table authority_private.policy_source_contents from public, anon, authenticated, service_role;
grant select, insert on table authority_private.policy_source_contents to service_role;

create function authority_private.prevent_policy_source_rewrite_v1()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception using errcode='55000', message='policy_source_contents_are_append_only';
end;
$$;
revoke all on function authority_private.prevent_policy_source_rewrite_v1() from public, anon, authenticated, service_role;
create trigger policy_source_no_rewrite before update or delete on authority_private.policy_source_contents
for each row execute function authority_private.prevent_policy_source_rewrite_v1();
create trigger policy_source_no_truncate before truncate on authority_private.policy_source_contents
for each statement execute function authority_private.prevent_policy_source_rewrite_v1();
comment on table authority_private.policy_source_contents is
'Private append-only source bytes, not a publication registry. Metadata is generated from saved bytes. Service-only registration requires the TypeScript canonical reader. Dependency existence/compatibility, approved publisher identity, atomic publication audit and authenticated history loading remain required. No browser API or backfill.';
