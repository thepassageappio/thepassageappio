# Product status and remaining gaps

Latest independent POL1 work: [strict saved-record reading](POLICY-ENVELOPE-READING-2026-09-11.md) rejects getters and unexpected properties before checking policy bytes. Eight new regression cases and all 237 domain tests, TypeScript, lint and build passed. This remains in open PR 109; no database or live product change. Publication, trusted history loading and request snapshot/rebase enforcement remain unfinished.

Latest release: PR [113](https://github.com/thepassageappio/thepassageappio/pull/113) is live on both sites at verified main `326976fd1dc0a4009b18db5429dedf474d48c37c`. [HTTP contact recovery](CONTACT-HTTP-RECOVERY-2026-09-11.md) preserves entries after invalid 503/429/502 responses. The 172-test build, eight exception-boundary and seven action checks passed. Both exact previews and both live sites each passed 12 injected errors, four preflight denials and four honeypot redirects at four widths. Public smoke passed 44 routes/eight recovery states; both error scans returned zero records. No migration, inquiry or provider send occurred. The owner approved rehearsal email; the two recipient addresses remain pending.

Latest contact evidence: [local database replay](CONTACT-REPLAY-2026-09-11.md) passed three identical retries and one edited retry with the same reference, one inquiry/event/outbox, unchanged saved input, browser-role denial and rollback cleanup. No hosted write or provider delivery occurred. Committed HTTP response-loss and concurrency remain unverified.

Latest UX2 follow-up: [auditor participant-access controls](PARTICIPANT-ACCESS-CONTROLS-2026-09-11.md) shipped in PR 110 and remains included in the current release. Reviewer resend access is preserved. Invitation arrival remains unverified; continue independent POL1 work without repeating provider sends.


PR [108](https://github.com/thepassageappio/thepassageappio/pull/108) is merged and live at `c64299e5ed3fa49b43e7ca62278b9c5c59088264` on both `thepassageapp.io` and `demo.thepassageapp.io`. Hosted cancellation checks passed in Demo and UAT. Production verification passed 44 public routes, eight recovery states and 30 authenticated institution receipt views. Preview configuration and UAT preview access are repaired; deployment protection remains enabled.

See [release evidence](RELEASE-AND-DEMO-STATUS-2026-09-11.md). Updated September 11 UTC.

## Where we are

Passage has a tested sample journey from institution request through separate participant steps to a recorded decision and matching receipts. The current sample is New York, with statement copies and account questions. It is not yet the complete configurable product or approved for general customer-data use.

Production and origin/main are verified at `326976fd1dc0a4009b18db5429dedf474d48c37c`. PR 113 is merged and live; PR 112 remains included; see [connection recovery evidence](CONTACT-NETWORK-RECOVERY-2026-09-11.md).

## What the research means now

The [market report](MARKET-RESEARCH-2026-09-10.md) remains the external research baseline. This update adds implementation evidence; it is not a new competitor search, customer interview or legal opinion. Better wording and form recovery help usability. They do not resolve the report's larger questions about institutional policy, a principal unable to participate, buyer demand, state rules or resilience.

## Gaps and next evidence

| Gap | Current position | Next concrete result |
| --- | --- | --- |
| Simple guided journey | Workspace/copy checked; draft and contact server/fetch errors retain entries; public text, keyboard, native zoom and form validation checked | Apply recovery to remaining forms; keyboard/zoom/screen-reader and independent first-use walkthrough |
| Request cancellation | Awaiting-principal cancellation shipped; hosted seven-persona receipts, retry and role checks passed | Broader states and automatic notices remain separate |
| Institution rules | Fixed sample checklist; general policy editor not shipped | Governed catalogs, immutable publish, snapshot pinning and explicit stale-draft rebase |
| Real POA cases | Supported sample requires the account holder to participate | Approved intake/exclusions for incapacity, existing instruments, successor/co-agent and conflicting documents |
| State requirements | New York sample; Pennsylvania not enabled | Qualified review of applicability, deadlines, notices and separate Pennsylvania acknowledgment |
| Access/recovery | Team authenticator inventory tested | Broader MFA scope, phishing-resistant option assessment and controlled all-factors-lost recovery |
| Reliable operations | Internal reconciliation 3/7 actual UTC days | Four further real days, separate provider comparison and dependable invitation delivery |
| Restore/data lifecycle | Not closed by a working demo | Approved backup choice, actual isolated restore, retention/deletion and incident exercise |
| Buyer proof | Research, first-five drafts and unsent one-pager exist | Real introductions, buyer interviews, process baseline and willingness-to-pay evidence |
| Release | PR 112 live with exact-SHA negative contact recovery; earlier authenticated receipt evidence belongs to PR 108 | Reliable invitation arrival and timed fresh full-story rehearsal |

## Next execution order

1. Close invitation reliability and fresh presenter rehearsal with the released application.
2. Complete accessibility/first-use replay and assess broader cancellation states and automatic notices separately.
3. Build POL1 catalog/policy publication and stale-draft recovery.
4. Prepare WF2/LEG1 decisions for qualified review while engineering continues.
5. Close SEC1, OPS1/OPS2, ASS1 and release gates with actual evidence. P1/P2 and real-data approval remain open.

The owner or outside reviewers still supply actual introductions, spending decisions, legal/assurance conclusions and release signoff. Calendar evidence cannot be accelerated by rerunning the same day. No outreach was sent.
