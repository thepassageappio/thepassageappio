'use server';

import { redirect } from 'next/navigation';
import {
  B2B_MONTHLY_PRICE_IDS,
  getStripeClient,
  priceIdForD2cPlan,
  SINGLE_ESTATE_ONE_TIME_PRICE_ID,
  URGENT_ONE_TIME_PRICE_ID,
  type B2bPlanKey,
  type BillingPeriod,
  type D2cPlanKey,
} from '@/lib/stripe';

const validD2cPlans = new Set<D2cPlanKey>(['individual', 'couple', 'family']);
const validPeriods = new Set<BillingPeriod>(['monthly', 'annual']);
const validB2bPlans = new Set<B2bPlanKey>(['funeral_home_local', 'funeral_home_pilot', 'funeral_home_multi_location']);

function origin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.thepassageapp.io';
}

export async function startCheckout(formData: FormData): Promise<void> {
  const plan = String(formData.get('plan') ?? '');
  const period = String(formData.get('period') ?? '');
  if (!validD2cPlans.has(plan as D2cPlanKey) || !validPeriods.has(period as BillingPeriod)) {
    redirect('/pricing?checkout=invalid');
  }

  const stripe = getStripeClient();
  const priceId = priceIdForD2cPlan(plan as D2cPlanKey, period as BillingPeriod);
  if (!stripe || !priceId) {
    redirect('/pricing?checkout=unavailable');
  }

  const session = await stripe!.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin()}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin()}/pricing?checkout=cancelled`,
    metadata: { plan, period },
    allow_promotion_codes: true,
  });

  if (!session.url) redirect('/pricing?checkout=unavailable');
  redirect(session.url!);
}

// Single-estate lifetime purchase -- one-time payment, no recurring
// subscription, so it's a distinct mode/session shape from startCheckout.
export async function startOneTimeEstateCheckout(): Promise<void> {
  const stripe = getStripeClient();
  if (!stripe) redirect('/pricing?checkout=unavailable');

  const session = await stripe!.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: SINGLE_ESTATE_ONE_TIME_PRICE_ID, quantity: 1 }],
    success_url: `${origin()}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin()}/pricing?checkout=cancelled`,
    metadata: { plan: 'single_estate_one_time', period: 'once' },
  });

  if (!session.url) redirect('/pricing?checkout=unavailable');
  redirect(session.url!);
}

// Paid urgent one-time plan -- distinct from the free /start triage flow,
// which stays untouched. This is a purchasable add-on for someone who wants
// dedicated urgent support without a recurring subscription.
export async function startUrgentOneTimeCheckout(): Promise<void> {
  const stripe = getStripeClient();
  if (!stripe) redirect('/pricing?checkout=unavailable');

  const session = await stripe!.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: URGENT_ONE_TIME_PRICE_ID, quantity: 1 }],
    success_url: `${origin()}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin()}/pricing?checkout=cancelled`,
    metadata: { plan: 'urgent_one_time', period: 'once' },
  });

  if (!session.url) redirect('/pricing?checkout=unavailable');
  redirect(session.url!);
}

export async function startB2bCheckout(formData: FormData): Promise<void> {
  const plan = String(formData.get('plan') ?? '');
  if (!validB2bPlans.has(plan as B2bPlanKey)) redirect('/pricing?checkout=invalid');

  const stripe = getStripeClient();
  const priceId = B2B_MONTHLY_PRICE_IDS[plan as B2bPlanKey];
  if (!stripe || !priceId) redirect('/pricing?checkout=unavailable');

  const session = await stripe!.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin()}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin()}/pricing?checkout=cancelled`,
    metadata: { plan, period: 'monthly', segment: 'b2b_funeral_home' },
    allow_promotion_codes: true,
  });

  if (!session.url) redirect('/pricing?checkout=unavailable');
  redirect(session.url!);
}
