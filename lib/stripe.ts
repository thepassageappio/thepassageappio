import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (!client) client = new Stripe(secretKey);
  return client;
}

export type PricingPlanKey = 'individual' | 'couple' | 'family';
export type BillingPeriod = 'monthly' | 'annual';

const priceEnvVarByPlan: Record<PricingPlanKey, Record<BillingPeriod, string>> = {
  individual: { monthly: 'STRIPE_PRICE_SINGLE_MONTHLY', annual: 'STRIPE_PRICE_SINGLE_ANNUAL' },
  couple: { monthly: 'STRIPE_PRICE_COUPLE_MONTHLY', annual: 'STRIPE_PRICE_COUPLE_ANNUAL' },
  family: { monthly: 'STRIPE_PRICE_FAMILY_MONTHLY', annual: 'STRIPE_PRICE_FAMILY_ANNUAL' },
};

export function priceIdForPlan(plan: PricingPlanKey, period: BillingPeriod): string | null {
  const envVar = priceEnvVarByPlan[plan]?.[period];
  if (!envVar) return null;
  return process.env[envVar]?.trim() || null;
}

export const VENDOR_PLATFORM_FEE_PERCENT = 12;

