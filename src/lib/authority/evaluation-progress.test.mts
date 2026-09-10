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

test("open work takes priority over a previous completed receipt", () => {
  const result = evaluationProgress([record("done", "accepted"), record("waiting", "awaiting_principal")], null);
  assert.equal(result.nextHref, "/app/requests/waiting");
  assert.equal(result.completedCount, 1);
  assert.match(result.nextTitle, /Casey Quinn/);
});

test("review work takes priority for reviewers while staff continue their draft", () => {
  const records = [record("waiting", "awaiting_principal"), record("draft", "draft"), record("review", "under_review")];
  const reviewer = evaluationProgress(records, null, new Date(), "reviewer");
  assert.equal(reviewer.nextHref, "/app/requests/review");
  assert.equal(reviewer.nextLabel, "Review request");
  const staff = evaluationProgress(records, null, new Date(), "staff");
  assert.equal(staff.nextHref, "/app/requests/draft");
  assert.equal(staff.nextLabel, "Continue draft");
  assert.deepEqual(records.map(r => r.id), ["waiting", "draft", "review"]);
});

test("staff and auditors view institution review without being prompted to decide", () => {
  for (const role of ["staff", "auditor"] as const) {
    const result = evaluationProgress([record("review", "under_review")], null, new Date(), role);
    assert.equal(result.nextLabel, "View request");
    assert.equal(result.nextTitle, "Waiting on Institution reviewer");
  }
});

test("closed requests never become pending work and an empty reviewer queue never offers creation", () => {
  const records = (["declined", "withdrawn", "revoked", "expired", "canceled"] as const).map(s => record(s, s));
  const result = evaluationProgress(records, null, new Date(), "reviewer");
  assert.equal(result.nextHref, "/app/team");
  assert.equal(result.completedCount, 0);
});

test("representative steps name the person responsible", () => {
  for (const status of ["awaiting_representative", "evidence_required", "ready_to_submit", "information_requested"] as const) {
    const result = evaluationProgress([record("rep", status)], null);
    assert.match(result.nextTitle, /Parker Quinn/);
    assert.equal(result.nextLabel, "View request");
  }
});
