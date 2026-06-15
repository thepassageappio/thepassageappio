import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';
import { getRequestIp, rateLimit } from '../../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../../lib/rateLimitPolicy';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const authClient = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;

const priceGates = [
  {
    id: 'partner_pilot',
    label: 'Pilot checkout price',
    amount: '$99/mo before 100% pilot discount',
    envKeys: ['STRIPE_PRICE_PARTNER_PILOT_MONTHLY', 'STRIPE_PRICE_FUNERAL_HOME_PILOT_MONTHLY'],
    required: true,
  },
  {
    id: 'partner_local',
    label: 'Single-location paid price',
    amount: '$249.99/mo',
    envKeys: ['STRIPE_PRICE_PARTNER_LOCAL_MONTHLY', 'STRIPE_PRICE_FUNERAL_HOME_LOCAL_MONTHLY'],
    required: true,
  },
  {
    id: 'partner_group',
    label: 'Multi-location paid price',
    amount: '$349.99/mo',
    envKeys: ['Funeral_Home_MULTI_LOCATION_Monthly', 'STRIPE_PRICE_PARTNER_GROUP_MONTHLY', 'STRIPE_PRICE_FUNERAL_HOME_GROUP_MONTHLY'],
    required: true,
  },
  {
    id: 'partner_location_addon',
    label: 'Additional location add-on',
    amount: '$99/mo or configured add-on',
    envKeys: ['STRIPE_PRICE_FUNERAL_HOME_LOCATION_ADDON_MONTHLY', 'STRIPE_PRICE_PARTNER_LOCATION_ADDON_MONTHLY'],
    required: false,
  },
];

const pilotDiscountKeys = [
  'STRIPE_COUPON_FUNERAL_HOME_PILOT',
  'STRIPE_COUPON_PARTNER_PILOT',
  'STRIPE_FUNERAL_HOME_PILOT_COUPON_ID',
  'STRIPE_PARTNER_PILOT_COUPON_ID',
  'STRIPE_PROMOTION_CODE_FUNERAL_HOME_PILOT',
  'STRIPE_PROMOTION_CODE_PARTNER_PILOT',
  'STRIPE_FUNERAL_HOME_PILOT_PROMOTION_CODE_ID',
  'STRIPE_PARTNER_PILOT_PROMOTION_CODE_ID',
];

const webhookSecretKeys = ['STRIPE_WEBHOOK_SECRET2', 'STRIPE_WEBHOOK_SECRET'];

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

function requestPath(req) {
  return String(req.url || '').split('?')[0] || '/api/system/partnerCheckoutReadiness';
}

function enforceAdminRefreshLimit(req, access) {
  const policy = getRateLimitPolicy('adminReadiness');
  if (!policy) return { allowed: true };
  return rateLimit({
    key: ['partner-checkout-readiness', requestPath(req), access.user?.email || access.source || 'internal', getRequestIp(req)].join(':'),
    windowSeconds: policy.windowSeconds,
    maxRequests: policy.maxRequests,
  });
}

function configuredEnv(keys) {
  for (const key of keys) {
    const value = String(process.env[key] || '').trim();
    if (value) return { key, value };
  }
  return { key: keys[0], value: '' };
}

function priceStatus(gate) {
  const configured = configuredEnv(gate.envKeys);
  if (!configured.value) {
    return {
      ...gate,
      status: gate.required ? 'blocked' : 'warning',
      configuredKey: null,
      proof: `${gate.label} is not configured. Expected one of: ${gate.envKeys.join(', ')}.`,
    };
  }
  if (!configured.value.startsWith('price_')) {
    return {
      ...gate,
      status: 'blocked',
      configuredKey: configured.key,
      proof: `${configured.key} is set but does not look like a Stripe Price ID. Checkout requires price_..., not a product ID or payment link.`,
    };
  }
  return {
    ...gate,
    status: 'ready',
    configuredKey: configured.key,
    proof: `${gate.label} uses ${configured.key}.`,
  };
}

function discountStatus() {
  const configured = configuredEnv(pilotDiscountKeys);
  if (!configured.value) {
    return {
      id: 'partner_pilot_discount',
      label: '100% pilot discount',
      status: 'blocked',
      configuredKey: null,
      proof: 'Pilot checkout requires a 100% off pilot coupon or promotion code before a pilot can enter Stripe safely.',
    };
  }
  const looksResolvable = /^promo_|^coupon_|^[A-Za-z0-9_-]{3,}$/.test(configured.value);
  return {
    id: 'partner_pilot_discount',
    label: '100% pilot discount',
    status: looksResolvable ? 'ready' : 'warning',
    configuredKey: configured.key,
    proof: looksResolvable
      ? `Pilot discount is configured through ${configured.key}.`
      : `${configured.key} is set, but the value should be a Stripe coupon, promotion code ID, or promotion code string.`,
  };
}

function webhookStatus() {
  const configured = configuredEnv(webhookSecretKeys);
  if (!configured.value) {
    return {
      id: 'stripe_webhook_secret',
      label: 'Stripe webhook secret',
      status: 'blocked',
      configuredKey: null,
      proof: 'Stripe webhook secret is required so completed partner checkouts mirror into subscriptions and funeral_home_partners.',
    };
  }
  return {
    id: 'stripe_webhook_secret',
    label: 'Stripe webhook secret',
    status: 'ready',
    configuredKey: configured.key,
    proof: `Webhook signature verification has ${configured.key} configured.`,
  };
}

function stripeSecretStatus() {
  const configured = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!configured) {
    return {
      id: 'stripe_secret_key',
      label: 'Stripe secret key',
      status: 'blocked',
      configuredKey: null,
      proof: 'STRIPE_SECRET_KEY is required before partner checkout sessions can be created.',
    };
  }
  return {
    id: 'stripe_secret_key',
    label: 'Stripe secret key',
    status: configured.startsWith('sk_') ? 'ready' : 'warning',
    configuredKey: 'STRIPE_SECRET_KEY',
    proof: configured.startsWith('sk_')
      ? 'Stripe checkout API key is configured.'
      : 'STRIPE_SECRET_KEY is set but does not look like a standard Stripe secret key.',
  };
}

function staticCheckoutContracts() {
  return [
    {
      id: 'checkout_auth',
      label: 'Checkout authentication',
      status: 'ready',
      proof: 'Checkout requires a signed-in user whose Supabase user ID matches the requested checkout userId.',
    },
    {
      id: 'partner_metadata',
      label: 'Partner checkout metadata',
      status: 'ready',
      proof: 'Partner checkouts send planId, partnerPlan, included location slots, add-on flag, active case limit, and userId metadata to Stripe.',
    },
    {
      id: 'partner_webhook_mirror',
      label: 'Partner billing mirror',
      status: 'ready',
      proof: 'Stripe webhook records partner checkout into organizations and funeral_home_partners with plan, fee, slots, subscription, and status.',
    },
  ];
}

function launchDecisionFor(items) {
  const blockers = items.filter(item => item.status === 'blocked');
  const warnings = items.filter(item => item.status === 'warning');
  if (blockers.length) {
    return {
      status: 'blocked',
      label: 'Do not make paid conversion asks yet',
      summary: `${blockers.length} checkout gate${blockers.length === 1 ? '' : 's'} block paid funeral-home conversion.`,
      nextAction: blockers[0].proof,
    };
  }
  if (warnings.length) {
    return {
      status: 'ready_with_warnings',
      label: 'Ready for founder-led conversion with warnings',
      summary: `${warnings.length} checkout warning${warnings.length === 1 ? '' : 's'} should be reviewed before scaling self-serve partner billing.`,
      nextAction: warnings[0].proof,
    };
  }
  return {
    status: 'ready',
    label: 'Ready for paid funeral-home conversion',
    summary: 'Partner prices, pilot discount, webhook secret, checkout auth, metadata, and billing mirror are ready.',
    nextAction: 'Use Conversion Plan to make the paid ask only when pilot proof is visible.',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const access = await requireSystemAccess(req);
  if (!access.ok) return res.status(access.status || 401).json({ error: access.error });

  const limit = enforceAdminRefreshLimit(req, access);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds || 60));
    return res.status(429).json({ error: 'Too many checkout-readiness refreshes. Please wait a minute before trying again.' });
  }

  const items = [
    stripeSecretStatus(),
    ...priceGates.map(priceStatus),
    discountStatus(),
    webhookStatus(),
    ...staticCheckoutContracts(),
  ];
  const launchDecision = launchDecisionFor(items);
  const summary = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, { ready: 0, warning: 0, blocked: 0 });

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    accessedBy: access.source,
    status: launchDecision.status,
    launchDecision,
    summary,
    plans: priceGates.map(gate => ({ id: gate.id, label: gate.label, amount: gate.amount, required: gate.required })),
    items,
  });
}
