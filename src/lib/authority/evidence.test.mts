import assert from "node:assert/strict";
import test from "node:test";
import { evidenceStoragePath, MAX_EVIDENCE_FILE_BYTES, prepareEvidenceUpload } from "./evidence.ts";

test("evidence upload accepts bounded PDF and image sources", () => {
  assert.deepEqual(prepareEvidenceUpload({ name: " financial-poa.pdf ", type: "application/pdf", size: 4200 }), {
    originalFilename: "financial-poa.pdf",
    mediaType: "application/pdf",
    byteSize: 4200,
    extension: "pdf",
  });
  assert.equal(prepareEvidenceUpload({ name: "id.png", type: "image/png", size: 900 }).extension, "png");
});

test("evidence upload rejects unsupported, empty, and oversized files", () => {
  assert.throws(() => prepareEvidenceUpload({ name: "notes.txt", type: "text/plain", size: 20 }), /evidence_file_type_not_allowed/);
  assert.throws(() => prepareEvidenceUpload({ name: "empty.pdf", type: "application/pdf", size: 0 }), /evidence_file_empty/);
  assert.throws(() => prepareEvidenceUpload({ name: "large.pdf", type: "application/pdf", size: MAX_EVIDENCE_FILE_BYTES + 1 }), /evidence_file_too_large/);
});

test("evidence storage paths are record and artifact bound", () => {
  assert.equal(
    evidenceStoragePath("bca49cd9-4883-4a13-a4ba-69e715afc404", "8e51a807-8705-4d0b-aa5d-214cbf90a341", "pdf"),
    "bca49cd9-4883-4a13-a4ba-69e715afc404/8e51a807-8705-4d0b-aa5d-214cbf90a341/source.pdf",
  );
  assert.throws(() => evidenceStoragePath("../record", "artifact", "pdf"), /evidence_path_invalid/);
});
