# Passage Authority new-chat handoff

**Handoff phrase:** `AUTHORITY PUMPKIN 246159600`  
**Updated:** September 3, 2026  
**Repository:** `C:\Users\Turrisi OS\Documents\Codex\2026-08-31\we-were-in-the-middle-of`  
**Git:** use `git --git-dir=.git-authority --work-tree=.` on branch `authority-launch`  
**Remote:** `https://github.com/thepassageappio/thepassageappio.git`

When the owner opens a new chat and says the handoff phrase, read this file, `AGENTS.md`, and `V2-DELIVERY-ROADMAP.md` before acting. Continue from the next-action checklist below. Do not restart discovery, revisit settled product decisions, or touch the Go Ideally HubSpot account.

## Product and commercial decisions

- Passage Authority operationalizes one bounded financial power-of-attorney authority request among an account holder, representative, and relying institution.
- The product differentiates on simplicity, auditability, and easy hosted-first integration. Identity, authority evidence, and institution acceptance stay separate.
- Customer-facing language uses **authority request**, **account holder**, **representative**, **institution**, **decision**, and **receipt**. It does not expose raw IDs, enums, database language, unsupported legal conclusions, or vague AI-generated language.
- The immediate wedge is financial POA intake and limited account servicing. Do not expand to another use case until this wedge and its experience are proven.
- Free evaluation: no card, ten days from first activation or five activated authority requests.
- Founding pilot: sales-assisted, invoice-led, $5,000 for 60–90 days, with explicit success criteria and a defined annual conversion step.
- Annual pricing direction: recurring platform/subscription base with included activated-request allowance. One-time top-ups are non-recurring Expansion revenue until demand becomes a committed allowance in a later subscription term.
- HubSpot uses New Business, Expansion, and Renewal deal pipelines plus onboarding/support Ticket pipelines. Company is the current account summary; Passage retains contract, entitlement, usage, and historical ledger truth; Stripe retains billing/payment truth.

## Live environments and evidence

- Main site: `https://thepassageapp.io`
- Isolated Demo: `https://passage-authority-demo.vercel.app`
- Vercel projects: `passage-authority-uat` and `passage-authority-demo`.
- Demo uses a separate Supabase project `bklrclpertdtmhycpqlz`; Production uses `ywlrxdjibngroycwnujg`.
- A complete hosted synthetic run has passed activation, account-holder confirmation, representative acceptance, two browser uploads, institution correction, replacement upload, disclosure, institution decision, matching three-party receipts, and revocation. The database independently matched the browser result and usage.
- Core synthetic demo readiness: **9.5/10**. Remaining owner evidence is the timed seven-minute rehearsal across independent profiles/devices and recorded inbox placement.
- Full commercial V2 readiness: **about 5.8/10**. The product story and commercial data contract are strong; provider connection, billing, reconciliation, and enterprise admin remain.

## Shipped commercial foundation

- Structured `/contact` intake persists privately, appends an immutable event, and queues a durable HubSpot outbox job.
- HubSpot delivery worker has job leasing, bounded retries, exponential backoff, idempotent upserts, safe associations, and prohibited participant-data scanning.
- The protected worker route is `/api/internal/hubspot/process`; worker secrets exist in both Vercel projects.
- Commercial migrations are applied to Demo and Production.
- Latest Git commits:
  - `dfeba6f` — fail closed before HubSpot provisioning
  - `9182c21` — record HubSpot worker release
  - `dcf1de5` — fit CRM retry sweep to hosting tier
  - `d19058c` — add resilient HubSpot inquiry delivery
- Current verification after `dfeba6f`: 113 domain tests pass; typecheck, lint, and optimized build pass.
- The worker no longer auto-creates HubSpot properties and no longer guesses a pipeline. Missing fields, pipeline IDs, or stage IDs now stop delivery safely.

## HubSpot boundary and exact current state

- Correct Passage Apps HubSpot portal: **`246159600`**, visibly confirmed as Thepassageapp in Chrome.
- The installed HubSpot connector currently points to the unrelated **Go Ideally** portal. Never read from, create in, update, or delete from Go Ideally for Passage work.
- The owner is logged into portal `246159600` in Chrome profile `Steve & Ashlee` and has installed the browser extension.
- The browser bridge can list the Chrome profile but has repeatedly timed out when listing, claiming, or opening a Chrome tab. No Passage HubSpot settings or records have been changed.
- The next browser task is read-only: claim the open `app-na2.hubspot.com/.../246159600` tab and verify the portal ID again, then inventory existing Company, Contact, Deal, and Ticket properties, pipelines/stages, forms, workflows, and obvious legacy Passage fields.
- Classify existing items as preserve, rename/repurpose, add, or retire. Do not delete. Prefer additive `pa_*` fields when a legacy field is ambiguous or has data.
- Before a HubSpot write, present one exact migration table. Creating a private-app token/persistent access requires a separate action-time confirmation even though general work is approved. Never expose a token in chat or tool output.
- Do not send Demo records to the production CRM. Best practice is a HubSpot developer test account for Demo; if one is unavailable, keep provider replay disabled until the owner chooses a controlled alternative.

## Stripe boundary and exact current state

- No `STRIPE_*` credentials are configured in the current Demo or Production Vercel projects.
- Start with Stripe sandbox only. Build and prove hosted pilot invoice → signature-verified `invoice.paid` → durable provider inbox → one Passage entitlement → one HubSpot result → reconciliation.
- Duplicate, out-of-order, failed, refunded, and replayed events must not duplicate revenue, allowance, entitlements, deals, or tickets.
- No real charge or live Stripe configuration is authorized by this handoff.

## Next actions in order

1. Restore Chrome tab control for Passage HubSpot portal `246159600`. If it still fails, ask the owner only to open that tab, click the Codex browser extension, choose Connect/Share this tab if shown, and leave Chrome foregrounded. This is a connection step, not a repeated product approval.
2. Perform the read-only Passage HubSpot audit. Never use the Go Ideally connector.
3. Produce the exact additive migration: Company segmentation/subscription/usage fields; Contact job, buying, customer, and product roles; Deal revenue classification and renewal math; Ticket inquiry/onboarding/support fields; exact pipelines/stages; association and dedupe keys.
4. Apply the approved migration without deletion, then create least-privilege Passage private-app access and place the secret directly into the correct environment without printing it.
5. Configure exact HubSpot pipeline/stage IDs in Vercel and run a synthetic Demo inquiry replay. Verify one Contact, one Company, and the correct Deal or Ticket with attribution and no participant/request evidence.
6. Create or connect the HubSpot developer test account for Demo before enabling repeatable provider-backed demonstrations.
7. Implement Stripe sandbox invoice-led pilot flow and entitlement reconciliation.
8. Finish V2-3 signup/resume and onboarding friction audit, then V2-7 enterprise admin: organization, users/roles, billing contacts, plan, usage, invoices, integration health, audit export, recovery.
9. Run the complete provider/persona/browser matrix and seven consecutive clean reconciliation runs before describing the commercial loop as fully working.

## Release language

- Safe today: “The public Passage Authority site and isolated synthetic demo are live, and the complete authority journey works end to end.”
- Not yet safe: “Stripe, HubSpot, self-service billing, and enterprise reconciliation are fully connected.”
- Do not claim legal validity, institutional acceptance, production security, regulatory compliance, or readiness for real participant documents until the external gates in the roadmap pass.

## Authoritative documents

- `V2-DELIVERY-ROADMAP.md` — current gate status and dates
- `STRIPE-HUBSPOT-REQUIREMENTS.md` — CRM, revenue, usage, renewal, and reporting requirements
- `COMMERCIAL-DATA-ARCHITECTURE.md` — source systems, schema, events, privacy, and reconciliation
- `DEMO-ENVIRONMENT-ARCHITECTURE.md` — isolated Demo topology and provider boundary
- `DEMO-READY-CHECKLIST.md` and `OWNER-UAT-RUNBOOK.md` — demo and persona acceptance evidence
- `PRODUCT-SOURCE-OF-TRUTH.md` — product boundary, wedge, personas, and roadmap authority

