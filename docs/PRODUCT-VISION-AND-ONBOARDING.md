# Passage Authority product vision and onboarding

**Decision:** Passage Authority is the shared operating workspace a financial institution uses to receive, review, decide, and maintain one delegated-authority request. It does not create a power of attorney, replace legal review, or decide whether an institution must accept one.

## Who uses what

| Person | Product experience | Account required | What they can do |
| --- | --- | --- | --- |
| Institution owner | Persistent organization workspace | Yes | Set up the workspace, invite the team, start requests, assign access, and manage the evaluation or pilot |
| Institution administrator or staff | Persistent organization workspace | Yes | Start and coordinate requests according to the assigned role |
| Institution reviewer | Persistent organization workspace | Yes | Review evidence, request missing information, record the institution decision and limits, and view the saved history |
| Institution auditor | Read-only organization workspace | Yes | Inspect requests, receipts, and activity without changing them |
| Account holder | Request-specific guided experience | No | Confirm the people, purpose, and request details through an expiring secure link |
| Representative | Request-specific guided experience | No | Accept the role, provide requested evidence, respond to questions, and view the receipt through an expiring secure link |

Institution users need accounts because they return to a shared queue, handle multiple requests, and require organization-level access control. Account holders and representatives should not face account creation for a single request; their access is narrow, time-limited, role-bound, and recoverable through a new link.

## The complete first-use journey

1. A qualified institution visitor requests a demo or starts the controlled evaluation.
2. The institution owner verifies access, names the workspace, and sees a short explanation of the product boundary.
3. The owner invites only the teammates needed for the sample workflow.
4. Passage preloads a synthetic request so the owner enters only controlled participant inboxes.
5. The account holder opens a secure link, sees why they were contacted, confirms the request, and is told exactly what happens next.
6. The representative opens a separate secure link, accepts responsibility, provides the requested information, and can recover access without restarting.
7. The institution reviewer sees a concise case summary, requests missing information if needed, and records the institution's decision and any limits.
8. Every party sees the same saved receipt and later status change; the institution retains the final decision and its existing systems remain authoritative for account servicing.

## The product promise

Passage turns a fragmented POA handoff into one guided request, one institution-owned decision, and one current receipt. Participants do not need training or accounts. Reviewers see the information and limits that matter without reconstructing the story from email. Every material action is saved in order so the institution can explain what happened and connect the result to existing systems.

## The four demo moments

1. **Immediate comprehension:** the prospect can describe Passage after the first screen: “It coordinates a POA request and records our decision.”
2. **Participant ease:** both people complete their part from a secure link without an account, product training, or unexplained terminology.
3. **Institution control:** the reviewer can ask for information, accept with limits, reject, and later record a lifecycle change without losing the earlier decision.
4. **Shared truth:** all parties see the same receipt while the institution keeps control of legal and operational acceptance.

## Onboarding success criteria

- A new owner reaches the sample request in three minutes or less without assistance.
- The owner knows the evaluation uses synthetic data before entering the workspace.
- The owner understands who needs an account and who receives a secure link.
- The first sample request is activated in five minutes or less.
- Each participant can state what they are confirming, who will see it, what happens next, and how to recover access.
- The reviewer reaches the decision controls without reading the full activity history.
- The full four-person demo, including a saved receipt and revocation, completes in seven minutes or less.
- No screen exposes raw IDs, internal state names, database language, unsupported security claims, or implied legal conclusions.

## Product boundary for the first pilot

The first pilot serves one New York financial-POA workflow for one institution team. It proves coordination, evidence collection, institution decisioning, current receipts, and integration handoff. It does not move money, open accounts, create legal documents, automate legal judgment, replace a core system, or guarantee acceptance.

## What comes next—and what does not

The next product work is a resettable demo, independent persona UAT, negative-path proof, trust and operating evidence, and a hosted-first integration quickstart. Stripe test billing and HubSpot follow those gates. A second delegated-authority wedge is considered only after the POA journey is independently repeatable, commercially understandable, and validated by design partners.
