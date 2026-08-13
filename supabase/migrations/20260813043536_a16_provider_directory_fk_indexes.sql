-- A16 isolated-lab advisor hardening.
-- What: add one covering index for each provider-directory organization FK.
-- Why: provider handoff rows must not force scans when their referenced
-- organization or location is updated or removed.
-- Breakage if skipped: Supabase's performance advisor continues to report two
-- unindexed foreign keys and referential operations can scan the directory.
-- Recovery: both indexes are owned by the A16 directory and disappear with it
-- in the rollback-only reversal. No row, authority, RPC, RLS, or data changes.
-- Target: isolated project uyacxqtsiwlvtmhxvoxr only. Production project
-- qsveqfchwylsbncsfgxe is forbidden.

do $a16_provider_fk_index_preflight$
declare
  v_index_name text;
  v_column_name text;
begin
  if session_user <> 'postgres'
     or current_user <> 'postgres'
     or (
       select system_identifier
       from pg_catalog.pg_control_system()
     ) is distinct from 7656983981618135123::bigint then
    raise exception using
      errcode = '42501',
      message = 'A16 provider FK indexes refused: exact isolated postgres attestation failed';
  end if;

  if to_regclass('passage_private.synthetic_provider_directory') is null
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'family_provider_discovery'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'a16_new_york_sample'
     )
     or not exists (
       select 1
       from pg_constraint
       where conrelid = 'passage_private.synthetic_provider_directory'::regclass
         and contype = 'f'
         and conname = 'synthetic_provider_directory_organization_id_fkey'
         and confrelid = 'public.organizations'::regclass
     )
     or not exists (
       select 1
       from pg_constraint
       where conrelid = 'passage_private.synthetic_provider_directory'::regclass
         and contype = 'f'
         and conname = 'synthetic_provider_directory_organization_location_id_fkey'
         and confrelid = 'public.organization_locations'::regclass
     ) then
    raise exception using
      errcode = '55000',
      message = 'A16 provider FK indexes refused: reviewed directory dependencies are missing';
  end if;

  for v_index_name, v_column_name in values
    ('synthetic_provider_directory_organization_id_idx', 'organization_id'),
    ('synthetic_provider_directory_organization_location_id_idx', 'organization_location_id')
  loop
    if to_regclass('passage_private.' || v_index_name) is not null
       and not exists (
         select 1
         from pg_index as i
         join pg_class as idx on idx.oid = i.indexrelid
         where i.indrelid = 'passage_private.synthetic_provider_directory'::regclass
           and idx.relname = v_index_name
           and i.indisvalid
           and i.indisready
           and not i.indisunique
           and i.indpred is null
           and i.indexprs is null
           and i.indnkeyatts = 1
           and i.indnatts = 1
           and pg_catalog.pg_get_indexdef(i.indexrelid, 1, true) = v_column_name
       ) then
      raise exception using
        errcode = '42P07',
        message = format('A16 provider FK index %s exists with an unexpected definition', v_index_name);
    end if;
  end loop;
end
$a16_provider_fk_index_preflight$;

create index if not exists synthetic_provider_directory_organization_id_idx
  on passage_private.synthetic_provider_directory (organization_id);
create index if not exists synthetic_provider_directory_organization_location_id_idx
  on passage_private.synthetic_provider_directory (organization_location_id);

do $a16_provider_fk_index_postcheck$
begin
  if not exists (
       select 1
       from pg_index as i
       join pg_class as idx on idx.oid = i.indexrelid
       where i.indrelid = 'passage_private.synthetic_provider_directory'::regclass
         and idx.relname = 'synthetic_provider_directory_organization_id_idx'
         and i.indisvalid
         and i.indisready
         and not i.indisunique
         and i.indpred is null
         and i.indexprs is null
         and i.indnkeyatts = 1
         and i.indnatts = 1
         and pg_catalog.pg_get_indexdef(i.indexrelid, 1, true) = 'organization_id'
     )
     or not exists (
       select 1
       from pg_index as i
       join pg_class as idx on idx.oid = i.indexrelid
       where i.indrelid = 'passage_private.synthetic_provider_directory'::regclass
         and idx.relname = 'synthetic_provider_directory_organization_location_id_idx'
         and i.indisvalid
         and i.indisready
         and not i.indisunique
         and i.indpred is null
         and i.indexprs is null
         and i.indnkeyatts = 1
         and i.indnatts = 1
         and pg_catalog.pg_get_indexdef(i.indexrelid, 1, true) = 'organization_location_id'
     ) then
    raise exception using
      errcode = '55000',
      message = 'A16 provider FK index postcondition failed';
  end if;
end
$a16_provider_fk_index_postcheck$;
