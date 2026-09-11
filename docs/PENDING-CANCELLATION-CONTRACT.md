# Pending cancellation: implementation contract

September 10, 2026. Narrow WF1 implementation is now locally verified; not shipped. See [evidence and limits](PENDING-CANCELLATION-EVIDENCE-2026-09-10.md).

## First supported transition

`awaiting_principal -> canceled`. The institution can stop an unneeded request before the account holder confirms. Do not use participant decline, institution rejection or legal revocation for this action. Broader cancellation during review remains a separate scope decision.

Active, email-confirmed owner/admin/staff in the same ready, active organization may coordinate this action; reviewer/auditor/developer may not. Apply existing privileged MFA requirements. Database authorization must repeat the server check.

Require record ID, organization ID, expected version, a 3–500 character reason, explicit confirmation, and idempotency key. Derive the actor from authenticated context. Label the action “Cancel request”; explain that the reason is shared with the people named in the request and the saved history remains.

## Atomic result

Lock the record and verify tenant/state/version. An identical replay returns the original result; a changed payload with the same key fails. A confirmation racing with cancellation must produce exactly one valid transition. Preserve the activated policy snapshot, prior events and usage count. Save canceled status, next version, cancellation event, audit entry, immutable cancellation receipt and command receipt together. Do not insert an institution acceptance/rejection decision.

## Invitations and receipt

Stop unsent actionable invitations and retries; preserve immutable send attempts and delivered history. Specify how an in-flight send is superseded without claiming it was recalled. Existing participant mutations must reject the canceled state, including stale sessions and cached forms.

Provide institution and role-scoped participant read access to the same immutable cancellation reason, time, reference, version and receipt hash. Keep receipt access separate from permission to act. Support expired-link recovery without reactivating the request. Avoid exposing either participant's receipt through a public record ID. Current cancellation saves the in-product result and supersedes actionable outbox work. It does not automatically email a notice. Explicit receipt-link sends use the existing saved outbox and delivery tracking; automatic cancellation notices remain a separate requirement. This engineering work does not authorize external email sends.

## Required evidence before closure

- Authorized command, wrong role, unconfirmed/inactive actor, insufficient MFA, cross-tenant and unknown record.
- Invalid reason/acknowledgment, stale version, identical retry, changed-payload retry and concurrent participant confirmation.
- Atomic rollback, append-only receipt/event and unchanged snapshot/usage.
- Pending/retrying/delivered/in-flight notification cases and newest/old/expired links.
- Both participant sessions cannot act; institution and both participants read the same receipt; independent replay verifies its hash and history.
- Real authenticated browser action plus persisted state/event, other-persona visibility, desktop/mobile/keyboard and error recovery.

Do not mark WF1 complete from the closed-page copy fix or a rendered button.
