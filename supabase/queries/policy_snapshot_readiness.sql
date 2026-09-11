-- Read-only, aggregate-only baseline before introducing immutable policy snapshots.
-- Counts are observations, not a legal-policy or data-integrity verdict.
with per_record as (
  select r.template_key, r.template_version, r.activated_at is not null as activated,
    count(e.event_id) as creation_events,
    count(e.event_id) filter (where nullif(btrim(e.payload->>'template_key'), '') is null
      or nullif(btrim(e.payload->>'template_version'), '') is null) as missing_identifiers,
    count(e.event_id) filter (where e.payload->>'template_key' is distinct from r.template_key
      or e.payload->>'template_version' is distinct from r.template_version) as different_identifiers,
    count(e.event_id) filter (where jsonb_typeof(e.payload->'policy_snapshot') = 'object') as snapshot_objects
  from public.authority_records r
  left join public.authority_events e on e.authority_record_id = r.id
    and e.organization_id = r.organization_id and e.event_type = 'authority.draft_created'
  group by r.id, r.template_key, r.template_version, r.activated_at
)
select template_key, template_version,
  count(*) as records,
  count(*) filter (where activated) as activated_records,
  count(*) filter (where creation_events = 0) as records_without_creation_event,
  count(*) filter (where creation_events > 1) as records_with_multiple_creation_events,
  coalesce(sum(missing_identifiers), 0) as creation_events_missing_identifiers,
  coalesce(sum(different_identifiers), 0) as creation_events_with_different_identifiers,
  coalesce(sum(snapshot_objects), 0) as creation_events_with_snapshot_object
from per_record
group by template_key, template_version
order by template_key, template_version;
