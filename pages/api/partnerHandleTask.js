import { createClient } from '@supabase/supabase-js';
import { recordTaskCommunicationEvent } from '../../lib/communicationEvents';
import { isPassageAdmin } from '../../lib/adminAccess';
import { taskActionConfirmation, taskActionOutcomeStatus } from '../../lib/taskActions';
import { verifyDeliveryRequest } from '../../lib/deliveryAuth';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../lib/notificationSafety';
import { passageEmailShell, passageSubject } from '../../lib/brandedEmail';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, service);

function missingColumnFrom(error) {
  const message = String(error?.message || error?.details || '');
  const match = message.match(/'([^']+)'\s+column/i) || message.match(/column\s+"?([a-z0-9_]+)"?\s+.*does not exist/i);
  return match?.[1] || '';
}

function normalizePartnerAction(value) {
  const action = String(value || 'handled').trim().toLowerCase();
  if (['handled', 'waiting', 'blocked'].includes(action)) return action;
  return 'handled';
}

function eventVerbFor(action) {
  if (action === 'handled') return 'prove';
  if (action === 'blocked') return 'escalate';
  return 'update';
}

function emailCopyFor(action, { orgName, subjectName, taskTitle }) {
  if (action === 'blocked') {
    return {
      eyebrow: 'Work needs help',
      subject: passageSubject('Work needs help', taskTitle),
      title: 'The funeral home needs help on this work item.',
      intro: `${orgName} recorded what is needed for ${taskTitle} for ${subjectName}.`,
      preheader: `${orgName} needs help with ${taskTitle}.`,
      sectionLabel: 'Needs-help note saved',
    };
  }
  if (action === 'waiting') {
    return {
      eyebrow: 'Work waiting',
      subject: passageSubject('Work waiting', taskTitle),
      title: 'The funeral home is waiting on this work item.',
      intro: `${orgName} recorded what is still waiting for ${subjectName}.`,
      preheader: `${orgName} is waiting on ${taskTitle}.`,
      sectionLabel: 'Waiting point saved',
    };
  }
  return {
    eyebrow: 'Work handled',
    subject: passageSubject('Work handled', taskTitle),
    title: 'Handled for the family.',
    intro: `${orgName} recorded a completed update for ${subjectName}.`,
    preheader: `${orgName} handled ${taskTitle}.`,
    sectionLabel: 'Proof saved',
  };
}

async function updateTaskWithSchemaFallback(task, updates) {
  const skippedColumns = [];
  let remaining = { ...updates };

  for (let attempt = 0; attempt < 8; attempt += 1) {
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

  return { error: new Error('Work update could not be saved after schema fallback.') };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const user = auth.user;
  const actorEmail = String(user?.email || req.body?.actor || '').trim().toLowerCase();
  if (auth.source !== 'internal' && !actorEmail) {
    return res.status(401).json({ error: 'Your Passage session expired. Refresh, sign in again, and retry this work action.' });
  }

  const { taskId, note, sendFamilyEmail } = req.body || {};
  const action = normalizePartnerAction(req.body?.action || req.body?.status || req.body?.outcome);
  if (!taskId) return res.status(400).json({ error: 'Missing task.' });
  const cleanNote = String(note || '').trim();
  if (!cleanNote) {
    return res.status(400).json({ error: action === 'handled' ? 'Add what was handled before notifying the family.' : 'Add what is waiting or what the family needs to provide.' });
  }

  try {
    const { data: task, error: taskError } = await admin
      .from('tasks')
      .select('id,workflow_id,title')
      .eq('id', taskId)
      .maybeSingle();
    if (taskError) throw taskError;
    if (!task) return res.status(404).json({ error: 'Work item not found.' });

    const { data: workflow, error: workflowError } = await admin
      .from('workflows')
      .select('id,estate_name,deceased_name,coordinator_name,coordinator_email,organization_id')
      .eq('id', task.workflow_id)
      .maybeSingle();
    if (workflowError) throw workflowError;
    if (!workflow?.organization_id) return res.status(403).json({ error: 'This is not a funeral-home case.' });

    const { data: member } = await admin
      .from('organization_members')
      .select('id')
      .eq('organization_id', workflow.organization_id)
      .ilike('email', actorEmail || '')
      .eq('status', 'active')
      .limit(1);
    if (auth.source !== 'internal' && !member?.length && !isPassageAdmin(actorEmail)) return res.status(403).json({ error: 'You do not have access to this funeral-home case.' });

    const { data: organization } = await admin
      .from('organizations')
      .select('name,from_name,support_email')
      .eq('id', workflow.organization_id)
      .maybeSingle();

    const orgName = organization?.from_name || organization?.name || 'The funeral home';
    const subjectName = workflow.deceased_name || workflow.estate_name || 'this family case';
    const detail = cleanNote;
    const now = new Date().toISOString();
    const outcomeStatus = taskActionOutcomeStatus(action);
    const taskStatus = action === 'handled' ? 'handled' : action;
    const closeFields = action === 'handled'
      ? {
          completed_at: now,
          completed_by: actorEmail || 'Passage',
          completed_by_email: actorEmail || null,
        }
      : {
          completed_at: null,
          completed_by: null,
          completed_by_email: null,
        };

    const { task: updatedTask, error: updateError, skippedColumns = [] } = await updateTaskWithSchemaFallback(task, {
      status: taskStatus,
      outcome_status: outcomeStatus,
      notes: detail,
      waiting_on: action === 'waiting' || action === 'blocked' ? detail : null,
      last_action_at: now,
      last_actor: actorEmail || 'Passage',
      ...closeFields,
      channel: 'record',
      recipient: workflow.coordinator_name || workflow.coordinator_email || 'Family coordinator',
      updated_at: now,
    });
    if (updateError) throw updateError;

    const statusResult = await recordTaskCommunicationEvent({
      verb: eventVerbFor(action),
      workflowId: workflow.id,
      taskId: task.id,
      taskTitle: task.title,
      status: taskStatus,
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
      const ctaUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io'}/estate?workflow=${encodeURIComponent(workflow.id)}&task=${encodeURIComponent(task.id)}`;
      const copy = emailCopyFor(action, { orgName, subjectName, taskTitle: task.title });
      const html = passageEmailShell({
        eyebrow: copy.eyebrow,
        title: copy.title,
        intro: copy.intro,
        preheader: copy.preheader,
        sections: [
          {
            label: copy.sectionLabel,
            html: `<strong style="color:#1a1916;">${escapeHtml(task.title)}</strong><br>${escapeHtml(detail)}`,
            tone: 'soft',
          },
        ],
        ctaLabel: 'Open family record',
        ctaUrl,
      });
      const route = routeEmailRecipients([workflow.coordinator_email]);
      const response = route.actual.length ? await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: route.actual,
          subject: copy.subject,
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
          subject: copy.subject,
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
          subject: copy.subject,
          provider: 'resend',
          provider_id: null,
          status: route.actual.length ? 'failed' : 'blocked',
          error_message: route.actual.length ? (json?.message || json?.error || 'Family notification failed after funeral-home update.') : 'QA notification mode had no override email configured.',
          source: 'funeral_home_task_proof',
          ...qaAuditFields(route),
        });
      }
    }

    return res.status(200).json({
      success: true,
      action,
      emailSent,
      notificationQueued: sendFamilyEmail === true,
      statusResult,
      status: updatedTask?.status || taskStatus,
      task: updatedTask || { id: task.id, status: taskStatus, outcome_status: outcomeStatus, last_action_at: now, last_actor: actorEmail || 'Passage' },
      confirmation: taskActionConfirmation(action, task, 'funeral_home'),
      eventDetail: detail,
      skippedColumns,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not update this work item for the family.' });
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