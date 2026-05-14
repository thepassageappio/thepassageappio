import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../../../lib/deliveryAuth';
import { createExpressAccountForVendor, vendorStripeAccountId } from '../../../../lib/stripeFinancialSpine';
import { canManageVendorPayments, loadVendorForUser } from '../../../../lib/vendorAccess';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe is not configured.' });

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok || !auth.user) return res.status(auth.status || 401).json({ error: auth.error || 'Please sign in first.' });

  const { vendor, membership } = await loadVendorForUser(admin, auth.user, req.body?.vendorId || null);
  if (!vendor) return res.status(403).json({ error: 'Approved vendor access required.' });
  if (!canManageVendorPayments(membership)) {
    return res.status(403).json({ error: 'Only a vendor owner or manager can set up payouts.' });
  }

  let accountId = vendorStripeAccountId(vendor);
  let account = null;
  if (!accountId) {
    account = await createExpressAccountForVendor(vendor, auth.user.email);
    accountId = account.id;
  }

  const update = {
    stripe_account_id: accountId,
    stripe_connect_account_id: accountId,
    stripe_connect_status: account?.payouts_enabled ? 'payouts_enabled' : account?.charges_enabled ? 'charges_enabled' : 'onboarding',
    stripe_charges_enabled: Boolean(account?.charges_enabled || vendor.stripe_charges_enabled),
    stripe_payouts_enabled: Boolean(account?.payouts_enabled || vendor.stripe_payouts_enabled),
    stripe_details_submitted: Boolean(account?.details_submitted || vendor.stripe_details_submitted),
    stripe_connect_last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await admin.from('vendors').update(update).eq('id', vendor.id);

  return res.status(200).json({
    success: true,
    vendorId: vendor.id,
    accountId,
    chargesEnabled: update.stripe_charges_enabled,
    payoutsEnabled: update.stripe_payouts_enabled,
    detailsSubmitted: update.stripe_details_submitted,
  });
}
