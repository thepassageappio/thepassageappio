import { verifyDeliveryRequest, internalHeaders } from '../../../../lib/deliveryAuth';
import { serviceSupabase, isUuid } from '../../../../lib/taskStatus';
import { recordTaskCommunicationEvent } from '../../../../lib/communicationEvents';
import { getRequestIp, rateLimit } from '../../../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../../../lib/rateLimitPolicy';

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function taskSpine(task, {
  owner,
  waiting,
  proof,
  notification,
  deepLink,
  channel,
  recipient,
} = {}) {
  return {
    ask: task?.title || 'Assigned Passage task',
    owner: owner || task?.assigned_to_name || task?.assigned_to_email || recipient || null,
    waiting: waiting || 'Waiting for the recipient to accept, update, mark waiting, ask for help, or close with proof.',
    proof: proof || 'Delivery and task status stay attached to this task spine.',
    notification: notification || 'No external message has been sent yet.',
    channel: channel || 'email',
    recipient: recipient || task?.assigned_to_email || null,
    deepLink: deepLink || null,
  };
}

function cleanLimitKey(value, max = 160) {
  return String(value || '').replace(/[^a-zA-Z0-9@._:+-]/g, '').slice(0, max) || 'missing';
}

function outboundTaskLimitKey(req, { task, recipient, channel, actionType }) {
  return [
    'task-send',
    getRequestIp(req),
    cleanLimitKey(task?.workflow_id || 'no-workflow'),
    cleanLimitKey(task?.id || req.query?.id || 'no-task'),
    cleanLimitKey(recipient).toLowerCase(),
    cleanLimitKey(channel || 'email'),
    cleanLimitKey(actionType || 'execution'),
  ].join(':');
}

function enforceOutboundTaskLimit(req, args) {
  const policy = getRateLimitPolicy('outboundDelivery');
  if (!policy) return { allowed: true };
  return rateLimit({
    key: outboundTaskLimitKey(req, args),
    windowSeconds: policy.windowSeconds,
    maxRequests: policy.maxRequests,
  });
}

function userMessage(error) {
  const text = typeof error === 'string' ? error : error?.message || JSON.stringify(error || {});
  if (/rate|timeout|temporar|network|fetch/i.test(text)) return 'Failed to send - retry? The provider may be temporarily unavailable.';
  if (/recipient|email|phone|invalid|not verified/i.test(text)) return 'Failed to send - retry after checking the recipient.';
  return 'Failed to send - retry? ' + text.slice(0, 180);
}

async function postWithRetry(url, body, attempts = 2) {
  let last;
  for (let i = 0; i < attempts; i++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...internalHeaders() },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && !data.error) return { response, data };
    last = data.error || data || { message: response.statusText };
    if (![408, 429, 500, 502, 503, 504].includes(response.status)) break;
    await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
  }
  throw new Error(typeof last === 'string' ? last : last?.message || JSON.stringify(last || {}));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const taskId = String(req.query.id || '').trim();
  if (!taskId) return res.status(400).json({ error: 'Invalid task id.' });

  const { data: task, error } = await serviceSupabase
    .from('tasks')
    .select('id,workflow_id,title,description,status,assigned_to_name,assigned_to_email,waiting_on,proof_required')
    .eq('id', taskId)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  const channel = req.body?.channel || (req.body?.toPhone ? 'sms' : 'email');
  const recipient = req.body?.to || req.body?.toEmail || req.body?.toPhone || (channel === 'sms' ? '' : task.assigned_to_email);
  const deepLink = `${BASE_URL}/participating?estate=${encodeURIComponent(task.workflow_id)}&task=${encodeURIComponent(task.id)}`;
  if (!recipient) return res.status(400).json({
    error: 'Add a recipient before sending.',
    spine: taskSpine(task, {
      waiting: 'Waiting for a valid recipient email or phone before Passage can send the handoff.',
      proof: 'No message left the system.',
      notification: 'Blocked before delivery because no recipient was saved.',
      deepLink,
      channel,
    }),
  });
  const dryRun = req.body?.dryRun === true || req.body?.dryRun === '1' || req.query?.dryRun === '1';
  if (!dryRun) {
    const limit = enforceOutboundTaskLimit(req, { task, recipient, channel, actionType: req.body?.actionType || 'execution' });
    if (!limit.allowed) {
      res.setHeader('Retry-After', String(limit.retryAfterSeconds || 3600));
      return res.status(429).json({
        error: 'This task handoff was recently sent or retried too many times. Review the delivery trail before sending again.',
        retryAfterSeconds: limit.retryAfterSeconds,
        spine: taskSpine(task, {
          waiting: 'Waiting for the next allowed send window before another handoff goes out.',
          proof: 'Rate limit protected this task from duplicate outbound delivery.',
          notification: `Duplicate ${channel} send prevented for ${recipient}.`,
          deepLink,
          channel,
          recipient,
        }),
      });
    }
  }

  const basePayload = {
    to: recipient,
    toName: req.body?.toName || task.assigned_to_name || recipient,
    subject: req.body?.subject,
    taskTitle: req.body?.taskTitle || task.title,
    taskId,
    actionId: req.body?.actionId,
    deceasedName: req.body?.deceasedName,
    coordinatorName: req.body?.coordinatorName,
    workflowId: task.workflow_id,
    actionType: req.body?.actionType || 'execution',
    events: req.body?.events || [],
    messageText: req.body?.messageText,
    toEmail: req.body?.toEmail || task.assigned_to_email || '',
    cc: req.body?.cc,
    dryRun,
  };

  try {
    const sent = channel === 'sms'
      ? await postWithRetry(BASE_URL + '/api/sendSMS', basePayload, 2)
      : await postWithRetry(BASE_URL + '/api/sendEmail', basePayload, 2);

    return res.status(200).json({
      success: true,
      status: dryRun || sent.data?.skipped ? 'prepared' : 'sent',
      dryRun,
      skipped: dryRun || Boolean(sent.data?.skipped),
      providerId: sent.data?.id || sent.data?.sid || null,
      message: dryRun
        ? 'Message prepared for review. No email or SMS was sent.'
        : sent.data?.skipped
          ? 'Message prepared - delivery provider is not configured.'
          : 'Message sent - awaiting delivery confirmation.',
      spine: taskSpine(task, {
        waiting: dryRun
          ? 'Prepared only. Review and send when the family approves the handoff.'
          : 'Waiting for the recipient to open, accept, update, ask for help, or close with proof.',
        proof: dryRun
          ? 'Dry-run preview returned without calling the delivery provider.'
          : 'Provider handoff was requested and the delivery record is attached to the task.',
        notification: dryRun
          ? `Prepared ${channel} handoff for ${recipient}.`
          : `Sent ${channel} handoff to ${recipient}.`,
        deepLink,
        channel,
        recipient,
      }),
    });
  } catch (err) {
    await recordTaskCommunicationEvent({
      verb: 'escalate',
      workflowId: task.workflow_id,
      taskId: isUuid(taskId) ? taskId : null,
      actionId: req.body?.actionId,
      status: 'failed',
      actor: req.body?.coordinatorName || auth.user?.email || 'Passage',
      actorRole: auth.source === 'internal' ? 'system' : 'coordinator',
      channel,
      recipient,
      recipientRole: channel === 'sms' || channel === 'email' ? 'recipient' : '',
      detail: userMessage(err),
      provider: channel === 'sms' ? 'twilio' : 'resend',
    });
    return res.status(502).json({
      error: userMessage(err),
      spine: taskSpine(task, {
        waiting: 'Delivery failed. Confirm the recipient and retry the reviewed send action.',
        proof: userMessage(err),
        notification: `Failed ${channel} handoff for ${recipient}.`,
        deepLink,
        channel,
        recipient,
      }),
    });
  }
}
