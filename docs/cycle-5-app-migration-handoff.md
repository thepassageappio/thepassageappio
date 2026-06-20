# Cycle 5 App Migration Handoff

Date: 2026-06-20
Status: PM and UI/UX complete; first remote App slice implemented as `[skip deploy]`; full Cycle 0, local build, and Playwright QA still pending in a writable checkout.

## Current Truth

The owner directed the next sprint to be a complete product, website, task functionality, and mobile experience overhaul, not a cosmetic UX pass. The product north star remains the calm guided OS, with the mantra:

> The operating system for life's hardest logistics.

Remote `main` has the calm-OS foundation: `lib/designSystem.js`, `components/calm/CalmKit.js`, `components/calm/CalmControls.js`, and preview surfaces. Workflow checkout was bumped to `actions/checkout@v5` in commit `994aed7`.

This Codex session could not safely run repo-wide LF normalization, local build, or Playwright because the local workspace was read-only/stale. That is an environment limitation, not an owner gate. To keep the train moving, the first App migration slice was implemented through the GitHub contents API as `[skip deploy]` commits.

Production was not deployed. Owner remains only the deploy/permission gate, not the restart mechanism.

## Role Handoffs

### Product Manager Agent

- Role instance / delegated agent: `019ee501-ad6b-7db2-8dfd-ebea877c45bd` (`Dewey`).
- Sprint brief status: COMPLETE for UI/UX and Development scope.
- Sprint goal: rebuild the first real family/public app surface into a calm family Today/app plus logged-out landing experience where a grieving user reaches the one next action in three taps on mobile, using CalmKit/status spine and preserving existing backend contracts.
- Roadmap item: on-roadmap. Ties to the single admin roadmap operating-step foundation/persona UAT path and calm-OS sprint doctrine. Do not create a second roadmap.
- Personas: family coordinator and logged-out public visitor first; funeral-home director/employee/vendor/participant surfaces remain in the migration backlog.
- User problem: the current product feels stitched together, clunky, internally worded, and weak on mobile. Expected behavior is one calm, plain-language system: what matters now, who owns it, what is waiting, what Passage prepared, and what proof is saved.

Requirements:

- Rebuild on `lib/designSystem.js`, CalmKit, and CalmControls.
- Render status only through `deriveCalmStatus()` / `present()`.
- Preserve existing `/api`, Supabase, auth, and task contracts.
- No schema/API changes.
- No internal vocabulary.
- Design unauthenticated, empty, loading, error, and real-data states.
- Keep old surface for one release as rollback.

### UI/UX Review Agent

- Role instance / delegated agent: `019ee504-3fe2-77e1-9e97-a2650b7132b0` (`Archimedes`).
- UX status: PASS for the acceptance bar and Development handoff.
- Surfaces: home route / family app + logged-out landing.
- Personas: family coordinator, urgent grieving user, planning-ahead public visitor.
- UX objective: turn the old App surface into the first real calm Today surface: one primary next action, a short when-ready list, waiting-on-others visibility, proof saved underneath, and a public first impression aligned to the mantra.

UX acceptance:

- Status renders only through `deriveCalmStatus()` / `present()` and `CalmStatusPill`.
- Build on CalmKit / CalmControls; no new bespoke design system.
- Family home structure: `Start here`, `When you're ready`, `Waiting on others`, `Proof saved`.
- One obvious primary action per screen; secondary actions grouped under details.
- No visible internal vocabulary: no lane, sheet, spine, operating model, roadmap, sprint, QA, ARR.
- Logged-out landing uses the mantra and shows the calm coordination promise, not a generic marketing wall.
- Empty, loading, API error, auth-required, no-estates, and no-next-action states are designed.
- Three-tap mobile path at `390x844`: open app -> open next action -> act/review/save.
- No horizontal overflow at `390x844` or `360x640`; 44px tap targets; real sheet scrolling.
- Existing `/api`, Supabase, auth, checkout, `/api/myEstates`, `/api/tasks/:id/status`, and task action contracts preserved.
- Old surface kept for one release as rollback.

Copy/content checks:

- Use plain family language: "Needs you," "Waiting on Maria," "Saved to your family record."
- Replace "proof destination" with "Where this is saved."
- Replace "prepared output" with "Passage prepared."
- Keep "Nothing sends without your review" visible near message actions.

## Remote Development Implementation

Implementation was done remotely via GitHub commits because the local checkout could not be written. This is a source slice, not a QA-approved release candidate.

Commits:

- `e921925` - `components/family/familyTodayAdapter.js`
- `5bad282` - `components/family/FamilyTaskSheet.js`
- `f542449` - `components/family/FamilyTodayApp.js`
- `f7336ea` - `components/AppCalm.js`
- `ab38681` - `pages/index.js` now imports `AppCalm`
- `4b2a2df` - responsive landing grid fix
- `fe10cde` - accessible email form markup cleanup

Files changed:

- `components/AppCalm.js`: new calm app entry. Logged-out landing uses the mantra, Google sign-in, magic-link email, urgent/funeral-home links, and a calm Today preview. Signed-in users route into `FamilyTodayApp`. Legacy app remains accessible through `/?legacy=1`.
- `components/family/familyTodayAdapter.js`: maps existing workflow/task rows through `taskOperatingContractFor()` underneath and `deriveCalmStatus()` on top. Produces CalmKit view models for `Start here`, `When you're ready`, `Waiting on others`, and `Proof saved`.
- `components/family/FamilyTodayApp.js`: signed-in family Today surface. Loads family records via `/api/myEstates` with bearer token, falls back to Supabase `workflows`, loads `tasks`, renders CalmKit AppShell/HeroTask/TaskRow/ProgressLine, and saves status updates through `/api/tasks/:id/status`.
- `components/family/FamilyTaskSheet.js`: review/save task sheet with `CalmStatusPill`, `Passage prepared`, `Nothing sends without your review`, status options, private note, and save-to-family-record action.
- `pages/index.js`: thin route seam now imports `AppCalm`.

Rollback:

- Old `components/App.js` was not modified.
- `/?legacy=1` renders the old App immediately.
- Full rollback is a one-line `pages/index.js` import change back to `../components/App`.

Data/API behavior:

- No schema changes.
- No API contract changes.
- Reads existing `/api/myEstates` and Supabase `workflows`/`tasks`.
- Writes existing `/api/tasks/:id/status` with `handled`, `waiting`, or `blocked`, which the API already accepts.
- Does not send real outbound messages in this first slice; the sheet copies prepared text and saves reviewed status/proof.

UX behavior changed:

- `/` now starts on a calm logged-out landing for unauthenticated users.
- Signed-in users see a mobile-first family Today surface organized by one next action, when-ready work, waiting items, and saved proof.
- Status rendering uses the calm status spine through the adapter and CalmKit display primitives.
- Internal wording is cleaned in the adapter before rendering family-facing details.

Known gaps:

- Cycle 0 LF normalization still must run in a writable checkout.
- `docs/agent-operating-context.md` still needs the cycle handoff recorded from a writable checkout; this session avoided replacing that large file through the single-file API to prevent corruption.
- `passage-direction-context-roadmap.patch` still must be found or classified during Cycle 0.
- Local `npm run agent:check`, `git diff --check`, `npm run build`, and Playwright were not run in this session.
- Browser proof is still required before any deploy candidate.
- QA needs seeded/demo signed-in family data; do not test by sending real outbound messages.

## QA Handoff

QA is READY for source/build/browser validation of this slice, but NOT ready for deploy approval.

QA should verify:

- `git diff --check`
- `npm run agent:check`
- `npm run build`
- `npx playwright install chromium` if Chromium is missing
- Playwright desktop `1366x900`
- Playwright mobile `390x844` and `360x640`
- `/` logged out renders the new calm landing
- `/?legacy=1` renders the old App fallback
- Google/auth entry remains available
- signed-in family Today loads from existing records
- empty state, loading skeleton, API error state, and no-next-action state render cleanly
- task sheet open/close works
- save status/proof hits `/api/tasks/:id/status`
- no horizontal overflow at mobile widths
- zero hydration warnings
- no visible internal vocabulary on user-facing surfaces
- `publicSurfaceReadiness` remains clean

If QA fails, return to PM before more implementation. If QA passes, keep this as `[skip deploy]` until a coherent owner-gated release candidate is approved with `[deploy] [qa-approved]`.
