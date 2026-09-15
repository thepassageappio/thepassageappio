# Multi-institution Phase 0 — progress (resume)

**Date:** 2026-09-15  
**Purpose:** Resume the interrupted Phase 0 progress / screenshot walkthrough record. Do **not** recreate demo case `PA-F39449782D`. Do **not** invent screenshots or claim an uncoached E2E walkthrough that was not finished.

Companion to [USER-INITIATED-MULTI-INSTITUTION-SCOPE-2026-09-13.md](USER-INITIATED-MULTI-INSTITUTION-SCOPE-2026-09-13.md).

## Status

| Item | State |
| --- | --- |
| Spec | Written 2026-09-13; status line updated 2026-09-15 to match code |
| Schema + RPC + RLS | On `main`; applied on **demo** Supabase `bklrclpertdtmhycpqlz` only |
| Lib / server actions / email helpers | On `main` |
| Requester UI `/start/multi-institution/**` | On `main` |
| Institution case-detail origin badge | On `main` (`b1ba96c`) |
| Prod/UAT Supabase `ywlrxdjibngroycwnujg` | Phase 0 migrations **absent** |
| Screenshot / timed demo walkthrough | **Still pending — resume here** |
| Five-year-old / no-AI-slop copy audit of Phase 0 UI | **Still pending** |
| Uncoached E2E demo-ready claim | **Not claimed** |

## What shipped on main (commit chain)

Approximate order ending at tip `b1ba96cfbba00f9e0c3d4335018e3de866445be0`:

1. Schema + RPC surface (demo-applied migrations; repo files under `supabase/migrations/2026091315*`)
2. Lib + server actions + requester verification delivery
3. Additive user-facing error messages
4. Requester wizard UI
5. Case-detail `origin_group_id` select + small multi-institution origin badge

### Public routes

- `/start/multi-institution` — requester intake
- `/start/multi-institution/check-email`
- `/start/multi-institution/verify/[token]`
- `/start/multi-institution/[groupId]` — wizard (details → institutions → evidence → review)
- `/start/multi-institution/[groupId]/submitted`

Institution staff still see an ordinary case; badge only marks multi-institution origin. No new reviewer decision workflow in Phase 0.

### Demo vs prod

- **Demo:** migrations present; Phase 0 tables/RPCs usable for internal validation.
- **Prod/UAT:** code may be on the shared SHA, but DB lacks Phase 0 — do not script multi-institution as a production walkthrough.

## Resume checklist (do next; do not skip)

1. Capture a dated screenshot walkthrough on **demo only** (intake → verify → wizard → submit → institution badge). Store artifacts with this doc or a linked evidence folder; do not fabricate images.
2. Scrub all Phase 0 user-visible strings against [PLAIN-LANGUAGE-STANDARD.md](PLAIN-LANGUAGE-STANDARD.md) and Steve’s 2026-09-15 hard bar (no AI fluff; five-year-old must understand and use).
3. Record pass/fail for: email verify, matched institutions only, evidence upload, submit spawn, unmatched/concierge path if exercised, badge visibility, receipt/boundary copy.
4. Keep claims demo-only until owner promotes migrations and legal/abuse review allows broader use.

## Explicit non-goals for this resume doc

- No Phase 1 unmatched sales motion
- No new institution-type templates
- No wholesale PR #109 / POL1 merge
- No outreach or buyer demo claims from Phase 0 alone
