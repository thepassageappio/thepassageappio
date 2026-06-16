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
  { route: '/api/providerSearch', policy: 'providerLookup', status: 'wired', proof: 'Provider searches are throttled by IP and query before calling Google Places.' },
  { route: '/api/addressAutocomplete', policy: 'providerLookup', status: 'wired', proof: 'Address autocomplete and place details are throttled by IP, lookup type, and query before calling Google Places.' },
  { route: '/api/sendEmail', policy: 'outboundDelivery', status: 'wired', proof: 'Email sends are throttled by workflow/task/recipient/action before provider calls.' },
  { route: '/api/sendSMS', policy: 'outboundDelivery', status: 'wired', proof: 'SMS and fallback-email paths are throttled by workflow/task/recipient/action before live or fallback delivery.' },
  { route: '/api/tasks/[id]/send', policy: 'outboundDelivery', status: 'wired', proof: 'Task handoff wrappers are throttled by IP, workflow, task, recipient, channel, and action before provider calls.' },
  { route: '/api/tasks/[id]/reminder', policy: 'outboundDelivery', status: 'wired', proof: 'Manual task reminders are throttled by IP, workflow, task, and recipient before email delivery.' },
  { route: '/api/processTaskReminders', policy: 'outboundDelivery', status: 'wired', proof: 'Scheduled reminder processing is authorized and rate-limited before scanning due tasks.' },
  { route: '/api/processVendorReminders', policy: 'outboundDelivery', status: 'wired', proof: 'Vendor reminder processing is authorized and rate-limited before scanning due vendor obligations.' },
  { route: '/api/processScheduledDeliveries', policy: 'outboundDelivery', status: 'wired', proof: 'Scheduled delivery processing is authorized and rate-limited before sending email or SMS.' },
  { route: '/api/callNow', policy: 'outboundDelivery', status: 'wired', proof: 'Voice-call connect attempts are throttled by IP, user, workflow, task, and phone pair before Twilio Voice calls.' },
  { route: '/api/familyUpdate', policy: 'outboundDelivery', status: 'wired', proof: 'Family update sends are throttled by IP, user, workflow, audience, and recipient set before Resend fanout.' },
  { route: '/api/funeralHomeRequests', policy: 'contactIntake/vendorCommerce', status: 'wired', proof: 'Family funeral-home requests and partner request actions are throttled by IP, user, record, provider, and action.' },
  { route: '/api/system/rateLimitReadiness', policy: 'adminReadiness', status: 'wired', proof: 'System-admin abuse-control checks are throttled by admin/source and IP.' },
  { route: '/api/system/funeralHomePilotHealth', policy: 'adminReadiness', status: 'wired', proof: 'Funeral-home pilot health refreshes are throttled by admin/source and IP.' },
  { route: '/api/checkout, /api/vendorRequests/*, /api/vendors/*, and /api/stripe/*', policy: 'vendorCommerce', status: 'wired', proof: 'Edge middleware throttles checkout, vendor request mutations, vendor mutations, Stripe subroutes, and tokenized vendor response actions before handlers run.' },
  { route: '/login and auth email flows', policy: 'authSensitive', status: 'defined', severity: 'provider_review', proof: 'Policy exists; auth-provider level controls and Supabase leaked-password protection remain the primary gate.' },
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

function launchDecisionFor({ wired, defined }) {
  const routeBlockers = defined.filter(item => item.severity !== 'provider_review');
  if (routeBlockers.length) {
    return {
      status: 'blocked',
      label: 'Do not expand pilot outreach yet',
      summary: `${routeBlockers.length} route-level abuse control still needs wiring before broader traffic.`,
      nextAction: `Wire ${routeBlockers[0].route} to its ${routeBlockers[0].policy} policy, then rerun readiness.`,
    };
  }
  if (defined.length) {
    return {
      status: 'ready_for_controlled_pilots',
      label: 'Ready for controlled funeral-home pilots',
      summary: `${wired.length} production protections are wired. Remaining work is provider-level auth review, not a route-level blocker for founder-led pilots.`,
      nextAction: 'Before broad self-serve signup, confirm Supabase auth protections, leaked-password detection, MFA/SSO posture, and login abuse monitoring.',
    };
  }
  return {
    status: 'ready_to_scale',
    label: 'Ready to scale monitored outreach',
    summary: 'All defined abuse and refresh protections are wired.',
    nextAction: 'Keep readiness in the launch checklist and review runtime 429/error patterns during each outreach wave.',
  };
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
  const blockers = defined.map(item => `${item.route} has a policy but still needs route-level wiring or provider-level verification.`);
  const launchDecision = launchDecisionFor({ wired, defined });

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    accessedBy: access.source,
    status: launchDecision.status === 'blocked' ? 'needs_work' : launchDecision.status,
    launchDecision,
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
