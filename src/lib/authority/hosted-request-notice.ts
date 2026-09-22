import { userNoticeMessage } from "./user-messages.ts";

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

/** Soft activation notices: provider status must not overclaim mailbox placement. */
export function hostedRequestNoticeMessage(
  code: string | undefined,
  currentDeliveryStatus: string | null | undefined,
) {
  const message = userNoticeMessage(code);
  if (!code || !message || !deliveryNoticeCodes.has(code)) return message;
  if (currentDeliveryStatus === null) return null;
  if (currentDeliveryStatus === "delivered") {
    return "Delivered to the recipient’s mail server.";
  }
  if (currentDeliveryStatus === "failed") return "Email delivery needs attention. Send a fresh secure link.";
  if (currentDeliveryStatus === "retrying") return "Email delivery is being retried.";
  return message;
}
