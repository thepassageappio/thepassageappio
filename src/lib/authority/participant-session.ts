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
  return error ? null : mapParticipantSessionContext(data);
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
