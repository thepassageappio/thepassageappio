# SOC 2 readiness decision package

Prepared September 5, 2026. **Proposed internal plan, not an audit engagement, report, certification, funded program, or production approval.**

## Decision requested

Approve a bounded readiness phase, nominate accountable people, and obtain comparable written auditor quotes before committing to an examination. Keep demonstrations synthetic. Reassess real-data pilot admission only against the buyer-specific P2 gates in `V2-DELIVERY-ROADMAP.md`.

## Pre-sales timeline sanity check — September 7

Do not postpone the SOC 2 answer until the end of P2. NCUA third-party guidance calls for planning, due diligence, and controls proportionate to the credit union's risk profile and the vendor relationship; it does not state that every small pilot must already have a SOC 2 report. The commercial reality reflected in the Passage GTM research is that credit-union buyers may still require a report, a questionnaire, compensating evidence, or at minimum a credible stated path before proceeding.

Buyer-ready wording: “Passage does not currently have a SOC 2 report or an audit underway. We have scoped the readiness work and keep evaluation synthetic. Before accepting real customer data, we will agree your assurance requirements, assign and fund the program, close the required controls, obtain auditor quotes, and select the appropriate Type I/Type II path with the CPA.”

Prepare the supporting one-page assurance roadmap before the first sales conversation: current state; synthetic-only boundary; named decisions still open; control-remediation sequence; conditional Type I decision; earliest defensible Type II observation-period start; and evidence available for a buyer's vendor review. Do not promise a report date until a CPA, program owner, scope, and observation period are agreed.

The concise sales artifact is [SOC2-BUYER-ANSWER-2026-09-07.md](./SOC2-BUYER-ANSWER-2026-09-07.md). Source: [NCUA, Evaluating Third Party Relationships](https://ncua.gov/regulation-supervision/letters-credit-unions-other-guidance/evaluating-third-party-relationships).

Recommended initial scope: Passage Authority's hosted delegated-authority workflow, organization access, evidence storage, decisions, receipts, lifecycle events, and supporting operations. Propose Security with Availability and Confidentiality for auditor/buyer discussion. Do not promise an examination category before the system description and commitments are agreed. AICPA describes SOC 2 as assurance concerning specified system controls across security, availability, processing integrity, confidentiality and privacy; an application feature test is not that assurance. [AICPA SOC 2 overview](https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2/).

## Verified starting position

- No SOC 2 report, engagement letter, approved audit scope, named program lead, or funded audit program was evidenced in the handoff or repository.
- Enterprise administration baseline is 44/100, an internal maturity assessment rather than a security grade.
- Product evidence includes authenticated commands, tenant authorization, durable authority events and receipt replay. Those checks cover selected application behavior, not the organization's complete control environment or operating effectiveness over a review period.
- Privileged MFA, access certification, restore/incident exercises, retention operations, independent security review and counsel closeout remain explicit gates.
- Stripe failure/refund replay and seven clean daily cross-provider reconciliations remain required commercial evidence. Do not substitute provider configuration, a signed event, or a successful invoice for the complete evidence chain.
- Source: `NEW-CHAT-HANDOFF.md`, `ENTERPRISE-ORGANIZATION-ADMIN-BENCHMARK-2026-09-04.md`, `PASSAGE-STRATEGIC-CLAIMS-AUDIT-AND-BATTLECARD-2026-09-05.md`, and `AUTHORITY-COMPASS-CLOSEOUT-2026-09-05.md`.

## System boundary and inventory

| System / process | Proposed scope | Evidence to collect | Accountable role, pending named assignment |
| --- | --- | --- | --- |
| Passage Authority / Next.js | Application, commands, tenant and role authorization, participant access, receipts | Architecture, data-flow diagram, code ownership, deployment trace, negative-path/replay records | Engineering lead |
| Vercel Demo and Production | Hosting, deployments, secrets, runtime logs, recovery | Environment separation, access inventory, MFA, change approvals, secret rotation, log retention, rollback exercise | Engineering / operations |
| Supabase Postgres, Auth, Storage | Durable data, RLS, service access, files, recovery | Policy inventory, grants, MFA, advisor remediation, restore evidence, backup coverage including storage, deletion verification | Engineering / security |
| GitHub | Source and release change control | Branch protections, reviewer independence, administrator list, audit history, dependency response | Engineering lead |
| Google / Gmail | Staff identity and controlled access communications | Managed identity decision, account ownership, recovery, MFA, offboarding and retention | Executive sponsor / operations |
| Resend / SMTP | Invitation and receipt delivery | Access scope, privacy/DPA, message minimization, retention, bounce/incident handling | Operations |
| Stripe | Billing source and signed event processing | Test/live separation, provider permissions, idempotency, refund ledger, reconciliation and incident handling | Finance owner / engineering |
| HubSpot | Prospect/customer projection and support intake | Approved schema, least privilege, no participant data, lifecycle/retention, association and reconciliation proof | Commercial operations |
| Cloudflare / DNS | Public domain control | Ownership, MFA, DNS change log, registrar recovery, domain-expiration responsibility | Operations |
| Staff endpoints and support practices | Administrative access path | Device inventory, encryption, updates, credential vault, training, onboarding/offboarding, approved support-data handling | Security lead |

Provider reports support vendor review but do not confer SOC 2 assurance on Passage. Obtain current reports, coverage periods, bridge letters when needed, and complementary user-entity controls under the vendor's permitted sharing process. Auditor determines subservice-organization treatment. Local synthetic SQLite is outside customer production processing; include development access and its promotion boundary in change-control scope.

Exclude bank cores, money movement, legal validity of POAs, notarization, and downstream access enforcement. Passage does not operate these services. V2.5/V3 scope is reconsidered only when implemented and contracted.

## Gap assessment and acceptance evidence

| Gap | Priority | Required closure evidence | Proposed responsible role |
| --- | --- | --- | --- |
| Program ownership and governance | P0 | Named lead, approved budget, scope, risk register, monthly review, evidence repository | Executive sponsor |
| Privileged access / MFA | P0 | All in-scope privileged identities enumerated; MFA enforcement verified; break-glass procedure tested; quarterly access review signed | Security lead |
| Tenant and participant isolation | P0 | Cross-tenant, wrong-role, stale session, expired/reused link and service-role tests with unchanged denied-mutation counts | Engineering |
| Retention and deletion | P0 | Approved data classes and retention periods; deletion workflow and exceptions; proof covering database, files, mail, logs and vendors | Privacy counsel / engineering |
| Recovery and availability | P0 | Buyer-agreed RPO/RTO; database and file restore drill with timestamps, reconciliation, ownership and exceptions | Operations |
| Incident response | P0 | Contacts, severity levels, containment and notification responsibilities; tabletop and remediation evidence | Security / counsel |
| Secure development | P0 | Review policy, deployment approvals, dependency inventory/scans, vulnerability triage and independent scoped assessment | Engineering |
| Vendor risk / contracts | P0 | Vendor inventory, DPAs, current assurance evidence, subprocessor handling, concentration and exit risks | Security / counsel |
| Billing integrity | P0 | Paid/failure/refund/disorder replay; append-only adjustments; provider snapshot reconciliation and resolved high variances | Finance / engineering |
| Operational monitoring | P1 | Alert routing, on-call owner, immutable audit retention/export, sample incident-to-resolution chain | Operations |
| People controls | P1 | Signed policies, training, access approvals/offboarding, contractor confidentiality and endpoint controls | Operations |
| Customer assurance response | P1 | Approved system description, shared-responsibility matrix, truthful questionnaire answers and claim review | Sponsor / security |

An assigned role is a proposed responsibility, not evidence that a named person has accepted it. Sponsor must fill each name and backup before the readiness phase is considered owned.

## Auditor options and procurement rubric

Two candidates for quotes, not endorsements or engaged providers:

| Candidate | Primary evidence | Questions requiring written response |
| --- | --- | --- |
| Schellman | Publishes SOC examinations and readiness services. [Service description](https://www.schellman.com/services/soc-compliance-and-attestations) | Scope/category fit; independence if readiness advice is also purchased; lead auditor; startup fit; Type I/II deliverables, timetable and total fees |
| Johanson Group LLP | Publishes compliance and security audit services. [Firm service site](https://www.johansonllp.com/) | Assigned CPA firm and signatory; relevant financial-services SaaS experience; reviewer continuity; readiness assumptions; exclusions and rework charges |

Score written proposals on scoped expertise (25%), independence and audit quality (25%), evidence methodology (20%), realistic timing/staff continuity (15%), and total first-year/renewal cost (15%). Verify licensing, independence, buyer acceptability and actual named engagement team before selection. No outreach, contract or spend is authorized by this document.

Ask for separate prices for readiness, optional Type I, Type II, additional criteria, security testing, travel, platform dependencies, remediation retesting and renewal. Ask whether evidence collection can use existing tools. Do not confuse an automation vendor or trust-center badge with the examining CPA's report.

## Budget decision

The following are **internal planning reserves, not vendor quotes or researched market prices**. They must be replaced with written quotes and an approved staffing plan.

| Work | Proposed reserve |
| --- | ---: |
| Readiness / specialist support | $10,000 |
| Independent examination reserve | $25,000 |
| Scoped security testing / retest | $10,000 |
| Evidence tooling / endpoint controls | $5,000 |
| External-services contingency | $10,000 |
| Total proposed external reserve | $60,000 |

Internal capacity assumption: 8–12 engineering/operations person-weeks, plus sponsor, finance and counsel review time. This is a staffing estimate, not a delivery promise. Obtain separate counsel quotes. Do not count an unaccepted $5,000 pilot as funding. Recommended first decision is a readiness-only tranche capped at $10,000, subject to actual quote approval; audit spend remains a separate decision.

## Conditional dates and stage gates

These are planning targets assuming sponsor approval by September 11, 2026. None is an auditor commitment or report date.

| Target | Gate | Required decision/evidence |
| --- | --- | --- |
| September 11 | Fund and assign readiness | Sponsor, lead and backups named; initial scope and budget accepted |
| September 18 | Complete inventory and collect quotes | Data flows, vendor list, evidence index, control owners, comparable proposals |
| October 2 | Prioritize and resource remediation | Risk register, actual gap assessment, buyer assurance requirements, selected audit approach |
| November 6 | Assess readiness for examination | P0 controls implemented and verified; evidence independently reviewed; CPA agrees scope/timing |
| After readiness gate | Optional Type I | Consider only if a buyer needs point-in-time design evidence and the CPA agrees it is appropriate |
| After controls operate consistently | Type II observation | Period and start date agreed with the CPA; exceptions recorded throughout; report timing follows examination |

Schellman distinguishes Type I's point-in-time design assessment from Type II coverage of operating effectiveness over a period. This package does not start either examination or its observation period. [SOC examination types](https://www.schellman.com/services/soc-compliance-and-attestations).

## Required approval record

Sponsor: unassigned. Program lead: unassigned. Budget: unapproved. Auditor: unselected. Engagement: none evidenced. Scope/categories: proposed. Observation period: unset. Opinion target: unset. Evidence repository and access owner: unassigned.

Permitted buyer wording: “We do not currently have a SOC 2 report. The evaluation is synthetic-data-only. We will scope production assurance requirements with the design partner before any real data is accepted.” Do not say “SOC 2 in progress” until a funded, owned and documented program exists; do not say “audit underway” without a documented audit engagement and accurate current stage.
