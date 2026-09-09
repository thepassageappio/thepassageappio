# QA and demo playbook

Load for browser, persona, mobile, accessibility, recovery, or demo verification.

## Pass standard

Require browser action, server command, durable state, append-only event, other-persona visibility, matching receipt, and replay. Record profile/device, URL, time, visible status, expected action, delivery result, receipt, and defect severity.

## Required surfaces

- Owner, administrator, reviewer, principal, and representative boundaries.
- Desktop, exact 390px, exact 360px, keyboard focus/activation, and 44px controls.
- Reused/newest link, stale version, wrong role, rejection/decline, revocation/expiration, and recovery.
- Provider delivery status and no unexplained console/runtime errors.

## Current status and open QA

- The September 9 signup defect in [../QA-REPORT-2026-09-09.md](../QA-REPORT-2026-09-09.md) is repaired. Production served merge `f99da278a9774516ad31b6bd14e593e8b307fb73`; both a new Owner and a newly invited Administrator rendered the QR/manual secret, verified TOTP, reached `/app`, and recorded verified hosted factors. A separate Reviewer received the intended review-only workspace without privileged MFA.
- The complete post-MFA production persona matrix passed as request `PA-E3DEFCE539`: owner, administrator, reviewer, principal, representative, fictional evidence, institution decision, and matching three-party receipt `PAR-1805F05F8FC4`. The application regression that reopened P0 is closed.
- Default-deny RLS is applied to all 20 `authority_private` tables in UAT and Demo. Hosted checks report zero browser-accessible private tables, preserve service-role bypass, and no longer report RLS-disabled advisor findings.
- The confirmed nested-copy checkbox defect and public mobile-nav clipping are fixed on `main`. The report's separate three-checkbox accessibility claim did not reproduce in source inspection; verify it during the remaining live keyboard/accessibility pass rather than changing already-correct semantics.
- Capture and verify the backup recording with readable receipt scope/status and concealed tokens/inbox content as a commercial resilience asset.
- The notification send-history fix is source controlled and applied to UAT and Demo. Re-run reissue, receipt, late, duplicate, and out-of-order cases as part of the final release-candidate matrix rather than treating the migration as unfinished.
- Owner and administrator enrollment, owner AAL1 denial/AAL2 success, fresh sign-in, two verified choices, backup-factor challenge, and cleanup have passed. Build an authorized, audited all-factors-lost recovery command/procedure before closing P2 MFA.
- Resend marked the September 9 participant and team invitations delivered, but Gmail did not surface several invitations in exact searches; receipt mail did surface. Keep deterministic presenter delivery, Google Postmaster registration, and domain-reputation monitoring open. Do not call a timed buyer demo reliable while its participant links require provider-dashboard recovery.

Detailed checklist: [../DEMO-READY-CHECKLIST.md](../DEMO-READY-CHECKLIST.md).
