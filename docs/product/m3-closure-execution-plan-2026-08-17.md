# M3 closure execution plan (2026-08-17)

Status: concrete, sequenced execution plan. This does not create new milestones, stages, or vision — it scopes the existing M3 exit criteria (`operational-readiness-roadmap.md:83-93`) against current, evidence-checked state, and orders what's left. No task below is invented; every one traces to something already flagged in the canonical roadmap or found in tonight's audit.

## Where the three scored paths actually stand

The Verified-baseline table (`operational-readiness-roadmap.md:156`) has not moved since these entries:

- Funeral home: **94% guided / 40% operational** (2026-07-26)
- Family/D2C: **85% guided / 25% operational** (2026-07-26)
- Vendor/partner: **90% guided / 28% operational** (later entry, line 634 — includes the PR #66 category-validation fix)

All three predate Phase K, Phase L.1-L.4, and tonight's 8-item fix pass. Two specific facts in those old numbers are now stale, not just outdated in spirit:

- The case-detail lane was "100% placeholder" as of 2026-07-26 (`operational-readiness-roadmap.md:200`). It is not anymore — `lib/family/case-view.ts` now drives `/case/[id]/{today,tasks,messages}` off real Supabase RPCs (Phase L.1/L.2/L.3). The 25% D2C operational number does not reflect this.
- The urgent/red persona was "0% built, not started" as of 2026-07-26 (`operational-readiness-roadmap.md:202`). It exists now — `/director/urgent`, `claim_urgent_intake_idempotent`, `create_case_from_urgent_intake_idempotent`, with trial gating. Not reflected either.

This doc doesn't unilaterally rewrite the scorecard — that's a deliberate governance gate per the roadmap's own rule ("a score moves only after a milestone's full exit gate passes"). What it does is name exactly what's left before that re-score is honest, so it isn't another open-ended "someday."

## What's actually left to close M3

In execution order — each closes one specific, named exit-criterion gap, not a vague improvement:

**1. Browser-level denial matrix + reload/persistence + 1440/390/360 QA for `/director/cases/[id]` and `/staff/work/[id]`.**
The one sub-evidence gap the roadmap names explicitly and repeatedly as still open (`operational-readiness-roadmap.md:192,215`). The core proof-review loop is proven live twice; this specific matrix (wrong-org/wrong-location/unassigned/revoked-user denial, reload truth, responsive pass) is not. This is the single most-named remaining item in the entire document — closing it is the most direct way to move the funeral-home operational score.

**2. Expand `frontend-backend-contracts.json` to cover Phase K/L and tonight.**
Just fixed to PASS (18/18) tonight — but 18 contracts is Cycle 7/8 coverage only. Vendor-visibility unification, family self-serve task completion, the communications engine, D2C checklist seeding, location creation + upgrade gating, and tonight's 8 audit fixes have zero contract entries. The parity checker can only catch drift in what it tracks.

**3. Migration backfill.**
Every migration since Phase J (2026-08-16 onward — 9 migrations, including everything from tonight and prior sessions) was applied straight to Supabase via the MCP tool and never committed to `supabase/migrations/`. Git and the live database have diverged. This is the largest single piece of debt in the stack and has been flagged, not started, across multiple sessions now. Concretely: pull the applied migration history from Supabase (`list_migrations`), diff against what's committed, and write the missing `.sql` files in order so a fresh clone could reproduce production schema.

**4. Formal re-score, once 1-3 land.**
At that point the funeral-home and D2C operational numbers should genuinely move — not because more got built, but because the case-detail and urgent-intake corrections above alone already justify it, and 1-2 close the specific named gaps blocking the rest.

## What M4 (family continuity) already has, concretely

Per the existing dependency chain (`operational-readiness-roadmap.md:115`), M4 needs "real family identity/recovery, durable purpose grants, participant boundaries, complete Transfer Pass handoff, family-safe proof return, and data controls." Current state, evidence-based:

- **Done:** real family identity via `continuity_spaces`/`continuity_participants` + `case_family_invitations`; family-safe proof return via the unified commitment view (Phase L.1); family-initiated communication (Phase L.3); family self-serve task completion (Phase L.2).
- **Not done:** the Transfer Pass handoff itself is still the disconnected `/family` + `/family/pass` sandbox (now clearly labeled as a preview, per tonight's fix, but not wired to any real backend) — connecting it to `case_family_invitations` is the real remaining M4 work, not a new idea, just not started.

### Confirmed, code-level: D2C multi-estate provisioning does not exist

Traced end to end tonight (`app/api/webhooks/stripe/route.ts:294-329`, `app/case/page.tsx`, `app/case/start/actions.ts`, `supabase/migrations/20260816070000_production_case_family_invitation.sql`). This is no longer an open question — it's a confirmed gap with an exact location:

- **Auth:** magic link via Supabase Auth (`inviteUserByEmail`), no passwords, for both the D2C owner and any invited participant.
- **Ownership:** exactly one `workflows` row per subscriber, created by `provisionD2cFamilyRecordIfNeeded` on checkout, owned by `workflows.user_id`. There is no concept of co-ownership anywhere in the schema.
- **How a second person gets access:** the owner sends a `case_family_invitations` invite; acceptance writes `estate_access(role='participant', status='active')`. A participant is **read-only** — visibility into status/tasks/updates, no management rights, no editing. There is no "spouse" or "co-owner" role.
- **The actual bug:** `provisionD2cFamilyRecordIfNeeded` (`route.ts:317-318`) creates one workflow regardless of which plan was purchased. `/pricing` sells Individual (1 estate), Couple (2 estates), and Family (5 estates) — **the code has no path that ever creates a second, third, fourth, or fifth estate for a Couple/Family subscriber.** The Estate Add-On Stripe price exists and is billable, but the account-settings page that would let an existing subscriber actually use it to create another estate does not exist (named as a gap in the 2026-08-16 audit, now confirmed as the same root cause).

**This is sold-but-not-built, not a design question.** Scoping still needed on the *access model* (should a spouse on a "Couple" plan be a second owner of the same estate, or the owner of their own separate estate with cross-visibility? are children ever account holders themselves, or always represented by a parent/owner?) — but the missing multi-estate creation flow itself is a concrete build item, not a conversation, and belongs in M4 ahead of the Transfer Pass wiring above.

## What happens after M3 closes

M5 (bounded partner simulation) and M6 (production gate) stay exactly where the existing roadmap and V5 strategy doc already put them — not started, not funded yet, correctly so. Nothing in tonight's work or this plan changes that order. The vendor/partner MVP already exists ahead of where M5 requires it to be, which is a head start, not a reason to pull M5 forward before M3 and M4 close.
