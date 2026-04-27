// pages/confirm.js
// The trust mechanism — two people must independently confirm death before plan activates
// URL: thepassageapp.io/confirm?token=XYZ

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const C = {
  bg: "#f6f3ee", bgCard: "#ffffff", bgSubtle: "#f0ece5",
  ink: "#1a1916", mid: "#6a6560", soft: "#a09890", border: "#e4ddd4",
  sage: "#6b8f71", sageLight: "#c8deca", sageFaint: "#f0f5f1",
  rose: "#c47a7a", roseFaint: "#fdf3f3",
  muted: "#c5bdb5",
};

export default function ConfirmPage() {
  const [token, setToken] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [step, setStep] = useState('loading'); // loading | enter | confirm | already | done | error
  const [confirmerName, setConfirmerName] = useState('');
  const [confirmerEmail, setConfirmerEmail] = useState('');
  const [confirmerRelationship, setConfirmerRelationship] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    setToken(t);
    if (!t) { setStep('error'); return; }

    // Load workflow by token
    supabase.from('workflows').select('id, name, deceased_name, coordinator_name, status, confirmed_by, confirmation_count, trigger_token')
      .eq('trigger_token', t).single()
      .then(({ data, error }) => {
        if (error || !data) { setStep('error'); return; }
        setWorkflow(data);
        if (data.status === 'triggered') { setStep('already'); return; }
        setStep('enter');
      });
  }, []);

  const handleConfirm = async () => {
    if (!confirmerName) return;
    setSubmitting(true);

    const res = await fetch('/api/confirmTrigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowId: workflow.id,
        confirmerName,
        confirmerEmail,
        confirmerRelationship,
      }),
    });

    const data = await res.json();
    setResult(data);
    setStep('done');
    setSubmitting(false);
  };

  const deceasedName = workflow?.deceased_name || 'your loved one';
  const currentConfirms = (workflow?.confirmed_by || []).length;
  const requiredConfirms = workflow?.confirmation_count || 2;

  const containerStyle = {
    background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '20px 16px', fontFamily: 'Georgia, serif',
  };

  const cardStyle = {
    background: C.bgCard, borderRadius: 20, padding: '36px 28px',
    width: '100%', maxWidth: 480, boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
  };

  if (step === 'loading') return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, textAlign: 'center', color: C.soft }}>Loading...</div>
    </div>
  );

  if (step === 'error') return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 16 }}>🕊️</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: C.ink, marginBottom: 12 }}>Link not found</div>
        <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.65 }}>
          This confirmation link is invalid or has expired. Please contact the family coordinator.
        </div>
      </div>
    </div>
  );

  if (step === 'already') return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: C.ink, marginBottom: 12 }}>
          This plan has already been activated
        </div>
        <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.65 }}>
          The estate plan for {deceasedName} was activated after two people confirmed. All assigned family and vendors have been notified.
        </div>
      </div>
    </div>
  );

  if (step === 'done') return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <div style={{ fontSize: 42, marginBottom: 16 }}>🕊️</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.ink, marginBottom: 12 }}>
          {result?.triggered ? 'The plan has been activated.' : 'Confirmation received.'}
        </div>
        {result?.triggered ? (
          <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.75 }}>
            <p style={{ margin: '0 0 12px' }}>Both confirmations have been received. The estate plan for {deceasedName} is now active.</p>
            <p style={{ margin: '0 0 12px' }}>All assigned family members and vendors have been notified with their tasks and the service details.</p>
            <p style={{ margin: 0, color: C.soft, fontSize: 13 }}>We're so sorry for your loss. Passage is here to help carry the weight.</p>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.75 }}>
            <p style={{ margin: '0 0 12px' }}>
              <strong style={{ color: C.ink }}>{currentConfirms + 1} of {requiredConfirms}</strong> confirmations received.
            </p>
            <p style={{ margin: '0 0 12px' }}>Waiting for one more person to confirm before the plan activates. Passage will send all notifications automatically when both confirmations arrive.</p>
            <p style={{ margin: 0, color: C.soft, fontSize: 13 }}>We're so sorry for your loss.</p>
          </div>
        )}
      </div>
    </div>
  );

  // step === 'enter'
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🕊️</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: C.soft, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Passage</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.ink, lineHeight: 1.35, marginBottom: 12 }}>
            Confirming the passing of {deceasedName}
          </div>
          <div style={{ background: C.bgSubtle, borderRadius: 12, padding: '12px 16px', fontSize: 13, color: C.mid, lineHeight: 1.65 }}>
            This is a secure confirmation link. Once <strong style={{ color: C.ink }}>{requiredConfirms} people</strong> confirm, the estate plan will activate and all assigned family and vendors will be notified automatically.
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          {Array.from({ length: requiredConfirms }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < currentConfirms ? C.sage : C.border }} />
          ))}
          <div style={{ fontSize: 12, color: C.mid, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            {currentConfirms}/{requiredConfirms}
          </div>
        </div>

        {/* Form */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Your name *</div>
            <input value={confirmerName} onChange={e => setConfirmerName(e.target.value)}
              placeholder="Your full name"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: `1.5px solid ${C.border}`, fontFamily: 'inherit', fontSize: 14, color: C.ink, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Your email</div>
            <input value={confirmerEmail} onChange={e => setConfirmerEmail(e.target.value)}
              placeholder="your@email.com" type="email"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: `1.5px solid ${C.border}`, fontFamily: 'inherit', fontSize: 14, color: C.ink, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Your relationship to {deceasedName}</div>
            <input value={confirmerRelationship} onChange={e => setConfirmerRelationship(e.target.value)}
              placeholder="e.g. daughter, executor, spouse"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: `1.5px solid ${C.border}`, fontFamily: 'inherit', fontSize: 14, color: C.ink, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Confirm button */}
        <button onClick={handleConfirm} disabled={!confirmerName || submitting}
          style={{ width: '100%', padding: '16px', background: !confirmerName || submitting ? C.muted : C.sage, color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: !confirmerName ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', marginBottom: 14, transition: 'background 0.2s' }}>
          {submitting ? 'Confirming...' : `I confirm that ${deceasedName} has passed away`}
        </button>

        <div style={{ fontSize: 11.5, color: C.soft, textAlign: 'center', lineHeight: 1.65 }}>
          By confirming, you are stating that {deceasedName} has passed away and authorizing Passage to activate the estate coordination plan on behalf of the family.
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 24, paddingTop: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: C.muted }}>
            Passage · <a href="https://thepassageapp.io" style={{ color: C.muted }}>thepassageapp.io</a>
          </div>
        </div>
      </div>
    </div>
  );
}
