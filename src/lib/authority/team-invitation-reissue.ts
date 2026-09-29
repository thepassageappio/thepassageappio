import type { OrganizationRole } from "./access.ts";
import { canManageMembers } from "./role-capabilities.ts";
import { DEMO_EMAIL_NOT_APPROVED, emailNotSentReason, type EmailSkipReason } from "./email-delivery-reason.ts";

export type TeamInvitationReissuePurpose = "resend" | "copy_link";

/** Only owners and administrators manage invitations. Administrators cannot manage administrator invitations. */
export function canReissueTeamInvitation(actorRole: OrganizationRole, invitationRole: string) {
  if (!canManageMembers(actorRole)) return false;
  if (actorRole === "owner") return true;
  return invitationRole !== "admin" && invitationRole !== "owner";
}

export type TeamInvitationReissueResult = {
  invitationId: string;
  email: string;
  role: string;
  version: number;
  expiresAt: string;
  token: string;
};

/** Validates the RPC result. A replay returns no token, so it is treated as unusable. */
export function parseTeamInvitationReissueResult(data: unknown): TeamInvitationReissueResult {
  const value = (data ?? {}) as Record<string, unknown>;
  const token = typeof value.token === "string" ? value.token : "";
  const version = Number(value.version);
  if (
    typeof value.invitation_id !== "string"
    || typeof value.email !== "string"
    || typeof value.role !== "string"
    || typeof value.expires_at !== "string"
    || !Number.isInteger(version) || version < 1
    || !/^[0-9a-f]{64}$/.test(token)
  ) {
    throw new Error("team_invitation_reissue_invalid");
  }
  return { invitationId: value.invitation_id, email: value.email, role: value.role, version, expiresAt: value.expires_at, token };
}

export function buildTeamInvitationAcceptUrl(appUrl: string, invitationId: string, token: string) {
  const url = new URL("/team/accept", appUrl);
  url.searchParams.set("invitation", invitationId);
  url.searchParams.set("token", token);
  return url.toString();
}

/** Resend dedupes by this key for a day, so each new link needs its own key. */
export function teamInvitationDeliveryIdempotencyKey(invitationId: string, version?: number) {
  return version && version > 1
    ? `authority-team-invitation-${invitationId}-v${version}`
    : `authority-team-invitation-${invitationId}`;
}

const knownReissueErrors: Record<string, string> = {
  mfa_verification_required: "mfa_required",
  member_management_not_allowed: "member_management_not_allowed",
  authentication_required: "member_management_not_allowed",
  stale_invitation_version: "invitation_changed",
  idempotency_payload_mismatch: "invitation_changed",
  invitation_not_available: "invitation_link_unavailable",
  invitation_expired: "invitation_link_expired",
  invitation_reissue_limit_reached: "invitation_reissue_limit_reached",
  team_invitation_reissue_invalid: "invitation_link_unavailable",
  invitation_reissue_purpose_invalid: "request_failed",
  authority_app_url_insecure: "invitation_configuration_invalid",
  authority_app_url_mismatch: "invitation_configuration_invalid",
  authority_public_site_url_missing: "invitation_configuration_invalid",
};

/** Maps a thrown error to a user message code. Never passes provider or database text through. */
export function teamInvitationReissueErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("message" in error)) return "request_failed";
  return knownReissueErrors[String((error as { message: unknown }).message)] ?? "request_failed";
}

/** Notice code after the first invite or a resend, chosen by what really happened to the email. */
export function teamInvitationNoticeCode(
  kind: "invite" | "resend",
  outcome: { delivered: true } | { delivered: false; reason: EmailSkipReason } | null,
) {
  if (!outcome) return kind === "invite" ? "invitation_created" : "invitation_resent_not_sent";
  if (outcome.delivered) return kind === "invite" ? "invitation_sent" : "invitation_resent";
  const suffix = outcome.reason === "recipient_not_allowed"
    ? "demo_recipient"
    : outcome.reason === "configuration_missing" ? "configuration" : "provider";
  return kind === "invite" ? `invitation_not_sent_${suffix}` : `invitation_resend_not_sent_${suffix}`;
}

export type TeamInvitationDeliveryView = {
  delivery_status?: string | null;
  delivery_error_code?: string | null;
  delivery_provider?: string | null;
};

/**
 * Delivery column text on /app/team. `blocker` is what would stop an email
 * from going out right now (Demo allowlist or email not set up), checked on
 * the server. 'processing' is never called "Delivered" until the webhook
 * confirms it (see 20260906193000_team_invitation_delivery_tracking.sql).
 */
export function teamInvitationDeliveryLabel(invitation: TeamInvitationDeliveryView, blocker: EmailSkipReason | null) {
  const status = invitation.delivery_status ?? "pending";
  if (status === "delivered") return "Delivered";
  if (status === "processing") return "Sending… confirming delivery";
  if (status === "retrying") return "Delivery delayed";
  if (status === "failed") return emailNotSentReason(invitation.delivery_error_code);
  if (invitation.delivery_provider === "manual_link") {
    // Copy resets delivery_status to pending (see 20260929090000), so we cannot
    // tell from the row whether email was sent earlier. Do not claim it wasn't
    // unless a blocker means email would not go out.
    if (blocker === "recipient_not_allowed") return "Link copied. No email sent.";
    if (blocker) return "Link copied. No email sent.";
    return "Link copied.";
  }
  if (blocker === "recipient_not_allowed") return DEMO_EMAIL_NOT_APPROVED;
  if (blocker) return emailNotSentReason(blocker);
  return "Not sent";
}

export function teamInvitationStatusLabel(invitation: { status: string; expires_at: string }, now = new Date()) {
  if (invitation.status === "pending" && new Date(invitation.expires_at) <= now) return "Expired. Send a new invitation.";
  if (invitation.status === "pending") return "Waiting for them to join";
  if (invitation.status === "accepted") return "Accepted";
  if (invitation.status === "expired") return "Expired";
  return "Revoked";
}
