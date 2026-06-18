import { isUuid, recordStatusEvent } from './taskStatus';

const VERB_BY_STATUS = {
  assigned: 'assign',
  sent: 'ask',
  delivered: 'update',
  acknowledged: 'update',
  waiting: 'update',
  pending: 'update',
  blocked: 'escalate',
  failed: 'escalate',
  needs_review: 'escalate',
  handled: 'prove',
  completed: 'prove',
  done: 'prove',
};

const EVENT_TYPE_BY_VERB = {
  assign: 'task_assigned',
  ask: 'task_request_sent',
  update: 'task_status_updated',
  prove: 'task_proof_saved',
  escalate: 'task_needs_help',
};

const TITLE_BY_VERB = {
  assign: 'Work assigned',
  ask: 'Request sent',
  update: 'Work updated',
  prove: 'Proof saved',
  escalate: 'Work needs help',
};

export function communicationVerbForStatus(status) {
  return VERB_BY_STATUS[String(status || '').toLowerCase()] || 'update';
}

export function visibilityForRoles({ actorRole, recipientRole, internal = false } = {}) {
  if (internal) return 'staff_internal';
  if (recipientRole === 'vendor' || actorRole === 'vendor') return 'vendor';
  if (recipientRole === 'participant' || actorRole === 'participant') return 'participant';
  if (actorRole === 'funeral_home' || recipientRole === 'funeral_home' || actorRole === 'staff' || recipientRole === 'staff') return 'family_funeral_home';
  return 'family';
}

export function buildCommunicationEvent({
  verb,
  status,
  workflowId,
  taskId,
  taskTitle,
  actor,
  actorRole,
  recipient,
  recipientRole,
  channel = 'record',
  detail,
  visibility,
  internal = false,
  eventType,
  eventTitle,
} = {}) {
  const resolvedVerb = verb || communicationVerbForStatus(status);
  const resolvedVisibility = visibility || visibilityForRoles({ actorRole, recipientRole, internal });
  const summary = detail || [taskTitle, recipient ? `for ${recipient}` : '', status ? `(${status})` : ''].filter(Boolean).join(' ');
  return {
    verb: resolvedVerb,
    status,
    workflowId,
    taskId,
    taskTitle,
    actor: actor || 'Passage',
    actorRole: actorRole || '',
    recipient: recipient || '',
    recipientRole: recipientRole || '',
    channel,
    detail: summary,
    visibility: resolvedVisibility,
    eventType: eventType || EVENT_TYPE_BY_VERB[resolvedVerb] || 'task_status_updated',
    title: eventTitle || TITLE_BY_VERB[resolvedVerb] || 'Work updated',
  };
}

export async function recordTaskCommunicationEvent(input = {}) {
  const event = buildCommunicationEvent(input);
  const result = await recordStatusEvent({
    workflowId: event.workflowId,
    taskId: isUuid(event.taskId) ? event.taskId : null,
    actionId: input.actionId,
    status: event.status || event.verb,
    actor: event.actor,
    channel: event.channel,
    recipient: event.recipient,
    detail: `${event.detail}${event.visibility ? ` | Visibility: ${event.visibility}` : ''}`,
    provider: input.provider,
    providerMessageId: input.providerMessageId,
    providerEventId: input.providerEventId,
    eventType: event.eventType,
    eventTitle: event.title,
    eventDescription: event.detail,
  });

  return { ...result, event };
}