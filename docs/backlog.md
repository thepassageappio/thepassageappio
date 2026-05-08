# Passage Backlog

## Now (May 4-May 6, 2026)

- Round 14 ironclad spine pass: treat `docs/ironclad-operating-spine-roadmap.md` as the readiness contract for families, participants, funeral homes, funeral-home staff, vendors, Passage system admins, messaging, permissions, demo, and task orchestration.
- Hold every sprint to the scorecard loops: red path closes, funeral-home partner activates, payment entitlement works, and vendor marketplace connects. Schema presence alone is not success.
- Sprint 2 entry point: build the shared task action spine so assigned/unassigned tasks route through the same assign, send, proof, waiting, help, output, and audit behavior across every persona.
- Public trust/demo blockers from external QA: FAQ/Trust/Privacy/Terms overview destinations are now present as product-boundary scaffolding; formal owner/counsel-approved legal copy is still required before serious pilots. Funeral-home feature tab smoke tests and any remaining mobile nav simplification still need recurring green-deploy QA.
- Product-audit north star: Passage must bias toward crisis coordination and workflow confidence over memorial/social/AI feature expansion. Next gains come from restraint, emotional pacing, mobile usability, trust/security, and one clear next action per screen.
- Post-simplification QA sweep (0d2bc3a..11902d0): command center hierarchy + nav, wishes save, comms center parity; no dead ends.
- Stop-the-line regressions: estate persistence, invite confirmation, partner case creation/load, task action feedback (no "Confirmed" without proof).
- B2B activation gap: verify the newly seeded test funeral-home `organization` + `funeral_home_partner`, family/estate participation join, and terminal task status persistence through live app flows before calling any funeral-home demo ready.
- Terminal task status QA: marking handled must update the task row used by dashboards/reports, not only write `task_status_events`.
- Auth/RLS bridge from contract proof: create a real auth user or invite path for `demo@collinsffh.com`, bridge accepted `estate_participants` into `estate_access`, and route all task completion/status writes through service-role API endpoints rather than direct client inserts into `task_status_events`.
- Canonical data-source guardrails: app code should ignore `people.invitation_token`, use `estate_participants.invite_token` for invites, use `organization_case_reference` for current location demos until a location foreign key exists, and treat per-case dollar value as roadmap-only until schema exists.
- Partner billing org-link migration is drafted but not approved/applied: add `funeral_home_partners.organization_id`, backfill Collins/HVFG, scope RLS by org, and expose `partnerPlan`/`activationStatus` from `/api/partnerContext`. Open owner gate: confirm HVFG plan/fee/trial values before any production SQL.
- Current RLS risk: until the org-link migration ships, app code must never rely on client-side reads from `funeral_home_partners`; use the server/service-role partner context and return only the matched plan.
- Collins activation blocker: `demo@collinsffh.com` needs an Auth user/invite path and member `user_id` backfill before staff login QA can pass.
- Participant acceptance blocker: invite acceptance must upsert both `estate_participants` and `estate_access` so the participant can see the task plus funeral-home activity/events.
- Vendor request action blocker: vendor `Accept request`, `Mark in progress`, `Mark completed`, and `Decline` must update one coherent current status, proof trail, owner notification, task status event, and family/funeral-home-visible activity without contradictory states like declined plus completed.
- Repo hygiene: `.gitattributes` now normalizes LF line endings; monitor for any remaining phantom dirty files after Windows edits.
- QA infrastructure: Browser plugin / local Playwright visual QA is currently blocked in this desktop session by a missing app-server path and no repo-local Playwright package. Add a durable QA setup so every deploy can run Browser/Chrome screenshots plus direct backend smoke without manual repair.
- Persona QA: red-path (home/hospice/hospital/past-first-steps) + funeral-home demo (one-location + multi-location) + invited family view; always one clear next action.
- Webhook-as-proof QA: Resend + Twilio `webhook_events` record provider + timestamp + actor and are surfaced as proof; vendor requests show Sent/Received/Accepted/Declined with visible activity.
- Partner + vendor access policy (minimal): roles + org membership (multi-location admin vs staff vs vendor vs Passage admin) + who can act-on-behalf.

## Next

- Operational Calm hardening sprint, only where it supports task-spine demo readiness:
  - P0: remove remaining card soup and normalize visual hierarchy across estate, red path, participant, funeral-home, and vendor surfaces.
  - P0: make the red path first 3 minutes feel like guided family incident response: situation -> immediate authority guidance -> coordination activation.
  - P0: strengthen workflow visibility everywhere: owner, waiting reason, proof destination, last actor/time, next action.
  - P1: mobile task completion and invite acceptance QA at 100% Chrome viewport.
  - P1: visible trust layer: permissions, audit trail, data ownership, export confidence, document visibility.
  - P2: favicon and console hygiene, including repeated Supabase client warnings.
- Build shared `TaskActionModal` so family, participant, funeral-home staff, and vendor-adjacent task surfaces use the same assign/send/proof/waiting/help/handled interaction.
- Build shared notification preference resolution for the task spine: in-app/email/text availability, consent, fallback, skipped-channel logging, role visibility, and a simple preference setup for family coordinators, participants, funeral-home staff/admins, and vendors.
- Add participant and funeral-home employee onboarding reliability: assignment notifications land on a role-appropriate work page with one clear action.
- Rebuild `My estate` as an estate index plus per-estate command center tabs: Today, Tasks, People, Events, Documents and outputs, Obituary and wishes, Messages, Audit.
- Productize Tier 1 outputs: obituary draft, funeral-home packet, family notification set, clergy outreach, bank/government packets, executor summary, and home/assets checklist.
- Add communication command center: task messages, family/funeral-home updates, vendor/cemetery/clergy threads, and internal funeral-home staff notes must all write to one visible event/message spine.
- Restore urgent path crisis posture: triage first, authority second, only minimum save fields third, no empty progress dashboard as first impression, and no sign-in wall before a useful first-step plan.
- Add B2B closed-loop pilot gate: funeral home creates case -> family command center opens -> funeral home acts on behalf -> family sees proof -> export/report works.
- Add schema activation smoke: `funeral_home_partners`, `estate_participants`, `vendor_requests`, `marketplace_interactions`, `subscriptions`, `accounts`, and `account_entitlements` either receive test/demo rows from live flows or are explicitly omitted from demo claims.
- Wire or visibly defer the payment loop: Pilot/Local/Group pricing CTAs must either reach checkout/test checkout and write entitlement state, or route to a contact/pilot fallback with no dead end.
- Turn system-admin demo into a one-step-at-a-time guided sales studio with dummy-only data and a stronger prospect narrative.
- Split the header/nav shell by audience: public users see only core paths, signed-in users see role-appropriate work areas, and Passage system-admin utilities like Demo, Vendor page, and Vendor admin move behind a system-admin menu so the banner stays calm at desktop and mobile sizes.
- Clean up the public guide unlock page: move the email/name/guide selector into the locked article module so the page reads as one contained "pick guide -> unlock article" action instead of a floating form plus disconnected locked preview.
- Fix vendor admin/provisioning loop: submitted applications load, system admin approves/declines, approved vendors get profile setup and vendor-owned dashboard access.
- Harden vendor request actions: token-based vendor actions and system-admin demo actions must share the same status transition rules, visible proof trail, and no-real-record demo copy so the marketplace loop can be trusted in demos.
- Define funeral-home staff role UX: director/admin, location manager, and employee dashboards with location/assigned-work scope and reporting.
- Add ROI/reporting fields plan: case value, location, employee, tasks completed, time saved, marketplace revenue share, and CSV exports.
- Add an AI execution spine only after task/output contracts are stable: there is no active OpenAI integration today, so start future AI work with a server-side Responses API adapter, current recommended GPT model default, strict structured-output schemas, prompt fixtures, audit/proof logging, and no direct client-side model calls.
- Tighten and freeze the 15-minute funeral home demo script + objection answers (doc-only until owner approves outreach).
- Produce a one-page pilot handout (offer terms placeholders; no pricing changes).
- Replace draft trust/legal scaffolding with owner/counsel-reviewed policy language: final Privacy Policy, Terms of Service, vendor terms, funeral-home partner terms, data retention, upload/document policy, and urgent-path liability boundaries before serious pilots.
- Deepen Trust & Security page after schema/storage hardening: role-based access proof, audit trail screenshots, document handling, encryption/security posture, privacy, and plain-language boundaries around emergency/legal/medical/funeral guidance.
- Add Passage system-admin shell and business health dashboard: one admin tab for demo, vendor admin, vendor page QA, leads/support inbox, raw data exports, ARR/MRR/NRR/churn, pilot conversion, contact inquiry types, engagement, marketplace value, rev share, and customer health metrics.
- Map top red-path tasks into automated / assisted / guided-manual tiers; list proof required + follow-up loop for each.
- Identify owner-facing notification gaps for participant/vendor/funeral-home completion events (inventory only).
- Define trusted vendor criteria + an approval/override process for funeral homes.
- Add a demo-visible Release / Certificate Pipeline: pronouncement, ME/coroner involvement, hospital or hospice release, death certificate submitted/certified, permit/authorization collected, each with owner, timestamp, and proof.
- Create a Funeral-Rule-safe after-hours info pack: GPL link, itemized price guidance, cash-advance clarity, and a phone-safe script that reduces repeat calls without turning Passage into a pricing app.
- Make hybrid planning the default posture: self-serve intake plus director-assisted handoff that pre-fills known facts, especially for funeral homes where families start online and still need human help.
- Add a Faith & Care Team cluster: chaplain/officiant, service preferences, livestream owner, clergy contact, and proof fields for outreach/status.
- Add an after-death admin hub downstream of death certificates: SSA/Medicare, banks, insurance, credit bureaus, scam/debt-collector guardrails, owner, and done-proof.

## Later

- Vendor payments / Stripe Connect design (after pilots validate demand).
- Document upload as a funeral home pilot add-on after core demos are stable.
- Family chat only after pilot feedback confirms need.
- State-specific workflows + deeper compliance guidance.
- Marketplace revenue-share reporting for funeral homes.

## Questions

- Which local funeral homes are first pilot targets (one-location vs multi-location mix)?
- What is the pilot offer structure (length, trial, price) as of May 2026?
- Which vendor categories get seeded first in Hudson Valley (1-2 per task only)?
- Which parts of healthcare proxy guidance require legal review before demos?
- What are the 5 must-have analytics events before broader outreach?

## Blocked / Needs Owner

- Production SQL changes require owner approval and manual Supabase execution (unless deployment pipeline changes).
- Real customer/vendor/funeral-home emails or SMS require owner approval.
- Pricing changes require owner approval.
