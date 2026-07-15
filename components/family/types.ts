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
  { id: 'notes', label: 'Family notes', detail: 'Private reflections and conversations in the family space.' },
];

export const EXPIRIES: ExpiryOption[] = [
  { id: '24h', label: '24 hours', moment: 'Tomorrow at 11:30 AM' },
  { id: '72h', label: '3 days', moment: 'Friday at 11:30 AM' },
  { id: '7d', label: '7 days', moment: 'Tuesday, July 21 at 11:30 AM' },
];

export const DEFAULT_DRAFT: TransferDraft = {
  recipientId: '',
  scopeIds: [],
  expiryId: '',
};
