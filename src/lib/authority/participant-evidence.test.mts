import assert from "node:assert/strict";
import test from "node:test";
import { evidenceRequirementStatusLabel, mapParticipantEvidenceContext } from "./participant-evidence.ts";

test("participant evidence maps requirements and source metadata without storage paths", () => {
  const context = mapParticipantEvidenceContext({
    authority_record_id: "record-1",
    record_version: 7,
    status: "evidence_required",
    requirements: [{
      id: "requirement-1",
      requirement_key: "power_of_attorney",
      title: "Power of attorney document",
      reason: "Review the source",
      input_kind: "document",
      status: "review_pending",
      ordinal: 1,
      version: 2,
      artifact: {
        id: "artifact-1",
        original_filename: "poa.pdf",
        media_type: "application/pdf",
        byte_size: 2000,
        provider_status: "not_started",
        review_status: "pending",
        reviewer_note: null,
        created_at: "2026-08-30T21:00:00.000Z",
      },
    }],
  });
  assert.equal(context?.recordVersion, 7);
  assert.equal(context?.requirements[0]?.artifact?.originalFilename, "poa.pdf");
  assert.equal(evidenceRequirementStatusLabel("review_pending"), "Institution review");
});
