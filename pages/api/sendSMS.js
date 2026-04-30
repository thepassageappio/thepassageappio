import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../lib/deliveryAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { to, toName, taskTitle, taskId, deceasedName, coordinatorName, workflowId, actionType, events } = req.body;
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
    if (actionType === 'trigger') {
      message = 'Passage: ' + shortDeceased + ' plan active. View details: ' + detailUrl;
    } else {
      message = 'Passage: ' + shortName + ' is handling ' + shortTask + '. View details: ' + detailUrl;
    }
    // Keep ASCII and compact; links may push this into two SMS segments, which is acceptable for task clarity.
    message = clean(message, 240);

    const credentials = Buffer.from(TWILIO_SID + ':' + TWILIO_TOKEN).toString('base64');
    const response = await fetch(
      'https://api.twilio.com/2010-04-01/Accounts/' + TWILIO_SID + '/Messages.json',
      {
        method: 'POST',
        headers: { 'Authorization': 'Basic ' + credentials, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: TWILIO_FROM, To: phone, Body: message }),
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
        .update({ status: 'sent', sent_at: new Date().toISOString(), delivery_status: 'sent', provider_message_id: data.sid })
        .eq('workflow_id', workflowId).eq('action_type', 'sms').eq('recipient_phone', to);
    }

    return res.status(200).json({ success: true, sid: data.sid });
  } catch (err) {
    console.error('sendSMS error:', err);
    return res.status(500).json({ error: err.message });
  }
}
