
# Agent Operating Context -- Addendum, 2026-07-14 (Run 10)

Dated addendum to docs/agent-operating-context.md. Continues run 9 after its capped session (marketing-tail ship + dashboard.js extraction start). Read run 5-9's addenda for continuity, then this one.

## Owner directives this run

1. "Is this fundamentally going to change the entire website and the way it functions?" -- answered below with evidence, not just a brief quote.
2. "Give me a sandbox URL separate from production." -- built and delivered below.
3. "I'm not seeing some mind-blowing redesign, take a look, continue" -- verified with real screenshots on live production below, honest assessment included.
4. "Great audit and assess how we get this greenfield. Stop asking for permission it's approved." -- full greenfield completion audit below, covering the entire UX-REDESIGN-BRIEF deliverable list, not just the tracker's page batches.
5. Standing instruction (repeated a second time this run): stop pausing for owner approval on anything covered by AGENTS.md's Agent Permissions allow-list or prior standing directives. Applied for the rest of this run.

## Q1 -- Is this changing the entire site and how it functions?

No, and this is still true of the actual current state, not just the brief's stated intent. Verified by re-reading docs/UX-REDESIGN-BRIEF.md's own "Mandate" section this run: "Fixed source of truth (keep): the Supabase data model, user roles/RLS, and feature scope... Greenfield (rebuild): visual design, UX, information architecture, interaction patterns." Cross-checked against actual shipped commits (batches 3-9, run 9's SiteChrome + marketing tail): every single re-skin commit message this project has produced explicitly verifies "state/effects/handlers/API contracts byte-identical" before shipping -- e.g. pages/pricing.js's real Supabase auth + Stripe checkout flow, pages/planning.js's localStorage draft + /api/planningEstate contract, pages/packet.js's /api/estates/{id}/packets contract -- all untouched, only color/font/radius/shadow values changed. So: the site will look and feel completely different (new palette, new type, new component shapes, new IA groupings on some pages) but what it does -- who can log in, what data they can see (RLS unchanged), what actions are available, what APIs get called -- stays exactly the same. That is by design, specifically so the rebuild can't silently break auth, billing, or data access while the surface changes underneath it.

## Q2 -- Sandbox URL, separate from production

Checked docs/redesign/06-admin-access-demo-instance.md's plan first: it recommends either a seeded demo org gated by a DEMO_MODE env flag, or a separate Vercel preview deployment / demo.thepassageapp.io subdomain, plus a one-command reseed script. None of that had been built as of this run -- confirmed by grepping the codebase structurally (no DEMO_MODE reference found in the dashboard.js auth flow, no reseed script in the repo file listing) and by checking the live Supabase project (one project only, no staging/demo project).

Built the fastest safe version of the "separate Vercel preview" option instead of leaving this unbuilt another run:

**https://thepassageappio-git-demo-sandbox-thepassageappio-7018s-projects.vercel.app**

This is a persistent branch (`demo-sandbox`), not a throwaway QA branch -- it will not be deleted or torn down. It currently points at the exact same commit as production (e3ff59f2) via commit cdf1cc3d (docs/demo-sandbox.md, `[deploy][qa-approved]`), so it is byte-identical to the live site today, just on a separate deployment/URL. Confirmed READY via the Vercel MCP (`dpl_EHwPxKB4fkQ99QtmvbEyNbBVEime`).

Two ways to see funeral-home-critical content on it:
- `/funeral-home/dashboard?demo=1` -- fully client-side demo mode already built into dashboard.js (`demoPartnerContext`), zero real Supabase reads, zero real auth needed. Confirmed this route exists and is wired by reading the file directly (lines 646-782).
- Sign in with credentials for one of the 4 real seeded demo/pilot orgs ("Rivera Funeral Home (Demo)", "Test Funeral Home", "Passage QA Funeral Home", "Willow Creek Funeral Home") -- this shows real data, because there is only one Supabase project and this branch points at it too. This is the real gap: no isolated demo database yet.

**Access note, verified directly this run:** navigating to the sandbox URL via an unauthenticated browser session redirects to `vercel.com/login` -- this is Vercel's account/team SSO wall on preview deployments, documented repeatedly in runs 3-9, and confirmed again here with a live screenshot. This will NOT block the owner: he is the Vercel team owner (`thepassageappio-7018`), so once logged into vercel.com with his own account, the sandbox URL loads directly. No credentials were entered to bypass this from the agent side, consistent with every prior run's handling of this same wall.

**Honest gap not fixed this run:** a true isolated demo environment (separate Supabase project or a `DEMO_MODE` flag that swaps data sources) does not exist. The current sandbox is "same code, same database, different URL" -- sufficient for showing the visual redesign and the fully-mocked `?demo=1` dashboard flow, not sufficient for a completely data-isolated sales demo where a prospect could safely click around signed-in features without touching real org rows. Flagged as its own backlog item below.

## Q3 -- Real visual verification on production (not a raw-HTML fetch)

Used Claude in Chrome to load and screenshot the actual rendered pages on `www.thepassageapp.io` (production), not a text fetch. Screenshots taken for `/`, `/mission`, `/story`, `/trust`.

**What is actually rendering, honestly:**
- Palette: bone/cream background (#f6f3ee-family), dark pine-green primary color, clay/terracotta accent on the urgent-help surfaces -- present and consistent across all four pages. No siren-red anywhere, matching AGENTS.md's rule.
- Type: headlines are set in a serif face reading as Fraunces (elegant, editorial, not the old Georgia system serif) on `/mission`, `/story`, `/trust` -- confirmed these three pages use the newly-reskinned `components/SiteChrome.js` + their own font-pair constants (Inter body / Fraunces headline) per the run-9 commit. The homepage's headline ("When the hardest days come...") is also serif but the homepage runs on `HomeCalm.js`/`CalmPublicChrome`, a separate, earlier redesign (June 2026, PR #4) that predates the Threshold token system -- it looks visually compatible but has not been audited against the exact Threshold hex/font tokens. Flagged below as real remaining work, not assumed fine.
- Buttons: full pill radius confirmed on primary CTAs ("Start urgent path," "Urgent help," "Start urgent help") -- dark pine/near-black gradient-ish fill, pill outline secondary buttons. Matches the visual-craft standard's "generous pill-radius" requirement.
- Shadows/depth/glass: this is the honest miss. Cards on all four pages are close to flat -- thin 1px borders, very light or no visible drop shadow, no glass/translucent surfaces. `docs/redesign/08-visual-craft-standard.md` calls for "layered shadows... glass surfaces used sparingly... gradient buttons with real depth" as a non-optional part of the spec, and what's live reads as clean and calm but visually restrained rather than the more dramatic elevation the standard describes. This is the most likely reason the redesign reads as "not mind-blowing" to the owner: it is a real, correctly-scoped, correctly-tokened redesign, just under-expressed on the depth/elevation axis the craft standard explicitly calls out.

**Conclusion: this is not a case of the redesign failing to ship or rendering broken/old.** It shipped, it is live, it uses the right palette/type/radius. It is under-delivering specifically on shadow depth and glass-surface treatment relative to its own written spec. Recommended next action (not yet done this run, scoping only): a dedicated small pass adding the layered-shadow/elevation tokens from `01-design-system-foundation.html` v2 to the shared card/button primitives, which would lift every already-shipped Tier 0/1 page at once without re-touching each page's business logic.

## Full greenfield completion audit (owner ask, this run)

Cross-referencing `docs/redesign/12-threshold-rollout-tracker.md` against `docs/UX-REDESIGN-BRIEF.md`'s full deliverable list (Landing, Login, Create Account, Forgot Password, Dashboard family/vendor/admin variants, Create a Passage, Timeline, Contacts, Estates, Medical, Funeral Preferences, Messages, Notifications, Settings, Admin Portal, Vendor Portal) plus the Tier 2 monoliths.

**Design artifacts (spec layer): complete.** Design system foundation, IA, journey maps, wireframes/annotated mockups, task-spine logic doc, sprint plan, admin-access + demo-instance strategy doc, visual-craft standard -- all exist in `docs/redesign/` and are internally consistent. This layer has been done since 2026-07-12 and isn't the blocker.

**Real shipped implementation, done:**
- Tier 0 shared chrome (`components/SiteChrome.js`) -- done, run 9.
- Funeral-home/operator small pages: summary, login, staff, setup, sample-case, workspace-demo, pilot-proof (inherited) -- done, runs 3-5.
- Vendor portal: index, login, accept, onboard, admin -- done, runs 5-6.
- Family/core auth: login, accept, confirm, participants, planning, packet, contact, faq -- done, run 7-8.
- Marketing/public: mission, story, trust, privacy, terms, resources, guides, pricing, care-providers, assisted-living, hospice -- done, run 9. This closes the entire "marketing/public" list from the brief.
- Landing (`/`) -- done, but via a separate, earlier (pre-Threshold-token) redesign; needs a token-audit pass, not a rebuild (see Q3 above).
- `/funeral-home` B2B marketing page -- done via an earlier full redesign (PR #5), same caveat: predates the Threshold token system, not yet audited against it.

**Real shipped implementation, NOT done (this is the actual remaining work, concretely):**
1. **Four deferred Tier 1 shared-design-system pages** -- each was deliberately skipped in the batch pattern because a naive re-skin risks bleeding into other consumers of the same shared module. Each needs its own scoped slice:
   - `pages/funeral-home/index.js` (17.4KB) -- shares `CalmPublicChrome`/`hc-*` classes with the homepage.
   - `pages/today.js` -> `components/AppCalm.js` -- the actual **family dashboard** the brief asks for; shares `lib/designSystem`/`CalmControls`/`CalmKit`.
   - `pages/vendors/request.js` -> `components/vendor/VendorRequestApp.js` (25.4KB) -- the actual **vendor dashboard** the brief asks for.
   - `pages/participating.js` -> `components/participant/ParticipantApp.js` (26.7KB).
   These four are all individually small enough to fetch and re-skin safely with the tools available in a normal session (none require the large-file workaround dashboard.js needs) and are the natural next batch.
2. **The core "family record" IA the brief centers on -- Timeline, Contacts, Estates, Medical, Wishes/Funeral Preferences, Messages, Notifications, Settings -- has not been touched at all.** These live inside the Tier 2 monoliths (`pages/estate.js` 313KB, `pages/urgent.js` 76.3KB, `pages/share.js` 41KB, `pages/announce.js` 27.4KB, `components/App.js` 335KB -- the last one's live/dead status is still unverified, flagged in the tracker since run 2 and still unchecked). None of these five files has a PM-scoped punch list yet, unlike `dashboard.js`. **This is the single biggest gap between "fully greenfield" and the current state** -- the brief's actual IA backbone (one Passage record, sectioned as Today/Horizon/Tasks/People/Documents/Estate/Medical/Wishes/Messages/Audit) is still running on the pre-redesign UI everywhere except the small operator/auth/marketing pages already shipped.
3. **`pages/funeral-home/dashboard.js` Tier 2 extraction -- scoped, not executed.** Run 9 produced a real, structurally-grounded punch list (8 named components to extract: FocusWidget, HelpOverlay, ReportTable, PreparedOutputPreviewDialog, PartnerTaskActionDialog, PartnerAttentionInbox, PartnerDirectorFocus, DirectorOperatingLoop). This run attempted to execute it and hit a genuine environment limit worth recording plainly: this session has no code-execution sandbox (bash unavailable) and no local parser, and the file (461,184 characters) exceeds every content-fetch tool's return limit. Fetched the full file via the GitHub API (confirmed it downloads in full server-side) and confirmed the exact structural finding from run 9 does NOT reproduce in the readable portion -- a targeted grep for the 8 named components across the parts of the file actually readable this run found zero matches, meaning either they are defined deeper in the file than could be paginated into view with the tools available, or the run-9 grep-based read (done in a different tool environment with real shell access) saw something this session's tools cannot access the same way. **Given that mismatch, and the file's live/RLS-connected/no-test-suite risk profile that every prior run has itself flagged, this run did not attempt a text-splice extraction blind.** Splitting this file safely needs a session with real code-execution tooling (the kind the run 1-9 commits describe using -- shell greps, `@babel/parser` QA checks) -- recommending the next session for this specific item run in that kind of environment rather than a chat-tool-only session like this one.
4. **Admin Portal -- designed, not built.** `06-admin-access-demo-instance.md` specs a new `support_view` value on `estate_access.role` plus a "view as" impersonation flow with audit logging. Confirmed this run: `estate_access.role`'s enum in AGENTS.md still lists only `owner, participant, external_partner, activator, read_only, operator` -- `support_view` has not been added. This is a real schema change (owner-permission territory is fine per Agent Permissions, schema changes are not explicitly gated, but given it touches access control it should get an explicit PM brief + review before implementation, not a blind migration). Not started.
5. **True demo-environment isolation -- designed, not built.** See Q2 above: no `DEMO_MODE` flag, no reseed script, no separate Supabase project. The `demo-sandbox` branch shipped this run is a real, useful partial step (separate URL, same code) but does not solve data isolation.
6. **Dashboard admin variant / System Admin (Tier 3)** -- correctly deprioritized per the brief's own sequencing (functional > visual until Tier 1/2 substantially done). Not a gap, a correct deferral.
7. **"Create Account" / "Forgot Password" as named deliverables in the brief** -- checked against the actual auth model: Passage uses magic-link + Google OAuth (`signInWithOtp`, `consumeSupabaseOAuthHash`), not password-based accounts, confirmed across `login.js`, `accept.js`, `dashboard.js`, `staff.js`. There is no traditional signup/password-reset flow in the live product, so these two brief line items likely don't map to a real page 1:1 -- worth a one-line clarification from the owner on whether the brief intended these literally or as shorthand for "the sign-in entry points," rather than treating this as unshipped work against a page that doesn't exist.

**Realistic sequencing to close the gap (recommended order, not yet started beyond what's listed above):**
1. Shadow/elevation token pass on shared card/button primitives (small, high-visual-impact, addresses the Q3 finding, unblocks nothing but improves everything already shipped at once).
2. The four deferred Tier 1 pages (funeral-home/index.js, AppCalm.js, VendorRequestApp.js, ParticipantApp.js) -- safely sized, same proven pattern, real remaining Tier 1 work.
3. PM-scope `pages/estate.js`, `pages/urgent.js`, `pages/share.js`, `pages/announce.js` the same way `dashboard.js` was scoped in run 2 (structural read, extraction punch list, no blind rewrite) -- this is the actual path to covering Timeline/Contacts/Estates/Medical/Wishes/Messages, the brief's core IA.
4. Execute `dashboard.js`'s existing extraction punch list, in a session with real code-execution tooling.
5. Admin Portal `support_view` role + impersonation flow -- its own dedicated PM brief given it's an access-control change.
6. Demo-environment data isolation (`DEMO_MODE` flag + reseed script) once the funeral-home console itself is further along, per the brief's own "build the real slice, seed the demo against it" sequencing.

**What's actually blocking "fully greenfield," stated plainly:** it is not any single hard blocker -- it's that the highest-blast-radius, highest-line-count files (the ones that hold the brief's own core IA) haven't been scoped yet, and the one that has been scoped (`dashboard.js`) needs tooling this session doesn't have to execute safely. Every other gap (admin portal, demo isolation, four deferred pages, shadow pass) is normal, sequenceable backlog, not a structural blocker.

## What is queued but not deployed

Everything listed under "Realistic sequencing" above. Nothing new was queued-but-unshipped from this run beyond the demo-sandbox branch (which is deployed, just not production) and this addendum (docs-only, `[skip deploy]`).

## Current deploy status

Production unchanged this run (still `e3ff59f2`, the run-9 marketing-tail completion). One new non-production deployment: `demo-sandbox` branch, READY, `dpl_EHwPxKB4fkQ99QtmvbEyNbBVEime`.

## Next highest-leverage action

Start the four deferred Tier 1 pages (funeral-home/index.js first, matching funeral-home-critical priority) -- they're safely sized for this environment's tools, proven pattern, real forward progress on the tracker's own "Tier 1 clear" milestone.

## Train state

Single session played PM -> UI/UX (Q3 visual audit) -> a scoped-not-executed Development attempt (dashboard.js, honestly reported as blocked by environment tooling) -> Deploy (demo-sandbox) this run. Not stopping for the owner beyond this handoff -- next actions (the four deferred pages) do not require an owner gate.
