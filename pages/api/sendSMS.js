import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../lib/deliveryAuth';
import { smsDeliveryState } from '../../lib/smsReadiness';
import { insertNotificationLog, isQaNotificationMode, qaOverrideEmail } from '../../lib/notificationSafety';
import { passageEmailShell, passageSubject } from '../../lib/brandedEmail';
import { rateLimit } from '../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../lib/rateLimitPolicy';

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

function cleanLimitKey(value, max = 160) {
  return String(value || '').replace(/[^a-zA-Z0-9@._:+-]/g, '').slice(0, max) || 'missing';
}

function outboundDeliveryKey({ to, workflowId, taskId, actionId, actionType }) {
  return [
    'sendSMS',
    cleanLimitKey(workflowId || 'no-workflow'),
    cleanLimitKey(taskId || actionId || 'no-task'),
    cleanLimitKey(to).toLowerCase(),
    cleanLimitKey(actionType || 'assignment'),
  ].join(':');
}

async function recordTaskStatus({ workflowId, taskId, actionId, status, actor, channel, recipient, detail, provider, providerMessageId, providerEventId }) {
  if (!workflowId) return { recorded: false };
  try {
    const { recordStatusEvent } = await import('../../lib/taskStatus');
    return recordStatusEvent({
      workflowId,
      taskId,
      actionId,
      status,
      actor,
      channel,
      recipient,
      detail,
      provider,
      providerMessageId,
      providerEventId,
    });
  } catch (_err) {
    return { recorded: false };
  }
}

async function sendFallbackEmail({ toEmail, toName, taskTitle, workflowId, taskId, actionId, deceasedName, coordinatorName, actionType, messageText, confirmUrl, triggerToken, reason }) {
  if (!toEmail) return { sent: false, reason: 'No fallback email address was provided.' };
  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) return { sent: false, reason: 'Resend is not configured.' };

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
  const name = toName || toEmail;
  const deceased = deceasedName || 'your loved one';
  const coordinator = coordinatorName || 'the family';
  const inviteUrl = confirmUrl || (triggerToken ? siteUrl + '/confirm?token=' + encodeURIComponent(triggerToken) : '');
  const taskUrl = workflowId
    ? (actionType === 'trigger' ? siteUrl + '/estate?id=' + encodeURIComponent(workflowId) : siteUrl + '/participating?estate=' + encodeURIComponent(workflowId) + (taskId ? '&task=' + encodeURIComponent(taskId) : ''))
    : siteUrl + '/participating';
  const bodyText = messageText ||
    (actionType === 'invite'
      ? 'You are a confirmation contact for ' + deceased + "'s plan." + (inviteUrl ? ' Use this secure link: ' + inviteUrl : '')
      : actionType === 'trigger'
        ? deceased + "'s estate plan has been activated. View details: " + taskUrl
        : coordinator + ' asked you to help with ' + (taskTitle || 'an estate task') + '. Open: ' + taskUrl);
  const subject = actionType === 'invite'
    ? passageSubject('Confirmation contact', deceased)
    : passageSubject('Text fallback', taskTitle || 'Passage message');
  const html = passageEmailShell({
    eyebrow: 'Text fallback',
    title: 'SMS is not available yet, so we sent this by email.',
    intro: bodyText,
    preheader: bodyText,
    sections: [
      {
        label: 'Why email',
        text: `Text message delivery is paused or unavailable. Reason: ${reason || 'provider unavailable'}`,
        tone: 'soft',
      },
    ],
    ctaLabel: 'Open in Passage',
    ctaUrl: inviteUrl || taskUrl,
  });
  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [toEmail], subject, html }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) return { sent: false, reason: data?.message || data?.error || 'Email fallback was not accepted.' };

  await supabase.from('notification_log').insert([{
    workflow_id: workflowId || null,
    channel: 'email',
    recipient_email: toEmail,
    recipient_name: name,
    subject,
    provider: 'resend',
    provider_id: data.id,
    status: 'sent',
    sent_at: new Date().toISOString(),
  }]).then(() => {}, () => {});
  await recordTaskStatus({
    workflowId,
    taskId,
    actionId,
    status: 'sent',
    actor: coordinatorName || 'Passage',
    channel: 'email',
    recipient: name,
    provider: 'resend',
    providerMessageId: data.id,
    detail: 'SMS is not available yet. We sent this by email to ' + name + ' and are tracking it here.',
  });
  return { sent: true, id: data.id };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { to, toName, toEmail, recipientEmail, taskTitle, taskId, actionId, deceasedName, coordinatorName, workflowId, actionType, events, messageText, confirmUrl, triggerToken } = req.body;
  if (!to) return res.status(400).json({ error: 'Missing phone number' });

  const dryRun = req.body?.dryRun === true || req.body?.dryRun === '1' || req.query?.dryRun === '1';
  if (dryRun) {
    const phone = to.startsWith('+') ? to : '+1' + to.replace(/\D/g, '');
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
    const estateId = workflowId ? encodeURIComponent(workflowId) : '';
    const taskRef = taskId ? '&task=' + encodeURIComponent(taskId) : '';
    const detailUrl = workflowId
      ? (actionType === 'trigger'
        ? siteUrl + '/estate?id=' + estateId
        : siteUrl + '/participating?estate=' + estateId + taskRef)
      : siteUrl + '/participating';
    const preview = messageText || (
      actionType === 'invite'
        ? 'Passage: You are a confirmation contact. Please check your secure Passage link.'
        : actionType === 'trigger'
          ? 'Passage: estate plan active. View details: ' + detailUrl
          : 'Passage: ' + (coordinatorName || 'the family') + ' asked you to help with ' + (taskTitle || 'an estate task') + '. Open: ' + detailUrl
    );
    return res.status(200).json({
      success: true,
      dryRun: true,
      skipped: true,
      channel: 'sms',
      recipient: phone,
      messagePreview: String(preview).replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim().slice(0, 240),
      actionType: actionType || 'assignment',
      message: 'Dry run only. No SMS was sent, no provider was called, no fallback email was sent, and no production record was changed.',
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

  if (isQaNotificationMode()) {
    const intendedPhone = to.startsWith('+') ? to : '+1' + to.replace(/\D/g, '');
    const override = qaOverrideEmail();
    await insertNotificationLog(supabase, {
      workflow_id: workflowId || null,
      channel: 'sms',
      recipient_phone: intendedPhone,
      recipient_name: toName || null,
      intended_recipient_phone: intendedPhone,
      actual_recipient_email: override || null,
      body_preview: String(messageText || taskTitle || actionType || 'Passage SMS').slice(0, 100),
      provider: 'qa_sms_blocked',
      status: 'blocked',
      source: actionType || 'task_sms',
      qa_override_active: true,
      error_message: 'QA notification mode is active. SMS was blocked instead of sent.',
      sent_at: new Date().toISOString(),
    });
    await recordTaskStatus({
      workflowId,
      taskId,
      actionId,
      status: 'waiting',
      actor: coordinatorName || 'Passage',
      channel: 'sms',
      recipient: toName || intendedPhone,
      provider: 'qa_sms_blocked',
      detail: 'QA mode blocked SMS to ' + (toName || intendedPhone) + '. Intended recipient is preserved in the notification log.',
    });
    return res.status(200).json({ success: true, qaOverride: true, smsBlocked: true, intendedRecipient: intendedPhone, actualRecipient: override || null });
  }

  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;
  const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const smsState = smsDeliveryState();

  if (!TWILIO_SID || !TWILIO_TOKEN || (!TWILIO_FROM && !TWILIO_MESSAGING_SERVICE_SID)) {
    const message = 'Twilio SMS is not configured for this environment. Add TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER.';
    console.error(message);
    await supabase.from('notification_log').insert([{
      workflow_id: workflowId || null,
      channel: 'sms',
      recipient_phone: to || null,
      recipient_name: toName || null,
      body_preview: '',
      provider: 'twilio',
      status: 'failed',
      error_message: message,
    }]).then(() => {}, () => {});
    await recordTaskStatus({
      workflowId,
      taskId,
      actionId,
      status: 'failed',
      actor: coordinatorName || 'Passage',
      channel: 'sms',
      recipient: toName || to,
      provider: 'twilio',
      detail: 'Text was not sent to ' + (toName || to) + ': ' + message,
    });
    const fallback = await sendFallbackEmail({ toEmail: toEmail || recipientEmail, toName, taskTitle, workflowId, taskId, actionId, deceasedName, coordinatorName, actionType, messageText, confirmUrl, triggerToken, reason: message });
    return res.status(fallback.sent ? 200 : 503).json({ error: message, smsFailed: true, fallbackEmailSent: !!fallback.sent, fallbackError: fallback.sent ? null : fallback.reason });
  }

  if (!smsState.liveEnabled) {
    const message = smsState.pausedReason;
    await supabase.from('notification_log').insert([{
      workflow_id: workflowId || null,
      channel: 'sms',
      recipient_phone: to || null,
      recipient_name: toName || null,
      body_preview: '',
      provider: 'twilio',
      status: 'paused',
      error_message: message,
    }]).then(() => {}, () => {});
    await recordTaskStatus({
      workflowId,
      taskId,
      actionId,
      status: 'waiting',
      actor: coordinatorName || 'Passage',
      channel: 'sms',
      recipient: toName || to,
      provider: 'twilio',
      detail: 'Text was not sent to ' + (toName || to) + ': ' + message,
    });
    const fallback = await sendFallbackEmail({ toEmail: toEmail || recipientEmail, toName, taskTitle, workflowId, taskId, actionId, deceasedName, coordinatorName, actionType, messageText, confirmUrl, triggerToken, reason: message });
    return res.status(fallback.sent ? 200 : 503).json({
      error: message,
      smsPaused: true,
      smsFailed: true,
      fallbackEmailSent: !!fallback.sent,
      fallbackError: fallback.sent ? null : fallback.reason,
    });
  }

  try {
    const phone = to.startsWith('+') ? to : '+1' + to.replace(/\D/g, '');
    const deceased = deceasedName || 'your loved one';
    const coordinator = coordinatorName || 'the family';

    // Build service detail for SMS
    let serviceDetail = '';
    if (events && events.length > 0) {
      const funeral = events.find(function(e) { return e.event_type === 'funeral'; });
      if (funeral && funeral.date) {
        const dt = new Date(funeral.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        serviceDetail = ' Funeral: ' + (funeral.time ? dt + ' at ' + funeral.time : dt) + (funeral.location_name ? ' at ' + funeral.location_name : '') + '.';
      }
    }

    // ASCII only: avoid UCS-2 encoding which halves the character limit.
    var clean = function(value, max) {
      var text = String(value || '').replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim();
      return text.length > max ? text.slice(0, Math.max(0, max - 3)).trim() + '...' : text;
    };
    var shortTask = clean(taskTitle || 'estate task', 28);
    var shortName = clean(toName || 'You', 16);
    var shortDeceased = clean(deceased || 'estate', 16);
    var siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
    var estateId = workflowId ? encodeURIComponent(workflowId) : '';
    var taskRef = taskId ? '&task=' + encodeURIComponent(taskId) : '';
    var detailUrl = workflowId
      ? (actionType === 'trigger'
        ? siteUrl + '/estate?id=' + estateId
        : siteUrl + '/participating?estate=' + estateId + taskRef)
      : siteUrl + '/participating';

    var message;
    if (actionType === 'execution' && messageText) {
      message = clean(messageText, 240);
    } else if (actionType === 'invite') {
      var inviteUrl = confirmUrl || (triggerToken ? (siteUrl + '/confirm?token=' + encodeURIComponent(triggerToken)) : '');
      message = inviteUrl
        ? ('Passage: You are a confirmation contact for ' + shortDeceased + "'s plan. Keep this link: " + inviteUrl)
        : ('Passage: You are a confirmation contact for ' + shortDeceased + "'s plan. Please check your email for the secure confirmation link.");
    } else if (actionType === 'trigger') {
      message = 'Passage: ' + shortDeceased + ' plan active. View details: ' + detailUrl;
    } else {
      message = 'Passage: ' + coordinator + ' asked you to help with ' + shortTask + '. Open: ' + detailUrl;
    }
    // Keep ASCII and compact; links may push this into two SMS segments, which is acceptable for task clarity.
    message = clean(message, 240);

    const credentials = Buffer.from(TWILIO_SID + ':' + TWILIO_TOKEN).toString('base64');
    const callbackUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '') + '/api/webhooks/twilio';
    const twilioBody = new URLSearchParams({
      To: phone,
      Body: message,
      StatusCallback: callbackUrl,
    });
    if (TWILIO_MESSAGING_SERVICE_SID) twilioBody.set('MessagingServiceSid', TWILIO_MESSAGING_SERVICE_SID);
    else twilioBody.set('From', TWILIO_FROM);

    const response = await fetch(
      'https://api.twilio.com/2010-04-01/Accounts/' + TWILIO_SID + '/Messages.json',
      {
        method: 'POST',
        headers: { 'Authorization': 'Basic ' + credentials, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: twilioBody,
      }
    );

    const data = await response.json();

    if (!response.ok || data.status === 'failed') {
      await supabase.from('notification_log').insert([{
        workflow_id: workflowId || null,
        channel: 'sms',
        recipient_phone: phone,
        recipient_name: toName || null,
        body_preview: message.slice(0, 100),
        provider: 'twilio',
        status: 'failed',
        error_message: data.message || JSON.stringify(data),
      }]);
      await recordTaskStatus({
        workflowId,
        taskId,
        actionId,
        status: 'failed',
        actor: coordinatorName || 'Passage',
        channel: 'sms',
        recipient: toName || phone,
        provider: 'twilio',
        providerMessageId: data.sid || null,
        detail: 'Failed to send text to ' + (toName || phone) + ': ' + (data.message || 'Twilio did not accept the message.'),
      });
      const fallback = await sendFallbackEmail({ toEmail: toEmail || recipientEmail, toName, taskTitle, workflowId, taskId, actionId, deceasedName, coordinatorName, actionType, messageText, confirmUrl, triggerToken, reason: data.message || 'Twilio did not accept the message.' });
      return res.status(fallback.sent ? 200 : 500).json({ error: data.message, smsFailed: true, fallbackEmailSent: !!fallback.sent, fallbackError: fallback.sent ? null : fallback.reason });
    }

    await supabase.from('notification_log').insert([{
      workflow_id: workflowId || null,
      channel: 'sms',
      recipient_phone: phone,
      recipient_name: toName || null,
      body_preview: message.slice(0, 100),
      provider: 'twilio',
      provider_id: data.sid,
      status: 'sent',
      sent_at: new Date().toISOString(),
    }]);

    if (workflowId) {
      const updates = {
        status: 'sent',
        sent_at: new Date().toISOString(),
        delivery_status: 'sent',
        provider_message_id: data.sid,
        last_action_at: new Date().toISOString(),
        last_actor: coordinatorName || 'Passage',
        channel: 'sms',
        recipient: toName || phone,
      };

      let query = supabase.from('workflow_actions').update(updates);
      if (isUuid(actionId)) {
        query = query.eq('id', actionId).eq('workflow_id', workflowId);
      } else {
        const candidates = [];
        if (to) candidates.push(String(to));
        if (phone && String(phone) !== String(to)) candidates.push(String(phone));
        query = query.eq('workflow_id', workflowId).eq('action_type', 'sms');
        query = candidates.length > 0 ? query.in('recipient_phone', candidates) : query.eq('recipient_phone', phone);
      }

      await query;
    }
    await recordTaskStatus({
      workflowId,
      taskId,
      actionId,
      status: 'sent',
      actor: coordinatorName || 'Passage',
      channel: 'sms',
      recipient: toName || phone,
      provider: 'twilio',
      providerMessageId: data.sid,
      detail: 'Text submitted to Twilio for ' + (toName || phone) + (taskTitle ? ' - ' + taskTitle : '') + '. Waiting for carrier delivery.',
    });

    return res.status(200).json({ success: true, sid: data.sid, twilioStatus: data.status || 'submitted' });
  } catch (err) {
    console.error('sendSMS error:', err);
    await recordTaskStatus({
      workflowId,
      taskId,
      actionId,
      status: 'failed',
      actor: coordinatorName || 'Passage',
      channel: 'sms',
      recipient: toName || to,
      provider: 'twilio',
      detail: 'Failed to send text to ' + (toName || to) + ': ' + err.message,
    });
    const fallback = await sendFallbackEmail({ toEmail: toEmail || recipientEmail, toName, taskTitle, workflowId, taskId, actionId, deceasedName, coordinatorName, actionType, messageText, confirmUrl, triggerToken, reason: err.message });
    return res.status(fallback.sent ? 200 : 500).json({ error: err.message, smsFailed: true, fallbackEmailSent: !!fallback.sent, fallbackError: fallback.sent ? null : fallback.reason });
  }
}
