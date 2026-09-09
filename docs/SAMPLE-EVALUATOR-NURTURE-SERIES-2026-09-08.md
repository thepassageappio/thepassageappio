# Sample evaluator nurture series

**Audience:** a verified website visitor who explicitly accepts consent version `sample-access-contact-2026.2` at the gated sample.

**Attribution:** canonical source `website_sample_gated`; HubSpot label `Website - Gated Sample`; program `sample_evaluator`.

**Current state:** enrollments are recorded as `held_until_p1_p2`. No message may send until P1 and P2 are both closed and a controlled campaign release has passed suppression, unsubscribe, sender-domain, link, mobile, and mailbox-delivery checks.

## Activation behavior

Release changes the enrollment status through a new audited event. It does not edit the original consent or enrollment event. Cadence starts from the release timestamp for contacts still eligible at release; it does not backdate from the original opt-in or send a burst of overdue messages. Unsubscribed, suppressed, bounced, complained, or otherwise ineligible contacts remain excluded. Every message includes a working unsubscribe path and identifies Passage as the sender.

## Sequence

### Message 1 — release day

**Subject:** Your Passage sample workflow

You can return to the fictional Passage workflow here: [sample link].

It shows one delegated-authority request moving through separate steps for the account holder, representative, and financial institution. The institution reviews the evidence, decides the permitted scope, and preserves the decision receipt.

[View the sample]

### Message 2 — two days later

**Subject:** Where authority requests usually lose clarity

The hard part often begins after a power of attorney reaches the institution: who must act next, what is still missing, what the institution accepted, and what changed later.

Passage gives the institution one operating record for intake, evidence, review, scoped decision, and lifecycle history. It does not approve the document, verify identity, grant access, or move money.

[See the completed example]

### Message 3 — five days later

**Subject:** A decision both sides can understand

The sample ends with an institution decision that separates what is permitted from what remains excluded. The account holder and representative receive the same bounded result, while the institution retains its review record and decision history.

[Review the sample receipt]

### Message 4 — nine days later

**Subject:** Would this fit your authority workflow?

If delegated-authority requests are handled through email, branch handoffs, shared folders, or case notes today, a 20-minute walkthrough can test whether Passage fits the workflow and where it does not.

[Book a 20-minute walkthrough]

## Measurement

Measure enrollment, activation, delivered, bounced, complained, unsubscribed, sample-return, receipt-view, walkthrough-click, and walkthrough-booked events by canonical acquisition source and consent version. Keep these commercial events separate from authority, participant, evidence, and institution-decision data.
