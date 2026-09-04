import "server-only";
import { createAuthorityAdminClient } from "@/lib/supabase/admin";

const HUBSPOT_BASE = "https://api.hubapi.com";
const forbiddenPayloadKeys = /(participant|principal|representative|authority|evidence|document|account_reference|decision|receipt)/i;

export type HubSpotInquiryPayload = {
  reference_code: string; inquiry_type: "demo" | "pilot" | "general" | "billing" | "feature";
  full_name: string; email: string; organization_name: string; organization_type: string;
  job_role: string; current_process: string; annual_volume_band: string; message: string;
  consent_version: string; source_path: string; company_key: string; contact_key: string;
};

type OutboxJob = { id: string; attempts: number; idempotency_key: string; payload: HubSpotInquiryPayload };
type HubSpotRecord = { id: string };
type PropertyDefinition = { objectType: string; groupName: string; name: string; label: string; hasUniqueValue?: boolean };

const propertyDefinitions: PropertyDefinition[] = [
  { objectType: "companies", groupName: "companyinformation", name: "pa_prospect_key", label: "Passage prospect key", hasUniqueValue: true },
  { objectType: "companies", groupName: "companyinformation", name: "pa_inquiry_reference", label: "Latest Passage inquiry" },
  { objectType: "companies", groupName: "companyinformation", name: "pa_institution_category", label: "Passage institution category" },
  { objectType: "companies", groupName: "companyinformation", name: "pa_current_process", label: "Current authority process" },
  { objectType: "companies", groupName: "companyinformation", name: "pa_annual_volume_band", label: "Estimated annual authority volume" },
  { objectType: "contacts", groupName: "contactinformation", name: "pa_prospect_key", label: "Passage prospect key", hasUniqueValue: true },
  { objectType: "contacts", groupName: "contactinformation", name: "pa_inquiry_reference", label: "Latest Passage inquiry" },
  { objectType: "contacts", groupName: "contactinformation", name: "pa_contact_consent_version", label: "Passage contact consent version" },
  { objectType: "deals", groupName: "dealinformation", name: "pa_inquiry_reference", label: "Passage inquiry reference", hasUniqueValue: true },
  { objectType: "tickets", groupName: "ticketinformation", name: "pa_inquiry_reference", label: "Passage inquiry reference", hasUniqueValue: true },
];

class HubSpotError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); }
  get retryable() { return this.status === 408 || this.status === 429 || this.status >= 500; }
}

function safeErrorCode(error: unknown) {
  if (error instanceof HubSpotError) return error.code;
  return "hubspot_delivery_failed";
}

async function hubspotFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${HUBSPOT_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const code = response.status === 401 ? "hubspot_unauthorized"
      : response.status === 403 ? "hubspot_scope_missing"
      : response.status === 409 ? "hubspot_conflict"
      : response.status === 429 ? "hubspot_rate_limited"
      : response.status >= 500 ? "hubspot_unavailable" : "hubspot_request_invalid";
    throw new HubSpotError(response.status, code);
  }
  return response.status === 204 ? ({} as T) : await response.json() as T;
}

let schemaReady: Promise<void> | undefined;
async function validateInquirySchema(token: string) {
  schemaReady ??= (async () => {
    for (const definition of propertyDefinitions) {
      const existing = await fetch(`${HUBSPOT_BASE}/crm/v3/properties/${definition.objectType}/${definition.name}`, {
        headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000),
      });
      if (existing.ok) continue;
      if (existing.status === 404) throw new HubSpotError(422, `hubspot_schema_missing_${definition.name}`);
      throw new HubSpotError(existing.status, existing.status === 403 ? "hubspot_schema_scope_missing" : "hubspot_schema_unavailable");
    }
  })().catch(error => { schemaReady = undefined; throw error; });
  return schemaReady;
}

export function assertCommercialPayloadSafe(payload: Record<string, unknown>) {
  for (const key of Object.keys(payload)) {
    if (forbiddenPayloadKeys.test(key)) throw new Error("hubspot_payload_prohibited");
  }
}

export function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return { firstname: parts[0] ?? "", lastname: parts.slice(1).join(" ") };
}

async function findByUniqueProperty(token: string, objectType: string, property: string, value: string) {
  const result = await hubspotFetch<{ results: HubSpotRecord[] }>(token, `/crm/v3/objects/${objectType}/search`, {
    method: "POST",
    body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: property, operator: "EQ", value }] }], limit: 1 }),
  });
  return result.results[0]?.id;
}

async function upsert(token: string, objectType: string, uniqueProperty: string, uniqueValue: string, properties: Record<string, string>) {
  const id = await findByUniqueProperty(token, objectType, uniqueProperty, uniqueValue);
  if (id) {
    await hubspotFetch(token, `/crm/v3/objects/${objectType}/${id}`, { method: "PATCH", body: JSON.stringify({ properties }) });
    return id;
  }
  try {
    const created = await hubspotFetch<HubSpotRecord>(token, `/crm/v3/objects/${objectType}`, { method: "POST", body: JSON.stringify({ properties }) });
    return created.id;
  } catch (error) {
    if (!(error instanceof HubSpotError) || error.status !== 409) throw error;
    const racedId = await findByUniqueProperty(token, objectType, uniqueProperty, uniqueValue);
    if (!racedId) throw error;
    return racedId;
  }
}

async function firstStage(token: string, objectType: "deals" | "tickets", configuredPipeline?: string, configuredStage?: string) {
  if (!configuredPipeline || !configuredStage) throw new HubSpotError(422, `hubspot_${objectType}_routing_not_configured`);
  const response = await hubspotFetch<{ results: Array<{ id: string; stages: Array<{ id: string; displayOrder: number }> }> }>(token, `/crm/v3/pipelines/${objectType}`);
  const pipeline = response.results.find(item => item.id === configuredPipeline);
  const stage = pipeline?.stages.find(item => item.id === configuredStage);
  if (!pipeline || !stage) throw new HubSpotError(422, `hubspot_${objectType}_routing_invalid`);
  return { pipeline: pipeline.id, stage: stage.id };
}

async function associate(token: string, fromType: string, fromId: string, toType: string, toId: string) {
  await hubspotFetch(token, `/crm/v4/objects/${fromType}/${fromId}/associations/default/${toType}/${toId}`, { method: "PUT" });
}

export async function projectCommercialInquiry(token: string, payload: HubSpotInquiryPayload) {
  assertCommercialPayloadSafe(payload as unknown as Record<string, unknown>);
  const companyId = await upsert(token, "companies", "pa_prospect_key", payload.company_key, {
    name: payload.organization_name, pa_prospect_key: payload.company_key,
    pa_inquiry_reference: payload.reference_code, pa_institution_category: payload.organization_type,
    pa_current_process: payload.current_process, pa_annual_volume_band: payload.annual_volume_band,
  });
  const contactId = await upsert(token, "contacts", "pa_prospect_key", payload.contact_key, {
    ...splitName(payload.full_name), email: payload.email, jobtitle: payload.job_role,
    pa_prospect_key: payload.contact_key, pa_inquiry_reference: payload.reference_code,
    pa_contact_consent_version: payload.consent_version,
  });
  await associate(token, "contacts", contactId, "companies", companyId);

  const isOpportunity = payload.inquiry_type === "demo" || payload.inquiry_type === "pilot";
  const objectType = isOpportunity ? "deals" : "tickets";
  const stage = await firstStage(
    token, objectType,
    isOpportunity ? process.env.HUBSPOT_NEW_BUSINESS_PIPELINE_ID : process.env.HUBSPOT_SUPPORT_PIPELINE_ID,
    isOpportunity ? process.env.HUBSPOT_NEW_BUSINESS_STAGE_ID : process.env.HUBSPOT_SUPPORT_STAGE_ID,
  );
  const recordId = await upsert(token, objectType, "pa_inquiry_reference", payload.reference_code, isOpportunity ? {
    dealname: `${payload.organization_name} — ${payload.inquiry_type === "pilot" ? "Founding pilot" : "Product walkthrough"}`,
    pipeline: stage.pipeline, dealstage: stage.stage, pa_inquiry_reference: payload.reference_code,
  } : {
    subject: `${payload.organization_name} — ${payload.inquiry_type.replace("_", " ")}`,
    hs_pipeline: stage.pipeline, hs_pipeline_stage: stage.stage, pa_inquiry_reference: payload.reference_code,
  });
  await associate(token, objectType, recordId, "companies", companyId);
  await associate(token, objectType, recordId, "contacts", contactId);
  return { company_id: companyId, contact_id: contactId, object_type: objectType, record_id: recordId };
}

export async function deliverHubSpotInquiryOutbox(maxJobs = 1) {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim();
  if (!token || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return { configured: false, applied: 0, failed: 0 };
  await validateInquirySchema(token);
  const admin = createAuthorityAdminClient();
  let applied = 0;
  let failed = 0;
  for (let index = 0; index < Math.min(Math.max(maxJobs, 1), 10); index += 1) {
    const { data, error } = await admin.rpc("claim_hubspot_outbox_v1");
    if (error) throw error;
    const job = data as OutboxJob | null;
    if (!job) break;
    try {
      const result = await projectCommercialInquiry(token, job.payload);
      const completion = await admin.rpc("complete_hubspot_outbox_v1", { p_outbox_id: job.id, p_provider_result: result });
      if (completion.error) throw completion.error;
      applied += 1;
    } catch (error) {
      const retryable = error instanceof HubSpotError ? error.retryable : true;
      await admin.rpc("fail_hubspot_outbox_v1", { p_outbox_id: job.id, p_error_code: safeErrorCode(error), p_retryable: retryable });
      failed += 1;
    }
  }
  return { configured: true, applied, failed };
}
