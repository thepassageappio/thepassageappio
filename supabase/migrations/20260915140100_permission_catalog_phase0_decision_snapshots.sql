-- Phase 0 permission catalog scaffolding part 2 (ENG-CATALOG-P1 / #129).
-- Decision write path: freeze accepted permission labels into receipt at decide time.
-- HOSTED_ACTIONS remains fallback when catalog_version_id is null.
-- UI copy must never say "catalog" — use "What people may ask for" / "What the bank said yes to".

-- ---------------------------------------------------------------------------
-- 6. Helper: build locked Phase 0 permission snapshot items from keys
-- ---------------------------------------------------------------------------

create or replace function authority_private.permission_label_snapshot_items_v1(
  p_keys text[],
  p_outcomes jsonb default '{}'::jsonb
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(item order by ordinality), '[]'::jsonb)
  from (
    select
      ordinality,
      jsonb_build_object(
        'key', k.key,
        'kind', coalesce(d.kind, 'act'),
        'source', 'platform',
        'label', coalesce(
          d.default_label,
          case k.key
            when 'receive_duplicate_statements' then 'Get copies of account statements'
            when 'discuss_service_issues' then 'Talk with the bank about the account'
            else k.key
          end
        ),
        'help', coalesce(
          d.default_help,
          case k.key
            when 'receive_duplicate_statements' then 'The helper asks the bank to send statement copies for this account.'
            when 'discuss_service_issues' then 'The helper may call or visit to ask ordinary service questions. This does not mean they can move money.'
            else ''
          end
        ),
        'label_version', 1,
        'outcome', case
          when jsonb_typeof(p_outcomes) = 'object' then nullif(p_outcomes ->> k.key, '')
          else null
        end
      ) as item
    from unnest(coalesce(p_keys, '{}'::text[])) with ordinality as k(key, ordinality)
    left join lateral (
      select pd.kind, pd.default_label, pd.default_help
      from public.permission_defs pd
      where pd.key = k.key
        and pd.authority_type_key = 'financial_poa'
        and pd.semantic_version = '2026.9.15.1'
      limit 1
    ) d on true
    where nullif(btrim(k.key), '') is not null
  ) labeled;
$$;

revoke execute on function authority_private.permission_label_snapshot_items_v1(text[], jsonb) from public, anon, authenticated;
grant execute on function authority_private.permission_label_snapshot_items_v1(text[], jsonb) to service_role;
