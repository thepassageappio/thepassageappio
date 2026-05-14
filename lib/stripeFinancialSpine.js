const DEFAULT_SITE_URL = 'https://www.thepassageapp.io';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');

export function dollarsToCents(value) {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

export function centsToDollars(value) {
  return Math.round(Number(value || 0)) / 100;
}

export function vendorStripeAccountId(vendor) {
  return vendor?.stripe_account_id || vendor?.stripe_connect_account_id || vendor?.stripe_connected_account_id || null;
}

export function vendorIsPaymentReady(vendor) {
  return !!vendorStripeAccountId(vendor) && vendor?.stripe_charges_enabled === true && vendor?.stripe_payouts_enabled === true;
}

export async function stripeRequest(path, body = {}, options = {}) {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured.');
  const response = await fetch('https://api.stripe.com' + path, {
    method: options.method || 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.error) {
    throw new Error(json.error?.message || 'Stripe request failed.');
  }
  return json;
}

export async function createExpressAccountForVendor(vendor, email) {
  return stripeRequest('/v1/accounts', {
    type: 'express',
    country: 'US',
    email: vendor?.contact_email || email || '',
    'capabilities[card_payments][requested]': 'true',
    'capabilities[transfers][requested]': 'true',
    'business_profile[name]': vendor?.business_name || 'Passage vendor',
    'business_profile[url]': vendor?.website || SITE_URL,
    'metadata[vendorId]': vendor?.id || '',
    'metadata[source]': 'passage_vendor_connect',
  });
}

export async function createOnboardingLink(accountId, { returnPath = '/vendors/request?connect=return', refreshPath = '/vendors/request?connect=refresh' } = {}) {
  return stripeRequest('/v1/account_links', {
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${SITE_URL}${refreshPath}`,
    return_url: `${SITE_URL}${returnPath}`,
  });
}

export function transferGroupForVendorOrder(orderId) {
  return orderId ? `passage_vendor_order_${orderId}` : `passage_vendor_order_${Date.now()}`;
}
