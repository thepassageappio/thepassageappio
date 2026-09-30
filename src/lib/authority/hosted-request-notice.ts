import { userNoticeMessage } from "./user-messages.ts";
import { DEMO_EMAIL_NOT_APPROVED, emailNotSentReason, isDemoRecipientBlockedCode } from "./email-delivery-reason.ts";

const deliveryNoticeCodes = new Set([
  "request_activated",
  "request_activated_delivery_pending",
  "participant_invitation_submitted",
  "participant_invitation_delivery_pending",
]);

/**
 * Face copy for provider delivery_status.
 * Resend `delivered` means the recipient’s mail server accepted the message —
 * never claim Inbox / mailbox placement from that status alone.
 */
export function deliveryStatusFaceLabel(status: string | undefined): string {
  const labels: Record<string, string> = {
    pending: "Delivery pending",
    delivered: "Delivered to the recipient’s mail server",
    failed: "Delivery needs attention",
    canceled: "Held until prior step",
    retrying: "Delivery retry scheduled",
    processing: "Email accepted by the provider (mail-server delivery not confirmed yet)",
  };
  return status ? labels[status] ?? "Delivery updated" : "Delivery not started";
}

/**
 * Per-person delivery line on the staff request page. When the Demo recipient
 * allowlist skipped (or will skip) the email, say so plainly instead of
 * "pending" or "needs attention". `demoRecipientBlocked` is checked on the
 * server against the current allowlist. Raw provider codes are never shown.
 */
export function participantDeliveryFaceLabel(input: {
  status: string | undefined;
  lastErrorCode?: string | null;
  demoRecipientBlocked?: boolean;
}): string {
  const { status, lastErrorCode, demoRecipientBlocked } = input;
  if (status === "failed" && isDemoRecipientBlockedCode(lastErrorCode)) return DEMO_EMAIL_NOT_APPROVED;
  if (demoRecipientBlocked && status !== "delivered" && status !== "processing") {
    if (status === "canceled") return "Held until prior step. This address isn't approved for Demo email, so it will not be sent.";
    return DEMO_EMAIL_NOT_APPROVED;
  }
  if (status === "failed" && lastErrorCode) return emailNotSentReason(lastErrorCode);
  return deliveryStatusFaceLabel(status);
}

/** Help line under "Send fresh link". Never implies a fresh link reaches a blocked address. */
export function freshLinkHelpText(demoRecipientBlocked: boolean) {
  return demoRecipientBlocked
    ? "This address isn't approved for Demo email, so a fresh link will not be emailed to it either. Use Copy secure link to share it yourself."
    : "Sending a fresh link turns every earlier link for this person off.";
}

/** Soft activation notices: provider status must not overclaim mailbox placement. */
export function hostedRequestNoticeMessage(
  code: string | undefined,
  currentDeliveryStatus: string | null | undefined,
  lastErrorCode?: string | null,
) {
  const message = userNoticeMessage(code);
  if (!code || !message || !deliveryNoticeCodes.has(code)) return message;
  if (currentDeliveryStatus === null) return null;
  if (currentDeliveryStatus === "delivered") {
    return "Delivered to the recipient’s mail server.";
  }
  if (currentDeliveryStatus === "failed" && isDemoRecipientBlockedCode(lastErrorCode)) {
    return `${DEMO_EMAIL_NOT_APPROVED} A fresh link will not reach it either. Use Copy secure link to share it yourself.`;
  }
  if (currentDeliveryStatus === "failed" && lastErrorCode?.trim() === "configuration_missing") {
    return emailNotSentReason(lastErrorCode);
  }
  if (currentDeliveryStatus === "failed" && lastErrorCode) {
    return `${emailNotSentReason(lastErrorCode)} You can send a fresh secure link.`;
  }
  if (currentDeliveryStatus === "failed") return "Email delivery needs attention. Send a fresh secure link.";
  if (currentDeliveryStatus === "retrying") return "Email delivery is being retried.";
  return message;
}
