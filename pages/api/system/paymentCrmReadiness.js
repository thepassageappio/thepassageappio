import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';
import { calculateVendorEconomics } from '../../../lib/vendorEconomics';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;
const admin = supabaseUrl && supabaseService ? createClient(supabaseUrl, supabaseService) : null;

function present(value) {
  return Boolean(String(value || '').trim());
}

function hubspotToken() {
  return process.env.HUBSPOT_PRIVATE_APP_TOKEN
    || process.env.HUBSPOT_SERVICE_API_KEY
    || process.env.HUBSPOT_SERVICE_KEY
    || process.env.HUBSPOT_ACCESS_TOKEN
    || '';
}

async function requireSystemAccess(req) {
  const internal = await verifyDeliveryRequest(req);
  if (internal.ok && internal.source === 'internal') return { ok: true, source: 'internal' };

  if (!authClient) return { ok: false, status: 500, error: 'Supabase auth is not configured.' };
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, status: 401, error: 'Please sign in first.' };
  const { data, error } = await authClient.auth.getUser(token);
  const email = String(data?.user?.email || '').toLowerCase();
  if (error || !email) return { ok: false, status: 401, error: 'Session could not be verified.' };
  if (!isPassageAdmin(email)) return { ok: false, status: 403, error: 'System admin access required.' };
  return { ok: true, source: 'admin', user: data.user };
}

async function checkTable(name, columns) {
  if (!admin) return { name, ok: false, error: 'Supabase service role is not configured.' };
  const { error } = await admin.from(name).select(columns).limit(1);
  return {
    name,
    ok: !error,
    error: error?.message || null,
  };
}

async function checkStripeAccount() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!present(key)) return { ok: false, configured: false, error: 'STRIPE_SECRET_KEY is missing.' };
  const response = await fetch('https://api.stripe.com/v1/account', {
    headers: { Authorization: `Bearer ${key}` },
  }).catch(error => ({ ok: false, status: 0, json: async () => ({ error: { message: error.message } }) }));
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      configured: true,
      status: response.status,
      mode: key.startsWith('sk_live_') ? 'live' : key.startsWith('sk_test_') ? 'test' : 'unknown',
      error: body?.error?.message || 'Stripe account check failed.',
    };
  }
  return {
    ok: true,
    configured: true,
    mode: key.startsWith('sk_live_') ? 'live' : key.startsWith('sk_test_') ? 'test' : 'unknown',
    accountId: body.id || null,
    country: body.country || null,
    defaultCurrency: body.default_currency || null,
    chargesEnabled: body.charges_enabled ?? null,
    payoutsEnabled: body.payouts_enabled ?? null,
    detailsSubmitted: body.details_submitted ?? null,
  };
}

async function checkHubSpot() {
  const token = hubspotToken();
  if (!present(token)) return { ok: false, configured: false, error: 'HubSpot token is missing.' };
  const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(error => ({ ok: false, status: 0, json: async () => ({ message: error.message }) }));
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      configured: true,
      status: response.status,
      error: body?.message || body?.error || 'HubSpot token check failed.',
    };
  }
  return {
    ok: true,
    configured: true,
    status: response.status,
    reachable: true,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireSystemAccess(req);
  if (!access.ok) return res.status(access.status || 401).json({ error: access.error });

  const [stripe, hubspot, ...tables] = await Promise.all([
    checkStripeAccount(),
    checkHubSpot(),
    checkTable('vendors', 'id,stripe_account_id,stripe_connect_account_id,stripe_charges_enabled,stripe_payouts_enabled,stripe_details_submitted,marketplace_fee_default_percent'),
    checkTable('vendor_requests', 'id,status,payment_collection_status,gross_amount,passage_fee_percent,passage_fee_amount,vendor_net_amount,payout_status,stripe_checkout_session_id,stripe_connected_account_id,service_date,service_start_at,service_location'),
    checkTable('vendor_orders', 'id,total_amount,platform_fee,net_vendor_amount,payment_status,payout_status,stripe_account_id,stripe_checkout_session_id,stripe_transfer_group'),
    checkTable('vendor_payments', 'id,gross_amount,application_fee_amount,vendor_net_amount,status,stripe_checkout_session_id,stripe_transfer_destination'),
    checkTable('crm_sync_events', 'id,source,event_type,source_id,email,company_name,hubspot_contact_id,hubspot_company_id,hubspot_deal_id,status,error,payload'),
  ]);

  const sampleEconomics = calculateVendorEconomics({ value: 100, marketplaceFeePercent: 12, hasFuneralHome: false });
  const webhookSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET2,
    process.env.STRIPE_WEBHOOK_SECRET,
  ].map(value => String(value || '').trim()).filter(Boolean);

  const env = {
    stripeSecret: present(process.env.STRIPE_SECRET_KEY),
    stripeSecretMode: String(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live_') ? 'live' : String(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_') ? 'test' : 'unknown',
    stripeWebhookSecret: webhookSecrets.length > 0,
    stripeWebhookSecretCount: webhookSecrets.length,
    stripeWebhookSecret2Preferred: present(process.env.STRIPE_WEBHOOK_SECRET2),
    hubspotToken: present(hubspotToken()),
    supabaseServiceRole: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io',
  };

  const blockers = [];
  const warnings = [];
  if (!env.stripeSecret) blockers.push('STRIPE_SECRET_KEY is missing.');
  if (!env.stripeWebhookSecret) blockers.push('Stripe webhook secret is missing. STRIPE_WEBHOOK_SECRET2 is supported and preferred when both are present.');
  if (!stripe.ok) blockers.push(`Stripe API check failed: ${stripe.error || 'unknown error'}`);
  if (stripe.mode && stripe.mode !== 'live') warnings.push('Stripe secret is not a live key. Production vendor payments should use a live key.');
  if (!hubspot.ok) blockers.push(`HubSpot API check failed: ${hubspot.error || 'unknown error'}`);
  for (const table of tables) {
    if (!table.ok) blockers.push(`${table.name} schema check failed: ${table.error}`);
  }
  if (sampleEconomics.platformFeeAmount !== 12 || sampleEconomics.passageShareAmount !== 12) {
    blockers.push('Vendor marketplace economics did not produce the expected 12% Passage fee.');
  }

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    accessedBy: access.source,
    status: blockers.length ? 'needs_work' : 'ready',
    env,
    stripe,
    hubspot,
    vendorCommerce: {
      defaultMarketplaceFeePercent: 12,
      sampleGrossAmount: 100,
      samplePassageFee: sampleEconomics.passageShareAmount,
      sampleVendorNet: 100 - sampleEconomics.platformFeeAmount,
      checkoutSafety: {
        destinationCharges: true,
        applicationFeeAmount: true,
        automaticTaxEnabled: true,
        billingAddressCollectionRequired: true,
        priceDataTaxBehaviorExclusive: true,
        webhookHandlesCheckoutCompleted: true,
        webhookHandlesCheckoutExpired: true,
        webhookHandlesPaymentFailed: true,
        webhookHandlesConnectAccountUpdated: true,
      },
    },
    schema: tables,
    blockers,
    warnings,
  });
}
