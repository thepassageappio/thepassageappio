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

async function getPartnerData(token) {
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user?.email) throw Object.assign(new Error('Session could not be verified.'), { status: 401 });

  const email = user.email.toLowerCase();
  const { data: memberships, error: memberError } = await admin
    .from('organization_members')
    .select('organization_id, organizations(name)')
    .ilike('email', email)
    .eq('status', 'active');
  if (memberError) throw memberError;
  const organizationIds = (memberships || []).map(m => m.organization_id).filter(Boolean);
  if (!organizationIds.length) return { user, rows: [], orgName: 'Passage partner' };

  const { data: workflows, error: workflowError } = await admin
    .from('workflows')
    .select('id,name,estate_name,deceased_name,coordinator_name,coordinator_email,coordinator_phone,organization_case_reference,mode,status,updated_at')
    .in('organization_id', organizationIds)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false });
  if (workflowError) throw workflowError;

  const workflowIds = (workflows || []).map(w => w.id);
  const [{ data: tasks }, { data: communications }, { data: vendorRequests }] = workflowIds.length
    ? await Promise.all([
      admin
        .from('tasks')
        .select('workflow_id,title,status,last_action_at,last_actor,channel,recipient,assigned_to_name,assigned_to_email,proof_required,waiting_on')
        .in('workflow_id', workflowIds)
        .order('last_action_at', { ascending: false, nullsFirst: false }),
      admin
        .from('notification_log')
        .select('workflow_id,channel,recipient_name,recipient_email,recipient_phone,subject,status,sent_at,delivered_at,error_message')
        .in('workflow_id', workflowIds)
        .order('created_at', { ascending: false }),
      admin
        .from('vendor_requests')
        .select('workflow_id,task_title,status,urgency,requested_at,responded_at,completed_at,estimated_value,final_value,vendors(business_name,contact_email,contact_phone,category)')
        .in('workflow_id', workflowIds)
        .order('requested_at', { ascending: false }),
    ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const taskRows = [];
  for (const workflow of workflows || []) {
    const caseTasks = (tasks || []).filter(t => t.workflow_id === workflow.id);
    if (!caseTasks.length) {
      taskRows.push({ workflow, task: null });
    } else {
      for (const task of caseTasks) taskRows.push({ workflow, task });
    }
    const caseMessages = (communications || []).filter(c => c.workflow_id === workflow.id);
    for (const communication of caseMessages) taskRows.push({ workflow, communication });
    const caseVendorRequests = (vendorRequests || []).filter(v => v.workflow_id === workflow.id);
    for (const vendorRequest of caseVendorRequests) taskRows.push({ workflow, vendorRequest });
  }

  return {
    user,
    orgName: memberships?.[0]?.organizations?.name || 'Passage partner',
    rows: taskRows,
  };
}

function buildCsv(rows) {
  const header = [
    'Case',
    'Record type',
    'Case type',
    'Reference',
    'Family contact',
    'Family email',
    'Family phone',
    'Task',
    'Assigned participant',
    'Status',
    'Waiting on',
    'Proof needed',
    'Last action at',
    'Last actor',
    'Channel',
    'Recipient',
    'Message subject',
    'Message sent at',
    'Message delivered at',
    'Message error',
    'Estimated value',
    'Final value',
  ];
  const lines = [header.map(csvCell).join(',')];
  for (const { workflow, task, communication, vendorRequest } of rows) {
    lines.push([
      workflow.estate_name || workflow.deceased_name || workflow.name,
      vendorRequest ? 'vendor_request' : communication ? 'communication' : 'task',
      workflow.mode === 'funeral_home_preneed' ? 'Pre-need / prepaid' : 'At-need',
      workflow.organization_case_reference,
      workflow.coordinator_name,
      workflow.coordinator_email,
      workflow.coordinator_phone,
      task?.title,
      task?.assigned_to_name || task?.assigned_to_email,
      vendorRequest?.status || communication?.status || task?.status || workflow.status,
      task?.waiting_on,
      task?.proof_required,
      task?.last_action_at,
      task?.last_actor,
      vendorRequest ? 'vendor' : communication?.channel || task?.channel,
      vendorRequest?.vendors?.business_name || vendorRequest?.vendors?.contact_email || vendorRequest?.vendors?.contact_phone || communication?.recipient_name || communication?.recipient_email || communication?.recipient_phone || task?.recipient || task?.assigned_to_name || task?.assigned_to_email,
      vendorRequest ? vendorRequest.task_title : communication?.subject,
      vendorRequest?.requested_at || communication?.sent_at,
      vendorRequest?.responded_at || vendorRequest?.completed_at || communication?.delivered_at,
      communication?.error_message,
      vendorRequest?.estimated_value,
      vendorRequest?.final_value,
    ].map(csvCell).join(','));
  }
  return lines.join('\n');
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });

  try {
    const { user, rows, orgName } = await getPartnerData(token);
    const csv = buildCsv(rows);
    const filename = `passage-${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'partner'}-cases.csv`;

    if (req.method === 'POST' || req.query.email === '1') {
      const key = process.env.RESEND_API_KEY;
      if (!key) return res.status(200).json({ success: true, skipped: true, message: 'CSV generated, email skipped because Resend is not configured.' });
      const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [user.email],
          subject: 'Your Passage funeral home case export',
          html: `<p>Your Passage case export is attached.</p><p>This includes cases, family contacts, task status, and last action details.</p>`,
          attachments: [{ filename, content: Buffer.from(csv, 'utf8').toString('base64') }],
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) return res.status(500).json({ error: json.message || json.error || 'Could not email CSV export.' });
      return res.status(200).json({ success: true, emailedTo: user.email });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not export partner cases.' });
  }
}
