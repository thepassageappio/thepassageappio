const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

const PLANS = {
  monthly: {
    label: 'Passage Monthly',
    amount: 1200,
    mode: 'subscription',
    interval: 'month',
    priceEnv: 'STRIPE_PRICE_MONTHLY',
  },
  annual: {
    label: 'Passage Annual',
    amount: 7900,
    mode: 'subscription',
    interval: 'year',
    priceEnv: 'STRIPE_PRICE_ANNUAL',
  },
  lifetime: {
    label: 'Passage Lifetime',
    amount: 24900,
    mode: 'payment',
    priceEnv: 'STRIPE_PRICE_LIFETIME',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { planId, userId, userEmail } = req.body || {};
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
      'line_items[0][quantity]': '1',
      allow_promotion_codes: 'true',
      submit_type: plan.mode === 'subscription' ? 'subscribe' : 'pay',
    });

    if (userEmail) body.set('customer_email', userEmail);

    const configuredPrice = process.env[plan.priceEnv];
    if (configuredPrice) {
      body.set('line_items[0][price]', configuredPrice);
    } else {
      body.set('line_items[0][price_data][currency]', 'usd');
      body.set('line_items[0][price_data][product_data][name]', plan.label);
      body.set('line_items[0][price_data][unit_amount]', String(plan.amount));
      if (plan.interval) {
        body.set('line_items[0][price_data][recurring][interval]', plan.interval);
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
