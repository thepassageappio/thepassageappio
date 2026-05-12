import { createClient } from '@supabase/supabase-js';

export const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

export function normalizeProviderStatus(provider, value) {
  const status = String(value || '').toLowerCase();
  if (provider === 'resend') {
    if (status.includes('opened') || status.includes('clicked')) return 'acknowledged';
    if (status.includes('delivered')) return 'delivered';
    if (status.includes('bounced') || status.includes('failed') || status.includes('complained')) return 'failed';
    if (status.includes('sent')) return 'sent';
  }
  if (provider === 'twilio') {
    if (status === 'delivered') return 'delivered';
    if (status === 'undelivered' || status === 'failed') return 'failed';
    if (['queued', 'accepted', 'sending', 'sent'].includes(status)) return 'sent';
  }
  return status || 'sent';
}

export function normalizeTaskStatusForStorage(value) {
  const status = String(value || '').toLowerCase();
  if (['handled', 'completed', 'done'].includes(status)) return 'handled';
  if (['waiting', 'pending'].includes(status)) return 'pending';
  return status;
}

const WORKFLOW_ACTION_STATUSES = new Set([
  'pending',
  'draft',
  'waiting',
  'assigned',
  'sent',
  'delivered',
  'acknowledged',
  'handled',
  'needs_review',
  'blocked',
  'failed',
  'cancelled',
]);

function normalizeWorkflowActionStatusForStorage(value) {
  const status = normalizeTaskStatusForStorage(value);
  if (WORKFLOW_ACTION_STATUSES.has(status)) return status;
  if (status === 'in_progress') return 'acknowledged';
  if (status === 'not_applicable') return 'cancelled';
  return 'needs_review';
}

export async function recordStatusEvent({
  workflowId,
  taskId,
  actionId,
  status,
  actor,
  channel,
  recipient,
  detail,
  provider,
  providerMessageId,
  providerEventId,
  eventType,
  eventTitle,
  eventDescription,
}) {
  if (!workflowId || !status) return { recorded: false };
  const storedStatus = normalizeTaskStatusForStorage(status);
  const actionStoredStatus = normalizeWorkflowActionStatusForStorage(status);

  if (providerEventId) {
    const { data: existing } = await serviceSupabase
      .from('task_status_events')
      .select('id')
      .eq('provider', provider)
      .eq('provider_event_id', providerEventId)
      .maybeSingle();
    if (existing?.id) return { recorded: false, duplicate: true };
  }

  const now = new Date().toISOString();
  const lastActor = actor || recipient || 'Passage';
  const terminalStatus = storedStatus === 'handled';
  const taskUpdates = {
    status: storedStatus,
    last_action_at: now,
    last_actor: lastActor,
    channel,
    recipient,
    updated_at: now,
  };
  if (storedStatus === 'sent') taskUpdates.notified_at = now;
  if (storedStatus === 'delivered') taskUpdates.delivered_at = now;
  if (storedStatus === 'acknowledged') taskUpdates.acknowledged_at = now;
  if (terminalStatus) {
    taskUpdates.completed_at = now;
    taskUpdates.completed_by = lastActor;
    taskUpdates.completed_by_email = actor && String(actor).includes('@') ? String(actor).toLowerCase() : null;
  }

  const actionUpdates = {
    status: actionStoredStatus,
    delivery_status: actionStoredStatus,
    last_action_at: now,
    last_actor: lastActor,
    channel,
    recipient,
    updated_at: now,
  };
  if (actionStoredStatus === 'delivered') actionUpdates.delivered_at = now;
  if (actionStoredStatus === 'acknowledged') actionUpdates.acknowledged_at = now;
  if (terminalStatus) actionUpdates.handled_at = now;

  if (isUuid(taskId)) {
    await serviceSupabase.from('tasks').update(taskUpdates).eq('id', taskId).eq('workflow_id', workflowId).then(() => {}, () => {});
  }
  if (isUuid(actionId)) {
    await serviceSupabase.from('workflow_actions').update(actionUpdates).eq('id', actionId).eq('workflow_id', workflowId).then(() => {}, () => {});
  }

  await serviceSupabase.from('task_status_events').insert([{
    workflow_id: workflowId,
    task_id: isUuid(taskId) ? taskId : null,
    action_id: isUuid(actionId) ? actionId : null,
    status: storedStatus,
    last_action_at: now,
    last_actor: lastActor,
    channel,
    recipient,
    detail,
    provider: provider || null,
    provider_message_id: providerMessageId || null,
    provider_event_id: providerEventId || null,
  }]).then(() => {}, () => {});

  await serviceSupabase.from('estate_events').insert([{
    estate_id: workflowId,
    event_type: eventType || (storedStatus === 'sent' ? 'task_message_sent' : storedStatus === 'failed' ? 'task_delivery_failed' : storedStatus === 'blocked' ? 'participant_blocked' : terminalStatus ? 'task_completed' : 'task_status_updated'),
    title: eventTitle || (storedStatus === 'sent' ? 'Message sent' : storedStatus === 'failed' ? 'Message needs review' : storedStatus === 'blocked' ? 'Task needs help' : terminalStatus ? 'Task handled' : 'Task status updated'),
    description: eventDescription || detail || ((recipient || 'Recipient') + ' - ' + storedStatus),
    actor: lastActor,
  }]).then(() => {}, () => {});

  return { recorded: true, status: storedStatus, requestedStatus: status };
}

export async function recordProviderDelivery({ provider, providerMessageId, providerEventId, providerStatus, channel, recipient, detail, errorMessage, payload }) {
  if (!providerMessageId) return { recorded: false, reason: 'missing provider message id' };
  const status = normalizeProviderStatus(provider, providerStatus);

  if (providerEventId) {
    const { data: existingWebhook } = await serviceSupabase
      .from('webhook_events')
      .select('id')
      .eq('provider', provider)
      .eq('provider_event_id', providerEventId)
      .maybeSingle();
    if (existingWebhook?.id) return { recorded: false, duplicate: true };
  }

  await serviceSupabase.from('notification_log').update({
    status,
    delivered_at: status === 'delivered' || status === 'acknowledged' ? new Date().toISOString() : null,
    error_message: status === 'failed' ? (errorMessage || detail || null) : null,
  }).eq('provider', provider).eq('provider_id', providerMessageId).then(() => {}, () => {});

  const [{ data: action }, { data: event }, { data: notification }] = await Promise.all([
    serviceSupabase.from('workflow_actions')
      .select('id,workflow_id,task_title,recipient_name,recipient_email,recipient_phone,action_type')
      .eq('provider_message_id', providerMessageId)
      .maybeSingle(),
    serviceSupabase.from('task_status_events')
      .select('workflow_id,task_id,action_id,recipient,detail')
      .eq('provider', provider)
      .eq('provider_message_id', providerMessageId)
      .order('last_action_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    serviceSupabase.from('notification_log')
      .select('workflow_id,action_id,recipient_name,recipient_email,recipient_phone,channel')
      .eq('provider', provider)
      .eq('provider_id', providerMessageId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const workflowId = action?.workflow_id || event?.workflow_id || notification?.workflow_id;
  const taskId = event?.task_id || null;
  const actionId = action?.id || event?.action_id || notification?.action_id || null;
  const resolvedRecipient = recipient || event?.recipient || action?.recipient_name || action?.recipient_email || action?.recipient_phone || notification?.recipient_name || notification?.recipient_email || notification?.recipient_phone;
  const label = status === 'acknowledged' ? 'opened' : status;

  await serviceSupabase.from('webhook_events').insert([{
    provider,
    event_type: String(providerStatus || 'event'),
    external_id: providerMessageId,
    provider_event_id: providerEventId || null,
    workflow_id: workflowId,
    task_id: taskId,
    action_id: actionId,
    payload: payload || null,
    status: workflowId ? 'processed' : 'unmatched',
    processed_at: workflowId ? new Date().toISOString() : null,
  }]).then(() => {}, () => {});

  if (!workflowId) return { recorded: true, unmatched: true, reason: 'no matching workflow' };

  return recordStatusEvent({
    workflowId,
    taskId,
    actionId,
    status,
    actor: provider === 'twilio' ? 'Twilio' : 'Resend',
    channel: channel || (provider === 'twilio' ? 'sms' : 'email'),
    recipient: resolvedRecipient,
    detail: detail || ((resolvedRecipient || 'Recipient') + ' ' + label + ' the message.'),
    provider,
    providerMessageId,
    providerEventId,
  });
}
