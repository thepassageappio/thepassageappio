import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { syncLeadToHubSpot } from '../../lib/hubspot';
import { normalizePartnerPlanId, partnerPlanFor } from '../../lib/partnerPlans';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../lib/notificationSafety';

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
    family_monthly: 5,
    family_annual: 5,
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
    family_monthly: 2499,
    family_annual: 19999,
    addon_monthly: 499,
    addon_annual: 3999,
    urgent: 7999,
    partner_pilot: 9900,
    partner_local: 24999,
    partner_group: 34999,
    partner_location_addon: 9900,
  };
  return amounts[planId] || fallback || 0;
}

function intervalForPlan(planId, metadata = {}) {
  if (planId === 'urgent' || metadata.addOn === 'once') return 'once';
  if (String(planId || '').includes('annual')) return 'year';
  return 'month';
}

function normalizedStripeStatus(status) {
  const value = String(status || '').toLowerCase();
  if (['active', 'trialing', 'past_due'].includes(value)) return value;
  if (['canceled', 'cancelled'].includes(value)) return 'cancelled';
  if (['unpaid', 'incomplete', 'incomplete_expired', 'paused'].includes(value)) return 'past_due';
  return 'active';
}

async function recordSubscriptionMirror(userId, session) {
  if (!userId || !session?.id) return;
  const metadata = session.metadata || {};
  const planId = metadata.planId || 'monthly';
  const isSubscription = Boolean(session.subscription);
  const now = new Date().toISOString();
  const amountCents = session.amount_total != null
    ? Number(session.amount_total || 0)
    : amountForPlan(planId, 0);
  const interval = isSubscription ? intervalForPlan(planId, metadata) : 'once';
  const status = normalizedStripeStatus(session.subscription_status || session.status || 'active');
  const common = {
    user_id: userId,
    plan: planId,
    status,
    amount_cents: amountCents,
    currency: session.currency || 'usd',
    interval,
    stripe_customer_id: session.customer || null,
    stripe_subscription_id: session.subscription || null,
    stripe_checkout_session_id: session.id || null,
    started_at: now,
    last_payment_date: now,
    last_payment_amount: amountCents,
    updated_at: now,
    metadata: {
      source: 'stripe_webhook',
      checkout_session_id: session.id || null,
      mode: session.mode || null,
      payment_status: session.payment_status || null,
      automatic_tax: session.automatic_tax || null,
      metadata,
    },
  };

  const lookupColumn = session.subscription ? 'stripe_subscription_id' : 'stripe_checkout_session_id';
  const lookupValue = session.subscription || session.id;
  const { data: existing } = await sb
    .from('subscriptions')
    .select('id')
    .eq(lookupColumn, lookupValue)
    .maybeSingle();
  if (existing?.id) {
    await sb.from('subscriptions').update(common).eq('id', existing.id);
  } else {
    await sb.from('subscriptions').insert([{ ...common, created_at: now }]);
  }

  if (session.subscription) {
    const stripeSubscriptionRow = {
      user_id: userId,
      stripe_customer_id: session.customer || null,
      stripe_subscription_id: session.subscription || null,
      plan: planId,
      status,
      updated_at: now,
    };
    const { data: existingStripeSub } = await sb
      .from('stripe_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', session.subscription)
      .maybeSingle();
    if (existingStripeSub?.id) {
      await sb.from('stripe_subscriptions').update(stripeSubscriptionRow).eq('id', existingStripeSub.id);
    } else {
      const { error } = await sb.from('stripe_subscriptions').insert([{ ...stripeSubscriptionRow, created_at: now }]);
      if (error && session.customer) {
        await sb.from('stripe_subscriptions').update(stripeSubscriptionRow).eq('stripe_customer_id', session.customer).then(() => {}, () => {});
      }
    }
  }
}

async function updateSubscriptionMirrorFromStripeObject(stripeObject, status, paymentPatch = {}) {
  const subscriptionId = stripeObject?.subscription || stripeObject?.id;
  if (!subscriptionId) return;
  const now = new Date().toISOString();
  const updates = {
    status: normalizedStripeStatus(status),
    updated_at: now,
    ...paymentPatch,
  };
  await sb.from('subscriptions').update(updates).eq('stripe_subscription_id', subscriptionId);
  await sb.from('stripe_subscriptions').update({
    status: updates.status,
    current_period_start: stripeObject.current_period_start ? new Date(stripeObject.current_period_start * 1000).toISOString() : undefined,
    current_period_end: stripeObject.current_period_end ? new Date(stripeObject.current_period_end * 1000).toISOString() : undefined,
    cancel_at_period_end: stripeObject.cancel_at_period_end,
    updated_at: now,
  }).eq('stripe_subscription_id', subscriptionId).then(() => {}, () => {});
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
    const { data: userRow } = await sb.from('users').select('estate_seats_addon,estate_seats_included').eq('id', userId).single();
    const nextAddonSeats = Number(userRow?.estate_seats_addon || 0) + addonSeats;
    const includedSeats = Number(userRow?.estate_seats_included || 0);
    await updateUserPlan(userId, {
      estate_seats_addon: nextAddonSeats,
      estate_seats_total: Math.max(1, includedSeats + nextAddonSeats),
      plan_status: 'active',
      stripe_customer_id: session.customer || null,
    });
    return;
  }

  const { data: userRow } = await sb.from('users').select('estate_seats_addon').eq('id', userId).single();
  const addonSeatsTotal = Number(userRow?.estate_seats_addon || 0);
  await updateUserPlan(userId, {
    plan: planId,
    plan_status: 'active',
    estate_seats_included: estateSeats,
    estate_seats_total: Math.max(1, estateSeats + addonSeatsTotal),
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

async function recordPartnerCheckout(session) {
  const metadata = session.metadata || {};
  if (metadata.partnerPlan !== 'true') return;
  const userId = metadata.userId || session.client_reference_id || null;
  if (!userId) return;
  const planId = normalizePartnerPlanId(metadata.planId);
  const plan = partnerPlanFor(planId);
  const { data: member } = await sb
    .from('organization_members')
    .select('organization_id,email')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (!member?.organization_id) return;

  const includedSlots = Number(metadata.includedLocationSlots || plan.includedLocationSlots || 1);
  const isLocationAddon = metadata.locationAddon === 'true';
  const organizationUpdate = {
    partner_plan: isLocationAddon ? undefined : plan.id,
    included_location_slots: isLocationAddon ? undefined : includedSlots,
    additional_location_fee_cents: Number(metadata.additionalLocationFeeCents || plan.additionalLocationFeeCents || 9900),
    active_case_limit: metadata.activeCaseLimit ? Number(metadata.activeCaseLimit) : plan.activeCaseLimit,
    stripe_subscription_id: session.subscription || null,
    updated_at: new Date().toISOString(),
  };
  Object.keys(organizationUpdate).forEach(key => organizationUpdate[key] === undefined && delete organizationUpdate[key]);
  await sb.from('organizations').update(organizationUpdate).eq('id', member.organization_id).then(() => {}, () => {});

  const partnerRow = {
    organization_id: member.organization_id,
    email: member.email || session.customer_email || '',
    contact_email: member.email || session.customer_email || '',
    plan: plan.id,
    monthly_fee_cents: Number(session.amount_total || plan.monthlyFeeCents || 0),
    included_location_slots: includedSlots,
    additional_location_fee_cents: Number(metadata.additionalLocationFeeCents || plan.additionalLocationFeeCents || 9900),
    active_case_limit: metadata.activeCaseLimit ? Number(metadata.activeCaseLimit) : plan.activeCaseLimit,
    stripe_customer_id: session.customer || null,
    stripe_subscription_id: session.subscription || null,
    subscribed_at: new Date().toISOString(),
    status: 'active',
    updated_at: new Date().toISOString(),
  };
  const { data: existing } = await sb.from('funeral_home_partners').select('id').eq('organization_id', member.organization_id).maybeSingle();
  const query = existing?.id
    ? sb.from('funeral_home_partners').update(partnerRow).eq('id', existing.id)
    : sb.from('funeral_home_partners').insert([partnerRow]);
  await query.then(() => {}, () => {});
}

async function updateWorkflowAfterCheckout(metadata) {
  const workflowId = metadata && metadata.workflowId;
  if (!workflowId) return;
  const path = metadata.path === 'red' ? 'red' : 'green';
  await sb.from('workflows').update({
    path,
    status: path === 'red' ? 'active' : 'ready',
    seat_status: 'active',
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

async function syncCheckoutToHubSpot(session) {
  const metadata = session.metadata || {};
  const planId = metadata.planId || 'paid';
  const path = metadata.path || (planId === 'urgent' ? 'red' : 'green');
  const email = session.customer_details?.email || session.customer_email || metadata.email || '';
  const name = session.customer_details?.name || metadata.name || email;
  const amount = Math.round(Number(session.amount_total || amountForPlan(planId, 0)) / 100);
  let workflowName = metadata.workflowId || 'Family record';
  if (metadata.workflowId) {
    const { data } = await sb.from('workflows').select('name,estate_name,deceased_name').eq('id', metadata.workflowId).maybeSingle();
    workflowName = data?.deceased_name || data?.estate_name || data?.name || workflowName;
  }
  await syncLeadToHubSpot({
    admin: sb,
    eventType: 'checkout_completed',
    source: 'stripe',
    sourceId: session.id,
    contact: {
      email,
      name,
      persona: path === 'red' ? 'red_path_family' : 'green_path_family',
      lifecycleStage: 'customer',
    },
    deal: {
      name: `${path === 'red' ? 'Urgent family record' : 'Planning subscription'}: ${workflowName}`,
      amount,
      persona: path === 'red' ? 'red_path_family' : 'green_path_family',
      dealstage: process.env.HUBSPOT_CLOSED_WON_DEALSTAGE || 'closedwon',
      description: `Stripe checkout completed. Plan: ${planId}. Stripe session: ${session.id}.`,
    },
    payload: { planId, path, workflowId: metadata.workflowId || null, stripeSessionId: session.id, amountTotal: session.amount_total || null },
  });
}

function stripeWebhookSecrets() {
  return [
    process.env.STRIPE_WEBHOOK_SECRET2,
    process.env.STRIPE_WEBHOOK_SECRET,
  ].map(value => String(value || '').trim()).filter(Boolean);
}

async function notifyVendorPaymentPaid(request, payment) {
  if (!process.env.RESEND_API_KEY) return;
  const vendorEmail = request.vendors?.contact_email;
  const coordinatorEmail = request.workflows?.coordinator_email;
  const recipients = Array.from(new Set([vendorEmail, coordinatorEmail].filter(Boolean)));
  if (!recipients.length) return;
  const subject = `Vendor service paid: ${request.task_title || 'Passage request'}`;
  const route = routeEmailRecipients(recipients);
  if (!route.actual.length) {
    await Promise.all(recipients.map((recipient) => insertNotificationLog(sb, {
      workflow_id: request.workflow_id,
      task_id: request.task_id || null,
      channel: 'email',
      recipient_email: recipient,
      recipient_name: recipient,
      subject,
      provider: 'resend',
      provider_id: null,
      status: 'blocked',
      error_message: 'QA notification mode had no override email configured.',
      source: 'vendor_payment_confirmed',
      ...qaAuditFields(route),
    })));
    return;
  }
  const html = `
    <div style="font-family:Georgia,serif;background:#f6f3ee;padding:24px">
      <div style="max-width:580px;margin:auto;background:#fffdf9;border:1px solid #e4ddd4;border-radius:18px;padding:26px;color:#1a1916">
        <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#6b8f71;font-weight:900">Passage vendor payment</div>
        <h1 style="font-weight:400;font-size:25px;line-height:1.22;margin:10px 0">Payment is confirmed.</h1>
        <p style="color:#6a6560;line-height:1.7;margin:0 0 12px">${request.vendors?.business_name || 'The vendor'} has a paid service connected to ${request.workflows?.deceased_name || request.workflows?.estate_name || request.workflows?.name || 'the family record'}.</p>
        <p style="color:#1a1916;line-height:1.7;margin:0"><strong>Gross:</strong> $${Number(payment.gross_amount || 0).toFixed(2)}<br/><strong>Passage fee:</strong> $${Number(payment.application_fee_amount || 0).toFixed(2)}<br/><strong>Vendor balance:</strong> $${Number(payment.vendor_net_amount || 0).toFixed(2)}</p>
      </div>
    </div>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>',
      to: route.actual,
      subject,
      html,
    }),
  }).catch(() => null);
  const json = response ? await response.json().catch(() => ({})) : {};
  await Promise.all(recipients.map((recipient) => insertNotificationLog(sb, {
    workflow_id: request.workflow_id,
    task_id: request.task_id || null,
    channel: 'email',
    recipient_email: recipient,
    recipient_name: recipient,
    subject,
    provider: 'resend',
    provider_id: response?.ok ? json.id || null : null,
    status: response?.ok ? 'sent' : 'failed',
    sent_at: response?.ok ? new Date().toISOString() : null,
    error_message: response?.ok ? null : (json?.message || json?.error || 'Vendor payment notification failed'),
    source: 'vendor_payment_confirmed',
    ...qaAuditFields(route),
  })));
}

async function recordVendorPaymentCheckout(session) {
  const metadata = session.metadata || {};
  const requestId = metadata.vendorRequestId;
  if (!requestId) return;

  const { data: request } = await sb
    .from('vendor_requests')
    .select('id,workflow_id,task_id,task_title,status,estimated_value,final_value,platform_fee_amount,passage_share_amount,funeral_home_share_amount,payout_amount,vendor_id,vendors(business_name,contact_email),workflows(name,estate_name,deceased_name,coordinator_email)')
    .eq('id', requestId)
    .maybeSingle();
  if (!request) return;

  const grossAmount = Number(session.amount_total || 0) / 100;
  const applicationFeeAmount = Number(request.platform_fee_amount || 0);
  const vendorNetAmount = Math.max(grossAmount - applicationFeeAmount, 0);
  const now = new Date().toISOString();
  const paymentRow = {
    vendor_request_id: request.id,
    vendor_id: request.vendor_id || null,
    workflow_id: request.workflow_id,
    task_id: request.task_id || null,
    gross_amount: grossAmount,
    application_fee_amount: applicationFeeAmount,
    vendor_net_amount: vendorNetAmount,
    currency: session.currency || 'usd',
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent || null,
    stripe_transfer_destination: metadata.stripeConnectedAccountId || null,
    status: 'paid',
    paid_at: now,
    updated_at: now,
  };

  const { data: existing } = await sb
    .from('vendor_payments')
    .select('id')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle();
  if (existing?.id) {
    await sb.from('vendor_payments').update(paymentRow).eq('id', existing.id);
  } else {
    await sb.from('vendor_payments').insert([{ ...paymentRow, created_at: now }]);
  }

  await sb.from('vendor_requests').update({
    status: 'paid',
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent || null,
    payment_collection_status: 'paid',
    paid_at: now,
    in_progress_at: null,
    payout_status: 'pending',
    payout_amount: vendorNetAmount,
    gross_amount: grossAmount,
    passage_fee_amount: applicationFeeAmount,
    vendor_net_amount: vendorNetAmount,
    updated_at: now,
  }).eq('id', request.id);

  await sb.from('estate_events').insert([{
    estate_id: request.workflow_id,
    event_type: 'vendor_payment_confirmed',
    title: `${request.vendors?.business_name || 'Vendor'} payment confirmed`,
    description: `Payment for ${request.task_title || 'vendor service'} was collected through Passage. Gross $${grossAmount.toFixed(2)}; Passage fee $${applicationFeeAmount.toFixed(2)}; vendor balance $${vendorNetAmount.toFixed(2)}.`,
    actor: 'Passage',
  }]);

  await notifyVendorPaymentPaid(request, paymentRow);
}

async function recordVendorOrderCheckout(session) {
  const metadata = session.metadata || {};
  const orderId = metadata.vendorOrderId;
  if (!orderId) return;

  const { data: order } = await sb
    .from('vendor_orders')
    .select('id,vendor_request_id,vendor_id,workflow_id,task_id,total_amount,platform_fee,net_vendor_amount,description,vendors(business_name,contact_email),workflows(name,estate_name,deceased_name,coordinator_email)')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return;

  const grossAmount = Number(session.amount_total || 0) / 100;
  const applicationFeeAmount = Number(order.platform_fee || 0);
  const vendorNetAmount = Number(order.net_vendor_amount || Math.max(grossAmount - applicationFeeAmount, 0));
  const now = new Date().toISOString();

  await sb.from('vendor_orders').update({
    payment_status: 'paid',
    payout_status: 'automatic_transfer',
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent || null,
    paid_at: now,
    updated_at: now,
  }).eq('id', order.id);

  if (order.vendor_request_id) {
    const paymentRow = {
      vendor_request_id: order.vendor_request_id,
      vendor_id: order.vendor_id || null,
      workflow_id: order.workflow_id,
      task_id: order.task_id || null,
      gross_amount: grossAmount,
      application_fee_amount: applicationFeeAmount,
      vendor_net_amount: vendorNetAmount,
      currency: session.currency || 'usd',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent || null,
      stripe_transfer_destination: metadata.stripeConnectedAccountId || null,
      status: 'paid',
      paid_at: now,
      updated_at: now,
    };
    const { data: existing } = await sb
      .from('vendor_payments')
      .select('id')
      .eq('stripe_checkout_session_id', session.id)
      .maybeSingle();
    if (existing?.id) {
      await sb.from('vendor_payments').update(paymentRow).eq('id', existing.id);
    } else {
      await sb.from('vendor_payments').insert([{ ...paymentRow, created_at: now }]);
    }

    await sb.from('vendor_requests').update({
      status: 'paid',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent || null,
      payment_collection_status: 'paid',
      paid_at: now,
      payout_status: 'pending',
      payout_amount: vendorNetAmount,
      gross_amount: grossAmount,
      passage_fee_amount: applicationFeeAmount,
      vendor_net_amount: vendorNetAmount,
      updated_at: now,
    }).eq('id', order.vendor_request_id);
  }

  await sb.from('estate_events').insert([{
    estate_id: order.workflow_id,
    event_type: 'vendor_payment_confirmed',
    title: `${order.vendors?.business_name || 'Vendor'} payment confirmed`,
    description: `Payment was collected through Passage. Gross $${grossAmount.toFixed(2)}; Passage fee $${applicationFeeAmount.toFixed(2)}; vendor balance $${vendorNetAmount.toFixed(2)}.`,
    actor: 'Passage',
  }]);

  await notifyVendorPaymentPaid({
    id: order.vendor_request_id,
    workflow_id: order.workflow_id,
    task_id: order.task_id,
    task_title: order.description || 'vendor service',
    vendors: order.vendors,
    workflows: order.workflows,
  }, {
    gross_amount: grossAmount,
    application_fee_amount: applicationFeeAmount,
    vendor_net_amount: vendorNetAmount,
  });
}

async function markVendorCheckoutExpired(session) {
  const requestId = session?.metadata?.vendorRequestId || session?.client_reference_id;
  const orderId = session?.metadata?.vendorOrderId;
  if (!requestId && !orderId) return;
  const now = new Date().toISOString();
  if (orderId) {
    await sb.from('vendor_orders').update({
      payment_status: 'cancelled',
      updated_at: now,
    }).eq('id', orderId).eq('payment_status', 'checkout_created');
  }
  if (!requestId) return;
  await sb.from('vendor_requests').update({
    status: 'quoted',
    payment_collection_status: 'cancelled',
    updated_at: now,
  }).eq('id', requestId).eq('payment_collection_status', 'checkout_created');
  await sb.from('vendor_payments').update({
    status: 'cancelled',
    updated_at: now,
  }).eq('stripe_checkout_session_id', session.id);
}

async function markVendorPaymentFailed(paymentIntent) {
  const requestId = paymentIntent?.metadata?.vendorRequestId;
  const orderId = paymentIntent?.metadata?.vendorOrderId;
  if (!requestId && !orderId) return;
  const now = new Date().toISOString();
  const message = paymentIntent?.last_payment_error?.message || 'Stripe payment failed.';
  if (orderId) {
    await sb.from('vendor_orders').update({
      payment_status: 'failed',
      stripe_payment_intent_id: paymentIntent.id || null,
      metadata: {
        failure_reason: message,
      },
      updated_at: now,
    }).eq('id', orderId);
  }
  if (!requestId) return;
  await sb.from('vendor_requests').update({
    status: 'quoted',
    payment_collection_status: 'failed',
    updated_at: now,
  }).eq('id', requestId);
  await sb.from('vendor_payments').update({
    status: 'failed',
    failure_reason: message,
    stripe_payment_intent_id: paymentIntent.id || null,
    updated_at: now,
  }).eq('vendor_request_id', requestId);
}

async function recordVendorConnectAccount(account) {
  if (!account?.id) return;
  const chargesEnabled = !!account.charges_enabled;
  const payoutsEnabled = !!account.payouts_enabled;
  const detailsSubmitted = !!account.details_submitted;
  const status = payoutsEnabled
    ? 'payouts_enabled'
    : chargesEnabled
      ? 'charges_enabled'
      : detailsSubmitted
        ? 'onboarding'
        : 'restricted';
  await sb.from('vendors').update({
    stripe_account_id: account.id,
    stripe_connect_account_id: account.id,
    stripe_connect_status: status,
    stripe_charges_enabled: chargesEnabled,
    stripe_payouts_enabled: payoutsEnabled,
    stripe_details_submitted: detailsSubmitted,
    stripe_connect_last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).or(`stripe_connect_account_id.eq.${account.id},stripe_account_id.eq.${account.id}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const webhookSecrets = stripeWebhookSecrets();
  if (!webhookSecrets.length) {
    return res.status(500).json({ error: 'Stripe webhook secret is not configured.' });
  }

  try {
    const raw = await getRawBody(req);
    const signature = req.headers['stripe-signature'] || '';
    const valid = webhookSecrets.some(secret => verifyStripeSignature(raw, signature, secret));
    if (!valid) return res.status(400).json({ error: 'Bad signature' });

    const event = JSON.parse(raw.toString());
    const object = event.data && event.data.object ? event.data.object : {};

    if (event.type === 'checkout.session.completed') {
      if (object.metadata?.kind === 'vendor_order') {
        await recordVendorOrderCheckout(object);
        return res.status(200).json({ received: true });
      }
      if (object.metadata?.kind === 'vendor_request') {
        await recordVendorPaymentCheckout(object);
        return res.status(200).json({ received: true });
      }
      const userId = object.metadata && object.metadata.userId;
      const planId = object.metadata && object.metadata.planId;
      await recordSubscriptionMirror(userId, object);
      await recordEntitlement(userId, object);
      await recordPartnerCheckout(object);
      await updateWorkflowAfterCheckout(object.metadata || {});
      await recordImpactCommitment(userId, object);
      await syncCheckoutToHubSpot(object);
    }

    if (event.type === 'checkout.session.expired' && ['vendor_request', 'vendor_order'].includes(object.metadata?.kind)) {
      await markVendorCheckoutExpired(object);
    }

    if (event.type === 'payment_intent.payment_failed' && ['vendor_request', 'vendor_order'].includes(object.metadata?.kind)) {
      await markVendorPaymentFailed(object);
    }

    if (event.type === 'account.updated') {
      await recordVendorConnectAccount(object);
    }

    if (event.type === 'customer.subscription.deleted') {
      await updateSubscriptionMirrorFromStripeObject(object, 'cancelled', {
        cancelled_at: new Date().toISOString(),
      });
      await sb.from('users').update({
        plan: 'free',
        plan_status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', object.id);
    }

    if (event.type === 'invoice.payment_succeeded' && object.subscription) {
      await updateSubscriptionMirrorFromStripeObject(object, 'active', {
        last_payment_date: new Date().toISOString(),
        last_payment_amount: object.amount_paid || object.total || null,
        failed_payment_count: 0,
      });
      await sb.from('users').update({
        plan_status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', object.subscription);
    }

    if (event.type === 'invoice.payment_failed' && object.subscription) {
      await updateSubscriptionMirrorFromStripeObject(object, 'past_due', {
        failed_payment_count: 1,
        last_failed_payment_at: new Date().toISOString(),
      });
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
