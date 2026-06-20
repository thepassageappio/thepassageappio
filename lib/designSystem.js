// Passage Calm Guided OS — canonical design system + single-status model.
// Sprint 1 rebuild foundation (E1 tokens + E3 status derivation).
// Pure module: no network/Supabase imports so it is safe on client and server.
// Status derivation builds on the existing operating model (see lib/taskWorkspace
// operatingStatus / taskOperatingContractFor) rather than replacing it.

export const DS = {
  color: {
    cream: '#fbfaf7',
    page: '#f6f3ee',
    card: '#ffffff',
    ink: '#1a1916',
    mid: '#6a6560',
    soft: '#a09890',
    border: '#e4ddd4',
    sage: '#6b8f71',
    sageDeep: '#3b5d41',
    sageFaint: '#f0f5f1',
    amber: '#b07d2e',
    amberFaint: '#fdf8ee',
    rose: '#c47a7a',
    roseFaint: '#fdf3f3',
    focus: '#6b8f71',
  },
  space: { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, xxl: 36 },
  radius: { sm: 10, md: 14, lg: 16, xl: 22, pill: 999 },
  tap: { min: 44 },
  shadow: {
    card: '0 14px 38px rgba(55,45,35,.06)',
    sheet: '0 24px 80px rgba(0,0,0,.2)',
  },
  // Mobile-first breakpoints used across the rebuild.
  bp: { sm: 360, md: 390, lg: 768, xl: 1024 },
};

// Canonical calm statuses. Order encodes priority (lower = needs attention sooner).
export const CALM_STATUS = {
  yours_now: { key: 'yours_now', priority: 0, base: 'Needs you' },
  blocked: { key: 'blocked', priority: 1, base: 'Blocked' },
  in_review: { key: 'in_review', priority: 2, base: 'In review' },
  waiting: { key: 'waiting', priority: 3, base: 'Waiting' },
  not_started: { key: 'not_started', priority: 4, base: 'Not started' },
  done: { key: 'done', priority: 5, base: 'Done' },
};

// Presentation tokens per status, dark-text-on-light-fill (WCAG-safe pairings).
const STATUS_TONE = {
  yours_now: { fg: '#7a4f10', bg: DS.color.amberFaint, dot: DS.color.amber },
  blocked: { fg: '#8a3a3a', bg: DS.color.roseFaint, dot: DS.color.rose },
  in_review: { fg: '#5a4a86', bg: '#f1eefb', dot: '#7a6bc0' },
  waiting: { fg: DS.color.mid, bg: '#f1efe8', dot: DS.color.soft },
  not_started: { fg: DS.color.mid, bg: '#f1efe8', dot: DS.color.soft },
  done: { fg: DS.color.sageDeep, bg: DS.color.sageFaint, dot: DS.color.sage },
};

function lc(v) {
  return String(v == null ? '' : v).trim().toLowerCase();
}

// Map the existing operating status string to a calm status key.
// Accepts the legacy operatingStatus values (done | needs_help | waiting | ready)
// and common storage values (handled | pending | needs_review | blocked).
export function operatingToCalm(operating) {
  const s = lc(operating);
  if (['done', 'handled', 'completed'].includes(s)) return 'done';
  if (['needs_help', 'blocked', 'failed'].includes(s)) return 'blocked';
  if (['needs_review', 'in_review', 'review'].includes(s)) return 'in_review';
  if (s === 'waiting') return 'waiting';
  if (['', 'not_started', 'cancelled'].includes(s)) return 'not_started';
  // 'ready', 'pending', 'assigned', 'draft', 'sent' all mean: actionable now.
  return 'yours_now';
}

function ownerMatchesViewer(task, viewer) {
  if (!viewer) return null;
  const ids = [viewer.id, viewer.userId, viewer.email].map(lc).filter(Boolean);
  if (!ids.length) return null;
  const ownerFields = [
    task && task.assigned_to_id,
    task && task.assigned_to_email,
    task && task.owner_id,
    task && task.owner_email,
  ].map(lc).filter(Boolean);
  if (!ownerFields.length) return null;
  return ownerFields.some((o) => ids.includes(o));
}

function ownerName(task) {
  return (task && (task.assigned_to_name || task.assigned_to_email || task.owner_name)) || '';
}

function waitingName(task) {
  return (task && (task.waiting_on || task.recipient_name || task.recipient)) || '';
}

// deriveCalmStatus: the single source of truth the rebuilt task surface renders.
// Inputs:
//   task     — a task/operating row (uses assigned_to_*, waiting_on, status / operatingStatus)
//   options  — { viewer, operatingStatus } where operatingStatus is the precomputed
//              legacy value if the caller already has it (preferred — keeps logic DRY).
// Returns: { key, priority, label, who, ...STATUS_TONE[key] }
export function deriveCalmStatus(task, options = {}) {
  const { viewer = null } = options;
  const operating = options.operatingStatus != null
    ? options.operatingStatus
    : (task && (task.operatingStatus || task.status));
  let key = operatingToCalm(operating);

  // Viewer-relative refinement: an actionable task that is NOT the viewer's is, to
  // them, something they are waiting on — never show "Needs you" for someone else's work.
  const isOwner = ownerMatchesViewer(task, viewer);
  if (key === 'yours_now' && isOwner === false) key = 'waiting';

  return present(key, {
    who: key === 'waiting' ? (waitingName(task) || ownerName(task)) : ownerName(task),
  });
}

// present: build the full status view object (label + tone) for a key.
export function present(key, ctx = {}) {
  const def = CALM_STATUS[key] || CALM_STATUS.not_started;
  const tone = STATUS_TONE[def.key];
  const who = (ctx.who || '').trim();
  let label = def.base;
  if (def.key === 'waiting' && who) label = `Waiting on ${who}`;
  if (def.key === 'done' && ctx.proof) label = 'Done — proof saved';
  return { key: def.key, priority: def.priority, label, who, ...tone };
}

// Sort helper for the rebuilt "For you" home: needs-you first, done last.
export function byCalmPriority(a, b) {
  const pa = (CALM_STATUS[a && a.key] || CALM_STATUS.not_started).priority;
  const pb = (CALM_STATUS[b && b.key] || CALM_STATUS.not_started).priority;
  return pa - pb;
}

export default DS;
