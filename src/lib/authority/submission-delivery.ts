import { createHash } from "node:crypto";
import type { ParticipantInvitationDelivery, ParticipantDeliveryResult } from "./participant-invitation-delivery.ts";

export type SubmissionDeliveryJob = {
  id: string;
  lease_token: string;
  kind: "copy" | "invitation";
  payload: Record<string, unknown>;
};

export type SubmissionDeliveryIO = {
  download(bucket: string, path: string): Promise<Uint8Array>;
  upload(bucket: string, path: string, bytes: Uint8Array, mediaType: string): Promise<"created" | "exists">;
  invite(delivery: ParticipantInvitationDelivery): Promise<ParticipantDeliveryResult>;
  appUrl: string;
};

function required(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("delivery_payload_invalid");
  return value;
}

function fingerprint(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function executeSubmissionDelivery(job: SubmissionDeliveryJob, io: SubmissionDeliveryIO): Promise<string | null> {
  const p = job.payload;
  if (job.kind === "copy") {
    const fromBucket = required(p.from_bucket);
    const toBucket = required(p.to_bucket);
    if (fromBucket !== "authority-submission-evidence" || toBucket !== "authority-evidence") throw new Error("delivery_payload_invalid");
    const bytes = await io.download(fromBucket, required(p.from_path));
    const sha = required(p.sha256);
    if (fingerprint(bytes) !== sha) throw new Error("evidence_fingerprint_mismatch");
    const result = await io.upload(toBucket, required(p.to_path), bytes, required(p.media_type));
    if (result === "exists") {
      const saved = await io.download(toBucket, required(p.to_path));
      if (fingerprint(saved) !== sha) throw new Error("evidence_fingerprint_mismatch");
    }
    return null;
  }
  const token = required(p.token);
  if (!/^[a-f0-9]{64}$/.test(token) || !["principal", "representative"].includes(String(p.role))) throw new Error("delivery_payload_invalid");
  const result = await io.invite({
    invitationId: required(p.invitation_id),
    invitationVersion: Number(p.invitation_version),
    participantRole: p.role as "principal" | "representative",
    email: required(p.email),
    institutionName: required(p.institution_name),
    participantName: required(p.participant_name),
    otherPersonName: required(p.other_person_name),
    purpose: required(p.purpose),
    accountBoundary: required(p.account_boundary),
    expiresAt: required(p.expires_at),
    secureUrl: new URL(`/r/${token}`, io.appUrl).toString(),
  });
  if (!result.accepted) throw new Error(result.reason);
  return result.messageId;
}

export function submissionDeliveryMessage(status: { total: number; completed: number; needs_attention: number } | null) {
  if (!status || status.total === 0) return "Delivery status is not available. Your request is saved. Contact Passage before starting another request.";
  if (status.needs_attention > 0) return "Some files or invitations need help. Contact Passage with your reference number. Do not start another request.";
  if (status.completed < status.total) return "Your request is saved. Some files or invitations are still waiting. You can retry the remaining steps here.";
  return "Files are ready and the email provider accepted the invitations. This does not confirm that they reached each inbox.";
}
