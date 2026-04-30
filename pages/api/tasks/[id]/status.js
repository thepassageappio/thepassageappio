import { verifyDeliveryRequest } from '../../../../lib/deliveryAuth';
import { serviceSupabase, isUuid, recordStatusEvent } from '../../../../lib/taskStatus';

const allowedStatuses = new Set(['waiting', 'acknowledged', 'handled', 'blocked', 'not_applicable']);
const allowedChannels = new Set(['email', 'sms', 'call', 'website', 'record', 'participant']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const taskId = req.query.id;
  if (!isUuid(taskId)) return res.status(400).json({ error: 'Invalid task id.' });

  const { status, channel, recipient, detail, notes, outcomeStatus, followUpAt, actor } = req.body || {};
  if (!allowedStatuses.has(status)) return res.status(400).json({ error: 'Invalid task status.' });
  if (channel && !allowedChannels.has(channel)) return res.status(400).json({ error: 'Invalid task channel.' });

  const { data: task, error } = await serviceSupabase
    .from('tasks')
    .select('id,workflow_id,title,assigned_to_name,assigned_to_email')
    .eq('id', taskId)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  const updates = {};
  if (typeof notes === 'string') updates.notes = notes.trim();
  if (outcomeStatus) updates.outcome_status = outcomeStatus;
  if (followUpAt) updates.follow_up_at = new Date(followUpAt).toISOString();
  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();
    await serviceSupabase.from('tasks').update(updates).eq('id', taskId).eq('workflow_id', task.workflow_id).catch(() => {});
  }

  const result = await recordStatusEvent({
    workflowId: task.workflow_id,
    taskId,
    status,
    actor: actor || auth.user?.email || 'Passage',
    channel: channel || 'record',
    recipient: recipient || task.assigned_to_name || task.assigned_to_email || null,
    detail: detail || `${task.title} - ${status.replace(/_/g, ' ')}`,
  });

  return res.status(200).json({ success: true, result });
}
