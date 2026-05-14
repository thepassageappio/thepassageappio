export const CARE_PROVIDER_TYPES = {
  hospice: {
    label: 'Hospice',
    eyebrow: 'Hospice continuity',
    title: 'Carry the family from care into the next step.',
    description: 'Hospice teams can help families prepare the practical handoff before the crisis moment: who to call, who owns decisions, what is known, and what should move into the red path when death occurs.',
    path: '/hospice',
  },
  assisted_living: {
    label: 'Assisted Living',
    eyebrow: 'Senior living continuity',
    title: 'Help families prepare without becoming their project manager.',
    description: 'Assisted living and care communities can start a calm family record with trusted contacts, facility context, documents, preferences, and the handoff path if care changes or death occurs.',
    path: '/assisted-living',
  },
  home_care: {
    label: 'Home Care',
    eyebrow: 'Home-care continuity',
    title: 'Keep the family plan clear while care is happening at home.',
    description: 'Home-care teams can capture the family coordinator, care contacts, known preferences, and first-call path so the family is not rebuilding context later.',
    path: '/care-providers',
  },
};

export const CARE_PROVIDER_SPINE_STEPS = [
  ['1', 'Start the family record', 'Create a warm-path record with the family coordinator, care context, trusted people, and what is already known.'],
  ['2', 'Set permissions', 'The family owns the record. Care teams see only the handoff context and tasks they are invited to help with.'],
  ['3', 'Prepare the handoff', 'Unknown dates, funeral-home preference, decision maker, and first-call plan become visible next steps.'],
  ['4', 'Activate when needed', 'If death occurs, the activation circle confirms the transition and the same record opens the red path.'],
  ['5', 'Hand off downstream', 'Funeral homes, vendors, participants, and family updates work from the same proof trail instead of separate inboxes.'],
];

export const CARE_PROVIDER_BUSINESS_MODEL = [
  ['Pilot', 'Start with a small number of family handoffs so the partner can prove reduced repeated calls and cleaner downstream coordination.'],
  ['Location subscription', 'Charge per branch, community, or care team with an included number of active family handoffs.'],
  ['Expansion', 'Add locations, staff seats, reporting, co-branded handoff pages, and higher active-record allowances as they grow.'],
  ['Downstream revenue', 'Warm funeral-home inbounds, D2C family conversion, and vendor marketplace revenue can all originate from this upstream record.'],
];

export const CARE_PROVIDER_PRICING = [
  {
    tier: 'Pilot',
    price: '$0',
    cadence: 'for 90 days',
    subprice: 'then $199/mo',
    description: 'For one hospice, assisted-living, senior-living, or home-care team proving the handoff model with a small family set.',
    features: ['1 location or care team', '10 active family records', 'Warm-path intake and family ownership', 'Basic handoff reporting'],
    cta: 'Start pilot conversation',
    stripeKey: 'CARE_PROVIDER_PILOT_PRICE_ID',
  },
  {
    tier: 'Location',
    price: '$299',
    cadence: '/mo',
    subprice: 'per location',
    description: 'For one community, branch, or care team that wants Passage available as a standard family continuity layer.',
    features: ['1 included location', '50 active family records', 'Staff seats included', 'Funeral-home handoff packets', 'Participant invites and proof trail'],
    cta: 'Book location setup',
    stripeKey: 'CARE_PROVIDER_LOCATION_PRICE_ID',
    preferred: true,
  },
  {
    tier: 'Network',
    price: '$749',
    cadence: '/mo',
    subprice: 'includes 3 locations',
    description: 'For regional care providers that need cross-location coordination, reporting, and a consistent family handoff process.',
    features: ['3 included locations', '$149/mo per additional location', 'Cross-location reporting', 'Priority onboarding', 'Team and location routing'],
    cta: 'Discuss network rollout',
    stripeKey: 'CARE_PROVIDER_NETWORK_PRICE_ID',
  },
  {
    tier: 'Enterprise',
    price: 'Custom',
    cadence: '',
    subprice: 'annual agreement',
    description: 'For larger operators, hospice groups, and care networks that need security review, implementation support, or custom reporting.',
    features: ['Implementation plan', 'Security and contract review', 'Custom reporting', 'SSO path when needed', 'Dedicated rollout support'],
    cta: 'Contact Passage',
    stripeKey: 'CARE_PROVIDER_ENTERPRISE_CONTACT_ONLY',
  },
];

export const CARE_PROVIDER_SCOPE_BOUNDARIES = [
  'Passage is not an EMR, clinical chart, medication workflow, or medical advice product.',
  'Care providers do not browse private family records.',
  'Families approve what is shared outside the record.',
  'Provider handoffs, tasks, messages, dates, and proof attach to the same estate spine.',
];
