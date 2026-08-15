# QA: family `/case/[id]/today` real-data wiring + urgent/red `/start/*` persona

Independent QA per `docs/agents/qa.md`. Two surfaces covered below. Preview builds tested against the shared isolated lab (`passage-cycle-7a-test`, `uyacxqtsiwlvtmhxvoxr`).

## 1. `/case/[id]/today` (PR #59, family real-data wiring) — PASS

Tested on `thepassageappio-adlacsyx0-...vercel.app` (commit `0a3d5660`, first READY build after PR #59 merged).

- **Real data renders correctly.** Signed in as the seeded active participant (`dana-family-participant@passage.test`, Rivera continuity space). `/case/c7b10001.../today` shows the real workflow's live task copy ("Confirm the receiving location before transport dispatch", "Transport team is on this") — matches what director/staff see for the same case. No raw `case_reference`, workflow id, or other internal identifiers leak into the rendered text.
- **Denial matrix (SQL, RLS-level, then corroborated live):**
  - Active participant → visible (1 row). Control, correct.
  - Revoked participant (fresh fixture, `continuity_participants.status='revoked'`, same continuity space) → 0 rows. Correct.
  - Unrelated stranger with no participant row at all → 0 rows via SQL, and live in the browser the route renders a clean "This case is not available to your account. Nothing changed, and no case details were shown." with no leaked info. Correct, and good copy.
- **Reload-persistence:** hard reload on `/today` re-renders the same real data from a cold load (no client-only state loss).
- **Nav:** `Decisions / Tasks / Messages / Service / Costs` are present but correctly non-interactive (`aria-disabled="true"`, muted color, plain `<span>` not `<a>`) — they're future scope, not a broken affordance. Only `Today` is a live link. This is fine for a thin slice, not a defect.

No bugs found on this surface. Recommend `[qa-approved]` for PR #59 on this axis.

## 2. `/start/*` urgent/red family persona (PR #62) — **FAIL, submit is broken for every user**

Tested on `thepassageappio-gaahah9f5-...vercel.app` (commit `1ff3d986`, the READY build for this feature). Ran the full wizard live end-to-end: `/start` → `/start/situation` → `/start/people` → `/start/next`, both as a fresh signup and as an existing signed-in user.

**Step 1 and 2 are solid.** Plain language throughout, no jargon, one question at a time, "Nothing is sent anywhere yet" reassurance on step 1, immediate safety guidance on step 3 ("If you have not already, call 911. Do not move the person unless emergency services tell you to.") ahead of any account/save prompt — matches the at-need, crisis-first intent described in `docs/product/persona-action-architecture.md`.

**Step 3's save action is 100% broken.** Both terminal buttons — "Request a callback from Passage" and "I'll take this step myself for now" — call the same `submitUrgentIntake` server action (`app/start/actions.ts`), and both fail every time with "Passage could not save this right now. Nothing was lost — try again in a moment." Reproduced repeatedly, both as a brand-new account and as an existing signed-in user, so this is not session/rate-limit noise on our end.

**Root cause, confirmed at the SQL level:**

`app/start/actions.ts` calls the RPC without the organization parameter:

```ts
const result = await client.rpc('submit_urgent_intake_idempotent', {
  p_situation_category: situationCategory,
  p_person_name: personName,
  p_person_location: personLocation,
  p_person_timing: personTiming || null,
  p_coordinator_name: coordinatorName,
  p_coordinator_phone: coordinatorPhone || null,
  p_coordinator_email: coordinatorEmail || null,
  p_callback_notes: callbackNotes || null,
  p_wants_callback: wantsCallback,
  p_request_id: requestId,
});
```

But the deployed SQL function's signature is:

```
submit_urgent_intake_idempotent(
  p_receiving_organization_id uuid, p_situation_category text, p_person_name text,
  p_person_location text, p_person_timing text, p_coordinator_name text,
  p_coordinator_phone text, p_coordinator_email text, p_callback_notes text,
  p_wants_callback boolean, p_request_id uuid
)
```

`p_receiving_organization_id` has **no default** (`pronargdefaults = 0` on both overloads in `pg_proc`). Calling it without that argument fails before the function body ever runs:

```
ERROR: 42883: function submit_urgent_intake_idempotent(p_situation_category => unknown, ...) does not exist
HINT: No function matches the given name and argument types.
```

That's a Postgres "no matching overload" error, which PostgREST surfaces as a schema-cache/404-class error — not `28000` (auth) or `22023` (validation), the only two codes `actions.ts` special-cases. Every call falls through to the generic catch-all, which is exactly the message the UI shows.

This looks like a wiring regression between the migration and the client: the SQL side added a hardcoded single-org routing check (`p_receiving_organization_id is distinct from 'c7a00001-...'::uuid` → `"The selected funeral home is unavailable for this preview"`) as a deliberate thin-slice simplification, but `app/start/actions.ts` was never updated to pass that parameter at all.

**Impact:** every real user who goes through the crisis-intake flow and reaches step 3 — the entire point of this feature — cannot save their situation or request a callback. The 2-3 `urgent_intake_requests` rows already in the isolated project's `case_created` state predate this regression (they're from an earlier version of the code path, not reproducible against the currently deployed build).

**Fix needed:** either have `actions.ts` pass `p_receiving_organization_id: 'c7a00001-7a00-47a0-87a0-000000000001'` (matching the SQL's hardcoded preview org) or, better, remove the hardcoded single-org check from the SQL function if multi-org routing was intended for this thin slice — worth a PM call on which is correct before re-shipping. Either way, this needs a fix + a re-run of this exact repro (sign in, fill situation → people → next, click either terminal button) before `[qa-approved]`.

**Also worth a copy pass while this is being fixed:** the failure message ("try again in a moment") implies retrying will help, but this fails deterministically on every attempt until the code changes — worth a not-a-transient-error copy variant if there's ever a case where "unavailable" really does mean try again vs. never will.

Recommend PR #62 return to PM/engineering — **do not `[qa-approved]`** until the submit path is fixed and re-verified.

### Test fixtures left in the isolated project (for reuse)

- `qa-revoked-participant@passage.test` — pre-revoked `continuity_participants` row on the Rivera continuity space, for denial-matrix reuse.
- `qa-stranger-family@passage.test` — no participant/workflow access at all, for denial-matrix reuse.
- Password on all QA fixtures above and on `dana-family-participant@passage.test`: `QaAudit2026!Passage`.
