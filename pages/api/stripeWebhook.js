import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ received: true, mock: true });
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
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
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        await supabase.from('stripe_subscriptions')
          .update({
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabase.from('stripe_subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id);

        // Find user and downgrade
        const { data: record } = await supabase.from('stripe_subscriptions')
          .select('user_id').eq('stripe_subscription_id', sub.id).single();
        if (record) {
          await supabase.from('users').update({ plan: 'free' }).eq('id', record.user_id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.warn('Payment failed for customer:', invoice.customer);
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
