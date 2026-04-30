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
}) {
  if (!workflowId || !status) return { recorded: false };

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
  const taskUpdates = {
    status,
    last_action_at: now,
    last_actor: lastActor,
    channel,
    recipient,
    updated_at: now,
  };
  if (status === 'sent') taskUpdates.notified_at = now;
  if (status === 'delivered') taskUpdates.delivered_at = now;
  if (status === 'acknowledged') taskUpdates.acknowledged_at = now;

  const actionUpdates = {
    status,
    delivery_status: status,
    last_action_at: now,
    last_actor: lastActor,
    channel,
    recipient,
    updated_at: now,
  };
  if (status === 'delivered') actionUpdates.delivered_at = now;
  if (status === 'acknowledged') actionUpdates.acknowledged_at = now;

  if (isUuid(taskId)) {
    await serviceSupabase.from('tasks').update(taskUpdates).eq('id', taskId).eq('workflow_id', workflowId).catch(() => {});
  }
  if (isUuid(actionId)) {
    await serviceSupabase.from('workflow_actions').update(actionUpdates).eq('id', actionId).eq('workflow_id', workflowId).catch(() => {});
  }

  await serviceSupabase.from('task_status_events').insert([{
    workflow_id: workflowId,
    task_id: isUuid(taskId) ? taskId : null,
    action_id: isUuid(actionId) ? actionId : null,
    status,
    last_action_at: now,
    last_actor: lastActor,
    channel,
    recipient,
    detail,
    provider: provider || null,
    provider_message_id: providerMessageId || null,
    provider_event_id: providerEventId || null,
  }]).catch(() => {});

  await serviceSupabase.from('estate_events').insert([{
    estate_id: workflowId,
    event_type: status === 'sent' ? 'task_message_sent' : status === 'failed' ? 'task_delivery_failed' : 'task_status_updated',
    title: status === 'sent' ? 'Message sent' : status === 'failed' ? 'Message needs review' : 'Task status updated',
    description: detail || ((recipient || 'Recipient') + ' - ' + status),
    actor: lastActor,
  }]).catch(() => {});

  return { recorded: true };
}

export async function recordProviderDelivery({ provider, providerMessageId, providerEventId, providerStatus, channel, recipient, detail, errorMessage }) {
  if (!providerMessageId) return { recorded: false, reason: 'missing provider message id' };
  const status = normalizeProviderStatus(provider, providerStatus);

  if (providerEventId) {
    const { data: existing } = await serviceSupabase
      .from('task_status_events')
      .select('id')
      .eq('provider', provider)
      .eq('provider_event_id', providerEventId)
      .maybeSingle();
    if (existing?.id) return { recorded: false, duplicate: true };
  }

  await serviceSupabase.from('notification_log').update({
    status,
    delivered_at: status === 'delivered' || status === 'acknowledged' ? new Date().toISOString() : null,
    error_message: status === 'failed' ? (errorMessage || detail || null) : null,
  }).eq('provider', provider).eq('provider_id', providerMessageId).catch(() => {});

  const [{ data: action }, { data: event }] = await Promise.all([
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
  ]);

  const workflowId = action?.workflow_id || event?.workflow_id;
  if (!workflowId) return { recorded: false, reason: 'no matching workflow' };
  const taskId = event?.task_id || null;
  const actionId = action?.id || event?.action_id || null;
  const resolvedRecipient = recipient || event?.recipient || action?.recipient_name || action?.recipient_email || action?.recipient_phone;
  const label = status === 'acknowledged' ? 'opened' : status;

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
