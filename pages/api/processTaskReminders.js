import { createClient } from '@supabase/supabase-js';
import { internalHeaders } from '../../lib/deliveryAuth';
import { recordStatusEvent } from '../../lib/taskStatus';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function isAuthorized(req) {
  const internalSecret = process.env.PASSAGE_INTERNAL_API_SECRET;
  const cronSecret = process.env.CRON_SECRET || internalSecret;
  const providedInternal = req.headers['x-passage-internal-secret'];
  const providedBearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return Boolean((internalSecret && providedInternal === internalSecret) || (cronSecret && providedBearer === cronSecret));
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function sendReminder(task, workflow) {
  const to = task.assigned_to_email || (task.channel === 'email' ? task.recipient : '');
  if (!to || !String(to).includes('@')) return { skipped: true, reason: 'no email' };
  const text = `Hello,\n\nGentle reminder from Passage: the family is still waiting for confirmation on this task:\n\n${task.title}\n\nPlease open Passage to accept, mark handled, add a note, or ask for help:\n${SITE_URL}/participating?estate=${encodeURIComponent(task.workflow_id)}&task=${encodeURIComponent(task.id)}\n\nThank you.`;
  const response = await fetch(SITE_URL + '/api/sendEmail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...internalHeaders() },
    body: JSON.stringify({
      to,
      toName: task.assigned_to_name || to,
      subject: 'Reminder: Passage task needs confirmation',
      taskTitle: task.title,
      taskId: task.id,
      deceasedName: workflow?.deceased_name || workflow?.name || 'your loved one',
      coordinatorName: workflow?.coordinator_name || 'the family coordinator',
      workflowId: task.workflow_id,
      actionType: 'execution',
      messageText: text,
      cc: workflow?.coordinator_email || undefined,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(data.error || 'Reminder send failed');
  return { sent: true };
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Task reminder processor is not authorized.' });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id,workflow_id,title,status,last_action_at,assigned_to_name,assigned_to_email,channel,recipient,reminder_4h_sent_at,reminder_24h_sent_at')
    .in('status', ['sent', 'waiting', 'assigned', 'delivered'])
    .is('acknowledged_at', null)
    .order('last_action_at', { ascending: true, nullsFirst: false })
    .limit(40);
  if (error) return res.status(500).json({ error: error.message });

  const due = (tasks || []).filter(task => {
    const last = task.last_action_at ? new Date(task.last_action_at).getTime() : 0;
    if (!last) return false;
    const ageHours = (Date.now() - last) / 3600000;
    return (ageHours >= 24 && !task.reminder_24h_sent_at) || (ageHours >= 4 && !task.reminder_4h_sent_at);
  });

  const workflowIds = Array.from(new Set(due.map(t => t.workflow_id).filter(Boolean)));
  let workflows = [];
  if (workflowIds.length) {
    const { data } = await supabase.from('workflows').select('id,name,deceased_name,coordinator_name,coordinator_email').in('id', workflowIds);
    workflows = data || [];
  }

  const results = [];
  for (const task of due) {
    const workflow = workflows.find(w => w.id === task.workflow_id);
    const ageHours = (Date.now() - new Date(task.last_action_at).getTime()) / 3600000;
    const column = ageHours >= 24 && !task.reminder_24h_sent_at ? 'reminder_24h_sent_at' : 'reminder_4h_sent_at';
    try {
      await sendReminder(task, workflow);
      await supabase.from('tasks').update({ [column]: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', task.id);
      await recordStatusEvent({
        workflowId: task.workflow_id,
        taskId: task.id,
        status: 'waiting',
        actor: 'Passage',
        channel: 'email',
        recipient: task.assigned_to_name || task.assigned_to_email || task.recipient,
        detail: `Gentle reminder sent for ${task.title}. Waiting for confirmation.`,
      });
      results.push({ id: task.id, sent: true, column });
    } catch (err) {
      results.push({ id: task.id, sent: false, error: err.message });
    }
  }

  return res.status(200).json({ success: true, processed: results.length, results });
}
