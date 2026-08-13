export const PARTICIPANT_CATEGORY_LABELS = {
  updates: 'Family updates',
  tasks: 'Shared tasks',
  decisions: 'Family decisions',
  documents: 'Shared documents',
  service: 'Service plans',
  proof: 'Completion updates',
} as const;

export type ParticipantCategory = keyof typeof PARTICIPANT_CATEGORY_LABELS;

export function participantCategoryLabel(value: string): string {
  return PARTICIPANT_CATEGORY_LABELS[value as ParticipantCategory]
    ?? 'Selected family information';
}

export function participantCategoryLabels(values: string[]): string[] {
  return values.map(participantCategoryLabel);
}

export function staffRoleLabel(value: string): string {
  if (value === 'staff') return 'Staff member';
  if (value === 'director') return 'Director';
  if (value === 'owner') return 'Organization owner';
  return 'Team member';
}
