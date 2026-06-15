const DONE = new Set(['handled', 'completed', 'done', 'not_applicable', 'cancelled']);
const WAITING = new Set(['waiting', 'pending', 'sent', 'delivered', 'assigned', 'acknowledged']);
const NEEDS_HELP = new Set(['blocked', 'failed', 'needs_review']);

function text(value) {
  return String(value || '').trim();
}

function statusOf(task) {
  return text(task?.status || task?.delivery_status || task?.outcome_status).toLowerCase();
}

export function funeralTaskIsOpen(task) {
  return !DONE.has(statusOf(task)) && !task?.completed_at && !task?.handled_at;
}

export function funeralTaskIsWaiting(task) {
  return funeralTaskIsOpen(task) && WAITING.has(statusOf(task));
}

export function funeralTaskNeedsHelp(task) {
  return funeralTaskIsOpen(task) && NEEDS_HELP.has(statusOf(task));
}

export function funeralTaskHasProof(task) {
  return Boolean(text(task?.notes || task?.waiting_on || task?.proof_required || task?.last_actor || task?.provider_message_id));
}

function parseDate(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function dayStart(time) {
  const value = new Date(time);
  value.setHours(0, 0, 0, 0);
  return value.getTime();
}

export function daysSinceCaseDeath(caseItem, now = Date.now()) {
  const deathTime = parseDate(caseItem?.date_of_death || caseItem?.death_date || caseItem?.dod);
  if (!deathTime) return null;
  return Math.round((dayStart(now) - dayStart(deathTime)) / 86400000);
}

export function daysUntilNextService(caseItem, now = Date.now()) {
  const events = caseItem?.serviceEvents || caseItem?.service_events || [];
  const direct = ['arrangement_date', 'visitation_date', 'funeral_date', 'burial_date', 'shiva_date', 'reception_date']
    .map(field => caseItem?.[field])
    .filter(Boolean);
  const eventDates = events
    .map(event => event?.date || event?.start || event?.start_date || event?.scheduled_at || event?.time)
    .filter(Boolean);
  const candidates = [...direct, ...eventDates]
    .map(parseDate)
    .filter(Boolean)
    .map(time => Math.round((dayStart(time) - dayStart(now)) / 86400000))
    .sort((a, b) => Math.abs(a) - Math.abs(b));
  return candidates.length ? candidates[0] : null;
}

export function funeralLifecycleKey(caseItem) {
  const body = [
    caseItem?.setup_stage,
    caseItem?.mode,
    caseItem?.status,
    caseItem?.activation_status,
    caseItem?.case_type,
    caseItem?.type,
  ].map(value => text(value).toLowerCase()).join(' ');
  if (/after|aftercare|closed|completed/.test(body)) return 'aftercare';
  if (/hospice|warm|decline|care/.test(body)) return 'warm_care';
  if (/preneed|pre-need|planning|green/.test(body)) return 'pre_need';
  if (caseItem?.date_of_death || /triggered|activated|at_need|at-need|red/.test(body)) return 'at_need';
  if ((caseItem?.serviceEvents || caseItem?.service_events || []).length || /funeral|service|arrangement/.test(body)) return 'service';
  return 'service';
}

function taskTitle(task) {
  return text(task?.title || task?.label || task?.name || task?.description) || 'This task';
}

function proofDestination(task) {
  return text(task?.proof_required || task?.proof_destination || task?.expected_proof) || 'Case note, owner, timestamp, or family-visible update';
}

function defaultOwner(task, role) {
  return text(task?.assigned_to_name || task?.assigned_to_email || task?.owner_name || task?.recipient) || (role === 'director' ? 'Director' : 'Assigned staff');
}

function contactName(caseItem) {
  return text(caseItem?.primary_contact_name || caseItem?.coordinator_name) || 'the family contact';
}

function caseName(caseItem) {
  return text(caseItem?.deceased_name || caseItem?.estate_name || caseItem?.name) || 'this family case';
}

function baseRecommendation(caseItem, task, role, now) {
  const days = daysSinceCaseDeath(caseItem, now);
  const lifecycle = funeralLifecycleKey(caseItem);
  return {
    stage: lifecycle,
    daysSinceDeath: days,
    daysUntilService: daysUntilNextService(caseItem, now),
    context: days === null ? (lifecycle === 'pre_need' ? 'Pre-need' : lifecycle === 'warm_care' ? 'Warm care' : 'No DOD') : days < 0 ? 'Pre-death' : `Day ${days}`,
    owner: defaultOwner(task, role),
    proof: task ? proofDestination(task) : 'Case note, owner, timestamp, or family-visible update',
  };
}

export function recommendedFuneralHomeNextAction({ caseItem, task = null, role = 'director', hasCases = true, now = Date.now() } = {}) {
  if (!hasCases) {
    return {
      label: 'Create the first operating case',
      action: 'Create one at-need, pre-need, or warm-care case so owners, asks, proof, and family status can start from one spine.',
      reason: 'The product cannot recommend real work until a real case exists.',
      context: 'Setup',
      owner: 'Director',
      proof: 'Case record created',
      priority: 'high',
      stage: 'setup',
      draft: 'Internal note: create the first case, add the primary contact, and set the lifecycle.',
    };
  }
  if (!caseItem) {
    return {
      label: 'Review the work queue',
      action: 'Open the queue and choose the oldest open family or staff item that still lacks an owner, waiting point, or proof.',
      reason: 'No single case is currently selected for recommendation.',
      context: 'Queue',
      owner: role === 'director' ? 'Director' : 'Assigned staff',
      proof: 'Next owner selected',
      priority: 'medium',
      stage: 'queue',
      draft: 'Internal note: choose the next case and record what is done, waiting, or blocked before leaving it.',
    };
  }

  const tasks = caseItem.tasks || [];
  const blocked = tasks.find(funeralTaskNeedsHelp);
  const waiting = tasks.find(item => funeralTaskIsWaiting(item) && text(item.waiting_on || item.assigned_to_email || item.assigned_to_name));
  const proofGap = tasks.find(item => !funeralTaskIsOpen(item) && !funeralTaskHasProof(item));
  const name = caseName(caseItem);
  const contact = contactName(caseItem);
  const base = baseRecommendation(caseItem, task, role, now);

  if (blocked) {
    return {
      ...base,
      label: 'Resolve blocker before adding work',
      action: `${taskTitle(blocked)} is blocked. Clear the blocker, reassign it, or record exactly who must decide before the family gets another promise.`,
      reason: 'Blocked work creates repeated calls and staff confusion faster than any new task can help.',
      owner: defaultOwner(blocked, role),
      proof: proofDestination(blocked),
      priority: 'urgent',
      draft: text(blocked.request_draft) || `Internal note: ${taskTitle(blocked)} is blocked for ${name}. Name the decision owner and the smallest next step.`,
    };
  }

  if (waiting) {
    return {
      ...base,
      label: 'Close the waiting loop',
      action: `${taskTitle(waiting)} is waiting. Send or record the smallest specific ask, name who owes it, and set the family-visible status.`,
      reason: text(waiting.waiting_on) || 'Waiting work should say who or what it is waiting on.',
      owner: defaultOwner(waiting, role),
      proof: proofDestination(waiting),
      priority: 'high',
      draft: text(waiting.request_draft) || `Hi ${contact}, we need one specific detail for ${name} so the funeral home can keep the next step moving.`,
    };
  }

  if (proofGap) {
    return {
      ...base,
      label: 'Add proof before moving on',
      action: `${taskTitle(proofGap)} looks handled but lacks proof detail. Add the actor, note, timestamp, or reference so the case can be trusted later.`,
      reason: 'Enterprise funeral-home workflows need auditability, not just completed checkboxes.',
      owner: defaultOwner(proofGap, role),
      proof: proofDestination(proofGap),
      priority: 'high',
      draft: 'Internal note: add proof before exporting or telling the family the case is current.',
    };
  }

  const days = base.daysSinceDeath;
  if (days !== null && days < 0) {
    return {
      ...base,
      label: 'Pre-death preparation',
      action: `Confirm wishes, funding, contacts, facility or hospice details, and the trigger plan for ${name}.`,
      reason: 'The family is not in the death-event workflow yet, so reduce future chaos before crisis starts.',
      priority: 'medium',
      draft: `Hi ${contact}, we are keeping the Passage record ready so the funeral home has contacts, wishes, and next steps in one place if anything changes.`,
    };
  }

  if (base.stage === 'pre_need' || base.stage === 'warm_care' || days === null) {
    return {
      ...base,
      label: base.stage === 'pre_need' ? 'Pre-need readiness check' : 'Warm-care readiness check',
      action: `Verify funding, wishes, key contacts, location, and trigger instructions for ${name}.`,
      reason: 'No current date of death is driving the case, so the best action is keeping the record transition-ready.',
      priority: 'medium',
      draft: `Hi ${contact}, we are confirming the planning details on file so the funeral home can act quickly and avoid repeating questions later.`,
    };
  }

  if (days <= 0) {
    return {
      ...base,
      label: 'First 24 hours coordination',
      action: `Confirm pronouncement or transfer status, primary contact, arrangement meeting, and the first family-visible update for ${name}.`,
      reason: 'Day zero is where dropped calls, unclear ownership, and duplicate questions hurt the most.',
      priority: 'urgent',
      draft: `Hi ${contact}, we are coordinating the first steps and will keep this page updated as each item is confirmed.`,
    };
  }

  if (days <= 3) {
    return {
      ...base,
      label: 'Arrangement window',
      action: `Lock arrangement decisions, obituary deadline, service preferences, participant asks, and vendor holds for ${name}.`,
      reason: 'Days one through three are decision-heavy and benefit from prepared asks instead of open-ended calls.',
      priority: 'high',
      draft: `Hi ${contact}, here are the few details we still need so the funeral home can keep arrangements moving without repeated calls.`,
    };
  }

  if (base.daysUntilService !== null && base.daysUntilService >= -1 && base.daysUntilService <= 2) {
    return {
      ...base,
      label: 'Service-window readiness',
      action: `Confirm schedule, participants, readings, music, flowers, transportation, and vendor status for ${name}.`,
      reason: base.daysUntilService >= 0 ? 'The service is close, so unresolved logistics should surface before staff are forced into phone-chasing.' : 'The service just passed, so proof and aftercare should close cleanly.',
      priority: 'high',
      draft: `Hi ${contact}, we are checking final service details and will mark each confirmed item here for everyone involved.`,
    };
  }

  if (days <= 7) {
    return {
      ...base,
      label: 'Service logistics sweep',
      action: `Move every open logistics item for ${name} into confirmed, waiting, or blocked status with a named owner.`,
      reason: 'The first week should not leave staff guessing which details are real and which are still pending.',
      priority: 'high',
      draft: `Hi ${contact}, we are doing a final logistics sweep and will note what is confirmed, waiting, or still needs a decision.`,
    };
  }

  return {
    ...base,
    label: 'Aftercare and case closeout',
    action: `Close proof gaps, export the case summary, and schedule aftercare or estate follow-up for ${name}.`,
    reason: 'After the service, Passage should preserve the record and make the next family touch easier.',
    priority: 'medium',
    draft: `Hi ${contact}, we are closing out the service record and noting any aftercare or follow-up items in one place.`,
  };
}
