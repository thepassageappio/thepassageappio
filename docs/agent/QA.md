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

- P0 demo readiness is closed from the real production four-persona rehearsal.
- Capture and verify the backup recording with readable receipt scope/status and concealed tokens/inbox content as a commercial resilience asset.
- Re-run notification reissue/receipt/late/duplicate/out-of-order cases after the unfinished `notification_outbox` fix is implemented and the migration is present on both UAT and Demo.
- Run MFA through a full build and hosted end-to-end browser replay: enroll TOTP, challenge/verify, confirm AAL2, deny privileged actions at AAL1, allow them at AAL2, then test fresh sign-in, factor management, sign-out, and recovery/backup-factor behavior.

Detailed checklist: [../DEMO-READY-CHECKLIST.md](../DEMO-READY-CHECKLIST.md). Recording shots: [../BACKUP-RECORDING-SHOT-LIST-2026-09-06.md](../BACKUP-RECORDING-SHOT-LIST-2026-09-06.md).
