# Threshold Rollout Tracker — the master backlog

Added 2026-07-12 (run 3), owner directive: **full transformation, greenfield** — not an indefinite trickle of one tiny page per day. This file is the single, concrete backlog every future session (scheduled or interactive) reads first and works down. It replaces "pick something small and safe" as the default planning method with "work the list, in tier order, in batches."

**Read this file second, right after AGENTS.md's UX Redesign Directive, before `07-sprint-plan.md` or `11-funeral-home-polish-scope.md`** — those are still valid for narrative/rationale, but this file is the actual checklist and status source of truth. Update the checkboxes here every time a page ships.

## How to use this file each run

1. Find the first unshipped item in Tier 1. Take the next **2–5 items** (not just one) that are independent of each other — batch them into a single session's work, per AGENTS.md's "bundle two or three compatible small/medium fixes into one release candidate" rule, extended here to up to 5 for same-pattern presentation-only re-skins.
2. Apply the exact proven-safe pattern from the `pages/funeral-home/summary.js` slice (2026-07-12, run 3): presentation-only re-skin onto Threshold tokens (`docs/redesign/08-visual-craft-standard.md` + `01-design-system-foundation.html`), zero changes to data-fetching/auth logic unless the page has none of its own real data to begin with (marketing/static pages), same component name and route.
3. Prove the batch on a throwaway QA branch (temporarily drop `ignoreCommand` from `vercel.json`, restore it after), attempt interactive preview QA, but don't block on it if Vercel's SSO wall blocks preview access (documented, acceptable, recurring limitation — see `agent-operating-context-2026-07-12-run3.md`).
4. Deploy as one batched `[deploy][qa-approved]` release. Run the live post-deploy render check (per `release-train.md`) on **every** page in the batch, at whatever viewport this session's browser tooling actually supports — record any tooling limitation honestly rather than skipping the check.
5. Check off every shipped item below, with the commit SHA and date, in the same commit/PR that updates `docs/agent-operating-context.md` (or a dated addendum).
6. Only once **all of Tier 1 is checked off** does a run default to starting Tier 2 (monolith splits). Tier 2 items still get split into their own reviewable sub-batches per `11-funeral-home-polish-scope.md`'s method — never a blind full-file rewrite in one pass.
7. Tier 3 (internal/System Admin tooling) is lowest visual priority — functional correctness matters there, Threshold visual polish does not need to be first.

## Tier 1 — small/medium pages, safe for aggressive batch re-skin (each <20KB, no monolith risk)

Funeral-home / operator surfaces (brief's "funeral-home demo path first" priority — clear these first within Tier 1):
- [x] `pages/funeral-home/summary.js` — **SHIPPED 2026-07-12, commit `027bd99a5ea6c25c74b1f28f1c219bd36fed007b`** (run 3)
- [ ] `pages/funeral-home/login.js` (5.9KB) — mockup reference: `docs/redesign/auth-flow-mockups.html`
- [ ] `pages/funeral-home/staff.js` (5.5KB)
- [ ] `pages/funeral-home/cases.js` (39 bytes — near-empty stub, check what it actually renders before assuming it needs a re-skin vs. a real build-out)
- [ ] `pages/funeral-home/setup.js` (15.9KB)
- [ ] `pages/funeral-home/sample-case.js` (8.8KB)
- [ ] `pages/funeral-home/workspace-demo.js` (9.3KB)
- [ ] `pages/funeral-home/pilot-proof.js` (333 bytes — likely a stub, verify)
- [ ] `pages/funeral-home/index.js` (17.4KB) — **note:** already on the pre-Threshold calm design system (`lib/designSystem.js`, sage/cream), not yet on Threshold Pine/Clay/Bone. Needs a Threshold pass too, don't mistake "already redesigned once" for "done."

Vendor portal:
- [ ] `pages/vendors/index.js` (7.7KB)
- [ ] `pages/vendors/login.js` (7.6KB)
- [ ] `pages/vendors/accept.js` (7.7KB)
- [ ] `pages/vendors/onboard.js` (11.4KB)
- [ ] `pages/vendors/request.js` (1KB — likely a thin wrapper, check what it renders)
- [ ] `pages/vendors/admin.js` (17KB)

Family / core auth and account:
- [ ] `pages/login.js` (9.9KB) — mockup: `auth-flow-mockups.html`
- [ ] `pages/accept.js` (9.9KB)
- [ ] `pages/confirm.js` (8KB)
- [ ] `pages/participants.js` (7.2KB)
- [ ] `pages/participating.js` (1.1KB — likely thin wrapper)
- [ ] `pages/planning.js` (12.7KB) — mockup: `family-record-sections-mockups.html`
- [ ] `pages/today.js` (251 bytes — thin wrapper, check what component it renders, likely `components/family/FamilyTodayApp.js`, 12.1KB — re-skin the component, not the wrapper)
- [ ] `pages/packet.js` (16.3KB)
- [ ] `pages/contact.js` (9.9KB)
- [ ] `pages/faq.js` (8KB)

Marketing / public (lower urgency than app surfaces, but still real live pages and easy wins — static content, no data-layer risk at all):
- [ ] `pages/mission.js`, `pages/story.js`, `pages/trust.js`, `pages/privacy.js`, `pages/terms.js`, `pages/resources.js`, `pages/guides.js`, `pages/pricing.js`, `pages/care-providers.js`, `pages/assisted-living.js` (currently a 178-byte stub — verify), `pages/hospice.js` (36.6KB — borderline Tier 1/2, check before batching)

## Tier 2 — large monoliths, split-then-reskin only, never a blind rewrite

Each of these needs its own PM-scoped punch list (see `11-funeral-home-polish-scope.md` as the template) before any code changes — extract into smaller components first, re-skin the extracted pieces, ship in reviewable slices:
- [ ] `pages/funeral-home/dashboard.js` — 449KB, live director/staff console. Punch list already exists: `11-funeral-home-polish-scope.md`. **This is the single highest-leverage item once Tier 1 is clear** — it's the primary daily-use B2B surface.
- [ ] `pages/estate.js` — 313KB
- [ ] `components/App.js` — 335KB (check what mounts this — likely the legacy family app shell; may be superseded by `components/family/FamilyTodayApp.js` + `AppCalm.js` already, verify before assuming it needs a rewrite vs. deletion)
- [ ] `pages/urgent.js` — 76.3KB
- [ ] `pages/share.js` — 41KB
- [ ] `pages/announce.js` — 27.4KB
- [ ] `components/participant/LegacyParticipating.js` — 83.6KB (name suggests already deprecated in favor of `ParticipantApp.js`, 26.7KB — verify which one is actually routed to before planning work)
- [ ] `components/vendor/LegacyVendorRequest.js` — 49.8KB (same pattern — check if `VendorRequestApp.js`, 25.4KB, already superseded it)

## Tier 3 — System Admin internal tooling (functional > visual, lowest priority for Threshold polish)

`pages/system/admin.js` (29.6KB) and `pages/system/admin/*.js`: `saas-roadmap.js` (48.5KB, the one true roadmap per AGENTS.md), `pilot-health.js`, `conversion-plan.js`, `funeral-home-qa.js`, `enterprise-funeral-home-readiness.js`, `automation-spine-readiness.js`, `rate-limit-readiness.js`, `partner-checkout-readiness.js`, `sprint-2.js`, plus `pages/system/demo.js`. These are internal-only, never persona-facing — leave on whatever styling works until Tier 1 and Tier 2 are substantially done.

## Components that need a status check before Tier 1/2 work assumes they're the active code path

Several components have a "Legacy" naming pattern next to a newer "*App.js" component in the same directory (`components/participant/`, `components/vendor/`). Before spending a batch re-skinning either one, grep the actual `pages/*.js` files that import them to confirm which is live and which is dead code — do not re-skin dead code, and do not leave live legacy code unskinned because a newer-sounding file existed nearby. Record the finding here once checked.

## Definition of "Tier 1 clear" (the milestone that unlocks Tier 2 by default)

Every checkbox in Tier 1 above is checked, with a shipped commit SHA next to it, and each one has passed a live post-deploy render check per `release-train.md`. At that point, update this file's header with the clear date and move the default next-action to `pages/funeral-home/dashboard.js` (Tier 2).
