import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const baseUrl = process.env.AUTHORITY_BASE_URL ?? "http://127.0.0.1:3400";
const apiKey = process.env.AUTHORITY_SANDBOX_API_KEY ?? "passage_sandbox_test_key";

async function request(path, { method = "GET", actorId, body, expectedStatus = 200 } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(actorId ? { "X-Authority-Actor": actorId } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  assert.equal(
    response.status,
    expectedStatus,
    `${method} ${path} returned ${response.status}: ${JSON.stringify(payload)}`,
  );
  return payload;
}

const unauthorized = await fetch(`${baseUrl}/api/v1/authority-records`);
assert.equal(unauthorized.status, 401, "The record collection must reject an unauthenticated request.");

const created = await request("/api/v1/authority-records", {
  method: "POST",
  expectedStatus: 201,
  body: { sandboxScenario: "rfi_then_limited" },
});
const recordId = created.data.authorityRecordId;
const recordKey = recordId.replace(/^ar_/, "");
const actors = {
  principal: `party_${recordKey}_principal`,
  representative: `party_${recordKey}_representative`,
  reviewer: `party_${recordKey}_reviewer`,
};
let version = created.data.version;
const transitions = [];

async function command(actorId, type, expectedStatus, fields = {}) {
  const result = await request(`/api/v1/authority-records/${recordId}`, {
    method: "POST",
    actorId,
    expectedStatus: 201,
    body: {
      type,
      expectedVersion: version,
      idempotencyKey: `live_${type}_${randomUUID()}`,
      ...fields,
    },
  });
  version += 1;
  assert.equal(result.data.version, version, `${type} must advance the record exactly once.`);
  assert.equal(result.data.status, expectedStatus, `${type} produced the wrong status.`);
  assert.equal(result.data.webhook.status, "delivered", `${type} must emit an observable webhook delivery.`);
  transitions.push({ type, status: result.data.status, version: result.data.version, eventId: result.data.event.id });
}

await command(actors.principal, "confirm_grant", "awaiting_representative", { acknowledged: true });
await command(actors.representative, "accept_responsibility", "evidence_required", { acknowledged: true });
await command(actors.representative, "complete_requirement", "evidence_required", { requirementKey: "power_of_attorney_document" });
await command(actors.representative, "complete_requirement", "evidence_required", { requirementKey: "agent_certification" });
await command(actors.representative, "complete_requirement", "evidence_required", { requirementKey: "representative_identity" });
await command(actors.representative, "complete_requirement", "ready_to_submit", { requirementKey: "current_address" });
await command(actors.representative, "submit_record", "under_review", { consented: true });
await command(actors.reviewer, "request_information", "information_requested", {
  requirementKey: "current_address",
  message: "Confirm a sample address document dated within the last 90 days.",
});
await command(actors.representative, "resolve_information", "under_review", {
  response: "Confirmed sample statement dated August 10, 2026.",
});
await command(actors.reviewer, "record_decision", "accepted_with_limits", {
  outcome: "accepted_with_limits",
  reason: "All sample policy requirements are complete with visible source references.",
  limitations: ["Duplicate statements and service discussion only", "No funds movement"],
  acknowledged: true,
});
await command(actors.principal, "revoke_authority", "revoked", {
  reason: "The temporary service need has ended.",
  acknowledged: true,
});

const receipt = await request(`/api/v1/authority-records/${recordId}/receipt`, {
  actorId: actors.principal,
});
assert.equal(receipt.data.status, "revoked");
assert.equal(receipt.data.version, 12);
assert.equal(receipt.data.policy.id, "policy_hvcu_financial_poa_v1_3");
assert.equal(receipt.data.consentSnapshots.length, 2);
assert.equal(receipt.data.disclosures.length, 1);
assert.equal(receipt.data.decision.outcome, "accepted_with_limits");
assert.ok(receipt.data.revokedAt, "The receipt must preserve the revocation time.");

const deliveries = await request(
  `/api/v1/webhook-deliveries?authorityRecordId=${encodeURIComponent(recordId)}`,
);
assert.equal(deliveries.data.length, 12, "Every durable event must have one webhook delivery.");
assert.ok(deliveries.data.every((delivery) => delivery.status === "delivered"));

console.log(JSON.stringify({
  result: "PASS",
  recordId,
  finalStatus: receipt.data.status,
  finalVersion: receipt.data.version,
  transitionCount: transitions.length,
  participantVisibleReceiptEvents: receipt.data.events.length,
  webhookDeliveryCount: deliveries.data.length,
  policyVersionId: receipt.data.policy.id,
  disclosureCount: receipt.data.disclosures.length,
}, null, 2));
