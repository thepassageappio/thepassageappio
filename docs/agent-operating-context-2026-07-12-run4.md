Agent Operating Context — Addendum, 2026-07-12 (scheduled run "resume Threshold, ship it", run 4)

Continuing the pattern from `docs/agent-operating-context-2026-07-12-run3.md`: `docs/agent-operating-context.md` is still too large to safely read-and-rewrite in one pass, so this run's handoff is recorded here per AGENTS.md's required fields. The main file still needs a trim/archive pass — flagged again, not fixed this run.

## Why this run matters

Run 3 (2026-07-12) proved the safe pattern for shipping one real page (`pages/funeral-home/summary.js`) and the owner then raised the standing directive to full transformation, greenfield: work the `docs/redesign/12-threshold-rollout-tracker.md` backlog in batches of 2-5 Tier 1 items per run, not one file forever. This run is the first to execute that batch-of-several directive.

## Role instances this run

Single agent session, self-differentiated by role per AGENTS.md's "distinct role rule":

- **Product Manager:** read AGENTS.md (UX Redesign Directive, Definition of done, Scale and ambition sections), `docs/redesign/12-threshold-rollout-tracker.md`, `docs/UX-REDESIGN-BRIEF.md`, `docs/redesign/08-visual-craft-standard.md`, `docs/release-train.md`, and the run-3 addendum. Selected the next 4 unshipped, independent Tier 1 items from the tracker's funeral-home section: `login.js`, `staff.js`, `setup.js`, `sample-case.js`. Checked `cases.js` and `pilot-proof.js` per the tracker's own "verify before assuming" notes and found both are thin wrappers needing no separate edit (see tracker update).
- **UI/UX Review:** compared each new page against `08-visual-craft-standard.md` and `01-design-system-foundation.html` — Pine/Clay/Bone tokens, Fraunces headline with tight letter-spacing, pill-radius gradient buttons with colored shadow, layered card shadows (`--e1`/`--e2`/`--e3`), real inline SVG icons (role-picker icons on `login.js`, feature icons on `staff.js`) replacing any flat color-box placeholders. PASS. Added a mobile breakpoint to every page in the same slice (780px on `login.js`/`setup.js`, 640px on `staff.js`, 820px on `sample-case.js`), per AGENTS.md's "mobile + web in tandem" rule.
- **Development Engineer:** implemented each page as a presentation-only diff — same component name and route for all 4, zero changes to data-fetching/auth logic. `staff.js` and `setup.js` keep their exact `sendMagicLink`/`signInGoogle`/`createWorkspace` functions, state, and effects byte-for-byte; only JSX markup and styling changed (inline `style={{}}` objects to `styled-jsx` + CSS custom properties). `setup.js`'s `SmartAddressInput` usage keeps the same component, same event contract — only the `colors`/`inputStyle` props it's given now carry Threshold hex values instead of the old sage palette; the shared `SmartAddressInput.js` component file itself was not touched. `login.js` and `sample-case.js` have no data layer to preserve (marketing/doorway pages); `trackEvent` calls on `sample-case.js` preserved verbatim.
- **QA:** see "QA performed" below.
- **Deploy:** ran this run; verified READY via the Vercel MCP for both the throwaway QA branch and the production release.

## What shipped this run (real code, not mockups)

Four live `pages/` files re-skinned onto Threshold design tokens, all on commit `59c972f49a6a725056a15269d0066a03da603118` on `main`, message `release: batch 2 Threshold re-skin — funeral-home login, staff, setup, sample-case [deploy] [qa-approved]`:

- `pages/funeral-home/login.js` — funeral-home portal doorway/role-picker (director/staff/setup role cards + "not a customer yet" helper links). Static, no data layer.
- `pages/funeral-home/staff.js` — staff magic-link + Google sign-in. Auth logic (`supabase.auth.signInWithOtp`, `/auth/google` redirect) byte-identical.
- `pages/funeral-home/setup.js` — director onboarding form (org/location/plan creation via `/api/partnerSelfServeSetup`). Supabase auth (`getSession`/`onAuthStateChange`/`signInWithOtp`) and all form state/handlers byte-identical.
- `pages/funeral-home/sample-case.js` — funeral-home sample-case marketing/demo page. Static content, `trackEvent` calls preserved.

Additionally, `pages/funeral-home/pilot-proof.js` (a thin legacy-route wrapper that renders `FuneralHomeSampleCase` directly) now inherits the new Threshold styling automatically — confirmed live, no separate code change needed. `pages/funeral-home/cases.js` was checked and found to be a pure `export { default } from './dashboard'` re-export with no markup of its own — correctly left for the Tier 2 `dashboard.js` split rather than given a standalone edit.

## PM Sprint Brief status

COMPLETE for this narrow, tracker-driven batch. Sprint goal: ship the next 4 independent Tier 1 items from `12-threshold-rollout-tracker.md` as one batch, per the owner's "full transformation, greenfield" directive. Non-goals: `SiteHeader`/`SiteFooter` (shared `components/SiteChrome.js`) were deliberately left untouched — they're still on the pre-Threshold sage/cream palette and are a separate, larger, cross-cutting item that would increase blast radius across every unshipped page if changed now; each page's own body content was re-skinned in isolation, consistent with the `summary.js` precedent.

## UI/UX status

PASS against `08-visual-craft-standard.md` for all 4 pages — user-facing surfaces (funeral-home directors, staff, and prospective customers all reach these pages).

## Development handoff / files changed this run

- `pages/funeral-home/login.js`, `pages/funeral-home/staff.js`, `pages/funeral-home/setup.js`, `pages/funeral-home/sample-case.js` (re-skinned, real production pages — shipped to `main`)
- `docs/redesign/12-threshold-rollout-tracker.md` (checked off shipped items, recorded `cases.js`/`pilot-proof.js` findings)
- `docs/agent-operating-context-2026-07-12-run4.md` (this file)
- Throwaway branch `threshold-batch2-qa`: two commits (login.js + gate-removed vercel.json, then staff/setup/sample-case.js), both built to `READY` on Vercel, then a follow-up commit restored `ignoreCommand` on that branch. Branch not merged to `main`, safe to delete.
- No files under `lib/`, `components/` (other than the two pages' own inline styling), or `pages/api/` were touched. `components/SmartAddressInput.js` and `components/SiteChrome.js` were read for reference but not modified.

## QA status — PASS, with the same disclosed environment limitation as run 3

**Pre-deploy:** All 4 files parsed cleanly with `@babel/parser` (jsx plugin) — no syntax errors. Pushed the identical diff to throwaway branch `threshold-batch2-qa` with `vercel.json`'s `ignoreCommand` temporarily removed. Two Vercel builds both reached `READY` (`dpl_ChT62Ld8usr9yqbUxEM8Dztjx1WF` covering `login.js`, `dpl_EbBNbR2y4ExmBmEx1gQqNDjo6yUP` covering `staff.js`/`setup.js`/`sample-case.js`) — proves no build-time error on the same Next.js toolchain as production for all 4 files. Gate restored on the throwaway branch afterward (commit `ff2342f4c1864fbb5fe580fa974fd4ea4dc6bf98`). As documented since run 3, this project's Vercel preview deployments sit behind Vercel's own account/team SSO wall, blocking unauthenticated interactive browser QA on the preview URL — no credentials were entered to bypass this.

**Post-deploy (the real gate):** After the `[deploy][qa-approved]` commit reached `READY` on production (deployment `dpl_63yPcnYTphxgtKPRK17q6495aRJZ`, aliased to `www.thepassageapp.io`), loaded all 4 pages plus `pilot-proof.js` live via Claude in Chrome:
- `/funeral-home/login`, `/funeral-home/staff`, `/funeral-home/setup`, `/funeral-home/sample-case`, and `/funeral-home/pilot-proof` all rendered without a client-side crash, showing the new Threshold styling (Pine-gradient buttons, Fraunces headlines, layered-shadow cards, real SVG icons) — visually distinct from the prior sage/cream design, which is itself strong evidence this is the fresh deployment and not a cached stale response.
- Zero console errors on any of the 5 page loads (checked via `read_console_messages`, `onlyErrors: true`).
- `document.documentElement.scrollWidth <= window.innerWidth` (no horizontal overflow) confirmed via JS on every page at the viewport this session's browser rendered (704px).
- `pilot-proof.js` confirmed to render `FuneralHomeSampleCase`'s new Threshold markup directly, proving the inheritance claim in the tracker update is accurate, not assumed.
- **Disclosed limitation (same as run 3):** `resize_window` to 390x844 reported success but `window.innerWidth` stayed pinned at 704px — this session's Claude-in-Chrome viewport did not actually resize. As the documented fallback, inspected `document.styleSheets` on `/funeral-home/login` and confirmed the shipped `(max-width: 780px)` media-query rule is present in the live production stylesheet, alongside an unrelated pre-existing `(max-width: 720px)` rule from `SiteChrome`'s nav. The other 3 pages' own mobile breakpoints (640px on `staff.js`, 780px on `setup.js`, 820px on `sample-case.js`) were written with the same pattern proven on `summary.js` and `login.js` but were not individually re-verified via stylesheet inspection this run — flagging as a minor follow-up rather than claiming full per-page verification.
- The fully-authenticated states (`staff.js` after a real magic-link sign-in, `setup.js`'s post-sign-in form) were not exercised — same owner gate as prior runs (no demo login exists yet). Low risk here specifically because this batch changed presentation only, not the auth/data-fetching contracts those states depend on.

Given real Threshold-styled renders confirmed live in production across all 4 shipped pages plus the inherited `pilot-proof.js`, zero console errors, zero overflow, one page's mobile CSS confirmed shipped via stylesheet inspection, and byte-identical data/auth layers on the 2 pages that have them, this clears the bar for `[qa-approved]` on a presentation-only batch.

## New finding this run — CI guard false positive on release commits (owner surfaced this live mid-run)

The owner sent a live message during this run: "failure on agent release email from github." Investigated: `.github/workflows/agent-context.yml` runs `scripts/check-agent-context.js` on every push to `main`. That script computes the diff between `github.event.before` and the pushed commit, and fails if "meaningful" files changed (i.e., not docs/context/tooling files) unless the commit either (a) also touches `docs/agent-operating-context.md` / `AGENTS.md` / `docs/release-train.md` in the same commit, or (b) has `[skip deploy]` in its message.

The documented release convention in AGENTS.md and this tracker is two separate commits: a `[deploy][qa-approved]` release commit that ships the pages, followed by a `[skip deploy]` docs commit that records context. Because the check evaluates each pushed commit against its own immediate parent (not the eventual end state after the follow-up commit), **every real release commit that doesn't also touch the context file will fail this check**, even though the very next commit fixes it. This is not new to this run — run 3's `027bd99a5ea6c25c74b1f28f1c219bd36fed007b` release commit would have failed the identical way; it just wasn't previously flagged as a CI-side symptom to the owner via email until now.

**No production impact:** this is a repo status-check / notification, not branch protection blocking the push — nothing was reverted, the deploy completed and is verified `READY`.

**Left unchanged this run:** did not modify `scripts/check-agent-context.js` or the workflow, since it's a deliberate safety gate the owner set up to force context discipline, and loosening it unilaterally (e.g., exempting commits with `[deploy][qa-approved]` markers) could reduce the very discipline it's meant to enforce, without a clearer signal that's what the owner wants. Flagging for an explicit owner decision instead (see Owner gates below).

## Release (this run)

Single `[deploy][qa-approved]` commit on `main`: `59c972f49a6a725056a15269d0066a03da603118`. Per AGENTS.md's deploy budget (max 4 deploy-triggering commits/day, 1 production deploy train/hour): this is the first production-deploy-triggering commit today from this run; combined with run 3's two deploy-triggering commits earlier today, that's 3 of 4 used today across all runs.

## Current Vercel/deploy status

Production deployment `dpl_63yPcnYTphxgtKPRK17q6495aRJZ` — verified `READY` via the Vercel MCP (`get_deployment`), aliased to `www.thepassageapp.io`, `thepassageapp.io`, `thepassageappio.vercel.app`. This is the current live production deployment as of this run.

## What is queued but not deployed

Remaining Tier 1 items in `12-threshold-rollout-tracker.md`: `pages/funeral-home/workspace-demo.js`, `pages/funeral-home/index.js`, all of the vendor portal (`pages/vendors/*.js`), all of family/core auth (`pages/login.js`, `accept.js`, `confirm.js`, `participants.js`, `participating.js`, `planning.js`, `today.js`/`FamilyTodayApp.js`, `packet.js`, `contact.js`, `faq.js`), and the marketing/public pages. Tier 2 monolith splits (`dashboard.js` first) remain untouched and are the default next action once Tier 1 is fully clear.

## Owner gates (open)

1. Demo director login and `scripts/demo-reseed.sql` (unchanged from runs 2/3 — still needs a real Supabase Auth signup first).
2. Whether to delete the inert throwaway branches `threshold-summary-reskin-qa` and `threshold-batch2-qa` (harmless if left; no agent tool available to delete a GitHub branch ref).
3. **New:** whether to adjust `scripts/check-agent-context.js` / `.github/workflows/agent-context.yml` so `[deploy][qa-approved]` release commits are exempted from the same-commit-context-touch requirement (since the documented workflow always follows them with a `[skip deploy]` context commit), or whether the owner is fine with the recurring cosmetic failure-email as an accepted tradeoff for keeping the guard strict. Recommend the owner decide explicitly rather than an agent unilaterally loosening a safety gate.
4. `docs/agent-operating-context.md` main-file trim/archive pass, flagged again (runs 2, 3, and now 4).

## Next highest-leverage action

Continue down Tier 1 per the tracker: next candidates are `pages/funeral-home/workspace-demo.js` and `pages/funeral-home/index.js` (both funeral-home-priority per the brief), or move to the vendor portal batch (`pages/vendors/index.js`, `login.js`, `accept.js`, `onboard.js`, `admin.js`, plus verifying `request.js`'s thin-wrapper status first). Same proven pattern: presentation-only re-skin, throwaway-branch build-proof, batched release, live post-deploy render check.

## Claude-in-Chrome / external-agent assistance

Used this run: navigation, screenshot, console-message reading, and JS execution against 5 live production URLs (4 shipped pages + `pilot-proof.js`), plus one stylesheet-inspection check for mobile CSS. `resize_window` was attempted and did not change the effective rendering viewport in this session, consistent with run 3 — recorded as an environment limitation, not a skipped step.
