'use server';

import { redirect } from 'next/navigation';
import { getStripeClient, priceIdForPlan, type BillingPeriod, type PricingPlanKey } from '@/lib/stripe';

const validPlans = new Set<PricingPlanKey>(['individual', 'couple', 'family']);
const validPeriods = new Set<BillingPeriod>(['monthly', 'annual']);

export async function startCheckout(formData: FormData): Promise<void> {
  const plan = String(formData.get('plan') ?? '');
  const period = String(formData.get('period') ?? '');
  if (!validPlans.has(plan as PricingPlanKey) || !validPeriods.has(period as BillingPeriod)) {
    redirect('/pricing?checkout=invalid');
  }

  const stripe = getStripeClient();
  const priceId = priceIdForPlan(plan as PricingPlanKey, period as BillingPeriod);
  if (!stripe || !priceId) {
    redirect('/pricing?checkout=unavailable');
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.thepassageapp.io';
  const session = await stripe!.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId!, quantity: 1 }],
    success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    metadata: { plan, period },
    allow_promotion_codes: true,
  });

  if (!session.url) redirect('/pricing?checkout=unavailable');
  redirect(session.url!);
}
