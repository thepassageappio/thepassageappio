
# Agent Operating Context -- Addendum, 2026-07-14 (Run 14, Cowork session)

Dated addendum to docs/agent-operating-context.md. Resumes after run 13 hit its usage cap mid-task (second time this project). Triggered via "Passage Release Train: start the loop." from the owner (Steve), with an extended brief authorizing genuine greenfield rebuild (not re-skin), backend/schema changes via real migrations, the QR Transfer Pass feature, and standing pre-authorization to proceed without pause on anything already covered by AGENTS.md's Agent Permissions section.

## Role instance

Single Cowork session acting across PM/Dev/QA-review roles for a verification + documentation pass (no code shipped this run -- see "What this run did not do" below). Tool access: GitHub MCP (read/write), Supabase MCP (loaded, not used this run), Vercel-adjacent MCP (loaded, not used), Claude-in-Chrome MCP (used for live QA), `mcp__workspace__bash` (confirmed unavailable again this session -- "Workspace still starting" / "not supported on this device" -- same constraint every prior session has hit for large-file work and non-minified dev builds).

## What this run did

1. **Verified prior-session state honestly rather than trusting the incoming brief at face value.** Read AGENTS.md, the rollout tracker, `docs/greenfield-rebuild-plan-2026-07-14.md`, and this file's run-12 addendum directly from GitHub. Confirmed: the greenfield rebuild plan doc and the tracker update were in fact committed before run 13 ended (commits `a6c9fc2` and `944ce9e`). Confirmed the font-system unification fix was **already shipped in run 13** (commit `3d881fde684fcc8cfdf5a828d2df87366364175a`, `lib/typography.js` + `pages/_document.js`) -- did not redo it.
2. **Rebuilt the visual dependency map from scratch.** The rebuild-plan doc references a map "generated and shown this session" (run 13) titled `passage_persona_journey_dependency_map` -- but `show_widget` renders are ephemeral to their originating session and are not retrievable by a later session, so that map could not be recovered regardless of whether it finished. Built two fresh diagrams instead, grounded in the same source docs plus direct code reads this run: `passage_current_state_system_map` (personas, core shared surfaces, known live issues, monolith sizes) and `passage_target_state_threshold_architecture` (one estate record at the center, every persona connected to it, the QR Transfer Pass consent spine from Hospice through Estate Administration with its two new Supabase tables, and the compliance-copy gate called out explicitly).
3. **Live-reverified the run-12 hydration bug rather than assuming it still applies.** Using the Claude-in-Chrome MCP against production (`www.thepassageapp.io`):
   - `/trust`: fresh load throws minified React errors #425, #418, #423 (confirmed via `react.dev/errors/425` = "Text content does not match server-rendered HTML"). Screenshot taken.
   - `/faq`: fresh load with console cleared first throws **zero** errors, confirming it is still clean (my first, un-cleared read initially looked like a regression on `/faq` too -- that was stale carried-over console buffer from the prior navigation, not a new failure; re-tested properly with `clear:true` and it resolved).
   - `/funeral-home/dashboard`: screenshot taken (unauthenticated sign-in gate view).
4. **Static root-cause investigation, not a guess-and-ship fix.** Read `pages/trust.js`, `pages/mission.js`, `pages/story.js`, `pages/faq.js`, `components/SiteChrome.js`, `pages/_document.js`, `next.config.js`. Findings:
   - The three affected pages are otherwise unremarkable -- `trust.js` has no state/effects at all, yet still throws, which rules out page-local `useState`/`useEffect` timing as the sole cause.
   - `components/SiteChrome.js`'s `SiteHeader` computes `currentPathWithQuery` using `typeof window !== 'undefined' ? window.location... : asPath` directly in the render body (not gated behind the component's own `hydrated` state flag, unlike the correctly-guarded `estateActive` a few lines above it) -- a classic hydration-mismatch pattern. However, tracing where that value is actually used in JSX (the sign-in link, gated behind `localAuthReady`, which starts `false` identically on server and client for these uncontrolled marketing-page usages) suggests it likely isn't the trigger for the *first-paint* mismatch, though it remains a latent risk worth fixing regardless.
   - `next.config.js`'s CSP `style-src` directive is `'self' 'unsafe-inline'` only -- it does not allowlist `fonts.googleapis.com`, which is where both the per-page `@import` and the new global `_document.js` `<link rel="stylesheet">` load Fraunces/Inter from. In principle this should block the stylesheet fetch, but the live screenshot shows Fraunces rendering correctly on `/trust`, so this is not the active cause of the hydration errors either -- flagging as a secondary, lower-confidence finding worth a dedicated CSP audit, not conflating it with the hydration bug.
   - **Root cause not conclusively identified.** Consistent with run 12's own conclusion, this needs a non-minified local dev build to get the real (non-minified) React warning text, which requires working shell/build tooling this session does not have (bash confirmed unavailable again). Not shipping a guessed fix -- the existing docs are explicit that an unverified guess on a live bug risks making it worse and burns deploy budget for nothing.

## What this run did not do

- No code was committed. No migrations were applied.
- Did not attempt `pages/funeral-home/dashboard.js` (449KB) or `pages/estate.js` (313KB) extraction/rebuild -- both exceed what can be safely hand-transcribed through the GitHub content API in a single context window (the rebuild plan itself flags this and recommends a CI-based extraction job instead, which has been scoped but not built by any session yet).
- Did not build the QR Transfer Pass V1 UI or apply the `transfer_pass_tokens`/`transfer_pass_consents` migrations -- per the plan doc's own sequencing, the `provider_handoffs` reuse-vs-new-table decision needs to be made first, and that decision plus the migration write-up is real, undone work, not a checkbox.

## Next highest-leverage action, in order

1. A session with real shell/non-minified-build tooling reproduces the `/trust`/`/mission`/`/story` hydration errors locally, gets the actual React warning text, and ships a verified hotfix. This has now been the top-flagged item for two consecutive runs (12 and this one) and is still blocked purely on tooling, not on missing analysis.
2. `estate.js`'s literal `??` render bug -- small, isolated, high-visibility fix, independent of the larger IA rebuild.
3. `pages/funeral-home/dashboard.js` CI-based extraction (GitHub Actions workflow + Node/AST script, run on a throwaway branch, mechanical move of the 8 confirmed top-level components into `components/funeral-home/dashboard/*.js` with zero behavior change) -- this is real engineering work suited to a dedicated session/subagent with room to design and dry-run the script, not a five-minute add-on.
4. `provider_handoffs` reuse-vs-new-table decision, then the two QR Transfer Pass migrations via Supabase MCP `apply_migration`.
5. QR Transfer Pass V1 build (token generation UI, scan/accept UI, packet download) with compliance-safe copy only, per the rebuild plan's Section 5 gate.

## Honest note

Every verification in this addendum (font-fix status, hydration bug reproduction, `/faq` clean status) is backed by either a direct GitHub file read or a live browser screenshot/console read this run -- not carried forward from a prior session's claim without checking. The hydration bug specifically was re-verified live, not assumed from the tracker.
