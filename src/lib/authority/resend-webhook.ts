import type { WebhookEventPayload } from "resend";

export const RESEND_DELIVERY_EVENT_TYPES = [
  "email.delivered",
  "email.delivery_delayed",
  "email.failed",
  "email.bounced",
] as const;

export type ResendDeliveryEventType = typeof RESEND_DELIVERY_EVENT_TYPES[number];

export type ResendDeliveryReceipt = {
  eventType: ResendDeliveryEventType;
  providerMessageId: string;
  occurredAt: string;
  failureReason: string;
};

function boundedReason(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, "_")
    .slice(0, 120);
}

export function parseResendDeliveryEvent(event: WebhookEventPayload): ResendDeliveryReceipt | null {
  if (!RESEND_DELIVERY_EVENT_TYPES.includes(event.type as ResendDeliveryEventType)) return null;
  if (!("email_id" in event.data) || !event.data.email_id.trim()) return null;
  const occurredAt = new Date(event.created_at);
  if (Number.isNaN(occurredAt.getTime())) return null;

  let failureReason = "";
  if (event.type === "email.failed") failureReason = boundedReason(event.data.failed.reason);
  if (event.type === "email.bounced") {
    failureReason = boundedReason(`bounce:${event.data.bounce.type}:${event.data.bounce.subType}`);
  }

  return {
    eventType: event.type as ResendDeliveryEventType,
    providerMessageId: event.data.email_id.trim(),
    occurredAt: occurredAt.toISOString(),
    failureReason,
  };
}
