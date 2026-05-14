import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';
import { verifyDeliveryRequest, internalHeaders } from '../../../lib/deliveryAuth';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = url && service ? createClient(url, service) : null;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const STEVE_EMAIL = 'steventurrisi@gmail.com';

function clean(value) {
  return String(value || '').trim();
}

async function findAdminUserId() {
  if (!admin) return null;
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = data?.users || [];
  return users.find((user) => String(user.email || '').toLowerCase() === STEVE_EMAIL)?.id || users[0]?.id || null;
}

async function safeDelete(table, column, value) {
  if (!admin || !value) return;
  await admin.from(table).delete().eq(column, value).then(() => {}, () => {});
}

async function apiPost(path, body, bearerToken = '') {
  const response = await fetch(`${SITE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...internalHeaders(),
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, json };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!admin) return res.status(500).json({ error: 'Supabase service role is not configured.' });

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const requestBearerToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const actorEmail = String(auth.user?.email || req.body?.actorEmail || '').toLowerCase();
  if (auth.source !== 'internal' && !isPassageAdmin(actorEmail)) {
    return res.status(403).json({ error: 'Passage admin access is required.' });
  }

  const keepRecords = req.body?.keepRecords === true;
  const recipientEmail = clean(req.body?.recipientEmail) || STEVE_EMAIL;
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const created = { organizationId: null, workflowId: null, taskId: null };
  const checks = [];

  try {
    const adminUserId = await findAdminUserId();
    if (!adminUserId) return res.status(500).json({ error: 'No admin auth user was available for the simulation.' });

    const { data: organization, error: orgError } = await admin.from('organizations').insert([{
      type: 'funeral_home',
      name: `QA Coordination FH ${stamp}`,
      slug: `qa-coordination-fh-${stamp}-${randomUUID().slice(0, 6)}`,
      support_email: recipientEmail,
      from_name: 'QA Coordination Funeral Home',
      white_label_enabled: true,
      created_by: adminUserId,
    }]).select('id').single();
    if (orgError) throw orgError;
    created.organizationId = organization.id;

    await admin.from('organization_members').insert([{
      organization_id: organization.id,
      user_id: adminUserId,
      email: recipientEmail,
      role: 'owner',
      status: 'active',
    }]).then(() => {}, () => {});

    const { data: workflow, error: workflowError } = await admin.from('workflows').insert([{
      user_id: adminUserId,
      organization_id: organization.id,
      name: `QA coordination simulation ${stamp}`,
      estate_name: `QA coordination simulation ${stamp}`,
      deceased_name: `QA Loved One ${stamp}`,
      coordinator_name: 'Steve QA',
      coordinator_email: recipientEmail,
      status: 'active',
      activation_status: 'activated',
      path: 'red',
      mode: 'urgent',
      setup_stage: 'qa_coordination_smoke',
      orchestration_summary: {
        qa_smoke_test: true,
        purpose: 'Temporary coordination, communication, and notification spine simulation.',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select('id,deceased_name,coordinator_name,coordinator_email').single();
    if (workflowError) throw workflowError;
    created.workflowId = workflow.id;

    const { data: task, error: taskError } = await admin.from('tasks').insert([{
      workflow_id: workflow.id,
      user_id: adminUserId,
      title: 'QA confirm family coordination proof',
      description: 'Temporary smoke-test task for coordination and notification verification.',
      category: 'service',
      priority: 'urgent',
      status: 'assigned',
      assigned_to_name: 'QA Funeral Home Director',
      assigned_to_email: recipientEmail,
      recipient: recipientEmail,
      channel: 'email',
      automation_level: 'SEND_TRACK',
      execution_kind: 'message',
      waiting_on: 'funeral home proof',
      funeral_home_eligible: true,
      proof_required: 'QA proof recorded',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select('id,title').single();
    if (taskError) throw taskError;
    created.taskId = task.id;

    checks.push({
      name: 'temporary_case_created',
      ok: true,
      workflowId: workflow.id,
      taskId: task.id,
    });

    const partnerProof = await apiPost('/api/partnerHandleTask', {
      taskId: task.id,
      note: 'QA proof: funeral-home staff recorded proof, family notification requested, and the case spine should update.',
      sendFamilyEmail: true,
      actor: recipientEmail,
    }, requestBearerToken);
    checks.push({ name: 'funeral_home_close_with_proof', ...partnerProof });

    const assignmentEmail = await apiPost('/api/sendEmail', {
      to: recipientEmail,
      toName: 'Steve QA',
      subject: 'QA Passage task assignment',
      taskTitle: task.title,
      taskId: task.id,
      deceasedName: workflow.deceased_name,
      coordinatorName: workflow.coordinator_name,
      workflowId: workflow.id,
      actionType: 'assignment',
    }, requestBearerToken);
    checks.push({ name: 'participant_assignment_email', ...assignmentEmail });

    const familyUpdate = await apiPost('/api/familyUpdate', {
      actorEmail: recipientEmail,
      workflowId: workflow.id,
      audience: 'immediate_family',
      tone: 'simple',
      subject: 'QA Passage family update',
      message: 'QA family update: this is a temporary reviewed update proving Passage can send and record communication status on the family spine.',
      channel: 'email',
      recipients: [recipientEmail],
      reviewedBy: 'Steve QA',
    }, requestBearerToken);
    checks.push({ name: 'reviewed_family_update_email', ...familyUpdate });

    const smsDryRun = await apiPost('/api/sendSMS', {
      to: '+18455797644',
      toName: 'Steve QA',
      toEmail: recipientEmail,
      taskTitle: task.title,
      taskId: task.id,
      deceasedName: workflow.deceased_name,
      coordinatorName: workflow.coordinator_name,
      workflowId: workflow.id,
      actionType: 'assignment',
      dryRun: true,
    }, requestBearerToken);
    checks.push({ name: 'sms_dry_run_no_send', ...smsDryRun });

    const activationTables = await Promise.all([
      admin.from('activation_witnesses').select('id').limit(1),
      admin.from('activation_requests').select('id').limit(1),
      admin.from('activation_confirmations').select('id').limit(1),
    ]);
    checks.push({
      name: 'green_red_activation_tables_available',
      ok: activationTables.every((result) => !result.error),
      errors: activationTables.map((result) => result.error?.message).filter(Boolean),
    });

    const [{ data: taskAfter }, { data: notificationRows }, { data: statusEvents }, { data: estateEvents }] = await Promise.all([
      admin.from('tasks').select('id,status,last_actor,last_action_at,completed_at,completed_by_email').eq('id', task.id).maybeSingle(),
      admin.from('notification_log').select('*').eq('workflow_id', workflow.id),
      admin.from('task_status_events').select('*').eq('workflow_id', workflow.id),
      admin.from('estate_events').select('*').eq('estate_id', workflow.id),
    ]);

    checks.push({
      name: 'spine_rows_recorded',
      ok: Boolean((notificationRows || []).length && (statusEvents || []).length && (estateEvents || []).length),
      taskStatus: taskAfter?.status || null,
      notificationCount: (notificationRows || []).length,
      statusEventCount: (statusEvents || []).length,
      estateEventCount: (estateEvents || []).length,
      notificationStatuses: Array.from(new Set((notificationRows || []).map((row) => row.status).filter(Boolean))),
      notificationSources: Array.from(new Set((notificationRows || []).map((row) => row.source).filter(Boolean))),
    });

    if (!keepRecords) {
      await safeDelete('notification_log', 'workflow_id', workflow.id);
      await safeDelete('task_status_events', 'workflow_id', workflow.id);
      await safeDelete('estate_events', 'estate_id', workflow.id);
      await safeDelete('announcements', 'estate_id', workflow.id);
      await safeDelete('tasks', 'workflow_id', workflow.id);
      await safeDelete('workflows', 'id', workflow.id);
      await safeDelete('organization_members', 'organization_id', organization.id);
      await safeDelete('organizations', 'id', organization.id);
    }

    const passed = checks.every((check) => {
      if (check.ok === false) return false;
      if (typeof check.status === 'number' && check.status >= 400) return false;
      return true;
    });
    return res.status(passed ? 200 : 207).json({
      success: passed,
      keepRecords,
      recipientEmail,
      cleanedUp: !keepRecords,
      checks,
    });
  } catch (error) {
    if (!keepRecords) {
      if (created.workflowId) {
        await safeDelete('notification_log', 'workflow_id', created.workflowId);
        await safeDelete('task_status_events', 'workflow_id', created.workflowId);
        await safeDelete('estate_events', 'estate_id', created.workflowId);
        await safeDelete('announcements', 'estate_id', created.workflowId);
        await safeDelete('tasks', 'workflow_id', created.workflowId);
        await safeDelete('workflows', 'id', created.workflowId);
      }
      if (created.organizationId) {
        await safeDelete('organization_members', 'organization_id', created.organizationId);
        await safeDelete('organizations', 'id', created.organizationId);
      }
    }
    return res.status(500).json({
      success: false,
      cleanedUp: !keepRecords,
      error: error.message || 'Coordination smoke test failed.',
      created,
      checks,
    });
  }
}
