import { createClient } from '@supabase/supabase-js';
import { passageEmailShell, passageSubject } from '../../lib/brandedEmail';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../lib/notificationSafety';
import { recommendedFuneralHomeNextAction } from '../../lib/funeralHomeNextActions';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function csvCell(value) {
  let text = value == null ? '' : String(value);
  const trimmed = text.replace(/^\s+/, '');
  if (/^[=+\-@]/.test(trimmed)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}

function dateRangeFromRequest(req) {
  const source = req.method === 'POST' ? { ...req.query, ...(req.body || {}) } : req.query || {};
  const from = source.from || source.dateFrom || '';
  const to = source.to || source.dateTo || '';
  const filters = {};
  if (from && !Number.isNaN(new Date(from).getTime())) filters.from = new Date(from).toISOString();
  if (to && !Number.isNaN(new Date(to).getTime())) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    filters.to = end.toISOString();
  }
  return filters;
}

async function getPartnerData(token, dateRange = {}) {
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

  let workflowQuery = admin
    .from('workflows')
    .select('id,name,estate_name,deceased_name,date_of_death,coordinator_name,coordinator_email,coordinator_phone,organization_case_reference,mode,setup_stage,status,orchestration_summary,updated_at')
    .in('organization_id', organizationIds)
    .neq('status', 'archived');
  if (dateRange.from) workflowQuery = workflowQuery.gte('updated_at', dateRange.from);
  if (dateRange.to) workflowQuery = workflowQuery.lte('updated_at', dateRange.to);
  const { data: workflows, error: workflowError } = await workflowQuery.order('updated_at', { ascending: false });
  if (workflowError) throw workflowError;

  const workflowIds = (workflows || []).map(w => w.id);
  const [{ data: tasks }, { data: communications }, { data: vendorRequests }, { data: events }] = workflowIds.length
    ? await Promise.all([
      admin
        .from('tasks')
        .select('workflow_id,title,status,last_action_at,last_actor,channel,recipient,assigned_to_name,assigned_to_email,proof_required,waiting_on,notes')
        .in('workflow_id', workflowIds)
        .order('last_action_at', { ascending: false, nullsFirst: false }),
      admin
        .from('notification_log')
        .select('workflow_id,channel,recipient_name,recipient_email,recipient_phone,subject,status,sent_at,delivered_at,error_message')
        .in('workflow_id', workflowIds)
        .order('created_at', { ascending: false }),
      admin
        .from('vendor_requests')
        .select('workflow_id,task_title,status,urgency,requested_at,viewed_at,responded_at,in_progress_at,completed_at,estimated_value,final_value,platform_fee_amount,funeral_home_share_amount,passage_share_amount,payment_collection_status,vendors(business_name,contact_email,contact_phone,category)')
        .in('workflow_id', workflowIds)
        .order('requested_at', { ascending: false }),
      admin
        .from('estate_events')
        .select('estate_id,event_type,title,name,date,created_at')
        .in('estate_id', workflowIds)
        .order('created_at', { ascending: false }),
    ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

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
    const caseEvents = (events || []).filter(e => e.estate_id === workflow.id);
    for (const event of caseEvents) taskRows.push({ workflow, event });
  }

  return {
    user,
    orgName: memberships?.[0]?.organizations?.name || 'Passage partner',
    rows: taskRows,
    workflows: workflows || [],
    tasks: tasks || [],
    events: events || [],
  };
}

function workflowCaseType(workflow) {
  const stage = String(workflow?.setup_stage || '');
  const mode = String(workflow?.mode || '');
  return stage.includes('preneed') || stage.includes('prepaid') || mode === 'green'
    ? 'Pre-need'
    : 'At-need';
}

function taskDetail(task, fallback = '') {
  if (!task) return '';
  return [task.title, task.waiting_on || task.notes || task.proof_required || fallback]
    .filter(Boolean)
    .join(': ');
}

function summarizeTasks(tasks, fallback = '') {
  return (tasks || [])
    .map(task => taskDetail(task, fallback))
    .filter(Boolean)
    .slice(0, 3)
    .join(' | ');
}

function buildCsv(rows) {
  const header = [
    'Case',
    'Record type',
    'Case type',
    'Prepaid / funded',
    'Total case value',
    'Prepaid amount',
    'Source system',
    'Reference',
    'Family contact',
    'Family email',
    'Family phone',
    'Date of death',
    'Event type',
    'Event date',
    'Task',
    'Assigned participant',
    'Status',
    'Waiting on',
    'Proof needed',
    'Proof / note saved',
    'Last action at',
    'Last actor',
    'Channel',
    'Recipient',
    'Message subject',
    'Message sent at',
    'Vendor viewed at',
    'Message delivered at',
    'Vendor in progress at',
    'Vendor completed at',
    'Message error',
    'Estimated value',
    'Final value',
    'Platform fee',
    'Funeral home share',
    'Passage share',
    'Payment status',
  ];
  const lines = [header.map(csvCell).join(',')];
  for (const { workflow, task, communication, vendorRequest, event } of rows) {
    const financials = workflow.orchestration_summary?.partner_financials || {};
    lines.push([
      workflow.estate_name || workflow.deceased_name || workflow.name,
      event ? 'lifecycle_event' : vendorRequest ? 'vendor_request' : communication ? 'communication' : 'task',
      workflowCaseType(workflow),
      financials.is_prepaid ? 'Yes' : 'No',
      financials.total_case_value,
      financials.prepaid_amount,
      workflow.orchestration_summary?.source_system || 'Passage',
      workflow.organization_case_reference,
      workflow.coordinator_name,
      workflow.coordinator_email,
      workflow.coordinator_phone,
      workflow.date_of_death,
      event?.event_type,
      event?.date,
      task?.title,
      task?.assigned_to_name || task?.assigned_to_email,
      vendorRequest?.status || communication?.status || task?.status || workflow.status,
      task?.waiting_on,
      task?.proof_required,
      task?.notes,
      task?.last_action_at,
      task?.last_actor,
      vendorRequest ? 'vendor' : communication?.channel || task?.channel,
      vendorRequest?.vendors?.business_name || vendorRequest?.vendors?.contact_email || vendorRequest?.vendors?.contact_phone || communication?.recipient_name || communication?.recipient_email || communication?.recipient_phone || task?.recipient || task?.assigned_to_name || task?.assigned_to_email,
      vendorRequest ? vendorRequest.task_title : communication?.subject,
      vendorRequest?.requested_at || communication?.sent_at,
      vendorRequest?.viewed_at,
      vendorRequest?.responded_at || vendorRequest?.completed_at || communication?.delivered_at,
      vendorRequest?.in_progress_at,
      vendorRequest?.completed_at,
      communication?.error_message,
      vendorRequest?.estimated_value,
      vendorRequest?.final_value,
      vendorRequest?.platform_fee_amount,
      vendorRequest?.funeral_home_share_amount,
      vendorRequest?.passage_share_amount,
      vendorRequest?.payment_collection_status,
    ].map(csvCell).join(','));
  }
  return lines.join('\n');
}

function firstEventDate(events, workflowId, types) {
  const wanted = new Set(types);
  return (events || []).find(event => event.estate_id === workflowId && wanted.has(event.event_type))?.date || '';
}

function buildCaseSummaryCsv(workflows, tasks, events) {
  const header = [
    'Case',
    'Case type',
    'Prepaid / funded',
    'Total case value',
    'Prepaid amount',
    'Source system',
    'Reference',
    'Family contact',
    'Family email',
    'Family phone',
    'Date of death',
    'Pronouncement date',
    'Release / pickup date',
    'Arrangement date',
    'Visitation / wake date',
    'Funeral / memorial date',
    'Burial / committal date',
    'Shiva / mourning date',
    'Reception date',
    'Obituary deadline',
    'Open tasks',
    'Waiting tasks',
    'Needs help tasks',
    'Handled tasks',
    'Waiting detail',
    'Needs help detail',
    'Recent proof detail',
    'Recommended next action',
    'Why now',
    'Recommended owner',
    'Recommended proof',
    'Draft message',
    'Last task action',
    'Case status',
    'Updated at',
  ];
  const lines = [header.map(csvCell).join(',')];
  for (const workflow of workflows || []) {
    const financials = workflow.orchestration_summary?.partner_financials || {};
    const caseTasks = (tasks || []).filter(task => task.workflow_id === workflow.id);
    const openTasks = caseTasks.filter(task => !['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase()));
    const waitingTasks = caseTasks.filter(task => ['sent', 'waiting', 'pending', 'assigned'].includes(String(task.status || '').toLowerCase()));
    const needsHelpTasks = caseTasks.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase()));
    const handledTasks = caseTasks.filter(task => ['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase()));
    const recommendedTask = needsHelpTasks[0] || waitingTasks[0] || openTasks[0] || handledTasks[0] || null;
    const recommended = recommendedFuneralHomeNextAction({
      caseItem: { ...workflow, tasks: caseTasks },
      task: recommendedTask,
      role: 'director',
      hasCases: true,
    });
    const lastAction = caseTasks
      .map(task => task.last_action_at)
      .filter(Boolean)
      .sort()
      .pop() || '';
    lines.push([
      workflow.estate_name || workflow.deceased_name || workflow.name,
      workflowCaseType(workflow),
      financials.is_prepaid ? 'Yes' : 'No',
      financials.total_case_value,
      financials.prepaid_amount,
      workflow.orchestration_summary?.source_system || 'Passage',
      workflow.organization_case_reference,
      workflow.coordinator_name,
      workflow.coordinator_email,
      workflow.coordinator_phone,
      workflow.date_of_death,
      firstEventDate(events, workflow.id, ['pronouncement']),
      firstEventDate(events, workflow.id, ['release']),
      firstEventDate(events, workflow.id, ['arrangement']),
      firstEventDate(events, workflow.id, ['visitation']),
      firstEventDate(events, workflow.id, ['funeral']),
      firstEventDate(events, workflow.id, ['burial']),
      firstEventDate(events, workflow.id, ['shiva']),
      firstEventDate(events, workflow.id, ['reception']),
      firstEventDate(events, workflow.id, ['obituary_deadline']),
      openTasks.length,
      waitingTasks.length,
      needsHelpTasks.length,
      handledTasks.length,
      summarizeTasks(waitingTasks, 'Waiting on confirmation'),
      summarizeTasks(needsHelpTasks, 'Needs help'),
      summarizeTasks(handledTasks, 'Proof saved'),
      recommended.label,
      recommended.reason,
      recommended.owner,
      recommended.proof,
      recommended.draft,
      lastAction,
      workflow.status,
      workflow.updated_at,
    ].map(csvCell).join(','));
  }
  return lines.join('\n');
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });

  try {
    const dateRange = dateRangeFromRequest(req);
    const { user, rows, orgName, workflows, tasks, events } = await getPartnerData(token, dateRange);
    const view = String(req.query.view || req.body?.view || '').toLowerCase();
    const summaryView = view === 'cases' || view === 'summary';
    const csv = summaryView ? buildCaseSummaryCsv(workflows, tasks, events) : buildCsv(rows);
    const filename = `passage-${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'partner'}-${summaryView ? 'case-summary' : 'full-spine'}.csv`;

    if (req.method === 'POST' || req.query.email === '1') {
      const key = process.env.RESEND_API_KEY;
      if (!key) return res.status(200).json({ success: true, skipped: true, message: 'CSV generated, email skipped because Resend is not configured.' });
      const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
      const subject = summaryView ? passageSubject('Case summary export', orgName) : passageSubject('Full spine export', orgName);
      const dashboardUrl = `${SITE_URL}/funeral-home/dashboard`;
      const route = routeEmailRecipients([user.email]);
      if (!route.actual.length) {
        await insertNotificationLog(admin, {
          channel: 'email',
          recipient_email: user.email,
          recipient_name: user.email,
          subject,
          provider: 'resend',
          provider_id: null,
          status: 'blocked',
          error_message: 'QA notification mode had no override email configured.',
          source: summaryView ? 'partner_case_summary_export' : 'partner_full_spine_export',
          ...qaAuditFields(route),
        });
        return res.status(200).json({ success: true, skipped: true, qaOverride: route.qaOverride });
      }
      const html = passageEmailShell({
        eyebrow: summaryView ? 'Case summary export' : 'Full spine export',
        title: summaryView ? 'Your case summary export is ready.' : 'Your full spine export is ready.',
        intro: summaryView
          ? 'The attached CSV includes case contacts, references, lifecycle dates, task counts, waiting points, blockers, and recent proof for your funeral-home workspace.'
          : 'The attached CSV includes cases, family contacts, task status, messages, vendor requests, proof requirements, waiting points, saved notes, and last action details.',
        preheader: 'Your Passage export is attached and the workspace link is below.',
        sections: [
          {
            label: 'Export',
            text: filename,
          },
          {
            label: 'Access boundary',
            text: 'This export is generated from the partner workspace connected to your signed-in account.',
            tone: 'soft',
          },
        ],
        ctaLabel: 'Open partner workspace',
        ctaUrl: dashboardUrl,
      });
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: route.actual,
          subject,
          html,
          attachments: [{ filename, content: Buffer.from(csv, 'utf8').toString('base64') }],
        }),
      });
      const json = await response.json().catch(() => ({}));
      await insertNotificationLog(admin, {
        channel: 'email',
        recipient_email: user.email,
        recipient_name: user.email,
        subject,
        provider: 'resend',
        provider_id: response.ok ? json.id || null : null,
        status: response.ok ? 'sent' : 'failed',
        sent_at: response.ok ? new Date().toISOString() : null,
        error_message: response.ok ? null : json.message || json.error || 'Could not email CSV export.',
        source: summaryView ? 'partner_case_summary_export' : 'partner_full_spine_export',
        ...qaAuditFields(route),
      });
      if (!response.ok) return res.status(500).json({ error: json.message || json.error || 'Could not email CSV export.' });
      return res.status(200).json({ success: true, emailedTo: user.email, actualRecipient: route.actual[0], qaOverride: route.qaOverride });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not export partner cases.' });
  }
}
