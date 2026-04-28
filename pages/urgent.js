// pages/urgent.js
// Sprint 10 — exact spec, state persistence, owner system, status transitions

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

var sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
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

// ─── OUTCOME ENGINE ───────────────────────────────────────────────────────────
// Exactly 3 initial outcomes per spec, with location-aware logic
function buildOutcomes(situation, location, role) {
  var isHome = location === 'home' || location === 'unexpected';
  var isFacility = location === 'hospital' || location === 'facility' || location === 'hospice';
  var isHelper = situation === 'helping';
  var isDecisionMaker = role === 'spouse' || role === 'child' || role === 'executor';

  var outcomes = [];

  // Outcome 1 — always funeral arrangements (critical)
  outcomes.push({
    id: 'funeral',
    title: 'Funeral arrangements',
    description: 'This should be started soon.',
    why: 'The funeral home coordinates transportation, paperwork, and all arrangements. This is the most time-sensitive decision in the first 24 hours.',
    action: isFacility ? 'Ask the facility if they have a funeral home they work with, or choose one yourself.' : 'Search for a local funeral home and call them today.',
    reassurance: 'Most families contact a funeral home within the first 24 hours.',
    owner: isDecisionMaker ? 'You' : null,
    status: isDecisionMaker ? 'not_started' : 'needs_owner',
    priority: 'critical',
    timeframe: 'today',
    category: 'funeral',
  });

  // Outcome 2 — notify immediate family (critical)
  outcomes.push({
    id: 'family',
    title: 'Notify immediate family',
    description: 'Close family should hear directly first.',
    why: 'Close family should hear directly from you before broader announcements. This is one of the most important first calls.',
    action: 'Start with the closest family members — a short call is all that is needed right now.',
    reassurance: 'You do not need to have all the details before you call. Just let them know.',
    owner: null,
    status: 'needs_owner',
    priority: 'critical',
    timeframe: 'today',
    category: 'family',
  });

  // Outcome 3 — situation-specific (high)
  if (isHome) {
    outcomes.push({
      id: 'home',
      title: 'Secure home, pets, and vehicle',
      description: 'This prevents avoidable issues.',
      why: 'Once word spreads, it helps to ensure the home is secured. Pets need care, and valuables should be protected.',
      action: 'Arrange for someone to check the home and care for any pets.',
      reassurance: 'This can wait a few hours — handle the more urgent items first.',
      owner: null,
      status: 'needs_owner',
      priority: 'high',
      timeframe: 'today',
      category: 'property',
    });
  } else if (location === 'hospital' || location === 'facility') {
    outcomes.push({
      id: 'facility',
      title: 'Confirm what the facility will handle',
      description: 'Reduces duplicate effort and confusion.',
      why: 'Hospitals and facilities handle much of the official paperwork. Knowing what they cover prevents duplicate calls and confusion.',
      action: 'Speak with a patient advocate, social worker, or charge nurse before you leave.',
      reassurance: 'The facility staff are experienced with this — they will guide you.',
      owner: isDecisionMaker ? 'You' : null,
      status: isDecisionMaker ? 'not_started' : 'needs_owner',
      priority: 'high',
      timeframe: 'now',
      category: 'medical_legal',
    });
  } else if (location === 'hospice') {
    outcomes.push({
      id: 'hospice',
      title: 'Confirm what hospice will coordinate',
      description: 'Hospice teams handle more than most families realize.',
      why: 'Hospice teams typically have a direct relationship with funeral homes and handle the official confirmation. Knowing what they cover saves time.',
      action: 'Call your hospice coordinator to confirm what they are handling next.',
      reassurance: 'Hospice teams are experienced with this — they will guide you through what comes next.',
      owner: isDecisionMaker ? 'You' : null,
      status: isDecisionMaker ? 'not_started' : 'needs_owner',
      priority: 'high',
      timeframe: 'now',
      category: 'medical_legal',
    });
  } else {
    outcomes.push({
      id: 'coordination',
      title: 'Confirm who is coordinating',
      description: 'One point of contact prevents confusion.',
      why: 'Having one person be the point of contact prevents duplicate calls, conflicting decisions, and confusion in the next few days.',
      action: 'Decide who is the primary coordinator and let close family know.',
      reassurance: 'This does not have to be you alone. Passage can help you share the load.',
      owner: isHelper ? null : 'You',
      status: isHelper ? 'needs_owner' : 'not_started',
      priority: 'high',
      timeframe: 'today',
      category: 'coordination',
    });
  }

  return outcomes;
}

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────
var SESSION_KEY_PREFIX = 'passage_urgent_';

function getSessionKey() {
  if (typeof window === 'undefined') return null;
  var key = localStorage.getItem('passage_session_key');
  if (!key) {
    key = SESSION_KEY_PREFIX + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('passage_session_key', key);
  }
  return key;
}

function saveLocal(data) {
  try { localStorage.setItem('passage_urgent_state', JSON.stringify(data)); } catch (e) {}
}

function loadLocal() {
  try {
    var raw = localStorage.getItem('passage_urgent_state');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function clearLocal() {
  try { localStorage.removeItem('passage_urgent_state'); } catch (e) {}
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Shell({ step, total, onBack, hideProgress, children }) {
  return (
    <div style={{ background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid ' + BORDER, background: CARD }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle, ' + SAGE_LIGHT + ', ' + SAGE + '70)' }} />
          <span style={{ fontSize: 14, color: INK }}>Passage</span>
        </div>
        {!hideProgress && step > 0 && step < 6 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: total }).map(function(_, i) {
                return <div key={i} style={{ width: i < step ? 18 : 7, height: 3, borderRadius: 2, background: i < step ? SAGE : BORDER, transition: 'all 0.25s' }} />;
              })}
            </div>
            {onBack && (
              <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 12, color: SOFT, cursor: 'pointer', fontFamily: 'inherit', padding: 0, minHeight: 44 }}>Back</button>
            )}
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '24px 20px 80px' }}>
        <div style={{ width: '100%', maxWidth: 500 }}>{children}</div>
      </div>
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={!!disabled}
      style={{ width: '100%', padding: '16px', borderRadius: 13, border: 'none', background: disabled ? BORDER : SAGE, color: disabled ? SOFT : '#fff', fontSize: 16, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', minHeight: 52, transition: 'background 0.15s' }}>
      {children}
    </button>
  );
}

function SecondaryBtn({ children, onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', padding: '14px', borderRadius: 13, border: '1.5px solid ' + BORDER, background: CARD, color: MID, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 50, marginTop: 10 }}>
      {children}
    </button>
  );
}

function Option({ label, sublabel, selected, onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 13, border: '1.5px solid ' + (selected ? SAGE : BORDER), background: selected ? SAGE_FAINT : CARD, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 8, minHeight: 56, transition: 'all 0.12s' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: selected ? SAGE : INK, lineHeight: 1.3 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 13, color: SOFT, marginTop: 3, lineHeight: 1.4 }}>{sublabel}</div>}
      </div>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (selected ? SAGE : BORDER), background: selected ? SAGE : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
      </div>
    </button>
  );
}

function InlineAssign({ onAssign, onClose }) {
  var s1 = useState(''); var name = s1[0]; var setName = s1[1];
  return (
    <div style={{ background: SUBTLE, borderRadius: 11, padding: '14px', marginTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Who owns this?</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={name} onChange={function(e) { setName(e.target.value); }} placeholder="Their name"
          style={{ flex: 1, padding: '10px 12px', borderRadius: 9, border: '1.5px solid ' + BORDER, fontFamily: 'inherit', fontSize: 14, color: INK, outline: 'none', background: CARD, minHeight: 44 }} />
        <button onClick={function() { if (name.trim()) onAssign(name.trim()); }}
          style={{ padding: '10px 16px', borderRadius: 9, border: 'none', background: SAGE, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44, whiteSpace: 'nowrap' }}>
          Assign
        </button>
      </div>
      <button onClick={function() { onAssign('You'); }}
        style={{ width: '100%', padding: '9px', borderRadius: 9, border: '1.5px solid ' + SAGE_LIGHT, background: SAGE_FAINT, color: SAGE, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 40 }}>
        Assign to me
      </button>
      <button onClick={onClose}
        style={{ width: '100%', padding: '7px', borderRadius: 9, border: 'none', background: 'none', color: SOFT, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
        Cancel
      </button>
    </div>
  );
}

function OutcomeCard({ outcome, expanded, onToggle, onMarkHandled, onStarted, onAssignOpen, onAssignClose, showAssign, onAssignSave }) {
  var statusColor = outcome.status === 'handled' ? SAGE : outcome.status === 'needs_owner' ? AMBER : outcome.status === 'in_progress' ? '#2563eb' : MID;
  var statusBg = outcome.status === 'handled' ? SAGE_FAINT : outcome.status === 'needs_owner' ? AMBER_FAINT : outcome.status === 'in_progress' ? '#eff6ff' : SUBTLE;
  var statusLabel = outcome.status === 'handled' ? 'Handled' : outcome.status === 'needs_owner' ? 'Needs owner' : outcome.status === 'in_progress' ? 'In progress' : 'Not started';

  return (
    <div style={{ background: CARD, border: '1.5px solid ' + (outcome.status === 'handled' ? SAGE_LIGHT : outcome.status === 'needs_owner' ? AMBER + '60' : BORDER), borderRadius: 14, marginBottom: 10, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <button onClick={onToggle}
        style={{ width: '100%', padding: '16px 18px', cursor: 'pointer', textAlign: 'left', background: 'none', border: 'none', fontFamily: 'inherit', minHeight: 72 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: INK, lineHeight: 1.35, marginBottom: 8 }}>{outcome.title}</div>
            <div style={{ fontSize: 13, color: MID, marginBottom: 8, lineHeight: 1.4 }}>{outcome.description}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Owner</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: outcome.owner ? INK : AMBER, background: outcome.owner ? SUBTLE : AMBER_FAINT, borderRadius: 6, padding: '2px 8px' }}>{outcome.owner || 'Unassigned'}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: statusColor, background: statusBg, borderRadius: 6, padding: '2px 8px' }}>{statusLabel}</span>
              {outcome.timeframe === 'now' && <span style={{ fontSize: 11, fontWeight: 700, color: ROSE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Right now</span>}
            </div>
          </div>
          <div style={{ fontSize: 16, color: SOFT, flexShrink: 0, paddingTop: 2 }}>{expanded ? '↑' : '↓'}</div>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid ' + BORDER }}>
          <div style={{ paddingTop: 14 }}>
            <div style={{ fontSize: 14, color: MID, lineHeight: 1.7, marginBottom: 12 }}>{outcome.why}</div>
            <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 10, padding: '10px 13px', fontSize: 13, color: SAGE, marginBottom: 14, lineHeight: 1.55, fontStyle: 'italic' }}>
              {outcome.reassurance}
            </div>
            {outcome.action && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Recommended action</div>
                <div style={{ fontSize: 14, color: INK, lineHeight: 1.55 }}>{outcome.action}</div>
              </div>
            )}
            {outcome.status !== 'handled' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {outcome.status === 'not_started' && (
                  <button onClick={onStarted}
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
                  {outcome.owner ? 'Change owner' : 'Assign'}
                </button>
              </div>
            )}
            {outcome.status === 'handled' && (
              <div style={{ padding: '12px', borderRadius: 10, background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, fontSize: 14, fontWeight: 700, color: SAGE, textAlign: 'center' }}>
                This is handled
              </div>
            )}
            {showAssign && (
              <InlineAssign onAssign={onAssignSave} onClose={onAssignClose} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
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
  var s10 = useState(-1); var showAssign = s10[0]; var setShowAssign = s10[1];
  var s11 = useState(''); var feedback = s11[0]; var setFeedback = s11[1];

  // Persist state to localStorage on every change
  useEffect(function() {
    if (step === 'loading') return;
    saveLocal({ step: step, situation: situation, location: location, firstName: firstName, role: role, estateId: estateId, outcomes: outcomes });
  }, [step, situation, location, firstName, role, estateId, outcomes]);

  // On mount — restore state or start fresh
  useEffect(function() {
    sb.auth.getSession().then(function(r) {
      if (r.data && r.data.session) setUser(r.data.session.user);
    });
    var saved = loadLocal();
    if (saved && saved.step && saved.step !== 0) {
      setSituation(saved.situation || null);
      setLocation(saved.location || null);
      setFirstName(saved.firstName || '');
      setRole(saved.role || null);
      setEstateId(saved.estateId || null);
      if (saved.outcomes && saved.outcomes.length > 0) setOutcomes(saved.outcomes);
      setStep(saved.step);
    } else {
      setStep(0);
    }
  }, []);

  function back() {
    setStep(function(s) {
      var n = typeof s === 'number' ? s - 1 : 0;
      return Math.max(0, n);
    });
  }

  function updateOutcome(index, updates) {
    setOutcomes(function(prev) {
      return prev.map(function(o, i) { return i === index ? Object.assign({}, o, updates) : o; });
    });
    setExpanded(-1);
    setShowAssign(-1);
    if (updates.status === 'handled') setFeedback('This is handled');
    else if (updates.status === 'in_progress') setFeedback('Marked as in progress');
    else if (updates.owner) setFeedback('Assigned to ' + updates.owner);
    setTimeout(function() { setFeedback(''); }, 2000);
  }

  async function createPlan() {
    setSaving(true);
    var generated = buildOutcomes(situation, location, role);
    setOutcomes(generated);
    try {
      var name = firstName.trim() || 'my loved one';
      var res = await sb.from('workflows').insert([{
        user_id: user ? user.id : null,
        deceased_name: name,
        deceased_first_name: firstName.trim() || null,
        coordinator_name: user ? ((user.user_metadata && user.user_metadata.full_name) || user.email) : null,
        coordinator_email: user ? user.email : null,
        status: 'urgent_first_steps_generated',
        path: 'red',
        relationship_to_deceased: role,
        urgent_situation: situation,
        estate_name: (firstName.trim() || 'Loved one') + ' estate',
      }]).select().single();

      if (res.data) {
        var wid = res.data.id;
        setEstateId(wid);
        // Save outcomes to DB
        var outcomeRows = generated.map(function(o, i) {
          return {
            estate_id: wid,
            title: o.title,
            description: o.description,
            why_it_matters: o.why,
            recommended_action: o.action,
            reassurance: o.reassurance,
            owner_label: o.owner,
            status: o.status,
            priority: o.priority,
            timeframe: o.timeframe,
            category: o.category,
            position: i,
            source: 'system',
          };
        });
        await sb.from('outcomes').insert(outcomeRows);
      }
    } catch (e) { console.error('Plan error:', e); }
    setSaving(false);
    setStep(5);
  }

  // Banner logic per spec
  var handledCount = outcomes.filter(function(o) { return o.status === 'handled'; }).length;
  var needsOwnerCount = outcomes.filter(function(o) { return o.status === 'needs_owner'; }).length;
  var criticalHandled = outcomes.filter(function(o) { return o.priority === 'critical' && o.status === 'handled'; }).length;
  var criticalTotal = outcomes.filter(function(o) { return o.priority === 'critical'; }).length;

  var bannerText = needsOwnerCount > 0
    ? 'Some important items still need an owner.'
    : 'You\'re on track. Nothing urgent is missing right now.';
  var bannerColor = needsOwnerCount > 0 ? AMBER : SAGE;
  var bannerBg = needsOwnerCount > 0 ? AMBER_FAINT : SAGE_FAINT;
  var bannerBorder = needsOwnerCount > 0 ? AMBER + '50' : SAGE_LIGHT;

  // Primary CTA — first non-handled outcome
  var firstIncomplete = outcomes.findIndex(function(o) { return o.status !== 'handled'; });
  var allHandled = handledCount === outcomes.length && outcomes.length > 0;

  var name = firstName.trim() || 'your loved one';

  // Loading state
  if (step === 'loading') return (
    <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <div style={{ color: SOFT, fontSize: 14 }}>Loading...</div>
    </div>
  );

  // ── SCREEN 0: Emotional acknowledgment ──────────────────────────────────────
  if (step === 0) return (
    <Shell step={0} total={4} hideProgress>
      <div style={{ textAlign: 'center', paddingTop: 52 }}>
        <div style={{ fontSize: 56, marginBottom: 28 }}>🕊️</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: INK, lineHeight: 1.3, marginBottom: 18 }}>We're so sorry.</div>
        <div style={{ fontSize: 17, color: MID, lineHeight: 1.8, maxWidth: 360, margin: '0 auto 44px' }}>
          We'll help you figure out what needs to happen next.
        </div>
        <div style={{ maxWidth: 380, margin: '0 auto' }}>
          <PrimaryBtn onClick={function() { setStep(1); }}>Start</PrimaryBtn>
          <div style={{ fontSize: 13, color: SOFT, marginTop: 12, lineHeight: 1.6 }}>Takes less than two minutes. You can stop anytime.</div>
        </div>
      </div>
    </Shell>
  );

  // ── SCREEN 1: What happened ──────────────────────────────────────────────────
  if (step === 1) return (
    <Shell step={1} total={4} onBack={back}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: INK, marginBottom: 10, lineHeight: 1.3 }}>What happened?</div>
      <div style={{ height: 20 }} />
      <Option label="Someone has passed away" selected={situation === 'passed'} onClick={function() { setSituation('passed'); }} />
      <Option label="I'm helping someone who just lost someone" sublabel="A family member or friend asked for your help" selected={situation === 'helping'} onClick={function() { setSituation('helping'); }} />
      <Option label="I'm not sure what to do" sublabel="Something happened and I need guidance" selected={situation === 'unsure'} onClick={function() { setSituation('unsure'); }} />
      <div style={{ height: 20 }} />
      <PrimaryBtn onClick={function() { setStep(2); }} disabled={!situation}>Continue</PrimaryBtn>
    </Shell>
  );

  // ── SCREEN 2: Where ──────────────────────────────────────────────────────────
  if (step === 2) return (
    <Shell step={2} total={4} onBack={back}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: INK, marginBottom: 10, lineHeight: 1.3 }}>Where did this happen?</div>
      <div style={{ height: 20 }} />
      <Option label="At home" selected={location === 'home'} onClick={function() { setLocation('home'); }} />
      <Option label="At a hospital" selected={location === 'hospital'} onClick={function() { setLocation('hospital'); }} />
      <Option label="In hospice care" selected={location === 'hospice'} onClick={function() { setLocation('hospice'); }} />
      <Option label="In a facility" sublabel="Nursing home, assisted living, memory care" selected={location === 'facility'} onClick={function() { setLocation('facility'); }} />
      <Option label="I'm not sure" selected={location === 'unknown'} onClick={function() { setLocation('unknown'); }} />
      <div style={{ height: 20 }} />
      <PrimaryBtn onClick={function() { setStep(3); }} disabled={!location}>Continue</PrimaryBtn>
    </Shell>
  );

  // ── SCREEN 3: Who passed ─────────────────────────────────────────────────────
  if (step === 3) return (
    <Shell step={3} total={4} onBack={back}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: INK, marginBottom: 10, lineHeight: 1.3 }}>Who passed away?</div>
      <div style={{ fontSize: 15, color: SOFT, marginBottom: 28, lineHeight: 1.6 }}>First name (optional)</div>
      <input value={firstName} onChange={function(e) { setFirstName(e.target.value); }} placeholder="First name" autoFocus
        style={{ width: '100%', padding: '16px', borderRadius: 13, border: '1.5px solid ' + BORDER, fontFamily: 'Georgia, serif', fontSize: 17, color: INK, outline: 'none', boxSizing: 'border-box', background: CARD, minHeight: 56 }} />
      <div style={{ height: 20 }} />
      <PrimaryBtn onClick={function() { setStep(4); }}>Continue</PrimaryBtn>
      <SecondaryBtn onClick={function() { setFirstName(''); setStep(4); }}>Skip</SecondaryBtn>
    </Shell>
  );

  // ── SCREEN 4: Who are you ────────────────────────────────────────────────────
  if (step === 4) return (
    <Shell step={4} total={4} onBack={back}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: INK, marginBottom: 10, lineHeight: 1.3 }}>Who are you in this?</div>
      <div style={{ height: 20 }} />
      {[
        ['spouse', 'Spouse or partner'],
        ['child', 'Child'],
        ['sibling', 'Sibling'],
        ['parent', 'Parent'],
        ['executor', 'Executor'],
        ['friend', 'Friend'],
        ['other', 'Other'],
      ].map(function(r) {
        return <Option key={r[0]} label={r[1]} selected={role === r[0]} onClick={function() { setRole(r[0]); }} />;
      })}
      <div style={{ height: 20 }} />
      <PrimaryBtn onClick={createPlan} disabled={!role || saving}>
        {saving ? 'Building your plan...' : 'Continue'}
      </PrimaryBtn>
    </Shell>
  );

  // ── SCREEN 5: Command view ───────────────────────────────────────────────────
  if (step === 5) return (
    <Shell step={5} total={4} hideProgress>
      {feedback ? (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: SAGE, color: '#fff', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 600, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
          {feedback}
        </div>
      ) : null}

      <div style={{ marginBottom: 18 }}>
        <div style={{ background: bannerBg, border: '1px solid ' + bannerBorder, borderRadius: 13, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: bannerColor, marginBottom: 4 }}>{bannerText}</div>
          {!allHandled && (
            <div style={{ fontSize: 13, color: MID, lineHeight: 1.55 }}>
              Here is what matters first for {name}. Tap any item to see what to do and why.
            </div>
          )}
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 12 }}>Here's what matters first</div>

        {outcomes.map(function(outcome, i) {
          return (
            <OutcomeCard
              key={outcome.id}
              outcome={outcome}
              expanded={expanded === i}
              showAssign={showAssign === i}
              onToggle={function() { setExpanded(expanded === i ? -1 : i); setShowAssign(-1); }}
              onMarkHandled={function() { updateOutcome(i, { status: 'handled' }); }}
              onStarted={function() { updateOutcome(i, { status: 'in_progress' }); }}
              onAssignOpen={function() { setShowAssign(i); setExpanded(i); }}
              onAssignClose={function() { setShowAssign(-1); }}
              onAssignSave={function(ownerName) {
                updateOutcome(i, { owner: ownerName, status: ownerName ? (outcomes[i].status === 'needs_owner' ? 'not_started' : outcomes[i].status) : 'needs_owner' });
              }}
            />
          );
        })}

        <div style={{ marginTop: 12, padding: '14px 16px', background: SUBTLE, borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: MID, marginBottom: 8 }}>Up next</div>
          {[
            'Gather important documents',
            'Begin service planning',
          ].map(function(t, i) {
            return (
              <div key={i} style={{ fontSize: 13, color: SOFT, padding: '6px 0', borderTop: i > 0 ? '1px solid ' + BORDER : 'none', lineHeight: 1.4 }}>{t}</div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        {allHandled ? (
          <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 13, padding: '16px', marginBottom: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: SAGE, marginBottom: 4 }}>You're in a good place for now.</div>
            <div style={{ fontSize: 14, color: MID, lineHeight: 1.6 }}>We'll guide you through what comes next when you're ready.</div>
          </div>
        ) : (
          <PrimaryBtn onClick={function() {
            if (firstIncomplete >= 0) { setExpanded(firstIncomplete); }
            else if (estateId) { window.location.href = '/?estate=' + estateId; }
            else { window.location.href = '/'; }
          }}>
            Start with the first item
          </PrimaryBtn>
        )}
      </div>

      <button onClick={function() { window.location.href = '/'; }}
        style={{ width: '100%', padding: '14px', borderRadius: 13, border: '1.5px solid ' + BORDER, background: CARD, color: MID, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 50 }}>
        Get help coordinating
      </button>

      <div style={{ fontSize: 12, color: SOFT, textAlign: 'center', marginTop: 16, lineHeight: 1.65 }}>
        Your plan is saved. You can come back anytime and pick up where you left off.
      </div>
    </Shell>
  );

  return null;
}
