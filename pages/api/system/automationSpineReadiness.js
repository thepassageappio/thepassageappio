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

function requestPath(req) {
  return String(req.url || '').split('?')[0] || '/api/system/automationSpineReadiness';
}

function enforceAdminRefreshLimit(req, access) {
  const policy = getRateLimitPolicy('adminReadiness');
  if (!policy) return { allowed: true };
  return rateLimit({
    key: ['automation-spine-readiness', requestPath(req), access.user?.email || access.source || 'internal', getRequestIp(req)].join(':'),
    windowSeconds: policy.windowSeconds,
    maxRequests: policy.maxRequests,
  });
}

function statusOf(row) {
  return String(row?.status || row?.delivery_status || '').trim().toLowerCase();
}

function isDone(row) {
  return DONE.has(statusOf(row));
}

function isWaiting(row) {
  return WAITING.has(statusOf(row));
}

function isBlocked(row) {
  return NEEDS_HELP.has(statusOf(row));
}

function ageHours(value) {
  const time = value ? new Date(value).getTime() : 0;
  if (!time || Number.isNaN(time)) return null;
  return Math.max(0, Math.round((Date.now() - time) / 36_000) / 10);
}

function isOlderThan(value, hours) {
  const age = ageHours(value);
  return age == null || age >= hours;
}

function recentSince(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
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

function hasOwner(task) {
  return Boolean(String(task?.assigned_to_email || task?.assigned_to_name || task?.recipient || '').trim());
}

function proofText(task) {
  return String(task?.notes || task?.waiting_on || task?.proof_required || task?.last_actor || '').trim();
}

function caseName(workflow) {
  return workflow?.deceased_name || workflow?.estate_name || workflow?.name || 'Unnamed case';
}

function summarizeCase(workflow, tasks, events, actions) {
  const openTasks = tasks.filter(task => !isDone(task));
  const blockedTasks = openTasks.filter(isBlocked);
  const waitingTasks = openTasks.filter(isWaiting);
  const unassignedOpen = openTasks.filter(task => !hasOwner(task));
  const staleOpen = openTasks.filter(task => isOlderThan(task.last_action_at || task.updated_at || task.created_at, 24));
  const waitingWithoutDetail = waitingTasks.filter(task => !String(task.waiting_on || task.notes || '').trim());
  const handledWithoutProof = tasks.filter(task => isDone(task) && !proofText(task));
  const caseActions = actions.filter(action => action.workflow_id === workflow.id);
  const staleActions = caseActions.filter(action => !isDone(action) && isOlderThan(action.last_action_at || action.updated_at, 48));
  const recentEvents = events.filter(event => event.workflow_id === workflow.id || event.task_id && tasks.some(task => task.id === event.task_id));

  const risks = [];
  if (!tasks.length) risks.push('No tasks are attached to this case.');
  if (unassignedOpen.length) risks.push(`${unassignedOpen.length} open task${unassignedOpen.length === 1 ? '' : 's'} lack an owner.`);
  if (blockedTasks.length) risks.push(`${blockedTasks.length} blocker${blockedTasks.length === 1 ? '' : 's'} need owner action.`);
  if (waitingWithoutDetail.length) risks.push(`${waitingWithoutDetail.length} waiting state${waitingWithoutDetail.length === 1 ? '' : 's'} lack detail.`);
  if (staleOpen.length) risks.push(`${staleOpen.length} open task${staleOpen.length === 1 ? '' : 's'} are stale past 24 hours.`);
  if (handledWithoutProof.length) risks.push(`${handledWithoutProof.length} handled task${handledWithoutProof.length === 1 ? '' : 's'} need proof notes.`);
  if (staleActions.length) risks.push(`${staleActions.length} workflow action${staleActions.length === 1 ? '' : 's'} drifted past 48 hours.`);
  if (!recentEvents.length && tasks.length) risks.push('No recent task-status event proves status is being recorded.');

  let grade = 'healthy';
  if (risks.length >= 3 || blockedTasks.length || staleOpen.length >= 3) grade = 'critical';
  else if (risks.length) grade = 'watch';

  return {
    id: workflow.id,
    name: caseName(workflow),
    status: workflow.status || 'active',
    updatedAt: workflow.updated_at || workflow.created_at || null,
    grade,
    metrics: {
      tasks: tasks.length,
      openTasks: openTasks.length,
      unassignedOpen: unassignedOpen.length,
      blocked: blockedTasks.length,
      waiting: waitingTasks.length,
      staleOpen: staleOpen.length,
      waitingWithoutDetail: waitingWithoutDetail.length,
      handledWithoutProof: handledWithoutProof.length,
      staleActions: staleActions.length,
      recentEvents: recentEvents.length,
    },
    risks: risks.slice(0, 5),
    nextAction: risks[0] || 'Keep the case moving and preserve proof on every closeout.',
  };
}

function gate(id, label, status, proof, action) {
  return { id, label, status, proof, action };
}

function scoreFromGates(gates) {
  if (!gates.length) return 0;
  const points = gates.reduce((sum, item) => {
    if (item.status === 'ready') return sum + 1;
    if (item.status === 'warning') return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((points / gates.length) * 100);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET for automation spine readiness.' });

  const access = await requireSystemAccess(req);
  if (!access.ok) return res.status(access.status || 401).json({ error: access.error });
  const limited = enforceAdminRefreshLimit(req, access);
  res.setHeader('Cache-Control', 'no-store');
  if (!limited.allowed) {
    res.setHeader('Retry-After', String(limited.retryAfterSeconds || 60));
    return res.status(429).json({ error: 'Readiness checks are cooling down. Try again shortly.', retryAfterSeconds: limited.retryAfterSeconds || 60 });
  }
  if (!admin) return res.status(500).json({ error: 'Supabase service role is not configured.' });

  const since = recentSince(7);
  const [workflowResult, taskResult, actionResult, eventResult, notificationResult] = await Promise.all([
    safeRows('workflows', 'id,name,estate_name,deceased_name,status,setup_stage,mode,organization_id,coordinator_email,orchestration_summary,updated_at,created_at', query => query.neq('status', 'archived').order('updated_at', { ascending: false }).limit(150)),
    safeRows('tasks', 'id,workflow_id,title,status,assigned_to_name,assigned_to_email,recipient,last_action_at,updated_at,created_at,waiting_on,notes,proof_required,follow_up_at,channel,last_actor', query => query.order('updated_at', { ascending: false }).limit(1000)),
    safeRows('workflow_actions', 'id,workflow_id,title,action,status,delivery_status,last_action_at,updated_at,recipient,channel,handled_at,delivered_at,acknowledged_at', query => query.order('updated_at', { ascending: false }).limit(1000)),
    safeRows('task_status_events', 'id,workflow_id,task_id,status,last_action_at,last_actor,channel,recipient,provider,provider_message_id,created_at', query => query.gte('created_at', since).order('created_at', { ascending: false }).limit(1000)),
    safeRows('notification_log', 'id,workflow_id,status,sent_at,delivered_at,error_message,created_at,channel,recipient_email,recipient_phone', query => query.gte('created_at', since).order('created_at', { ascending: false }).limit(1000)),
  ]);

  const workflows = workflowResult.rows;
  const workflowIds = new Set(workflows.map(workflow => workflow.id));
  const tasks = taskResult.rows.filter(task => workflowIds.has(task.workflow_id));
  const actions = actionResult.rows.filter(action => workflowIds.has(action.workflow_id));
  const events = eventResult.rows.filter(event => workflowIds.has(event.workflow_id));
  const notifications = notificationResult.rows.filter(item => workflowIds.has(item.workflow_id));

  const openTasks = tasks.filter(task => !isDone(task));
  const blockedTasks = openTasks.filter(isBlocked);
  const waitingTasks = openTasks.filter(isWaiting);
  const unassignedOpen = openTasks.filter(task => !hasOwner(task));
  const staleOpen = openTasks.filter(task => isOlderThan(task.last_action_at || task.updated_at || task.created_at, 24));
  const waitingWithoutDetail = waitingTasks.filter(task => !String(task.waiting_on || task.notes || '').trim());
  const handledWithoutProof = tasks.filter(task => isDone(task) && !proofText(task));
  const overdueFollowUps = openTasks.filter(task => task.follow_up_at && new Date(task.follow_up_at).getTime() < Date.now());
  const staleActions = actions.filter(action => !isDone(action) && isOlderThan(action.last_action_at || action.updated_at, 48));
  const messageRouteGaps = actions.filter(action => !isDone(action) && String(action.channel || '').trim() && !String(action.recipient || '').trim());
  const cardContractGaps = openTasks.filter(task => !hasOwner(task) || !String(task.waiting_on || task.recipient || task.notes || '').trim()).length + handledWithoutProof.length;
  const deliveryFailures = notifications.filter(item => /fail|bounce|error|undeliver/i.test(String(item.status || item.error_message || '')));
  const providerEvents = events.filter(event => event.provider || event.provider_message_id);

  const caseSummaries = workflows.map(workflow => summarizeCase(
    workflow,
    tasks.filter(task => task.workflow_id === workflow.id),
    events,
    actions
  )).sort((a, b) => {
    const rank = { critical: 0, watch: 1, healthy: 2 };
    return (rank[a.grade] ?? 3) - (rank[b.grade] ?? 3) || (b.metrics.openTasks - a.metrics.openTasks);
  });

  const gates = [
    gate('case_task_seed', 'Every active case has a task spine', caseSummaries.some(item => item.metrics.tasks === 0) ? 'blocked' : 'ready', `${caseSummaries.filter(item => item.metrics.tasks === 0).length} active case(s) have no tasks.`, 'Seed tasks before the case is sold as operational.'),
    gate('owner_assignment', 'Open tasks have owners', unassignedOpen.length ? 'warning' : 'ready', `${unassignedOpen.length} open task(s) have no owner.`, 'Assign a staff member, family owner, or Passage owner to every open task.'),
    gate('waiting_hygiene', 'Waiting states name what is missing', waitingWithoutDetail.length ? 'warning' : 'ready', `${waitingWithoutDetail.length} waiting task(s) lack waiting_on or notes detail.`, 'Require a short waiting reason before staff can leave a task in waiting.'),
    gate('blocker_queue', 'Blockers are visible and small', blockedTasks.length ? 'blocked' : 'ready', `${blockedTasks.length} task(s) are blocked, failed, or need review.`, 'Clear blockers before conversion asks or high-volume onboarding.'),
    gate('stale_sla', 'At-need work is fresh inside 24 hours', staleOpen.length ? 'blocked' : 'ready', `${staleOpen.length} open task(s) are stale past 24 hours.`, 'Refresh stale at-need work or record a waiting reason.'),
    gate('proof_capture', 'Handled work has proof', handledWithoutProof.length ? 'warning' : 'ready', `${handledWithoutProof.length} handled task(s) lack proof notes or saved detail.`, 'Require proof, reference, timestamp, or actor before closeout.'),
    gate('card_contract', 'Cards explain action, owner, waiting party, and proof', cardContractGaps ? 'warning' : 'ready', `${cardContractGaps} open or handled task card(s) miss the simple action/owner/waiting/proof contract.`, 'Every visible task or request card should answer what to do, who owns it, who or what is waiting, what message is prepared, and where proof saves.'),
    gate('message_route_hygiene', 'Prepared messages have a route', messageRouteGaps.length ? 'blocked' : 'ready', `${messageRouteGaps.length} open workflow action(s) have a channel without a recipient.`, 'Do not show a prepared send action until the person, channel, and privacy boundary are clear.'),
    gate('follow_up_queue', 'Follow-up promises do not expire silently', overdueFollowUps.length ? 'warning' : 'ready', `${overdueFollowUps.length} open task(s) have overdue follow-up timestamps.`, 'Send reminder, clear the wait, or update the next follow-up.'),
    gate('delivery_telemetry', 'Delivery and status events are flowing', events.length ? (deliveryFailures.length ? 'warning' : 'ready') : 'warning', `${events.length} task status event(s), ${providerEvents.length} provider event(s), ${deliveryFailures.length} delivery failure(s) in 7 days.`, 'Confirm reminders/webhooks are writing status events and failures are visible.'),
    gate('workflow_action_drift', 'Workflow actions do not drift', staleActions.length ? 'warning' : 'ready', `${staleActions.length} workflow action(s) are open past 48 hours.`, 'Either close, reassign, or turn the action into a named blocker.'),
    gate('reminder_runtime', 'Reminder runtime can authenticate itself', process.env.PASSAGE_INTERNAL_API_SECRET ? 'ready' : 'blocked', process.env.PASSAGE_INTERNAL_API_SECRET ? 'Internal orchestration secret is configured.' : 'PASSAGE_INTERNAL_API_SECRET is missing.', 'Configure the internal secret before relying on scheduled reminders.'),
    gate('email_runtime', 'Outbound email provider is configured', process.env.RESEND_API_KEY ? 'ready' : 'warning', process.env.RESEND_API_KEY ? 'Resend API key is configured.' : 'RESEND_API_KEY is not configured.', 'Configure email before promising automated family or staff reminders.'),
  ];

  const readinessScore = scoreFromGates(gates);
  const blocked = gates.filter(item => item.status === 'blocked').length;
  const warnings = gates.filter(item => item.status === 'warning').length;
  const launchDecision = blocked
    ? 'blocked'
    : warnings
      ? 'needs_attention'
      : 'healthy';

  return res.status(200).json({
    checkedAt: new Date().toISOString(),
    launchDecision,
    readinessScore,
    summary: {
      activeCases: workflows.length,
      totalTasks: tasks.length,
      openTasks: openTasks.length,
      waitingTasks: waitingTasks.length,
      blockedTasks: blockedTasks.length,
      unassignedOpenTasks: unassignedOpen.length,
      staleOpenTasks: staleOpen.length,
      handledWithoutProof: handledWithoutProof.length,
      cardContractGaps,
      messageRouteGaps: messageRouteGaps.length,
      overdueFollowUps: overdueFollowUps.length,
      staleWorkflowActions: staleActions.length,
      statusEventsLast7Days: events.length,
      deliveryFailuresLast7Days: deliveryFailures.length,
      blockedGates: blocked,
      warningGates: warnings,
    },
    gates,
    cases: caseSummaries.slice(0, 25),
    sourceErrors: [
      ['workflows', workflowResult.error],
      ['tasks', taskResult.error],
      ['workflow_actions', actionResult.error],
      ['task_status_events', eventResult.error],
      ['notification_log', notificationResult.error],
    ].filter(([, error]) => error).map(([source, error]) => ({ source, error })),
    refreshPolicy: { minSeconds: 60, reason: 'Readiness checks are protected by the adminReadiness rate limit.' },
  });
}