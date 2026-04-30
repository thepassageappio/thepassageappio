import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

  const email = userData.user.email.toLowerCase();
  const { kind, id, action, notes, outcomeStatus, followUpAt } = req.body || {};
  if (!id || !['task', 'action'].includes(kind) || !['accept', 'handled', 'help', 'waiting', 'needs_details', 'quoted', 'scheduled', 'delivered', 'confirmed', 'unavailable'].includes(action)) {
    return res.status(400).json({ error: 'Invalid participant action.' });
  }

  const status = action === 'accept' ? 'acknowledged'
    : ['handled', 'delivered', 'confirmed'].includes(action) ? 'handled'
    : ['waiting', 'needs_details', 'quoted', 'scheduled'].includes(action) ? 'waiting'
    : ['help', 'unavailable'].includes(action) ? 'blocked'
    : 'needs_review';
  const stamp = action === 'accept' ? 'accepted_at'
    : status === 'handled' ? 'handled_at'
    : 'help_requested_at';
  const table = kind === 'task' ? 'tasks' : 'workflow_actions';
  const emailColumn = kind === 'task' ? 'assigned_to_email' : 'recipient_email';

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
  const { data, error } = await admin
    .from(table)
    .update(updates)
    .eq('id', id)
    .ilike(emailColumn, email)
    .select(kind === 'task' ? 'id,status,workflow_id,title' : 'id,status,workflow_id,subject,task_title')
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'No matching task found for this email.' });
  await admin.from('estate_events').insert([{
    estate_id: data.workflow_id,
    event_type: status === 'handled' ? 'participant_handled' : status === 'waiting' ? 'participant_waiting' : status === 'acknowledged' ? 'participant_acknowledged' : status === 'blocked' ? 'participant_blocked' : 'participant_updated',
    title: status === 'handled' ? 'Participant handled a task' : status === 'waiting' ? 'Participant update waiting' : status === 'acknowledged' ? 'Participant confirmed a task' : status === 'blocked' ? 'Participant needs help' : 'Participant updated a task',
    description: (data.title || data.task_title || data.subject || 'Assigned task') + ' - ' + action.replace(/_/g, ' '),
    actor: email,
  }]).catch(() => {});
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
  }]).catch(() => {});
  return res.status(200).json({ success: true, item: data });
}
