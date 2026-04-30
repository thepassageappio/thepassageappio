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

// ── 1. REASSURANCE BLOCK ─────────────────────────────────────────────────────
// First thing visible. Dominant. Both lines always. No variation unless critical missing.
function ReassuranceBlock({ outcomes }) {
  var needsOwner = outcomes.filter(function(o) {
    return o.priority === 'critical' && o.status === 'needs_owner';
  }).length;

  return (
    <div style={{ paddingTop: 20, paddingBottom: 36, marginBottom: 8 }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: T.ink, lineHeight: 1.3, marginBottom: 10, fontWeight: 400 }}>
        {needsOwner > 0 ? "You're still on track." : "You're on track."}
      </div>
      <div style={{ fontSize: 15, color: T.mid, lineHeight: 1.8, marginBottom: 2 }}>
        {needsOwner > 0
          ? "A few things need an owner before they're fully handled."
          : "Nothing urgent is missing right now."}
      </div>
      <div style={{ fontSize: 15, color: T.mid, lineHeight: 1.8 }}>
        We'll walk you through what matters next.
      </div>
    </div>
  );
}

// ── 2. PRIMARY FOCUS CARD ─────────────────────────────────────────────────────
// ONE outcome. Visually dominant. Everything else suppressed.
// Eye must land here first. No competition. No scanning.
function PrimaryFocusCard({ outcome, onStart, onAssign, onAssignSave, onAssignClose, onHandled, showAssign, feedback }) {
  if (!outcome) return null;
  var isHandled = outcome.status === 'handled';
  var isInProgress = outcome.status === 'in_progress';
  var needsOwner = outcome.status === 'needs_owner';
  var notStarted = outcome.status === 'not_started';

  return (
    <div style={{
      background: T.card,
      border: '2px solid ' + (isHandled ? T.sageLight : T.sage + '60'),
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 40,
      opacity: isHandled ? 0.82 : 1,
      transition: 'all 0.25s ease',
      boxShadow: isHandled ? 'none' : '0 4px 24px rgba(107,143,113,0.12)',
    }}>

      {/* Dominant green header — largest label on page */}
      <div style={{ background: isHandled ? T.sageFaint : T.sage, padding: '16px 24px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: isHandled ? T.sage : '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          {isHandled ? 'Handled' : 'Start here'}
        </div>
        {!isHandled && (
          <div style={{ fontSize: 13, color: '#ffffffb0', fontStyle: 'italic' }}>
            Let's start with this.
          </div>
        )}
      </div>

      <div style={{ padding: '28px 24px 32px' }}>

        {/* Title — large, immediate */}
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: T.ink, marginBottom: 6, lineHeight: 1.25 }}>
          {outcome.title}
        </div>
        <div style={{ fontSize: 14, color: T.mid, marginBottom: 28, lineHeight: 1.65 }}>
          {outcome.support}
        </div>

        {/* HANDLED STATE — final, no button */}
        {isHandled && (
          <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 21, color: T.sage, marginBottom: 10, lineHeight: 1.3 }}>
              That's taken care of.
            </div>
            <div style={{ fontSize: 15, color: T.mid, lineHeight: 1.7 }}>
              You're all set here.
            </div>
          </div>
        )}

        {!isHandled && (
          <>
            {/* Why it matters — no label, just content */}
            <div style={{ background: T.subtle, borderRadius: 12, padding: '16px 18px', marginBottom: 22 }}>
              <div style={{ fontSize: 14, color: T.mid, lineHeight: 1.75 }}>{outcome.why}</div>
            </div>

            {/* What to do */}
            {outcome.action && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.soft, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>What to do</div>
                <div style={{ fontSize: 15, color: T.ink, lineHeight: 1.65, fontWeight: 500 }}>{outcome.action}</div>
              </div>
            )}

            {/* Owner state — prominent, colored, persistent */}
            <div style={{
              padding: '16px 18px',
              marginBottom: 24,
              background: outcome.owner ? T.sageFaint : T.amberFaint,
              border: '1.5px solid ' + (outcome.owner ? T.sageLight : T.amber + '50'),
              borderRadius: 12,
            }}>
              {outcome.owner ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.sage, marginBottom: 4 }}>
                    {outcome.owner} is handling this.
                  </div>
                  <div style={{ fontSize: 14, color: T.mid }}>
                    You don't need to take this on.
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 600, color: T.amber }}>
                  No one is handling this yet.
                </div>
              )}
            </div>

            {/* Started feedback — persistent, inline */}
            {feedback === 'started' && (
              <div style={{ background: T.sageFaint, border: '1px solid ' + T.sageLight, borderRadius: 11, padding: '14px 18px', marginBottom: 22 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.sage, marginBottom: 4 }}>You've started this.</div>
                <div style={{ fontSize: 13, color: T.mid }}>We'll keep track of it here.</div>
              </div>
            )}

            {/* ONE primary action only — no alternatives competing */}
            {!showAssign && (
              <div>
                {needsOwner && (
                  <button onClick={onAssign}
                    style={{ width: '100%', padding: '18px', borderRadius: 13, border: 'none', background: T.sage, color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', minHeight: 58 }}>
                    Assign owner
                  </button>
                )}
                {notStarted && (
                  <button onClick={onStart}
                    style={{ width: '100%', padding: '18px', borderRadius: 13, border: 'none', background: T.sage, color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', minHeight: 58 }}>
                    Start
                  </button>
                )}
                {isInProgress && (
                  <button onClick={onHandled}
                    style={{ width: '100%', padding: '18px', borderRadius: 13, border: 'none', background: T.sage, color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', minHeight: 58 }}>
                    Mark as handled
                  </button>
                )}
              </div>
            )}

            {/* Owner assignment inline */}
            {showAssign && (
              <div style={{ background: T.subtle, borderRadius: 13, padding: '18px' }}>
                <div style={{ fontSize: 15, color: T.mid, marginBottom: 14, lineHeight: 1.6 }}>
                  Who will handle this? Once assigned, it's off your plate.
                </div>
                <InlineOwner onSave={onAssignSave} onClose={onAssignClose} />
              </div>
            )}

            {/* Reassurance — only when unassigned */}
            {!outcome.owner && outcome.reassurance && (
              <div style={{ fontSize: 12, color: T.soft, marginTop: 16, lineHeight: 1.65, fontStyle: 'italic', textAlign: 'center' }}>
                {outcome.reassurance}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── 3. SECONDARY COLLAPSED GROUP ──────────────────────────────────────────────
// Everything else. Visually irrelevant. User should NOT feel pulled toward it.
// Opacity 0.5. No actions. No borders. Feels like background.
function SecondaryCollapsedGroup({ outcomes }) {
  var s = useState(false); var open = s[0]; var setOpen = s[1];
  if (!outcomes || outcomes.length === 0) return null;

  return (
    <div style={{ marginBottom: 32, opacity: 0.55 }}>
      <button onClick={function() { setOpen(!open); }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0', minHeight: 36 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.soft, textTransform: 'uppercase', letterSpacing: '0.14em' }}>This can wait</span>
        <span style={{ fontSize: 11, color: T.soft }}>{open ? '↑' : '↓'}</span>
      </button>
      {open && outcomes.map(function(o) {
        return (
          <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid ' + T.border + '60' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.soft, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 36 }}>{o.phase}</span>
            <div style={{ fontSize: 12, color: T.soft }}>{o.title}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── 4. PAUSE BLOCK ─────────────────────────────────────────────────────────────
// A conclusion. Explicit permission. The user must believe they can stop.
function PauseBlock() {
  return (
    <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 18, padding: '28px 26px', marginBottom: 28, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: T.ink, marginBottom: 12, lineHeight: 1.4 }}>
        You're in a good place for now.<br />
        Nothing urgent is being missed.
      </div>
      <div style={{ fontSize: 15, color: T.mid, lineHeight: 1.75 }}>
        We'll be here when you come back.
      </div>
    </div>
  );
}

// ── 5. PRIMARY CTA ─────────────────────────────────────────────────────────────
// One button. Short. Directive. Support text below. Never competing.
function PrimaryCTA({ primaryHandled, onStart }) {
  if (primaryHandled) {
    return (
      <div style={{ padding: '20px 24px', borderRadius: 14, background: T.sageFaint, border: '1px solid ' + T.sageLight, textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: T.sage }}>You're good for now.</div>
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

  // ── RESULTS: Guided Support View ─────────────────────────────────────────────
  // Order: Reassurance → Primary Focus → Secondary Collapsed → Pause → CTA
  // No scanning. No competing signals. One clear next step.
  if (step === 'results') return (
    <Shell step={5} total={4} bare>

      {/* 1. REASSURANCE — first thing visible, dominant */}
      <ReassuranceBlock outcomes={outcomes} />

      {/* 2. PRIMARY FOCUS — one card, isolated, 2x visual weight of anything else */}
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

      {/* 3. SECONDARY — suppressed, non-urgent, collapsed */}
      <SecondaryCollapsedGroup outcomes={secondary} />

      {/* 4. PAUSE — conclusion, not suggestion */}
      {showPause && <PauseBlock />}

      {/* 5. CTA — single, context-aware */}
      <PrimaryCTA
        primaryHandled={primaryHandled}
        onStart={function() {
          if (primary && primary.status === 'needs_owner') setShowAssign(true);
          else if (primary && primary.status === 'not_started') handleStart();
          else if (primary && primary.status === 'in_progress') handleHandled();
        }}
      />

      <div style={{ fontSize: 12, color: T.soft, textAlign: 'center', marginTop: 8, lineHeight: 1.65 }}>
        Your plan is saved. Come back anytime.
      </div>
    </Shell>
  );
  return null;
}
