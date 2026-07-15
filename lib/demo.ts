export type PersonaId = 'family' | 'director' | 'staff' | 'receive';

export type Persona = {
  id: PersonaId;
  order: string;
  name: string;
  role: string;
  action: string;
  detail: string;
  href: string;
  state: 'origin' | 'active' | 'ready' | 'destination';
};

export type ContinuityStep = {
  id: string;
  label: string;
  meta: string;
  state: 'complete' | 'active' | 'upcoming';
};

export const demoCase = {
  id: 'P-1048',
  person: 'Arthur Chen',
  location: 'Northstar Funeral Home',
  familyLead: 'Lena Chen',
  lastSync: '10:24 AM',
};

export const personas: Persona[] = [
  {
    id: 'family', order: '01', name: 'Lena', role: 'Family coordinator',
    action: 'Control what moves', detail: 'Review the record, choose what to share, and follow every handoff.',
    href: '/family', state: 'origin',
  },
  {
    id: 'director', order: '02', name: 'Mara', role: 'Funeral director',
    action: 'See the whole case', detail: 'Orient instantly, resolve decisions, and protect the family from repetition.',
    href: '/director', state: 'active',
  },
  {
    id: 'staff', order: '03', name: 'Elena', role: 'Care team',
    action: 'Keep promises moving', detail: 'Work from one next commitment with ownership and visible proof.',
    href: '/staff', state: 'ready',
  },
  {
    id: 'receive', order: '04', name: 'Jordan', role: 'Receiving partner',
    action: 'Receive with confidence', detail: 'Accept a consented handoff and return a durable receipt.',
    href: '/receive', state: 'destination',
  },
];

export const continuity: ContinuityStep[] = [
  { id: 'consent', label: 'Family consent', meta: '09:42', state: 'complete' },
  { id: 'intake', label: 'Intake verified', meta: '10:08', state: 'complete' },
  { id: 'coordination', label: 'Care in motion', meta: 'NOW', state: 'active' },
  { id: 'handoff', label: 'Partner handoff', meta: 'READY', state: 'upcoming' },
];
