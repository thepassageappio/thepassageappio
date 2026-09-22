# Submission delivery recovery

## Contract

A committed submission means cases and delivery work are saved together. It does not mean files have copied or emails have arrived. The submitted screen and requester acknowledgment distinguish saved work from delivery.

| Transition | Required behavior |
| --- | --- |
| Draft → submitted | The command receipt queues two copies and two invitations per matched institution in the same transaction. |
| Repeat submit | Stable group idempotency key; submitted groups resume work instead of creating cases again. |
| Pending → processing | Server-only claim locks one row with a five-minute lease and unique token. |
| Copy completion | Source matches the saved fingerprint. An existing destination must match too; conflicting evidence is never overwritten. |
| Invitation | Copies for that case must finish first. Use the actual invitation ID/version, saved expiry, and original token. |
| Failed attempt | Append an event; exponential backoff; five attempts maximum. A crashed attempt can resume after lease expiry. |
| Stale acknowledgment | Reject old or expired lease tokens. |
| Completed step | Never claim again. Provider acceptance remains distinct from inbox delivery. |
| Exhausted, expired, or uncertain old invitation | Show help-needed status; never silently resend an old or superseded link. |

Requester status validates the group-bound session and returns counts only. Browser roles cannot access private job/event tables or claim/finish functions. Tokens are returned only to the trusted worker. Attempt history rejects updates and deletes.

## Processing and limits

The server immediately attempts up to 20 jobs within its work budget. Requesters can retry due work; backoff and completed jobs are preserved. A daily cron provides recovery when no browser returns. It requires `CRON_SECRET`; readiness requires verifying configuration and an actual invocation. Preview builds do not establish scheduled execution.

Resend retains idempotency keys for 24 hours. Invitation retries stop for operator review after 23 hours from an earlier attempt, avoiding automatic resends outside that window. See [Resend documentation](https://resend.com/docs/dashboard/emails/idempotency-keys). Daily scheduling follows the existing Hobby operating model, not a prompt-delivery SLA. See [Vercel cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Historical submissions are not automatically enqueued, because that could resend old links. Their UI reports unavailable tracking. Historical repair requires a separately reviewed plan. Requester acknowledgment remains optional and does not gate participant/file work.

## Rollout and acceptance

Local verification on September 22: 228 domain tests, typecheck, lint, build, full clean migration replay, and five SQL suites passed. The recovery suite covers stale leases, bounded retries, expired provider deduplication windows, invalid/unrelated requester sessions, immutable events, and replay without duplicate cases. An authenticated synthetic browser flow confirmed pending status, retry, and refresh persistence. Both missing-file failures were saved; neither invitation was attempted; exactly one case remained. The cron route returned 404 without credentials and 200 with its local test credential. Browser console had no errors. External email was disabled. These are local results, not hosted/provider acceptance.

The resumed rollout adds an explicit server-only `submit_submission_group_with_delivery_v1` command. Only this command enables queue insertion for its transaction; it restores the prior mode on return. Older application instances using the original command retain inline delivery and create no queue work. This supersedes the earlier requirement for a submission outage and prevents dual delivery during mixed-version deployment. The SQL suite tests both commands. Apply the migration first, then release the application, then verify actual provider and requester results. Historical requests remain unqueued.

Required evidence: clean migration replay; failure/retry/concurrency/idempotency tests; application checks; authenticated requester retry in browser; invalid/unrelated session denial; worker authorization; bounded scheduled execution; source/destination hash match; stable provider idempotency; preserved record/receipt history. Tests are synthetic with no external email. Hosted acceptance stays open until separately recorded.
