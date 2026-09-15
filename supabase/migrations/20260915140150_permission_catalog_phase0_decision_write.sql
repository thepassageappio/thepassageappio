-- Phase 0: freeze permission labels at decide time via BEFORE INSERT trigger (#129).
-- Frozen permission labels land on accepted_permissions_snapshot / not_included_permissions_snapshot.
-- HOSTED_ACTIONS remains fallback when catalog_version_id is null.

create or replace function authority_private.freeze_decision_permission_labels_trg()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_record public.authority_records%rowtype;
  v_outcomes jsonb := '{}'::jsonb;
  v_key text;
  v_not_included text[];
  v_catalog_version text;
  v_content_hash text;
  v_outcome text;
begin
  if NEW.accepted_permissions_snapshot is not null then
    return NEW;
  end if;
  select * into v_record from public.authority_records where id = NEW.authority_record_id;
  if not found then
    return NEW;
  end if;
  v_outcome := NEW.outcome;
  foreach v_key in array coalesce(v_record.allowed_action_keys, '{}'::text[])
  loop
    if v_key = any (coalesce(NEW.accepted_action_keys, '{}'::text[])) then
      v_outcomes := v_outcomes || jsonb_build_object(
        v_key,
        case when v_outcome = 'accepted_with_limits' then 'accepted_with_limits' else 'permitted' end
      );
    else
      v_outcomes := v_outcomes || jsonb_build_object(v_key, 'not_included');
    end if;
  end loop;
  select coalesce(array_agg(k order by k), '{}'::text[]) into v_not_included
  from (
    select unnest(v_record.allowed_action_keys) as k
    except
    select unnest(coalesce(NEW.accepted_action_keys, '{}'::text[]))
  ) missing;
  if v_record.catalog_version_id is not null then
    select v.version, v.content_hash into v_catalog_version, v_content_hash
    from public.organization_permission_catalog_versions v
    where v.id = v_record.catalog_version_id;
  end if;
  NEW.accepted_permissions_snapshot := jsonb_build_object(
    'catalog_version_id', v_record.catalog_version_id,
    'catalog_version', v_catalog_version,
    'authority_type_key', coalesce(v_record.authority_type_key, 'financial_poa'),
    'content_hash', coalesce(v_record.policy_content_hash, v_content_hash),
    'legacy_provenance', v_record.catalog_version_id is null,
    'items', authority_private.permission_label_snapshot_items_v1(NEW.accepted_action_keys, v_outcomes)
  );
  NEW.not_included_permissions_snapshot := jsonb_build_object(
    'catalog_version_id', v_record.catalog_version_id,
    'catalog_version', v_catalog_version,
    'authority_type_key', coalesce(v_record.authority_type_key, 'financial_poa'),
    'content_hash', coalesce(v_record.policy_content_hash, v_content_hash),
    'legacy_provenance', v_record.catalog_version_id is null,
    'items', authority_private.permission_label_snapshot_items_v1(v_not_included, v_outcomes)
  );
  if NEW.receipt_snapshot is not null and jsonb_typeof(NEW.receipt_snapshot) = 'object' then
    NEW.receipt_snapshot := NEW.receipt_snapshot
      || jsonb_build_object(
        'accepted_permissions_snapshot', NEW.accepted_permissions_snapshot,
        'not_included_permissions_snapshot', NEW.not_included_permissions_snapshot
      );
  end if;
  return NEW;
end;
$$;

drop trigger if exists authority_institution_decisions_freeze_labels_trg on public.authority_institution_decisions;
create trigger authority_institution_decisions_freeze_labels_trg
before insert on public.authority_institution_decisions
for each row
execute function authority_private.freeze_decision_permission_labels_trg();

revoke all on function authority_private.freeze_decision_permission_labels_trg() from public, anon, authenticated;
grant execute on function authority_private.freeze_decision_permission_labels_trg() to service_role;

comment on function authority_private.freeze_decision_permission_labels_trg() is
  'Frozen permission labels: fills accepted/not_included snapshots at decide-time insert when null.';
