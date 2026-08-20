'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import {
  ADDITIONAL_LOCATION_FEE_CENTS,
  ADDITIONAL_LOCATION_PRICE_ID,
  B2B_MONTHLY_PRICE_IDS,
  getStripeClient,
} from '@/lib/stripe';
import { createPassageServerClient } from '@/lib/supabase/server';
import { createPassageServiceClient } from '@/lib/supabase/service';

type OrganizationBillingRow = {
  additional_location_fee_cents: number;
  included_location_slots: number;
  partner_plan: string | null;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  stripe_subscription_id: string | null;
};

export type DirectorBillingSummary = {
  additionalLocations: number;
  amountCents: number;
  canAddLocation: boolean;
  includedLocationSlots: number;
  locationCount: number;
  organizationName: string;
  plan: string;
  renewalDate: string | null;
  status: string;
};

export type DirectorBillingSummaryResult =
  | { ok: true; data: DirectorBillingSummary }
  | { ok: false; reason: 'denied' | 'unavailable' };

const PLAN_LABELS: Record<string, string> = {
  funeral_home: 'Funeral Home',
  partner_group: 'Multiple Locations',
  partner_local: 'Local',
  partner_pilot: 'Pilot',
};

async function directorBillingAuthority() {
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || !['owner', 'director'].includes(viewer.viewer.role)) return null;
  const client = await createPassageServerClient();
  return client ? { client, viewer: viewer.viewer } : null;
}

export async function loadDirectorBillingSummary(): Promise<DirectorBillingSummaryResult> {
  const authority = await directorBillingAuthority();
  if (!authority) return { ok: false, reason: 'denied' };

  const [organizationResult, locationsResult, trialResult] = await Promise.all([
    authority.client
      .from('organizations')
      .select('additional_location_fee_cents, included_location_slots, partner_plan, stripe_customer_id, stripe_price_id, stripe_subscription_id')
      .eq('id', authority.viewer.organizationId)
      .maybeSingle(),
    authority.client
      .from('organization_locations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', authority.viewer.organizationId),
    authority.client.rpc('organization_trial_status', { p_organization_id: authority.viewer.organizationId }),
  ]);
  if (organizationResult.error || !organizationResult.data || locationsResult.error) return { ok: false, reason: 'unavailable' };

  const organization = organizationResult.data as OrganizationBillingRow;
  const trialRow = Array.isArray(trialResult.data) ? trialResult.data[0] : trialResult.data;
  const trial = trialRow as { is_gated?: boolean; is_paid?: boolean; trial_ends_at?: string | null } | null;
  const baseSummary = {
    additionalLocations: 0,
    amountCents: 0,
    canAddLocation: false,
    includedLocationSlots: organization.included_location_slots,
    locationCount: locationsResult.count ?? 0,
    organizationName: authority.viewer.organizationName,
    plan: PLAN_LABELS[organization.partner_plan ?? ''] ?? 'Trial',
    renewalDate: trial?.trial_ends_at ?? null,
    status: trial?.is_gated ? 'free plan' : 'trialing',
  } satisfies DirectorBillingSummary;

  if (!organization.stripe_subscription_id) return { ok: true, data: baseSummary };
  const stripe = getStripeClient();
  if (!stripe) return { ok: false, reason: 'unavailable' };
  const subscription = await stripe.subscriptions.retrieve(organization.stripe_subscription_id).catch(() => null);
  if (!subscription) return { ok: false, reason: 'unavailable' };

  const addOnItem = subscription.items.data.find((item) => item.price.id === ADDITIONAL_LOCATION_PRICE_ID);
  const baseItem = subscription.items.data.find((item) => item.price.id !== ADDITIONAL_LOCATION_PRICE_ID) ?? subscription.items.data[0];
  const amountCents = subscription.items.data.reduce(
    (total, item) => total + (item.price.unit_amount ?? 0) * (item.quantity ?? 1),
    0,
  );
  const paidAndCurrent = subscription.status === 'active' || subscription.status === 'trialing';
  const multipleLocationsPlan = organization.stripe_price_id === B2B_MONTHLY_PRICE_IDS.funeral_home_multi_location;

  return {
    ok: true,
    data: {
      ...baseSummary,
      additionalLocations: addOnItem?.quantity ?? 0,
      amountCents,
      canAddLocation: paidAndCurrent && !multipleLocationsPlan,
      plan: PLAN_LABELS[organization.partner_plan ?? ''] ?? 'Funeral Home',
      renewalDate: baseItem?.current_period_end ? new Date(baseItem.current_period_end * 1000).toISOString() : null,
      status: subscription.status,
    },
  };
}

// Adds one quantity of the recurring location Price to the organization's
// existing subscription, then advances the database entitlement. If the
// entitlement write fails, Stripe is restored to its prior quantity so a
// funeral home is never billed for a location it cannot create.
export async function addLocationSeat(): Promise<void> {
  const authority = await directorBillingAuthority();
  if (!authority) redirect('/director/billing?error=denied');
  const { data, error } = await authority!.client
    .from('organizations')
    .select('included_location_slots, stripe_price_id, stripe_subscription_id')
    .eq('id', authority!.viewer.organizationId)
    .maybeSingle();
  if (error) redirect('/director/billing?error=unavailable');
  const organization = data as Pick<OrganizationBillingRow, 'included_location_slots' | 'stripe_price_id' | 'stripe_subscription_id'> | null;
  if (!organization?.stripe_subscription_id) redirect('/director/billing?error=no-subscription');
  if (organization.stripe_price_id === B2B_MONTHLY_PRICE_IDS.funeral_home_multi_location) redirect('/director/billing?error=not-needed');

  const stripe = getStripeClient();
  if (!stripe) redirect('/director/billing?error=unavailable');
  const subscription = await stripe!.subscriptions.retrieve(organization.stripe_subscription_id);
  if (!['active', 'trialing'].includes(subscription.status)) redirect('/director/billing?error=no-subscription');
  const existingItem = subscription.items.data.find((item) => item.price.id === ADDITIONAL_LOCATION_PRICE_ID);
  const previousQuantity = existingItem?.quantity ?? 0;
  let createdItemId: string | null = null;

  try {
    if (existingItem) {
      await stripe!.subscriptionItems.update(existingItem.id, {
        quantity: previousQuantity + 1,
        proration_behavior: 'create_prorations',
      });
    } else {
      const createdItem = await stripe!.subscriptionItems.create({
        subscription: organization.stripe_subscription_id,
        price: ADDITIONAL_LOCATION_PRICE_ID,
        quantity: 1,
        proration_behavior: 'create_prorations',
      });
      createdItemId = createdItem.id;
    }

    const service = createPassageServiceClient();
    if (!service) throw new Error('service client unavailable');
    const update = await service
      .from('organizations')
      .update({
        additional_location_fee_cents: ADDITIONAL_LOCATION_FEE_CENTS,
        included_location_slots: organization.included_location_slots + 1,
      })
      .eq('id', authority!.viewer.organizationId)
      .eq('stripe_subscription_id', organization.stripe_subscription_id);
    if (update.error) throw update.error;
  } catch {
    if (createdItemId) {
      await stripe!.subscriptionItems.del(createdItemId, { proration_behavior: 'none' }).catch(() => null);
    } else if (existingItem) {
      await stripe!.subscriptionItems.update(existingItem.id, { quantity: previousQuantity, proration_behavior: 'none' }).catch(() => null);
    }
    redirect('/director/billing?error=unavailable');
  }

  revalidatePath('/director/billing');
  revalidatePath('/director/team');
  redirect('/director/billing?added=location');
}

export async function openDirectorBillingPortal(): Promise<void> {
  const authority = await directorBillingAuthority();
  if (!authority) redirect('/director/billing?error=denied');
  const { data } = await authority!.client
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', authority!.viewer.organizationId)
    .maybeSingle();
  const customerId = (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
  if (!customerId) redirect('/director/billing?error=no-subscription');
  const stripe = getStripeClient();
  if (!stripe) redirect('/director/billing?error=unavailable');
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.thepassageapp.io';
  const portal = await stripe!.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/director/billing`,
  });
  redirect(portal.url);
}
