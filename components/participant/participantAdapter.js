// Passage — Participant scoped-surface adapter (site-migration Slice 4).
// Pure, presentational-data module. No network/Supabase imports so it is safe on
// client and server. Mirrors components/vendor/vendorRequestAdapter.js and
// components/family/familyTodayAdapter.js: it merges the participant's scoped
// tasks + actions, maps each through the shared operating contract + single calm
// status model, then strips operator vocab so the participant only ever sees their
// scoped slice — never the whole family record.
import { byCalmPriority, deriveCalmStatus, present } from '../../lib/designSystem';
import { taskOperatingContractFor } from '../../lib/taskWorkspace';
import { taskDisplayTitle } from '../../lib/communicationCenter';
import { taskActionRequiresNote, taskActionStatus } from '../../lib/taskActions';

function text(value, fallback = '') {
  return String(value == null ? fallback : value).trim();
}

// Strip operator/internal vocabulary so participant copy stays scoped + plain.
// Mirrors cleanVendorCopy. The participant sees one scoped request, never the
// operator lane vocabulary or the full family record.
export function cleanParticipantCopy(value, fallback = '') {
  return text(value, fallback)
    .replace(/participant\s+operating\s+lane/gi, 'your request')
    .replace(/operating\s+(lane|sheet|model|step)/gi, 'request step')
    .replace(/proof destination/gi, 'where this is saved')
    .replace(/prepared output/gi, 'what Passage prepared')
    .replace(/proof panel/gi, 'scoped request')
    .replace(/proof packet/gi, 'saved proof')
    .replace(/case export/gi, 'scoped request')
    .replace(/family-visible status/gi, 'request status')
    .replace(/the full family record/gi, 'your scoped request')
    .replace(/family record/gi, 'scoped request')
    .replace(/\s+/g, ' ')
    .trim();
}

function itemTitle(item) {
  return taskDisplayTitle(item || {});
}

function itemDescription(item) {
  return text(item?.description || item?.body);
}

// isHandled mirrors the legacy participating page so closed work buckets the same.
function isHandled(item) {
  if (item && typeof item === 'object') {
    const status = String(item.status || item.delivery_status || item.outcome_status || '').toLowerCase();
    const outcome = String(item.outcome_status || '').toLowerCase();
    return ['handled', 'completed', 'done', 'not_applicable', 'cancelled'].includes(status)
      || ['handled', 'completed', 'done'].includes(outcome)
      || Boolean(item.completed_at || item.handled_at);
  }
  return ['handled', 'completed', 'done', 'not_applicable', 'cancelled'].includes(String(item || '').toLowerCase());
}

// effectiveItemStatus mirrors the legacy page: prefer a meaningful delivery_status.
function effectiveItemStatus(item) {
  if (isHandled(item)) return 'handled';
  const status = String(item?.status || '').toLowerCase();
  const delivery = String(item?.delivery_status || '').toLowerCase();
  if (['blocked', 'waiting', 'acknowledged', 'needs_review'].includes(delivery)) return delivery;
  return status || delivery || 'assigned';
}

// roleKind mirrors the legacy page so the action set per scoped request matches.
function roleKind(role, item) {
  const blob = [role, itemTitle(item), itemDescription(item)].join(' ').toLowerCase();
  if (blob.includes('florist') || blob.includes('flower') || blob.includes('vendor') || blob.includes('caterer')) return 'vendor';
  if (blob.includes('pastor') || blob.includes('officiant') || blob.includes('rabbi') || blob.includes('priest') || blob.includes('imam') || blob.includes('clergy')) return 'officiant';
  if (blob.includes('executor') || blob.includes('attorney') || blob.includes('probate') || blob.includes('bank') || blob.includes('insurance')) return 'executor';
  return 'helper';
}

// actionSet mirrors the legacy page. Each [apiAction, label] maps to a server
// action accepted by POST /api/participantAction.
function actionSet(kind) {
  if (kind === 'officiant') return [
    ['confirmed', 'I can officiate'],
    ['needs_details', 'I need service details'],
    ['unavailable', 'I cannot help'],
  ];
  if (kind === 'vendor') return [
    ['needs_details', 'Need details'],
    ['quoted', 'Quote sent'],
    ['scheduled', 'Scheduled'],
    ['handled', 'Mark done with proof'],
  ];
  if (kind === 'executor') return [
    ['accept', 'I own this'],
    ['waiting', 'Mark waiting'],
    ['needs_details', 'Documents needed'],
    ['handled', 'Done with proof'],
  ];
  return [
    ['accept', 'I own this'],
    ['waiting', 'Mark waiting'],
    ['handled', 'Mark done with proof'],
  ];
}

// recommendedParticipantAction mirrors the legacy page recommendation logic.
function recommendedParticipantAction(availableActions, status) {
  const normalized = String(status || '').toLowerCase();
  const findAction = (key) => availableActions.find(([action]) => action === key);
  if (['assigned', 'sent', 'pending', ''].includes(normalized)) {
    return findAction('accept') || findAction('confirmed') || availableActions[0];
  }
  return findAction('handled') || findAction('confirmed') || availableActions[0];
}

// Map an effective item status into the calm single-status model. The participant
// owns anything assigned/sent/pending; waiting/blocked map straight through; the
// rest is handled/done.
function participantCalmStatusKey(item) {
  if (isHandled(item)) return 'done';
  const status = effectiveItemStatus(item);
  if (status === 'blocked') return 'blocked';
  if (status === 'needs_review') return 'in_review';
  if (status === 'waiting') return 'waiting';
  if (status === 'acknowledged') return 'yours_now';
  // assigned / sent / pending / unknown -> the participant owns the next move.
  return 'yours_now';
}

function ownerSummary(item) {
  if (isHandled(item)) return 'Handled by you';
  const assigned = text(item?.assigned_to_name || item?.assigned_to_email || item?.recipient_name || item?.recipient_email);
  return assigned ? `Assigned to ${assigned}` : 'Assigned to you';
}

function whoLabel(statusKey, item, coordinatorName) {
  if (statusKey === 'waiting') return text(item?.waiting_on || item?.recipient_name || coordinatorName, coordinatorName);
  return 'You';
}

// Build one scoped request model from a merged (task|action) item.
export function buildParticipantItem(item, estate = {}) {
  const estateName = text(estate.deceased_name || estate.name, 'this family record');
  const coordinatorName = text(estate.coordinator_name, 'the coordinator');
  const kind = roleKind(estate.role, item);
  const status = effectiveItemStatus(item);
  const statusKey = participantCalmStatusKey(item);
  const owner = ownerSummary(item);

  const contract = taskOperatingContractFor(
    { ...item, title: itemTitle(item) },
    { role: 'participant', estateName, owner, coordinatorName, surface: 'your scoped request' },
  );
  // deriveCalmStatus consumes the canonical participant calm key (the scoped item
  // status is the source of truth, not the raw operatingStatus).
  deriveCalmStatus({ ...item, owner_name: owner }, { operatingStatus: statusKey });
  const view = present(statusKey, { who: whoLabel(statusKey, item, coordinatorName) });

  const available = actionSet(kind);
  const recommended = recommendedParticipantAction(available, status);
  const secondary = available.filter(([action]) => !recommended || action !== recommended[0]);

  const why = cleanParticipantCopy(
    contract?.reassurance,
    'This is one scoped request. You do not need the full family record.',
  );

  const details = [
    ['Owner', cleanParticipantCopy(contract.owner || owner)],
    ['Waiting on', cleanParticipantCopy(contract.waitingOn || (statusKey === 'waiting' ? coordinatorName : 'Your update'))],
    ['What Passage prepared', cleanParticipantCopy(contract.output?.label || 'A scoped request for you to answer')],
    ['Where this is saved', cleanParticipantCopy(contract.proofDestination || 'This scoped request status trail')],
    ['Next status', cleanParticipantCopy(contract.statusLabel || 'Ready')],
    ['Who can see this', 'Only this scoped request'],
  ];

  return {
    id: text(item.id, itemTitle(item)),
    raw: item,
    _kind: item._kind || 'task',
    kind,
    statusKey,
    statusView: view,
    who: view.who,
    title: itemTitle(item),
    description: itemDescription(item),
    why,
    owner,
    coordinatorName,
    estateName,
    handled: isHandled(item),
    recommendedAction: recommended || null,
    secondaryActions: secondary,
    actions: available,
    // action label for the hero/sheet button.
    action: recommended ? recommended[1] : 'View saved status',
    requiresNoteFor: (apiAction) => taskActionRequiresNote(apiAction),
    apiStatusFor: (apiAction) => (apiAction === 'save_note' ? null : (taskActionStatus(apiAction) || 'needs_review')),
    details,
    savedNote: text(item.notes),
  };
}

// normalizeItems merges scoped tasks + actions (tag _kind), de-duped, mirroring the
// legacy page so nothing is dropped or doubled.
export function normalizeParticipantItems(estate = {}) {
  const seen = new Set();
  return [
    ...((estate.tasks || []).map((t) => ({ ...t, _kind: 'task' }))),
    ...((estate.actions || []).map((a) => ({ ...a, _kind: 'action' }))),
  ].filter((item) => {
    const title = item.title || item.subject || item.action_type || 'Scoped request';
    const key = [item._kind, item.id || title, title, item.status || item.delivery_status || ''].join(':');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rowSort(a, b) {
  return byCalmPriority(a.statusView, b.statusView);
}

// buildParticipantEstateModel — one estate's scoped queue, bucketed into
// startHere / whenReady / waiting / proofSaved. Mirrors the family/vendor models.
export function buildParticipantEstateModel(estate = {}) {
  const items = normalizeParticipantItems(estate)
    .map((item) => buildParticipantItem(item, estate))
    .sort(rowSort);

  const open = items.filter((row) => row.statusKey !== 'done');
  const startHere = open.find((row) => row.statusKey === 'yours_now')
    || open.find((row) => row.statusKey === 'blocked')
    || open[0]
    || null;
  const whenReady = open.filter((row) => row !== startHere && (row.statusKey === 'yours_now' || row.statusKey === 'in_review' || row.statusKey === 'blocked'));
  const waiting = open.filter((row) => row !== startHere && row.statusKey === 'waiting');
  const proofSaved = items.filter((row) => row.statusKey === 'done');

  return {
    id: text(estate.id, 'estate'),
    raw: estate,
    estateName: text(estate.deceased_name || estate.name, 'Family record'),
    role: text(estate.role, 'family helper'),
    coordinatorName: text(estate.coordinator_name, 'the coordinator'),
    coordinatorEmail: text(estate.coordinator_email),
    status: text(estate.status),
    events: Array.isArray(estate.events) ? estate.events : [],
    items,
    open,
    openCount: open.length,
    startHere,
    whenReady,
    waiting,
    proofSaved,
    done: proofSaved.length,
    total: items.length,
  };
}

// chooseParticipantEstateId mirrors the legacy estate selection: ?estate, then
// ?task's estate, then a previously-open estate, then the first with open work.
export function chooseParticipantEstateId(estates = [], query = {}, previousId = '') {
  const list = Array.isArray(estates) ? estates : [];
  const linkedEstate = text(query.estate);
  if (linkedEstate && list.some((estate) => estate.id === linkedEstate)) return linkedEstate;
  const linkedTask = text(query.task);
  if (linkedTask) {
    const taskEstate = list.find((estate) => normalizeParticipantItems(estate).some((item) => item.id === linkedTask));
    if (taskEstate?.id) return taskEstate.id;
  }
  const openCount = (estate) => normalizeParticipantItems(estate).filter((item) => !isHandled(item)).length;
  if (previousId && list.some((estate) => estate.id === previousId && openCount(estate) > 0)) return previousId;
  const firstOpen = list.find((estate) => openCount(estate) > 0);
  return firstOpen?.id || previousId || list[0]?.id || '';
}

// estateOptionLabel for the multi-estate selector.
export function estateOptionLabel(estate) {
  return text(estate?.deceased_name || estate?.name, 'Family record');
}

export { isHandled as isParticipantItemHandled };
