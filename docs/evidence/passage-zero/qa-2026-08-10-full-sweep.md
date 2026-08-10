# QA: full cross-persona sweep (public site, all five personas, messaging)

Independent QA per `docs/agents/qa.md`, run ahead of the PR #24 governance decision. Real hosted testing throughout — real sign-ins, real clicks, real form submissions — not source review, except where explicitly marked. Primary target: the newest READY deployment at the time of testing, `thepassageappio-h82z27n0y-...vercel.app` (`release/10h-delivery` @ `d80c9f7c`), which is a superset build carrying case-detail, urgent/red, vendor/partner, and messaging together. All surfaces read from the same shared isolated project (`passage-cycle-7a-test`, `uyacxqtsiwlvtmhxvoxr`), so database-level findings below apply to any preview build reading from it, not just this one branch.

Findings are ordered by severity. A methodology note on two near-misses is included at the end because the corrections matter for how to read the rest of this document.

---

## P0 — Every invited family participant who isn't the space owner is locked out of case-detail and messaging

This is the most important finding in this sweep. It is **not** a regression introduced by carelessness — it's the visible gap left by an otherwise well-reasoned, well-documented privacy-hardening migration that shipped without its frontend consumer.

**What's happening, live:** Signed in as `dana-family-participant@passage.test`, an active `continuity_participants` row on the Rivera continuity space (relationship: Sibling, `category_scope: [updates, tasks]`, not revoked, not expired). Every route that should show her the case is denied:

- `/case/[id]/today` → "This case is not available to your account."
- `/case/[id]/messages` → "This case is not available to your account."

Signed in as `maya-family-owner@passage.test`, the actual `continuity_spaces.owner_user_id` for the same space, both routes work perfectly — real task data, real message thread, posting works both directions.

**Root cause, traced through migration history:** `passage_private.can_view_workflow_as_family()` gates the family branch of `can_view_workflow()`, which in turn gates `workflows`, `tasks`, `task_proofs`, and `task_proof_reviews` RLS. Through commit `family_case_workflow_grant` (2026-07-26) this correctly checked both the space owner and any active participant — confirmed working end-to-end in QA on 2026-07-27 (see `qa-2026-07-27-family-today-and-urgent-start.md`, PASS).

Then migration `participant_updates_case_scope` (2026-07-30) intentionally narrowed it:

> "The earlier family workflow predicate flowed into RLS for workflows, tasks, workflow_events, task_proofs, and task_proof_reviews. Adding a participant to that predicate would expose operator records that an updates-only participant does not need. Keep direct family-table reads for the continuity-space owner only and give participants one bounded, human-readable projection instead."

That's a sound call — participants shouldn't see raw operator-facing task/proof records the same way an owner does. The same migration created `public.list_participant_family_updates()`: a purpose-built, privacy-minimizing RPC that returns only a human-readable projection (case name, current step, plain-language status, latest update) with **no workflow, task, event, proof, review, organization, or member identifier** — exactly the shape a participant should get.

**The gap:** nothing calls it. A full code search (`list_participant_family_updates`, `participant_family_updates`, `family-safe participant`) across the repository returns zero matches. `lib/family/case-view.ts` (backing `/case/[id]/today`) and `lib/family/messages-view.ts` (backing `/case/[id]/messages`) both still route through `can_view_workflow()`/`can_view_workflow()`-via-`can_message_workflow()`. No route, component, or server action anywhere reads from the bounded projection the database has been offering since July 30.

**Messaging itself is fine — it's just unreachable.** `can_message_workflow()` (added with the messaging feature, 2026-07-28, hardened further 2026-08-10) correctly includes the participant branch with the same `'updates' = any(category_scope)` check `list_participant_family_updates` uses. Verified directly: calling `list_workflow_messages_client_safe('c7b10001-...')` as Dana (bypassing the page) returns her the real thread, correct sender labels, correctly marks nothing as `is_own`. The RPC layer is authorized correctly. The page in front of it isn't reachable because it's gated by the older, now-owner-only `can_view_workflow()`, not `can_message_workflow()`.

**Verified this is structural, not account-specific:**

| Identity | `workflows` row visible (SQL, RLS-impersonated) |
|---|---|
| Space owner (`maya-family-owner`) | Yes |
| Active participant, `updates` scope (`dana-family-participant`) | **No** |
| Revoked participant | No (correct) |
| Unrelated stranger | No (correct) |

**Impact:** the entire point of `continuity_participants` is to let a primary family contact invite others — siblings, a second parent, whoever — to also see updates without owning the space. That's not an edge case; it's the differentiator the architecture doc describes. Right now that group gets a flat, unexplained "this case is not available to your account" no matter what they do, on both the real-data case view and the brand-new messaging feature.

**Fix shape:** either (a) build the participant-scoped experience against `list_participant_family_updates()` (and a matching messages read for participants, which already exists and works — `list_workflow_messages_client_safe`), or (b) if the team decides participants should keep using `/case/[id]/today` and `/case/[id]/messages` directly, have those routes call `can_view_workflow_as_family` — no, sorry, call a predicate that includes updates-scoped participants (matching `can_message_workflow`'s pattern) instead of the current owner-only one, understanding that means participants will see the same raw task/proof shape the owner does, which is the exact tradeoff `participant_updates_case_scope` was written to avoid. This is a product decision, not just an engineering fix, and it's the one open item most likely to change what "M3 done" means for the PR #24 call.

---

## Resolved since the last pass (good news)

**Urgent intake submit — fixed, verified live.** The `p_receiving_organization_id` missing-parameter bug flagged in `qa-2026-07-27-family-today-and-urgent-start.md` (PR #71) is fixed (commit `e25c6d2d`, merged to `greenfield/passage-zero`). Ran the full `/start/situation` → `/start/people` → `/start/next` wizard twice end-to-end with brand-new accounts and real click events (not `form.requestSubmit()` — see methodology note below): "Request a callback from Northstar Funeral Home" correctly saves `status=submitted, wants_callback=true`; "Save privately" correctly saves `status=self_handling, wants_callback=false`. Reload-persistence on the "already saved" receipt is correct. The gateway copy is now honestly scoped ("Only an active owner or director at Northstar can open the request") instead of the earlier generic framing.

**Vendor category-specialty validation — confirmed landed.** PR #66's fix is visible live: the director's "Send a request to a vendor" form now shows "Category — Must match the chosen vendor's specialty above" next to the picker.

---

## PASS — no issues found

- **Public/marketing homepage.** Clean copy, correct "no real case is shown here" / preview disclaimers throughout, no runtime errors. The `PASSAGE_RUNTIME` Vercel env-var scoping issue noted in earlier messaging QA attempts does not reproduce on this build — the page loads and functions normally.
- **Family case-detail, owner path.** Real task data renders correctly; denial matrix (revoked participant, unrelated stranger) both correctly denied with clean copy and no data leak; reload-persistence holds; `Decisions/Tasks/Service/Costs` nav tabs are correctly `aria-disabled`, muted, non-interactive `<span>`s, not broken links.
- **Director persona.** `/director` (Today dashboard, bounded to "6 shown," not infinite scroll), `/director/team`, `/director/activity`, `/director/urgent` (claim queue) all render real data correctly. Case Room (Now/Tasks/Proof tabs, Vendors section, Messages section) works. Assign-task and verify-proof actions tested live and succeed.
- **Staff persona.** Full assign (director) → start (staff) → submit proof (staff) → verify (director) loop run live end-to-end on a real task; every state transition and the humanized "next state" copy were correct at each step.
- **Vendor/partner persona.** Full accept-with-quote → submit-delivery-proof loop run live end-to-end; cross-tenant denial confirmed (a rogue vendor account gets 0 rows querying another vendor's requests).
- **Messaging authorization and safety.** Correctly scoped for every identity that can reach it (owner, assigned staff, director); cross-tenant director denied with a clean error; a `<script>` payload posted as a message body round-trips as inert literal text (confirmed via `innerText`, no `alert()` fired, no script execution) — not vulnerable to stored XSS. Sender labels are plain language ("Director", "YOU"), no raw ids exposed to family.

## Lower severity

- **`/director/team` display-name collision.** Two different staff accounts — one revoked (`cycle7a-staff@passage.test`), one active (`qa-unassigned-staff@passage.test`) — both show as "Preview staff member" in their respective sections, with no other distinguishing detail on the card. A director scanning the list can't tell these are different people. Traced to both accounts sharing a generic fallback display name; worth checking whether a similar fallback could collide for real (non-test) accounts.
- **Login page framing is funeral-home-specific regardless of destination.** `/login?next=/case/.../messages` still renders the "FUNERAL-HOME WORKSPACE" heading and "An invitation does not grant family access" copy, even though the destination is a family route. Doesn't block sign-in (it works once submitted), but a family member following their own case link could be confused by the framing before it resolves correctly.
- **Anonymous demo builder (`/family`, `/director/intake`) spot-checked only.** Both are clearly labeled client-side-only demos ("this choice stays on this device," "will not create a real case"). No errors or jargon observed in a light pass; not deep-tested given time spent on the P0 above.
- **Message-thread bounded-height claim not stress-tested.** The messaging commit describes a bounded scrollable list (420px/320px mobile); current fixture data only has 2 messages per thread, not enough to verify the bound actually engages.
- **Genuine ~375px mobile viewport not re-verified this pass.** `resize_window` did not produce a true mobile layout viewport in this session (`window.innerWidth` stayed at 704 after requesting 390). No horizontal-overflow was observed at the width available. The prior sweep (`docs/evidence/passage-zero/cycle*-*-390.png` evidence) already validated mobile for the pre-messaging surfaces; messaging itself should get a real mobile pass once viewport tooling is sorted or a real device/emulator is used.

---

## Methodology note: two near-misses, corrected before writing this up

Two things looked like severe bugs mid-session and turned out to be testing artifacts. Recording them because the correction matters and because they're a useful warning for whoever QAs this next.

1. **`form.requestSubmit()` on multi-submit-button forms.** `/start/next`'s two action buttons (`Request a callback` / `Save privately`) are `<button type="submit" name="wantsCallback" value="true|false">` siblings in one form — correct, standard HTML. Triggering the form via `form.requestSubmit()` with no argument (my usual technique for React-controlled forms) does not attribute a submitter, so the browser omits `wantsCallback` entirely; the server then reads `null`, and `String(null) === 'true'` is `false` — so every programmatic submit silently landed on the private path regardless of which button was "clicked." Re-tested with a real `button.click()` on a fresh account and it worked correctly (see "Resolved since the last pass" above). Anywhere a page has two or more same-named submit buttons, use `.click()` on the actual element, not `requestSubmit()`.
2. **A "mismatched data" red herring on `/start/next`'s "already saved" screen** was the direct downstream effect of (1) — the screen was correctly showing a genuinely-saved-privately prior record, not blending stale and fresh state.

---

## Recommendation

Everything except the P0 above is in solid shape — the fixes since the last pass are real and verified, and the newly-built surfaces (staff proof loop, vendor accept/proof loop, messaging's own authorization and XSS-safety) all held up under live testing. The one open item that should shape the PR #24 call is the participant-access gap: it's a product decision (build the bounded participant view vs. loosen the gate) as much as an engineering one, and it currently means the multi-participant family experience — the thing that distinguishes this from a single-contact intake form — doesn't work for anyone but the space owner.
