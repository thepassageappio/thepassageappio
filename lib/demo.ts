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
  id: 'NS-2051',
  person: 'Sofia Rivera',
  location: 'Northstar · Portland',
  familyLead: 'Maya Rivera',
  lastSync: '08:42 AM',
};

export const personas: Persona[] = [
  {
    id: 'family', order: '01', name: 'Maya', role: 'Family coordinator',
    action: 'Control what moves', detail: 'Review the record, choose what to share, and follow every handoff.',
    href: '/family', state: 'origin',
  },
  {
    id: 'director', order: '02', name: 'Elena', role: 'Accountable director',
    action: 'See the whole case', detail: 'Orient instantly, resolve decisions, and protect the family from repetition.',
    href: '/director', state: 'active',
  },
  {
    id: 'staff', order: '03', name: 'Marcus', role: 'Assigned operator',
    action: 'Keep promises moving', detail: 'Work from one next commitment with ownership and visible proof.',
    href: '/staff', state: 'ready',
  },
  {
    id: 'receive', order: '04', name: 'Elena', role: 'Receiving director',
    action: 'Receive with confidence', detail: 'Accept a consented handoff and return a durable receipt.',
    href: '/receive', state: 'destination',
  },
];

export const continuity: ContinuityStep[] = [
  { id: 'consent', label: 'Family handoff', meta: 'ISSUED', state: 'complete' },
  { id: 'intake', label: 'Case accepted', meta: 'NS-2051', state: 'complete' },
  { id: 'coordination', label: 'Commitment owned', meta: 'MARCUS', state: 'active' },
  { id: 'handoff', label: 'Proof review', meta: 'NEXT', state: 'upcoming' },
];
