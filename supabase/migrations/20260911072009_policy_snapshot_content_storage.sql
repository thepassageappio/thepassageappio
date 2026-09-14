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
