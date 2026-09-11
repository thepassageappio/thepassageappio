# Policy overview shows only a confirmed selection

The read-only policy page previously displayed “Active” and defaulted to version `2026.1` when its organization selection was missing or its lookup failed. It also displayed New York sample rules for any returned template. That could present an unconfirmed policy as an active one.

The page now distinguishes a confirmed supported selection, no selection, a failed lookup and an unsupported saved key/version. Only the saved `ny_financial_poa` / `2026.1` selection displays the current sample rules and “Selected” badge. Failed lookups provide a native GET “Reload policy” button and never display internal errors. Missing/unsupported records direct the person to their organization owner. The wording describes a saved selection without implying the future policy-publishing workflow already exists.

## Verification

- Eight real-page render cases passed: absent selection, failed read, failed read with returned data, unsupported key, future version, empty version, supported selection, and no membership. The test asserts the organization filter and proves no read occurs without membership. Query outcomes are mocked; this is not hosted authorization evidence.
- The actual page markup and stylesheet passed 28 Chromium layout cases at 1280/390/360/320px. Retry received keyboard focus and met the 44px height requirement. No page overflow was observed. Selected and failed-read screenshots were inspected at 320px.
- A direct local read found five existing synthetic selections, all using the supported key/version. No data was changed. The existing query still uses [Supabase maybeSingle](https://supabase.com/docs/reference/javascript/using-modifiers-maybesingle), which reports zero/one-row results separately from errors.
- Full lint, all 172 domain tests, TypeScript and the final optimized build passed.

## Remaining policy work

This fixes the overview; it does not implement policy authoring or publication. POL1 remains open. Next build immutable policy versions and complete request snapshots, then authenticated owner/admin draft/publish commands and exact diffs, stale-draft activation checks and explicit rebase. Publish only after proving that existing activated records and receipts stay unchanged. Follow the existing institution-policy requirements; do not turn locked legal rules into editable business settings.

Hosted cancellation replay and UAT preview SSO remain open. Both Vercel checks for prior commit `107b7f246eb5ab43aaafa0dfd8c042f20bd0c705` were successful; that is not deployment proof for this new change. No migration, provider send, merge, production release or outreach occurred.
