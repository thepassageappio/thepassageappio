import { createHmac } from "node:crypto";
import type { AuthorityEvent, AuthorityRecord, WebhookDelivery } from "./types.ts";

function webhookSecret() {
  const configured = process.env.AUTHORITY_SANDBOX_WEBHOOK_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTHORITY_SANDBOX_WEBHOOK_SECRET is required in production.");
  }
  return "local-authority-webhook-sandbox-only";
}

export function signWebhookPayload(payload: Record<string, unknown>) {
  return createHmac("sha256", webhookSecret()).update(JSON.stringify(payload)).digest("base64url");
}

export function createWebhookDelivery(event: AuthorityEvent, record: AuthorityRecord): WebhookDelivery {
  const payload: Record<string, unknown> = {
    apiVersion: "2026-08-23",
    eventId: event.id,
    eventType: event.type,
    createdAt: event.createdAt,
    authorityRecord: {
      id: record.id,
      version: record.version,
      status: record.status,
      nextOwner: event.nextOwner,
      policyVersionId: record.policy.id,
      relyingPartyId: record.relyingParty.id,
    },
  };
  const simulateRetry = record.sandboxScenario === "webhook_retry" && event.type === "assessment.submitted";
  return {
    id: `delivery_${event.id}`,
    authorityRecordId: record.id,
    eventId: event.id,
    eventType: event.type,
    endpoint: "https://sandbox.partner.example/webhooks/authority",
    status: simulateRetry ? "retrying" : "delivered",
    attempts: simulateRetry ? 2 : 1,
    responseCode: simulateRetry ? 500 : 200,
    lastAttemptAt: event.createdAt,
    nextRetryAt: simulateRetry ? new Date(new Date(event.createdAt).getTime() + 5 * 60_000).toISOString() : undefined,
    signature: signWebhookPayload(payload),
    payload,
    createdAt: event.createdAt,
  };
}
