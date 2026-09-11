# Passage Authority Market and Readiness Assessment

Implementation update: [current position, research implications and gaps](PRODUCT-GAPS-2026-09-10.md). The external research below is the original September 10 baseline. Workspace guidance, plain-language copy and draft recovery have since progressed on unmerged PR 108; no new market-validation or compliance claim follows from those changes.

## Overview

**Passage is directionally aligned with a real institutional problem, but enterprise readiness and product-market fit remain unproven.** Its strongest proposition is a consistent record of an institution’s delegated-authority decision: the evidence reviewed, specific actions accepted or excluded, governing policy, decision maker, and later changes. That is a credible focus. It should be developed as an operations product whose controls support adoption, rather than expanded into a general compliance platform.

The assessment covers U.S. banks and credit unions, with New York and Pennsylvania as initial legal reference points. Public evidence was checked on September 10, 2026 UTC. Passage’s baseline is the reviewed repository and recorded tests through commit `3644644`; the new team-MFA interface remains in unmerged PR 108, while its database migration has been applied and tested in Demo and UAT. This report is an independent market and product assessment, not legal signoff, a penetration test, or a certification.

**The central recommendation is to continue, with a tighter sequence.** Validate whether institutions will pay to improve POA acceptance and servicing, address cases where the principal cannot participate, implement institution-specific policy and deadline handling, and complete the controls needed for a bounded real-data pilot. Generic enterprise features, additional jurisdictions, and a broad participant portfolio should follow demonstrated demand.

| Question | Assessment | Confidence |
| --- | --- | --- |
| Is the problem real? | Yes. Banks publish separate POA intake processes; state law addresses acceptance, refusal and notices. | High [[10]](https://www.bankofamerica.com/signature-services/power-of-attorney/) [[11]](https://www.nysenate.gov/legislation/laws/GOB/5-1504) [[12]](https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/00.056..HTM) |
| Is Passage’s category sensible? | Yes as a focused institutional workflow. A distinct purchasing category and budget have not been established. | Moderate; strategic inference |
| Are we ahead of competitors? | Not established. The proposed decision model is promising; adjacent vendors have broader products and public customer evidence. | Moderate [[2]](https://www.proof.com/industries/financial-services) [[3]](https://www.proof.com/case-studies/baxter-credit-union-enhances-member-experience-with-proof) [[4]](https://www.docusign.com/solutions/industries/financial-services) |
| Are we ready for enterprise customer data? | Not yet. Recovery, resilience, policy configuration, assurance and other release gates remain open in Passage’s own evidence. | High for reviewed baseline |
| Is more compliance engineering the answer? | Only when tied to a buyer requirement, material risk or legal obligation. Buyer validation and workflow realism deserve equal priority. | Recommendation |

### What Passage actually demonstrates

The repository records a tested synthetic institution/principal/representative workflow, scoped decisions and matching receipts, role boundaries, transaction replay, and negative-path tests. The latest engineering slice adds an organization-scoped MFA enrollment inventory, with 164 passing domain tests, local authenticated browser checks, and 11 rollback-only database assertion groups in each hosted environment. These are meaningful engineering controls; they do not prove real-world identity verification, legal sufficiency, sustained operations, or customer outcomes.

The current policy screen explicitly says institution configuration is unavailable and limits the evaluation to duplicate statements and defined account-service questions. Broader action catalogs, configurable policy publication, and historical snapshot/rebase enforcement are described as intended launch behavior. They must be demonstrated before being presented as delivered capability. A successful synthetic test cannot convert a specification into an operating feature.

## Market and buyer demand

### The demand is broader than document signing

Bank of America describes adding an agent to an account and distinguishes durable authority that continues after incapacity. That supports the need for an institution-side process beyond document creation. It does not establish how many institutions have an unsolved software problem or what they would pay Passage. The most credible initial value proposition is reduced operational friction with a defensible decision record, not an unsupported promise to prevent fraud. [[10]](https://www.bankofamerica.com/signature-services/power-of-attorney/)

AARP and the National Alliance for Caregiving estimate 63 million American caregivers in 2025. The population includes care for adults and children with complex conditions; it is not a count of financial POA holders, annual bank cases, or software buyers. FinCEN’s April 2024 analysis identified more than $27 billion in reported suspicious activity associated with elder exploitation during the studied year. That figure includes suspicious activity, not a verified amount of loss preventable by Passage. These findings establish social importance, not a revenue forecast. [[23]](https://www.aarp.org/pri/topics/ltss/family-caregiving/caregiving-in-the-us-2025/) [[24]](https://www.fincen.gov/news/news-releases/fincen-issues-analysis-elder-financial-exploitation)

### Market size that can be defended

The FDIC-derived FRED balance-sheet series reports 4,238 institutions for Q2 2026. NCUA reports 4,250 federally insured credit unions for Q1 2026. The dates differ; their arithmetic sum of 8,488 is only a mixed-period indication of the broad institutional universe. It is not a synchronized customer count, does not represent independent buying groups, and includes institutions with unsuitable volume or procurement economics. [[25]](https://fred.stlouisfed.org/series/QBPBSNUMINST) [[26]](https://ncua.gov/newsroom/press-release/2026/ncua-releases-first-quarter-2026-credit-union-system-performance-data)

**A defensible dollar TAM for U.S. institutional POA-acceptance software is not established by the available evidence.** Multiplying all institutions by an aspirational annual price would overstate opportunity. A serviceable-market model needs actual case volume, current processing cost, existing vendor coverage, buying authority, jurisdiction fit and procurement constraints. Wealth-transfer estimates and total bank assets are especially poor substitutes for those inputs.

For business planning, use transparent account arithmetic. At a hypothetical $24,000 annual contract, 25 customers produce $600,000 recurring revenue, 100 produce $2.4 million, and 250 produce $6 million, before churn, discounts, support and delivery costs. These are scenarios, not forecasts or evidence that 250 qualified buyers exist. A credible near-term objective is several repeatable paid deployments with manageable implementation cost.

### Recommended initial customer profile

Prioritize community or regional banks and credit unions that have recurring POA cases, a named operations owner, fragmented handoffs, and a willingness to standardize one workflow. Institution size alone is insufficient. A smaller institution with many complex cases and an accessible sponsor may be more attractive than a large bank with an established enterprise platform and a multi-year procurement cycle.

| Segment | Potential buying reason | Main obstacle | Priority |
| --- | --- | --- | --- |
| Community and regional banks | Consistent branch-to-operations review and defensible records | Vendor diligence, limited implementation capacity, case volume | First discovery cohort |
| Credit unions | Member-service improvement and repeatable exception handling | Budget, existing core/vendor relationships, security review | First discovery cohort |
| Large banks | Cross-channel standardization and high-volume controls | Incumbent workflows, integration and procurement complexity | Later or unusually strong sponsor |
| Elder-law professionals | Better submission packets and visibility into institution responses | Cannot compel the receiving institution to adopt Passage | Referral and research partners first |
| Trust departments and fiduciaries | Authority records alongside broader fiduciary administration | Different accounting and reporting expectations | Separate validation before expansion |

The likely champion is deposit operations, member services, branch operations or a specialized POA/legal operations team. Legal and compliance define acceptance policy; security and vendor risk can block adoption; IT owns integrations; procurement and an executive sponsor approve spend. These are buying-role hypotheses to test, not confirmed roles at named prospects. A supportive attorney alone is not proof of a bank budget.

## Competitors

The relevant alternatives span adjacent categories. The comparison below uses public product descriptions and vendor-published examples, not private demonstrations or independently tested feature inventories. “Not established” means public evidence did not settle a capability; it does not mean the competitor lacks it.

| Alternative | Verified public focus | Competitive pressure | Passage response to validate |
| --- | --- | --- | --- |
| Proof | Identity, e-signature, remote notarization, POA execution and APIs [[1]](https://www.proof.com/use-cases/poa) [[2]](https://www.proof.com/industries/financial-services) | High for digital identity and document workflows; institutional customer proof [[3]](https://www.proof.com/case-studies/baxter-credit-union-enhances-member-experience-with-proof) | Own the receiving institution’s scoped decision and servicing history; integrate upstream evidence |
| Docusign | Financial-services agreement management and digital workflows [[4]](https://www.docusign.com/solutions/industries/financial-services) | High where the bank already buys an agreement platform | Demonstrate domain-specific time-to-value beyond a configured agreement workflow |
| ServiceNow | Documented financial-services notice-of-death workflow [[5]](https://www.servicenow.com/docs/r/xanadu/financial-services-operations/financial-services-customer-lifecycle-operations/fso-death-notice-workflow.html?contentId=9JZ5mmPIxOvONz~y4xLbtw) | High as a broader workflow platform; exact POA coverage not established here | Integrate with the bank’s cases rather than require replacement of its operations platform |
| Estateably | POA records, financial activity and fiduciary reporting; support documentation specifies Canada for POA [[6]](https://www.estateably.com/platform/powers-of-attorney) [[7]](https://support.estateably.com/en/articles/10736122-estateably-products-explained) | Closer in fiduciary teams; jurisdiction limits matter | Prove U.S. receiving-institution acceptance depth, without claiming universal competitive superiority |
| Trust & Will | Estate-planning partnerships for banks and credit unions [[8]](https://trustandwill.com/partnerships/) | Strong adjacent distribution and relationship positioning | Position acceptance of an existing instrument as a complementary operational job |

### Proof

Proof is the most immediate adjacent comparison. Its public financial-services offering includes identity and authorization use cases, not merely notarization. Its Baxter Credit Union case study provides vendor-published evidence of institutional deployment. Passage should not describe Proof as “just signatures,” and should not claim to replace its identity or notary infrastructure. [[2]](https://www.proof.com/industries/financial-services) [[3]](https://www.proof.com/case-studies/baxter-credit-union-enhances-member-experience-with-proof)

**Strategic inference:** Proof can win when the buyer’s principal problem is obtaining a completed, identity-assured document. Passage has a potential separate role when the buyer needs to interpret a received instrument under its own policy, route exceptions, record permitted actions, and track subsequent status. The separation must survive a live workflow comparison. Ask an institution to show what happens after the signed document arrives and which existing system owns that work.

### Docusign

Docusign’s financial-services page positions a broad agreement-management platform for banks and credit unions. This creates a serious “we already own this” objection. Passage’s response cannot be that it has an audit trail or a document upload; those are insufficient differentiators. [[4]](https://www.docusign.com/solutions/industries/financial-services)

**Strategic inference:** Win only if a purpose-built POA workflow reduces implementation and operating burden relative to the bank’s existing stack. Show a specific missing outcome: a jurisdiction-sensitive exception, a preserved policy decision, or a revocation handoff with acknowledgment. Enterprise contract pricing for a comparable scope was not verified; public e-signature seat prices would not be an apples-to-apples benchmark.

### ServiceNow and internal workflow teams

ServiceNow’s documented notice-of-death workflow demonstrates that financial institutions can handle sensitive lifecycle events in a general operations platform. This is adjacent evidence, not proof of an identical POA product. The cited documentation is version-specific. [[5]](https://www.servicenow.com/docs/r/xanadu/financial-services-operations/financial-services-customer-lifecycle-operations/fso-death-notice-workflow.html?contentId=9JZ5mmPIxOvONz~y4xLbtw)

**Strategic inference:** A bank can decide to configure its existing case system, document repository and core notes instead of adding Passage. This may be the strongest economic substitute, particularly at low case volumes. Passage needs a defensible integration and ownership model: existing case ID, responsible team, source documents, decision status, acknowledged downstream task, and portable export. Prove which operational work disappears rather than adding a second queue.

### Estateably

Estateably publicly describes POA recordkeeping, financial activity, accounting and reporting for legal and fiduciary professionals. Its June 2026 support page narrows the POA product to Canadian administration. The broader marketing page and narrower support description should be read together. Do not characterize it as a fully established U.S. bank-acceptance substitute without further verification. [[6]](https://www.estateably.com/platform/powers-of-attorney) [[7]](https://support.estateably.com/en/articles/10736122-estateably-products-explained)

**Strategic inference:** Estateably becomes more relevant if Passage expands into fiduciary administration. Remaining focused on an institution’s acceptance decision avoids immediately taking on accounting, court-reporting and estate-administration requirements.

### Trust and Will and Empathy

Trust & Will sells institutional estate-planning partnerships. Empathy markets legacy-planning and loss-support products to financial institutions, including banks and credit unions. These vendors can compete for relationship, retention and family-support budgets even when their core task differs from Passage’s. Their public pages establish adjacency, not an absence of future overlap. [[8]](https://trustandwill.com/partnerships/) [[9]](https://www.empathy.com/business/financial-institutions)

**Strategic inference:** Treat them as potential ecosystem participants as well as budget competitors. A planner creates documents, a support provider helps a family navigate events, and an institution still needs to decide what authority it will honor. No partnership is established, and a referral strategy must not assume access to another vendor’s distribution.

### Where differentiation could become durable

The strongest potential advantage is a reusable institution-specific authority model: jurisdiction and instrument type, effective policy, legal powers, requested actions, approved actions, channel permissions, evidence provenance, reasons, and lifecycle events. Technical architecture alone is easy to describe. A stronger advantage would combine that model with institution-approved policies, integrations, repeatable implementation, operational benchmarks and reference customers. None of those should be claimed as a moat before evidence accumulates.

## Best practice alignment

### Preserve the distinction between authority and identity

Passage’s separation of identity evidence, an authority instrument and the institution’s final decision is sound. A verified identity does not establish the scope of an agent’s power. Similarly, CFPB guidance explains that a trusted contact does not gain account access or transaction authority simply by being named. Avoid merging trusted contact, POA agent, trustee, guardian and executor into one permission type. [[13]](https://files.consumerfinance.gov/f/documents/cfpb_trusted-contacts-fis_2021-11.pdf)

Recommended product treatment: give each authority type its own evidence requirements and lifecycle. Support only types that the institution and counsel have approved. Store legal power separately from requested action and actual system entitlement. A receipt saying an institution accepted an action must not imply that core-banking access changed unless there is a recorded acknowledgment from that system or an authorized operator.

### Resolve the principal participation gap

Durable POA can continue after incapacity; this is explicitly explained in Bank of America’s guidance. Passage’s reviewed transition and participant-access code centers on principal confirmation before representative participation. That is suitable for an expressly bounded, participating-principal evaluation, but is not enough to substantiate general durable-POA coverage. [[10]](https://www.bankofamerica.com/signature-services/power-of-attorney/)

**Priority recommendation:** either describe the initial supported use case narrowly or build an institution-controlled agent-initiated intake for an existing instrument when the principal cannot act. It should preserve evidence, document why ordinary participation is unavailable, and route capacity, effectiveness, fraud and legal questions to the institution. Never invent principal consent, silently skip it, or treat the software as determining incapacity. Counsel should also review successor agents, co-agent voting rules, springing powers, death, court intervention, and conflicting instruments before those cases are supported.

### Make policy operational and legally bounded

New York GOB 5-1504 provides a ten-business-day initial response framework for qualifying statutory short-form presentations, with seven-business-day response rules in specified later circumstances. It restricts unreasonable rejection and addresses written notices, permitted reasons and exceptions. An institution’s policy is not an unlimited right to reject. Passage needs a counsel-reviewed applicability decision and deadline calculation, not a blanket ten-day timer for every instrument. [[11]](https://www.nysenate.gov/legislation/laws/GOB/5-1504)

Pennsylvania Chapter 56 provides a seven-business-day acceptance-or-request framework and a five-business-day rule after specified requested material, subject to statutory exceptions. It also addresses agent acknowledgment, durability, specific grants and other conditions. These requirements differ from New York and from one another across instrument types and dates. A New York template relabeled “Pennsylvania” would not establish support. [[12]](https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/00.056..HTM)

Recommended implementation: version the applicable rule set, preserve the presentation date and evidence of receipt, identify which business-day calendar applies, track legally reviewed pause/restart rules, escalate impending deadlines, and generate required reasons and delivery tasks. An application notification is not automatically legally sufficient service. Preserve past decisions when policy changes; append corrections and new determinations rather than rewriting history.

### Broaden authentication beyond two privileged roles

Owner/admin MFA and server-side role enforcement are useful foundations. The reviewed policy deliberately excludes staff, reviewers, developers and auditors from mandatory MFA. FFIEC guidance treats authentication as a risk assessment across customers, employees and third parties; title alone is not the complete boundary. [[20]](https://www.ffiec.gov/news/press-releases/2021/pr-08-11)

NYDFS’s September 2025 guidance describes expanded MFA requirements effective November 1, 2025, including exceptions and alternative-control provisions. Even limited exemptions retain requirements for certain remote access, third-party applications containing nonpublic information and privileged access. Applicability depends on the covered entity and deployment; Passage is not automatically subject to every NYDFS provision merely because it serves New York. Nevertheless, owner/admin-only MFA cannot be treated as sufficient for every target buyer. [[16]](https://www.dfs.ny.gov/system/files/documents/2025/09/multifactor-authentication.pdf)

NIST SP 800-63B-4 requires an offered phishing-resistant option for AAL2 under that standard. TOTP is useful but is not phishing resistant. A Supabase session labeled AAL2 is not proof that the whole service conforms to NIST’s assurance requirements. Evaluate passkeys/security keys or institution federation, with correct session and role enforcement. Apply federation and lifecycle provisioning when buyer scope requires them rather than promise SSO or SCIM that is not evidenced. [[18]](https://pages.nist.gov/800-63-4/sp800-63b/aal/)

Recovery deserves a designed workflow: approved evidence, risk-based re-verification, independent review where appropriate, limited support access, notification to established channels, session revocation, and an audit trail. Two enrolled TOTP entries may reside on the same device or share the same underlying secret; the count alone does not prove resilient recovery. NIST treats account recovery and authenticator lifecycle as substantive controls, not a support shortcut. [[19]](https://pages.nist.gov/800-63-4/sp800-63b/events/)

### Complete resilience and data governance

CISA recommends protected backups and actual restoration testing. Passage’s open backup/restore gate therefore addresses a practical need. Define acceptable data loss and outage duration with the pilot institution, then demonstrate recovery of database records, files, configuration and required secrets into an isolated environment. A backup plan, database export or healthy dashboard alone is insufficient. [[21]](https://www.cisa.gov/stopransomware/ransomware-guide)

The proposed data-governance baseline should include a data inventory, minimization, retention classes, legal holds, deletion rules, export, subprocessor disclosures, encryption, support-access controls, access logging and incident procedures. The interagency information-security guidance supports safeguards and contractual controls for providers handling customer information. Append-only decision history should not become a reason to retain every raw identity document forever; preserve the necessary decision record while applying approved retention to sensitive artifacts. [[27]](https://www.federalreserve.gov/supervisionreg/interagencyguidelines.htm)

Map regulatory duties carefully. The FTC Safeguards Rule applies within the FTC’s defined jurisdiction and is not the universal governing rule for every bank or credit union. Bank, credit-union, state and contractual requirements must be evaluated for the actual relationship. Receiving sensitive health evidence can introduce additional privacy considerations, but it does not by itself prove that the entire product is subject to HIPAA. Obtain a scoped legal assessment rather than display broad compliance badges. [[28]](https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know)

### Prepare for procurement without turning everything into a certification project

The interagency community-bank guide emphasizes risk-based planning, diligence, contracting, monitoring and termination. NCUA’s active third-party guidance also calls for diligence proportional to risk and relationship complexity. These sources do not create a universal rule that every synthetic pilot must first have a SOC 2 report. Individual institutions can still require one as a purchasing condition. [[14]](https://www.occ.gov/news-issuances/news-releases/2024/pub-third-party-risk-management-guide-for-community-banks.pdf) [[15]](https://ncua.gov/regulation-supervision/letters-credit-unions-other-guidance/evaluating-third-party-relationships)

Prepare an accurate assurance packet: system and data-flow description, control ownership, access review, vulnerability management, independent testing scope, incident plan, restore evidence, subprocessor list, insurance where required, contractual security terms, and an exit/export plan. SOC is an independent assurance framework; selecting an appropriate examination with a CPA is separate from completing an internal checklist. Do not claim an audit is underway until it is. [[30]](https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services)

NYDFS’s 2025 third-party guidance reinforces diligence, contract provisions and ongoing oversight, and states that a covered entity cannot delegate away its compliance responsibility. Passage’s “the institution decides” principle aligns with that accountability, but does not remove Passage’s own responsibilities for the service and data it operates. [[17]](https://www.dfs.ny.gov/industry-guidance/industry-letters/il20251021-guidance-managing-risks-third-party)

Incident contracts should enable customers to meet their own deadlines. NCUA requires a federally insured credit union to report qualifying cyber incidents as soon as possible and no later than 72 hours after reasonable belief of a reportable incident. Passage should agree a vendor notification process that supports that obligation, not assume it may wait 72 hours before telling the customer. [[29]](https://ncua.gov/regulation-supervision/regulatory-compliance-resources/cybersecurity-resources/cyber-incident-reporting-guide)

### Make accessibility and abuse handling part of the workflow

WCAG 2.2 includes accessible authentication, focus visibility and other criteria beyond touch-target dimensions. The recent 360/390px checks and 44px controls are useful but do not establish conformance. Test screen readers, keyboard-only operation, zoom, errors, timeouts, copy/paste, password managers and assisted completion. WCAG 2.2 AA’s target-size criterion is generally 24 by 24 CSS pixels with exceptions; 44px is a stronger product target, not the universal AA minimum. [[22]](https://www.w3.org/TR/wcag/)

The interagency elder-exploitation statement supports institutional risk management around vulnerable customers. Passage should provide controlled escalation and restricted records for suspected coercion or abuse. Do not automatically expose sensitive suspicions or confidential regulatory-reporting material in a three-party receipt. The institution must determine which notices are required, permitted or restricted. [[31]](https://www.fincen.gov/resources/statutes-regulations/guidance/interagency-statement-elder-financial-exploitation)

## Passage alignment matrix

“Demonstrated” below means supported by the reviewed internal test evidence, not independently audited. “Open” means the current checkpoint or inspected implementation establishes a gap. “Not evidenced” means this assessment did not verify the capability and it should not be promised.

| Area | Current assessment | Next proof required |
| --- | --- | --- |
| Institution owns final decision | Aligned in product contract and synthetic flow | Institution signs off on decision language and authority boundaries |
| Scoped decisions and receipts | Demonstrated for controlled fixtures | Representative production-like cases, export and downstream acknowledgment |
| Role and tenant isolation | Focused negative tests passed | Independent assessment plus recurring access reviews |
| Principal unable to participate | Not established by reviewed workflow | Approved alternate intake and replay, or explicit exclusion |
| Institution policy configuration | Open; current page says unavailable | Publish, snapshot, stale-draft rebase and unchanged historical replay |
| Jurisdiction and deadline handling | Not evidenced as an operating capability | NY and PA applicability, clocks, reasons and notice delivery reviewed by counsel |
| MFA and recovery | Owner/admin enforcement demonstrated; broader scope and controlled recovery open | Buyer access policy, phishing-resistant option, all-factors-lost drill |
| Resilience and incident operations | Open | Actual restore, accepted recovery targets, tabletop and incident obligations |
| Retention and support access | Requirements exist; complete operating proof not established | Data lifecycle, access logs, deletion/hold/export and support approval tests |
| Reconciliation | Internal day 2/7 recorded; live provider comparison separate | Real elapsed days, provider read evidence and tested exception ownership |
| SSO SCIM and institutional integrations | Complete production capability not evidenced | One buyer-approved integration and user lifecycle before broader commitments |
| Customer demand and economics | Research and unsent drafts; paid outcome proof not established | Named sponsor, baseline costs, signed pilot success criteria and conversion decision |

## Pricing and commercial validation

Passage’s approved offer is a $5,000 founding pilot lasting 60–90 days for one institution, team and workflow, credited toward year one. Annual $12,000, $24,000 and $36,000 figures are internal discovery anchors, not validated tiers. The structure is plausible for a supported proof of concept, but public competitor evidence does not establish that the amount is “market standard.” Define configuration, implementation hours, support, integration boundaries, data scope and conversion terms before selling it.

Use operational economics rather than generic fraud-loss claims. The following illustration assumes 30 minutes saved per case and a fully loaded labor cost of $60 per hour: $30 of gross capacity value per case. These are deliberately labeled assumptions, not survey findings. Time freed is not necessarily cash saved, and the calculation excludes software administration, integration, training and change-management costs.

| Hypothetical annual cases | Hours freed at 30 minutes per case | Gross capacity value at $60 per hour |
| --- | --- | --- |
| 250 | 125 | $7,500 |
| 500 | 250 | $15,000 |
| 1,000 | 500 | $30,000 |

At those assumptions, $24,000 annual pricing requires 800 cases merely to equal gross labor capacity value; the buyer needs additional value or a larger improvement to justify costs and risk. At $12,000 and $36,000 the equivalent thresholds are 400 and 1,200 cases. This is why case volume and handling effort should qualify prospects early. Low-volume institutions may be better served through a shared channel or a broader workflow bundle, but that is a hypothesis to validate.

Measure median and 90th-percentile elapsed time from presentation to disposition, active handling minutes, missing-information loops, branch escalations, required notices completed on time, rework, access-change acknowledgment, and customer effort. Separate elapsed waiting from staff work. Audit retrieval speed is useful; a claim that Passage reduces fraud requires a separate methodology and should not be inferred from a short pilot with no incidents.

## Guidance

### Priority sequence

| Stage | Recommended action | Exit evidence |
| --- | --- | --- |
| Now | Confirm supported use case; map principal incapacity and legal deadlines; audit public claims | Product and counsel-approved scope with explicit exclusions |
| Next discovery cycle | Interview operations, legal and vendor-risk roles at 8–12 qualified institutions | Observed workflow, anonymized baseline, budget owner and purchase criteria; proposed research target |
| Before real data | Complete access/recovery, backups/restore, incident, retention, security review and buyer contract | Named owners, tested controls, accepted residual risk and explicit pilot approval |
| Before pilot start | Configure one institution’s policy and measure one integration or controlled handoff | Historical replay, edge-case tests, acknowledged downstream action and baseline metrics |
| During approved pilot | Measure operational outcomes and total delivery cost | Evidence-supported conversion decision; no invented savings |
| After repeatability | Add demanded jurisdictions, authority types, federation and integrations | Reuse across customers with sustainable support effort |

Security and policy work should advance alongside discovery preparation. Do not wait for a complete generic enterprise platform before learning whether an institution values this workflow. Conversely, a promising interview does not authorize real data before the agreed controls and approvals exist. Existing outreach and demonstration holds remain in effect; this report does not release them.

### Questions that can change the decision

- Show the last five anonymized POA cases: who received them, what delayed them, and where was the final decision recorded?

- How many cases arrive per month, and what proportion involve incapacity, successor agents, co-agents, out-of-state documents or missing evidence?

- Which steps must your legal team review, and which could follow approved policy?

- How are presentation dates, deadlines, reasons and legally required notices tracked?

- When an agent is accepted or authority changes, who updates each channel and how is completion acknowledged?

- What can your current core, case system, Proof or Docusign configuration already do?

- What security evidence is required for synthetic evaluation, a limited real-data pilot and production respectively?

- Who owns budget, what measurable result would justify renewal, and what implementation effort would make a new vendor unattractive?

### Competitive response

**Say:** “Passage helps your team record and manage its decision about someone acting for a customer, including the accepted scope and what changes later.” **Clarify:** “Which part of that process remains manual after you receive the document?” **Prove:** demonstrate one complete case, one disputed or incomplete case, one lifecycle change, and an independently reconstructed decision.

For “we already use Proof or Docusign,” explore the institution’s remaining review and servicing work. For “we can build this in our case system,” compare implementation effort, ongoing policy maintenance, user burden and exportability. For “do you have SOC 2,” state the actual report status and offer the scoped assurance evidence and buyer-agreed path. Never characterize absent public competitor detail as a confirmed missing feature.

### What to defer

Defer universal authority registries, consumer estate-document generation, broad wealth-management functionality, autonomous legal acceptance, dozens of integrations and a general compliance dashboard. These would dilute the proposed advantage before willingness to pay is proven. AI extraction may eventually reduce review effort, but should cite source locations, express uncertainty and require authorized review; it should not become an unsupported authority decision engine.

Also separate customer-protection controls from internal operating milestones. Seven clean daily reconciliation runs are Passage’s chosen evidence gate, not an identified universal banking regulation. Warm introductions are a distribution tactic, not proof of market demand. Neither should become a substitute for observed institutional workflow fit.

## Confidence and evidence limits

Confidence is high in the cited public descriptions, statutory distinctions and recorded internal test outcomes. Confidence is moderate in the proposed competitive separation and priority order. Confidence is low in willingness to pay, case volumes, purchasing conversion, competitor configuration limits and defensible market share because this assessment contains no new buyer interviews, private vendor demonstrations, competitive quotes or independent audit.

The current repository supplies the internal product and implementation baseline. Public primary sources supply vendor facts and external benchmarks. CRM deal data, private communications, meeting transcripts and paid sales-intelligence databases were not used; no account-specific competitor presence or customer quotation is asserted. Vendor case studies are vendor-published evidence, not independent causal evaluations. Older regulatory guidance is identified by date; applicability must be checked for the buyer and jurisdiction before implementation.

**Decision:** continue Passage as a focused authority-acceptance and servicing workflow. Its architecture is heading in the right direction. The next investment should prove that it handles the difficult institutional cases, meets a defined buyer’s security boundary, and delivers measurable operational value. That is a stronger path than accumulating enterprise features without a validated purchasing reason.


## Sources

1. Proof. [Power of Attorney](https://www.proof.com/use-cases/poa). Undated. Supports: POA notarization and execution positioning. Accessed September 10, 2026 UTC.

2. Proof. [Financial services](https://www.proof.com/industries/financial-services). Undated. Supports: Identity, signature, notarization and API coverage. Accessed September 10, 2026 UTC.

3. Proof. [Baxter Credit Union case study](https://www.proof.com/case-studies/baxter-credit-union-enhances-member-experience-with-proof). Undated. Supports: Vendor-published institutional customer evidence. Accessed September 10, 2026 UTC.

4. Docusign. [Financial services](https://www.docusign.com/solutions/industries/financial-services). Undated. Supports: Institutional agreement platform capabilities. Accessed September 10, 2026 UTC.

5. ServiceNow. [Notice of death workflow](https://www.servicenow.com/docs/r/xanadu/financial-services-operations/financial-services-customer-lifecycle-operations/fso-death-notice-workflow.html?contentId=9JZ5mmPIxOvONz~y4xLbtw). Xanadu documentation. Supports: Adjacent bank lifecycle workflow; version-specific. Accessed September 10, 2026 UTC.

6. Estateably. [Powers of Attorney](https://www.estateably.com/platform/powers-of-attorney). Undated. Supports: Fiduciary administration scope. Accessed September 10, 2026 UTC.

7. Estateably. [Products explained](https://support.estateably.com/en/articles/10736122-estateably-products-explained). June 3 2026. Supports: Canada qualification for POA product. Accessed September 10, 2026 UTC.

8. Trust & Will. [Partnerships](https://trustandwill.com/partnerships/). Undated. Supports: Bank and credit union estate-planning distribution. Accessed September 10, 2026 UTC.

9. Empathy. [Financial institutions](https://www.empathy.com/business/financial-institutions). Undated. Supports: Legacy planning and loss-support adjacency. Accessed September 10, 2026 UTC.

10. Bank of America. [Power of Attorney services](https://www.bankofamerica.com/signature-services/power-of-attorney/). Undated. Supports: Institution intake and durable authority after incapacity. Accessed September 10, 2026 UTC.

11. New York Senate. [GOB 5-1504](https://www.nysenate.gov/legislation/laws/GOB/5-1504). Revision shown June 18 2021. Supports: Acceptance deadlines, grounds, notices and scope limits. Accessed September 10, 2026 UTC.

12. Pennsylvania General Assembly. [Title 20 Chapter 56](https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/00.056..HTM). Consolidated statutory text. Supports: Durability, acknowledgment and acceptance rules. Accessed September 10, 2026 UTC.

13. CFPB. [Trusted contacts for financial institutions](https://files.consumerfinance.gov/f/documents/cfpb_trusted-contacts-fis_2021-11.pdf). November 2021. Supports: Trusted contact does not itself confer transaction authority. Accessed September 10, 2026 UTC.

14. OCC Federal Reserve FDIC. [Third-party risk management guide for community banks](https://www.occ.gov/news-issuances/news-releases/2024/pub-third-party-risk-management-guide-for-community-banks.pdf). May 2024. Supports: Risk-based diligence and relationship lifecycle. Accessed September 10, 2026 UTC.

15. NCUA. [Evaluating third party relationships 07-CU-13](https://ncua.gov/regulation-supervision/letters-credit-unions-other-guidance/evaluating-third-party-relationships). December 2007; marked Active. Supports: Credit union vendor due diligence. Accessed September 10, 2026 UTC.

16. NYDFS. [Multifactor Authentication](https://www.dfs.ny.gov/system/files/documents/2025/09/multifactor-authentication.pdf). September 2025. Supports: November 2025 MFA scope and exemptions. Accessed September 10, 2026 UTC.

17. NYDFS. [Guidance on managing risks related to third-party service providers](https://www.dfs.ny.gov/industry-guidance/industry-letters/il20251021-guidance-managing-risks-third-party). October 21 2025. Supports: Contracts, oversight, NPI and nondelegable covered-entity responsibility. Accessed September 10, 2026 UTC.

18. NIST. [SP 800-63B-4 Authentication Assurance Levels](https://pages.nist.gov/800-63-4/sp800-63b/aal/). Final 2025 edition. Supports: AAL2 and phishing-resistant option. Accessed September 10, 2026 UTC.

19. NIST. [SP 800-63B-4 Authenticator Event Management](https://pages.nist.gov/800-63-4/sp800-63b/events/). Final 2025 edition. Supports: Recovery and authenticator lifecycle. Accessed September 10, 2026 UTC.

20. FFIEC. [Authentication and access guidance announcement](https://www.ffiec.gov/news/press-releases/2021/pr-08-11). August 11 2021. Supports: Risk-based authentication for customers employees and third parties. Accessed September 10, 2026 UTC.

21. CISA. [StopRansomware Guide](https://www.cisa.gov/stopransomware/ransomware-guide). 2023 update. Supports: Protected backups and tested restoration. Accessed September 10, 2026 UTC.

22. W3C. [WCAG 2.2](https://www.w3.org/TR/wcag/). Recommendation. Supports: Accessible authentication, reflow, focus and target-size criteria. Accessed September 10, 2026 UTC.

23. AARP and National Alliance for Caregiving. [Caregiving in the US 2025](https://www.aarp.org/pri/topics/ltss/family-caregiving/caregiving-in-the-us-2025/). July 2025. Supports: 63 million caregiver estimate and population limitations. Accessed September 10, 2026 UTC.

24. FinCEN. [Analysis on elder financial exploitation](https://www.fincen.gov/news/news-releases/fincen-issues-analysis-elder-financial-exploitation). April 18 2024. Supports: Reported suspicious activity; not confirmed loss or addressable revenue. Accessed September 10, 2026 UTC.

25. FDIC via Federal Reserve Bank of St Louis. [Balance Sheet Number of Institutions Reporting QBPBSNUMINST](https://fred.stlouisfed.org/series/QBPBSNUMINST). Updated August 27 2026; Q2 2026. Supports: 4238 reporting institutions. Accessed September 10, 2026 UTC.

26. NCUA. [First quarter 2026 system performance](https://ncua.gov/newsroom/press-release/2026/ncua-releases-first-quarter-2026-credit-union-system-performance-data). June 9 2026; Q1 2026. Supports: 4250 federally insured credit unions. Accessed September 10, 2026 UTC.

27. Federal Reserve. [Interagency guidelines establishing information security standards](https://www.federalreserve.gov/supervisionreg/interagencyguidelines.htm). Official guidance. Supports: Customer data safeguards and provider contracts. Accessed September 10, 2026 UTC.

28. FTC. [Safeguards Rule what your business needs to know](https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know). Official guidance. Supports: FTC jurisdiction distinction. Accessed September 10, 2026 UTC.

29. NCUA. [Cyber incident reporting guide](https://ncua.gov/regulation-supervision/regulatory-compliance-resources/cybersecurity-resources/cyber-incident-reporting-guide). Official current guide. Supports: FICU reportable incidents and 72-hour maximum. Accessed September 10, 2026 UTC.

30. AICPA and CIMA. [SOC suite of services](https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services). Undated. Supports: Independent assurance framework; not self-certification. Accessed September 10, 2026 UTC.

31. Financial regulators. [Interagency statement on elder financial exploitation](https://www.fincen.gov/resources/statutes-regulations/guidance/interagency-statement-elder-financial-exploitation). December 4 2024. Supports: Risk management and reporting context. Accessed September 10, 2026 UTC.

## Internal evidence

[Continuation](P1-P2-CONTINUATION-2026-09-10.md), [MFA evidence](PRIVILEGED-MFA-TEAM-STATUS.md), [product contract](PRODUCT-SOURCE-OF-TRUTH.md), [commercial playbook](agent/COMMERCIAL.md), and inspected workspace, policy and participant-access source through commit `3644644`. The new [delivery plan](OUTREACH-READY-DELIVERY-PLAN-2026-09-10.md) carries the owner-approved next priorities.
