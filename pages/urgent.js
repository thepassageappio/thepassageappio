// pages/urgent.js
// Sprint 13 — guided sequence, single dominant next step
// Page is NOT a dashboard. It is a guided support system.
// One primary item visible. Everything else falls away.

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
  amber: '#b07d2e', amberFaint: '#fdf8ee',
};

// ── OUTCOME ENGINE ─────────────────────────────────────────────────────────────
// Always exactly 3. Order: funeral (now) → family (today) → home (next)
function buildOutcomes(location) {
  var isHome = location === 'home' || location === 'unexpected';
  var isFacility = location === 'hospital' || location === 'facility' || location === 'hospice';

  var third = isHome ? {
    id: 'home', phase: 'NEXT', title: 'Secure home, pets, and vehicle',
    support: 'This prevents avoidable issues.',
    why: 'Once word spreads, the home should be secured. Pets need care and valuables should be protected.',
    action: 'Arrange for someone to check the home and care for any pets.',
    reassurance: 'This can wait a few hours. Handle the more urgent items first.',
    priority: 'high',
  } : isFacility ? {
    id: 'facility', phase: 'NEXT', title: 'Confirm what the facility will handle',
    support: 'Reduces confusion and duplicate effort.',
    why: 'Hospitals and facilities handle much of the official paperwork. Knowing what they cover prevents duplicate calls.',
    action: 'Speak with a patient advocate or charge nurse before you leave.',
    reassurance: 'The facility staff are experienced with this. They will guide you.',
    priority: 'high',
  } : {
    id: 'coordinator', phase: 'NEXT', title: 'Confirm who is coordinating',
    support: 'One point of contact prevents confusion.',
    why: 'Having one person be the point of contact prevents duplicate calls and conflicting decisions.',
    action: 'Decide who is the primary coordinator and let close family know.',
    reassurance: 'This does not have to be you alone.',
    priority: 'high',
  };

  return [
    {
      id: 'funeral', phase: 'NOW', title: 'Funeral arrangements',
      support: 'This should be started soon.',
      why: 'The funeral home coordinates transportation, paperwork, and all arrangements. This is the most time-sensitive decision in the first 24 hours.',
      action: isFacility
        ? 'Ask the facility if they have a funeral home they work with, or choose one yourself.'
        : 'Search for a local funeral home and call them today.',
      reassurance: 'Most families contact a funeral home within the first 24 hours.',
      priority: 'critical', owner: null, status: 'needs_owner',
    },
    {
      id: 'family', phase: 'TODAY', title: 'Notify immediate family',
      support: 'Close family should hear directly first.',
      why: 'Close family should hear directly from you before any broader announcement. One of the most important first calls.',
      action: 'Start with the closest family members. A short call is all that is needed right now.',
      reassurance: 'You do not need all the details before you call. Just let them know.',
      priority: 'critical', owner: null, status: 'needs_owner',
    },
    Object.assign({}, third, { owner: null, status: 'needs_owner' }),
  ];
}

// ── PERSISTENCE ────────────────────────────────────────────────────────────────
function save(d) { try { localStorage.setItem('psg_urgent', JSON.stringify(d)); } catch(e) {} }
function load() { try { var r = localStorage.getItem('psg_urgent'); return r ? JSON.parse(r) : null; } catch(e) { return null; } }

// ── SHELL ──────────────────────────────────────────────────────────────────────
function Shell({ step, total, onBack, bare, children }) {
  return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif' }}>
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.card, borderBottom: '1px solid ' + T.border }}>
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
            {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 12, color: T.soft, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>Back</button>}
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
function Btn({ label, onClick, disabled, variant }) {
  var bg = variant === 'ghost' ? 'none' : T.sage;
  var color = variant === 'ghost' ? T.soft : '#fff';
  var border = variant === 'ghost' ? 'none' : 'none';
  return (
    <button onClick={onClick} disabled={!!disabled}
      style={{ width: '100%', padding: variant === 'ghost' ? '12px' : '16px', borderRadius: 13, border: border, background: disabled ? T.border : bg, color: disabled ? T.soft : color, fontSize: variant === 'ghost' ? 14 : 16, fontWeight: variant === 'ghost' ? 500 : 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: variant === 'ghost' ? 'inherit' : 'Georgia, serif', minHeight: variant === 'ghost' ? 44 : 54, transition: 'all 0.15s', textDecoration: variant === 'ghost' ? 'underline' : 'none', textDecorationColor: T.border }}>
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

// ── 1. REASSURANCE BLOCK ───────────────────────────────────────────────────────
// Dominant. Anchors emotional state. Always shows both lines.
// No variation unless critical owner missing.
function ReassuranceBlock({ outcomes, isReturn }) {
  var criticalNeedsOwner = outcomes.filter(function(o) { return o.priority === 'critical' && o.status === 'needs_owner'; }).length;

  var headline = criticalNeedsOwner > 0
    ? "You're still on track."
    : "You're on track.";
  var sub = criticalNeedsOwner > 0
    ? "A few things need an owner before they're fully handled."
    : "Nothing urgent is missing right now.";

  return (
    <div style={{ paddingTop: 16, paddingBottom: 32, borderBottom: '1px solid ' + T.border, marginBottom: 30 }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: T.ink, lineHeight: 1.25, marginBottom: 10, fontWeight: 400 }}>{headline}</div>
      <div style={{ fontSize: 15, color: T.mid, lineHeight: 1.75, marginBottom: 4 }}>{sub}</div>
      <div style={{ fontSize: 15, color: T.mid, lineHeight: 1.75 }}>We'll walk you through what matters next.</div>
    </div>
  );
}

// ── 2. PRIMARY FOCUS CARD ─────────────────────────────────────────────────────
// ONLY ONE outcome. Dominant. "Start here" is the largest label on the page.
// One action. No scanning. No competing elements.
function PrimaryFocusCard({ outcome, onStart, onAssign, onAssignSave, onAssignClose, onHandled, showAssign, feedback }) {
  if (!outcome) return null;
  var isHandled = outcome.status === 'handled';

  return (
    <div style={{ background: T.card, border: '1.5px solid ' + (isHandled ? T.sageLight : T.border), borderRadius: 20, overflow: 'hidden', marginBottom: 28, transition: 'opacity 0.25s ease', opacity: isHandled ? 0.82 : 1 }}>

      {/* "Start here" — largest label on the page. Instruction, not category. */}
      <div style={{ background: isHandled ? T.sageFaint : T.sage, padding: '14px 24px 12px' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: isHandled ? T.sage : '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {isHandled ? 'Handled' : 'Start here'}
        </span>
      </div>

      <div style={{ padding: '26px 24px 28px' }}>
        {/* Title */}
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: T.ink, marginBottom: 6, lineHeight: 1.25 }}>{outcome.title}</div>
        <div style={{ fontSize: 14, color: T.mid, marginBottom: 24, lineHeight: 1.65 }}>{outcome.support}</div>

        {/* Why it matters — no label, just the content */}
        {!isHandled && (
          <div style={{ background: T.subtle, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 13.5, color: T.mid, lineHeight: 1.7 }}>{outcome.why}</div>
          </div>
        )}

        {/* What to do */}
        {!isHandled && outcome.action && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.soft, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>What to do</div>
            <div style={{ fontSize: 14.5, color: T.ink, lineHeight: 1.65, fontWeight: 500 }}>{outcome.action}</div>
          </div>
        )}

        {/* Owner — always visible, no ambiguity */}
        {!isHandled && (
          <div style={{ marginBottom: 22, padding: '13px 16px', background: outcome.owner ? T.sageFaint : T.amberFaint, border: '1px solid ' + (outcome.owner ? T.sageLight : T.amber + '40'), borderRadius: 11 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: outcome.owner ? T.sage : T.amber, lineHeight: 1.5 }}>
              {outcome.owner
                ? outcome.owner + " is handling this. You don't need to take this on."
                : 'No one is handling this yet.'}
            </div>
          </div>
        )}

        {/* Persistent started feedback */}
        {feedback === 'started' && !isHandled && (
          <div style={{ background: T.sageFaint, border: '1px solid ' + T.sageLight, borderRadius: 10, padding: '13px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.sage, marginBottom: 3 }}>You've started this.</div>
            <div style={{ fontSize: 13, color: T.mid }}>We'll keep track of it here.</div>
          </div>
        )}

        {/* Handled — close the loop completely */}
        {isHandled && (
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: T.sage, marginBottom: 8 }}>That's taken care of.</div>
            <div style={{ fontSize: 14, color: T.mid, lineHeight: 1.65 }}>Nothing else is needed here.</div>
          </div>
        )}

        {/* Single primary action — one button, no alternatives visible */}
        {!isHandled && !showAssign && (
          <div style={{ marginTop: 6 }}>
            {outcome.status === 'needs_owner' && <Btn label="Assign owner" onClick={onAssign} />}
            {outcome.status === 'not_started' && <Btn label="Start" onClick={onStart} />}
            {outcome.status === 'in_progress' && <Btn label="Mark as handled" onClick={onHandled} />}
          </div>
        )}

        {/* Owner selector */}
        {showAssign && (
          <div style={{ background: T.subtle, borderRadius: 12, padding: 16, marginTop: 8 }}>
            <div style={{ fontSize: 14, color: T.mid, marginBottom: 12, lineHeight: 1.55 }}>Who will handle this? Once assigned, it's off your plate.</div>
            <InlineOwner onSave={onAssignSave} onClose={onAssignClose} />
          </div>
        )}

        {/* Reassurance — only when unowned */}
        {!isHandled && !outcome.owner && outcome.reassurance && (
          <div style={{ fontSize: 12, color: T.soft, marginTop: 14, lineHeight: 1.65, fontStyle: 'italic', textAlign: 'center' }}>{outcome.reassurance}</div>
        )}
      </div>
    </div>
  );
}
// ── INLINE OWNER ───────────────────────────────────────────────────────────────
function InlineOwner({ onSave, onClose }) {
  var s = useState(''); var name = s[0]; var setName = s[1];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={name} onChange={function(e) { setName(e.target.value); }} placeholder="Their name" autoFocus
          style={{ flex: 1, padding: '11px 13px', borderRadius: 10, border: '1.5px solid ' + T.border, fontFamily: 'inherit', fontSize: 14, color: T.ink, outline: 'none', background: T.card, minHeight: 46, boxSizing: 'border-box' }} />
        <button onClick={function() { if (name.trim()) onSave(name.trim()); }}
          style={{ padding: '11px 18px', borderRadius: 10, border: 'none', background: T.sage, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 46, whiteSpace: 'nowrap' }}>
          Assign
        </button>
      </div>
      <button onClick={function() { onSave('You'); }}
        style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid ' + T.sageLight, background: T.sageFaint, color: T.sage, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 42, marginBottom: 6 }}>
        Assign to me
      </button>
      <button onClick={onClose}
        style={{ width: '100%', padding: '6px', borderRadius: 10, border: 'none', background: 'none', color: T.soft, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
        Cancel
      </button>
    </div>
  );
}

// ── 3. SECONDARY COLLAPSED GROUP ──────────────────────────────────────────────
// Everything else grouped, visually minimized. Feels non-urgent.
// No buttons visible until expanded.
function SecondaryCollapsedGroup({ outcomes }) {
  var s = useState(false); var open = s[0]; var setOpen = s[1];
  if (!outcomes || outcomes.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <button onClick={function() { setOpen(!open); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '8px 0', minHeight: 44 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.soft, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Coming up</span>
        <span style={{ fontSize: 12, color: T.soft }}>{open ? 'Hide ↑' : 'Show ↓'}</span>
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          {outcomes.map(function(o) {
            return (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: T.card, border: '1px solid ' + T.border, borderRadius: 12, marginBottom: 8, opacity: 0.6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.soft, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 38 }}>{o.phase}</span>
                <div>
                  <div style={{ fontSize: 13, color: T.mid, fontWeight: 500 }}>{o.title}</div>
                  <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>{o.support}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 5. PAUSE BLOCK ─────────────────────────────────────────────────────────────
// Final state. Not a suggestion. No hedging. Explicit permission to stop.
function PauseBlock() {
  return (
    <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 16, padding: '24px 22px', marginBottom: 24, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: T.ink, marginBottom: 8, lineHeight: 1.3 }}>
        You're in a good place for now.<br />Nothing urgent is being missed.
      </div>
      <div style={{ fontSize: 15, color: T.mid, lineHeight: 1.75, marginTop: 10 }}>
        You can stop here.
      </div>
    </div>
  );
}

// ── 6. PRIMARY CTA ─────────────────────────────────────────────────────────────
// Single. Context-aware. Short label. Support text below.
function PrimaryCTA({ primaryHandled, onStart }) {
  if (primaryHandled) {
    return (
      <div style={{ padding: '18px 20px', borderRadius: 13, background: T.sageFaint, border: '1px solid ' + T.sageLight, textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: T.sage }}>You're good for now.</div>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={onStart}
        style={{ width: '100%', padding: '18px', borderRadius: 13, border: 'none', background: T.sage, color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', minHeight: 58 }}>
        Start here
      </button>
      <div style={{ fontSize: 13, color: T.soft, textAlign: 'center', marginTop: 10 }}>We'll guide you step by step.</div>
    </div>
  );
}

// ── FLOW SCREENS (unchanged from spec) ────────────────────────────────────────
function FlowScreen({ step, total, onBack, headline, children }) {
  return (
    <Shell step={step} total={total} onBack={onBack}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: T.ink, marginBottom: 10, lineHeight: 1.3 }}>{headline}</div>
      <div style={{ height: 20 }} />
      {children}
    </Shell>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
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
  var s9 = useState(false); var showAssign = s9[0]; var setShowAssign = s9[1];
  var s10 = useState(null); var primaryFeedback = s10[0]; var setPrimaryFeedback = s10[1];
  var s11 = useState(0); var interactions = s11[0]; var setInteractions = s11[1];
  var s12 = useState(false); var isReturn = s12[0]; var setIsReturn = s12[1];

  // Persist on every state change
  useEffect(function() {
    if (step === 'loading') return;
    save({ step: step, situation: situation, location: location, firstName: firstName, role: role, estateId: estateId, outcomes: outcomes });
  }, [step, situation, location, firstName, role, estateId, outcomes]);

  // Load on mount — resume or start fresh
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
        if (saved.step === 'results') setIsReturn(true);
      }
      setStep(saved.step);
    } else {
      setStep(0);
    }
  }, []);

  function back() { setStep(function(s) { return typeof s === 'number' ? Math.max(0, s - 1) : 0; }); }

  function updatePrimary(updates) {
    setOutcomes(function(prev) {
      return prev.map(function(o, i) { return i === 0 ? Object.assign({}, o, updates) : o; });
    });
    setInteractions(function(n) { return n + 1; });
    // Persist to DB
    if (estateId && outcomes[0] && outcomes[0].dbId) {
      sb.from('outcomes').update(Object.assign({ updated_at: new Date().toISOString() }, updates)).eq('id', outcomes[0].dbId).then(function() {});
    }
  }

  function handleStart() {
    updatePrimary({ status: 'in_progress' });
    setPrimaryFeedback('started');
  }

  function handleAssignSave(ownerName) {
    updatePrimary({ owner: ownerName, status: 'in_progress' });
    setPrimaryFeedback('assigned');
    setShowAssign(false);
  }

  function handleHandled() {
    updatePrimary({ status: 'handled' });
    setPrimaryFeedback('handled');
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
        var rows = generated.map(function(o, i) {
          return { estate_id: wid, title: o.title, description: o.support, why_it_matters: o.why, recommended_action: o.action, reassurance: o.reassurance, owner_label: null, status: 'needs_owner', priority: o.priority, timeframe: o.priority === 'critical' ? 'today' : 'today', category: o.id, position: i, source: 'system' };
        });
        var ins = await sb.from('outcomes').insert(rows).select();
        if (ins.data) {
          var ids = ins.data.map(function(r) { return r.id; });
          setOutcomes(function(prev) {
            return prev.map(function(o, i) { return Object.assign({}, o, { dbId: ids[i] }); });
          });
        }
      }
    } catch (e) { console.error('Plan error:', e); }
    setSaving(false);
    setStep('results');
  }

  // Primary = index 0 (always "Now")
  // Secondary = index 1+ (Today, Next)
  var primary = outcomes[0] || null;
  var secondary = outcomes.slice(1);
  var primaryHandled = primary && primary.status === 'handled';
  var handledCount = outcomes.filter(function(o) { return o.status === 'handled'; }).length;
  var showPause = handledCount >= 1 || interactions >= 2;

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <div style={{ color: T.soft, fontSize: 14 }}>Loading...</div>
    </div>
  );

  // ── SCREEN 0: Intro ──────────────────────────────────────────────────────────
  if (step === 0) return (
    <Shell step={0} total={4} bare>
      <div style={{ textAlign: 'center', paddingTop: 56 }}>
        <div style={{ fontSize: 56, marginBottom: 28 }}>🕊️</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: T.ink, lineHeight: 1.3, marginBottom: 18 }}>We're so sorry.</div>
        <div style={{ fontSize: 17, color: T.mid, lineHeight: 1.8, maxWidth: 360, margin: '0 auto 44px' }}>
          We'll help you figure out what needs to happen next.
        </div>
        <div style={{ maxWidth: 380, margin: '0 auto' }}>
          <Btn label="Start" onClick={function() { setStep(1); }} />
          <div style={{ fontSize: 13, color: T.soft, marginTop: 12, lineHeight: 1.6 }}>Takes less than two minutes. You can stop anytime.</div>
        </div>
      </div>
    </Shell>
  );

  // ── SCREEN 1: Event ──────────────────────────────────────────────────────────
  if (step === 1) return (
    <FlowScreen step={1} total={4} onBack={back} headline="What happened?">
      <Option label="Someone has passed away" selected={situation === 'passed'} onClick={function() { setSituation('passed'); }} />
      <Option label="I'm helping someone who just lost someone" sub="A family member or friend asked for your help" selected={situation === 'helping'} onClick={function() { setSituation('helping'); }} />
      <Option label="I'm not sure what to do" sub="Something happened and I need guidance" selected={situation === 'unsure'} onClick={function() { setSituation('unsure'); }} />
      <div style={{ height: 20 }} />
      <Btn label="Continue" onClick={function() { setStep(2); }} disabled={!situation} />
    </FlowScreen>
  );

  // ── SCREEN 2: Location ───────────────────────────────────────────────────────
  if (step === 2) return (
    <FlowScreen step={2} total={4} onBack={back} headline="Where did this happen?">
      <Option label="At home" selected={location === 'home'} onClick={function() { setLocation('home'); }} />
      <Option label="At a hospital" selected={location === 'hospital'} onClick={function() { setLocation('hospital'); }} />
      <Option label="In hospice care" selected={location === 'hospice'} onClick={function() { setLocation('hospice'); }} />
      <Option label="In a facility" sub="Nursing home, assisted living, memory care" selected={location === 'facility'} onClick={function() { setLocation('facility'); }} />
      <Option label="I'm not sure" selected={location === 'unknown'} onClick={function() { setLocation('unknown'); }} />
      <div style={{ height: 20 }} />
      <Btn label="Continue" onClick={function() { setStep(3); }} disabled={!location} />
    </FlowScreen>
  );

  // ── SCREEN 3: Deceased ───────────────────────────────────────────────────────
  if (step === 3) return (
    <Shell step={3} total={4} onBack={back}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: T.ink, marginBottom: 10, lineHeight: 1.3 }}>Who passed away?</div>
      <div style={{ fontSize: 15, color: T.soft, marginBottom: 24 }}>First name (optional)</div>
      <input value={firstName} onChange={function(e) { setFirstName(e.target.value); }} placeholder="First name" autoFocus
        style={{ width: '100%', padding: '16px', borderRadius: 13, border: '1.5px solid ' + T.border, fontFamily: 'Georgia, serif', fontSize: 17, color: T.ink, outline: 'none', boxSizing: 'border-box', background: T.card, minHeight: 56, marginBottom: 16 }} />
      <Btn label="Continue" onClick={function() { setStep(4); }} />
      <Btn label="Skip" onClick={function() { setFirstName(''); setStep(4); }} variant="ghost" />
    </Shell>
  );

  // ── SCREEN 4: Role ───────────────────────────────────────────────────────────
  if (step === 4) return (
    <FlowScreen step={4} total={4} onBack={back} headline="Who are you in this?">
      {[['spouse','Spouse or partner'],['child','Child'],['sibling','Sibling'],['parent','Parent'],['executor','Executor'],['friend','Friend'],['other','Other']].map(function(r) {
        return <Option key={r[0]} label={r[1]} selected={role === r[0]} onClick={function() { setRole(r[0]); }} />;
      })}
      <div style={{ height: 20 }} />
      <Btn label={saving ? 'Building your plan...' : 'Continue'} onClick={createPlan} disabled={!role || saving} />
    </FlowScreen>
  );

  // ── RESULTS: Guided Support View ─────────────────────────────────────────────
  // Page structure: Reassurance → PrimaryFocus → SecondaryCollapsed → Pause → CTA
  if (step === 'results') return (
    <Shell step={5} total={4} bare>

      {/* 1. REASSURANCE BLOCK — dominant, above everything */}
      <ReassuranceBlock outcomes={outcomes} isReturn={isReturn} />

      {/* 2. PRIMARY FOCUS CARD — only one outcome in full detail */}
      <PrimaryFocusCard
        outcome={primary}
        onStart={handleStart}
        onAssign={function() { setShowAssign(true); }}
        onAssignSave={handleAssignSave}
        onAssignClose={function() { setShowAssign(false); }}
        onHandled={handleHandled}
        showAssign={showAssign}
        feedback={primaryFeedback}
      />

      {/* 3. SECONDARY COLLAPSED GROUP — visually minimized, no buttons visible */}
      <SecondaryCollapsedGroup outcomes={secondary} />

      {/* 5. PAUSE BLOCK — conclusion, explicit permission to stop */}
      {showPause && <PauseBlock />}

      {/* 6. PRIMARY CTA — context-aware, single, never competing */}
      <PrimaryCTA
        primaryHandled={primaryHandled}
        onStart={function() {
          if (primary && primary.status === 'needs_owner') setShowAssign(true);
          else if (primary && primary.status === 'not_started') handleStart();
          else if (primary && primary.status === 'in_progress') handleHandled();
        }}
      />

      <div style={{ fontSize: 12, color: T.soft, textAlign: 'center', marginTop: 4, lineHeight: 1.65 }}>
        Your plan is saved. Come back anytime.
      </div>
    </Shell>
  );

  return null;
}
