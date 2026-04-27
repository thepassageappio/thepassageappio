
// pages/api/checkout.js
// Stripe checkout using raw fetch — no npm package needed

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thepassageapp.io';

const PLANS = {
  annual:   { amount: 4900,  label: 'Passage Annual',   interval: 'year',  priceEnv: 'STRIPE_PRICE_ANNUAL' },
  monthly:  { amount: 999,   label: 'Passage Monthly',  interval: 'month', priceEnv: 'STRIPE_PRICE_MONTHLY' },
  lifetime: { amount: 24900, label: 'Passage Lifetime', interval: null,    priceEnv: 'STRIPE_PRICE_LIFETIME' },
};

async function stripePost(path, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not set');
  const res = await fetch('https://api.stripe.com/v1' + path, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  return res.json();
}

async function stripeGet(path) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not set');
  const res = await fetch('https://api.stripe.com/v1' + path, {
    headers: { 'Authorization': 'Bearer ' + key },
  });
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { planId, userId, userEmail } = req.body;
  if (!planId || !userId) return res.status(400).json({ error: 'Missing planId or userId' });

  const plan = PLANS[planId];
  if (!plan) return res.status(400).json({ error: 'Invalid plan' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ url: BASE_URL + '/?upgrade=pending&plan=' + planId, mock: true });
  }

  try {
    // Search for existing customer by email
    let customerId = null;
    if (userEmail) {
      const search = await stripeGet('/customers?email=' + encodeURIComponent(userEmail) + '&limit=1');
      if (search.data && search.data.length > 0) {
        customerId = search.data[0].id;
      }
    }

    // Create customer if not found
    if (!customerId) {
      const customer = await stripePost('/customers', {
        email: userEmail || '',
        'metadata[userId]': userId,
      });
      customerId = customer.id;
    }

    const priceId = process.env[plan.priceEnv];
    const sessionParams = {
      customer: customerId,
      success_url: BASE_URL + '/?upgraded=true&plan=' + planId,
      cancel_url: BASE_URL + '/?upgrade=cancelled',
      'metadata[userId]': userId,
      'metadata[planId]': planId,
    };

    if (plan.interval && priceId) {
      // Subscription with existing price
      sessionParams.mode = 'subscription';
      sessionParams['line_items[0][price]'] = priceId;
      sessionParams['line_items[0][quantity]'] = '1';
    } else if (plan.interval && !priceId) {
      // Subscription with dynamic price
      sessionParams.mode = 'subscription';
      sessionParams['line_items[0][price_data][currency]'] = 'usd';
      sessionParams['line_items[0][price_data][product_data][name]'] = plan.label;
      sessionParams['line_items[0][price_data][recurring][interval]'] = plan.interval;
      sessionParams['line_items[0][price_data][unit_amount]'] = String(plan.amount);
      sessionParams['line_items[0][quantity]'] = '1';
    } else {
      // One-time payment
      sessionParams.mode = 'payment';
      sessionParams['line_items[0][price_data][currency]'] = 'usd';
      sessionParams['line_items[0][price_data][product_data][name]'] = plan.label;
      sessionParams['line_items[0][price_data][unit_amount]'] = String(plan.amount);
      sessionParams['line_items[0][quantity]'] = '1';
    }

    const session = await stripePost('/checkout/sessions', sessionParams);

    if (session.error) {
      console.error('Stripe session error:', session.error);
      return res.status(500).json({ error: session.error.message });
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
