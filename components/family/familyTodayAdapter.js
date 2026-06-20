import { byCalmPriority, deriveCalmStatus } from '../../lib/designSystem';
import { taskOperatingContractFor } from '../../lib/taskWorkspace';

function text(value, fallback = '') {
  return String(value == null ? fallback : value).trim();
}

function taskId(task, index) {
  return text(task?.id || task?.dbId || task?.task_id || task?.title || index, `task-${index}`);
}

function taskTitle(task) {
  return text(task?.title || task?.name || task?.label, 'Next step');
}

function isHandled(task) {
  const status = text(task?.status || task?.outcome_status).toLowerCase();
  return Boolean(task?.completed || task?.completed_at || task?.handled_at || ['handled', 'completed', 'done', 'not_applicable', 'cancelled'].includes(status));
}

function cleanFamilyCopy(value, fallback) {
  return text(value, fallback)
    .replace(/operating\s+(lane|sheet|model|step)/gi, 'family step')
    .replace(/proof destination/gi, 'where this is saved')
    .replace(/prepared output/gi, 'Passage prepared')
    .replace(/proof panel/gi, 'family record')
    .replace(/proof packet/gi, 'saved proof')
    .replace(/case export/gi, 'shared record')
    .replace(/family-visible status/gi, 'family status')
    .replace(/\s+/g, ' ')
    .trim();
}

function proofCopy(contract) {
  const raw = cleanFamilyCopy(contract?.proofDestination, 'Saved to your family record.');
  if (!raw || /family record/i.test(raw)) return raw || 'Saved to your family record.';
  return 'Saved to your family record.';
}

function ownerCopy(contract) {
  const owner = text(contract?.owner);
  return owner && owner !== 'Assign an owner' ? owner : 'Needs an owner';
}

function waitingCopy(contract) {
  const waiting = text(contract?.waitingOn);
  if (!waiting || waiting === 'No one yet') return 'No one else yet';
  return waiting;
}

function actionCopy(contract, view) {
  if (view?.key === 'done') return 'View saved proof';
  if (view?.key === 'waiting') return 'Update what is waiting';
  if (view?.key === 'blocked') return 'Ask for the missing detail';
  return cleanFamilyCopy(contract?.primaryAction?.label, 'Review and save');
}

function whyCopy(task, contract, view) {
  if (view?.key === 'done') return 'This is already saved on the family record.';
  if (view?.key === 'waiting') return `Passage is keeping this visible while ${waitingCopy(contract)} has the next move.`;
  return cleanFamilyCopy(
    contract?.guidance?.why || contract?.reassurance || task?.description || task?.desc,
    'Passage keeps the next action, owner, waiting point, and saved proof together.'
  );
}

export function normalizeFamilyTask(task = {}) {
  return {
    ...task,
    id: task?.id || task?.dbId || task?.task_id || null,
    title: taskTitle(task),
    description: task?.description || task?.desc || '',
    status: isHandled(task) ? 'handled' : (task?.status || task?.outcome_status || 'pending'),
    assigned_to_name: task?.assigned_to_name || task?.assignedTo || task?.owner_name || '',
    assigned_to_email: task?.assigned_to_email || task?.assignedEmail || task?.owner_email || '',
    owner_name: task?.owner_name || task?.assigned_to_name || task?.assignedTo || '',
    waiting_on: task?.waiting_on || task?.recipient_name || task?.recipient || task?.playbook?.waitingOn || '',
    completed_at: task?.completed_at || task?.handled_at || null,
    proof_required: task?.proof_required || task?.playbook?.proofRequired || 'confirmation',
    automation_level: task?.automation_level || task?.automationLevel || task?.playbook?.automationLevel || '',
  };
}

export function toCalmTaskView(task, context = {}, index = 0) {
  const normalized = normalizeFamilyTask(task);
  const contract = taskOperatingContractFor(normalized, {
    role: 'family',
    estateName: context.estateName || context.workflow?.deceased_name || context.workflow?.name || 'this family record',
    owner: normalized.assigned_to_name || normalized.assigned_to_email,
    surface: 'family record',
  });
  const statusView = deriveCalmStatus(normalized, {
    viewer: context.viewer || context.user || null,
    operatingStatus: contract.status,
  });
  const view = {
    id: taskId(normalized, index),
    dbId: normalized.id || task?.dbId || null,
    raw: task,
    normalized,
    contract,
    statusView,
    statusKey: statusView.key,
    who: statusView.who,
    title: contract.title || taskTitle(task),
    why: whyCopy(normalized, contract, statusView),
    action: actionCopy(contract, statusView),
    details: [
      ['Owner', ownerCopy(contract)],
      ['Waiting on', waitingCopy(contract)],
      ['Passage prepared', cleanFamilyCopy(contract?.output?.body, 'A clear next action and the detail needed to move it.')],
      ['Where this is saved', proofCopy(contract)],
      ['Who can see this', cleanFamilyCopy(contract?.visibility, 'Family and funeral home')],
    ],
    updatedAt: normalized.updated_at || normalized.last_action_at || normalized.created_at || null,
  };
  return view;
}

function calmSort(a, b) {
  const byPriority = byCalmPriority(a.statusView, b.statusView);
  if (byPriority !== 0) return byPriority;
  const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
  const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
  return bt - at;
}

export function buildFamilyTodayModel({ workflow = null, tasks = [], user = null } = {}) {
  const estateName = workflow?.deceased_name ? `Estate of ${workflow.deceased_name}` : workflow?.name || workflow?.estate_name || 'Family record';
  const calmTasks = (Array.isArray(tasks) ? tasks : [])
    .filter(Boolean)
    .map((task, index) => toCalmTaskView(task, { workflow, user, estateName }, index))
    .sort(calmSort);

  const openTasks = calmTasks.filter((task) => task.statusKey !== 'done');
  const startHere = openTasks.find((task) => task.statusKey === 'yours_now' || task.statusKey === 'blocked') || openTasks[0] || null;
  const whenReady = calmTasks.filter((task) => task !== startHere && ['yours_now', 'blocked', 'not_started'].includes(task.statusKey)).slice(0, 8);
  const waiting = calmTasks.filter((task) => task !== startHere && ['waiting', 'in_review'].includes(task.statusKey)).slice(0, 8);
  const proofSaved = calmTasks.filter((task) => task.statusKey === 'done').slice(0, 8);

  return {
    estateName,
    total: calmTasks.length,
    done: proofSaved.length,
    startHere,
    whenReady,
    waiting,
    proofSaved,
    allTasks: calmTasks,
  };
}

export function familyEmptyModel(workflow = null) {
  const estateName = workflow?.deceased_name ? `Estate of ${workflow.deceased_name}` : workflow?.name || 'Family record';
  return {
    estateName,
    total: 0,
    done: 0,
    startHere: null,
    whenReady: [],
    waiting: [],
    proofSaved: [],
    allTasks: [],
  };
}
