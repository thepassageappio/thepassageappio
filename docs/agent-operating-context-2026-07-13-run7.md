# Agent Operating Context — Run 7 Addendum (2026-07-13)

## What shipped

Batch 7 of the Threshold UX redesign, family/core-auth section, per `docs/redesign/12-threshold-rollout-tracker.md`. Continuation of runs 3-6's proven presentation-only re-skin pattern.

**Release commit:** `0ab27a9c4eadd07ea87a505e7895fdd88aaf75fe` — `pages/login.js`, `pages/accept.js`, `pages/confirm.js`, `pages/participants.js`.

**Same-day hotfix commit:** `815ad94de9f8b61e1cc66c14a63d6420d58abb93` — `pages/confirm.js` only, styled-jsx scoping bug (see below).

**Docs commit:** `c3d2255da48cc4548970c18ea9c7b098053c8e65` — tracker update `[skip deploy]`.

All four pages are real, live, production-deployed under `pages/` — not `docs/redesign/*.html` mockups. Per AGENTS.md's definition of done, this is what counts as "the redesign" being live.

### Per-page summary

- **`pages/login.js`** — main sign-in hub, 7 portal cards (family/participant/funeral-home director/staff/vendor owner/employee/admin). Preserved byte-identical: Supabase OAuth-hash consumption (`consumeSupabaseOAuthHash`), `getSession`/`onAuthStateChange`, admin-routing logic (`isSystemAdminUser`, `routeIfAdmin`), `getServerSideProps` safe-next handling, all `trackEvent` calls (`login_google_clicked`, `login_urgent_clicked`, `login_workspace_card_clicked`).
- **`pages/accept.js`** — participant invite acceptance. Preserved byte-identical: `router.query` token/invite/invite_token handling, `signIn()`/`sendMagicLink()`/`acceptInvite()`/`signOut()`, the three `useEffect`s (session watch, preview load, auto-accept), `/api/invitePreview` + `/api/acceptParticipantInvite` contracts.
- **`pages/confirm.js`** — death-confirmation multi-step flow (loading/error/already/done/enter states). Preserved byte-identical: all 8 `useState` hooks (kept the pre-existing `var s = useState(...); var x = s[0]; var setX = s[1];` destructuring style rather than refactoring it, to minimize diff risk), the Supabase `workflows` table query, `submit()`/`/api/confirmTrigger` contract. **Shipped with a real bug — see Incident below.**
- **`pages/participants.js`** — static participant-portal marketing page. Preserved byte-identical: session watch, `signOut()`, all `trackEvent` calls (`participant_public_cta_clicked` x3).

### Finding: `pages/participating.js` is a thin wrapper, not a re-skin target

Same pattern as `pages/vendors/request.js` from run 5. It renders `components/participant/ParticipantApp.js` (26.7KB) by default, or `components/participant/LegacyParticipating.js` (83.6KB) behind an explicit `?legacy=1` QA flag read in a `useEffect` (SSR-safe, no hydration mismatch). `ParticipantApp.js` is the live code path and the correct future re-skin target. This also resolves the open question flagged in the tracker's "Components that need a status check" section about `components/participant/`.

## Incident: confirm.js shipped unstyled to production, hotfixed same-day

The live post-deploy render check (screenshots via Claude-in-Chrome on `https://www.thepassageapp.io/confirm`) found the page rendering as plain black-on-white unstyled HTML — no Fraunces font, no card, no button styling — while `login.js`, `accept.js`, and `participants.js` all rendered correctly with full Threshold styling.

**Root cause:** `confirm.js` uses a `shell(content)` helper function to wrap five different conditional JSX branches (`loading`/`error`/`already`/`done`/`enter` states) in shared page chrome (`<main>`, global tokens, `<SiteFooter>`). The page-scoped `<style jsx>` block for shell-level classes (`.box`, `.kicker`, `.headline`, `.th-btn`, etc.) lived inside `shell()`'s own returned JSX. babel-plugin-styled-jsx's scoping transform only applied its generated scope class (e.g. `jsx-c430098a3892989`) to elements inside `shell()`'s own directly-returned tree (`<main>` and `<div className="outer">`) — it did NOT apply that scope class to the `content` argument's elements, because that JSX was authored in a separate `return (shell(<div className="box">...))` statement in a different code branch. Scoped CSS selectors like `.box.jsx-c430098a3892989` therefore never matched the actual unscoped `.box` elements in the DOM, so none of the styles applied.

Confirmed via `document.querySelectorAll` in the live page: `<main class="jsx-c430098a3892989 th-shell">` and `<div class="jsx-c430098a3892989 outer">` had the scope class, but the nested `<div class="box center">` and all its children did not.

**This is not caught by a successful Vercel build** — it's a runtime/rendering issue, not a compile error, since styled-jsx's babel transform runs without erroring regardless of whether the scope classes end up matching anything. Both the batch-7 QA branch build and the production build succeeded cleanly. Only the live post-deploy render check caught it, which is exactly why that step is mandatory and non-skippable per `release-train.md` even when the build is green.

**Fix:** changed both page-scoped `<style jsx>` blocks in `confirm.js` (the shell-level design-system styles, and the enter-step-only field/button styles) to `<style jsx global>`. Global styles are inserted unscoped into `<head>` and match on the plain CSS selector regardless of which JSX literal produced the element, so this fixed all five render states without any markup, state, or logic changes. Validated with `@babel/parser` before pushing, then re-verified live — the `/confirm` page (tested via the `error` state, since no valid token was in the URL) now renders with full Pine/Clay/Bone styling, Fraunces headline, and gradient buttons.

**Window of exposure:** roughly 6 minutes between the batch-7 release commit reaching `READY` in production and the hotfix commit reaching `READY`. `confirm.js` is a lower-traffic transactional page (only reached via a confirmation-link SMS/email after someone reports a death), so real-world impact was likely minimal, but this was still a real, if brief, degraded production experience and is disclosed here plainly rather than glossed over.

**Process fix:** added a permanent caution to `docs/redesign/12-threshold-rollout-tracker.md`'s "How to use this file" section (new step 3) and a new dedicated section ("Pages using a shared multi-branch render helper") flagging this exact pattern for future runs. Candidate pages to check before their own re-skins: `pages/planning.js`, `pages/packet.js`, `pages/contact.js`, `pages/faq.js`, `components/family/FamilyTodayApp.js` — anything with loading/error/empty/success-style branching through a shared render helper.

## Deploy budget used today (2026-07-13)

Four deploy-triggering commits today — at the stated max-4/day budget:
1. `77afae690df5c11c8825e6c09e100ad41dfdfcc3` — batch 5 (run 5)
2. `358fd0aa707379a1486926ad3a1bb620a5c532e2` — batch 6 (run 6)
3. `0ab27a9c4eadd07ea87a505e7895fdd88aaf75fe` — batch 7 (run 7)
4. `815ad94de9f8b61e1cc66c14a63d6420d58abb93` — confirm.js hotfix (run 7)

No further deploy-triggering commits should be made today; `[skip deploy]` docs commits are still fine.

## Next highest-leverage action

Family/core-auth section remaining: `pages/planning.js`, `pages/today.js` (thin wrapper → re-skin `components/family/FamilyTodayApp.js` instead, 12.1KB), `pages/packet.js`, `pages/contact.js`, `pages/faq.js` — check each for the shared-render-helper pattern flagged above before batching. This would be batch 8, a natural 3-5 item batch to finish out the family/core-auth section.

After that, only the marketing/public pages remain in Tier 1 (`mission.js`, `story.js`, `trust.js`, `privacy.js`, `terms.js`, `resources.js`, `guides.js`, `pricing.js`, `care-providers.js`, `assisted-living.js`, `hospice.js`), plus the two deferred items (`funeral-home/index.js` needing its own PM-scoped slice, `components/vendor/VendorRequestApp.js` and `components/participant/ParticipantApp.js` needing to be added as formal tracker line items and sized).

## Ongoing housekeeping (flagged, not actioned — now 6 consecutive runs)

`docs/agent-operating-context.md` main file still needs a trim/archive pass; still too large (~95K+ chars) to safely read-and-rewrite in one pass. Inert throwaway QA branches (`threshold-summary-reskin-qa`, `threshold-batch2-qa` through `threshold-batch7-qa`) could be deleted but no agent tool is available to delete GitHub branch refs — owner gate, unchanged from prior runs.
