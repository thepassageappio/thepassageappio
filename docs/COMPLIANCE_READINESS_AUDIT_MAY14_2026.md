# Passage Compliance Readiness Audit

Date: May 14, 2026

This is an engineering readiness audit, not legal advice or a certification report.

## Executive Read

Passage is not ready to claim HIPAA compliance, SOC 1 compliance, or SOC 2 compliance today.

Passage is, however, moving in the right direction for a sensitive coordination product:

- role-scoped data model
- Supabase RLS enabled on public tables
- audit/event trails
- review-before-share product principle
- security headers in `next.config.js`
- gated system admin and demo routes
- privacy, terms, and trust pages that avoid overclaiming

The near-term posture should be:

> Passage is security-conscious, role-scoped, audit-oriented, and preparing for formal compliance review. Passage does not currently claim HIPAA, SOC 1, or SOC 2 certification.

## HIPAA Readiness

### Practical Applicability

HIPAA applies directly to covered entities and their business associates. Passage is not automatically a covered entity just because it supports families after a death. It can become a business associate if it creates, receives, maintains, or transmits protected health information on behalf of a covered entity such as a hospice, hospital, health plan, or covered care provider.

Official reference:

- HHS HIPAA covered entity and business associate guidance: https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html
- HHS HIPAA Privacy Rule summary: https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html

### Current Assessment

Status: HIPAA-adjacent, not HIPAA-ready.

What is good:

- Product copy correctly says Passage is not a medical provider.
- Trust page tells users to contact emergency services, hospice, medical staff, police, funeral director, legal professional, or local authority when safety or legal authority is unclear.
- RLS is enabled across public tables.
- Admin and demo routes are gated.
- Sensitive coordination events are logged.

Blocking gaps:

- No HIPAA-specific policy set.
- No Business Associate Agreement template.
- No subprocessor HIPAA posture table.
- No documented breach notification workflow.
- No formal access review cadence.
- No documented PHI classification rules.
- No documented retention/destruction schedule for health-adjacent data.
- No signed BAAs with infrastructure/processors that may touch PHI.
- No formal workforce security training record.
- No formal risk analysis/risk management evidence packet.

Engineering note:

During this audit, `estate_events` had legacy public read/insert policies. Those policies were removed in migration `20260514183000_lock_down_estate_events_rls.sql`, and live Supabase now shows only scoped authenticated estate-user policies for `estate_events`.

## SOC 2 Readiness

### Practical Applicability

SOC 2 is an attestation against trust services criteria, usually Security first, then Availability, Confidentiality, Processing Integrity, and Privacy as needed. It is not just code. It requires policies, evidence, control owners, access reviews, vendor management, incident response, change management, monitoring, and audit trails.

Official reference:

- AICPA Trust Services Criteria overview: https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022

### Current Assessment

Status: SOC 2 directionally aligned, not audit-ready.

What is good:

- Security headers are configured in `next.config.js`.
- RLS is enabled on all public tables checked.
- Admin and demo routes are protected by middleware.
- System admin has metrics, QA, reset, and smoke-test concepts.
- Notification logs and event trails exist.
- Migrations are now linked and visible through Supabase CLI.

Blocking gaps:

- No formal information security policy.
- No formal access control policy.
- No documented quarterly access review process.
- No vendor/subprocessor risk register.
- No incident response plan or tabletop evidence.
- No change management policy tying GitHub, migration, deploy, and rollback together.
- No backup/restore evidence or RPO/RTO statement.
- No production monitoring/alerting evidence packet.
- No vulnerability management process.
- No employee/contractor onboarding/offboarding checklist.
- No data classification policy.
- No tested disaster recovery runbook.

P0 SOC 2 control work:

- Create policies and evidence folders.
- Add access review checklist.
- Add vendor register.
- Add incident response runbook.
- Add data retention and deletion runbook.
- Add backup/restore test evidence.
- Add security header verification and RLS verification scripts.
- Add production deploy checklist requiring build pass, migration list, RLS check, and smoke test.

## SOC 1 Readiness

SOC 1 is about controls relevant to financial reporting. Passage probably does not need SOC 1 yet unless enterprise customers require assurance around vendor payouts, marketplace fees, Stripe Connect transfers, billing, or revenue recognition.

Current status: not needed immediately, not ready.

SOC 1 becomes relevant when:

- Passage handles vendor marketplace payments at scale.
- Customers rely on Passage financial reports.
- Vendor remittance, credits, refunds, and fee reporting become material.

Near-term alternative:

- Keep money movement Stripe-native.
- Store transaction IDs, gross, Passage fee, vendor net, payment status, payout status, and webhook event IDs.
- Reconcile Stripe to Supabase regularly.
- Avoid wallet/balance logic until necessary.

## Data Security Findings

### Fixed During This Audit

- Removed legacy public read/insert policies from `public.estate_events`.
- Updated `security.txt` contact to `support@thepassageapp.io`.

### Needs Further Review

RLS-enabled tables with zero policies are denied to normal clients by default, which is usually safe but needs intentional documentation. Current zero-policy tables found:

- `children`
- `file_snapshots`
- `marketplace_interactions`
- `marketplace_providers`
- `referrals`
- `spouse_links`
- `subscriptions`
- `workflow_templates`

Action:

- Document whether each is service-role-only, deprecated, or needs scoped client policies.

Sensitive tables that need deeper policy tests:

- `workflows`
- `tasks`
- `estate_events`
- `task_status_events`
- `notification_log`
- `estate_participants`
- `estate_access`
- `vendor_requests`
- `vendor_orders`
- `vendor_payments`
- `activation_requests`
- `activation_witnesses`
- `documents`

## Public Claims Guidance

Do not say:

- HIPAA compliant
- SOC 2 compliant
- SOC 2 ready
- HIPAA-ready
- enterprise-grade compliance
- fully compliant

Safe language:

- role-scoped access
- audit-oriented design
- review-before-share workflow
- preparing for formal compliance review
- BAA pathway planned for covered-entity partnerships
- SOC 2 readiness program planned

## P0 Compliance Sprint

### Sprint 1: RLS and Data Boundary Verification

Requirements:

- Add automated RLS audit script.
- Fail CI or admin smoke test if public allow-all policies exist on sensitive tables.
- Document zero-policy tables.
- Run negative access tests for family, participant, funeral home, vendor, and anonymous users.

Success criteria:

- Anonymous users cannot read estate/task/event/payment tables.
- Participants can only see scoped assigned work and activation witness context.
- Vendors cannot browse estates.
- Funeral-home staff cannot see unrelated organizations.

### Sprint 2: HIPAA-Adjacent Trust Packet

Requirements:

- Create BAA readiness packet.
- Create PHI/sensitive-data classification guide.
- Create breach notification runbook.
- Create subprocessor list with HIPAA posture.
- Create retention/deletion policy.

Success criteria:

- Passage can answer a hospice or care facility diligence questionnaire honestly without improvising.
- Public site avoids HIPAA claims until agreements and controls exist.

### Sprint 3: SOC 2 Readiness Packet

Requirements:

- Draft security policy.
- Draft access control policy.
- Draft incident response policy.
- Draft vendor management policy.
- Draft change management policy.
- Add access review log.
- Add deploy/release checklist.

Success criteria:

- Passage has a credible first evidence packet for a future SOC 2 readiness assessor.

### Sprint 4: Production Evidence Automation

Requirements:

- Add admin compliance checks:
  - security headers
  - RLS sensitive table policies
  - migration list
  - smoke test
  - notification safety mode
  - Stripe webhook configured
  - Resend configured
  - Twilio live/dry-run state
- Add exportable compliance report for system admin.

Success criteria:

- Steve can generate a current compliance-readiness snapshot before demos and partner conversations.

## Bottom Line

Passage is not compliance-certified today. It is safe to keep building and demoing with careful language, especially with QA routing and no real customer data. Before hospice, care facility, enterprise funeral-home, or health-system pilots, Passage needs the HIPAA-adjacent and SOC 2 readiness sprints above.
