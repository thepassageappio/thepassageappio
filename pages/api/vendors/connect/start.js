import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

const authClient = url && anon ? createClient(url, anon) : null;
const admin = url && service ? createClient(url, service) : null;

async function loadVendorForUser(user) {
  const email = String(user?.email || '').trim().toLowerCase();
  if (!email) return { vendor: null, membership: null };
  const { data: vendor, error: vendorError } = await admin
    .from('vendors')
    .select('*')
    .eq('status', 'active')
    .ilike('contact_email', email)
    .maybeSingle();
  if (vendorError) throw vendorError;
  if (vendor) return { vendor, membership: { role: 'owner', status: 'active' } };

  const { data: member, error: memberError } = await admin
    .from('vendor_team_members')
    .select('id,email,display_name,role,status,vendor_id,vendors(*)')
    .ilike('email', email)
    .in('status', ['active', 'invited'])
    .limit(1)
    .maybeSingle();
  if (memberError && memberError.code !== '42P01') throw memberError;
  if (member?.vendors?.status === 'active') return { vendor: member.vendors, membership: member };
  return { vendor: null, membership: null };
}

async function stripeRequest(path, body) {
  const response = await fetch('https://api.stripe.com' + path, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.error) throw new Error(json.error?.message || 'Stripe request failed.');
  return json;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authClient || !admin) return res.status(500).json({ error: 'Vendor Connect is not configured.' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe is not configured.' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

  const { vendor, membership } = await loadVendorForUser(userData.user);
  if (!vendor) return res.status(403).json({ error: 'Approved vendor access required.' });
  if (!['owner', 'manager'].includes(membership?.role || 'owner')) {
    return res.status(403).json({ error: 'Only a vendor owner or manager can set up payouts.' });
  }

  let accountId = vendor.stripe_connect_account_id;
  if (!accountId) {
    const account = await stripeRequest('/v1/accounts', {
      country: 'US',
      email: vendor.contact_email || userData.user.email,
      'capabilities[card_payments][requested]': 'true',
      'capabilities[transfers][requested]': 'true',
      'business_profile[name]': vendor.business_name || 'Passage vendor',
      'business_profile[url]': vendor.website || SITE_URL,
      'metadata[vendorId]': vendor.id,
      'metadata[source]': 'passage_vendor_connect',
    });
    accountId = account.id;
    await admin.from('vendors').update({
      stripe_connect_account_id: accountId,
      stripe_connect_status: 'onboarding',
      stripe_charges_enabled: Boolean(account.charges_enabled),
      stripe_payouts_enabled: Boolean(account.payouts_enabled),
      stripe_details_submitted: Boolean(account.details_submitted),
      stripe_connect_last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', vendor.id);
  }

  const accountLink = await stripeRequest('/v1/account_links', {
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${SITE_URL}/vendors/request?connect=refresh`,
    return_url: `${SITE_URL}/vendors/request?connect=return`,
  });

  await admin.from('vendors').update({
    stripe_connect_account_id: accountId,
    stripe_connect_status: 'onboarding',
    stripe_connect_onboarding_url: accountLink.url,
    stripe_connect_onboarding_expires_at: accountLink.expires_at ? new Date(accountLink.expires_at * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', vendor.id);

  return res.status(200).json({ url: accountLink.url, accountId });
}
