
# Agent Operating Context -- Addendum, 2026-07-14 (Run 12)

Dated addendum to docs/agent-operating-context.md. Continues run 11. Owner asked for an honest status assessment (met with: Tier 2/3 gap, self-QA-only concern, no independent sign-off) and then said "proceed" -- picked the cheapest, highest-value item from that assessment: finish and ship the abandoned `threshold-depth-pass-qa` branch (run 10's Q3 finding: shipped pages read correct but visually flat/restrained versus the visual-craft-standard's shadow/elevation bar).

## What this run did

Found `threshold-depth-pass-qa` still existed from an earlier, unmerged attempt (6 small commits, all shadow/elevation-only, gate already removed + a READY QA build already proven). Reviewed every diff by hand before merging rather than trusting the branch name:

- `lib/designSystem.js` -- `DS.shadow.{hair,card,sheet}` replaced with real layered near+far shadow pairs (same key names, so every existing consumer picks it up automatically).
- `components/calm/CalmPublicChrome.js` -- sticky glass header (`backdrop-filter: blur`), hover lift + shadow on `.hc-card`, gradient+shadow on `.hc-btn-primary`/`.hc-trust`/`.hc-trust-card` hover.
- `components/SiteChrome.js` -- same sticky-glass treatment on `SiteHeader` (the header/footer already shared by every Tier-1 page and `funeral-home/dashboard.js`).
- `pages/mission.js`, `pages/story.js`, `pages/trust.js` -- shadow added to a handful of already-shipped cards/buttons that were missing it.

All 6 diffs are small (5-83 lines each), pure CSS/style-prop additions, zero state/handler/route changes. No conflict with run 11's `funeral-home/index.js` page-scoped overrides (that page's own `<style>` still renders later in DOM order and wins on shared classes; the shared-file changes here just raise the baseline other pages inherit).

QA already existed on the branch (Vercel build READY, `dpl_EgLHKxXbq9agffsk9KRoPxoPjyPb`) from before this run; did not need to rebuild.

## Deploy

Merged the reviewed final file contents to `main` as one `[deploy][qa-approved]` commit (`6aafeec7fc4246d5b404cf44126ad7ca61419c35`), bundling tracker + this addendum in the same commit.

**Concurrency finding:** about 3 minutes after that commit landed, a second commit (`2648e7f2f5c460bb4ded8c050fd816a2dbe8283d`) landed on `main` from what appears to be an independent, concurrently-running scheduled instance attempting the exact same depth-pass merge (its message references "docs/agent-operating-context-2026-07-14-run10-release.md" -- a filename this run never created). Checked its diff: docs-only (it only added its own addendum file), because the code it was trying to merge was already identical to what this run had just pushed -- so nothing was reverted or double-applied. It did trigger its own separate production deployment, though (`dpl_9obtPu6c1nWZsuxisik8uiXVWwaE`), which became the deployment that actually ended up aliased to `www.thepassageapp.io`. Flagging this so a future run knows two scheduled instances can run against this repo at the same time -- worth checking `list_deployments`/recent commits for in-flight work before assuming you're the only session active.

## Post-deploy check

Live-checked production (`www.thepassageapp.io`, deployment `dpl_9obtPu6c1nWZsuxisik8uiXVWwaE`, READY, aliased correctly) via the Chrome MCP.

**Visual verification (screenshots taken on /trust, /mission, /story, /funeral-home):** sticky glass header renders correctly (pill-shaped, translucent, subtle shadow), Fraunces headline font and Inter body font render correctly, layered shadow tokens visible on cards. The depth-pass visually shipped as intended.

**Console verification found a real, reproducible bug that was not caught by any prior run's post-deploy check:** fresh loads of `/trust`, `/mission`, and `/story` each throw the same 3 React hydration errors (minified #425, #418, #423 -- the standard hydration-mismatch-then-recovery cascade) every single time, confirmed by repeating the navigate-then-read-console-messages cycle twice on `/trust` and once on `/mission` with the console buffer explicitly cleared between checks (so these are not stale/replayed messages). `/faq`, served by the same modified `SiteChrome.js`, loads clean on repeated fresh checks -- so this is not a blanket regression in the shared chrome component touched this run.

Checked whether this run's own diff caused it: the commit that touched `pages/trust.js` this run (`e8ed9a7`) is a 3-line addition / 3-line removal, purely adding `boxShadow` values to three already-existing static style-object literals (`checkRow`, `checkListItem`, `secondaryLink`) -- no JSX, conditional, or structural changes. `mission.js` and `story.js`'s diffs are the same shape. This makes it unlikely (though not proven) that this run's changes introduced the mismatch. Attempted to check the pre-existing production deployment directly (`dpl_9ugyeM42jros3kKoybCnp82jKFWp`, run 9's original marketing-tail release that first shipped these three pages) to see if the bug predates this run, but its deployment URL hit the documented Vercel account/team SSO wall -- could not fetch it to compare, so this is not fully proven either way.

**Not hotfixed this run.** This session has GitHub MCP and Vercel MCP access but no shell/build tooling to run a non-minified Next dev build and get the actual (non-minified) React error text, which is what's needed to actually diagnose and fix a hydration mismatch correctly rather than guess. Shipping a guessed fix for a live bug without being able to verify it actually resolves the error would risk making it worse, and would burn more of today's deploy budget on an unverified change. Flagging clearly instead.

## Honest note carried over from the owner's assessment this run

This still does not change who signs off. QA on the depth-pass batch itself, like every batch before it, was this same agent reviewing its own diff and screenshotting its own output. Tier 2 (the actual product screens: dashboard, estate record) and Tier 3 (System Admin) are unchanged by this run -- System Admin still has zero Threshold work by design, and the owner's "still looks like shit" complaint about it stands until that tier is scheduled. Per the plan agreed this run: stop here and let the owner look before pushing further into Tier 2 -- **except** that a live functional bug (the hydration errors above) is a different category from more design work, and should get a same-day-priority fix from a session with real dev tooling rather than wait behind the design review.

## Next highest-leverage action

1. **New, higher priority than continuing the redesign:** a session with real shell/build tooling should reproduce `/trust`, `/mission`, and `/story`'s hydration errors locally with a non-minified dev build to get the actual React warning text, determine root cause (pre-existing vs. introduced by this run -- the diff evidence here suggests pre-existing but is not conclusive), and ship a verified hotfix.
2. Owner review of what's live now (marketing pages + funeral-home/index.js + this depth pass) against `docs/redesign/*.html`, before any further Tier 1/Tier 2 design work ships -- unchanged from run 11's ask, just no longer the single top item given the bug found above.
