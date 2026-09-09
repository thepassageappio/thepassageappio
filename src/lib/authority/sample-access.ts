import "server-only";
import { randomUUID } from "node:crypto";
import { deliverHubSpotInquiryOutbox } from "@/lib/commercial/hubspot-inquiry";
import { createAuthorityAdminClient } from "@/lib/supabase/admin";

export const SAMPLE_ACCESS_CONSENT_VERSION = "sample-access-contact-2026.1";

export async function hasSampleAccessLead(actorUserId: string) {
  const admin = createAuthorityAdminClient();
  const { data, error } = await admin.rpc("has_sample_access_lead_v2", {
    p_actor_user_id: actorUserId,
    p_consent_version: SAMPLE_ACCESS_CONSENT_VERSION,
  });
  if (error) throw error;
  return data === true;
}

export async function createSampleAccessLead(actorUserId: string) {
  const admin = createAuthorityAdminClient();
  const { data, error } = await admin.rpc("create_sample_access_lead_v1", {
    p_actor_user_id: actorUserId,
    p_consent_version: SAMPLE_ACCESS_CONSENT_VERSION,
    p_source_path: "/sample/access",
    p_idempotency_key: randomUUID(),
  });
  if (error) throw error;

  const delivery = await deliverHubSpotInquiryOutbox(10);
  return { lead: data, delivery };
}
