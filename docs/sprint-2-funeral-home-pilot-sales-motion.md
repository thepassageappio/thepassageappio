# Sprint 2: Funeral-home pilot sales motion

Goal: create one complete paid-pilot proof loop, then repeat it until Passage has a reliable path to $300k ARR.

## Revenue math

- Target ARR: $300,000
- Local plan path: 100 accounts at $249.99/mo
- Group plan path: 72 accounts at $349.99/mo
- Current pilot-health gap should be read from `/system/admin/pilot-health`, not guessed.

## Ideal first buyers

Prioritize funeral homes that match at least three of these:

- Family-owned or local group with 2-8 arrangers
- Handles enough at-need volume to feel repeated-call pain weekly
- Has one operations-minded director who cares about family communication quality
- Uses an existing case system but still coordinates families through calls, email, paper, or staff memory
- Has staff turnover, multi-location handoffs, or a need to prove what happened
- Is willing to run one real case as a controlled pilot

## Outreach sequence

1. Warm intro or local operator reference
2. Send the two-minute proof console: `/funeral-home/pilot-proof`
3. Book pilot walkthrough from the proof console CTA
4. During call, ask for one real case to mirror
5. After call, create workspace and staff owner
6. Move one case through task, family update, export, and proof
7. Ask for paid Local/Group conversion when value is visible

## Qualification questions

- Where do repeated family status calls happen today?
- Who owns follow-up after arrangements are made?
- How do staff know what is waiting on the family versus waiting internally?
- What proof do you need when a family asks what was sent, approved, or handled?
- What system must Passage export back to or avoid disrupting?
- If this saves your team calls on one real case, who decides whether it becomes paid?

## Demo path

Use this order in every founder-led demo:

1. `/funeral-home/pilot-proof`
2. Explain one workspace, one case, one task, one update, one export, one conversion decision
3. Open `/system/admin/pilot-health` to show how Passage measures pilots
4. Open `/system/admin/funeral-home-qa` to show the quality gate
5. Only then open the full workspace if the buyer wants depth

## Sprint acceptance criteria

- Proof console loads quickly and routes to booked walkthrough
- One real funeral-home workspace exists with owner, staff, location, and decision maker
- One case is created or imported
- One task moves through owner, waiting/blocker, handled, and proof states
- One family update is approved or staged with recipient/channel/proof visible
- One export/proof packet is created
- One conversion ask is made or a named blocker is captured

## Do not scale until

- The full loop is explainable without founder narration
- Pilot Health shows real usage proof, not just account existence
- The funeral-home QA checklist has no P0 blockers
- Abuse controls remain wired for public intake, telemetry, outbound delivery, and admin refresh
