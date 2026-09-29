"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthorityMutationAccessContext } from "@/lib/authority/access";
import { userErrorMessage } from "@/lib/authority/user-messages";
import { deliverTeamInvitation, teamInvitationDeliveryBlocker } from "@/lib/authority/team-invitation-delivery";
import {
  buildTeamInvitationAcceptUrl,
  canReissueTeamInvitation,
  parseTeamInvitationReissueResult,
  teamInvitationNoticeCode,
  teamInvitationReissueErrorCode,
  type TeamInvitationReissuePurpose,
} from "@/lib/authority/team-invitation-reissue";
import { getAuthorityAppUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createAuthorityAdminClient } from "@/lib/supabase/admin";

type AuthorityMutationAccessContext = Awaited<ReturnType<typeof getAuthorityMutationAccessContext>>;

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function withNotice(kind: "error" | "notice", code: string) {
  return `/app/team?${kind}=${encodeURIComponent(code)}`;
}

async function loadManageableInvitation(access: AuthorityMutationAccessContext, invitationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_invitations")
    .select("id, email_normalized, role, status")
    .eq("organization_id", access.membership.organizationId)
    .eq("id", invitationId)
    .maybeSingle();
  if (error || !data || data.status !== "pending") throw new Error("invitation_not_available");
  if (!canReissueTeamInvitation(access.membership.role, String(data.role))) throw new Error("member_management_not_allowed");
  return { supabase, invitation: { id: String(data.id), email: String(data.email_normalized), role: String(data.role) } };
}

async function reissue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  access: AuthorityMutationAccessContext,
  formData: FormData,
  invitationId: string,
  purpose: TeamInvitationReissuePurpose,
) {
  // The database mints the new token, replaces the stored hash and appends the
  // audit event in one transaction. The old token is never read back.
  const { data, error } = await supabase.rpc("reissue_member_invitation_v1", {
    p_organization_id: access.membership.organizationId,
    p_invitation_id: invitationId,
    p_expected_version: Number(textField(formData, "expectedVersion")),
    p_purpose: purpose,
    p_idempotency_key: textField(formData, "idempotencyKey"),
  });
  if (error) throw error;
  return parseTeamInvitationReissueResult(data);
}

/** Owner/admin: make a fresh link and email it. Respects the Demo recipient allowlist before changing anything. */
export async function resendTeamInvitationAction(formData: FormData) {
  let destination = "/app/team";
  try {
    const authorityAppUrl = getAuthorityAppUrl();
    const access = await getAuthorityMutationAccessContext();
    const invitationId = textField(formData, "invitationId");
    const { supabase, invitation } = await loadManageableInvitation(access, invitationId);

    // Nothing is rotated when the email could not go out anyway, so a working
    // link someone already has is not turned off for nothing.
    const blocker = teamInvitationDeliveryBlocker(invitation.email);
    if (blocker) {
      destination = withNotice("notice", blocker === "recipient_not_allowed" ? "invitation_resend_skipped_demo_recipient" : "invitation_resend_skipped_configuration");
    } else {
      const result = await reissue(supabase, access, formData, invitationId, "resend");
      const delivery = await deliverTeamInvitation({
        invitationId: result.invitationId,
        invitationVersion: result.version,
        email: result.email,
        organizationName: access.organization.displayName,
        role: result.role,
        expiresAt: result.expiresAt,
        secureUrl: buildTeamInvitationAcceptUrl(authorityAppUrl, result.invitationId, result.token),
      });
      if (delivery.provider === "resend") {
        const admin = createAuthorityAdminClient();
        await admin.rpc("record_team_invitation_delivery_service_v1", {
          p_actor_user_id: access.user.id,
          p_organization_id: access.membership.organizationId,
          p_invitation_id: result.invitationId,
          p_delivery_status: delivery.delivered ? "delivered" : "failed",
          p_provider: "resend",
          p_provider_message_id: delivery.delivered ? delivery.messageId ?? "" : "",
          p_error_code: delivery.delivered ? "" : delivery.reason,
          p_idempotency_key: crypto.randomUUID(),
        });
      }
      destination = withNotice("notice", teamInvitationNoticeCode("resend", delivery.delivered ? { delivered: true } : { delivered: false, reason: delivery.reason }));
    }
    revalidatePath("/app/team");
  } catch (error) {
    destination = withNotice("error", teamInvitationReissueErrorCode(error));
  }
  redirect(destination);
}

export type CopyTeamInvitationLinkState = {
  status: "idle" | "ready" | "error";
  url?: string;
  message?: string;
};

/**
 * Owner/admin: make a fresh link to share by hand. The URL is returned to this
 * one response only. It is not put in a redirect, a cookie or a log.
 */
export async function copyTeamInvitationLinkAction(
  _previous: CopyTeamInvitationLinkState,
  formData: FormData,
): Promise<CopyTeamInvitationLinkState> {
  try {
    const authorityAppUrl = getAuthorityAppUrl();
    const access = await getAuthorityMutationAccessContext();
    const invitationId = textField(formData, "invitationId");
    const { supabase } = await loadManageableInvitation(access, invitationId);
    const result = await reissue(supabase, access, formData, invitationId, "copy_link");
    revalidatePath("/app/team");
    return { status: "ready", url: buildTeamInvitationAcceptUrl(authorityAppUrl, result.invitationId, result.token) };
  } catch (error) {
    return { status: "error", message: userErrorMessage(teamInvitationReissueErrorCode(error)) ?? undefined };
  }
}
