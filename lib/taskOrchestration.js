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

const OUTPUT_RULES = [
  {
    packetType: 'funeral_home_arrangement',
    label: 'Generate funeral-home packet',
    match: ['funeral home', 'arrangement', 'service', 'release', 'pickup', 'meeting summary'],
    reason: 'This turns known contacts, release context, service preferences, and open questions into one reviewed handoff.',
  },
  {
    packetType: 'bank_notification',
    label: 'Generate institution packet',
    match: ['bank', 'financial', 'account', 'credit', 'insurance', 'pension', 'retirement'],
    reason: 'This prepares the authority, document, contact, and confirmation fields institutions usually ask for.',
  },
  {
    packetType: 'ss_government',
    label: 'Generate government packet',
    match: ['social security', 'government', 'medicare', 'medicaid', 'va ', 'veterans', 'dmv', 'passport', 'voter'],
    reason: 'This creates a review-first agency packet and proof checklist before anyone contacts the office.',
  },
  {
    packetType: 'executor_summary',
    label: 'Generate executor summary',
    match: ['executor', 'probate', 'attorney', 'legal', 'will', 'trust', 'estate'],
    reason: 'This gives the family a calmer handoff for authority, documents, open items, and next legal questions.',
  },
  {
    packetType: 'family_event_one_pager',
    label: 'Generate family update',
    match: ['notify immediate family', 'family update', 'announcement', 'event', 'wake', 'visitation', 'reception'],
    reason: 'This turns dates and coordinator details into one reviewed family-facing update.',
  },
  {
    packetType: 'secure_home_assets',
    label: 'Generate home and assets checklist',
    match: ['secure the home', 'property', 'assets', 'pet', 'mail', 'vehicle', 'utilities', 'subscription'],
    reason: 'This gives the owner a proof-backed checklist for access, safety, receipts, pets, mail, and valuables.',
  },
  {
    packetType: 'vendor_service_request',
    label: 'Generate vendor quote brief',
    match: ['flower', 'florist', 'catering', 'livestream', 'transportation', 'venue', 'printing', 'clergy', 'officiant'],
    reason: 'This scopes date, time, location, quote terms, payment status, and completion proof for local help.',
  },
  {
    packetType: 'obituary_service',
    label: 'Generate obituary/service packet',
    match: ['obituary', 'program', 'service material', 'photo', 'livestream link'],
    reason: 'This creates a review-first publication and service-material packet with approval proof.',
  },
];

const NEXT_RULES = [
  {
    whenDone: ['pronouncement', 'hospice nurse', 'hospital or facility release', 'official authority'],
    title: 'Prepare funeral-home handoff packet',
    reason: 'Official authority or release context is what unlocks the funeral-home handoff.',
    packetType: 'funeral_home_arrangement',
  },
  {
    whenDone: ['contact the funeral home', 'funeral home selected', 'arrangement meeting'],
    title: 'Order death certificates',
    reason: 'Death certificates unlock banks, insurance, agencies, and many estate tasks.',
    packetType: 'funeral_home_arrangement',
  },
  {
    whenDone: ['notify immediate family', 'family update'],
    title: 'Prepare family event one-pager',
    reason: 'Once core relatives know, one reviewed update prevents scattered texts.',
    packetType: 'family_event_one_pager',
  },
  {
    whenDone: ['death certificate'],
    title: 'Prepare institution notification packet',
    reason: 'Certificates make bank, insurance, benefits, and agency calls easier to complete cleanly.',
    packetType: 'bank_notification',
  },
  {
    whenDone: ['secure the home', 'property'],
    title: 'Save home and asset proof',
    reason: 'Photos, receipts, access notes, and instructions protect the family from later confusion.',
    packetType: 'secure_home_assets',
  },
  {
    whenDone: ['service date', 'funeral service', 'wake', 'visitation'],
    title: 'Send scoped vendor quote requests',
    reason: 'Vendors need date, time, location, and service details before they can commit.',
    packetType: 'vendor_service_request',
  },
];

const WORKFLOW_STATE_RULES = [
  {
    key: 'immediate_response',
    label: 'Immediate Response',
    purpose: 'Confirm safety, pronouncement, decision authority, and the first responsible owner.',
    taskMatch: ['911', 'emergency', 'pronouncement', 'hospice nurse', 'hospital or facility release', 'healthcare proxy', 'decision-maker', 'immediate family', 'secure the home'],
    completionMatch: ['pronouncement', 'official authority', 'healthcare proxy', 'decision-maker'],
    dependencies: [],
    defaultGeneratedTasks: ['Confirm official pronouncement', 'Identify decision-maker', 'Secure home, pets, and valuables'],
    waitingConditions: ['waiting on hospice', 'waiting on hospital', 'waiting on medical examiner', 'waiting on decision-maker'],
  },
  {
    key: 'funeral_home_selection',
    label: 'Funeral Home Selection',
    purpose: 'Choose or confirm the funeral provider and establish the handoff owner.',
    taskMatch: ['funeral home', 'funeral director', 'arrangement meeting', 'provider selected', 'release process'],
    completionMatch: ['contact the funeral home', 'funeral home selected', 'arrangement meeting'],
    dependencies: ['immediate_response'],
    defaultGeneratedTasks: ['Choose or confirm funeral home', 'Prepare funeral-home handoff packet', 'Schedule arrangement meeting'],
    waitingConditions: ['waiting on family choice', 'waiting on provider response', 'waiting on release instructions'],
  },
  {
    key: 'transfer_coordination',
    label: 'Transfer Coordination',
    purpose: 'Coordinate release, pickup, transport, custody, cemetery, crematory, or facility handoff.',
    taskMatch: ['release', 'pickup', 'removal', 'transfer', 'body transport', 'custody', 'crematory', 'crematorium'],
    completionMatch: ['release confirmed', 'pickup confirmed', 'transfer confirmed', 'transport complete'],
    dependencies: ['immediate_response', 'funeral_home_selection'],
    defaultGeneratedTasks: ['Confirm release instructions', 'Record pickup or transfer proof', 'Save custody or facility reference'],
    waitingConditions: ['waiting on facility release', 'waiting on transport', 'waiting on funeral home'],
  },
  {
    key: 'death_certificate_processing',
    label: 'Death Certificate Processing',
    purpose: 'Track certificate ordering, copy counts, and downstream institution readiness.',
    taskMatch: ['death certificate', 'certificate copy', 'certified copies'],
    completionMatch: ['death certificate'],
    dependencies: ['funeral_home_selection'],
    defaultGeneratedTasks: ['Order death certificates', 'Confirm certificate copy count', 'Save certificate availability date'],
    waitingConditions: ['waiting on doctor', 'waiting on registrar', 'waiting on funeral home', 'waiting on county'],
  },
  {
    key: 'service_planning',
    label: 'Service Planning',
    purpose: 'Coordinate wake, funeral, cemetery, clergy, obituary, service materials, and family announcements.',
    taskMatch: ['service', 'wake', 'visitation', 'cemetery', 'burial', 'committal', 'obituary', 'clergy', 'officiant', 'music', 'readings', 'pallbearer', 'program'],
    completionMatch: ['service date', 'funeral service', 'wake', 'visitation', 'burial', 'cemetery', 'obituary approved'],
    dependencies: ['funeral_home_selection'],
    defaultGeneratedTasks: ['Confirm service dates', 'Prepare family event one-pager', 'Approve obituary or service materials'],
    waitingConditions: ['waiting on family approval', 'waiting on cemetery', 'waiting on clergy', 'waiting on venue'],
  },
  {
    key: 'vendor_coordination',
    label: 'Vendor Coordination',
    purpose: 'Scope local help, collect quotes, confirm timing, payment, reminders, and completion proof.',
    taskMatch: ['flower', 'florist', 'catering', 'livestream', 'transportation', 'venue', 'printing', 'travel', 'lodging', 'vendor'],
    completionMatch: ['vendor quote', 'paid', 'scheduled', 'completed', 'flowers', 'catering'],
    dependencies: ['service_planning'],
    defaultGeneratedTasks: ['Send scoped vendor quote request', 'Review and pay accepted quote', 'Collect completion proof'],
    waitingConditions: ['waiting on quote', 'waiting on family payment', 'waiting on vendor confirmation'],
  },
  {
    key: 'estate_aftercare',
    label: 'Estate and Aftercare',
    purpose: 'Move from service coordination into accounts, benefits, digital legacy, home, and family aftercare.',
    taskMatch: ['bank', 'insurance', 'social security', 'benefits', 'probate', 'executor', 'attorney', 'account', 'subscription', 'digital', 'mail', 'aftercare', 'grief'],
    completionMatch: ['bank', 'insurance', 'social security', 'probate', 'executor', 'account closed'],
    dependencies: ['death_certificate_processing'],
    defaultGeneratedTasks: ['Prepare institution notification packet', 'Create executor summary', 'Track account and aftercare follow-up'],
    waitingConditions: ['waiting on certificate', 'waiting on executor', 'waiting on institution', 'waiting on attorney'],
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
function daysSince(value, now = new Date()) {
  const until = daysUntil(value, now);
  return until === null ? null : -until;
}

function contextDateOfDeath(context = {}) {
  return context.deathDate
    || context.dateOfDeath
    || context.case?.date_of_death
    || context.case?.dateOfDeath
    || context.estate?.date_of_death
    || context.estate?.dateOfDeath
    || context.workflow?.date_of_death
    || context.workflow?.dateOfDeath
    || null;
}

function contextPhaseText(context = {}) {
  return clean([
    context.casePhase,
    context.phase,
    context.mode,
    context.path,
    context.triggerType,
    context.trigger_type,
    context.case?.phase,
    context.case?.status,
    context.estate?.phase,
    context.estate?.status,
    context.workflow?.phase,
    context.workflow?.status,
    context.workflow?.trigger_type,
  ].filter(Boolean).join(' '));
}

export function caseTimingContext(context = {}, now = new Date()) {
  const phaseText = contextPhaseText(context);
  const deathDate = contextDateOfDeath(context);
  const untilDeath = daysUntil(deathDate, now);
  const sinceDeath = daysSince(deathDate, now);
  const planning = includesAny(phaseText, ['planning', 'pre need', 'preneed', 'pre-death', 'before death', 'green', 'care prep', 'hospice', 'warm']);

  if (planning || (untilDeath !== null && untilDeath > 0)) {
    return {
      key: 'pre_death',
      label: untilDeath !== null && untilDeath > 0 ? 'Before death: ' + untilDeath + ' day' + (untilDeath === 1 ? '' : 's') + ' out' : 'Before death / planning',
      deathDate,
      daysUntilDeath: untilDeath,
      daysSinceDeath: sinceDeath,
      reason: 'Focus on decision authority, wishes, documents, care context, and the first-call plan before urgent work exists.',
    };
  }
  if (sinceDeath === null) {
    return {
      key: 'unknown',
      label: 'Timing not set',
      deathDate: null,
      daysUntilDeath: null,
      daysSinceDeath: null,
      reason: 'Set the date or case phase so Passage can prioritize the next action with confidence.',
    };
  }
  if (sinceDeath <= 1) {
    return {
      key: 'first_24_hours',
      label: sinceDeath <= 0 ? 'Day of death' : 'First 24 hours',
      deathDate,
      daysUntilDeath: untilDeath,
      daysSinceDeath: sinceDeath,
      reason: 'Confirm authority, release, funeral-home handoff, immediate family notification, and home safety before downstream work moves.',
    };
  }
  if (sinceDeath <= 3) {
    return {
      key: 'first_72_hours',
      label: 'Day ' + sinceDeath + ': first 72 hours',
      deathDate,
      daysUntilDeath: untilDeath,
      daysSinceDeath: sinceDeath,
      reason: 'Move arrangement, certificates, obituary, service timing, clergy, cemetery, and family updates into one owned path.',
    };
  }
  if (sinceDeath <= 7) {
    return {
      key: 'first_week',
      label: 'Day ' + sinceDeath + ': first week',
      deathDate,
      daysUntilDeath: untilDeath,
      daysSinceDeath: sinceDeath,
      reason: 'After urgent arrangements are stable, protect benefits, employer, bank, insurance, probate, and agency next steps.',
    };
  }
  if (sinceDeath <= 30) {
    return {
      key: 'first_month',
      label: 'Day ' + sinceDeath + ': aftercare',
      deathDate,
      daysUntilDeath: untilDeath,
      daysSinceDeath: sinceDeath,
      reason: 'Shift from service coordination into estate administration, account protection, property, digital, and family aftercare.',
    };
  }
  return {
    key: 'long_tail',
    label: 'Day ' + sinceDeath + ': long tail',
    deathDate,
    daysUntilDeath: untilDeath,
    daysSinceDeath: sinceDeath,
    reason: 'Keep the long tail from drifting: taxes, account closure, property, digital legacy, thank-yous, and estate closeout.',
  };
}

function taskTimingFit(task, context = {}) {
  const timing = caseTimingContext(context);
  const title = clean(taskDisplayTitle(task || {}));
  const phase = timing.key;
  const match = needles => includesAny(title, needles);
  const strong = (label, reason) => ({ ...timing, rankShift: -22, label, reason });
  const good = (label, reason) => ({ ...timing, rankShift: -12, label, reason });
  const wait = reason => ({ ...timing, rankShift: 90, reason });

  if (phase === 'pre_death') {
    if (match(['healthcare proxy', 'decision-maker', 'will', 'advance directive', 'medical records', 'key documents', 'burial', 'service wishes', 'prepayment', 'policy', 'funeral home', 'hospice', 'care provider'])) {
      return strong('Recommended before death', 'This is the right pre-need work: authority, wishes, documents, care context, and first-call readiness reduce crisis load later.');
    }
    if (match(['pronouncement', 'medical examiner', 'release process', 'facility release', 'death certificate', 'social security', 'bank', 'insurance claim', 'probate', 'dmv', 'passport', 'credit bureau', 'final income tax'])) {
      return wait('This usually waits until death or official authority exists. Keep it visible, but do not make it the top action yet.');
    }
    return { ...timing, rankShift: 0 };
  }

  if (phase === 'first_24_hours') {
    if (match(['pronouncement', 'medical examiner', 'hospice nurse', 'hospital or facility release', 'release process', 'decision-maker', 'healthcare proxy', 'contact the funeral home', 'notify immediate family', 'secure the home', 'minor children', 'pets'])) {
      return strong('Recommended now', 'In the first 24 hours this prevents unsafe handoffs: authority, release, funeral-home contact, immediate family, and home safety come first.');
    }
    if (match(['bank', 'insurance claim', 'probate', 'dmv', 'passport', 'credit bureau', 'subscription', 'tax'])) {
      return wait('This is usually later than the first 24 hours unless there is an immediate risk.');
    }
    return { ...timing, rankShift: 0 };
  }

  if (phase === 'first_72_hours') {
    if (match(['death certificate', 'arrangement', 'funeral director', 'obituary', 'cemetery', 'crematorium', 'clergy', 'officiant', 'faith community', 'service', 'wake', 'visitation', 'photos', 'readings', 'music', 'pallbearers', 'reception'])) {
      return strong('Recommended in first 72 hours', 'This is the service-planning window: certificates, arrangement, obituary, cemetery, clergy, and family-facing updates need owners.');
    }
    if (match(['pronouncement', 'release', 'contact the funeral home', 'notify immediate family'])) {
      return good('Still urgent', 'This should already be handled; if it is still open, clear it before service planning expands.');
    }
    return { ...timing, rankShift: 0 };
  }

  if (phase === 'first_week') {
    if (match(['social security', 'employer', 'bank', 'financial', 'life insurance', 'pension', 'retirement', 'probate', 'estate attorney', 'medicare', 'medicaid', 'veterans affairs', 'benefits', 'death certificate'])) {
      return strong('Recommended this week', 'This is the first-week protection layer: benefits, institutions, employer, insurance, certificates, and probate need clear proof and owners.');
    }
    if (match(['obituary', 'service', 'cemetery', 'clergy', 'reception'])) {
      return good('Service follow-up', 'Service details may still be active this week; keep them visible until proof is saved.');
    }
    return { ...timing, rankShift: 0 };
  }

  if (phase === 'first_month') {
    if (match(['dmv', 'passport', 'credit bureau', 'credit card', 'subscription', 'digital', 'social media', 'mail forwarding', 'vehicle', 'property', 'tax', 'beneficiary', 'home and auto insurance'])) {
      return strong('Recommended aftercare', 'This belongs in aftercare: protect accounts, property, digital access, identity, mail, vehicles, taxes, and beneficiary records.');
    }
    if (match(['bank', 'insurance', 'probate', 'attorney', 'social security', 'benefits'])) {
      return good('Aftercare follow-up', 'This may still be waiting on certificates or institution responses; keep it moving with proof.');
    }
    return { ...timing, rankShift: 0 };
  }

  if (phase === 'long_tail') {
    if (match(['tax', 'estate tax', 'closing the estate', 'subscription', 'digital', 'social media', 'thank you', 'memorial fund', 'property', 'beneficiary', 'credit bureau', 'insurance'])) {
      return strong('Recommended long-tail follow-up', 'This is long-tail estate work: close loops, record proof, and prevent quiet account, tax, property, or digital issues from drifting.');
    }
    return { ...timing, rankShift: 0 };
  }

  return { ...timing, rankShift: 0 };
}

function eventDateFor(task, context = {}) {
  const title = clean(taskDisplayTitle(task || {}));
  const events = Array.isArray(context.serviceEvents) ? context.serviceEvents : [];
  if (!events.length) return null;
  const typeNeedles = [];
  if (includesAny(title, ['release', 'pickup', 'removal', 'transfer'])) typeNeedles.push('release', 'pickup', 'removal', 'transfer');
  if (includesAny(title, ['arrangement', 'funeral home meeting', 'meeting summary', 'director meeting'])) typeNeedles.push('arrangement');
  if (includesAny(title, ['obituary', 'publication', 'submit obituary'])) typeNeedles.push('obituary_deadline', 'obituary');
  if (includesAny(title, ['wake', 'visitation', 'shiva'])) typeNeedles.push('visitation', 'wake', 'shiva');
  if (includesAny(title, ['funeral', 'service', 'readings', 'music', 'pallbearer', 'clergy', 'officiant', 'faith'])) typeNeedles.push('funeral', 'service');
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
  if (nearest <= 3) return { rankShift: -10, label: 'Due in ' + nearest + ' days', reason: 'This is close to a known release, arrangement, service, burial, obituary, or task deadline.' };
  if (nearest <= 7) return { rankShift: -4, label: 'This week', reason: 'This is connected to a known date in the case timeline.' };
  return null;
}

function taskAgeHours(task, field = 'last_action_at') {
  const value = task?.[field] || task?.updated_at || task?.created_at;
  const date = parseDate(value);
  if (!date) return null;
  return (Date.now() - date.getTime()) / 3600000;
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
  const timing = taskTimingFit(task, context);
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
      timing,
    };
  }
  if (timing && timing.rankShift <= -18 && base.rank > 0) {
    return {
      ...base,
      rank: Math.min(base.rank, 1),
      label: timing.label || base.label,
      reason: timing.reason || base.reason,
      timing,
    };
  }
  return { ...base, timing };
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

export function taskOutputActions(task) {
  const title = taskDisplayTitle(task || {});
  const playbook = task?.playbook || getTaskPlaybook(task?.title || task?.task_title || title);
  const actions = OUTPUT_RULES.filter(rule => includesAny(title, rule.match));
  if (!actions.length && (playbook.executionKind === 'packet' || playbook.automationLevel === 'PACKET' || playbook.automationLevel === 'PREP_TRACK')) {
    return [{
      packetType: 'executor_summary',
      label: 'Generate task packet',
      reason: playbook.deliverable || 'This creates a reviewed output and proof destination for the task.',
    }];
  }
  return actions.slice(0, 2);
}

export function suggestedNextTasksFor(task, allTasks = []) {
  const title = taskDisplayTitle(task || {});
  const existing = (allTasks || []).map(item => clean(taskDisplayTitle(item)));
  return NEXT_RULES
    .filter(rule => includesAny(title, rule.whenDone))
    .filter(rule => !existing.some(existingTitle => existingTitle.includes(clean(rule.title))))
    .slice(0, 2);
}

export function taskStateMachine(task, allTasks = [], context = {}) {
  const status = clean(task?.status || task?.delivery_status || task?.outcome_status || 'not_started');
  const blockers = taskDependencyBlockers(task, allTasks);
  const importance = taskImportance(task, context);
  const ageHours = taskAgeHours(task);
  const owner = task?.assigned_to_name || task?.assigned_to_email || task?.owner_name || '';
  const hasProof = Boolean(task?.completed_at || task?.handled_at || task?.notes || task?.proof || task?.proof_url || task?.file_path);
  const requiresProof = Boolean(task?.proof_required || task?.playbook?.proofRequired || !['not_applicable', 'cancelled'].includes(status));
  const outputActions = taskOutputActions(task);
  const suggestedTasks = suggestedNextTasksFor(task, allTasks);
  let state = 'ready';
  let label = 'Ready to move';
  let reassurance = 'Passage has enough structure to move this task when an owner acts.';
  let escalation = null;

  if (taskIsDone(task)) {
    state = hasProof || !requiresProof ? 'completed_with_proof' : 'completed_needs_proof_review';
    label = hasProof || !requiresProof ? 'Completed with proof' : 'Completed, proof needs review';
    reassurance = hasProof || !requiresProof
      ? 'This can drop from active work. The proof remains on the case record.'
      : 'Keep this visible until proof is reviewed or added.';
  } else if (taskNeedsHelp(task)) {
    state = 'needs_help';
    label = 'Needs help';
    reassurance = 'The task should not disappear. A coordinator or responsible owner needs to clear the stuck point.';
    escalation = 'Assign a coordinator or request the missing information.';
  } else if (blockers.length) {
    state = 'blocked_by_dependency';
    label = 'Waiting on earlier step';
    reassurance = `This should wait until ${blockers.map(item => item.label).join(', ')} is handled.`;
    escalation = 'Keep visible, but do not ask the family twice until the dependency clears.';
  } else if (!owner) {
    state = 'needs_owner';
    label = 'Needs owner';
    reassurance = 'Nothing should move until one person owns the next update.';
    escalation = 'Assign an owner before sending, reminding, or closing.';
  } else if (taskIsWaiting(task)) {
    state = 'waiting';
    label = 'Waiting';
    reassurance = 'This is correctly paused until the owner, participant, provider, or vendor responds.';
    if (ageHours !== null && ageHours >= 24) escalation = 'Send a reminder or reassign if the owner is unavailable.';
    else if (ageHours !== null && ageHours >= 4 && importance.rank <= 1) escalation = 'Check in today because this is urgent or date-sensitive.';
  }

  return {
    state,
    label,
    status,
    owner: owner || null,
    waitingOn: task?.waiting_on || task?.playbook?.waitingOn || (blockers[0]?.label || ''),
    proofState: hasProof ? 'saved' : requiresProof ? 'required' : 'not_required',
    proofRequired: task?.proof_required || task?.playbook?.proofRequired || 'confirmation or saved note',
    blockers,
    escalation,
    reassurance,
    outputActions,
    suggestedTasks,
    ageHours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
  };
}

function taskMatchesWorkflowState(task, stateRule) {
  const title = taskDisplayTitle(task || {});
  const description = [task?.description, task?.category, task?.waiting_on, task?.proof_required].filter(Boolean).join(' ');
  return includesAny(`${title} ${description}`, stateRule.taskMatch || []);
}

function workflowStateTaskRows(tasks = [], stateRule) {
  return (tasks || []).filter(task => taskMatchesWorkflowState(task, stateRule));
}

function workflowStateStatus(rows = [], blockedDependencies = []) {
  if (blockedDependencies.length) return 'blocked_by_dependency';
  if (!rows.length) return 'not_started';
  if (rows.some(taskNeedsHelp)) return 'needs_help';
  if (rows.some(task => taskDependencyBlockers(task, rows).length > 0)) return 'blocked_by_dependency';
  if (rows.some(taskIsWaiting)) return 'waiting';
  if (rows.every(taskIsDone)) return 'complete';
  if (rows.some(task => !task?.assigned_to_name && !task?.assigned_to_email && !task?.owner_name && !taskIsDone(task))) return 'needs_owner';
  return 'active';
}

function workflowStateLabel(status) {
  if (status === 'complete') return 'Complete';
  if (status === 'active') return 'Active';
  if (status === 'waiting') return 'Waiting';
  if (status === 'needs_help') return 'Needs help';
  if (status === 'needs_owner') return 'Needs owner';
  if (status === 'blocked_by_dependency') return 'Waiting on earlier step';
  return 'Not started';
}

function workflowStateTone(status) {
  if (status === 'complete') return 'good';
  if (status === 'needs_help' || status === 'blocked_by_dependency') return 'warn';
  if (status === 'waiting' || status === 'needs_owner') return 'wait';
  if (status === 'active') return 'active';
  return 'soft';
}

export function orchestrateWorkflowStates(tasks = [], context = {}) {
  const states = WORKFLOW_STATE_RULES.map(rule => {
    const rows = workflowStateTaskRows(tasks, rule);
    const dependencyStates = rule.dependencies.map(key => ({ key, state: null }));
    return {
      key: rule.key,
      label: rule.label,
      purpose: rule.purpose,
      dependencies: dependencyStates,
      defaultGeneratedTasks: rule.defaultGeneratedTasks,
      waitingConditions: rule.waitingConditions,
      completionConditions: rule.completionMatch,
      tasks: rows,
    };
  });

  const stateByKey = new Map(states.map(state => [state.key, state]));
  states.forEach(state => {
    state.dependencies = state.dependencies.map(dep => {
      const dependency = stateByKey.get(dep.key);
      return {
        key: dep.key,
        label: dependency?.label || dep.key,
        status: dependency?.status || null,
        complete: dependency?.status === 'complete',
      };
    });
    const blockedDependencies = state.dependencies.filter(dep => dep.status && !dep.complete);
    state.status = workflowStateStatus(state.tasks, blockedDependencies);
    state.statusLabel = workflowStateLabel(state.status);
    state.tone = workflowStateTone(state.status);
    state.taskCount = state.tasks.length;
    state.openCount = state.tasks.filter(task => !taskIsDone(task)).length;
    state.doneCount = state.tasks.filter(taskIsDone).length;
    state.waitingCount = state.tasks.filter(taskIsWaiting).length;
    state.needsHelpCount = state.tasks.filter(taskNeedsHelp).length;
    state.blockedBy = blockedDependencies;
    state.nextTask = state.tasks.find(task => !taskIsDone(task) && !taskNeedsHelp(task)) || state.tasks.find(task => !taskIsDone(task)) || null;
    state.reassurance = state.status === 'blocked_by_dependency'
      ? `This state should wait until ${blockedDependencies.map(dep => dep.label).join(', ')} is ready.`
      : state.status === 'waiting'
        ? 'This stage is paused in the right place; the waiting owner or outside party needs the next move.'
        : state.status === 'needs_owner'
          ? 'This stage needs one named owner before Passage should send, remind, or close work.'
          : state.status === 'complete'
            ? 'This stage has proof or completed tasks attached to the case record.'
            : state.status === 'not_started'
              ? 'Passage can generate the first tasks for this stage when the prior stage is ready.'
              : 'This stage is active and has a visible next move.';
    return state;
  });

  const activeState = states.find(state => ['needs_help', 'blocked_by_dependency', 'needs_owner', 'waiting', 'active'].includes(state.status))
    || states.find(state => state.status === 'not_started')
    || states[states.length - 1]
    || null;

  return {
    states,
    activeState,
    counts: {
      total: states.length,
      complete: states.filter(state => state.status === 'complete').length,
      active: states.filter(state => state.status === 'active').length,
      waiting: states.filter(state => state.status === 'waiting').length,
      needsHelp: states.filter(state => state.status === 'needs_help' || state.status === 'blocked_by_dependency').length,
      notStarted: states.filter(state => state.status === 'not_started').length,
    },
  };
}

function taskScore(task, allTasks, role, context = {}) {
  let score = 50;
  const title = clean(taskDisplayTitle(task));
  const status = clean(task?.status || task?.delivery_status || task?.outcome_status);
  const playbook = task.playbook || getTaskPlaybook(task.title || task.task_title || title);
  const blockers = taskDependencyBlockers(task, allTasks);
  const importance = taskImportance(task, context);
  const pressure = datePressure(task, context);
  const timing = taskTimingFit(task, context);

  if (taskIsDone(task)) score += 1000;
  if (blockers.length) score += 120;
  score += importance.rank * 18;
  if (pressure) score += pressure.rankShift;
  if (timing) score += timing.rankShift || 0;
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
    const stateMachine = taskStateMachine({ ...task, playbook }, tasks, context);
    const timing = taskTimingFit({ ...task, playbook }, context);
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
        timing,
        stateMachine,
        outputActions: stateMachine.outputActions,
        suggestedTasks: stateMachine.suggestedTasks,
      },
    };
  }).sort((a, b) => taskScore(a, tasks, role, context) - taskScore(b, tasks, role, context));
  const nextTask = selectClearNextAction(enriched, role, context);
  const nextBlockers = nextTask ? taskDependencyBlockers(nextTask, enriched) : [];
  const nextTiming = nextTask ? taskTimingFit(nextTask, context) : null;
  const caseTiming = caseTimingContext(context);
  const progress = categoryProgress(enriched);
  const workflowStates = orchestrateWorkflowStates(enriched, context);
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
      timing: nextTiming,
      caseTiming,
      stateMachine: nextTask.orchestration?.stateMachine || null,
      suggestedOutputs: nextTask.orchestration?.outputActions || [],
      suggestedTasks: nextTask.orchestration?.suggestedTasks || [],
      reason: nextBlockers.length
        ? `Waiting on ${nextBlockers.map(item => item.label).join(', ')} first.`
        : nextTiming?.rankShift <= -12
          ? nextTiming.reason
          : nextTask.orchestration?.stateMachine?.escalation
            ? nextTask.orchestration.stateMachine.escalation
        : nextTask.playbook?.nextActionLabel || 'Move this next.',
    } : null,
    progress,
    caseTiming,
    workflowStates,
    counts: {
      total: enriched.length,
      done: enriched.filter(taskIsDone).length,
      waiting: enriched.filter(taskIsWaiting).length,
      needsHelp: enriched.filter(taskNeedsHelp).length,
      dependencyBlocked: enriched.filter(task => task.orchestration?.blockedByDependency).length,
    },
  };
}
