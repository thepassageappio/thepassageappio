-- A16 deterministic New York-style discovery fixture.
-- This is additive sample data for isolated Preview verification only.
-- It does not identify or contact a real funeral home and grants no authority.

do $preflight$
begin
  if (
    select system_identifier
    from pg_catalog.pg_control_system()
  ) is distinct from 7656983981618135123::bigint then
    raise exception using
      errcode = '42501',
      message = 'A16 New York sample refused: exact isolated cluster attestation failed';
  end if;

  if to_regclass('passage_private.synthetic_provider_directory') is null
     or not exists (
       select 1
       from supabase_migrations.schema_migrations
       where name = 'family_provider_discovery'
     )
     or (select count(*)
         from passage_private.synthetic_provider_directory) <> 6
     or exists (
       select 1
       from passage_private.synthetic_provider_directory
       where source_key = 'main-street-new-york'
     ) then
    raise exception using
      errcode = '55000',
      message = 'A16 New York sample refused: provider directory baseline drifted';
  end if;
end
$preflight$;

insert into passage_private.synthetic_provider_directory (
  source_key,
  dataset_version,
  display_name,
  address_line1,
  locality,
  administrative_area,
  postal_code,
  country_code,
  organization_id,
  organization_location_id
) values (
  'main-street-new-york',
  '2026-07-a16-v1',
  'Main Street Memorial Home',
  '10 Main Street',
  'New York',
  'NY',
  '10001',
  'US',
  null,
  null
);

do $assertions$
begin
  if (select count(*)
      from passage_private.synthetic_provider_directory) <> 7
     or (select count(*)
         from passage_private.synthetic_provider_directory
         where source_key = 'main-street-new-york'
           and display_name = 'Main Street Memorial Home'
           and address_line1 = '10 Main Street'
           and locality = 'New York'
           and administrative_area = 'NY'
           and postal_code = '10001'
           and organization_id is null
           and organization_location_id is null) <> 1 then
    raise exception 'A16 New York sample verification failed';
  end if;
end
$assertions$;
