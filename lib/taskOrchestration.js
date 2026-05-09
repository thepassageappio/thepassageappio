import { taskDisplayTitle, selectNextTask, taskExpectedUpdate } from './communicationCenter';
import { getTaskPlaybook } from './taskPlaybooks';
import { taskWorkspaceFor } from './taskWorkspace';

const DONE = new Set(['handled', 'completed', 'done', 'not_applicable', 'cancelled']);
const WAITING = new Set(['waiting', 'pending', 'sent', 'delivered', 'assigned', 'acknowledged']);
const NEEDS_HELP = new Set(['blocked', 'failed', 'needs_review']);

const DEPENDENCY_RULES = [
  {
    key: 'pronouncement',
    label: 'official pronouncement',
    match: ['death certificate', 'death certificates', 'funeral home meeting', 'arrangement', 'ssa', 'social security', 'bank', 'insurance', 'probate'],
    satisfiedBy: ['pronouncement'],
  },
  {
    key: 'funeral_home',
    label: 'funeral home contact',
    match: ['arrangement', 'funeral director', 'service', 'cemetery', 'crematorium', 'obituary', 'meeting summary'],
    satisfiedBy: ['contact the funeral home', 'funeral home'],
  },
  {
    key: 'death_certificates',
    label: 'death certificates ordered or available',
    match: ['social security', 'bank', 'financial', 'life insurance', 'probate', 'credit bureau', 'dmv', 'passport', 'estate tax', 'final income tax'],
    satisfiedBy: ['death certificate'],
  },
];

function clean(value) {
  return String(value || '').toLowerCase();
}

function includesAny(value, needles = []) {
  const text = clean(value);
  return needles.some(needle => text.includes(clean(needle)));
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(String(value).includes('T') ? value : String(value) + 'T12:00:00');
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(value, now = new Date()) {
  const date = parseDate(value);
  if (!date) return null;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((target - start) / 86400000);
}

function eventDateFor(task, context = {}) {
  const title = clean(taskDisplayTitle(task || {}));
  const events = Array.isArray(context.serviceEvents) ? context.serviceEvents : [];
  if (!events.length) return null;
  const typeNeedles = [];
  if (includesAny(title, ['wake', 'visitation', 'shiva'])) typeNeedles.push('visitation', 'wake', 'shiva');
  if (includesAny(title, ['funeral', 'service', 'obituary', 'readings', 'music', 'pallbearer', 'clergy', 'officiant', 'faith'])) typeNeedles.push('funeral', 'service');
  if (includesAny(title, ['burial', 'cemetery', 'committal', 'crematorium', 'cremation'])) typeNeedles.push('burial', 'cemetery', 'crematorium');
  if (includesAny(title, ['reception', 'catering', 'travel', 'lodging'])) typeNeedles.push('reception', 'travel');
  const match = events.find(event => {
    const text = clean([event.event_type, event.name, event.title].filter(Boolean).join(' '));
    return typeNeedles.some(needle => text.includes(needle));
  });
  return match?.date || null;
}

function datePressure(task, context = {}) {
  const explicitDue = task?.due_date || task?.due_at || task?.deadline || task?.needed_by || task?.needed_by_date;
  const eventDate = eventDateFor(task, context);
  const deathDate = context.deathDate || context.dateOfDeath || context.estate?.date_of_death || context.workflow?.date_of_death;
  const dueDays = Number(task?.due_days_after_trigger ?? task?.due_day);
  const eventDays = daysUntil(eventDate);
  const explicitDays = daysUntil(explicitDue);
  let deathWindow = null;
  if (deathDate && Number.isFinite(dueDays)) {
    const death = parseDate(deathDate);
    if (death) {
      death.setDate(death.getDate() + dueDays);
      deathWindow = daysUntil(death.toISOString());
    }
  }
  const candidates = [explicitDays, eventDays, deathWindow].filter(value => value !== null && Number.isFinite(value));
  if (!candidates.length) return null;
  const nearest = Math.min.apply(null, candidates);
  if (nearest < 0) return { rankShift: -18, label: 'Overdue', reason: 'This is past the known needed-by date and should be cleared or marked waiting.' };
  if (nearest === 0) return { rankShift: -16, label: 'Due today', reason: 'This is tied to today in the estate timeline.' };
  if (nearest <= 1) return { rankShift: -14, label: 'Due tomorrow', reason: 'This is needed before the next dated event or deadline.' };
  if (nearest <= 3) return { rankShift: -10, label: 'Due in ' + nearest + ' days', reason: 'This is close to a known wake, service, burial, or task deadline.' };
  if (nearest <= 7) return { rankShift: -4, label: 'This week', reason: 'This is connected to a known date in the estate timeline.' };
  return null;
}

export function taskIsDone(task) {
  return DONE.has(clean(task?.status || task?.delivery_status || task?.outcome_status));
}

export function taskIsWaiting(task) {
  return WAITING.has(clean(task?.status || task?.delivery_status || task?.outcome_status));
}

export function taskNeedsHelp(task) {
  return NEEDS_HELP.has(clean(task?.status || task?.delivery_status || task?.outcome_status));
}

export function taskCategory(task) {
  const title = taskDisplayTitle(task || {});
  const text = clean(title);
  if (includesAny(text, ['pronouncement', 'funeral', 'cemetery', 'crematorium', 'service', 'obituary', 'clergy', 'officiant', 'faith', 'pallbearer'])) return 'service';
  if (includesAny(text, ['will', 'probate', 'attorney', 'executor', 'death certificate', 'dmv', 'passport', 'voter', 'tax'])) return 'legal';
  if (includesAny(text, ['bank', 'insurance', 'pension', 'retirement', 'social security', 'medicare', 'medicaid', 'credit', 'benefit'])) return 'financial';
  if (includesAny(text, ['home', 'property', 'vehicle', 'mail', 'digital', 'subscription', 'account'])) return 'property';
  if (includesAny(text, ['notify', 'family', 'friend', 'employer', 'travel', 'lodging', 'thank you', 'photo', 'memory', 'reception'])) return 'family';
  return 'coordination';
}

export function taskImportance(task, context = {}) {
  const title = clean(taskDisplayTitle(task || {}));
  const priority = clean(task?.priority);
  const due = Number(task?.due_days_after_trigger ?? task?.due_day ?? task?.position ?? 99);

  const pressure = datePressure(task, context);
  let base;

  if (includesAny(title, ['call 911', 'emergency services', 'medical examiner', 'pronouncement', 'hospice nurse', 'hospital or facility release', 'facility release process'])) {
    base = {
      rank: 0,
      label: 'Critical now',
      reason: 'Official release, safety, or medical authority must be clear before downstream work moves.',
    };
  } else if (includesAny(title, ['contact the funeral home', 'funeral home call', 'healthcare proxy', 'legal decision-maker', 'secure the home', 'minor children', 'pets', 'notify immediate family'])) {
    base = {
      rank: 1,
      label: 'Today',
      reason: 'This reduces immediate confusion, protects the family, or establishes who can act.',
    };
  } else if (includesAny(title, ['death certificate', 'obituary', 'cemetery', 'crematorium', 'clergy', 'officiant', 'faith community', 'service', 'funeral director', 'arrangement', 'prepayment', 'policy'])) {
    base = {
      rank: 2,
      label: 'Next 72 hours',
      reason: 'This prepares the service path and unlocks tasks that depend on official records or family approval.',
    };
  } else if (includesAny(title, ['social security', 'bank', 'financial', 'life insurance', 'employer', 'probate', 'estate attorney', 'medicare', 'medicaid', 'benefits'])) {
    base = {
      rank: 3,
      label: 'First week',
      reason: 'This protects money, benefits, accounts, and legal next steps after the first urgent decisions are stable.',
    };
  } else if (includesAny(title, ['dmv', 'passport', 'credit bureau', 'credit card', 'tax', 'subscription', 'digital', 'social media', 'license', 'voter', 'mail forwarding'])) {
    base = {
      rank: 4,
      label: 'Later admin',
      reason: 'This matters, but usually after the immediate service, authority, and record paths are clear.',
    };
  } else if (priority === 'urgent') {
    base = { rank: 1, label: 'Today', reason: 'This was marked urgent and should stay visible until owned.' };
  } else if (Number.isFinite(due) && due <= 0) {
    base = { rank: 1, label: 'Today', reason: 'This is due now and should be assigned or recorded.' };
  } else if (Number.isFinite(due) && due <= 3) {
    base = { rank: 2, label: 'Next 72 hours', reason: 'This should be queued after the immediate authority and service path.' };
  } else {
    base = {
      rank: 5,
      label: 'When ready',
      reason: 'This stays organized so it does not become another loose thread.',
    };
  }

  if (pressure && pressure.rankShift <= -10 && base.rank > 0) {
    return {
      ...base,
      rank: Math.min(base.rank, pressure.label === 'Overdue' ? 0 : 1),
      label: pressure.label,
      reason: pressure.reason,
    };
  }
  return base;
}

export function taskDependencyBlockers(task, allTasks = []) {
  if (!task || taskIsDone(task)) return [];
  const title = taskDisplayTitle(task);
  const blockers = [];
  DEPENDENCY_RULES.forEach(rule => {
    if (!includesAny(title, rule.match)) return;
    const satisfied = allTasks.some(candidate => {
      const candidateTitle = taskDisplayTitle(candidate);
      return includesAny(candidateTitle, rule.satisfiedBy) && taskIsDone(candidate);
    });
    const selfSatisfying = includesAny(title, rule.satisfiedBy);
    if (!satisfied && !selfSatisfying) blockers.push(rule);
  });
  return blockers;
}

function taskScore(task, allTasks, role, context = {}) {
  let score = 50;
  const title = clean(taskDisplayTitle(task));
  const status = clean(task?.status || task?.delivery_status || task?.outcome_status);
  const playbook = task.playbook || getTaskPlaybook(task.title || task.task_title || title);
  const blockers = taskDependencyBlockers(task, allTasks);
  const importance = taskImportance(task, context);
  const pressure = datePressure(task, context);

  if (taskIsDone(task)) score += 1000;
  if (blockers.length) score += 120;
  score += importance.rank * 18;
  if (pressure) score += pressure.rankShift;
  if (NEEDS_HELP.has(status)) score -= 35;
  else if (status === 'draft' || status === 'not_started' || !status) score -= 20;
  else if (WAITING.has(status)) score -= 8;
  if (role === 'funeral_home' && playbook.funeralHomeEligible) score -= 12;
  if (includesAny(title, ['pronouncement', 'funeral home', 'death certificate'])) score -= 10;
  if (includesAny(title, ['notify immediate family', 'secure the home'])) score -= 6;
  const due = Number(task?.due_days_after_trigger ?? task?.due_day ?? task?.position ?? 0);
  if (Number.isFinite(due)) score += Math.min(30, due);
  return score;
}

export function selectClearNextAction(tasks = [], role = 'family', context = {}) {
  const open = (tasks || []).filter(task => !taskIsDone(task));
  if (!open.length) return null;
  const dependencyReady = open.filter(task => taskDependencyBlockers(task, tasks).length === 0);
  const pool = dependencyReady.length ? dependencyReady : open;
  return pool.slice().sort((a, b) => taskScore(a, tasks, role, context) - taskScore(b, tasks, role, context))[0] || selectNextTask(tasks, role);
}

export function categoryProgress(tasks = []) {
  const grouped = {};
  (tasks || []).forEach(task => {
    const category = taskCategory(task);
    if (!grouped[category]) grouped[category] = { category, total: 0, done: 0, waiting: 0, needsHelp: 0, open: 0 };
    grouped[category].total += 1;
    if (taskIsDone(task)) grouped[category].done += 1;
    else {
      grouped[category].open += 1;
      if (taskIsWaiting(task)) grouped[category].waiting += 1;
      if (taskNeedsHelp(task)) grouped[category].needsHelp += 1;
    }
  });
  return Object.values(grouped)
    .map(row => ({ ...row, percent: row.total ? Math.round((row.done / row.total) * 100) : 0 }))
    .sort((a, b) => b.needsHelp - a.needsHelp || b.waiting - a.waiting || b.open - a.open || a.category.localeCompare(b.category));
}

export function orchestrateTasks({ tasks = [], role = 'family', context = {} } = {}) {
  const enriched = (tasks || []).map(task => {
    const playbook = task.playbook || getTaskPlaybook(task.title || task.task_title || taskDisplayTitle(task));
    const workspace = taskWorkspaceFor({ ...task, playbook }, context);
    const blockers = taskDependencyBlockers({ ...task, playbook }, tasks);
    const importance = taskImportance({ ...task, playbook }, context);
    return {
      ...task,
      playbook,
      workspace,
      orchestration: {
        category: taskCategory(task),
        blockers,
        blockedByDependency: blockers.length > 0,
        waiting: taskIsWaiting(task),
        needsHelp: taskNeedsHelp(task),
        done: taskIsDone(task),
        importance,
      },
    };
  }).sort((a, b) => taskScore(a, tasks, role, context) - taskScore(b, tasks, role, context));
  const nextTask = selectClearNextAction(enriched, role, context);
  const nextBlockers = nextTask ? taskDependencyBlockers(nextTask, enriched) : [];
  const progress = categoryProgress(enriched);
  return {
    tasks: enriched,
    nextTask,
    nextAction: nextTask ? {
      task: nextTask,
      title: taskDisplayTitle(nextTask),
      owner: nextTask.assigned_to_name || nextTask.assigned_to_email || nextTask.owner_name || nextTask.playbook?.ownerRole || 'Unassigned',
      output: nextTask.workspace?.output,
      proofDestination: nextTask.workspace?.proofDestination,
      expectedUpdate: taskExpectedUpdate(nextTask, role),
      blockers: nextBlockers,
      reason: nextBlockers.length
        ? `Waiting on ${nextBlockers.map(item => item.label).join(', ')} first.`
        : nextTask.playbook?.nextActionLabel || 'Move this next.',
    } : null,
    progress,
    counts: {
      total: enriched.length,
      done: enriched.filter(taskIsDone).length,
      waiting: enriched.filter(taskIsWaiting).length,
      needsHelp: enriched.filter(taskNeedsHelp).length,
      dependencyBlocked: enriched.filter(task => task.orchestration?.blockedByDependency).length,
    },
  };
}
