"use server";

import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeParticipantToken, PARTICIPANT_SESSION_COOKIE, participantOverviewPath, type ParticipantDecision } from "@/lib/authority/participant-access";
import { participantReceiptPath } from "@/lib/authority/participant-receipt";
import { prepareHostedInformationResponse, prepareHostedWithdrawal } from "@/lib/authority/hosted-information";
import { prepareHostedSubmission } from "@/lib/authority/hosted-submission";
import { AUTHORITY_EVIDENCE_BUCKET, evidenceStoragePath, prepareEvidenceUpload } from "@/lib/authority/evidence";
import { getParticipantEvidenceContext } from "@/lib/authority/participant-session";
import { deliverParticipantInvitation } from "@/lib/authority/participant-invitation-delivery";
import { createAuthorityAdminClient } from "@/lib/supabase/admin";
import { getAuthorityAppUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function participantErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("message" in error)) return "link_unavailable";
  const message = String(error.message);
  const map: Record<string, string> = {
    participant_invitation_unavailable: "link_unavailable",
    participant_invitation_expired: "link_expired",
    participant_invitation_already_used: "link_used",
    participant_invitation_not_ready: "not_ready",
    participant_session_unavailable: "session_unavailable",
    participant_record_changed: "request_changed",
    participant_record_version_required: "request_changed",
    participant_decision_invalid: "decision_invalid",
    participant_decision_not_allowed: "decision_not_allowed",
    participant_acknowledgment_required: "acknowledgment_required",
    participant_decline_reason_required: "decline_reason_required",
    idempotency_payload_mismatch: "link_unavailable",
    evidence_file_required: "file_required",
    evidence_file_type_not_allowed: "file_type_not_allowed",
    evidence_file_empty: "file_empty",
    evidence_file_too_large: "file_too_large",
    evidence_path_invalid: "file_unavailable",
    evidence_storage_unavailable: "file_unavailable",
    evidence_not_available: "evidence_unavailable",
    evidence_requirement_unavailable: "evidence_unavailable",
    evidence_requirement_not_uploadable: "evidence_changed",
    certification_acknowledgment_required: "certification_required",
    certification_already_saved: "evidence_changed",
    information_response_required: "information_response_required",
    information_response_not_available: "information_response_not_available",
    information_request_unavailable: "information_request_unavailable",
    withdrawal_acknowledgment_required: "withdrawal_acknowledgment_required",
    withdrawal_reason_required: "withdrawal_reason_required",
    withdrawal_not_available: "withdrawal_not_available",
    submission_acknowledgment_required: "submission_acknowledgment_required",
    submission_not_available: "submission_not_available",
    submission_requirements_incomplete: "submission_requirements_incomplete",
    "Explain what you confirmed or added.": "information_response_required",
    "Explain why you can no longer serve.": "withdrawal_reason_required",
    "Confirm that you intend to withdraw from this responsibility.": "withdrawal_acknowledgment_required",
    "Confirm the information sharing before sending the request.": "submission_acknowledgment_required",
  };
  return map[message] ?? "link_unavailable";
}

export async function submitAuthorityForReviewAction(formData: FormData) {
  const recordId = textField(formData, "recordId");
  let destination = `/request/${encodeURIComponent(recordId)}/overview`;
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
    if (!sessionToken) throw new Error("participant_session_unavailable");
    const input = prepareHostedSubmission({ acknowledged: formData.get("acknowledged") === "on" });
    const admin = createAuthorityAdminClient();
    const { error } = await admin.rpc("submit_authority_for_review_v1", {
      p_session_token: sessionToken,
      p_authority_record_id: recordId,
      p_expected_version: Number(textField(formData, "expectedVersion")),
      p_acknowledged: input.acknowledged,
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    revalidatePath(`/request/${encodeURIComponent(recordId)}/overview`);
    revalidatePath(`/app/requests/${encodeURIComponent(recordId)}`);
    destination += "?notice=request_submitted";
  } catch (error) {
    destination += `?error=${encodeURIComponent(participantErrorCode(error))}`;
  }
  redirect(destination);
}

export async function uploadParticipantEvidenceAction(formData: FormData) {
  const recordId = textField(formData, "recordId");
  const requirementKey = textField(formData, "requirementKey");
  let destination = `/request/${encodeURIComponent(recordId)}/requirements`;
  let uploadedPath: string | null = null;

  try {
    const file = formData.get("evidenceFile");
    if (!(file instanceof File)) throw new Error("evidence_file_required");
    const prepared = prepareEvidenceUpload({ name: file.name, type: file.type, size: file.size });
    const context = await getParticipantEvidenceContext(recordId);
    if (!context) throw new Error("evidence_not_available");

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
    if (!sessionToken) throw new Error("participant_session_unavailable");

    const artifactId = randomUUID();
    uploadedPath = evidenceStoragePath(recordId, artifactId, prepared.extension);
    const bytes = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const admin = createAuthorityAdminClient();
    const { error: uploadError } = await admin.storage.from(AUTHORITY_EVIDENCE_BUCKET).upload(uploadedPath, bytes, {
      contentType: prepared.mediaType,
      upsert: false,
    });
    if (uploadError && uploadError.message !== "The resource already exists") throw new Error("evidence_storage_unavailable");

    const { error } = await admin.rpc("record_participant_evidence_upload_v1", {
      p_session_token: sessionToken,
      p_authority_record_id: recordId,
      p_expected_version: context.recordVersion,
      p_requirement_key: requirementKey,
      p_artifact_id: artifactId,
      p_storage_path: uploadedPath,
      p_original_filename: prepared.originalFilename,
      p_media_type: prepared.mediaType,
      p_byte_size: prepared.byteSize,
      p_sha256_hex: sha256,
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) {
      await admin.storage.from(AUTHORITY_EVIDENCE_BUCKET).remove([uploadedPath]);
      uploadedPath = null;
      throw error;
    }

    revalidatePath(`/request/${encodeURIComponent(recordId)}/requirements`);
    revalidatePath(`/request/${encodeURIComponent(recordId)}/overview`);
    revalidatePath(`/app/requests/${encodeURIComponent(recordId)}`);
    destination += "?notice=file_received";
  } catch (error) {
    destination += `?error=${encodeURIComponent(participantErrorCode(error))}`;
  }
  redirect(destination);
}

export async function submitRepresentativeCertificationAction(formData: FormData) {
  const recordId = textField(formData, "recordId");
  let destination = `/request/${encodeURIComponent(recordId)}/requirements`;
  try {
    const context = await getParticipantEvidenceContext(recordId);
    if (!context) throw new Error("evidence_not_available");
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
    if (!sessionToken) throw new Error("participant_session_unavailable");
    const admin = createAuthorityAdminClient();
    const { error } = await admin.rpc("submit_representative_certification_v1", {
      p_session_token: sessionToken,
      p_authority_record_id: recordId,
      p_expected_version: context.recordVersion,
      p_acknowledged: formData.get("acknowledged") === "on",
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    revalidatePath(`/request/${encodeURIComponent(recordId)}/requirements`);
    revalidatePath(`/request/${encodeURIComponent(recordId)}/overview`);
    revalidatePath(`/app/requests/${encodeURIComponent(recordId)}`);
    destination += "?notice=certification_saved";
  } catch (error) {
    destination += `?error=${encodeURIComponent(participantErrorCode(error))}`;
  }
  redirect(destination);
}

export async function respondToAuthorityInformationAction(formData: FormData) {
  const recordId = textField(formData, "recordId");
  let destination = `/request/${encodeURIComponent(recordId)}/overview`;
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
    if (!sessionToken) throw new Error("participant_session_unavailable");
    const input = prepareHostedInformationResponse({ response: textField(formData, "response") });
    const admin = createAuthorityAdminClient();
    const { error } = await admin.rpc("respond_to_authority_information_v1", {
      p_session_token: sessionToken,
      p_authority_record_id: recordId,
      p_expected_version: Number(textField(formData, "expectedVersion")),
      p_response: input.response,
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    revalidatePath(`/request/${encodeURIComponent(recordId)}/overview`);
    revalidatePath(`/app/requests/${encodeURIComponent(recordId)}`);
    destination += "?notice=information_response_saved";
  } catch (error) {
    destination += `?error=${encodeURIComponent(participantErrorCode(error))}`;
  }
  redirect(destination);
}

export async function withdrawAuthorityResponsibilityAction(formData: FormData) {
  const recordId = textField(formData, "recordId");
  let destination = `/request/${encodeURIComponent(recordId)}/overview`;
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
    if (!sessionToken) throw new Error("participant_session_unavailable");
    const input = prepareHostedWithdrawal({
      reason: textField(formData, "reason"),
      acknowledged: formData.get("acknowledged") === "on",
    });
    const admin = createAuthorityAdminClient();
    const { error } = await admin.rpc("withdraw_authority_responsibility_v1", {
      p_session_token: sessionToken,
      p_authority_record_id: recordId,
      p_expected_version: Number(textField(formData, "expectedVersion")),
      p_reason: input.reason,
      p_acknowledged: input.acknowledged,
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    revalidatePath(`/request/${encodeURIComponent(recordId)}/overview`);
    revalidatePath(`/app/requests/${encodeURIComponent(recordId)}`);
    destination += "?notice=responsibility_withdrawn";
  } catch (error) {
    destination += `?error=${encodeURIComponent(participantErrorCode(error))}`;
  }
  redirect(destination);
}

function participantDecisionPath(recordId: string, decision: string) {
  return `/request/${encodeURIComponent(recordId)}/${decision.startsWith("principal_") ? "grant" : "responsibility"}`;
}

export async function exchangeParticipantInvitationAction(formData: FormData) {
  const token = normalizeParticipantToken(textField(formData, "token"));
  const idempotencyKey = textField(formData, "idempotencyKey");
  if (!token) redirect("/?error=link_unavailable");

  let destination = `/r/${token}`;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("exchange_participant_invitation_v1", {
      p_token: token,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;
    const result = data as {
      authority_record_id?: string;
      session_token?: string;
      session_expires_at?: string;
      access_purpose?: string;
    };
    if (!result.authority_record_id || !result.session_token || !result.session_expires_at) {
      throw new Error("participant_session_unavailable");
    }

    const cookieStore = await cookies();
    cookieStore.set(PARTICIPANT_SESSION_COOKIE, result.session_token, {
      httpOnly: true,
      secure: getAuthorityAppUrl().startsWith("https://"),
      sameSite: "lax",
      path: `/request/${result.authority_record_id}`,
      expires: new Date(result.session_expires_at),
    });
    destination = result.access_purpose === "receipt"
      ? participantReceiptPath(result.authority_record_id)
      : participantOverviewPath(result.authority_record_id);
  } catch (error) {
    destination = `/r/${token}?error=${encodeURIComponent(participantErrorCode(error))}`;
  }
  redirect(destination);
}

export async function submitParticipantDecisionAction(formData: FormData) {
  const recordId = textField(formData, "recordId");
  const decision = textField(formData, "decision") as ParticipantDecision;
  let destination = participantDecisionPath(recordId, decision);

  try {
    const authorityAppUrl = decision === "principal_confirm" ? getAuthorityAppUrl() : null;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
    if (!sessionToken) throw new Error("participant_session_unavailable");

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_participant_decision_v1", {
      p_session_token: sessionToken,
      p_authority_record_id: recordId,
      p_expected_version: Number(textField(formData, "expectedVersion")),
      p_decision: decision,
      p_acknowledged: formData.get("acknowledged") === "on",
      p_reason: textField(formData, "reason"),
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    const result = data as {
      status?: string;
      decision?: string;
      representative_invitation_id?: string;
      representative_invitation_token?: string;
    };
    if (!result.status || !result.decision) throw new Error("participant_decision_invalid");

    let notice: string = decision;
    if (decision === "principal_confirm" && result.representative_invitation_id && result.representative_invitation_token) {
      notice = "principal_confirm_delivery_pending";
      const admin = createAuthorityAdminClient();
      const { data: deliveryContext, error: contextError } = await admin.rpc("get_released_representative_delivery_context_v1", {
        p_session_token: sessionToken,
        p_authority_record_id: recordId,
        p_invitation_id: result.representative_invitation_id,
      });
      const context = deliveryContext as {
        invitation_id?: string;
        invitation_version?: number;
        email?: string;
        participant_name?: string;
        other_person_name?: string;
        institution_name?: string;
        purpose?: string;
        account_boundary?: string;
        expires_at?: string;
      } | null;
      if (!contextError && context?.invitation_id && context.invitation_version && context.email && context.participant_name && context.other_person_name && context.institution_name && context.purpose && context.account_boundary && context.expires_at) {
        const submission = await deliverParticipantInvitation({
          invitationId: context.invitation_id,
          invitationVersion: Number(context.invitation_version),
          participantRole: "representative",
          email: context.email,
          institutionName: context.institution_name,
          participantName: context.participant_name,
          otherPersonName: context.other_person_name,
          purpose: context.purpose,
          accountBoundary: context.account_boundary,
          expiresAt: context.expires_at,
          secureUrl: new URL(`/r/${result.representative_invitation_token}`, authorityAppUrl!).toString(),
        });
        const { error: recordError } = await admin.rpc("record_representative_delivery_v1", {
          p_session_token: sessionToken,
          p_authority_record_id: recordId,
          p_invitation_id: context.invitation_id,
          p_expected_invitation_version: Number(context.invitation_version),
          p_delivery_status: submission.accepted ? "delivered" : "failed",
          p_provider: "resend",
          p_provider_message_id: submission.accepted ? submission.messageId : "",
          p_error_code: submission.accepted ? "" : submission.reason,
          p_idempotency_key: randomUUID(),
        });
        if (!recordError && submission.accepted) notice = "principal_confirm";
      }
    }

    destination = `${participantOverviewPath(recordId)}?notice=${encodeURIComponent(notice)}`;
  } catch (error) {
    destination = `${participantDecisionPath(recordId, decision)}?error=${encodeURIComponent(participantErrorCode(error))}`;
  }
  redirect(destination);
}
