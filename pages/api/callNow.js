import { createClient } from '@supabase/supabase-js';
import { recordStatusEvent } from '../../lib/taskStatus';

const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function normalizePhone(value) {
  const raw = String(value || '').trim();
  if (raw.startsWith('+')) return raw.replace(/[^\d+]/g, '');
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  return '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Session could not be verified.' });

  const { workflowId, taskId, actionId, userPhone, recipientPhone, recipientName, taskTitle, script } = req.body || {};
  const toUser = normalizePhone(userPhone);
  const toRecipient = normalizePhone(recipientPhone);
  if (!workflowId) return res.status(400).json({ error: 'Missing estate.' });
  if (!toUser) return res.status(400).json({ error: 'Add your phone number first.' });
  if (!toRecipient) return res.status(400).json({ error: 'This provider needs a phone number before Passage can connect the call.' });

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const tokenSecret = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !tokenSecret || !from) return res.status(500).json({ error: 'Twilio Voice is not configured.' });

  const voiceUrl = SITE_URL + '/api/twilioVoice?' + new URLSearchParams({
    to: toRecipient,
    name: recipientName || 'provider',
  }).toString();
  const statusCallback = SITE_URL + '/api/webhooks/twilioVoice?' + new URLSearchParams({
    workflowId,
    taskId: taskId || '',
    actionId: actionId || '',
    recipient: recipientName || toRecipient,
    taskTitle: taskTitle || 'Call task',
  }).toString();

  try {
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Calls.json', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(sid + ':' + tokenSecret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: from,
        To: toUser,
        Url: voiceUrl,
        StatusCallback: statusCallback,
        StatusCallbackEvent: 'initiated ringing answered completed',
        StatusCallbackMethod: 'POST',
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Twilio could not start the call.');

    await recordStatusEvent({
      workflowId,
      taskId,
      actionId,
      status: 'sent',
      actor: data.user.email || 'Passage',
      channel: 'voice',
      recipient: recipientName || toRecipient,
      detail: 'Call initiated to ' + (recipientName || toRecipient) + '. Passage is calling you first, then connecting the provider.',
      provider: 'twilio_voice',
      providerMessageId: result.sid,
      providerEventId: result.sid + ':initiated',
    });

    return res.status(200).json({ success: true, sid: result.sid, script: script || '' });
  } catch (err) {
    await recordStatusEvent({
      workflowId,
      taskId,
      actionId,
      status: 'failed',
      actor: data.user.email || 'Passage',
      channel: 'voice',
      recipient: recipientName || toRecipient,
      detail: 'Call failed for ' + (recipientName || toRecipient) + ': ' + err.message,
      provider: 'twilio_voice',
    });
    return res.status(500).json({ error: err.message || 'Call could not be started.' });
  }
}
