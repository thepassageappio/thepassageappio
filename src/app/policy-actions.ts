"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthorityMutationAccessContext } from "@/lib/authority/access";
import { FINANCIAL_POA_AUTHORITY_TYPE_KEY } from "@/lib/authority/permission-catalog";
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
  const message = String((error as { message: unknown }).message);
  const map: Record<string, string> = {
    mfa_verification_required: "mfa_required",
    permission_publish_not_allowed: "permission_publish_not_allowed",
    permission_catalog_read_not_allowed: "permission_publish_not_allowed",
    authority_type_not_available: "authority_type_not_available",
    authority_type_not_pack_ready: "authority_type_not_pack_ready",
    authority_type_publish_not_enabled: "authority_type_publish_not_enabled",
    permission_published_version_missing: "permission_published_version_missing",
    stale_permission_published_version: "permission_set_changed",
    permission_publish_items_required: "permission_publish_items_required",
    permission_publish_input_invalid: "permission_publish_input_invalid",
    permission_publish_reason_invalid: "permission_publish_reason_invalid",
    idempotency_key_required: "request_failed",
    idempotency_payload_mismatch: "request_changed",
    authentication_required: "access_unavailable",
  };
  return map[message] ?? "request_failed";
}

/**
 * Save for new requests — publish the org's offered permission set for
 * financial POA only (per-kind; never a global cross-kind library).
 */
export async function publishFinancialPoaPermissionSetAction(formData: FormData) {
  let destination = "/app/policies?notice=permission_set_saved_for_new_requests";
  try {
    const access = await getAuthorityMutationAccessContext();
    if (!["owner", "admin"].includes(access.membership.role)) {
      throw new Error("permission_publish_not_allowed");
    }

    const expectedId = textField(formData, "expectedPublishedVersionId");
    if (!expectedId) throw new Error("permission_publish_input_invalid");

    const supabase = await createClient();
    const { error } = await supabase.rpc("publish_permission_catalog_v1", {
      p_organization_id: access.membership.organizationId,
      p_authority_type_key: FINANCIAL_POA_AUTHORITY_TYPE_KEY,
      p_expected_published_version_id: expectedId,
      p_publish_reason: textField(formData, "publishReason") || "Save for new requests",
      p_idempotency_key: textField(formData, "idempotencyKey") || randomUUID(),
    });
    if (error) throw error;
    revalidatePath("/app/policies");
  } catch (error) {
    destination = withMessage("/app/policies", "error", errorCode(error));
  }
  redirect(destination);
}
