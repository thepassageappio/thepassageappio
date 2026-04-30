import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../lib/deliveryAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

async function recordTaskStatus({ workflowId, taskId, actionId, status, actor, channel, recipient, detail, provider, providerMessageId, providerEventId }) {
  if (!workflowId) return;
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
  if (isUuid(taskId)) await supabase.from('tasks').update(taskUpdates).eq('id', taskId).eq('workflow_id', workflowId).catch(() => {});
  if (isUuid(actionId)) await supabase.from('workflow_actions').update({
    status,
    delivery_status: status,
    last_action_at: now,
    last_actor: actor || recipient || 'Passage',
    channel,
    recipient,
    updated_at: now,
  }).eq('id', actionId).eq('workflow_id', workflowId).catch(() => {});
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
  }]).catch(() => {});
  await supabase.from('estate_events').insert([{
    estate_id: workflowId,
    event_type: status === 'sent' ? 'task_message_sent' : 'task_status_updated',
    title: status === 'sent' ? 'Message sent' : 'Task status updated',
    description: detail || ((recipient || 'Recipient') + ' - ' + status),
    actor: actor || 'Passage',
  }]).catch(() => {});
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { to, toName, taskTitle, taskId, actionId, deceasedName, coordinatorName, workflowId, actionType, events, messageText } = req.body;
  if (!to) return res.status(400).json({ error: 'Missing phone number' });

  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;

  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.warn('Twilio not configured');
    return res.status(200).json({ success: true, skipped: true });
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
    } else if (actionType === 'trigger') {
      message = 'Passage: ' + shortDeceased + ' plan active. View details: ' + detailUrl;
    } else {
      message = 'Passage: ' + coordinator + ' asked you to help with ' + shortTask + '. Open: ' + detailUrl;
    }
    // Keep ASCII and compact; links may push this into two SMS segments, which is acceptable for task clarity.
    message = clean(message, 240);

    const credentials = Buffer.from(TWILIO_SID + ':' + TWILIO_TOKEN).toString('base64');
    const response = await fetch(
      'https://api.twilio.com/2010-04-01/Accounts/' + TWILIO_SID + '/Messages.json',
      {
        method: 'POST',
        headers: { 'Authorization': 'Basic ' + credentials, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          From: TWILIO_FROM,
          To: phone,
          Body: message,
          StatusCallback: (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '') + '/api/webhooks/twilio',
        }),
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
      return res.status(500).json({ error: data.message });
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
      await supabase.from('workflow_actions')
        .update({ status: 'sent', sent_at: new Date().toISOString(), delivery_status: 'sent', provider_message_id: data.sid, last_action_at: new Date().toISOString(), last_actor: coordinatorName || 'Passage', channel: 'sms', recipient: toName || phone })
        .eq('workflow_id', workflowId).eq('action_type', 'sms').eq('recipient_phone', to);
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
      detail: 'Text sent to ' + (toName || phone) + (taskTitle ? ' - ' + taskTitle : ''),
    });

    return res.status(200).json({ success: true, sid: data.sid });
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
    return res.status(500).json({ error: err.message });
  }
}
