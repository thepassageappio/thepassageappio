import { taskDisplayTitle } from './communicationCenter';

export const TASK_ACTIONS = {
  accept: {
    status: 'acknowledged',
    label: 'I own this',
    shortLabel: 'I own it',
    prompt: 'What should the coordinator know before you take ownership?',
    placeholder: 'Example: I can make this call this afternoon.',
    confirmation: 'Saved. Everyone can see that you own this task.',
    requiresNote: false,
  },
  handled: {
    status: 'handled',
    label: 'Mark done with proof',
    shortLabel: 'Done + proof',
    prompt: 'What proof, reference, name, or timestamp shows this is done?',
    placeholder: 'Example: Release confirmed by Vassar Hospital, reference #1234.',
    confirmation: 'Proof saved. This task is marked done.',
    requiresNote: true,
  },
  waiting: {
    status: 'waiting',
    label: 'Mark waiting',
    shortLabel: 'Waiting',
    prompt: 'Who or what is this waiting on, and what should happen next?',
    placeholder: 'Example: Waiting on the facility release desk to call back.',
    confirmation: 'Waiting update saved. This stays visible until it moves.',
    requiresNote: true,
  },
  blocked: {
    status: 'blocked',
    label: 'Needs help',
    shortLabel: 'Needs help',
    prompt: 'What is blocking this, and who can help clear it?',
    placeholder: 'Example: Need the family to confirm cemetery name before this can move.',
    confirmation: 'Help request saved. The blocker is visible now.',
    requiresNote: true,
  },
  not_applicable: {
    status: 'not_applicable',
    label: 'Not applicable',
    shortLabel: 'Skip',
    prompt: 'Why does this not apply here?',
    placeholder: 'Example: No cemetery step needed because the family chose direct cremation.',
    confirmation: 'Saved as not applicable.',
    requiresNote: false,
  },
  save_note: {
    status: null,
    label: 'Save update',
    shortLabel: 'Save update',
    prompt: 'Add the update the coordinator needs.',
    placeholder: 'Add a short update.',
    confirmation: 'Update saved.',
    requiresNote: true,
  },
};

const ACTION_ALIASES = {
  confirmed: 'handled',
  delivered: 'handled',
  completed: 'handled',
  done: 'handled',
  help: 'blocked',
  needs_help: 'blocked',
  needs_details: 'blocked',
  unavailable: 'blocked',
  quoted: 'waiting',
  scheduled: 'waiting',
  pending: 'waiting',
};

function textOf(item) {
  return taskDisplayTitle(item || {}).toLowerCase();
}

export function normalizeTaskAction(action) {
  const key = String(action || '').trim().toLowerCase();
  return ACTION_ALIASES[key] || key || 'accept';
}

export function taskActionDefinition(action) {
  return TASK_ACTIONS[normalizeTaskAction(action)] || TASK_ACTIONS.accept;
}

export function taskActionStatus(action) {
  return taskActionDefinition(action).status || null;
}

export function taskActionRequiresNote(action) {
  return Boolean(taskActionDefinition(action).requiresNote);
}

export function taskActionLabel(action, variant = 'label') {
  const definition = taskActionDefinition(action);
  return variant === 'short' ? definition.shortLabel : definition.label;
}

export function taskActionPrompt(action, item, role = 'family') {
  const normalized = normalizeTaskAction(action);
  const title = textOf(item);
  if (normalized === 'handled' && (title.includes('pronouncement') || title.includes('confirm the official'))) {
    return 'Confirming this means a qualified professional has officially pronounced the death. Save who confirmed it, when, and any reference or case number.';
  }
  if (normalized === 'handled' && title.includes('confirmation contact')) {
    return 'Confirming this means this trusted contact has accepted their responsibility. Save the name, time, and any note they gave.';
  }
  if (normalized === 'handled' && title.includes('release')) {
    return 'Save who confirmed release, when it was confirmed, and what the next handoff is.';
  }
  if (normalized === 'blocked' && role === 'funeral_home') {
    return 'What exact information do you need from the family before staff can move this forward?';
  }
  if (normalized === 'waiting' && role === 'funeral_home') {
    return 'What did your team start, and who or what are you waiting on now?';
  }
  return taskActionDefinition(action).prompt;
}

export function taskActionPlaceholder(action, item, role = 'family') {
  const normalized = normalizeTaskAction(action);
  const title = textOf(item);
  if (normalized === 'handled' && title.includes('pronouncement')) {
    return 'Example: Pronounced by Dr. Kim at 8:42 PM; hospital chart note confirmed.';
  }
  if (normalized === 'handled' && title.includes('confirmation contact')) {
    return 'Example: Ashlee accepted by email at 9:12 PM and understands she is the backup contact.';
  }
  if (normalized === 'blocked' && role === 'funeral_home') {
    return 'Example: Need cemetery name and number of death certificates requested.';
  }
  return taskActionDefinition(action).placeholder;
}

export function taskActionConfirmation(action, item, role = 'family') {
  const normalized = normalizeTaskAction(action);
  const title = textOf(item);
  if (normalized === 'handled' && title.includes('pronouncement')) {
    return 'Official pronouncement proof saved. Passage can now track the next handoff.';
  }
  if (normalized === 'handled' && title.includes('confirmation contact')) {
    return 'Trusted contact confirmation saved.';
  }
  if (normalized === 'blocked' && role === 'funeral_home') {
    return 'Family information request saved. This stays visible until it is resolved.';
  }
  if (normalized === 'waiting' && role === 'funeral_home') {
    return 'Started on behalf of the family. The waiting state is now visible.';
  }
  return taskActionDefinition(action).confirmation;
}

export function taskActionOutcomeStatus(action) {
  const status = taskActionStatus(action);
  if (status === 'handled') return 'completed';
  if (status === 'blocked') return 'help';
  if (status === 'waiting') return 'waiting';
  if (status === 'acknowledged') return 'accepted';
  return normalizeTaskAction(action);
}

export function taskActionEventType(action, actor = 'participant') {
  const status = taskActionStatus(action);
  if (status === 'handled') return actor + '_handled';
  if (status === 'waiting') return actor + '_waiting';
  if (status === 'acknowledged') return actor + '_acknowledged';
  if (status === 'blocked') return actor + '_blocked';
  return actor + '_updated';
}

export function taskActionEventTitle(action, actorLabel = 'Participant') {
  const status = taskActionStatus(action);
  if (status === 'handled') return actorLabel + ' handled a task';
  if (status === 'waiting') return actorLabel + ' marked a task waiting';
  if (status === 'acknowledged') return actorLabel + ' accepted a task';
  if (status === 'blocked') return actorLabel + ' needs help';
  return actorLabel + ' updated a task';
}