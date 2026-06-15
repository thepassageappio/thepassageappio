# Sprint 1: Funeral-Home Sales Surface

Goal: turn public interest into qualified funeral-home demo and pilot conversations.

This sprint should be completed before broad outreach. It is not a cosmetic copy sprint. It is the first revenue sprint toward $300k ARR.

## Target Buyer

Primary buyer: funeral-home owner, director, or operator.

Primary promise: Passage reduces repeated family status calls and gives the team a visible proof trail around family coordination, staff work, vendors, and exports.

Primary CTA: open the sample funeral-home console.

Secondary CTA: book a pilot walkthrough.

## Files / Routes To Touch

- `pages/funeral-home/index.js`
- `pages/index.js` / `components/App.js` homepage sections that mention funeral-home demo CTAs
- `pages/funeral-home/dashboard.js` or active funeral-home dashboard route
- `pages/api/supportInquiry.js`
- `pages/api/saveLead.js`
- `lib/hubspot.js`
- `pages/api/system/publicSurfaceReadiness.js`
- `pages/api/system/rateLimitReadiness.js`

## Public Page Acceptance Criteria

### Homepage

- Funeral-home operating proof appears above or near the first business CTA.
- The sample console CTA is visible without hunting.
- Emotional mission copy remains, but it does not hide what the product does.
- Public page does not expose System Admin, roadmap, P0, smoke-test, scaffold, or internal QA language.

### Funeral-Home Page

- First viewport answers: What is this? Why does it matter? What do I click?
- The page leads with operational relief: fewer repeated calls, clearer owners, visible proof, approved handoffs, export.
- CTAs are explicit:
  - Open sample console
  - Book pilot walkthrough
  - Director sign in
  - Staff sign in
- Pricing/pilot positioning is visible and understandable.
- The page includes at least three concrete proof points:
  - My Day
  - Family update/proof trail
  - Staff assignment or export/reporting

### Sample Console

- Opens without login in demo mode.
- Does not leak owner-only admin controls.
- Guided tour can be completed in 90 seconds.
- Each tour stop has buyer language, not internal product language.
- Director can see active case pressure, waiting items, staff work, and proof.

## Lead Capture Criteria

A qualified funeral-home lead should capture:

- Organization name
- Contact name
- Email
- Phone, optional but preferred
- Role
- Location count
- Approximate monthly case volume
- Current pain / reason for interest
- Source route and CTA label
- Desired next step: sample console, walkthrough, pilot, pricing, or support

HubSpot routing should create or update:

- Contact
- Company with `companyType=funeral_home`
- Deal in funeral-home pipeline/stage
- Source payload visible in `crm_sync_events`

## QA Script

Use `docs/funeral-home-flawless-qa.md` and run:

1. Prospect Funeral Director
2. Funeral-Home Director
3. Funeral-Home Employee
4. Family Coordinator connected to funeral home
5. Participant/helper
6. Vendor/local support
7. System Admin founder control room

Required viewport checks:

- 1440px desktop
- 1280px laptop
- 900px tablet-ish
- 390px mobile

## Sprint 1 Done Definition

Sprint 1 is done only when:

- A cold funeral-home prospect can understand the product from the public page and sample console.
- Every funeral-home CTA resolves to a concrete next step.
- Sample console proves ROI without founder narration.
- Identifiable funeral-home leads appear in admin/HubSpot, not just anonymous `product_event` rows.
- Public-surface readiness returns no P0 blocker except explicitly documented external config gates.
- Rate-limit readiness shows tracking, contact intake, and outbound sends wired.

## Do Not Ship If

- Staff workspace still looks like director/admin workspace.
- Sample console needs verbal explanation to make the value obvious.
- Lead submission does not become contactable pipeline.
- Support/vendor/care-provider forms can be spammed into CRM.
- Public copy overclaims HIPAA, SOC 1, SOC 2, legal, payment, or SMS readiness.
