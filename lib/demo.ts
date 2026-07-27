export type PersonaId = 'family' | 'director' | 'staff' | 'vendor';

export type Persona = {
  id: PersonaId;
  order: string;
  name: string;
  role: string;
  action: string;
  detail: string;
  href?: string;
  demoPersona?: 'family' | 'director' | 'staff' | 'vendor';
  state: 'origin' | 'active' | 'ready' | 'destination';
};

export type ContinuityStep = {
  id: string;
  label: string;
  meta: string;
  state: 'complete' | 'active' | 'upcoming';
};

export const demoCase = {
  person: 'Sofia Rivera',
  location: 'Northstar Funeral Home',
  lastSync: 'Ready to explore',
};

export const personas: Persona[] = [
  {
    id: 'family', order: '01', name: 'Family help', role: 'Begin privately',
    action: 'Start without signing in', detail: 'Use made-up details only. At the last step, continue with the family demo or sign in to an existing Preview account. No email is sent.',
    href: '/start', state: 'origin',
  },
  {
    id: 'director', order: '02', name: 'Director', role: 'Funeral-home lead',
    action: 'Open the director demo', detail: 'See urgent requests, assign work, and review saved confirmation.',
    demoPersona: 'director', state: 'active',
  },
  {
    id: 'staff', order: '03', name: 'Staff', role: 'Assigned team member',
    action: 'Open the staff demo', detail: 'See only assigned work, take the next step, and save confirmation.',
    demoPersona: 'staff', state: 'ready',
  },
  {
    id: 'vendor', order: '04', name: 'Vendor', role: 'Outside service partner',
    action: 'Open the vendor demo', detail: 'Respond to one request, quote the work, and submit delivery confirmation.',
    demoPersona: 'vendor', state: 'destination',
  },
];

export const continuity: ContinuityStep[] = [
  { id: 'consent', label: 'Family asks for help', meta: 'Shared by choice', state: 'complete' },
  { id: 'intake', label: 'Funeral home responds', meta: 'One clear owner', state: 'complete' },
  { id: 'coordination', label: 'Team completes the work', meta: 'In progress', state: 'active' },
  { id: 'handoff', label: 'Family sees confirmation', meta: 'Next', state: 'upcoming' },
];
