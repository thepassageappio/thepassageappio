# Research source record: Passage Authority pricing and packaging

Date: September 2, 2026. Audience: Passage Authority founder. Scope: current US B2B SaaS patterns relevant to a regulated institution authority-workflow product. Excludes legal advice, tax advice, exact willingness-to-pay claims, and competitor contract pricing that is not publicly disclosed.

## Answer slots and evidence status

| Claim family | Evidence | Confidence | Remaining gap |
| --- | --- | --- | --- |
| Hybrid versus flat or usage-only | Stripe model guidance; Google Cloud combined SaaS definition | High | Passage willingness-to-pay data |
| Comparable packaging | Persona, Veriff, Plaid, Docusign, OneSpan, WorkOS official pricing | High for structure; low for direct price equivalence | Private enterprise contracts |
| Billable unit | Passage canonical activation event; Docusign envelope model; Persona successful-verification rule | Medium-high | Pilot buyer reaction |
| Stripe implementation | Stripe invoice, subscription webhook, signature, and meter documentation | High | Passage test integration evidence |
| CRM lifecycle | HubSpot lifecycle documentation | High | Passage HubSpot subscription capabilities and final field configuration |
| Future price points | No reliable direct evidence | Low | 10 discovery calls and 3 paid pilots |

## Reconciliation

- Pure usage lowers initial commitment but fails to price the standing workspace, access-control, audit, policy, and support value. Pure flat pricing improves predictability but creates poor entry economics and weak expansion. Hybrid preserves both.
- Docusign counts an envelope when sent even if not completed; Persona emphasizes successful verification; Veriff charges actual sessions rather than retries. Passage's current activation point—first participant invitation—sits between these models and is objectively observable. Completion-only billing would better resemble outcome pricing but makes Passage absorb abandonment outside its control and would diverge from the existing atomic usage rule.
- Use graduated rather than volume-wide repricing to avoid a threshold changing the price of all prior units.
- Exact annual figures cannot be responsibly inferred from adjacent vendors because their unit economics, regulatory scope, maturity, and contract inclusions differ.

## Claim-to-source ledger

| Source | Publisher | Publication/update | URL | Claim supported | Access note |
| --- | --- | --- | --- | --- | --- |
| A Guide to SaaS Pricing and Packaging | Stripe | 2026 crawl; page current at access | https://stripe.com/resources/more/saas-pricing-and-packaging-strategy | Value metric properties and hybrid model fit/tradeoff | Public page |
| Design a subscriptions integration | Stripe | Current documentation | https://docs.stripe.com/billing/subscriptions/design-an-integration | Flat, tiered, usage, fixed-fee-and-overage models | Public docs |
| Pricing models | Stripe | Current documentation | https://docs.stripe.com/products-prices/pricing-models | Graduated versus volume-based tiers | Public docs |
| Pricing Structure and Plan Breakdowns | Persona | Current at access | https://withpersona.com/pricing | Platform minimum, higher-tier controls, successful verification charging | Public pricing page |
| Self-Serve Plans | Veriff | Current at access | https://www.veriff.com/plans/self-serve | Monthly minimum plus per-verification and enterprise custom plan | Public pricing page |
| Pricing | Plaid | Current at access | https://plaid.com/pricing/ | Trial/PAYG/growth/custom ladder and volume discounts | Public pricing page |
| Pricing and billing | Plaid | Current documentation | https://plaid.com/docs/account/billing/ | Annual minimum commitments, support, and plan maturity | Public docs |
| Docusign Pricing | Docusign | Current at access | https://ecom.docusign.com/plans-and-pricing/esignature | Envelope allowance and overage | Public pricing page |
| OneSpan eSignature pricing | OneSpan | Current at access | https://www.onespan.com/products/esignature/plans-pricing | Enterprise transaction/volume packaging and accountless recipients | Public pricing page |
| Pricing | WorkOS | Current at access | https://workos.com/pricing | Free staging, PAYG, annual credits, enterprise support | Public pricing page |
| Hosted Invoice Page | Stripe | Current documentation | https://docs.stripe.com/invoicing/hosted-invoice-page | Hosted B2B invoice, payment methods, invoice/receipt download | Public docs |
| Using webhooks with subscriptions | Stripe | Current documentation | https://docs.stripe.com/billing/subscriptions/webhooks | Provisioning after verified paid/active lifecycle events | Public docs |
| Resolve webhook signature verification errors | Stripe | Current documentation | https://docs.stripe.com/webhooks/signature | Raw body and signature verification | Public docs |
| Record usage for billing with the API | Stripe | Current documentation | https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api | Meter-event asynchrony and idempotency | Public docs |
| Use lifecycle stages | HubSpot | January 6, 2026 | https://knowledge.hubspot.com/records/use-lifecycle-stages | Contact/company lifecycle-stage purpose and progression | Public knowledge base |

Search stopped after primary-source coverage answered every consequential architecture and model question. Additional vendor examples were unlikely to change the hybrid recommendation; the material remaining uncertainty is Passage-specific willingness to pay and operating cost, which requires interviews and paid-pilot evidence rather than more desk research.
