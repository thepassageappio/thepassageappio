'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { d2cPlanFromLegacy, legacySubscriptionPlanValue } from '@/lib/billing/legacy-plan';
import { verifiedUser } from '@/lib/auth/session';
import {
  d2cPlanForPriceId,
  D2C_PLAN_ESTATE_SLOTS,
  D2C_RECURRING_PRICE_CENTS,
  ESTATE_ADD_ON_PRICE_ID,
  getStripeClient,
  priceIdForD2cPlan,
  type BillingPeriod,
  type D2cPlanKey,
} from '@/lib/stripe';
import { createPassageServerClient } from '@/lib/supabase/server';
import { createPassageServiceClient } from '@/lib/supabase/service';

type SubscriptionRow = {
  id: string;
  additional_estate_slots: number;
  amount_cents: number;
  included_estate_slots: number;
  interval: 'month' | 'year' | 'once';
  plan: string;
  renewal_date: string | null;
  started_at: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

export type PlanningBillingSummary = {
  addOnAmountCents: number | null;
  addOnSeats: number;
  amountCents: number;
  cancelAtPeriodEnd: boolean;
  estateCount: number;
  includedEstateSlots: number;
  interval: 'month' | 'year' | 'once' | null;
  mode: 'recurring' | 'one-time' | 'trial' | 'free';
  plan: string | null;
  renewalDate: string | null;
  status: string;
  trialEndsAt: string | null;
  upgradeOptions: Array<{ amountCents: number; plan: D2cPlanKey; slots: number }>;
};

export type UrgentBillingSummary = {
  amountCents: number;
  latestRequestStatus: string | null;
  mode: 'one-time' | 'free';
  requestCount: number;
  startedAt: string | null;
};

export type BillingSummary = { planning: PlanningBillingSummary; urgent: UrgentBillingSummary };
export type BillingSummaryResult =
  | { ok: true; data: BillingSummary }
  | { ok: false; reason: 'signed-out' | 'unavailable' };

function latest(rows: SubscriptionRow[], predicate: (row: SubscriptionRow) => boolean) {
  return rows.find(predicate) ?? null;
}

export async function loadBillingSummary(): Promise<BillingSummaryResult> {
  const client = await createPassageServerClient();
  if (!client) return { ok: false, reason: 'unavailable' };
  const user = await verifiedUser(client);
  if (!user) return { ok: false, reason: 'signed-out' };

  const [subscriptionsResult, trialResult, estatesResult, urgentResult] = await Promise.all([
    client.from('subscriptions').select('id, additional_estate_slots, amount_cents, included_estate_slots, interval, plan, renewal_date, started_at, status, stripe_customer_id, stripe_subscription_id').eq('user_id', user.id).order('started_at', { ascending: false }),
    client.rpc('d2c_trial_status'),
    client.from('workflows').select('id, mode, path').eq('user_id', user.id).is('organization_id', null),
    client.from('urgent_intake_requests').select('status, submitted_at').eq('requester_user_id', user.id).order('submitted_at', { ascending: false }),
  ]);
  if (subscriptionsResult.error || trialResult.error || estatesResult.error || urgentResult.error) return { ok: false, reason: 'unavailable' };

  const rows = (subscriptionsResult.data ?? []) as SubscriptionRow[];
  const recurring = latest(rows, (row) => row.interval !== 'once' && ['active', 'trialing', 'past_due'].includes(row.status));
  const oneTimePlanning = latest(rows, (row) => row.plan === 'single_lifetime' && row.status === 'active');
  const urgentPurchase = latest(rows, (row) => row.plan === 'urgent' && row.status === 'active');
  const trialData = Array.isArray(trialResult.data) ? trialResult.data[0] : trialResult.data;
  const trial = trialData as { is_gated?: boolean; is_paid?: boolean; trial_ends_at?: string | null } | null;
  const urgentRows = (urgentResult.data ?? []) as Array<{ status: string; submitted_at: string }>;
  const estateCount = ((estatesResult.data ?? []) as Array<{ id: string; mode: string | null; path: string | null }>).filter((workflow) => workflow.mode === 'green' || workflow.path === 'green').length;

  let planning: PlanningBillingSummary;
  if (recurring) {
    const legacyPlan = d2cPlanFromLegacy(recurring.plan);
    const stripe = getStripeClient();
    const subscription = stripe && recurring.stripe_subscription_id ? await stripe.subscriptions.retrieve(recurring.stripe_subscription_id).catch(() => null) : null;
    const addOnItem = subscription?.items.data.find((item) => item.price.id === ESTATE_ADD_ON_PRICE_ID.monthly || item.price.id === ESTATE_ADD_ON_PRICE_ID.annual);
    const baseItem = subscription?.items.data.find((item) => d2cPlanForPriceId(item.price.id));
    const livePlan = baseItem ? d2cPlanForPriceId(baseItem.price.id) : legacyPlan;
    const liveAmount = subscription ? subscription.items.data.reduce((total, item) => total + (item.price.unit_amount ?? 0) * (item.quantity ?? 1), 0) : recurring.amount_cents;
    const period: BillingPeriod = livePlan?.period ?? (recurring.interval === 'year' ? 'annual' : 'monthly');
    const addOnPrice = addOnItem?.price ?? (stripe ? await stripe.prices.retrieve(ESTATE_ADD_ON_PRICE_ID[period]).catch(() => null) : null);
    const currentSlots = livePlan ? D2C_PLAN_ESTATE_SLOTS[livePlan.plan] : recurring.included_estate_slots;
    const planOrder: D2cPlanKey[] = ['individual', 'couple', 'family'];
    const currentIndex = livePlan ? planOrder.indexOf(livePlan.plan) : -1;
    planning = {
      addOnAmountCents: addOnPrice?.unit_amount ?? null,
      addOnSeats: addOnItem?.quantity ?? recurring.additional_estate_slots,
      amountCents: liveAmount,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
      estateCount,
      includedEstateSlots: currentSlots + (addOnItem?.quantity ?? recurring.additional_estate_slots),
      interval: recurring.interval,
      mode: 'recurring',
      plan: livePlan ? legacySubscriptionPlanValue(livePlan.plan, livePlan.period) : recurring.plan,
      renewalDate: baseItem?.current_period_end ? new Date(baseItem.current_period_end * 1000).toISOString() : recurring.renewal_date,
      status: subscription?.status ?? recurring.status,
      trialEndsAt: null,
      upgradeOptions: currentIndex >= 0 ? planOrder.slice(currentIndex + 1).map((plan) => ({ plan, slots: D2C_PLAN_ESTATE_SLOTS[plan], amountCents: D2C_RECURRING_PRICE_CENTS[plan][period] })) : [],
    };
  } else if (oneTimePlanning) {
    planning = { addOnAmountCents: null, addOnSeats: 0, amountCents: oneTimePlanning.amount_cents, cancelAtPeriodEnd: false, estateCount, includedEstateSlots: 1, interval: 'once', mode: 'one-time', plan: oneTimePlanning.plan, renewalDate: null, status: oneTimePlanning.status, trialEndsAt: null, upgradeOptions: [] };
  } else {
    const inTrial = trial?.is_gated === false;
    planning = { addOnAmountCents: null, addOnSeats: 0, amountCents: 0, cancelAtPeriodEnd: false, estateCount, includedEstateSlots: 1, interval: null, mode: inTrial ? 'trial' : 'free', plan: null, renewalDate: null, status: inTrial ? 'trialing' : 'no plan', trialEndsAt: trial?.trial_ends_at ?? null, upgradeOptions: [] };
  }

  return { ok: true, data: { planning, urgent: { amountCents: urgentPurchase?.amount_cents ?? 0, latestRequestStatus: urgentRows[0]?.status ?? null, mode: urgentPurchase ? 'one-time' : 'free', requestCount: urgentRows.length, startedAt: urgentPurchase?.started_at ?? null } } };
}

// Adds one estate line item and advances the database entitlement only after
// Stripe succeeds. A failed entitlement write restores Stripe so the family
// is never billed for an estate it cannot create.
export async function addEstateSeat(): Promise<void> {
  const client = await createPassageServerClient();
  if (!client) redirect('/account/billing?error=unavailable');
  const user = await verifiedUser(client);
  if (!user) redirect('/account/billing?error=denied');
  const { data } = await client.from('subscriptions').select('id, additional_estate_slots, stripe_subscription_id, interval').eq('user_id', user.id).in('status', ['active', 'trialing']).neq('interval', 'once').order('started_at', { ascending: false }).limit(1).maybeSingle();
  const row = data as Pick<SubscriptionRow, 'id' | 'additional_estate_slots' | 'stripe_subscription_id' | 'interval'> | null;
  if (!row?.stripe_subscription_id) redirect('/account/billing?error=no-subscription');
  const stripe = getStripeClient();
  if (!stripe) redirect('/account/billing?error=unavailable');
  const period: BillingPeriod = row.interval === 'year' ? 'annual' : 'monthly';
  const addOnPriceId = ESTATE_ADD_ON_PRICE_ID[period];
  const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
  if (!['active', 'trialing'].includes(subscription.status)) redirect('/account/billing?error=no-subscription');
  const existingItem = subscription.items.data.find((item) => item.price.id === addOnPriceId);
  const previousQuantity = existingItem?.quantity ?? 0;
  let createdItemId: string | null = null;
  try {
    if (existingItem) await stripe.subscriptionItems.update(existingItem.id, { quantity: previousQuantity + 1, proration_behavior: 'create_prorations' });
    else createdItemId = (await stripe.subscriptionItems.create({ subscription: row.stripe_subscription_id, price: addOnPriceId, quantity: 1, proration_behavior: 'create_prorations' })).id;
    const service = createPassageServiceClient();
    if (!service) throw new Error('service client unavailable');
    const update = await service.from('subscriptions').update({ additional_estate_slots: previousQuantity + 1 }).eq('id', row.id).eq('user_id', user.id);
    if (update.error) throw update.error;
  } catch {
    if (createdItemId) await stripe.subscriptionItems.del(createdItemId, { proration_behavior: 'none' }).catch(() => null);
    else if (existingItem) await stripe.subscriptionItems.update(existingItem.id, { quantity: previousQuantity, proration_behavior: 'none' }).catch(() => null);
    redirect('/account/billing?error=unavailable');
  }
  revalidatePath('/account/billing');
  revalidatePath('/case');
  redirect('/account/billing?added=estate');
}

export async function upgradePlanningPlan(formData: FormData): Promise<void> {
  const target = String(formData.get('plan') ?? '') as D2cPlanKey;
  if (!(['individual', 'couple', 'family'] as string[]).includes(target)) redirect('/account/billing?error=invalid-plan');
  const client = await createPassageServerClient();
  if (!client) redirect('/account/billing?error=unavailable');
  const user = await verifiedUser(client);
  if (!user) redirect('/account/billing?error=denied');
  const { data } = await client.from('subscriptions').select('id, stripe_subscription_id').eq('user_id', user.id).neq('interval', 'once').in('status', ['active', 'trialing']).order('started_at', { ascending: false }).limit(1).maybeSingle();
  const row = data as Pick<SubscriptionRow, 'id' | 'stripe_subscription_id'> | null;
  if (!row?.stripe_subscription_id) redirect('/account/billing?error=no-subscription');
  const stripe = getStripeClient();
  if (!stripe) redirect('/account/billing?error=unavailable');
  const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
  const baseItem = subscription.items.data.find((item) => d2cPlanForPriceId(item.price.id));
  const current = baseItem ? d2cPlanForPriceId(baseItem.price.id) : null;
  if (!baseItem || !current || D2C_PLAN_ESTATE_SLOTS[target] <= D2C_PLAN_ESTATE_SLOTS[current.plan]) redirect('/account/billing?error=invalid-plan');
  const targetPriceId = priceIdForD2cPlan(target, current.period);
  try {
    await stripe.subscriptionItems.update(baseItem.id, { price: targetPriceId, quantity: 1, proration_behavior: 'create_prorations' });
    const updatedSubscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    const updatedBase = updatedSubscription.items.data.find((item) => item.price.id === targetPriceId);
    const amountCents = updatedSubscription.items.data.reduce((total, item) => total + (item.price.unit_amount ?? 0) * (item.quantity ?? 1), 0);
    const renewalDate = updatedBase?.current_period_end ? new Date(updatedBase.current_period_end * 1000).toISOString() : null;
    const service = createPassageServiceClient();
    if (!service) throw new Error('service client unavailable');
    const update = await service.from('subscriptions').update({ amount_cents: amountCents, included_estate_slots: D2C_PLAN_ESTATE_SLOTS[target], plan: legacySubscriptionPlanValue(target, current.period), renewal_date: renewalDate, current_period_end: renewalDate }).eq('id', row.id).eq('user_id', user.id);
    if (update.error) throw update.error;
  } catch {
    await stripe.subscriptionItems.update(baseItem.id, { price: baseItem.price.id, quantity: 1, proration_behavior: 'none' }).catch(() => null);
    redirect('/account/billing?error=unavailable');
  }
  revalidatePath('/account/billing');
  revalidatePath('/case');
  redirect(`/account/billing?upgraded=${target}`);
}

export async function openBillingPortal(): Promise<void> {
  const client = await createPassageServerClient();
  if (!client) redirect('/account/billing?error=unavailable');
  const user = await verifiedUser(client);
  if (!user) redirect('/account/billing?error=denied');
  const { data } = await client.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).neq('interval', 'once').order('started_at', { ascending: false }).limit(1).maybeSingle();
  const customerId = (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
  if (!customerId) redirect('/account/billing?error=no-subscription');
  const stripe = getStripeClient();
  if (!stripe) redirect('/account/billing?error=unavailable');
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.thepassageapp.io';
  const portalSession = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/account/billing` });
  redirect(portalSession.url);
}
