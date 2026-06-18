import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest, internalHeaders } from '../../../../lib/deliveryAuth';
import { recordStatusEvent } from '../../../../lib/taskStatus';
import { getRequestIp, rateLimit } from '../../../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../../../lib/rateLimitPolicy';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function cleanLimitKey(value, max = 160) {
  return String(value || '').replace(/[^a-zA-Z0-9@._:+-]/g, '').slice(0, max) || 'missing';
}

function reminderLimitKey(req, task, recipientEmail) {
  return [
    'task-reminder',
    getRequestIp(req),
    cleanLimitKey(task?.workflow_id || 'no-workflow'),
    cleanLimitKey(task?.id || req.query?.id || 'no-task'),
    cleanLimitKey(recipientEmail).toLowerCase(),
  ].join(':');
}

function enforceReminderLimit(req, task, recipientEmail) {
  const policy = getRateLimitPolicy('outboundDelivery');
  if (!policy) return { allowed: true };
  return rateLimit({ key: reminderLimitKey(req, task, recipientEmail), windowSeconds: policy.windowSeconds, maxRequests: policy.maxRequests });
}

function siteUrl(req) {
  return (process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host || 'www.thepassageapp.io'}`).replace(/\/$/, '');
}

function taskSpine(task, {
  waiting,
  proof,
  notification,
  deepLink,
  recipient,
} = {}) {
  return {
    ask: task?.title || 'Assigned Passage request',
    owner: task?.assigned_to_name || task?.assigned_to_email || recipient || null,
    waiting: waiting || 'Waiting for the assigned person to update this request.',
    proof: proof || 'Reminder status stays attached to this family record.',
    notification: notification || 'No reminder has been sent yet.',
    channel: 'email',
    recipient: recipient || task?.assigned_to_email || null,
    deepLink: deepLink || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const taskId = req.query.id;
  const { actor, message } = req.body || {};
  const dryRun = req.body?.dryRun === true || req.body?.dryRun === '1' || req.query?.dryRun === '1';

  const { data: task, error } = await supabase
    .from('tasks')
    .select('id,workflow_id,title,assigned_to_name,assigned_to_email,recipient,channel,last_actor,status')
    .eq('id', taskId)
    .maybeSingle();

  if (error || !task) return res.status(404).json({ error: 'Request not found.' });

  const base = siteUrl(req);
  const link = `${base}/participating?estate=${encodeURIComponent(task.workflow_id)}&task=${encodeURIComponent(task.id)}`;
  const recipientEmail = task.assigned_to_email || (String(task.recipient || '').includes('@') ? task.recipient : '');
  if (!recipientEmail) {
    await recordStatusEvent({
      workflowId: task.workflow_id,
      taskId: task.id,
      status: 'waiting',
      actor: actor || 'Passage',
      channel: 'record',
      recipient: task.assigned_to_name || task.recipient || '',
      detail: 'Reminder blocked because this request has no assigned email. Assign an owner before sending a reminder.',
    });
    return res.status(400).json({
      error: 'Assign this request to someone with an email before sending a reminder.',
      needsAssignment: true,
      taskId: task.id,
      taskTitle: task.title,
      spine: taskSpine(task, {
        waiting: 'Waiting for a valid assigned email before Passage can send the reminder.',
        proof: 'Reminder blocked before delivery.',
        notification: 'No reminder was sent.',
        deepLink: link,
      }),
    });
  }

  const body = message || `A gentle reminder from Passage: ${task.title || 'your assigned task'} is still waiting for your confirmation. You can accept, mark handled, or ask for help here: ${link}`;
  if (!dryRun) {
    const limit = enforceReminderLimit(req, task, recipientEmail);
    if (!limit.allowed) {
      res.setHeader('Retry-After', String(limit.retryAfterSeconds || 3600));
      return res.status(429).json({
        error: 'This reminder was recently sent or retried too many times. Review the delivery trail before sending again.',
        retryAfterSeconds: limit.retryAfterSeconds,
        spine: taskSpine(task, {
          waiting: 'Waiting for the next allowed reminder window before another email goes out.',
          proof: 'Rate limit protected this request from duplicate reminder delivery.',
          notification: 'Duplicate reminder prevented for ' + (task.assigned_to_name || recipientEmail),
          deepLink: link,
          recipient: recipientEmail,
        }),
      });
    }
  }

  const send = await fetch(`${base}/api/sendEmail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...internalHeaders() },
    body: JSON.stringify({
      to: recipientEmail,
      toName: task.assigned_to_name || recipientEmail,
      subject: 'Reminder: Passage request waiting for you',
      taskTitle: task.title,
      taskId: task.id,
      workflowId: task.workflow_id,
      actionType: 'execution',
      coordinatorName: actor || 'Passage',
      messageText: body,
      dryRun,
    }),
  }).catch(() => null);
  const sendJson = send ? await send.json().catch(() => ({})) : {};

  if (!send || !send.ok || sendJson.error) {
    await recordStatusEvent({
      workflowId: task.workflow_id,
      taskId: task.id,
      status: 'failed',
      actor: actor || 'Passage',
      channel: 'email',
      recipient: task.assigned_to_name || recipientEmail,
      detail: 'Reminder failed to send to ' + (task.assigned_to_name || recipientEmail),
      provider: 'resend',
    });
    return res.status(502).json({
      error: sendJson.error || 'Reminder could not be sent.',
      spine: taskSpine(task, {
        waiting: 'Reminder failed. Confirm the assigned email and try again.',
        proof: sendJson.error || 'Reminder delivery failed.',
        notification: 'Failed reminder to ' + (task.assigned_to_name || recipientEmail),
        deepLink: link,
        recipient: recipientEmail,
      }),
    });
  }

  if (!dryRun) {
    await supabase.from('tasks').update({ follow_up_at: new Date().toISOString() }).eq('id', task.id).then(() => {}, () => {});
    await recordStatusEvent({
      workflowId: task.workflow_id,
      taskId: task.id,
      status: 'waiting',
      actor: actor || 'Passage',
      channel: 'email',
      recipient: task.assigned_to_name || recipientEmail,
      detail: 'Reminder sent to ' + (task.assigned_to_name || recipientEmail),
      provider: 'resend',
      providerMessageId: sendJson.id,
    });
  }

  return res.status(200).json({
    success: true,
    dryRun,
    providerId: sendJson.id || null,
    message: dryRun
      ? 'Reminder prepared for review. No email was sent.'
      : 'Reminder sent and saved to the family record.',
    spine: taskSpine(task, {
      waiting: dryRun
        ? 'Prepared only. Send when the family or coordinator approves the reminder.'
        : 'Waiting for the assigned person to open the request and respond.',
      proof: dryRun
        ? 'Dry-run reminder returned without calling the provider.'
        : 'Reminder delivery request and family-record event are attached to the family record.',
      notification: dryRun
        ? 'Prepared reminder to ' + (task.assigned_to_name || recipientEmail)
        : 'Sent reminder to ' + (task.assigned_to_name || recipientEmail),
      deepLink: link,
      recipient: recipientEmail,
    }),
  });
}