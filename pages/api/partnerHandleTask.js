import { createClient } from '@supabase/supabase-js';
import { recordTaskCommunicationEvent } from '../../lib/communicationEvents';
import { isPassageAdmin } from '../../lib/adminAccess';
import { taskActionConfirmation } from '../../lib/taskActions';
import { verifyDeliveryRequest } from '../../lib/deliveryAuth';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../lib/notificationSafety';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, service);

function missingColumnFrom(error) {
  const message = String(error?.message || error?.details || '');
  const match = message.match(/'([^']+)'\s+column/i) || message.match(/column\s+"?([a-z0-9_]+)"?\s+.*does not exist/i);
  return match?.[1] || '';
}

async function updateTaskWithSchemaFallback(task, updates) {
  const skippedColumns = [];
  let remaining = { ...updates };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await admin
      .from('tasks')
      .update(remaining)
      .eq('id', task.id)
      .eq('workflow_id', task.workflow_id)
      .select('id,status,outcome_status,last_action_at,last_actor,completed_at,completed_by,completed_by_email')
      .maybeSingle();

    if (!error) return { task: data, skippedColumns };

    const missingColumn = missingColumnFrom(error);
    if (!missingColumn || !(missingColumn in remaining)) {
      return { error };
    }

    skippedColumns.push(missingColumn);
    const { [missingColumn]: _omitted, ...nextRemaining } = remaining;
    remaining = nextRemaining;
  }

  return { error: new Error('Partner task proof could not be saved after schema fallback.') };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const user = auth.user;
  const actorEmail = String(user?.email || req.body?.actor || '').trim().toLowerCase();
  if (auth.source !== 'internal' && !actorEmail) {
    return res.status(401).json({ error: 'Your Passage session expired. Refresh, sign in again, and retry this task action.' });
  }

    const { taskId, note, sendFamilyEmail } = req.body || {};
    if (!taskId) return res.status(400).json({ error: 'Missing task.' });
    const cleanNote = String(note || '').trim();
    if (!cleanNote) return res.status(400).json({ error: 'Add what was handled before notifying the family.' });

  try {
    const { data: task, error: taskError } = await admin
      .from('tasks')
      .select('id,workflow_id,title')
      .eq('id', taskId)
      .maybeSingle();
    if (taskError) throw taskError;
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const { data: workflow, error: workflowError } = await admin
      .from('workflows')
      .select('id,estate_name,deceased_name,coordinator_name,coordinator_email,organization_id')
      .eq('id', task.workflow_id)
      .maybeSingle();
    if (workflowError) throw workflowError;
    if (!workflow?.organization_id) return res.status(403).json({ error: 'This is not a partner case.' });

    const { data: member } = await admin
      .from('organization_members')
      .select('id')
      .eq('organization_id', workflow.organization_id)
      .ilike('email', actorEmail || '')
      .eq('status', 'active')
      .limit(1);
    if (auth.source !== 'internal' && !member?.length && !isPassageAdmin(actorEmail)) return res.status(403).json({ error: 'You do not have access to this partner case.' });

    const { data: organization } = await admin
      .from('organizations')
      .select('name,from_name,support_email')
      .eq('id', workflow.organization_id)
      .maybeSingle();

    const orgName = organization?.from_name || organization?.name || 'The funeral home';
    const subjectName = workflow.deceased_name || workflow.estate_name || 'this family case';
    const detail = cleanNote;
    const now = new Date().toISOString();

    const { task: updatedTask, error: updateError, skippedColumns = [] } = await updateTaskWithSchemaFallback(task, {
      status: 'handled',
      outcome_status: 'completed',
      notes: detail,
      last_action_at: now,
      last_actor: actorEmail || 'Passage',
      completed_at: now,
      completed_by: actorEmail || 'Passage',
      completed_by_email: actorEmail || null,
      channel: 'record',
      recipient: workflow.coordinator_name || workflow.coordinator_email || 'Family coordinator',
      updated_at: now,
    });
    if (updateError) throw updateError;

    const statusResult = await recordTaskCommunicationEvent({
      verb: 'prove',
      workflowId: workflow.id,
      taskId: task.id,
      taskTitle: task.title,
      status: 'handled',
      actor: actorEmail || 'Passage',
      actorRole: 'funeral_home',
      channel: 'record',
      recipient: workflow.coordinator_name || workflow.coordinator_email || 'Family coordinator',
      recipientRole: 'family_coordinator',
      detail,
      visibility: 'family_funeral_home',
    });

    let emailSent = false;
    if (sendFamilyEmail === true && workflow.coordinator_email && process.env.RESEND_API_KEY) {
      const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
      const html = `
        <div style="font-family:Georgia,serif;background:#f6f3ee;padding:24px">
          <div style="max-width:560px;margin:auto;background:#fffdf9;border:1px solid #e4ddd4;border-radius:16px;padding:26px">
            <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#6b8f71;font-weight:700">Passage update</div>
            <h1 style="font-weight:400;color:#1a1916;font-size:24px;line-height:1.25">Handled for the family</h1>
            <p style="color:#6a6560;line-height:1.7">${escapeHtml(orgName)} recorded a completed update for ${escapeHtml(subjectName)}.</p>
            <div style="background:#f0f5f1;border:1px solid #c8deca;border-radius:12px;padding:14px;color:#1a1916"><strong>${escapeHtml(task.title)}</strong><br><span style="color:#6a6560">${escapeHtml(detail)}</span></div>
            <p style="color:#6a6560;line-height:1.7">This update is saved in the Passage case record.</p>
          </div>
        </div>`;
      const route = routeEmailRecipients([workflow.coordinator_email]);
      const response = route.actual.length ? await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: route.actual,
          subject: `${orgName} handled: ${task.title}`,
          html,
        }),
      }) : null;
      const json = response ? await response.json().catch(() => ({})) : {};
      if (response?.ok && json.id) {
        emailSent = true;
        await insertNotificationLog(admin, {
          workflow_id: workflow.id,
          channel: 'email',
          recipient_email: workflow.coordinator_email,
          recipient_name: workflow.coordinator_name || workflow.coordinator_email,
          subject: `${orgName} handled: ${task.title}`,
          provider: 'resend',
          provider_id: json.id,
          status: 'sent',
          sent_at: new Date().toISOString(),
          source: 'funeral_home_task_proof',
          ...qaAuditFields(route),
        });
      } else {
        await insertNotificationLog(admin, {
          workflow_id: workflow.id,
          channel: 'email',
          recipient_email: workflow.coordinator_email,
          recipient_name: workflow.coordinator_name || workflow.coordinator_email,
          subject: `${orgName} handled: ${task.title}`,
          provider: 'resend',
          provider_id: null,
          status: route.actual.length ? 'failed' : 'blocked',
          error_message: route.actual.length ? (json?.message || json?.error || 'Family notification failed after partner action.') : 'QA notification mode had no override email configured.',
          source: 'funeral_home_task_proof',
          ...qaAuditFields(route),
        });
      }
    }

    return res.status(200).json({
      success: true,
      emailSent,
      notificationQueued: sendFamilyEmail === true,
      statusResult,
      status: updatedTask?.status || 'handled',
      task: updatedTask || { id: task.id, status: 'handled', outcome_status: 'completed', last_action_at: now, last_actor: actorEmail || 'Passage' },
      confirmation: taskActionConfirmation('handled', task, 'funeral_home'),
      eventDetail: detail,
      skippedColumns,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not handle this task for the family.' });
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
