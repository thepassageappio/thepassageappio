import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (!client) client = new Stripe(secretKey);
  return client;
}

// The real, already-priced Stripe catalog (2026-08-16 audit) that /pricing
// previously ignored -- ids hardcoded here (Stripe price ids are not
// secrets, same trust level as a SKU) rather than requiring new env vars.
// An env var override is still checked first for the three original D2C
// plans, in case those were already correctly configured before this
// migration -- everything new falls straight through to the hardcoded id.
//
// Two things flagged during the audit, not silently resolved:
// - "Funeral Home - MULTIPLE LOCATIONS - Monthly" had two different active
//   prices ($399.99 and $349.99, created ~9 minutes apart). Used the newer
//   $349.99 one as canonical (looks like a same-session correction); confirm
//   or correct if wrong.
// - Two generic-named prices ("Annual Subscription- Planning Tool",
//   "One Time Lifetime Charge- Planning Tool") duplicate the amount of the
//   more specifically-named "Single Estate" equivalents. Treated as
//   superseded/legacy and excluded; confirm if that assumption is wrong.
export type D2cPlanKey = 'individual' | 'couple' | 'family';
export type B2bPlanKey = 'funeral_home_local' | 'funeral_home_pilot' | 'funeral_home_multi_location';
export type BillingPeriod = 'monthly' | 'annual';

const D2C_RECURRING_PRICE_IDS: Record<D2cPlanKey, Record<BillingPeriod, string>> = {
  individual: { monthly: 'price_1TRt1SRteXSJR0llLPBbIc2c', annual: 'price_1TRt3ZRteXSJR0lleFgJvZkb' },
  couple: { monthly: 'price_1TRt6sRteXSJR0llVYbrJz9M', annual: 'price_1TRt7PRteXSJR0llDp3MHIBk' },
  family: { monthly: 'price_1TRt83RteXSJR0llvQAoJkbB', annual: 'price_1TRt8URteXSJR0llMdlGvgq8' },
};

const D2C_ENV_OVERRIDE: Record<D2cPlanKey, Record<BillingPeriod, string>> = {
  individual: { monthly: 'STRIPE_PRICE_SINGLE_MONTHLY', annual: 'STRIPE_PRICE_SINGLE_ANNUAL' },
  couple: { monthly: 'STRIPE_PRICE_COUPLE_MONTHLY', annual: 'STRIPE_PRICE_COUPLE_ANNUAL' },
  family: { monthly: 'STRIPE_PRICE_FAMILY_MONTHLY', annual: 'STRIPE_PRICE_FAMILY_ANNUAL' },
};

export function priceIdForD2cPlan(plan: D2cPlanKey, period: BillingPeriod): string {
  const envVar = D2C_ENV_OVERRIDE[plan][period];
  return process.env[envVar]?.trim() || D2C_RECURRING_PRICE_IDS[plan][period];
}

/** @deprecated use priceIdForD2cPlan */
export const priceIdForPlan = priceIdForD2cPlan;
/** @deprecated use D2cPlanKey */
export type PricingPlanKey = D2cPlanKey;

export const ESTATE_ADD_ON_PRICE_ID: Record<BillingPeriod, string> = {
  monthly: 'price_1TRt9GRteXSJR0llM7ZqiqSB',
  annual: 'price_1TRt9lRteXSJR0llCFh45Gpu',
};

// How many estates each D2C plan includes before an Estate Add-On is needed --
// drives subscriptions.included_estate_slots at checkout. Matches the plan
// copy on /pricing exactly ("Couple -- 2 estates", "Family -- 5 estates").
export const D2C_PLAN_ESTATE_SLOTS: Record<D2cPlanKey, number> = { individual: 1, couple: 2, family: 5 };

export const SINGLE_ESTATE_ONE_TIME_PRICE_ID = 'price_1TRt56RteXSJR0llFVfwybKI';
export const URGENT_ONE_TIME_PRICE_ID = 'price_1TR9CIRteXSJR0llphn8CwKg';

export const B2B_MONTHLY_PRICE_IDS: Record<B2bPlanKey, string> = {
  funeral_home_local: 'price_1TSHKiRteXSJR0llfxHiUO4O',
  funeral_home_pilot: 'price_1TSHBsRteXSJR0llMYM1m2yT',
  // Newer of the two duplicate "MULTIPLE LOCATIONS" prices -- see note above.
  funeral_home_multi_location: 'price_1TSHWqRteXSJR0ll7nTk4yfW',
};

export const VENDOR_PLATFORM_FEE_PERCENT = 12;

// Real, already-existing Stripe coupons backing /pricing's own long-standing
// promise ("Participants invited to a family's Passage record receive a
// reduced participant rate") -- never applied anywhere until now.
export const PARTICIPANT_DISCOUNT_COUPON_ID: Record<BillingPeriod, string> = {
  monthly: 'EyOpeqSp', // "25% off first month - Passage.IO"
  annual: 'uOrmHoKy', // "20% OFF FIRST YERR- PASSAGE.IO"
};
