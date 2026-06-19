# Funeral Home Flawless QA Script

Purpose: prove that Passage can support a real funeral-home pilot without founder narration. Run this before every funeral-home demo, pilot invite, or release that touches client steps, notifications, partner onboarding, exports, staff scope, vendor requests, or family updates.

## Success Standard

A funeral-home director and employee must be able to complete the core loop without Steve explaining the product:

1. Understand the public value promise.
2. Open the sample console.
3. See My Day and active case pressure.
4. Create or inspect a family case.
5. Assign client steps to staff.
6. Move one client step to waiting or handled with proof.
7. Send or preview a reviewed family update.
8. See notification/proof trail.
9. Export or report case status.
10. Understand next step to pilot or subscribe.

## Release-Train Demo Proof Paths

Use these stable production paths for post-deploy browser QA before claiming the funeral-home release loop is closed:

- Public buyer page: `/funeral-home`
- Plural redirect check: `/funeral-homes` must redirect to `/funeral-home`
- Public sample case: `/funeral-home/sample-case`
- Public sample workspace: `/funeral-home/workspace-demo`
- Director demo dashboard: `/funeral-home/dashboard?demo=1&persona=fh-director&demoTour=funeral-home&demoStep=dashboard`
- Employee demo queue: `/funeral-home/dashboard?demo=1&persona=fh-employee&demoTour=funeral-home&demoStep=task&role=staff&email=arranger@samplefuneralhome.example`
- Vendor scoped request: `/vendors/request?demo=1&persona=vendor&demoTour=funeral-home&demoStep=vendor`
- Participant scoped request: `/participating?demo=1&persona=participant&demoTour=funeral-home&demoStep=participant`
- Family urgent path: `/urgent?demo=1&persona=red-family`
- Family estate path: `/estate?demo=1&persona=red-family`
- Owner roadmap: `/system/admin/saas-roadmap`

Fetch-only checks are not enough for demo dashboard, vendor request, participant, estate, or owner roadmap paths because they rely on client-side hydration and/or auth. Use a real browser/Chrome session and collect screenshots. If the owner roadmap remains auth-gated, record that as an expected owner-auth gate; do not weaken access just to make QA easier.

For every deployed release, verify:

- The page renders after hydration, not just server HTML.
- The browser does not show a client-side crash.
- The `X-Passage-Commit` response header matches the release commit where the fetch tool can read headers.
- A screenshot or concise visual note proves the role-specific first screen.
- Any auth-gated proof is named as auth-gated with the exact account or permission needed.

## Persona Scripts

### 1. Prospect Funeral Director

Route: `/funeral-home`

Pass criteria:
- Hero explains operational relief in the first viewport: fewer repeated calls, clearer owners, visible proof, approved handoffs, export.
- Primary actions are obvious: sample console, book walkthrough, director sign-in, staff sign-in.
- Pricing/pilot language is understandable without scrolling through mission copy.
- No internal admin, roadmap, smoke-test, or QA language appears publicly.
- Sample console opens without login and does not leak owner-only controls.

Buyer objection to answer:
- "Will this reduce staff burden or just add another system?"

Evidence to collect:
- Screenshot of first viewport.
- Screenshot of sample-console entry point.
- CTA click result for sample console and booking.

### 2. Funeral-Home Director

Route: `/funeral-home/dashboard?demo=1&persona=fh-director&demoTour=funeral-home&demoStep=dashboard`

Pass criteria:
- My Day loads with active cases, waiting items, unassigned work, staff/load signal, location scope, and reporting/export access.
- The director can identify the highest-priority case in under 10 seconds.
- Case pane shows family handoff context before client-step clutter.
- Director can assign work to a staff member and see the owner change.
- Director can generate or preview a family update only after review.
- Completed/waiting work leaves proof and drops out of active attention while remaining visible in the case record.

Buyer objection to answer:
- "Can my team run today from this screen?"

Evidence to collect:
- Screenshot of My Day.
- Screenshot of selected case context.
- Screenshot of client-step owner/waiting/proof state.
- Screenshot of export/reporting area.

### 3. Funeral-Home Employee

Route: `/funeral-home/dashboard?demo=1&persona=fh-employee&demoTour=funeral-home&demoStep=task&role=staff&email=arranger@samplefuneralhome.example`

Pass criteria:
- Employee sees assigned work first, not owner/admin clutter.
- Each client step shows ask, owner, waiting point, proof destination, and notification state.
- Employee can mark waiting with a meaningful waiting reason.
- Employee can mark handled only with proof/detail.
- Employee sees what changed after saving.
- Director-facing controls are hidden or clearly unavailable.

Buyer objection to answer:
- "Will staff actually use this during the day?"

Evidence to collect:
- Screenshot of staff queue.
- Screenshot of client-step action form.
- Screenshot after waiting/handled save.

### 4. Family Coordinator Connected to Funeral Home

Routes:
- `/urgent?demo=1&persona=red-family`
- `/estate?demo=1&persona=red-family`

Pass criteria:
- Urgent path starts with what to do now, not abstract product setup.
- Pronouncement, who is present, funeral-home readiness, decision authority, owner, waiting point, and next expected update are visible.
- Family can assign help or approve an update without losing proof trail.
- Family sees what Passage or funeral home notified, to whom, and what happened.
- No family-facing language implies unreviewed automatic sends.

Buyer objection to answer:
- "Will this make a hard moment calmer, or make me manage software?"

Evidence to collect:
- Screenshot of urgent stabilization layer.
- Screenshot of estate spine waiting/proof state.
- Screenshot of notification awareness.

### 5. Participant / Helper

Route: `/participating?demo=1&persona=participant&demoTour=funeral-home&demoStep=participant`

Pass criteria:
- Participant sees one scoped request and understands it in under 10 seconds.
- Participant can respond, mark waiting, or leave proof without seeing the full estate.
- Saved note/proof remains visible immediately.
- Link expiry/missing scope states are warm and clear.

Buyer objection to answer:
- "Will family helpers actually respond?"

Evidence to collect:
- Screenshot of scoped request.
- Screenshot after response/proof.

### 6. Vendor / Local Support

Route: `/vendors/request?demo=1&persona=vendor&demoTour=funeral-home&demoStep=vendor`

Pass criteria:
- Vendor sees only scoped request context.
- Timing, location, obligation, quote, payment state, and contact boundary are clear.
- Vendor can quote, decline, update status, schedule after approval, or save completion proof.
- Family/funeral-home sees the status change without exposing the full record.

Buyer objection to answer:
- "Can we coordinate outside support without creating chaos?"

Evidence to collect:
- Screenshot of vendor request.
- Screenshot of quote/payment/status state.

### 7. System Admin / Founder Control Room

Routes:
- `/system/admin`
- `/system/admin/saas-roadmap`

Pass criteria:
- P0 readiness loop names public, spine, payment/CRM, compliance, and persona blockers.
- SaaS roadmap names target ARR, active sprint, milestone, owner, acceptance criteria, and next action.
- Metrics show identifiable funeral-home leads and pilot status, not only anonymous product events.
- Abuse controls and refresh-rate policy are visible as launch gates.
- Production reset is disabled, removed, or two-party gated once real customers/leads exist.

Buyer objection to answer:
- "Can the company operate this safely as it grows?"

Evidence to collect:
- Screenshot of readiness scorecards.
- Screenshot of SaaS roadmap.
- Screenshot of metrics lead/pilot health.

## Browser QA Matrix

Run each script at:

- Desktop width: 1440px
- Laptop width: 1280px
- Tablet-ish width: 900px
- Mobile width: 390px

For every viewport, record:

- First confusing moment.
- First dead end.
- Any overlapping/cut-off text.
- Any button whose label does not explain the result.
- Any action that succeeds without visible proof.
- Any action that fails without a repair path.

## Launch Blockers

Do not expand pilots if any of these are true:

- Funeral-home sample console needs founder narration to make ROI clear.
- Staff workspace shows director/admin clutter.
- Client-step handled/waiting states can be saved without meaningful detail.
- Family update, reminder, vendor update, or client-step assignment can send repeatedly without throttling.
- HubSpot cannot show the funeral-home lead/pilot stage.
- Stripe live webhook readiness is unknown for paid partner conversion.
- Public pages imply HIPAA, SOC 1, or SOC 2 certification before review.
- Production reset can remove real customer, lead, estate, vendor, or partner records.

## Definition of Flawless Enough for Pilot Expansion

Passage is pilot-expandable when:

- Director loop passes in desktop and mobile-sized viewport.
- Employee loop passes in desktop and mobile-sized viewport.
- Family coordinator loop shows urgent context, waiting point, proof, and next expected update.
- Participant loop completes in under one minute.
- Vendor request loop is scoped and payment/status language is clear.
- Admin readiness shows no P0 blocker.
- Abuse/refresh controls are implemented for tracking, contact, sends, reminders, admin checks, and vendor/payment routes.
