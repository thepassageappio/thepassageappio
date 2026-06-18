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

const DONE = new Set(['handled', 'completed', 'done', 'not_applicable', 'cancelled']);
const WAITING = new Set(['waiting', 'pending', 'sent', 'delivered', 'assigned', 'acknowledged']);
const NEEDS_HELP = new Set(['blocked', 'failed', 'needs_review']);

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

function enforceAdminRefreshLimit(req, access) {
  const policy = getRateLimitPolicy('adminReadiness');
  if (!policy) return { allowed: true };
  return rateLimit({
    key: ['enterprise-fh-readiness', access.user?.email || access.source || 'internal', getRequestIp(req)].join(':'),
    windowSeconds: policy.windowSeconds,
    maxRequests: policy.maxRequests,
  });
}

async function safeRows(table, select, configure = query => query) {
  if (!admin) return { rows: [], error: 'Supabase service client is not configured.' };
  try {
    const result = await configure(admin.from(table).select(select));
    if (result.error) return { rows: [], error: result.error.message || String(result.error) };
    return { rows: result.data || [], error: '' };
  } catch (error) {
    return { rows: [], error: error.message || String(error) };
  }
}

function statusOf(row) {
  return String(row?.status || row?.delivery_status || row?.outcome_status || '').toLowerCase();
}

function isOpenTask(task) {
  return !DONE.has(statusOf(task)) && !task?.completed_at && !task?.handled_at;
}

function isWaitingTask(task) {
  return isOpenTask(task) && WAITING.has(statusOf(task));
}

function isBlockedTask(task) {
  return isOpenTask(task) && NEEDS_HELP.has(statusOf(task));
}

function hasOwner(task) {
  return Boolean(String(task?.assigned_to_email || task?.assigned_to_name || task?.recipient || '').trim());
}

function proofText(task) {
  return String(task?.notes || task?.waiting_on || task?.proof_required || task?.last_actor || '').trim();
}

function moneyFromPlan(plan) {
  const planId = String(plan || '').toLowerCase();
  if (planId.includes('group') || planId.includes('multi')) return 349.99;
  if (planId.includes('local') || planId.includes('single')) return 249.99;
  if (planId.includes('pilot')) return 99.99;
  return 0;
}

function gate(id, label, status, proof, action) {
  return { id, label, status, proof, action };
}

function score(gates) {
  if (!gates.length) return 0;
  const points = gates.reduce((sum, item) => sum + (item.status === 'ready' ? 1 : item.status === 'warning' ? 0.5 : 0), 0);
  return Math.round((points / gates.length) * 100);
}

function orgName(org) {
  return org?.name || org?.family_portal_name || org?.from_name || 'Unnamed funeral-home account';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET for enterprise funeral-home readiness.' });
  const access = await requireSystemAccess(req);
  if (!access.ok) return res.status(access.status || 401).json({ error: access.error });
  const limited = enforceAdminRefreshLimit(req, access);
  res.setHeader('Cache-Control', 'no-store');
  if (!limited.allowed) {
    res.setHeader('Retry-After', String(limited.retryAfterSeconds || 60));
    return res.status(429).json({ error: 'Readiness checks are cooling down. Try again shortly.', retryAfterSeconds: limited.retryAfterSeconds || 60 });
  }
  if (!admin) return res.status(500).json({ error: 'Supabase service role is not configured.' });

  const [orgResult, memberResult, locationResult, workflowResult, taskResult, eventResult, subscriptionResult, partnerResult] = await Promise.all([
    safeRows('organizations', 'id,name,type,status,support_email,support_phone,family_portal_name,from_name,white_label_enabled,created_at,updated_at', query => query.or('type.ilike.%funeral%,type.ilike.%partner%,name.ilike.%funeral%').limit(200)),
    safeRows('organization_members', 'id,organization_id,email,display_name,role,status,location_scope,title,created_at,updated_at', query => query.limit(1000)),
    safeRows('organization_locations', 'id,organization_id,name,status,address,city,state,zip,created_at,updated_at', query => query.limit(1000)),
    safeRows('workflows', 'id,organization_id,name,estate_name,deceased_name,status,setup_stage,mode,coordinator_email,coordinator_name,updated_at,created_at', query => query.neq('status', 'archived').limit(1000)),
    safeRows('tasks', 'id,workflow_id,title,status,assigned_to_name,assigned_to_email,recipient,waiting_on,notes,proof_required,last_actor,last_action_at,updated_at,completed_at,handled_at', query => query.limit(2000)),
    safeRows('task_status_events', 'id,workflow_id,task_id,status,last_actor,provider,provider_message_id,created_at', query => query.order('created_at', { ascending: false }).limit(1500)),
    safeRows('subscriptions', 'id,user_id,status,plan_id,stripe_subscription_id,current_period_end,created_at,updated_at', query => query.limit(500)),
    safeRows('funeral_home_partners', 'id,organization_id,status,plan,monthly_fee_cents,stripe_subscription_id,created_at,updated_at', query => query.limit(500)),
  ]);

  const orgs = orgResult.rows;
  const members = memberResult.rows;
  const locations = locationResult.rows;
  const workflows = workflowResult.rows;
  const tasks = taskResult.rows;
  const events = eventResult.rows;
  const partners = partnerResult.rows;
  const subscriptions = subscriptionResult.rows;

  const orgIds = new Set(orgs.map(org => org.id));
  const workflowIdsByOrg = new Map();
  for (const workflow of workflows) {
    if (!orgIds.has(workflow.organization_id)) continue;
    const list = workflowIdsByOrg.get(workflow.organization_id) || [];
    list.push(workflow.id);
    workflowIdsByOrg.set(workflow.organization_id, list);
  }

  const accounts = orgs.map(org => {
    const orgWorkflows = workflows.filter(workflow => workflow.organization_id === org.id);
    const workflowIds = new Set(orgWorkflows.map(workflow => workflow.id));
    const orgTasks = tasks.filter(task => workflowIds.has(task.workflow_id));
    const orgEvents = events.filter(event => workflowIds.has(event.workflow_id));
    const orgMembers = members.filter(member => member.organization_id === org.id && String(member.status || 'active').toLowerCase() !== 'inactive');
    const orgLocations = locations.filter(location => location.organization_id === org.id && String(location.status || 'active').toLowerCase() !== 'archived');
    const partner = partners.find(row => row.organization_id === org.id) || null;
    const plan = partner?.plan || subscriptions.find(row => row.stripe_subscription_id === partner?.stripe_subscription_id)?.plan_id || '';
    const mrr = partner?.monthly_fee_cents != null ? Number(partner.monthly_fee_cents || 0) / 100 : moneyFromPlan(plan);
    const openTasks = orgTasks.filter(isOpenTask);
    const waitingTasks = openTasks.filter(isWaitingTask);
    const blockedTasks = openTasks.filter(isBlockedTask);
    const unassignedTasks = openTasks.filter(task => !hasOwner(task));
    const proofGaps = orgTasks.filter(task => !isOpenTask(task) && !proofText(task));
    const familyUpdateEvents = orgEvents.filter(event => /family|sent|delivered|acknowledged/i.test(`${event.status || ''} ${event.provider || ''}`));

    const gates = [
      gate('locations', 'Locations', orgLocations.length ? 'ready' : 'warning', `${orgLocations.length} active location record(s).`, 'Add real branches before multi-location rollout.'),
      gate('staff_roles', 'Staff and roles', orgMembers.length >= 2 ? 'ready' : orgMembers.length ? 'warning' : 'blocked', `${orgMembers.length} active staff/member record(s).`, 'Invite director plus at least one employee before calling this enterprise-ready.'),
      gate('case_volume', 'Cases loaded', orgWorkflows.length ? 'ready' : 'blocked', `${orgWorkflows.length} active case record(s).`, 'Create or import at least one real case.'),
      gate('ownership', 'Open work ownership', unassignedTasks.length ? 'warning' : openTasks.length ? 'ready' : 'warning', `${unassignedTasks.length} unassigned open work item(s).`, 'Assign every open work item to staff, family, participant, or Passage.'),
      gate('blockers', 'Blockers controlled', blockedTasks.length ? 'blocked' : 'ready', `${blockedTasks.length} blocker/failed/needs-review task(s).`, 'Clear blockers before expansion or paid conversion ask.'),
      gate('waiting_hygiene', 'Waiting clarity', waitingTasks.filter(task => !String(task.waiting_on || task.notes || '').trim()).length ? 'warning' : 'ready', `${waitingTasks.length} waiting work item(s).`, 'Every wait should name who or what is missing.'),
      gate('proof_audit', 'Proof and audit trail', orgEvents.length && proofGaps.length === 0 ? 'ready' : orgEvents.length ? 'warning' : 'blocked', `${orgEvents.length} status event(s), ${proofGaps.length} proof gap(s).`, 'Proof, actor, and timestamp must exist for real trust.'),
      gate('family_update', 'Family updates', familyUpdateEvents.length ? 'ready' : 'warning', `${familyUpdateEvents.length} family/delivery-style event(s).`, 'Make the family-facing update loop visible before relying on B2C.'),
      gate('billing', 'Billing path', partner?.stripe_subscription_id || mrr > 0 ? 'ready' : 'warning', mrr ? `$${Math.round(mrr)} MRR signal.` : 'No paid billing signal yet.', 'Tie enterprise readiness to pilot conversion and Stripe plan.'),
    ];

    const readinessScore = score(gates);
    const blocked = gates.filter(item => item.status === 'blocked').length;
    const warnings = gates.filter(item => item.status === 'warning').length;
    return {
      id: org.id,
      name: orgName(org),
      readinessScore,
      status: blocked ? 'blocked' : warnings ? 'needs_attention' : 'enterprise_ready',
      plan: plan || partner?.status || org.status || 'unknown',
      mrr,
      metrics: {
        locations: orgLocations.length,
        staff: orgMembers.length,
        cases: orgWorkflows.length,
        tasks: orgTasks.length,
        openTasks: openTasks.length,
        waitingTasks: waitingTasks.length,
        blockedTasks: blockedTasks.length,
        unassignedTasks: unassignedTasks.length,
        proofEvents: orgEvents.length,
        proofGaps: proofGaps.length,
        familyUpdates: familyUpdateEvents.length,
      },
      gates,
      nextAction: gates.find(item => item.status === 'blocked')?.action || gates.find(item => item.status === 'warning')?.action || 'Use this account as the reference enterprise funeral-home workflow.',
    };
  }).sort((a, b) => a.readinessScore - b.readinessScore || b.metrics.cases - a.metrics.cases);

  const gates = [
    gate('enterprise_accounts', 'Enterprise funeral-home accounts exist', accounts.length ? 'ready' : 'blocked', `${accounts.length} funeral-home-like organization(s) found.`, 'Create or classify real funeral-home organizations.'),
    gate('roles_locations', 'Roles and locations are modeled', accounts.some(account => account.metrics.staff >= 2 && account.metrics.locations >= 1) ? 'ready' : 'warning', 'Requires director/staff plus at least one active branch.', 'Make the B2B account structure real before expanding B2C.'),
    gate('case_task_work', 'Cases and work cards are active', accounts.some(account => account.metrics.cases && account.metrics.tasks) ? 'ready' : 'blocked', 'At least one account must have cases and work cards.', 'Create or import real cases and move work through the work-card flow.'),
    gate('audit_proof', 'Audit/proof trail exists', accounts.some(account => account.metrics.proofEvents > 0) ? 'ready' : 'blocked', 'At least one account must produce status/proof events.', 'Record handled/waiting/blocked events with actor and timestamp.'),
    gate('paid_path', 'Paid path is visible', accounts.some(account => account.mrr > 0) ? 'ready' : 'warning', 'At least one account should have an MRR or billing signal.', 'Connect account success to a Stripe paid plan.'),
  ];
  const readinessScore = score(gates);
  const blocked = gates.filter(item => item.status === 'blocked').length;

  return res.status(200).json({
    checkedAt: new Date().toISOString(),
    launchDecision: blocked ? 'blocked' : readinessScore >= 80 ? 'enterprise_ready' : 'needs_attention',
    readinessScore,
    summary: {
      accounts: accounts.length,
      enterpriseReady: accounts.filter(account => account.status === 'enterprise_ready').length,
      needsAttention: accounts.filter(account => account.status === 'needs_attention').length,
      blocked: accounts.filter(account => account.status === 'blocked').length,
      projectedArr: Math.round(accounts.reduce((sum, account) => sum + Number(account.mrr || 0) * 12, 0)),
    },
    gates,
    accounts: accounts.slice(0, 30),
    sourceErrors: [
      ['organizations', orgResult.error],
      ['organization_members', memberResult.error],
      ['organization_locations', locationResult.error],
      ['workflows', workflowResult.error],
      ['tasks', taskResult.error],
      ['task_status_events', eventResult.error],
      ['subscriptions', subscriptionResult.error],
      ['funeral_home_partners', partnerResult.error],
    ].filter(([, error]) => error).map(([source, error]) => ({ source, error })),
  });
}