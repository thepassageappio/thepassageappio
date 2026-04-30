// pages/announce.js
// The announcement and communication system for Passage
// First principle: nothing sends automatically, ever.
// Draft -> Review -> Approve -> Send

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

var sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
var AMBER = '#b07d2e';
var AMBER_FAINT = '#fdf8ee';

var AUDIENCES = [
  { id: 'immediate_family', label: 'Immediate family', sub: 'Parents, siblings, children — closest family first', icon: '' },
  { id: 'close_friends', label: 'Close friends', sub: 'Friends who should hear before a broader announcement', icon: '' },
  { id: 'broader_community', label: 'Broader community', sub: 'Extended family, neighbors, colleagues, community', icon: '' },
  { id: 'public', label: 'Public and social media', sub: 'For when you are ready to share widely', icon: '' },
];

var TONES = [
  {
    id: 'simple',
    label: 'Simple and direct',
    preview: function(name) {
      return 'We are deeply saddened to share that ' + (name || '[Name]') + ' has passed away.\n\nWe will share more details soon.';
    },
  },
  {
    id: 'warm',
    label: 'Warm and personal',
    preview: function(name) {
      return 'It is with heavy hearts that we share the passing of ' + (name || '[Name]') + '.\n\nWe are taking time as a family and will share service details when we are ready.';
    },
  },
  {
    id: 'minimal',
    label: 'Brief',
    preview: function(name) {
      return (name || '[Name]') + ' passed away peacefully.\n\nMore information will be shared soon.';
    },
  },
];

var CHANNELS = [
  { id: 'sms', label: 'Text message', sub: 'Send directly via SMS' },
  { id: 'email', label: 'Email', sub: 'Send via email' },
  { id: 'copy', label: 'Copy to share', sub: 'Copy the message and share it yourself' },
];

function Shell({ step, total, onBack, children }) {
  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: 'Georgia, serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid ' + BORDER, background: CARD }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle, ' + SAGE_LIGHT + ', ' + SAGE + '70)' }} />
          <span style={{ fontSize: 14, color: INK }}>Passage</span>
          <span style={{ fontSize: 12, color: SOFT, marginLeft: 4 }}>Announce</span>
        </div>
        {step > 0 && step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: total }).map(function(_, i) {
                return <div key={i} style={{ width: i < step ? 18 : 7, height: 3, borderRadius: 2, background: i < step ? SAGE : BORDER, transition: 'all 0.25s' }} />;
              })}
            </div>
            {onBack && (
              <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 12, color: SOFT, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>Back</button>
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
      style={{ width: '100%', padding: '16px', borderRadius: 13, border: 'none', background: disabled ? BORDER : SAGE, color: disabled ? SOFT : '#fff', fontSize: 16, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', minHeight: 52 }}>
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, danger }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', padding: '14px', borderRadius: 13, border: '1.5px solid ' + (danger ? ROSE + '60' : BORDER), background: CARD, color: danger ? ROSE : MID, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 50, marginTop: 10 }}>
      {children}
    </button>
  );
}

function Option({ label, sub, selected, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={!!disabled}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 13, border: '1.5px solid ' + (selected ? SAGE : BORDER), background: selected ? SAGE_FAINT : disabled ? SUBTLE : CARD, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 8, minHeight: 56, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: selected ? SAGE : disabled ? SOFT : INK }}>{label}</div>
        {sub && <div style={{ fontSize: 13, color: SOFT, marginTop: 3 }}>{sub}</div>}
      </div>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (selected ? SAGE : BORDER), background: selected ? SAGE : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
      </div>
    </button>
  );
}

export default function AnnouncePage() {
  var params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  var estateId = params.get('estate');
  var deceasedName = params.get('name') || '';

  var s0 = useState(1); var step = s0[0]; var setStep = s0[1];
  var s1 = useState(null); var audience = s1[0]; var setAudience = s1[1];
  var s2 = useState(null); var tone = s2[0]; var setTone = s2[1];
  var s3 = useState(''); var message = s3[0]; var setMessage = s3[1];
  var s4 = useState(null); var channel = s4[0]; var setChannel = s4[1];
  var s5 = useState(false); var addReviewer = s5[0]; var setAddReviewer = s5[1];
  var s6 = useState(''); var reviewerName = s6[0]; var setReviewerName = s6[1];
  var s7 = useState(false); var sending = s7[0]; var setSending = s7[1];
  var s8 = useState(''); var feedback = s8[0]; var setFeedback = s8[1];
  var s9 = useState(false); var done = s9[0]; var setDone = s9[1];
  var s10 = useState('draft'); var savedStatus = s10[0]; var setSavedStatus = s10[1];
  var s11 = useState([]); var serviceEvents = s11[0]; var setServiceEvents = s11[1];

  useEffect(function() {
    if (!estateId) return;
    sb.from('workflow_events').select('*').eq('workflow_id', estateId).order('date', { ascending: true }).then(function(r) {
      setServiceEvents(r.data || []);
    });
  }, [estateId]);

  function back() { setStep(function(s) { return Math.max(1, s - 1); }); }

  function selectTone(toneId) {
    setTone(toneId);
    var t = TONES.find(function(t) { return t.id === toneId; });
    if (t) setMessage(t.preview(deceasedName) + serviceDetailsBlock());
  }

  function serviceDetailsBlock() {
    if (!serviceEvents || serviceEvents.length === 0) return '';
    var lines = serviceEvents.filter(function(e) { return e.date || e.time || e.location_name; }).map(function(e) {
      var label = (e.name || e.event_type || 'Service detail').replace(/_/g, ' ');
      var when = [e.date, e.time].filter(Boolean).join(' at ');
      var where = [e.location_name, e.location_address].filter(Boolean).join(', ');
      return label + ': ' + [when, where].filter(Boolean).join(' - ');
    });
    return lines.length ? '\n\nService details:\n' + lines.join('\n') : '';
  }

  async function saveDraft() {
    if (!estateId) return;
    await sb.from('announcements').insert([{
      estate_id: estateId,
      audience: audience,
      tone: tone,
      content: message,
      status: 'draft',
      requires_review: addReviewer,
      reviewed_by: reviewerName || null,
      channel: channel,
    }]);
    setFeedback('Draft saved.');
    setTimeout(function() { setFeedback(''); }, 2000);
    setSavedStatus('draft');
  }

  async function send() {
    if (!channel || channel === 'social_pending') return;
    setSending(true);

    // First principle: block send if review required and not yet reviewed
    if (addReviewer && reviewerName.trim() && channel !== 'copy') {
      setFeedback('Saved for ' + reviewerName + ' to review. Nothing has been sent.');
      await sb.from('announcements').insert([{
        estate_id: estateId || null,
        audience: audience,
        tone: tone,
        content: message,
        status: 'pending_review',
        requires_review: true,
        reviewed_by: reviewerName,
        channel: channel,
      }]);
      setSending(false);
      setDone(true);
      return;
    }

    if (channel === 'copy') {
      try { navigator.clipboard.writeText(message); } catch (e) {}
      setFeedback('Copied to clipboard.');
      if (estateId) {
        await sb.from('announcements').insert([{
          estate_id: estateId,
          audience: audience,
          tone: tone,
          content: message,
          status: 'sent',
          requires_review: addReviewer,
          reviewed_by: reviewerName || null,
          channel: channel,
          sent_at: new Date().toISOString(),
        }]);
      }
      setSending(false);
      setDone(true);
      return;
    }

    // SMS or email — save as approved, fire via handleEvent
    if (estateId) {
      await sb.from('announcements').insert([{
        estate_id: estateId,
        audience: audience,
        tone: tone,
        content: message,
        status: 'approved',
        requires_review: addReviewer,
        reviewed_by: reviewerName || null,
        channel: channel,
        sent_at: new Date().toISOString(),
      }]);
    }

    // Route through handleEvent
    await fetch('/api/handleEvent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'share_triggered',
        payload: {
          workflowId: estateId,
          masterText: message,
          channel: channel,
          audience: audience,
        },
      }),
    }).catch(function() {});

    setSending(false);
    setDone(true);
  }

  var selectedAudience = AUDIENCES.find(function(a) { return a.id === audience; });
  var selectedChannel = CHANNELS.find(function(c) { return c.id === channel; });

  // Done screen
  if (done) return (
    <Shell step={4} total={3} hideProgress>
      <div style={{ textAlign: 'center', paddingTop: 52 }}>
        <div style={{ fontSize: 52, marginBottom: 24 }}>🕊️</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: INK, lineHeight: 1.3, marginBottom: 16 }}>
          {channel === 'copy' ? 'Copied to clipboard.' : 'Message prepared.'}
        </div>
        <div style={{ fontSize: 15, color: MID, lineHeight: 1.75, maxWidth: 380, margin: '0 auto 36px' }}>
          {channel === 'copy'
            ? 'Paste and send it however you would like. You can come back to prepare another version for a different audience.'
            : 'Your message is saved. Nothing has been sent automatically. You are in control of when and how this reaches people.'}
        </div>
        <div style={{ maxWidth: 380, margin: '0 auto' }}>
          <PrimaryBtn onClick={function() { window.location.href = estateId ? '/?estate=' + estateId : '/'; }}>
            Return to estate
          </PrimaryBtn>
          <GhostBtn onClick={function() { setDone(false); setStep(1); setAudience(null); setTone(null); setMessage(''); setChannel(null); }}>
            Prepare another message
          </GhostBtn>
        </div>
      </div>
    </Shell>
  );

  // Step 1 — Who do you want to tell first
  if (step === 1) return (
    <Shell step={1} total={3}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: INK, marginBottom: 8, lineHeight: 1.3 }}>Who do you want to tell first?</div>
      <div style={{ fontSize: 14, color: SOFT, marginBottom: 24, lineHeight: 1.6 }}>
        Start with the people who should hear directly. You can prepare a separate message for each group.
      </div>
      {AUDIENCES.map(function(a) {
        return <Option key={a.id} label={a.label} sub={a.sub} selected={audience === a.id} onClick={function() { setAudience(a.id); }} />;
      })}
      <div style={{ height: 20 }} />
      <PrimaryBtn onClick={function() { setStep(2); }} disabled={!audience}>Continue</PrimaryBtn>
      <GhostBtn onClick={function() { window.history.back(); }}>Cancel</GhostBtn>
    </Shell>
  );

  // Step 2 — Draft the message
  if (step === 2) return (
    <Shell step={2} total={3} onBack={back}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: INK, marginBottom: 8, lineHeight: 1.3 }}>Prepare your message</div>
      <div style={{ fontSize: 14, color: SOFT, marginBottom: 24, lineHeight: 1.6 }}>
        Choose a tone to start. Edit the message until it feels right.
      </div>

      <div style={{ marginBottom: 16 }}>
        {TONES.map(function(t) {
          return (
            <button key={t.id} onClick={function() { selectTone(t.id); }}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 13, border: '1.5px solid ' + (tone === t.id ? SAGE : BORDER), background: tone === t.id ? SAGE_FAINT : CARD, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 8, minHeight: 52 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: tone === t.id ? SAGE : INK, marginBottom: 4 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: SOFT, lineHeight: 1.5 }}>{t.preview(deceasedName).split('\n')[0]}</div>
            </button>
          );
        })}
      </div>

      {tone && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Your message — edit freely</div>
          <textarea value={message} onChange={function(e) { setMessage(e.target.value); }}
            style={{ width: '100%', height: 160, padding: '14px', borderRadius: 12, border: '1.5px solid ' + BORDER, fontFamily: 'Georgia, serif', fontSize: 14, color: INK, lineHeight: 1.75, resize: 'vertical', boxSizing: 'border-box', background: SUBTLE }} />
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Add details (optional)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['date', 'Date'], ['location', 'Location'], ['service info', 'Service info']].map(function(d) {
                return (
                  <button key={d[0]} onClick={function() { setMessage(function(m) { return m + '\n\n' + d[1] + ': '; }); }}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid ' + BORDER, background: CARD, fontSize: 12, color: MID, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    + {d[1]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <PrimaryBtn onClick={function() { setStep(3); }} disabled={!message.trim()}>Review and send</PrimaryBtn>
    </Shell>
  );

  // Step 3 — Preview + safety layer
  if (step === 3) return (
    <Shell step={3} total={3} onBack={back}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: INK, marginBottom: 8, lineHeight: 1.3 }}>Review before sending</div>

      <div style={{ background: AMBER_FAINT, border: '1px solid ' + AMBER + '40', borderRadius: 12, padding: '13px 16px', marginBottom: 20, fontSize: 14, color: AMBER, lineHeight: 1.55, fontWeight: 600 }}>
        Nothing will be sent until you confirm below.
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Preview</div>
        <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 13, padding: '18px', fontSize: 14.5, color: INK, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif' }}>
          {message}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Audience</div>
          <button onClick={function() { setStep(1); }} style={{ fontSize: 12, color: SAGE, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Change</button>
        </div>
        <div style={{ background: SUBTLE, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: INK, fontWeight: 500 }}>
          {selectedAudience ? selectedAudience.label : audience}
        </div>
      </div>

      <div style={{ marginBottom: 20, background: SUBTLE, borderRadius: 13, padding: '16px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 12 }}>Would you like someone to review this before it sends?</div>
        {!addReviewer ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={function() { setAddReviewer(true); }}
              style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid ' + SAGE_LIGHT, background: SAGE_FAINT, color: SAGE, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
              Add reviewer
            </button>
            <button onClick={function() { setAddReviewer(false); }}
              style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid ' + BORDER, background: CARD, color: MID, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
              Skip
            </button>
          </div>
        ) : (
          <div>
            <input value={reviewerName} onChange={function(e) { setReviewerName(e.target.value); }} placeholder="Their name"
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid ' + BORDER, fontFamily: 'inherit', fontSize: 14, color: INK, outline: 'none', boxSizing: 'border-box', background: CARD, marginBottom: 8, minHeight: 46 }} />
            <div style={{ fontSize: 12, color: SOFT }}>They will be noted as a reviewer. You are still in control of when this sends.</div>
            <button onClick={function() { setAddReviewer(false); setReviewerName(''); }}
              style={{ marginTop: 8, fontSize: 12, color: SOFT, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>How would you like to send this?</div>
        {CHANNELS.map(function(c) {
          return <Option key={c.id} label={c.label} sub={c.sub} selected={channel === c.id} disabled={c.disabled} onClick={function() { setChannel(c.id); }} />;
        })}
      </div>

      {feedback ? (
        <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: SAGE, fontWeight: 600, marginBottom: 10, textAlign: 'center' }}>
          {feedback}
        </div>
      ) : null}

      <PrimaryBtn onClick={send} disabled={!channel || channel === 'social_pending' || sending}>
        {sending ? 'Sending...' : channel === 'copy' ? 'Copy message' : 'Send message'}
      </PrimaryBtn>
      <GhostBtn onClick={saveDraft}>Save as draft</GhostBtn>
      <GhostBtn onClick={function() { setStep(2); }}>Edit message</GhostBtn>
    </Shell>
  );

  return null;
}
