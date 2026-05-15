import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';
import { calculateVendorEconomics } from '../../../lib/vendorEconomics';
import { recordTaskCommunicationEvent } from '../../../lib/communicationEvents';
import { canonicalVendorStatus } from '../../../lib/vendorLifecycle';
import { transferGroupForVendorOrder } from '../../../lib/stripeFinancialSpine';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

async function userCanAccessWorkflow(user, workflow) {
  if (!user?.email || !workflow) return false;
  const email = user.email.toLowerCase();
  if (workflow.user_id === user.id) return true;
  if (workflow.coordinator_email && workflow.coordinator_email.toLowerCase() === email) return true;
  const [{ data: access }, { data: member }] = await Promise.all([
    admin.from('estate_access').select('id').eq('workflow_id', workflow.id).ilike('email', email).neq('status', 'revoked').limit(1),
    workflow.organization_id ? admin.from('organization_members').select('id').eq('organization_id', workflow.organization_id).ilike('email', email).eq('status', 'active').limit(1) : Promise.resolve({ data: [] }),
  ]);
  return !!access?.length || !!member?.length;
}

function dollarsToCents(value) {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe is not configured for this deployment.' });

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok || !auth.user) return res.status(auth.status || 401).json({ error: auth.error || 'Please sign in first.' });

  const requestId = String(req.body?.requestId || '');
  if (!isUuid(requestId)) return res.status(400).json({ error: 'Choose a vendor quote.' });

  const { data: request, error } = await admin
    .from('vendor_requests')
    .select('id,workflow_id,task_id,task_title,status,estimated_value,final_value,vendor_note,marketplace_fee_percent,funeral_home_rev_share_percent,payment_collection_status,organization_id,service_date,service_start_at,service_location,service_notes,vendors(id,business_name,category,contact_email,stripe_account_id,stripe_connect_account_id,stripe_charges_enabled,stripe_payouts_enabled),workflows(id,user_id,coordinator_email,coordinator_name,organization_id,deceased_name,estate_name,name)')
    .eq('id', requestId)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!request) return res.status(404).json({ error: 'Vendor quote not found.' });

  const allowed = await userCanAccessWorkflow(auth.user, request.workflows);
  if (!allowed) return res.status(403).json({ error: 'You do not have access to this family record.' });
  const currentStatus = canonicalVendorStatus(request.status);
  if (!['quoted', 'family_accepted', 'payment_pending'].includes(currentStatus)) {
    return res.status(409).json({ error: 'A vendor quote must be ready before payment.' });
  }

  const vendor = request.vendors;
  const destination = vendor?.stripe_account_id || vendor?.stripe_connect_account_id;
  if (!destination || vendor?.stripe_charges_enabled === false || vendor?.stripe_payouts_enabled === false) {
    return res.status(409).json({ error: 'This vendor is not payment-ready yet. Passage can still track the quote, but Stripe Connect onboarding must be complete before collecting payment.' });
  }

  const grossDollars = Number(request.final_value || request.estimated_value || 0);
  const grossCents = dollarsToCents(grossDollars);
  if (grossCents < 50) return res.status(400).json({ error: 'The vendor quote needs a valid amount before payment.' });

  const economics = calculateVendorEconomics({
    value: grossDollars,
    marketplaceFeePercent: request.marketplace_fee_percent,
    funeralHomeSharePercent: request.funeral_home_rev_share_percent || 0,
    hasFuneralHome: !!request.organization_id,
  });
  const applicationFeeCents = Math.min(grossCents, dollarsToCents(economics.platformFeeAmount));
  const vendorNetCents = Math.max(grossCents - applicationFeeCents, 0);
  const familyName = request.workflows?.deceased_name || request.workflows?.estate_name || request.workflows?.name || 'Family record';
  const taskTitle = request.task_title || 'Vendor service';
  const now = new Date().toISOString();
  const { data: order, error: orderError } = await admin.from('vendor_orders').insert([{
    vendor_request_id: request.id,
    vendor_id: vendor?.id || null,
    workflow_id: request.workflow_id,
    task_id: request.task_id || null,
    total_amount: grossCents / 100,
    platform_fee: applicationFeeCents / 100,
    platform_fee_percent: Number(request.marketplace_fee_percent ?? 12),
    net_vendor_amount: Math.round(vendorNetCents) / 100,
    payment_status: 'checkout_created',
    payout_status: 'automatic_transfer',
    stripe_account_id: destination,
    description: `${vendor?.business_name || 'Vendor'} - ${taskTitle}`,
    metadata: {
      source: 'vendor_requests_checkout',
      serviceDate: request.service_date || null,
      serviceStartAt: request.service_start_at || null,
      serviceLocation: request.service_location || null,
    },
    created_by: auth.user.id,
    created_at: now,
    updated_at: now,
  }]).select('id').single();
  if (orderError) return res.status(500).json({ error: orderError.message });

  const transferGroup = transferGroupForVendorOrder(order.id);
  await admin.from('vendor_orders').update({ stripe_transfer_group: transferGroup }).eq('id', order.id);

  const body = new URLSearchParams({
    mode: 'payment',
    'automatic_tax[enabled]': 'true',
    billing_address_collection: 'required',
    customer_creation: 'always',
    success_url: `${BASE}/estate?vendor_payment=success&request=${encodeURIComponent(request.id)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE}/estate?vendor_payment=cancelled&request=${encodeURIComponent(request.id)}`,
    client_reference_id: request.id,
    customer_email: auth.user.email || request.workflows?.coordinator_email || '',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(grossCents),
    'line_items[0][price_data][tax_behavior]': 'exclusive',
    'line_items[0][price_data][product_data][name]': `${vendor?.business_name || 'Vendor'} - ${taskTitle}`,
    'line_items[0][price_data][product_data][description]': `Passage coordinated service for ${familyName}.`,
    'payment_intent_data[application_fee_amount]': String(applicationFeeCents),
    'payment_intent_data[transfer_data][destination]': destination,
    'payment_intent_data[transfer_group]': transferGroup,
    'payment_intent_data[metadata][kind]': 'vendor_order',
    'payment_intent_data[metadata][vendorOrderId]': order.id,
    'payment_intent_data[metadata][vendorRequestId]': request.id,
    'payment_intent_data[metadata][vendorId]': vendor?.id || '',
    'payment_intent_data[metadata][workflowId]': request.workflow_id,
    'payment_intent_data[metadata][taskId]': request.task_id || '',
    'payment_intent_data[metadata][stripeConnectedAccountId]': destination,
    'metadata[kind]': 'vendor_order',
    'metadata[vendorOrderId]': order.id,
    'metadata[vendorRequestId]': request.id,
    'metadata[vendorId]': vendor?.id || '',
    'metadata[workflowId]': request.workflow_id,
    'metadata[taskId]': request.task_id || '',
    'metadata[stripeConnectedAccountId]': destination,
  });

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  const session = await stripeRes.json().catch(() => ({}));
  if (!stripeRes.ok || session.error) {
    return res.status(500).json({ error: session.error?.message || 'Could not create vendor payment checkout.' });
  }

  await admin.from('vendor_orders').update({
    stripe_checkout_session_id: session.id,
    updated_at: now,
  }).eq('id', order.id);

  await admin.from('vendor_requests').update({
    stripe_checkout_session_id: session.id,
    stripe_connected_account_id: destination,
    quote_approved_at: now,
    family_accepted_at: now,
    payment_url_created_at: now,
    status: 'payment_pending',
    payment_collection_status: 'checkout_created',
    gross_amount: grossCents / 100,
    passage_fee_percent: Number(request.marketplace_fee_percent ?? 12),
    passage_fee_amount: applicationFeeCents / 100,
    platform_fee_amount: economics.platformFeeAmount,
    funeral_home_share_amount: economics.funeralHomeShareAmount,
    passage_share_amount: economics.passageShareAmount,
    vendor_net_amount: Math.round(vendorNetCents) / 100,
    payout_amount: Math.round(vendorNetCents) / 100,
    payout_status: 'pending',
    updated_at: now,
  }).eq('id', request.id);

  await admin.from('vendor_payments').insert([{
    vendor_request_id: request.id,
    vendor_id: vendor?.id || null,
    workflow_id: request.workflow_id,
    task_id: request.task_id || null,
    gross_amount: grossCents / 100,
    application_fee_amount: applicationFeeCents / 100,
    vendor_net_amount: vendorNetCents / 100,
    stripe_checkout_session_id: session.id,
    stripe_transfer_destination: destination,
    status: 'checkout_created',
  }]).then(() => {}, () => {});

  await recordTaskCommunicationEvent({
    verb: 'update',
    workflowId: request.workflow_id,
    taskId: request.task_id,
    taskTitle,
    status: 'waiting',
    actor: auth.user.email || 'Family coordinator',
    actorRole: request.workflows?.organization_id ? 'funeral_home' : 'family_coordinator',
    channel: 'vendor_payment',
    recipient: vendor?.business_name || 'Vendor',
    recipientRole: 'vendor',
    detail: `Vendor quote approved. Payment checkout was created for $${(grossCents / 100).toFixed(2)}; Passage fee is $${(applicationFeeCents / 100).toFixed(2)}.`,
    visibility: 'family_funeral_home',
  });

  return res.status(200).json({ url: session.url, sessionId: session.id, orderId: order.id });
}
