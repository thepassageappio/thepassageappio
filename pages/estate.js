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

  useEffect(function() {
    if (!estateId) { setLoading(false); return; }
    sb.auth.getSession().then(function(r) {
      if (r.data && r.data.session) setUser(r.data.session.user);
    });
    Promise.all([
      sb.from('workflows').select('*').eq('id', estateId).single(),
      sb.from('outcomes').select('*').eq('estate_id', estateId).order('position'),
      sb.from('tasks').select('*').eq('workflow_id', estateId).eq('status', 'pending').order('position').limit(20),
    ]).then(function(results) {
      if (results[0].data) setEstate(results[0].data);
      if (results[1].data) setOutcomes(results[1].data);
      if (results[2].data) setTasks(results[2].data);
      setLoading(false);
      // Update last viewed
      sb.from('workflows').update({ last_viewed_at: new Date().toISOString() }).eq('id', estateId).then(function() {});
    });
  }, [estateId]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(function() { setToast(''); }, 2200);
  }

  async function updateOutcome(index, updates) {
    var outcome = outcomes[index];
    await sb.from('outcomes').update(Object.assign({ updated_at: new Date().toISOString() }, updates)).eq('id', outcome.id);
    setOutcomes(function(prev) {
      return prev.map(function(o, i) { return i === index ? Object.assign({}, o, updates) : o; });
    });
    setExpanded(-1);
    setShowAssign(-1);
    if (updates.status === 'handled') showToast('This is handled');
    else if (updates.status === 'in_progress') showToast('Marked as in progress');
    else if (updates.owner_label) showToast('Assigned to ' + updates.owner_label);
  }

  // Banner logic
  var handledCount = outcomes.filter(function(o) { return o.status === 'handled'; }).length;
  var needsOwnerCount = outcomes.filter(function(o) { return o.status === 'needs_owner'; }).length;
  var allHandled = handledCount === outcomes.length && outcomes.length > 0;

  var bannerText = allHandled
    ? "You're in a good place for now."
    : needsOwnerCount > 0
      ? 'Some important items still need an owner.'
      : "You're on track. Nothing urgent is missing right now.";
  var bannerColor = needsOwnerCount > 0 && !allHandled ? AMBER : SAGE;
  var bannerBg = needsOwnerCount > 0 && !allHandled ? AMBER_FAINT : SAGE_FAINT;
  var bannerBorder = needsOwnerCount > 0 && !allHandled ? AMBER_BORDER : SAGE_LIGHT;

  var firstIncomplete = outcomes.findIndex(function(o) { return o.status !== 'handled'; });
  var name = estate ? (estate.deceased_first_name || estate.deceased_name || 'your loved one') : 'your loved one';
  var coordinatorName = estate ? (estate.coordinator_name || 'You') : 'You';
  var upNextTasks = tasks.slice(3, 8);

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
              {handledCount > 0 && <div style={{ fontSize: 12, color: SAGE }}><span style={{ fontWeight: 700 }}>{handledCount}</span> handled</div>}
              {needsOwnerCount > 0 && <div style={{ fontSize: 12, color: AMBER }}><span style={{ fontWeight: 700 }}>{needsOwnerCount}</span> need an owner</div>}
              {outcomes.filter(function(o) { return o.status === 'not_started'; }).length > 0 && (
                <div style={{ fontSize: 12, color: SOFT }}><span style={{ fontWeight: 700 }}>{outcomes.filter(function(o) { return o.status === 'not_started'; }).length}</span> not started</div>
              )}
            </div>
          )}
        </div>

        {/* Outcomes — generated from /urgent or empty state */}
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
              <div style={{ fontSize: 14, color: SOFT, lineHeight: 1.7 }}>No outcomes yet. Complete the intake flow to generate your first 24-hour plan.</div>
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
            onClick={function() { window.location.href = '/'; }}
          />
          <SecondaryCard
            title="Planning file"
            meta="Wishes, obituary, documents"
            cta="Open"
            onClick={function() { window.location.href = '/'; }}
          />
        </div>

        {/* Primary CTA */}
        {!allHandled && firstIncomplete >= 0 && (
          <button onClick={function() { setExpanded(firstIncomplete); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ width: '100%', padding: '16px', borderRadius: 13, border: 'none', background: SAGE, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', marginBottom: 10, minHeight: 52 }}>
            Start with the first item
          </button>
        )}
        {allHandled && (
          <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 13, padding: '16px', marginBottom: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: SAGE, marginBottom: 4 }}>You're in a good place for now.</div>
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
