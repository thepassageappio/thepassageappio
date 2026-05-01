import crypto from 'crypto';
import { recordStatusEvent, serviceSupabase } from '../../../lib/taskStatus';

export const config = { api: { bodyParser: false } };

async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyTwilio(req, params) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return false;
  const signature = req.headers['x-twilio-signature'];
  if (!signature) return false;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
  const url = siteUrl + (req.url || '/api/webhooks/twilioVoice');
  const sorted = Array.from(params.keys()).sort().map(key => key + params.get(key)).join('');
  const expected = crypto.createHmac('sha1', token).update(url + sorted).digest('base64');
  return safeEqual(signature, expected);
}

function mapCallStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status === 'completed') return 'handled';
  if (status === 'answered' || status === 'in-progress') return 'acknowledged';
  if (status === 'failed' || status === 'busy' || status === 'no-answer' || status === 'canceled') return 'failed';
  return 'sent';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const raw = await readRaw(req);
  const params = new URLSearchParams(raw);
  if (!verifyTwilio(req, params)) return res.status(401).json({ error: 'Invalid Twilio signature.' });

  const query = new URLSearchParams((req.url || '').split('?')[1] || '');
  const workflowId = query.get('workflowId');
  const taskId = query.get('taskId') || null;
  const actionId = query.get('actionId') || null;
  const recipient = query.get('recipient') || params.get('To') || 'provider';
  const taskTitle = query.get('taskTitle') || 'Call task';
  const callSid = params.get('CallSid');
  const callStatus = params.get('CallStatus') || 'initiated';
  const status = mapCallStatus(callStatus);
  const providerEventId = `${callSid || 'call'}:${callStatus}`;
  const label = status === 'handled' ? 'Call completed' : status === 'acknowledged' ? 'Call connected' : status === 'failed' ? 'Call failed' : 'Call initiated';

  if (workflowId) {
    await serviceSupabase.from('webhook_events').insert([{
      provider: 'twilio_voice',
      event_type: callStatus,
      external_id: callSid,
      provider_event_id: providerEventId,
      workflow_id: workflowId,
      task_id: taskId || null,
      action_id: actionId || null,
      payload: Object.fromEntries(params.entries()),
      status: 'processed',
      processed_at: new Date().toISOString(),
    }]).catch(() => {});

    await recordStatusEvent({
      workflowId,
      taskId,
      actionId,
      status,
      actor: 'Twilio Voice',
      channel: 'voice',
      recipient,
      detail: label + ' for ' + recipient + ' - ' + taskTitle,
      provider: 'twilio_voice',
      providerMessageId: callSid,
      providerEventId,
    });
  }

  return res.status(200).json({ success: true });
}
