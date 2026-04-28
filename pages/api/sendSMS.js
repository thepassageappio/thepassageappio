import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { to, toName, taskTitle, deceasedName, coordinatorName, workflowId, actionType, events } = req.body;
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

    // Keep under 122 chars — Twilio trial prepends 38 chars
    let message;
    if (actionType === 'trigger') {
      message = 'Passage: ' + deceased + ' estate plan activated.' + serviceDetail + ' thepassageapp.io';
    } else {
      var shortTask = (taskTitle || 'a task').slice(0, 40);
      message = 'Passage: ' + (toName || 'You') + ' assigned to "' + shortTask + '" thepassageapp.io';
    }
    // Hard cap at 155 chars to be safe
    if (message.length > 155) message = message.slice(0, 152) + '...';

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
