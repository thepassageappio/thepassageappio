"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { prepareHostedAuthorityDraft } from "@/lib/authority/hosted-records";
import { prepareHostedInstitutionDecision, prepareHostedLifecycleChange } from "@/lib/authority/hosted-decisions";
import { prepareHostedInformationRequest } from "@/lib/authority/hosted-information";
import { deliverParticipantInvitation } from "@/lib/authority/participant-invitation-delivery";
import { participantAccessPurpose } from "@/lib/authority/participant-resume";
import { deliverTeamInvitation } from "@/lib/authority/team-invitation-delivery";
import {
  demoParticipantRecipientPair,
  isDemoEnvironment,
  mayProvisionDemoRun,
} from "@/lib/authority/demo-boundary";
import { canCoordinateAuthorityRequests, hasOrganizationCapability } from "@/lib/authority/role-capabilities";
import {
  getAuthorityAppUrl,
  getSupabasePublicConfig,
  safeAppPath,
} from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createAuthorityAdminClient } from "@/lib/supabase/admin";

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function checkbox(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function errorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("message" in error)) {
    return "request_failed";
  }

  const message = String(error.message);
  const map: Record<string, string> = {
    authority_access_unavailable: "access_unavailable",
    authorized_use_required: "authorized_use_required",
    organization_details_incomplete: "organization_details_incomplete",
    active_organization_already_exists: "organization_exists",
    required_acceptances_missing: "acceptances_required",
    terms_version_changed: "terms_changed",
    template_not_available: "template_unavailable",
    work_email_invalid: "email_invalid",
    membership_role_invalid: "role_invalid",
    membership_already_exists: "member_exists",
    member_invitation_already_pending: "invitation_pending",
    role_escalation_not_allowed: "role_not_allowed",
    member_management_not_allowed: "member_management_not_allowed",
    last_owner_protected: "last_owner_protected",
    stale_membership_version: "member_changed",
    stale_invitation_version: "invitation_changed",
    invitation_not_available: "invitation_unavailable",
    invitation_expired: "invitation_expired",
    invitation_email_mismatch: "invitation_email_mismatch",
    authority_request_creation_not_allowed: "request_creation_not_allowed",
    authority_request_activation_not_allowed: "request_activation_not_allowed",
    organization_not_ready: "organization_not_ready",
    authority_template_not_selected: "template_unavailable",
    participant_name_invalid: "participant_name_invalid",
    participant_email_invalid: "participant_email_invalid",
    participant_roles_must_be_distinct: "participant_roles_must_be_distinct",
    account_boundary_invalid: "account_boundary_invalid",
    valid_until_invalid: "valid_until_invalid",
    allowed_action_invalid: "allowed_action_invalid",
    idempotency_payload_mismatch: "request_changed",
    authority_request_not_found: "request_unavailable",
    stale_authority_version: "request_changed",
    authority_request_not_activatable: "request_not_activatable",
    evaluation_entitlement_unavailable: "evaluation_unavailable",
    evaluation_not_active: "evaluation_unavailable",
    evaluation_expired: "evaluation_expired",
    evaluation_limit_reached: "evaluation_limit_reached",
    participant_invitation_changed: "invitation_changed",
    participant_invitation_reissue_not_allowed: "invitation_unavailable",
    participant_invitation_reissue_invalid: "invitation_unavailable",
    evidence_review_not_allowed: "evidence_review_not_allowed",
    evidence_review_not_available: "evidence_review_not_available",
    evidence_artifact_changed: "evidence_changed",
    evidence_review_outcome_invalid: "evidence_review_invalid",
    evidence_review_note_required: "evidence_review_note_required",
    institution_decision_acknowledgment_required: "institution_decision_acknowledgment_required",
    institution_decision_outcome_invalid: "institution_decision_outcome_invalid",
    institution_decision_reason_required: "institution_decision_reason_required",
    institution_decision_limit_invalid: "institution_decision_limit_invalid",
    institution_decision_limit_required: "institution_decision_limit_required",
    institution_decision_limit_not_allowed: "institution_decision_limit_not_allowed",
    institution_decision_not_allowed: "institution_decision_not_allowed",
    institution_decision_not_ready: "institution_decision_not_ready",
    institution_decision_request_expired: "institution_decision_request_expired",
    institution_decision_requirements_incomplete: "institution_decision_requirements_incomplete",
    institution_decision_already_recorded: "institution_decision_already_recorded",
    authority_lifecycle_acknowledgment_required: "authority_lifecycle_acknowledgment_required",
    authority_lifecycle_action_invalid: "authority_lifecycle_action_invalid",
    authority_lifecycle_reason_required: "authority_lifecycle_reason_required",
    authority_lifecycle_not_allowed: "authority_lifecycle_not_allowed",
    authority_lifecycle_not_available: "authority_lifecycle_not_available",
    authority_lifecycle_not_expired: "authority_lifecycle_not_expired",
    institution_decision_unavailable: "institution_decision_unavailable",
    information_request_message_required: "information_request_message_required",
    information_request_not_allowed: "information_request_not_allowed",
    information_request_not_available: "information_request_not_available",
    information_request_requirement_invalid: "information_request_requirement_invalid",
    information_request_already_open: "information_request_already_open",
    stale_demo_context: "request_changed",
    demo_entitlement_unavailable: "evaluation_unavailable",
    demo_recipient_configuration_invalid: "demo_recipient_configuration_invalid",
    demo_fixture_not_available: "request_failed",
    "Choose the requirement that needs more information.": "information_request_requirement_invalid",
    "Explain what information is still needed.": "information_request_message_required",
    "Confirm that this is the institution's decision for this request.": "institution_decision_acknowledgment_required",
    "Choose an available institution decision.": "institution_decision_outcome_invalid",
    "Record a clear decision reason using 3 to 500 characters.": "institution_decision_reason_required",
    "Use no more than 10 limits, with 240 characters or fewer for each limit.": "institution_decision_limit_invalid",
    "List at least one limit for a limited acceptance.": "institution_decision_limit_required",
    "Limits can be recorded only when the institution accepts with limits.": "institution_decision_limit_not_allowed",
    "Choose an available lifecycle action.": "authority_lifecycle_action_invalid",
    "Lifecycle changes are available only after an accepted institution decision.": "authority_lifecycle_not_available",
    "Confirm that this lifecycle change should be saved to the receipt.": "authority_lifecycle_acknowledgment_required",
    "This request has not reached its recorded end date.": "authority_lifecycle_not_expired",
    "Record a clear revocation reason using 3 to 500 characters.": "authority_lifecycle_reason_required",
  };

  return map[message] ?? "request_failed";
}

function withMessage(path: string, kind: "error" | "notice", code: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${kind}=${encodeURIComponent(code)}`;
}

export async function requestSignInAction(formData: FormData) {
  const email = textField(formData, "email").toLowerCase();
  const fullName = textField(formData, "fullName");
  const next = safeAppPath(textField(formData, "next"), "/onboarding/organization");

  if (!email || !email.includes("@")) {
    redirect(withMessage(`/start?next=${encodeURIComponent(next)}`, "error", "email_invalid"));
  }

  if (!getSupabasePublicConfig()) {
    redirect(withMessage(`/start?next=${encodeURIComponent(next)}`, "error", "access_unavailable"));
  }

  const supabase = await createClient();
  const confirmUrl = new URL("/auth/confirm", getAuthorityAppUrl());
  confirmUrl.searchParams.set("next", next);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: confirmUrl.toString(),
      data: fullName ? { full_name: fullName } : undefined,
    },
  });

  const destination = error ? "/start/check-email?status=unavailable" : "/start/check-email?status=sent";
  redirect(destination);
}

export async function signOutAction() {
  if (getSupabasePublicConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/start?intent=sign-in");
}

export async function createOrganizationAction(formData: FormData) {
  let destination = "/onboarding/terms";
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("create_organization_v1", {
      p_legal_name: textField(formData, "legalName"),
      p_display_name: textField(formData, "displayName"),
      p_organization_type: textField(formData, "organizationType"),
      p_website_domain: textField(formData, "websiteDomain"),
      p_address_line_1: textField(formData, "addressLine1"),
      p_address_line_2: textField(formData, "addressLine2"),
      p_locality: textField(formData, "locality"),
      p_region: textField(formData, "region"),
      p_postal_code: textField(formData, "postalCode"),
      p_country_code: "US",
      p_authorized_use: checkbox(formData, "authorizedUse"),
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    revalidatePath("/", "layout");
  } catch (error) {
    destination = withMessage("/onboarding/organization", "error", errorCode(error));
  }
  redirect(destination);
}

export async function acceptTermsAction(formData: FormData) {
  let destination = "/onboarding/template";
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership || !hasOrganizationCapability(access.membership.role, "organization.manage")) {
      throw new Error("terms_acceptance_requires_owner");
    }

    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const supabase = await createClient();
    const { error } = await supabase.rpc("accept_terms_v1", {
      p_organization_id: access.membership.organizationId,
      p_terms_document_id: textField(formData, "termsDocumentId"),
      p_privacy_document_id: textField(formData, "privacyDocumentId"),
      p_authorized_use_document_id: textField(formData, "authorizedUseDocumentId"),
      p_terms_accepted: checkbox(formData, "termsAccepted"),
      p_privacy_acknowledged: checkbox(formData, "privacyAcknowledged"),
      p_data_use_attested: checkbox(formData, "dataUseAttested"),
      p_request_ip: forwardedFor,
      p_user_agent: requestHeaders.get("user-agent") ?? "",
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    revalidatePath("/", "layout");
  } catch (error) {
    destination = withMessage("/onboarding/terms", "error", errorCode(error));
  }
  redirect(destination);
}

export async function selectTemplateAction(formData: FormData) {
  let destination = "/onboarding/complete";
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership) throw new Error("authentication_required");
    const supabase = await createClient();
    const { error } = await supabase.rpc("select_template_v1", {
      p_organization_id: access.membership.organizationId,
      p_template_key: "ny_financial_poa",
      p_template_version: "2026.1",
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    revalidatePath("/", "layout");
  } catch (error) {
    destination = withMessage("/onboarding/template", "error", errorCode(error));
  }
  redirect(destination);
}

export async function inviteTeamMemberAction(formData: FormData) {
  let destination = "/app/team";
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership || !access.organization) throw new Error("authentication_required");
    if (!hasOrganizationCapability(access.membership.role, "members.invite")) throw new Error("member_management_not_allowed");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("invite_member_v1", {
      p_organization_id: access.membership.organizationId,
      p_email: textField(formData, "email"),
      p_role: textField(formData, "role"),
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;

    const result = data as {
      invitation_id: string;
      email: string;
      role: string;
      expires_at: string;
      token: string | null;
    };

    let delivered = false;
    if (result.token) {
      const secureUrl = new URL("/team/accept", getAuthorityAppUrl());
      secureUrl.searchParams.set("invitation", result.invitation_id);
      secureUrl.searchParams.set("token", result.token);
      const delivery = await deliverTeamInvitation({
        invitationId: result.invitation_id,
        email: result.email,
        organizationName: access.organization.displayName,
        role: result.role,
        expiresAt: result.expires_at,
        secureUrl: secureUrl.toString(),
      });
      delivered = delivery.delivered;
    }

    destination = withMessage("/app/team", "notice", delivered ? "invitation_sent" : "invitation_created");
    revalidatePath("/app/team");
  } catch (error) {
    destination = withMessage("/app/team", "error", errorCode(error));
  }
  redirect(destination);
}

export async function acceptTeamInvitationAction(formData: FormData) {
  let destination = "/app";
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("accept_member_invitation_v1", {
      p_invitation_id: textField(formData, "invitationId"),
      p_token: textField(formData, "token"),
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    destination = withMessage("/app", "notice", "invitation_accepted");
  } catch (error) {
    const invitation = encodeURIComponent(textField(formData, "invitationId"));
    const token = encodeURIComponent(textField(formData, "token"));
    destination = withMessage(`/team/accept?invitation=${invitation}&token=${token}`, "error", errorCode(error));
  }
  redirect(destination);
}

export async function changeMemberRoleAction(formData: FormData) {
  let destination = "/app/team";
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership) throw new Error("authentication_required");
    if (!hasOrganizationCapability(access.membership.role, "members.role_manage")) throw new Error("member_management_not_allowed");
    const supabase = await createClient();
    const { error } = await supabase.rpc("change_member_role_v1", {
      p_organization_id: access.membership.organizationId,
      p_membership_id: textField(formData, "membershipId"),
      p_role: textField(formData, "role"),
      p_expected_version: Number(textField(formData, "expectedVersion")),
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    destination = withMessage("/app/team", "notice", "role_updated");
    revalidatePath("/app/team");
  } catch (error) {
    destination = withMessage("/app/team", "error", errorCode(error));
  }
  redirect(destination);
}

export async function revokeMemberAction(formData: FormData) {
  let destination = "/app/team";
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership) throw new Error("authentication_required");
    if (!hasOrganizationCapability(access.membership.role, "members.revoke")) throw new Error("member_management_not_allowed");
    const supabase = await createClient();
    const { error } = await supabase.rpc("revoke_member_v1", {
      p_organization_id: access.membership.organizationId,
      p_membership_id: textField(formData, "membershipId"),
      p_expected_version: Number(textField(formData, "expectedVersion")),
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    destination = withMessage("/app/team", "notice", "access_revoked");
    revalidatePath("/app/team");
  } catch (error) {
    destination = withMessage("/app/team", "error", errorCode(error));
  }
  redirect(destination);
}

export async function revokeMemberInvitationAction(formData: FormData) {
  let destination = "/app/team";
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership) throw new Error("authentication_required");
    if (!hasOrganizationCapability(access.membership.role, "members.revoke")) throw new Error("member_management_not_allowed");
    const supabase = await createClient();
    const { error } = await supabase.rpc("revoke_member_invitation_v1", {
      p_organization_id: access.membership.organizationId,
      p_invitation_id: textField(formData, "invitationId"),
      p_expected_version: Number(textField(formData, "expectedVersion")),
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    destination = withMessage("/app/team", "notice", "invitation_revoked");
    revalidatePath("/app/team");
  } catch (error) {
    destination = withMessage("/app/team", "error", errorCode(error));
  }
  redirect(destination);
}

export async function provisionHostedDemoRunAction(formData: FormData) {
  if (!isDemoEnvironment()) notFound();

  const access = await getAuthorityAccessContext();
  if (
    !access?.membership
    || !access.organization
    || !mayProvisionDemoRun(access.user.email, access.membership.role)
  ) {
    notFound();
  }

  let destination = "/app";
  try {
    const recipients = demoParticipantRecipientPair();
    if (!recipients) throw new Error("demo_recipient_configuration_invalid");

    const admin = createAuthorityAdminClient();
    const { data, error } = await admin.rpc("provision_demo_run_v1", {
      p_organization_id: access.organization.id,
      p_presenter_user_id: access.user.id,
      p_principal_email: recipients[0],
      p_representative_email: recipients[1],
      p_expected_entitlement_version: Number(textField(formData, "expectedEntitlementVersion")),
      p_fixture_version: "financial-poa-demo-2026.1",
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;

    const result = data as { authority_record_id: string };
    revalidatePath("/app");
    revalidatePath(`/app/requests/${result.authority_record_id}`);
    destination = withMessage(`/app/requests/${result.authority_record_id}?demo=1`, "notice", "demo_run_prepared");
  } catch (error) {
    destination = withMessage("/app", "error", errorCode(error));
  }
  redirect(destination);
}

export async function createHostedAuthorityDraftAction(formData: FormData) {
  let destination = "/app/requests/new";
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership || !access.organization) throw new Error("authentication_required");
    if (!canCoordinateAuthorityRequests(access.membership.role)) throw new Error("authority_request_creation_not_allowed");

    const input = prepareHostedAuthorityDraft({
      principalName: textField(formData, "principalName"),
      principalEmail: textField(formData, "principalEmail"),
      representativeName: textField(formData, "representativeName"),
      representativeEmail: textField(formData, "representativeEmail"),
      accountBoundary: textField(formData, "accountBoundary"),
      validUntil: `${textField(formData, "validUntil")}T23:59:59.000Z`,
      allowedActionKeys: formData.getAll("allowedActionKeys").map(String),
    });

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_authority_draft_v1", {
      p_organization_id: access.membership.organizationId,
      p_principal_name: input.principalName,
      p_principal_email: input.principalEmail,
      p_representative_name: input.representativeName,
      p_representative_email: input.representativeEmail,
      p_account_boundary: input.accountBoundary,
      p_valid_until: input.validUntil,
      p_allowed_action_keys: input.allowedActionKeys,
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;

    const result = data as { authority_record_id: string };
    revalidatePath("/app");
    revalidatePath(`/app/requests/${result.authority_record_id}`);
    destination = withMessage(`/app/requests/${result.authority_record_id}`, "notice", "draft_created");
  } catch (error) {
    destination = withMessage("/app/requests/new", "error", errorCode(error));
  }
  redirect(destination);
}

export async function activateHostedAuthorityRequestAction(formData: FormData) {
  const recordId = textField(formData, "recordId");
  let destination = `/app/requests/${recordId}`;
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership || !access.organization) throw new Error("authentication_required");
    if (!canCoordinateAuthorityRequests(access.membership.role)) throw new Error("authority_request_activation_not_allowed");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("activate_authority_request_v1", {
      p_organization_id: access.membership.organizationId,
      p_authority_record_id: recordId,
      p_expected_version: Number(textField(formData, "expectedVersion")),
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    const result = data as {
      principal_invitation_id?: string;
      principal_token?: string;
      invitation_expires_at?: string;
    };

    let deliveryNotice = "request_activated_delivery_pending";
    if (result.principal_invitation_id && result.principal_token && result.invitation_expires_at) {
      const [{ data: record }, { data: invitation }] = await Promise.all([
        supabase.from("authority_records").select("principal_name, principal_email_normalized, representative_name, purpose, account_boundary").eq("organization_id", access.membership.organizationId).eq("id", recordId).maybeSingle(),
        supabase.from("authority_participant_invitations").select("version").eq("organization_id", access.membership.organizationId).eq("id", result.principal_invitation_id).maybeSingle(),
      ]);
      if (record && invitation) {
        const submission = await deliverParticipantInvitation({
          invitationId: result.principal_invitation_id,
          invitationVersion: Number(invitation.version),
          participantRole: "principal",
          email: String(record.principal_email_normalized),
          institutionName: access.organization.displayName,
          participantName: String(record.principal_name),
          otherPersonName: String(record.representative_name),
          purpose: String(record.purpose),
          accountBoundary: String(record.account_boundary),
          expiresAt: result.invitation_expires_at,
          secureUrl: new URL(`/r/${result.principal_token}`, getAuthorityAppUrl()).toString(),
        });
        const admin = createAuthorityAdminClient();
        const { error: deliveryError } = await admin.rpc("record_operator_participant_delivery_service_v1", {
          p_actor_user_id: access.user.id,
          p_organization_id: access.membership.organizationId,
          p_invitation_id: result.principal_invitation_id,
          p_expected_invitation_version: Number(invitation.version),
          p_delivery_status: submission.accepted ? "delivered" : "failed",
          p_provider: "resend",
          p_provider_message_id: submission.accepted ? submission.messageId : "",
          p_error_code: submission.accepted ? "" : submission.reason,
          p_idempotency_key: crypto.randomUUID(),
        });
        if (!deliveryError && submission.accepted) deliveryNotice = "request_activated";
      }
    }
    revalidatePath("/app");
    revalidatePath(`/app/requests/${recordId}`);
    destination = withMessage(`/app/requests/${recordId}`, "notice", deliveryNotice);
  } catch (error) {
    destination = withMessage(`/app/requests/${recordId}`, "error", errorCode(error));
  }
  redirect(destination);
}

export async function reissueParticipantInvitationAction(formData: FormData) {
  const recordId = textField(formData, "recordId");
  let destination = `/app/requests/${recordId}`;
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership || !access.organization) throw new Error("authentication_required");
    const participantRole = textField(formData, "participantRole") as "principal" | "representative";
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("reissue_participant_invitation_v1", {
      p_organization_id: access.membership.organizationId,
      p_authority_record_id: recordId,
      p_participant_role: participantRole,
      p_expected_record_version: Number(textField(formData, "expectedRecordVersion")),
      p_expected_invitation_version: Number(textField(formData, "expectedInvitationVersion")),
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    const result = data as {
      invitation_id?: string;
      invitation_version?: number;
      invitation_token?: string;
      email?: string;
      expires_at?: string;
    };
    if (!result.invitation_id || !result.invitation_version || !result.invitation_token || !result.email || !result.expires_at) {
      throw new Error("participant_invitation_reissue_invalid");
    }

    const { data: record, error: recordError } = await supabase
      .from("authority_records")
      .select("principal_name, representative_name, purpose, account_boundary, status")
      .eq("organization_id", access.membership.organizationId)
      .eq("id", recordId)
      .maybeSingle();
    if (recordError || !record) throw recordError ?? new Error("authority_request_not_found");
    const submission = await deliverParticipantInvitation({
      invitationId: result.invitation_id,
      invitationVersion: Number(result.invitation_version),
      participantRole,
      email: result.email,
      institutionName: access.organization.displayName,
      participantName: participantRole === "principal" ? String(record.principal_name) : String(record.representative_name),
      otherPersonName: participantRole === "principal" ? String(record.representative_name) : String(record.principal_name),
      purpose: String(record.purpose),
      accountBoundary: String(record.account_boundary),
      expiresAt: result.expires_at,
      secureUrl: new URL(`/r/${result.invitation_token}`, getAuthorityAppUrl()).toString(),
      accessPurpose: participantAccessPurpose(participantRole, record.status),
    });
    const admin = createAuthorityAdminClient();
    const { error: deliveryError } = await admin.rpc("record_operator_participant_delivery_service_v1", {
      p_actor_user_id: access.user.id,
      p_organization_id: access.membership.organizationId,
      p_invitation_id: result.invitation_id,
      p_expected_invitation_version: Number(result.invitation_version),
      p_delivery_status: submission.accepted ? "delivered" : "failed",
      p_provider: "resend",
      p_provider_message_id: submission.accepted ? submission.messageId : "",
      p_error_code: submission.accepted ? "" : submission.reason,
      p_idempotency_key: crypto.randomUUID(),
    });
    if (deliveryError) throw deliveryError;

    revalidatePath(`/app/requests/${recordId}`);
    destination = withMessage(`/app/requests/${recordId}`, "notice", submission.accepted ? "participant_invitation_submitted" : "participant_invitation_delivery_pending");
  } catch (error) {
    destination = withMessage(`/app/requests/${recordId}`, "error", errorCode(error));
  }
  redirect(destination);
}

export async function reviewEvidenceArtifactAction(formData: FormData) {
  const recordId = textField(formData, "recordId");
  let destination = `/app/requests/${recordId}`;
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership || !access.organization) throw new Error("authentication_required");
    if (!hasOrganizationCapability(access.membership.role, "requests.review_evidence")) throw new Error("evidence_review_not_allowed");
    const supabase = await createClient();
    const { error } = await supabase.rpc("review_evidence_artifact_v1", {
      p_organization_id: access.membership.organizationId,
      p_authority_record_id: recordId,
      p_artifact_id: textField(formData, "artifactId"),
      p_expected_record_version: Number(textField(formData, "expectedRecordVersion")),
      p_expected_artifact_version: Number(textField(formData, "expectedArtifactVersion")),
      p_outcome: textField(formData, "outcome"),
      p_note: textField(formData, "note"),
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    revalidatePath(`/app/requests/${recordId}`);
    destination = withMessage(destination, "notice", "evidence_review_saved");
  } catch (error) {
    destination = withMessage(destination, "error", errorCode(error));
  }
  redirect(destination);
}

export async function recordInstitutionDecisionAction(formData: FormData) {
  const recordId = textField(formData, "recordId");
  let destination = `/app/requests/${recordId}`;
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership || !access.organization) throw new Error("authentication_required");
    if (!hasOrganizationCapability(access.membership.role, "requests.decide")) throw new Error("institution_decision_not_allowed");
    const decision = prepareHostedInstitutionDecision({
      outcome: textField(formData, "outcome"),
      reason: textField(formData, "reason"),
      limitations: textField(formData, "limitations").split("\n"),
      acknowledged: checkbox(formData, "acknowledged"),
    });
    const admin = createAuthorityAdminClient();
    const { data, error } = await admin.rpc("record_institution_decision_service_v1", {
      p_actor_user_id: access.user.id,
      p_organization_id: access.membership.organizationId,
      p_authority_record_id: recordId,
      p_expected_version: Number(textField(formData, "expectedVersion")),
      p_outcome: decision.outcome,
      p_reason: decision.reason,
      p_limitations: decision.limitations,
      p_acknowledged: true,
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    const decisionResult = data as { replayed?: boolean; status?: string; version?: number };
    let receiptDeliveryComplete = true;

    if (!decisionResult.replayed) {
      const supabase = await createClient();
      const [{ data: record }, { data: invitations }] = await Promise.all([
        supabase
          .from("authority_records")
          .select("version, status, principal_name, representative_name, purpose, account_boundary")
          .eq("organization_id", access.membership.organizationId)
          .eq("id", recordId)
          .maybeSingle(),
        supabase
          .from("authority_participant_invitations")
          .select("participant_role, version")
          .eq("organization_id", access.membership.organizationId)
          .eq("authority_record_id", recordId),
      ]);

      receiptDeliveryComplete = Boolean(record && invitations?.length === 2);
      if (record && invitations?.length === 2) {
        for (const participantRole of ["principal", "representative"] as const) {
          const invitation = invitations.find((item) => item.participant_role === participantRole);
          if (!invitation) {
            receiptDeliveryComplete = false;
            continue;
          }

          const { data: reissued, error: reissueError } = await supabase.rpc("reissue_participant_invitation_v1", {
            p_organization_id: access.membership.organizationId,
            p_authority_record_id: recordId,
            p_participant_role: participantRole,
            p_expected_record_version: Number(record.version),
            p_expected_invitation_version: Number(invitation.version),
            p_idempotency_key: crypto.randomUUID(),
          });
          const receiptInvitation = reissued as {
            invitation_id?: string;
            invitation_version?: number;
            invitation_token?: string;
            email?: string;
            expires_at?: string;
          } | null;
          if (reissueError || !receiptInvitation?.invitation_id || !receiptInvitation.invitation_version || !receiptInvitation.invitation_token || !receiptInvitation.email || !receiptInvitation.expires_at) {
            receiptDeliveryComplete = false;
            continue;
          }

          const submission = await deliverParticipantInvitation({
            invitationId: receiptInvitation.invitation_id,
            invitationVersion: Number(receiptInvitation.invitation_version),
            participantRole,
            email: receiptInvitation.email,
            institutionName: access.organization.displayName,
            participantName: participantRole === "principal" ? String(record.principal_name) : String(record.representative_name),
            otherPersonName: participantRole === "principal" ? String(record.representative_name) : String(record.principal_name),
            purpose: String(record.purpose),
            accountBoundary: String(record.account_boundary),
            expiresAt: receiptInvitation.expires_at,
            secureUrl: new URL(`/r/${receiptInvitation.invitation_token}`, getAuthorityAppUrl()).toString(),
            accessPurpose: "receipt",
          });
          const { error: deliveryError } = await admin.rpc("record_operator_participant_delivery_service_v1", {
            p_actor_user_id: access.user.id,
            p_organization_id: access.membership.organizationId,
            p_invitation_id: receiptInvitation.invitation_id,
            p_expected_invitation_version: Number(receiptInvitation.invitation_version),
            p_delivery_status: submission.accepted ? "delivered" : "failed",
            p_provider: "resend",
            p_provider_message_id: submission.accepted ? submission.messageId : "",
            p_error_code: submission.accepted ? "" : submission.reason,
            p_idempotency_key: crypto.randomUUID(),
          });
          if (!submission.accepted || deliveryError) receiptDeliveryComplete = false;
        }
      }
    }
    revalidatePath("/app");
    revalidatePath(`/app/requests/${recordId}`);
    revalidatePath(`/app/requests/${recordId}/receipt`);
    destination = withMessage(
      `/app/requests/${recordId}/receipt`,
      "notice",
      decisionResult.replayed
        ? "institution_decision_saved"
        : receiptDeliveryComplete
          ? "institution_decision_saved_receipts_submitted"
          : "institution_decision_saved_receipts_pending",
    );
  } catch (error) {
    destination = withMessage(destination, "error", errorCode(error));
  }
  redirect(destination);
}

export async function requestHostedAuthorityInformationAction(formData: FormData) {
  const recordId = textField(formData, "recordId");
  let destination = `/app/requests/${recordId}`;
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership || !access.organization) throw new Error("authentication_required");
    if (!hasOrganizationCapability(access.membership.role, "requests.request_information")) throw new Error("information_request_not_allowed");
    const input = prepareHostedInformationRequest({
      requirementKey: textField(formData, "requirementKey"),
      message: textField(formData, "message"),
    });
    const admin = createAuthorityAdminClient();
    const { error } = await admin.rpc("request_authority_information_service_v1", {
      p_actor_user_id: access.user.id,
      p_organization_id: access.membership.organizationId,
      p_authority_record_id: recordId,
      p_expected_version: Number(textField(formData, "expectedVersion")),
      p_requirement_key: input.requirementKey,
      p_message: input.message,
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    revalidatePath("/app");
    revalidatePath(`/app/requests/${recordId}`);
    destination = withMessage(destination, "notice", "information_requested");
  } catch (error) {
    destination = withMessage(destination, "error", errorCode(error));
  }
  redirect(destination);
}

export async function recordAuthorityLifecycleAction(formData: FormData) {
  const recordId = textField(formData, "recordId");
  let destination = `/app/requests/${recordId}/receipt`;
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership || !access.organization) throw new Error("authentication_required");
    if (!hasOrganizationCapability(access.membership.role, "requests.decide")) throw new Error("authority_lifecycle_not_allowed");
    const lifecycle = prepareHostedLifecycleChange({
      action: textField(formData, "lifecycleAction"),
      reason: textField(formData, "reason"),
      acknowledged: checkbox(formData, "acknowledged"),
      currentStatus: textField(formData, "currentStatus") as never,
      validUntil: textField(formData, "validUntil"),
    });
    const admin = createAuthorityAdminClient();
    const { error } = await admin.rpc("record_authority_lifecycle_service_v1", {
      p_actor_user_id: access.user.id,
      p_organization_id: access.membership.organizationId,
      p_authority_record_id: recordId,
      p_expected_version: Number(textField(formData, "expectedVersion")),
      p_action: lifecycle.action,
      p_reason: lifecycle.reason,
      p_acknowledged: true,
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;
    revalidatePath("/app");
    revalidatePath(`/app/requests/${recordId}`);
    revalidatePath(`/app/requests/${recordId}/receipt`);
    destination = withMessage(destination, "notice", lifecycle.action === "revoke" ? "authority_revocation_saved" : "authority_expiration_saved");
  } catch (error) {
    destination = withMessage(destination, "error", errorCode(error));
  }
  redirect(destination);
}
