"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthorityMutationAccessContext } from "@/lib/authority/access";
import { organizationPublicListingErrorCode } from "@/lib/authority/organization-public-listing";
import { canManageMembers } from "@/lib/authority/role-capabilities";
import { createClient } from "@/lib/supabase/server";

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function withNotice(kind: "error" | "notice", code: string) {
  return `/app/organization?${kind}=${encodeURIComponent(code)}`;
}

/** Owner/admin: opt the institution in or out of requester multi-institution search. */
export async function setOrganizationPublicListingAction(formData: FormData) {
  let destination = "/app/organization";
  try {
    const access = await getAuthorityMutationAccessContext();
    if (!canManageMembers(access.membership.role)) {
      throw new Error("member_management_not_allowed");
    }

    const listed = formData.get("listed") === "true";
    const expectedVersion = Number(textField(formData, "expectedVersion"));
    const idempotencyKey = textField(formData, "idempotencyKey");
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1 || !idempotencyKey) {
      throw new Error("request_failed");
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("set_organization_public_listing_v1", {
      p_organization_id: access.membership.organizationId,
      p_listed: listed,
      p_expected_version: expectedVersion,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;

    revalidatePath("/app/organization");
    destination = withNotice("notice", "public_listing_updated");
  } catch (error) {
    destination = withNotice("error", organizationPublicListingErrorCode(error));
  }
  redirect(destination);
}
