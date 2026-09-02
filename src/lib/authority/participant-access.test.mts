import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeParticipantToken,
  participantDecisionTransition,
  participantEntryDecision,
  participantOverviewPath,
} from "./participant-access.ts";

const validToken = "a".repeat(64);
const future = "2026-09-01T00:00:00.000Z";
const now = "2026-08-29T00:00:00.000Z";

test("participant bearer tokens are fixed-length hexadecimal values", () => {
  assert.equal(normalizeParticipantToken(`  ${validToken.toUpperCase()}  `), validToken);
  assert.equal(normalizeParticipantToken("short"), null);
  assert.equal(normalizeParticipantToken("z".repeat(64)), null);
});

test("a pending principal link is ready only while the record awaits the principal", () => {
  assert.equal(participantEntryDecision({
    role: "principal",
    invitationStatus: "pending",
    invitationExpiresAt: future,
    recordStatus: "awaiting_principal",
    now,
  }), "ready");
  assert.equal(participantEntryDecision({
    role: "principal",
    invitationStatus: "pending",
    invitationExpiresAt: future,
    recordStatus: "awaiting_representative",
    now,
  }), "unavailable");
});

test("representative access waits until the principal confirms", () => {
  assert.equal(participantEntryDecision({
    role: "representative",
    invitationStatus: "pending",
    invitationExpiresAt: future,
    recordStatus: "awaiting_principal",
    now,
  }), "waiting");
  assert.equal(participantEntryDecision({
    role: "representative",
    invitationStatus: "pending",
    invitationExpiresAt: future,
    recordStatus: "awaiting_representative",
    now,
  }), "ready");
});

test("representative resume links are ready while evidence work is active", () => {
  for (const recordStatus of ["evidence_required", "ready_to_submit", "information_requested"]) {
    assert.equal(participantEntryDecision({
      role: "representative",
      invitationStatus: "pending",
      invitationExpiresAt: "2026-09-01T12:00:00.000Z",
      recordStatus,
      now: "2026-08-30T12:00:00.000Z",
    }), "ready");
  }
});

test("both participant roles can open a final institution receipt", () => {
  for (const role of ["principal", "representative"] as const) {
    for (const recordStatus of ["accepted", "accepted_with_limits", "rejected", "revoked", "expired"]) {
      assert.equal(participantEntryDecision({
        role,
        invitationStatus: "pending",
        invitationExpiresAt: future,
        recordStatus,
        now,
      }), "ready");
    }
  }
});

test("expired, used, and revoked invitations never become ready", () => {
  assert.equal(participantEntryDecision({
    role: "principal",
    invitationStatus: "pending",
    invitationExpiresAt: "2026-08-28T23:59:59.000Z",
    recordStatus: "awaiting_principal",
    now,
  }), "expired");
  assert.equal(participantEntryDecision({
    role: "principal",
    invitationStatus: "accepted",
    invitationExpiresAt: future,
    recordStatus: "awaiting_principal",
    now,
  }), "already_used");
  assert.equal(participantEntryDecision({
    role: "principal",
    invitationStatus: "revoked",
    invitationExpiresAt: future,
    recordStatus: "awaiting_principal",
    now,
  }), "unavailable");
});

test("participant overview paths encode the record identifier", () => {
  assert.equal(participantOverviewPath("record/one"), "/request/record%2Fone/overview");
});

test("only the principal can confirm or decline while the request awaits the principal", () => {
  assert.equal(participantDecisionTransition({
    role: "principal",
    recordStatus: "awaiting_principal",
    decision: "principal_confirm",
    acknowledged: true,
    reason: "",
  }), "awaiting_representative");
  assert.equal(participantDecisionTransition({
    role: "principal",
    recordStatus: "awaiting_principal",
    decision: "principal_decline",
    acknowledged: true,
    reason: "The request does not match my instructions.",
  }), "declined");
  assert.throws(() => participantDecisionTransition({
    role: "representative",
    recordStatus: "awaiting_principal",
    decision: "principal_confirm",
    acknowledged: true,
    reason: "",
  }), /participant_decision_not_allowed/);
});

test("representative acceptance unlocks requirements and representative decline ends the request", () => {
  assert.equal(participantDecisionTransition({
    role: "representative",
    recordStatus: "awaiting_representative",
    decision: "representative_accept",
    acknowledged: true,
    reason: "",
  }), "evidence_required");
  assert.equal(participantDecisionTransition({
    role: "representative",
    recordStatus: "awaiting_representative",
    decision: "representative_decline",
    acknowledged: true,
    reason: "I cannot take this responsibility.",
  }), "declined");
});

test("participant decisions require explicit acknowledgment and declines require a reason", () => {
  assert.throws(() => participantDecisionTransition({
    role: "principal",
    recordStatus: "awaiting_principal",
    decision: "principal_confirm",
    acknowledged: false,
    reason: "",
  }), /participant_acknowledgment_required/);
  assert.throws(() => participantDecisionTransition({
    role: "representative",
    recordStatus: "awaiting_representative",
    decision: "representative_decline",
    acknowledged: true,
    reason: "no",
  }), /participant_decline_reason_required/);
});
