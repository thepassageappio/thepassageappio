import assert from "node:assert/strict";
import test from "node:test";
import { mapParticipantDecisionReceipt, participantReceiptPath } from "./participant-receipt.ts";

const valid = {
  receipt_code: "PA-R-1234567890",
  reference_code: "PA-1234567890",
  institution_name: "Hudson Community Bank",
  participant_role: "representative",
  participant_name: "Maya Carter",
  other_person_name: "Eleanor Carter",
  current_status: "accepted_with_limits",
  current_version: 8,
  decision_record_version: 8,
  purpose: "Request recognition of limited financial power of attorney authority",
  account_boundary: "Membership account ending 4821",
  requested_action_keys: ["receive_duplicate_statements", "discuss_service_issues"],
  decision_outcome: "accepted_with_limits",
  decision_reason: "The submitted evidence satisfies the institution policy.",
  accepted_action_keys: ["receive_duplicate_statements"],
  limitations: ["Statements may be mailed only to the address on file."],
  decided_at: "2026-09-01T12:00:00.000Z",
  valid_until: "2026-12-01T12:00:00.000Z",
  receipt_sha256: "a".repeat(64),
  lifecycle_summary: null,
  lifecycle_reason: null,
  lifecycle_effective_at: null,
};

test("participant receipt maps only complete role-bound receipt data", () => {
  const receipt = mapParticipantDecisionReceipt(valid);
  assert.equal(receipt?.participantRole, "representative");
  assert.equal(receipt?.outcome, "accepted_with_limits");
  assert.deepEqual(receipt?.limitations, valid.limitations);
  assert.equal(mapParticipantDecisionReceipt({ ...valid, participant_role: "owner" }), null);
  assert.equal(mapParticipantDecisionReceipt({ ...valid, receipt_code: null }), null);
});

test("participant receipt paths encode the record identifier", () => {
  assert.equal(participantReceiptPath("record/one"), "/request/record%2Fone/receipt");
});
