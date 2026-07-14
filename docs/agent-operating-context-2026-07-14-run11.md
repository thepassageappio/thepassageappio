
# Agent Operating Context -- Addendum, 2026-07-14 (Run 11)

Dated addendum to docs/agent-operating-context.md. Continues run 10's handoff, whose recommended next action was: "Start the four deferred Tier 1 pages (funeral-home/index.js first, matching funeral-home-critical priority)."

## Note on parallel/concurrent activity found this run

Before starting, this run checked Vercel deployment history and found an already-READY QA build on a `threshold-depth-pass-qa` branch (shadow/elevation token pass across several already-shipped pages: sticky glass header, hover lift on `hc-card`, `e1/e2/e3` shadow tokens, proof-card/path-panel/story-panel shadows) with a timestamp shortly after run 10's docs commit landed on `main`. That work was never merged to `main` (no corresponding release commit exists in `main`'s history as of this run) and is not part of run 10's addendum, so it is either an abandoned QA branch from an earlier attempt in this same run-10 session or a separate concurrent scheduled run. It does not conflict with the work below (different file, different branch), but is flagged here so a future run doesn't lose track of it: if `threshold-depth-pass-qa` still exists and its build is still READY, it is a real, unshipped shadow/elevation pass (run 10's recommended action #1) worth finishing and releasing in a future run rather than re-doing from scratch.

## This run's action

Shipped `pages/funeral-home/index.js`, the first of run 10's four deferred Tier 1 items.

**The risk this page was deferred for (run 6):** it renders via `components/calm/CalmPublicChrome.js`, which is *also* rendered by the homepage (`components/HomeCalm.js`). A naive re-skin of the shared `hc-*` classes (editing `CalmPublicChrome.js` directly) would have silently re-skinned the homepage too.

**Resolution, verified by reading the actual component composition, not assumed:** `CalmPublicChrome` renders `<div className="hc-root"><CalmPublicStyles/><CalmHeader/>{children}<CalmFooter/></div>`. This page's own `pageCss` (rendered via `<RawStyle css={pageCss}/>`, already part of `{children}`) sits *after* `CalmPublicStyles()`'s `<style>` tag in DOM order, so equal-specificity `.hc-*` selector overrides in `pageCss` win the cascade -- and because that `<style>` tag is part of this page's own React tree, it mounts and unmounts with the page itself. Confirmed this is the same mechanism the page's pre-existing `fhx-*` override classes already relied on (proven safe since run 4). Extended that same pattern to cover every `hc-*` class this page renders (header/nav/auth/footer/hero/section/card/trust band), instead of editing the shared component file. `components/calm/CalmPublicChrome.js`, `components/HomeCalm.js`, and `lib/designSystem.js` were **not** touched.

Threshold tokens used match the exact hex values already shipped on `components/SiteChrome.js` and `pages/trust.js` (bone `#FBF8F3`/`#FEFDFB`, ink `#1C1917`, mid `#5A5348`, border `#E6DDCB`, pine `#245A4B`/`#153A31`, pine-faint `#F2F6F3`, clay/rose `#9A4F26`/`#B5622F`), Fraunces (440 weight, tight letter-spacing) for headlines, Inter for body/mechanism text, full pill radius on buttons/pills, layered `e1`-style shadows on cards and the hero proof panel per `docs/redesign/08-visual-craft-standard.md`, and a glass/blur treatment on the dark trust-band cards.

**Zero functional changes**, verified line-by-line against the pre-existing file: `session`/`onAuthStateChange` watch, the `?legacy=1` rollback seam (`FuneralHomeLegacy`), `startCheckout`/`/api/checkout` Stripe contract, `planForTier`/`publicPlanLabels`/`contactHref`, and every `trackEvent` call (`funeral_home_cta_clicked`, `funeral_home_plan_start_clicked`, `funeral_home_plan_cta_clicked`) are byte-identical to the previous version. Only the imports changed (dropped `DS`/`TYPE`/`SANS`/`cssType` from `lib/designSystem.js` and `components/calm/CalmPublicChrome`, since this page no longer needs the pre-Threshold token objects; kept `CalmPublicChrome` default export and `RawStyle`).

## QA

Pushed to throwaway branch `threshold-fh-index-qa` with `ignoreCommand` temporarily removed from `vercel.json`. Vercel build reached `READY` (`dpl_3epweZfvBq3K94s6h7kexawE48i9`) on the first attempt. Attempted interactive preview QA via Claude in Chrome at the branch preview URL; hit the documented Vercel account/team SSO wall (`vercel.com/login?next=/sso-api...`) -- this is the known, accepted, recurring limitation flagged in every prior run, not bypassed or worked around. Restored the `ignoreCommand` gate on the QA branch afterward. QA branch never merged to `main`.

Because the SSO wall blocks pre-deploy interactive QA, the live post-deploy render check on production is, as in every prior run, the QA step that actually gates this release.

## Deploy

Released to `main` as a single `[deploy][qa-approved]` commit bundling: `pages/funeral-home/index.js`, `docs/redesign/12-threshold-rollout-tracker.md` (checks off this item, updates the "Tier 1 clear" note to reflect 3 remaining deferred items instead of 4), and this addendum -- so the release satisfies `scripts/check-agent-context.js`'s `contextTouched` check on its own merits, per the established run-8-fixed pattern.

## What is queued but not deployed

- The three remaining deferred Tier 1 pages: `pages/today.js` -> `components/AppCalm.js` (family dashboard), `pages/vendors/request.js` -> `components/vendor/VendorRequestApp.js` (vendor dashboard), `pages/participating.js` -> `components/participant/ParticipantApp.js`. Same class of shared-module risk as this run's item; the same page-scoped-override technique proven here should generalize to at least the vendor/participant ones (need to confirm each shares a `CalmPublicChrome`-like wrapper vs. `lib/designSystem`/`CalmControls`/`CalmKit` directly, which may compose differently -- check before assuming the identical pattern applies).
- The `threshold-depth-pass-qa` branch noted above (possible unshipped shadow/elevation pass -- verify status before redoing).
- Everything from run 10's "Realistic sequencing" list beyond the four deferred pages (Tier 2 `dashboard.js` extraction execution, PM-scoping `estate.js`/`urgent.js`/`share.js`/`announce.js`, Admin Portal `support_view`, demo-environment data isolation).

## Current deploy status

Prior to this run: production at `e3ff59f2` (run 9 marketing tail). This run's release commit ships `pages/funeral-home/index.js` to production.

## Next highest-leverage action

Continue run 10's list: `pages/today.js`/`AppCalm.js` next (the brief's actual family-dashboard deliverable), then the vendor/participant pages, applying the same page-scoped-override verification approach (confirm each component's actual composition before assuming the CalmPublicChrome pattern generalizes directly).

## Train state

Single session played PM (re-confirmed run 10's scoping) -> UI/UX (verified the override-cascade mechanism is real, not assumed) -> Development (implemented) -> QA (branch build READY, SSO wall hit and handled per documented policy) -> Deploy (this run) -> will continue to live post-deploy render check immediately after this commit, then move to the next deferred page. Not stopping for the owner: this action was already named as the next step in run 10's own handoff and required no new owner gate.
