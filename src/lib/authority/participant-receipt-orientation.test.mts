import assert from "node:assert/strict";
import test from "node:test";
import { buildParticipantReceiptOrientation } from "./participant-receipt-orientation.ts";
import type { ParticipantDecisionReceipt } from "./participant-receipt.ts";

function baseReceipt(overrides: Partial<ParticipantDecisionReceipt> = {}): ParticipantDecisionReceipt {
  return {
    receiptCode: "PAR-TEST",
    receiptSha256: "a".repeat(64),
    decisionVersion: 1,
    currentVersion: 1,
    referenceCode: "PA-TEST",
    institutionName: "Demo CU",
    participantRole: "principal",
    participantName: "Parker",
    otherPersonName: "Casey",
    currentStatus: "accepted_with_limits",
    purpose: "account_access",
    accountBoundary: "Demo accounts only",
    outcome: "accepted_with_limits",
    reason: "Synthetic",
    acceptedActionKeys: ["receive_duplicate_statements"],
    requestedActionKeys: ["receive_duplicate_statements"],
    limitations: [
      "Statement copies only; bank discussion excluded.",
      "Synthetic demonstration only; no real account authority.",
    ],
    decidedAt: "2026-09-22T17:02:49.887Z",
    validUntil: "2026-12-31T05:00:00.000Z",
    acceptedPermissionsSnapshot: null,
    lifecycleSummary: null,
    lifecycleReason: null,
    lifecycleEffectiveAt: null,
    ...overrides,
  };
}

test("receipt decisionLine strips per-limit periods before joining", () => {
  const model = buildParticipantReceiptOrientation({
    authorityRecordId: "11111111-1111-4111-8111-111111111111",
    receipt: baseReceipt(),
  });
  assert.equal(
    model.decisionLine,
    "Accepted with limits: Statement copies only; bank discussion excluded; Synthetic demonstration only; no real account authority.",
  );
  assert.doesNotMatch(model.decisionLine, /excluded\.;/);
  assert.doesNotMatch(model.decisionLine, /authority\.\./);
});
