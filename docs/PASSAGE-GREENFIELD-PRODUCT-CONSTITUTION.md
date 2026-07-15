# Passage Greenfield Product Constitution

**Date:** 2026-07-14  
**Status:** Founder-approved operating mandate  
**Scope:** Product, experience, data, platform, QA, demo, and delivery

## Mission

Build Passage as the trusted operating system that connects families and the death-care ecosystem before, during, and after a death.

The product must combine:

- Apple-level clarity, restraint, and interaction quality.
- Emotional warmth appropriate to grief and family decision-making.
- Operational credibility for funeral-home directors and employees.
- Enterprise-grade identity, permissions, auditability, security, accessibility, and reliability.
- A modern experience for Millennials and Gen Z coordinating care for aging parents.
- A deterministic, isolated sales sandbox suitable for live funeral-home demonstrations.

## Founder directive

There are no customers and no compatibility requirement. The existing application is evidence and domain research, not an implementation constraint.

Therefore:

- Do not preserve legacy routes, layouts, navigation, components, or schema by default.
- Do not perform parity extraction or stabilization unless a retained capability has a documented reason to survive.
- Prefer replacement over refactoring when replacement produces a clearer product and architecture.
- Backend and schema may change through versioned, documented Supabase migrations.
- Production data must never be mutated ad hoc.
- Unverified legal, medical, privacy, retention, or authority claims must not appear in product copy.

## Product model

One authoritative estate record is the continuity object. Every persona sees a purpose-built view of the same underlying people, authority, decisions, commitments, documents, handoffs, and audit history.

### Family experience

A calm guided workspace that answers:

1. What needs attention now?
2. What decision is mine?
3. Who is waiting for me?
4. What information exists?
5. What will happen when I act?
6. Who has access, and how can I revoke it?

### Funeral director experience

A Passage Briefing that answers within 30 seconds:

1. Which case needs intervention?
2. Why is it the priority?
3. Who owns the next commitment?
4. Who is waiting?
5. What proof or information is missing?
6. What is the single best next action?

It is not a conventional card-grid dashboard.

### Employee experience

A focused work console limited by authorization and responsibility. Employees see assigned work, case context, dependencies, escalation, and completion proof—not organization-wide director controls hidden only by presentation.

### Network experiences

Hospice, cemetery, vendors, and estate-administration participants receive narrow, permissioned workflows connected to the same estate record. They do not receive generalized access to a family workspace or funeral-home console.

## Signature experience

### Passage Briefing

A calm operational briefing built around a case-flow horizon and one prioritized commitment. Opening a case preserves queue context.

### Transfer Wallet

A family-controlled surface for selecting a recipient, explicit scope, expiry, and review-before-activation. The resulting Transfer Pass contains a QR code, fallback code, status, expiry, and revocation control.

### Case Chronicle

The underlying event history for decisions, handoffs, permissions, tasks, documents, and proof. It provides continuity and auditability without forcing every user to operate through a timeline UI.

### Continuity line

The core visual and system metaphor follows responsibility across the estate journey. It shows where responsibility sits, who is waiting, what is authorized, and what comes next. Color alone must never carry its meaning.

## Architecture principles

1. Persona-specific experiences over role-switched generic dashboards.
2. One estate identity over duplicated records.
3. Append-only audit events for material consent and handoff actions.
4. Least-privilege authorization enforced in data policies and APIs, not only UI.
5. Secure, high-entropy, hashed Transfer Pass secrets; raw secrets are never stored.
6. Explicit share-scope snapshots, expiry, acceptance, revocation, and provenance.
7. Deterministic synthetic demo data isolated from production systems.
8. Recoverable workflows with designed loading, empty, partial, stale, offline, error, expired, revoked, and permission-denied states.
9. WCAG 2.2 AA as the minimum experience contract.
10. Observable and testable critical journeys from browser through API and database.

## First sellable vertical slice

The initial sandbox release must support this continuous story:

1. Reset the sandbox to deterministic synthetic data.
2. Enter as a funeral-home director.
3. Understand the highest-priority commitment in under 30 seconds.
4. Open the family case without losing queue context.
5. Enter as the family decision-maker.
6. Select a funeral home and choose exactly what information will travel.
7. Review scope and expiry, then activate a Transfer Pass.
8. Enter or scan the pass as funeral-home staff.
9. Authenticate, inspect granted scope, and accept into the same case.
10. Generate a standardized intake packet from only the accepted scope.
11. Show the family audit history.
12. Revoke the pass and verify future access is blocked.

No real email, SMS, payment, customer data, or unsupported compliance claim is required for this slice.

## Evidence standard

A work item is not complete based on code or claims alone. Required evidence is proportional to risk and includes:

- Exact commit and deployment identity.
- Build and focused test results.
- Browser console verification.
- Desktop and 390px screenshots.
- Accessibility and keyboard checks for critical flows.
- Permission-matrix evidence for data changes.
- Sandbox reset and isolation evidence.
- A documented rollback or replacement seam until the new slice is accepted.

## Current critical path

1. Establish a separate resettable demo runtime.
2. Create the new application shell and estate/case domain boundary.
3. Implement Passage Briefing for directors and the distinct employee workspace.
4. Land Transfer Pass ADR, migrations, RLS, and security tests in sandbox.
5. Implement the family Transfer Wallet and director scan/accept flow.
6. Verify the full vertical slice with real screenshots and console/data evidence.
7. Promote only a tested release candidate.

Legacy hydration, typography, estate-page defects, and dashboard extraction are not blockers unless a deliberate retention decision is recorded.
