import assert from "node:assert/strict";
import test from "node:test";
import type { WebhookEventPayload } from "resend";
import { parseResendDeliveryEvent } from "./resend-webhook.ts";

function emailEvent(type: "email.delivered" | "email.delivery_delayed" | "email.failed" | "email.bounced") {
  const base = {
    type,
    created_at: "2026-08-29T16:10:00.000Z",
    data: {
      email_id: "provider-message-1",
      message_id: "smtp-message-1",
      created_at: "2026-08-29T16:09:59.000Z",
      from: "Passage Authority <noreply@thepassageapp.io>",
      to: ["participant@example.test"],
      subject: "Secure request",
    },
  };
  if (type === "email.failed") return { ...base, data: { ...base.data, failed: { reason: "Reached Daily Quota" } } } as WebhookEventPayload;
  if (type === "email.bounced") return { ...base, data: { ...base.data, bounce: { message: "Mailbox unavailable", type: "Permanent", subType: "General" } } } as WebhookEventPayload;
  return base as WebhookEventPayload;
}

test("Resend delivery confirmation maps to a provider receipt", () => {
  assert.deepEqual(parseResendDeliveryEvent(emailEvent("email.delivered")), {
    eventType: "email.delivered",
    providerMessageId: "provider-message-1",
    occurredAt: "2026-08-29T16:10:00.000Z",
    failureReason: "",
  });
});

test("Resend delays and failures preserve a bounded operational reason", () => {
  assert.equal(parseResendDeliveryEvent(emailEvent("email.delivery_delayed"))?.eventType, "email.delivery_delayed");
  assert.equal(parseResendDeliveryEvent(emailEvent("email.failed"))?.failureReason, "reached_daily_quota");
  assert.equal(parseResendDeliveryEvent(emailEvent("email.bounced"))?.failureReason, "bounce:permanent:general");
});

test("unrelated or malformed Resend events do not change delivery state", () => {
  const opened = { ...emailEvent("email.delivered"), type: "email.opened" } as WebhookEventPayload;
  const malformed = { ...emailEvent("email.delivered"), created_at: "not-a-date" } as WebhookEventPayload;
  assert.equal(parseResendDeliveryEvent(opened), null);
  assert.equal(parseResendDeliveryEvent(malformed), null);
});
