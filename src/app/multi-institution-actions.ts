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
  prepareGroupEvidenceUpload,
  prepareParticipantDetails,
  prepareRequesterAttestation,
  prepareRequesterIntake,
  prepareTargetInput,
  REQUESTER_EMAIL_COOKIE,
  REQUESTER_SESSION_COOKIE,
  SUBMISSION_EVIDENCE_BUCKET,
  ALLOWED_GROUP_EVIDENCE_MEDIA_TYPES,
  type InstitutionSearchResult,
  type RequesterSessionContext,
} from "@/lib/authority/multi-institution-submission";
import { resolveEvidenceMediaType, type EvidenceUploadTicketResult } from "@/lib/authority/evidence-upload";
import { assertSubmissionSession, assertSubmissionUploadable, isEvidenceUuid, isSubmissionRequirementKey } from "@/lib/authority/evidence-upload-access";
import { createEvidenceSignedUpload, supabaseEvidenceObjectStore } from "@/lib/authority/evidence-upload-storage";
import { evidenceBytesMatchType, finalizeEvidenceUpload } from "@/lib/authority/evidence-upload-verify";
import { processSubmissionDelivery } from "@/lib/authority/submission-delivery-worker";
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
    if (!evidenceBytesMatchType(bytes, prepared.mediaType)) throw new Error("evidence_file_type_not_allowed");
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

function inputText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

// Same checks as uploadSubmissionEvidenceAction: requester session, group, draft, version.
async function authorizeSubmissionEvidenceUpload(groupId: string, expectedVersion: number) {
  const sessionToken = await getRequesterSessionToken();
  if (!sessionToken) throw new Error("requester_session_unavailable");
  const authorized = assertSubmissionSession(groupId, isEvidenceUuid(groupId) ? await fetchContext(groupId, sessionToken) : null);
  return { sessionToken, authorized, expectedVersion };
}

/**
 * Step 1 of a direct upload: authorize the requester for this draft, check the declared
 * file, and issue a one-time signed upload for a server-chosen path. No row is written.
 */
export async function prepareSubmissionEvidenceUploadAction(input: {
  groupId: string;
  expectedVersion: number;
  requirementKey: string;
  name: string;
  type: string;
  size: number;
}): Promise<EvidenceUploadTicketResult> {
  try {
    const groupId = inputText(input?.groupId);
    const requirementKey = inputText(input?.requirementKey);
    const auth = await authorizeSubmissionEvidenceUpload(groupId, Number(input?.expectedVersion));
    assertSubmissionUploadable(auth.authorized, auth.expectedVersion);
    if (!isSubmissionRequirementKey(requirementKey)) throw new Error("requirement_key_invalid");
    const name = inputText(input?.name);
    const mediaType = resolveEvidenceMediaType(name, inputText(input?.type));
    const prepared = prepareGroupEvidenceUpload({ name, type: mediaType ?? inputText(input?.type), size: Number(input?.size) });

    const artifactId = randomUUID();
    const path = groupEvidenceStoragePath(groupId, artifactId, prepared.extension);
    const { token } = await createEvidenceSignedUpload(createAuthorityAdminClient(), SUBMISSION_EVIDENCE_BUCKET, path);
    return {
      ok: true,
      ticket: {
        bucket: SUBMISSION_EVIDENCE_BUCKET,
        path,
        token,
        artifactId,
        mediaType: prepared.mediaType,
        originalFilename: prepared.originalFilename,
        idempotencyKey: randomUUID(),
      },
    };
  } catch (error) {
    return { ok: false, error: userErrorMessage(multiInstitutionErrorCode(error)) ?? "" };
  }
}

/**
 * Step 3 of a direct upload (step 2 is the browser sending the file to storage): check the
 * stored object at the exact server-derived path, fingerprint the stored bytes, and record
 * it with the same RPC as the in-request upload. Rejected or unrecorded objects are deleted.
 */
export async function finalizeSubmissionEvidenceUploadAction(input: {
  groupId: string;
  expectedVersion: number;
  requirementKey: string;
  artifactId: string;
  mediaType: string;
  originalFilename: string;
  idempotencyKey: string;
}): Promise<{ error: string | null; context: RequesterSessionContext | null }> {
  try {
    const groupId = inputText(input?.groupId);
    const requirementKey = inputText(input?.requirementKey);
    const artifactId = inputText(input?.artifactId);
    const idempotencyKey = inputText(input?.idempotencyKey);
    const originalFilename = inputText(input?.originalFilename);
    const expectedVersion = Number(input?.expectedVersion);
    const mediaType = resolveEvidenceMediaType("", inputText(input?.mediaType));
    if (!mediaType) throw new Error("evidence_file_type_not_allowed");
    if (!isSubmissionRequirementKey(requirementKey)) throw new Error("requirement_key_invalid");
    if (!isEvidenceUuid(groupId) || !isEvidenceUuid(artifactId) || !isEvidenceUuid(idempotencyKey)) throw new Error("evidence_path_invalid");
    const path = groupEvidenceStoragePath(groupId, artifactId, ALLOWED_GROUP_EVIDENCE_MEDIA_TYPES[mediaType]);
    const admin = createAuthorityAdminClient();

    await finalizeEvidenceUpload({
      authorize: () => authorizeSubmissionEvidenceUpload(groupId, expectedVersion),
      assertUploadable: ({ authorized }) => assertSubmissionUploadable(authorized, expectedVersion),
      recordedOwner: async (id) => {
        const { data, error } = await admin.from("authority_submission_group_evidence").select("group_id").eq("id", id).maybeSingle();
        if (error) throw new Error("evidence_storage_unavailable");
        return data?.group_id ? String(data.group_id) : null;
      },
      store: supabaseEvidenceObjectStore(admin),
      record: async ({ sessionToken }, verified) => {
        // Same validator, fingerprint, RPC, and arguments as the in-request upload.
        const prepared = prepareGroupEvidenceUpload({ name: originalFilename, type: mediaType, size: verified.byteSize });
        const { error } = await admin.rpc("record_submission_group_evidence_upload_v1", {
          p_session_token: sessionToken,
          p_group_id: groupId,
          p_expected_version: expectedVersion,
          p_requirement_key: requirementKey,
          p_artifact_id: artifactId,
          p_storage_path: path,
          p_original_filename: prepared.originalFilename,
          p_media_type: prepared.mediaType,
          p_byte_size: prepared.byteSize,
          p_sha256_hex: verified.sha256Hex,
          p_idempotency_key: idempotencyKey,
        });
        if (error) throw error;
      },
    }, { scopeId: groupId, artifactId, bucket: SUBMISSION_EVIDENCE_BUCKET, path, mediaType });

    revalidatePath(`/start/multi-institution/${groupId}`);
    const sessionToken = await getRequesterSessionToken();
    const context = sessionToken ? await fetchContext(groupId, sessionToken) : null;
    if (!context) throw new Error("requester_session_unavailable");
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
  try {
    const sessionToken = await getRequesterSessionToken();
    if (!sessionToken) throw new Error("requester_session_unavailable");
    const attestation = prepareRequesterAttestation({ acknowledged: input.attested });
    const context = await fetchContext(input.groupId, sessionToken);
    if (!context) throw new Error("requester_session_unavailable");
    // Reopening a committed submission resumes its durable work; it never spawns cases again.
    if (context.status !== "fanned_out") {
      const admin = createAuthorityAdminClient();
      const { data, error } = await admin.rpc("submit_submission_group_with_delivery_v1", {
        p_session_token: sessionToken, p_group_id: input.groupId,
        p_expected_version: input.expectedVersion,
        p_requester_attestation_text_version: attestation.textVersion,
        p_idempotency_key: input.groupId,
      });
      if (error) throw error;
      const result = mapSubmitSubmissionGroupResult(data);
      if (!result) throw new Error("submission_group_not_submittable");
      // Optional requester acknowledgment remains separate from participant delivery.
      const cookieStore = await cookies();
      const requesterEmail = cookieStore.get(REQUESTER_EMAIL_COOKIE)?.value;
      if (requesterEmail) {
        await deliverRequesterSubmittedEmail({
          kind: "submitted", groupId: input.groupId, email: requesterEmail,
          requesterName: context.requesterName, referenceCode: context.referenceCode,
          matchedCount: result.matchedCount, unmatchedCount: result.unmatchedCount,
          secureUrl: new URL(`/start/multi-institution/${input.groupId}/submitted`, getAuthorityAppUrl()).toString(),
        }).catch(() => undefined);
      }
    }
    // A timeout or failure leaves the persisted jobs available for retry.
    await processSubmissionDelivery(input.groupId).catch(() => undefined);
  } catch (error) {
    return { error: userErrorMessage(multiInstitutionErrorCode(error)) };
  }
  revalidatePath(`/start/multi-institution/${input.groupId}`);
  redirect(`/start/multi-institution/${input.groupId}/submitted`);
}

export async function getSubmissionDeliveryStatusAction(groupId: string) {
  const sessionToken = await getRequesterSessionToken();
  if (!sessionToken) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_submission_delivery_status_v1", {
    p_session_token: sessionToken, p_group_id: groupId,
  });
  if (error || !data) return null;
  return { total: Number(data.total), completed: Number(data.completed), pending: Number(data.pending), needs_attention: Number(data.needs_attention), retry_at: typeof data.retry_at === "string" ? data.retry_at : null };
}

export async function retrySubmissionDeliveryAction(formData: FormData) {
  const groupId = textField(formData, "groupId");
  const sessionToken = await getRequesterSessionToken();
  const context = sessionToken ? await fetchContext(groupId, sessionToken) : null;
  if (!context || context.status !== "fanned_out") throw new Error("requester_session_unavailable");
  await processSubmissionDelivery(groupId).catch(() => undefined);
  revalidatePath(`/start/multi-institution/${groupId}/submitted`);
  redirect(`/start/multi-institution/${groupId}/submitted`);
}
