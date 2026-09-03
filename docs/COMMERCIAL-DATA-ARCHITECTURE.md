# Passage Authority commercial data architecture

**Status:** Implementation-ready architecture baseline

**Date:** September 3, 2026

**Scope:** Passage platform, Stripe billing, HubSpot CRM, analytics, and reconciliation

**Authority:** Implements the approved requirements in `STRIPE-HUBSPOT-REQUIREMENTS.md`. This document does not authorize live charges, production CRM writes, or real customer communications.

## Outcome

Passage must operate one commercial model from evaluation through paid pilot, annual subscription, top-up, renewal, expansion, downgrade, and churn. The design uses four explicit systems of record:

| Domain | System of record | Rule |
| --- | --- | --- |
| Product identity, workspace access, authority usage, allowance enforcement | Passage/Postgres | Neither Stripe nor HubSpot may grant a product role, change an authority record, or invent usage. |
| Customer, invoice, payment, refund, dispute, subscription billing state | Stripe | A browser return, HubSpot edit, or unsigned webhook never proves payment. |
| Prospect, account, contact, deal, onboarding, support, renewal workflow | HubSpot | HubSpot is a projection of commercial and product summary data, not an entitlement source. |
| General ledger and accounting revenue recognition | Accounting system selected later | Bookings, cash, ARR/MRR, and recognized revenue remain separate measures. |

The one-way control path is:

`Passage product events -> Passage commercial ledger -> signed Stripe billing events -> Passage entitlement command -> durable HubSpot outbox -> HubSpot projections`

Reconciliation reads all three operational systems, but corrections always flow through the owning system rather than overwriting another system's source data.

## Current platform inventory and exact gap

### Already present

The current Supabase schema has the following usable foundations:

| Existing source | Usable truth |
| --- | --- |
| `organizations` | Workspace identity, organization type, domain, address, status, onboarding status, version |
| `organization_memberships` | Authenticated user, normalized work email, Passage role, access status, activation/revocation |
| `organization_audit_events` | Append-only organization audit evidence |
| `authority_records` | Canonical request lifecycle and activation timestamp |
| `authority_usage_events` | Exactly-once `authority_activated` event per request |
| `authority_institution_decisions` | Exactly-once final institution decision and immutable receipt per request |
| `organization_entitlements` | One current evaluation/pilot/enterprise summary, transaction limit, activated count, period, version |
| `command_receipts` and participant command receipts | Command idempotency and replay evidence |
| provider webhook event/outbox patterns | A pattern that can be adapted for commercial inbox/outbox processing |

The current definitions support synthetic evaluation. They do not yet support commercial operations.

### Missing or insufficient

1. A Passage organization currently represents both workspace and presumed customer. There is no legal customer, billing account, parent/subsidiary, or workspace-to-contract mapping.
2. `organization_entitlements` permits only `free_evaluation`, `pilot`, and `enterprise`; it has one allowance and no immutable term, price, item, top-up, refund, or predecessor history.
3. `authority_usage_events` records activation only. Completion is derivable from immutable decisions, but no commercial completion event or materialized usage summary exists.
4. No versioned product/price catalog, contract, subscription, subscription item, allowance lot, top-up order, or billing adjustment exists.
5. No Stripe customer/invoice/payment/refund/subscription link is stored as a unique external reference.
6. No HubSpot Company/Contact/Deal/Ticket link or durable CRM outbox exists.
7. No daily usage, customer-health, direct-cost, or contract-term snapshot exists, so burn rate, seasonality, cohort, and prior-term reporting cannot be reproduced safely.
8. No commercial event ledger, dead-letter queue, sync checkpoint, or cross-system reconciliation run exists.
9. Organization type values do not yet include community bank or fintech/platform partner, and product organization type must not be overloaded as the richer ICP taxonomy.
10. Membership stores product permission but not job function, buying role, customer-success role, billing role, consent, or contact relationship status.

## Passage canonical commercial model

All new commercial tables belong in a non-browser-writable schema. Public projections may be exposed through security-invoker views or server commands only after RLS and authorization review. IDs are UUIDs unless an external provider owns the identifier. Money uses integer minor units plus ISO currency; percentages use decimal ratios; dates use UTC timestamps and explicit service-period dates.

### Identity and hierarchy

| Object | Required fields | Invariants |
| --- | --- | --- |
| `commercial_accounts` | `id`, legal name, display name, verified domains, account type, parent account, billing-account owner, status, reporting currency, created/updated/version | Represents the customer relationship; never contains participant data. Parent does not imply shared product access. |
| `commercial_account_workspaces` | account, organization, relationship type, effective start/end | Many workspaces may belong to one account; one workspace has one active owning account at a time. Transfer history is immutable. |
| `commercial_contacts` | account, optional membership/user, normalized work email, name, job function, relationship status, consent/suppression, timestamps | Links a commercial person to a product member when verified; a CRM contact never creates membership. |
| `commercial_contact_roles` | contact, role dimension, role value, scope account/deal/subscription, effective start/end | Supports multiple buying and customer roles without replacing product permissions. |
| `provider_object_links` | provider, local object type/id, external object type/id, link status, first/last observed, metadata hash | Unique on provider + external type + external id and on active local/provider object pair. No raw secrets. |

`commercial_account_workspaces` is required even while the initial relationship is one account to one workspace. It prevents a future holding-company structure from collapsing data isolation or revenue ownership.

### Catalog, contract, subscription, and allowance

| Object | Required fields | Invariants |
| --- | --- | --- |
| `commercial_products` | stable code, name, product/workflow, status, effective/retired dates | Versioned names; historical products are retired, never renamed in place. |
| `commercial_prices` | product, stable price code, charge type, currency, amount, cadence, included units, unit name, Stripe product/price refs, effective/retired dates | Charge type is recurring, one-time top-up, or services. Activated authority request is the only MVP usage unit. |
| `commercial_contracts` | account, contract number, status, signed/start/end dates, currency, payment terms, PO requirements, source deal, predecessor/successor, owner, version | One immutable term record per commercial term. Amendments create versioned contract changes. |
| `commercial_subscriptions` | account, contract, workspace scope, plan bucket, status, start/end, cancel/end reason, renewal mode, Stripe subscription ref, predecessor/successor, version | One active subscription per product/workspace scope unless an approved multi-subscription case exists. |
| `commercial_subscription_items` | subscription, price version, quantity, recurring/non-recurring classification, list/net amount, discount, service period, base allowance | Preserves catalog and contracted economics as booked. |
| `commercial_allowance_lots` | subscription, source item/order, unit, granted, consumed, effective/expires, priority, status | Base and each top-up are separate lots. Consumption is derived from usage allocations, not a mutable counter alone. |
| `commercial_usage_allocations` | usage event, allowance lot, quantity, allocated at | Total allocations for one activation equal one; unique usage event prevents double consumption. |
| `commercial_orders` | account, subscription, order type, status, quantity, gross/net/tax/total, currency, initiated/paid/canceled, purchaser, Stripe refs, idempotency key | A top-up order is pending until verified payment; payment creates allowance exactly once. |
| `commercial_financial_adjustments` | account, contract, subscription/order, type, amount, currency, Stripe refund/credit/dispute ref, occurred/effective date, reason | Refunds and credits append adjustments; original order and deal are never deleted. |

`organization_entitlements` becomes a read-optimized current projection. It must be expanded or replaced by a projection that points to the active subscription and reports status, total allowance, consumed units, remaining units, activation policy, grace state, and version. It must not be the historical contract ledger.

### Usage, snapshots, costs, and health

| Object | Required fields | Derivation |
| --- | --- | --- |
| `commercial_usage_events` | event id, account, organization, subscription/term, authority record, usage type, quantity, source event, occurred at, correction link | `activated` mirrors the canonical `authority_usage_events` event; `completed` mirrors first immutable institution decision. Append-only and unique on authority record + usage type. |
| `organization_usage_daily` | date, account, organization, subscription/term, segment dimensions, activated/completed daily and cumulative counts, allowance, remaining, utilization, 30/90-day rates, forecast, freshness | Rebuilt from canonical events and contract history. One row per workspace/subscription/date/dimension version. |
| `commercial_cost_events` | provider, cost type, account, organization, optional authority request, quantity, amount/currency, provider reference, occurred at | Contains no participant content. Supports cost per activation/completion and gross margin. |
| `customer_health_snapshots` | date, account, subscription, each component value, weights/version, result, reasons, calculated at | Transparent components: onboarding, adoption, completion, activity, utilization, support, payment, stakeholder, renewal. No unexplained color-only score. |

Commercial completion occurs when the first row is committed to `authority_institution_decisions`, regardless of accepted, accepted with limits, or rejected outcome. Revocation or expiration after that does not remove the historical completion.

### Integration reliability

| Object | Purpose | Required controls |
| --- | --- | --- |
| `commercial_event_ledger` | Normalized immutable business events | Event id, schema version, aggregate/id, type, occurred/recorded time, non-sensitive payload, causation/correlation/idempotency keys. |
| `provider_event_inbox` | Raw Stripe/other provider delivery evidence | Provider event id unique, signature status, body hash, received time, processing attempts/status/error; encrypted/restricted payload retention. |
| `integration_outbox` | Passage-to-HubSpot/Stripe commands | Destination, operation, local subject, idempotency key, payload version/hash, attempts, next attempt, result/external id. |
| `integration_sync_state` | Current provider projection status | Local/provider object, last source event, local/provider versions, last attempt/success, status, error code. |
| `reconciliation_runs` and `reconciliation_items` | Daily comparison and correction queue | Scope/date, expected/actual values, variance type/severity, owner, resolution, evidence. |

Webhook handlers only authenticate and persist inbox events before acknowledging. A worker applies idempotent commands. HubSpot failure never rolls back payment or blocks product use. Out-of-order Stripe events are evaluated against provider event creation time and current Stripe object state before applying a transition.

## HubSpot object and association model

Use standard Company, Contact, Deal, and Ticket objects first. Passage holds subscriptions, contract terms, usage history, and daily snapshots; HubSpot receives the current Company summary and deal/ticket workflow records. This avoids making day-one implementation depend on a HubSpot custom-object license. Reconsider a Subscription custom object only when one Company has multiple simultaneous subscriptions that sellers must manage independently in HubSpot.

### Associations

| From | To | Required relationship |
| --- | --- | --- |
| Company | Contact | Primary association plus labels such as economic buyer, champion, billing contact, executive sponsor, administrator, security reviewer |
| Company | Deal | Owning customer for every New Business, Expansion, and Renewal deal |
| Company | Ticket | Owning customer for onboarding, support, billing, security, and product-request tickets |
| Deal | Contact | Contacts participating in that revenue event, with deal-scoped role labels where available |
| Deal | Deal | Predecessor/renewed-from/expanded-from relationship where supported; retain predecessor IDs as properties regardless |

Provider association type IDs must be discovered from the target portal during provisioning, never hard-coded from documentation. HubSpot supports custom association labels, and unique custom identifier properties can be used for deterministic upserts; those capabilities should be provisioned and then captured in configuration.

## HubSpot property map

All Passage-managed property names use the `pa_` prefix. `Passage` is the data owner unless noted. Synchronized fields are read-only by operating policy even if HubSpot cannot technically prevent every manual edit. Manual corrections occur in the source system or through an audited exception command.

### Company properties

| Internal name | Type | Source | Definition/update trigger |
| --- | --- | --- | --- |
| `pa_commercial_account_id` | unique text | Passage | Stable commercial account upsert key; created once. |
| `pa_primary_organization_id` | unique text where one-to-one | Passage | Initial primary workspace; use association/history when multi-workspace. |
| `pa_parent_account_id` | text | Passage | Parent commercial account, not a product-access relationship. |
| `pa_institution_category` | enumeration | HubSpot owner-approved | Regional bank, community bank, credit union, elder-law firm, authorized service organization, fintech/platform partner, other. |
| `pa_icp_fit` | enumeration | HubSpot | A, B, C, non-ICP, unassessed. |
| `pa_icp_reason` | enumeration + notes | HubSpot | Standard fit/disqualification rationale. |
| `pa_size_segment` | enumeration | HubSpot | Approved size band; underlying measure remains in a separate field. |
| `pa_operating_regions` | multi-enumeration | HubSpot | Relevant supported-policy geography. |
| `pa_current_process` | enumeration | HubSpot | Manual/email, branch, ticketing, document platform, existing vendor, other. |
| `pa_estimated_annual_authority_volume` | number | HubSpot | Discovery estimate; never replaced by measured usage. |
| `pa_integration_method` | enumeration | Passage | Hosted, API, hybrid, unselected. |
| `pa_acquisition_source_normalized` | enumeration | HubSpot | Original approved acquisition source. |
| `pa_partner_source_id` | text | HubSpot | Partner/referral identifier when applicable. |
| `pa_customer_lifecycle` | enumeration | Passage/HubSpot workflow | Prospect, evaluating, pilot, customer, at-risk, renewing, churned, former. |
| `pa_subscription_bucket` | enumeration | Passage | Evaluation, founding pilot, Core, Scale, Enterprise, expired, suspended, churned. |
| `pa_subscription_status` | enumeration | Passage | Pending, trialing, active, grace, past due, canceled, expired. |
| `pa_contract_start` / `pa_contract_end` | date | Passage | Active commercial service term. |
| `pa_base_contract_value` | currency | Passage | Recurring base value for active term. |
| `pa_contract_arr` / `pa_contract_mrr` | currency | Passage | Normalized current recurring value; excludes top-ups. |
| `pa_topup_revenue_term` | currency | Passage | Paid non-recurring top-ups for active term, net of attributed top-up refunds. |
| `pa_other_expansion_revenue_term` | currency | Passage | Paid other expansion attributed to term. |
| `pa_refunds_credits_term` | currency | Passage | Reductions attributed to term. |
| `pa_contract_total_spend` | currency | Passage | Base + top-ups + other expansion - refunds/credits. |
| `pa_purchased_allowance_term` | number | Passage | Base plus paid top-up units. |
| `pa_activated_term` / `pa_completed_term` | number | Passage | Canonical current-term counts. |
| `pa_activated_t12m` / `pa_completed_t12m` | number | Passage | Trailing-12-month counts. |
| `pa_activated_lifetime` / `pa_completed_lifetime` | number | Passage | Lifetime counts. |
| `pa_remaining_allowance` | number | Passage | Max(purchased allowance - activated term, 0); blank for unlimited. |
| `pa_allowance_utilization` | percentage | Passage | Activated term / purchased allowance; blank when undefined. |
| `pa_completion_rate_term` | percentage | Passage | Completed cohort / activated cohort for defined period. |
| `pa_burn_rate_30d` / `pa_burn_rate_90d` | number | Passage | Activations divided by observed days; blank without sufficient history. |
| `pa_forecast_term_end_usage` | number | Passage | Approved forecast output and method version. |
| `pa_forecast_exhaustion_date` | date | Passage | Blank if no exhaustion is projected. |
| `pa_last_activation_at` / `pa_last_completion_at` | datetime | Passage | Latest canonical milestone. |
| `pa_topup_count_term` / `pa_latest_topup_at` | number/datetime | Passage | Paid top-up behavior. |
| `pa_health_score` / `pa_health_band` | number/enumeration | Passage | Latest transparent health calculation; components remain in Passage. |
| `pa_product_summary_calculated_at` | datetime | Passage | Source calculation freshness. |
| `pa_last_synced_at` / `pa_sync_status` | datetime/enumeration | Passage | HubSpot projection freshness and health. |
| `pa_stripe_customer_id` | text | Stripe via Passage | Restricted external reference; never a secret. |

### Contact properties

| Internal name | Type | Source | Definition |
| --- | --- | --- | --- |
| `pa_commercial_contact_id` | unique text | Passage | Stable contact upsert key. |
| `pa_membership_id` | text | Passage | Present only after verified linkage to an institution user. |
| `pa_job_function` | enumeration | HubSpot | Operations, compliance, legal, servicing, IT/security, finance, procurement, executive, other. |
| `pa_buying_roles` | multi-enumeration | HubSpot | Champion, economic buyer, decision maker, influencer, evaluator, security, procurement, billing. |
| `pa_customer_roles` | multi-enumeration | HubSpot | Executive sponsor, day-to-day owner, administrator, success, support. |
| `pa_product_role` | enumeration | Passage | Owner, administrator, operations staff, reviewer, developer, auditor, none. |
| `pa_product_access_status` | enumeration | Passage | Invited, active, revoked, none. |
| `pa_relationship_status` | enumeration | HubSpot | Active, former, unresponsive, do-not-contact. |
| `pa_consent_status` / `pa_consent_source` | enumeration/text | Consent source | Commercial communication permission and provenance. |
| `pa_suppressed_at` / `pa_suppression_reason` | datetime/enumeration | Consent source | Must block marketing automation without revoking product access. |
| `pa_last_product_active_at` | datetime | Passage | Institution-user activity only; not participant activity. |
| `pa_last_synced_at` / `pa_sync_status` | datetime/enumeration | Passage | Projection freshness. |

### Shared Deal properties

| Internal name | Type | Source/rule |
| --- | --- | --- |
| `pa_commercial_event_id` | unique text | Passage idempotent deal upsert key. |
| `pa_commercial_account_id` / `pa_organization_id` | text | Passage account/workspace references. |
| `pa_revenue_motion` | enumeration | New business, expansion, renewal. |
| `pa_revenue_type` | enumeration | Recurring subscription, recurring expansion, non-recurring top-up, non-recurring services. |
| `pa_booked_amount` / `amount` | currency | Booked deal value in deal currency. |
| `pa_currency` | enumeration | ISO contract currency. |
| `pa_arr_impact` / `pa_mrr_impact` | currency | Recurring impact only; zero for top-ups/services. |
| `pa_nonrecurring_revenue` | currency | Non-recurring booked amount. |
| `pa_service_start` / `pa_service_end` | date | Applicable service/contract period. |
| `pa_product_code` / `pa_price_code` | text | Versioned Passage catalog references. |
| `pa_subscription_id` / `pa_contract_id` | text | Passage references. |
| `pa_stripe_customer_id` / `pa_stripe_invoice_id` / `pa_stripe_payment_id` | text | Provider references, not secrets. |
| `pa_payment_status` | enumeration | Pending, paid, failed, refunded, partially refunded, disputed, canceled. |
| `pa_predecessor_deal_id` | text | Previous revenue event. |
| `pa_source` | enumeration | Inbound, outbound, partner, evaluation, sales-assisted, self-service top-up, renewal automation. |
| `pa_list_amount` / `pa_discount_amount` / `pa_discount_reason` | currency/currency/enumeration | Pricing governance. |
| `pa_close_classification` | enumeration | Motion-specific reporting classification. |

Expansion adds `pa_expansion_type`, `pa_topup_units`, `pa_prior_tier`, `pa_resulting_allowance`, `pa_self_service`, `pa_refund_amount`, and `pa_net_expansion_revenue`. Renewal adds `pa_renewal_baseline_amount`, prior base/top-up/other/refund/total-spend fields, prior usage/allowance/utilization, proposed tier/allowance, prior and renewed ARR/MRR, net renewal ARR/MRR, top-up demand converted to recurring, risk, and churn/contraction reason.

### Ticket properties

| Internal name | Type | Use |
| --- | --- | --- |
| `pa_ticket_external_id` | unique text | Form/event idempotency key. |
| `pa_commercial_account_id` / `pa_organization_id` | text | Correct customer/workspace association. |
| `pa_ticket_motion` | enumeration | Onboarding, support, billing, security, product request, general inquiry. |
| `pa_onboarding_milestone` | enumeration | Current implementation milestone for onboarding tickets. |
| `pa_severity` / `pa_response_due_at` | enumeration/datetime | Support service target. |
| `pa_product_area` / `pa_root_cause` | enumeration | Product feedback and resolution reporting. |
| `pa_source_form` / `pa_consent_context` | text | Inbound provenance. |
| `pa_resolution` / `pa_resolved_at` | text/datetime | Outcome. Never store participant evidence or receipt contents. |

## Deal and ticket pipelines

### New Business

| Stage | Exit evidence |
| --- | --- |
| Discovery | Meeting held; problem, role, source, and next step recorded. |
| Qualified | ICP, authority volume, current process, buyer/champion, need, timing, and disqualification check complete. |
| Evaluation | Verified organization is evaluating and success event is defined. |
| Pilot scoped | Workflow, service period, allowance, success criteria, stakeholders, and data boundary agreed. |
| Proposal | Approved SKU, price, terms, and proposal delivered. |
| Security and legal | Required review items are owned and material blockers documented. |
| Procurement | Commercial approval, billing contact, PO/payment terms, and target start are confirmed. |
| Closed Won | Agreement complete and verified payment/approved invoice state satisfies the launch policy. |
| Closed Lost | Standardized loss reason and competitor/no-decision details recorded. |

### Expansion

| Stage | Exit evidence |
| --- | --- |
| Identified | Product usage, stakeholder request, or account plan establishes an expansion signal. |
| Qualified | Product/tier/units, need, buyer, timing, and ARR/non-recurring classification confirmed. |
| Order ready | Approved price, quantity, service period, and account/subscription scope fixed. |
| Payment pending | Stripe invoice/Checkout exists; no access has been granted. |
| Closed Won | Signature-verified Stripe paid event; booked values and allowance command reconcile. |
| Closed Lost | Expired/canceled/declined with reason. |

Self-service top-ups are created directly in Closed Won only after verified payment; each payment creates a separate deal. Pre-payment activity remains a Passage order, not a false open deal.

### Renewals

| Stage | Exit evidence |
| --- | --- |
| Renewal review (created 120 days before end) | Baseline, usage, spend, stakeholders, health, risk, and recommended tier calculated. |
| Customer alignment | Success review held and next-term needs confirmed. |
| Proposal | Right-sized recurring proposal delivered; top-up conversion explicitly shown. |
| Security/legal/procurement | Required approvals and commercial process owned. |
| Verbal/contracting | Commercial intent recorded and agreement in progress. |
| Closed Won | New term is committed; renewal classification and recurring bridge values locked. |
| Closed Lost / Churn | Renewed ARR is zero; churn reason, effective date, access policy, and save attempt recorded. |

Closed Won renewal classification is exactly one of expansion, flat, or downgrade; Closed Lost termination is churn. A zero-dollar approved noncommercial extension is an exception, not a flat renewal.

### Ticket pipelines

- **Customer onboarding:** not started, agreement/billing, organization verified, owner activated, team configured, policy/sample complete, integration/security, production-readiness review, complete, blocked/canceled.
- **Support and inquiries:** new, triaged, waiting on Passage, waiting on customer, resolved, closed. Type, severity, due time, owner, resolution, and root cause are mandatory where applicable.

## Event trigger and projection matrix

| Source event | Canonical action | Stripe action | HubSpot action |
| --- | --- | --- | --- |
| Public demo/contact submission | Store consent/source and deduplicate lead | None | Upsert Contact/Company; create task or Ticket; do not create a deal until qualification rule. |
| `organization.created` | Create/link commercial account and workspace | None | Upsert Company and owner Contact after approved sync boundary. |
| Membership invited/activated/role changed/revoked | Update verified contact-product linkage | None | Update product role/access summary; CRM cannot reverse-write the role. |
| Onboarding milestone completed | Append commercial event | None | Update onboarding Ticket and lifecycle. |
| `authority.activated` | Append activated commercial usage event; allocate one unit; update entitlement/snapshot | Optionally report a meter event only if future contract uses arrears overage | Update Company usage summary; create threshold actions only when rules fire. |
| First institution decision | Append completed commercial usage event | None | Update completion/adoption summary and product-qualified milestone. |
| 70/90/100% or forecast exhaustion | Append signal with rule version | None | Create owned success/Expansion action, deduplicated per threshold/term. |
| Pilot/annual order approved | Create contract/subscription/order pending | Create customer/invoice or subscription with local IDs in metadata | Update New Business/Expansion deal to payment pending. |
| Stripe `invoice.paid` | Persist inbox; apply payment; activate/extend subscription or top-up allowance exactly once | Source event | Close correct deal Won; recalculate Company spend/usage. |
| Payment failed/past due | Apply approved grace policy to new activations only | Source event/retries | Update status and create billing Ticket/task. |
| Refund/credit/dispute | Append adjustment; recompute net spend/allowance per policy; never delete history | Source event | Update deal/payment state and Company rollups; create Ticket when action required. |
| Contract end minus 120 days | Snapshot prior term and seed immutable renewal baseline | None | Create one Renewal deal keyed by account + subscription + end date. |
| Renewal Closed Won | Create successor contract/subscription after authoritative commercial command | Create/update next billing term | Lock classification and recurring bridge; update Company current term. |
| Renewal churn | End future activation according to policy; preserve records/receipts | Cancel at approved effective date | Close renewal as churn; update lifecycle and reasons. |

## Derived calculations

All calculations are performed in Passage from immutable source rows, stamped with formula version and `calculated_at`, then projected to HubSpot.

| Measure | Formula |
| --- | --- |
| Activated request | One canonical activation event per authority record. |
| Completed request | One first institution-decision row per activated authority record. |
| Purchased allowance | Sum of effective, paid base and top-up allowance lots less policy-approved unit reversals. |
| Remaining allowance | Purchased allowance - activated requests allocated in the term; floor at zero for display. |
| Utilization | Activated term / purchased allowance; blank for unlimited or zero allowance. |
| Completion rate | Completed members of the selected activation cohort / activated cohort; label cohort/window explicitly. |
| 30/90-day burn | Activations in observed window / observed calendar days; require minimum 14/30 observed days respectively. |
| Forecast term-end usage | Activated to date + approved weighted recent daily rate x remaining term days; store formula version. Initial method uses max(30-day rate, 90-day rate) only after minimum history. |
| Exhaustion date | Calculation date + remaining allowance / approved burn rate; blank when rate is zero/undefined or allowance is unlimited. |
| Contract total spend | Paid recurring base + paid top-ups + paid other expansion - refunds/credits attributed to the term. |
| ARR | Recurring subscription consideration normalized to 12 months; excludes top-ups and services. |
| MRR | ARR / 12. |
| Renewal net ARR/MRR | Renewed ARR/MRR - immediately preceding subscription ARR/MRR. |
| Renewal classification | Expansion if delta positive; flat if zero to currency precision; downgrade if renewed ARR is positive and delta negative; churn if renewed ARR is zero. |
| ARR bridge | Beginning ARR + new ARR + mid-term recurring expansion + renewal expansion - contraction - churn = ending ARR. |
| GRR | (Beginning ARR - contraction - churn) / beginning ARR. |
| NRR | (Beginning ARR + recurring expansion - contraction - churn) / beginning ARR; exclude non-recurring top-ups. |
| Direct gross margin | (Recognized commercial revenue for analysis period - attributable direct cost) / revenue; accounting policy must approve recognized-revenue source. |

Company current-contract total spend seeds the Renewal deal `Amount` and immutable baseline. The proposal remains editable. Prior top-ups remain non-recurring forever; only a newly committed recurring allowance increases renewed ARR.

## Idempotency, sequencing, and reconciliation

1. **Inbound Stripe:** unique `stripe_event_id`; verify signature against raw body; store hash and event; acknowledge only after durable receipt. Processing idempotency is provider + event id. Business idempotency is invoice/payment/refund id plus transition.
2. **Stripe writes:** every create/update request uses a stable Passage command idempotency key and includes non-sensitive local account/order/subscription IDs in Stripe metadata.
3. **HubSpot upserts:** Company uses `pa_commercial_account_id`; Contact uses `pa_commercial_contact_id`; Deal uses `pa_commercial_event_id`; Ticket uses `pa_ticket_external_id`. All are unique custom properties.
4. **Outbox ordering:** serialize commands by local aggregate; later summary updates cannot pass an earlier create/link command. Payload version and hash detect unsafe replay.
5. **Optimistic concurrency:** subscription, entitlement, contract, and order commands require expected version. Each successful mutation and event commits together.
6. **Daily reconciliation:** compare Stripe customer/invoice/payment/refund/subscription totals, Passage orders/contracts/allowances/usage, HubSpot deals/Company rollups/renewals, and accounting export status.
7. **Repair:** recreate projections from Passage and Stripe; never rewrite canonical authority or usage events. Corrections append adjustment/correction events with operator, reason, before/after, and correlation id.
8. **Alerts:** page/queue on signature failure, unmatched customer/account, duplicate external link, missing Closed Won deal, allowance/payment mismatch, stale Company summary, missing renewal, or nonzero financial variance.

Freshness targets: payment/entitlement under five minutes; HubSpot revenue deal under ten minutes; usage Company summary under fifteen minutes; daily snapshot/reconciliation by 06:00 account reporting timezone. Targets are service objectives until monitoring proves them.

## Privacy and access boundary

### Allowed in Stripe

Commercial account/legal billing name, billing contacts, billing address, approved tax/PO details, product/price, quantity, service period, invoice/payment/refund state, and opaque Passage commercial account/order/subscription references.

### Allowed in HubSpot

Institution/contact commercial data, consent/source, product-member role summary, plan/contract/billing summary, aggregate activated/completed counts, allowance/burn/health summaries, deals, onboarding milestones, and support metadata.

### Prohibited in both

Principal or representative identities and contact data; account boundary/description; authority documents or evidence; identity-proof artifacts; allowed/prohibited actions; information-request text; decision outcome/reason/limitations; receipt content/code/hash; participant session/invitation tokens; raw authority record IDs; and free text copied from authority workflows.

Passage service roles, Stripe secrets, webhook signing secrets, and HubSpot tokens stay server-only. Integration workers receive least-privilege scopes. Sensitive provider payloads are encrypted/restricted and retained only for an approved operational period. CRM field-level permissions must separate billing, legal/security, and general sales access.

## Backfill and rollout

1. Freeze property names, enums, currency/timezone policy, catalog SKUs, and unresolved decisions below.
2. Add Passage commercial tables and RLS/service command boundaries in a reviewed migration; seed a versioned evaluation catalog.
3. Backfill one commercial account/workspace link per existing organization and convert each current entitlement into a historical evaluation subscription/allowance lot. Mark provenance `legacy_evaluation_backfill`.
4. Backfill activated usage from `authority_usage_events` and completed usage from first `authority_institution_decisions`; compare unique authority-record counts before committing.
5. Generate daily snapshots from earliest activation through current date in a dry-run schema; verify term/lifetime totals.
6. Provision HubSpot property groups, unique keys, enum options, association labels, three deal pipelines, and two ticket pipelines in a sandbox/test portal. Capture returned pipeline/stage/property/association IDs as environment configuration.
7. Backfill Companies then Contacts, associations, historical revenue deals, and open tickets. Use deterministic keys; run once in dry-run and once in write mode.
8. Provision Stripe sandbox catalog/customer mappings. Test invoice, subscription, top-up, refund, failure, dispute, duplicate, and out-of-order events.
9. Enable shadow sync: calculate expected HubSpot/Stripe changes without writing, compare for seven days, then enable Company/contact sync, deal sync, and ticket sync separately.
10. Run full reconciliation and obtain commercial, finance, security, and product sign-off before any live payment or CRM automation.

Backfill never sends participant messages, changes authority records, consumes allowance twice, or grants access. Every batch has manifest, code version, start/end cursor, counts, errors, and rollback-by-projection procedure.

## Phased implementation plan

### Phase 0 — decisions and sandbox provisioning

Approve currency, invoice terms, tax/PO policy, allowance expiry/rollover, refund-to-allowance behavior, grace period, forecast method, product catalog, HubSpot subscription level/capabilities, owners, and service objectives. Exit: signed field dictionary and sandbox IDs.

### Phase 1 — Passage commercial foundation

Implement commercial accounts/workspace links, versioned catalog, contracts/subscriptions/items/lots/orders/adjustments, commercial events, usage completion event, projections, RLS, command service, and negative/replay tests. Exit: local and UAT evidence chain passes without Stripe or HubSpot.

### Phase 2 — HubSpot prospect and customer projection

Implement unique-property upserts, associations, New Business pipeline, onboarding/support tickets, membership role sync, and Company usage summary via durable outbox. Exit: sandbox backfill and retries reconcile with no prohibited data.

### Phase 3 — Stripe paid pilot

Implement sandbox customer/invoice/payment/refund lifecycle, signed inbox, approved payment-to-entitlement command, New Business Closed Won, billing ticket, and daily reconciliation. Exit: first-paid-pilot acceptance matrix passes in test mode.

### Phase 4 — self-service top-ups

Implement top-up orders, Stripe-hosted payment, allowance lots, one Closed Won Expansion deal per payment, thresholds, refunds, customer purchase history, and reconciliation. Exit: top-up matrix passes including wrong-org and concurrency attacks.

### Phase 5 — renewals and recurring reporting

Implement immutable term close snapshots, 120-day renewal seeding, renewal workflow, successor subscriptions, classifications, ARR/MRR bridge, GRR/NRR, churn/downgrade, and top-up conversion reporting. Exit: all four renewal scenarios reconcile.

### Phase 6 — scale intelligence

Add health, unit cost, gross margin, provider capacity, seasonality/cohort models, multi-workspace pooling rules, API-led product segmentation, and accounting export. Exit: segment dashboards reproduce from Passage snapshots.

## Acceptance-test matrix

| Scenario | Required evidence |
| --- | --- |
| Create organization/account | Browser/server command creates account-workspace link, event, Company/Contact projection once. |
| Product role change | Passage membership changes with authorization/version/event; HubSpot follows; reverse CRM edit cannot change access. |
| First activation | One canonical usage event, one allocation, one allowance decrement, one snapshot update; duplicate command changes nothing. |
| Completion | First immutable decision produces one completion event; later lifecycle changes do not remove it. |
| Paid pilot | Signed `invoice.paid` creates paid state, entitlement, Closed Won New Business deal, onboarding task, and matching totals once. |
| Two top-ups | Two orders, payments, allowance lots, and Closed Won Expansion deals; Company spend and units equal source totals. |
| Duplicate/out-of-order Stripe events | No duplicate deal, allowance, revenue, or regression of current payment/subscription state. |
| Concurrent last-unit activation | Exactly one activation consumes the last available unit; the other receives an actionable limit response. |
| Refund/credit/dispute | Original order/deal remains; adjustment changes net spend and follows approved allowance policy. |
| Payment failure | Grace/new-activation policy applies; in-progress requests and historical receipts remain available. |
| HubSpot outage | Payment/product command completes; outbox retries and later produces one correct projection. |
| Wrong organization/customer mapping | Command is rejected, quarantined, and alerted; no entitlement or deal is created. |
| Threshold alerts | 70/90/100% and forecast signals create one owned action per rule version/term. |
| Renewal generation | Exactly one deal 120 days before term end; Amount and immutable baseline equal current contract spend. |
| Renewal expansion/flat/downgrade/churn | Net ARR/MRR and classification match preceding subscription; top-ups remain excluded from ARR. |
| Backfill replay | Source counts equal backfilled counts; rerun produces no duplicates or authority mutations. |
| Company merge/domain change/contact departure | Provider links and history reconcile without moving workspace access or losing revenue. |
| Multi-workspace account | Revenue rolls to account; usage remains workspace-segmented; no cross-workspace product access. |
| Privacy scan | Automated fixtures and export inspection find none of the prohibited fields in Stripe/HubSpot payloads. |
| Dashboard reproduction | Company summaries, pipeline totals, spend, ARR bridge, usage, burn, renewal, and health reconcile to source queries for sampled terms. |

## Required dashboards and source datasets

| Dashboard | Source |
| --- | --- |
| Funnel conversion/velocity | HubSpot lifecycle, New Business deals, source/ICP/owner fields |
| Bookings by motion/type | HubSpot Closed Won deals reconciled to Passage and Stripe |
| ARR/MRR bridge, GRR, NRR, churn | Passage subscription-term ledger projected to renewal/deal fields |
| Contract spend | Passage orders/adjustments and Stripe payments; HubSpot Company summary |
| Usage, burn, completion, seasonality | Passage daily usage snapshots only |
| Expansion/top-up behavior | Passage orders/allowance lots + Expansion deals |
| Renewal forecast/conversion | Passage term snapshots + Renewal pipeline |
| Billing and reconciliation | Stripe state + Passage reconciliation items |
| Onboarding/support/health | HubSpot Tickets + Passage health components |
| Unit economics/capacity | Passage cost events + approved accounting revenue feed |

## Decisions still required before implementation

These are product/finance policy decisions, not architecture ambiguities:

1. Initial currency, card/ACH support, invoice terms, tax provider/treatment, and PO policy.
2. Exact Pilot/Core/Scale/Enterprise catalog, included units, top-up pack sizes/prices, and discount authority.
3. Whether unused units expire, roll over, or receive a limited renewal carry-forward.
4. Refund/chargeback effect on already granted but unused top-up units.
5. Payment-failure retry/grace timeline and exact point new activations stop.
6. Whether first pilots use Stripe invoices only or a Stripe subscription object for the term.
7. Customer reporting timezone, base reporting currency, and future FX conversion policy.
8. Required minimum history and approved forecasting formula after real pilot data exists.
9. HubSpot portal subscription/features, owners, teams, permissions, and whether custom subscription objects are available or justified later.
10. CRM and provider-payload retention periods, data deletion/merge procedure, and accounting export destination.
11. Legal customer versus billing-account behavior for parent/subsidiary and allowance pooling.
12. Accounting approval of pilot credit, services separation, deferred revenue, and recognized-revenue treatment.

Until decided, implementations must represent these as explicit configuration or pending policy—not hidden defaults.

## External implementation references

- [HubSpot custom CRM properties and unique identifiers](https://developers.hubspot.com/docs/api-reference/latest/crm/properties/guide)
- [HubSpot associations and labeled relationships](https://developers.hubspot.com/docs/api-reference/latest/crm/associations/overview)
- [Stripe webhook handling](https://docs.stripe.com/webhooks)
- [Stripe usage-based billing concepts](https://docs.stripe.com/billing/subscriptions/usage-based/how-it-works)
- [Stripe idempotent meter events](https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api)

The Stripe meter remains optional. Passage's append-only activation ledger is canonical even if future overage is also reported to Stripe.
