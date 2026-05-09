import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, service);

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function firstPresent(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).trim() !== '') || null;
}

function participantEmail(row) {
  return normalizeEmail(firstPresent(row?.email, row?.participant_email, row?.recipient_email, row?.contact_email));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const inviteToken = String(req.query.token || req.query.invite || req.query.invite_token || '').trim();
  if (!inviteToken) return res.status(400).json({ error: 'Invite token is required.' });

  const { data: participant, error } = await admin
    .from('estate_participants')
    .select('*')
    .eq('invite_token', inviteToken)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!participant) return res.status(404).json({ error: 'This invite link was not found. Ask the coordinator to resend it.' });

  const workflowId = firstPresent(participant.workflow_id, participant.estate_id);
  const taskId = firstPresent(participant.task_id, participant.assigned_task_id, participant.workflow_task_id);

  let workflow = null;
  if (workflowId) {
    const { data } = await admin
      .from('workflows')
      .select('id,name,deceased_name,estate_name,coordinator_name,coordinator_email,status,activation_status')
      .eq('id', workflowId)
      .maybeSingle();
    workflow = data || null;
  }

  let task = null;
  if (taskId) {
    const { data } = await admin
      .from('tasks')
      .select('id,title,description,status')
      .eq('id', taskId)
      .maybeSingle();
    task = data || null;
  }

  return res.status(200).json({
    inviteStatus: participant.invite_status || 'prepared',
    estate: workflow ? {
      id: workflow.id,
      name: workflow.deceased_name || workflow.estate_name || workflow.name || 'this estate',
      coordinatorName: workflow.coordinator_name || 'the family coordinator',
      coordinatorEmail: workflow.coordinator_email || null,
      status: workflow.status || workflow.activation_status || 'active',
    } : null,
    task: task ? {
      id: task.id,
      title: task.title || 'Assigned responsibility',
      description: task.description || '',
      status: task.status || 'assigned',
    } : null,
    participant: {
      role: participant.role || participant.participant_role || 'participant',
      emailHint: participantEmail(participant) ? participantEmail(participant).replace(/^(.{2}).*(@.*)$/, '$1***$2') : null,
    },
  });
}
