import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../../../lib/deliveryAuth';
import { isPassageAdmin } from '../../../../lib/adminAccess';
import { dollarsToCents, centsToDollars, stripeRequest, vendorStripeAccountId } from '../../../../lib/stripeFinancialSpine';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await verifyDeliveryRequest(req);
  const adminAllowed = auth.source === 'internal' || isPassageAdmin(auth.user?.email);
  if (!auth.ok || !adminAllowed) return res.status(auth.status || 403).json({ error: 'Passage admin access required.' });

  const orderId = String(req.body?.vendorOrderId || '');
  if (!isUuid(orderId)) return res.status(400).json({ error: 'Choose a vendor order.' });

  const { data: order, error } = await admin
    .from('vendor_orders')
    .select('id,vendor_request_id,vendor_id,total_amount,platform_fee,net_vendor_amount,payment_status,payout_status,stripe_account_id,stripe_transfer_group,vendors(*)')
    .eq('id', orderId)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!order) return res.status(404).json({ error: 'Vendor order not found.' });
  if (order.payment_status !== 'paid' && req.body?.allowUnpaid !== true) {
    return res.status(409).json({ error: 'Only paid vendor orders can be transferred.' });
  }

  const destination = order.stripe_account_id || vendorStripeAccountId(order.vendors);
  if (!destination) return res.status(409).json({ error: 'Vendor Stripe account is missing.' });

  const requestedAmount = req.body?.amount != null ? Number(req.body.amount) : Number(order.net_vendor_amount || 0);
  const amountCents = dollarsToCents(requestedAmount);
  if (amountCents < 1) return res.status(400).json({ error: 'Transfer amount must be greater than zero.' });
  if (amountCents > dollarsToCents(order.net_vendor_amount || 0) && req.body?.allowOverNet !== true) {
    return res.status(409).json({ error: 'Transfer amount cannot exceed vendor net without explicit admin override.' });
  }

  const transfer = await stripeRequest('/v1/transfers', {
    amount: String(amountCents),
    currency: req.body?.currency || 'usd',
    destination,
    transfer_group: order.stripe_transfer_group || `passage_vendor_order_${order.id}`,
    description: req.body?.description || `Passage vendor payout for order ${order.id}`,
    'metadata[vendorOrderId]': order.id,
    'metadata[vendorRequestId]': order.vendor_request_id || '',
    'metadata[vendorId]': order.vendor_id || '',
    'metadata[milestone]': req.body?.milestone || 'manual',
    'metadata[source]': 'passage_vendor_transfer',
  });

  const now = new Date().toISOString();
  const row = {
    vendor_id: order.vendor_id || null,
    vendor_order_id: order.id,
    vendor_request_id: order.vendor_request_id || null,
    stripe_transfer_id: transfer.id,
    amount: centsToDollars(amountCents),
    currency: transfer.currency || req.body?.currency || 'usd',
    status: 'created',
    milestone: req.body?.milestone || 'manual',
    metadata: {
      destination,
      transferGroup: order.stripe_transfer_group || null,
      stripeStatus: transfer.object || 'transfer',
    },
    created_at: now,
    updated_at: now,
  };
  await admin.from('vendor_transfers').insert([row]);
  await admin.from('vendor_orders').update({ payout_status: 'paid', updated_at: now }).eq('id', order.id);
  if (order.vendor_request_id) {
    await admin.from('vendor_requests').update({ payout_status: 'paid', updated_at: now }).eq('id', order.vendor_request_id);
  }

  return res.status(200).json({
    success: true,
    transferId: transfer.id,
    amount: centsToDollars(amountCents),
    destination,
  });
}
