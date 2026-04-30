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
  const { error } = await sb.from('users').update({
    ...updates,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);
  if (error) throw error;
}

function seatsForPlan(planId) {
  const seats = {
    single_monthly: 1,
    single_annual: 1,
    single_lifetime: 1,
    monthly: 1,
    annual: 1,
    lifetime: 1,
    semiannual: 1,
    couple_monthly: 2,
    couple_annual: 2,
    couple_lifetime: 2,
    family_monthly: 5,
    family_annual: 5,
    family_lifetime: 5,
  };
  return seats[planId] || 1;
}

function amountForPlan(planId, fallback) {
  const amounts = {
    single_monthly: 999,
    single_annual: 7999,
    single_lifetime: 29999,
    monthly: 999,
    annual: 7999,
    lifetime: 29999,
    semiannual: 4999,
    couple_monthly: 1499,
    couple_annual: 11999,
    couple_lifetime: 44999,
    family_monthly: 2499,
    family_annual: 19999,
    family_lifetime: 79999,
    addon_monthly: 499,
    addon_annual: 3999,
    urgent: 7999,
  };
  return amounts[planId] || fallback || 0;
}

function isAddon(planId, metadata) {
  return planId === 'addon_monthly' || planId === 'addon_annual' || metadata?.addOn === 'true';
}

async function recordEntitlement(userId, session) {
  if (!userId) return;
  const metadata = session.metadata || {};
  const planId = metadata.planId || 'paid';
  const addon = isAddon(planId, metadata);
  const estateSeats = addon ? 0 : Number(metadata.estateSeats || seatsForPlan(planId));
  const addonSeats = addon ? Number(metadata.estateSeats || 1) : 0;

  const entitlement = {
    user_id: userId,
    plan_id: planId,
    source: 'stripe',
    stripe_customer_id: session.customer || null,
    stripe_subscription_id: session.subscription || null,
    stripe_session_id: session.id || null,
    estate_seats: estateSeats,
    addon_seats: addonSeats,
    status: 'active',
    updated_at: new Date().toISOString(),
  };

  const lookupColumn = session.subscription ? 'stripe_subscription_id' : 'stripe_session_id';
  const lookupValue = session.subscription || session.id;
  const { data: existing } = await sb
    .from('account_entitlements')
    .select('id')
    .eq(lookupColumn, lookupValue)
    .maybeSingle();

  if (existing?.id) {
    await sb.from('account_entitlements').update(entitlement).eq('id', existing.id);
  } else {
    await sb.from('account_entitlements').insert([{
      ...entitlement,
      created_at: new Date().toISOString(),
    }]);
  }

  if (addon) {
    const { data: userRow } = await sb.from('users').select('estate_seats_addon').eq('id', userId).single();
    await updateUserPlan(userId, {
      estate_seats_addon: (userRow?.estate_seats_addon || 0) + addonSeats,
      plan_status: 'active',
      stripe_customer_id: session.customer || null,
    });
    return;
  }

  await updateUserPlan(userId, {
    plan: planId,
    plan_status: 'active',
    estate_seats_included: estateSeats,
    plan_activated_at: new Date().toISOString(),
    stripe_customer_id: session.customer || null,
    stripe_subscription_id: session.subscription || null,
  });
}

async function recordImpactCommitment(userId, session) {
  const metadata = session.metadata || {};
  const planId = metadata.planId;
  if (planId !== 'urgent') return;
  const sourceAmount = amountForPlan(planId, session.amount_total || 7999);
  const pledgeAmount = Math.round(sourceAmount * 0.15);
  const workflowId = metadata.workflowId || null;
  let honoreeName = null;
  if (workflowId) {
    const { data } = await sb.from('workflows').select('deceased_name,name').eq('id', workflowId).single();
    honoreeName = data?.deceased_name || data?.name || null;
  }
  await sb.from('impact_commitments').insert([{
    workflow_id: workflowId,
    user_id: userId || null,
    source_plan_id: planId,
    source_amount_cents: sourceAmount,
    pledge_percent: 15,
    pledge_amount_cents: pledgeAmount,
    honoree_name: honoreeName,
    charity_category: 'grief_support',
    status: 'pledged',
  }]);
}

async function updateWorkflowAfterCheckout(metadata) {
  const workflowId = metadata && metadata.workflowId;
  if (!workflowId) return;
  const path = metadata.path === 'red' ? 'red' : 'green';
  await sb.from('workflows').update({
    path,
    status: path === 'red' ? 'active' : 'ready',
    seat_status: 'active',
    setup_stage: path === 'red' ? 'active' : 'ready',
    activation_status: path === 'red' ? 'activated' : 'ready',
    entitlement_source: metadata.planId || null,
    updated_at: new Date().toISOString(),
  }).eq('id', workflowId);

  await sb.from('estate_events').insert([{
    estate_id: workflowId,
    event_type: 'checkout_completed',
    title: path === 'red' ? 'Urgent estate plan activated' : 'Planning estate unlocked',
    description: metadata.planId ? `Plan: ${metadata.planId}` : null,
    actor: 'Passage',
  }]);
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
      await recordEntitlement(userId, object);
      await updateWorkflowAfterCheckout(object.metadata || {});
      await recordImpactCommitment(userId, object);
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
