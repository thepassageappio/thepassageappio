# Pending request cancellation: implementation and evidence

September 11 UTC checkpoint: [hosted cancellation evidence](PENDING-CANCELLATION-HOSTED-2026-09-11.md). Code pushed at `ccbbc8531b2a7703cfda32301e2c9a37a85e60e9`; Demo/UAT migration and all three SQL rollback suites passed in each environment. Normalized function definitions match local. Vercel Git checks succeeded; exact-candidate hosted browser verification and production release remain pending. The connector returns no projects. This supersedes earlier hosted-migration-pending statements. No new reconciliation day or outreach release.

September 10, 2026 UTC. Implemented and verified locally on `agent/p1-p2-closeout-20260909`. Not merged or deployed. Local Git staging was denied because this worktree references metadata outside the writable workspace. The authorized GitHub connector is being used to publish the tested files to PR 108. Verify the remote PR head; the restricted local checkout remains at its earlier commit. Migration `20260910230516_pending_request_cancellation.sql` has been exercised against the local database, without a migration-history entry during iteration. It has not been applied to Demo or UAT.

## Delivered behavior

An owner, administrator or operations staff member can cancel a request that is waiting for the account holder. The form requires a reason and confirmation. A stale page preserves the reason and checkbox and focuses the error. Success opens a shared cancellation receipt.

The authenticated database command checks the organization, current membership, verified email, privileged MFA, expected version and idempotency key. It saves the canceled state, an append-only event, organization audit entry and separate immutable cancellation receipt atomically. It never creates an institution acceptance/rejection decision, changes the activated request details or changes usage.

Existing participant sessions and unexpired unused invitations can read the cancellation. Participant confirmation/acceptance is blocked. The existing audited fresh-link command supports cancellation receipt recovery and revokes earlier sessions. Institution and participant pages render the same reason, time, reference and hash.

Queued or in-flight invitation work is marked canceled; delivered/failed history remains. A provider-accepted email cannot be recalled. Cancellation itself does **not** automatically email a new notice. The saved result is visible through the request, and coordinators can explicitly send receipt links through the existing delivery path. No external email was sent in this verification. Automatic cancellation notices, if required for the broader lifecycle, remain separate work.

The browser walkthrough also found and repaired an existing auditor defect: the delivery-status reader required an operator role and broke request detail. It now uses the same reader roles as the request, including auditors, without adding mutation rights. Receipt emails and entry pages use wording that works for either decisions or cancellation.

## Verification

- `supabase/tests/pending_request_cancellation.sql`: local rollback suite passed. Wrong roles, inactive membership, unverified email, owner AAL1, cross-tenant, stale version, invalid reason/acknowledgment/key, all other states, replay/payload mismatch, unchanged request details/usage, one event/receipt, immutable receipt, preserved send history, both participant receipts, post-cancel mutation denial, fresh-link/session rotation and authenticated RLS isolation.
- Existing `authority_terminal_and_recovery.sql` and `authority_reviewer_role_boundary.sql` passed locally after the function updates, in rollback wrappers.
- `scripts/verify-pending-cancellation.mjs`: actual local password/TOTP sessions for owner, admin, staff, reviewer and auditor. Browser cancellation, stale-form recovery, keyboard activation, 1280/390/360 widths, exact Server Action POST replay, reviewer POST denial, and matching receipts for five institution roles and both participants passed. Independent Node SHA-256 of the stored PostgreSQL snapshot text matched the receipt hash.
- Browser request: `0ee47f40-76d4-4bf4-93f6-99496149706d`; organization: `f73967d9-4119-470e-aeb9-56c43a5c0894`; receipt hash: `b01f4215c3056183f5b07532a33f52b927b3f9bcb1d6d6b71c174bb21195e2b6`.
- `scripts/verify-cancellation-race.mjs`: simultaneous database sessions attempted cancellation and principal confirmation. Exactly one transition succeeded, version became 2, and no conflicting participant decision was saved. Request `009cff24-a74d-44e4-957f-bfea7fafe826` ended canceled.
- 172 domain tests, TypeScript, ESLint and optimized build passed. 76 closed-page render checks also passed. Local security and performance advisors at warning level reported no issues.
- Browser screenshots were inspected at `work/cancellation-institution.png` and `work/cancellation-representative.png`. No participant browser errors or page overflow. This is not a full accessibility or independent first-use study.

Synthetic browser/race history remains locally for replay. Fixture organizations were closed and accounts banned. Failed setup runs were also closed; no append-only history was deleted. No real customer data was used.

## Remaining work

Apply and verify the migration in the approved hosted test environments through the release process; verify the exact committed candidate and delivery behavior there. Complete release-candidate accessibility/first-use replay. Broader cancellation after account-holder confirmation and automatic cancellation notices are not part of this narrow implementation. P1/P2, policy publication, state/real-POA scope, resilience and outreach release remain open.

## Local tooling note

Docker control remained unavailable. The installed Supabase CLI supports direct local database queries. Its documented `SUPABASE_TELEMETRY_DISABLED=1` option avoids an unrelated settings-file write; it does not change filesystem permissions. CLI creation generated the migration name, and queries/advisors ran against `127.0.0.1:55322`. See [Supabase CLI telemetry](https://supabase.com/docs/guides/local-development/cli/getting-started#telemetry) and [database function security](https://supabase.com/docs/guides/database/functions). No hosted SQL or migration was used as a substitute.
