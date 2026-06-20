# Cycle 5 App Migration Handoff

Date: 2026-06-20
Status: PM and UI/UX complete for handoff; Development implementation blocked until writable Cycle 0.
Commit discipline: `[skip deploy]` only. No production deploy from this cycle.

## Context

The owner directed the next sprint to be a complete product, website, task functionality, and mobile experience overhaul, not a cosmetic UX pass. The product north star remains the calm guided OS, with the mantra:

> The operating system for life's hardest logistics.

Remote `main` has the calm-OS foundation: `lib/designSystem.js`, `components/calm/CalmKit.js`, `components/calm/CalmControls.js`, and preview surfaces. Workflow checkout was bumped to `actions/checkout@v5` in commit `994aed7`.

Full Cycle 0 is still pending because the active Codex workspace was read-only/stale. The next writable release-train agent must run LF normalization, touch `docs/agent-operating-context.md`, and commit `[skip deploy]` before implementation.

## Role Handoffs

### Product Manager Agent

- Role instance / delegated agent: `019ee501-ad6b-7db2-8dfd-ebea877c45bd` (`Dewey`).
- Sprint brief status: COMPLETE for UI/UX handoff; BLOCKED from Development until Cycle 0 runs in a writable checkout.
- Sprint goal: rebuild `components/App.js` into the first real calm family Today/app plus logged-out landing experience where a grieving user reaches the one next action in three taps on mobile, using CalmKit/status spine and preserving existing backend contracts.
- Roadmap item: on-roadmap. Ties to the single admin roadmap operating-step foundation/persona UAT path and calm-OS sprint doctrine. Do not create a second roadmap.
- Personas: family coordinator and logged-out public visitor first; funeral-home director/employee/vendor/participant surfaces remain in the migration backlog.
- User problem: the current product feels stitched together, clunky, internally worded, and weak on mobile. Expected behavior is one calm, plain-language system: what matters now, who owns it, what is waiting, what Passage prepared, and what proof is saved.

Requirements:

- Rebuild `components/App.js` on `lib/designSystem.js`, CalmKit, and CalmControls.
- Render status only through `deriveCalmStatus()` / `present()`.
- Preserve existing `/api`, Supabase, auth, and task contracts.
- No schema/API changes.
- No internal vocabulary.
- Design unauthenticated, empty, loading, error, and real-data states.
- Keep old surface for one release as rollback.

Sprint components:

- Cycle 0 normalization/context patch classification.
- `App.js` flow/API inventory.
- UI/UX acceptance map for logged-out landing + family Today.
- Status/data adapter over existing estate/task data.
- CalmKit family surface implementation.
- Rollback-safe cutover.
- Desktop/mobile QA.

Development objectives:

- Migrate; do not rewrite backend logic.
- Use shared helpers and existing task APIs.
- Create a role-aware family home with one primary next action, secondary when-ready work, waiting/proof visibility, and mobile-first navigation.
- Keep public landing copy aligned to: "The operating system for life's hardest logistics."

Acceptance criteria:

- Cycle 0 `[skip deploy]` normalization complete.
- Status rendered only via the spine.
- Family next action reachable in three taps at `390x844`.
- No horizontal overflow at `390x844` or `360x640`.
- No hydration warnings.
- `publicSurfaceReadiness` clean.
- Empty/loading/error states visible.
- `npm run agent:check`, `git diff --check`, clean `npm run build`, and Playwright desktop `1366x900` + mobile green.

Dependencies:

- Writable current checkout.
- LF normalization.
- Missing `passage-direction-context-roadmap.patch` located or formally classified.
- Node deps.
- Playwright Chromium installed if absent.
- Supabase/auth env or seeded demo fallback.
- Existing APIs stable.
- Vercel deploy budget.

QA/deploy plan:

- QA should verify source checks, build, Playwright screenshots, mobile tap/scroll/overflow, console/hydration, logged-out landing, auth entry, family demo/real-data Today view, empty/loading/error states, and no user-facing internal words.
- All work stays `[skip deploy]` until a coherent App.js slice is green.
- Production requires owner-gated `[deploy] [qa-approved]`. Owner is only the deploy/permission gate, not the restart mechanism.

Non-goals:

- No schema migration.
- No API contract change.
- No new payments/vendor integration.
- No full funeral-home dashboard migration.
- No production deploy in this cycle.

Unrelated finding / backlog disposition:

- `passage-direction-context-roadmap.patch` is a missing-context Cycle 0 item, not an owner bottleneck yet. Writable PM must search local outputs/GitHub; if still absent, classify in context as `missing-context / superseded unless new roadmap doctrine is found`, then proceed.

Best-practice research basis:

- Repo north star, sprint, migration, and roadmap docs.
- NN/g heuristics for status visibility, real-world language, error prevention, and minimalist design.
- WCAG 2.2 for focus, labels, target size, and accessible auth.
- web.dev Core Web Vitals for LCP/INP/CLS.
- Empathy as bereavement-care comparator.

### UI/UX Review Agent

- Role instance / delegated agent: `019ee504-3fe2-77e1-9e97-a2650b7132b0` (`Archimedes`).
- UX status: PASS for the acceptance bar and Development handoff. Current `App.js` is not release-passable as-is. Development remains blocked until writable Cycle 0 is complete.
- Surfaces: `components/App.js` family app + logged-out landing, with later `pages/index.js` cutover when green.
- Personas: family coordinator, urgent grieving user, planning-ahead public visitor.
- UX objective: turn `App.js` into the first real calm Today surface: one primary next action, a short when-ready list, waiting-on-others visibility, proof saved underneath, and a public first impression aligned to the mantra.

Must feel different because:

- Current `App.js` is a 5k-line mixed surface with bespoke tokens, pricing, onboarding, Supabase calls, static task data, dashboard behavior, `humanStatus()`, and visible internal product language like "Family operating sheet." The rebuild must change the workflow model, not repaint the current one.

UX acceptance:

- Status renders only through `deriveCalmStatus()` / `present()` and `CalmStatusPill`.
- Build on CalmKit / CalmControls; no new bespoke `App.js` design system.
- Family home structure: `Start here`, `When you're ready`, `Waiting on others`, `Proof saved`.
- One obvious primary action per screen; secondary actions grouped under details.
- No visible internal vocabulary: no lane, sheet, spine, operating model, roadmap, sprint, QA, ARR.
- Logged-out landing uses the mantra and shows the calm coordination promise, not a generic marketing wall.
- Empty, loading, API error, auth-required, no-estates, and no-next-action states are designed.
- Three-tap mobile path at `390x844`: open app -> open next action -> act/review/save.
- No horizontal overflow at `390x844` or `360x640`; 44px tap targets; real sheet scrolling.
- Existing `/api`, Supabase, auth, checkout, `/api/myEstates`, `/api/tasks/:id/status`, and `/api/tasks/:id/send` contracts preserved.
- Old surface kept for one release as rollback.

Copy/content checks:

- Use plain family language: "Needs you," "Waiting on Maria," "Saved to your family record."
- Replace "proof destination" with "Where this is saved."
- Replace "prepared output" with "Passage prepared."
- Keep "Nothing sends without your review" visible near message actions.

Chrome/browser proof needed:

- `/` logged out.
- Google/auth entry.
- Signed-in family Today.
- Empty state.
- Loading skeleton.
- API error state.
- Task sheet open/close.
- Review-before-send.
- Save status/proof.
- Viewports: desktop `1366x900`, mobile `390x844`, mobile `360x640`.
- Evidence: screenshots, console with zero hydration warnings, no horizontal overflow, visible three-tap path, publicSurfaceReadiness clean.
- If Chromium is missing, Development/QA should run `npx playwright install chromium`.

### Development Engineer Agent

- Role instance / delegated agent: `019ee508-08ea-7b11-bf23-186b85dc7c5c` (`Cicero`).
- Scope implemented: none.
- Status: BLOCKED from code implementation because this workspace is read-only/stale and full Cycle 0 is still pending.
- Files changed: none.
- Data/API behavior changed: none.
- UX behavior changed: none.

Development block:

Development is blocked on environment, not owner approval. A writable current checkout must first run Cycle 0: LF normalization, context touch/update, missing `passage-direction-context-roadmap.patch` locate/classify, `[skip deploy]` commit. This role must not claim build, Playwright, or implementation from the read-only checkout.

Proposed file plan:

- Copy current `components/App.js` to `components/AppLegacy.js` for one-release rollback.
- Rebuild `components/App.js` as the new calm entry wrapper.
- Add `components/family/FamilyTodayApp.js` for the signed-in family Today surface.
- Add `components/family/familyTodayAdapter.js` for pure task/workflow adapter logic.
- Add `components/family/FamilyTaskSheet.js` only if CalmKit `TaskSheet` cannot support review/save/send flows cleanly.
- Leave `pages/index.js` thin. Rollback is one line: point it or `components/App.js` back to `AppLegacy`.

Data adapter plan:

- Load auth via `supabase.auth`.
- Load estates via `/api/myEstates` with bearer token, preserving fallback behavior.
- Load tasks from existing Supabase `tasks` rows for selected workflow.
- Normalize DB/static task rows using current `buildTaskList` / `normalizeFamilyStepForContract` behavior.
- Run `taskOperatingContractFor(normalized, { role: 'family', estateName })`.
- Run `deriveCalmStatus(normalized, { viewer: user, operatingStatus: contract.status })`.
- Map to CalmKit view models: `statusKey`, `who`, `title`, `why`, `action`, `details`, `proofDestination`, `visibility`.

Sections:

- `Start here`: first highest-priority actionable item.
- `When you're ready`: next actionable items.
- `Waiting on others`: waiting/blocked external items.
- `Proof saved`: done/completed items with saved proof language.

Implementation steps once writable:

1. Complete Cycle 0 and commit `[skip deploy]`.
2. Preserve legacy App as rollback.
3. Build calm logged-out landing with the mantra.
4. Keep planning/urgent/checkout flows routed through legacy fallback unless PM explicitly scopes their full migration now.
5. Build signed-in family Today surface on CalmKit / CalmControls.
6. Wire task sheet save/send/review to existing `/api/tasks/:id/status`, `/api/tasks/:id/send`, `/api/sendEmail`.
7. Add loading, empty, API error, auth-required, no-estates, and no-next-action states.
8. Update `docs/agent-operating-context.md` and `docs/rebuild-progress.md`.

Checks to run:

- `git diff --check`
- `npm run agent:check`
- `npm run build`
- `npx playwright install chromium` if Chromium is missing
- Playwright desktop `1366x900`
- Playwright mobile `390x844` and `360x640`
- Verify zero hydration warnings, no horizontal overflow, 44px tap targets, task sheet open/close, review-before-send, save status/proof, logged-out landing, auth entry, signed-in Today, empty/loading/error states.

Known gaps returned to PM:

- Missing `passage-direction-context-roadmap.patch` must be found or classified during Cycle 0.
- First App slice should preserve legacy plan/urgent/checkout paths unless PM wants a larger migration batch.
- QA needs seeded/demo signed-in family data; do not send real outbound messages during testing.

QA handoff:

QA is NOT READY because no implementation occurred. Once writable Development completes the slice, QA should validate only the first migrated family/public App slice against the UI/UX acceptance bar, then return FAIL/PARTIAL to PM if anything misses.
