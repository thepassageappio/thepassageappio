export type SituationCategory = 'home_unexpected' | 'hospice' | 'hospital' | 'care_facility' | 'already_handled' | 'other';

export const PREVIEW_RECEIVING_ORGANIZATION = {
  id: 'c7a00001-7a00-47a0-87a0-000000000001',
  name: 'Northstar Funeral Home',
} as const;

export const SITUATION_OPTIONS: { value: SituationCategory; label: string }[] = [
  { value: 'home_unexpected', label: 'It happened at home, unexpectedly' },
  { value: 'hospice', label: 'They were in hospice care' },
  { value: 'hospital', label: 'They are at a hospital' },
  { value: 'care_facility', label: 'They were at a care facility' },
  { value: 'already_handled', label: 'The first steps are already handled' },
  { value: 'other', label: 'Something else' },
];

export function humanSituationCategory(value: string | null): string {
  return SITUATION_OPTIONS.find((option) => option.value === value)?.label ?? 'Situation not recorded';
}

// One prepared, situation-specific next step. Deliberately short and concrete --
// this is read by someone in crisis, often on a phone, often exhausted.
export function situationGuidance(value: SituationCategory): { heading: string; steps: string[] } {
  switch (value) {
    case 'home_unexpected':
      return {
        heading: 'If you have not already, call 911.',
        steps: [
          'Do not move the person unless emergency services tell you to.',
          'If you are given a case or reference number, write it down.',
          'Once emergency services have responded, a funeral home can take over from there.',
        ],
      };
    case 'hospice':
      return {
        heading: 'Call the hospice nurse or on-call number.',
        steps: [
          'Ask who will pronounce death.',
          'Ask what happens next with medications and equipment.',
          'Write down what they tell you to do next.',
        ],
      };
    case 'hospital':
      return {
        heading: 'Ask hospital staff about the next steps for release.',
        steps: [
          'Confirm who is authorized to approve release.',
          'Ask what the hospital needs from you right now.',
          'A funeral home can coordinate pickup once release is approved.',
        ],
      };
    case 'care_facility':
      return {
        heading: 'Ask for the nurse, social worker, or release contact.',
        steps: [
          'Confirm who can authorize release.',
          'Write down what the facility needs from you.',
          'A funeral home can coordinate pickup once release is approved.',
        ],
      };
    case 'already_handled':
      return {
        heading: 'Good — the first steps are done.',
        steps: [
          'Tell us what has already been confirmed.',
          'We will help you organize what is still open.',
          'Everything you save here stays with this record.',
        ],
      };
    default:
      return {
        heading: "Tell us what is happening.",
        steps: [
          'We will help you figure out the safest next step.',
          'If you are unsure who to call, let us know and we will help.',
        ],
      };
  }
}
