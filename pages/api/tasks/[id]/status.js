import { verifyDeliveryRequest } from '../../../../lib/deliveryAuth';
import { serviceSupabase, isUuid } from '../../../../lib/taskStatus';
import { isPassageAdmin } from '../../../../lib/adminAccess';
import { taskActionConfirmation, taskActionOutcomeStatus } from '../../../../lib/taskActions';
import { recordTaskCommunicationEvent } from '../../../../lib/communicationEvents';

const allowedStatuses = new Set(['waiting', 'pending', 'acknowledged', 'handled', 'completed', 'done', 'blocked', 'not_applicable']);
const allowedChannels = new Set(['email', 'sms', 'call', 'website', 'record', 'participant']);

function normalizeStoredStatus(status) {
  if (['handled', 'completed', 'done'].includes(status)) return 'handled';
  if (status === 'waiting') return 'waiting';
  if (status === 'pending') return 'pending';
  return status;
}

function missingColumnFrom(error) {
  const message = String(error?.message || error?.details || '');
  const match = message.match(/'([^']+)'\s+column/i) || message.match(/column\s+"?([a-z0-9_]+)"?\s+.*does not exist/i);
  return match?.[1] || '';
}

async function updateTaskWithSchemaFallback(task, updates) {
  const skippedColumns = [];
  let remaining = { ...updates };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { error } = await serviceSupabase
      .from('tasks')
      .update(remaining)
      .eq('id', task.id)
      .eq('workflow_id', task.workflow_id);

    if (!error) return { skippedColumns };

    const missingColumn = missingColumnFrom(error);
    if (!missingColumn || !(missingColumn in remaining)) {
      return { error };
    }

    skippedColumns.push(missingColumn);
    const { [missingColumn]: _omitted, ...nextRemaining } = remaining;
    remaining = nextRemaining;
  }

  return { error: new Error('Task update could not be saved after schema fallback.') };
}

async function userCanUpdateTask(auth, task) {
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

  const { status, channel, recipient, detail, notes, outcomeStatus, followUpAt, actor } = req.body || {};
  if (!allowedStatuses.has(status)) return res.status(400).json({ error: 'Invalid task status.' });
  if (channel && !allowedChannels.has(channel)) return res.status(400).json({ error: 'Invalid task channel.' });
  const storedStatus = normalizeStoredStatus(status);
  const proofText = [detail, notes].map((value) => String(value || '').trim()).filter(Boolean).join(' ');
  if (['handled', 'waiting', 'blocked'].includes(storedStatus) && proofText.length < 8) {
    return res.status(400).json({ error: 'Add a short proof, waiting point, or blocker note before saving this task update.' });
  }

  const { data: task, error } = await serviceSupabase
    .from('tasks')
    .select('id,workflow_id,title,assigned_to_name,assigned_to_email')
    .eq('id', taskId)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  const allowed = await userCanUpdateTask(auth, task);
  if (!allowed) return res.status(403).json({ error: 'You do not have access to update this task.' });

  const now = new Date().toISOString();
  const actorName = actor || auth.user?.user_metadata?.full_name || auth.user?.email || 'Passage';
  const actorEmail = auth.user?.email || (String(actor || '').includes('@') ? String(actor).toLowerCase() : null);
  const terminalStatus = storedStatus === 'handled';
  const updates = {
    status: storedStatus,
    last_action_at: now,
    last_actor: actorName,
    channel: channel || 'record',
    recipient: recipient || task.assigned_to_name || task.assigned_to_email || null,
  };
  if (terminalStatus) {
    updates.completed_at = now;
    updates.completed_by = actorName;
    updates.completed_by_email = actorEmail;
  }
  if (storedStatus === 'acknowledged') updates.acknowledged_at = now;
  if (typeof notes === 'string') updates.notes = notes.trim();
  const resolvedOutcomeStatus = outcomeStatus || taskActionOutcomeStatus(status);
  if (resolvedOutcomeStatus) updates.outcome_status = resolvedOutcomeStatus;
  if (followUpAt) updates.follow_up_at = new Date(followUpAt).toISOString();
  updates.updated_at = now;

  const { error: updateError, skippedColumns = [] } = await updateTaskWithSchemaFallback(task, updates);
  if (updateError) return res.status(500).json({ error: updateError.message });

  const noteText = typeof notes === 'string' && notes.trim() ? notes.trim() : '';
  const detailText = [
    detail || `${task.title} - ${status.replace(/_/g, ' ')}`,
    noteText && skippedColumns.includes('notes') ? `Note: ${noteText}` : '',
  ].filter(Boolean).join(' ');
  const result = await recordTaskCommunicationEvent({
    workflowId: task.workflow_id,
    taskId: isUuid(task.id) ? task.id : taskId,
    status: storedStatus,
    actor: actorName,
    actorRole: auth.source === 'internal' ? 'system' : 'coordinator',
    channel: channel || 'record',
    recipient: recipient || task.assigned_to_name || task.assigned_to_email || null,
    recipientRole: channel === 'participant' ? 'participant' : '',
    detail: detailText,
  });

  return res.status(200).json({
    success: true,
    result,
    task: {
      id: task.id,
      workflowId: task.workflow_id,
      title: task.title,
      status: storedStatus,
      requestedStatus: status,
      outcomeStatus: resolvedOutcomeStatus,
    },
    confirmation: taskActionConfirmation(status, task, auth.source === 'internal' ? 'system' : 'family'),
    eventDetail: detailText,
    spine: {
      ask: task.title,
      owner: task.assigned_to_name || task.assigned_to_email || null,
      waiting: storedStatus === 'waiting' ? detailText : storedStatus === 'blocked' ? 'Coordinator or assigned owner must clear the blocker.' : 'No waiting point after this update.',
      proof: detailText,
      notification: 'Task spine event saved. External messages are sent only through reviewed send actions.',
    },
    skippedColumns,
  });
}
