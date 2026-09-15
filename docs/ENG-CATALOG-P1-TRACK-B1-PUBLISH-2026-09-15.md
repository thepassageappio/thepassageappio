# ENG-CATALOG-P1 Track B1 — publish / Save for new requests (#129)

**Date:** 2026-09-15  
**Status:** Shippable Track B1 only. Do not merge claim unlocks.  
**Base tip:** `a57bc72` (main).

## Steve lock (institution library)

Permission libraries are **per authority kind**, not global. Requestors select from that institution’s **published list for that kind**. This PR scopes publish + offered list to **`financial_poa` only**. Death / vehicle / other kinds stay `pack_ready=false` / hidden and must not appear in the published list or Policies UI.

## Shipped in this PR (B1)

1. **Publish RPCs** (versioned, immutable):
   - `get_published_permission_catalog_v1(org, authority_type_key)` — read offered production items for one kind.
   - `publish_permission_catalog_v1(...)` — “Save for new requests”: supersede prior published row for that kind, insert new published version + copied items, owner/admin **AAL2**, expected-version + idempotency. Hard-rejects non-`financial_poa` and non-`pack_ready` kinds.
2. **Staff UI** on `/app/policies`: shows **Version used on new requests**, the offered NY financial POA acts (locked two labels), and primary **Save for new requests**. Plain language; UI never says “catalog”; no multi-state / buyer-configure claims.
3. Warns that open drafts keep their existing list until updated; publish does **not** rewrite in-flight `catalog_version_id` pins.
4. Migration + helper parse tests.

## Explicitly still open

| Track | Work |
| --- | --- |
| **C** | Draft pin on create + stale-draft activate block + rebase UI |
| **D** | Custom permission CRUD (`demo_only` \| `production`) |
| After D | Channels list + separate channel select-all |
| Later | Other authority kinds when `pack_ready`; jurisdictions beyond NY beachhead |

## Claim bar (Commercial)

Live = **NY financial POA + fixed two actions** until acceptance bars green. Do **not** unlock buyer claims for full institution configure, multi-state, death/title workflows, or multi-inst-as-live.

Never recreate `PA-F39449782D`. Do not merge #109 as part of this work.
