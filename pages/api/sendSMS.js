import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../lib/deliveryAuth';
import { recordStatusEvent } from '../../lib/taskStatus';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

async function recordTaskStatus({ workflowId, taskId, actionId, status, actor, channel, recipient, detail, provider, providerMessageId, providerEventId }) {
  if (!workflowId) return { recorded: false };
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
    ? 'You are a confirmation contact in Passage'
    : 'Passage update' + (taskTitle ? ': ' + taskTitle : '');
  const html = '<div style="font-family:Georgia,serif;background:#f6f3ee;padding:28px 16px;"><div style="max-width:540px;margin:0 auto;background:#fff;border:1px solid #e4ddd4;border-radius:18px;padding:28px;"><div style="font-size:12px;color:#6b8f71;letter-spacing:.18em;text-transform:uppercase;font-weight:700;margin-bottom:18px;">Passage</div><h1 style="font-size:24px;line-height:1.25;margin:0 0 12px;color:#1a1916;">SMS is not available yet, so we sent this by email.</h1><p style="font-size:15px;line-height:1.7;color:#6a6560;margin:0 0 16px;">' + escapeHtml(bodyText) + '</p>' + (inviteUrl || taskUrl ? '<a href="' + escapeHtml(inviteUrl || taskUrl) + '" style="display:inline-block;background:#6b8f71;color:#fff;text-decoration:none;border-radius:12px;padding:12px 18px;font-weight:700;">Open in Passage</a>' : '') + '<p style="font-size:12px;line-height:1.6;color:#a09890;margin-top:18px;">We are tracking this in Passage. SMS reason: ' + escapeHtml(reason || 'provider unavailable') + '</p></div></div>';
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
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { to, toName, toEmail, recipientEmail, taskTitle, taskId, actionId, deceasedName, coordinatorName, workflowId, actionType, events, messageText, confirmUrl, triggerToken } = req.body;
  if (!to) return res.status(400).json({ error: 'Missing phone number' });

  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;
  const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;

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
      sent_at: new Date().toISOString(),
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

    // ASCII only — avoid UCS-2 encoding which halves the character limit
    // Keep under 122 chars — Twilio trial adds 38 char prefix
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
        sent_at: new Date().toISOString(),
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
