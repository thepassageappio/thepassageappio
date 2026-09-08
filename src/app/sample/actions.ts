"use server";

import { redirect } from "next/navigation";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { createSampleAccessLead } from "@/lib/authority/sample-access";

export async function grantSampleAccessAction(formData: FormData) {
  const access = await getAuthorityAccessContext();
  if (!access?.user) redirect("/start?intent=sample&next=/sample");

  if (formData.get("sampleContactConsent") !== "on") {
    redirect("/sample/access?error=consent_required");
  }

  try {
    await createSampleAccessLead(access.user.id);
  } catch {
    redirect("/sample/access?error=lead_unavailable");
  }

  redirect("/sample");
}
