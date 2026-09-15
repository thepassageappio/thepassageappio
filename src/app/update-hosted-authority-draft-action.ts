"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthorityMutationAccessContext } from "@/lib/authority/access";
import { userErrorMessage } from "@/lib/authority/user-messages";
import { canCoordinateAuthorityRequests } from "@/lib/authority/role-capabilities";
import { prepareHostedAuthorityDraftContacts } from "@/lib/authority/hosted-records";
import { createClient } from "@/lib/supabase/server";

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function withMessage(path: string, kind: "error" | "notice", code: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${kind}=${encodeURIComponent(code)}`;
}

function errorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("message" in error)) {
    return "request_failed";
  }
  const message = String(error.message);
  const map: Record<string, string> = {
    authority_request_creation_not_allowed: "request_creation_not_allowed",
    participant_name_invalid: "participant_name_invalid",
    participant_email_invalid: "participant_email_invalid",
    participant_roles_must_be_distinct: "participant_roles_must_be_distinct",
    idempotency_payload_mismatch: "request_changed",
    request_changed: "request_changed",
    draft_update_not_available: "draft_update_not_available",
    draft_update_input_invalid: "draft_update_input_invalid",
    authority_request_not_found: "request_unavailable",
    stale_authority_version: "request_changed",
    mfa_verification_required: "mfa_required",
    "Enter the full name of each person.": "participant_name_invalid",
    "Enter a valid email address for each person.": "participant_email_invalid",
    "The person granting authority and the representative need a different email address.": "participant_roles_must_be_distinct",
  };
  return map[message] ?? "request_failed";
}

export async function updateHostedAuthorityDraftAction(
  _previous: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const recordId = textField(formData, "recordId");
  let destination = `/app/requests/${recordId}`;
  try {
    const access = await getAuthorityMutationAccessContext();
    if (!canCoordinateAuthorityRequests(access.membership.role)) {
      throw new Error("authority_request_creation_not_allowed");
    }

    const input = prepareHostedAuthorityDraftContacts({
      principalName: textField(formData, "principalName"),
      principalEmail: textField(formData, "principalEmail"),
      representativeName: textField(formData, "representativeName"),
      representativeEmail: textField(formData, "representativeEmail"),
    });

    const supabase = await createClient();
    const { error } = await supabase.rpc("update_authority_draft_v1", {
      p_organization_id: access.membership.organizationId,
      p_authority_record_id: recordId,
      p_expected_version: Number(textField(formData, "expectedVersion")),
      p_principal_name: input.principalName,
      p_principal_email: input.principalEmail,
      p_representative_name: input.representativeName,
      p_representative_email: input.representativeEmail,
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (error) throw error;

    revalidatePath("/app");
    revalidatePath(`/app/requests/${recordId}`);
    destination = `${withMessage(`/app/requests/${recordId}`, "notice", "draft_updated")}#contact-details`;
  } catch (error) {
    return { error: userErrorMessage(errorCode(error)) };
  }
  redirect(destination);
}
