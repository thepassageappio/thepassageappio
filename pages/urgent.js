// pages/urgent.js
// Red path — linear urgent onboarding, no dashboard, no nav
// Spec: Screen 0-6 exactly as defined

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
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
var ROSE_FAINT = '#fdf3f3';

// First 24-hour tasks by situation
function generateFirstSteps(situation, funeralStatus, relationship) {
  var always = [
    { title: 'Confirm who has legal authority to make arrangements', priority: 'critical', timeframe: 'now' },
    { title: 'Notify immediate family members', priority: 'critical', timeframe: 'now' },
  ];

  var byLocation = {
    home: [
      { title: 'Contact the medical examiner or coroner — required for home deaths', priority: 'critical', timeframe: 'now' },
      { title: 'Secure the home, pets, and any valuables', priority: 'high', timeframe: '24_hours' },
    ],
    hospital: [
      { title: 'Ask the hospital what paperwork and next steps they will provide', priority: 'critical', timeframe: 'now' },
      { title: 'Retrieve personal belongings from the hospital', priority: 'high', timeframe: '24_hours' },
    ],
    hospice: [
      { title: 'Confirm with hospice what they will handle and provide documentation', priority: 'critical', timeframe: 'now' },
    ],
    nursing_facility: [
      { title: 'Confirm with the facility what paperwork they will provide', priority: 'critical', timeframe: 'now' },
      { title: 'Coordinate personal belongings from the facility', priority: 'high', timeframe: '24_hours' },
    ],
    unexpected: [
      { title: 'Contact 911 or the medical examiner immediately if not already done', priority: 'critical', timeframe: 'now' },
      { title: 'Do not move anything in the space until authorities have cleared it', priority: 'critical', timeframe: 'now' },
      { title: 'Secure the home, pets, and any valuables', priority: 'high', timeframe: '24_hours' },
    ],
    expected_soon: [
      { title: 'Confirm hospice or medical team is in contact', priority: 'critical', timeframe: 'now' },
      { title: 'Identify who will make the call and who should be present', priority: 'high', timeframe: 'now' },
    ],
    unknown: [],
  };

  var funeralStep = funeralStatus === 'selected'
    ? { title: 'Confirm next steps with the funeral home — ask what they need from you', priority: 'critical', timeframe: 'now' }
    : { title: 'Choose a funeral home — this is the most time-sensitive decision in the first 24 hours', priority: 'critical', timeframe: 'now' };

  var situationTasks = byLocation[situation] || [];
  var all = always.concat(situationTasks).concat([funeralStep]);

  // Deduplicate and limit to 7
  var seen = {};
  var result = [];
  all.forEach(function(t) {
    if (!seen[t.title]) { seen[t.title] = true; result.push(t); }
  });
  return result.slice(0, 7);
}

function Shell({ step, total, onBack, children }) {
  return (
    <div style={{ background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif' }}>
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'radial-gradient(circle, ' + SAGE_LIGHT + ', ' + SAGE + '70)' }} />
          <span style={{ fontSize: 15, color: INK }}>Passage</span>
        </div>
        {step > 0 && step < 7 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {Array.from({ length: total }).map(function(_, i) {
                return <div key={i} style={{ width: i < step ? 18 : 8, height: 4, borderRadius: 2, background: i < step ? SAGE : BORDER, transition: 'all 0.3s' }} />;
              })}
            </div>
            {onBack && step > 1 && (
              <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 12, color: SOFT, cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>
            )}
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 20px 60px' }}>
        <div style={{ width: '100%', maxWidth: 500 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Btn({ children, onClick, disabled, variant }) {
  var bg = variant === 'ghost' ? CARD : variant === 'secondary' ? SUBTLE : SAGE;
  var color = variant === 'ghost' || variant === 'secondary' ? MID : '#fff';
  var border = variant === 'ghost' ? '1.5px solid ' + BORDER : 'none';
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', padding: '15px', borderRadius: 13, border: border, background: disabled ? BORDER : bg, color: disabled ? SOFT : color, fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', marginBottom: 10, transition: 'all 0.15s' }}>
      {children}
    </button>
  );
}

function Option({ label, sublabel, selected, onClick, emoji }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 13, border: '1.5px solid ' + (selected ? SAGE : BORDER), background: selected ? SAGE_FAINT : CARD, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 8, transition: 'all 0.15s' }}>
      {emoji && <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: selected ? SAGE : INK }}>{selected ? '✓ ' : ''}{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: SOFT, marginTop: 2 }}>{sublabel}</div>}
      </div>
    </button>
  );
}

function Field({ label, placeholder, value, onChange, type }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'inherit' }}>{label}</div>}
      <input type={type || 'text'} value={value} onChange={function(e) { onChange(e.target.value); }} placeholder={placeholder}
        style={{ width: '100%', padding: '13px 14px', borderRadius: 11, border: '1.5px solid ' + BORDER, fontFamily: 'Georgia, serif', fontSize: 14, color: INK, outline: 'none', boxSizing: 'border-box', background: CARD }} />
    </div>
  );
}

export default function UrgentPage() {
  var s = useState(0); var step = s[0]; var setStep = s[1];
  var s2 = useState({}); var data = s2[0]; var setData = s2[1];
  var s3 = useState(null); var estateId = s3[0]; var setEstateId = s3[1];
  var s4 = useState(false); var saving = s4[0]; var setSaving = s4[1];
  var s5 = useState([]); var firstSteps = s5[0]; var setFirstSteps = s5[1];
  var s6 = useState(null); var user = s6[0]; var setUser = s6[1];

  useEffect(function() {
    sb.auth.getSession().then(function(r) {
      if (r.data.session) setUser(r.data.session.user);
    });
  }, []);

  function set(key, val) {
    setData(function(prev) { var n = Object.assign({}, prev); n[key] = val; return n; });
  }

  async function createEstate() {
    setSaving(true);
    var name = (data.firstName || '') + (data.lastName ? ' ' + data.lastName : '');
    var estateName = (data.relationship ? data.relationship + "'s" : '') + " estate" + (data.firstName ? ' — ' + data.firstName : '');

    var { data: wf } = await sb.from('workflows').insert([{
      user_id: user ? user.id : null,
      deceased_name: name.trim() || null,
      deceased_first_name: data.firstName || null,
      deceased_last_name: data.lastName || null,
      date_of_death: data.dateOfDeath || null,
      coordinator_name: user ? user.user_metadata && user.user_metadata.full_name : null,
      coordinator_email: user ? user.email : null,
      estate_name: estateName,
      status: 'urgent_intake_started',
      path: 'red',
      relationship_to_deceased: data.relationship || null,
      decision_authority: data.decisionAuthority || null,
      urgent_situation: data.situation || null,
      funeral_home_status: data.funeralStatus || null,
    }]).select().single();

    if (wf) {
      setEstateId(wf.id);
      // Generate first steps
      var steps = generateFirstSteps(data.situation, data.funeralStatus, data.relationship);
      setFirstSteps(steps);

      // Save tasks
      var taskRows = steps.map(function(t, i) {
        return { workflow_id: wf.id, title: t.title, tier: 1, position: i + 1, status: 'pending', source: 'system_generated', category: 'immediate' };
      });
      await sb.from('tasks').insert(taskRows);

      // Update status
      await sb.from('workflows').update({ status: 'urgent_first_steps_generated' }).eq('id', wf.id);
    }
    setSaving(false);
    setStep(6);
  }

  function goBack() {
    setStep(function(s) { return Math.max(0, s - 1); });
  }

  // Screen 0 — Emotional acknowledgment
  if (step === 0) return (
    <Shell step={0} total={6}>
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 28 }}>🕊️</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: INK, lineHeight: 1.3, marginBottom: 16 }}>We're so sorry.</div>
        <div style={{ fontSize: 16, color: MID, lineHeight: 1.8, marginBottom: 32, maxWidth: 380, margin: '0 auto 32px' }}>
          We'll help you figure out what needs to happen next, one step at a time.
        </div>
        <div style={{ maxWidth: 360, margin: '0 auto' }}>
          <Btn onClick={function() { setStep(1); }}>Start</Btn>
          <div style={{ fontSize: 12, color: SOFT, marginTop: 8, lineHeight: 1.6 }}>This takes less than a few minutes. You can stop anytime.</div>
        </div>
      </div>
    </Shell>
  );

  // Screen 1 — Who passed away
  if (step === 1) return (
    <Shell step={1} total={6} onBack={goBack}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: INK, marginBottom: 8 }}>Who passed away?</div>
      <div style={{ fontSize: 14, color: SOFT, marginBottom: 28, lineHeight: 1.6 }}>You don't need the full legal name yet.</div>
      <Field label="First name" placeholder="e.g. Robert" value={data.firstName || ''} onChange={function(v) { set('firstName', v); }} />
      <Field label="Last name (optional)" placeholder="" value={data.lastName || ''} onChange={function(v) { set('lastName', v); }} />
      <Field label="Date of passing (optional)" type="date" value={data.dateOfDeath || ''} onChange={function(v) { set('dateOfDeath', v); }} />
      <div style={{ height: 8 }} />
      <Btn onClick={function() { setStep(2); }} disabled={!data.firstName}>Continue</Btn>
      <Btn variant="ghost" onClick={function() { set('firstName', 'My loved one'); setStep(2); }}>I'd rather not say yet</Btn>
    </Shell>
  );

  // Screen 2 — User's role
  if (step === 2) return (
    <Shell step={2} total={6} onBack={goBack}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: INK, marginBottom: 8 }}>What is your relationship?</div>
      <div style={{ fontSize: 14, color: SOFT, marginBottom: 24, lineHeight: 1.6 }}>This helps us suggest the right tasks and tone.</div>
      {[
        ['spouse', 'Spouse or partner', '💑'],
        ['child', 'Son or daughter', '👨‍👩‍👧'],
        ['sibling', 'Brother or sister', '🤝'],
        ['parent', 'Parent', '👴'],
        ['executor', 'Executor or estate attorney', '⚖️'],
        ['friend', 'Friend helping the family', '🫂'],
        ['other', 'Other', '👤'],
      ].map(function(r) {
        return <Option key={r[0]} label={r[1]} emoji={r[2]} selected={data.relationship === r[0]} onClick={function() { set('relationship', r[0]); }} />;
      })}
      <div style={{ height: 8 }} />
      <Btn onClick={function() { setStep(3); }} disabled={!data.relationship}>Continue</Btn>
    </Shell>
  );

  // Screen 3 — Situation
  if (step === 3) return (
    <Shell step={3} total={6} onBack={goBack}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: INK, marginBottom: 8 }}>What is the situation?</div>
      <div style={{ fontSize: 14, color: SOFT, marginBottom: 24, lineHeight: 1.6 }}>This determines your first 24-hour checklist.</div>
      {[
        ['home', 'Passed away at home', null],
        ['hospital', 'Passed away at a hospital', null],
        ['hospice', 'Passed away in hospice care', null],
        ['nursing_facility', 'Passed away at a nursing facility', null],
        ['unexpected', 'Unexpected or sudden death', null],
        ['expected_soon', 'Death is expected very soon', null],
        ['unknown', "I'm not sure what applies", null],
      ].map(function(r) {
        return <Option key={r[0]} label={r[1]} selected={data.situation === r[0]} onClick={function() { set('situation', r[0]); }} />;
      })}
      <div style={{ height: 8 }} />
      <Btn onClick={function() { setStep(4); }} disabled={!data.situation}>Continue</Btn>
    </Shell>
  );

  // Screen 4 — Funeral home
  if (step === 4) return (
    <Shell step={4} total={6} onBack={goBack}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: INK, marginBottom: 8 }}>Is a funeral home involved?</div>
      <div style={{ fontSize: 14, color: SOFT, marginBottom: 24, lineHeight: 1.6 }}>Choosing a funeral home is often the first and most time-sensitive decision.</div>
      <Option label="Yes, already selected" selected={data.funeralStatus === 'selected'} onClick={function() { set('funeralStatus', 'selected'); }} />
      <Option label="No, still need to choose one" selected={data.funeralStatus === 'need_help'} onClick={function() { set('funeralStatus', 'need_help'); }} />
      <Option label="Not sure" selected={data.funeralStatus === 'unknown'} onClick={function() { set('funeralStatus', 'unknown'); }} />
      {data.funeralStatus === 'selected' && (
        <div style={{ marginTop: 8 }}>
          <Field label="Funeral home name (optional)" placeholder="e.g. Collins Family Funeral Home" value={data.funeralHomeName || ''} onChange={function(v) { set('funeralHomeName', v); }} />
          <Field label="Their phone number (optional)" placeholder="(555) 000-0000" value={data.funeralHomePhone || ''} onChange={function(v) { set('funeralHomePhone', v); }} />
        </div>
      )}
      <div style={{ height: 8 }} />
      <Btn onClick={function() { setStep(5); }} disabled={!data.funeralStatus}>Continue</Btn>
    </Shell>
  );

  // Screen 5 — Helpers
  if (step === 5) return (
    <Shell step={5} total={6} onBack={goBack}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: INK, marginBottom: 8 }}>Is anyone else helping?</div>
      <div style={{ fontSize: 14, color: SOFT, marginBottom: 24, lineHeight: 1.6 }}>If someone is helping you make decisions or handle tasks, add them now. You can also skip this.</div>
      <Field label="Their name (optional)" placeholder="e.g. Sarah Collins" value={data.helperName || ''} onChange={function(v) { set('helperName', v); }} />
      <Field label="Phone or email (optional)" placeholder="sarah@email.com or (555) 000-0000" value={data.helperContact || ''} onChange={function(v) { set('helperContact', v); }} />
      <div style={{ height: 8 }} />
      <Btn onClick={createEstate} disabled={saving}>{saving ? 'Building your plan...' : "Generate my first-step plan →"}</Btn>
      <Btn variant="ghost" onClick={createEstate} disabled={saving}>Skip — just show me what to do</Btn>
    </Shell>
  );

  // Screen 6 — First 24-hour plan
  if (step === 6) return (
    <Shell step={6} total={6}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: INK, marginBottom: 8 }}>Here's what matters first.</div>
        <div style={{ fontSize: 14, color: SOFT, lineHeight: 1.7 }}>Based on what you told us, focus on these next steps. Everything else can wait.</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        {firstSteps.map(function(task, i) {
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '13px 0', borderBottom: i < firstSteps.length - 1 ? '1px solid ' + BORDER : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: SOFT, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 14, color: INK, fontWeight: 600, lineHeight: 1.4 }}>{task.title}</div>
                {task.timeframe === 'now' && <div style={{ fontSize: 11, color: ROSE, fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Right now</div>}
                {task.timeframe === '24_hours' && <div style={{ fontSize: 11, color: MID, fontWeight: 600, marginTop: 3 }}>Within 24 hours</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: SAGE_FAINT, border: '1px solid ' + SAGE_LIGHT, borderRadius: 13, padding: '16px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: SAGE, marginBottom: 6 }}>Want help coordinating this with family?</div>
        <div style={{ fontSize: 13, color: MID, lineHeight: 1.6, marginBottom: 12 }}>Passage can help assign tasks, prepare messages, and keep everyone aligned. You stay in control of what gets sent and when.</div>
        <button onClick={function() { window.location.href = estateId ? '/estate?id=' + estateId + '&setup=true' : '/'; }}
          style={{ width: '100%', padding: '12px', borderRadius: 11, border: 'none', background: SAGE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          Set up family coordination →
        </button>
      </div>

      <button onClick={function() { window.location.href = estateId ? '/estate?id=' + estateId : '/'; }}
        style={{ width: '100%', padding: '12px', borderRadius: 11, border: '1.5px solid ' + BORDER, background: CARD, color: MID, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
        I'll coordinate later — just save this
      </button>

      <div style={{ fontSize: 11.5, color: SOFT, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
        Saved. You can come back anytime.
      </div>
    </Shell>
  );

  return null;
}
