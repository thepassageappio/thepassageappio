import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

async function notifyCoordinator({ workflowId, actorEmail, status, action, taskTitle, notes }) {
  if (!workflowId || !process.env.RESEND_API_KEY) return;
  const { data: workflow } = await admin
    .from('workflows')
    .select('id,deceased_name,name,coordinator_name,coordinator_email,user_id')
    .eq('id', workflowId)
    .maybeSingle();
  const to = workflow?.coordinator_email;
  if (!to || String(to).toLowerCase() === String(actorEmail).toLowerCase()) return;

  const deceased = workflow.deceased_name || workflow.name || 'this estate';
  const statusLine = status === 'handled' ? 'marked this as handled'
    : status === 'waiting' ? 'updated this as waiting'
    : status === 'acknowledged' ? 'accepted this task'
    : status === 'blocked' ? 'needs help with this task'
    : 'updated this task';
  const safeNotes = notes ? `<p style="color:#6a6560;font-size:14px;line-height:1.7;margin:10px 0 0;"><strong>Note:</strong> ${String(notes).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : '';
  const html = `<!doctype html><html><body style="font-family:Georgia,serif;background:#f6f3ee;margin:0;padding:28px 16px;">
    <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e4ddd4;">
      <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#6b8f71;font-weight:800;margin-bottom:14px;">Passage update</div>
      <div style="font-size:22px;line-height:1.3;color:#1a1916;margin-bottom:10px;">${actorEmail} ${statusLine}.</div>
      <p style="color:#6a6560;font-size:14px;line-height:1.7;margin:0;">Estate: ${deceased}</p>
      <p style="color:#1a1916;font-size:15px;line-height:1.6;margin:10px 0 0;"><strong>Task:</strong> ${taskTitle || 'Assigned task'}</p>
      ${safeNotes}
      <a href="${SITE_URL}/estate?id=${workflowId}" style="display:inline-block;background:#6b8f71;color:#fff;text-decoration:none;padding:12px 18px;border-radius:11px;font-size:14px;font-weight:800;margin-top:18px;">Open estate</a>
    </div>
  </body></html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>',
      to: [to],
      subject: `Passage update: ${taskTitle || 'task updated'}`,
      html,
    }),
  }).catch(() => null);
  const json = response ? await response.json().catch(() => ({})) : {};
  await admin.from('notification_log').insert([{
    workflow_id: workflowId,
    channel: 'email',
    recipient_email: to,
    recipient_name: workflow.coordinator_name || to,
    subject: `Passage update: ${taskTitle || 'task updated'}`,
    provider: 'resend',
    provider_id: response?.ok ? json.id || null : null,
    status: response?.ok ? 'sent' : 'failed',
    sent_at: response?.ok ? new Date().toISOString() : null,
    error_message: response?.ok ? null : (json?.message || json?.error || 'Coordinator notification failed'),
  }]).then(() => {}, () => {});
}

function schemaColumnError(error) {
  const message = String(error?.message || error || '');
  return /schema cache|column .* does not exist|Could not find the .* column/i.test(message);
}

function itemSelect(kind) {
  return kind === 'task'
    ? 'id,status,workflow_id,title'
    : 'id,status,workflow_id,subject,task_title';
}

async function updateParticipantRecord({ table, kind, emailColumn, id, email, updates }) {
  const baseQuery = () => admin
    .from(table)
    .update(updates)
    .eq('id', id)
    .ilike(emailColumn, email)
    .select(itemSelect(kind))
    .maybeSingle();

  let result = await baseQuery();
  if (!result.error || !schemaColumnError(result.error)) return result;

  const saferUpdates = {};
  ['status', 'notes', 'updated_at', 'outcome_status', 'follow_up_at'].forEach(key => {
    if (updates[key] !== undefined) saferUpdates[key] = updates[key];
  });
  result = await admin
    .from(table)
    .update(saferUpdates)
    .eq('id', id)
    .ilike(emailColumn, email)
    .select(itemSelect(kind))
    .maybeSingle();
  if (!result.error || !schemaColumnError(result.error)) return result;

  const safestUpdates = {};
  ['status', 'notes'].forEach(key => {
    if (updates[key] !== undefined) safestUpdates[key] = updates[key];
  });
  return admin
    .from(table)
    .update(safestUpdates)
    .eq('id', id)
    .ilike(emailColumn, email)
    .select(itemSelect(kind))
    .maybeSingle();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

  const email = userData.user.email.toLowerCase();
  const { kind, id, action, notes, outcomeStatus, followUpAt } = req.body || {};
  if (!id || !['task', 'action'].includes(kind) || !['accept', 'handled', 'help', 'waiting', 'needs_details', 'quoted', 'scheduled', 'delivered', 'confirmed', 'unavailable', 'save_note'].includes(action)) {
    return res.status(400).json({ error: 'Invalid participant action.' });
  }

  const table = kind === 'task' ? 'tasks' : 'workflow_actions';
  const emailColumn = kind === 'task' ? 'assigned_to_email' : 'recipient_email';

  if (action === 'save_note') {
    const trimmed = typeof notes === 'string' ? notes.trim() : '';
    if (!trimmed) return res.status(400).json({ error: 'Add a note to save.' });
    const { data, error } = await updateParticipantRecord({
      table,
      kind,
      emailColumn,
      id,
      email,
      updates: { notes: trimmed, updated_at: new Date().toISOString() },
    });
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'No matching task found for this email.' });

    await admin.from('estate_events').insert([{
      estate_id: data.workflow_id,
      event_type: 'participant_note',
      title: 'Participant added a note',
      description: (data.title || data.task_title || data.subject || 'Assigned task') + ' - note saved',
      actor: email,
    }]).then(() => {}, () => {});

    await admin.from('task_status_events').insert([{
      workflow_id: data.workflow_id,
      task_id: kind === 'task' ? data.id : null,
      action_id: kind === 'action' ? data.id : null,
      status: data.status || 'in_progress',
      last_action_at: new Date().toISOString(),
      last_actor: email,
      channel: 'participant',
      recipient: email,
      detail: (data.title || data.task_title || data.subject || 'Assigned task') + ' - note saved',
    }]).then(() => {}, () => {});

    await notifyCoordinator({
      workflowId: data.workflow_id,
      actorEmail: email,
      status: data.status || 'waiting',
      action,
      taskTitle: data.title || data.task_title || data.subject || 'Assigned task',
      notes: trimmed,
    });

    return res.status(200).json({ success: true, item: data });
  }

  const status = action === 'accept' ? 'acknowledged'
    : ['handled', 'delivered', 'confirmed'].includes(action) ? 'handled'
    : ['waiting', 'needs_details', 'quoted', 'scheduled'].includes(action) ? 'waiting'
    : ['help', 'unavailable'].includes(action) ? 'blocked'
    : 'needs_review';
  const stamp = action === 'accept' ? 'accepted_at'
    : status === 'handled' ? 'handled_at'
    : 'help_requested_at';

  const updates = {
    status,
    [stamp]: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    outcome_status: outcomeStatus || action,
    completed_by_email: email,
    coordinator_notified_at: new Date().toISOString(),
    last_action_at: new Date().toISOString(),
    last_actor: email,
    channel: 'participant',
    recipient: email,
  };
  if (status === 'acknowledged') updates.acknowledged_at = new Date().toISOString();
  if (followUpAt) updates.follow_up_at = new Date(followUpAt).toISOString();
  if (typeof notes === 'string' && notes.trim()) updates.notes = notes.trim();
  const { data, error } = await updateParticipantRecord({
    table,
    kind,
    emailColumn,
    id,
    email,
    updates,
  });

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'No matching task found for this email.' });
  await admin.from('estate_events').insert([{
    estate_id: data.workflow_id,
    event_type: status === 'handled' ? 'participant_handled' : status === 'waiting' ? 'participant_waiting' : status === 'acknowledged' ? 'participant_acknowledged' : status === 'blocked' ? 'participant_blocked' : 'participant_updated',
    title: status === 'handled' ? 'Participant handled a task' : status === 'waiting' ? 'Participant update waiting' : status === 'acknowledged' ? 'Participant confirmed a task' : status === 'blocked' ? 'Participant needs help' : 'Participant updated a task',
    description: (data.title || data.task_title || data.subject || 'Assigned task') + ' - ' + action.replace(/_/g, ' '),
    actor: email,
  }]).then(() => {}, () => {});
  await admin.from('task_status_events').insert([{
    workflow_id: data.workflow_id,
    task_id: kind === 'task' ? data.id : null,
    action_id: kind === 'action' ? data.id : null,
    status,
    last_action_at: new Date().toISOString(),
    last_actor: email,
    channel: 'participant',
    recipient: email,
    detail: (data.title || data.task_title || data.subject || 'Assigned task') + ' - ' + action.replace(/_/g, ' '),
  }]).then(() => {}, () => {});
  await notifyCoordinator({
    workflowId: data.workflow_id,
    actorEmail: email,
    status,
    action,
    taskTitle: data.title || data.task_title || data.subject || 'Assigned task',
    notes: typeof notes === 'string' ? notes.trim() : '',
  });
  return res.status(200).json({ success: true, item: data });
}
