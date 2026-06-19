import { verifyDeliveryRequest } from '../../../../lib/deliveryAuth';
import { serviceSupabase } from '../../../../lib/taskStatus';
import { isPassageAdmin } from '../../../../lib/adminAccess';
import { recordTaskCommunicationEvent } from '../../../../lib/communicationEvents';

function isHandled(status) {
  return ['handled', 'completed', 'done'].includes(String(status || '').toLowerCase());
}

function schemaColumnError(error) {
  const message = String(error?.message || error || '');
  return /schema cache|column .* does not exist|Could not find the .* column/i.test(message);
}

function missingColumnFrom(error) {
  const message = String(error?.message || error?.details || '');
  const match = message.match(/'([^']+)'\s+column/i) || message.match(/column\s+"?([a-z0-9_]+)"?\s+.*does not exist/i);
  return match?.[1] || '';
}

async function updateCaseTaskAssignments({ workflowId, taskIds, updates }) {
  const skippedColumns = [];
  let remaining = { ...updates };

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const result = await serviceSupabase
      .from('tasks')
      .update(remaining)
      .eq('workflow_id', workflowId)
      .in('id', taskIds);

    if (!result.error) return { skippedColumns, savedUpdates: remaining };

    const missingColumn = missingColumnFrom(result.error);
    if (!missingColumn || !(missingColumn in remaining) || !schemaColumnError(result.error)) {
      return { error: result.error, skippedColumns };
    }

    skippedColumns.push(missingColumn);
    const { [missingColumn]: _omitted, ...nextRemaining } = remaining;
    remaining = nextRemaining;
  }

  return { error: new Error('Case client steps could not be assigned after schema fallback.'), skippedColumns };
}

async function userCanAssignWorkflow(auth, workflow) {
  if (auth.source === 'internal') return true;
  const email = auth.user?.email?.toLowerCase();
  const userId = auth.user?.id;
  if (!email && !userId) return false;
  if (workflow.user_id && workflow.user_id === userId) return true;
  if (workflow.coordinator_email && email && workflow.coordinator_email.toLowerCase() === email) return true;
  if (email && isPassageAdmin(email)) return true;
  if (!workflow.organization_id) return false;

  const { data: member } = await serviceSupabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', workflow.organization_id)
    .ilike('email', email || '')
    .eq('status', 'active')
    .limit(1);
  return Boolean(member?.length);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const workflowId = String(req.query.id || '').trim();
  if (!workflowId) return res.status(400).json({ error: 'Invalid case id.' });

  const { name, email, role, phone, actor, scope = 'unassigned_open' } = req.body || {};
  const assigneeEmail = String(email || '').trim().toLowerCase();
  const assigneeName = String(name || '').trim() || assigneeEmail;
  const assigneeRole = String(role || '').trim();
  const assigneePhone = String(phone || '').trim();
  const assignmentScope = scope === 'all_open' ? 'all_open' : 'unassigned_open';

  if (!assigneeName) return res.status(400).json({ error: 'Choose or add an owner before assigning this case.' });
  if (!assigneeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assigneeEmail)) {
    return res.status(400).json({ error: 'Add a valid owner email before assigning this case.' });
  }

  const { data: workflow, error: workflowError } = await serviceSupabase
    .from('workflows')
    .select('id,user_id,coordinator_email,organization_id,name,deceased_name,estate_name')
    .eq('id', workflowId)
    .maybeSingle();
  if (workflowError) return res.status(500).json({ error: workflowError.message });
  if (!workflow) return res.status(404).json({ error: 'Case not found.' });

  const allowed = await userCanAssignWorkflow(auth, workflow);
  if (!allowed) return res.status(403).json({ error: 'You do not have access to assign this case.' });

  const { data: tasks, error: tasksError } = await serviceSupabase
    .from('tasks')
    .select('id,workflow_id,title,status,assigned_to_email,assigned_to_name')
    .eq('workflow_id', workflowId);
  if (tasksError) return res.status(500).json({ error: tasksError.message });

  const targetTasks = (tasks || []).filter(task => {
    if (isHandled(task.status)) return false;
    if (assignmentScope === 'all_open') return true;
    return !task.assigned_to_email && !task.assigned_to_name;
  });

  if (!targetTasks.length) {
    return res.status(200).json({
      success: true,
      assignedCount: 0,
      confirmation: assignmentScope === 'all_open'
        ? 'No open client steps need assignment on this case.'
        : 'No unassigned open client steps remain on this case.',
    });
  }

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

  const targetTaskIds = targetTasks.map(task => task.id);
  const { error: updateError, skippedColumns = [] } = await updateCaseTaskAssignments({
    workflowId,
    taskIds: targetTaskIds,
    updates,
  });

  if (updateError) return res.status(500).json({ error: updateError.message });

  await Promise.all(targetTasks.slice(0, 12).map(task => recordTaskCommunicationEvent({
    verb: 'assign',
    status: 'assigned',
    workflowId,
    taskId: task.id,
    taskTitle: task.title,
    actor: actorName,
    actorRole: auth.source === 'internal' ? 'system' : 'partner',
    recipient: assigneeEmail,
    recipientRole: assigneeRole || 'staff',
    channel: 'record',
    detail: [
'Client step "' + task.title + '" assigned to ' + assigneeName + ' <' + assigneeEmail + '>',
      assignmentScope === 'all_open' ? 'Case assignment: all open client steps' : 'Case assignment: unassigned open client steps',
      assigneeRole ? 'Role: ' + assigneeRole : '',
      assigneePhone ? 'Phone: ' + assigneePhone : '',
    ].filter(Boolean).join(' | '),
  })));

  return res.status(200).json({
    success: true,
    assignedCount: targetTasks.length,
    assignee: { name: assigneeName, email: assigneeEmail, role: assigneeRole, phone: assigneePhone },
    scope: assignmentScope,
    confirmation: `${targetTasks.length} open client step${targetTasks.length === 1 ? '' : 's'} assigned to ${assigneeName}.`,
    skippedColumns,
  });
}
