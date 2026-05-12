import { verifyDeliveryRequest } from '../../../../lib/deliveryAuth';
import { serviceSupabase } from '../../../../lib/taskStatus';
import { isPassageAdmin } from '../../../../lib/adminAccess';
import { recordTaskCommunicationEvent } from '../../../../lib/communicationEvents';

function schemaColumnError(error) {
  const message = String(error?.message || error || '');
  return /schema cache|column .* does not exist|Could not find the .* column/i.test(message);
}

function missingColumnFrom(error) {
  const message = String(error?.message || error?.details || '');
  const match = message.match(/'([^']+)'\s+column/i) || message.match(/column\s+"?([a-z0-9_]+)"?\s+.*does not exist/i);
  return match?.[1] || '';
}

async function updateTaskAssignmentWithSchemaFallback(task, updates) {
  const skippedColumns = [];
  let remaining = { ...updates };

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const result = await serviceSupabase
      .from('tasks')
      .update(remaining)
      .eq('id', task.id)
      .eq('workflow_id', task.workflow_id);

    if (!result.error) return { skippedColumns, savedUpdates: remaining };

    const missingColumn = missingColumnFrom(result.error);
    if (!missingColumn || !(missingColumn in remaining) || !schemaColumnError(result.error)) {
      return { error: result.error, skippedColumns };
    }

    skippedColumns.push(missingColumn);
    const { [missingColumn]: _omitted, ...nextRemaining } = remaining;
    remaining = nextRemaining;
  }

  return { error: new Error('Task owner could not be saved after schema fallback.'), skippedColumns };
}

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

  const { name, email, role, phone, actor } = req.body || {};
  const assigneeEmail = String(email || '').trim().toLowerCase();
  const assigneeName = String(name || '').trim() || assigneeEmail;
  const assigneeRole = String(role || '').trim();
  const assigneePhone = String(phone || '').trim();

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
    recipient: assigneeEmail,
    last_action_at: now,
    last_actor: actorName,
    updated_at: now,
  };

  const { error: updateError, skippedColumns = [], savedUpdates = updates } = await updateTaskAssignmentWithSchemaFallback(task, updates);
  if (updateError) return res.status(500).json({ error: updateError.message });

  await recordTaskCommunicationEvent({
    verb: 'assign',
    status: 'assigned',
    workflowId: task.workflow_id,
    taskId: task.id,
    taskTitle: task.title,
    actor: actorName,
    actorRole: auth.source === 'internal' ? 'system' : 'coordinator',
    recipient: assigneeEmail,
    recipientRole: assigneeRole || 'participant',
    channel: 'record',
    detail: [
      task.title + ' assigned to ' + assigneeName + ' <' + assigneeEmail + '>',
      assigneeRole ? 'Role: ' + assigneeRole : '',
      assigneePhone ? 'Phone: ' + assigneePhone : '',
    ].filter(Boolean).join(' | '),
  });

  return res.status(200).json({
    success: true,
    task: Object.assign({}, task, savedUpdates, { owner_label: assigneeName }),
    confirmation: 'Recipient saved. Passage can send this task message now.',
    skippedColumns,
  });
}
