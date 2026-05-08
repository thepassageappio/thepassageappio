import { taskDisplayTitle, selectNextTask } from './communicationCenter';
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

function taskScore(task, allTasks, role) {
  let score = 50;
  const title = clean(taskDisplayTitle(task));
  const status = clean(task?.status || task?.delivery_status || task?.outcome_status);
  const playbook = task.playbook || getTaskPlaybook(task.title || task.task_title || title);
  const blockers = taskDependencyBlockers(task, allTasks);

  if (taskIsDone(task)) score += 1000;
  if (blockers.length) score += 120;
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

export function selectClearNextAction(tasks = [], role = 'family') {
  const open = (tasks || []).filter(task => !taskIsDone(task));
  if (!open.length) return null;
  const dependencyReady = open.filter(task => taskDependencyBlockers(task, tasks).length === 0);
  const pool = dependencyReady.length ? dependencyReady : open;
  return pool.slice().sort((a, b) => taskScore(a, tasks, role) - taskScore(b, tasks, role))[0] || selectNextTask(tasks, role);
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
      },
    };
  });
  const nextTask = selectClearNextAction(enriched, role);
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
