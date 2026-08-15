# Passage product-direction session

Status: internal product doctrine and alignment session. This is not a roadmap and does not replace the canonical owner roadmap. It explains the direction that should govern prioritization and product decisions.

## Session outcome

Align the team around one category-defining direction:

> Passage is the person-centered continuity and proof layer for the transitions before, during, and after a death.

Passage follows the person and the permitted purpose across planning, nursing/hospice/care, family coordination, funeral-home operations, service partners, disposition, aftercare, and later estate work. It does not belong to one stakeholder and does not make one organization's membership the source of everyone else's access.

The goal is to become indispensable because Passage removes repeated intake, missing context, invisible waiting, fragmented communication, and unproven completion at every handoff. Indispensability comes from better outcomes and interoperability, not data lock-in.

## 1. The problem we own

Each stakeholder has software, messages, documents, and internal processes. The family still becomes the human integration layer:

- Retelling the same facts.
- Finding and resending the same documents.
- Chasing people for status.
- Translating between professional teams.
- Remembering who promised what.
- Wondering whether an important action actually happened.

Traditional systems optimize one institution. Passage optimizes continuity between people and institutions.

## 2. The category we are building

Passage is not another funeral-home ERP, memorial website, family checklist, marketplace, or generic group chat. It is a coordination operating layer with five inseparable properties:

1. One continuity record with viewer-relative, permissioned projections.
2. One task/event/proof vocabulary across every persona and integration.
3. Purpose-bound handoffs with sender, recipient, scope, expiry, provenance, and acceptance.
4. Human-reviewed prepared work that reduces effort without fabricating execution.
5. Visible proof and recovery: what happened, who did it, when, who can see it, what failed, and who acts next.

## 3. The end-to-end Passage journey

```text
planning individual
  -> names people, wishes, documents, and sharing rules
  -> care or nursing/hospice team prepares a bounded handoff
  -> family sees one next action and what professionals are handling
  -> funeral home accepts responsibility at a named location
  -> director assigns commitments across eligible employees
  -> task-bound updates, decisions, and proof move between permitted people
  -> service partners receive only bounded requests
  -> family receives verified outcomes rather than operational noise
  -> aftercare and later estate work continue from the same history
```

At each arrow Passage must answer:

- Who owns this now?
- Who is waiting?
- What does the recipient actually need?
- What did Passage prepare?
- What must a human review or do?
- What was sent, delivered, read, or verified?
- What proof is saved?
- Who can see it?
- What happens next?
- Who recovers the handoff if it fails?

## 4. Potentially ownable product assets

### The continuity record

A stable Passage record follows the person while external identifiers are mapped per organization. It preserves provenance and never merges records blindly.

### Transfer Pass and handoff manifest

A portable, revocable, expiring package of approved facts, documents, contacts, open commitments, and purpose. Acceptance creates a receipt for both sides and a named next owner.

### The coordination proof spine

Every assignment, decision, message, prepared output, delivery receipt, proof review, correction, integration attempt, and escalation extends one typed event history. Realtime accelerates the view; it never replaces durable truth.

### Grief-aware work compression

Passage minimizes what a grieving person must understand and remember. Families receive one humane next action plus reassurance about what is already coordinated. Operators retain workload, routing, risk, and exception depth.

### Prepared outcomes

Passage prepares useful work: summaries, family updates, requests, comparisons, packets, form fields, checklists, and escalations. Consequential external work remains review-before-send until a later automation has explicit authority and reliable recovery.

### Coordination health

Funeral-home leaders see family-wait time, unowned work, staff load, blocked handoffs, proof gaps, delivery failures, and integration exceptions early enough to act. Aggregate measures should prove time saved and follow-ups avoided without turning family grief into a score.

### Neutral integration rails

Passage connects with existing care and funeral-home systems rather than trying to replace them immediately. Every adapter exposes its mapping, destination identifier, version, last attempt, receipt, failure, retry, and recovery owner.

## 5. Strategic boundaries

We will:

- Be person-centered and stakeholder-agnostic.
- Preserve independent family, organization, location, participant, and partner permissions.
- Make the funeral director's daily operations excellent because funeral homes are the distribution wedge.
- Make the family projection calmer and simpler than the operator projection.
- Let bounded participants contribute without implying authority.
- Keep communication attached to the related task, decision, request, or proof.
- Build portable access, revocation, correction, and export paths.
- Use sensitive information only for the permitted service purpose.

We will not:

- Compete on an undifferentiated funeral-software feature checklist.
- Build a detached social feed or generic group chat.
- Claim an output was sent, delivered, read, synchronized, or verified without durable evidence.
- Broaden family access from funeral-home membership.
- Turn private family data into the moat.
- Start broad vendor fulfillment before organization, location, ownership, and scoped request authority are coherent.
- Replace accounting, body tracking, forms, or every vertical system before the coordination layer is proven.

## 6. Near-term operating sequence

The next four sprints prove the direction in increasing end-to-end depth:

1. **Identity and authority:** separate safety/demo data plane; Google/email identity; invitations; organization/location membership; RLS; durable assignment; server audit.
2. **Funeral home to first owned case:** organization/location onboarding; required address typeahead; team invites; Transfer Pass/manual intake; routing; workload; assignment.
3. **Daily case operations:** authenticated `Now · Tasks · Updates · Proof`; task-bound realtime coordination; proof review; notifications/recovery; integration job truth.
4. **D2C continuity:** durable planning/urgent onboarding; family and participant grants; recovery; Transfer Pass; funeral-home acceptance; family-safe proof return.

Operational readiness increases only when the related flow passes across two authenticated sessions with RLS denial tests, idempotency, reload/reconnect, failure recovery, authoritative timestamps, and desktop/390/360 QA.

## 7. North-star measures

Measure whether Passage reduces coordination burden and improves service reliability:

- Time from funeral-home sign-in to a correctly owned first case.
- Time from employee invitation to first assigned action.
- Time from family handoff to named funeral-home acceptance.
- Family wait time without a visible owner or next step.
- Percentage of active commitments with owner, waiting party, audience, due state, and proof destination.
- Percentage of required proofs verified or in a named recovery state.
- Duplicate intake fields and manual re-entry avoided per case.
- Messages/calls avoided because a trusted status or receipt was already visible.
- Notification and integration failures recovered within the promised window.
- Director and employee time saved per case, measured in pilot use rather than estimated from screens.
- Family comprehension: can the person state what happens next and who owns it without assistance?

## 8. Product-decision filter

Before adding a feature, ask:

1. Does it strengthen continuity across a real handoff?
2. Does it reduce the number of things a grieving person or operator must hold in mind?
3. Does it clarify owner, waiting party, audience, proof, and next action?
4. Can it extend the existing task/event/proof spine?
5. Is the authority server-derived and independently testable?
6. Does failure have a visible recovery path?
7. Does it improve Passage's neutral coordination layer without unnecessarily replacing a stakeholder's system?

If the answer is mostly no, it should not displace the operational sequence.

## 9. Session close

The product vision is not “put the funeral process online.” It is:

> No family should have to carry the entire transition in their head, and no professional should have to guess whether the right person has the right information, responsibility, or proof.

Passage earns the right to become the glue by making every transition lighter for the person, clearer for the professional, and trustworthy for everyone with permitted access.
