// pages/urgent.js
// Spec-compliant: state machine, 3 outcomes, one CTA, feedback on every action
// Routes: /urgent → flow → results → /estate?id=

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

var sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── TOKENS ────────────────────────────────────────────────────────────────────
var T = {
  bg: '#f6f3ee', card: '#ffffff', ink: '#1a1916', mid: '#6a6560',
  soft: '#a09890', border: '#e4ddd4', subtle: '#f0ece5',
  sage: '#6b8f71', sageFaint: '#f0f5f1', sageLight: '#c8deca',
  rose: '#c47a7a', roseFaint: '#fdf3f3',
  amber: '#b07d2e', amberFaint: '#fdf8ee', amberBorder: 'rgba(176,125,46,0.25)',
  blue: '#2563eb', blueFaint: '#eff6ff',
};

// ── OUTCOME ENGINE ─────────────────────────────────────────────────────────────
// Always exactly 3. No owner = needs_owner status.
function buildOutcomes(location) {
  var isHome = location === 'home' || location === 'unexpected';
  var isFacility = location === 'hospital' || location === 'facility' || location === 'hospice';

  var third = isHome
    ? {
        id: 'secure_home', title: 'Secure home, pets, and vehicle',
        description: 'This prevents avoidable issues in the first 24 hours.',
        why: 'Once word spreads, the home should be secured. Pets need care and valuables should be protected.',
        action: 'Arrange for someone to check the home and care for any pets.',
        reassurance: 'This can wait a few hours — handle the more urgent items first.',
        priority: 'high',
      }
    : isFacility
    ? {
        id: 'confirm_facility', title: 'Confirm what the facility will handle',
        description: 'Reduces confusion and duplicate effort.',
        why: 'Hospitals and facilities handle much of the official paperwork. Knowing what they cover prevents duplicate calls.',
        action: 'Speak with a patient advocate, social worker, or charge nurse before you leave.',
        reassurance: 'The facility staff are experienced with this — they will guide you.',
        priority: 'high',
      }
    : {
        id: 'confirm_coordinator', title: 'Confirm who is coordinating',
        description: 'One point of contact prevents confusion.',
        why: 'Having one person be the point of contact prevents duplicate calls and conflicting decisions.',
        action: 'Decide who is the primary coordinator and let close family know.',
        reassurance: 'This does not have to be you alone. Passage can help share the load.',
        priority: 'high',
      };

  return [
    {
      id: 'funeral', title: 'Funeral arrangements',
      description: 'This should be started soon.',
      why: 'The funeral home coordinates transportation, paperwork, and all arrangements. Most time-sensitive decision in the first 24 hours.',
      action: isFacility
        ? 'Ask the facility if they have a funeral home they work with, or choose one yourself.'
        : 'Search for a local funeral home and call them today.',
      reassurance: 'Most families contact a funeral home within the first 24 hours.',
      priority: 'critical',
      owner: null, status: 'needs_owner',
    },
    {
      id: 'family', title: 'Notify immediate family',
      description: 'Close family should hear directly first.',
      why: 'Close family should hear directly from you before any broader announcement. One of the most important first calls.',
      action: 'Start with the closest family members. A short call is all that is needed right now.',
      reassurance: 'You do not need all the details before you call. Just let them know.',
      priority: 'critical',
      owner: null, status: 'needs_owner',
    },
    Object.assign({}, third, { owner: null, status: 'needs_owner' }),
  ];
}

// ── PERSISTENCE ────────────────────────────────────────────────────────────────
function save(data) {
  try { localStorage.setItem('psg_urgent', JSON.stringify(data)); } catch (e) {}
}
function load() {
  try { var r = localStorage.getItem('psg_urgent'); return r ? JSON.parse(r) : null; } catch (e) { return null; }
}
function clear() {
  try { localStorage.removeItem('psg_urgent'); } catch (e) {}
}

// ── SHELL ──────────────────────────────────────────────────────────────────────
function Shell({ step, total, onBack, bare, children }) {
  return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif' }}>
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid ' + T.border, background: T.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle, ' + T.sageLight + ', ' + T.sage + '70)' }} />
          <span style={{ fontSize: 14, color: T.ink }}>Passage</span>
        </div>
        {!bare && step > 0 && step < 5 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: total }).map(function(_, i) {
                return <div key={i} style={{ width: i < step ? 18 : 7, height: 3, borderRadius: 2, background: i < step ? T.sage : T.border, transition: 'all 0.25s' }} />;
              })}
            </div>
            {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 12, color: T.soft, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44, padding: '0 4px' }}>Back</button>}
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '24px 20px 80px' }}>
        <div style={{ width: '100%', maxWidth: 500 }}>{children}</div>
      </div>
    </div>
  );
}

// ── ATOMS ──────────────────────────────────────────────────────────────────────
function PrimaryBtn({ label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={!!disabled}
      style={{ width: '100%', padding: '16px', borderRadius: 13, border: 'none', background: disabled ? T.border : T.sage, color: disabled ? T.soft : '#fff', fontSize: 16, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', minHeight: 54 }}>
      {label}
    </button>
  );
}

function GhostBtn({ label, onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', padding: '14px', borderRadius: 13, border: '1.5px solid ' + T.border, background: T.card, color: T.mid, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 50, marginTop: 10 }}>
      {label}
    </button>
  );
}

function Option({ label, sub, selected, onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 13, border: '1.5px solid ' + (selected ? T.sage : T.border), background: selected ? T.sageFaint : T.card, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 9, minHeight: 58, transition: 'all 0.12s' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: selected ? T.sage : T.ink }}>{label}</div>
        {sub && <div style={{ fontSize: 13, color: T.soft, marginTop: 3 }}>{sub}</div>}
      </div>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (selected ? T.sage : T.border), background: selected ? T.sage : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
      </div>
    </button>
  );
}

// ── STATUS PILL ────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  var map = {
    needs_owner: { label: 'Needs owner', color: T.amber, bg: T.amberFaint },
    not_started: { label: 'Not started', color: T.soft, bg: T.subtle },
    in_progress: { label: 'In progress', color: T.blue, bg: T.blueFaint },
    handled: { label: 'Handled', color: T.sage, bg: T.sageFaint },
  };
  var s = map[status] || map.not_started;
  return <span style={{ fontSize: 12, fontWeight: 600, color: s.color, background: s.bg, borderRadius: 6, padding: '2px 9px', display: 'inline-block' }}>{s.label}</span>;
}

// ── INLINE OWNER SELECTOR ──────────────────────────────────────────────────────
function OwnerSelector({ onSave, onClose }) {
  var s = useState(''); var name = s[0]; var setName = s[1];
  return (
    <div style={{ background: T.subtle, borderRadius: 11, padding: 14, marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.soft, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Who owns this?</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={name} onChange={function(e) { setName(e.target.value); }}
          placeholder="Their name" autoFocus
          style={{ flex: 1, padding: '10px 12px', borderRadius: 9, border: '1.5px solid ' + T.border, fontFamily: 'inherit', fontSize: 14, color: T.ink, outline: 'none', background: T.card, minHeight: 44, boxSizing: 'border-box' }} />
        <button onClick={function() { if (name.trim()) onSave(name.trim()); }}
          style={{ padding: '10px 16px', borderRadius: 9, border: 'none', background: T.sage, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44, whiteSpace: 'nowrap' }}>
          Assign
        </button>
      </div>
      <button onClick={function() { onSave('You'); }}
        style={{ width: '100%', padding: '9px', borderRadius: 9, border: '1.5px solid ' + T.sageLight, background: T.sageFaint, color: T.sage, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 40, marginBottom: 6 }}>
        Assign to me
      </button>
      <button onClick={onClose}
        style={{ width: '100%', padding: '6px', borderRadius: 9, border: 'none', background: 'none', color: T.soft, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
        Cancel
      </button>
    </div>
  );
}

// ── TOAST ──────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: T.sage, color: '#fff', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 600, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', whiteSpace: 'nowrap', pointerEvents: 'none', transition: 'opacity 0.2s' }}>
      {msg}
    </div>
  );
}

// ── OUTCOME CARD ───────────────────────────────────────────────────────────────
function OutcomeCard({ outcome, index, expanded, showOwner, onToggle, onAssign, onAssignClose, onAssignSave, onStart, onHandled, lastAction }) {
  var isHandled = outcome.status === 'handled';
  var borderColor = isHandled ? T.sageLight : outcome.status === 'needs_owner' ? T.amberBorder : T.border;
  var bg = isHandled ? T.sageFaint : T.card;

  return (
    <div style={{ background: bg, border: '1.5px solid ' + borderColor, borderRadius: 14, marginBottom: 10, overflow: 'hidden', transition: 'all 0.2s' }}>
      <button onClick={onToggle}
        style={{ width: '100%', padding: '16px 18px', cursor: 'pointer', textAlign: 'left', background: 'none', border: 'none', fontFamily: 'inherit', minHeight: 78 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, lineHeight: 1.35, marginBottom: 6 }}>{outcome.title}</div>
            <div style={{ fontSize: 13, color: T.mid, marginBottom: 8, lineHeight: 1.4 }}>{outcome.description}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.soft, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Owner</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: outcome.owner ? T.ink : T.amber, background: outcome.owner ? T.subtle : T.amberFaint, borderRadius: 6, padding: '2px 8px' }}>
                {outcome.owner || 'Unassigned'}
              </span>
              <StatusPill status={outcome.status} />
              {outcome.priority === 'critical' && !isHandled && (
                <span style={{ fontSize: 11, fontWeight: 700, color: T.rose, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Critical</span>
              )}
            </div>
            {/* Inline confirmation after action */}
            {lastAction === 'assigned' && outcome.owner && !expanded && (
              <div style={{ fontSize: 12, color: T.sage, marginTop: 6, fontWeight: 500 }}>{outcome.owner} is handling this</div>
            )}
          </div>
          <span style={{ fontSize: 14, color: T.soft, flexShrink: 0, paddingTop: 2 }}>{expanded ? '↑' : '↓'}</span>
        </div>
      </button>

      {expanded && !isHandled && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid ' + T.border, paddingTop: 14 }}>
          {outcome.why && <div style={{ fontSize: 14, color: T.mid, lineHeight: 1.7, marginBottom: 12 }}>{outcome.why}</div>}
          {outcome.reassurance && (
            <div style={{ background: T.sageFaint, border: '1px solid ' + T.sageLight, borderRadius: 10, padding: '10px 13px', fontSize: 13, color: T.sage, marginBottom: 14, lineHeight: 1.55, fontStyle: 'italic' }}>
              {outcome.reassurance}
            </div>
          )}
          {outcome.action && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.soft, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Recommended action</div>
              <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.55 }}>{outcome.action}</div>
            </div>
          )}

          {/* Per-status action buttons per spec */}
          <div style={{ display: 'flex', gap: 8 }}>
            {outcome.status === 'needs_owner' && (
              <button onClick={onAssign}
                style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: T.sage, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 46 }}>
                Assign
              </button>
            )}
            {outcome.status === 'not_started' && (
              <>
                <button onClick={onStart}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: T.blueFaint, color: T.blue, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 46 }}>
                  Start
                </button>
                <button onClick={onAssign}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid ' + T.border, background: T.card, color: T.mid, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 46 }}>
                  Assign
                </button>
              </>
            )}
            {outcome.status === 'in_progress' && (
              <button onClick={onHandled}
                style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: T.sage, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 46 }}>
                Mark handled
              </button>
            )}
          </div>
          {showOwner && <OwnerSelector onSave={onAssignSave} onClose={onAssignClose} />}
        </div>
      )}

      {isHandled && expanded && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid ' + T.border, paddingTop: 14 }}>
          <div style={{ padding: '12px', borderRadius: 10, background: T.sageFaint, border: '1px solid ' + T.sageLight, fontSize: 14, fontWeight: 700, color: T.sage, textAlign: 'center' }}>
            This is handled
          </div>
        </div>
      )}
    </div>
  );
}

// ── REASSURANCE BANNER ─────────────────────────────────────────────────────────
function ReassuranceBanner({ outcomes, isReturn }) {
  var handledCount = outcomes.filter(function(o) { return o.status === 'handled'; }).length;
  var needsOwner = outcomes.filter(function(o) { return o.status === 'needs_owner'; }).length;
  var criticalHandled = outcomes.filter(function(o) { return o.priority === 'critical' && o.status === 'handled'; }).length;
  var criticalTotal = outcomes.filter(function(o) { return o.priority === 'critical'; }).length;

  var text, color, bg, border;
  if (isReturn) {
    text = "You're still on track.";
    color = T.sage; bg = T.sageFaint; border = T.sageLight;
  } else if (criticalTotal > 0 && criticalHandled === criticalTotal) {
    text = "You're on track. Nothing urgent is missing right now.";
    color = T.sage; bg = T.sageFaint; border = T.sageLight;
  } else if (needsOwner > 0) {
    text = 'Some important items still need an owner.';
    color = T.amber; bg = T.amberFaint; border = T.amberBorder;
  } else {
    text = "You're on track.";
    color = T.sage; bg = T.sageFaint; border = T.sageLight;
  }

  return (
    <div style={{ background: bg, border: '1px solid ' + border, borderRadius: 13, padding: '14px 18px', marginBottom: 18 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: color, marginBottom: 4 }}>{text}</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
        {handledCount > 0 && <span style={{ fontSize: 12, color: T.sage }}><b>{handledCount}</b> handled</span>}
        {needsOwner > 0 && <span style={{ fontSize: 12, color: T.amber }}><b>{needsOwner}</b> need an owner</span>}
        {outcomes.filter(function(o) { return o.status === 'not_started'; }).length > 0 && (
          <span style={{ fontSize: 12, color: T.soft }}><b>{outcomes.filter(function(o) { return o.status === 'not_started'; }).length}</b> not started</span>
        )}
      </div>
    </div>
  );
}

// ── PRIMARY CTA ────────────────────────────────────────────────────────────────
function PrimaryCTA({ outcomes, onScrollTo }) {
  var next = outcomes.findIndex(function(o) { return o.status !== 'handled'; });
  var allHandled = outcomes.every(function(o) { return o.status === 'handled'; });

  if (allHandled) {
    return (
      <div style={{ background: T.sageFaint, border: '1px solid ' + T.sageLight, borderRadius: 13, padding: 18, marginBottom: 10, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.sage, marginBottom: 4 }}>You're in a good place for now.</div>
        <div style={{ fontSize: 13, color: T.mid, lineHeight: 1.6 }}>Nothing urgent is missing. We'll guide you through what comes next when you're ready.</div>
      </div>
    );
  }

  return (
    <button onClick={function() { onScrollTo(next); }}
      style={{ width: '100%', padding: '16px', borderRadius: 13, border: 'none', background: T.sage, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', marginBottom: 10, minHeight: 54 }}>
      Start here — we'll guide you
    </button>
  );
}

// ── COLLAPSED NEXT SECTION ─────────────────────────────────────────────────────
function CollapsedNextSection() {
  var s = useState(false); var open = s[0]; var setOpen = s[1];
  var items = ['Gather important documents', 'Begin service planning', 'Contact an estate attorney'];
  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={function() { setOpen(!open); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.subtle, borderRadius: 12, padding: '12px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minHeight: 48 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.mid }}>Up next</span>
        <span style={{ fontSize: 13, color: T.soft }}>{open ? '↑' : '↓'}</span>
      </button>
      {open && items.map(function(t, i) {
        return <div key={i} style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: '12px 16px', marginTop: 6, fontSize: 13.5, color: T.mid }}>{t}</div>;
      })}
    </div>
  );
}

// ── PAUSE STATE ────────────────────────────────────────────────────────────────
function shouldShowPause(outcomes, interactionCount) {
  var handled = outcomes.filter(function(o) { return o.status === 'handled'; }).length;
  return handled >= 1 || interactionCount >= 2;
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function UrgentPage() {
  var s0 = useState('loading'); var step = s0[0]; var setStep = s0[1];
  var s1 = useState(null); var situation = s1[0]; var setSituation = s1[1];
  var s2 = useState(null); var location = s2[0]; var setLocation = s2[1];
  var s3 = useState(''); var firstName = s3[0]; var setFirstName = s3[1];
  var s4 = useState(null); var role = s4[0]; var setRole = s4[1];
  var s5 = useState([]); var outcomes = s5[0]; var setOutcomes = s5[1];
  var s6 = useState(null); var estateId = s6[0]; var setEstateId = s6[1];
  var s7 = useState(false); var saving = s7[0]; var setSaving = s7[1];
  var s8 = useState(null); var user = s8[0]; var setUser = s8[1];
  var s9 = useState(-1); var expanded = s9[0]; var setExpanded = s9[1];
  var s10 = useState(-1); var showOwner = s10[0]; var setShowOwner = s10[1];
  var s11 = useState(''); var toast = s11[0]; var setToast = s11[1];
  var s12 = useState({}); var lastActions = s12[0]; var setLastActions = s12[1];
  var s13 = useState(0); var interactions = s13[0]; var setInteractions = s13[1];
  var s14 = useState(false); var isReturn = s14[0]; var setIsReturn = s14[1];

  // Persist on every change
  useEffect(function() {
    if (step === 'loading') return;
    save({ step: step, situation: situation, location: location, firstName: firstName, role: role, estateId: estateId, outcomes: outcomes });
  }, [step, situation, location, firstName, role, estateId, outcomes]);

  // Load on mount
  useEffect(function() {
    sb.auth.getSession().then(function(r) {
      if (r.data && r.data.session) setUser(r.data.session.user);
    });
    var saved = load();
    if (saved && saved.step && saved.step !== 0 && saved.step !== 'loading') {
      setSituation(saved.situation || null);
      setLocation(saved.location || null);
      setFirstName(saved.firstName || '');
      setRole(saved.role || null);
      setEstateId(saved.estateId || null);
      if (saved.outcomes && saved.outcomes.length > 0) {
        setOutcomes(saved.outcomes);
        setIsReturn(saved.step === 'results');
      }
      setStep(saved.step);
    } else {
      setStep(0);
    }
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(function() { setToast(''); }, 2200);
  }

  function back() { setStep(function(s) { return typeof s === 'number' ? Math.max(0, s - 1) : 0; }); }

  function updateOutcome(i, updates) {
    setOutcomes(function(prev) {
      return prev.map(function(o, idx) { return idx === i ? Object.assign({}, o, updates) : o; });
    });
    setExpanded(-1);
    setShowOwner(-1);
    setInteractions(function(n) { return n + 1; });
  }

  function handleAssignSave(i, ownerName) {
    var newStatus = outcomes[i].status === 'needs_owner' ? 'in_progress' : outcomes[i].status;
    updateOutcome(i, { owner: ownerName, status: 'in_progress' });
    setLastActions(function(prev) { var n = Object.assign({}, prev); n[i] = 'assigned'; return n; });
    showToast('Assigned.');
    // Persist to DB if estateId exists
    if (estateId && outcomes[i].dbId) {
      sb.from('outcomes').update({ owner_label: ownerName, status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', outcomes[i].dbId).then(function() {});
    }
  }

  function handleStart(i) {
    updateOutcome(i, { status: 'in_progress' });
    showToast('Started.');
    if (estateId && outcomes[i].dbId) {
      sb.from('outcomes').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', outcomes[i].dbId).then(function() {});
    }
  }

  function handleHandled(i) {
    updateOutcome(i, { status: 'handled' });
    setLastActions(function(prev) { var n = Object.assign({}, prev); n[i] = 'handled'; return n; });
    showToast('This is handled.');
    if (estateId && outcomes[i].dbId) {
      sb.from('outcomes').update({ status: 'handled', updated_at: new Date().toISOString() }).eq('id', outcomes[i].dbId).then(function() {});
    }
  }

  function scrollToCard(i) {
    setExpanded(i);
    setTimeout(function() {
      var el = document.getElementById('outcome-' + i);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  }

  async function createPlan() {
    setSaving(true);
    var generated = buildOutcomes(location);
    setOutcomes(generated);
    try {
      var res = await sb.from('workflows').insert([{
        user_id: user ? user.id : null,
        deceased_name: firstName.trim() || 'my loved one',
        deceased_first_name: firstName.trim() || null,
        coordinator_name: user ? ((user.user_metadata && user.user_metadata.full_name) || user.email) : null,
        coordinator_email: user ? user.email : null,
        status: 'urgent_first_steps_generated',
        path: 'red', mode: 'red',
        relationship_to_deceased: role,
        urgent_situation: situation,
        estate_name: (firstName.trim() || 'Loved one') + ' estate',
      }]).select().single();

      if (res.data) {
        var wid = res.data.id;
        setEstateId(wid);
        var outcomeRows = generated.map(function(o, i) {
          return { estate_id: wid, title: o.title, description: o.description, why_it_matters: o.why, recommended_action: o.action, reassurance: o.reassurance, owner_label: null, status: o.status, priority: o.priority, timeframe: o.priority === 'critical' ? 'today' : 'today', category: o.id, position: i, source: 'system' };
        });
        var inserted = await sb.from('outcomes').insert(outcomeRows).select();
        if (inserted.data) {
          var dbIds = inserted.data.map(function(r) { return r.id; });
          setOutcomes(function(prev) {
            return prev.map(function(o, i) { return Object.assign({}, o, { dbId: dbIds[i] }); });
          });
        }
      }
    } catch (e) { console.error('Plan error:', e); }
    setSaving(false);
    setStep('results');
  }

  var allHandled = outcomes.length > 0 && outcomes.every(function(o) { return o.status === 'handled'; });
  var showPause = shouldShowPause(outcomes, interactions) && !allHandled;
  var name = firstName.trim() || 'your loved one';

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <div style={{ color: T.soft, fontSize: 14 }}>Loading...</div>
    </div>
  );

  // ── SCREEN 0: Intro ────────────────────────────────────────────────────────
  if (step === 0) return (
    <Shell step={0} total={4} bare>
      <div style={{ textAlign: 'center', paddingTop: 56 }}>
        <div style={{ fontSize: 56, marginBottom: 28 }}>🕊️</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: T.ink, lineHeight: 1.3, marginBottom: 18 }}>We're so sorry.</div>
        <div style={{ fontSize: 17, color: T.mid, lineHeight: 1.8, maxWidth: 360, margin: '0 auto 44px' }}>
          We'll help you figure out what needs to happen next.
        </div>
        <div style={{ maxWidth: 380, margin: '0 auto' }}>
          <PrimaryBtn label="Start" onClick={function() { setStep(1); }} />
          <div style={{ fontSize: 13, color: T.soft, marginTop: 12, lineHeight: 1.6 }}>Takes less than two minutes. You can stop anytime.</div>
        </div>
      </div>
    </Shell>
  );

  // ── SCREEN 1: What happened ────────────────────────────────────────────────
  if (step === 1) return (
    <Shell step={1} total={4} onBack={back}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: T.ink, marginBottom: 10, lineHeight: 1.3 }}>What happened?</div>
      <div style={{ height: 20 }} />
      <Option label="Someone has passed away" selected={situation === 'passed'} onClick={function() { setSituation('passed'); }} />
      <Option label="I'm helping someone who just lost someone" sub="A family member or friend asked for your help" selected={situation === 'helping'} onClick={function() { setSituation('helping'); }} />
      <Option label="I'm not sure what to do" sub="Something happened and I need guidance" selected={situation === 'unsure'} onClick={function() { setSituation('unsure'); }} />
      <div style={{ height: 20 }} />
      <PrimaryBtn label="Continue" onClick={function() { setStep(2); }} disabled={!situation} />
    </Shell>
  );

  // ── SCREEN 2: Where ────────────────────────────────────────────────────────
  if (step === 2) return (
    <Shell step={2} total={4} onBack={back}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: T.ink, marginBottom: 10, lineHeight: 1.3 }}>Where did this happen?</div>
      <div style={{ height: 20 }} />
      <Option label="At home" selected={location === 'home'} onClick={function() { setLocation('home'); }} />
      <Option label="At a hospital" selected={location === 'hospital'} onClick={function() { setLocation('hospital'); }} />
      <Option label="In hospice care" selected={location === 'hospice'} onClick={function() { setLocation('hospice'); }} />
      <Option label="In a facility" sub="Nursing home, assisted living, memory care" selected={location === 'facility'} onClick={function() { setLocation('facility'); }} />
      <Option label="I'm not sure" selected={location === 'unknown'} onClick={function() { setLocation('unknown'); }} />
      <div style={{ height: 20 }} />
      <PrimaryBtn label="Continue" onClick={function() { setStep(3); }} disabled={!location} />
    </Shell>
  );

  // ── SCREEN 3: Who ──────────────────────────────────────────────────────────
  if (step === 3) return (
    <Shell step={3} total={4} onBack={back}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: T.ink, marginBottom: 10, lineHeight: 1.3 }}>Who passed away?</div>
      <div style={{ fontSize: 15, color: T.soft, marginBottom: 24 }}>First name (optional)</div>
      <input value={firstName} onChange={function(e) { setFirstName(e.target.value); }} placeholder="First name" autoFocus
        style={{ width: '100%', padding: '16px', borderRadius: 13, border: '1.5px solid ' + T.border, fontFamily: 'Georgia, serif', fontSize: 17, color: T.ink, outline: 'none', boxSizing: 'border-box', background: T.card, minHeight: 56, marginBottom: 16 }} />
      <PrimaryBtn label="Continue" onClick={function() { setStep(4); }} />
      <GhostBtn label="Skip" onClick={function() { setFirstName(''); setStep(4); }} />
    </Shell>
  );

  // ── SCREEN 4: Role ─────────────────────────────────────────────────────────
  if (step === 4) return (
    <Shell step={4} total={4} onBack={back}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: T.ink, marginBottom: 10, lineHeight: 1.3 }}>Who are you in this?</div>
      <div style={{ height: 20 }} />
      {[['spouse','Spouse or partner'],['child','Child'],['sibling','Sibling'],['parent','Parent'],['executor','Executor'],['friend','Friend'],['other','Other']].map(function(r) {
        return <Option key={r[0]} label={r[1]} selected={role === r[0]} onClick={function() { setRole(r[0]); }} />;
      })}
      <div style={{ height: 20 }} />
      <PrimaryBtn label={saving ? 'Building your plan...' : 'Continue'} onClick={createPlan} disabled={!role || saving} />
    </Shell>
  );

  // ── RESULTS: First 24 Hours Command View ───────────────────────────────────
  if (step === 'results') return (
    <Shell step={5} total={4} bare>
      <Toast msg={toast} />

      <ReassuranceBanner outcomes={outcomes} isReturn={isReturn} />

      <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Here's what matters first</div>

      {outcomes.map(function(outcome, i) {
        return (
          <div key={outcome.id} id={'outcome-' + i}>
            <OutcomeCard
              outcome={outcome}
              index={i}
              expanded={expanded === i}
              showOwner={showOwner === i}
              lastAction={lastActions[i]}
              onToggle={function() { setExpanded(expanded === i ? -1 : i); setShowOwner(-1); }}
              onAssign={function() { setShowOwner(i); setExpanded(i); }}
              onAssignClose={function() { setShowOwner(-1); }}
              onAssignSave={function(name) { handleAssignSave(i, name); }}
              onStart={function() { handleStart(i); }}
              onHandled={function() { handleHandled(i); }}
            />
          </div>
        );
      })}

      <CollapsedNextSection />

      {/* Pause state */}
      {showPause && (
        <div style={{ background: T.sageFaint, border: '1px solid ' + T.sageLight, borderRadius: 13, padding: '14px 16px', marginBottom: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.sage, marginBottom: 4 }}>You're in a good place for now.</div>
          <div style={{ fontSize: 13, color: T.mid, lineHeight: 1.6 }}>Nothing urgent is missing. Take a breath when you need to.</div>
        </div>
      )}

      <PrimaryCTA outcomes={outcomes} onScrollTo={scrollToCard} />

      <button onClick={function() { window.location.href = estateId ? '/estate?id=' + estateId : '/'; }}
        style={{ width: '100%', padding: '14px', borderRadius: 13, border: '1.5px solid ' + T.border, background: T.card, color: T.mid, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 50 }}>
        Get help coordinating
      </button>

      <div style={{ fontSize: 11.5, color: T.soft, textAlign: 'center', marginTop: 16, lineHeight: 1.65 }}>
        Your plan is saved. Come back anytime and pick up where you left off.
      </div>
    </Shell>
  );

  return null;
}
