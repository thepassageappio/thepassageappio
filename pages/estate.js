// pages/estate.js
// Estate command center — single-estate view for red path users
// Route: /estate?id=:estateId
// Replaces generic dashboard for post-urgent users

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

var sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── TOKENS ────────────────────────────────────────────────────────────────────
var BG = '#f6f3ee';
var CARD = '#ffffff';
var INK = '#1a1916';
var MID = '#6a6560';
var SOFT = '#a09890';
var BORDER = '#e4ddd4';
var SUBTLE = '#f0ece5';
var SAGE = '#6b8f71';
var SAGE_FAINT = '#f0f5f1';
var SAGE_LIGHT = '#c8deca';
var ROSE = '#c47a7a';
var ROSE_FAINT = '#fdf3f3';
var AMBER = '#b07d2e';
var AMBER_FAINT = '#fdf8ee';
var AMBER_BORDER = 'rgba(176,125,46,0.3)';

var PLAYBOOKS = {
  details: {
    title: 'Record the official details',
    draft: 'Private record: date of death, time of death, location, who pronounced, who was notified, and the next official contact. Keep this factual so no one has to reconstruct it later.',
    steps: ['Write the date, time, and location exactly as given', 'Record the provider or official who confirmed it', 'Save names, numbers, and case/reference IDs']
  },
  funeral: {
    title: 'Prepare the funeral home call',
    draft: 'Hello, my name is [your name]. I am calling because [name] has passed away. We need help with transportation and first arrangements. What do you need from us first, and can you send itemized pricing before anything is approved?',
    steps: ['Confirm who has authority to speak', 'Ask what documents are needed', 'Request itemized pricing', 'Write down the next appointment time']
  },
  certificate: {
    title: 'Get the document path clear',
    draft: 'Can you confirm who will provide the official pronouncement and how certified death certificates should be ordered? Please tell us how many copies you recommend and what information you need from the family.',
    steps: ['Confirm pronouncement source', 'Ask how certificates are ordered', 'Record cost, timing, and pickup or mailing instructions']
  },
  notifications: {
    title: 'Prepare a family notification',
    draft: 'I am so sorry to share that [name] has passed away. We are using Passage to coordinate next steps and will share updates here as we have them.',
    steps: ['Choose the closest people first', 'Review the wording', 'Send only after approval']
  },
  documents: {
    title: 'Gather the right document',
    draft: 'Please locate the document for this step. If you find a digital copy, upload it to the estate command center before sharing.',
    steps: ['Find the document or note its location', 'Upload a copy if available', 'Share only after review']
  },
  property: {
    title: 'Secure the home and immediate care',
    draft: 'Can you please check the home, pets, mail, vehicle, and anything urgent? Please reply with what you found, what needs attention, and whether anything was moved.',
    steps: ['Ask a trusted local person to check the property', 'Do not remove valuables unless authorized', 'Record photos or notes if something needs follow-up']
  },
  benefits: {
    title: 'Start the benefits call',
    draft: 'I am helping coordinate next steps for [name]. Can you tell us what survivor, benefit, claim, or account documents are required and what deadline we should know about?',
    steps: ['Gather identifying information and death certificate if available', 'Ask for claim numbers and deadlines', 'Save upload, mail, or appointment instructions']
  },
  legal: {
    title: 'Clarify legal authority',
    draft: 'I am helping coordinate the estate of [name]. We need guidance on the will, probate requirements, and who is authorized to act. What is the next step?',
    steps: ['Locate will, trust, and attorney contact', 'Confirm whether probate is needed', 'Do not distribute assets until authority is clear']
  },
  default: {
    title: 'Prepare the next step',
    draft: 'Here is the task that needs attention. Review the details, decide who owns it, and mark it handled only when the family has confirmed it is taken care of.',
    steps: ['Review what is needed', 'Assign or self-own the task', 'Track the outcome here']
  }
};

function playbookFor(outcome) {
  var title = String(outcome.title || '').toLowerCase();
  var key = title.includes('date') || title.includes('time') || title.includes('location of death') ? 'details' :
    title.includes('certificate') || title.includes('pronouncement') ? 'certificate' :
    title.includes('home') || title.includes('pet') || title.includes('vehicle') || title.includes('secure') ? 'property' :
    title.includes('social security') || title.includes('benefit') || title.includes('insurance') || title.includes('bank') || title.includes('account') ? 'benefits' :
    title.includes('attorney') || title.includes('probate') || title.includes('will') ? 'legal' :
    outcome.category === 'service' ? 'funeral' :
    outcome.category === 'notifications' ? 'notifications' :
    outcome.category === 'legal' ? 'documents' : 'default';
  return PLAYBOOKS[key] || PLAYBOOKS.default;
}

var TIMELINE_BUCKETS = [
  { key: 'now', label: 'Now', range: [0, 0], help: 'What needs attention first.' },
  { key: '72h', label: 'Next 72 hours', range: [1, 3], help: 'Calls and coordination that should happen soon.' },
  { key: 'week', label: 'First week', range: [4, 7], help: 'Service, records, and family coordination.' },
  { key: 'month', label: 'First month', range: [8, 31], help: 'Accounts, benefits, and estate admin.' },
  { key: 'year', label: 'First year', range: [32, 365], help: 'Longer-tail estate and remembrance work.' },
];

function normalizeDueDay(task) {
  var raw = task.due_days_after_trigger ?? task.due_day ?? task.position ?? 0;
  var num = Number(raw);
  return Number.isFinite(num) ? Math.max(0, num) : 0;
}

function bucketForTask(task) {
  var due = normalizeDueDay(task);
  for (var i = 0; i < TIMELINE_BUCKETS.length; i++) {
    var b = TIMELINE_BUCKETS[i];
    if (due >= b.range[0] && due <= b.range[1]) return b.key;
  }
  return 'year';
}

function isHandledStatus(status) {
  return ['handled', 'completed', 'done', 'not_applicable'].includes(status);
}

function isReadinessHandled(status) {
  return ['handled', 'completed', 'done'].includes(status);
}

function ownerForTask(task) {
  return task.assigned_to_name || task.assigned_to_email || task.owner_label || task.owner_kind || 'Needs owner';
}

function statusText(status) {
  var value = String(status || '').replace(/_/g, ' ');
  if (!value || value === 'pending') return 'Waiting';
  if (value === 'sent') return 'Sent';
  if (value === 'assigned') return 'Assigned';
  if (value === 'waiting') return 'Waiting';
  if (value === 'needs review') return 'Needs review';
  if (value === 'handled' || value === 'completed') return 'Handled';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function proofRowsFor(actions, tasks, events) {
  var rows = [];
  (actions || []).forEach(function(a) {
    rows.push({
      id: 'action_' + a.id,
      title: (a.action_type === 'sms' ? 'Text' : a.action_type === 'email' ? 'Email' : 'Message') + ' to ' + (a.recipient_name || a.recipient_email || a.recipient_phone || 'recipient'),
      detail: a.task_title || a.subject || a.body || 'Estate coordination notice',
      status: statusText(a.delivery_status || a.status),
      at: a.sent_at || a.updated_at || a.created_at,
      tone: a.status === 'sent' || a.delivery_status === 'sent' ? 'good' : a.status === 'needs_review' ? 'warn' : 'soft'
    });
  });
  (tasks || []).filter(function(t) { return t.outcome_status || t.completed_at || t.follow_up_at || t.assigned_to_email || t.assigned_to_name; }).forEach(function(t) {
    rows.push({
      id: 'task_' + t.id,
      title: t.title,
      detail: t.outcome_status ? statusText(t.outcome_status) : (t.assigned_to_name || t.assigned_to_email ? 'Assigned to ' + (t.assigned_to_name || t.assigned_to_email) : 'Task updated'),
      status: statusText(t.status),
      at: t.completed_at || t.follow_up_at || t.updated_at || t.created_at,
      tone: isHandledStatus(t.status) ? 'good' : t.status === 'needs_review' ? 'warn' : 'soft'
    });
  });
  (events || []).slice(0, 8).forEach(function(e) {
    rows.push({
      id: 'event_' + e.id,
      title: e.title || 'Estate update',
      detail: e.description || '',
      status: 'Recorded',
      at: e.created_at,
      tone: e.event_type === 'plan_started' || e.event_type === 'task_completed' || e.event_type === 'plan_approved' ? 'good' : 'soft'
    });
  });
  return rows.sort(function(a, b) {
    return String(b.at || '').localeCompare(String(a.at || ''));
  }).slice(0, 10);
}

// ── INLINE ASSIGN ─────────────────────────────────────────────────────────────
function InlineAssign({ onSave, onClose }) {
  var s = useState(''); var name = s[0]; var setName = s[1];
  return (
    <div style={{ background: SUBTLE, borderRadius: 11, padding: 14, marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Who owns this?</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={name} onChange={function(e) { setName(e.target.value); }}
          placeholder="Their name"
          style={{ flex: 1, padding: '10px 12px', borderRadius: 9, border: '1.5px solid ' + BORDER, fontFamily: 'inherit', fontSize: 14, color: INK, outline: 'none', background: CARD, minHeight: 44, boxSizing: 'border-box' }} />
        <button onClick={function() { if (name.trim()) onSave(name.trim()); }}
          style={{ padding: '10px 16px', borderRadius: 9, border: 'none', background: SAGE, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44, whiteSpace: 'nowrap' }}>
          Assign
        </button>
      </div>
      <button onClick={function() { onSave('You'); }}
        style={{ width: '100%', padding: '9px', borderRadius: 9, border: '1.5px solid ' + SAGE_LIGHT, background: SAGE_FAINT, color: SAGE, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 40, marginBottom: 6 }}>
        Assign to me
      </button>
      <button onClick={onClose}
        style={{ width: '100%', padding: '6px', borderRadius: 9, border: 'none', background: 'none', color: SOFT, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
        Cancel
      </button>
    </div>
  );
}

// ── OUTCOME CARD ──────────────────────────────────────────────────────────────
function OutcomeCard({ outcome, expanded, showAssign, onToggle, onMarkHandled, onMarkInProgress, onAssignOpen, onAssignClose, onAssignSave, toast }) {
  var statusColor = outcome.status === 'handled' ? SAGE : outcome.status === 'needs_owner' ? AMBER : outcome.status === 'in_progress' ? '#2563eb' : MID;
  var statusBg = outcome.status === 'handled' ? SAGE_FAINT : outcome.status === 'needs_owner' ? AMBER_FAINT : outcome.status === 'in_progress' ? '#eff6ff' : SUBTLE;
  var statusLabel = { handled: 'Handled', needs_owner: 'Needs owner', in_progress: 'In progress', not_started: 'Not started' }[outcome.status] || 'Not started';
  var borderColor = outcome.status === 'handled' ? SAGE_LIGHT : outcome.status === 'needs_owner' ? AMBER_BORDER : BORDER;

  return (
    <div style={{ background: CARD, border: '1.5px solid ' + borderColor, borderRadius: 14, marginBottom: 10, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <button onClick={onToggle}
        style={{ width: '100%', padding: '16px 18px', cursor: 'pointer', textAlign: 'left', background: 'none', border: 'none', fontFamily: 'inherit', minHeight: 76 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: INK, lineHeight: 1.35, marginBottom: 6 }}>{outcome.title}</div>
            {outcome.description && <div style={{ fontSize: 13, color: MID, marginBottom: 8, lineHeight: 1.4 }}>{outcome.description}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Owner</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: outcome.owner_label ? INK : AMBER, background: outcome.owner_label ? SUBTLE : AMBER_FAINT, borderRadius: 6, padding: '2px 8px' }}>
                {outcome.owner_label || 'Unassigned'}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: statusColor, background: statusBg, borderRadius: 6, padding: '2px 8px' }}>{statusLabel}</span>
              {outcome.timeframe === 'now' && <span style={{ fontSize: 11, fontWeight: 700, color: ROSE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Right now</span>}
            </div>
            {outcome.status === 'in_progress' && (
              <div style={{ fontSize: 11.5, color: SAGE, fontWeight: 800, marginTop: 6 }}>
                {outcome.owner_label ? outcome.owner_label + ' started this' : 'Someone is working on this'}
              </div>
            )}
          </div>
          <span style={{ fontSize: 14, color: SOFT, flexShrink: 0, paddingTop: 2 }}>{expanded ? '↑' : '↓'}</span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid ' + BORDER }}>
          <div style={{ paddingTop: 14 }}>
            {outcome.why_it_matters && (
              <div style={{ fontSize: 14, color: MID, lineHeight: 1.7, marginBottom: 12 }}>{outcome.why_it_matters}</div>
            )}
            {outcome.reassurance && (
              <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 10, padding: '10px 13px', fontSize: 13, color: SAGE, marginBottom: 14, lineHeight: 1.55, fontStyle: 'italic' }}>
                {outcome.reassurance}
              </div>
            )}
            {outcome.recommended_action && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Recommended action</div>
                <div style={{ fontSize: 14, color: INK, lineHeight: 1.55 }}>{outcome.recommended_action}</div>
              </div>
            )}
            <div style={{ background: SUBTLE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '13px 14px', marginBottom: 14 }}>
              {(() => {
                var p = playbookFor(outcome);
                return (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 800, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>Passage prepared this</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: INK, marginBottom: 8 }}>{p.title}</div>
                    <div style={{ background: CARD, borderRadius: 10, padding: 12, fontSize: 13, color: MID, lineHeight: 1.6, marginBottom: 10 }}>{p.draft}</div>
                    {p.steps.map(function(step, i) {
                      return <div key={i} style={{ fontSize: 12.5, color: MID, lineHeight: 1.5, marginBottom: 3 }}>{i + 1}. {step}</div>;
                    })}
                  </>
                );
              })()}
            </div>
            {outcome.status !== 'handled' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {outcome.status === 'not_started' && (
                  <button onClick={onMarkInProgress}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#eff6ff', color: '#2563eb', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
                    In progress
                  </button>
                )}
                <button onClick={onMarkHandled}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: SAGE, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
                  Mark as handled
                </button>
                <button onClick={onAssignOpen}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid ' + BORDER, background: CARD, color: MID, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
                  {outcome.owner_label ? 'Change owner' : 'Assign'}
                </button>
              </div>
            )}
            {outcome.status === 'handled' && (
              <div style={{ padding: '12px', borderRadius: 10, background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, fontSize: 14, fontWeight: 700, color: SAGE, textAlign: 'center' }}>
                This is handled
              </div>
            )}
            {showAssign && <InlineAssign onSave={onAssignSave} onClose={onAssignClose} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SECONDARY CARD ────────────────────────────────────────────────────────────
function SecondaryCard({ title, meta, cta, onClick, collapsed, onToggle }) {
  return (
    <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 13, marginBottom: 8, overflow: 'hidden' }}>
      <button onClick={onToggle || onClick}
        style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', minHeight: 56 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{title}</div>
          {meta && <div style={{ fontSize: 12, color: SOFT, marginTop: 2 }}>{meta}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {cta && !collapsed && (
            <span style={{ fontSize: 12, fontWeight: 700, color: SAGE, background: SAGE_FAINT, borderRadius: 7, padding: '4px 10px' }}>{cta}</span>
          )}
          <span style={{ fontSize: 13, color: SOFT }}>{collapsed ? '↓' : '→'}</span>
        </div>
      </button>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
function formatEventDate(ev) {
  if (!ev || !ev.date) return 'Date not set';
  try {
    return new Date(ev.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch (e) {
    return ev.date;
  }
}

function eventLabel(ev) {
  var raw = String(ev.event_type || ev.name || 'Service detail').replace(/_/g, ' ');
  if (raw.toLowerCase() === 'funeral') return 'Funeral service';
  if (raw.toLowerCase() === 'burial') return 'Cemetery / burial';
  if (raw.toLowerCase() === 'visitation') return 'Wake / visitation';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function roleLooksLikeService(role) {
  var r = String(role || '').toLowerCase();
  return ['funeral', 'cemetery', 'crematorium', 'officiant', 'florist', 'caterer', 'reception', 'pastor', 'rabbi', 'imam', 'priest', 'director'].some(function(word) {
    return r.includes(word);
  });
}

function EstateOrchestrationMap({ estateId, name, serviceEvents, people, actions, announcements, tasks, outcomes }) {
  var sortedEvents = (serviceEvents || []).slice().sort(function(a, b) {
    var da = (a.date || '9999-12-31') + ' ' + (a.time || '');
    var db = (b.date || '9999-12-31') + ' ' + (b.time || '');
    return da.localeCompare(db);
  });
  var servicePeople = (people || []).filter(function(p) { return roleLooksLikeService(p.role) || roleLooksLikeService(p.estate_role_label) || roleLooksLikeService(p.relationship); }).slice(0, 6);
  var openTasks = (tasks || []).filter(function(t) { return !isHandledStatus(t.status); });
  var ownerGaps = (outcomes || []).filter(function(o) { return !o.owner_label && o.status !== 'handled'; }).length + openTasks.filter(function(t) { return ownerForTask(t) === 'Needs owner'; }).length;
  var pendingMessages = (announcements || []).filter(function(a) { return ['draft', 'pending_review', 'approved'].includes(a.status || 'draft'); }).length + (actions || []).filter(function(a) { return !['sent', 'handled', 'cancelled'].includes(a.status || a.delivery_status || 'draft'); }).length;
  var missing = [];
  if (sortedEvents.length === 0) missing.push('Add wake, funeral, cemetery, or reception details when known.');
  sortedEvents.forEach(function(ev) {
    if (!ev.date || !ev.time || !ev.location_name) missing.push(eventLabel(ev) + ' needs ' + [!ev.date ? 'date' : '', !ev.time ? 'time' : '', !ev.location_name ? 'location' : ''].filter(Boolean).join(', ') + '.');
  });
  if (ownerGaps > 0) missing.push(ownerGaps + ' open item' + (ownerGaps === 1 ? ' needs' : 's need') + ' an owner.');
  var nextMove = missing[0] || (pendingMessages > 0 ? 'Review the prepared message before anything is sent.' : 'The current map is clear. Keep handling one next item at a time.');

  return (
    <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px 18px', marginBottom: 16, boxShadow: '0 12px 34px rgba(55,45,35,.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: SAGE, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 5 }}>Estate map</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: INK, lineHeight: 1.25 }}>What is happening for {name}</div>
          <div style={{ fontSize: 12.5, color: MID, lineHeight: 1.55, marginTop: 5 }}>Service details, owners, and messages in one place.</div>
        </div>
        <button onClick={function() { window.location.href = '/share?wid=' + encodeURIComponent(estateId); }} style={{ border: '1px solid ' + SAGE_LIGHT, background: SAGE_FAINT, color: SAGE, borderRadius: 10, padding: '8px 10px', fontSize: 11.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>Social drafts</button>
      </div>
      <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 13, padding: '12px 13px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: SAGE, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>Next clear move</div>
        <div style={{ fontSize: 13.5, color: INK, lineHeight: 1.55 }}>{nextMove}</div>
      </div>
      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        {sortedEvents.length > 0 ? sortedEvents.map(function(ev, idx) {
          var detailsMissing = !ev.date || !ev.time || !ev.location_name;
          return (
            <div key={ev.id || idx} style={{ display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', gap: 10, alignItems: 'stretch' }}>
              <div style={{ background: detailsMissing ? AMBER_FAINT : SUBTLE, border: '1px solid ' + (detailsMissing ? AMBER_BORDER : BORDER), borderRadius: 12, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: detailsMissing ? AMBER : SAGE }}>{formatEventDate(ev)}</div>
                <div style={{ fontSize: 12, color: MID, marginTop: 4 }}>{ev.time || 'Time open'}</div>
              </div>
              <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 12, padding: '11px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: INK, lineHeight: 1.3 }}>{ev.name || eventLabel(ev)}</div>
                  <span style={{ fontSize: 10.5, color: detailsMissing ? AMBER : SAGE, fontWeight: 800, whiteSpace: 'nowrap' }}>{detailsMissing ? 'Needs detail' : 'Set'}</span>
                </div>
                <div style={{ fontSize: 12.5, color: MID, lineHeight: 1.55, marginTop: 5 }}>{ev.location_name || 'Location not set'}{ev.location_address ? ', ' + ev.location_address : ''}</div>
                {ev.notes && <div style={{ fontSize: 12, color: SOFT, lineHeight: 1.5, marginTop: 4 }}>{ev.notes}</div>}
              </div>
            </div>
          );
        }) : (
          <div style={{ background: AMBER_FAINT, border: '1px solid ' + AMBER_BORDER, borderRadius: 13, padding: '13px 14px', fontSize: 13, color: AMBER, lineHeight: 1.55, fontWeight: 700 }}>No service times are mapped yet. Add them once the wake, funeral, cemetery, or reception is known.</div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
        <div style={{ background: SUBTLE, borderRadius: 11, padding: 10 }}><div style={{ fontSize: 16, color: INK, fontWeight: 800 }}>{servicePeople.length}</div><div style={{ fontSize: 10.5, color: MID }}>service contacts</div></div>
        <div style={{ background: ownerGaps ? AMBER_FAINT : SAGE_FAINT, borderRadius: 11, padding: 10 }}><div style={{ fontSize: 16, color: ownerGaps ? AMBER : SAGE, fontWeight: 800 }}>{ownerGaps}</div><div style={{ fontSize: 10.5, color: MID }}>owner gaps</div></div>
        <div style={{ background: pendingMessages ? AMBER_FAINT : SAGE_FAINT, borderRadius: 11, padding: 10 }}><div style={{ fontSize: 16, color: pendingMessages ? AMBER : SAGE, fontWeight: 800 }}>{pendingMessages}</div><div style={{ fontSize: 10.5, color: MID }}>messages waiting</div></div>
      </div>
      {servicePeople.length > 0 && <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>{servicePeople.map(function(p) { return <span key={p.id} style={{ background: SUBTLE, border: '1px solid ' + BORDER, borderRadius: 999, padding: '5px 9px', fontSize: 11.5, color: MID }}>{p.first_name}{p.last_name ? ' ' + p.last_name : ''} - {p.estate_role_label || p.role || p.relationship || 'contact'}</span>; })}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={function() { window.location.href = '/?open=people&backEstate=' + encodeURIComponent(estateId); }} style={{ border: '1px solid ' + BORDER, background: CARD, borderRadius: 11, padding: '10px 12px', fontSize: 12.5, color: MID, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>Review people</button>
        <button onClick={function() { window.location.href = '/announce?estate=' + encodeURIComponent(estateId) + '&name=' + encodeURIComponent(name); }} style={{ border: 'none', background: SAGE, color: '#fff', borderRadius: 11, padding: '10px 12px', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>Prepare announcement</button>
      </div>
    </div>
  );
}

function ActivatePlanView({ estate, actions, tasks, outcomes, onActivate, activating }) {
  var pendingActions = (actions || []).filter(function(a) { return !['sent', 'handled', 'cancelled'].includes(a.status || a.delivery_status || 'draft'); });
  var sentActions = (actions || []).filter(function(a) { return (a.status || a.delivery_status) === 'sent' || a.sent_at; });
  var needsReview = (actions || []).filter(function(a) { return a.status === 'needs_review' || a.delivery_status === 'needs_review'; });
  var assignedTasks = (tasks || []).filter(function(t) { return t.assigned_to_email || t.assigned_to_name || t.owner_label; });
  var missingOwners = (outcomes || []).filter(function(o) { return !o.owner_label && o.status !== 'handled'; }).length +
    (tasks || []).filter(function(t) { return !isHandledStatus(t.status) && ownerForTask(t) === 'Needs owner'; }).length;
  var activated = ['activated', 'approved', 'in_motion', 'triggered'].includes(estate?.activation_status || estate?.status || '');
  var rows = [
    ['Email', pendingActions.filter(function(a) { return a.recipient_email || a.action_type === 'email'; }).length, activated ? 'still waiting' : 'prepared for approval'],
    ['Text', pendingActions.filter(function(a) { return a.recipient_phone || a.action_type === 'sms'; }).length, activated ? 'still waiting' : 'prepared for approval'],
    ['Sent', sentActions.length, 'delivery receipts recorded'],
    ['Tasks', assignedTasks.length, 'assigned to people'],
  ];

  return (
    <div style={{ background: activated ? SAGE_FAINT : CARD, border: '1px solid ' + (activated ? SAGE_LIGHT : BORDER), borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: activated ? SAGE : AMBER, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 5 }}>{activated ? 'Plan active' : 'Activate plan'}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: INK, lineHeight: 1.25 }}>{activated ? 'This estate is in motion.' : "Here's what will happen."}</div>
          <div style={{ fontSize: 12.5, color: MID, lineHeight: 1.55, marginTop: 5 }}>{activated ? 'Passage is tracking what was sent, what is waiting, and what needs review.' : 'Review recipients, channels, and assigned work before Passage sends anything.'}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: activated ? SAGE : AMBER, background: activated ? CARD : AMBER_FAINT, borderRadius: 999, padding: '5px 9px', whiteSpace: 'nowrap' }}>
          {activated ? 'Approved' : 'Review first'}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        {rows.map(function(row) {
          return (
            <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, background: SUBTLE, borderRadius: 11, padding: '10px 12px' }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: INK }}>{row[0]}</div>
              <div style={{ fontSize: 12.5, color: MID }}>{row[1]} {row[2]}</div>
            </div>
          );
        })}
      </div>

      {missingOwners > 0 && (
        <div style={{ background: AMBER_FAINT, border: '1px solid ' + AMBER_BORDER, borderRadius: 12, padding: '10px 12px', fontSize: 12.5, color: AMBER, lineHeight: 1.55, fontWeight: 700, marginBottom: 12 }}>
          {missingOwners} item{missingOwners === 1 ? '' : 's'} still need an owner before this feels complete.
        </div>
      )}

      {needsReview.length > 0 && (
        <div style={{ background: ROSE_FAINT, border: '1px solid ' + ROSE + '30', borderRadius: 12, padding: '10px 12px', fontSize: 12.5, color: ROSE, lineHeight: 1.55, fontWeight: 700, marginBottom: 12 }}>
          {needsReview.length} message{needsReview.length === 1 ? '' : 's'} need review before they are considered handled.
        </div>
      )}

      {!activated ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button onClick={function() { window.location.href = '/?open=people&backEstate=' + encodeURIComponent(estate.id); }} style={{ border: '1px solid ' + BORDER, background: CARD, borderRadius: 11, padding: '11px 12px', fontSize: 12.5, color: MID, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>Review</button>
          <button onClick={onActivate} disabled={activating || pendingActions.length === 0} style={{ border: 'none', background: pendingActions.length === 0 ? SOFT : SAGE, color: '#fff', borderRadius: 11, padding: '11px 12px', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', cursor: activating || pendingActions.length === 0 ? 'default' : 'pointer', opacity: activating ? .7 : 1 }}>{activating ? 'Starting...' : 'Approve and send'}</button>
        </div>
      ) : (
        <div style={{ background: CARD, border: '1px solid ' + SAGE_LIGHT, borderRadius: 12, padding: '11px 12px', color: SAGE, fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
          Passage has a record of this activation. Keep working from the next clear task.
        </div>
      )}
    </div>
  );
}

function ProofPanel({ actions, tasks, events }) {
  var rows = proofRowsFor(actions, tasks, events);
  var sent = rows.filter(function(r) { return r.status === 'Sent' || r.status === 'Handled' || r.status === 'Recorded'; }).length;
  var waiting = rows.filter(function(r) { return r.status === 'Waiting' || r.status === 'Assigned'; }).length;
  var review = rows.filter(function(r) { return r.status === 'Needs review'; }).length;
  return (
    <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: SAGE, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 5 }}>Proof of progress</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: INK, lineHeight: 1.25 }}>What Passage has recorded</div>
          <div style={{ fontSize: 12.5, color: MID, lineHeight: 1.55, marginTop: 5 }}>Messages, accepted work, waiting items, and handled tasks stay visible here.</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: review ? ROSE : SAGE, background: review ? ROSE_FAINT : SAGE_FAINT, borderRadius: 999, padding: '5px 9px', whiteSpace: 'nowrap' }}>
          {review ? review + ' review' : 'Tracked'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        <div style={{ background: SAGE_FAINT, borderRadius: 11, padding: 10 }}><div style={{ fontSize: 16, color: SAGE, fontWeight: 800 }}>{sent}</div><div style={{ fontSize: 10.5, color: MID }}>recorded</div></div>
        <div style={{ background: SUBTLE, borderRadius: 11, padding: 10 }}><div style={{ fontSize: 16, color: MID, fontWeight: 800 }}>{waiting}</div><div style={{ fontSize: 10.5, color: MID }}>waiting</div></div>
        <div style={{ background: review ? ROSE_FAINT : SAGE_FAINT, borderRadius: 11, padding: 10 }}><div style={{ fontSize: 16, color: review ? ROSE : SAGE, fontWeight: 800 }}>{review}</div><div style={{ fontSize: 10.5, color: MID }}>needs review</div></div>
      </div>
      {rows.length === 0 ? (
        <div style={{ background: SUBTLE, borderRadius: 12, padding: '12px 13px', fontSize: 13, color: MID, lineHeight: 1.55 }}>
          Nothing has been sent or completed yet. Start with one task, then Passage will record the outcome here.
        </div>
      ) : rows.map(function(row, i) {
        var color = row.tone === 'good' ? SAGE : row.tone === 'warn' ? ROSE : MID;
        var bg = row.tone === 'good' ? SAGE_FAINT : row.tone === 'warn' ? ROSE_FAINT : SUBTLE;
        return (
          <div key={row.id} style={{ borderTop: i ? '1px solid ' + BORDER : 'none', padding: '9px 0', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 13.5, color: INK, fontWeight: 800, lineHeight: 1.35 }}>{row.title}</div>
              {row.detail && <div style={{ fontSize: 12, color: MID, lineHeight: 1.45, marginTop: 2 }}>{row.detail}</div>}
              {row.at && <div style={{ fontSize: 10.5, color: SOFT, marginTop: 3 }}>{new Date(row.at).toLocaleString()}</div>}
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: color, background: bg, borderRadius: 999, padding: '4px 8px', whiteSpace: 'nowrap' }}>{row.status}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function EstatePage() {
  var params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  var estateId = params.get('id');

  var s0 = useState(null); var estate = s0[0]; var setEstate = s0[1];
  var s1 = useState([]); var outcomes = s1[0]; var setOutcomes = s1[1];
  var s2 = useState([]); var tasks = s2[0]; var setTasks = s2[1];
  var s3 = useState(null); var user = s3[0]; var setUser = s3[1];
  var s4 = useState(true); var loading = s4[0]; var setLoading = s4[1];
  var s5 = useState(-1); var expanded = s5[0]; var setExpanded = s5[1];
  var s6 = useState(-1); var showAssign = s6[0]; var setShowAssign = s6[1];
  var s7 = useState(''); var toast = s7[0]; var setToast = s7[1];
  var s8 = useState(false); var showAnnounce = s8[0]; var setShowAnnounce = s8[1];
  var s9 = useState(false); var showUpNext = s9[0]; var setShowUpNext = s9[1];
  var s10 = useState([]); var events = s10[0]; var setEvents = s10[1];
  var s11 = useState([]); var serviceEvents = s11[0]; var setServiceEvents = s11[1];
  var s12 = useState([]); var people = s12[0]; var setPeople = s12[1];
  var s13 = useState([]); var actions = s13[0]; var setActions = s13[1];
  var s14 = useState([]); var announcements = s14[0]; var setAnnouncements = s14[1];
  var s15 = useState(false); var activating = s15[0]; var setActivating = s15[1];

  useEffect(function() {
    if (!estateId) { setLoading(false); return; }
    sb.auth.getSession().then(function(r) {
      if (r.data && r.data.session) setUser(r.data.session.user);
    });
    Promise.all([
      sb.from('workflows').select('*').eq('id', estateId).single(),
      sb.from('outcomes').select('*').eq('estate_id', estateId).order('position'),
      sb.from('tasks').select('*').eq('workflow_id', estateId).order('position'),
      sb.from('estate_events').select('*').eq('estate_id', estateId).order('created_at', { ascending: false }).limit(8),
      sb.from('workflow_events').select('*').eq('workflow_id', estateId).order('date', { ascending: true }),
      sb.from('people').select('*').eq('estate_id', estateId).order('created_at', { ascending: true }),
      sb.from('workflow_actions').select('*').eq('workflow_id', estateId).order('sort_order', { ascending: true }),
      sb.from('announcements').select('*').eq('estate_id', estateId).order('created_at', { ascending: false }).limit(10),
    ]).then(function(results) {
      if (results[0].data) setEstate(results[0].data);
      if (results[1].data) setOutcomes(results[1].data);
      if (results[2].data) setTasks(results[2].data);
      if (results[3].data) setEvents(results[3].data);
      if (results[4].data) setServiceEvents(results[4].data);
      if (results[5].data) setPeople(results[5].data);
      if (results[6].data) setActions(results[6].data);
      if (results[7].data) setAnnouncements(results[7].data);
      setLoading(false);
      // Update last viewed
      sb.from('workflows').update({ last_viewed_at: new Date().toISOString() }).eq('id', estateId).then(function() {});
    });
  }, [estateId]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(function() { setToast(''); }, 2200);
  }

  function homeLink(open) {
    var query = open ? '?open=' + encodeURIComponent(open) + '&backEstate=' + encodeURIComponent(estateId || '') : '';
    return '/' + query;
  }

  async function updateOutcome(index, updates) {
    var outcome = outcomes[index];
    await sb.from('outcomes').update(Object.assign({ updated_at: new Date().toISOString() }, updates)).eq('id', outcome.id);
    var eventTitle = updates.status === 'handled' ? 'Task handled' : updates.owner_label ? 'Owner assigned' : 'Task updated';
    var eventDescription = updates.owner_label ? outcome.title + ' assigned to ' + updates.owner_label : outcome.title;
    var eventRow = { estate_id: estateId, event_type: updates.status === 'handled' ? 'task_completed' : updates.owner_label ? 'owner_assigned' : 'task_updated', title: eventTitle, description: eventDescription, actor: updates.owner_label || coordinatorName };
    sb.from('estate_events').insert([eventRow]).then(function() {
      setEvents(function(prev) { return [Object.assign({ id: 'local_' + Date.now(), created_at: new Date().toISOString() }, eventRow)].concat(prev).slice(0, 8); });
    });
    setOutcomes(function(prev) {
      return prev.map(function(o, i) { return i === index ? Object.assign({}, o, updates) : o; });
    });
    setExpanded(-1);
    setShowAssign(-1);
    if (updates.status === 'handled') showToast('This is handled');
    else if (updates.status === 'in_progress') showToast('Marked as in progress');
    else if (updates.owner_label) showToast('Assigned to ' + updates.owner_label);
  }

  async function activatePlan() {
    if (!estate) return;
    setActivating(true);
    var now = new Date().toISOString();
    var session = await sb.auth.getSession();
    var token = session && session.data && session.data.session ? session.data.session.access_token : '';
    var res = await fetch('/api/handleEvent', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
      body: JSON.stringify({ type: 'death_confirmed', payload: { workflowId: estateId } })
    });
    if (!res.ok) {
      setActivating(false);
      showToast('Passage could not send yet. Review contacts and try again.');
      return;
    }
    await sb.from('workflows').update({ activation_status: 'activated', updated_at: now }).eq('id', estateId);
    var eventRow = { estate_id: estateId, event_type: 'plan_started', title: 'Plan started', description: 'The family approved the plan and Passage sent queued messages.', actor: coordinatorName };
    await sb.from('estate_events').insert([eventRow]);
    var actionReload = await sb.from('workflow_actions').select('*').eq('workflow_id', estateId).order('sort_order', { ascending: true });
    setEstate(function(prev) { return Object.assign({}, prev || {}, { activation_status: 'activated', status: 'triggered' }); });
    if (actionReload.data) setActions(actionReload.data);
    setEvents(function(prev) { return [Object.assign({ id: 'local_plan_' + Date.now(), created_at: now }, eventRow)].concat(prev).slice(0, 8); });
    setActivating(false);
    showToast('Plan started. Messages and task assignments are being tracked.');
  }

  // Banner logic
  var handledCount = outcomes.filter(function(o) { return o.status === 'handled'; }).length;
  var needsOwnerCount = outcomes.filter(function(o) { return o.status === 'needs_owner'; }).length;
  var allHandled = handledCount === outcomes.length && outcomes.length > 0;
  var requiredOutcomeCount = outcomes.length;
  var requiredTaskCount = tasks.filter(function(t) { return t.status !== 'not_applicable'; }).length;
  var requiredCount = requiredOutcomeCount + requiredTaskCount;
  var readinessHandledCount = outcomes.filter(function(o) { return isReadinessHandled(o.status); }).length +
    tasks.filter(function(t) { return t.status !== 'not_applicable' && isReadinessHandled(t.status); }).length;
  var readinessPct = requiredCount > 0 ? Math.round((readinessHandledCount / requiredCount) * 100) : 0;

  var bannerText = allHandled
    ? "You've handled what's needed right now. You're in a good place."
    : needsOwnerCount > 0
      ? 'Some important items still need an owner.'
      : "You're on track. Nothing urgent is missing right now.";
  var bannerColor = needsOwnerCount > 0 && !allHandled ? AMBER : SAGE;
  var bannerBg = needsOwnerCount > 0 && !allHandled ? AMBER_FAINT : SAGE_FAINT;
  var bannerBorder = needsOwnerCount > 0 && !allHandled ? AMBER_BORDER : SAGE_LIGHT;

  var firstIncomplete = outcomes.findIndex(function(o) { return o.status !== 'handled'; });
  var name = estate ? (estate.deceased_first_name || estate.deceased_name || 'your loved one') : 'your loved one';
  var coordinatorName = estate ? (estate.coordinator_name || 'You') : 'You';
  var timelineGroups = TIMELINE_BUCKETS.map(function(bucket) {
    var outcomeItems = outcomes
      .filter(function(o) {
        if (isHandledStatus(o.status)) return false;
        if (bucket.key === 'now') return o.timeframe === 'now' || o.timeframe === 'today' || o.priority === 'critical';
        if (bucket.key === '72h') return o.timeframe === '72h' || o.timeframe === 'next_72_hours';
        if (bucket.key === 'week') return o.timeframe === 'week' || o.timeframe === 'first_week';
        if (bucket.key === 'month') return o.timeframe === 'month' || o.timeframe === 'first_month';
        if (bucket.key === 'year') return o.timeframe === 'year' || o.timeframe === 'first_year';
        return false;
      })
      .map(function(o) {
        return { id: 'outcome_' + o.id, title: o.title, owner: o.owner_label || 'Needs owner', status: o.status || 'not_started', next: o.status === 'needs_owner' ? 'Assign an owner' : o.status === 'in_progress' ? ((o.owner_label || 'Someone') + ' is working on this') : 'Open task' };
      });
    var taskItems = tasks
      .filter(function(t) { return !isHandledStatus(t.status) && bucketForTask(t) === bucket.key; })
      .map(function(t) {
        var working = ['assigned', 'waiting', 'in_progress'].includes(t.status || '');
        return { id: 'task_' + t.id, title: t.title, owner: ownerForTask(t), status: t.status || 'pending', next: working ? ((t.assigned_to_name || t.assigned_to_email || 'Someone') + ' is working on this') : t.assigned_to_name || t.assigned_to_email ? 'Waiting on owner' : 'Decide who is handling this' };
      });
    return Object.assign({}, bucket, { items: outcomeItems.concat(taskItems) });
  });
  var nowGroup = timelineGroups.find(function(g) { return g.key === 'now'; }) || { items: [] };
  var next72Group = timelineGroups.find(function(g) { return g.key === '72h'; }) || { items: [] };
  var readyFor72 = nowGroup.items.length === 0 && next72Group.items.length > 0 && !allHandled;
  var upNextTasks = tasks.filter(function(t) { return !isHandledStatus(t.status); }).slice(3, 8);
  var resumeEvent = events.find(function(e) { return e.event_type === 'task_updated' || e.event_type === 'task_completed' || e.event_type === 'owner_assigned' || e.event_type === 'participant_updated' || e.event_type === 'participant_waiting'; });
  var firstOpenOutcome = outcomes.find(function(o) { return !isHandledStatus(o.status); });
  var firstOpenTask = tasks.find(function(t) { return !isHandledStatus(t.status); });
  var firstFastTitle = firstOpenOutcome ? firstOpenOutcome.title : firstOpenTask ? firstOpenTask.title : '';

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <div style={{ color: SOFT, fontSize: 14 }}>Loading...</div>
    </div>
  );

  // ── NO ESTATE ─────────────────────────────────────────────────────────────────
  if (!estateId || !estate) return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: 'Georgia, serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>🕊️</div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: INK, marginBottom: 8 }}>Estate not found</div>
      <div style={{ fontSize: 14, color: SOFT, marginBottom: 28 }}>This link may have expired or the estate may have been archived.</div>
      <button onClick={function() { window.location.href = '/'; }}
        style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: SAGE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        Go home
      </button>
    </div>
  );

  // ── MAIN RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: SAGE, color: '#fff', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 600, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Nav */}
      <div style={{ background: CARD, borderBottom: '1px solid ' + BORDER, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={function() { window.location.href = '/'; }}
            style={{ background: 'none', border: 'none', fontSize: 13, color: SOFT, cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginRight: 4 }}>
            ←
          </button>
          <span style={{ fontSize: 12, color: SOFT }}>Back to estate</span>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle, ' + SAGE_LIGHT + ', ' + SAGE + '70)' }} />
          <span style={{ fontSize: 14, color: INK }}>Passage</span>
        </div>
        <div style={{ fontSize: 12, color: SOFT, textAlign: 'right', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
      </div>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* Banner */}
        <div style={{ background: bannerBg, border: '1px solid ' + bannerBorder, borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: bannerColor, marginBottom: 4 }}>{bannerText}</div>
          {!allHandled && outcomes.length > 0 && (
            <div style={{ fontSize: 13, color: MID, lineHeight: 1.55, marginBottom: 10 }}>
              Here is what matters first for {name}. Tap any item to see what to do.
            </div>
          )}
          {outcomes.length > 0 && (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: SAGE }}><span style={{ fontWeight: 700 }}>{readinessPct}%</span> ready</div>
              {handledCount > 0 && <div style={{ fontSize: 12, color: SAGE }}><span style={{ fontWeight: 700 }}>{handledCount}</span> handled</div>}
              {needsOwnerCount > 0 && <div style={{ fontSize: 12, color: AMBER }}><span style={{ fontWeight: 700 }}>{needsOwnerCount}</span> need an owner</div>}
              {outcomes.filter(function(o) { return o.status === 'not_started'; }).length > 0 && (
                <div style={{ fontSize: 12, color: SOFT }}><span style={{ fontWeight: 700 }}>{outcomes.filter(function(o) { return o.status === 'not_started'; }).length}</span> not started</div>
              )}
            </div>
          )}
        </div>

        {/* Outcomes — generated from /urgent or empty state */}
        {resumeEvent && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, padding: '13px 15px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: SOFT, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>Last thing you were working on</div>
            <div style={{ fontSize: 14, color: INK, fontWeight: 800, lineHeight: 1.35 }}>{resumeEvent.description || resumeEvent.title}</div>
            <div style={{ fontSize: 12, color: SAGE, fontWeight: 800, marginTop: 4 }}>Continue with the next open item below.</div>
          </div>
        )}

        {firstFastTitle && (
          <div style={{ background: ROSE_FAINT, border: '1px solid ' + ROSE + '30', borderRadius: 14, padding: '13px 15px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: ROSE, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>Just do this now</div>
            <div style={{ fontSize: 15, color: INK, fontWeight: 800, lineHeight: 1.35 }}>{firstFastTitle}</div>
          </div>
        )}

        <ActivatePlanView
          estate={estate}
          actions={actions}
          tasks={tasks}
          outcomes={outcomes}
          activating={activating}
          onActivate={activatePlan}
        />

        <ProofPanel
          actions={actions}
          tasks={tasks}
          events={events}
        />

        <EstateOrchestrationMap
          estateId={estateId}
          name={name}
          serviceEvents={serviceEvents}
          people={people}
          actions={actions}
          announcements={announcements}
          tasks={tasks}
          outcomes={outcomes}
        />

        <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 10 }}>Orchestration status</div>
          <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 7 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: SAGE }}>{readinessPct}% ready</div>
              <div style={{ fontSize: 11.5, color: MID }}>{readinessHandledCount} of {requiredCount || 0} required items handled</div>
            </div>
            <div style={{ height: 6, background: CARD, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: readinessPct + '%', height: '100%', background: SAGE, borderRadius: 999 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div style={{ background: AMBER_FAINT, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: AMBER }}>{needsOwnerCount}</div>
              <div style={{ fontSize: 10.5, color: MID }}>Needs owner</div>
            </div>
            <div style={{ background: SUBTLE, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: MID }}>{outcomes.filter(function(o) { return o.status === 'in_progress' || o.status === 'not_started'; }).length}</div>
              <div style={{ fontSize: 10.5, color: MID }}>In motion</div>
            </div>
            <div style={{ background: SAGE_FAINT, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: SAGE }}>{handledCount}</div>
              <div style={{ fontSize: 10.5, color: MID }}>Handled</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: SOFT, marginTop: 10, lineHeight: 1.5 }}>Passage keeps this estate separate from every other estate you manage.</div>
        </div>

        <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 4 }}>Plan timeline</div>
              <div style={{ fontSize: 12, color: SOFT, lineHeight: 1.45 }}>Tasks grouped by when they matter, with ownership and the next move.</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: SAGE, background: SAGE_FAINT, borderRadius: 999, padding: '4px 9px', whiteSpace: 'nowrap' }}>
              {timelineGroups.reduce(function(total, g) { return total + g.items.length; }, 0)} open
            </div>
          </div>
          {timelineGroups.map(function(group) {
            return (
              <div key={group.key} style={{ borderTop: '1px solid ' + BORDER, paddingTop: 12, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>{group.label}</div>
                  <div style={{ fontSize: 11.5, color: SOFT, textAlign: 'right' }}>{group.help}</div>
                </div>
                {group.items.length > 0 ? group.items.map(function(item) {
                  return (
                    <div key={item.id} style={{ background: SUBTLE, borderRadius: 10, padding: '10px 12px', marginBottom: 7 }}>
                      <div style={{ fontSize: 13.5, color: INK, lineHeight: 1.35, marginBottom: 6 }}>{item.title}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 11.5, color: item.owner === 'Needs owner' ? AMBER : SAGE, fontWeight: 700 }}>{item.owner}</span>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: SOFT }} />
                        <span style={{ fontSize: 11.5, color: SOFT }}>{item.next}</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ background: SAGE_FAINT, borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: SAGE, fontWeight: 700 }}>
                    Nothing waiting here.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {readyFor72 && (
          <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: SAGE, marginBottom: 5 }}>The first urgent items are clear.</div>
            <div style={{ fontSize: 13, color: MID, lineHeight: 1.6 }}>
              If you have a little room now, Passage has the next 72 hours ready. Start with one item, or assign it to someone who can help.
            </div>
          </div>
        )}

        {outcomes.length > 0 ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 12 }}>Here's what matters first</div>
            {outcomes.map(function(outcome, i) {
              return (
                <OutcomeCard
                  key={outcome.id}
                  outcome={outcome}
                  expanded={expanded === i}
                  showAssign={showAssign === i}
                  onToggle={function() { setExpanded(expanded === i ? -1 : i); setShowAssign(-1); }}
                  onMarkHandled={function() { updateOutcome(i, { status: 'handled' }); }}
                  onMarkInProgress={function() { updateOutcome(i, { status: 'in_progress' }); }}
                  onAssignOpen={function() { setShowAssign(i); setExpanded(i); }}
                  onAssignClose={function() { setShowAssign(-1); }}
                  onAssignSave={function(ownerName) {
                    var statusUpdate = outcomes[i].status === 'needs_owner' ? 'not_started' : outcomes[i].status;
                    updateOutcome(i, { owner_label: ownerName, status: statusUpdate });
                  }}
                />
              );
            })}
          </>
        ) : (
          // No outcomes yet — show task list instead
          tasks.length > 0 ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 12 }}>Your task list</div>
              {tasks.slice(0, 5).map(function(task, i) {
                return (
                  <div key={task.id} style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 12, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid ' + BORDER, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: SOFT }}>{i + 1}</div>
                    <div style={{ flex: 1, fontSize: 14, color: INK, lineHeight: 1.4 }}>{task.title}</div>
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{ background: SUBTLE, borderRadius: 14, padding: '24px', textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: SOFT, lineHeight: 1.7 }}>No outcomes yet. Finish the intake flow to generate your first 24-hour plan.</div>
              <button onClick={function() { window.location.href = '/urgent'; }}
                style={{ marginTop: 14, padding: '11px 20px', borderRadius: 11, border: 'none', background: SAGE, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                Start urgent intake
              </button>
            </div>
          )
        )}

        {/* Up next — collapsed secondary tasks */}
        {upNextTasks.length > 0 && (
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <button onClick={function() { setShowUpNext(!showUpNext); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: SUBTLE, borderRadius: 12, padding: '12px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: showUpNext ? 8 : 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: MID }}>Up next</span>
              <span style={{ fontSize: 13, color: SOFT }}>{showUpNext ? '↑' : '↓'}</span>
            </button>
            {showUpNext && upNextTasks.map(function(task, i) {
              return (
                <div key={task.id} style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 11, padding: '12px 16px', marginBottom: 6, fontSize: 13.5, color: MID, lineHeight: 1.4 }}>
                  {task.title}
                </div>
              );
            })}
          </div>
        )}

        {/* Secondary module cards */}
        <div style={{ marginBottom: 20 }}>
          <SecondaryCard
            title="Share the news"
            meta="Prepare an announcement for family and community"
            cta="Prepare"
            onClick={function() { window.location.href = '/announce?estate=' + estateId + '&name=' + encodeURIComponent(name); }}
          />
          <SecondaryCard
            title="People and coordination"
            meta={outcomes.filter(function(o) { return !o.owner_label; }).length + ' items need an owner'}
            cta="Review"
            onClick={function() { window.location.href = homeLink('people'); }}
          />
          <SecondaryCard
            title="Planning file"
            meta="Documents, wishes, obituary, voice notes"
            cta="Open"
            onClick={function() { window.location.href = homeLink('documents'); }}
          />
          <SecondaryCard
            title="Scheduled messages"
            meta="Letters, texts, or voice notes for dates and milestones"
            cta="Open My file"
            onClick={function() { window.location.href = homeLink('memories'); }}
          />
        </div>

        {events.length > 0 && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 10 }}>Activity history</div>
            {events.slice(0, 5).map(function(e) {
              return (
                <div key={e.id} style={{ borderTop: '1px solid ' + BORDER, padding: '9px 0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{e.title}</div>
                  {e.description && <div style={{ fontSize: 12, color: MID, lineHeight: 1.45 }}>{e.description}</div>}
                  <div style={{ fontSize: 10.5, color: SOFT, marginTop: 2 }}>{new Date(e.created_at).toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Primary CTA */}
        {!allHandled && firstIncomplete >= 0 && (
          <button onClick={function() { setExpanded(firstIncomplete); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ width: '100%', padding: '16px', borderRadius: 13, border: 'none', background: SAGE, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', marginBottom: 10, minHeight: 52 }}>
            Start with the first item
          </button>
        )}
        {allHandled && (
          <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 13, padding: '16px', marginBottom: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: SAGE, marginBottom: 4 }}>You've handled what's needed right now. You're in a good place.</div>
            <div style={{ fontSize: 13, color: MID, lineHeight: 1.6 }}>We'll guide you through what comes next when you're ready.</div>
          </div>
        )}
        <button onClick={function() { window.location.href = '/announce?estate=' + estateId + '&name=' + encodeURIComponent(name); }}
          style={{ width: '100%', padding: '14px', borderRadius: 13, border: '1.5px solid ' + BORDER, background: CARD, color: MID, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 50 }}>
          Get help coordinating
        </button>

        <div style={{ fontSize: 11.5, color: SOFT, textAlign: 'center', marginTop: 16, lineHeight: 1.65 }}>
          Your estate plan is saved. Come back anytime.
        </div>
      </div>
    </div>
  );
}
