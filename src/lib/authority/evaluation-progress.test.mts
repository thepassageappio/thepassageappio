import assert from "node:assert/strict";
import test from "node:test";
import { evaluationProgress } from "./evaluation-progress.ts";
import type { HostedAuthorityRecord, HostedAuthorityStatus } from "./hosted-records.ts";

function record(id: string, status: HostedAuthorityStatus): HostedAuthorityRecord {
  return {
    id, status, referenceCode: `PA-${id}`, organizationId: "org", createdBy: "user", version: 1,
    templateKey: "ny_financial_poa", templateVersion: "1", purpose: "Test", accountBoundary: "Sample account",
    principalName: "Casey Quinn", principalEmail: "casey@example.test", representativeName: "Parker Quinn",
    representativeEmail: "parker@example.test", allowedActionKeys: ["receive_duplicate_statements"],
    validUntil: "2027-01-01T00:00:00.000Z", activatedAt: null, createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  };
}

test("an empty evaluation leads with a sample request", () => {
  const result = evaluationProgress([], null);
  assert.equal(result.nextHref, "/app/requests/new?sample=1");
  assert.equal(result.milestone, 1);
});

test("an active request is the single next action", () => {
  const result = evaluationProgress([record("active", "awaiting_principal")], "2026-09-10T12:00:00.000Z", new Date("2026-09-03T12:00:00.000Z"));
  assert.equal(result.nextHref, "/app/requests/active");
  assert.equal(result.daysRemaining, 7);
  assert.equal(result.milestone, 2);
});

test("a completed decision makes the receipt the value milestone", () => {
  const result = evaluationProgress([record("done", "accepted_with_limits")], null);
  assert.equal(result.nextHref, "/app/requests/done/receipt");
  assert.equal(result.completedCount, 1);
  assert.equal(result.milestone, 3);
});
