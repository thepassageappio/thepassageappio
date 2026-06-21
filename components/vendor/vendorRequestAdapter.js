// Passage — Vendor scoped-request adapter (site-migration Slice 3).
// Pure, presentational-data module. No network/Supabase imports so it is safe on
// client and server. Mirrors components/family/familyTodayAdapter.js: it maps a
// vendor_requests row through the shared operating contract + single calm status
// model, then strips operator vocab so the vendor only ever sees the scoped
// request — never the family record.
import { byCalmPriority, deriveCalmStatus, present } from '../../lib/designSystem';
import { taskOperatingContractFor } from '../../lib/taskWorkspace';
import { money } from '../../lib/vendorEconomics';
import {
  canonicalVendorStatus,
  paymentStatusLabel,
  vendorNextExpected,
  vendorStatusLabel,
} from '../../lib/vendorLifecycle';

function text(value, fallback = '') {
  return String(value == null ? fallback : value).trim();
}

// Strip operator/internal vocabulary so vendor copy stays scoped + plain.
export function cleanVendorCopy(value, fallback = '') {
  return text(value, fallback)
    .replace(/operating\s+(lane|sheet|model|step)/gi, 'request step')
    .replace(/proof destination/gi, 'where this is saved')
    .replace(/prepared output/gi, 'what Passage prepared')
    .replace(/proof panel/gi, 'scoped request')
    .replace(/proof packet/gi, 'saved proof')
    .replace(/case export/gi, 'scoped request')
    .replace(/family-visible status/gi, 'request status')
    .replace(/the full family record/gi, 'this scoped request')
    .replace(/family record/gi, 'scoped request')
    .replace(/\s+/g, ' ')
    .trim();
}

// Canonicalize the vendor lifecycle into the calm single-status model.
// requested/viewed -> yours_now; quoted/accepted -> waiting;
// payment_pending/checkout_created -> waiting; paid/scheduled/in_progress -> yours_now;
// completed -> done; declined -> blocked.
export function vendorCalmStatusKey(request = {}) {
  const status = canonicalVendorStatus(request.status);
  const payment = text(request.payment_collection_status).toLowerCase();
  if (status === 'completed') return 'done';
  if (['declined', 'cancelled', 'refunded'].includes(status)) return status === 'declined' ? 'blocked' : 'done';
  if (['paid', 'scheduled', 'in_progress'].includes(status)) return 'yours_now';
  if (['payment_pending', 'checkout_created'].includes(status) || ['payment_pending', 'checkout_created'].includes(payment)) return 'waiting';
  if (['quoted', 'accepted', 'family_accepted'].includes(status) || payment === 'family_accepted') return 'waiting';
  // requested / viewed / unknown -> the vendor owns the next move.
  return 'yours_now';
}

function vendorName(request = {}) {
  return text(request?.vendors?.business_name, 'Your business');
}

// The scoped label for the connected case. Used only as a neutral reference; the
// vendor never browses the family record itself.
function caseLabel(request = {}) {
  const wf = request?.workflows || {};
  return text(wf.deceased_name || wf.estate_name || wf.name, 'Family case');
}

function urgencyLabel(request = {}) {
  return request?.urgency === 'rush' ? 'Needed within 24 hours' : 'Planning ahead';
}

function quoteValue(request = {}) {
  const value = request?.final_value || request?.estimated_value;
  const formatted = value ? money(value) : '';
  return formatted || 'Not quoted yet';
}

function timingLabel(request = {}) {
  const raw = request?.service_date;
  if (!raw) return 'Quote timing or availability';
  const date = new Date(String(raw).includes('T') ? raw : `${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Quote timing or availability';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function startLabel(request = {}) {
  if (!request?.service_start_at) return 'Not confirmed yet';
  const date = new Date(request.service_start_at);
  if (Number.isNaN(date.getTime())) return 'Not confirmed yet';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Who owns the next move, framed for the vendor.
function ownerCopy(request) {
  const status = canonicalVendorStatus(request.status);
  if (status === 'declined') return 'Passage coordinator';
  return vendorName(request);
}

function waitingCopy(request) {
  const status = canonicalVendorStatus(request.status);
  if (status === 'completed') return 'Nothing. Status is saved.';
  if (status === 'declined') return 'Another support option';
  if (['quoted', 'accepted', 'family_accepted'].includes(status)) return 'Family or funeral-home quote approval';
  if (['payment_pending', 'checkout_created'].includes(status) || ['payment_pending', 'checkout_created'].includes(text(request.payment_collection_status).toLowerCase())) {
    return 'Secure payment before work begins';
  }
  if (['paid', 'scheduled', 'in_progress'].includes(status)) return 'Completion update from you';
  return 'Your response';
}

// Recommended next action: [calm action key for the sheet, label].
function recommendedAction(request) {
  const status = canonicalVendorStatus(request.status);
  if (['requested', 'viewed', '', undefined].includes(status)) return ['accepted', 'Send quote'];
  if (status === 'paid') return ['in_progress', 'Mark scheduled'];
  if (['scheduled', 'in_progress'].includes(status)) return ['completed', 'Save completion proof'];
  return null;
}

// Other responses the vendor can still take (filtered against the recommended one).
function secondaryActions(request) {
  const status = canonicalVendorStatus(request.status);
  const set = ['requested', 'viewed', '', undefined].includes(status)
    ? [['accepted', 'Send quote'], ['declined', 'Decline']]
    : ['quoted', 'accepted', 'family_accepted'].includes(status)
      ? [['accepted', 'Revise quote'], ['declined', 'Decline']]
      : status === 'paid'
        ? [['in_progress', 'Mark scheduled']]
        : ['scheduled', 'in_progress'].includes(status)
          ? [['completed', 'Save completion proof']]
          : [];
  const rec = recommendedAction(request);
  return set.filter(([action]) => !rec || action !== rec[0]);
}

function passiveState(request) {
  const status = canonicalVendorStatus(request.status);
  if (['completed', 'declined', 'cancelled', 'refunded'].includes(status)) {
    return 'This request is closed. The case now has your status and completion note.';
  }
  if (['quoted', 'accepted'].includes(status)) {
    return 'Quote sent. Waiting for the family or funeral home to approve before work begins.';
  }
  if (['family_accepted', 'payment_pending', 'checkout_created'].includes(status)) {
    return 'Quote approved. Waiting for secure payment before scheduling or completion proof.';
  }
  return 'Waiting for the next approved request step.';
}

// Scoped detail rows — only what the vendor is allowed to see. NEVER the family
// record, private notes, or unrelated requests.
function detailRows(request) {
  const contact = request?.family_contact_name || request?.family_contact_phone
    ? `${text(request.family_contact_name, 'Family contact')}${request.family_contact_phone ? `, ${request.family_contact_phone}` : ''}`
    : 'Coordinate through Passage until approved';
  return [
    ['Owner', ownerCopy(request)],
    ['Waiting on', waitingCopy(request)],
    ['Quote / value', quoteValue(request)],
    ['Timing', timingLabel(request)],
    ['Start', startLabel(request)],
    ['Location', text(request?.service_location, 'Share your service area or ask for the exact address')],
    ['Contact boundary', contact],
    ['Payment status', paymentStatusLabel(request?.payment_collection_status || 'quote_needed')],
    ['Who can see this', 'Only this scoped request'],
  ];
}

// buildVendorRequestModel — token mode (single scoped request).
export function buildVendorRequestModel({ request } = {}) {
  if (!request) return null;
  const key = vendorCalmStatusKey(request);
  const contract = taskOperatingContractFor(
    { ...request, title: request.task_title, status: request.status },
    { role: 'vendor', surface: 'scoped request', owner: vendorName(request) },
  );
  // deriveCalmStatus consumes the canonical calm key (vendor lifecycle is the
  // source of truth, not the raw operatingStatus).
  deriveCalmStatus({ ...request, owner_name: vendorName(request) }, { operatingStatus: key });
  const view = present(key, { who: key === 'waiting' ? waitingCopy(request) : ownerCopy(request) });
  const rec = recommendedAction(request);

  return {
    id: text(request.id || request.response_token, 'vendor-request'),
    raw: request,
    statusKey: key,
    statusView: view,
    who: view.who,
    vendorName: vendorName(request),
    caseLabel: caseLabel(request),
    title: text(request.task_title, 'Local help request'),
    urgency: urgencyLabel(request),
    requestNote: text(request.request_note),
    vendorNote: text(request.vendor_note),
    nextExpected: vendorNextExpected(request.status, request.payment_collection_status),
    statusLabel: vendorStatusLabel(request.status),
    paymentLabel: paymentStatusLabel(request.payment_collection_status || 'quote_needed'),
    quoteValue: quoteValue(request),
    owner: ownerCopy(request),
    waiting: waitingCopy(request),
    recommendedAction: rec,
    secondaryActions: secondaryActions(request),
    passiveState: passiveState(request),
    why: cleanVendorCopy(
      contract?.reassurance,
      'You only see the scoped request, timing, quote state, and proof needed for your work.',
    ),
    action: rec ? rec[1] : 'View saved status',
    details: detailRows(request),
    history: [
      ['Sent', request.requested_at],
      request.viewed_at ? ['Viewed', request.viewed_at] : null,
      request.responded_at ? [canonicalVendorStatus(request.status) === 'declined' ? 'Declined' : 'Quote sent', request.responded_at] : null,
      request.in_progress_at ? ['In progress', request.in_progress_at] : null,
      request.completed_at ? ['Completed', request.completed_at] : null,
    ].filter(Boolean),
  };
}

// Row summary for the dashboard list / deep-links.
export function buildVendorRequestRow(request = {}, index = 0) {
  const key = vendorCalmStatusKey(request);
  return {
    id: text(request.id || request.response_token || index, `vendor-row-${index}`),
    responseToken: text(request.response_token),
    raw: request,
    statusKey: key,
    statusView: present(key, { who: key === 'waiting' ? waitingCopy(request) : ownerCopy(request) }),
    who: key === 'waiting' ? waitingCopy(request) : ownerCopy(request),
    title: text(request.task_title, 'Local help request'),
    caseLabel: caseLabel(request),
    urgency: urgencyLabel(request),
    statusLabel: vendorStatusLabel(request.status),
    requestedAt: request.requested_at || null,
  };
}

function rowSort(a, b) {
  const byPriority = byCalmPriority(a.statusView, b.statusView);
  if (byPriority !== 0) return byPriority;
  const at = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
  const bt = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
  return bt - at;
}

// buildVendorDashboardModel — auth dashboard mode (vendor's scoped queue).
export function buildVendorDashboardModel({ vendor, requests = [] } = {}) {
  const rows = (Array.isArray(requests) ? requests : [])
    .filter(Boolean)
    .map((request, index) => buildVendorRequestRow(request, index))
    .sort(rowSort);

  const open = rows.filter((row) => row.statusKey !== 'done' && row.statusKey !== 'blocked');
  const startHere = open.find((row) => row.statusKey === 'yours_now') || open[0] || null;
  const waiting = rows.filter((row) => row !== startHere && row.statusKey === 'waiting');
  const closed = rows.filter((row) => row.statusKey === 'done' || row.statusKey === 'blocked');
  const whenReady = open.filter((row) => row !== startHere && row.statusKey === 'yours_now');

  const revenue = vendor?.revenue || {};
  const payoutReady = Boolean(vendor?.stripe_charges_enabled && vendor?.stripe_payouts_enabled);

  return {
    vendor: vendor || null,
    businessName: text(vendor?.business_name, 'Your business'),
    membership: vendor?.membership || null,
    team: vendor?.team || [],
    payoutReady,
    category: vendor?.category || '',
    serviceArea: (vendor?.zip_codes_served || []).join(', ') || 'Not set',
    revenue: {
      paidJobs: revenue.paidJobs || 0,
      grossPaid: money(revenue.grossPaid) || '$0',
      passageFees: money(revenue.passageFees) || '$0',
      vendorNet: money(revenue.vendorNet) || '$0',
    },
    openCount: open.length,
    rows,
    startHere,
    whenReady,
    waiting,
    closed,
  };
}
