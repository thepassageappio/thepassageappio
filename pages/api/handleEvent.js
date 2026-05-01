import { createClient } from '@supabase/supabase-js';
import { internalHeaders, verifyDeliveryRequest } from '../../lib/deliveryAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, payload } = req.body;
  if (!type) return res.status(400).json({ error: 'Missing event type' });
  if (['death_confirmed', 'task_assigned', 'invite_sent'].includes(type)) {
    const auth = await verifyDeliveryRequest(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  }

  const eventId = await storeEvent(type, payload);

  try {
    let result = {};
    switch (type) {
      case 'death_confirmed':
        result = await handleDeathConfirmed(payload);
        break;
      case 'task_assigned':
        result = await handleTaskAssigned(payload);
        break;
      case 'share_triggered':
        result = await handleShareTriggered(payload);
        break;
      case 'invite_sent':
        result = await handleInviteSent(payload);
        break;
      case 'task_created':
        result = { queued: true };
        break;
      default:
        result = { skipped: true, reason: 'Unknown event type' };
    }

    await markEventDone(eventId, result);
    return res.status(200).json({ success: true, eventId, result });
  } catch (err) {
    await markEventFailed(eventId, err.message);
    console.error('handleEvent error:', type, err);
    return res.status(500).json({ error: err.message });
  }
}

async function storeEvent(type, payload) {
  const { data } = await supabase.from('orchestration_events').insert([{
    workflow_id: payload && payload.workflowId ? payload.workflowId : null,
    event_type: type,
    payload: payload || {},
    status: 'processing',
  }]).select('id').single();
  return data && data.id ? data.id : null;
}

async function markEventDone(id, result) {
  if (!id) return;
  await supabase.from('orchestration_events').update({
    status: 'done',
    payload: result,
    processed_at: new Date().toISOString(),
  }).eq('id', id);
}

async function markEventFailed(id, msg) {
  if (!id) return;
  await supabase.from('orchestration_events').update({
    status: 'needs_review',
    error_message: msg,
    processed_at: new Date().toISOString(),
  }).eq('id', id);
}

async function handleDeathConfirmed(payload) {
  const { workflowId, actionIds } = payload;
  if (!workflowId) throw new Error('Missing workflowId');

  const { data: workflow } = await supabase.from('workflows')
    .select('*').eq('id', workflowId).single();
  if (!workflow) throw new Error('Workflow not found');

  const { data: events } = await supabase.from('workflow_events')
    .select('*').eq('workflow_id', workflowId).order('date');

  let actionQuery = supabase.from('workflow_actions')
    .select('*').eq('workflow_id', workflowId).eq('status', 'pending');
  if (Array.isArray(actionIds) && actionIds.length > 0) actionQuery = actionQuery.in('id', actionIds);
  const { data: actions } = await actionQuery;

  if (!actions || actions.length === 0) return { sent: 0, message: 'No pending actions' };

  const deceasedName = workflow.deceased_name || 'your loved one';
  const coordinatorName = workflow.coordinator_name || 'the family coordinator';

  let sent = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      let delivered = false;
      if (action.action_type === 'email' && action.recipient_email) {
        const emailRes = await fetch(BASE_URL + '/api/sendEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...internalHeaders() },
          body: JSON.stringify({
            to: action.recipient_email,
            toName: action.recipient_name || action.recipient_email,
            deceasedName,
            coordinatorName,
            workflowId,
            actionId: action.id,
            actionType: 'trigger',
            events: events || [],
          }),
        });
        if (emailRes.ok) { sent++; delivered = true; }
        else failed++;
      }

      if (action.action_type === 'sms' && action.recipient_phone) {
        const smsRes = await fetch(BASE_URL + '/api/sendSMS', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...internalHeaders() },
          body: JSON.stringify({
            to: action.recipient_phone,
            toName: action.recipient_name || '',
            deceasedName,
            coordinatorName,
            workflowId,
            actionId: action.id,
            actionType: 'trigger',
            events: events || [],
          }),
        });
        if (smsRes.ok) { sent++; delivered = true; }
        else failed++;
      }

      await supabase.from('workflow_actions').update(delivered ? {
        status: 'sent',
        sent_at: new Date().toISOString(),
        delivery_status: 'sent',
        last_action_at: new Date().toISOString(),
        last_actor: coordinatorName || 'Passage',
        channel: action.action_type,
        recipient: action.recipient_name || action.recipient_email || action.recipient_phone,
      } : {
        status: 'needs_review',
        delivery_status: 'needs_review',
        error_message: 'Delivery was attempted but the provider did not confirm success.',
        last_action_at: new Date().toISOString(),
        last_actor: coordinatorName || 'Passage',
        channel: action.action_type,
        recipient: action.recipient_name || action.recipient_email || action.recipient_phone,
      }).eq('id', action.id);
    } catch (err) {
      failed++;
      await supabase.from('workflow_actions').update({
        status: 'needs_review',
        error_message: err.message,
      }).eq('id', action.id);
    }
  }

  await supabase.from('workflows').update({
    status: 'triggered',
    triggered_at: new Date().toISOString(),
  }).eq('id', workflowId);

  return { sent, failed };
}

async function handleTaskAssigned(payload) {
  const { workflowId, taskId, taskTitle, personEmail, personPhone, personName, deceasedName, coordinatorName, notifyChannel, events } = payload;

  let sent = 0;
  let failed = 0;
  const errors = [];

  if (personEmail && notifyChannel !== 'sms') {
    const emailRes = await fetch(BASE_URL + '/api/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...internalHeaders() },
      body: JSON.stringify({ to: personEmail, toName: personName, taskTitle, taskId, deceasedName, coordinatorName, workflowId, actionType: 'assignment', events: events || [] }),
    });
    if (emailRes.ok) {
      sent++;
    } else {
      failed++;
      const detail = await readProviderError(emailRes);
      errors.push('Email to ' + (personName || personEmail) + ' failed: ' + detail);
    }
  }

  if (personPhone && notifyChannel !== 'email') {
    const smsRes = await fetch(BASE_URL + '/api/sendSMS', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...internalHeaders() },
      body: JSON.stringify({ to: personPhone, toName: personName, taskTitle, taskId, deceasedName, coordinatorName, workflowId, actionType: 'assignment', events: events || [] }),
    });
    if (smsRes.ok) {
      sent++;
    } else {
      failed++;
      const detail = await readProviderError(smsRes);
      errors.push('Text to ' + (personName || personPhone) + ' failed: ' + detail);
    }
  }

  if (failed > 0) {
    const err = new Error(errors.join(' '));
    err.result = { sent, failed, errors };
    throw err;
  }

  return { sent };
}

async function readProviderError(response) {
  try {
    const data = await response.json();
    return data && (data.error || data.message) ? (data.error || data.message) : JSON.stringify(data);
  } catch (_) {
    return response.status + ' ' + response.statusText;
  }
}

async function handleShareTriggered(payload) {
  const { workflowId, masterText, facebookText, linkedinText, twitterText, instagramText, smsText } = payload;
  if (!workflowId) return { saved: false };

  await supabase.from('workflow_announcements').upsert([{
    workflow_id: workflowId,
    master_text: masterText,
    facebook_text: facebookText,
    linkedin_text: linkedinText,
    twitter_text: twitterText,
    instagram_text: instagramText,
    sms_text: smsText,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }], { onConflict: 'workflow_id' });

  return { saved: true };
}

async function handleInviteSent(payload) {
  const { workflowId, inviteeEmail, inviteeName, triggerToken } = payload;
  if (!inviteeEmail) return { sent: false };

  const confirmUrl = BASE_URL + '/confirm?token=' + (triggerToken || '');

  await fetch(BASE_URL + '/api/sendEmail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...internalHeaders() },
    body: JSON.stringify({
      to: inviteeEmail,
      toName: inviteeName || inviteeEmail,
      taskTitle: 'You have been designated as a confirmation contact',
      actionType: 'invite',
      confirmUrl,
      workflowId,
    }),
  });

  return { sent: true, confirmUrl };
}
