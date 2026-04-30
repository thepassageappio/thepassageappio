const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

const PLANS = {
  monthly: {
    label: 'Passage Monthly',
    amount: 999,
    mode: 'subscription',
    interval: 'month',
    priceEnv: ['STRIPE_PRICE_MONTHLY_GREEN', 'STRIPE_PRICE_MONTHLY'],
  },
  semiannual: {
    label: 'Passage Semi-Annual',
    amount: 4999,
    mode: 'subscription',
    interval: 'month',
    intervalCount: 6,
    priceEnv: ['STRIPE_PRICE_SEMIANNUAL_GREEN', 'STRIPE_PRICE_SEMI_ANNUAL_GREEN'],
  },
  annual: {
    label: 'Passage Annual',
    amount: 7999,
    mode: 'subscription',
    interval: 'year',
    priceEnv: ['STRIPE_PRICE_ANNUAL_GREEN', 'STRIPE_PRICE_ANNUAL'],
  },
  lifetime: {
    label: 'Passage Lifetime',
    amount: 29999,
    mode: 'payment',
    priceEnv: ['STRIPE_PRICE_LIFETIME_GREEN', 'STRIPE_PRICE_LIFETIME'],
  },
  urgent: {
    label: 'Passage Urgent Estate Plan',
    amount: 7999,
    mode: 'payment',
    priceEnv: 'STRIPE_PRICE_URGENT',
    impact: '20_donation_grief_support_or_memorial_trees',
  },
};

function getConfiguredPrice(plan) {
  const keys = Array.isArray(plan.priceEnv) ? plan.priceEnv : [plan.priceEnv];
  for (const key of keys) {
    if (process.env[key]) return process.env[key];
  }
  return '';
}

function dollars(cents) {
  return '$' + (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

async function validateConfiguredPrice(priceId, plan, planId) {
  if (!priceId) return null;

  const stripeRes = await fetch('https://api.stripe.com/v1/prices/' + encodeURIComponent(priceId), {
    headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY },
  });
  const price = await stripeRes.json();

  if (!stripeRes.ok || price.error) {
    return price.error?.message || 'Could not verify Stripe price for ' + planId + '.';
  }

  if (price.currency !== 'usd') {
    return `${plan.label} is configured with ${price.currency?.toUpperCase() || 'unknown currency'}, expected USD.`;
  }

  if (price.unit_amount !== plan.amount) {
    return `${plan.label} is configured as ${dollars(price.unit_amount || 0)}, expected ${dollars(plan.amount)}. Check the Vercel price ID for ${planId}.`;
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

  const { planId, userId, userEmail, workflowId } = req.body || {};
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
      'line_items[0][quantity]': '1',
      allow_promotion_codes: 'true',
      submit_type: plan.mode === 'subscription' ? 'subscribe' : 'pay',
    });

    if (plan.impact) body.set('metadata[impact]', plan.impact);

    if (userEmail) body.set('customer_email', userEmail);

    const configuredPrice = getConfiguredPrice(plan);
    if (configuredPrice) {
      const priceError = await validateConfiguredPrice(configuredPrice, plan, planId);
      if (priceError) return res.status(500).json({ error: priceError });
      body.set('line_items[0][price]', configuredPrice);
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

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const session = await stripeRes.json();

    if (!stripeRes.ok || session.error) {
      return res.status(500).json({ error: session.error?.message || 'Stripe checkout failed' });
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
