import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../lib/adminAccess';

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(supabaseUrl, supabaseAnon);
const admin = createClient(supabaseUrl, supabaseService);

const PLANS = {
  single_monthly: {
    label: 'Passage Single Estate Monthly',
    amount: 999,
    mode: 'subscription',
    interval: 'month',
    estateSeats: 1,
    priceEnv: ['STRIPE_PRICE_SINGLE_MONTHLY', 'STRIPE_PRICE_PLANNING_SINGLE_MONTHLY', 'STRIPE_PRICE_MONTHLY_GREEN', 'STRIPE_PRICE_MONTHLY'],
  },
  single_annual: {
    label: 'Passage Single Estate Annual',
    amount: 7999,
    mode: 'subscription',
    interval: 'year',
    estateSeats: 1,
    priceEnv: ['STRIPE_PRICE_SINGLE_ANNUAL', 'STRIPE_PRICE_PLANNING_SINGLE_ANNUAL', 'STRIPE_PRICE_ANNUAL_GREEN', 'STRIPE_PRICE_ANNUAL'],
  },
  couple_monthly: {
    label: 'Passage Couple Monthly',
    amount: 1499,
    mode: 'subscription',
    interval: 'month',
    estateSeats: 2,
    priceEnv: ['STRIPE_PRICE_COUPLE_MONTHLY', 'STRIPE_PRICE_PLANNING_COUPLE_MONTHLY'],
  },
  couple_annual: {
    label: 'Passage Couple Annual',
    amount: 11999,
    mode: 'subscription',
    interval: 'year',
    estateSeats: 2,
    priceEnv: ['STRIPE_PRICE_COUPLE_ANNUAL', 'STRIPE_PRICE_PLANNING_COUPLE_ANNUAL'],
  },
  family_monthly: {
    label: 'Passage Family Steward Monthly',
    amount: 2499,
    mode: 'subscription',
    interval: 'month',
    estateSeats: 5,
    priceEnv: ['STRIPE_PRICE_FAMILY_MONTHLY', 'STRIPE_PRICE_PLANNING_FAMILY_MONTHLY'],
  },
  family_annual: {
    label: 'Passage Family Steward Annual',
    amount: 19999,
    mode: 'subscription',
    interval: 'year',
    estateSeats: 5,
    priceEnv: ['STRIPE_PRICE_FAMILY_ANNUAL', 'STRIPE_PRICE_PLANNING_FAMILY_ANNUAL'],
  },
  addon_monthly: {
    label: 'Passage Additional Estate Monthly',
    amount: 499,
    mode: 'subscription',
    interval: 'month',
    estateSeats: 1,
    addOn: true,
    priceEnv: ['STRIPE_PRICE_ADDON_ESTATE_MONTHLY', 'STRIPE_PRICE_ADDITIONAL_ESTATE_MONTHLY'],
  },
  addon_annual: {
    label: 'Passage Additional Estate Annual',
    amount: 3999,
    mode: 'subscription',
    interval: 'year',
    estateSeats: 1,
    addOn: true,
    priceEnv: ['STRIPE_PRICE_ADDON_ESTATE_ANNUAL', 'STRIPE_PRICE_ADDITIONAL_ESTATE_ANNUAL'],
  },
  urgent: {
    label: 'Passage Urgent Estate Plan',
    amount: 7999,
    mode: 'payment',
    priceEnv: 'STRIPE_PRICE_URGENT',
    impact: '15_percent_pledge_grief_support_or_memorial_impact',
  },
  partner_pilot: {
    label: 'Passage Partner Pilot',
    amount: 9900,
    mode: 'subscription',
    interval: 'month',
    partnerPlan: true,
    priceEnv: ['STRIPE_PRICE_PARTNER_PILOT_MONTHLY', 'STRIPE_PRICE_FUNERAL_HOME_PILOT_MONTHLY'],
  },
  partner_local: {
    label: 'Passage Partner Local',
    amount: 24999,
    mode: 'subscription',
    interval: 'month',
    partnerPlan: true,
    priceEnv: ['STRIPE_PRICE_PARTNER_LOCAL_MONTHLY', 'STRIPE_PRICE_FUNERAL_HOME_LOCAL_MONTHLY'],
  },
  partner_group: {
    label: 'Passage Partner Group',
    amount: 34999,
    mode: 'subscription',
    interval: 'month',
    partnerPlan: true,
    priceEnv: ['Funeral_Home_MULTI_LOCATION_Monthly', 'STRIPE_PRICE_PARTNER_GROUP_MONTHLY', 'STRIPE_PRICE_FUNERAL_HOME_GROUP_MONTHLY'],
  },
  monthly: null,
  semiannual: null,
  annual: null,
};

PLANS.monthly = PLANS.single_monthly;
PLANS.annual = PLANS.single_annual;
PLANS.semiannual = {
  label: 'Passage Semi-Annual',
  amount: 4999,
  mode: 'subscription',
  interval: 'month',
  intervalCount: 6,
  estateSeats: 1,
  priceEnv: ['STRIPE_PRICE_SEMIANNUAL_GREEN', 'STRIPE_PRICE_SEMI_ANNUAL_GREEN'],
};

function participantPriceEnvKeys(plan) {
  if (plan.mode !== 'subscription' || plan.addOn || planIdIsUrgent(plan)) return [];
  return plan.interval === 'year'
    ? [
        'STRIPE_PRICE_PARTICIPANT_ANNUAL',
        'STRIPE_PRICE_PARTICIPANT_ANNUAL_25',
        'STRIPE_PRICE_PARTICIPANT_25_ANNUAL',
        'STRIPE_PRICE_PARTICIPANT_SINGLE_ANNUAL',
        'STRIPE_PRICE_SINGLE_ANNUAL_PARTICIPANT',
      ]
    : [
        'STRIPE_PRICE_PARTICIPANT_MONTHLY',
        'STRIPE_PRICE_PARTICIPANT_MONTHLY_20',
        'STRIPE_PRICE_PARTICIPANT_20_MONTHLY',
        'STRIPE_PRICE_PARTICIPANT_SINGLE_MONTHLY',
        'STRIPE_PRICE_SINGLE_MONTHLY_PARTICIPANT',
      ];
}

function getConfiguredPrice(plan, participantDiscount = false) {
  const keys = [
    ...(participantDiscount ? participantPriceEnvKeys(plan) : []),
    ...(Array.isArray(plan.priceEnv) ? plan.priceEnv : [plan.priceEnv]),
  ];
  for (const key of keys) {
    if (process.env[key]) return { key, value: process.env[key].trim() };
  }
  return { key: keys[0], value: '' };
}

function getParticipantDiscount(plan) {
  if (plan.mode !== 'subscription' || plan.addOn || planIdIsUrgent(plan)) return null;

  const keys = plan.interval === 'year'
    ? [
        'STRIPE_PROMOTION_CODE_PARTICIPANT_ANNUAL',
        'STRIPE_PROMOTION_CODE_PARTICIPANT_ANNUAL_25',
        'STRIPE_PROMOTION_CODE_PARTICIPANT_25_ANNUAL',
        'STRIPE_PROMO_PARTICIPANT_ANNUAL',
        'STRIPE_PROMO_PARTICIPANT_ANNUAL_25',
        'STRIPE_PARTICIPANT_ANNUAL_PROMO_CODE',
        'STRIPE_PARTICIPANT_ANNUAL_DISCOUNT',
        'STRIPE_COUPON_PARTICIPANT_ANNUAL',
        'STRIPE_COUPON_PARTICIPANT_ANNUAL_25',
      ]
    : [
        'STRIPE_PROMOTION_CODE_PARTICIPANT_MONTHLY',
        'STRIPE_PROMOTION_CODE_PARTICIPANT_MONTHLY_20',
        'STRIPE_PROMOTION_CODE_PARTICIPANT_20_MONTHLY',
        'STRIPE_PROMO_PARTICIPANT_MONTHLY',
        'STRIPE_PROMO_PARTICIPANT_MONTHLY_20',
        'STRIPE_PARTICIPANT_MONTHLY_PROMO_CODE',
        'STRIPE_PARTICIPANT_MONTHLY_DISCOUNT',
        'STRIPE_COUPON_PARTICIPANT_MONTHLY',
        'STRIPE_COUPON_PARTICIPANT_MONTHLY_20',
      ];

  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return {
        key,
        type: key.includes('COUPON') ? 'coupon' : 'promotion_code',
        param: key.includes('COUPON') ? 'discounts[0][coupon]' : 'discounts[0][promotion_code]',
        value,
      };
    }
  }
  return null;
}

async function resolveParticipantDiscount(discount) {
  if (!discount) return null;
  if (discount.value.startsWith('price_')) return null;
  if (discount.type === 'coupon') return discount;
  if (discount.value.startsWith('promo_')) return discount;

  const lookup = await fetch('https://api.stripe.com/v1/promotion_codes?active=true&limit=1&code=' + encodeURIComponent(discount.value), {
    headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY },
  });
  const data = await lookup.json().catch(() => ({}));
  const promoId = data?.data?.[0]?.id;
  if (!lookup.ok || !promoId) return discount;
  return { ...discount, value: promoId, resolvedFromCode: true };
}

function getPartnerPilotDiscount() {
  const keys = [
    'STRIPE_COUPON_FUNERAL_HOME_PILOT',
    'STRIPE_COUPON_PARTNER_PILOT',
    'STRIPE_FUNERAL_HOME_PILOT_COUPON_ID',
    'STRIPE_PARTNER_PILOT_COUPON_ID',
    'STRIPE_PROMOTION_CODE_FUNERAL_HOME_PILOT',
    'STRIPE_PROMOTION_CODE_PARTNER_PILOT',
    'STRIPE_FUNERAL_HOME_PILOT_PROMOTION_CODE_ID',
    'STRIPE_PARTNER_PILOT_PROMOTION_CODE_ID',
  ];

  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (!value) continue;
    const isCoupon = key.includes('COUPON');
    return {
      key,
      type: isCoupon ? 'coupon' : 'promotion_code',
      param: isCoupon ? 'discounts[0][coupon]' : 'discounts[0][promotion_code]',
      value,
    };
  }
  return null;
}

async function resolvePartnerPilotDiscount(discount) {
  if (!discount) return null;
  if (discount.value.startsWith('price_')) return null;
  if (discount.type === 'coupon' || discount.value.startsWith('promo_')) return discount;

  const lookup = await fetch('https://api.stripe.com/v1/promotion_codes?active=true&limit=1&code=' + encodeURIComponent(discount.value), {
    headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY },
  });
  const data = await lookup.json().catch(() => ({}));
  const promoId = data?.data?.[0]?.id;
  if (!lookup.ok || !promoId) {
    return {
      ...discount,
      type: 'coupon',
      param: 'discounts[0][coupon]',
    };
  }
  return { ...discount, value: promoId, resolvedFromCode: true };
}

function planIdIsUrgent(plan) {
  return plan.label === PLANS.urgent.label;
}

function dollars(cents) {
  return '$' + (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

async function validateConfiguredPrice(priceId, plan, planId, envKey, options = {}) {
  if (!priceId) return null;
  if (!priceId.startsWith('price_')) {
    return `${envKey} must be a Stripe Price ID that starts with price_, not a product ID or payment link.`;
  }

  const stripeRes = await fetch('https://api.stripe.com/v1/prices/' + encodeURIComponent(priceId), {
    headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY },
  });
  const price = await stripeRes.json();

  if (!stripeRes.ok || price.error) {
    return price.error?.message || `Could not verify Stripe price for ${planId}. Check ${envKey}.`;
  }

  if (price.currency !== 'usd') {
    return `${plan.label} is configured with ${price.currency?.toUpperCase() || 'unknown currency'}, expected USD.`;
  }

  if (!options.allowDiscountAmount && price.unit_amount !== plan.amount) {
      return `${plan.label} is configured as ${dollars(price.unit_amount || 0)}, expected ${dollars(plan.amount)}. Check ${envKey}.`;
  }

  const priceInterval = price.recurring && price.recurring.interval;
  if (plan.interval && priceInterval !== plan.interval) {
    return `${plan.label} is configured as ${priceInterval || 'one-time'}, expected ${plan.interval}.`;
  }

  const intervalCount = (price.recurring && price.recurring.interval_count) || 1;
  if (plan.interval && intervalCount !== (plan.intervalCount || 1)) {
    return `${plan.label} is configured every ${intervalCount} ${priceInterval}, expected every ${plan.intervalCount || 1} ${plan.interval}.`;
  }

  if (!plan.interval && priceInterval) {
    return `${plan.label} is configured as a recurring ${priceInterval} price, expected one-time.`;
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { planId, userId, userEmail, workflowId, participantDiscount } = req.body || {};
  const plan = PLANS[planId];

  if (!plan) return res.status(400).json({ error: 'Unknown plan' });
  if (!userId) return res.status(400).json({ error: 'Please sign in before upgrading.' });
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe is not configured for this deployment.' });
  }

  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const { data: authData, error: authError } = token
      ? await authClient.auth.getUser(token)
      : { data: null, error: new Error('Missing session') };
    if (authError || !authData?.user?.id || authData.user.id !== userId) {
      return res.status(401).json({ error: 'Please sign in before upgrading.' });
    }

    const signedInEmail = String(authData.user.email || userEmail || '').toLowerCase();
    const adminBypass = isPassageAdmin(signedInEmail);
    let participantEligible = false;
    if (participantDiscount) {
      const email = signedInEmail;
      const [{ data: accessByUser }, { data: accessByEmail }, { data: participantRows }, { data: peopleRows }] = await Promise.all([
        admin.from('estate_access')
          .select('id,role,status')
          .eq('user_id', userId)
          .neq('status', 'revoked')
          .eq('role', 'participant')
          .limit(1),
        admin.from('estate_access')
          .select('id,role,status')
          .ilike('email', email)
          .neq('status', 'revoked')
          .eq('role', 'participant')
          .limit(1),
        admin.from('estate_participants')
          .select('id,role,linked_user_id,invite_status')
          .eq('linked_user_id', userId)
          .eq('role', 'participant')
          .limit(1),
        admin.from('people')
          .select('id,email,estate_role_label,participant_discount_offered')
          .ilike('email', email)
          .limit(5),
      ]);
      participantEligible = Boolean(
        adminBypass ||
        (accessByUser || []).length ||
        (accessByEmail || []).length ||
        (participantRows || []).length ||
        (peopleRows || []).some(p =>
          p.participant_discount_offered ||
          String(p.estate_role_label || '').toLowerCase() === 'participant'
        )
      );
      if (!participantEligible) {
        return res.status(403).json({ error: 'Participant pricing is only available after you are assigned as a participant on an estate.' });
      }
    }

    const body = new URLSearchParams({
      mode: plan.mode,
      success_url: plan.partnerPlan
        ? BASE + '/funeral-home/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}'
        : planId === 'urgent'
          ? BASE + '/urgent?checkout=success&session_id={CHECKOUT_SESSION_ID}'
          : BASE + '/?checkout=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: plan.partnerPlan
        ? BASE + '/funeral-home?checkout=cancelled'
        : planId === 'urgent' ? BASE + '/pricing?urgent=cancelled' : BASE + '/?checkout=cancelled',
      client_reference_id: userId,
      'metadata[userId]': userId,
      'metadata[planId]': planId,
      'metadata[path]': plan.partnerPlan ? 'partner' : planId === 'urgent' ? 'red' : 'green',
      'metadata[workflowId]': workflowId || '',
      'metadata[estateSeats]': String(plan.estateSeats || 1),
      'metadata[addOn]': plan.addOn ? 'true' : 'false',
      'metadata[participantDiscountRequested]': participantDiscount ? 'true' : 'false',
      'metadata[partnerPlan]': plan.partnerPlan ? 'true' : 'false',
      'line_items[0][quantity]': '1',
      submit_type: plan.mode === 'subscription' ? 'subscribe' : 'pay',
    });

    const configuredPrice = getConfiguredPrice(plan, participantEligible);
    const usingParticipantPrice = participantEligible && participantPriceEnvKeys(plan).includes(configuredPrice.key);
    const participantPromo = participantEligible && !usingParticipantPrice ? await resolveParticipantDiscount(getParticipantDiscount(plan)) : null;
    const partnerPilotPromo = planId === 'partner_pilot' ? await resolvePartnerPilotDiscount(getPartnerPilotDiscount()) : null;

    if (planId === 'partner_pilot' && !partnerPilotPromo) {
      return res.status(500).json({
        error: 'Funeral home pilot discount is not configured. Add a 100% off 3-month Stripe coupon or promotion code env var before checkout.',
      });
    }

    if (partnerPilotPromo) {
      body.set(partnerPilotPromo.param, partnerPilotPromo.value);
      body.set('metadata[partnerPilotDiscountApplied]', partnerPilotPromo.key);
    } else if (participantPromo) {
      body.set(participantPromo.param, participantPromo.value);
      body.set('metadata[participantDiscountApplied]', participantPromo.key);
    } else if (usingParticipantPrice) {
      body.set('metadata[participantDiscountApplied]', configuredPrice.key);
    } else {
      body.set('allow_promotion_codes', 'true');
    }

    if (plan.impact) body.set('metadata[impact]', plan.impact);

    if (userEmail) body.set('customer_email', userEmail);

    if (configuredPrice.value) {
      const priceError = await validateConfiguredPrice(configuredPrice.value, plan, planId, configuredPrice.key, { allowDiscountAmount: usingParticipantPrice });
      if (priceError) return res.status(500).json({ error: priceError });
      body.set('line_items[0][price]', configuredPrice.value);
    } else {
      body.set('line_items[0][price_data][currency]', 'usd');
      body.set('line_items[0][price_data][product_data][name]', plan.label);
      body.set('line_items[0][price_data][unit_amount]', String(plan.amount));
      if (plan.interval) {
        body.set('line_items[0][price_data][recurring][interval]', plan.interval);
        if (plan.intervalCount) {
          body.set('line_items[0][price_data][recurring][interval_count]', String(plan.intervalCount));
        }
      }
    }

    let stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    let session = await stripeRes.json();

    const promoFailed = (participantPromo || partnerPilotPromo) && !stripeRes.ok && /promotion code|coupon/i.test(session.error?.message || '');
    if (promoFailed) {
      body.delete('discounts[0][promotion_code]');
      body.delete('discounts[0][coupon]');
      body.delete('metadata[participantDiscountApplied]');
      body.delete('metadata[partnerPilotDiscountApplied]');
      if (partnerPilotPromo) {
        return res.status(500).json({
          error: `Funeral home pilot discount failed in Stripe. Check ${partnerPilotPromo.key}.`,
        });
      }
      body.set('metadata[participantDiscountFailed]', participantPromo.key);
      body.set('allow_promotion_codes', 'true');
      stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      session = await stripeRes.json();
    }

    if (!stripeRes.ok || session.error) {
      return res.status(500).json({ error: session.error?.message || 'Stripe checkout failed' });
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
