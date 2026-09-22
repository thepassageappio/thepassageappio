# Passage release and journey checkpoint

Updated September 22, 2026 UTC. The owner resumed the four-step plan. The earlier pause is historical.

## Where we are

We have a working synthetic New York core with repaired security boundaries, durable delivery recovery, and preserved governing history. We are still proving a dependable demonstration that a first-time user can complete without operator help. This is not an enterprise-ready or real-data pilot release.

The north star remains a clear institution-specific decision: who may do what, for whom, at which bank, under which limits, and until when. Passage coordinates the evidence and records the institution's answer. Identity checks, authority evidence, and the bank's decision remain separate.

## Four-step acceptance

| Step | Verified | Still needed |
| --- | --- | --- |
| Hosted delivery recovery | PR #145 merged as `794ed3e`; additive migration and rollback recovery tests passed on both databases. Both live sites served that SHA. Requester email for PG-72AE59CFBD reached the owner's inbox; the supplied link established the requester session. Vercel ran the authenticated Demo worker with an empty queue and HTTP 200 at 10:32:43 UTC. | Finish shared-file submission, actual participant delivery, forced-failure/retry recovery and all-persona acceptance. Empty-queue execution does not prove delivery recovery. |
| NY provenance and draft safeguards | PR #146 merged as `9ec4313200e8c8938458b6c0a7b70a3dbecc36e6`, verified live on both domains. 231 domain tests, typecheck, lint, build, clean migration replay and six SQL suites passed. Hosted rollback tests passed on both. Browser draft PA-A758EBAED2 required review, then saved revision 2 with one matching event, zero invitations and zero usage events. Historical receipt PAR-1805F05F8FC4 displays missing provenance truthfully. | General institution policy authoring/publication remains a later product capability. The fixed NY safeguards do not complete POL1. |
| Full journey and operations | Public release checks passed for 44 routes and 8 recovery states. Internal reconciliation recorded clean runs in both environments on September 22. | Fresh complete participant/reviewer/cancellation/receipt replay, actual keyboard/zoom/screen-reader checks, timed rehearsal, independent first-use, and live provider comparison remain open. |
| Release decision and pilot preparation | **Buyer-demo release: HOLD. Real-data pilot: HOLD.** Retain the synthetic boundary while acceptance gaps remain. | Close the full-journey evidence and obtain an explicit demo decision. A later pilot needs a named institution, supported scenario, success criteria, operator, support/recovery ownership and a separate real-data decision. |

## History preservation

The NY migration left every preexisting authority record, event and decision receipt unchanged, verified by before/after fingerprints (excluding only the two newly added columns from the record fingerprint):

| Environment | Records | Events | Decisions | Receipt-set fingerprint |
| --- | ---: | ---: | ---: | --- |
| Demo | 15 | 215 | 6 | `9a53a8090d2c03076ecb7fac444b0831` |
| Production (Supabase UAT) | 20 | 236 | 6 | `d133d709b89a6c16025792ba160c6061` |

All 12 historical receipt hashes independently recomputed correctly. The later browser test intentionally revised only the new synthetic draft; it did not alter an activated request or decision.

## Current operational evidence

The internal reconciliation streak is **1/7**, beginning September 22. Previous runs were September 15, 13, 11, 10 and 9; missing days break consecutiveness. Today's job records Passage's internal state and ingested provider data. It does not call live Stripe or HubSpot APIs. No future day or independent provider comparison is credited.

The repository's reconciliation script referenced a missing GitHub scheduled workflow. The follow-up adds an authenticated daily Vercel route using existing deployment credentials and the existing idempotent database command. It records no invented days, exposes only a sanitized result, and reports variance/failure as a non-success response. Its intended schedule is 08:00 UTC daily; deployment and first hosted invocation must be verified before calling scheduling restored. Current Vercel documentation permits 100 daily cron jobs on Hobby, superseding the bundled skill's old two-job limit: [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

Security advisors were reviewed. The anonymous delivery-status RPC intentionally requires a valid group-bound requester session token and returns sanitized status. Authenticated security-definer commands retain role, tenant and MFA checks. Default-deny private tables and the existing disabled leaked-password protection advisory remain visible; this is not a zero-warning security claim. Required branch-check enforcement remains open.

## Next steps

1. Continue the existing requester session PG-72AE59CFBD after the owner supplies or approves two separate test-role email addresses. Do not recreate it or bypass mailbox verification through database tokens.
2. Finish matched and unmatched institution submission, shared-file hashes, delivery attempts, recovery, participant decisions, reviewer visibility and matching receipt replay on the exact released SHA.
3. Verify the QA follow-up: a readable expandable settings review, clear expired-evaluation behavior, and the daily reconciliation route on both deployments.
4. Complete independent first-use/accessibility and the timed synthetic rehearsal, then revisit the explicit demo-release hold. Track seven actual days and independent provider comparison separately for later operating/pilot gates.

No outreach was sent, no paid plan was purchased, and no real customer data was introduced. Demo remains synthetic. Free/no-PITR and counsel outside active M1 remain the owner's recorded decisions. State order remains NY → PA → NJ → CT → MA; the 50-state map is a planning exercise, not enabled product coverage.
