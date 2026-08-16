const HUBSPOT_API_BASE = 'https://api.hubapi.com';

function hubspotToken(): string | null {
  return process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim() || null;
}

async function hubspotFetch(path: string, init: RequestInit): Promise<Response> {
  const token = hubspotToken();
  if (!token) throw new Error('HubSpot is not configured');
  return fetch(`${HUBSPOT_API_BASE}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
}

export type ContactInquiryInput = {
  email: string;
  name: string;
  phone?: string;
  category: string;
  message: string;
};

// Upserts by email so a repeat visitor updates the same Contact instead of
// creating duplicates, then logs the inquiry as a Note rather than writing
// into lifecyclestage/hs_lead_status -- those are hand-managed by sales today
// (see the 5 existing funeral-home leads) and a form submission should never
// silently overwrite that.
export async function recordContactInquiry(input: ContactInquiryInput): Promise<{ contactId: string } | null> {
  if (!hubspotToken()) return null;
  const [firstname, ...rest] = input.name.trim().split(/\s+/).filter(Boolean);
  const lastname = rest.join(' ');

  const upsertResult = await hubspotFetch('/crm/v3/objects/contacts/batch/upsert', {
    method: 'POST',
    body: JSON.stringify({
      inputs: [{
        idProperty: 'email',
        id: input.email,
        properties: {
          email: input.email,
          ...(firstname ? { firstname } : {}),
          ...(lastname ? { lastname } : {}),
          ...(input.phone ? { phone: input.phone } : {}),
        },
      }],
    }),
  });
  if (!upsertResult.ok) return null;
  const upsertBody = await upsertResult.json();
  const contactId: string | undefined = upsertBody?.results?.[0]?.id;
  if (!contactId) return null;

  const noteResult = await hubspotFetch('/crm/v3/objects/notes', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        hs_note_body: `Website inquiry — ${input.category}\n\n${input.message}`,
        hs_timestamp: Date.now(),
      },
    }),
  });
  if (noteResult.ok) {
    const noteBody = await noteResult.json();
    const noteId: string | undefined = noteBody?.id;
    if (noteId) {
      await hubspotFetch(`/crm/v4/objects/notes/${noteId}/associations/default/contacts/${contactId}`, { method: 'PUT' }).catch(() => null);
    }
  }

  return { contactId };
}

// Custom properties this app depends on. Created idempotently (GET, then
// POST only if missing) the first time they're needed, using the same
// private-app token as everything else in this file -- avoids requiring a
// manual HubSpot Settings click before the webhook can run, but degrades
// gracefully (logs and continues without the field) if the token ever lacks
// crm.schemas.deals.write scope, since a payment-confirmation record must
// never be lost over a CRM schema hiccup.
type PropertyDefinition = { name: string; label: string; type: 'string' | 'number' | 'enumeration' | 'date' | 'datetime'; fieldType: string; options?: { label: string; value: string }[] };

const DEAL_PROPERTIES: PropertyDefinition[] = [
  { name: 'revenue_stream', label: 'Revenue Stream', type: 'enumeration', fieldType: 'select', options: [
    { label: 'Planning (D2C)', value: 'planning' },
    { label: 'Urgent', value: 'urgent' },
    { label: 'Funeral Home', value: 'funeral_home' },
    { label: 'Assisted Living', value: 'assisted_living' },
  ] },
  { name: 'plan_name', label: 'Plan Name', type: 'string', fieldType: 'text' },
  { name: 'stripe_subscription_id', label: 'Stripe Subscription ID', type: 'string', fieldType: 'text' },
  { name: 'stripe_customer_id', label: 'Stripe Customer ID', type: 'string', fieldType: 'text' },
  { name: 'renewal_date', label: 'Renewal Date', type: 'date', fieldType: 'date' },
  { name: 'subscription_status', label: 'Subscription Status', type: 'enumeration', fieldType: 'select', options: [
    { label: 'Active', value: 'active' },
    { label: 'Past Due', value: 'past_due' },
    { label: 'Canceled', value: 'canceled' },
  ] },
  { name: 'mrr_movement_type', label: 'MRR Movement Type', type: 'enumeration', fieldType: 'select', options: [
    { label: 'New', value: 'new' },
    { label: 'Expansion', value: 'expansion' },
    { label: 'Contraction', value: 'contraction' },
    { label: 'Churn', value: 'churn' },
    { label: 'Reactivation', value: 'reactivation' },
  ] },
  { name: 'acquisition_channel', label: 'Acquisition Channel', type: 'enumeration', fieldType: 'select', options: [
    { label: 'Organic / Direct', value: 'organic_direct' },
    { label: 'Funeral Home Referral', value: 'funeral_home_referral' },
    { label: 'Urgent Intake', value: 'urgent_intake' },
    { label: 'Guide Lead', value: 'guide_lead' },
    { label: 'Contact Form', value: 'contact_form' },
  ] },
  { name: 'platform_fee_cents', label: 'Platform Fee (cents)', type: 'number', fieldType: 'number' },
  { name: 'vendor_payout_cents', label: 'Vendor Payout (cents)', type: 'number', fieldType: 'number' },
];

let propertiesEnsured = false;

export async function ensureHubspotDealProperties(): Promise<void> {
  if (propertiesEnsured || !hubspotToken()) return;
  for (const property of DEAL_PROPERTIES) {
    const existing = await hubspotFetch(`/crm/v3/properties/deals/${property.name}`, { method: 'GET' }).catch(() => null);
    if (existing?.ok) continue;
    const groupName = property.type === 'enumeration' ? 'dealinformation' : 'dealinformation';
    await hubspotFetch('/crm/v3/properties/deals', {
      method: 'POST',
      body: JSON.stringify({
        name: property.name,
        label: property.label,
        type: property.type,
        fieldType: property.fieldType,
        groupName,
        options: property.options?.map((option, index) => ({ ...option, displayOrder: index })),
      }),
    }).catch(() => null);
  }
  propertiesEnsured = true;
}

export type RevenueStream = 'planning' | 'urgent' | 'funeral_home' | 'assisted_living';
export type AcquisitionChannel = 'organic_direct' | 'funeral_home_referral' | 'urgent_intake' | 'guide_lead' | 'contact_form';
export type MrrMovementType = 'new' | 'expansion' | 'contraction' | 'churn' | 'reactivation';

export type SubscriptionDealInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  dealName: string;
  amountCents: number;
  planName: string;
  revenueStream: RevenueStream;
  renewalDateIso: string | null;
  subscriptionStatus: 'active' | 'past_due' | 'canceled';
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  acquisitionChannel: AcquisitionChannel;
  movementType: MrrMovementType;
  existingDealId?: string | null;
};

const CLOSED_WON_STAGE = 'closedwon';
const NEW_BUSINESS_TYPE = 'newbusiness';
const EXISTING_BUSINESS_TYPE = 'existingbusiness';

function dollarsFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function dealDateProperty(isoOrNull: string | null): string | undefined {
  if (!isoOrNull) return undefined;
  return isoOrNull.slice(0, 10);
}

// Upserts the master subscription Deal (updated in place across its
// lifetime, never recreated) and, for expansion/contraction movements, also
// creates a small companion existingbusiness Deal for just the delta so
// New-vs-Expansion pipeline reporting works. Contact is upserted by email
// first so the Deal always has a real association. Best-effort: returns null
// on any HubSpot failure rather than throwing, since a webhook must persist
// subscription state in Supabase regardless of CRM availability.
export async function upsertSubscriptionDeal(input: SubscriptionDealInput): Promise<{ dealId: string; contactId: string } | null> {
  if (!hubspotToken()) return null;
  await ensureHubspotDealProperties();

  const [firstname, ...rest] = (input.firstName ? `${input.firstName} ${input.lastName ?? ''}` : input.email).trim().split(/\s+/).filter(Boolean);
  const lastname = input.lastName ?? rest.join(' ');
  const contactResult = await hubspotFetch('/crm/v3/objects/contacts/batch/upsert', {
    method: 'POST',
    body: JSON.stringify({ inputs: [{ idProperty: 'email', id: input.email, properties: { email: input.email, ...(firstname ? { firstname } : {}), ...(lastname ? { lastname } : {}) } }] }),
  }).catch(() => null);
  if (!contactResult?.ok) return null;
  const contactBody = await contactResult.json();
  const contactId: string | undefined = contactBody?.results?.[0]?.id;
  if (!contactId) return null;

  const dealProperties: Record<string, string> = {
    dealname: input.dealName,
    amount: dollarsFromCents(input.amountCents),
    pipeline: 'default',
    dealstage: CLOSED_WON_STAGE,
    dealtype: NEW_BUSINESS_TYPE,
    revenue_stream: input.revenueStream,
    plan_name: input.planName,
    stripe_subscription_id: input.stripeSubscriptionId,
    stripe_customer_id: input.stripeCustomerId,
    subscription_status: input.subscriptionStatus,
    acquisition_channel: input.acquisitionChannel,
    mrr_movement_type: input.movementType,
    ...(dealDateProperty(input.renewalDateIso) ? { renewal_date: dealDateProperty(input.renewalDateIso)! } : {}),
  };

  if (input.existingDealId) {
    const updateResult = await hubspotFetch(`/crm/v3/objects/deals/${input.existingDealId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties: dealProperties }),
    }).catch(() => null);
    if (!updateResult?.ok) return null;
    return { dealId: input.existingDealId, contactId };
  }

  const createResult = await hubspotFetch('/crm/v3/objects/deals', {
    method: 'POST',
    body: JSON.stringify({ properties: dealProperties, associations: [{ to: { id: contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] }] }),
  }).catch(() => null);
  if (!createResult?.ok) return null;
  const createBody = await createResult.json();
  const dealId: string | undefined = createBody?.id;
  if (!dealId) return null;
  return { dealId, contactId };
}

// Companion deal for an expansion/contraction delta -- reported separately
// from the master deal's total so New vs Expansion MRR is distinguishable in
// pipeline views. amountDeltaCents may be negative for a contraction.
export async function createMovementCompanionDeal(input: { email: string; dealName: string; amountDeltaCents: number; revenueStream: RevenueStream; movementType: 'expansion' | 'contraction'; contactId: string }): Promise<string | null> {
  if (!hubspotToken()) return null;
  const result = await hubspotFetch('/crm/v3/objects/deals', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        dealname: input.dealName,
        amount: dollarsFromCents(Math.abs(input.amountDeltaCents)),
        pipeline: 'default',
        dealstage: CLOSED_WON_STAGE,
        dealtype: EXISTING_BUSINESS_TYPE,
        revenue_stream: input.revenueStream,
        mrr_movement_type: input.movementType,
      },
      associations: [{ to: { id: input.contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] }],
    }),
  }).catch(() => null);
  if (!result?.ok) return null;
  const body = await result.json();
  return body?.id ?? null;
}

// Upserts the funeral-home Company by name and records its current location
// count in the already-provisioned (but previously never-written)
// number_of_locations field. `name` has no uniqueness constraint in HubSpot
// (unlike `email` on contacts), so batch/upsert's idProperty can't be used
// here -- search for an existing exact-name match first, then PATCH or
// CREATE, same effect without relying on a property HubSpot doesn't enforce
// uniqueness on.
export async function upsertOrganizationCompany(input: { name: string; locationCount: number; domain?: string }): Promise<{ companyId: string } | null> {
  if (!hubspotToken()) return null;
  const properties = { name: input.name, number_of_locations: String(input.locationCount), ...(input.domain ? { domain: input.domain } : {}) };

  const searchResult = await hubspotFetch('/crm/v3/objects/companies/search', {
    method: 'POST',
    body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'name', operator: 'EQ', value: input.name }] }], limit: 1 }),
  }).catch(() => null);
  const searchBody = searchResult?.ok ? await searchResult.json() : null;
  const existingCompanyId: string | undefined = searchBody?.results?.[0]?.id;

  if (existingCompanyId) {
    const updateResult = await hubspotFetch(`/crm/v3/objects/companies/${existingCompanyId}`, { method: 'PATCH', body: JSON.stringify({ properties }) }).catch(() => null);
    if (!updateResult?.ok) return null;
    return { companyId: existingCompanyId };
  }

  const createResult = await hubspotFetch('/crm/v3/objects/companies', { method: 'POST', body: JSON.stringify({ properties }) }).catch(() => null);
  if (!createResult?.ok) return null;
  const createBody = await createResult.json();
  const companyId: string | undefined = createBody?.id;
  return companyId ? { companyId } : null;
}
