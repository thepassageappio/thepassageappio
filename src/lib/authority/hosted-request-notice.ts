import { userNoticeMessage } from "./user-messages.ts";

const deliveryNoticeCodes = new Set([
  "request_activated",
  "request_activated_delivery_pending",
  "participant_invitation_submitted",
  "participant_invitation_delivery_pending",
]);

/** Demo-first soft labels: Resend accept ≠ inbox confirmed. */
export function hostedRequestNoticeMessage(
  code: string | undefined,
  currentDeliveryStatus: string | null | undefined,
) {
  const message = userNoticeMessage(code);
  if (!code || !message || !deliveryNoticeCodes.has(code)) return message;
  if (currentDeliveryStatus === null) return null;
  if (currentDeliveryStatus === "delivered") return "Email reached the inbox (provider confirmed).";
  if (currentDeliveryStatus === "failed") return "Email delivery needs attention. Send a fresh secure link.";
  if (currentDeliveryStatus === "retrying") return "Email delivery is being retried.";
  return message;
}
