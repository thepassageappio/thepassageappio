import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';
import { getRequestIp, rateLimit } from '../../../lib/inMemoryRateLimit';
import { getRateLimitPolicy, rateLimitPolicyChecklist, refreshPolicyChecklist } from '../../../lib/rateLimitPolicy';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const authClient = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;

const wiredProtections = [
  { route: '/api/trackEvent', policy: 'tracking', status: 'wired', proof: 'Anonymous telemetry is softly throttled and excess events are dropped without blocking product use.' },
  { route: '/api/saveLead', policy: 'contactIntake', status: 'wired', proof: 'General lead intake is throttled by IP and email.' },
  { route: '/api/supportInquiry', policy: 'contactIntake', status: 'wired', proof: 'Support/contact submissions return 429 after repeated recent submissions.' },
  { route: '/api/vendors/apply', policy: 'contactIntake', status: 'wired', proof: 'Vendor applications return 429 after repeated recent submissions.' },
  { route: '/api/careProviders/apply', policy: 'contactIntake', status: 'wired', proof: 'Care-provider applications return 429 after repeated recent submissions.' },
  { route: '/api/sendEmail', policy: 'outboundDelivery', status: 'wired', proof: 'Email sends are throttled by workflow/task/recipient/action before provider calls.' },
  { route: '/api/sendSMS', policy: 'outboundDelivery', status: 'wired', proof: 'SMS and fallback-email paths are throttled by workflow/task/recipient/action before live or fallback delivery.' },
  { route: '/api/system/rateLimitReadiness', policy: 'adminReadiness', status: 'wired', proof: 'System-admin abuse-control checks are throttled by admin/source and IP.' },
  { route: '/api/system/funeralHomePilotHealth', policy: 'adminReadiness', status: 'wired', proof: 'Funeral-home pilot health refreshes are throttled by admin/source and IP.' },
  { route: '/api/vendorRequests/* and /api/stripe/*', policy: 'vendorCommerce', status: 'defined', proof: 'Policy exists; payment and vendor mutation routes still need wiring.' },
  { route: '/login and auth email flows', policy: 'authSensitive', status: 'defined', proof: 'Policy exists; auth-provider level controls and Supabase leaked-password protection remain the primary gate.' },
];

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
  return String(req.url || '').split('?')[0] || '/api/system/rateLimitReadiness';
}

function enforceAdminRefreshLimit(req, access) {
  const policy = getRateLimitPolicy('adminReadiness');
  if (!policy) return { allowed: true };
  return rateLimit({
    key: ['admin-readiness', requestPath(req), access.user?.email || access.source || 'internal', getRequestIp(req)].join(':'),
    windowSeconds: policy.windowSeconds,
    maxRequests: policy.maxRequests,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireSystemAccess(req);
  if (!access.ok) return res.status(access.status || 401).json({ error: access.error });

  const limit = enforceAdminRefreshLimit(req, access);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds || 60));
    return res.status(429).json({ error: 'Too many readiness refreshes. Please wait a minute before trying again.' });
  }

  const wired = wiredProtections.filter(item => item.status === 'wired');
  const defined = wiredProtections.filter(item => item.status === 'defined');
  const blockers = defined.map(item => `${item.route} has a policy but still needs route-level wiring.`);

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    accessedBy: access.source,
    status: blockers.length ? 'needs_work' : 'ready',
    summary: {
      wired: wired.length,
      definedNotWired: defined.length,
      totalPolicies: rateLimitPolicyChecklist().length,
      refreshPolicies: refreshPolicyChecklist().length,
    },
    policies: rateLimitPolicyChecklist(),
    refreshPolicies: refreshPolicyChecklist(),
    wiredProtections,
    blockers,
  });
}
