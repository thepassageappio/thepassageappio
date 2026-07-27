import {
  containsInternalPreviewText,
  humanizeMemberIdentity,
  humanizePreviewIdentity,
  humanizePreviewLabel,
} from './member-identity.js';

export { humanizeMemberIdentity, humanizePreviewIdentity, humanizePreviewLabel };

export function humanFamilyName(value: string | null | undefined, fallback = 'Family') {
  const safe = humanizePreviewLabel(value ?? '', fallback).trim();
  return /\bfamily$/i.test(safe) ? safe : `${safe} family`;
}

export function humanizeSavedReason(value: string | null, fallback: string) {
  if (!value) return null;
  if (containsInternalPreviewText(value)) return fallback;
  return value;
}

const urgentFirstCommitmentLegacyAction = 'Assign an authorized staff member, then confirm the next arrangement step with the family.';
const urgentFirstCommitmentOwnerAction = 'Confirm the family’s next arrangement step and save the outcome.';

export function humanTaskOwnerAction(value: string | null | undefined, fallback = 'Complete the assigned work') {
  if (!value) return fallback;
  const normalized = value.trim();
  if (normalized === urgentFirstCommitmentLegacyAction) return urgentFirstCommitmentOwnerAction;
  if (containsInternalPreviewText(normalized)) return fallback;
  return normalized;
}

const taskStatusLabels: Record<string, string> = {
  assigned: 'Assigned',
  in_progress: 'In progress',
  proof_submitted: 'Waiting for review',
  blocked: 'Needs help',
  completed: 'Complete',
};

const nextStepLabels: Record<string, string> = {
  assigned: 'Starts once you begin the work.',
  in_progress: 'Save proof once the work is done.',
  proof_submitted: 'Waiting on director review.',
  blocked: 'Needs help before it can continue.',
  completed: 'Complete. No further action needed.',
};

const proofTypeLabels: Record<string, string> = {
  confirmation: 'Confirmation',
  handoff: 'Handoff note',
  reference: 'Reference confirmation',
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
  case_team: 'Current task owner and directors authorized for this location',
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

// Deliberately computed from the task's real status rather than read from
// tasks.next_state: that column stores a single hardcoded template string
// regardless of the row's actual status (confirmed against live data), so
// it can't be trusted to describe any particular task's real next step.
export function humanNextStep(status: string) {
  return nextStepLabels[status] ?? 'Passage will show the next step here.';
}

export function humanMemberStatus(value: string) {
  if (value === 'active') return 'Active access';
  if (value === 'revoked') return 'Access removed';
  return 'Access status unavailable';
}

export function humanProofType(value: string) {
  return proofTypeLabels[value] ?? 'Submitted evidence';
}

export function humanWorkflowPhase(value: string | null | undefined) {
  if (!value) return 'Case work';
  return workflowPhaseLabels[value] ?? 'Case work';
}

export function humanAudience(value: string) {
  return audienceLabels[value] ?? 'People authorized for this work';
}

export function humanAutomationLevel(value: string) {
  return automationLabels[value] ?? 'Handled by the assigned person';
}
