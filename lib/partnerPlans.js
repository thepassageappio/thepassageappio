export const FUNERAL_HOME_PLAN_OPTIONS = {
  partner_pilot: {
    id: 'partner_pilot',
    label: 'Pilot',
    shortLabel: 'Pilot',
    monthlyFeeCents: 0,
    includedLocationSlots: 1,
    additionalLocationFeeCents: 9900,
    activeCaseLimit: 10,
    description: 'Pilot workspace for one operating location before paid rollout.',
  },
  partner_local: {
    id: 'partner_local',
    label: 'Single location',
    shortLabel: 'Single',
    monthlyFeeCents: 24999,
    includedLocationSlots: 1,
    additionalLocationFeeCents: 9900,
    activeCaseLimit: null,
    description: 'One funeral-home location with unlimited active cases.',
  },
  partner_group: {
    id: 'partner_group',
    label: 'Multi-location',
    shortLabel: 'Multi-location',
    monthlyFeeCents: 34999,
    includedLocationSlots: 3,
    additionalLocationFeeCents: 7900,
    activeCaseLimit: null,
    description: 'Group workspace with reporting, staff scope, and three included locations.',
  },
};

export function partnerPlanFor(planId) {
  return FUNERAL_HOME_PLAN_OPTIONS[planId] || FUNERAL_HOME_PLAN_OPTIONS.partner_local;
}

export function normalizePartnerPlanId(value) {
  const planId = String(value || '').trim();
  if (FUNERAL_HOME_PLAN_OPTIONS[planId]) return planId;
  if (/group|multi/i.test(planId)) return 'partner_group';
  if (/pilot|demo/i.test(planId)) return 'partner_pilot';
  return 'partner_local';
}

export function locationUsageForPlan(planId, usedLocations = 0, overrides = {}) {
  const plan = partnerPlanFor(normalizePartnerPlanId(planId));
  const included = Number(overrides.includedLocationSlots ?? plan.includedLocationSlots ?? 1);
  const additionalFeeCents = Number(overrides.additionalLocationFeeCents ?? plan.additionalLocationFeeCents ?? 9900);
  const used = Math.max(0, Number(usedLocations || 0));
  return {
    planId: plan.id,
    planLabel: plan.label,
    includedLocationSlots: included,
    usedLocationSlots: used,
    remainingLocationSlots: Math.max(0, included - used),
    canAddIncludedLocation: used < included,
    needsUpgradeForNextLocation: used >= included,
    additionalLocationFeeCents: additionalFeeCents,
    overageLocationCount: Math.max(0, used - included),
  };
}
