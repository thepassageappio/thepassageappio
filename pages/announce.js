// pages/announce.js
// The announcement and communication system for Passage
// First principle: nothing sends automatically, ever.
// Draft -> Review -> Approve -> Send

import { useState, useEffect } from 'react';
import { supabase as sb } from '../lib/supabaseBrowser';
import { SiteFooter } from '../components/SiteChrome';

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
  { id: 'sms', label: 'Text message draft', sub: 'Prepare a text you can send to the selected audience' },
  { id: 'email', label: 'Email draft', sub: 'Prepare an email you can send to the selected audience' },
  { id: 'copy', label: 'Copy to share', sub: 'Copy the message and share it yourself' },
];

function Shell({ step, total, onBack, children }) {
  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: 'Georgia, serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid ' + BORDER, background: CARD }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle, ' + SAGE_LIGHT + ', ' + SAGE + '70)' }} />
          <span style={{ fontSize: 14, color: INK }}>Passage</span>
          <span style={{ fontSize: 12, color: SOFT, marginLeft: 4 }}>Family update</span>
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
      <SiteFooter />
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
  var retryRecipient = params.get('retryRecipient') || '';

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
  var s12 = useState(''); var recipientText = s12[0]; var setRecipientText = s12[1];

  function estateHref() {
    return estateId ? '/estate?id=' + encodeURIComponent(estateId) : '/';
  }

  function returnToEstate() {
    window.location.href = estateHref();
  }

  useEffect(function() {
    if (!estateId) return;
    Promise.all([
      sb.from('workflow_events').select('*').eq('workflow_id', estateId).order('date', { ascending: true }),
      sb.from('estate_events').select('*').eq('estate_id', estateId).not('date', 'is', null).order('date', { ascending: true }),
    ]).then(function(results) {
      var workflowEvents = results[0].data || [];
      var estateEvents = results[1].data || [];
      var seen = {};
      var merged = workflowEvents.concat(estateEvents).filter(function(event) {
        var key = [event.event_type || event.type || event.name || event.title, event.date || '', event.time || '', event.location_name || ''].join('|');
        if (seen[key]) return false;
        seen[key] = true;
        return true;
      }).sort(function(a, b) { return String(a.date || '').localeCompare(String(b.date || '')); });
      setServiceEvents(merged);
    });
  }, [estateId]);

  useEffect(function() {
    if (!estateId || !retryRecipient) return;
    setAudience('immediate_family');
    setTone('simple');
    setChannel('email');
    setRecipientText(retryRecipient);
    sb.from('announcements')
      .select('content,audience,tone')
      .eq('estate_id', estateId)
      .in('status', ['approved', 'sent', 'cancelled', 'draft'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(function(result) {
        var row = result && result.data;
        if (row?.audience) setAudience(row.audience);
        if (row?.tone) setTone(row.tone);
        if (row?.content) {
          setMessage(row.content);
          setStep(3);
        } else {
          setStep(2);
        }
      });
  }, [estateId, retryRecipient]);

  function back() { setStep(function(s) { return Math.max(1, s - 1); }); }

  function selectTone(toneId) {
    setTone(toneId);
    var t = TONES.find(function(t) { return t.id === toneId; });
    if (t) setMessage(t.preview(deceasedName) + serviceDetailsBlock());
  }

  function serviceDetailsBlock() {
    if (!serviceEvents || serviceEvents.length === 0) return '';
    var lines = serviceEvents.filter(function(e) { return e.date || e.time || e.location_name; }).map(function(e) {
      var label = eventLabel(e);
      var when = [e.date, e.time].filter(Boolean).join(' at ');
      var where = [e.location_name, e.location_address].filter(Boolean).join(', ');
      return label + ': ' + [when, where].filter(Boolean).join(' - ');
    });
    return lines.length ? '\n\nService details:\n' + lines.join('\n') : '';
  }

  function eventLabel(e) {
    var type = String(e.event_type || e.type || '').toLowerCase();
    if (type === 'pronouncement') return 'Official pronouncement';
    if (type === 'release') return 'Release / pickup';
    if (type === 'arrangement') return 'Arrangement meeting';
    if (type === 'visitation' || type === 'wake') return 'Wake / visitation';
    if (type === 'funeral' || type === 'service') return 'Funeral / memorial service';
    if (type === 'burial' || type === 'committal') return 'Burial / committal';
    if (type === 'cremation' || type === 'crematorium') return 'Cremation / crematorium';
    if (type === 'shiva') return 'Shiva / mourning period';
    if (type === 'reception') return 'Reception / gathering';
    if (type === 'obituary_deadline') return 'Obituary deadline';
    return String(e.name || e.title || e.event_type || 'Service detail').replace(/_/g, ' ');
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
    setFeedback('Draft saved. You can return to the estate now.');
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
          status: 'draft',
          requires_review: addReviewer,
          reviewed_by: reviewerName || null,
          channel: channel,
        }]);
      }
      setSending(false);
      setDone(true);
      return;
    }

    if (channel === 'email') {
      var sessionResult = await sb.auth.getSession();
      var token = sessionResult && sessionResult.data && sessionResult.data.session ? sessionResult.data.session.access_token : '';
      if (!token) {
        setFeedback('Sign in before sending an email update from Passage.');
        setSending(false);
        return;
      }
      var response = await fetch('/api/familyUpdate', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
        body: JSON.stringify({
          workflowId: estateId,
          audience: audience,
          tone: tone,
          message: message,
          channel: 'email',
          recipients: recipientText,
          reviewedBy: reviewerName || null,
        }),
      });
      var data = await response.json().catch(function() { return {}; });
      if (!response.ok) {
        setFeedback(data.error || 'This family update could not be sent. Review the recipients and try again.');
        setSending(false);
        return;
      }
      setFeedback('Family update sent to ' + (data.sent || 0) + ' recipient' + ((data.sent || 0) === 1 ? '' : 's') + (data.failed ? '. Some recipients need review.' : '.'));
      setSending(false);
      setDone(true);
      return;
    }

    // SMS or other non-copy output - save as approved and persist the prepared output.
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
      }]);
    }

    // Route through handleEvent only to persist the prepared announcement output.
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
  var audienceLabel = selectedAudience ? selectedAudience.label : audience;
  var channelLabel = selectedChannel ? selectedChannel.label : channel;

  // Done screen
  if (done) return (
    <Shell step={4} total={3} hideProgress>
      <div style={{ textAlign: 'center', paddingTop: 52 }}>
        <div style={{ fontSize: 52, marginBottom: 24 }}>🕊️</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: INK, lineHeight: 1.3, marginBottom: 16 }}>
          {channel === 'copy' ? 'Copied to clipboard.' : channel === 'email' ? 'Family update sent.' : 'Message saved.'}
        </div>
        <div style={{ fontSize: 15, color: MID, lineHeight: 1.75, maxWidth: 380, margin: '0 auto 36px' }}>
          {channel === 'copy'
          ? 'Paste it wherever the coordinator chooses. You can come back to prepare another version for a different audience.'
            : channel === 'email'
              ? 'Passage recorded the reviewed recipients, delivery status, and family-record proof so everyone can see what happened.'
              : 'Your message is saved to the family record. Nothing was sent automatically. You are in control of when and how this reaches people.'}
        </div>
        <div style={{ maxWidth: 380, margin: '0 auto' }}>
          <PrimaryBtn onClick={returnToEstate}>
            Return to family record
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
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: INK, marginBottom: 8, lineHeight: 1.3 }}>Who should receive the next update?</div>
      <div style={{ fontSize: 14, color: SOFT, marginBottom: 24, lineHeight: 1.6 }}>
        Start with the people who should hear directly. Passage prepares the message as an estate-spine output; it does not send without explicit action.
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
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: INK, marginBottom: 8, lineHeight: 1.3 }}>Prepare the family update</div>
      <div style={{ fontSize: 14, color: SOFT, marginBottom: 24, lineHeight: 1.6 }}>
        Choose a tone to start. Service details from the family record can be added before anyone receives it.
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
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: INK, marginBottom: 8, lineHeight: 1.3 }}>Review before this leaves the record</div>

      {retryRecipient ? (
        <div style={{ background: ROSE + '10', border: '1px solid ' + ROSE + '40', borderRadius: 12, padding: '13px 16px', marginBottom: 14, fontSize: 14, color: ROSE, lineHeight: 1.55, fontWeight: 700 }}>
          Repairing a previous delivery issue for {retryRecipient}. Review the message and recipient, then resend only when it looks right.
        </div>
      ) : null}

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
        <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 10, padding: '11px 14px', fontSize: 13, color: SAGE, fontWeight: 700, lineHeight: 1.55, marginTop: 8 }}>
          Draft saved to the family record for {audienceLabel || 'the selected audience'}.
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
        <div style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Delivery</div>
        {CHANNELS.map(function(c) {
          return <Option key={c.id} label={c.label} sub={c.sub} selected={channel === c.id} disabled={c.disabled} onClick={function() { setChannel(c.id); }} />;
        })}
          {channel === 'email' && (
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Recipients</label>
              <textarea
                value={recipientText}
                onChange={function(e) { setRecipientText(e.target.value); }}
                placeholder={'Add one email per line, or separate with commas.\nExample: alex@example.com, Jordan <jordan@example.com>'}
                style={{ width: '100%', minHeight: 92, boxSizing: 'border-box', border: '1.5px solid ' + BORDER, borderRadius: 12, background: CARD, padding: '12px 13px', fontFamily: 'Georgia, serif', fontSize: 13.5, color: INK, lineHeight: 1.5, resize: 'vertical' }}
              />
              <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: SAGE, fontWeight: 700, lineHeight: 1.5, marginTop: 8 }}>
                Passage sends only to the recipients you review here and records delivery status on the family spine.
              </div>
            </div>
          )}
        {channel && channel !== 'copy' && channel !== 'email' && (
          <div style={{ background: AMBER_FAINT, border: '1px solid ' + AMBER + '35', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: AMBER, fontWeight: 700, lineHeight: 1.5, marginTop: 8 }}>
            Selected: {channelLabel}. No hidden recipient list, and no provider send happens from this review screen.
          </div>
        )}
      </div>

      {feedback ? (
        <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: SAGE, fontWeight: 600, marginBottom: 10, textAlign: 'center' }}>
          {feedback}
        </div>
      ) : null}

      <PrimaryBtn onClick={send} disabled={!channel || channel === 'social_pending' || sending || (channel === 'email' && !recipientText.trim())}>
        {sending ? 'Sending...' : channel === 'copy' ? 'Copy message' : channel === 'email' ? 'Send reviewed update' : 'Save output to record'}
      </PrimaryBtn>
      <GhostBtn onClick={saveDraft}>Save as draft</GhostBtn>
      <GhostBtn onClick={returnToEstate}>Back to family record</GhostBtn>
      <GhostBtn onClick={function() { setStep(2); }}>Edit message</GhostBtn>
    </Shell>
  );

  return null;
}
