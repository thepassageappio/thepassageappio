# Passage Authority — outbound content draft (cold email + LinkedIn)

**Status: DRAFT ONLY. Do not send or publish anything in this document.**
Release is gated on (1) V2-DELIVERY-ROADMAP.md confirming the product is demo-ready with no open critical/high defects, and (2) the buyer/sender review required by SALES-OUTBOUND-LAUNCH-PLAN-2026-09-05.md. Steve gives the explicit go-ahead separately.

**Date drafted:** September 6, 2026
**Prepared by:** Claude, at Steve's request — prep/drafting only, no outbound action taken.

This is independent prep work. It does not touch and does not depend on the live app or invitation-flow bug fix being worked elsewhere on this branch.

---

## 0. Relationship to the existing outbound draft

`docs/OUTBOUND-SEQUENCE-2026-09-05.md` (dated yesterday) already contains a 3-email sequence, a LinkedIn connection note, a LinkedIn follow-up, a call opener, and — critically — the governing **"Claims allowed in outreach"** and **"Claims prohibited in outreach"** lists. This document does not replace that file. It:

- Follows the same allowed/prohibited claims lists (quoted in full below, Section 1).
- Adds a 4th email touch (the existing sequence has 3).
- Adds LinkedIn **thought-leadership post drafts** and one **long-form post**, which the existing file does not include (it only has connection-request copy).
- Reuses the existing file's grandmother/granddaughter example verbatim where it appears, since that example is already approved illustrative copy, not a new claim.

Steve should decide whether to run both email sequences as A/B variants, merge them, or keep only one — that decision is out of scope for this draft.

---

## 1. Ground rules carried over from `docs/OUTBOUND-SEQUENCE-2026-09-05.md`

**Claims allowed in outreach** (quoted verbatim):
- A complete hosted synthetic request has reached an accepted-with-limits decision receipt.
- Account holders and representatives use separate expiring links without persistent participant accounts.
- The institution retains identity, legal, fraud, policy, and final-decision responsibility.
- Passage records the request, evidence status, decision scope, limits, receipt, and later changes.
- A controlled founding pilot is proposed at $5,000 for 60–90 days.

**Claims prohibited in outreach** (quoted verbatim):
- "Enterprise ready," "bank grade," "compliant," "certified," or "production proven"
- Passage verifies identity, validates legal authority, guarantees acceptance, moves money, or replaces the core
- Published ROI, cycle-time reduction, fraud reduction, or conversion claims without customer evidence
- SSO, SCIM, custom roles, broad integrations, or security certifications that are not currently delivered

**Personalization rule** (quoted verbatim): "Never invent request volume, delays, complaints, systems, regulatory findings, or executive priorities." Every `{{institution}}` / `{{first_name}}` placeholder below stays a placeholder — no invented specifics.

---

## 2. A note on positioning — what I did *not* use, and why

The task brief asked for content built on "the liability double-bind / 'defensible not just faster' positioning already established in the strategic brief." I looked for that exact framing across the repo and want to flag what I found before you read the drafts:

- The phrase **"defensible, consistent handling, not generic speed"** does exist, in `docs/V2-DELIVERY-ROADMAP.md`, under a section explicitly titled **"V3 strategic hypothesis — not a V2 capability or public claim."** That section states the persistent authority-status layer and this positioning are internal hypotheses, not yet approved for external use, pending buyer proof.
- Because of that explicit internal-only label, **I did not use "defensible, not just faster" as a verbatim public tagline** in any email or LinkedIn draft below.
- Instead, I grounded the "liability double-bind" idea in language that *is* already approved and sourced: `docs/SELLING-AND-PRICING-DECISION-BRIEF.md` states, "The operating tension is real: institutions need enough certainty to protect customers while delayed or inconsistent handling can prevent an authorized representative from helping," backed by CFPB citations in the same document. That's the real source of the "double bind" (act too slowly/inconsistently and you block a legitimate caregiver; act without enough certainty and you risk the harm regulators ask you to guard against). I use this framing throughout, cited each time.

Flagging this so you can decide — if you want the sharper "defensible, not just faster" line in public content, that needs to move from V3 hypothesis to an approved public claim first (your call, not mine to make unilaterally).

---

## 3. Cold outreach email sequence (4 emails)

**Audience:** deposit operations, member/customer operations, compliance operations, legal operations, and digital servicing leaders at regional banks and credit unions — the beachhead buyer identified consistently across `SELLING-AND-PRICING-DECISION-BRIEF.md`, `CUSTOMER-JOURNEY-AND-GTM.md`, and `OUTBOUND-SEQUENCE-2026-09-05.md`.
**Goal:** same as the existing sequence — earn a 20-minute workflow interview, not a pilot commitment.

### Email 1 — the fragmentation question

**Subject:** A quick question about POA requests at {{institution}}

Hi {{first_name}},

Millions of Americans currently rely on someone else to manage their money or property, and the CFPB publishes specific guidance both for those financial caregivers and for the institutions that work with them. [Source: `SELLING-AND-PRICING-DECISION-BRIEF.md`, CFPB citations]

Most institutions we talk with handle a power-of-attorney request through some mix of branch conversations, email, shared folders, and manual document review — which makes it genuinely hard to know, at any given moment, exactly what's been accepted, what's still missing, and who's supposed to act next. [Source: `SALES-ONE-PAGER-2026-09-05.md`; discovery questions 1–3, `SELLING-AND-PRICING-DECISION-BRIEF.md`]

I'm not assuming that's true at {{institution}} — just curious how your team currently tracks a POA request from first contact to account update. Open to 20 minutes?

Steve

### Email 2 — what a completed request looks like

**Subject:** What a finished POA decision looks like end to end

Hi {{first_name}},

Following up. Here's the concrete version of what we've built: a hosted synthetic request that walks an account holder and a representative through their own private steps, lets institution staff apply their own identity, document, fraud, and policy checks, and ends in one decision receipt — stating exactly what was accepted, limited, or declined, with account scope, permitted actions, limits, and dates. [Source: "Claims allowed in outreach," `OUTBOUND-SEQUENCE-2026-09-05.md`; `SALES-ONE-PAGER-2026-09-05.md`]

Passage doesn't decide the request — {{institution}} does. We organize the workflow and evidence around your team's decision; we don't create or notarize the POA, declare it legally valid, or replace your identity or fraud controls. [Source: "What Passage does not do," `SALES-ONE-PAGER-2026-09-05.md`]

I can walk you through the full synthetic version in about seven minutes. Want me to send a couple of times this week?

Steve

### Email 3 — the double bind

**Subject:** The two ways a POA request goes wrong

Hi {{first_name}},

In conversations with operations and compliance teams, the same tension keeps coming up: handle a power-of-attorney request too slowly or inconsistently, and you risk shutting out someone legitimately trying to help a family member. Handle it without enough certainty, and you risk exactly the kind of harm regulators ask financial institutions to guard against. [Source: "The operating tension is real..." `SELLING-AND-PRICING-DECISION-BRIEF.md`, with CFPB citations in the same document]

That's not purely a speed problem or purely a compliance problem — it's both at once, and most institutions are managing it with email threads, shared folders, and tickets. [Source: differentiation table, `SELLING-AND-PRICING-DECISION-BRIEF.md`]

Passage keeps what was asked, what was provided, and what {{institution}} decided in one current record — without making the legal call for you. [Source: "Claims allowed in outreach," `OUTBOUND-SEQUENCE-2026-09-05.md`]

Worth 20 minutes to see whether that matches what your team navigates?

Steve

### Email 4 — the close (new 4th touch)

**Subject:** Last note — a narrow pilot, not a pitch

Hi {{first_name}},

Last message from me on this thread. We're working with a small number of regional banks and credit unions to run one narrow POA workflow through Passage and measure it — elapsed time, handoffs, missing-information loops, reviewer effort, and decision consistency, all agreed before we start. [Source: "Founding pilot," `SALES-ONE-PAGER-2026-09-05.md`; "Founding pilot offer," `SELLING-AND-PRICING-DECISION-BRIEF.md`]

It's a capped $5,000 fee for a 60–90 day pilot — one institution, one named team, one approved information boundary — credited toward year one if you convert. That's a scoped pilot fee, not our list price. [Source: same as above; "Claims allowed in outreach," `OUTBOUND-SEQUENCE-2026-09-05.md`]

If POA operations aren't a priority right now, no worries at all. If they are, I'd still rather start with 20 minutes understanding your process before proposing anything. [Source: Email 3 framing, `OUTBOUND-SEQUENCE-2026-09-05.md`, reused for consistency]

Steve

---

## 4. LinkedIn short posts (3 drafts)

All three stay inside the allowed/prohibited claims lists in Section 1. None name a specific institution, customer, or competitor.

### Post 1 — the double bind

Every institution handling a power-of-attorney request is caught between two failure modes.

Move too slowly, or handle it inconsistently across branches and channels, and you risk shutting out someone who's legitimately trying to help a family member manage their finances.

Move without enough certainty, and you risk exactly the kind of harm regulators ask financial institutions to watch for. [Source: "operating tension" language + CFPB citations, `SELLING-AND-PRICING-DECISION-BRIEF.md`]

Most institutions are navigating that tension with email threads, shared drives, and tickets — tools that are familiar but don't give anyone a single current answer to "where does this request stand, and what did we decide?" [Source: differentiation table, `SELLING-AND-PRICING-DECISION-BRIEF.md`]

We're building Passage Authority to hold that record — one workflow, one institution decision, one receipt everyone can see. Passage doesn't decide the request or replace your identity, legal, or fraud controls. Your institution still makes the call. [Source: "Claims allowed/prohibited," `OUTBOUND-SEQUENCE-2026-09-05.md`; "What Passage does not do," `SALES-ONE-PAGER-2026-09-05.md`]

Curious how others are handling this today — spreadsheet, ticketing system, something else?

### Post 2 — the everyday example

A simple example we use internally: a customer wants her granddaughter to receive duplicate statements and be able to discuss account-service issues. [Source: Email 2 example, `OUTBOUND-SEQUENCE-2026-09-05.md`]

Straightforward request. Except the institution still has to confirm both people, review the document, apply its own rules, and land on something specific: which accounts, which actions, what limits, what end date.

That's usually reconstructed by hand from a document folder and a few emails. We think it should be one current record instead — one decision receipt both people and the institution can see, current for as long as the authority is active. [Source: `SALES-ONE-PAGER-2026-09-05.md`]

Passage doesn't grant credentials, approve transactions, or move money. It organizes the process around the institution's own decision. [Source: "What Passage does not do," `SALES-ONE-PAGER-2026-09-05.md`]

### Post 3 — call for pilot partners

We're looking for a small number of regional banks and credit unions to run one narrow power-of-attorney workflow through Passage Authority and measure it.

Not a platform rollout — one workflow, one named team, one approved information boundary, 60–90 days. Success measures agreed before we start: elapsed time, handoffs, missing-information loops, reviewer effort, decision consistency. [Source: "Founding pilot," `SALES-ONE-PAGER-2026-09-05.md`; `SELLING-AND-PRICING-DECISION-BRIEF.md`]

It's a capped $5,000 pilot fee, credited toward year one if you convert — not our list price. [Source: same]

If your team handles New York POA servicing and the current process runs through branches, inboxes, and shared folders, I'd like to hear how it works today — even if a pilot isn't the right next step. Comment or DM.

---

## 5. LinkedIn long-form post (blog-style)

**Working title: The power-of-attorney double bind — and why "faster" isn't the whole answer**

Every financial institution that handles power-of-attorney requests is managing a tension that doesn't get talked about enough.

On one side: millions of Americans currently rely on someone else to manage their money or property, and that number is only growing. The CFPB publishes specific guidance for these financial caregivers, and separate recommendations for the institutions that work with them — including guidance that institutions build processes for prompt decisions by qualified staff, and that frontline employees be able to identify possible abuse. [Source: `SELLING-AND-PRICING-DECISION-BRIEF.md`, citing CFPB financial caregiver guides and CFPB recommendations for financial institutions]

On the other side: every one of those requests carries real risk. Accept authority too readily, without enough certainty about who's asking and what they're actually authorized to do, and the institution has failed the exact customer it's supposed to protect.

Put those two things together and you get a genuine double bind. Move too slowly or inconsistently, and you block someone legitimately trying to help a family member. Move without enough certainty, and you risk the harm regulators are explicitly asking institutions to guard against. [Source: "The operating tension is real..." `SELLING-AND-PRICING-DECISION-BRIEF.md`]

Most institutions are managing this today with tools that were never built for it: branch conversations, email, shared drives, ticket queues, and manual document review. Those tools are familiar, and they mostly work — until someone asks a simple question that turns out to be hard to answer: *where does this specific request stand right now, and what exactly did we decide?* [Source: differentiation table, `SELLING-AND-PRICING-DECISION-BRIEF.md`]

Here's a small, concrete version of the problem. A customer wants her granddaughter to be able to receive duplicate statements and talk to the bank about account-service issues. Reasonable request. But the institution still has to confirm both people, review the document, apply its own identity, legal, fraud, and policy checks, and land on something specific — which accounts, which actions, what limits, what end date. [Source: Email 2 example, `OUTBOUND-SEQUENCE-2026-09-05.md`]

Today, that answer usually lives across a folder, a few email threads, and someone's memory of a phone call. It's reconstructed on demand, by whoever picks up the request next.

We think that answer should be one current record instead — a single decision receipt that the account holder, the representative, and the institution can all see, accurate for as long as the authority is active, and updated (not overwritten) the moment something changes.

That's what we're building at Passage Authority: a guided workflow for power-of-attorney intake, institution review, decision, and lifecycle — starting with New York deposit-account servicing at regional banks and credit unions. [Source: `SALES-ONE-PAGER-2026-09-05.md`; "Initial ICP," `SELLING-AND-PRICING-DECISION-BRIEF.md`]

To be direct about what this is not: Passage doesn't create or notarize a power of attorney, doesn't declare a document legally valid, doesn't replace an institution's identity or fraud controls, doesn't grant account credentials, and doesn't approve transactions or move money. The institution keeps the final legal and operational decision, every time. Passage organizes the evidence and the workflow around that decision — it doesn't make it. [Source: "What Passage does not do," `SALES-ONE-PAGER-2026-09-05.md`]

We're now working with a small number of regional banks and credit unions on a narrow, capped pilot — one workflow, one named team, 60–90 days, success measures agreed before we start. If your institution is navigating this same tension, I'd genuinely like to hear how you're handling it today, pilot or no pilot. [Source: "Founding pilot," `SALES-ONE-PAGER-2026-09-05.md`]

---

## 6. Claims I considered and deliberately excluded

- **"Defensible, not just faster" / "defensible, consistent handling"** — exists only in `V2-DELIVERY-ROADMAP.md` under a section explicitly marked as an internal V3 hypothesis, not a public claim. Not used verbatim anywhere above. See Section 2.
- **Named competitor comparisons (e.g., the TrustElevate reference in `SELLING-AND-PRICING-DECISION-BRIEF.md`)** — that document itself says to "confirm each named competitor's boundary from primary evidence before using this comparison externally." That verification hasn't happened, so no named competitor appears in any draft. Competitive framing above stays generic ("email, tickets, shared drives, spreadsheets"), which is already an approved comparison in the same document's differentiation table.
- **Any ROI, cycle-time-reduction, fraud-reduction, or conversion statistic** — none exist in the source docs, and they're explicitly prohibited in `OUTBOUND-SEQUENCE-2026-09-05.md`. None appear above.
- **"Enterprise ready," "bank grade," "compliant," "certified," "production proven"** — explicitly prohibited; not used.
- **Any specific institution name, request volume, complaint count, or executive priority** — never invented; every draft uses `{{institution}}` / `{{first_name}}` placeholders only, per the personalization rule.
- **The V3 "persistent authority-status layer" category vision** — internal hypothesis only (`V2-DELIVERY-ROADMAP.md`), excluded from all outbound and social copy.

Nothing above should be read as resolving these exclusions — they're flagged for Steve's call, not silently worked around.
