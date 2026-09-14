import assert from "node:assert/strict";
import test from "node:test";
import {
  mapRequesterSessionContext,
  prepareParticipantDetails,
  prepareRequesterAttestation,
  prepareRequesterIntake,
  prepareTargetInput,
} from "./multi-institution-submission.ts";

test("requester intake is normalized", () => {
  const result = prepareRequesterIntake({
    name: "  Casey Quinn ",
    email: " Casey.Quinn@Example.com ",
    relationship: "representative",
  });
  assert.deepEqual(result, { name: "Casey Quinn", email: "casey.quinn@example.com", relationship: "representative" });
});

test("requester intake rejects an unsupported relationship", () => {
  assert.throws(
    () => prepareRequesterIntake({ name: "Casey Quinn", email: "casey@example.com", relationship: "neighbor" }),
    /requester_relationship_invalid/,
  );
});

test("participant details require a reason when principal confirmation is unavailable", () => {
  const base = {
    principalName: "Parker Quinn",
    principalEmail: "parker@example.com",
    representativeName: "Casey Quinn",
    representativeEmail: "casey@example.com",
    principalConfirmationAvailable: false as const,
    principalConfirmationUnavailableReason: "",
  };
  assert.throws(() => prepareParticipantDetails(base), /principal_confirmation_reason_required/);
  const result = prepareParticipantDetails({ ...base, principalConfirmationUnavailableReason: "Principal has advanced dementia and cannot participate." });
  assert.equal(result.principalConfirmationUnavailableReason, "Principal has advanced dementia and cannot participate.");
});

test("participant details reject the same email in both roles", () => {
  assert.throws(
    () => prepareParticipantDetails({
      principalName: "Parker Quinn",
      principalEmail: "same@example.com",
      representativeName: "Casey Quinn",
      representativeEmail: "same@example.com",
      principalConfirmationAvailable: true,
      principalConfirmationUnavailableReason: "",
    }),
    /participant_roles_must_be_distinct/,
  );
});

test("target input requires a plausible label and type", () => {
  assert.throws(() => prepareTargetInput({ label: "A", institutionType: "bank", organizationId: null }), /target_label_invalid/);
  const result = prepareTargetInput({ label: " Third National Bank ", institutionType: " regional_bank ", organizationId: null });
  assert.deepEqual(result, { label: "Third National Bank", institutionType: "regional_bank", organizationId: null });
});

test("requester attestation requires acknowledgment", () => {
  assert.throws(() => prepareRequesterAttestation({ acknowledged: false }), /requester_attestation_required/);
  const result = prepareRequesterAttestation({ acknowledged: true });
  assert.equal(result.textVersion, "requester-attestation-2026-09-13");
});

test("mapRequesterSessionContext maps targets and evidence", () => {
  const context = mapRequesterSessionContext({
    group_id: "11111111-1111-1111-1111-111111111111",
    reference_code: "PG-ABCDEFGHIJ",
    status: "draft",
    version: 3,
    requester_name: "Casey Quinn",
    requester_relationship: "representative",
    principal_name: "Parker Quinn",
    principal_email_normalized: "parker@example.com",
    representative_name: "Casey Quinn",
    representative_email_normalized: "casey@example.com",
    principal_confirmation_available: true,
    principal_confirmation_unavailable_reason: null,
    review_flag: "standard",
    session_expires_at: "2026-09-13T16:00:00.000Z",
    targets: [{ id: "t1", ordinal: 1, target_label: "Third National Bank", target_institution_type: "regional_bank", match_status: "matched", organization_id: "o1", authority_record_id: null, version: 1 }],
    evidence: [{ id: "e1", requirement_key: "power_of_attorney", original_filename: "poa.pdf", media_type: "application/pdf", byte_size: 1024 }],
  });
  assert.ok(context);
  assert.equal(context?.targets.length, 1);
  assert.equal(context?.evidence[0]?.requirementKey, "power_of_attorney");
});
