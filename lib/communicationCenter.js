const HANDLED_STATUSES = new Set(['handled', 'completed', 'done', 'not_applicable', 'cancelled']);
const WAITING_STATUSES = new Set(['waiting', 'pending', 'sent', 'delivered', 'assigned', 'acknowledged']);
const BLOCKED_STATUSES = new Set(['blocked', 'failed', 'needs_review']);

function statusKey(value) {
  if (value && typeof value === 'object') return String(value.status || value.delivery_status || value.outcome_status || '').toLowerCase();
  return String(value || '').toLowerCase();
}

export function isHandledStatus(value) {
  if (value && typeof value === 'object') {
    const outcome = String(value.outcome_status || '').toLowerCase();
    return HANDLED_STATUSES.has(statusKey(value))
      || HANDLED_STATUSES.has(outcome)
      || Boolean(value.completed_at || value.handled_at);
  }
  return HANDLED_STATUSES.has(statusKey(value));
}

export function statusLabel(value) {
  const key = String(value || '').toLowerCase();
  if (key === 'acknowledged') return 'Accepted';
  if (key === 'handled' || key === 'completed' || key === 'done') return 'Handled';
  if (key === 'blocked') return 'Needs help';
  if (key === 'failed' || key === 'needs_review') return 'Needs review';
  if (key === 'waiting' || key === 'pending') return 'Waiting';
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
  return isHandledStatus(item) ? 'Handled' : statusLabel(item?.status || item?.delivery_status || item?.outcome_status);
}

export function taskNextAction(item, role = 'family') {
  if (isHandledStatus(item)) return 'Proof is saved. No further action is needed unless something changes.';
  const title = taskDisplayTitle(item).toLowerCase();
  const waitingOn = item?.playbook?.waitingOn || item?.waiting_on || '';
  if (title.includes('trusted contacts')) return 'Confirm who should be notified and keep their invite links working.';
  if (title.includes('funeral home meeting')) return 'Save the facts you have, then export or send the meeting summary.';
  if (title.includes('release')) return 'Record who confirmed release and what the funeral home needs next.';
  if (title.includes('pronouncement')) return 'Record who officially pronounced death and any reference or case number.';
  if (title.includes('certificate')) return 'Record how many were ordered, who ordered them, and when they are expected.';
  if (title.includes('arrangements')) return 'Record the meeting outcome, next appointment, and anything the family must approve.';
  if (role === 'funeral_home' && waitingOn) return `Move this forward or record what is waiting on ${waitingOn}.`;
  if (role === 'participant') return 'Accept the request, mark it done, or tell the coordinator what is needed.';
  return 'Record proof, mark it waiting, or ask for help.';
}

export function taskExpectedUpdate(item, role = 'family') {
  const status = String(item?.status || item?.delivery_status || item?.outcome_status || '').toLowerCase();
  const title = taskDisplayTitle(item);
  const waitingOn = item?.playbook?.waitingOn || item?.waiting_on || item?.recipient || item?.assigned_to_name || item?.assigned_to_email || '';
  const owner = item?.assigned_to_name || item?.assigned_to_email || item?.owner_name || '';

  if (isHandledStatus(item)) return `Handled - proof is saved on "${title}".`;
  if (status === 'blocked' || status === 'failed' || status === 'needs_review') {
    return role === 'funeral_home'
      ? `Needs help now - assign an owner or tell the family exactly what is missing.`
      : `Needs help - Passage is waiting for a clear next update on "${title}".`;
  }
  if (status === 'sent' || status === 'delivered') {
    return waitingOn
      ? `Awaiting ${waitingOn} - next update expected after they respond.`
      : `Request sent - next update expected after the recipient responds.`;
  }
  if (status === 'waiting' || status === 'pending' || status === 'assigned' || status === 'acknowledged') {
    if (role === 'funeral_home') {
      return waitingOn
        ? `Waiting on ${waitingOn} - check back by the next business morning or record the waiting point.`
        : `Waiting - name who owns the next response before this drifts.`;
    }
    return owner
      ? `${owner} is handling this - next update appears here when the status changes.`
      : `Waiting for the right person - Passage will show the next update here.`;
  }
  if (role === 'funeral_home') return `Open - assign an owner, request the missing information, or record proof.`;
  return `Open - Passage will show who owns it and what changed next.`;
}

function timestampOf(row) {
  return row?.last_action_at || row?.sent_at || row?.delivered_at || row?.responded_at || row?.requested_at || row?.created_at || row?.updated_at || '';
}

function rowIsActionable(row) {
  if (isHandledStatus(row)) return false;
  const status = String(row?.status || '').toLowerCase();
  const text = `${row?.title || ''} ${row?.detail || ''} ${row?.statusLabel || ''}`.toLowerCase();
  return ['blocked', 'failed', 'needs_review', 'waiting', 'pending', 'requested', 'sent', 'acknowledged', 'assigned'].includes(status)
    || /waiting|needs help|failed|request|asked|declined|quote|accepted|in progress|assigned/.test(text);
}

function attentionFor(row) {
  const status = String(row?.status || '').toLowerCase();
  const text = `${row?.title || ''} ${row?.detail || ''} ${row?.statusLabel || ''}`.toLowerCase();
  if (['blocked', 'failed', 'needs_review'].includes(status) || /failed|needs help|declined/.test(text)) {
    return { attentionLevel: 'urgent', attentionLabel: status === 'failed' ? 'Delivery failed' : 'Needs help', attentionPriority: 0 };
  }
  if (row?.kind === 'vendor' || /quote|vendor|local help/.test(text)) {
    return { attentionLevel: 'waiting', attentionLabel: 'Vendor response', attentionPriority: 1 };
  }
  if (['waiting', 'pending', 'sent', 'delivered', 'requested'].includes(status) || /waiting|request|asked/.test(text)) {
    return { attentionLevel: 'waiting', attentionLabel: 'Waiting on response', attentionPriority: 2 };
  }
  if (status === 'assigned' || /assigned/.test(text)) {
    return { attentionLevel: 'assigned', attentionLabel: 'Assigned work', attentionPriority: 3 };
  }
  if (row?.layer === 'audit') return { attentionLevel: 'proof', attentionLabel: 'Proof saved', attentionPriority: 4 };
  return { attentionLevel: 'update', attentionLabel: 'Update', attentionPriority: 5 };
}

function layerForStatus(status) {
  const clean = String(status || '').toLowerCase();
  if (['handled', 'completed', 'done'].includes(clean)) return 'audit';
  if (['sent', 'delivered', 'failed'].includes(clean)) return 'notification';
  return 'conversation';
}

function layerLabel(layer) {
  if (layer === 'audit') return 'Proof';
  if (layer === 'notification') return 'Notification';
  return 'Conversation';
}

function sortRows(rows) {
  return rows
    .filter(row => row.at || row.title || row.detail)
    .sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function buildCoordinationSpine({ tasks = [], statusEvents = [], communications = [], vendorRequests = [], estateEvents = [], limit = 12, role = 'family' } = {}) {
  const taskMap = new Map((tasks || []).map(task => [task.id, task]));
  const conversation = [];
  const proof = [];
  const notifications = [];

  (statusEvents || []).forEach(event => {
    const task = taskMap.get(event.task_id) || {};
    const rowLayer = layerForStatus(event.status);
    const row = {
      id: `status:${event.id || event.task_id || event.last_action_at}`,
      kind: 'task',
      layer: rowLayer,
      layerLabel: layerLabel(rowLayer),
      taskId: event.task_id || null,
      title: taskDisplayTitle(task.title ? task : event),
      status: event.status || 'recorded',
      statusLabel: statusLabel(event.status),
      actor: event.last_actor || 'Passage',
      recipient: event.recipient || task.assigned_to_name || task.assigned_to_email || '',
      detail: event.detail || taskNextAction(task, role),
      expectedUpdate: taskExpectedUpdate({ ...task, status: event.status }, role),
      at: timestampOf(event),
    };
    if (rowLayer === 'audit') proof.push(row);
    else if (rowLayer === 'notification') notifications.push(row);
    else conversation.push(row);
  });

  (communications || []).forEach(message => {
    notifications.push({
      id: `message:${message.id || message.provider_id || message.created_at}`,
      kind: 'message',
      layer: 'notification',
      layerLabel: 'Notification',
      title: message.subject || `${statusLabel(message.status)} message`,
      status: message.status || 'sent',
      statusLabel: statusLabel(message.status),
      actor: message.sender_name || message.last_actor || 'Passage',
      recipient: message.recipient_name || message.recipient_email || message.recipient_phone || '',
      detail: message.error_message || message.body_preview || message.subject || 'Message delivery tracked in Passage.',
      expectedUpdate: message.status === 'failed'
        ? 'Delivery failed - choose another channel or copy the prepared message.'
        : 'Delivery is tracked here; the work item remains the source of truth.',
      at: timestampOf(message),
    });
  });

  (vendorRequests || []).forEach(request => {
    const vendorName = request.vendor_name || request.business_name || request.vendors?.business_name || '';
    const vendorCategory = request.category || request.vendors?.category || '';
    conversation.push({
      id: `vendor:${request.id || request.requested_at}`,
      kind: 'vendor',
      layer: 'conversation',
      layerLabel: 'Conversation',
      taskId: request.task_id || null,
      title: vendorName || 'Local help request',
      status: request.status || 'requested',
      statusLabel: statusLabel(request.status || 'requested'),
      actor: request.referral_source === 'funeral_home' ? 'Funeral home' : 'Passage',
      recipient: vendorName,
      detail: vendorCategory ? `${vendorCategory.replace(/_/g, ' ')} request` : 'Vendor request tracked in Passage.',
      expectedUpdate: request.status === 'completed'
        ? 'Vendor work is completed; proof stays on the scoped request.'
        : 'Awaiting vendor response or next status update.',
      at: timestampOf(request),
    });
  });

  (estateEvents || []).forEach(event => {
    proof.push({
      id: `estate:${event.id || event.created_at}`,
      kind: 'estate',
      layer: 'audit',
      layerLabel: 'Proof',
      title: event.title || 'Update recorded',
      status: event.event_type || 'recorded',
      statusLabel: statusLabel(event.event_type || 'recorded'),
      actor: event.actor || 'Passage',
      recipient: '',
      detail: event.description || 'Saved in the estate record.',
      expectedUpdate: 'Saved to the case record.',
      at: timestampOf(event),
    });
  });

  const buckets = {
    conversation: sortRows(conversation).slice(0, limit),
    proof: sortRows(proof).slice(0, limit),
    notifications: sortRows(notifications).slice(0, limit),
  };
  const unified = sortRows([...buckets.conversation, ...buckets.proof, ...buckets.notifications]).slice(0, limit);
  const attentionItems = unified
    .filter(rowIsActionable)
    .map(row => ({ ...row, ...attentionFor(row) }))
    .sort((a, b) => a.attentionPriority - b.attentionPriority || String(b.at || '').localeCompare(String(a.at || '')))
    .slice(0, limit);
  return {
    ...buckets,
    attentionItems,
    latest: unified,
  };
}

export function selectNextTask(tasks = [], role = 'family') {
  const open = (tasks || []).filter(task => !isHandledStatus(task));
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