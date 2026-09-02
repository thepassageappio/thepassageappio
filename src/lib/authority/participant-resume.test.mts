import assert from "node:assert/strict";
import test from "node:test";
import { canReissueParticipantAccess, participantAccessPurpose } from "./participant-resume.ts";

test("principal access can only be reissued while principal confirmation is pending", () => {
  assert.equal(canReissueParticipantAccess("principal", "awaiting_principal"), true);
  assert.equal(canReissueParticipantAccess("principal", "evidence_required"), false);
});

test("representative access can be reissued for the initial decision and active evidence work", () => {
  for (const status of ["awaiting_representative", "evidence_required", "ready_to_submit", "information_requested"] as const) {
    assert.equal(canReissueParticipantAccess("representative", status), true);
  }
  assert.equal(canReissueParticipantAccess("representative", "under_review"), false);
});

test("both participants can receive a decision receipt after the institution decides", () => {
  for (const status of ["accepted", "accepted_with_limits", "rejected", "revoked", "expired"] as const) {
    assert.equal(canReissueParticipantAccess("principal", status), true);
    assert.equal(canReissueParticipantAccess("representative", status), true);
    assert.equal(participantAccessPurpose("principal", status), "receipt");
    assert.equal(participantAccessPurpose("representative", status), "receipt");
  }
});

test("representative evidence states use resume language", () => {
  assert.equal(participantAccessPurpose("representative", "evidence_required"), "resume");
  assert.equal(participantAccessPurpose("representative", "information_requested"), "resume");
  assert.equal(participantAccessPurpose("representative", "awaiting_representative"), "decision");
  assert.equal(participantAccessPurpose("principal", "awaiting_principal"), "decision");
});
