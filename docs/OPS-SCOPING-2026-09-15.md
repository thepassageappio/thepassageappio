# Ops scoping — September 15, 2026

**Status:** Live check of production and demo hosting, databases, security advisors, reconciliation streak, and connected Ops tooling. Everyday language. No secrets. No SOC claim.

**Prepared for:** Steve / docs PR
**Verified date:** 2026-09-15

---

## Current state

### Hosting (Vercel)

| Role | Vercel project | Domain | Status | Notes |
| --- | --- | --- | --- | --- |
| Real production | `passage-authority-uat` | `thepassageapp.io` | READY on `main` | Name still says "uat"; it is the live public product |
| Demo | `passage-authority-demo` | `demo.thepassageapp.io` | READY on `main` | Separate project and data |

Both environments are on the same Git SHA: `b1ba96cfbba00f9e0c3d4335018e3de866445be0`.

| Environment | Deployment ID |
| --- | --- |
| Production | `dpl_JBNiTNX18ZmnfgF3ED6ThKoN7kQM` |
| Demo | `dpl_pt4oroFEeJqnJ1pDbyR5wnQMvZEJ` |

`/api/version` on both hosts reports that SHA. Demo incorrectly reports environment `production`. Per [DEMO-ENVIRONMENT-ARCHITECTURE](DEMO-ENVIRONMENT-ARCHITECTURE.md), `PASSAGE_ENVIRONMENT` should be `demo`. App code is aligned; demo env identity is not.

### Databases (Supabase)

Organization is on the **free plan**.

| Environment | Project ref | Health |
| --- | --- | --- |
| Production (Passage Authority UAT) | `ywlrxdjibngroycwnujg` | `ACTIVE_HEALTHY` |
| Demo (passage-demo) | `bklrclpertdtmhycpqlz` | `ACTIVE_HEALTHY` |

Demo-only migrations present that production does not share:

- `authority_multi_institution_submission_phase0`
- `authority_multi_institution_submission_phase0_functions`
- `authority_multi_institution_submission_phase0_rls`

App SHA matches across hosts. Schema does **not** match (demo is ahead on those multi-institution pieces).

### Security advisors (Supabase)

- **INFO** `rls_enabled_no_policy` on `authority_private`: expected deny-by-default. See [AUTHORITY-PRIVATE-ACCESS-MODEL-2026-09-13](AUTHORITY-PRIVATE-ACCESS-MODEL-2026-09-13.md).
- **WARN** Four `SECURITY DEFINER` RPCs callable by `authenticated`: intentional; they still run internal membership checks. Keep them on the enterprise inventory review list.
- **WARN** Leaked password protection is disabled.

### Reconciliation

Clean immutable runs in **both** environments on: **2026-09-09, 10, 11, 13**.

Blocked days: **2026-09-07, 08**.

Missing recorded days: **2026-09-12, 14**.

**Streak is broken.** This is **not** 7/7. The job does **not** call live Stripe or HubSpot APIs; it only checks Passage's own recorded provider state against Passage tables. See [RECONCILIATION-LOG](RECONCILIATION-LOG.md).

### Connected Ops tooling

**Connected today:** Vercel, Supabase, GitHub, HubSpot, Gmail, Calendar, Drive.

**Stripe / Resend / Cloudflare:** Steve began connecting these on 2026-09-15. Do **not** claim live Stripe reconciliation from Ops tooling until Stripe is connected and verified. Resend is especially useful for deliverability work.

### SOC / audit language

There is **no** SOC report. Do **not** claim an audit is underway.

### Hard rules (reaffirmed)

- No hosted database reset
- No demo history delete
- No dirty-tree deploy
- No secrets in chat

---

## Research

What this check confirmed against existing docs:

1. **Prod project naming is misleading but documented.** `passage-authority-uat` serving `thepassageapp.io` matches [DEMO-ENVIRONMENT-ARCHITECTURE](DEMO-ENVIRONMENT-ARCHITECTURE.md) and [agent/RELEASES](agent/RELEASES.md). Treat it as production in every ops conversation.
2. **Demo env identity is wrong at runtime.** Architecture requires `PASSAGE_ENVIRONMENT=demo`. Live `/api/version` still says `production`. That blocks trusting demo-only guards that key off the env flag.
3. **Schema drift is intentional demo work, not silent prod skew.** Multi-institution phase0 migrations are demo-only. Release parity checks that only compare app SHA will miss this.
4. **Advisor noise vs real risk.** Default-deny RLS with no policies on `authority_private` is the designed boundary. Authenticated-callable `SECURITY DEFINER` RPCs need inventory, not panic. Disabled leaked-password protection is a real platform hygiene gap on Free.
5. **Reconciliation streak math.** Clean days exist, but gaps on 12 and 14 break consecutive counting. Do not round up or invent days. Live provider three-way proof remains separate until Stripe/HubSpot live reads are in the job.
6. **Ops connector coverage.** CRM and Google workspace connectors help commercial and calendar work. Payment (Stripe), email delivery (Resend), and DNS/edge (Cloudflare) are still blind spots for day-to-day Ops agents.
7. **Backup/SOC posture unchanged from earlier readiness docs.** Free plan, no vendor backups, no SOC report — same honest story as [RECOVERY-AND-INCIDENT-READINESS](RECOVERY-AND-INCIDENT-READINESS.md). Do not soften it for buyers.

---

## Roadmap to demo-ready env identity + enterprise security/audit

### A. Demo-ready environment identity (near term)

1. Set Demo Vercel `PASSAGE_ENVIRONMENT=demo` (and any related public/server vars) so `/api/version` and demo-only command guards agree with architecture.
2. Re-check `/api/version` on `demo.thepassageapp.io` after the next clean Git deploy from `main`.
3. Document expected version payload fields (SHA, environment label, migration head if exposed) in the release playbook.
4. **Hold:** do not aggressively promote multi-institution phase0 migrations to production until Steve decides in the aggregate roadmap. Record schema parity separately from app SHA parity.

### B. Security hygiene (before real institution data)

1. Turn on leaked password protection when the plan/settings allow it; record the change date.
2. Inventory the four authenticated-callable `SECURITY DEFINER` RPCs: name, caller path, membership check, and whether enterprise buyers should see them in a control matrix.
3. Keep `authority_private` default-deny; do not add broad table grants to browser roles.
4. Plan a Supabase paid-plan decision for automated backups / PITR (owner spend). Free plan remains a hard restore gap.

### C. Enterprise audit readiness (honest sequencing)

1. Finish consecutive clean **internal** reconciliation days after the broken streak; never credit missing days.
2. Only then add live Stripe/HubSpot comparison evidence (separate from the current job).
3. Keep SOC language exact: no report, no "audit underway" unless a real engagement exists.
4. Prefer written control inventory + evidence links over marketing claims.

---

## When to connect Stripe / Resend / Cloudflare

Connect these when the work actually needs them — not earlier for vanity completeness.

| Connector | Connect when… | Do not connect just to… |
| --- | --- | --- |
| **Stripe** | You need live payment/event reads, dispute triage, webhook delivery checks, or three-way reconciliation against Stripe | "Complete the Ops dashboard" while the recon job still only uses recorded inbox state |
| **Resend** | You need live delivery, bounce, and domain auth diagnosis beyond mailbox screenshots | Bypass the existing webhook path or paste API keys into chat |
| **Cloudflare** | You need DNS/edge changes for `demo.thepassageapp.io` / auth domains, or cache/WAF incident work | Give agents broad DNS power before a named change is approved |

**Already enough for many Ops tasks:** Vercel (deploys/version), Supabase (health/advisors/SQL), GitHub (PRs/releases), HubSpot (CRM projection), Gmail/Calendar/Drive (owner workflow).

---

## Docs to update

| Doc | Why |
| --- | --- |
| This file (`OPS-SCOPING-2026-09-15.md`) | Dated ops snapshot |
| [agent/RELEASES.md](agent/RELEASES.md) | Append Sept 15 deploy/version checkpoint |
| [agent/PROVIDERS.md](agent/PROVIDERS.md) | Advisors, connectors, env identity, schema note |
| [RECOVERY-AND-INCIDENT-READINESS.md](RECOVERY-AND-INCIDENT-READINESS.md) | Sept 15 reaffirmation (Free plan, health, SOC language) |
| [RECONCILIATION-LOG.md](RECONCILIATION-LOG.md) | Live streak update (clean / blocked / missing) |
| [agent/MEMORY-INDEX.md](agent/MEMORY-INDEX.md) | Pointer row to this ops scoping |
| [agent/CURRENT.md](agent/CURRENT.md) | One pointer line to this ops scoping |
| [DEMO-ENVIRONMENT-ARCHITECTURE.md](DEMO-ENVIRONMENT-ARCHITECTURE.md) | Follow-up when `PASSAGE_ENVIRONMENT` is fixed live |

---

## Hard rules

These stay in force:

1. **No hosted DB reset** — never wipe UAT or Demo Postgres to "start fresh."
2. **No demo history delete** — older demo runs and append-only evidence stay for diagnosis.
3. **No dirty-tree deploy** — production and demo ship from a clean `main` Git commit only.
4. **No secrets in chat** — keys, tokens, and service credentials stay in vaults/env UIs, never in docs PR text or messages.
5. **No invented SOC/audit claims** — no report means no report.
6. **No streak fiction** — missing or blocked recon days do not count; live Stripe/HubSpot is not implied by a clean internal run.

---

## Bottom line

Production and demo apps are both healthy on the same `main` SHA, but demo still mislabels itself as production, demo schema is ahead on multi-institution migrations, the reconciliation streak is broken (not 7/7), Free-plan backup and SOC posture are unchanged, and Stripe/Resend/Cloudflare Ops connectors are still missing. Fix env identity and keep security/reconciliation honest before selling enterprise readiness.
