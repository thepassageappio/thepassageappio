// pages/api/sendSMS.js
// Sends SMS via Twilio
// Called when a task is assigned OR when trigger fires

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    to,              // phone number e.g. "+18457976344"
    toName,
    taskTitle,
    deceasedName,
    coordinatorName,
    workflowId,
    actionType = 'assignment', // 'assignment' | 'trigger'
  } = req.body;

  if (!to) return res.status(400).json({ error: 'Missing phone number' });

  try {
    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;

    if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
      console.warn('Twilio not configured — SMS skipped');
      return res.status(200).json({ success: true, skipped: true });
    }

    // Normalize phone — ensure + prefix
    const phone = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;

    const message = actionType === 'trigger'
      ? `Passage: ${deceasedName || 'Your loved one'}'s estate plan has been activated. Your task list is ready. Open Passage to see what needs to happen now → thepassageapp.io`
      : `Passage: ${coordinatorName || 'A family member'} assigned you a task for ${deceasedName || 'an estate'}: "${taskTitle || 'Estate coordination'}". You'll receive full details when the plan activates → thepassageapp.io`;

    const credentials = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: TWILIO_FROM, To: phone, Body: message }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.status === 'failed') {
      console.error('Twilio error:', data);
      return res.status(500).json({ error: data.message });
    }

    // Mark workflow_action as sent
    if (workflowId) {
      await supabase.from('workflow_actions')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('workflow_id', workflowId)
        .eq('action_type', 'sms')
        .eq('recipient_phone', to);
    }

    return res.status(200).json({ success: true, sid: data.sid });
  } catch (err) {
    console.error('sendSMS error:', err);
    return res.status(500).json({ error: err.message });
  }
}
