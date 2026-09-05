# Enterprise organization and administration benchmark

**Date:** September 4, 2026
**Scope:** Organization creation, accounts, member lifecycle, roles, permissions, administration, and enterprise identity
**Decision:** Preserve Passage's working tenant and transaction authorization foundation, then make enterprise administration a dedicated product surface and evidence gate.

## Executive conclusion

Passage has a credible controlled-evaluation organization foundation: durable organizations, membership-backed access, six least-privilege role templates, recipient-bound invitations, immediate revocation at the authorization boundary, append-only access events, and database-enforced transaction permissions. The product is ahead of a screen-only MVP.

It is not yet a complete enterprise administration product. The current experience lacks the IT control plane expected in mature B2B software: verified domains, multi-organization selection, SSO, SCIM/group provisioning, privileged MFA policy, a centralized permission catalog, billing and integration administrators, full invitation operations, searchable/exportable audit history, access reviews, owner transfer, retention controls, and recovery operations.

**Benchmark score: 44/100 for enterprise administration maturity.** This is a product-maturity benchmark, not a security certification. The score is consistent with a strong evaluation/pilot foundation whose enterprise control plane is still queued.

## Research baseline

The benchmark uses current primary documentation from enterprise identity, authorization, security, and administration products:

- WorkOS treats organizations as the enterprise boundary and provides an IT-admin portal for domain verification, SSO, Directory Sync, and connection testing. Its user-management surface supports invitations, removal, role changes, and organization-scoped authorization. [Admin Portal](https://workos.com/docs/admin-portal), [User Management Widget](https://workos.com/docs/widgets/user-management), [Organizations API](https://workos.com/docs/widgets-api/organizations)
- WorkOS and Clerk model permissions separately from roles and support organization-scoped or custom roles. WorkOS also maps identity-provider groups to application roles. [WorkOS RBAC](https://workos.com/docs/rbac), [WorkOS IdP role assignment](https://workos.com/docs/directory-sync/identity-provider-role-assignment), [Clerk roles and permissions](https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions)
- Auth0 invitations bind the invited email, organization, and optional organization role; the role applies in the context of that organization. [Auth0 organization invitations](https://auth0.com/docs/manage-users/organizations/configure-organizations/invite-members)
- Clerk makes organization membership explicit, supports verified-domain enrollment, and supports one user belonging to multiple organizations with different active roles. [Clerk organization configuration](https://clerk.com/docs/guides/organizations/configure), [Clerk organization switcher](https://clerk.com/components/organization-switcher)
- Microsoft Entra uses SCIM 2.0 to create, update, and remove users and groups as assignments and employment state change. [Microsoft Entra provisioning](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/how-provisioning-works)
- Stripe separates organization-level and account-level roles, lets administrators require two-factor authentication, exposes member security history, and supports CSV export. [Stripe organization access](https://docs.stripe.com/get-started/account/orgs/team)
- GitHub supports predefined and custom enterprise/organization roles and export or streaming of enterprise audit history. [GitHub enterprise roles](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/roles-in-an-enterprise), [GitHub audit streaming](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise)
- OWASP recommends least privilege, deny by default, authorization on every request, and relationship/attribute-aware authorization when pure RBAC is insufficient. [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- NIST requires account lifecycle controls and auditable creation, modification, disabling, and removal. AWS similarly recommends federation, MFA, temporary credentials, least privilege, and regular removal of unused access. [NIST SP 800-53 Rev. 5.1](https://csrc.nist.gov/CSRC/media/Projects/risk-management/800-53%20Downloads/800-53r5/SP_800-53_v5_1-derived-OSCAL.pdf), [AWS IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

## Passage benchmark

Scoring measures current demonstrated behavior, not planned documentation. A perfect score requires a usable customer-facing surface, server enforcement, durable audit evidence, negative-path tests, and operating/recovery evidence.

| Capability | Weight | Passage today | Score |
| --- | ---: | --- | ---: |
| Tenant and organization boundary | 12 | Durable organizations, memberships, RLS, organization-scoped data and denial tests; no verified-domain claim or enterprise lifecycle | 9 |
| Organization onboarding and resume | 8 | Passwordless signup, organization identity, versioned terms, authorized-use attestation, policy selection and workspace handoff; duplicate-company/domain recovery remains | 6 |
| Invitations and member lifecycle | 8 | Recipient-bound seven-day invitations, acceptance, role assignment and revocation; no complete resend UI, delivery operations, ownership transfer, last-active state or access-review cycle | 6 |
| Authorization and role enforcement | 14 | Six roles, role-specific UI, server commands, RLS/database checks, stale-version and idempotency controls; permission logic is not yet one central capability registry | 10 |
| Enterprise admin UX | 10 | People/access, organization/plan and policy pages exist; no unified admin information architecture, search/filtering, health alerts or setup checklist | 5 |
| Multi-organization and hierarchy | 6 | Membership is organization-scoped, but the current access context selects one latest membership and exposes no organization switcher, business units or locations | 1 |
| Domain, SSO and privileged MFA | 10 | Passwordless organization login works; verified domain, SAML/OIDC, enforced privileged MFA, step-up and break-glass controls are absent | 1 |
| SCIM, groups and automated lifecycle | 8 | Not implemented | 0 |
| Audit and access certification | 8 | Append-only organization access events and record receipts exist; organization view is limited and has no search, export, stream, certification or anomaly workflow | 3 |
| Billing administration | 6 | Plan, allowance and payment approach are readable; billing contacts, invoices, payment state operations, renewal and finance roles are not implemented | 2 |
| Policy administration | 4 | One immutable selected template is consumed by requests; no authoring, approval, effective dates, rollback or jurisdiction workflow | 1 |
| Integrations and service identities | 3 | Server provider boundaries exist; no customer-facing API credentials, rotation, scoped service accounts, webhook management or integration health | 0 |
| Retention, support and recovery administration | 3 | Requirements are documented; customer controls and tested operating flows are not implemented | 0 |
| **Total** | **100** |  | **44** |

## Strengths to preserve

1. **The organization is an authorization boundary, not an email-domain shortcut.** This is the right foundation for financial-institution data.
2. **External participants are not organization members.** Principals and representatives receive record- and role-bound sessions, keeping workforce access separate from transaction participation.
3. **The role split reflects actual work.** Operations can prepare and activate; reviewers can review and decide; auditors are read-only; developers do not receive participant-record access.
4. **High-risk state changes are versioned and idempotent.** Role changes and revocation are not blind browser updates.
5. **Revocation and membership history are durable.** Passage already follows the NIST direction that account changes and disablement must be auditable.

## Product-model risks to correct

### 1. Roles are carrying permissions implicitly

The application currently checks role names in multiple files and database functions. That is workable for the MVP but becomes fragile as billing, policy, integrations, support, locations, and custom institution workflows are added.

Create a canonical permission registry and use role templates as bundles. UI, server commands, database functions, tests, and audit copy must reference the same capability names.

### 2. One membership is silently selected

The current access context chooses the most recently updated membership. A user who belongs to multiple organizations needs an explicit active-organization selection bound to the session. No route should infer the organization from recency, email domain, request input, or a client-supplied ID alone.

### 3. Enterprise identity is not an admin workflow

Adding SAML configuration fields is insufficient. An IT administrator needs domain claim, identity-provider connection, test sign-in, enforcement state, recovery contacts, group mapping, provisioning status, and a safe rollback path.

### 4. Audit history is a feed, not yet an enterprise control

Recent activity is useful, but enterprise buyers need actor, action, target, time, outcome, source/session context, search, filters, export, retention, integrity, and customer-visible access-review evidence.

### 5. Administration is split across product pages

People, organization, plan, and policy pages exist, but they do not yet feel like one governed setup. An enterprise buyer should be able to answer: who controls this organization, who has access, what can each person do, how do they authenticate, what data is retained, what is connected, what is billed, and what changed?

## Target authorization model

Use three layers rather than either pure fixed-role RBAC or unlimited custom permissions:

1. **Organization role template** — the person's job function.
2. **Resource relationship** — organization, business unit/location, or assigned request.
3. **Context attributes** — membership status, request state, evidence sensitivity, authentication strength, and temporary elevation expiry.

The server authorizes the resolved capability at action time and denies by default. The browser never supplies a trusted role, organization, or permission.

### Canonical capability catalog

| Domain | Capabilities |
| --- | --- |
| Organization | `organization.view`, `organization.manage`, `organization.security_manage` |
| Members | `members.view`, `members.invite`, `members.role_manage`, `members.revoke`, `members.owner_transfer` |
| Requests | `requests.view`, `requests.create`, `requests.activate`, `requests.assign`, `requests.review_evidence`, `requests.request_information`, `requests.decide` |
| Policy | `policy.view`, `policy.manage`, `policy.approve` |
| Audit | `audit.view`, `audit.export`, `access_review.manage` |
| Billing | `billing.view`, `billing.manage_contacts`, `billing.manage` |
| Integrations | `integrations.view`, `integrations.manage`, `credentials.rotate` |
| Data | `retention.view`, `retention.manage`, `exports.create` |

### Recommended default roles

| Role template | Recommended permissions and constraints |
| --- | --- |
| Owner | All organization capabilities; protected last owner; step-up required for ownership, security and destructive changes |
| Organization administrator | Members, organization settings, request operations and review; cannot remove/replace the last owner or weaken owner security |
| Operations coordinator | Create, activate, assign and track requests; no team, billing, policy-approval or final-decision permission |
| Institution reviewer | Assigned/authorized request and evidence review, clarification and final decision; no request activation or membership management |
| Auditor | Read requests, receipts, policy and audit; export only when explicitly granted; no mutation |
| Integration administrator | Manage endpoints and scoped credentials; no evidence/document access by default |
| Billing administrator | Billing contacts, invoices, allowance and renewal; no participant evidence or decision access by default |

Keep these templates fixed through initial pilots. Add customer-defined roles only after real institutions demonstrate combinations that the templates cannot safely express.

## Target enterprise admin experience

Create a dedicated **Organization administration** area:

1. **Overview** — legal/display identity, status, verified domains, owners, plan, readiness checklist.
2. **Members and access** — search/filter, active/pending/revoked state, role explanation, last activity, invite/resend/revoke, owner transfer.
3. **Security and identity** — MFA policy, domain claim, SSO connection and test, SCIM status, recovery contacts, active sessions.
4. **Policies and workflows** — active version, effective date, approver, draft/approved/retired state, rollback.
5. **Billing and usage** — billing contacts, plan, allowance, invoices, payment state, renewal and next action.
6. **Integrations** — environment, endpoints, scoped credentials, last delivery, error rate, replay/recovery.
7. **Audit log** — actor/action/target/result/time filters, exports, access changes and security history.
8. **Data and retention** — retention class, deletion/export process, legal hold status when supported.
9. **Support and recovery** — support contacts, incident path, emergency access and organization recovery.

## Best-practice onboarding sequence

Do not burden the no-card evaluation with enterprise configuration before the buyer reaches value.

### Evaluation onboarding

1. Secure work-email authentication.
2. Organization display name, legal name and type.
3. Versioned terms/privacy/authorized-use acceptance.
4. Select the one supported workflow.
5. Enter the workspace and complete a sample request.

### Pilot conversion onboarding

1. Verify the institution domain and legal/billing identity.
2. Confirm two protected organization owners and recovery contacts.
3. Require phishing-resistant MFA for privileged roles.
4. Invite the operations and reviewer cohort with least-privilege roles.
5. Confirm policy owner, evidence boundary, retention and support owner.
6. Add billing contact and approved invoice path.
7. Configure/test SSO only if required by the pilot.
8. Review and sign off the access report before controlled data begins.

### Enterprise onboarding

1. SSO enforcement and tested recovery.
2. SCIM/group provisioning and deprovisioning.
3. Group-to-role mapping with a protected administrative group.
4. Integration credentials and webhook health.
5. Audit export/streaming and retention.
6. Customer access certification and production-readiness approval.

## Prioritized delivery plan

### Slice A — make the current capability legible (2–4 focused working days)

- Replace the separate People/Plan/Policy concept with an Organization administration shell and readiness checklist.
- Present the permission matrix before invitation and on each member row.
- Add invitation resend, delivery state, expiration and safe recovery.
- Add owner-transfer flow with two-owner protection and step-up placeholder.
- Add member search/filter, pending/active/revoked tabs and last successful activity.
- Run owner/admin/staff/reviewer/auditor/developer browser tests, including immediate revoked-session denial.

### Slice B — centralize and prove authorization (4–7 focused working days)

- Add the canonical capability registry and role-template mapping.
- Replace scattered role-name decisions in application code with capability checks.
- Preserve database authorization as the final boundary.
- Bind an explicit active organization to the session and add a switcher only when a second membership exists.
- Add automated route/command/database parity tests for every capability and resource scope.
- Add billing and integration administrator templates without granting participant-data access.

### Slice C — complete pilot administration (5–10 focused working days)

- Billing contacts, invoice/entitlement state, usage and renewal view.
- Searchable organization audit log and CSV export.
- Access-review workflow and owner certification.
- Integration-health and provider-delivery status.
- Retention, export and support/recovery surfaces backed by real procedures.
- Verified-domain claim and privileged MFA enforcement before controlled data.

### Slice D — enterprise identity and scale (qualified-customer gated)

- SAML/OIDC through a self-service IT-admin flow.
- SCIM users/groups, deprovisioning, quarantine and reconciliation.
- Identity-provider group-to-role mapping.
- Business unit/location scopes, temporary elevation and customer-defined roles if pilot evidence requires them.
- Audit streaming/SIEM integration, SLOs and break-glass exercises.

## Acceptance gates

Enterprise organization administration is working only when an independent replay proves:

`verified organization -> protected owners -> invited member -> accepted membership -> correct default permissions -> role change -> new permissions effective -> old permissions denied -> revoked membership -> active session denied -> audit export matches every change`

Additional required negative cases:

- cross-tenant guessed IDs and copied URLs;
- administrator attempting to modify owner/administrator protections;
- reviewer attempting request creation or team management;
- staff attempting final decision;
- billing/integration roles attempting participant evidence access;
- duplicate, expired, revoked and wrong-email invitations;
- stale role-change and concurrent owner-transfer submissions;
- SSO/SCIM outage without unauthorized fallback;
- last-owner, last-admin-group and recovery-contact lockout prevention.

## Product decision

The immediate priority is **not** SSO or arbitrary custom roles. First make the existing organization model explicit, centralized, testable, and understandable. Then add verified domain and privileged MFA for pilot readiness. Add SSO when a qualified institution requires it and SCIM when the customer population or procurement requirement justifies automated lifecycle management.
