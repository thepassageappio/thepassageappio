const internalPreviewText = /\b(?:Cycle\s*\d+[A-Z]?|QA|fixture|test(?:ing)?)\b/i;
const emailAddress = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i;

export function humanizePreviewLabel(value: string, fallback = 'Preview information') {
  const cleaned = value
    .replace(/\s*-\s*Cycle\s+\d+[A-Z]?\s+QA\s*$/i, '')
    .replace(/\s+Cycle\s+\d+[A-Z]?\s*$/i, '')
    .trim();
  if (!cleaned || internalPreviewText.test(cleaned) || emailAddress.test(cleaned)) return fallback;
  return cleaned;
}

export function humanizePreviewIdentity(value: string, role?: string) {
  const roleFallback = role === 'director' || role === 'owner'
    ? 'Preview director'
    : role === 'staff'
      ? 'Preview staff member'
      : 'Preview team member';
  if (internalPreviewText.test(value) || emailAddress.test(value)) return roleFallback;
  const cleaned = humanizePreviewLabel(value, roleFallback);
  if (/^cycle\d+[a-z-]*$/i.test(cleaned)) {
    if (role === 'director' || role === 'owner') return 'Preview director';
    if (role === 'staff') return 'Preview staff member';
    return 'Preview team member';
  }
  return cleaned;
}

export function humanizeMemberIdentity(
  displayName: string | null | undefined,
  email: string | null | undefined,
  role?: string,
) {
  const genuineName = displayName?.trim();
  if (genuineName) return humanizePreviewIdentity(genuineName, role);
  if (email?.trim()) return humanizePreviewIdentity(email.trim(), role);
  if (role === 'director' || role === 'owner') return 'Preview director';
  if (role === 'staff') return 'Preview staff member';
  return 'Preview team member';
}

export function humanizeSavedReason(value: string | null, fallback: string) {
  if (!value) return null;
  if (internalPreviewText.test(value) || emailAddress.test(value)) return fallback;
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
