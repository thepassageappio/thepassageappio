# Passage Authority owner UAT runbook

**Purpose:** independently prove the public-domain synthetic journey without developer help. Do not use a real person, institution, account number, legal document, or payment method.

## Before the clock starts

- Open four isolated sessions: Institution owner, Account holder, Representative, and Institution reviewer. Use separate Chrome profiles, private windows that do not share cookies, or separate devices.
- Confirm access to two controlled inboxes. One inbox acts as Parker Quinn; the other acts as Casey Quinn.
- Sign the owner and reviewer into the same synthetic institution workspace with separate institution accounts.
- From the workspace, choose **Start a sample request**.
- Download the two fictional files linked above the form. They are visibly marked as synthetic and create no authority.
- Start a screen recording or note the start time. Keep this sheet available outside the four product sessions.

Stop immediately if any session shows another persona's private action, a real customer record, or a different organization.

## Seven-minute walkthrough

| Target | Persona | Action | Pass evidence |
| --- | --- | --- | --- |
| 0:00–0:45 | Buyer | Open the homepage and explain the problem in one sentence | “Passage gets a POA request to a clear institution decision.” |
| 0:45–1:30 | Owner | Open **Start a sample request**, enter the controlled inboxes, save, review, and send | Draft is saved before sending; usage changes exactly once after sending |
| 1:30–2:15 | Account holder | Open the first secure message and confirm | Correct people, purpose, account boundary, actions, end date, and institution are visible; no account is required |
| 2:15–3:30 | Representative | Open the separately delivered message, accept, upload both fictional PDFs, and complete the certification | Only representative actions are available; both filenames and requirement states persist after refresh |
| 3:30–4:15 | Reviewer | Open the request and ask for one specific clarification | Request returns to the representative with the saved question; no decision is recorded early |
| 4:15–5:00 | Representative | Open a fresh link if needed, answer, and send for review | Prior responsibility and files remain; status returns to institution review |
| 5:00–6:00 | Reviewer | Accept with the two demo limits | Outcome, accepted actions, limits, reason, and effective date are saved |
| 6:00–7:00 | All roles | Open each receipt, compare it, then record revocation | Receipt code, decision, scope, limits, and current status match in every session; original decision remains visible after revocation |

## Required negative checks

Run these after the timed story. A failed negative check blocks demo readiness even when the happy path passes.

| Check | Expected result |
| --- | --- |
| Reopen the account-holder invitation after exchange | It cannot create a second session or repeat the decision |
| Open an account-holder URL in the representative profile | No representative action is exposed and no state changes |
| Submit a page left open before another session changed the request | A clear “request changed” recovery appears; no duplicate event is written |
| Decline a fresh sample request as the representative | The request ends with the reason preserved and no evidence upload path |
| Withdraw a fresh request as the account holder | Every permitted role sees the withdrawal; earlier history remains |
| Open an expired invitation | It explains expiration and the institution can issue a replacement |
| Let a participant session expire, then request a new link | Saved decisions and uploaded evidence remain; only the new session works |
| Attempt to open a fictional upload URL without institution or participant access | The file is denied without revealing another organization or storage path |

## Evidence to record

For every step, record:

- profile or device;
- visible page title and status;
- expected next action;
- start and finish time;
- message delivery and inbox/spam placement;
- receipt code and current status;
- defect severity and screenshot filename.

Critical means data exposure or an unauthorized decision. High means the journey is blocked or different roles see different saved results. Enterprise-demo readiness requires zero open critical or high defects.

## End-of-run decision

Mark the run **Pass** only when the happy path completes within seven minutes, every role stays isolated, all receipts match, and the required negative checks produce no unauthorized mutation. Otherwise record the first blocking step and preserve the synthetic request for diagnosis.
