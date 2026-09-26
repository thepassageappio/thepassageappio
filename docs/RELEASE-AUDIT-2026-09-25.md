# Release and unfinished-work audit — September 25, 2026

## Verified release

GitHub main, Demo `/api/version`, and www `/api/version` all reported
`1af3a1a74e6e906b666979dec12ac9b51bd4676e`. Both endpoints reported verified
GitHub/main provenance and no issues. No newer merged application release was
waiting to deploy. Release checks passed on that exact commit:
https://github.com/thepassageappio/thepassageappio/actions/runs/35894059514

Fresh checks in this audit:

- Public release verification: 44 routes and eight recovery states passed across
  Demo and www. These are HTTP/content checks, not authenticated persona QA.
- Domain regression tests: 267 passed, zero failed.
- Both inspected local checkouts were clean before work began. The main checkout
  was fast-forwarded to the current remote main.

The Vercel connector returned 403 when listing Passage deployments. Deployment
IDs, current account quota, runtime logs, and hosted database migration definitions
were not independently verified in this audit.
Old September 15 Preview rate-limit comments are historical, not evidence of a
current account-wide block. Do not redeploy merely to test quota.

Both Supabase projects report ACTIVE_HEALTHY. Read-only SQL confirms four
consecutive clean internal reconciliation days in each: September 22–25 UTC.
September 25 recorded at 08:23:55.505187 UTC on Demo and 08:31:33.757689 UTC on
UAT. September 23 and 24 were also recorded shortly after 08:00 UTC. No job was
rerun and no missing historical day was credited. Earliest possible day seven
is September 28 UTC, conditional on every remaining day being clean. This is
internal reconciliation, not independent Stripe/HubSpot comparison.

## Owner-approved scope and prior evidence

The owner conversation records approval for guided Path B buyer demos. It also
records a passing narrow Open authorized source -> first Accept check on
PA-5173907668 after PR #160. This is prior reported evidence; this audit did not
repeat its authenticated workflow or send participant invitations.

Outbound remains HOLD. No new sell-clean, seven-minute, frictionless self-serve,
real-data pilot, live API/core-sync, or additional-jurisdiction claim is approved.
The resolved receipt/source-download defects are not reopened by this audit.

## Open work disposition

### PR #119 — superseded daily reconciliation scheduler

https://github.com/thepassageappio/thepassageappio/pull/119

The proposed GitHub workflow references nonexistent `pnpm/action-setup@v9` and
requires four repository secrets. The repository secrets API returned zero
repository secrets during this audit. This is not a statement about environment
or organization secrets.

Current main already has the Vercel schedule `0 8 * * *` in `vercel.json`, calling
`/api/internal/reconciliation/process`. Commit `2a347df` added that scheduler.
The handler authenticates with CRON_SECRET and calls the existing daily RPC.
Its tests cover unauthorized rejection, replay, variance, and sanitized failure.

Retire #119 as superseded rather than introduce a second scheduler or claim its
missing configuration works. A configured schedule is not proof of daily runs:
read the immutable hosted evidence before reporting a streak. Never backfill
missed days or repeat a provider send for evidence.

### PR #143 — unfinished permission publication

https://github.com/thepassageappio/thepassageappio/pull/143

A fresh merge-tree check conflicts in `src/app/app/policies/page.tsx`. The PR's
publication RPC is not sufficient to make its "Save for new requests" promise
true. Current NY governing snapshots capture jurisdiction rules, but do not
include the published permission-catalog version. They do not close the catalog
binding review finding. Custom permission editing is also outside this PR.

Required completion is one coherent implementation: published-version selection
on draft creation, immutable version/content snapshot, publication-change
activation rejection, explicit pre-activation rebase, and unchanged activated
requests and historical receipts. Prove permissions, MFA, cross-tenant denial,
idempotency, and old/new draft behavior with SQL and hosted persona evidence.
Resolve the policies-page conflict against the current jurisdiction/rebase UI.
Do not apply these migrations or expose publication before those checks pass.

### Other open proposals

- #117 is September 15 operational documentation. Its then-current health and
  streak assertions must not overwrite newer evidence. This checkpoint supersedes
  its current-state role; preserve its historical content in the PR.
- #109 is explicitly incomplete policy groundwork. Keep it unmerged; do not
  combine it wholesale with current main.
- Older funeral-home / Passage Zero branches (#41, #60, #61, #70, #71, #74,
  #76, #79, #87, #89) belong to earlier product/release tracks. They are not
  pending Authority production releases and were left untouched.

## Next engineering priorities

1. Continue the verified 4/7 internal reconciliation streak; report actual dated
   evidence and distinguish internal checks from independent provider comparison.
2. Complete #143 as the version-bound workflow above if institution permission
   publication is the selected next feature. It is not needed to repeat the
   currently approved guided demo of the fixed two-action NY workflow.
3. Preserve the guided-demo scope while customer discovery determines the next
   product investment. D2C recipient adoption and real-data readiness remain
   separate tests, not capabilities inferred from synthetic QA.

This audit introduces no application code, migration, provider send, or feature.
