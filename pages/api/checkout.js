import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  annual: {
    price: process.env.STRIPE_PRICE_ANNUAL || 'price_annual',
    amount: 4900,
    label: 'Passage Annual',
    interval: 'year',
  },
  monthly: {
    price: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly',
    amount: 999,
    label: 'Passage Monthly',
    interval: 'month',
  },
  lifetime: {
    price: process.env.STRIPE_PRICE_LIFETIME || 'price_lifetime',
    amount: 24900,
    label: 'Passage Lifetime',
    interval: null,
  },
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thepassageapp.io';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { planId, userId, userEmail } = req.body;
  if (!planId || !userId) return res.status(400).json({ error: 'Missing planId or userId' });

  const plan = PLANS[planId];
  if (!plan) return res.status(400).json({ error: 'Invalid plan' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ url: BASE_URL + '/?upgrade=pending', mock: true });
  }

  try {
    // Get or create Stripe customer
    let customerId;
    const { data: existing } = await supabase.from('users')
      .select('stripe_customer_id').eq('id', userId).single();

    if (existing && existing.stripe_customer_id) {
      customerId = existing.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: userEmail || undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId);
    }

    const sessionConfig = {
      customer: customerId,
      success_url: BASE_URL + '/?upgraded=true&plan=' + planId,
      cancel_url: BASE_URL + '/?upgrade=cancelled',
      metadata: { userId, planId },
    };

    if (plan.interval) {
      sessionConfig.mode = 'subscription';
      sessionConfig.line_items = [{ price: plan.price, quantity: 1 }];
    } else {
      sessionConfig.mode = 'payment';
      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: { name: plan.label },
          unit_amount: plan.amount,
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
