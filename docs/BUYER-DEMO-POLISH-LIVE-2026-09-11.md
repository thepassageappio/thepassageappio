# Buyer demo polish release

PR [110](https://github.com/thepassageappio/thepassageappio/pull/110) merged as `b207fb8bd60c84f73ddee326245064571fdfbae2`. It extracts the presenter checklist, sample PDF links, plain policy/sign-in copy and auditor resend-control fix from PR 109. No database, server command, delivery configuration or dependency change is included. PR 109 preserves unfinished policy work; its two storage migrations remain local only.

The candidate `bf70988375dc3869e81ef14c6b2f139feb881c76` passed 172 domain tests, TypeScript, lint, optimized build, 76 closed-page checks, 70 role/state checks, eight policy states, 28 policy layouts, presenter keyboard/44px checks at four widths and both Google sign-in configurations. Both hosted previews reported the exact candidate branch/SHA and passed 32 public entry browser cases and four sample PDF downloads. The protected UAT PDF test initially omitted its access header; correcting the test made it pass. Deployment protection was not changed.

Git-triggered main deployments:

- Demo: `dpl_8SSbGQdWmjX5J3zghq4BLhFzXAVP`.
- Production/UAT: `dpl_5UDLETKHQmQKLbNX7JRLTcuBoEnE`.

Both deployments are READY from GitHub main. Both live /api/version endpoints report b207fb8bd60c84f73ddee326245064571fdfbae2 with verified provenance, matching clean origin/main. The clean local main provenance gate passed. Live verification starting 2026-09-11T13:51:13Z passed 32 entry cases at 1280/390/360/320, four PDF downloads, skip links, keyboard traversal, no overflow and no page errors. Separate public smoke checks passed 44 routes and eight recovery states. Deployment-specific error log queries over the last 30 minutes returned zero records for both deployments; this is a point-in-time log check, not full monitoring coverage. No authenticated session was created and no application form was submitted.

## Next buyer-demo steps

1. Live release verification is complete.
2. Complete a fresh timed presenter run using the two owner-controlled participant inboxes and explicit invitation/receipt-email authorization already requested. That question remains pending; no new email was sent.
3. Verify actual inbox arrival, separate persona actions, matching receipts and revocation. Record a clean backup walkthrough from the verified run.
4. Finalize the existing one-pager and outreach drafts around the demonstrated scope, then obtain sender approval before outreach.

Public browser and local render checks do not establish authenticated workflow completion or inbox delivery. The current demo scope remains fictional New York requests for duplicate statements and service discussions. Broader policy publication, all-factors-lost MFA recovery, provider reconciliation and real-data pilot gates remain separate unfinished work. Internal reconciliation remains 3/7 real UTC days; no rerun or extra day is claimed.
