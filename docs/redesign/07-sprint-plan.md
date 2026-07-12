# Sprint Plan — Threshold Redesign

Rebuilt 2026-07-12. Sequenced so the funeral-home demo path is production-ready first, per AGENTS.md directive. Each sprint: goal, pages/features, dependencies, definition of done. Assume 2-week sprints; adjust to actual team velocity.

## Sprint 0 — Foundation (no user-facing surface yet)
**Goal:** ship the design system as code so every later sprint builds on real components, not mockups.
**Scope:** Threshold design tokens (color/type/space from `01-design-system-foundation.html`) implemented as CSS variables/Tailwind config; core component library (button, status pill, task row, panel, nav shell) in both Family and Operator temperature; viewer-relative-status utility function per `05-task-spine-coordination-logic.md`.
**Dependencies:** none — can start immediately.
**Definition of done:** component library Storybook (or equivalent) covering both temperatures; status-translation utility unit-tested against all 13 `tasks.status` + `partner_owner_role` combinations.

## Sprint 1 — Funeral Home demo path, part 1: Portal shell + case list
**Goal:** director can log in and see every case with correct urgency ranking.
**Scope:** Funeral Home Portal shell (nav, topbar), case-list dashboard (A1 in `04-wireframes-annotated.md`) wired to real `organizations`/`organization_members`/`workflows` data, empty state for zero-case orgs.
**Dependencies:** Sprint 0 components.
**Definition of done:** a real funeral-home org can log in, see their case list with live status, empty state renders correctly for a fresh org; mobile + desktop per AGENTS.md's dual-viewport rule.

## Sprint 2 — Funeral Home demo path, part 2: the record + task spine
**Goal:** director can open one case and see/act on the real task spine.
**Scope:** the ten-section Passage record shell (operator-styled), Today + Tasks sections fully wired to `tasks`/`task_status_events`, right-side task drawer, bulk-assign for unowned tasks.
**Dependencies:** Sprint 1 (case list must link somewhere real).
**Definition of done:** opening a case shows accurate viewer-relative status for every task; assigning an unowned task updates ownership and removes it from the "unowned" count live.

## Sprint 3 — Funeral Home demo path, part 3: Invite + Documents
**Goal:** director can invite a family and manage documents end-to-end — this completes the minimum demoable loop.
**Scope:** Invite flow (A4), Documents section grouped by `document_type` (A5) including "request from family" task-generating action.
**Dependencies:** Sprint 2 (People/task infrastructure).
**Definition of done:** a director can invite a test family member, that person receives and can act on an invite, and a requested document creates a real task visible in Sprint 2's task spine. **This closes the funeral-home demo path — it is now genuinely demoable, not mocked.**

## Sprint 4 — Demo instance + Admin access model (parallel-safe with Sprint 5)
**Goal:** the Sprint 1–3 slice becomes an actual sales demo, and support gets a real "view as."
**Scope:** seeded demo org + one-command reseed script (`06-admin-access-demo-instance.md`); `estate_access.role` schema addition (`support_view`) — **flag to engineering as a schema change, not just UI**; Admin Portal Case Support zone (search + view-as + audit log).
**Dependencies:** Sprint 3 data model in active use (demo org seeds against the same real components).
**Definition of done:** `demo.thepassageapp.io` or equivalent shows the seeded Rivera Funeral Home scenario end-to-end; reseed script runs clean; an admin can search a real test user, view-as with a visible banner, and see the grant expire and log correctly.

## Sprint 5 — Family surfaces: Landing, Auth, Family Dashboard
**Goal:** the B2C entry point matches the polish of the B2B side.
**Scope:** Landing (three-path hero from `hero-screens-mockup.html`), Login, Create Account (branching by `flow_type`), Forgot Password, family Dashboard (next-action card + Today + People).
**Dependencies:** Sprint 0 components; can start in parallel with Sprint 4.
**Definition of done:** a new user can complete signup under the urgent-flow path in under 3 minutes on mobile with zero required fields beyond name/relationship/contact; family Dashboard shows correct viewer-relative status for a real seeded family.

## Sprint 6 — Create a Passage + Timeline + remaining record sections
**Goal:** every family-facing record section is live, not just Today.
**Scope:** Create-a-Passage wizard (save-and-exit), Timeline/Horizon, Contacts/People, Estate, Medical (with extra consent-confirmation step), Funeral Preferences/Wishes.
**Dependencies:** Sprints 2 & 5 (record shell + family dashboard pattern).
**Definition of done:** all ten sections navigable from both family and funeral-home consoles with correct role-based visibility per `02-information-architecture.md`.

## Sprint 7 — Vendor Portal + Messages + Notifications
**Goal:** close the third console and the communication layer.
**Scope:** Vendor Portal (scoped `vendor_requests` view, payment tracker component), Messages (draft→approve→send stepper), Notifications (digest + urgent-override).
**Dependencies:** Sprint 2 task spine (Messages reuses the same status-translation pattern).
**Definition of done:** a test vendor sees only their own requests with zero family-record leakage (verified against RLS, not just UI hiding); a message cannot send without explicit approval step.

## Sprint 8 — Admin Platform Ops + Settings + polish pass
**Goal:** finish the Admin Portal's second zone and close remaining gaps.
**Scope:** Platform Ops nav (links into existing roadmap/pilot-health/QA pages — no duplication of `pages/system/admin/saas-roadmap.js`), Settings ("My account" vs. "Who has access" split), cross-cutting accessibility/responsive QA pass on every screen shipped since Sprint 1.
**Dependencies:** all prior sprints.
**Definition of done:** WCAG 2.2 AA pass on core flows; every screen in `04-wireframes-annotated.md` accounted for and shipped or explicitly deferred with owner sign-off.

## Sequencing rationale
Sprints 1–3 are the critical path (funeral-home demo path production-ready first, per explicit directive). Sprint 4 turns that same slice into the sales demo and closes the admin-access gap identified as the biggest structural risk in `00-system-findings.md` (no existing RLS-scoped admin role). Family-facing sprints (5–6) follow rather than lead, because the B2B wedge is the distribution strategy per AGENTS.md ("B2B must be strong enough that B2C feels easier, calmer, and safer"). Vendor and full Admin close out the remaining consoles.
