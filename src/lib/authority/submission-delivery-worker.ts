import "server-only";
import { createAuthorityAdminClient } from "@/lib/supabase/admin";
import { getAuthorityAppUrl } from "@/lib/supabase/config";
import { deliverParticipantInvitation } from "./participant-invitation-delivery";
import { executeSubmissionDelivery, type SubmissionDeliveryJob } from "./submission-delivery";

export async function processSubmissionDelivery(groupId: string | null = null) {
  const admin = createAuthorityAdminClient();
  const start = Date.now();
  let completed = 0;
  let failed = 0;
  for (let index = 0; index < 20 && Date.now() - start < 25_000; index += 1) {
    const claimed = await admin.rpc("claim_submission_delivery_v1", { p_group_id: groupId });
    if (claimed.error) throw new Error("delivery_worker_unavailable");
    if (!claimed.data) break;
    if (claimed.data.skipped) continue;
    const job = claimed.data as SubmissionDeliveryJob;
    let messageId: string | null = null;
    let errorCode: string | null = null;
    try {
      messageId = await executeSubmissionDelivery(job, {
        appUrl: getAuthorityAppUrl(),
        invite: deliverParticipantInvitation,
        async download(bucket, path) {
          const { data, error } = await admin.storage.from(bucket).download(path);
          if (error || !data) throw new Error("evidence_storage_unavailable");
          return new Uint8Array(await data.arrayBuffer());
        },
        async upload(bucket, path, bytes, mediaType) {
          const { error } = await admin.storage.from(bucket).upload(path, bytes, { contentType: mediaType, upsert: false });
          if (error?.message === "The resource already exists" || (error && "statusCode" in error && String(error.statusCode) === "409")) return "exists";
          if (error) throw new Error("evidence_storage_unavailable");
          return "created";
        },
      });
    } catch (error) {
      const allowed = new Set(["delivery_payload_invalid", "evidence_fingerprint_mismatch", "evidence_storage_unavailable", "configuration_missing", "recipient_not_allowed", "provider_rejected"]);
      errorCode = error instanceof Error && allowed.has(error.message) ? error.message : "delivery_failed";
    }
    const finished = await admin.rpc("finish_submission_delivery_v1", {
      p_job_id: job.id, p_lease_token: job.lease_token,
      p_success: errorCode === null, p_error: errorCode, p_message_id: messageId,
    });
    if (finished.error) throw new Error("delivery_acknowledgment_unavailable");
    if (errorCode) failed += 1;
    else completed += 1;
  }
  return { completed, failed };
}
