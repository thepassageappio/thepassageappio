import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const estateId = req.query.id;
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });
  if (!estateId) return res.status(400).json({ error: 'Missing estate id.' });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

  const { data: workflow, error: workflowError } = await admin
    .from('workflows')
    .select('id,user_id,name,estate_name,deceased_name,coordinator_name,coordinator_email,coordinator_phone,status,path,mode,organization_case_reference')
    .eq('id', estateId)
    .maybeSingle();
  if (workflowError) return res.status(500).json({ error: workflowError.message });
  if (!workflow) return res.status(404).json({ error: 'Estate not found.' });

  const email = user.email.toLowerCase();
  let allowed = workflow.user_id === user.id || String(workflow.coordinator_email || '').toLowerCase() === email;
  if (!allowed) {
    const { data: access } = await admin
      .from('estate_access')
      .select('id')
      .eq('workflow_id', estateId)
      .ilike('email', email)
      .neq('status', 'revoked')
      .limit(1);
    allowed = !!access?.length;
  }
  if (!allowed) return res.status(403).json({ error: 'You do not have access to export this estate.' });

  const [{ data: tasks }, { data: people }, { data: communications }] = await Promise.all([
    admin.from('tasks').select('title,status,assigned_to_name,assigned_to_email,last_action_at,last_actor,channel,recipient,notes,proof_required,waiting_on').eq('workflow_id', estateId).order('created_at', { ascending: true }),
    admin.from('people').select('name,email,phone,role,relationship,status').eq('estate_id', estateId).order('created_at', { ascending: true }),
    admin.from('notification_log').select('channel,recipient_name,recipient_email,recipient_phone,subject,status,sent_at,delivered_at,error_message').eq('workflow_id', estateId).order('created_at', { ascending: false }),
  ]);

  const headers = ['Estate', 'Record type', 'Family contact', 'Family email', 'Family phone', 'Task', 'Assigned participant', 'Participant email', 'Status', 'Waiting on', 'Proof needed', 'Last action at', 'Last actor', 'Channel', 'Recipient', 'Message subject', 'Message sent at', 'Message delivered at', 'Message error', 'Notes'];
  const lines = [headers.map(csvCell).join(',')];

  for (const task of tasks || []) {
    lines.push([
      workflow.estate_name || workflow.deceased_name || workflow.name,
      'task',
      workflow.coordinator_name,
      workflow.coordinator_email,
      workflow.coordinator_phone,
      task.title,
      task.assigned_to_name,
      task.assigned_to_email,
      task.status,
      task.waiting_on,
      task.proof_required,
      task.last_action_at,
      task.last_actor,
      task.channel,
      task.recipient,
      '',
      '',
      '',
      '',
      task.notes,
    ].map(csvCell).join(','));
  }

  for (const person of people || []) {
    lines.push([
      workflow.estate_name || workflow.deceased_name || workflow.name,
      'participant',
      workflow.coordinator_name,
      workflow.coordinator_email,
      workflow.coordinator_phone,
      '',
      person.name,
      person.email,
      person.status,
      '',
      '',
      '',
      '',
      '',
      person.phone,
      '',
      '',
      '',
      '',
      `${person.role || ''} ${person.relationship || ''}`.trim(),
    ].map(csvCell).join(','));
  }

  for (const message of communications || []) {
    lines.push([
      workflow.estate_name || workflow.deceased_name || workflow.name,
      'communication',
      workflow.coordinator_name,
      workflow.coordinator_email,
      workflow.coordinator_phone,
      '',
      '',
      '',
      message.status,
      '',
      '',
      '',
      '',
      message.channel,
      message.recipient_name || message.recipient_email || message.recipient_phone,
      message.subject,
      message.sent_at,
      message.delivered_at,
      message.error_message,
      '',
    ].map(csvCell).join(','));
  }

  const filename = `passage-${(workflow.estate_name || workflow.deceased_name || workflow.name || 'estate').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(lines.join('\n'));
}
