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

// Custom properties this app depends on, beyond the native `dealtype` and
// the `revenue_segment` custom property (both already configured directly
// in HubSpot's UI by the founder -- Deal Type: New Business/Renewal/Renewal
// - Upgrade/Renewal - Downgrade/Churn/Marketplace Order; Revenue Segment:
// D2C Planning/D2C Urgent/B2B Funeral Home/B2B Assisted Living Facility/
// Marketplace Order -- so this file only ensures the plain scalar fields,
// never touches those two enums). Created idempotently (GET, then POST only
// if missing), degrading gracefully (skip, continue) if the token ever
// lacks crm.schemas.deals.write scope -- a payment-confirmation record must
// never be lost over a CRM schema hiccup.
type PropertyDefinition = { name: string; label: string; type: 'string' | 'number' | 'enumeration' | 'date' | 'datetime'; fieldType: string; options?: { label: string; value: string }[] };

const DEAL_PROPERTIES: PropertyDefinition[] = [
  { name: 'plan_name', label: 'Plan Name', type: 'string', fieldType: 'text' },
  { name: 'stripe_subscription_id', label: 'Stripe Subscription ID', type: 'string', fieldType: 'text' },
  { name: 'stripe_customer_id', label: 'Stripe Customer ID', type: 'string', fieldType: 'text' },
  { name: 'renewal_date', label: 'Renewal Date', type: 'date', fieldType: 'date' },
  { name: 'prior_subscription_amount_cents', label: 'Prior Subscription Amount (cents)', type: 'number', fieldType: 'number' },
  { name: 'subscription_status', label: 'Subscription Status', type: 'enumeration', fieldType: 'select', options: [
    { label: 'Active', value: 'active' },
    { label: 'Past Due', value: 'past_due' },
    { label: 'Canceled', value: 'canceled' },
  ] },
  { name: 'acquisition_channel', label: 'Acquisition Channel', type: 'enumeration', fieldType: 'select', options: [
    { label: 'Organic / Direct', value: 'organic_direct' },
    { label: 'Funeral Home Referral', value: 'funeral_home_referral' },
    { label: 'Urgent Intake', value: 'urgent_intake' },
    { label: 'Guide Lead', value: 'guide_lead' },
    { label: 'Contact Form', value: 'contact_form' },
  ] },
  { name: 'churn_reason', label: 'Churn Reason', type: 'string', fieldType: 'text' },
  { name: 'platform_fee_cents', label: 'Platform Fee (cents)', type: 'number', fieldType: 'number' },
  { name: 'vendor_payout_cents', label: 'Vendor Payout (cents)', type: 'number', fieldType: 'number' },
];

const CONTACT_PROPERTIES: PropertyDefinition[] = [
  { name: 'lifetime_value_cents', label: 'Lifetime Value (cents)', type: 'number', fieldType: 'number' },
];

let propertiesEnsured = false;

async function ensureProperties(objectType: 'deals' | 'contacts', properties: PropertyDefinition[]): Promise<void> {
  for (const property of properties) {
    const existing = await hubspotFetch(`/crm/v3/properties/${objectType}/${property.name}`, { method: 'GET' }).catch(() => null);
    if (existing?.ok) continue;
    await hubspotFetch(`/crm/v3/properties/${objectType}`, {
      method: 'POST',
      body: JSON.stringify({
        name: property.name,
        label: property.label,
        type: property.type,
        fieldType: property.fieldType,
        groupName: objectType === 'deals' ? 'dealinformation' : 'contactinformation',
        options: property.options?.map((option, index) => ({ ...option, displayOrder: index })),
      }),
    }).catch(() => null);
  }
}

export async function ensureHubspotDealProperties(): Promise<void> {
  if (propertiesEnsured || !hubspotToken()) return;
  await Promise.all([ensureProperties('deals', DEAL_PROPERTIES), ensureProperties('contacts', CONTACT_PROPERTIES)]);
  propertiesEnsured = true;
}

// Matches the exact Deal Type options configured in HubSpot (Settings ->
// Properties -> Deal Type). "Renewal" covers a flat renewal with no amount
// change; a real amount change at renewal gets Upgrade/Downgrade instead --
// there is deliberately no bare "Upgrade"/"Downgrade" outside the renewal
// family, since every amount change happens at a renewal/invoice event, not
// as a standalone transaction type.
export type DealTypeValue = 'New Business' | 'Renewal' | 'Renewal - Upgrade' | 'Renewal - Downgrade' | 'Churn' | 'Marketplace Order';
export type RevenueSegment = 'D2C Planning' | 'D2C Urgent' | 'B2B Funeral Home' | 'B2B Assisted Living Facility' | 'Marketplace Order';
export type AcquisitionChannel = 'organic_direct' | 'funeral_home_referral' | 'urgent_intake' | 'guide_lead' | 'contact_form';

function dollarsFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function dealDateProperty(isoOrNull: string | null): string | undefined {
  if (!isoOrNull) return undefined;
  return isoOrNull.slice(0, 10);
}

// The founder built a custom Lifecycle Stage taxonomy in HubSpot specific
// to Passage's actual personas (confirmed live against the account, not
// guessed) -- every Contact this app creates or updates should carry the
// right one of these rather than being left on HubSpot's generic default.
export const HUBSPOT_LIFECYCLE_STAGE = {
  funeralHomeDirectorOrEmployee: '4155093739',
  vendorOwnerOrEmployee: '4155093740',
  participant: '4155093741',
  customer: 'customer',
  churnedSubscriber: '4155821769',
} as const;

// Exported (was internal to the deal-creation flow) so any onboarding path
// -- not just a paying subscriber -- can get the person into HubSpot as a
// real, marketable Contact the moment they sign up. Idempotent by email via
// HubSpot's own upsert (idProperty: 'email'), so calling this again for the
// same person just updates the existing record. lifecycleStage is only ever
// written forward when passed -- omit it to update other fields (name, LTV)
// without touching a stage that may have since progressed past this call's
// context.
export async function upsertContact(email: string, firstName?: string, lastName?: string, lifetimeValueCents?: number, lifecycleStage?: string): Promise<string | null> {
  const [firstname, ...rest] = (firstName ? `${firstName} ${lastName ?? ''}` : email).trim().split(/\s+/).filter(Boolean);
  const lastname = lastName ?? rest.join(' ');
  const result = await hubspotFetch('/crm/v3/objects/contacts/batch/upsert', {
    method: 'POST',
    body: JSON.stringify({
      inputs: [{
        idProperty: 'email',
        id: email,
        properties: {
          email,
          ...(firstname ? { firstname } : {}),
          ...(lastname ? { lastname } : {}),
          ...(lifetimeValueCents !== undefined ? { lifetime_value_cents: String(lifetimeValueCents) } : {}),
          ...(lifecycleStage ? { lifecyclestage: lifecycleStage } : {}),
        },
      }],
    }),
  }).catch(() => null);
  if (!result?.ok) return null;
  const body = await result.json();
  return body?.results?.[0]?.id ?? null;
}

async function createDeal(properties: Record<string, string>, contactId: string): Promise<string | null> {
  const result = await hubspotFetch('/crm/v3/objects/deals', {
    method: 'POST',
    body: JSON.stringify({ properties, associations: [{ to: { id: contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] }] }),
  }).catch(() => null);
  if (!result?.ok) return null;
  const body = await result.json();
  return body?.id ?? null;
}

export type NewBusinessDealInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  dealName: string;
  amountCents: number;
  planName: string;
  revenueSegment: RevenueSegment;
  renewalDateIso: string | null;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  acquisitionChannel: AcquisitionChannel;
  // Which HUBSPOT_LIFECYCLE_STAGE this new payer becomes -- distinct from
  // revenueSegment (which is a deal-level reporting label): a paying D2C
  // subscriber is a 'customer', but a B2B checkout is the funeral home's
  // owner using the product day to day, so it carries the same stage as
  // every other funeral-home person rather than the generic 'customer'.
  contactLifecycleStage: string;
};

// The one-time anchor deal for a subscription, created at first payment and
// never mutated again -- its amount stays the historically accurate
// original sale. Ongoing state (current amount, renewal date) lives on the
// Renewal-family deals created at each cycle instead. Best-effort: returns
// null on any HubSpot failure rather than throwing, since a webhook must
// persist subscription state in Supabase regardless of CRM availability.
export async function createNewBusinessDeal(input: NewBusinessDealInput): Promise<{ dealId: string; contactId: string } | null> {
  if (!hubspotToken()) return null;
  await ensureHubspotDealProperties();

  const contactId = await upsertContact(input.email, input.firstName, input.lastName, input.amountCents, input.contactLifecycleStage);
  if (!contactId) return null;

  const dealId = await createDeal(
    {
      dealname: input.dealName,
      amount: dollarsFromCents(input.amountCents),
      pipeline: 'default',
      dealstage: 'closedwon',
      dealtype: 'New Business' satisfies DealTypeValue,
      revenue_segment: input.revenueSegment,
      plan_name: input.planName,
      stripe_subscription_id: input.stripeSubscriptionId,
      stripe_customer_id: input.stripeCustomerId,
      subscription_status: 'active',
      acquisition_channel: input.acquisitionChannel,
      ...(dealDateProperty(input.renewalDateIso) ? { renewal_date: dealDateProperty(input.renewalDateIso)! } : {}),
    },
    contactId,
  );
  if (!dealId) return null;
  return { dealId, contactId };
}

export type RenewalDealInput = {
  email: string;
  dealName: string;
  amountCents: number;
  priorAmountCents: number;
  planName: string;
  revenueSegment: RevenueSegment;
  renewalDateIso: string | null;
  stripeSubscriptionId: string;
  cumulativeLifetimeValueCents: number;
};

// Creates a new deal at every renewal cycle (invoice.paid, billing_reason
// subscription_cycle) -- not an update to any prior deal -- so the deal
// history reads as a ledger of what was actually charged each cycle, not a
// single mutated record. Deal Type is derived from comparing this cycle's
// amount to the prior one: unchanged is a flat Renewal, higher is Renewal -
// Upgrade, lower is Renewal - Downgrade.
export async function createRenewalDeal(input: RenewalDealInput): Promise<string | null> {
  if (!hubspotToken()) return null;
  await ensureHubspotDealProperties();

  // A renewal only ever fires for someone already paying -- always 'customer'.
  const contactId = await upsertContact(input.email, undefined, undefined, input.cumulativeLifetimeValueCents, HUBSPOT_LIFECYCLE_STAGE.customer);
  if (!contactId) return null;

  const dealType: DealTypeValue = input.amountCents === input.priorAmountCents
    ? 'Renewal'
    : input.amountCents > input.priorAmountCents
      ? 'Renewal - Upgrade'
      : 'Renewal - Downgrade';

  return createDeal(
    {
      dealname: input.dealName,
      amount: dollarsFromCents(input.amountCents),
      pipeline: 'default',
      dealstage: 'closedwon',
      dealtype: dealType,
      revenue_segment: input.revenueSegment,
      plan_name: input.planName,
      stripe_subscription_id: input.stripeSubscriptionId,
      subscription_status: 'active',
      prior_subscription_amount_cents: String(input.priorAmountCents),
      ...(dealDateProperty(input.renewalDateIso) ? { renewal_date: dealDateProperty(input.renewalDateIso)! } : {}),
    },
    contactId,
  );
}

export type ChurnDealInput = {
  email: string;
  dealName: string;
  lastAmountCents: number;
  planName: string;
  revenueSegment: RevenueSegment;
  stripeSubscriptionId: string;
};

// Cancellation gets its own deal (dealstage closedlost -- distinct from the
// New Business / Renewal deals, which stay closedwon as the historically
// accurate record that those sales happened) rather than mutating an
// existing one, so churned-MRR reporting has a real object to sum.
export async function createChurnDeal(input: ChurnDealInput): Promise<string | null> {
  if (!hubspotToken()) return null;
  await ensureHubspotDealProperties();

  const contactId = await upsertContact(input.email, undefined, undefined, undefined, HUBSPOT_LIFECYCLE_STAGE.churnedSubscriber);
  if (!contactId) return null;

  return createDeal(
    {
      dealname: input.dealName,
      amount: dollarsFromCents(input.lastAmountCents),
      pipeline: 'default',
      dealstage: 'closedlost',
      dealtype: 'Churn' satisfies DealTypeValue,
      revenue_segment: input.revenueSegment,
      plan_name: input.planName,
      stripe_subscription_id: input.stripeSubscriptionId,
      subscription_status: 'canceled',
    },
    contactId,
  );
}

// Maps Passage's vendor category enum (lib/partner/categories.ts) to the
// exact option values of the "Vendor Category" property the founder created
// directly in HubSpot -- values differ in spelling/wording from Passage's
// own labels ("Transport" vs "Car Service", "Printer / Stationery" vs
// "Printer/Stationary") so this cannot be derived from VENDOR_CATEGORY_LABELS.
// Confirmed against HubSpot's live property definition, not guessed.
export const HUBSPOT_VENDOR_CATEGORY: Record<string, string> = {
  florist: 'Florist',
  caterer: 'Caterer',
  restaurant: 'Restaurant',
  cemetery: 'Cemetery',
  transport: 'Car Service',
  printer_stationery: 'Printer/Stationary',
  memorial_products: 'Memorial Products',
  other: 'Other',
};

// Upserts the funeral-home Company by name and records its current location
// count in the already-provisioned (but previously never-written)
// number_of_locations field. `name` has no uniqueness constraint in HubSpot
// (unlike `email` on contacts), so batch/upsert's idProperty can't be used
// here -- search for an existing exact-name match first, then PATCH or
// CREATE, same effect without relying on a property HubSpot doesn't enforce
// uniqueness on.
export async function upsertOrganizationCompany(input: {
  name: string;
  locationCount?: number;
  domain?: string;
  city?: string;
  state?: string;
  phone?: string;
  vendorCategory?: string;
}): Promise<{ companyId: string } | null> {
  if (!hubspotToken()) return null;
  const properties = {
    name: input.name,
    ...(input.locationCount !== undefined ? { number_of_locations: String(input.locationCount) } : {}),
    ...(input.domain ? { domain: input.domain } : {}),
    ...(input.city ? { city: input.city } : {}),
    ...(input.state ? { state: input.state } : {}),
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.vendorCategory ? { vendor_category: input.vendorCategory } : {}),
  };

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
