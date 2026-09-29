import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { MAX_EVIDENCE_FILE_BYTES, prepareEvidenceUpload } from "./evidence.ts";
import {
  assertParticipantRequirementUploadable,
  assertSubmissionSession,
  assertSubmissionUploadable,
  isSubmissionRequirementKey,
  participantUploadRequirement,
} from "./evidence-upload-access.ts";
import type { ParticipantEvidenceContext, ParticipantEvidenceRequirement } from "./participant-evidence.ts";
import {
  checkEvidenceFile,
  EVIDENCE_UPLOAD_MAX_BYTES,
  EVIDENCE_UPLOAD_MESSAGES,
  evidenceUploadProblemFromCode,
  resolveEvidenceMediaType,
  sniffEvidenceMediaType,
  type EvidenceUploadMediaType,
} from "./evidence-upload.ts";
import { finalizeEvidenceUpload, verifyUploadedEvidence, type EvidenceObjectStore, type FinalizeEvidenceDeps } from "./evidence-upload-verify.ts";
import { MAX_GROUP_EVIDENCE_FILE_BYTES, prepareGroupEvidenceUpload, type RequesterSessionContext } from "./multi-institution-submission.ts";
import { participantRequirementsError } from "./participant-requirements-notice.ts";
import { userErrorMessage } from "./user-messages.ts";

const TEN_MIB = 10 * 1024 * 1024;
const PDF_HEAD = new TextEncoder().encode("%PDF-1.7\n%synthetic\n");
const PNG_HEAD = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPEG_HEAD = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46]);

function filled(head: Uint8Array, size: number) {
  const bytes = new Uint8Array(size);
  bytes.set(head.subarray(0, Math.min(head.length, size)));
  return bytes;
}

type FakeObject = { bytes: Uint8Array; contentType: string | null; infoSize?: number | null };

function fakeStore(objects: Record<string, FakeObject>, options: { failInfo?: boolean; failDownload?: boolean } = {}) {
  const calls = { info: 0, download: 0, removed: [] as string[] };
  const store: EvidenceObjectStore = {
    async info(bucket, path) {
      calls.info += 1;
      if (options.failInfo) throw new Error("storage down");
      const object = objects[`${bucket}/${path}`];
      if (!object) return null;
      return { size: object.infoSize === undefined ? object.bytes.byteLength : object.infoSize, contentType: object.contentType };
    },
    async download(bucket, path) {
      calls.download += 1;
      if (options.failDownload) throw new Error("storage down");
      const object = objects[`${bucket}/${path}`];
      return object ? { bytes: object.bytes, contentType: object.contentType } : null;
    },
    async remove(bucket, path) {
      calls.removed.push(`${bucket}/${path}`);
      delete objects[`${bucket}/${path}`];
    },
  };
  return { store, calls, objects };
}

const target = { bucket: "authority-evidence", path: "rec/art/source.pdf", mediaType: "application/pdf" as EvidenceUploadMediaType };
const key = `${target.bucket}/${target.path}`;

// --- Plain-language messages -------------------------------------------------

test("upload messages are the exact plain wording people see", () => {
  assert.equal(EVIDENCE_UPLOAD_MESSAGES.file_too_large, "This file is too big. Files can be up to 10 MB.");
  assert.equal(EVIDENCE_UPLOAD_MESSAGES.file_type_not_allowed, "This file type can't be used. Upload a PDF, JPEG, or PNG.");
  assert.match(EVIDENCE_UPLOAD_MESSAGES.upload_interrupted, /did not finish.*try again/i);
  for (const message of Object.values(EVIDENCE_UPLOAD_MESSAGES)) {
    assert.doesNotMatch(message, /MiB|MIME|bucket|storage|payload|server|error code|evidence_/i);
  }
});

test("server codes reach both upload screens as the same plain messages", () => {
  assert.equal(userErrorMessage("evidence_file_too_large"), EVIDENCE_UPLOAD_MESSAGES.file_too_large);
  assert.equal(userErrorMessage("evidence_file_type_not_allowed"), EVIDENCE_UPLOAD_MESSAGES.file_type_not_allowed);
  assert.equal(userErrorMessage("evidence_upload_missing"), EVIDENCE_UPLOAD_MESSAGES.upload_interrupted);
  assert.equal(participantRequirementsError("file_too_large"), EVIDENCE_UPLOAD_MESSAGES.file_too_large);
  assert.equal(participantRequirementsError("file_type_not_allowed"), EVIDENCE_UPLOAD_MESSAGES.file_type_not_allowed);
  assert.equal(participantRequirementsError("upload_interrupted"), EVIDENCE_UPLOAD_MESSAGES.upload_interrupted);
  assert.equal(participantRequirementsError(undefined), null);
  assert.equal(evidenceUploadProblemFromCode("evidence_upload_missing"), "upload_interrupted");
});

// --- Size boundary ------------------------------------------------------------

test("every limit is exactly 10 MiB", () => {
  assert.equal(EVIDENCE_UPLOAD_MAX_BYTES, TEN_MIB);
  assert.equal(MAX_EVIDENCE_FILE_BYTES, TEN_MIB);
  assert.equal(MAX_GROUP_EVIDENCE_FILE_BYTES, TEN_MIB);
});

test("a file of exactly 10 MiB passes every check and 10 MiB + 1 byte fails every check", () => {
  assert.deepEqual(checkEvidenceFile({ name: "poa.pdf", type: "application/pdf", size: TEN_MIB }), { ok: true, mediaType: "application/pdf", size: TEN_MIB });
  assert.deepEqual(checkEvidenceFile({ name: "poa.pdf", type: "application/pdf", size: TEN_MIB + 1 }), { ok: false, problem: "file_too_large" });
  assert.equal(prepareEvidenceUpload({ name: "poa.pdf", type: "application/pdf", size: TEN_MIB }).byteSize, TEN_MIB);
  assert.throws(() => prepareEvidenceUpload({ name: "poa.pdf", type: "application/pdf", size: TEN_MIB + 1 }), /evidence_file_too_large/);
  assert.equal(prepareGroupEvidenceUpload({ name: "poa.pdf", type: "application/pdf", size: TEN_MIB }).byteSize, TEN_MIB);
  assert.throws(() => prepareGroupEvidenceUpload({ name: "poa.pdf", type: "application/pdf", size: TEN_MIB + 1 }), /evidence_file_too_large/);
});

test("empty and missing files are caught before upload", () => {
  assert.deepEqual(checkEvidenceFile({ name: "poa.pdf", type: "application/pdf", size: 0 }), { ok: false, problem: "file_empty" });
  assert.deepEqual(checkEvidenceFile(null), { ok: false, problem: "file_required" });
  assert.deepEqual(checkEvidenceFile({ name: "  ", type: "application/pdf", size: 10 }), { ok: false, problem: "file_required" });
});

// --- Type allowlist -----------------------------------------------------------

test("only PDF, JPEG, and PNG are allowed", () => {
  for (const [name, type] of [["a.pdf", "application/pdf"], ["a.jpg", "image/jpeg"], ["a.png", "image/png"]]) {
    assert.equal(checkEvidenceFile({ name, type, size: 10 }).ok, true, type);
  }
  for (const [name, type] of [["a.gif", "image/gif"], ["a.txt", "text/plain"], ["a.heic", "image/heic"], ["a.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ["a.svg", "image/svg+xml"]]) {
    assert.deepEqual(checkEvidenceFile({ name, type, size: 10 }), { ok: false, problem: "file_type_not_allowed" }, type);
  }
});

test("a missing browser type falls back to the extension, and a real type always wins", () => {
  assert.equal(resolveEvidenceMediaType("Scan.PDF", ""), "application/pdf");
  assert.equal(resolveEvidenceMediaType("photo.jpeg", "application/octet-stream"), "image/jpeg");
  assert.equal(resolveEvidenceMediaType("run.exe", ""), null);
  assert.equal(resolveEvidenceMediaType("notes.pdf", "text/plain"), null);
});

// --- Content (magic bytes) ------------------------------------------------------

test("file content is identified from its first bytes", () => {
  assert.equal(sniffEvidenceMediaType(PDF_HEAD), "application/pdf");
  assert.equal(sniffEvidenceMediaType(new Uint8Array([0xef, 0xbb, 0xbf, ...PDF_HEAD])), "application/pdf");
  assert.equal(sniffEvidenceMediaType(PNG_HEAD), "image/png");
  assert.equal(sniffEvidenceMediaType(JPEG_HEAD), "image/jpeg");
  assert.equal(sniffEvidenceMediaType(new TextEncoder().encode("<html>not a pdf</html>")), null);
  assert.equal(sniffEvidenceMediaType(new Uint8Array([0x4d, 0x5a, 0x90, 0])), null);
  assert.equal(sniffEvidenceMediaType(new Uint8Array()), null);
});

// --- Stored object check ------------------------------------------------------

test("a valid stored PDF of exactly 10 MiB is accepted and fingerprinted from the stored bytes", async () => {
  const bytes = filled(PDF_HEAD, TEN_MIB);
  const { store, calls } = fakeStore({ [key]: { bytes, contentType: "application/pdf" } });
  const result = await verifyUploadedEvidence(store, target);
  assert.deepEqual(result, { ok: true, byteSize: TEN_MIB, sha256Hex: createHash("sha256").update(bytes).digest("hex") });
  assert.deepEqual(calls.removed, []);
});

test("a missing object is rejected and nothing is deleted", async () => {
  const { store, calls } = fakeStore({});
  assert.deepEqual(await verifyUploadedEvidence(store, target), { ok: false, code: "evidence_upload_missing" });
  assert.deepEqual(calls.removed, []);
  assert.equal(calls.download, 0);
});

test("an object over 10 MiB is deleted before it is downloaded", async () => {
  const { store, calls, objects } = fakeStore({ [key]: { bytes: filled(PDF_HEAD, 16), contentType: "application/pdf", infoSize: TEN_MIB + 1 } });
  assert.deepEqual(await verifyUploadedEvidence(store, target), { ok: false, code: "evidence_file_too_large" });
  assert.deepEqual(calls.removed, [key]);
  assert.equal(calls.download, 0);
  assert.equal(objects[key], undefined);
});

test("the downloaded size is checked even when metadata has no size", async () => {
  const { store, calls } = fakeStore({ [key]: { bytes: filled(PDF_HEAD, TEN_MIB + 1), contentType: "application/pdf", infoSize: null } });
  assert.deepEqual(await verifyUploadedEvidence(store, target), { ok: false, code: "evidence_file_too_large" });
  assert.deepEqual(calls.removed, [key]);
});

test("content that does not match the declared type is deleted", async () => {
  const { store, calls } = fakeStore({ [key]: { bytes: filled(PNG_HEAD, 2048), contentType: "application/pdf" } });
  assert.deepEqual(await verifyUploadedEvidence(store, target), { ok: false, code: "evidence_file_type_not_allowed" });
  assert.deepEqual(calls.removed, [key]);
});

test("a renamed text file labeled as PDF is deleted", async () => {
  const { store, calls } = fakeStore({ [key]: { bytes: new TextEncoder().encode("hello, not a pdf"), contentType: "application/pdf" } });
  assert.deepEqual(await verifyUploadedEvidence(store, target), { ok: false, code: "evidence_file_type_not_allowed" });
  assert.deepEqual(calls.removed, [key]);
});

test("stored type metadata that differs from the declared type is deleted", async () => {
  const { store, calls } = fakeStore({ [key]: { bytes: filled(PDF_HEAD, 2048), contentType: "text/html" } });
  assert.deepEqual(await verifyUploadedEvidence(store, target), { ok: false, code: "evidence_file_type_not_allowed" });
  assert.deepEqual(calls.removed, [key]);
});

test("an empty stored object is deleted", async () => {
  const { store, calls } = fakeStore({ [key]: { bytes: new Uint8Array(), contentType: "application/pdf" } });
  assert.deepEqual(await verifyUploadedEvidence(store, target), { ok: false, code: "evidence_file_empty" });
  assert.deepEqual(calls.removed, [key]);
});

test("a storage outage keeps the object so the same upload can be finished later", async () => {
  const bytes = filled(PDF_HEAD, 64);
  for (const options of [{ failInfo: true }, { failDownload: true }]) {
    const { store, calls } = fakeStore({ [key]: { bytes, contentType: "application/pdf" } }, options);
    assert.deepEqual(await verifyUploadedEvidence(store, target), { ok: false, code: "evidence_storage_unavailable" });
    assert.deepEqual(calls.removed, []);
  }
});

// --- Finalize order: authorize, replay, check, record, clean up ------------------

function finalizeHarness(overrides: Partial<FinalizeEvidenceDeps<{ user: string }>> = {}, objects: Record<string, FakeObject> = { [key]: { bytes: filled(PDF_HEAD, 6 * 1024 * 1024), contentType: "application/pdf" } }) {
  const fake = fakeStore(objects);
  const recorded: Array<{ byteSize: number; sha256Hex: string }> = [];
  const deps: FinalizeEvidenceDeps<{ user: string }> = {
    authorize: async () => ({ user: "representative" }),
    assertUploadable: () => undefined,
    recordedOwner: async () => null,
    store: fake.store,
    record: async (_auth, verified) => { recorded.push({ byteSize: verified.byteSize, sha256Hex: verified.sha256Hex }); },
    ...overrides,
  };
  const input = { scopeId: "rec", artifactId: "art", ...target };
  return { deps, input, recorded, ...fake };
}

test("a 6 MB PDF is checked, fingerprinted, and recorded once", async () => {
  const { deps, input, recorded, calls, objects } = finalizeHarness();
  assert.deepEqual(await finalizeEvidenceUpload(deps, input), { replayed: false });
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].byteSize, 6 * 1024 * 1024);
  assert.equal(recorded[0].sha256Hex, createHash("sha256").update(objects[key].bytes).digest("hex"));
  assert.deepEqual(calls.removed, []);
});

test("a caller without access is rejected before storage is touched", async () => {
  const { deps, input, recorded, calls } = finalizeHarness({ authorize: async () => { throw new Error("participant_session_unavailable"); } });
  await assert.rejects(finalizeEvidenceUpload(deps, input), /participant_session_unavailable/);
  assert.equal(calls.info + calls.download, 0);
  assert.deepEqual(calls.removed, []);
  assert.equal(recorded.length, 0);
});

test("a requirement that no longer takes files is rejected before storage is touched", async () => {
  const { deps, input, recorded, calls } = finalizeHarness({ assertUploadable: () => { throw new Error("evidence_requirement_not_uploadable"); } });
  await assert.rejects(finalizeEvidenceUpload(deps, input), /evidence_requirement_not_uploadable/);
  assert.equal(calls.info + calls.download, 0);
  assert.equal(recorded.length, 0);
});

test("finalize rejects a missing object and records nothing", async () => {
  const { deps, input, recorded } = finalizeHarness({}, {});
  await assert.rejects(finalizeEvidenceUpload(deps, input), /evidence_upload_missing/);
  assert.equal(recorded.length, 0);
});

test("finalize rejects and deletes an oversize object and records nothing", async () => {
  const { deps, input, recorded, calls } = finalizeHarness({}, { [key]: { bytes: filled(PDF_HEAD, TEN_MIB + 1), contentType: "application/pdf" } });
  await assert.rejects(finalizeEvidenceUpload(deps, input), /evidence_file_too_large/);
  assert.deepEqual(calls.removed, [key]);
  assert.equal(recorded.length, 0);
});

test("finalize rejects and deletes a magic-byte mismatch and records nothing", async () => {
  const { deps, input, recorded, calls } = finalizeHarness({}, { [key]: { bytes: filled(JPEG_HEAD, 4096), contentType: "application/pdf" } });
  await assert.rejects(finalizeEvidenceUpload(deps, input), /evidence_file_type_not_allowed/);
  assert.deepEqual(calls.removed, [key]);
  assert.equal(recorded.length, 0);
});

test("when recording fails and no row uses the object, the object is deleted", async () => {
  const { deps, input, calls } = finalizeHarness({ record: async () => { throw new Error("participant_record_changed"); } });
  await assert.rejects(finalizeEvidenceUpload(deps, input), /participant_record_changed/);
  assert.deepEqual(calls.removed, [key]);
});

test("when recording saved the row but the reply was lost, the object is kept and the upload succeeds", async () => {
  let saved = false;
  const { deps, input, calls } = finalizeHarness({
    recordedOwner: async () => (saved ? "rec" : null),
    record: async () => { saved = true; throw new Error("network"); },
  });
  assert.deepEqual(await finalizeEvidenceUpload(deps, input), { replayed: false });
  assert.deepEqual(calls.removed, []);
});

test("when the row check itself fails after a recording error, the object is kept", async () => {
  let checks = 0;
  const { deps, input, calls } = finalizeHarness({
    recordedOwner: async () => { checks += 1; if (checks > 1) throw new Error("db down"); return null; },
    record: async () => { throw new Error("network"); },
  });
  await assert.rejects(finalizeEvidenceUpload(deps, input), /network/);
  assert.deepEqual(calls.removed, []);
});

test("repeating a finished upload succeeds without checking, recording, or deleting again", async () => {
  const { deps, input, recorded, calls } = finalizeHarness({ recordedOwner: async () => "rec" });
  assert.deepEqual(await finalizeEvidenceUpload(deps, input), { replayed: true });
  assert.equal(calls.info + calls.download, 0);
  assert.deepEqual(calls.removed, []);
  assert.equal(recorded.length, 0);
});

test("an id already saved for another request is refused without touching its file", async () => {
  const { deps, input, recorded, calls } = finalizeHarness({ recordedOwner: async () => "other-record" });
  await assert.rejects(finalizeEvidenceUpload(deps, input), /evidence_path_invalid/);
  assert.equal(calls.info + calls.download, 0);
  assert.deepEqual(calls.removed, []);
  assert.equal(recorded.length, 0);
});

// --- Who may upload -----------------------------------------------------------

function requirement(overrides: Partial<ParticipantEvidenceRequirement> = {}): ParticipantEvidenceRequirement {
  return { id: "req-1", requirementKey: "poa_document", title: "POA", reason: "Needed", inputKind: "document", status: "not_started", ordinal: 1, version: 1, artifact: null, ...overrides };
}
const participantContext: ParticipantEvidenceContext = {
  authorityRecordId: "bca49cd9-4883-4a13-a4ba-69e715afc404",
  recordVersion: 4,
  status: "evidence_required",
  requirements: [requirement(), requirement({ id: "req-2", requirementKey: "representative_certification", inputKind: "attestation" })],
};

test("only the representative's own session can upload, and only to a document requirement", () => {
  assert.equal(participantUploadRequirement({ participantRole: "representative", context: participantContext, requirementKey: "poa_document" }).id, "req-1");
  assert.throws(() => participantUploadRequirement({ participantRole: "principal", context: participantContext, requirementKey: "poa_document" }), /evidence_not_available/);
  assert.throws(() => participantUploadRequirement({ participantRole: undefined, context: participantContext, requirementKey: "poa_document" }), /evidence_not_available/);
  assert.throws(() => participantUploadRequirement({ participantRole: "representative", context: null, requirementKey: "poa_document" }), /evidence_not_available/);
  assert.throws(() => participantUploadRequirement({ participantRole: "representative", context: participantContext, requirementKey: "representative_certification" }), /evidence_requirement_unavailable/);
  assert.throws(() => participantUploadRequirement({ participantRole: "representative", context: participantContext, requirementKey: "made_up" }), /evidence_requirement_unavailable/);
});

test("a requirement takes a file only while it is not started or needs attention", () => {
  assert.doesNotThrow(() => assertParticipantRequirementUploadable(requirement({ status: "not_started" })));
  assert.doesNotThrow(() => assertParticipantRequirementUploadable(requirement({ status: "needs_attention" })));
  assert.throws(() => assertParticipantRequirementUploadable(requirement({ status: "review_pending" })), /evidence_requirement_not_uploadable/);
  assert.throws(() => assertParticipantRequirementUploadable(requirement({ status: "completed" })), /evidence_requirement_not_uploadable/);
});

const groupId = "5f0c3a52-9f59-4c3a-9d5e-0f7d8f1c2b3a";
const groupContext = { groupId, status: "draft", version: 7 } as RequesterSessionContext;

test("only the requester session for this draft submission can upload", () => {
  assert.equal(assertSubmissionSession(groupId, groupContext), groupContext);
  assert.throws(() => assertSubmissionSession(groupId, null), /requester_session_unavailable/);
  assert.throws(() => assertSubmissionSession("8e51a807-8705-4d0b-aa5d-214cbf90a341", groupContext), /requester_session_unavailable/);
  assert.throws(() => assertSubmissionSession("../other", groupContext), /requester_session_unavailable/);
  assert.doesNotThrow(() => assertSubmissionUploadable(groupContext, 7));
  assert.throws(() => assertSubmissionUploadable({ ...groupContext, status: "fanned_out" }, 7), /submission_group_not_submittable/);
  assert.throws(() => assertSubmissionUploadable(groupContext, 6), /version_conflict/);
  assert.equal(isSubmissionRequirementKey("power_of_attorney"), true);
  assert.equal(isSubmissionRequirementKey("identity_evidence"), true);
  assert.equal(isSubmissionRequirementKey("selfie"), false);
});
