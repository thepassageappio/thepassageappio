import type { BillingPeriod, PricingPlanKey } from '@/lib/stripe';

// public.subscriptions.plan is a legacy Threshold-era check constraint using
// 'single' where this app's checkout flow says 'individual', and combines
// plan+period into one value ('family_annual') rather than two columns.
// Conforms to that existing vocabulary rather than widening the constraint,
// since nothing else about the legacy table needed to change.
const LEGACY_PLAN_PREFIX: Record<PricingPlanKey, string> = { individual: 'single', couple: 'couple', family: 'family' };

export function legacySubscriptionPlanValue(plan: PricingPlanKey, period: BillingPeriod): string {
  return `${LEGACY_PLAN_PREFIX[plan]}_${period === 'monthly' ? 'monthly' : 'annual'}`;
}

// public.subscriptions.status check constraint uses British 'cancelled', not
// 'canceled', and has no 'incomplete'/'unpaid' values -- mapped defensively.
export function legacySubscriptionStatus(stripeStatus: string): 'active' | 'cancelled' | 'lapsed' | 'trialing' | 'past_due' {
  switch (stripeStatus) {
    case 'active': return 'active';
    case 'trialing': return 'trialing';
    case 'past_due': return 'past_due';
    case 'canceled': return 'cancelled';
    case 'unpaid':
    case 'incomplete_expired':
      return 'lapsed';
    default:
      return 'past_due';
  }
}

export function hubspotSubscriptionStatus(stripeStatus: string): 'active' | 'past_due' | 'canceled' {
  if (stripeStatus === 'active' || stripeStatus === 'trialing') return 'active';
  if (stripeStatus === 'past_due') return 'past_due';
  return 'canceled';
}

const PLAN_LABEL: Record<PricingPlanKey, string> = { individual: 'Individual', couple: 'Couple', family: 'Family' };

export function planDisplayName(plan: PricingPlanKey, period: BillingPeriod): string {
  return `${PLAN_LABEL[plan]} · ${period === 'monthly' ? 'Monthly' : 'Annual'}`;
}
