# Persona interaction map (2026-08-18)

Status: what the full-product-ux-map (2026-08-17) doesn't answer. That document maps every page and button *within* one persona's surface. It does not answer "when persona A does X, what does persona B actually see, through what surface, how fast, and under what permission." This does — every claim below traces to a specific RPC, RLS predicate, or loader function, read directly, not inferred from the UI or remembered from an earlier pass.

**Why this matters more than page completeness for a demo:** the entire product thesis (`passage-product-direction-session.md`) is that Passage removes repeated intake and invisible waiting *between* people. A page-by-page audit can't catch "director assigns a task and the family never finds out" — only tracing the actual data flow can.

## The shared spine

Four tables carry state across personas. Nothing else does.

- **`tasks`** — one row per commitment, `assigned_organization_member_id` links it to staff.
- **`workflow_events`** — append-only audit log, one row per state change, `name` field drives family-facing copy via a translation table (never raw).
- **`partner_requests`** / **`partner_request_events`** — vendor coordination, a parallel spine to `tasks`/`workflow_events`, not the same rows.
- **`task_communications`** — prepared/sent email drafts, separate from both.

Family/D2C access to all of this is never direct table access with full columns — every family-facing read goes through a bounded projection (`loadFamilyCaseView`, `get_family_case_update_for_workflow`) that translates status into plain-language sentences and omits internal identifiers (staff names, member ids, financial columns) by RLS design, not just UI convention.

## Interaction 1: Director assigns a task → staff → family

- **Director assigns** (`assign_task_idempotent`) → writes `tasks.assigned_organization_member_id` + a `task.assigned` `workflow_events` row.
- **Staff sees it immediately** — `/staff` loads tasks filtered to `assigned_organization_member_id = <their own member id>` (`lib/operations/hosted.ts`). No polling delay beyond a page load/revalidation.
- **Family sees it, translated** — `loadFamilyCaseView` reads the same `tasks` row directly (owner path) and renders `familyOwnerLabel(waiting_party)` — **never the staff member's actual name or identity** (confirmed: family has no RLS grant on `organization_members` at all). The family also gets a `workflow_events` entry translated to "A next step was set up for your case."
- **Gap, real:** the family-visible `waiting_party` field is free text set by whoever created the task — if it's blank or stale, family sees "Your care team" as a fallback. Not wrong, just less specific than it could be.

## Interaction 2: Staff submits proof → director → family (the trust-critical one)

- **Staff submits** (`submit_task_proof_idempotent` or equivalent) → `tasks.status = 'proof_submitted'` + `task.proof_submitted` event.
- **Director sees it in the Case Room** as "waiting for review," can verify or request replacement.
- **Family sees it too — before director review, not after.** Confirmed in `familyTaskSummary()`: `proof_submitted` → *"A step was just completed and is being double-checked."* This is a real, deliberate design choice: family gets real-time visibility with honest epistemic framing ("being double-checked," not "done"), rather than being gated until the director acts. Matches the product's own "visible proof, not silent waiting" thesis exactly.
- **Director verifies** → `task.status = 'completed'` + `task.proof_verified` event → family's copy flips to *"A completed step was confirmed."*
- **This is the one interaction that's actually built correctly end to end, verified in code, not assumed.**

## Interaction 3: Director originates a vendor request → vendor → director → family (three-way, the most complex loop)

- **Director creates** (`create_partner_request_idempotent`) → new `partner_requests` row, vendor's `/partner` queue picks it up.
- **Vendor quotes** → director sees the quote in the Case Room, approves (real Stripe Checkout charge, funds held).
- **Vendor delivers, submits proof** → director verifies → **payout releases automatically** (`attemptPartnerPayoutRelease`, Stripe Connect transfer) — no manual step.
- **Family sees this too, merged into the same feed as tasks** (Phase L.1 unification, confirmed in `loadFamilyCaseView`): `partnerRequestSummary()` — `sent` → "Waiting for the vendor to respond," `quoted` → "sent a quote for your care team to review," `in_progress` → "working on this now," `proof_submitted` → "says this is done, and it is being double-checked," `verified` → "This is complete." Same honest-epistemic-framing pattern as Interaction 2.
- **Real gap:** `partner_request_events` (the vendor-side audit log) has no equivalent entry in family-facing `workflow_events` — family visibility here comes from the bounded live-status projection, not an event trail, so if a status flips twice quickly (e.g., quoted → declined → re-quoted to a different vendor) the family's "recent updates" (capped at 3, mixed with task events, sorted by timestamp) could show a confusing partial picture. Not tested; flagged as a real, unverified risk, not a confirmed bug.
- **Staff does not see vendor requests at all** — confirmed: `loadHostedOperations` (staff/director's shared loader) queries `workflows, tasks, organization_members, organization_member_locations, workflow_events, organization_invitations, organization_invitation_locations, task_proofs, task_proof_reviews` — no `partner_requests`. Vendor coordination is director-only on the funeral-home side. If a demo has staff expecting to see vendor status, they won't.

## Interaction 4: Communication (email) — director or family, either direction

- **Either a director/staff with an assigned task on the case, or the D2C owner, or an accepted participant** can prepare and send (`can_message_workflow`, read live from the database this session — precise predicate: D2C owner, OR accepted `estate_access` participant, OR org director/owner with location authority, OR **staff only if actually assigned a task on this specific workflow**, not just staff at the location).
- Sent communications produce a `communication.sent` event → family sees "An email update was sent about your case."
- **This is the one place a family-invited participant (spouse) has write access, not just read** — confirmed from the predicate above. Worth knowing: the earlier framing in this session ("participants are read-only") is accurate for task/proof data, but not fully accurate for messaging specifically.

## Interaction 5: Family invites a participant (spouse) → participant's actual view

- Owner sends `case_family_invitations` invite → accepted → `estate_access` row created with `role='participant'`.
- **The participant's view is a genuinely different, thinner surface than the owner's** — not just permission-filtered, a separate RPC (`get_family_case_update_for_workflow`) with a hard ceiling: no case reference, no workflow phase, no task id, no waiting-party/due-date detail, **at most one recent update** (vs. the owner's 3). This is real and by design (`participant_updates_case_scope` migration), not a bug — but worth knowing before a demo shows a spouse's view expecting parity with the owner's.

## Interaction 6: D2C multi-estate (built last night) — where it's isolated

- Each estate (`workflows` row) is fully independent — no director, no staff, no vendor. An owner managing 3 estates sees 3 separate `today`/`tasks`/`messages` surfaces with zero cross-estate interaction, by design (confirmed: `create_additional_estate_idempotent` never links estates to each other).
- The only cross-persona touchpoint a D2C estate has is the same participant-invite flow as Interaction 5, per estate, independently.

## Interaction 7: Staff onboarding → team visibility

- Director invites staff → staff accepts → appears in director's `/director/team` staff list, with location grants determining which cases they can be assigned.
- **Verified, resolved after this doc's first pass:** `resolveOperationalViewer` (`lib/auth/authorization.ts:29-33`) already computes `viewer.locations` as an array of every active, non-revoked location grant — this predates last night, it's general infrastructure, not something built alongside multi-location grants. `loadHostedOperations`'s task query filters by organization, not by location, and `/staff` further filters to `assigned_organization_member_id = <their own id>` — never location-partitioned at all. A staff member with 2 location grants was already going to see one correctly merged task list, and the UI (`viewer.locations.map(...).join(' · ')`) already rendered multiple locations before last night's work existed. Last night's grant RPC only added the missing *write* side (a director adding a new grant); the *read* side never needed fixing.

## What this map found that the page-by-page audit didn't

1. **Staff has zero vendor-request visibility**, by design or by gap — not clear which, and not previously stated anywhere. Worth a founder call: should staff see vendor coordination on cases they're assigned to, or is director-only intentional?
2. **Participants can message, not just view** — a real capability the earlier "read-only" framing undersold.
3. **Superseded — the actual bug was worse than "no audit-event backing."** Set out to test whether family-visible vendor-status timing had audit-event backing; while tracing the call path directly instead of testing live, found `get_family_visible_partner_requests` (the RPC this entire question depends on) had no `public` schema wrapper and was 404ing on every call, silently swallowed as "no data." Families have never seen vendor-status updates at all — the timing question was moot underneath a total outage. Fixed 2026-08-18, see `operational-readiness-roadmap.md`'s "CRITICAL" entry for the same date. The original timing question (does status update *fast enough* once the RPC actually resolves) is still untested and worth a real pass now that the RPC works.
4. **Structured participant roles are already scoped as personas, not yet built as data.** `persona-action-architecture.md`'s persona table (lines 173-184) already lists Executor/estate administrator, Celebrant/venue/clergy, and Cemetery/crematory as distinct personas with distinct authority implied — but `case_family_invitations` only stores a flat `relationship` text field, no structured role, no differentiated authority. Every accepted participant gets identical scope today regardless of stated relationship.
5. **Vendor orgs have no multi-employee invite flow.** `/partner/start` creates exactly one owner login per vendor organization (florist, cemetery, etc.); there is no equivalent of the funeral-home side's `/director/invitations/new` for adding a second vendor employee. Confirmed by grep across every migration — no `partner_invitation`-shaped RPC exists anywhere.

## Next: what "build ASAP" means against these findings

Items 1 and 2 are product-clarity questions, not bugs — worth a fast founder confirmation rather than a unilateral fix. Item 3's outage half is fixed; its timing half still needs a real test (create a vendor request, flip its status twice fast, check what the family sees) now that the RPC actually resolves. Item 4 needs a founder call on which roles get real authority vs. just a label before building the enum. Item 5 is queued as a straight mirror of the proven staff-invitation pattern, no decision needed. The one item that was genuine new-code risk from last night (multi-location staff task-list merge) has already been checked, immediately after this doc's first pass — verified correct, not a gap.
