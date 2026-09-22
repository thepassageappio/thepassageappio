import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { mapHostedAuthorityEvent, mapHostedAuthorityRecord } from "@/lib/authority/hosted-records";
import { userErrorMessage } from "@/lib/authority/user-messages";
import { closedRequestMessage } from "@/lib/authority/closed-request";
import { canCoordinateAuthorityRequests } from "@/lib/authority/role-capabilities";
import { createClient } from "@/lib/supabase/server";
import { INVITE_ACCESS_LINK_COOKIE, parseInviteAccessLinkFlash } from "@/lib/authority/invite-access-link-flash";
import { HostedAuthorityRequestView } from "./HostedAuthorityRequestView";
import { mayProvisionDemoRun } from "@/lib/authority/demo-boundary";
import { mapGoverningContext } from "@/lib/authority/governing-snapshot";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string; demo?: string }>;
};

export async function loadHostedAuthorityRequest({ params, searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  if (!access?.organization) return null;
  const { id } = await params;
  const { notice, error, demo } = await searchParams;
  const supabase = await createClient();
  const [
    { data: recordRow, error: recordError },
    { data: eventRows, error: eventError },
    { data: entitlement, error: entitlementError },
    { data: invitations, error: invitationError },
    { data: notificationData, error: notificationError },
    { data: requirements, error: requirementError },
    { data: evidenceArtifacts, error: evidenceError },
    { data: decisionRow, error: decisionError },
    { data: informationRequests, error: informationRequestError },
    { data: informationResponses, error: informationResponseError },
  ] = await Promise.all([
    supabase.from("authority_records").select("id, reference_code, organization_id, created_by, version, status, template_key, template_version, purpose, account_boundary, principal_name, principal_email_normalized, representative_name, representative_email_normalized, allowed_action_keys, valid_until, activated_at, created_at, updated_at, origin_group_id, jurisdiction_code, jurisdiction_pack_key, jurisdiction_pack_version, form_class").eq("organization_id", access.organization.id).eq("id", id).maybeSingle(),
    supabase.from("authority_events").select("event_id, authority_record_id, sequence, event_type, summary, detail, occurred_at").eq("organization_id", access.organization.id).eq("authority_record_id", id).order("sequence", { ascending: true }),
    supabase.from("organization_entitlements").select("status, transaction_limit, activated_count, period_started_at, period_ends_at, version").eq("organization_id", access.organization.id).maybeSingle(),
    supabase.from("authority_participant_invitations").select("id, participant_role, email_normalized, status, expires_at, version").eq("organization_id", access.organization.id).eq("authority_record_id", id).order("participant_role", { ascending: true }),
    supabase.rpc("get_authority_notification_status_v1", { p_organization_id: access.organization.id, p_authority_record_id: id }),
    supabase.from("authority_requirements").select("id, requirement_key, title, reason, input_kind, status, ordinal, version, completed_at").eq("organization_id", access.organization.id).eq("authority_record_id", id).order("ordinal", { ascending: true }),
    supabase.from("authority_evidence_artifacts").select("id, requirement_id, original_filename, media_type, byte_size, provider_status, review_status, reviewer_note, version, created_at").eq("organization_id", access.organization.id).eq("authority_record_id", id).order("created_at", { ascending: false }),
    supabase.from("authority_institution_decisions").select("id, receipt_code, authority_record_id, record_version, outcome, reason, accepted_action_keys, limitations, decided_by, decided_by_role, decided_at, receipt_sha256, receipt_snapshot").eq("organization_id", access.organization.id).eq("authority_record_id", id).maybeSingle(),
    supabase.from("authority_information_requests").select("id, requirement_key, message, requested_at").eq("organization_id", access.organization.id).eq("authority_record_id", id).order("requested_at", { ascending: false }),
    supabase.from("authority_information_responses").select("information_request_id, response, responded_at").eq("organization_id", access.organization.id).eq("authority_record_id", id).order("responded_at", { ascending: false }),
  ]);
  if (recordError) throw recordError;
  if (eventError) throw eventError;
  if (entitlementError) throw entitlementError;
  if (invitationError) throw invitationError;
  if (notificationError && recordRow?.status !== "draft") throw notificationError;
  if (requirementError) throw requirementError;
  if (evidenceError) throw evidenceError;
  if (decisionError) throw decisionError;
  if (informationRequestError) throw informationRequestError;
  if (informationResponseError) throw informationResponseError;
  if (!recordRow) notFound();

  const record = mapHostedAuthorityRecord(recordRow as never);
  const { data: governingData, error: governingError } = await supabase.rpc("get_authority_governing_context_v1", {
    p_organization_id: access.organization.id, p_authority_record_id: id,
  });
  if (governingError) throw governingError;
  const governingContext = mapGoverningContext(governingData);
  record.governingSnapshot = governingContext.saved;
  const closedMessage = closedRequestMessage(record.status);
  const reviewFinished = Boolean(closedMessage) || ["accepted", "accepted_with_limits"].includes(record.status);
  const events = (eventRows ?? []).map((row) => mapHostedAuthorityEvent(row as never));
  const savedError = userErrorMessage(error);
  const activatedCount = Number(entitlement?.activated_count ?? 0);
  const transactionLimit = Number(entitlement?.transaction_limit ?? 5);
  const periodEndsAt = entitlement?.period_ends_at ? String(entitlement.period_ends_at) : null;
  const evaluationExpired = Boolean(periodEndsAt && new Date(periodEndsAt).getTime() <= Date.now());
  const evaluationLimitReached = activatedCount >= transactionLimit;
  const canCoordinate = Boolean(access.membership && canCoordinateAuthorityRequests(access.membership.role));
  const canActivate = canCoordinate && !evaluationLimitReached && !evaluationExpired && !governingContext.stale;
  const nextCount = activatedCount + 1;
  const cookieStore = await cookies();
  const inviteAccessLinkFlash = access.membership && mayProvisionDemoRun(access.user.email, access.membership.role) ? parseInviteAccessLinkFlash(
    cookieStore.get(INVITE_ACCESS_LINK_COOKIE)?.value,
    record.id,
  ) : null;

  return {
    access: access,
    notice: notice,
    error: error,
    demo: demo,
    record: record,
    governingContext,
    closedMessage: closedMessage,
    reviewFinished: reviewFinished,
    events: events,
    savedError: savedError,
    activatedCount: activatedCount,
    transactionLimit: transactionLimit,
    periodEndsAt: periodEndsAt,
    evaluationLimitReached: evaluationLimitReached,
    evaluationExpired,
    canCoordinate: canCoordinate,
    canActivate: canActivate,
    nextCount: nextCount,
    invitations: invitations ?? [],
    notificationData: notificationData,
    requirements: requirements ?? [],
    evidenceArtifacts: evidenceArtifacts ?? [],
    decisionRow: decisionRow,
    informationRequests: informationRequests ?? [],
    informationResponses: informationResponses ?? [],
    inviteAccessLinkFlash: inviteAccessLinkFlash,
  };
}

export default async function HostedAuthorityRequestPage(props: Props) {
  const data = await loadHostedAuthorityRequest(props);
  return data ? <HostedAuthorityRequestView {...data} /> : null;
}
