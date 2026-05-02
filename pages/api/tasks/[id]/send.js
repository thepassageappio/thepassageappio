import { verifyDeliveryRequest, internalHeaders } from '../../../../lib/deliveryAuth';
import { serviceSupabase, isUuid, recordStatusEvent } from '../../../../lib/taskStatus';

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function userMessage(error) {
  const text = typeof error === 'string' ? error : error?.message || JSON.stringify(error || {});
  if (/rate|timeout|temporar|network|fetch/i.test(text)) return 'Failed to send - retry? The provider may be temporarily unavailable.';
  if (/recipient|email|phone|invalid|not verified/i.test(text)) return 'Failed to send - retry after checking the recipient.';
  return 'Failed to send - retry? ' + text.slice(0, 180);
}

async function postWithRetry(url, body, attempts = 2) {
  let last;
  for (let i = 0; i < attempts; i++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...internalHeaders() },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && !data.error) return { response, data };
    last = data.error || data || { message: response.statusText };
    if (![408, 429, 500, 502, 503, 504].includes(response.status)) break;
    await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
  }
  throw new Error(typeof last === 'string' ? last : last?.message || JSON.stringify(last || {}));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const taskId = String(req.query.id || '').trim();
  if (!taskId) return res.status(400).json({ error: 'Invalid task id.' });

  const { data: task, error } = await serviceSupabase
    .from('tasks')
    .select('id,workflow_id,title,description,status,assigned_to_name,assigned_to_email')
    .eq('id', taskId)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  const channel = req.body?.channel || (req.body?.toPhone ? 'sms' : 'email');
  const recipient = req.body?.to || req.body?.toEmail || req.body?.toPhone || (channel === 'sms' ? '' : task.assigned_to_email);
  if (!recipient) return res.status(400).json({ error: 'Add a recipient before sending.' });

  const basePayload = {
    to: recipient,
    toName: req.body?.toName || task.assigned_to_name || recipient,
    subject: req.body?.subject,
    taskTitle: req.body?.taskTitle || task.title,
    taskId,
    actionId: req.body?.actionId,
    deceasedName: req.body?.deceasedName,
    coordinatorName: req.body?.coordinatorName,
    workflowId: task.workflow_id,
    actionType: req.body?.actionType || 'execution',
    events: req.body?.events || [],
    messageText: req.body?.messageText,
    cc: req.body?.cc,
  };

  try {
    const sent = channel === 'sms'
      ? await postWithRetry(BASE_URL + '/api/sendSMS', basePayload, 2)
      : await postWithRetry(BASE_URL + '/api/sendEmail', basePayload, 2);

    return res.status(200).json({
      success: true,
      status: 'sent',
      providerId: sent.data?.id || sent.data?.sid || null,
      message: 'Message sent - awaiting delivery confirmation.',
    });
  } catch (err) {
    await recordStatusEvent({
      workflowId: task.workflow_id,
      taskId: isUuid(taskId) ? taskId : null,
      actionId: req.body?.actionId,
      status: 'failed',
      actor: req.body?.coordinatorName || auth.user?.email || 'Passage',
      channel,
      recipient,
      detail: userMessage(err),
      provider: channel === 'sms' ? 'twilio' : 'resend',
    });
    return res.status(502).json({ error: userMessage(err) });
  }
}
