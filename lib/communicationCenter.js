const HANDLED_STATUSES = new Set(['handled', 'completed', 'done', 'not_applicable', 'cancelled']);
const WAITING_STATUSES = new Set(['waiting', 'sent', 'delivered', 'assigned', 'acknowledged']);
const BLOCKED_STATUSES = new Set(['blocked', 'failed', 'needs_review']);

export function isHandledStatus(value) {
  return HANDLED_STATUSES.has(String(value || '').toLowerCase());
}

export function statusLabel(value) {
  const key = String(value || '').toLowerCase();
  if (key === 'acknowledged') return 'Accepted';
  if (key === 'handled' || key === 'completed' || key === 'done') return 'Handled';
  if (key === 'blocked') return 'Needs help';
  if (key === 'failed' || key === 'needs_review') return 'Needs review';
  if (key === 'waiting') return 'Waiting';
  if (key === 'sent') return 'Sent';
  if (key === 'delivered') return 'Delivered';
  return key ? key.replace(/_/g, ' ') : 'Open';
}

export function taskDisplayTitle(item) {
  const candidates = [
    item?.title,
    item?.task_title,
    item?.subject,
    item?.name,
    item?.description,
  ].map(value => String(value || '').trim()).filter(Boolean);
  let raw = candidates[0] || '';
  const key = raw.toLowerCase();

  if (!raw || ['sms', 'text', 'email', 'call'].includes(key)) {
    const recipient = item?.recipient_name || item?.recipient || item?.assigned_to_name || item?.assigned_to_email || item?.recipient_email || item?.recipient_phone;
    const channel = String(item?.channel || item?.action_type || key || '').toLowerCase();
    if (channel.includes('sms') || channel.includes('text')) return recipient ? `Text ${recipient}` : 'Send the text';
    if (channel.includes('email')) return recipient ? `Email ${recipient}` : 'Send the email';
    if (channel.includes('call')) return recipient ? `Call ${recipient}` : 'Make the call';
    raw = candidates.find(value => !['sms', 'text', 'email', 'call'].includes(value.toLowerCase())) || '';
  }

  const normalized = String(raw || '').toLowerCase();
  if (!normalized) return 'Next step';
  if (normalized.includes('record planning preferences')) return 'Add burial, service, and family wishes';
  if (normalized.includes('collect prepayment') || normalized.includes('pre-need policy')) return 'Add prepayment or policy details';
  if (normalized.includes('confirm activation contacts')) return 'Confirm trusted contacts';
  if (normalized.includes('healthcare proxy') || normalized.includes('legal decision-maker')) return 'Confirm healthcare proxy or decision-maker';
  if (normalized.includes('prepare for funeral home') || normalized.includes('funeral home meeting')) return 'Prepare the funeral home meeting summary';
  if (normalized.includes('hospital') && normalized.includes('release')) return 'Confirm hospital or facility release';
  if (normalized.includes('pronouncement')) return 'Confirm the official pronouncement';
  if (normalized.includes('death certificate')) return 'Order death certificates';
  if (normalized.includes('funeral director') || normalized.includes('finalize arrangements')) return 'Finalize funeral arrangements';
  return raw;
}

export function taskDisplayStatus(item) {
  return statusLabel(item?.status || item?.delivery_status || item?.outcome_status);
}

export function taskNextAction(item, role = 'family') {
  const title = taskDisplayTitle(item).toLowerCase();
  const waitingOn = item?.playbook?.waitingOn || item?.waiting_on || '';
  if (title.includes('trusted contacts')) return 'Confirm who should be notified and keep their invite links working.';
  if (title.includes('funeral home meeting')) return 'Save the facts you have, then export or send the meeting summary.';
  if (title.includes('release')) return 'Record who confirmed release and what the funeral home needs next.';
  if (title.includes('pronouncement')) return 'Record who officially pronounced death and any reference or case number.';
  if (title.includes('certificate')) return 'Record how many were ordered, who ordered them, and when they are expected.';
  if (title.includes('arrangements')) return 'Record the meeting outcome, next appointment, and anything the family must approve.';
  if (role === 'funeral_home' && waitingOn) return `Move this forward or record what is waiting on ${waitingOn}.`;
  if (role === 'participant') return 'Accept it, mark it done, or tell the coordinator what is blocking you.';
  return 'Record proof, mark it waiting, or ask for help.';
}

function timestampOf(row) {
  return row?.last_action_at || row?.sent_at || row?.delivered_at || row?.responded_at || row?.requested_at || row?.created_at || row?.updated_at || '';
}

export function selectNextTask(tasks = [], role = 'family') {
  const open = (tasks || []).filter(task => !isHandledStatus(task.status || task.delivery_status));
  const score = task => {
    const status = String(task.status || task.delivery_status || '').toLowerCase();
    let base = 40;
    if (BLOCKED_STATUSES.has(status)) base = 0;
    else if (WAITING_STATUSES.has(status)) base = 10;
    else if (status === 'draft' || status === 'not_started' || !status) base = 20;
    if (role === 'funeral_home' && task?.playbook?.funeralHomeEligible) base -= 5;
    if (task?.playbook?.tier === 1 || task?.tier === 1) base -= 4;
    const due = Number(task?.due_days_after_trigger ?? task?.due_day ?? task?.position ?? 0);
    return base + (Number.isFinite(due) ? due : 0);
  };
  return open.slice().sort((a, b) => score(a) - score(b))[0] || null;
}

export function buildCommunicationCenter({ tasks = [], statusEvents = [], communications = [], vendorRequests = [], estateEvents = [], limit = 12 } = {}) {
  const taskMap = new Map((tasks || []).map(task => [task.id, task]));
  const rows = [];

  (statusEvents || []).forEach(event => {
    const task = taskMap.get(event.task_id) || {};
    rows.push({
      id: `status:${event.id || event.task_id || event.last_action_at}`,
      kind: 'task',
      taskId: event.task_id || null,
      title: taskDisplayTitle(task.title ? task : event),
      status: event.status || 'recorded',
      statusLabel: statusLabel(event.status),
      actor: event.last_actor || 'Passage',
      recipient: event.recipient || task.assigned_to_name || task.assigned_to_email || '',
      detail: event.detail || taskNextAction(task),
      at: timestampOf(event),
    });
  });

  (communications || []).forEach(message => {
    rows.push({
      id: `message:${message.id || message.provider_id || message.created_at}`,
      kind: 'message',
      title: message.subject || `${statusLabel(message.status)} message`,
      status: message.status || 'sent',
      statusLabel: statusLabel(message.status),
      actor: message.sender_name || message.last_actor || 'Passage',
      recipient: message.recipient_name || message.recipient_email || message.recipient_phone || '',
      detail: message.error_message || message.body_preview || message.subject || 'Message recorded in Passage.',
      at: timestampOf(message),
    });
  });

  (vendorRequests || []).forEach(request => {
    const vendorName = request.vendor_name || request.business_name || request.vendors?.business_name || '';
    const vendorCategory = request.category || request.vendors?.category || '';
    rows.push({
      id: `vendor:${request.id || request.requested_at}`,
      kind: 'vendor',
      title: vendorName || 'Local help request',
      status: request.status || 'requested',
      statusLabel: statusLabel(request.status || 'requested'),
      actor: request.referral_source === 'funeral_home' ? 'Funeral home' : 'Passage',
      recipient: vendorName,
      detail: vendorCategory ? `${vendorCategory.replace(/_/g, ' ')} request` : 'Vendor request tracked in Passage.',
      at: timestampOf(request),
    });
  });

  (estateEvents || []).forEach(event => {
    rows.push({
      id: `estate:${event.id || event.created_at}`,
      kind: 'estate',
      title: event.title || 'Update recorded',
      status: event.event_type || 'recorded',
      statusLabel: statusLabel(event.event_type || 'recorded'),
      actor: event.actor || 'Passage',
      recipient: '',
      detail: event.description || 'Saved in the estate record.',
      at: timestampOf(event),
    });
  });

  return rows
    .filter(row => row.at || row.title || row.detail)
    .sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))
    .slice(0, limit);
}
