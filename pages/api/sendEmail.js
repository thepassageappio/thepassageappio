// pages/api/sendEmail.js
import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../lib/deliveryAuth';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../lib/notificationSafety';
import { passageEmailShell, passageSubject } from '../../lib/brandedEmail';
import { rateLimit } from '../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../lib/rateLimitPolicy';

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const SITE_ORIGIN = (() => {
  try { return new URL(SITE_URL).origin; } catch { return SITE_URL; }
})();
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

function cleanLimitKey(value, max = 160) {
  return String(value || '').replace(/[^a-zA-Z0-9@._:-]/g, '').slice(0, max) || 'missing';
}

function outboundDeliveryKey({ to, workflowId, taskId, actionId, actionType }) {
  return [
    'sendEmail',
    cleanLimitKey(workflowId || 'no-workflow'),
    cleanLimitKey(taskId || actionId || 'no-task'),
    cleanLimitKey(to).toLowerCase(),
    cleanLimitKey(actionType || 'assignment'),
  ].join(':');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeSameOriginUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.startsWith('/')) return SITE_URL + text;
  try {
    const parsed = new URL(text);
    if (parsed.origin !== SITE_ORIGIN) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

async function recordTaskStatus({ workflowId, taskId, actionId, status, actor, channel, recipient, detail, provider, providerMessageId, providerEventId }) {
  if (!workflowId || !supabase) return;
  const now = new Date().toISOString();
  const taskUpdates = {
    status,
    last_action_at: now,
    last_actor: actor || recipient || 'Passage',
    channel,
    recipient,
    updated_at: now,
  };
  if (status === 'sent') taskUpdates.notified_at = now;
  if (status === 'delivered') taskUpdates.delivered_at = now;
  if (status === 'acknowledged') taskUpdates.acknowledged_at = now;
  if (isUuid(taskId)) {
    await supabase.from('tasks').update(taskUpdates).eq('id', taskId).eq('workflow_id', workflowId).then(() => {}, () => {});
  }
  if (isUuid(actionId)) {
    await supabase.from('workflow_actions').update({
      status,
      delivery_status: status,
      last_action_at: now,
      last_actor: actor || recipient || 'Passage',
      channel,
      recipient,
      updated_at: now,
    }).eq('id', actionId).eq('workflow_id', workflowId).then(() => {}, () => {});
  }
  await supabase.from('task_status_events').insert([{
    workflow_id: workflowId,
    task_id: isUuid(taskId) ? taskId : null,
    action_id: isUuid(actionId) ? actionId : null,
    status,
    last_action_at: now,
    last_actor: actor || recipient || 'Passage',
    channel,
    recipient,
    detail,
    provider: provider || null,
    provider_message_id: providerMessageId || null,
    provider_event_id: providerEventId || null,
  }]).then(() => {}, () => {});
  await supabase.from('estate_events').insert([{
    estate_id: workflowId,
    event_type: status === 'sent' ? 'task_message_sent' : 'task_status_updated',
    title: status === 'sent' ? 'Message sent' : 'Task status updated',
    description: detail || ((recipient || 'Recipient') + ' - ' + status),
    actor: actor || 'Passage',
  }]).then(() => {}, () => {});
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const {
    to, toName, subject, taskTitle, taskId, actionId, deceasedName,
    coordinatorName, workflowId, actionType, events, messageText, cc
  } = req.body;

  if (!to) return res.status(400).json({ error: 'Missing recipient' });

  const dryRun = req.body?.dryRun === true || req.body?.dryRun === '1' || req.query?.dryRun === '1';
  const previewSubject = subject ||
    (actionType === 'trigger' ? (deceasedName || 'your loved one') + "'s estate plan has been activated" :
     actionType === 'invite' ? 'You have been designated as a confirmation contact' :
    'You have been asked to help - ' + (deceasedName || 'your loved one'));
  if (dryRun) {
    return res.status(200).json({
      success: true,
      dryRun: true,
      skipped: true,
      channel: 'email',
      recipient: to,
      subject: previewSubject,
      actionType: actionType || 'assignment',
      message: 'Dry run only. No email was sent, no provider was called, and no production record was changed.',
    });
  }

  const outboundPolicy = getRateLimitPolicy('outboundDelivery');
  const limit = rateLimit({
    key: outboundDeliveryKey({ to, workflowId, taskId, actionId, actionType }),
    windowSeconds: outboundPolicy.windowSeconds,
    maxRequests: outboundPolicy.maxRequests,
  });
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds || outboundPolicy.windowSeconds));
    return res.status(429).json({
      error: 'This message was recently sent or retried too many times. Review the delivery trail before sending again.',
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) return res.status(200).json({ success: true, skipped: true });

  try {
    const name = toName || to;
    const deceased = deceasedName || 'your loved one';
    const coordinator = coordinatorName || 'the family';

    // Build service block from events
    let serviceRows = '';
    if (events && events.length > 0) {
      events.forEach(function(e) {
        if (!e.date) return;
        const label = e.event_type === 'funeral' ? 'Funeral Service' :
                      e.event_type === 'visitation' ? 'Visitation' :
                      e.event_type === 'burial' ? 'Burial' :
                      e.event_type === 'reception' ? 'Reception' : 'Service';
        const dt = new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const time = e.time ? ' at ' + e.time : '';
        const loc = e.location_name ? ' at ' + e.location_name : '';
        const addr = e.location_address ? '<br><span style=\"color:#a09890;font-size:12px;\">' + e.location_address + '</span>' : '';
        serviceRows += '<tr><td style=\"padding:6px 0;color:#6a6560;font-size:14px;border-bottom:1px solid #f0ece5;\"><strong style=\"color:#1a1916;\">' + label + '</strong><br>' + dt + time + loc + addr + '</td></tr>';
      });
    }

    const serviceBlock = serviceRows ? '<table style=\"width:100%;border-collapse:collapse;margin:20px 0;background:#f0f5f1;border-radius:12px;padding:4px 16px;\"><tbody>' + serviceRows + '</tbody></table>' : '';

    let html;
    if (actionType === 'trigger') {
      html = triggerEmail(name, deceased, coordinator, serviceBlock);
    } else if (actionType === 'invite') {
      html = inviteEmail(name, deceased, coordinator, req.body.confirmUrl);
    } else if (actionType === 'execution') {
      html = executionEmail(name, taskTitle, deceased, coordinator, messageText, workflowId, taskId);
    } else {
      html = assignmentEmail(name, taskTitle, deceased, coordinator, serviceBlock, workflowId, taskId);
    }

    const emailSubject = subject ||
      (actionType === 'trigger' ? passageSubject('Estate plan activated', deceased) :
       actionType === 'invite' ? passageSubject('Confirmation contact', deceased) :
      actionType === 'execution' ? passageSubject('Prepared next step', taskTitle || deceased) :
      passageSubject('Task assignment', taskTitle || deceased));

    const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';

    const route = routeEmailRecipients([to]);
    const ccRoute = cc ? routeEmailRecipients([cc]) : null;
    if (!route.actual.length) return res.status(200).json({ success: true, skipped: true, qaOverride: route.qaOverride });

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: route.actual, cc: ccRoute?.actual?.length ? ccRoute.actual : undefined, subject: emailSubject, html }),
    });
    const data = await r.json();

    console.log('Resend response:', JSON.stringify(data));

    if (r.ok && data.id) {
      await insertNotificationLog(supabase, {
        workflow_id: workflowId || null,
        channel: 'email',
        recipient_email: to,
        recipient_name: name,
        subject: emailSubject,
        provider: 'resend',
        provider_id: data.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
        source: actionType || 'task_email',
        ...qaAuditFields(route),
      });
      if (workflowId) {
        await supabase.from('workflow_actions')
          .update({ status: 'sent', sent_at: new Date().toISOString(), delivery_status: 'sent', provider_message_id: data.id, last_action_at: new Date().toISOString(), last_actor: coordinatorName || 'Passage', channel: 'email', recipient: to })
          .eq('workflow_id', workflowId).eq('action_type', 'email').eq('recipient_email', to)
          .then(() => {}, () => {});
      }
      await recordTaskStatus({
        workflowId,
        taskId,
        actionId,
        status: 'sent',
        actor: coordinatorName || cc || 'Passage',
        channel: 'email',
        recipient: toName || to,
        provider: 'resend',
        providerMessageId: data.id,
        detail: 'Message sent to ' + (toName || to) + (taskTitle ? ' - ' + taskTitle : ''),
      });
      return res.status(200).json({ success: true, id: data.id, from, qaOverride: route.qaOverride, intendedRecipient: to, actualRecipient: route.actual[0] });
    }

    console.error('Resend failed:', JSON.stringify(data));
    await recordTaskStatus({
      workflowId,
      taskId,
      actionId,
      status: 'failed',
      actor: coordinatorName || cc || 'Passage',
      channel: 'email',
      recipient: toName || to,
      provider: 'resend',
      detail: 'Failed to send email to ' + (toName || to) + ': ' + (data?.message || data?.error || JSON.stringify(data)),
    });
    return res.status(500).json({ error: data?.message || data?.error || 'Email provider did not accept the message.' });
  } catch (err) {
    console.error('sendEmail error:', err);
    await recordTaskStatus({
      workflowId,
      taskId,
      actionId,
      status: 'failed',
      actor: coordinatorName || cc || 'Passage',
      channel: 'email',
      recipient: toName || to,
      provider: 'resend',
      detail: 'Failed to send email to ' + (toName || to) + ': ' + err.message,
    });
    return res.status(500).json({ error: err.message });
  }
}

function assignmentEmail(name, task, deceased, coordinator, serviceBlock, workflowId, taskId) {
  const estateParam = workflowId ? '?estate=' + encodeURIComponent(workflowId) : '';
  const taskParam = workflowId && taskId ? '&task=' + encodeURIComponent(taskId) : '';
  const participantUrl = SITE_URL + '/participating' + estateParam + taskParam;
  return passageEmailShell({
    eyebrow: 'Task assignment',
    title: 'You have been asked to help.',
    intro: `${coordinator} is coordinating the estate of ${deceased} and assigned one scoped task to you.`,
    preheader: `Open Passage to accept, update, or complete ${task || 'your assigned task'}.`,
    sections: [
      { label: 'Your task', html: `<strong style=\"color:#1a1916;\">${escapeHtml(task || 'Estate coordination')}</strong>` },
      serviceBlock ? { label: 'Known service details', html: serviceBlock, tone: 'soft' } : null,
      { label: 'Access boundary', text: 'You will only see the estate work connected to your email address.', tone: 'soft' },
    ].filter(Boolean),
    ctaLabel: 'Open my Passage task',
    ctaUrl: participantUrl,
    footer: `Questions? Reach out to ${coordinator} directly. Powered by Passage | thepassageapp.io`,
  });
}

function executionEmail(name, task, deceased, coordinator, messageText, workflowId, taskId) {
  const estateParam = workflowId ? '?estate=' + encodeURIComponent(workflowId) : '';
  const taskParam = workflowId && taskId ? '&task=' + encodeURIComponent(taskId) : '';
  return passageEmailShell({
    eyebrow: 'Prepared next step',
    title: 'A Passage task is ready to handle.',
    intro: `${coordinator} is coordinating next steps for ${deceased}.`,
    preheader: messageText || `Open Passage to review ${task || 'the next step'}.`,
    sections: [
      { label: 'Task', html: `<strong style=\"color:#1a1916;\">${escapeHtml(task || 'Estate coordination')}</strong>` },
      messageText ? { label: 'Prepared message', text: messageText, tone: 'soft' } : null,
    ].filter(Boolean),
    ctaLabel: 'Open in Passage',
    ctaUrl: SITE_URL + '/participating' + estateParam + taskParam,
    footer: `Questions? Reach out to ${coordinator} directly. Powered by Passage | thepassageapp.io`,
  });
}

function triggerEmail(name, deceased, coordinator, serviceBlock) {
  return passageEmailShell({
    eyebrow: 'Plan activated',
    title: `${deceased}'s estate plan has been activated.`,
    intro: `${name}, you have been designated to help coordinate the estate of ${deceased}. Your task list is ready.`,
    preheader: `Open Passage to see your role for ${deceased}.`,
    sections: [
      { label: 'A note from Passage', text: 'We are so sorry for your loss.' },
      serviceBlock ? { label: 'Known service details', html: serviceBlock, tone: 'soft' } : null,
    ].filter(Boolean),
    ctaLabel: 'View my task list',
    ctaUrl: `${SITE_URL}/participating`,
    footer: `Questions? Reach out to ${coordinator} directly. Powered by Passage | thepassageapp.io`,
  });
}

function inviteEmail(name, deceased, coordinator, confirmUrl) {
  const safeConfirmUrl = safeSameOriginUrl(confirmUrl);
  return passageEmailShell({
    eyebrow: 'Confirmation request',
    title: 'You have been designated as a confirmation contact.',
    intro: `${coordinator} has set up an advance estate plan through Passage for ${deceased}.`,
    preheader: 'Keep this secure link so you can confirm activation if the family needs it.',
    sections: [
      { label: 'What this means', text: 'When confirmation is needed, this lets you review the request without searching for instructions. Once the required contacts confirm, the plan activates and assigned contacts are notified.', tone: 'soft' },
      { label: 'No action needed today', text: 'If you were not expecting this, you can ignore this email.' },
    ],
    ctaLabel: safeConfirmUrl ? 'Open confirmation page' : 'Open Passage',
    ctaUrl: safeConfirmUrl || `${SITE_URL}/participating`,
  });
}
