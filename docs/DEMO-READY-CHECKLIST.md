# Passage Authority demo and persona UAT

**Target:** sellable synthetic enterprise demo this week  
**Demo promise:** one financial POA request moves from intake to a shared institution decision, with each person seeing one clear next step and the same later changes.

## Demo-ready exit criteria

- A presenter can reset and complete the demo without database access or developer help.
- The core story takes seven minutes or less, excluding optional questions.
- Institution owner, account holder, representative, and reviewer use separate browser profiles or devices.
- Every page states the current status and next action in plain language.
- No real person, account, institution, document, or payment data is used.
- The account holder and representative receive separate messages and can perform only their own actions.
- The representative uploads two sample files, responds to one institution question, and sends the request for review.
- The institution records an acceptance with limits.
- All three people see the same receipt code, outcome, accepted actions, limits, and revocation.
- Reused links, wrong-role access, stale submission, rejection, withdrawal, expiration, and session recovery pass without duplicate actions or lost history.
- Desktop, 390px, and 360px layouts have no horizontal overflow; primary actions meet the 44px target and full keyboard traversal works.
- Browser console, production logs, email delivery state, and saved activity show no unexplained errors.

## Seven-minute demo story

| Time | Persona | Show | Proof point |
| --- | --- | --- | --- |
| 0:00–0:45 | Buyer | Homepage and one-sentence problem | Passage gets a POA request to a clear institution decision |
| 0:45–1:30 | Institution owner | Create and send a sample request | Guided setup; nothing is sent before review |
| 1:30–2:15 | Account holder | Open secure link and confirm | No password; exact people, account, and requested actions are visible |
| 2:15–3:30 | Representative | Accept, upload sample files, and certify | One requirement at a time; clear sharing boundary |
| 3:30–4:15 | Reviewer | Review files and request one clarification | Institution rules and human judgment remain in control |
| 4:15–5:00 | Representative | Answer and send for review | Saved answers survive a new secure session |
| 5:00–6:00 | Reviewer | Accept with limits | Outcome, accepted actions, and limits are explicit |
| 6:00–7:00 | All roles | Compare receipts and record revocation | Same current result, saved history, and later change |

## Owner-run UAT evidence sheet

For each step record the profile/device, URL, start and finish time, visible status, expected next action, email result, receipt code, and any defect. A critical defect exposes data or permits an unauthorized decision. A high defect blocks the journey or produces mismatched state. Demo readiness requires zero open critical or high defects.

## Reset requirement

The reset action must create a fresh synthetic organization, owner, account holder, representative, sample account boundary, two harmless test files, and unused invitation links. It must not reuse a prior participant session, touch production customer data, or require a manual SQL edit. Until that action exists, the demo remains engineering-assisted.
