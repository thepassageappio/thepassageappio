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

const CONVERSION_PLAN_PRICES = {
  partner_local: { id: 'partner_local', label: 'Single location', mrr: 249.99 },
  partner_group: { id: 'partner_group', label: 'Multi-location', mrr: 349.99 },
};

function moneyFromPlan(planId) {
  const plan = String(planId || '').toLowerCase();
  if (plan.includes('group')) return CONVERSION_PLAN_PRICES.partner_group.mrr;
  if (plan.includes('local') || plan.includes('single')) return CONVERSION_PLAN_PRICES.partner_local.mrr;
  if (plan.includes('pilot')) return 99.99;
  return 0;
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function targetPlanFor({ billing, cases, staff }) {
  const current = String(billing?.planId || '').toLowerCase();
  if (current.includes('group') || current.includes('multi')) return CONVERSION_PLAN_PRICES.partner_group;
  if (Number(staff || 0) >= 3 || Number(cases || 0) >= 5) return CONVERSION_PLAN_PRICES.partner_group;
  return CONVERSION_PLAN_PRICES.partner_local;
}

function billingStatus(billing) {
  return String(billing?.status || '').toLowerCase();
}

function isFreePilotBilling(billing) {
  const plan = String(billing?.planId || '').toLowerCase();
  const monthlyFee = billing?.monthlyFeeCents == null ? null : Number(billing.monthlyFeeCents);
  return plan.includes('pilot') && monthlyFee === 0;
}

function healthStage({ billing, cases, staff, familyUpdates, proofEvents }) {
  const status = billingStatus(billing);
  if ((status === 'active' || status === 'paid') && !isFreePilotBilling(billing)) return 'paid_active';
  if (cases >= 3 && staff >= 2 && familyUpdates >= 2 && proofEvents >= 3) return 'value_proven';
  if (cases >= 1 && staff >= 1) return 'pilot_active';
  if (status === 'trialing' || status === 'pilot' || isFreePilotBilling(billing)) return 'pilot_invited';
  return 'needs_activation';
}

function nextActionFor(stage) {
  if (stage === 'paid_active') return 'Monitor usage, expansion locations, and churn risk.';
  if (stage === 'value_proven') return 'Ask for paid conversion or expansion before the pilot cools off.';
  if (stage === 'pilot_active') return 'Drive first family update, first staff proof, and first export.';
  if (stage === 'pilot_invited') return 'Schedule onboarding and create the first case with staff assignment.';
  return 'Confirm decision maker, invite workspace owner, and book setup call.';
}

function billingFromRows(subscription, partner) {
  if (subscription) {
    return {
      source: 'subscriptions',
      status: subscription.status,
      planId: subscription.plan_id,
      currentPeriodEnd: subscription.current_period_end,
      stripeSubscriptionId: subscription.stripe_subscription_id || null,
      monthlyFeeCents: null,
    };
  }
  if (partner) {
    return {
      source: 'funeral_home_partners',
      status: partner.status,
      planId: partner.plan,
      currentPeriodEnd: null,
      stripeSubscriptionId: partner.stripe_subscription_id || null,
      monthlyFeeCents: partner.monthly_fee_cents == null ? null : Number(partner.monthly_fee_cents),
    };
  }
  return null;
}

async function countBy(table, column, value, extra = null) {
  if (!admin || !value) return 0;
  let query = admin.from(table).select('id', { count: 'exact', head: true }).eq(column, value);
  if (extra) query = extra(query);
  const { count } = await query.then(result => result, () => ({ count: 0 }));
  return count || 0;
}

async function countIn(table, column, values, extra = null) {
  const list = (values || []).filter(Boolean);
  if (!admin || !list.length) return 0;
  let query = admin.from(table).select('id', { count: 'exact', head: true }).in(column, list);
  if (extra) query = extra(query);
  const { count } = await query.then(result => result, () => ({ count: 0 }));
  return count || 0;
}

async function rowsIn(table, column, values, select, configure = null) {
  const list = (values || []).filter(Boolean);
  if (!admin || !list.length) return [];
  let query = admin.from(table).select(select).in(column, list);
  if (configure) query = configure(query);
  const { data } = await query.then(result => result, () => ({ data: [] }));
  return data || [];
}

function isHandledTask(task) {
  return ['handled', 'complete', 'completed', 'done', 'approved'].includes(String(task?.status || '').toLowerCase());
}

function isWaitingTask(task) {
  const status = String(task?.status || '').toLowerCase();
  return status === 'waiting' || status === 'pending_external' || !!task?.waiting_on;
}

function isBlockedTask(task) {
  const status = String(task?.status || '').toLowerCase();
  return ['blocked', 'needs_help', 'stuck', 'escalated'].includes(status);
}

function taskEvidenceLabel(task, fallback = '') {
  if (!task) return '';
  return [task.title, task.waiting_on || task.notes || task.proof_required || fallback].filter(Boolean).join(': ');
}

function summarizeTaskEvidence(tasks, fallback = '') {
  return (tasks || []).map(task => taskEvidenceLabel(task, fallback)).filter(Boolean).slice(0, 3);
}

function conversionRecommendationFor({ stage, readiness, billing, cases, staff }) {
  const targetPlan = targetPlanFor({ billing, cases, staff });
  const paidMrr = billing?.monthlyFeeCents == null ? 0 : Math.max(0, Number(billing.monthlyFeeCents) / 100);
  const mrr = stage === 'paid_active' && paidMrr ? paidMrr : targetPlan.mrr;
  const arr = roundMoney(mrr * 12);
  const launchGrade = readiness?.launchGrade || 'needs_activation';
  if (stage === 'paid_active') {
    return {
      status: 'retain',
      label: 'Retain',
      tone: 'good',
      askReady: false,
      targetPlanId: targetPlan.id,
      targetPlanLabel: targetPlan.label,
      targetMrr: roundMoney(mrr),
      targetArr: arr,
      paidArr: arr,
      askReadyArr: 0,
      action: 'Keep proof fresh, watch churn risk, and look for extra locations or staff seats.',
    };
  }
  if (launchGrade === 'conversion_ready' || launchGrade === 'proof_ready') {
    return {
      status: 'ask_now',
      label: 'Ask now',
      tone: 'good',
      askReady: true,
      targetPlanId: targetPlan.id,
      targetPlanLabel: targetPlan.label,
      targetMrr: roundMoney(targetPlan.mrr),
      targetArr: roundMoney(targetPlan.mrr * 12),
      paidArr: 0,
      askReadyArr: roundMoney(targetPlan.mrr * 12),
      action: 'Ask for ' + targetPlan.label + ' at   const handledTasks = taskRows.filter(isHandledTask);
  const waitingTasks = taskRows.filter(isWaitingTask);
  const blockedTasks = taskRows.filter(isBlockedTask);
  const openTasks = taskRows.filter(task => !isHandledTask(task));
  const recentProofTasks = handledTasks.filter(task => task.notes || task.proof_required || task.last_action_at);
  let score = 0;
  if (cases > 0) score += 15;
  if (staff > 0) score += 15;
  if (taskRows.length > 0) score += 15;
  if (handledTasks.length > 0 || proofEvents > 0) score += 20;
  if (familyUpdates > 0) score += 20;
  if (billing) score += 15;
  if (blockedTasks.length > 0) score = Math.max(0, score - 15);
  const exportReady = cases > 0 && taskRows.length > 0 && (handledTasks.length > 0 || proofEvents > 0 || familyUpdates > 0);
  const launchGrade = stage === 'paid_active' ? 'retention_ready'
    : stage === 'value_proven' ? 'conversion_ready'
    : blockedTasks.length ? 'clear_blockers'
    : exportReady ? 'proof_ready'
    : cases && staff ? 'needs_proof'
    : 'needs_activation';
  return {
    score,
    launchGrade,
    exportReady,
    openTasks: openTasks.length,
    waitingTasks: waitingTasks.length,
    blockedTasks: blockedTasks.length,
    handledTasks: handledTasks.length,
    recentProofTasks: recentProofTasks.length,
    waitingDetail: summarizeTaskEvidence(waitingTasks, 'Waiting on confirmation'),
    blockedDetail: summarizeTaskEvidence(blockedTasks, 'Needs owner help'),
    recentProofDetail: summarizeTaskEvidence(recentProofTasks, 'Proof saved'),
    lastTaskActionAt: taskRows.map(task => task.last_action_at).filter(Boolean).sort().reverse()[0] || null,
  };
}

async function workflowEvidenceForOrganization(organizationId) {
  if (!admin || !organizationId) return { cases: 0, workflowIds: [] };
  const { data, count } = await admin
    .from('workflows')
    .select('id', { count: 'exact' })
    .eq('organization_id', organizationId)
    .then(result => result, () => ({ data: [], count: 0 }));
  return {
    cases: count || (data || []).length,
    workflowIds: (data || []).map(row => row.id).filter(Boolean),
  };
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
  let partnerBilling = [];
  if (organizationIds.length) {
    const [{ data: subscriptionRows }, { data: partnerRows }] = await Promise.all([
      admin
        .from('subscriptions')
        .select('id,organization_id,status,plan_id,current_period_end,stripe_subscription_id,created_at')
        .in('organization_id', organizationIds)
        .then(result => result, () => ({ data: [] })),
      admin
        .from('funeral_home_partners')
        .select('id,organization_id,status,plan,monthly_fee_cents,stripe_subscription_id,subscribed_at,updated_at')
        .in('organization_id', organizationIds)
        .then(result => result, () => ({ data: [] })),
    ]);
    subscriptions = subscriptionRows || [];
    partnerBilling = partnerRows || [];
  }

  const rows = [];
  for (const org of organizations || []) {
    const subscription = subscriptions.find(row => row.organization_id === org.id) || null;
    const partner = partnerBilling.find(row => row.organization_id === org.id) || null;
    const billing = billingFromRows(subscription, partner);
    const workflowEvidence = await workflowEvidenceForOrganization(org.id);
    const workflowIds = workflowEvidence.workflowIds;
    const cases = workflowEvidence.cases;
    const staff = await countBy('organization_members', 'organization_id', org.id);
    const taskRows = await rowsIn(
      'tasks',
      'workflow_id',
      workflowIds,
      'id,workflow_id,title,status,last_action_at,last_actor,waiting_on,notes,proof_required',
      query => query.order('last_action_at', { ascending: false, nullsFirst: false })
    );
    const tasks = taskRows.length;
    const proofEvents = await countIn('task_status_events', 'workflow_id', workflowIds);
    const notifications = await countIn('notification_log', 'workflow_id', workflowIds);
    const familyUpdates = await countIn('announcements', 'estate_id', workflowIds);
    const stage = healthStage({ billing, cases, staff, familyUpdates, proofEvents });
    const readiness = readinessFor({ stage, billing, cases, staff, taskRows, familyUpdates, proofEvents });
    const conversion = conversionRecommendationFor({ stage, readiness, billing, cases, staff });
    const partnerMonthlyFee = billing?.monthlyFeeCents == null ? 0 : Math.max(0, Number(billing.monthlyFeeCents) / 100);
    const mrrPotential = partnerMonthlyFee || moneyFromPlan(billing?.planId || (stage === 'value_proven' ? 'partner_local' : 'partner_pilot'));

    rows.push({
      organizationId: org.id,
      name: org.name,
      supportEmail: org.support_email,
      createdAt: org.created_at,
      stage,
      nextAction: nextActionFor(stage),
      subscription: billing,
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
      readiness,
      conversion,
      blockers: [
        cases ? null : 'No partner case yet.',
        staff ? null : 'No staff member recorded yet.',
        proofEvents ? null : 'No proof/status event yet.',
        familyUpdates ? null : 'No family update/announcement proof yet.',
        billing ? null : 'No subscription or funeral-home partner billing row found.',
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
    acc.openTasks += row.readiness?.openTasks || 0;
    acc.waitingTasks += row.readiness?.waitingTasks || 0;
    acc.blockedTasks += row.readiness?.blockedTasks || 0;
    acc.handledTasks += row.readiness?.handledTasks || 0;
    acc.exportReadyAccounts += row.readiness?.exportReady ? 1 : 0;
    acc.askReadyAccounts += row.conversion?.askReady ? 1 : 0;
    acc.blockedConversionAsks += row.conversion?.status === 'clear_blocker' ? 1 : 0;
    acc.paidArr += row.conversion?.paidArr || 0;
    acc.askReadyArr += row.conversion?.askReadyArr || 0;
    acc.readinessScoreTotal += row.readiness?.score || 0;
    acc.byStage[row.stage] = (acc.byStage[row.stage] || 0) + 1;
    acc.byLaunchGrade[row.readiness?.launchGrade || 'unknown'] = (acc.byLaunchGrade[row.readiness?.launchGrade || 'unknown'] || 0) + 1;
    acc.byConversionStatus[row.conversion?.status || 'unknown'] = (acc.byConversionStatus[row.conversion?.status || 'unknown'] || 0) + 1;
    return acc;
  }, { accounts: 0, cases: 0, staff: 0, proofEvents: 0, familyUpdates: 0, mrrPotential: 0, arrPotential: 0, openTasks: 0, waitingTasks: 0, blockedTasks: 0, handledTasks: 0, exportReadyAccounts: 0, askReadyAccounts: 0, blockedConversionAsks: 0, paidArr: 0, askReadyArr: 0, readinessScoreTotal: 0, byStage: {}, byLaunchGrade: {}, byConversionStatus: {} });

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
      arrPotential: roundMoney(totals.arrPotential),
      gapTo300kArr: Math.max(0, roundMoney(300000 - totals.arrPotential)),
      paidArr: roundMoney(totals.paidArr),
      askReadyArr: roundMoney(totals.askReadyArr),
      projectedArr: roundMoney(totals.paidArr + totals.askReadyArr),
      remainingGapTo300kArr: Math.max(0, roundMoney(300000 - totals.paidArr - totals.askReadyArr)),
      averageReadinessScore: totals.accounts ? Math.round(totals.readinessScoreTotal / totals.accounts) : 0,
    },
    rows,
  });
}
 + targetPlan.mrr.toFixed(2) + '/mo while the pilot proof is still warm.',
    };
  }
  if (launchGrade === 'clear_blockers') {
    return {
      status: 'clear_blocker',
      label: 'Clear blocker',
      tone: 'risk',
      askReady: false,
      targetPlanId: targetPlan.id,
      targetPlanLabel: targetPlan.label,
      targetMrr: roundMoney(targetPlan.mrr),
      targetArr: 0,
      paidArr: 0,
      askReadyArr: 0,
      action: 'Resolve the named blocker before making the paid conversion ask.',
    };
  }
  if (launchGrade === 'needs_proof') {
    return {
      status: 'prove_value',
      label: 'Prove value',
      tone: 'warn',
      askReady: false,
      targetPlanId: targetPlan.id,
      targetPlanLabel: targetPlan.label,
      targetMrr: roundMoney(targetPlan.mrr),
      targetArr: 0,
      paidArr: 0,
      askReadyArr: 0,
      action: 'Complete one family update, one handled proof event, and one export before asking for payment.',
    };
  }
  return {
    status: 'activate',
    label: 'Activate',
    tone: 'warn',
    askReady: false,
    targetPlanId: targetPlan.id,
    targetPlanLabel: targetPlan.label,
    targetMrr: roundMoney(targetPlan.mrr),
    targetArr: 0,
    paidArr: 0,
    askReadyArr: 0,
    action: 'Create the first case, add staff, and move one task through the spine.',
  };
}

function readinessFor({ stage, billing, cases, staff, taskRows, familyUpdates, proofEvents }) {
  const handledTasks = taskRows.filter(isHandledTask);
  const waitingTasks = taskRows.filter(isWaitingTask);
  const blockedTasks = taskRows.filter(isBlockedTask);
  const openTasks = taskRows.filter(task => !isHandledTask(task));
  const recentProofTasks = handledTasks.filter(task => task.notes || task.proof_required || task.last_action_at);
  let score = 0;
  if (cases > 0) score += 15;
  if (staff > 0) score += 15;
  if (taskRows.length > 0) score += 15;
  if (handledTasks.length > 0 || proofEvents > 0) score += 20;
  if (familyUpdates > 0) score += 20;
  if (billing) score += 15;
  if (blockedTasks.length > 0) score = Math.max(0, score - 15);
  const exportReady = cases > 0 && taskRows.length > 0 && (handledTasks.length > 0 || proofEvents > 0 || familyUpdates > 0);
  const launchGrade = stage === 'paid_active' ? 'retention_ready'
    : stage === 'value_proven' ? 'conversion_ready'
    : blockedTasks.length ? 'clear_blockers'
    : exportReady ? 'proof_ready'
    : cases && staff ? 'needs_proof'
    : 'needs_activation';
  return {
    score,
    launchGrade,
    exportReady,
    openTasks: openTasks.length,
    waitingTasks: waitingTasks.length,
    blockedTasks: blockedTasks.length,
    handledTasks: handledTasks.length,
    recentProofTasks: recentProofTasks.length,
    waitingDetail: summarizeTaskEvidence(waitingTasks, 'Waiting on confirmation'),
    blockedDetail: summarizeTaskEvidence(blockedTasks, 'Needs owner help'),
    recentProofDetail: summarizeTaskEvidence(recentProofTasks, 'Proof saved'),
    lastTaskActionAt: taskRows.map(task => task.last_action_at).filter(Boolean).sort().reverse()[0] || null,
  };
}

async function workflowEvidenceForOrganization(organizationId) {
  if (!admin || !organizationId) return { cases: 0, workflowIds: [] };
  const { data, count } = await admin
    .from('workflows')
    .select('id', { count: 'exact' })
    .eq('organization_id', organizationId)
    .then(result => result, () => ({ data: [], count: 0 }));
  return {
    cases: count || (data || []).length,
    workflowIds: (data || []).map(row => row.id).filter(Boolean),
  };
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
  let partnerBilling = [];
  if (organizationIds.length) {
    const [{ data: subscriptionRows }, { data: partnerRows }] = await Promise.all([
      admin
        .from('subscriptions')
        .select('id,organization_id,status,plan_id,current_period_end,stripe_subscription_id,created_at')
        .in('organization_id', organizationIds)
        .then(result => result, () => ({ data: [] })),
      admin
        .from('funeral_home_partners')
        .select('id,organization_id,status,plan,monthly_fee_cents,stripe_subscription_id,subscribed_at,updated_at')
        .in('organization_id', organizationIds)
        .then(result => result, () => ({ data: [] })),
    ]);
    subscriptions = subscriptionRows || [];
    partnerBilling = partnerRows || [];
  }

  const rows = [];
  for (const org of organizations || []) {
    const subscription = subscriptions.find(row => row.organization_id === org.id) || null;
    const partner = partnerBilling.find(row => row.organization_id === org.id) || null;
    const billing = billingFromRows(subscription, partner);
    const workflowEvidence = await workflowEvidenceForOrganization(org.id);
    const workflowIds = workflowEvidence.workflowIds;
    const cases = workflowEvidence.cases;
    const staff = await countBy('organization_members', 'organization_id', org.id);
    const taskRows = await rowsIn(
      'tasks',
      'workflow_id',
      workflowIds,
      'id,workflow_id,title,status,last_action_at,last_actor,waiting_on,notes,proof_required',
      query => query.order('last_action_at', { ascending: false, nullsFirst: false })
    );
    const tasks = taskRows.length;
    const proofEvents = await countIn('task_status_events', 'workflow_id', workflowIds);
    const notifications = await countIn('notification_log', 'workflow_id', workflowIds);
    const familyUpdates = await countIn('announcements', 'estate_id', workflowIds);
    const stage = healthStage({ billing, cases, staff, familyUpdates, proofEvents });
    const readiness = readinessFor({ stage, billing, cases, staff, taskRows, familyUpdates, proofEvents });
    const partnerMonthlyFee = billing?.monthlyFeeCents == null ? 0 : Math.max(0, Number(billing.monthlyFeeCents) / 100);
    const mrrPotential = partnerMonthlyFee || moneyFromPlan(billing?.planId || (stage === 'value_proven' ? 'partner_local' : 'partner_pilot'));

    rows.push({
      organizationId: org.id,
      name: org.name,
      supportEmail: org.support_email,
      createdAt: org.created_at,
      stage,
      nextAction: nextActionFor(stage),
      subscription: billing,
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
      readiness,
      blockers: [
        cases ? null : 'No partner case yet.',
        staff ? null : 'No staff member recorded yet.',
        proofEvents ? null : 'No proof/status event yet.',
        familyUpdates ? null : 'No family update/announcement proof yet.',
        billing ? null : 'No subscription or funeral-home partner billing row found.',
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
    acc.openTasks += row.readiness?.openTasks || 0;
    acc.waitingTasks += row.readiness?.waitingTasks || 0;
    acc.blockedTasks += row.readiness?.blockedTasks || 0;
    acc.handledTasks += row.readiness?.handledTasks || 0;
    acc.exportReadyAccounts += row.readiness?.exportReady ? 1 : 0;
    acc.readinessScoreTotal += row.readiness?.score || 0;
    acc.byStage[row.stage] = (acc.byStage[row.stage] || 0) + 1;
    acc.byLaunchGrade[row.readiness?.launchGrade || 'unknown'] = (acc.byLaunchGrade[row.readiness?.launchGrade || 'unknown'] || 0) + 1;
    return acc;
  }, { accounts: 0, cases: 0, staff: 0, proofEvents: 0, familyUpdates: 0, mrrPotential: 0, arrPotential: 0, openTasks: 0, waitingTasks: 0, blockedTasks: 0, handledTasks: 0, exportReadyAccounts: 0, readinessScoreTotal: 0, byStage: {}, byLaunchGrade: {} });

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
      averageReadinessScore: totals.accounts ? Math.round(totals.readinessScoreTotal / totals.accounts) : 0,
    },
    rows,
  });
}
