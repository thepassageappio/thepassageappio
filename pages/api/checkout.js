const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

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

function getConfiguredPrice(plan) {
  const keys = Array.isArray(plan.priceEnv) ? plan.priceEnv : [plan.priceEnv];
  for (const key of keys) {
    if (process.env[key]) return { key, value: process.env[key].trim() };
  }
  return { key: keys[0], value: '' };
}

function getParticipantDiscount(plan) {
  if (plan.mode !== 'subscription' || plan.addOn || planIdIsUrgent(plan)) return null;

  const keys = plan.interval === 'year'
    ? ['STRIPE_PROMOTION_CODE_PARTICIPANT_ANNUAL', 'STRIPE_PROMO_PARTICIPANT_ANNUAL', 'STRIPE_COUPON_PARTICIPANT_ANNUAL']
    : ['STRIPE_PROMOTION_CODE_PARTICIPANT_MONTHLY', 'STRIPE_PROMO_PARTICIPANT_MONTHLY', 'STRIPE_COUPON_PARTICIPANT_MONTHLY'];

  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return {
        key,
        param: key.includes('COUPON') ? 'discounts[0][coupon]' : 'discounts[0][promotion_code]',
        value,
      };
    }
  }
  return null;
}

function planIdIsUrgent(plan) {
  return plan.label === PLANS.urgent.label;
}

function dollars(cents) {
  return '$' + (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

async function validateConfiguredPrice(priceId, plan, planId, envKey) {
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

  if (price.unit_amount !== plan.amount) {
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
    const body = new URLSearchParams({
      mode: plan.mode,
      success_url: BASE + '/?checkout=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: BASE + '/?checkout=cancelled',
      client_reference_id: userId,
      'metadata[userId]': userId,
      'metadata[planId]': planId,
      'metadata[path]': planId === 'urgent' ? 'red' : 'green',
      'metadata[workflowId]': workflowId || '',
      'metadata[estateSeats]': String(plan.estateSeats || 1),
      'metadata[addOn]': plan.addOn ? 'true' : 'false',
      'metadata[participantDiscountRequested]': participantDiscount ? 'true' : 'false',
      'line_items[0][quantity]': '1',
      submit_type: plan.mode === 'subscription' ? 'subscribe' : 'pay',
    });

    const participantPromo = participantDiscount ? getParticipantDiscount(plan) : null;
    if (participantPromo) {
      body.set(participantPromo.param, participantPromo.value);
      body.set('metadata[participantDiscountApplied]', participantPromo.key);
    } else {
      body.set('allow_promotion_codes', 'true');
    }

    if (plan.impact) body.set('metadata[impact]', plan.impact);

    if (userEmail) body.set('customer_email', userEmail);

    const configuredPrice = getConfiguredPrice(plan);
    if (configuredPrice.value) {
      const priceError = await validateConfiguredPrice(configuredPrice.value, plan, planId, configuredPrice.key);
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

    const promoFailed = participantPromo && !stripeRes.ok && /promotion code|coupon/i.test(session.error?.message || '');
    if (promoFailed) {
      body.delete('discounts[0][promotion_code]');
      body.delete('discounts[0][coupon]');
      body.delete('metadata[participantDiscountApplied]');
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
