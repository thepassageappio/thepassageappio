import { verifyDeliveryRequest } from '../../../../lib/deliveryAuth';
import { serviceSupabase, isUuid } from '../../../../lib/taskStatus';
import { isPassageAdmin } from '../../../../lib/adminAccess';

async function userCanAssignTask(auth, task) {
  if (auth.source === 'internal') return true;
  const email = auth.user?.email?.toLowerCase();
  const userId = auth.user?.id;
  if (!email && !userId) return false;

  const { data: workflow } = await serviceSupabase
    .from('workflows')
    .select('id,user_id,coordinator_email,organization_id')
    .eq('id', task.workflow_id)
    .maybeSingle();
  if (!workflow) return false;
  if (workflow.user_id && workflow.user_id === userId) return true;
  if (workflow.coordinator_email && email && workflow.coordinator_email.toLowerCase() === email) return true;
  if (email && isPassageAdmin(email)) return true;

  const { data: access } = await serviceSupabase
    .from('estate_access')
    .select('id')
    .eq('workflow_id', task.workflow_id)
    .ilike('email', email || '')
    .neq('status', 'revoked')
    .limit(1);
  if (access?.length) return true;

  if (workflow.organization_id) {
    const { data: member } = await serviceSupabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', workflow.organization_id)
      .ilike('email', email || '')
      .eq('status', 'active')
      .limit(1);
    if (member?.length) return true;
  }

  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const taskId = String(req.query.id || '').trim();
  if (!taskId) return res.status(400).json({ error: 'Invalid task id.' });

  const { name, email, actor } = req.body || {};
  const assigneeEmail = String(email || '').trim().toLowerCase();
  const assigneeName = String(name || '').trim() || assigneeEmail;

  if (!assigneeName) return res.status(400).json({ error: 'Add the recipient name or email.' });
  if (!assigneeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assigneeEmail)) {
    return res.status(400).json({ error: 'Add a valid recipient email before sending through Passage.' });
  }

  const { data: task, error } = await serviceSupabase
    .from('tasks')
    .select('id,workflow_id,title')
    .eq('id', taskId)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  const allowed = await userCanAssignTask(auth, task);
  if (!allowed) return res.status(403).json({ error: 'You do not have access to assign this task.' });

  const now = new Date().toISOString();
  const actorName = actor || auth.user?.user_metadata?.full_name || auth.user?.email || 'Passage';

  const updates = {
    assigned_to_name: assigneeName,
    assigned_to_email: assigneeEmail,
    owner_label: assigneeName,
    recipient: assigneeEmail,
    last_action_at: now,
    last_actor: actorName,
    updated_at: now,
  };

  const { error: updateError } = await serviceSupabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('workflow_id', task.workflow_id);
  if (updateError) return res.status(500).json({ error: updateError.message });

  await serviceSupabase.from('task_status_events').insert([{
    workflow_id: task.workflow_id,
    task_id: isUuid(task.id) ? task.id : null,
    status: 'assigned',
    last_action_at: now,
    last_actor: actorName,
    channel: 'record',
    recipient: assigneeEmail,
    detail: task.title + ' assigned to ' + assigneeName + ' <' + assigneeEmail + '>',
  }]).then(() => {}, () => {});

  await serviceSupabase.from('estate_events').insert([{
    estate_id: task.workflow_id,
    event_type: 'task_assigned',
    title: 'Task assigned',
    description: task.title + ' assigned to ' + assigneeName,
    actor: actorName,
  }]).then(() => {}, () => {});

  return res.status(200).json({
    success: true,
    task: Object.assign({}, task, updates),
    confirmation: 'Recipient saved. Passage can send this task message now.',
  });
}
