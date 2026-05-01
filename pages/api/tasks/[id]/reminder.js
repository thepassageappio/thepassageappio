import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest, internalHeaders } from '../../../../lib/deliveryAuth';
import { recordStatusEvent } from '../../../../lib/taskStatus';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function siteUrl(req) {
  return (process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host || 'www.thepassageapp.io'}`).replace(/\/$/, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const taskId = req.query.id;
  const { actor, message } = req.body || {};

  const { data: task, error } = await supabase
    .from('tasks')
    .select('id,workflow_id,title,assigned_to_name,assigned_to_email,recipient,channel,last_actor,status')
    .eq('id', taskId)
    .maybeSingle();

  if (error || !task) return res.status(404).json({ error: 'Task not found.' });

  const recipientEmail = task.assigned_to_email || (String(task.recipient || '').includes('@') ? task.recipient : '');
  if (!recipientEmail) {
    await recordStatusEvent({
      workflowId: task.workflow_id,
      taskId: task.id,
      status: 'waiting',
      actor: actor || 'Passage',
      channel: 'record',
      recipient: task.assigned_to_name || task.recipient || '',
      detail: 'Reminder needed, but no participant email is saved for this task.',
    });
    return res.status(400).json({ error: 'No participant email is saved for this task.' });
  }

  const base = siteUrl(req);
  const link = `${base}/participating?estate=${encodeURIComponent(task.workflow_id)}&task=${encodeURIComponent(task.id)}`;
  const body = message || `A gentle reminder from Passage: ${task.title || 'your assigned task'} is still waiting for your confirmation. You can accept, mark handled, or ask for help here: ${link}`;

  const send = await fetch(`${base}/api/sendEmail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...internalHeaders() },
    body: JSON.stringify({
      to: recipientEmail,
      toName: task.assigned_to_name || recipientEmail,
      subject: 'Reminder: Passage task waiting for you',
      taskTitle: task.title,
      taskId: task.id,
      workflowId: task.workflow_id,
      actionType: 'execution',
      coordinatorName: actor || 'Passage',
      messageText: body,
    }),
  }).catch(() => null);

  if (!send || !send.ok) {
    await recordStatusEvent({
      workflowId: task.workflow_id,
      taskId: task.id,
      status: 'failed',
      actor: actor || 'Passage',
      channel: 'email',
      recipient: task.assigned_to_name || recipientEmail,
      detail: 'Reminder failed to send to ' + (task.assigned_to_name || recipientEmail),
      provider: 'resend',
    });
    return res.status(502).json({ error: 'Reminder could not be sent.' });
  }

  await supabase.from('tasks').update({ follow_up_at: new Date().toISOString() }).eq('id', task.id).catch(() => {});
  await recordStatusEvent({
    workflowId: task.workflow_id,
    taskId: task.id,
    status: 'waiting',
    actor: actor || 'Passage',
    channel: 'email',
    recipient: task.assigned_to_name || recipientEmail,
    detail: 'Reminder sent to ' + (task.assigned_to_name || recipientEmail),
    provider: 'resend',
  });

  return res.status(200).json({ success: true });
}
