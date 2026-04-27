// pages/api/stripeWebhook.js
// Stripe webhook handler using raw fetch — no npm package needed

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyStripeSignature(rawBody, sig, secret) {
  // Parse timestamp and signatures from header
  const parts = sig.split(',');
  let timestamp = '';
  const signatures = [];
  for (const part of parts) {
    if (part.startsWith('t=')) timestamp = part.slice(2);
    if (part.startsWith('v1=')) signatures.push(part.slice(3));
  }
  if (!timestamp || signatures.length === 0) return null;

  // Check timestamp is within 5 minutes
  const tolerance = 300;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > tolerance) return null;

  // Compute expected signature
  const payload = timestamp + '.' + rawBody.toString('utf8');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  // Check against provided signatures
  const match = signatures.some((s) => crypto.timingSafeEqual(Buffer.from(s, 'hex'), Buffer.from(expected, 'hex')));
  if (!match) return null;

  // Parse the event JSON
  try {
    return JSON.parse(rawBody.toString('utf8'));
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // If no secret configured, just parse body (dev mode)
  let event;
  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ received: true, mock: true });
  }

  try {
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'] || '';
    event = verifyStripeSignature(rawBody, sig, webhookSecret);
    if (!event) {
      return res.status(400).json({ error: 'Invalid signature or expired timestamp' });
    }
  } catch (err) {
    console.error('Webhook body error:', err.message);
    return res.status(400).json({ error: 'Bad request' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata && session.metadata.userId;
        const planId = session.metadata && session.metadata.planId;
        if (!userId) break;

        await supabase.from('users').update({
          plan: planId || 'paid',
          plan_activated_at: new Date().toISOString(),
          stripe_customer_id: session.customer || null,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);

        if (session.subscription) {
          await supabase.from('stripe_subscriptions').upsert([{
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan: planId || 'paid',
            status: 'active',
            updated_at: new Date().toISOString(),
          }], { onConflict: 'stripe_subscription_id' });
        }

        console.log('Payment complete for user:', userId, 'plan:', planId);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        await supabase.from('stripe_subscriptions').update({
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabase.from('stripe_subscriptions').update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id);

        const { data: record } = await supabase.from('stripe_subscriptions')
          .select('user_id').eq('stripe_subscription_id', sub.id).single();
        if (record) {
          await supabase.from('users').update({ plan: 'free', updated_at: new Date().toISOString() }).eq('id', record.user_id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        console.warn('Payment failed:', event.data.object.customer);
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
