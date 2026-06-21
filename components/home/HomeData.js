// Passage — home redesign content model (pure data, no React/DS imports).
// Keeping copy here keeps HomeCalm.js focused on layout + behavior.

// Outcome-focused reassurance (NOT operator steps). Speaks to the family.
export const HELP_CARDS = [
  {
    id: 'know',
    title: 'You always know the one next thing',
    body: 'No long checklist to decipher. Passage surfaces the single step that matters now, who owns it, and what it unblocks.',
  },
  {
    id: 'together',
    title: 'Everyone stays on the same page',
    body: 'Family, funeral home, helpers, and vendors share one quiet record, so no one repeats the story or works from a stale detail.',
  },
  {
    id: 'kept',
    title: 'Nothing slips, everything is kept',
    body: 'Every reply, document, and decision is saved with who did it and when. The record carries forward through every handoff.',
  },
];

// Persona entry cards, the front-door router. Each routes to a real public page.
export const PERSONA_CARDS = [
  {
    id: 'urgent',
    href: '/urgent',
    label: 'A death just happened',
    body: 'Start an urgent record and move through the first hours one calm step at a time.',
    tone: 'primary',
  },
  {
    id: 'planning',
    href: '/planning',
    label: 'I want to plan ahead',
    body: 'Organize wishes, documents, and people now so loved ones are not left guessing later.',
  },
  {
    id: 'funeral-home',
    href: '/funeral-home',
    label: 'I run a funeral home',
    body: 'Keep cases, staff, family updates, and proof aligned, and give families a calmer experience.',
  },
  {
    id: 'care-providers',
    href: '/care-providers',
    label: 'I work in care',
    body: 'Hospice, senior living, and home care teams create warm, family-owned handoffs.',
  },
  {
    id: 'participants',
    href: '/participating',
    label: 'I was asked to help',
    body: 'Open one scoped request from a family, without seeing the whole estate record.',
  },
  {
    id: 'vendors',
    href: '/vendors',
    label: 'I provide a service',
    body: 'Respond to scoped requests, send quotes, and keep families updated in one place.',
  },
];

// Trust / proof band, reassurance not sales. Each item is framed for the family.
export const TRUST_ITEMS = [
  {
    id: 'sample-case',
    href: '/funeral-home/sample-case',
    event: 'homepage_sample_case_clicked',
    label: 'See a sample case',
    body: 'Look inside a real coordination record, start to finish, no sign-up needed.',
  },
  {
    id: 'vendor',
    href: '/vendors/request?demo=1&demoTour=funeral-home&demoStep=vendor',
    event: 'homepage_sample_vendor_clicked',
    label: 'See a vendor request',
    body: 'See how a scoped request reaches a vendor with context, and nothing more.',
  },
];
