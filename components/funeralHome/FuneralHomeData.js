// Passage — funeral-home redesign content model (pure data, no React/DS imports).
// Director priorities from AGENTS.md (risk, case flow, staff load, family-update
// health, unowned waiting points, proof gaps, ROI) reframed as plain-language
// OUTCOMES for a funeral-home owner — no internal vocab, no ARR/pilot/QA language.

// Outcome benefit cards — what the funeral home GETS, framed as relief.
export const FH_BENEFITS = [
  {
    id: 'never-lose',
    title: 'No case detail ever slips',
    body: 'Every case carries one living record of what is happening, who owns it, what it is waiting on, and what has already been handled. Nothing lives in someone’s head, inbox, or sticky note.',
  },
  {
    id: 'families-updated',
    title: 'Families stay calmly informed',
    body: 'Approved updates keep families in the loop without a single message leaving your team unreviewed. Fewer anxious calls, fewer repeated questions, more trust in your care.',
  },
  {
    id: 'staff-load',
    title: 'Staff load is finally visible',
    body: 'See who is carrying what at a glance, catch unowned or stalled steps before they become a Monday problem, and assign work once instead of chasing it all week.',
  },
  {
    id: 'proof-roi',
    title: 'Proof you can stand behind',
    body: 'Dates, decisions, documents, and family approvals stay attached to the case with who did it and when — a clean record you can export, audit, and show families and partners.',
  },
];

// How it fits / onboarding — reassuring, low-commitment, not a replacement.
export const FH_STEPS = [
  {
    id: 'fit',
    num: '1',
    title: 'Keep the systems you already trust',
    body: 'Passage is the family-coordination layer on top of your work — not a replacement for your case-management or accounting tools. It fills the gap where details scatter.',
  },
  {
    id: 'rollout',
    num: '2',
    title: 'Start with a few real cases',
    body: 'We set you up with a guided rollout on a small set of live cases so your team feels the difference before you ever change how you operate at scale.',
  },
  {
    id: 'expand',
    num: '3',
    title: 'Expand on your timeline',
    body: 'Once your team trusts the flow, add staff queues, more locations, role scopes, reporting, and exports — at the pace that fits your house.',
  },
];

// Trust / proof band items — each routes to a real public destination, no sign-up.
export const FH_TRUST = [
  {
    id: 'sample-case',
    href: '/funeral-home/sample-case',
    label: 'See a real sample case',
    body: 'Look inside a complete coordination record, start to finish — no sign-up, no sales call.',
    event: 'funeral_home_cta_clicked',
    eventLabel: 'See sample case',
  },
  {
    id: 'pricing',
    href: '/pricing',
    label: 'See plans and pricing',
    body: 'Simple monthly plans that grow with your house, from a single location to a group.',
    event: 'funeral_home_cta_clicked',
    eventLabel: 'See pricing',
  },
];

// Small, concrete "what a case shows" preview rows for the hero proof panel.
export const FH_CASE_PREVIEW = {
  name: 'Price family arrangement',
  status: 'Waiting on family',
  rows: [
    ['Owner', 'Maria, arranger'],
    ['Next step', 'Confirm cemetery plot details and review the prepared family update.'],
    ['Proof', 'Hospital release saved. Family update drafted. Export packet ready.'],
  ],
};
