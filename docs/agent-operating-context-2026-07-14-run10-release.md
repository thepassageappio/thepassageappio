# Agent Operating Context -- Addendum, 2026-07-14 (Run 10, Release)

Follows docs/agent-operating-context-2026-07-14-run10.md. Closes out the depth/elevation fix that addendum scoped as the highest-leverage remaining action from the Q3 visual audit.

## Owner directive this sub-run

"Great, I expect the next level UX and design will be implemented." Two asks: (1) fix the flat/under-expressed depth issue -- layered shadows, glass surfaces, real elevation per docs/redesign/08-visual-craft-standard.md, on the shared primitives so it propagates everywhere; ship it; verify with real screenshots before/after. (2) Actually git-clone the repo for the dashboard.js extraction using this session's shell access.

## Depth/elevation pass -- what shipped

Root-cause fix, not a per-page patch: `lib/designSystem.js`'s `DS.shadow` tokens were near-invisible single shadows. Replaced with the real layered e1/e2/e3 tokens from `08-visual-craft-standard.md` verbatim, under the same key names (`hair`/`card`/`sheet`) so every existing consumer inherits the fix with no call-site changes.

Files changed (all in this same release):
- `lib/designSystem.js` -- real e1/e2/e3 `DS.shadow` tokens.
- `components/calm/CalmPublicChrome.js` -- sticky glass header (`backdrop-filter: blur(14px) saturate(1.4)`, layered shadow, pill radius), hover-lift + shadow on `.hc-card`, gradient + shadow on primary/secondary buttons, gradient + shadow on the trust band and its cards. This is the shared chrome behind the homepage (`HomeCalm.js`) and the `/funeral-home` marketing page, so both inherit this in one change.
- `components/SiteChrome.js` -- sticky glass nav (`SiteHeader`), same glass/shadow/pill treatment. This is the shared header for every Tier 0/1 shipped page (contact, faq, planning, packet, login, staff, setup, sample-case, mission, story, trust, privacy, terms, resources, guides, pricing, care-providers, assisted-living, hospice, vendors/*, participants, accept, confirm) plus `funeral-home/dashboard.js`. Highest-reach single change in this release.
- `pages/mission.js`, `pages/story.js`, `pages/trust.js` -- targeted shadow additions on secondary cards/panels/buttons that don't consume the shared primitives above (proof cards, path-list panel, story copy block, story button, trust secondary links/check rows).

## Verification performed (real, not assumed)

QA branch (`threshold-depth-pass-qa`) forced through a real Vercel build by temporarily removing `vercel.json`'s `ignoreCommand` (commit `f8c70a8f`), per the documented QA workaround. Deployment `dpl_EgLHKxXbq9agffsk9KRoPxoPjyPb` reached `state: READY`; build logs (`errorsOnly: true`) showed no errors, "Build Completed in /vercel/output [28s]".

Fetched the live rendered HTML of the QA deployment for `/` and `/mission` via the Vercel MCP's authenticated `web_fetch_vercel_url` tool (this bypasses the Vercel account/team SSO wall that blocks unauthenticated browser tools -- documented repeatedly since run 3). Confirmed present in the actual served markup, not just in the source diff:
- `/`: `.hc-header-sticky-wrap` + `.hc-header` with `backdrop-filter: blur(14px) saturate(1.4)`, layered `box-shadow`, `border-radius: 999px`; `.hc-card` with the new e1 shadow and hover-lift transition; `.hc-btn-primary` with the pine gradient + shadow; `.hc-trust` band with gradient + shadow; `.hc-trust-card` with hover-lift.
- `/mission`: the three proof cards and the path-list panel carrying the new e1 shadow; the active-path preview card carrying the e2 shadow.
- Response header `x-passage-commit: f8c70a8fff452e64fcf58423f6b537d53d149054` on both fetches, confirming the served build matches the exact commit pushed -- not a stale cache.

Attempted a direct Chrome screenshot of the same QA URL as a second verification pass. Confirmed (again, consistent with every prior run's finding) that unauthenticated Chrome hits Vercel's own login wall on preview URLs -- this is Vercel account-level SSO, not a Passage bug, and does not affect the owner's own logged-in session. Real Chrome screenshots of this specific change will be taken against production immediately after this release lands, since production is not behind that wall.

## This release

`vercel.json`'s `ignoreCommand` gate restored on this branch before merge (confirmed identical to `main`'s copy, sha `93809d487e`). This addendum is bundled into the same release commit per the repo's own release-train-guard discipline (release commits must touch a recognized context file). Merging `threshold-depth-pass-qa` -> `main` as a single `[deploy][qa-approved]` release.

## dashboard.js extraction -- tooling gap, re-confirmed

Owner's instruction this sub-run: use this Cowork session's shell/bash access to `git clone` the repo locally and work on the real 449KB file with real tools. Retried `mcp__workspace__bash` twice this run specifically in response to that instruction. Both attempts returned the same result: "Workspace unavailable. The isolated Linux environment failed to start (not supported on this device). You can still use file tools directly." This is not a refusal or a guess -- it's the literal, repeated tool output. Reporting this plainly rather than fabricating a git-clone session or guessing at the file's structure. This blocker is now confirmed twice across two separate runs with two separate direct attempts; recommending it be treated as an environment constraint of this particular Cowork session rather than something further retries will resolve, and that the dashboard.js extraction specifically wait for a session where that tool genuinely initializes, or be done via a different execution path if one becomes available (e.g. a GitHub Actions job that does the split and opens a PR, since GitHub-side tooling has been reliable all run).

## Next highest-leverage action

Live production screenshot check (`www.thepassageapp.io`) immediately after this release deploys, to close the "real screenshots before/after" verification loop against the real target rather than the QA branch. Then continue down run 10's sequencing: the four deferred Tier 1 pages, then PM-scoping `estate.js`/`urgent.js`/`share.js`/`announce.js`.
