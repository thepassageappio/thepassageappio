import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { executeSubmissionDelivery, submissionDeliveryMessage, type SubmissionDeliveryIO, type SubmissionDeliveryJob } from "./submission-delivery.ts";

const bytes = new TextEncoder().encode("synthetic document");
const copy: SubmissionDeliveryJob = { id: "job", lease_token: "lease", kind: "copy", payload: {
  from_bucket: "authority-submission-evidence", from_path: "group/source.pdf", to_bucket: "authority-evidence", to_path: "case/copy.pdf",
  sha256: createHash("sha256").update(bytes).digest("hex"), media_type: "application/pdf",
} };
const io: SubmissionDeliveryIO = {
  appUrl: "https://example.invalid", download: async () => bytes, upload: async () => "created",
  invite: async () => ({ accepted: true, provider: "resend", messageId: "message" }),
};

test("a retry accepts an existing identical copy without overwriting it", async () => {
  const downloaded: string[] = [];
  assert.equal(await executeSubmissionDelivery(copy, { ...io, upload: async () => "exists", download: async (bucket) => { downloaded.push(bucket); return bytes; } }), null);
  assert.deepEqual(downloaded, ["authority-submission-evidence", "authority-evidence"]);
});
test("a mismatched existing destination is a failure, not a completed copy", async () => {
  await assert.rejects(executeSubmissionDelivery(copy, { ...io, upload: async () => "exists", download: async bucket => bucket === "authority-evidence" ? new Uint8Array([1]) : bytes }), /fingerprint_mismatch/);
});
test("changed source evidence never reaches storage upload", async () => {
  let uploads = 0;
  await assert.rejects(executeSubmissionDelivery(copy, { ...io, download: async () => new Uint8Array([2]), upload: async () => { uploads++; return "created"; } }), /fingerprint_mismatch/);
  assert.equal(uploads, 0);
});
test("storage exceptions leave work failed for the durable worker to retry", async () => {
  await assert.rejects(executeSubmissionDelivery(copy, { ...io, upload: async () => { throw new Error("unavailable"); } }), /unavailable/);
});
const invitation: SubmissionDeliveryJob = { id: "inv", lease_token: "lease", kind: "invitation", payload: {
  invitation_id: "actual-invitation-id", invitation_version: 1, role: "principal", token: "a".repeat(64),
  email: "person@example.invalid", institution_name: "Test Bank", participant_name: "Synthetic Person", other_person_name: "Synthetic Rep",
  purpose: "financial_poa", account_boundary: "Synthetic only", expires_at: "2030-01-01T00:00:00Z",
} };
test("invitation retries retain the actual invitation identity and saved expiry", async () => {
  const sent: unknown[] = [];
  const adapter: SubmissionDeliveryIO = { ...io, invite: async delivery => { sent.push(delivery); return { accepted: true, provider: "resend", messageId: "same-message" }; } };
  await executeSubmissionDelivery(invitation, adapter);
  await executeSubmissionDelivery(invitation, adapter);
  assert.deepEqual(sent[0], sent[1]);
  assert.equal((sent[0] as { invitationId: string }).invitationId, "actual-invitation-id");
});
test("provider rejection is not recorded as success", async () => {
  await assert.rejects(executeSubmissionDelivery(invitation, { ...io, invite: async () => ({ accepted: false, provider: "resend", reason: "provider_rejected" }) }), /provider_rejected/);
});
test("untracked and incomplete deliveries never claim successful sending", () => {
  assert.match(submissionDeliveryMessage(null), /not available/);
  assert.match(submissionDeliveryMessage({ total: 4, completed: 2, needs_attention: 0 }), /still waiting/);
  assert.match(submissionDeliveryMessage({ total: 4, completed: 2, needs_attention: 1 }), /need help/);
  assert.match(submissionDeliveryMessage({ total: 4, completed: 4, needs_attention: 0 }), /does not confirm/);
});
