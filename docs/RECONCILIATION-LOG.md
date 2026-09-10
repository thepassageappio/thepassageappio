# Daily reconciliation streak log

## Latest evidence — September 10, 2026 UTC

UAT and Demo each recorded a new immutable `clean` run on September 10, following the September 9 clean run: **2/7 consecutive internal reconciliation days**. Both returned `already_recorded_today: false`, run key `765a4257-92a8-d9ce-5a6b-ae9b0b453f49`; UAT recorded at `2026-09-10T02:20:43.130886Z`, Demo at `2026-09-10T02:20:44.414146Z`. The shared date-derived key is scoped to each separate project. Unresolved inbox/outbox and billing/usage/decision variance arrays were empty.

The earliest internal day 7 remains September 15 if every subsequent UTC day is clean. This is **not** seven days of live provider comparison: the job explicitly does not call Stripe or HubSpot APIs. Their independent read/comparison evidence and automation remain open. The current hosted scope note correctly distinguishes those limits; old immutable reports are unchanged. Credential-unconfigured wording in historical sections below is historical and does not describe the current proven UAT Contact projection.

See [September 10 hosted evidence](P1-P2-HOSTED-EVIDENCE-2026-09-10.md).

Tracks the P2 exit criterion in `docs/V2-DELIVERY-ROADMAP.md` (gate V2-6): **seven consecutive clean daily reconciliation runs** before a real-data pilot is approved. A day is "clean" only if `public.run_daily_reconciliation_v1()` (added by `supabase/migrations/20260907153000_daily_reconciliation_check.sql`) returns `"status": "clean"`. Any `"blocked"` or `"variance"` day resets that environment's streak to zero -- no exceptions, no rounding up.

The streak is tracked **per environment** because Passage runs two live Supabase projects with independent data and independent provider integrations:

- **UAT** -- `ywlrxdjibngroycwnujg` ("Passage Authority UAT")
- **Demo** -- `bklrclpertdtmhycpqlz` ("passage-demo")

Both must independently reach 7 consecutive clean days; the later of the two dates governs the gate.

## What the job checks

1. **Billing/provider state vs. app state** -- reuses `public.get_commercial_reconciliation_snapshot_v1()` to snapshot `authority_private.commercial_orders`, `provider_event_inbox`, and `integration_outbox`, then checks: a paid order has exactly one `billing.pilot_activated` audit event; a refunded order may retain zero or one historical activation audit but has no active allowance lots; other non-paid orders have no activation audits or active allowances; any unresolved (`pending`/`retrying`/`failed`/`received`/`processing`) provider inbox or outbox row makes the day `blocked`.
2. **Request/decision counts vs. audit log** -- per organization, `authority_usage_events` (activated-transaction count) must equal both the `authority.activated` count in `organization_audit_events` and `organization_entitlements.activated_count`; `authority_institution_decisions` (immutable decision receipts) must equal the `institution.decision_recorded` count in `organization_audit_events`.

This does **not** call the live Stripe or HubSpot APIs -- it reconciles Passage's own durably recorded provider state (written by the existing Stripe webhook/outbox pipeline) against Passage's own request/decision/audit tables. Full three-way Passage/Stripe/HubSpot reconciliation additionally requires HubSpot provider credentials, which remain unconfigured as of this run (see `docs/V2-DELIVERY-ROADMAP.md`).

## Pre-existing infrastructure found (before today)

Before today, `authority_private.reconciliation_runs` (an append-only table for immutable run records) and two functions, `get_commercial_reconciliation_snapshot_v1` and `record_commercial_reconciliation_v1`, already existed in both live databases -- but **nothing in the repository or either database ever called them.** `reconciliation_runs` had zero rows in both projects before today. There was no script, no scheduled job, and no migration file in `supabase/migrations/` for this infrastructure: it was applied directly to both databases (under a migration named `stripe_negative_paths_and_reconciliation`, at different timestamps in each project -- `20260907035519` in UAT, `20260905233220` in Demo) without ever being committed to `supabase/migrations/` in this repo. That is real schema drift between the live databases and the repository, independent of today's reconciliation work, and worth a separate cleanup pass to pull the actual applied SQL back into a tracked migration file.

Today's change (`20260907153000_daily_reconciliation_check.sql`) builds a real caller on top of that pre-existing infrastructure: it computes both checks above, decides `clean`/`variance`/`blocked`, and records exactly one immutable row per UTC calendar day via the existing `record_commercial_reconciliation_v1` (idempotent -- calling it again the same day returns the already-recorded result instead of re-evaluating).

## Streak status

| Environment | Current streak | Streak start date | Last run date | Last status |
| --- | --- | --- | --- | --- |
| UAT | 0 | earliest possible start: 2026-09-09 UTC | 2026-09-08 | `blocked` (current computation clean after repair) |
| Demo | 0 | earliest possible start: 2026-09-09 UTC | 2026-09-08 | `blocked` (current computation clean after repair) |

## Run log

### 2026-09-08 -- immutable run blocked; repair complete; current computation clean

Both environments recorded their once-per-day run at approximately 03:14 UTC, before repair, with the same deterministic run key `0a698a8d-fc79-99b9-2dbe-8d6844376fc2`. Those append-only records remain `blocked` and do not earn a streak day.

The repair then established and recorded the reason for every unresolved row:

- UAT outbox row `a8361230-d92a-4597-b3ad-6d5265ef23aa` belonged to an internal demo inquiry created while no HubSpot worker was configured. `public.cancel_integration_outbox_v1` marked it `canceled` with code `internal_demo_no_worker` and wrote one append-only `commercial.integration_outbox_canceled` event containing the prior status.
- Demo event `evt_1UCA7SRteXSJR0llbAZL13OM` was the known pre-order synthetic invoice. Event `evt_1UCA5sRteXSJR0llBpHUoQef` was independently checked and also proved to be test residue: its $20 invoice and Stripe customer do not match Passage's real $5,000 paid demo order. `public.resolve_provider_event_v1` marked both `ignored` with code `synthetic_test_event` and wrote two append-only `commercial.provider_event_resolved` events containing their prior states.
- The notification send-history correction already existed in both databases as a direct SQL change. Its exact applied SQL was recovered into `supabase/migrations/20260907213516_notification_outbox_send_history.sql`, closing the source-control gap.
- Demo's missing `organization_member_count_summary` and `team_invitation_delivery_tracking` migrations were applied and verified by object presence.
- The job itself had a false-positive invariant: a paid-then-refunded order legitimately retains one activation audit. The function now permits zero or one activation audit for a refund, while continuing to reject active allowances and duplicate activations. The existing Stripe negative-path test now asserts this behavior.

After those changes, direct calls to `authority_private.compute_daily_reconciliation_v1()` returned `clean` in UAT and Demo with empty unresolved-inbox, unresolved-outbox, billing-variance, usage-variance, and decision-variance arrays. This is post-repair readiness evidence, not a credited daily run. Day 1 can be recorded on September 9 UTC.

### 2026-09-07 -- Day 1, both environments -- first real run, both `blocked`

This is the first time this job has ever run. It was written and executed today because no runnable reconciliation job existed anywhere (see above). Both environments returned real, non-clean results:

**UAT** (`run_key` `7a4deb14-a456-d565-f54f-d81ee84101d7`): request/decision-vs-audit-log checks are clean -- 6 organizations, 14 usage events, 5 institution decisions, all agreeing exactly with the audit log and entitlement counters, zero variances. Billing checks are also internally clean (no orders exist yet in UAT). Status is `blocked` solely because of **one stale HubSpot outbox row** (`a8361230-d92a-4597-b3ad-6d5265ef23aa`, `status: pending`, `destination: hubspot`) that has never been claimed or applied, because no HubSpot worker/credentials are connected yet -- consistent with the roadmap's existing note that HubSpot provider credentials remain unconfigured.

**Demo** (`run_key` `7a4deb14-a456-d565-f54f-d81ee84101d7`): the one real paid pilot order (`in_1UCAZqRteXSJR0llmqI675C4` / `NFYSMYD4-0001`) is fully consistent -- exactly one activation audit event, one active allowance lot, zero refunded. Status is `blocked` because of **two unresolved Stripe provider-inbox rows**: `41d4a6bb-afe7-4c89-9187-adc7ca95dbbd` (event `evt_1UCA7SRteXSJR0llbAZL13OM`, `status: failed`, `reason: stripe_order_unmatched` -- this matches the roadmap's own September 4 note that this was a synthetic ingestion-test event sent before any real order existed) and `a74b183b-2bc6-4ee0-bc44-5f5e6334c7f5` (event `evt_1UCA5sRteXSJR0llBpHUoQef`, `status: received`, never advanced to `applied` or `ignored`).

**Why day 1 doesn't start the clock:** the P2 gate requires *clean* runs, and today's runs are real but not clean. Starting the streak on a blocked day would misrepresent the gate. The clock starts on the first day both environments return `clean`.

**Repair queue at the time (completed September 8 as recorded above):**

- UAT: either connect a real HubSpot outbox worker so the pending row can be claimed and applied, or make an explicit product decision to cancel/retire that outbox row (`status = 'canceled'`) with a documented reason, so it stops being a permanent false block.
- Demo: triage `evt_1UCA5sRteXSJR0llBpHUoQef` -- determine why it never left `received` (the ingest/apply path only explicitly handles `invoice.paid` / `invoice.payment_failed` / `charge.refunded`; anything else, or a processing failure mid-apply, can leave a row stranded -- worth an engineering look at `authority_private.ingest_and_apply_stripe_event_v2`), and once `evt_1UCA7SRteXSJR0llbAZL13OM` is confirmed to be the known harmless pre-order synthetic test event, explicitly mark it `ignored` with a reason rather than leaving it `failed` indefinitely.

## Running a day

Manual (used for today's run, via direct database access):

```sql
select public.run_daily_reconciliation_v1();
```

Scripted (for local/CI use, added today at `scripts/run-daily-reconciliation.mjs`):

```bash
SUPABASE_URL=... SUPABASE_SECRET_KEY=... SUPABASE_ENVIRONMENT_LABEL=uat \
  node scripts/run-daily-reconciliation.mjs
```

**Automated (not yet committed -- needs manual setup):** a GitHub Actions workflow was written to run this daily for both environments, but the GitHub API token available for this task does **not** have the `workflow` permission scope, so GitHub rejected the write to `.github/workflows/` (`403 Resource not accessible by integration`). This is a real limitation, not a skipped step -- someone with a token that has `workflow` scope (or pushing from a local git client, which has no such restriction) needs to add the file below as `.github/workflows/daily-reconciliation.yml`. It also needs four repository secrets that are separately not yet configured: `RECONCILIATION_UAT_SUPABASE_URL`, `RECONCILIATION_UAT_SUPABASE_SECRET_KEY`, `RECONCILIATION_DEMO_SUPABASE_URL`, `RECONCILIATION_DEMO_SUPABASE_SECRET_KEY` (each project's API URL and `service_role` secret key, from Supabase Project Settings -> API). Until both the file and the secrets exist, each day must be run manually (via the SQL or script above) and logged here.

```yaml
name: Daily Reconciliation

# Runs the P2 gate V2-6 reconciliation job (docs/RECONCILIATION-LOG.md) once a
# day against both live Supabase projects. Requires four repository secrets:
#   RECONCILIATION_UAT_SUPABASE_URL, RECONCILIATION_UAT_SUPABASE_SECRET_KEY,
#   RECONCILIATION_DEMO_SUPABASE_URL, RECONCILIATION_DEMO_SUPABASE_SECRET_KEY

on:
  schedule:
    - cron: "0 13 * * *" # ~9am ET / 8am EST daily; adjust if a different time is preferred
  workflow_dispatch: {}

jobs:
  reconcile:
    name: Run daily reconciliation (${{ matrix.environment }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        include:
          - environment: uat
            url_secret: RECONCILIATION_UAT_SUPABASE_URL
            key_secret: RECONCILIATION_UAT_SUPABASE_SECRET_KEY
          - environment: demo
            url_secret: RECONCILIATION_DEMO_SUPABASE_URL
            key_secret: RECONCILIATION_DEMO_SUPABASE_SECRET_KEY
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v9
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Run reconciliation
        env:
          SUPABASE_URL: ${{ secrets[matrix.url_secret] }}
          SUPABASE_SECRET_KEY: ${{ secrets[matrix.key_secret] }}
          SUPABASE_ENVIRONMENT_LABEL: ${{ matrix.environment }}
        run: node scripts/run-daily-reconciliation.mjs

      - name: Upload evidence
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: reconciliation-evidence-${{ matrix.environment }}-${{ github.run_id }}
          path: work/evidence/reconciliation/
          retention-days: 90
```

Each new day's result should be appended to this log, and the streak table above updated, whether run manually or (once set up) by the workflow.
