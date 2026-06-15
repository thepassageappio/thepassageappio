import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';
import { getRequestIp, rateLimit } from '../../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../../lib/rateLimitPolicy';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;
const admin = supabaseUrl && service ? createClient(supabaseUrl, service) : null;

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
  return String(req.url || '').split('?')[0] || '/api/system/funeralHomePilotHealth';
}

function enforceAdminRefreshLimit(req, access) {
  const policy = getRateLimitPolicy('adminReadiness');
  if (!policy) return { allowed: true };
  return rateLimit({
    key: ['pilot-health', requestPath(req), access.user?.email || access.source || 'internal', getRequestIp(req)].join(':'),
    windowSeconds: policy.windowSeconds,
    maxRequests: policy.maxRequests,
  });
}

function moneyFromPlan(planId) {
  const plan = String(planId || '').toLowerCase();
  if (plan.includes('group')) return 349.99;
  if (plan.includes('local') || plan.includes('single')) return 249.99;
  if (plan.includes('pilot')) return 99.99;
  return 0;
}

function healthStage({ subscription, cases, staff, familyUpdates, proofEvents }) {
  if (subscription?.status === 'active' || subscription?.status === 'paid') return 'paid_active';
  if (cases >= 3 && staff >= 2 && familyUpdates >= 2 && proofEvents >= 3) return 'value_proven';
  if (cases >= 1 && staff >= 1) return 'pilot_active';
  if (subscription?.status === 'trialing' || subscription?.status === 'pilot') return 'pilot_invited';
  return 'needs_activation';
}

function nextActionFor(stage) {
  if (stage === 'paid_active') return 'Monitor usage, expansion locations, and churn risk.';
  if (stage === 'value_proven') return 'Ask for paid conversion or expansion before the pilot cools off.';
  if (stage === 'pilot_active') return 'Drive first family update, first staff proof, and first export.';
  if (stage === 'pilot_invited') return 'Schedule onboarding and create the first case with staff assignment.';
  return 'Confirm decision maker, invite workspace owner, and book setup call.';
}

async function countBy(table, column, value, extra = null) {
  if (!admin || !value) return 0;
  let query = admin.from(table).select('id', { count: 'exact', head: true }).eq(column, value);
  if (extra) query = extra(query);
  const { count } = await query.then(result => result, () => ({ count: 0 }));
  return count || 0;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const access = await requireSystemAccess(req);
  if (!access.ok) return res.status(access.status || 401).json({ error: access.error });

  const limit = enforceAdminRefreshLimit(req, access);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds || 60));
    return res.status(429).json({ error: 'Too many pilot-health refreshes. Please wait a minute before trying again.' });
  }

  if (!admin) return res.status(500).json({ error: 'Supabase service role is not configured.' });

  const { data: organizations, error } = await admin
    .from('organizations')
    .select('id,name,type,support_email,created_at')
    .eq('type', 'funeral_home')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });

  const organizationIds = (organizations || []).map(org => org.id);
  let subscriptions = [];
  if (organizationIds.length) {
    const { data } = await admin
      .from('subscriptions')
      .select('id,organization_id,status,plan_id,current_period_end,created_at')
      .in('organization_id', organizationIds)
      .then(result => result, () => ({ data: [] }));
    subscriptions = data || [];
  }

  const rows = [];
  for (const org of organizations || []) {
    const subscription = subscriptions.find(row => row.organization_id === org.id) || null;
    const cases = await countBy('workflows', 'organization_id', org.id);
    const staff = await countBy('organization_members', 'organization_id', org.id);
    const tasks = await countBy('tasks', 'organization_id', org.id);
    const proofEvents = await countBy('task_status_events', 'organization_id', org.id);
    const notifications = await countBy('notification_log', 'organization_id', org.id);
    const familyUpdates = await countBy('announcements', 'organization_id', org.id);
    const stage = healthStage({ subscription, cases, staff, familyUpdates, proofEvents });
    const mrrPotential = moneyFromPlan(subscription?.plan_id || (stage === 'value_proven' ? 'partner_local' : 'partner_pilot'));

    rows.push({
      organizationId: org.id,
      name: org.name,
      supportEmail: org.support_email,
      createdAt: org.created_at,
      stage,
      nextAction: nextActionFor(stage),
      subscription: subscription ? {
        status: subscription.status,
        planId: subscription.plan_id,
        currentPeriodEnd: subscription.current_period_end,
      } : null,
      metrics: {
        cases,
        staff,
        tasks,
        proofEvents,
        notifications,
        familyUpdates,
        mrrPotential,
        arrPotential: Math.round(mrrPotential * 12 * 100) / 100,
      },
      blockers: [
        cases ? null : 'No partner case yet.',
        staff ? null : 'No staff member recorded yet.',
        proofEvents ? null : 'No proof/status event yet.',
        familyUpdates ? null : 'No family update/announcement proof yet.',
        subscription ? null : 'No subscription or pilot billing row found.',
      ].filter(Boolean),
    });
  }

  const totals = rows.reduce((acc, row) => {
    acc.accounts += 1;
    acc.cases += row.metrics.cases;
    acc.staff += row.metrics.staff;
    acc.proofEvents += row.metrics.proofEvents;
    acc.familyUpdates += row.metrics.familyUpdates;
    acc.mrrPotential += row.metrics.mrrPotential;
    acc.arrPotential += row.metrics.arrPotential;
    acc.byStage[row.stage] = (acc.byStage[row.stage] || 0) + 1;
    return acc;
  }, { accounts: 0, cases: 0, staff: 0, proofEvents: 0, familyUpdates: 0, mrrPotential: 0, arrPotential: 0, byStage: {} });

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    accessedBy: access.source,
    target: {
      arr: 300000,
      localAccountsAt249: 100,
      groupAccountsAt349: 72,
    },
    totals: {
      ...totals,
      mrrPotential: Math.round(totals.mrrPotential * 100) / 100,
      arrPotential: Math.round(totals.arrPotential * 100) / 100,
      gapTo300kArr: Math.max(0, Math.round((300000 - totals.arrPotential) * 100) / 100),
    },
    rows,
  });
}
