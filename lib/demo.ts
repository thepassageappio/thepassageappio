export type PersonaId = 'family' | 'director' | 'staff' | 'receive';

export type Persona = {
  id: PersonaId;
  order: string;
  boundary: 'FICTIONAL SAMPLE' | 'SECURE WORKSPACE';
  name: string;
  role: string;
  action: string;
  detail: string;
  cta: 'Explore sample' | 'Sign in';
  href: string;
  accessibleName: string;
  pendingLabel: 'Opening sample…' | 'Opening secure sign in…';
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
};

export const personas: Persona[] = [
  {
    id: 'family', order: '01', boundary: 'FICTIONAL SAMPLE', name: 'Maya', role: 'Family coordinator',
    action: 'Choose what to share', detail: 'Explore fictional Rivera family information. Changes stay in this browser and nobody is contacted.',
    cta: 'Explore sample', href: '/family', accessibleName: 'Explore the fictional family coordinator sample',
    pendingLabel: 'Opening sample…', state: 'origin',
  },
  {
    id: 'director', order: '02', boundary: 'SECURE WORKSPACE', name: 'Funeral-home director', role: 'Authorized directors',
    action: 'Open the director workspace', detail: 'Sign in with an authorized funeral-home account. A director sample is not included on this page.',
    cta: 'Sign in', href: '/login?next=%2Fdirector', accessibleName: 'Sign in to the secure funeral-home director workspace',
    pendingLabel: 'Opening secure sign in…', state: 'active',
  },
  {
    id: 'staff', order: '03', boundary: 'SECURE WORKSPACE', name: 'Funeral-home staff', role: 'Authorized staff members',
    action: 'Open assigned work', detail: 'Sign in with an authorized funeral-home account. A staff sample is not included on this page.',
    cta: 'Sign in', href: '/login?next=%2Fstaff', accessibleName: 'Sign in to the secure funeral-home staff workspace',
    pendingLabel: 'Opening secure sign in…', state: 'ready',
  },
  {
    id: 'receive', order: '04', boundary: 'FICTIONAL SAMPLE', name: 'Elena', role: 'Receiving director',
    action: 'Review a Transfer Pass', detail: 'Explore a fictional handoff. Preview actions stay in this browser and do not create a real case.',
    cta: 'Explore sample', href: '/receive', accessibleName: 'Explore the fictional receiving-director sample',
    pendingLabel: 'Opening sample…', state: 'destination',
  },
];

export const continuity: ContinuityStep[] = [
  { id: 'consent', label: 'Family handoff', meta: 'EXAMPLE COMPLETE', state: 'complete' },
  { id: 'intake', label: 'Case accepted', meta: 'EXAMPLE COMPLETE', state: 'complete' },
  { id: 'coordination', label: 'Commitment owned', meta: 'EXAMPLE CURRENT', state: 'active' },
  { id: 'handoff', label: 'Proof review', meta: 'EXAMPLE NEXT', state: 'upcoming' },
];
