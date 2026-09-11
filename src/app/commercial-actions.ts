"use server";

import { redirect } from "next/navigation";
import { createAuthorityAdminClient } from "@/lib/supabase/admin";
import { COMMERCIAL_CONSENT_VERSION, prepareCommercialInquiry } from "@/lib/authority/commercial-inquiry";
import { deliverHubSpotInquiryOutbox } from "@/lib/commercial/hubspot-inquiry";
import { AuthorityError } from "@/lib/authority/errors";

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function contactRedirect(parameters: Record<string, string>): never {
  redirect(`/contact?${new URLSearchParams(parameters).toString()}`);
}

export async function createCommercialInquiryAction(_previous: { error: string | null }, formData: FormData): Promise<{ error: string | null }> {
  if (textField(formData, "website").trim()) contactRedirect({ sent: "1" });

  const idempotencyKey = textField(formData, "idempotencyKey").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) return { error: "Check the required fields and try again." };
  if (formData.get("contactConsent") !== "on") return { error: "Confirm that Passage may contact you about this request." };

  let reference = "received";
  try {
    const inquiry = prepareCommercialInquiry({
      inquiryType: textField(formData, "inquiryType"), fullName: textField(formData, "fullName"),
      email: textField(formData, "email"), organizationName: textField(formData, "organizationName"),
      organizationType: textField(formData, "organizationType"), jobRole: textField(formData, "jobRole"),
      currentProcess: textField(formData, "currentProcess"), annualVolumeBand: textField(formData, "annualVolumeBand"),
      message: textField(formData, "message"),
    });
    const admin = createAuthorityAdminClient();
    const { data, error } = await admin.rpc("create_commercial_inquiry_v1", {
      p_inquiry_type: inquiry.inquiryType, p_full_name: inquiry.fullName, p_email: inquiry.email,
      p_organization_name: inquiry.organizationName, p_organization_type: inquiry.organizationType,
      p_job_role: inquiry.jobRole, p_current_process: inquiry.currentProcess,
      p_annual_volume_band: inquiry.annualVolumeBand, p_message: inquiry.message,
      p_consent_version: COMMERCIAL_CONSENT_VERSION, p_source_path: "/contact", p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;
    reference = typeof data?.reference_code === "string" ? data.reference_code : "received";
    await deliverHubSpotInquiryOutbox(1).catch(() => undefined);
  } catch (error) {
    if (error instanceof AuthorityError && error.code === "INVALID_COMMAND") return { error: error.message };
    const message = error instanceof Error ? error.message : typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" ? error.message : "";
    if (message.includes("rate_limited")) return { error: "We received several requests from this address. Please try again in an hour." };
    return { error: "We could not confirm that your request was saved. Please try again." };
  }
  contactRedirect({ sent: "1", reference });
}
