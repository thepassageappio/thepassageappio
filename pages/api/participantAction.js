import { createClient } from '@supabase/supabase-js';
import { normalizeTaskAction, taskActionConfirmation, taskActionEventTitle, taskActionEventType, taskActionOutcomeStatus, taskActionRequiresNote, taskActionStatus } from '../../lib/taskActions';
import { recordTaskCommunicationEvent } from '../../lib/communicationEvents';
import { escapeHtml, passageEmailShell } from '../../lib/brandedEmail';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../lib/notificationSafety';
import { verifyDeliveryRequest } from '../../lib/deliveryAuth';

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
  const statusLine = status === 'done' || status === 'handled' ? 'marked this as handled'
    : status === 'pending' || status === 'waiting' ? 'updated this as waiting'
    : status === 'acknowledged' ? 'accepted this task'
    : status === 'blocked' ? 'needs help with this task'
    : 'updated this task';
  const html = passageEmailShell({
    eyebrow: 'Participant update',
    title: `${actorEmail} ${statusLine}.`,
    intro: 'A participant response was saved to the family record so the coordinator can see what changed without chasing another thread.',
    sections: [
      {
        label: 'Family record',
        html: `Estate: <strong style="color:#1a1916;">${escapeHtml(deceased)}</strong><br/>Task: <strong style="color:#1a1916;">${escapeHtml(taskTitle || 'Assigned task')}</strong>`,
      },
      notes ? {
        label: 'Participant note',
        text: notes,
        tone: 'soft',
      } : null,
    ].filter(Boolean),
    ctaLabel: 'Open family record',
    ctaUrl: `${SITE_URL}/estate?id=${workflowId}`,
  });

  const route = routeEmailRecipients([to]);
  if (!route.actual.length) {
    await insertNotificationLog(admin, {
      workflow_id: workflowId,
      channel: 'email',
      recipient_email: to,
      recipient_name: workflow.coordinator_name || to,
      subject: `Passage update: ${taskTitle || 'task updated'}`,
      provider: 'resend',
      provider_id: null,
      status: 'blocked',
      error_message: 'QA notification mode had no override email configured.',
      source: 'participant_coordinator_update',
      ...qaAuditFields(route),
    });
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>',
      to: route.actual,
      subject: `Passage update: ${taskTitle || 'task updated'}`,
      html,
    }),
  }).catch(() => null);
  const json = response ? await response.json().catch(() => ({})) : {};
  await insertNotificationLog(admin, {
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
    source: 'participant_coordinator_update',
    ...qaAuditFields(route),
  });
}

function schemaColumnError(error) {
  const message = String(error?.message || error || '');
  return /schema cache|column .* does not exist|Could not find the .* column/i.test(message);
}

function workflowActionStatusConstraintError(error) {
  const message = String(error?.message || error || '');
  return error?.code === '23514' && /workflow_actions_status_check/i.test(message);
}

async function updateWorkflowActionWithoutStatus({ id, emailColumn, email, updates, kind }) {
  const compatibleUpdates = { ...updates };
  const requestedStatus = compatibleUpdates.status;
  delete compatibleUpdates.status;
  if (requestedStatus !== undefined) compatibleUpdates.delivery_status = requestedStatus;

  let result = await admin
    .from('workflow_actions')
    .update(compatibleUpdates)
    .eq('id', id)
    .ilike(emailColumn, email)
    .select(itemSelect(kind))
    .maybeSingle();
  if (!result.error) return result;

  if (schemaColumnError(result.error)) {
    const olderSchemaUpdates = {};
    ['delivery_status', 'notes', 'updated_at', 'outcome_status', 'follow_up_at', 'handled_at', 'accepted_at', 'help_requested_at'].forEach(key => {
      if (compatibleUpdates[key] !== undefined) olderSchemaUpdates[key] = compatibleUpdates[key];
    });
    result = await admin
      .from('workflow_actions')
      .update(olderSchemaUpdates)
      .eq('id', id)
      .ilike(emailColumn, email)
      .select(itemSelect(kind))
      .maybeSingle();
    if (!result.error) return result;
  }

  if (requestedStatus !== undefined) {
    const lastSafeStatus = ['handled', 'completed', 'done'].includes(String(requestedStatus).toLowerCase())
      ? 'acknowledged'
      : ['waiting', 'blocked', 'acknowledged', 'needs_review', 'sent', 'delivered'].includes(String(requestedStatus).toLowerCase())
        ? requestedStatus
        : 'needs_review';
    const minimalUpdates = {
      status: lastSafeStatus,
      notes: updates.notes,
      updated_at: updates.updated_at,
    };
    return admin
      .from('workflow_actions')
      .update(Object.fromEntries(Object.entries(minimalUpdates).filter(([, value]) => value !== undefined)))
      .eq('id', id)
      .ilike(emailColumn, email)
      .select(itemSelect(kind))
      .maybeSingle();
  }

  return result;
}

function itemSelect(kind) {
  return kind === 'task'
    ? 'id,status,workflow_id,title,notes'
    : 'id,status,delivery_status,workflow_id,subject,task_title,notes';
}

async function loadParticipantRecord({ table, kind, emailColumn, id, email }) {
  return admin
    .from(table)
    .select(itemSelect(kind))
    .eq('id', id)
    .ilike(emailColumn, email)
    .maybeSingle();
}

function isTerminalStatus(value) {
  return ['done', 'handled', 'completed'].includes(String(value || '').toLowerCase());
}

function effectiveRecordStatus(record) {
  const delivery = String(record?.delivery_status || '').toLowerCase();
  const status = String(record?.status || '').toLowerCase();
  if (isTerminalStatus(delivery) || ['blocked', 'waiting', 'acknowledged', 'needs_review'].includes(delivery)) return delivery;
  return status || delivery;
}

function participantStorageStatus(action) {
  const requested = taskActionStatus(action);
  if (requested === 'handled') return 'handled';
  if (requested === 'waiting') return 'waiting';
  if (requested === 'blocked') return 'blocked';
  if (requested === 'acknowledged') return 'acknowledged';
  return requested || 'needs_review';
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
  if (!result.error) return result;

  if (table === 'workflow_actions' && updates.status !== undefined && workflowActionStatusConstraintError(result.error)) {
    result = await updateWorkflowActionWithoutStatus({ id, emailColumn, email, updates, kind });
    if (!result.error) return result;
  }
  if (!schemaColumnError(result.error)) return result;

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
  if (!result.error) return result;

  if (table === 'workflow_actions' && saferUpdates.status !== undefined && workflowActionStatusConstraintError(result.error)) {
    result = await updateWorkflowActionWithoutStatus({ id, emailColumn, email, updates: saferUpdates, kind });
    if (!result.error) return result;
  }
  if (!schemaColumnError(result.error)) return result;

  const safestUpdates = {};
  ['status', 'notes'].forEach(key => {
    if (updates[key] !== undefined) safestUpdates[key] = updates[key];
  });
  result = await admin
    .from(table)
    .update(safestUpdates)
    .eq('id', id)
    .ilike(emailColumn, email)
    .select(itemSelect(kind))
    .maybeSingle();
  if (table === 'workflow_actions' && safestUpdates.status !== undefined && workflowActionStatusConstraintError(result.error)) {
    return updateWorkflowActionWithoutStatus({ id, emailColumn, email, updates: safestUpdates, kind });
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  let userData = null;
  if (token) {
    const result = await authClient.auth.getUser(token);
    if (result.error || !result.data?.user?.email) return res.status(401).json({ error: 'Session could not be verified.' });
    userData = result.data;
  } else {
    const internalAuth = await verifyDeliveryRequest(req);
    const actorEmail = String(req.body?.actorEmail || '').trim().toLowerCase();
    if (!internalAuth.ok || internalAuth.source !== 'internal' || !actorEmail) {
      return res.status(401).json({ error: 'Please sign in first.' });
    }
    userData = { user: { id: req.body?.actorUserId || null, email: actorEmail, user_metadata: { full_name: req.body?.actorName || actorEmail } } };
  }

  const email = userData.user.email.toLowerCase();
  const { kind, id, action, notes, outcomeStatus, followUpAt } = req.body || {};
  const normalizedAction = normalizeTaskAction(action);
  if (!id || !['task', 'action'].includes(kind) || !['accept', 'handled', 'help', 'waiting', 'needs_details', 'quoted', 'scheduled', 'delivered', 'confirmed', 'unavailable', 'save_note'].includes(action)) {
    return res.status(400).json({ error: 'Invalid participant action.' });
  }

  const table = kind === 'task' ? 'tasks' : 'workflow_actions';
  const emailColumn = kind === 'task' ? 'assigned_to_email' : 'recipient_email';
  const trimmedNotes = typeof notes === 'string' ? notes.trim() : '';

  const existing = await loadParticipantRecord({ table, kind, emailColumn, id, email });
  if (existing.error) return res.status(500).json({ error: existing.error.message });
  if (!existing.data) return res.status(404).json({ error: 'No matching task found for this email.' });
  const existingStatus = effectiveRecordStatus(existing.data);
  if (isTerminalStatus(existingStatus) && normalizedAction !== 'save_note') {
    return res.status(409).json({
      error: 'This responsibility is already marked handled. The coordinator can see the proof; ask them to reopen it if something changed.',
      status: existingStatus,
      item: existing.data,
    });
  }

  if (action === 'save_note') {
    if (!trimmedNotes) return res.status(400).json({ error: 'Add a note to save.' });
    const { data, error } = await updateParticipantRecord({
      table,
      kind,
      emailColumn,
      id,
      email,
      updates: { notes: trimmedNotes, updated_at: new Date().toISOString() },
    });
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'No matching task found for this email.' });

    await recordTaskCommunicationEvent({
      verb: 'update',
      workflowId: data.workflow_id,
      taskId: kind === 'task' ? data.id : null,
      actionId: kind === 'action' ? data.id : null,
      taskTitle: data.title || data.task_title || data.subject || 'Assigned task',
      status: data.status || 'in_progress',
      actor: email,
      actorRole: 'participant',
      channel: 'participant',
      recipient: email,
      recipientRole: 'family_coordinator',
      detail: (data.title || data.task_title || data.subject || 'Assigned task') + ' - note saved',
      visibility: 'family',
    });

    await notifyCoordinator({
      workflowId: data.workflow_id,
      actorEmail: email,
      status: data.status || 'waiting',
      action,
      taskTitle: data.title || data.task_title || data.subject || 'Assigned task',
      notes: trimmedNotes,
    });

    return res.status(200).json({
      success: true,
      item: data,
      action: normalizedAction,
      status: effectiveRecordStatus(data) || 'in_progress',
      confirmation: taskActionConfirmation('save_note', data, 'participant'),
      eventDetail: (data.title || data.task_title || data.subject || 'Assigned task') + ' - note saved',
    });
  }

  const status = participantStorageStatus(action);
  const recordStatus = table === 'workflow_actions' && status === 'handled'
    ? 'acknowledged'
    : status;
  if (taskActionRequiresNote(action) && !trimmedNotes) {
    return res.status(400).json({ error: 'Add a short proof or blocker note before saving this update.' });
  }
  const terminalStatus = isTerminalStatus(status);
  const actorName = userData.user.user_metadata?.full_name || email;
  const stamp = normalizedAction === 'accept' ? 'accepted_at'
    : terminalStatus ? 'handled_at'
    : 'help_requested_at';

  const updates = {
    status: recordStatus,
    [stamp]: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    outcome_status: outcomeStatus || taskActionOutcomeStatus(action),
    coordinator_notified_at: new Date().toISOString(),
    last_action_at: new Date().toISOString(),
    last_actor: actorName,
    channel: 'participant',
    recipient: email,
  };
  if (terminalStatus) {
    if (table === 'workflow_actions') updates.delivery_status = status;
    updates.completed_at = new Date().toISOString();
    updates.completed_by = actorName;
    updates.completed_by_email = email;
  }
  if (recordStatus === 'acknowledged') updates.acknowledged_at = new Date().toISOString();
  if (followUpAt) updates.follow_up_at = new Date(followUpAt).toISOString();
  if (trimmedNotes) updates.notes = trimmedNotes;
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
  await recordTaskCommunicationEvent({
    verb: terminalStatus ? 'prove' : status === 'blocked' ? 'escalate' : status === 'acknowledged' ? 'assign' : 'update',
    workflowId: data.workflow_id,
    taskId: kind === 'task' ? data.id : null,
    actionId: kind === 'action' ? data.id : null,
    taskTitle: data.title || data.task_title || data.subject || 'Assigned task',
    status,
    actor: email,
    actorRole: 'participant',
    channel: 'participant',
    recipient: email,
    recipientRole: 'family_coordinator',
    detail: (data.title || data.task_title || data.subject || 'Assigned task') + ' - ' + normalizedAction.replace(/_/g, ' '),
    visibility: 'family',
    eventType: taskActionEventType(action, 'participant'),
    eventTitle: taskActionEventTitle(action, 'Participant'),
  });
  await notifyCoordinator({
    workflowId: data.workflow_id,
    actorEmail: email,
    status,
    action,
    taskTitle: data.title || data.task_title || data.subject || 'Assigned task',
    notes: trimmedNotes,
  });
  return res.status(200).json({
    success: true,
    item: data,
    action: normalizedAction,
    status,
    confirmation: taskActionConfirmation(action, data, 'participant'),
    eventDetail: (data.title || data.task_title || data.subject || 'Assigned task') + ' - ' + normalizedAction.replace(/_/g, ' '),
  });
}
