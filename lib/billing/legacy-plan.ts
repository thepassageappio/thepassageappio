import type { B2bPlanKey, BillingPeriod, D2cPlanKey } from '@/lib/stripe';

// public.subscriptions.plan is a legacy Threshold-era check constraint using
// 'single' where this app's checkout flow says 'individual', and combines
// plan+period into one value ('family_annual') rather than two columns.
// Conforms to that existing vocabulary rather than widening the constraint --
// the constraint's own value list already anticipated exactly this catalog
// (funeral_home/partner_pilot/partner_local/partner_group/urgent/lifetime),
// confirming this is the design the schema was actually built for.
const LEGACY_D2C_PREFIX: Record<D2cPlanKey, string> = { individual: 'single', couple: 'couple', family: 'family' };

export function legacySubscriptionPlanValue(plan: D2cPlanKey, period: BillingPeriod): string {
  return `${LEGACY_D2C_PREFIX[plan]}_${period === 'monthly' ? 'monthly' : 'annual'}`;
}

const LEGACY_B2B_PLAN: Record<B2bPlanKey, string> = {
  funeral_home_local: 'partner_local',
  funeral_home_pilot: 'partner_pilot',
  funeral_home_multi_location: 'partner_group',
};

export function legacyB2bPlanValue(plan: B2bPlanKey): string {
  return LEGACY_B2B_PLAN[plan];
}

export function legacyOneTimePlanValue(kind: 'single_estate' | 'urgent'): string {
  return kind === 'single_estate' ? 'single_lifetime' : 'urgent';
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

const D2C_PLAN_LABEL: Record<D2cPlanKey, string> = { individual: 'Individual', couple: 'Couple', family: 'Family' };

export function planDisplayName(plan: D2cPlanKey, period: BillingPeriod): string {
  return `${D2C_PLAN_LABEL[plan]} · ${period === 'monthly' ? 'Monthly' : 'Annual'}`;
}

const B2B_PLAN_LABEL: Record<B2bPlanKey, string> = {
  funeral_home_local: 'Funeral Home · Local (1 location)',
  funeral_home_pilot: 'Funeral Home · Pilot (1 location)',
  funeral_home_multi_location: 'Funeral Home · Multiple Locations',
};

export function b2bPlanDisplayName(plan: B2bPlanKey): string {
  return B2B_PLAN_LABEL[plan];
}
