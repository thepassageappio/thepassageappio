# Daily reconciliation streak log

Tracks the P2 exit criterion in `docs/V2-DELIVERY-ROADMAP.md` (gate V2-6): **seven consecutive clean daily reconciliation runs** before a real-data pilot is approved. A day is "clean" only if `public.run_daily_reconciliation_v1()` (added by `supabase/migrations/20260907153000_daily_reconciliation_check.sql`) returns `"status": "clean"`. Any `"blocked"` or `"variance"` day resets that environment's streak to zero -- no exceptions, no rounding up.

The streak is tracked **per environment** because Passage runs two live Supabase projects with independent data and independent provider integrations:

- **UAT** -- `ywlrxdjibngroycwnujg` ("Passage Authority UAT")
- **Demo** -- `bklrclpertdtmhycpqlz` ("passage-demo")

Both must independently reach 7 consecutive clean days; the later of the two dates governs the gate.

## What the job checks

1. **Billing/provider state vs. app state** -- reuses the pre-existing `public.get_commercial_reconciliation_snapshot_v1()` (found already deployed in both databases; see "Pre-existing infrastructure found" below) to snapshot `authority_private.commercial_orders`, `provider_event_inbox`, and `integration_outbox`, then checks: a paid order has exactly one `billing.pilot_activated` audit event; a refunded/failed order has no active allowance lots; any unresolved (`pending`/`retrying`/`failed`/`received`/`processing`) provider inbox or outbox row makes the day `blocked`.
2. **Request/decision counts vs. audit log** -- per organization, `authority_usage_events` (activated-transaction count) must equal both the `authority.activated` count in `organization_audit_events` and `organization_entitlements.activated_count`; `authority_institution_decisions` (immutable decision receipts) must equal the `institution.decision_recorded` count in `organization_audit_events`.

This does **not** call the live Stripe or HubSpot APIs -- it reconciles Passage's own durably recorded provider state (written by the existing Stripe webhook/outbox pipeline) against Passage's own request/decision/audit tables. Full three-way Passage/Stripe/HubSpot reconciliation additionally requires HubSpot provider credentials, which remain unconfigured as of this run (see `docs/V2-DELIVERY-ROADMAP.md`).

## Pre-existing infrastructure found (before today)

Before today, `authority_private.reconciliation_runs` (an append-only table for immutable run records) and two functions, `get_commercial_reconciliation_snapshot_v1` and `record_commercial_reconciliation_v1`, already existed in both live databases -- but **nothing in the repository or either database ever called them.** `reconciliation_runs` had zero rows in both projects before today. There was no script, no scheduled job, and no migration file in `supabase/migrations/` for this infrastructure: it was applied directly to both databases (under a migration named `stripe_negative_paths_and_reconciliation`, at different timestamps in each project -- `20260907035519` in UAT, `20260905233220` in Demo) without ever being committed to `supabase/migrations/` in this repo. That is real schema drift between the live databases and the repository, independent of today's reconciliation work, and worth a separate cleanup pass to pull the actual applied SQL back into a tracked migration file.

Today's change (`20260907153000_daily_reconciliation_check.sql`) builds a real caller on top of that pre-existing infrastructure: it computes both checks above, decides `clean`/`variance`/`blocked`, and records exactly one immutable row per UTC calendar day via the existing `record_commercial_reconciliation_v1` (idempotent -- calling it again the same day returns the already-recorded result instead of re-evaluating).

## Streak status

| Environment | Current streak | Streak start date | Last run date | Last status |
| --- | --- | --- | --- | --- |
| UAT | 0 | not started -- day 1 was not clean | 2026-09-07 | `blocked` |
| Demo | 0 | not started -- day 1 was not clean | 2026-09-07 | `blocked` |

## Run log

### 2026-09-07 -- Day 1, both environments -- first real run, both `blocked`

This is the first time this job has ever run. It was written and executed today because no runnable reconciliation job existed anywhere (see above). Both environments returned real, non-clean results:

**UAT** (`run_key` `7a4deb14-a456-d565-f54f-d81ee84101d7`): request/decision-vs-audit-log checks are clean -- 6 organizations, 14 usage events, 5 institution decisions, all agreeing exactly with the audit log and entitlement counters, zero variances. Billing checks are also internally clean (no orders exist yet in UAT). Status is `blocked` solely because of **one stale HubSpot outbox row** (`a8361230-d92a-4597-b3ad-6d5265ef23aa`, `status: pending`, `destination: hubspot`) that has never been claimed or applied, because no HubSpot worker/credentials are connected yet -- consistent with the roadmap's existing note that HubSpot provider credentials remain unconfigured.

**Demo** (`run_key` `7a4deb14-a456-d565-f54f-d81ee84101d7`): the one real paid pilot order (`in_1UCAZqRteXSJR0llmqI675C4` / `NFYSMYD4-0001`) is fully consistent -- exactly one activation audit event, one active allowance lot, zero refunded. Status is `blocked` because of **two unresolved Stripe provider-inbox rows**: `41d4a6bb-afe7-4c89-9187-adc7ca95dbbd` (event `evt_1UCA7SRteXSJR0llbAZL13OM`, `status: failed`, `reason: stripe_order_unmatched` -- this matches the roadmap's own September 4 note that this was a synthetic ingestion-test event sent before any real order existed) and `a74b183b-2bc6-4ee0-bc44-5f5e6334c7f5` (event `evt_1UCA5sRteXSJR0llBpHUoQef`, `status: received`, never advanced to `applied` or `ignored`).

**Why day 1 doesn't start the clock:** the P2 gate requires *clean* runs, and today's runs are real but not clean. Starting the streak on a blocked day would misrepresent the gate. The clock starts on the first day both environments return `clean`.

**Required to reach clean (repair queue -- not performed today, needs an owner decision, not a silent code change):**

- UAT: either connect a real HubSpot outbox worker so the pending row can be claimed and applied, or make an explicit product decision to cancel/retire that outbox row (`status = 'canceled'`) with a documented reason, so it stops being a permanent false block.
- Demo: triage `evt_1UCA5sRteXSJR0llBpHUoQef` -- determine why it never left `received` (the ingest/apply path only explicitly handles `invoice.paid` / `invoice.payment_failed` / `charge.refunded`; anything else, or a processing failure mid-apply, can leave a row stranded -- worth an engineering look at `authority_private.ingest_and_apply_stripe_event_v2`), and once `evt_1UCA7SRteXSJR0llbAZL13OM` is confirmed to be the known harmless pre-order synthetic test event, explicitly mark it `ignored` with a reason rather than leaving it `failed` indefinitely.

## Running a day

Manual (used for today's run, via direct database access):

```sql
select public.run_daily_reconciliation_v1();
```

Scripted (for local/CI use once Supabase credentials are available as environment variables):

```bash
SUPABASE_URL=... SUPABASE_SECRET_KEY=... SUPABASE_ENVIRONMENT_LABEL=uat \
  node scripts/run-daily-reconciliation.mjs
```

Automated: `.github/workflows/daily-reconciliation.yml` runs this daily via GitHub Actions for both environments, but **requires four repository secrets that are not yet configured**: `RECONCILIATION_UAT_SUPABASE_URL`, `RECONCILIATION_UAT_SUPABASE_SECRET_KEY`, `RECONCILIATION_DEMO_SUPABASE_URL`, `RECONCILIATION_DEMO_SUPABASE_SECRET_KEY` (each project's API URL and `service_role` secret key, from Supabase Project Settings -> API). Until Steve adds those secrets in GitHub repo settings, the scheduled workflow will run and fail with a clear "required" error rather than silently doing nothing -- the workflow's `workflow_dispatch` trigger also allows a manual run once secrets are set. Each new day's result should be appended to this log, and the streak table above updated, whether run manually or by the workflow.
