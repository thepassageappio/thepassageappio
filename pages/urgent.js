import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const C = {
  bg: '#f7f4ef',
  card: '#fffdf9',
  ink: '#191815',
  mid: '#625d56',
  soft: '#9a9288',
  border: '#e5ddd2',
  subtle: '#f0ebe3',
  sage: '#5f8065',
  sageDark: '#3f6046',
  sageFaint: '#eef5ef',
  sageLight: '#c8deca',
  rose: '#b86b6f',
  roseFaint: '#fbf0ef',
  gold: '#b58b48',
};

const initialOutcomes = [
  {
    id: 'funeral',
    phase: 'Right now',
    title: 'Choose who will call the funeral home',
    support: 'One calm call starts transportation, timing, and the first practical decisions.',
    prompt: 'Who can make or receive this call?',
    status: 'needs_owner',
    owner: null,
    priority: 'critical',
  },
  {
    id: 'family',
    phase: 'Today',
    title: 'Notify immediate family',
    support: 'The closest people should hear directly before wider announcements or social posts.',
    prompt: 'Who can help with the first calls?',
    status: 'needs_owner',
    owner: null,
    priority: 'critical',
  },
  {
    id: 'home',
    phase: 'Next',
    title: 'Secure home, pets, and vehicle',
    support: 'A simple check prevents avoidable problems while everyone is focused on grief.',
    prompt: 'Who can physically check the home or arrange help?',
    status: 'needs_owner',
    owner: null,
    priority: 'high',
  },
];

const urgentPlans = {
  unexpected: [
    {
      id: 'emergency',
      phase: 'Minutes',
      title: 'Call 911 now',
      support: 'Because this happened unexpectedly at home, emergency services or the medical examiner usually need to guide the first step before a funeral home can take over.',
      prompt: 'Who is with them right now and can make this call?',
      status: 'needs_owner',
      owner: null,
      priority: 'critical',
    },
    {
      id: 'pronouncement',
      phase: 'Minutes',
      title: 'Wait for official pronouncement',
      support: 'A death must be officially pronounced by a medical professional before transportation, paperwork, or funeral home pickup can move forward.',
      prompt: 'Who will write down the official instruction?',
      status: 'needs_owner',
      owner: null,
      priority: 'critical',
    },
    {
      id: 'authority',
      phase: 'Today',
      title: 'Identify who can make decisions right now',
      support: 'Release, medical, and funeral decisions need a clear decision-maker so the family is not guessing.',
      prompt: 'Who is the next of kin, healthcare proxy, or decision-maker?',
      status: 'needs_owner',
      owner: null,
      priority: 'critical',
    },
    ...initialOutcomes,
  ],
  hospice: [
    {
      id: 'hospice',
      phase: 'Minutes',
      title: 'Call the hospice nurse or on-call hospice line',
      support: 'Hospice usually guides pronouncement, medications, equipment, and funeral home release steps.',
      prompt: 'Who can call hospice or answer their call?',
      status: 'needs_owner',
      owner: null,
      priority: 'critical',
    },
    {
      id: 'pronouncement',
      phase: 'Minutes',
      title: 'Confirm official pronouncement',
      support: 'The hospice nurse or physician will tell you what needs to happen before transportation.',
      prompt: 'Who will record the pronouncement details?',
      status: 'needs_owner',
      owner: null,
      priority: 'critical',
    },
    ...initialOutcomes,
  ],
  hospital: [
    {
      id: 'release',
      phase: 'Today',
      title: 'Ask the hospital about release next steps',
      support: 'A nurse, social worker, or decedent affairs contact can explain who may authorize release and what the funeral home needs.',
      prompt: 'Who can speak with the hospital or facility?',
      status: 'needs_owner',
      owner: null,
      priority: 'critical',
    },
    {
      id: 'authority',
      phase: 'Today',
      title: 'Confirm who can authorize release',
      support: 'The facility may need the next of kin, healthcare proxy, or legal decision-maker before pickup can move forward.',
      prompt: 'Who has authority for release and arrangements?',
      status: 'needs_owner',
      owner: null,
      priority: 'critical',
    },
    ...initialOutcomes,
  ],
  facility: [
    {
      id: 'release',
      phase: 'Today',
      title: 'Ask the facility about release and pickup',
      support: 'The care facility can tell you who signs release paperwork and what the funeral home needs for pickup.',
      prompt: 'Who can speak with the facility?',
      status: 'needs_owner',
      owner: null,
      priority: 'critical',
    },
    ...initialOutcomes,
  ],
  home_expected: [
    {
      id: 'pronouncement',
      phase: 'Minutes',
      title: 'Confirm official pronouncement',
      support: 'A death must be officially pronounced by a medical professional before transportation or paperwork moves forward.',
      prompt: 'Who can confirm the pronouncement path?',
      status: 'needs_owner',
      owner: null,
      priority: 'critical',
    },
    ...initialOutcomes,
  ],
  past: initialOutcomes,
};

function planForContext(value) {
  return (urgentPlans[value] || initialOutcomes).map(item => ({ ...item, owner: item.owner || null }));
}

function mergeOutcomePlan(nextPlan, previous) {
  return nextPlan.map(item => {
    const existing = previous.find(prev => prev.id === item.id);
    return existing ? { ...item, owner: existing.owner || null, status: existing.status || item.status } : item;
  });
}

const nextPreview = {
  unexpected: ['Emergency services or a medical examiner handle the official pronouncement path', 'They tell you what must happen next', 'Only after that can a funeral home usually be contacted'],
  hospice: ['Your hospice nurse handles or coordinates the official pronouncement path', 'They guide medications, equipment, and next instructions', 'Then the funeral home can coordinate pickup'],
  hospital: ['Hospital staff explain the release next steps', 'The decision-maker authorizes release', 'The funeral home coordinates pickup'],
  facility: ['Facility staff explain release requirements', 'The decision-maker authorizes pickup', 'The funeral home coordinates transportation'],
  home_expected: ['A medical professional confirms the official pronouncement path', 'The family records the official details', 'The funeral home can then coordinate pickup'],
  past: ['We confirm what is already done', 'We organize the next open step', 'Passage tracks owners, notes, and proof from here'],
};

function authorityMessage(status) {
  if (status === 'self') return 'Okay. You will be the person providers and funeral homes look to for decisions.';
  if (status === 'someone_else') return 'Okay. Passage will guide what you can do now and when to involve them.';
  if (status === 'unsure') return "That's okay. Passage will help you figure this out before anything important is decided.";
  return 'If you are not sure, start there. Authority affects release, medical, and funeral decisions.';
}

const taskPlaybooks = {
  emergency: {
    title: 'Emergency call path',
    body: 'If this was unexpected and 911 has not been called, call 911 now. Say: "A person has died at home unexpectedly. We need emergency services and instructions for what happens next."',
    steps: ['Call 911 if not already done', 'Do not move the person unless emergency services instruct you to', 'Write down the responding agency or case number if one is provided'],
  },
  hospice: {
    title: 'Hospice call script',
    body: 'Hello, this is [your name]. [Loved one] has passed away. They were under hospice care. Can you tell us what happens now, who pronounces death, and what we should do about medications, equipment, and funeral home pickup?',
    steps: ['Call the hospice nurse or on-call number', 'Ask who pronounces death', 'Write down what hospice says to do next'],
  },
  release: {
    title: 'Hospital or facility release script',
    body: 'Hello, my name is [your name]. I am calling about [loved one]. Can you tell me who can authorize release, what paperwork is needed, and what the funeral home should do for pickup?',
    steps: ['Ask for the nurse, social worker, or release contact', 'Confirm who can authorize release', 'Write down what the funeral home needs'],
  },
  pronouncement: {
    title: 'Pronouncement details to record',
    body: 'A death must be officially pronounced by a medical professional before anything else can happen. Record who pronounced death, the time, the location, and any instruction they gave about transportation, release, or medical examiner involvement.',
    steps: ['Confirm who pronounced death', 'Write down time and contact information', 'Ask what must happen before funeral home pickup'],
  },
  authority: {
    title: 'Decision-maker check',
    body: 'Identify who can make medical, release, and funeral decisions right now. This may be the healthcare proxy, next of kin, executor, or another legally recognized decision-maker.',
    steps: ['Name the person with authority', 'Record phone and email if known', 'If unsure, ask the hospital, hospice, or funeral director before anything is sent'],
  },
  funeral: {
    title: 'Call script prepared',
    body: 'Hello, my name is [your name]. I am calling because [loved one] has passed away. We need help with transportation and next arrangements. Can you walk me through what you need from us first?',
    steps: ['Confirm the funeral home name and phone number', 'Ask what documents they need now', 'Write down the next appointment time'],
  },
  family: {
    title: 'Family message prepared',
    body: 'I am so sorry to share this here. [Loved one] has passed away. We are using Passage to coordinate next steps and will share updates as we know more. Please give us a little room while we handle the first arrangements.',
    steps: ['Choose the first three people who should know directly', 'Review the wording before sending', 'Track who has been reached'],
  },
  home: {
    title: 'Home check instructions prepared',
    body: 'Please check the home, pets, vehicle, mail, doors, windows, and any urgent safety concerns. Send a short update when it is handled, including anything that needs another person.',
    steps: ['Confirm who has keys or access', 'Ask for a photo/update when handled', 'Mark the task handled only after the check is done'],
  },
};

const defaultContext = {
  deathContext: '',
  pronouncementStatus: '',
  authorityStatus: '',
  emergencyCalled: '',
  funeralHomeName: '',
  cemeteryName: '',
  faithTradition: '',
  clergyName: '',
  authorityName: '',
  hospitalOrHospiceContact: '',
  medicalRecordsLocation: '',
};

function CandleLogo({ size = 34 }) {
  return (
    <div className="brand">
      <style suppressHydrationWarning>{`
        @keyframes brandGlow {
          0%,100% { opacity:.22; transform:translate(-50%,-50%) scale(.92); }
          50% { opacity:.48; transform:translate(-50%,-50%) scale(1.08); }
        }
        @keyframes markFlicker {
          0%,100% { filter: drop-shadow(0 0 0 rgba(184,120,58,0)); opacity:.96; transform:scale(1); }
          44% { filter: drop-shadow(0 0 9px rgba(184,120,58,.18)); opacity:1; transform:scale(1.01); }
          59% { filter: drop-shadow(0 0 3px rgba(184,120,58,.11)); opacity:.92; transform:scale(.995); }
        }
        @keyframes wordGlow {
          0%,100% { text-shadow: 0 0 0 rgba(190,140,70,0); color:#5b7a63; }
          45% { text-shadow: 0 0 14px rgba(190,140,70,.20); color:#6f7f5c; }
          51% { text-shadow: 0 0 5px rgba(190,140,70,.12); color:#506d58; }
        }
      `}</style>
      <span className="mark" style={{ width: size, height: size }}>
        <span className="halo" />
        <img src="/passage-icon-light-onbg.svg" alt="" width={size} height={size} style={{ display: 'block', borderRadius: Math.max(8, size * 0.24), animation: 'markFlicker 5.2s ease-in-out infinite' }} />
      </span>
      <span className="brand-name">PASSAGE</span>
    </div>
  );
}

function TaskPlaybook({ task }) {
  const guide = taskPlaybooks[task.id] || taskPlaybooks.family;
  return (
    <div className="playbook">
      <div className="playbook-kicker">Prepared next step</div>
      <div className="playbook-title">{guide.title}</div>
      <div className="draft-box">{guide.body}</div>
      <div className="playbook-steps">
        {guide.steps.map((step, i) => <div key={i}><span>{i + 1}</span>{step}</div>)}
      </div>
      <button className="ghost" onClick={() => navigator.clipboard.writeText(guide.body)}>
        Copy draft
      </button>
    </div>
  );
}

function AssignModal({ task, savedPeople, onClose, onSave }) {
  const [personId, setPersonId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(task?.id === 'funeral' ? 'Funeral caller' : '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!personId) return;
    const person = savedPeople.find(p => p.id === personId);
    if (!person) return;
    setName(person.name);
    setRole(person.role || role);
    setPhone(person.phone || '');
    setEmail(person.email || '');
  }, [personId, savedPeople]);

  if (!task) return null;

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="grabber" />
        <div className="eyebrow">Assign Owner</div>
        <h2>{task.prompt}</h2>
        <p className="muted">{task.title}</p>

        <button className="self-owner" onClick={() => onSave({
          id: 'self',
          name: 'Me',
          role: 'Handling this myself',
          phone: '',
          email: '',
        })}>
          I will handle this myself
        </button>

        {savedPeople.length > 0 && (
          <div className="field">
            <label>Use someone already added</label>
            <select value={personId} onChange={e => setPersonId(e.target.value)}>
              <option value="">Choose a saved person...</option>
              {savedPeople.map(p => <option key={p.id} value={p.id}>{p.name}{p.role ? ` - ${p.role}` : ''}</option>)}
            </select>
          </div>
        )}

        <div className="field">
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah, David, Aunt Linda" autoFocus />
        </div>
        <div className="field two">
          <span>
            <label>Role</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="Brother, spouse, funeral director" />
          </span>
          <span>
            <label>Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" />
          </span>
        </div>
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Optional" />
        </div>

        <div className="modal-note">Passage will keep this owner available for other tasks and include task instructions when they receive a Passage assignment.</div>
        <div className="actions">
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button className="primary" disabled={!name.trim()} onClick={() => onSave({ id: personId || `p_${Date.now()}`, name: name.trim(), role: role.trim(), phone: phone.trim(), email: email.trim() })}>
            Save owner
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UrgentPage() {
  const [user, setUser] = useState(null);
  const [outcomes, setOutcomes] = useState(initialOutcomes);
  const [people, setPeople] = useState([]);
  const [assigning, setAssigning] = useState(null);
  const [deceasedName, setDeceasedName] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorEmail, setCoordinatorEmail] = useState('');
  const [context, setContext] = useState(defaultContext);
  const [savingEstate, setSavingEstate] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [handoff, setHandoff] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPaidSuccess(new URLSearchParams(window.location.search).get('checkout') === 'success');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user?.email) setCoordinatorEmail(prev => prev || session.user.email);
      if (session?.user?.user_metadata?.full_name) setCoordinatorName(prev => prev || session.user.user_metadata.full_name);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user?.email) setCoordinatorEmail(prev => prev || session.user.email);
      if (session?.user?.user_metadata?.full_name) setCoordinatorName(prev => prev || session.user.user_metadata.full_name);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const selectedSituation = Boolean(context.deathContext);
  const primary = selectedSituation
    ? (outcomes.find(o => o.status !== 'handled') || outcomes[0])
    : {
      id: 'choose_context',
      phase: 'Start here',
      title: 'Choose what happened first',
      support: 'The right first move depends on the setting. Unexpected at home, hospice, hospital, facility, and already-past-the-first-steps each start differently.',
      status: 'needs_context',
      owner: null,
    };
  const nextItems = selectedSituation ? outcomes.filter(o => o.id !== primary?.id) : [];
  const handled = outcomes.filter(o => o.status === 'handled').length;
  const assigned = outcomes.filter(o => o.owner).length;

  const reassurance = useMemo(() => {
    if (!selectedSituation) return 'We will start with the right real-world path, then show only the next action.';
    if (!primary) return 'Nothing urgent is missing right now.';
    if (primary.owner) return `${primary.owner.name} is holding the next step. You can breathe for a moment.`;
    return 'One thing at a time. Start by naming who owns the next practical step.';
  }, [primary, selectedSituation]);

  const saveOwner = (person) => {
    const nextPeople = [person, ...people.filter(p => p.id !== person.id)];
    setPeople(nextPeople);
    setOutcomes(prev => prev.map(o => o.id === assigning.id ? { ...o, owner: person, status: 'in_progress' } : o));
    setAssigning(null);
  };

  const markHandled = (id) => {
    setOutcomes(prev => prev.map(o => o.id === id ? { ...o, status: 'handled' } : o));
  };

  const signIn = async () => {
    try {
      localStorage.setItem('passage_urgent_draft', JSON.stringify({ deceasedName, dateOfDeath, coordinatorName, coordinatorEmail, context, outcomes, people }));
    } catch {}
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: SITE_URL + '/urgent' } });
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('passage_urgent_draft');
      if (!raw) return;
      const saved = JSON.parse(raw);
      localStorage.removeItem('passage_urgent_draft');
      if (saved.deceasedName) setDeceasedName(saved.deceasedName);
      if (saved.dateOfDeath) setDateOfDeath(saved.dateOfDeath);
      if (saved.coordinatorName) setCoordinatorName(saved.coordinatorName);
      if (saved.coordinatorEmail) setCoordinatorEmail(saved.coordinatorEmail);
      if (saved.context && typeof saved.context === 'object') setContext(prev => ({ ...prev, ...saved.context }));
      if (Array.isArray(saved.outcomes)) setOutcomes(saved.outcomes);
      if (Array.isArray(saved.people)) setPeople(saved.people);
    } catch {}
  }, []);

  const openCommandCenter = async () => {
    setSaveError('');
    if (!user) {
      await signIn();
      return;
    }
    if (!deceasedName.trim()) {
      setSaveError('Add their name so Passage can save this as a real estate command center.');
      return;
    }
    if (!selectedSituation) {
      setSaveError('Choose what happened first so Passage can create the right first steps.');
      return;
    }
    setSavingEstate(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const primaryOwner = outcomes.find(o => o.id === 'funeral')?.owner || null;
    const firstOwner = primary?.owner || outcomes.find(o => o.owner)?.owner || primaryOwner || null;
    const response = await fetch('/api/urgentEstate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (sessionData?.session?.access_token || ''),
      },
      body: JSON.stringify({
        deceasedName,
        dateOfDeath,
        coordinatorName: coordinatorName || user.user_metadata?.full_name || user.email,
        coordinatorEmail: coordinatorEmail || user.email,
        primaryOwner,
        firstOwner,
        context,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.estateId) {
      setSavingEstate(false);
      setSaveError(json.error || 'Passage could not save this yet. Please try again.');
      return;
    }
    setSavingEstate(false);
    setHandoff(true);
    try { window.sessionStorage.setItem('passage_last_estate_id', json.estateId); } catch {}
    setTimeout(() => {
      window.location.href = '/estate?id=' + encodeURIComponent(json.estateId);
    }, 650);
  };

  const updateContext = (key, value) => {
    setContext(prev => ({ ...prev, [key]: value }));
    if (key === 'deathContext') {
      setOutcomes(prev => mergeOutcomePlan(planForContext(value), prev));
    }
  };

  const contextVoice = useMemo(() => {
    if (context.deathContext === 'unexpected') return 'If this was unexpected at home, call 911 now. A death must be officially pronounced by a medical professional before anything else can happen.';
    if (context.deathContext === 'hospice') return 'Because they were under hospice care, start with the hospice nurse or on-call hospice line.';
    if (context.deathContext === 'hospital') return 'Because they are at a hospital, start by confirming the release next steps and who can authorize pickup.';
    if (context.deathContext === 'facility') return 'Because they are at a care facility, start by confirming release and pickup requirements with staff.';
    if (context.deathContext === 'home_expected') return 'Because this was expected at home, confirm pronouncement before transportation or paperwork moves forward.';
    if (context.deathContext === 'past') return "Understood. Let's get you organized from here and confirm what has already happened.";
    return 'First, tell Passage what kind of situation this is. The next steps will change based on that answer.';
  }, [context.deathContext]);

  return (
    <main>
      <style suppressHydrationWarning>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; color: ${C.ink}; }
        main { min-height: 100vh; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: radial-gradient(circle at 50% 0%, #fffaf1 0%, ${C.bg} 42%, #f4efe7 100%); }
        .shell { max-width: 1120px; margin: 0 auto; padding: 16px 22px 40px; }
        .brand { display: inline-flex; align-items: center; gap: 10px; }
        .brand-name { font-size: 25px; font-weight: 520; letter-spacing: 0; animation: wordGlow 4.6s ease-in-out infinite; }
        .mark { position: relative; display: inline-flex; align-items: center; justify-content: center; }
        .halo { position: absolute; inset: -8px; border-radius: 50%; background: radial-gradient(circle, rgba(207,149,60,.26), rgba(207,149,60,0) 66%); animation: brandGlow 4.2s ease-in-out infinite; }
        .flame { transform-origin: 24px 25px; animation: flame 2.9s ease-in-out infinite; }
        nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
        nav a { color: ${C.mid}; text-decoration: none; font-size: 14px; }
        .hero { max-width: 760px; margin-bottom: 14px; }
        .kicker { color: ${C.rose}; font-size: 11px; text-transform: uppercase; letter-spacing: .16em; font-weight: 750; margin-bottom: 10px; }
        h1 { font-family: Georgia, serif; font-weight: 400; font-size: clamp(32px, 4vw, 44px); line-height: 1.04; margin: 0 0 10px; }
        .lede { font-size: 15.5px; line-height: 1.55; color: ${C.mid}; max-width: 720px; margin: 0; }
        .grid { display: grid; grid-template-columns: 1.5fr .8fr; gap: 18px; align-items: start; }
        .card { background: rgba(255,253,249,.92); border: 1px solid ${C.border}; border-radius: 18px; box-shadow: 0 18px 50px rgba(55,45,35,.08); }
        .primary-card { padding: 22px; }
        .phase { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; color: ${C.rose}; background: ${C.roseFaint}; border: 1px solid rgba(184,107,111,.22); border-radius: 999px; padding: 4px 9px; font-weight: 750; margin-bottom: 12px; }
        h2 { font-family: Georgia, serif; font-weight: 400; font-size: 27px; line-height: 1.14; margin: 0 0 9px; }
        .support { color: ${C.mid}; font-size: 14px; line-height: 1.55; margin: 0 0 14px; max-width: 580px; }
        .save-strip { display:grid; grid-template-columns:minmax(0,1fr) 150px auto; gap:10px; align-items:end; background:${C.sageFaint}; border:1px solid ${C.sageLight}; border-radius:14px; padding:12px; margin-bottom:16px; }
        .context-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; background:${C.card}; border:1px solid ${C.border}; border-radius:14px; padding:12px; margin-bottom:16px; }
        .context-title { grid-column:1 / -1; color:${C.sageDark}; font-size:11px; text-transform:uppercase; letter-spacing:.14em; font-weight:850; }
        .context-help { grid-column:1 / -1; color:${C.mid}; font-size:12.5px; line-height:1.5; margin-top:-2px; }
        .field.compact { margin:0; }
        .field.compact label { margin-bottom:5px; font-size:10px; }
        .field.compact input { min-height:39px; padding:9px 11px; background:${C.card}; }
        .save-command { min-height:39px; padding:9px 12px; white-space:nowrap; }
        .save-error { grid-column:1 / -1; color:${C.rose}; background:${C.roseFaint}; border:1px solid rgba(184,107,111,.22); border-radius:10px; padding:8px 10px; font-size:12px; line-height:1.4; }
        .paid-success { background:${C.sageFaint}; border:1px solid ${C.sageLight}; color:${C.sageDark}; border-radius:14px; padding:10px 12px; margin-bottom:12px; font-weight:750; font-size:13px; line-height:1.45; }
        .triage { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; padding:14px; margin-bottom:14px; }
        .triage-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:10px; }
        .triage-title { font-family:Georgia,serif; font-size:22px; line-height:1.15; }
        .triage-note { color:${C.mid}; font-size:13px; line-height:1.5; margin-top:5px; }
        .triage-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
        .triage-choice { border:1px solid ${C.border}; background:${C.bg}; color:${C.ink}; border-radius:12px; padding:11px 12px; text-align:left; cursor:pointer; font-weight:800; }
        .triage-choice.active { background:${C.sageFaint}; border-color:${C.sage}; color:${C.sageDark}; }
        .next-preview { display:grid; gap:7px; margin-top:10px; background:${C.sageFaint}; border:1px solid ${C.sageLight}; border-radius:14px; padding:11px 12px; }
        .next-preview-title { color:${C.sageDark}; font-size:11px; letter-spacing:.13em; text-transform:uppercase; font-weight:900; }
        .next-preview div:not(.next-preview-title) { color:${C.mid}; font-size:13px; line-height:1.4; }
        .urgent-alert { background:${C.roseFaint}; border:1px solid rgba(184,107,111,.28); color:${C.ink}; border-radius:14px; padding:12px 13px; margin:10px 0 0; font-size:13px; line-height:1.55; }
        .authority-strip { background:${C.sageFaint}; border:1px solid ${C.sageLight}; border-radius:14px; padding:12px; margin-bottom:14px; }
        .authority-options { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:9px; }
        .authority-options button { border:1px solid ${C.sageLight}; background:${C.card}; color:${C.sageDark}; border-radius:999px; padding:8px 10px; cursor:pointer; font-weight:800; font-size:12px; }
        .authority-options button.active { background:${C.sage}; color:white; border-color:${C.sage}; }
        details.later-details { grid-column:1 / -1; border-top:1px solid ${C.border}; padding-top:8px; }
        details.later-details summary { cursor:pointer; color:${C.sageDark}; font-size:12px; font-weight:850; }
        .owner { background: ${C.subtle}; border-radius: 14px; padding: 13px 14px; color: ${C.mid}; line-height: 1.45; margin-bottom: 14px; }
        .owner strong { color: ${C.ink}; }
        .playbook { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; padding:16px; margin:0 0 18px; }
        .playbook-kicker { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:${C.soft}; font-weight:800; margin-bottom:6px; }
        .playbook-title { font-family:Georgia,serif; font-size:18px; color:${C.ink}; margin-bottom:10px; }
        .draft-box { background:${C.subtle}; border:1px solid ${C.border}; border-radius:12px; padding:13px; color:${C.mid}; font-size:13px; line-height:1.65; margin-bottom:12px; }
        .playbook-steps { display:grid; gap:7px; margin-bottom:12px; }
        .playbook-steps div { display:flex; gap:8px; color:${C.mid}; font-size:13px; line-height:1.45; }
        .playbook-steps span { width:20px; height:20px; border-radius:50%; background:${C.sageFaint}; color:${C.sageDark}; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; font-size:11px; font-weight:800; }
        button { font: inherit; }
        .primary, .secondary, .ghost { border: none; border-radius: 12px; padding: 12px 16px; font-weight: 750; cursor: pointer; }
        .primary { background: ${C.ink}; color: white; }
        .primary:disabled { opacity: .45; cursor: not-allowed; }
        .secondary { background: ${C.sage}; color: white; }
        .ghost { background: ${C.subtle}; color: ${C.mid}; border: 1px solid ${C.border}; }
        .active-action { box-shadow: 0 0 0 3px ${C.sageLight}; transform: translateY(-1px); }
        .self-owner { width:100%; border:1px solid ${C.sageLight}; background:${C.sageFaint}; color:${C.sageDark}; border-radius:14px; padding:13px 14px; font-weight:800; cursor:pointer; margin:12px 0 18px; text-align:left; }
        .self-owner:hover { border-color:${C.sage}; }
        .stack { display: flex; gap: 10px; flex-wrap: wrap; }
        .side { padding: 18px; }
        .meter { height: 8px; border-radius: 999px; background: ${C.subtle}; overflow: hidden; margin: 14px 0 16px; }
        .fill { height: 100%; background: linear-gradient(90deg, ${C.rose}, ${C.gold}, ${C.sage}); width: var(--pct); }
        .stat-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .stat { background: ${C.subtle}; border-radius: 12px; padding: 10px; }
        .stat b { display:block; font-size: 20px; color:${C.ink}; }
        .stat span { font-size: 11px; color:${C.soft}; text-transform: uppercase; letter-spacing:.08em; }
        .next { margin-top: 18px; }
        .next h3 { font-size: 12px; color:${C.soft}; text-transform: uppercase; letter-spacing:.14em; margin: 0 0 10px; }
        .next-item { display: flex; gap: 11px; padding: 13px 0; border-top: 1px solid ${C.border}; }
        .dot { width: 24px; height: 24px; border-radius: 50%; flex: 0 0 24px; border: 1px solid ${C.border}; display:flex; align-items:center; justify-content:center; color:${C.soft}; font-size:12px; }
        .next-title { font-weight: 700; color:${C.ink}; font-size: 14px; }
        .next-support { color:${C.soft}; font-size: 12.5px; line-height:1.45; margin-top:3px; }
        .modal-scrim { position: fixed; inset: 0; background: rgba(24,22,18,.54); display:flex; align-items:flex-end; justify-content:center; padding: 18px; z-index: 50; }
        .modal { width: min(560px, 100%); max-height: 90vh; overflow: auto; background: ${C.card}; border-radius: 22px 22px 16px 16px; padding: 22px; box-shadow: 0 30px 70px rgba(0,0,0,.20); }
        .grabber { width: 42px; height: 4px; border-radius: 99px; background:${C.border}; margin: 0 auto 22px; }
        .eyebrow { color:${C.rose}; font-size:11px; text-transform:uppercase; letter-spacing:.16em; font-weight:800; margin-bottom:8px; }
        .muted { color:${C.mid}; margin:0 0 18px; line-height:1.55; }
        .field { margin-bottom: 14px; }
        .field.two { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        label { display:block; color:${C.soft}; font-size:11px; text-transform:uppercase; letter-spacing:.11em; font-weight:800; margin-bottom:7px; }
        input, select { width:100%; border:1.5px solid ${C.border}; background:${C.bg}; border-radius:12px; padding:12px 13px; color:${C.ink}; font: inherit; outline:none; }
        input:focus, select:focus { border-color:${C.sage}; box-shadow:0 0 0 3px rgba(95,128,101,.12); }
        .modal-note { background:${C.sageFaint}; color:${C.sageDark}; border:1px solid ${C.sage}22; border-radius:12px; padding:11px 12px; font-size:13px; line-height:1.5; margin-bottom:16px; }
        .actions { display:flex; gap:10px; }
        .actions .ghost { flex: .7; }
        .actions .primary { flex: 1.3; }
        @media (max-width: 760px) {
          .shell { padding: 18px 14px 42px; }
          nav { margin-bottom: 24px; }
          .grid { grid-template-columns: 1fr; }
          .save-strip { grid-template-columns: 1fr; }
          .context-grid { grid-template-columns:1fr; }
          .triage-grid, .authority-options { grid-template-columns:1fr; }
          .save-command { width:100%; }
          .primary-card { padding: 22px; }
          .field.two { grid-template-columns: 1fr; }
        }
      `}</style>

      {handoff && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(247,244,239,.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 420, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, textAlign: 'center', boxShadow: '0 22px 70px rgba(55,45,35,.12)' }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 12 }}>Passage is saving this</div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 26, lineHeight: 1.15, marginBottom: 10 }}>Setting things up for you...</div>
            <div style={{ color: C.mid, fontSize: 14, lineHeight: 1.55 }}>Opening the estate command center where tasks, owners, notes, and proof will live.</div>
          </div>
        </div>
      )}

      <div className="shell">
        <nav>
          <CandleLogo />
          <a href="/">Back to Passage</a>
        </nav>

        <section className="hero">
          <div className="kicker">Urgent Path</div>
          <h1>You do not have to hold every next step at once.</h1>
          <p className="lede">{reassurance} Passage will keep this focused: who owns the next action, what can wait, and what is already handled.</p>
        </section>

        <section className="grid">
          <div className="card primary-card">
            {paidSuccess && <div className="paid-success">You're in the right place. We'll guide you step by step.</div>}
            <div className="triage">
              <div className="triage-head">
                <div>
                  <div className="kicker" style={{ marginBottom: 5 }}>First 10 seconds</div>
                  <div className="triage-title">Did this just happen?</div>
                  <div className="triage-note">{contextVoice}</div>
                </div>
              </div>
              <div className="triage-grid">
                {[
                  ['unexpected', 'Yes, at home and unexpected'],
                  ['hospice', 'Yes, under hospice care'],
                  ['hospital', 'Yes, in a hospital'],
                  ['facility', 'Yes, in a care facility'],
                  ['home_expected', 'Yes, expected at home'],
                  ['past', 'No, we are past the first official steps'],
                ].map(([value, label]) => (
                  <button key={value} className={`triage-choice ${context.deathContext === value ? 'active' : ''}`} onClick={() => updateContext('deathContext', value)}>
                    {label}
                  </button>
                ))}
              </div>
              {context.deathContext && (
                <div className="next-preview">
                  <div className="next-preview-title">What usually happens next</div>
                  {(nextPreview[context.deathContext] || []).map((item, index) => (
                    <div key={item}>{index + 1}. {item}</div>
                  ))}
                  <div>Passage will guide one step at a time.</div>
                </div>
              )}
              {context.deathContext === 'unexpected' && (
                <div className="urgent-alert">
                  <strong>If this was unexpected at home, call 911 now.</strong> A death must be officially pronounced by a medical professional before anything else can happen. Emergency services or a medical examiner will handle this.
                  <div className="stack" style={{ marginTop: 10 }}>
                    <button className={context.emergencyCalled === 'yes' ? 'secondary active-action' : 'secondary'} onClick={() => {
                      updateContext('emergencyCalled', 'yes');
                      updateContext('pronouncementStatus', 'needed');
                    }}>I've called 911</button>
                    <button className={context.emergencyCalled === 'unsure' ? 'ghost active-action' : 'ghost'} onClick={() => {
                      updateContext('emergencyCalled', 'unsure');
                      updateContext('pronouncementStatus', 'needed');
                    }}>I'm not sure if I need to</button>
                  </div>
                  {context.emergencyCalled && (
                    <div style={{ marginTop: 10, fontSize: 13, color: context.emergencyCalled === 'yes' ? C.sageDark : C.rose, fontWeight: 700 }}>
                      {context.emergencyCalled === 'yes'
                        ? "Okay. We'll keep the official pronouncement step visible until it is handled."
                        : 'If you are unsure, call 911 or your local emergency number now and ask for instructions.'}
                    </div>
                  )}
                </div>
              )}
              {context.deathContext === 'past' && (
                <div className="urgent-alert" style={{ background: C.sageFaint, borderColor: C.sageLight }}>
                  <strong>Understood. Let's get you organized from here.</strong> Confirm what has already happened, then Passage will focus on the next open step.
                </div>
              )}
            </div>

            <div className="authority-strip">
              <div className="context-title">Who can make decisions right now?</div>
              <div className="context-help">Release, medical, and funeral decisions need a clear person. If you are not sure, Passage will keep that visible before anything is sent.</div>
              <div className="authority-options">
                {[
                  ['self', 'I can decide'],
                  ['someone_else', 'Someone else can'],
                  ['unsure', "I'm not sure"],
                ].map(([value, label]) => (
                  <button key={value} className={context.authorityStatus === value ? 'active' : ''} onClick={() => updateContext('authorityStatus', value)}>{label}</button>
                ))}
              </div>
              <div className="context-help" style={{ marginTop: 8 }}>{authorityMessage(context.authorityStatus)}</div>
            </div>
            <div className="save-strip">
              <div className="field compact">
                <label>Name of the person who passed</label>
                <input value={deceasedName} onChange={e => setDeceasedName(e.target.value)} placeholder="Their name" />
              </div>
              <div className="field compact">
                <label>Date</label>
                <input value={dateOfDeath} onChange={e => setDateOfDeath(e.target.value)} type="date" />
              </div>
              <button className="secondary save-command" onClick={openCommandCenter} disabled={savingEstate}>
                {savingEstate ? 'Saving...' : user ? 'Open saved command center' : 'Sign in to save'}
              </button>
              {saveError && <div className="save-error">{saveError}</div>}
            </div>
            <div className="context-grid">
              <div className="context-title">Shape the first steps</div>
              <div className="context-help">Only answer what helps the current step. Later details can wait.</div>
              <div className="field compact">
                <label>Official pronouncement</label>
                <select value={context.pronouncementStatus} onChange={e => updateContext('pronouncementStatus', e.target.value)}>
                  <option value="">Not sure yet</option>
                  <option value="confirmed">Pronounced / confirmed</option>
                  <option value="needed">Need to confirm</option>
                </select>
              </div>
              <div className="field compact">
                <label>Funeral home</label>
                <input value={context.funeralHomeName} onChange={e => updateContext('funeralHomeName', e.target.value)} placeholder="Name, if known" />
              </div>
              <div className="field compact">
                <label>Healthcare proxy / decision-maker</label>
                <input value={context.authorityName} onChange={e => updateContext('authorityName', e.target.value)} placeholder="Name, if known" />
              </div>
              <div className="field compact">
                <label>Hospital / hospice / doctor</label>
                <input value={context.hospitalOrHospiceContact} onChange={e => updateContext('hospitalOrHospiceContact', e.target.value)} placeholder="Contact or facility" />
              </div>
              <details className="later-details">
                <summary>Details for later if you already know them</summary>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 10 }}>
                  <div className="field compact">
                    <label>Cemetery / burial place</label>
                    <input value={context.cemeteryName} onChange={e => updateContext('cemeteryName', e.target.value)} placeholder="Name, if known" />
                  </div>
                  <div className="field compact">
                    <label>Faith tradition</label>
                    <select value={context.faithTradition} onChange={e => updateContext('faithTradition', e.target.value)}>
                      <option value="">No specific tradition / not sure</option>
                      <option value="Jewish">Jewish</option>
                      <option value="Catholic">Catholic</option>
                      <option value="Christian / Protestant">Christian / Protestant</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddhist">Buddhist</option>
                      <option value="Other">Other / custom</option>
                    </select>
                  </div>
                  <div className="field compact">
                    <label>Clergy / officiant</label>
                    <input value={context.clergyName} onChange={e => updateContext('clergyName', e.target.value)} placeholder="Name or community" />
                  </div>
                  <div className="field compact">
                    <label>Medical records / documents location</label>
                    <input value={context.medicalRecordsLocation} onChange={e => updateContext('medicalRecordsLocation', e.target.value)} placeholder="Records, proxy, medication list, insurance cards" />
                  </div>
                </div>
              </details>
            </div>
            <div className="phase">{primary.phase}</div>
            <h2>{primary.title}</h2>
            <p className="support">{primary.support}</p>

            <div className="owner">
              {primary.owner ? (
                <>
                  <strong>{primary.owner.name}</strong> is handling this.
                  {primary.owner.phone || primary.owner.email ? <><br />Contact: {[primary.owner.phone, primary.owner.email].filter(Boolean).join(' / ')}</> : null}
                </>
              ) : (
                <>{selectedSituation ? 'No one is assigned yet. Choose the person most likely to answer and follow through.' : 'Pick the situation above first. Passage will then show the right immediate action.'}</>
              )}
            </div>

            {selectedSituation && primary.owner && <TaskPlaybook task={primary} />}

            {selectedSituation && (
              <div className="stack">
                <button className="primary" onClick={() => setAssigning(primary)}>
                  {primary.owner ? 'Change owner' : 'Assign owner'}
                </button>
                {primary.owner && (
                  <button className="secondary" onClick={() => markHandled(primary.id)}>
                    Mark handled
                  </button>
                )}
              </div>
            )}
          </div>

          <aside className="card side">
            <div className="kicker">Progress</div>
            <h2 style={{ fontSize: 23 }}>Still steady.</h2>
            <div className="meter" style={{ '--pct': `${Math.round((handled / outcomes.length) * 100)}%` }}>
              <div className="fill" />
            </div>
            <div className="stat-row">
              <div className="stat"><b>{assigned}</b><span>Assigned</span></div>
              <div className="stat"><b>{handled}</b><span>Handled</span></div>
            </div>
            <div className="next">
              <h3>This can wait</h3>
              {nextItems.slice(0, 1).map((item, index) => (
                <div className="next-item" key={item.id}>
                  <div className="dot">{index + 1}</div>
                  <div>
                    <div className="next-title">{item.phase} - {item.title}</div>
                    <div className="next-support">{item.owner ? `${item.owner.name} owns this.` : item.support}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>

      {assigning && (
        <AssignModal
          task={assigning}
          savedPeople={people}
          onClose={() => setAssigning(null)}
          onSave={saveOwner}
        />
      )}
    </main>
  );
}
