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

- P0 remains reopened for the full post-MFA persona matrix. The September 9 signup defect in [../QA-REPORT-2026-09-09.md](../QA-REPORT-2026-09-09.md) is repaired: production served merge `f99da278a9774516ad31b6bd14e593e8b307fb73`, the previously stuck owner rendered a QR image and manual secret, verified TOTP, reached `/app`, and hosted UAT recorded one verified factor with no unverified factors.
- New-owner `/mfa` stayed at “Preparing…” across five reloads with zero Auth enrollment requests and zero factors. The repair must prove a real enrollment request, a rendered QR image and manual secret, successful AAL2 entry, and recoverable error/retry behavior.
- Default-deny RLS is applied to all 20 `authority_private` tables in UAT and Demo. Hosted checks report zero browser-accessible private tables, preserve service-role bypass, and no longer report RLS-disabled advisor findings.
- Repair the two onboarding checkbox semantics and the public mobile-nav affordance found in the same report before final UI sign-off.
- Capture and verify the backup recording with readable receipt scope/status and concealed tokens/inbox content as a commercial resilience asset.
- The notification send-history fix is source controlled and applied to UAT and Demo. Re-run reissue, receipt, late, duplicate, and out-of-order cases as part of the final release-candidate matrix rather than treating the migration as unfinished.
- Owner TOTP, AAL1 denial, AAL2 success, fresh sign-in, two verified choices, backup-factor challenge, and cleanup have passed. Complete the independent administrator replay and build an authorized, audited all-factors-lost recovery command/procedure before closing P2 MFA.

Detailed checklist: [../DEMO-READY-CHECKLIST.md](../DEMO-READY-CHECKLIST.md).
