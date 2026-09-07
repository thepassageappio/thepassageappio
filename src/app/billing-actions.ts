"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { preparePilotInvoice } from "@/lib/authority/pilot-billing";
import { canManageBilling } from "@/lib/authority/role-capabilities";
import { deliverStripePilotInvoiceOutbox } from "@/lib/commercial/stripe-pilot";
import { createClient } from "@/lib/supabase/server";

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function billingError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("pilot_order_already_open")) return "invoice_open";
  if (message.includes("stale_entitlement_version")) return "plan_changed";
  if (message.includes("pilot_invoice_not_allowed")) return "not_allowed";
  if (message.includes("stripe_") || message.includes("pilot_invoice")) return "provider_unavailable";
  return "invalid";
}

export async function createFoundingPilotInvoiceAction(formData: FormData) {
  let destination = "/app/organization?billing=invalid";
  try {
    const access = await getAuthorityAccessContext();
    if (!access?.membership || !access.organization) throw new Error("authentication_required");
    if (!canManageBilling(access.membership.role)) throw new Error("pilot_invoice_not_allowed");

    const input = preparePilotInvoice({
      servicePeriodStart: textField(formData, "servicePeriodStart"),
      servicePeriodEnd: textField(formData, "servicePeriodEnd"),
      requestAllowance: Number(textField(formData, "requestAllowance")),
    });
    const supabase = await createClient();
    const requested = await supabase.rpc("request_pilot_invoice_v1", {
      p_organization_id: access.organization.id,
      p_service_period_start: input.servicePeriodStart,
      p_service_period_end: input.servicePeriodEnd,
      p_request_allowance: input.requestAllowance,
      p_expected_entitlement_version: Number(textField(formData, "expectedEntitlementVersion")),
      p_idempotency_key: textField(formData, "idempotencyKey"),
    });
    if (requested.error) throw requested.error;

    const delivery = await deliverStripePilotInvoiceOutbox(1);
    if (!delivery.configured || !delivery.invoiceUrl) throw new Error("stripe_provider_unavailable");
    revalidatePath("/app/organization");
    destination = delivery.invoiceUrl;
  } catch (error) {
    destination = `/app/organization?billing=${billingError(error)}`;
  }
  redirect(destination);
}
