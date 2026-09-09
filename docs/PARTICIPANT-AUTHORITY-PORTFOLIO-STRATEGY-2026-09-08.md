# Participant authority portfolio strategy

**Status:** validated product direction and architectural requirement; not implemented, not a V2 launch gate, and not an approved public claim.

## Decision

Passage should support an optional persistent participant account after the institution-first Authority workflow is stable. The account becomes a private portfolio of authority relationships and institution decisions:

- a principal sees the people who claim or hold authority for them;
- a representative sees the people they represent;
- each person sees the receiving institution, bounded account or relationship, requested actions, institution-accepted actions and limits, request state, effective period, and next owner;
- both can retrieve the immutable receipt and follow later lifecycle events they are permitted to see.

This restores the strongest reusable idea from the earlier Passage funeral-home product: a person-controlled continuity record with purpose-bound participation and auditable handoffs. In Authority, the durable unit is an authority relationship plus separate institution recognition cases. The portfolio must not become a universal legal-authority registry or suggest that one institution's decision binds another.

## Four truths that must remain separate

The interface must never collapse these into one ambiguous `active` badge:

1. **Source authority:** the document, appointment, mandate, or other claimed basis and its stated effective conditions.
2. **Passage relationship:** the principal and representative are linked for a named purpose after the required participant confirmations.
3. **Institution recognition:** a named institution has accepted, limited, rejected, or not yet decided a particular request for a particular account or relationship.
4. **Downstream access:** the institution's banking, servicing, mobile, call-center, branch, or transaction system has acknowledged an entitlement change.

Safe labels include `Under review at Bank A`, `Accepted with limits at Credit Union B`, and `Access setup acknowledged`. `Active authority` is insufficient unless the screen names which of the four states it means.

## Participant experiences

### Principal: People acting for me

The principal can see:

- representative name and verified contact state;
- authority source and effective period;
- each institution and bounded account/relationship;
- requested, accepted, limited, rejected, and unavailable actions;
- current institution review or downstream-acknowledgment state;
- receipt, last material change, and next action;
- controls to report a problem, revoke the Passage relationship where applicable, notify institutions, or invite another institution to begin its own review.

Revoking or reporting in Passage creates a timestamped notice and workflow. Passage may show a downstream state as changed only after the receiving institution or integration acknowledges it.

### Representative: People I help

The representative can see:

- each principal they represent;
- the authority source, time period, and scope they are permitted to see;
- institutions where review has not started, is pending, or has reached a decision;
- institution-specific limits and available channels;
- missing evidence, expiring items, requested follow-up, and next action;
- receipts and later changes.

The representative always uses their own identity and credentials. Passage never directs them to use the principal's login.

## Invitations and reuse

A principal may invite a representative into an authority relationship. A principal or representative may introduce a receiving institution, subject to consent and abuse controls. An introduction creates a new institution-specific recognition case; it does not copy another institution's acceptance.

Passage may reuse verified facts and approved artifacts when all of the following are true:

- the participant gives recipient-specific consent;
- the item is still current under the receiving institution's effective policy;
- the minimum necessary fields are disclosed;
- provenance, source, prior review, and freshness are visible;
- the receiving institution independently accepts, rejects, limits, or requests replacement evidence.

An institution can also initiate a case and invite both participants, as it does today. Duplicate detection should offer to attach the new case to an existing participant portfolio only after secure identity binding; email equality alone cannot merge people.

## Why this creates a flywheel

One authority relationship often touches several banks, credit unions, insurers, investment firms, utilities, government services, and later estate or end-of-life providers. Each successful institution-specific case gives the family one more current receipt and gives the next institution a cleaner, consented starting packet. Each institution introduced by a participant becomes a potential organization customer; each institution customer introduces more principals and representatives.

The earlier funeral-home thesis was `one family-controlled record -> bounded handoff -> destination acknowledgment -> next handoff without re-keying`. Authority can use the same mechanism. A representative already helping a parent with financial institutions may later coordinate an insurer, elder-law professional, care provider, funeral home, or estate administrator. That adjacency should be validated after the financial-institution wedge works. The retired funeral-home application should not be revived or mixed into the current product.

The defensible asset is the permissioned graph of relationships, institution-specific decisions, lifecycle events, and acknowledged handoffs. Sensitive participant data is never the moat and must not be reused for advertising or unrelated sales.

## Minimum durable model

Current participant sessions are invitation-bound and authority-record-bound. They are intentionally insufficient for a portfolio. Future work should add stable objects rather than stretching those sessions across records:

| Object | Purpose |
| --- | --- |
| `party` | Stable Passage person identity with verified identifiers and merge history |
| `participant_account` | Optional persistent login, recovery, MFA, security events, and preferences |
| `authority_relationship` | Principal, representative, source, purpose, validity, and relationship lifecycle |
| `relationship_membership` | Viewer role and permitted projection of the relationship |
| `institution_recognition_case` | One institution's independent request, review, decision, and account boundary |
| `scope_snapshot` | Immutable requested and institution-accepted actions, limits, channels, and policy version |
| `consent_grant` | Recipient, purpose, disclosed fields/artifacts, expiry, revocation, and text version |
| `downstream_entitlement_state` | Requested, acknowledged, failed, revoked, and last-confirmed integration state |

Existing `authority_records`, participant invitations, sessions, decisions, receipts, and events can later map into these objects. No migration should merge people solely by normalized email, and no portfolio query may cross an institution or participant visibility boundary without a purpose grant.

## Phased delivery

### Phase A — claim and retain receipts

After completing a request, offer `Save this Passage record`. Create an optional participant account through verified, step-up-protected account claiming. The account shows the participant's own completed and in-progress Passage cases and receipts. Existing expiring-link access remains available.

### Phase B — relationship portfolio

Group cases by principal–representative relationship. Add the two dashboard views, status vocabulary above, lifecycle notifications, consent management, correction, export, and account recovery. Prove duplicate-person resolution, wrong-party denial, shared-device logout, coercion/reporting recovery, and minimum-disclosure behavior.

### Phase C — introduce another institution

Allow a permitted participant to invite or nominate a receiving institution. Passage creates a new case, routes it to a verified organization or controlled intake path, and shows delivery and acceptance receipts. Add rate limits, invite-abuse controls, institution verification, and a named recovery owner for undelivered or declined introductions.

### Phase D — portable, reusable authority network

Reuse approved evidence with freshness and recipient-specific consent, add qualified integrations, and extend to adjacent professional or end-of-life workflows only after pilot evidence supports them. A portable credential or broad `authority wallet` claim requires separate legal, security, recovery, and market validation.

## Launch and positioning decision

The initial institution-facing launch should remain focused on making one institution's POA review clear, consistent, and auditable. The portfolio is a strong V3 differentiation and retention hypothesis; it should influence the data model now and enter discovery questions, but it should not delay the current policy-control-plane, five-state, reconciliation, recovery, backup, security, and counsel gates.

Do not add this capability to the website, demo, one-pager, pricing, outreach, or LinkedIn copy until at least Phase A exists and passes multi-persona production-like QA. Before implementation, validate demand and willingness to adopt with principals, repeat representatives, operations leaders, elder-law professionals, and privacy/counsel reviewers.

## Evidence required before any public claim

- one participant securely claims two unrelated Passage cases into one account without email-only auto-linking;
- principal and representative projections reveal only their authorized fields;
- institution A's decision is never presented as institution B's decision;
- revocation/reporting sends durable notices but does not claim downstream removal before acknowledgment;
- invite abuse, duplicate identity, lost-device, deceased/incapacitated principal, and account-recovery paths fail safely;
- consented evidence reuse records recipient, purpose, disclosed fields, version, freshness, and receipt;
- desktop, 390px, 360px, keyboard, screen-reader, and two-browser replays pass.

## Market-validation note

The underlying behavior is established in adjacent systems. Fidelity lets account owners review people they have granted account access and distinguishes inquiry, limited, full, and POA authority. SAP's banking-authority product models principals, representatives, accounts, permitted activities, approval rules, validity, implementation status, and change history. These examples support the usefulness of a structured authority overview; they do not prove demand for Passage's cross-institution participant portfolio.

Sources:

- [Fidelity account access rights](https://www.fidelity.com/customer-service/account-access-rights-overview)
- [SAP powers of attorney for banking transactions](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/ac319d8fa4ea4624b40a58d23e3c4627/adacf4735eaf46acafc69847fc019cd2.html)
