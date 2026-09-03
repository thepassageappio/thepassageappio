# Passage Authority demo and persona UAT

**Target:** sellable synthetic enterprise demo this week  
**Demo promise:** one financial POA request moves from intake to a shared institution decision, with each person seeing one clear next step and the same later changes.

## Demo-ready exit criteria

- A presenter can prepare and complete a fresh demo run without database access or developer help.
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

## Fresh-run requirement

The preparation action must create a fresh namespaced run and request inside the presenter's existing isolated Demo organization, with a fictional account holder, representative, sample account boundary, two harmless test files, and unused invitation links. It must not change organization membership, reuse a prior participant session, delete earlier evidence, touch production customer data, or require a manual SQL edit.

### Current reset evidence

- The hosted Demo offers **Prepare a fresh demo** only to an authenticated owner or administrator whose exact email is in the server-side presenter allowlist. Outside Demo, the control is absent and the command returns the same generic not-found boundary as a nonexistent route.
- One command creates a new organization-scoped run, sample request, and immutable evidence without sending messages, consuming usage, deleting an earlier run, changing membership, or affecting another presenter's organization.
- The institution workspace now exposes **Start a sample request** as a first-class action.
- The sample form preloads fictional participant names, account boundary, actions, and end date while leaving both inboxes blank so the presenter must choose controlled inboxes.
- Saving creates a new durable request and activation creates new role-bound invitation records; it does not reuse a prior participant session.
- The public site has no horizontal overflow at 390px or 360px across the homepage, About, Contact, Resources and all three articles, Integrations, Security, Pricing, Pilot, Templates, and evaluation entry.
- Two approved fictional PDFs are downloadable from the sample form and match its preloaded participants and account boundary.
- The hosted action, migration, and exact presenter allowlist are deployed. An authenticated owner created a fresh draft at desktop width and verified the notice, next action, session recovery, and controls at 390px and 360px.
- A complete fresh hosted run now passes activation, principal confirmation, representative acceptance, two browser uploads, institution correction, replacement upload, representative disclosure, institution decision, matching three-party receipts, and revocation. The database independently matches the browser result and usage count.
- Remaining before presenter sign-off: the owner rehearses the same story in seven minutes or less with independent browser profiles or devices and records inbox placement. No product-state blocker remains in the tested happy path.
- The older SQLite demonstration UI and API are now code-gated to development and test mode. The enterprise demo must use the authenticated hosted organization flow; a production request cannot switch synthetic roles, reset the shared SQLite store, or open its local review queue.

### P0 negative-path status

| Case | Automated durable proof | Still manual in hosted Demo |
| --- | --- | --- |
| Wrong role | A principal session cannot perform the representative action; institution staff cannot request information. Request state, events, decisions, and usage remain unchanged. | Confirm the plain-language denial from separate participant and staff browser profiles. |
| Reused link | Exact command replay returns the original session; opening the consumed one-time token with a new command is denied without a second session or event. | Open the consumed link from a separate device and verify the recovery action. |
| Stale page | Stale participant and institution commands are rejected before mutation; version, event count, and usage remain unchanged. | Submit an intentionally stale form in Chrome and verify recovery copy and refreshed status. |
| Rejected | One institution rejection writes one no-authority decision receipt and one event; replay creates no duplicate and usage remains unchanged. | Compare the institution, account-holder, and representative receipt screens. |
| Withdrawn | Acknowledged representative withdrawal writes one terminal state and event; exact replay creates no duplicate and usage remains unchanged. | Verify the other personas see the same terminal status and no active next action. |
| Expired | Expiration preserves the original accepted decision, appends one lifecycle event, advances once, and does not change usage. | Verify scheduled/operator initiation and all three receipt projections in hosted Demo. |
| Session recovery | Reissue revokes the old session, prepares one new role-bound link, preserves the request version/status and usage, and records both recovery events. | Verify message delivery and continuation in a fresh profile without losing saved work. |

### Independent reviewer boundary

- Reviewer navigation is a **Review queue** and does not expose request creation.
- A reviewer who opens the new-request route is returned to the queue with a plain explanation of who can start the request.
- A reviewer who opens an existing Draft sees no activation control and is told to ask an owner, administrator, or operations staff member to send it.
- Server actions and the database independently deny reviewer creation and activation. Local transactional replay proves the denials preserve the draft version, event history, invitations, and usage.
- Still manual in hosted Demo: sign in as a separate reviewer, verify these three browser projections at desktop, 390px, and 360px, then complete evidence review and decision from that isolated profile.
