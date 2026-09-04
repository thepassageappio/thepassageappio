# Passage Authority V2 best-practice review

**Date:** September 3, 2026  
**Decision:** Define the smallest complete enterprise-commercial product that can be demonstrated, evaluated, purchased, onboarded, operated, expanded, renewed, and audited without one-off customer engineering.

## Executive conclusion

Passage is directionally correct. The differentiator should remain a simple, auditable authority workflow—not a broad legal platform, identity provider, payment product, or core-banking replacement. V2 should be a hybrid product-led and sales-assisted system:

`discover -> no-card synthetic evaluation -> matching decision receipt -> qualified $5K pilot -> hosted invoice -> paid entitlement -> guided onboarding -> measured success -> annual base + included volume -> top-up/renewal expansion`

The next risk is not missing product vision. It is leaving the commercial and operational joins incomplete. An enterprise buyer must see one coherent chain across the product, billing, CRM, onboarding, support, audit evidence, and recovery. A screen or provider configuration is not enough.

## Evidence-backed design principles

### 1. Optimize onboarding for achieved value

Account creation and organization setup are prerequisites, not activation. Passage's value moment is the first synthetic request that reaches an institution decision and produces matching receipts. Product analytics should measure the time and abandonment between every prerequisite and that outcome. Amplitude explicitly distinguishes setup completion from value achievement and recommends tracking the percentage that reaches the value moment, not only onboarding completion. [Amplitude time-to-value guidance](https://amplitude.com/blog/time-to-value-drives-user-retention)

**Passage decision:** require at most five fields before the user enters the workspace; provide sample details; show one next action; defer billing address, security configuration, integration design, and broad team setup until after the first receipt.

### 2. Treat the organization as a first-class security and commercial boundary

AWS's SaaS Lens recommends a single automated, repeatable tenant-onboarding path, isolation at every layer, and tenant-aware metrics and operations. It also separates tenant identity/state from users. [AWS SaaS design principles](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/general-design-principles.html), [AWS SaaS operations](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/operate.html)

**Passage decision:** a legal customer, billing account, Passage workspace, HubSpot Company, subscription, and user are separate objects with explicit mappings. No email domain, CRM record, or payment record grants product access.

### 3. Use hybrid pricing with a legible value metric

Stripe identifies predictable base revenue plus usage-scaled expansion as a hybrid model and says a usage metric should scale with value and be legible before purchase. [Stripe usage-pricing strategy](https://stripe.com/resources/more/usage-based-pricing-strategy-for-saas), [Stripe SaaS pricing models](https://stripe.com/resources/more/saas-pricing-models-101)

**Passage decision:** the commercial unit is an activated authority request. Start with an annual base and included allowance; sell explicit top-up packs instead of automatic metered overage. Completion, users, documents, and participant messages are not billable units. Revisit rating only after real pilot usage proves predictability.

### 4. Make the $5K pilot invoice-led

Stripe's Hosted Invoice Page gives the institution a provider-hosted payment and invoice experience. Standalone invoice lines need explicit service periods or revenue may be recognized immediately on finalization. [Stripe Hosted Invoice Page](https://docs.stripe.com/invoicing/hosted-invoice-page), [Stripe revenue-recognition methodology](https://docs.stripe.com/revenue-recognition/methodology/subscriptions-and-invoicing)

**Passage decision:** no card is required for evaluation. The pilot uses a Stripe Customer and standalone invoice with the actual 60-to-90-day service period. Only a verified paid event—or a separately audited net-terms exception—may grant the pilot entitlement. The success redirect is never payment evidence.

### 5. Persist and deduplicate provider events before business processing

Stripe requires webhook signature verification against the unchanged request body and recommends idempotency for API mutations. HubSpot supports custom unique identifiers and batch upsert, which is safer than relying on company domain or contact email alone. [Stripe webhook signatures](https://docs.stripe.com/webhooks/signature), [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests), [HubSpot properties](https://developers.hubspot.com/docs/api-reference/latest/crm/properties/guide), [HubSpot object upserts](https://developers.hubspot.com/docs/api-reference/latest/crm/using-object-apis)

**Passage decision:** Stripe events enter a durable inbox before processing; HubSpot changes leave through a durable outbox. Permanent Passage idempotency records supplement provider retention. Provider failure cannot roll back product state. Reconciliation repairs projections from the owning source.

### 6. Keep CRM relational and operational

HubSpot models Companies, Contacts, Deals, Tickets, properties, pipelines, and associations as distinct CRM concepts and supports custom association labels. [HubSpot CRM architecture](https://developers.hubspot.com/docs/api-reference/latest/crm/understanding-the-crm), [HubSpot pipelines](https://developers.hubspot.com/docs/api-reference/latest/crm/pipelines/guide), [HubSpot associations](https://developers.hubspot.com/docs/api-reference/latest/crm/associations/overview)

**Passage decision:** use standard objects first. Company is the commercial account projection; Contacts are people and buying/customer roles; Deals represent New Business, Expansion, and Renewal revenue events; Tickets manage onboarding, support, billing, security, and feature requests. Passage remains authoritative for usage, entitlements, contract history, and revenue calculations.

### 7. Add enterprise identity in the right order

WorkOS's enterprise model uses organization-bound domains, organization-scoped roles, self-service IT administration, SSO, and Directory Sync/SCIM. Domain verification is a prerequisite for trusting organization-domain sign-in. [WorkOS domain verification](https://workos.com/docs/sso/domains), [WorkOS RBAC](https://workos.com/docs/rbac), [WorkOS Admin Portal](https://workos.com/docs/admin-portal), [WorkOS Directory Sync](https://workos.com/docs/directory-sync)

**Passage decision:** keep current magic-link evaluation access. Before real customer data, require organization verification and owner MFA. Add SSO as a contracted configuration when an early pilot requires it; add SCIM only when manual lifecycle management becomes a buying or security blocker. Do not replace the working auth system preemptively.

### 8. Establish a measurable security release gate

OWASP ASVS 5.0 provides a commercially usable verification baseline. Supabase's production checklist calls for RLS, Security Advisor review, SSL enforcement, network restrictions, MFA, email confirmation, appropriate OTP expiry, custom SMTP, abuse analysis, and recovery planning. Supabase also makes clear that its own SOC 2 does not make the application SOC 2 compliant. [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/), [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod), [Supabase shared responsibility](https://supabase.com/docs/guides/security/soc-2-compliance)

**Passage decision:** enterprise-ready means an ASVS-scoped control matrix, zero unresolved high-risk tenant-access defects, MFA for privileged roles, RLS and direct-access replay, upload and malware policy, secret rotation, audit retention, backup/restore evidence, incident response, subprocessor/DPA material, and an independent penetration test before production customer data.

### 9. Ship accessibility and mobile behavior as acceptance criteria

WCAG 2.2 adds focus-not-obscured, minimum target size, consistent help, reduced redundant entry, and accessible-authentication criteria. [W3C WCAG 2.2 changes](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)

**Passage decision:** every release tests desktop, 390px, 360px, keyboard-only navigation, visible focus, meaningful error announcement, 44px Passage target standard, zoom/reflow, and email readability. Compact paths should reveal detail progressively instead of creating long default pages.

## Complete V2 experience specification

### Prospect and evaluation

- One clear message: coordinate, review, decide, and preserve one auditable delegated-authority request.
- Primary paths: watch/request demo, start evaluation, security review, integration review, sign in.
- Structured inquiry replaces mailto-only actions and returns a confirmation reference.
- Attribution, consent, company, contact, intent, volume band, current process, and role enter CRM without participant data.
- Evaluation requires no card and never creates a zero-dollar Stripe subscription.

### Organization onboarding

- Work email authentication with reliable callback/resume behavior.
- Organization name, type, and work domain before first value; legal/billing address later.
- Duplicate organization and verified-domain claim/recovery path.
- Owner cannot remove the last owner.
- Each invitation shows organization, role, expiration, permissions, resend state, and recovery.
- Returning users resume the exact incomplete step.

### Evaluation workspace

- Persistent allowance and days remaining.
- One contextual next action.
- Three visible milestones: send, complete, review receipt.
- Sample data and safe Demo reset consume no paid allowance.
- Evaluation notifications at activation, three days, one day, limit pressure, completion, and expiration.
- Expiration stops new activations but never destroys active work or receipts.

### Upgrade and pilot

- A value summary appears after the first matching receipt: elapsed time, handoffs, corrections, completion, and receipt agreement.
- Pilot request is prefilled from the organization and captures champion, buyer, sponsor, workflow, volume, success criteria, security owner, and decision date.
- Exactly one New Business opportunity and one onboarding ticket are created idempotently.
- The $5K pilot offer, credit-to-year-one treatment, term, allowance, support, cancellation/refund handling, and success criteria match across Passage, Stripe, HubSpot, and the order form.

### Billing and subscription administration

- Owner/admin only: billing contact, plan, status, term, allowance, usage, purchased top-ups, invoices, payment state, renewal date, and next action.
- Stripe-hosted payment/invoice surfaces; Passage never handles raw card or bank credentials.
- Payment failure affects only future activation after the approved grace policy.
- Refunds and credits append adjustments; original orders and deals remain.
- Top-ups remain non-recurring revenue with zero ARR impact until a future committed subscription incorporates the demand.

### CRM lifecycle

- New Business, Expansion, and Renewal deal pipelines.
- Onboarding/implementation and support ticket pipelines.
- Deterministic `pa_` identifiers and source ownership for every synchronized field.
- Buying roles: champion, economic buyer, executive sponsor, technical/security, legal/procurement, billing, and product administrator.
- Renewal created 120 days before term end with immutable prior ARR and prior total-spend baselines.
- ARR bridge excludes one-time top-ups; contract-spend reporting includes them.

### Integration experience

- Hosted workflow is the default; API/hybrid is an explicit later path.
- Versioned OpenAPI contract, environment-specific credentials, least-privilege scopes, idempotency keys, request correlation IDs, webhook signing, retries, replay, rate-limit guidance, and integration health.
- Test fixtures contain synthetic data only.
- No participant identity, evidence, request content, account description, decision, or receipt content enters CRM or billing metadata.

### Operations and reliability

- Tenant-aware health, latency, error, email-delivery, provider-sync, usage, and direct-cost metrics.
- Durable dead-letter and repair queues with owner, severity, last attempt, safe error code, and replay action.
- Daily and on-demand Stripe/Passage/HubSpot reconciliation.
- Backup restoration and provider-outage exercises.
- Status page, incident-severity model, support ownership, and customer communication templates before a production pilot.

## Priority stack

### P0 — required before claiming complete V2

1. Configure isolated Stripe sandbox and HubSpot test application credentials in Demo.
2. Implement invoice creation and paid/failed/refunded event processing as atomic commercial commands.
3. Project Company, Contact, Deal, and Ticket records through the durable HubSpot outbox.
4. Replace public mailto conversion paths with structured, spam-controlled, deduplicated intake.
5. Add evaluation result summary and prefilled pilot conversion.
6. Finish owner/admin billing, contacts, usage, invoice, and integration-health surfaces.
7. Resolve existing security-advisor findings; enable privileged MFA and leaked-password protection.
8. Add reconciliation worker, variance queue, provider replay, and operational alerts.
9. Pass complete four-persona plus commercial journey in Demo, including duplicate, disorder, refund, role denial, expiry, recovery, and mobile cases.

### P1 — required before real enterprise customer data

- Verified organization-domain claim and duplicate-company recovery.
- Audit export, retention/deletion controls, backup/restore evidence, incident process, DPA/subprocessor package.
- ASVS control matrix and independent penetration test.
- API credential lifecycle, webhook management, rate limiting, integration telemetry, and customer-visible health.
- SSO when a qualified pilot requires it; SCIM when account lifecycle volume justifies it.

### P2 — scale after observed pilot behavior

- Customer-initiated top-ups and Stripe customer portal.
- Product-qualified and health automation calibrated from real cohorts.
- Tier recommendations and renewal forecasting.
- Monthly-free PLG experiment after domain verification, abuse controls, support recovery, and unit economics are proven.
- Additional authority use cases only after financial POA activation, completion, support effort, buyer value, and conversion meet their agreed thresholds.

## Explicit non-priorities

- No Plaid for billing.
- No participant payment.
- No card-first $5K pilot checkout.
- No automatic metered overage in the first paid release.
- No HubSpot custom subscription object until concurrent products/workspaces make Company projections lossy.
- No new identity vendor merely to display an enterprise logo.
- No second authority wedge until POA workflow, demo, pilot conversion, and operational support pass.

## Sign-off thresholds

V2 may be called complete only when:

- an independent user reaches the first matching receipt without assistance;
- a pilot request creates one CRM customer/deal/onboarding chain;
- one Stripe sandbox invoice payment grants exactly one correct entitlement;
- duplicate and out-of-order events change nothing;
- refund and payment-failure behavior matches policy without hiding receipts;
- owner, admin, staff, reviewer, auditor, participant, revoked, and cross-tenant denial paths pass;
- Passage, Stripe, and HubSpot reconcile for seven consecutive runs;
- public, authenticated, email, mobile, keyboard, and recovery journeys pass;
- security, support, incident, data-retention, and restore evidence is available for buyer review;
- no customer-facing screen or message exposes raw IDs, enums, implementation terms, unsupported legal conclusions, or vague AI-generated copy.
