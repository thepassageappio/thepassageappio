import { mapCancellationReceipt } from "./cancellation";
import { cookies } from "next/headers";
import { mapParticipantSessionContext, PARTICIPANT_SESSION_COOKIE } from "./participant-access";
import { mapParticipantEvidenceContext } from "./participant-evidence";
import { mapParticipantDecisionReceipt } from "./participant-receipt";
import { createAuthorityAdminClient } from "../supabase/admin";
import { createClient } from "../supabase/server";

export async function getParticipantRequestContext(authorityRecordId: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_participant_session_context_v1", {
    p_session_token: sessionToken,
    p_authority_record_id: authorityRecordId,
  });
  const context = error ? null : mapParticipantSessionContext(data);
  if (!context) return null;

  // Session already authorized this record; origin_group_id is additive clarity only.
  const admin = createAuthorityAdminClient();
  const { data: recordRow } = await admin
    .from("authority_records")
    .select("origin_group_id")
    .eq("id", authorityRecordId)
    .maybeSingle();
  return {
    ...context,
    originGroupId: recordRow?.origin_group_id ? String(recordRow.origin_group_id) : null,
  };
}

export async function getParticipantEvidenceContext(authorityRecordId: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const supabase = createAuthorityAdminClient();
  const { data, error } = await supabase.rpc("get_participant_evidence_context_v1", {
    p_session_token: sessionToken,
    p_authority_record_id: authorityRecordId,
  });
  return error ? null : mapParticipantEvidenceContext(data);
}

export async function getParticipantDecisionReceipt(authorityRecordId: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const supabase = createAuthorityAdminClient();
  const { data, error } = await supabase.rpc("get_participant_decision_receipt_v1", {
    p_session_token: sessionToken,
    p_authority_record_id: authorityRecordId,
  });
  return error ? null : mapParticipantDecisionReceipt(data);
}

export type ParticipantInformationRequest = {
  id: string;
  requirementKey: string;
  message: string;
  requestedAt: string;
};

export async function getParticipantInformationRequest(authorityRecordId: string): Promise<ParticipantInformationRequest | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const supabase = createAuthorityAdminClient();
  const { data, error } = await supabase.rpc("get_participant_information_request_v1", {
    p_session_token: sessionToken,
    p_authority_record_id: authorityRecordId,
  });
  if (error || !data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  if (!row.id || !row.requirement_key || !row.message || !row.requested_at) return null;
  return {
    id: String(row.id),
    requirementKey: String(row.requirement_key),
    message: String(row.message),
    requestedAt: String(row.requested_at),
  };
}

export async function getParticipantCancellation(authorityRecordId: string) {
  const token = (await cookies()).get(PARTICIPANT_SESSION_COOKIE)?.value;
  if (!token) return null;
  const { data, error } = await createAuthorityAdminClient().rpc("get_participant_cancellation_v1", { p_session_token: token, p_authority_record_id: authorityRecordId });
  return error ? null : mapCancellationReceipt(data);
}

export type ParticipantReceiptOrientationSupport = {
  originGroupId: string | null;
  requirements: Array<{
    id: string;
    requirement_key: string;
    title: string;
    status: string;
  }>;
  artifacts: Array<{
    id: string;
    requirement_id: string;
    review_status: string;
  }>;
};

/** Session-gated requirements/artifacts for participant receipt OrientationStrip. */
export async function getParticipantReceiptOrientationSupport(
  authorityRecordId: string,
): Promise<ParticipantReceiptOrientationSupport | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_participant_session_context_v1", {
    p_session_token: sessionToken,
    p_authority_record_id: authorityRecordId,
  });
  if (error || !mapParticipantSessionContext(data)) return null;

  const admin = createAuthorityAdminClient();
  const [{ data: recordRow }, { data: requirementRows }, { data: evidenceRows }] = await Promise.all([
    admin
      .from("authority_records")
      .select("origin_group_id")
      .eq("id", authorityRecordId)
      .maybeSingle(),
    admin
      .from("authority_requirements")
      .select("id, requirement_key, title, status, ordinal")
      .eq("authority_record_id", authorityRecordId)
      .order("ordinal", { ascending: true }),
    admin
      .from("authority_evidence_artifacts")
      .select("id, requirement_id, review_status")
      .eq("authority_record_id", authorityRecordId),
  ]);

  return {
    originGroupId: recordRow?.origin_group_id ? String(recordRow.origin_group_id) : null,
    requirements: (requirementRows ?? []).map((item) => ({
      id: String(item.id),
      requirement_key: String(item.requirement_key),
      title: String(item.title),
      status: String(item.status),
    })),
    artifacts: (evidenceRows ?? []).map((item) => ({
      id: String(item.id),
      requirement_id: String(item.requirement_id),
      review_status: String(item.review_status ?? ""),
    })),
  };
}
