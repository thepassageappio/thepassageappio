import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../../../lib/deliveryAuth';
import { calculateVendorEconomics } from '../../../../lib/vendorEconomics';
import { recordTaskCommunicationEvent } from '../../../../lib/communicationEvents';
import { canonicalVendorStatus } from '../../../../lib/vendorLifecycle';
import { centsToDollars, dollarsToCents, SITE_URL, stripeRequest, transferGroupForVendorOrder, vendorIsPaymentReady, vendorStripeAccountId } from '../../../../lib/stripeFinancialSpine';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

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

async function loadPaymentContext(body) {
  const requestId = String(body?.vendorRequestId || body?.requestId || '');
  if (isUuid(requestId)) {
    const { data: request, error } = await admin
      .from('vendor_requests')
      .select('id,workflow_id,task_id,task_title,status,estimated_value,final_value,vendor_note,marketplace_fee_percent,funeral_home_rev_share_percent,payment_collection_status,organization_id,service_date,service_start_at,service_location,service_notes,vendors(*),workflows(id,user_id,coordinator_email,coordinator_name,organization_id,deceased_name,estate_name,name)')
      .eq('id', requestId)
      .maybeSingle();
    if (error) throw error;
    if (!request) return { error: { status: 404, message: 'Vendor quote not found.' } };
    const status = canonicalVendorStatus(request.status);
    if (!['quoted', 'family_accepted', 'payment_pending'].includes(status)) {
      return { error: { status: 409, message: 'A vendor quote must be ready before payment.' } };
    }
    return {
      vendorRequest: request,
      vendor: request.vendors,
      workflow: request.workflows,
      workflowId: request.workflow_id,
      taskId: request.task_id || null,
      taskTitle: request.task_title || 'Vendor service',
      grossDollars: Number(request.final_value || request.estimated_value || 0),
      description: request.service_notes || request.vendor_note || `Passage coordinated service for ${request.workflows?.deceased_name || request.workflows?.estate_name || request.workflows?.name || 'the family record'}.`,
      serviceDate: request.service_date || null,
      serviceStartAt: request.service_start_at || null,
      serviceLocation: request.service_location || null,
      marketplaceFeePercent: request.marketplace_fee_percent,
      funeralHomeSharePercent: request.funeral_home_rev_share_percent,
      hasFuneralHome: !!request.organization_id,
    };
  }

  const vendorId = String(body?.vendorId || '');
  if (!isUuid(vendorId)) return { error: { status: 400, message: 'Choose a vendor or vendor quote.' } };
  const [{ data: vendor, error: vendorError }, { data: workflow, error: workflowError }] = await Promise.all([
    admin.from('vendors').select('*').eq('id', vendorId).maybeSingle(),
    isUuid(body?.workflowId)
      ? admin.from('workflows').select('id,user_id,coordinator_email,coordinator_name,organization_id,deceased_name,estate_name,name').eq('id', body.workflowId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (vendorError) throw vendorError;
  if (workflowError) throw workflowError;
  if (!vendor) return { error: { status: 404, message: 'Vendor not found.' } };
  if (!workflow) return { error: { status: 400, message: 'Attach the payment to a family record before collecting money.' } };
  return {
    vendor,
    workflow,
    workflowId: workflow.id,
    taskId: isUuid(body?.taskId) ? body.taskId : null,
    taskTitle: body?.taskTitle || body?.description || 'Vendor service',
    grossDollars: Number(body?.totalAmount || 0),
    description: body?.description || `Passage coordinated service for ${workflow.deceased_name || workflow.estate_name || workflow.name || 'the family record'}.`,
    serviceDate: body?.serviceDate || null,
    serviceStartAt: body?.serviceStartAt || null,
    serviceLocation: body?.serviceLocation || null,
    marketplaceFeePercent: body?.platformFeePercent || vendor.marketplace_fee_default_percent || 12,
    funeralHomeSharePercent: 0,
    hasFuneralHome: !!workflow.organization_id,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok || !auth.user) return res.status(auth.status || 401).json({ error: auth.error || 'Please sign in first.' });

  const context = await loadPaymentContext(req.body);
  if (context.error) return res.status(context.error.status).json({ error: context.error.message });
  const allowed = await userCanAccessWorkflow(auth.user, context.workflow);
  if (!allowed) return res.status(403).json({ error: 'You do not have access to this family record.' });

  if (!vendorIsPaymentReady(context.vendor)) {
    return res.status(409).json({ error: 'This vendor must finish Stripe payout setup before Passage can collect payment for the family.' });
  }

  const grossCents = dollarsToCents(context.grossDollars);
  if (grossCents < 50) return res.status(400).json({ error: 'The vendor quote needs a valid amount before payment.' });

  const destination = vendorStripeAccountId(context.vendor);
  const economics = calculateVendorEconomics({
    value: centsToDollars(grossCents),
    marketplaceFeePercent: context.marketplaceFeePercent,
    funeralHomeSharePercent: context.funeralHomeSharePercent || 0,
    hasFuneralHome: context.hasFuneralHome,
  });
  const applicationFeeCents = Math.min(grossCents, dollarsToCents(economics.platformFeeAmount));
  const vendorNetCents = Math.max(grossCents - applicationFeeCents, 0);
  const now = new Date().toISOString();
  const familyName = context.workflow?.deceased_name || context.workflow?.estate_name || context.workflow?.name || 'Family record';

  const { data: order, error: orderError } = await admin.from('vendor_orders').insert([{
    vendor_request_id: context.vendorRequest?.id || null,
    vendor_id: context.vendor?.id || null,
    workflow_id: context.workflowId,
    task_id: context.taskId,
    total_amount: centsToDollars(grossCents),
    platform_fee: centsToDollars(applicationFeeCents),
    platform_fee_percent: Number(context.marketplaceFeePercent || 12),
    net_vendor_amount: centsToDollars(vendorNetCents),
    payment_status: 'checkout_created',
    payout_status: 'automatic_transfer',
    stripe_account_id: destination,
    description: context.description,
    metadata: {
      vendorRequestId: context.vendorRequest?.id || null,
      serviceDate: context.serviceDate,
      serviceStartAt: context.serviceStartAt,
      serviceLocation: context.serviceLocation,
      source: 'stripe_payment_create',
    },
    created_by: auth.user.id,
    created_at: now,
    updated_at: now,
  }]).select('id').single();
  if (orderError) return res.status(500).json({ error: orderError.message });

  const transferGroup = transferGroupForVendorOrder(order.id);
  await admin.from('vendor_orders').update({ stripe_transfer_group: transferGroup }).eq('id', order.id);

  const session = await stripeRequest('/v1/checkout/sessions', {
    mode: 'payment',
    'automatic_tax[enabled]': 'true',
    customer_creation: 'always',
    success_url: `${SITE_URL}/estate?vendor_payment=success&order=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/estate?vendor_payment=cancelled&order=${encodeURIComponent(order.id)}`,
    client_reference_id: order.id,
    customer_email: auth.user.email || context.workflow?.coordinator_email || '',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(grossCents),
    'line_items[0][price_data][product_data][name]': `${context.vendor?.business_name || 'Vendor'} - ${context.taskTitle}`,
    'line_items[0][price_data][product_data][description]': context.description || `Passage coordinated service for ${familyName}.`,
    'payment_intent_data[application_fee_amount]': String(applicationFeeCents),
    'payment_intent_data[transfer_data][destination]': destination,
    'payment_intent_data[transfer_group]': transferGroup,
    'payment_intent_data[metadata][kind]': 'vendor_order',
    'payment_intent_data[metadata][vendorOrderId]': order.id,
    'payment_intent_data[metadata][vendorRequestId]': context.vendorRequest?.id || '',
    'payment_intent_data[metadata][vendorId]': context.vendor?.id || '',
    'payment_intent_data[metadata][workflowId]': context.workflowId,
    'payment_intent_data[metadata][taskId]': context.taskId || '',
    'payment_intent_data[metadata][stripeConnectedAccountId]': destination,
    'metadata[kind]': 'vendor_order',
    'metadata[vendorOrderId]': order.id,
    'metadata[vendorRequestId]': context.vendorRequest?.id || '',
    'metadata[vendorId]': context.vendor?.id || '',
    'metadata[workflowId]': context.workflowId,
    'metadata[taskId]': context.taskId || '',
    'metadata[stripeConnectedAccountId]': destination,
  });

  await admin.from('vendor_orders').update({
    stripe_checkout_session_id: session.id,
    payment_status: 'checkout_created',
    updated_at: now,
  }).eq('id', order.id);

  if (context.vendorRequest?.id) {
    await admin.from('vendor_requests').update({
      stripe_checkout_session_id: session.id,
      stripe_connected_account_id: destination,
      quote_approved_at: now,
      family_accepted_at: now,
      payment_url_created_at: now,
      status: 'payment_pending',
      payment_collection_status: 'checkout_created',
      gross_amount: centsToDollars(grossCents),
      passage_fee_percent: Number(context.marketplaceFeePercent || 12),
      passage_fee_amount: centsToDollars(applicationFeeCents),
      platform_fee_amount: economics.platformFeeAmount,
      funeral_home_share_amount: economics.funeralHomeShareAmount,
      passage_share_amount: economics.passageShareAmount,
      vendor_net_amount: centsToDollars(vendorNetCents),
      payout_amount: centsToDollars(vendorNetCents),
      payout_status: 'pending',
      updated_at: now,
    }).eq('id', context.vendorRequest.id);
  }

  await admin.from('vendor_payments').insert([{
    vendor_request_id: context.vendorRequest?.id || null,
    vendor_id: context.vendor?.id || null,
    workflow_id: context.workflowId,
    task_id: context.taskId,
    gross_amount: centsToDollars(grossCents),
    application_fee_amount: centsToDollars(applicationFeeCents),
    vendor_net_amount: centsToDollars(vendorNetCents),
    stripe_checkout_session_id: session.id,
    stripe_transfer_destination: destination,
    status: 'checkout_created',
  }]).then(() => {}, () => {});

  await recordTaskCommunicationEvent({
    verb: 'update',
    workflowId: context.workflowId,
    taskId: context.taskId,
    taskTitle: context.taskTitle,
    status: 'waiting',
    actor: auth.user.email || 'Family coordinator',
    actorRole: context.workflow?.organization_id ? 'funeral_home' : 'family_coordinator',
    channel: 'vendor_payment',
    recipient: context.vendor?.business_name || 'Vendor',
    recipientRole: 'vendor',
    detail: `Vendor quote approved. Payment checkout was created for $${centsToDollars(grossCents).toFixed(2)}; Passage fee is $${centsToDollars(applicationFeeCents).toFixed(2)}.`,
    visibility: 'family_funeral_home',
  });

  return res.status(200).json({
    success: true,
    url: session.url,
    sessionId: session.id,
    orderId: order.id,
    totalAmount: centsToDollars(grossCents),
    platformFee: centsToDollars(applicationFeeCents),
    netVendorAmount: centsToDollars(vendorNetCents),
  });
}
