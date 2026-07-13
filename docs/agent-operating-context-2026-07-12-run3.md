Agent Operating Context — Addendum, 2026-07-12 (scheduled run "resume Threshold, ship it", run 3)

Continuing the pattern from `docs/agent-operating-context-2026-07-12-run2.md`: `docs/agent-operating-context.md` is still too large to safely read-and-rewrite in one pass, so this run's handoff is recorded here per AGENTS.md's required fields. The main file still needs a trim/archive pass — flagged again, not fixed this run.

## Why this run is different from run 1 and run 2

Both prior runs on 2026-07-12 produced only `docs/redesign/*.html` mockups, Supabase demo-org prep, and scoping docs — zero changes under `pages/` or `components/`. The owner explicitly corrected this in AGENTS.md ("Definition of done: mockup is not shipped," added after run 2) and in the scheduled-task brief itself: mockups are reference-only, never rendered by the live app, and a run that only ships mockup HTML must not be reported as "shipped." This run's mandate was to produce a real, live, production-deployed page change, not another mockup or scoping document.

## Role instances this run

Single agent session, self-differentiated by role per AGENTS.md's "distinct role rule":

- **Product Manager:** re-read `docs/redesign/11-funeral-home-polish-scope.md` (run 2's PM brief) and `09-end-to-end-flow-map.md`. Rejected re-scoping the full funeral-home console rewrite (449KB `dashboard.js`, too large/risky for one unattended pass, already correctly deferred by run 2). Instead selected the smallest real, live, shippable slice explicitly sanctioned by the task brief: re-skin one existing small operator page onto Threshold tokens. Chose `pages/funeral-home/summary.js` (7.7KB, the live per-case family/director summary sheet) — `11-funeral-home-polish-scope.md` itself named this file as "the closest existing page" to the reporting-view mockup.
- **UI/UX Review:** compared the new markup against `docs/redesign/08-visual-craft-standard.md` and `01-design-system-foundation.html` — layered shadows (`--e1`/`--e2`), pill-radius buttons with gradient + colored shadow, Fraunces headline with tight letter-spacing, real Pine/Clay/Bone token palette, viewer-relative-style status pills with resting dot. PASS. Added a mobile breakpoint (`@media max-width:640px`) that did not exist in the prior version, per AGENTS.md's "mobile + web in tandem, same slice" rule.
- **Development Engineer:** implemented the re-skin as a presentation-only diff — zero changes to data-fetching logic, the `/api/partnerCaseSummary` contract, auth handling, props, or state. Only JSX markup and styling changed (inline `style={{}}` objects replaced with `styled-jsx` + CSS custom properties).
- **QA:** see "QA performed" below — real, not asserted, but with one honestly-disclosed limitation.
- **Deploy:** ran this run; verified READY via the Vercel MCP (not assumed).

## What shipped this run (real code, not mockups)

`pages/funeral-home/summary.js` — re-skinned onto Threshold design tokens. This is the **first live `pages/` file** in this redesign initiative to actually ship to production. Commit `027bd99a5ea6c25c74b1f28f1c219bd36fed007b` on `main`, message `release: re-skin funeral-home/summary.js onto Threshold design tokens [deploy] [qa-approved]`.

Scope, deliberately narrow for an unattended run:
- Same component name (`PartnerCaseSummary`), same route (`/funeral-home/summary?id=...`), same `useEffect`/`fetch`/`supabase.auth.getSession()` logic, byte-identical.
- Visual: Pine/Clay/Bone palette from `01-design-system-foundation.html` (`--pine-950:#0A1F1A` etc.), Fraunces headline (`clamp(30px,5vw,40px)`, `-0.018em` letter-spacing, weight 440), Inter body, pill-radius buttons (`--r-full`) with the Pine gradient + colored drop-shadow per the craft standard, layered card shadow (`--e2`), status pills with resting dot (`.th-pill.tone-{done,waiting,attention,draft}`) — reusing the viewer-relative-status visual language from the design system without changing its underlying `statusLabel()` logic.
- Responsive: new `@media (max-width: 640px)` block — header column-stacks, info-grid collapses to one column, task rows stack, matching AGENTS.md's "zero horizontal overflow, same status spine across viewports" rule.

## PM Sprint Brief status

No new formal sprint doc opened — this run operated as the concrete first slice of the punch list already scoped in `11-funeral-home-polish-scope.md` (item grounded in that doc's own recommendation). The remaining punch-list items (splitting `dashboard.js` into director/staff/per-case consoles, wiring the aggregate reporting view, ground-truthing `tasks.status`/`workflows.status` distinct values) remain queued for a dedicated session with interactive QA.

## UI/UX status

PASS against `08-visual-craft-standard.md` (see above). UX Review is not N/A — this is a user-facing surface (funeral-home directors and families both reach this page).

## Development handoff / files changed this run

- `pages/funeral-home/summary.js` (re-skinned, real production page — the only file that shipped to `main`)
- `docs/agent-operating-context-2026-07-12-run3.md` (this file)
- Throwaway branch `threshold-summary-reskin-qa`: pushed the same page change + a temporary `vercel.json` with `ignoreCommand` removed (to force a preview build per AGENTS.md's documented QA exception), then a follow-up commit restoring `ignoreCommand`. Branch was never merged to `main` and can be deleted; no tool was available this run to delete a GitHub branch ref, so it still exists but is inert (gate restored, not merged, not referenced by production).
- No files under `lib/`, `components/`, or `pages/api/` were touched.

## QA status — PASS, with one disclosed environment limitation

**Pre-deploy:** Pushed the exact diff to the throwaway branch above. Vercel built it successfully (state `READY`, deployment `dpl_4JtpVwrnN8ffUm2UPQ2qZ8TFAfJS`) — proves no build-time/syntax error on the same Next.js toolchain as production. Attempted interactive browser QA against that preview URL via Claude in Chrome; blocked by Vercel's own SSO wall (`vercel.com/login?next=/sso-api...`) on preview deployments for this team/project. No credentials were available or appropriate to enter (entering passwords is out of scope for this agent) — this is a genuine, disclosed self-service limitation, not a skipped step. This also empirically confirms `release-train.md`'s stated premise ("this repo has no [usable] preview environment") for this project's current Vercel protection settings.

**Post-deploy (the real gate, per `release-train.md`'s QA section):** After the `[deploy][qa-approved]` commit reached `READY` on production (deployment `dpl_81cTQpxqkDYjfSp2oivvNbZqzEdt`, aliased to `www.thepassageapp.io`), loaded `https://www.thepassageapp.io/funeral-home/summary?id=qa-check-1` live via Claude in Chrome:
- Page rendered without a client-side crash: the unauthenticated "Sign in to view this case summary." state rendered correctly with full Threshold styling (Pine-gradient pill button, Clay-tinted notice card, footer nav) — this is a real code path through the full component tree (not a stub), since `router.query.id` was populated and the fetch/session logic actually ran and returned the expected error state.
- No console errors (only one unrelated pre-existing Google GSI/FedCM deprecation warning from `SiteChrome`'s Google sign-in widget, present before this change too).
- `document.documentElement.scrollWidth <= window.innerWidth` (no horizontal overflow) confirmed via JS at the viewport this session's browser rendered (704px).
- `fetch(location.href)` returned `status: 200` with an `x-passage-commit` response header present (value redacted by an output filter as "blocked base64 data," but its presence plus `x-vercel-id` confirms the response came from the new deployment, not a cache).
- **Disclosed limitation:** `resize_window` calls to 1366×800, 1280×800, and 390×844 all reported success but `window.innerWidth` stayed pinned at 704px every time — this session's Claude-in-Chrome browser viewport did not actually resize, so true pixel-exact desktop (>=1366) and mobile (390/360) screenshots could not be captured this run. As a secondary, real (not assumed) verification of the mobile styles, I inspected the live production stylesheet via `document.styleSheets` and confirmed the shipped `@media (max-width: 640px)` rule exists and targets exactly the 7 selectors expected (`.th-shell`, `.sheet`, `.sheet-header`, `.brand-meta`, `.info-grid`, `.row`, `.toolbar`) — i.e., the mobile CSS that was written did ship correctly to production, even though a true narrow-viewport screenshot wasn't captured. Recommend a follow-up session with a browser environment that honors `resize_window` (or the owner's own device) do a quick visual pass at 390/360 to close this out fully.
- The fully-authenticated, real-data-loaded state (director viewing a real case with tasks/communications populated) was not exercised, because no demo login exists yet — this is the same owner gate recorded in run 2 (`scripts/demo-reseed.sql` needs a real Supabase Auth signup first, which this agent cannot create). Low risk here specifically because this run changed presentation only, not the data-fetching contract that the authenticated state depends on.

Given: real Threshold-styled unauthenticated render confirmed live in production, zero console errors, zero overflow at the available viewport, mobile CSS confirmed shipped via stylesheet inspection, and a byte-identical data layer — this clears the bar for `[qa-approved]` on a presentation-only page.

## Release (this run)

Single `[deploy][qa-approved]` commit on `main`: `027bd99a5ea6c25c74b1f28f1c219bd36fed007b`. This is the second production deploy today (after run 2's docs-only checkpoint release) — within the "no more than four deploy-triggering commits per day" budget in AGENTS.md (2 of 4 used).

## Current Vercel/deploy status

Production deployment `dpl_81cTQpxqkDYjfSp2oivvNbZqzEdt` — verified `READY` via the Vercel MCP (`get_deployment`), aliased to `www.thepassageapp.io`, `thepassageapp.io`, `thepassageappio.vercel.app`. This is the current live production deployment as of this run.

## What is queued but not deployed

Everything else in `11-funeral-home-polish-scope.md`'s punch list: splitting `dashboard.js` into director/per-case/staff shells, wiring a real aggregate reporting view (distinct from this run's per-case summary sheet), auditing real `tasks.status`/`workflows.status` distinct values, and the mobile/desktop dual-viewport QA pass still needed on this very page once a browser environment with working `resize_window` is available. Sprint 2/3 (task-spine implementation) also remains untouched.

## Owner gates (unchanged from run 2, still open)

1. Demo director login (sign up at `/funeral-home/setup` with a dedicated demo email, then repoint `organization_members.organization_id` to the seeded demo org `b36f8032-2f08-43f1-91f6-760c3c4f4ca6`).
2. Run `scripts/demo-reseed.sql` after step 1.
3. Consider deleting the throwaway branch `threshold-summary-reskin-qa` (harmless if left, but no agent tool was available this run to delete a GitHub branch ref).

## Next highest-leverage action

Pick the next-smallest real slice from `11-funeral-home-polish-scope.md` — recommend `pages/funeral-home/staff.js` or `pages/funeral-home/cases.js` (both small, both currently on the pre-Threshold sage/cream palette) as the next re-skin-in-place candidate, following the exact same pattern proven safe this run: presentation-only diff, throwaway-branch build-proof, deploy, live post-deploy render check. If a future session's browser environment supports real `resize_window`, use it to close out the disclosed 390/360 visual-verification gap on `summary.js` first.

## Claude-in-Chrome / external-agent assistance

Used this run: navigation, screenshot, console-message reading, and JS execution against both the throwaway preview URL (blocked by Vercel SSO) and the live production URL (successful, see QA section above). `resize_window` was attempted repeatedly and did not change the effective rendering viewport in this session — recorded as an environment limitation, not a skipped step.
