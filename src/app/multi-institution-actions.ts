"use server";

import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  groupEvidenceStoragePath,
  mapInstitutionSearchResults,
  mapRequesterSessionContext,
  mapSubmitSubmissionGroupResult,
  MULTI_INSTITUTION_ACCOUNT_BOUNDARY,
  MULTI_INSTITUTION_PURPOSE,
  prepareGroupEvidenceUpload,
  prepareParticipantDetails,
  prepareRequesterAttestation,
  prepareRequesterIntake,
  prepareTargetInput,
  REQUESTER_EMAIL_COOKIE,
  REQUESTER_SESSION_COOKIE,
  SUBMISSION_EVIDENCE_BUCKET,
  type InstitutionSearchResult,
  type RequesterSessionContext,
} from "@/lib/authority/multi-institution-submission";
import { deliverParticipantInvitation } from "@/lib/authority/participant-invitation-delivery";
import { deliverRequesterSubmittedEmail, deliverRequesterVerificationEmail } from "@/lib/authority/requester-verification-delivery";
import { userErrorMessage } from "@/lib/authority/user-messages";
import { createAuthorityAdminClient } from "@/lib/supabase/admin";
import { getAuthorityAppUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

// The RPCs in 20260913150500_authority_multi_institution_submission_phase0_functions.sql
// consistently `raise exception using message = 'snake_case_code'`, so the
// PostgREST error message IS the code -- no translation table needed here,
// unlike account-actions.ts's map (which absorbs inconsistent legacy message text).
function multiInstitutionErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("message" in error)) return "request_failed";
  const message = String((error as { message: unknown }).message ?? "").trim();
  return message || "request_failed";
}

async function getRequesterSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(REQUESTER_SESSION_COOKIE)?.value ?? null;
}

async function fetchContext(groupId: string, sessionToken: string): Promise<RequesterSessionContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_requester_session_context_v1", {
    p_session_token: sessionToken,
    p_group_id: groupId,
  });
  if (error) return null;
  return mapRequesterSessionContext(data);
}

function mediaTypeFromPath(path: string) {
  if (path.endsWith(".pdf")) return "application/pdf";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

export async function startSubmissionGroupAction(
  _previous: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  let destination = "/start/multi-institution";
  try {
    const input = prepareRequesterIntake({
      name: textField(formData, "requesterName"),
      email: textField(formData, "requesterEmail"),
      relationship: textField(formData, "requesterRelationship"),
    });

    const supabase = createAuthorityAdminClient();
    const { data, error } = await supabase.rpc("start_submission_group_v1", {
      p_requester_name: input.name,
      p_requester_email: input.email,
      p_requester_relationship: input.relationship,
      p_idempotency_key: textField(formData, "idempotencyKey") || randomUUID(),
    });
    if (error) throw error;

    const result = data as {
      group_id?: string;
      reference_code?: string;
      verification_token?: string;
      verification_expires_at?: string;
    };
    if (!result.group_id || !result.reference_code || !result.verification_token || !result.verification_expires_at) {
      throw new Error("requester_verification_unavailable");
    }

    const authorityAppUrl = getAuthorityAppUrl();
    const secureUrl = new URL(`/start/multi-institution/verify/${result.verification_token}`, authorityAppUrl).toString();
    const delivery = await deliverRequesterVerificationEmail({
      kind: "verification",
      groupId: result.group_id,
      email: input.email,
      requesterName: input.name,
      referenceCode: result.reference_code,
      expiresAt: result.verification_expires_at,
      secureUrl,
    });

    const cookieStore = await cookies();
    cookieStore.set(REQUESTER_EMAIL_COOKIE, input.email, {
      httpOnly: true,
      secure: authorityAppUrl.startsWith("https://"),
      sameSite: "lax",
      path: "/start/multi-institution",
      expires: new Date(result.verification_expires_at),
    });

    destination = `/start/multi-institution/check-email?ref=${encodeURIComponent(result.reference_code)}&delivered=${delivery.accepted ? "1" : "0"}`;
  } catch (error) {
    return { error: userErrorMessage(multiInstitutionErrorCode(error)) };
  }
  redirect(destination);
}

export async function verifyRequesterEmailAction(formData: FormData) {
  const token = textField(formData, "token").toLowerCase();
  const idempotencyKey = textField(formData, "idempotencyKey") || randomUUID();
  let destination = `/start/multi-institution/verify/${encodeURIComponent(token)}?error=requester_verification_unavailable`;

  if (!/^[0-9a-f]{64}$/.test(token)) redirect(destination);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("verify_requester_email_v1", {
      p_token: token,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;

    const result = data as { group_id?: string; reference_code?: string; session_token?: string; session_expires_at?: string };
    if (!result.group_id || !result.session_token || !result.session_expires_at) {
      throw new Error("requester_session_unavailable");
    }

    const authorityAppUrl = getAuthorityAppUrl();
    const cookieStore = await cookies();
    cookieStore.set(REQUESTER_SESSION_COOKIE, result.session_token, {
      httpOnly: true,
      secure: authorityAppUrl.startsWith("https://"),
      sameSite: "lax",
      path: `/start/multi-institution/${result.group_id}`,
      expires: new Date(result.session_expires_at),
    });

    destination = `/start/multi-institution/${result.group_id}`;
  } catch (error) {
    destination = `/start/multi-institution/verify/${encodeURIComponent(token)}?error=${encodeURIComponent(multiInstitutionErrorCode(error))}`;
  }
  redirect(destination);
}

export async function getRequesterSessionContextAction(groupId: string): Promise<{ error: string | null; context: RequesterSessionContext | null }> {
  try {
    const sessionToken = await getRequesterSessionToken();
    if (!sessionToken) throw new Error("requester_session_unavailable");
    const context = await fetchContext(groupId, sessionToken);
    if (!context) throw new Error("requester_session_unavailable");
    return { error: null, context };
  } catch (error) {
    return { error: userErrorMessage(multiInstitutionErrorCode(error)), context: null };
  }
}

export async function updateSubmissionGroupDetailsAction(input: {
  groupId: string;
  expectedVersion: number;
  principalName: string;
  principalEmail: string;
  representativeName: string;
  representativeEmail: string;
  principalConfirmationAvailable: boolean | null;
  principalConfirmationUnavailableReason: string;
}): Promise<{ error: string | null; context: RequesterSessionContext | null }> {
  try {
    const sessionToken = await getRequesterSessionToken();
    if (!sessionToken) throw new Error("requester_session_unavailable");
    const details = prepareParticipantDetails(input);

    const supabase = await createClient();
    const { error } = await supabase.rpc("update_submission_group_details_v1", {
      p_session_token: sessionToken,
      p_group_id: input.groupId,
      p_expected_version: input.expectedVersion,
      p_principal_name: details.principalName,
      p_principal_email: details.principalEmail,
      p_representative_name: details.representativeName,
      p_representative_email: details.representativeEmail,
      p_principal_confirmation_available: details.principalConfirmationAvailable,
      p_principal_confirmation_unavailable_reason: details.principalConfirmationUnavailableReason,
      p_idempotency_key: randomUUID(),
    });
    if (error) throw error;

    revalidatePath(`/start/multi-institution/${input.groupId}`);
    const context = await fetchContext(input.groupId, sessionToken);
    return { error: null, context };
  } catch (error) {
    return { error: userErrorMessage(multiInstitutionErrorCode(error)), context: null };
  }
}

export async function searchInstitutionsAction(query: string): Promise<{ error: string | null; results: InstitutionSearchResult[] }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("search_institutions_v1", { p_query: query });
    if (error) throw error;
    return { error: null, results: mapInstitutionSearchResults(data) };
  } catch (error) {
    return { error: userErrorMessage(multiInstitutionErrorCode(error)), results: [] };
  }
}

export async function addSubmissionTargetAction(input: {
  groupId: string;
  expectedVersion: number;
  label: string;
  institutionType: string;
  organizationId: string | null;
}): Promise<{ error: string | null; context: RequesterSessionContext | null }> {
  try {
    const sessionToken = await getRequesterSessionToken();
    if (!sessionToken) throw new Error("requester_session_unavailable");
    const target = prepareTargetInput(input);

    const supabase = await createClient();
    const { error } = await supabase.rpc("add_submission_target_v1", {
      p_session_token: sessionToken,
      p_group_id: input.groupId,
      p_expected_version: input.expectedVersion,
      p_target_label: target.label,
      p_target_institution_type: target.institutionType,
      p_organization_id: target.organizationId,
      p_idempotency_key: randomUUID(),
    });
    if (error) throw error;

    revalidatePath(`/start/multi-institution/${input.groupId}`);
    const context = await fetchContext(input.groupId, sessionToken);
    return { error: null, context };
  } catch (error) {
    return { error: userErrorMessage(multiInstitutionErrorCode(error)), context: null };
  }
}

export async function removeSubmissionTargetAction(input: {
  groupId: string;
  expectedVersion: number;
  targetId: string;
}): Promise<{ error: string | null; context: RequesterSessionContext | null }> {
  try {
    const sessionToken = await getRequesterSessionToken();
    if (!sessionToken) throw new Error("requester_session_unavailable");

    const supabase = await createClient();
    const { error } = await supabase.rpc("remove_submission_target_v1", {
      p_session_token: sessionToken,
      p_group_id: input.groupId,
      p_target_id: input.targetId,
      p_expected_version: input.expectedVersion,
      p_idempotency_key: randomUUID(),
    });
    if (error) throw error;

    revalidatePath(`/start/multi-institution/${input.groupId}`);
    const context = await fetchContext(input.groupId, sessionToken);
    return { error: null, context };
  } catch (error) {
    return { error: userErrorMessage(multiInstitutionErrorCode(error)), context: null };
  }
}

export async function uploadSubmissionEvidenceAction(formData: FormData): Promise<{ error: string | null; context: RequesterSessionContext | null }> {
  const groupId = textField(formData, "groupId");
  const expectedVersion = Number(textField(formData, "expectedVersion"));
  const requirementKey = textField(formData, "requirementKey");
  let uploadedPath: string | null = null;

  try {
    const sessionToken = await getRequesterSessionToken();
    if (!sessionToken) throw new Error("requester_session_unavailable");

    const authorized = await fetchContext(groupId, sessionToken);
    if (!authorized || authorized.groupId !== groupId) throw new Error("requester_session_unavailable");
    if (authorized.status !== "draft") throw new Error("submission_group_not_submittable");
    if (authorized.version !== expectedVersion) throw new Error("version_conflict");

    const file = formData.get("evidenceFile");
    if (!(file instanceof File)) throw new Error("evidence_file_required");
    const prepared = prepareGroupEvidenceUpload({ name: file.name, type: file.type, size: file.size });

    const artifactId = randomUUID();
    uploadedPath = groupEvidenceStoragePath(groupId, artifactId, prepared.extension);
    const bytes = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");

    const admin = createAuthorityAdminClient();
    const { error: uploadError } = await admin.storage.from(SUBMISSION_EVIDENCE_BUCKET).upload(uploadedPath, bytes, {
      contentType: prepared.mediaType,
      upsert: false,
    });
    if (uploadError && uploadError.message !== "The resource already exists") throw new Error("evidence_storage_unavailable");

    const { error } = await admin.rpc("record_submission_group_evidence_upload_v1", {
      p_session_token: sessionToken,
      p_group_id: groupId,
      p_expected_version: expectedVersion,
      p_requirement_key: requirementKey,
      p_artifact_id: artifactId,
      p_storage_path: uploadedPath,
      p_original_filename: prepared.originalFilename,
      p_media_type: prepared.mediaType,
      p_byte_size: prepared.byteSize,
      p_sha256_hex: sha256,
      p_idempotency_key: randomUUID(),
    });
    if (error) {
      await admin.storage.from(SUBMISSION_EVIDENCE_BUCKET).remove([uploadedPath]);
      throw error;
    }

    revalidatePath(`/start/multi-institution/${groupId}`);
    const context = await fetchContext(groupId, sessionToken);
    return { error: null, context };
  } catch (error) {
    return { error: userErrorMessage(multiInstitutionErrorCode(error)), context: null };
  }
}

export async function submitSubmissionGroupAction(input: {
  groupId: string;
  expectedVersion: number;
  attested: boolean;
}): Promise<{ error: string | null }> {
  let destination: string | null = null;
  try {
    const sessionToken = await getRequesterSessionToken();
    if (!sessionToken) throw new Error("requester_session_unavailable");
    const attestation = prepareRequesterAttestation({ acknowledged: input.attested });

    const supabase = createAuthorityAdminClient();
    const { data, error } = await supabase.rpc("submit_submission_group_v1", {
      p_session_token: sessionToken,
      p_group_id: input.groupId,
      p_expected_version: input.expectedVersion,
      p_requester_attestation_text_version: attestation.textVersion,
      p_idempotency_key: randomUUID(),
    });
    if (error) throw error;

    const result = mapSubmitSubmissionGroupResult(data);
    if (!result) throw new Error("submission_group_not_submittable");

    // Storage copy: evidence_copy_operations spans two buckets
    // (authority-submission-evidence -> authority-evidence), so Supabase JS's
    // single-bucket .copy() cannot be used -- download from the source bucket,
    // then upload to the destination bucket with the admin/service-role client.
    // The DB rows are already committed at this point, so a copy failure here is
    // recoverable/retriable, not a reason to fail the whole submission.
    const admin = createAuthorityAdminClient();
    let copyFailureCount = 0;
    for (const op of result.evidenceCopyOperations) {
      try {
        const { data: fileData, error: downloadError } = await admin.storage.from(op.fromBucket).download(op.fromPath);
        if (downloadError || !fileData) throw downloadError ?? new Error("download_failed");
        const bytes = Buffer.from(await fileData.arrayBuffer());
        const { error: uploadError } = await admin.storage.from(op.toBucket).upload(op.toPath, bytes, {
          contentType: mediaTypeFromPath(op.toPath),
          upsert: false,
        });
        if (uploadError && uploadError.message !== "The resource already exists") throw uploadError;
      } catch (copyError) {
        copyFailureCount += 1;
        console.error("multi_institution_evidence_copy_failed", { groupId: input.groupId, op, copyError });
      }
    }

    const context = await fetchContext(input.groupId, sessionToken);
    const authorityAppUrl = getAuthorityAppUrl();

    if (context) {
      // Participant invitation emails are not optional -- without them a spawned
      // case is unusable. Reuses the existing deliverParticipantInvitation()
      // unchanged, once per role per spawned record, awaited so a failure is
      // logged before this action returns rather than dropped as an orphaned
      // fire-and-forget promise.
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      for (const spawned of result.spawned) {
        const [principalDelivery, representativeDelivery] = await Promise.allSettled([
          deliverParticipantInvitation({
            invitationId: spawned.authorityRecordId,
            invitationVersion: 1,
            participantRole: "principal",
            email: context.principalEmailNormalized ?? "",
            institutionName: spawned.institutionName,
            participantName: context.principalName ?? "",
            otherPersonName: context.representativeName ?? "",
            purpose: MULTI_INSTITUTION_PURPOSE,
            accountBoundary: MULTI_INSTITUTION_ACCOUNT_BOUNDARY,
            expiresAt,
            secureUrl: new URL(`/r/${spawned.principalToken}`, authorityAppUrl).toString(),
          }),
          deliverParticipantInvitation({
            invitationId: spawned.authorityRecordId,
            invitationVersion: 2,
            participantRole: "representative",
            email: context.representativeEmailNormalized ?? "",
            institutionName: spawned.institutionName,
            participantName: context.representativeName ?? "",
            otherPersonName: context.principalName ?? "",
            purpose: MULTI_INSTITUTION_PURPOSE,
            accountBoundary: MULTI_INSTITUTION_ACCOUNT_BOUNDARY,
            expiresAt,
            secureUrl: new URL(`/r/${spawned.representativeToken}`, authorityAppUrl).toString(),
          }),
        ]);
        if (principalDelivery.status === "rejected" || (principalDelivery.status === "fulfilled" && !principalDelivery.value.accepted)) {
          console.error("multi_institution_principal_invitation_not_delivered", { groupId: input.groupId, authorityRecordId: spawned.authorityRecordId, principalDelivery });
        }
        if (representativeDelivery.status === "rejected" || (representativeDelivery.status === "fulfilled" && !representativeDelivery.value.accepted)) {
          console.error("multi_institution_representative_invitation_not_delivered", { groupId: input.groupId, authorityRecordId: spawned.authorityRecordId, representativeDelivery });
        }
      }

      // Requester's own "submitted" confirmation is a nice-to-have per spec --
      // awaited (so it isn't silently orphaned) but its failure never affects
      // the outcome returned to the requester.
      const cookieStore = await cookies();
      const requesterEmail = cookieStore.get(REQUESTER_EMAIL_COOKIE)?.value;
      if (requesterEmail) {
        await deliverRequesterSubmittedEmail({
          kind: "submitted",
          groupId: input.groupId,
          email: requesterEmail,
          requesterName: context.requesterName,
          referenceCode: context.referenceCode,
          matchedCount: result.matchedCount,
          unmatchedCount: result.unmatchedCount,
          secureUrl: new URL(`/start/multi-institution/${input.groupId}/submitted`, authorityAppUrl).toString(),
        }).catch((deliveryError) => {
          console.error("multi_institution_submitted_confirmation_failed", { groupId: input.groupId, deliveryError });
        });
      }
    }

    revalidatePath(`/start/multi-institution/${input.groupId}`);
    destination = `/start/multi-institution/${input.groupId}/submitted${copyFailureCount > 0 ? "?copyIssues=1" : ""}`;
  } catch (error) {
    return { error: userErrorMessage(multiInstitutionErrorCode(error)) };
  }
  redirect(destination);
}
