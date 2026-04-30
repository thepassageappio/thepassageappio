import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyStripeSignature(raw, header, secret) {
  const parts = String(header || '').split(',');
  let timestamp = '';
  const signatures = [];
  for (const part of parts) {
    if (part.startsWith('t=')) timestamp = part.slice(2);
    if (part.startsWith('v1=')) signatures.push(part.slice(3));
  }
  if (!timestamp || signatures.length === 0) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(timestamp + '.' + raw.toString())
    .digest('hex');

  return signatures.some(signature => {
    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false;
    }
  });
}

async function updateUserPlan(userId, updates) {
  if (!userId) return;
  await sb.from('users').update({
    ...updates,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);
}

async function updateWorkflowAfterCheckout(metadata) {
  const workflowId = metadata && metadata.workflowId;
  if (!workflowId) return;
  const path = metadata.path === 'red' ? 'red' : 'green';
  await sb.from('workflows').update({
    path,
    status: path === 'red' ? 'active' : 'ready',
    updated_at: new Date().toISOString(),
  }).eq('id', workflowId);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Stripe webhook secret is not configured.' });
  }

  try {
    const raw = await getRawBody(req);
    const signature = req.headers['stripe-signature'] || '';
    const valid = verifyStripeSignature(raw, signature, process.env.STRIPE_WEBHOOK_SECRET);
    if (!valid) return res.status(400).json({ error: 'Bad signature' });

    const event = JSON.parse(raw.toString());
    const object = event.data && event.data.object ? event.data.object : {};

    if (event.type === 'checkout.session.completed') {
      const userId = object.metadata && object.metadata.userId;
      const planId = object.metadata && object.metadata.planId;
      await updateUserPlan(userId, {
        plan: planId || 'paid',
        plan_status: 'active',
        plan_activated_at: new Date().toISOString(),
        stripe_customer_id: object.customer || null,
        stripe_subscription_id: object.subscription || null,
      });
      await updateWorkflowAfterCheckout(object.metadata || {});
    }

    if (event.type === 'customer.subscription.deleted') {
      await sb.from('users').update({
        plan: 'free',
        plan_status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', object.id);
    }

    if (event.type === 'invoice.payment_succeeded' && object.subscription) {
      await sb.from('users').update({
        plan_status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', object.subscription);
    }

    if (event.type === 'invoice.payment_failed' && object.subscription) {
      await sb.from('users').update({
        plan_status: 'past_due',
        updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', object.subscription);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
