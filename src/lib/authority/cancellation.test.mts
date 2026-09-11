import assert from "node:assert/strict";
import test from "node:test";
import { mapCancellationReceipt } from "./cancellation.ts";
import { canReissueParticipantAccess, participantAccessPurpose } from "./participant-resume.ts";
const receipt = { receipt_snapshot: { status: "canceled", receipt_code: "PAC-SAMPLE", reference_code: "PA-SAMPLE", reason: "Duplicate request", canceled_at: "2026-09-10T23:00:00Z", institution_name: "Sample Bank", principal_name: "Casey", representative_name: "Parker", account_boundary: "Sample account", record_version: 2 }, receipt_sha256: "a".repeat(64) };
test("cancellation keeps its own result and never accepts a decision as cancellation", () => {
  assert.equal(mapCancellationReceipt(receipt)?.reason, "Duplicate request");
  for (const status of ["accepted", "rejected", "revoked", undefined]) assert.equal(mapCancellationReceipt({ ...receipt, receipt_snapshot: {...receipt.receipt_snapshot, status} }), null);
});
test("incomplete or malformed cancellation receipts cannot render as saved results", () => {
  for (const value of [null, {}, {...receipt, receipt_sha256:"broken"}, {...receipt, receipt_snapshot:{...receipt.receipt_snapshot, canceled_at:"bad date"}}, {...receipt, receipt_snapshot:{...receipt.receipt_snapshot, record_version:0}}, {...receipt, receipt_snapshot:{...receipt.receipt_snapshot, reason:""}}]) assert.equal(mapCancellationReceipt(value),null);
});
test("both participant roles recover read-only receipt access after cancellation", () => {
  for (const role of ["principal", "representative"] as const) {
    assert.equal(canReissueParticipantAccess(role,"canceled"),true);
    assert.equal(participantAccessPurpose(role,"canceled"),"receipt");
  }
});
