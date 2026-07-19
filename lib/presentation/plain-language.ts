import { containsInternalPreviewText } from './member-identity.js';

export { humanizeMemberIdentity, humanizePreviewIdentity, humanizePreviewLabel } from './member-identity.js';

export function humanizeSavedReason(value: string | null, fallback: string) {
  if (!value) return null;
  if (containsInternalPreviewText(value)) return fallback;
  return value;
}

const taskStatusLabels: Record<string, string> = {
  assigned: 'Assigned',
  in_progress: 'In progress',
  proof_submitted: 'Waiting for review',
  blocked: 'Needs help',
  completed: 'Complete',
};

const proofTypeLabels: Record<string, string> = {
  confirmation: 'Confirmation',
  handoff: 'Handoff note',
  reference: 'Work reference',
  completion_note: 'Completion note',
};

const workflowPhaseLabels: Record<string, string> = {
  arrangements: 'Arrangements',
  care_in_motion: 'Care in progress',
  service_ready: 'Service ready',
  disposition_complete: 'Disposition complete',
  aftercare: 'Aftercare',
};

const audienceLabels: Record<string, string> = {
  case_team: 'Authorized case team',
  family_coordinator: 'Family coordinator',
  organization_team: 'Authorized organization team',
};

const automationLabels: Record<string, string> = {
  manual: 'Handled by a person',
  semi_automated: 'Prepared by Passage for review',
  automated: 'Handled automatically',
};

export function humanTaskStatus(value: string) {
  return taskStatusLabels[value] ?? 'Status unavailable';
}

export function humanMemberStatus(value: string) {
  if (value === 'active') return 'Active access';
  if (value === 'revoked') return 'Access removed';
  return 'Access status unavailable';
}

export function humanProofType(value: string) {
  return proofTypeLabels[value] ?? 'Submitted proof';
}

export function humanWorkflowPhase(value: string | null | undefined) {
  if (!value) return 'Case work';
  return workflowPhaseLabels[value] ?? 'Case work';
}

export function humanAudience(value: string) {
  return audienceLabels[value] ?? 'Authorized case team';
}

export function humanAutomationLevel(value: string) {
  return automationLabels[value] ?? 'Handled by the assigned person';
}
