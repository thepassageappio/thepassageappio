import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../../../lib/deliveryAuth';
import { createExpressAccountForVendor, createOnboardingLink, vendorStripeAccountId } from '../../../../lib/stripeFinancialSpine';
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
  if (!accountId) {
    const account = await createExpressAccountForVendor(vendor, auth.user.email);
    accountId = account.id;
    await admin.from('vendors').update({
      stripe_account_id: accountId,
      stripe_connect_account_id: accountId,
      stripe_connect_status: 'onboarding',
      stripe_charges_enabled: Boolean(account.charges_enabled),
      stripe_payouts_enabled: Boolean(account.payouts_enabled),
      stripe_details_submitted: Boolean(account.details_submitted),
      stripe_connect_last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', vendor.id);
  }

  const link = await createOnboardingLink(accountId, {
    returnPath: req.body?.returnPath || '/vendors/request?connect=return',
    refreshPath: req.body?.refreshPath || '/vendors/request?connect=refresh',
  });

  await admin.from('vendors').update({
    stripe_account_id: accountId,
    stripe_connect_account_id: accountId,
    stripe_connect_status: 'onboarding',
    stripe_connect_onboarding_url: link.url,
    stripe_connect_onboarding_expires_at: link.expires_at ? new Date(link.expires_at * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', vendor.id);

  return res.status(200).json({ success: true, vendorId: vendor.id, accountId, url: link.url });
}
