import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

function csvCell(value) {
  let text = value == null ? '' : String(value);
  const trimmed = text.replace(/^\s+/, '');
  if (/^[=+\-@]/.test(trimmed)) text = "'" + text;
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
    .select('id,user_id,name,estate_name,deceased_name,coordinator_name,coordinator_email,coordinator_phone,status,path,mode,organization_id,organization_case_reference')
    .eq('id', estateId)
    .maybeSingle();
  if (workflowError) return res.status(500).json({ error: workflowError.message });
  if (!workflow) return res.status(404).json({ error: 'Estate not found.' });

  const email = user.email.toLowerCase();
  let allowed = workflow.user_id === user.id || String(workflow.coordinator_email || '').toLowerCase() === email;
  if (!allowed) {
    const [{ data: access }, { data: member }] = await Promise.all([
      admin
        .from('estate_access')
        .select('id')
        .eq('workflow_id', estateId)
        .ilike('email', email)
        .neq('status', 'revoked')
        .limit(1),
      workflow.organization_id
        ? admin
          .from('organization_members')
          .select('id')
          .eq('organization_id', workflow.organization_id)
          .ilike('email', email)
          .eq('status', 'active')
          .limit(1)
        : Promise.resolve({ data: [] }),
    ]);
    allowed = !!access?.length || !!member?.length;
  }
  if (!allowed) return res.status(403).json({ error: 'You do not have access to export this estate.' });

  const [{ data: tasks }, { data: people }, { data: communications }, { data: vendorRequests }] = await Promise.all([
    admin.from('tasks').select('title,status,assigned_to_name,assigned_to_email,last_action_at,last_actor,channel,recipient,notes,proof_required,waiting_on').eq('workflow_id', estateId).order('created_at', { ascending: true }),
    admin.from('people').select('name,email,phone,role,relationship,status').eq('estate_id', estateId).order('created_at', { ascending: true }),
    admin.from('notification_log').select('channel,recipient_name,recipient_email,recipient_phone,subject,status,sent_at,delivered_at,error_message').eq('workflow_id', estateId).order('created_at', { ascending: false }),
    admin.from('vendor_requests').select('task_title,status,urgency,requested_at,viewed_at,responded_at,in_progress_at,completed_at,estimated_value,final_value,platform_fee_amount,funeral_home_share_amount,passage_share_amount,payment_collection_status,vendors(business_name,contact_email,contact_phone,category)').eq('workflow_id', estateId).order('requested_at', { ascending: false }),
  ]);

  const headers = ['Estate', 'Record type', 'Family contact', 'Family email', 'Family phone', 'Task', 'Assigned participant', 'Participant email', 'Status', 'Waiting on', 'Proof needed', 'Last action at', 'Last actor', 'Channel', 'Recipient', 'Message subject', 'Message sent at', 'Vendor viewed at', 'Message delivered at', 'Vendor in progress at', 'Vendor completed at', 'Message error', 'Estimated value', 'Final value', 'Platform fee', 'Funeral home share', 'Passage share', 'Payment status', 'Notes'];
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
      '',
      '',
      '',
      '',
      '',
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
      '',
      '',
      '',
      '',
      '',
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
      '',
      message.delivered_at,
      '',
      '',
      message.error_message,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ].map(csvCell).join(','));
  }

  for (const request of vendorRequests || []) {
    lines.push([
      workflow.estate_name || workflow.deceased_name || workflow.name,
      'vendor_request',
      workflow.coordinator_name,
      workflow.coordinator_email,
      workflow.coordinator_phone,
      request.task_title,
      '',
      '',
      request.status,
      request.status === 'requested' ? 'vendor response' : '',
      'vendor confirmation',
      request.responded_at || request.completed_at || request.requested_at,
      request.vendors?.business_name,
      'vendor',
      request.vendors?.business_name || request.vendors?.contact_email || request.vendors?.contact_phone,
      request.urgency === 'rush' ? 'Rush local support request' : 'Planned local support request',
      request.requested_at,
      request.viewed_at,
      request.responded_at || request.completed_at,
      request.in_progress_at,
      request.completed_at,
      '',
      request.estimated_value,
      request.final_value,
      request.platform_fee_amount,
      request.funeral_home_share_amount,
      request.passage_share_amount,
      request.payment_collection_status,
      request.vendors?.category,
    ].map(csvCell).join(','));
  }

  const filename = `passage-${(workflow.estate_name || workflow.deceased_name || workflow.name || 'estate').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(lines.join('\n'));
}
