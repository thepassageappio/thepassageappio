# Passage market wedge, distribution, and moat

**Date:** 2026-07-15  
**Status:** Founder strategy input incorporated  
**Companion:** `PASSAGE-GREENFIELD-PRODUCT-CONSTITUTION.md`

## Strategic conclusion

Passage will not depend on consumers adopting a generic pre-planning application before a death. The initial wedge is the moment an existing care or death-care professional already has the family’s attention and must coordinate a real handoff.

The launch model is B2B2C:

1. A funeral home, hospice, senior-living organization, estate professional, insurer, or employer introduces Passage inside an existing trusted relationship.
2. Passage reduces operational work for the professional.
3. The family receives a calm, controlled companion experience without needing to discover or learn a standalone death-tech product in crisis.
4. The resulting estate record becomes the continuity layer across later organizations and tasks.
5. Planning-ahead and legacy features become earned retention products after trust exists.

## Product wedge

### Sell to funeral homes

The sellable product is an operating layer that improves:

- family intake quality;
- time to a complete arrangement file;
- visibility into who is waiting on whom;
- staff ownership and escalation;
- consented information transfer;
- family approval and proof history;
- standardized exports and intake packets;
- family communication quality; and
- the modern credibility of the funeral home.

The Director Briefing, employee console, Transfer Pass, and Case Chronicle are the first product—not checklists.

### Serve families

Families are not asked to operate a funeral-home case-management system. They receive a focused companion that:

- identifies one next decision;
- explains the consequence of acting or waiting;
- separates required from optional information;
- lets relatives divide work safely;
- shows who can see what;
- preserves human contact with the funeral home; and
- creates a useful record after the immediate service.

D2C remains a product channel, but it is not the sole acquisition engine.

## Integration posture

Passage must be valuable before deep integrations and increasingly defensible after them.

### Phase 1: coexist

- Standardized intake packet.
- CSV/PDF export.
- Secure Transfer Pass.
- Calendar/contact interoperability.
- No duplicate entry for information already held by the family.
- A funeral home can use Passage without replacing its licensed/compliance system.

### Phase 2: connect

Build adapters for the systems actually used by pilot partners. Prioritize based on signed demand, not a speculative integration catalog.

- case creation and status;
- contacts and roles;
- service dates and locations;
- documents and approvals;
- task/owner synchronization; and
- event webhooks.

### Phase 3: replace selectively

Passage may replace workflow, family communication, intake, vendor coordination, and operational reporting where it is clearly better. Licensed recordkeeping, accounting, payments, and jurisdiction-specific forms are replaced only when the product, insurance, controls, and verified requirements support it.

Every integration is event-driven around a stable Passage estate/case identity. Vendor-specific identifiers live in an integration mapping layer, not inside core domain records.

## Compliance strategy

Compliance is a product and architecture capability, not marketing copy.

- Maintain a claims register for every legal, medical, privacy, retention, pricing, and authority statement.
- Do not publish a claim until it has an authoritative source, jurisdiction, effective date, reviewer, and expiration/reverification date.
- Build a jurisdiction policy layer so required fields, disclosures, approvals, and document states can vary without forking the whole product.
- Preserve append-only evidence for material consent, access, approval, handoff, and pricing events.
- Treat the funeral home as the professional decision-maker; Passage supports workflow and proof but does not present itself as legal authority.
- Obtain specialist review, security review, insurance, incident procedures, and data-processing contracts before real customer data.

The Transfer Pass is a scoped technical handoff until verified language establishes any additional meaning.

## Economics

### Primary revenue

Recurring funeral-home and organization subscriptions based on locations, active cases, staff, and integration/service level. Family access to the partner-supported case is included.

### Expansion revenue

- multi-location and group operations;
- advanced integrations;
- white-label/co-brand controls;
- implementation and data migration;
- reporting and quality programs;
- employer, insurer, hospice, and senior-living distribution contracts; and
- optional family continuity products after the urgent case.

### Guardrails

- No grief-timed dark patterns.
- No paywall that blocks a family from accessing or revoking information already entrusted to Passage.
- Vendor economics are disclosed and never distort a family-facing recommendation.
- Marketplace/referral revenue is secondary until trust and conflict controls are proven.
- Charitable commitments are not used as a substitute for sound unit economics or transparent pricing.

## Defensibility

Generic checklists are not the moat. The moat is the trusted coordination network and its operating data:

- one portable family-controlled estate record;
- purpose-built workflows for each participant;
- consented handoffs between organizations;
- integration mappings and operational events;
- permission and proof history;
- deterministic process quality;
- partner distribution;
- jurisdiction-aware policy infrastructure; and
- measured improvement in time, completion, satisfaction, and error rates.

Do not sell or exploit sensitive family data. Aggregate insights require strict privacy review, minimum cohort rules, contractual clarity, and an explicit value case.

## Human and cultural model

Passage augments human care. It does not try to automate grief.

- Directors remain visible and reachable.
- Families may choose phone, in-person, paper, QR, manual code, or assisted entry.
- Language supports traditional services, personalization, cultural/religious practices, cremation, burial, and emerging sustainable options without privileging one.
- Staff training and implementation are part of the enterprise product.
- Camera scanning, app installation, and smartphone ownership are never required for a critical path.

## Distribution sequence

1. Independent funeral homes with a motivated owner/director and visible technology gap.
2. Hospice and senior-living handoffs into those funeral-home partners.
3. Multi-location groups after the single-location operating model is proven.
4. Estate planners, financial advisors, employers, insurers, and benefit platforms.
5. Broader D2C acquisition after Passage has trust, partner density, and an earned continuity product.

Content and social distribution should normalize preparation and explain choices, not lead with fear.

## Validation program

The sandbox demo is a research and sales instrument, not proof of product-market fit.

### Partner discovery

Interview and observe directors, arrangers, administrators, hospice coordinators, and aftercare staff. Map:

- duplicate entry;
- missing information;
- approval delays;
- staff handoffs;
- family calls;
- status uncertainty;
- vendor coordination;
- compliance documentation; and
- software boundaries.

### Family research

Use ethically recruited, compensated participants with grief-sensitive protocols. Do not require recently bereaved people to relive experiences for an unmoderated usability study.

Test comprehension, control, emotional tone, family-role conflicts, accessibility, paper/manual alternatives, and willingness to use a funeral-home-provided experience.

### Pilot measurements

- time from first call to complete intake;
- missing-field and rework rate;
- family decision turnaround;
- staff touches per case;
- unreturned-call volume;
- time a case remains blocked;
- family comprehension of next action;
- pass issue-to-accept completion;
- security/permission failures;
- family and staff satisfaction;
- partner weekly usage, retention, and expansion intent; and
- implementation/support cost per location.

Testimonials do not replace measured operational outcomes.

## Product boundaries

Do not prioritize as the initial wedge:

- standalone generic checklists;
- VR memorials;
- broad grief communities;
- speculative AI memorial generation;
- a large consumer marketplace;
- nationwide licensed compliance replacement; or
- monetizing family data.

Memorial, legacy, sustainable-disposition, benefits, and community capabilities remain possible expansions when they strengthen the continuity record or partner distribution.

## Immediate roadmap implications

1. Build the resettable funeral-home sales sandbox.
2. Demonstrate Director Briefing → family Transfer Wallet → staff accept → intake packet → revoke.
3. Add an integration boundary and canonical external-identifier model before the first vendor-specific adapter.
4. Create the jurisdiction/claims register before production copy or real cases.
5. Create a pilot instrumentation plan before recruiting partners.
6. Price only after quantified workflow value and implementation cost are measured.
