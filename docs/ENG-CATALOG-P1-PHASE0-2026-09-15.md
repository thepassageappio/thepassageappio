# ENG-CATALOG-P1 Phase 0 (issue #129)

**Date:** 2026-09-15  
**Status:** Shippable foundation only. Do not merge claim unlocks.

## Shipped in Phase 0

1. Additive schema: `authority_type_defs`, `permission_defs`, org offer + versioned permission item tables; `authority_records` / decision snapshot columns.
2. Seed: `financial_poa` `pack_ready=true`; other kinds `pack_ready=false`; two locked P1 acts; per-org published starter with locked labels.
3. Decision write path freezes `accepted_permissions_snapshot` / `not_included_permissions_snapshot` into receipt at decide time (still allows legacy `HOSTED_ACTIONS` when `catalog_version_id` is null).
4. Draft UI: locked labels + select-all for offered acts only.
5. Admin stub on Policies: **What people may ask for** (read-only).
6. Receipt headings: **What the bank said yes to** (snapshot-first labels).

## Explicitly not shipped (remaining for full P1)

- Owner publish / “Save for new requests” UI + AAL2 commands
- Draft pin + activation rebase against published version
- Custom permissions (`demo_only` | `production`) create/edit
- Channels list + separate channel select-all
- Catalog-aware multi-institution spawn (per-org published version on each child)
- Jurisdictions beyond NY beachhead; death / title / trustee / guardian / executor live kinds

## Claim bar (Commercial)

Live = NY financial POA + fixed two actions until acceptance bars green on Demo/UAT/prod. Do **not** unlock buyer claims for full institution catalog publish, multi-state, death/title workflows, or multi-inst-as-live.

Never recreate `PA-F39449782D`.
