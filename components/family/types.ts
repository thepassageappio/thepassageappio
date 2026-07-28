export type Recipient = {
  id: string;
  organization: string;
  person: string;
  role: string;
  location: string;
};

export type ScopeItem = {
  id: string;
  label: string;
  detail: string;
};

export type ExpiryOption = {
  id: string;
  label: string;
  moment: string;
};

export type TransferDraft = {
  recipientId: string;
  scopeIds: string[];
  expiryId: string;
  activatedAt?: string;
};

export const RECIPIENTS: Recipient[] = [
  {
    id: 'northstar',
    organization: 'Northstar Funeral Home',
    person: 'Elena Torres',
    role: 'Funeral director',
    location: 'Portland, Oregon',
  },
  {
    id: 'cedar-stone',
    organization: 'Cedar & Stone Memorial',
    person: 'Amara Reed',
    role: 'Care coordinator',
    location: 'Beaverton, Oregon',
  },
];

export const SCOPES: ScopeItem[] = [
  { id: 'identity', label: 'Identity details', detail: 'Name, birth date, and the family contacts you selected.' },
  { id: 'care', label: 'Current care', detail: 'Care location, receiving contact, and transport notes.' },
  { id: 'wishes', label: 'Service wishes', detail: 'The ceremony and memorial preferences saved so far.' },
  { id: 'documents', label: 'Selected documents', detail: 'Only the identification and planning files you choose.' },
  { id: 'notes', label: 'Family notes', detail: 'Private reflections and conversations in this browser demo.' },
];

const EXPIRY_DURATIONS: { id: string; label: string; hours: number }[] = [
  { id: '24h', label: '24 hours', hours: 24 },
  { id: '72h', label: '3 days', hours: 72 },
  { id: '7d', label: '7 days', hours: 24 * 7 },
];

// Every option's displayed moment is derived from the same `now` and the
// option's real duration, so the three can never disagree with each other.
// (QA sweep PR #50, bug 3: these were hand-written static strings, and the
// 7-day option was dated earlier than the 3-day one.)
function describeExpiryMoment(hoursFromNow: number, now: Date): string {
  const target = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
  const time = target.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(target) - startOfDay(now)) / (24 * 60 * 60 * 1000));
  if (dayDiff <= 0) return `Today at ${time}`;
  if (dayDiff === 1) return `Tomorrow at ${time}`;
  const weekday = target.toLocaleDateString('en-US', { weekday: 'long' });
  if (dayDiff < 7) return `${weekday} at ${time}`;
  const month = target.toLocaleDateString('en-US', { month: 'long' });
  return `${weekday}, ${month} ${target.getDate()} at ${time}`;
}

function buildExpiries(now: Date = new Date()): ExpiryOption[] {
  return EXPIRY_DURATIONS.map(({ id, label, hours }) => ({ id, label, moment: describeExpiryMoment(hours, now) }));
}

export const EXPIRIES: ExpiryOption[] = buildExpiries();

export const DEFAULT_DRAFT: TransferDraft = {
  recipientId: '',
  scopeIds: [],
  expiryId: '',
};
