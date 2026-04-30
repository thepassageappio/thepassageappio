import { useEffect, useMemo, useState } from 'react';

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

function CandleLogo({ size = 34 }) {
  return (
    <div className="brand">
      <style>{`
        @keyframes flame {
          0%,100% { transform: translateX(-50%) scaleX(.86) scaleY(1) rotate(-2deg); opacity:.82; filter: drop-shadow(0 0 4px rgba(210,145,55,.28)); }
          18% { transform: translateX(-51%) scaleX(.94) scaleY(1.12) rotate(2deg); opacity:1; filter: drop-shadow(0 0 10px rgba(210,145,55,.52)); }
          41% { transform: translateX(-49%) scaleX(.78) scaleY(.92) rotate(-1deg); opacity:.72; }
          67% { transform: translateX(-52%) scaleX(1.02) scaleY(1.07) rotate(1deg); opacity:.96; }
        }
        @keyframes brandGlow {
          0%,100% { opacity:.22; transform:translate(-50%,-50%) scale(.92); }
          50% { opacity:.48; transform:translate(-50%,-50%) scale(1.08); }
        }
        @keyframes wordGlow {
          0%,100% { text-shadow: 0 0 0 rgba(190,140,70,0); color:#191815; }
          45% { text-shadow: 0 0 14px rgba(190,140,70,.20); color:#282217; }
          51% { text-shadow: 0 0 5px rgba(190,140,70,.12); color:#171510; }
        }
      `}</style>
      <span className="mark" style={{ width: size, height: size }}>
        <span className="halo" />
        <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
          <defs>
            <linearGradient id="waxUrgent" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#fbfaf7" />
              <stop offset="100%" stopColor="#d8d0c2" />
            </linearGradient>
            <radialGradient id="flameUrgent" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fff3c7" />
              <stop offset="48%" stopColor="#d7993c" />
              <stop offset="100%" stopColor="#765022" />
            </radialGradient>
          </defs>
          <path className="flame" d="M24 5 C31 13 30 20 24 26 C18 20 17 13 24 5Z" fill="url(#flameUrgent)" />
          <path d="M24 22 C24 25 24 27 24 30" fill="none" stroke="#3b3224" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M16 27 C16 23 32 23 32 27 L30 40 C29.6 42.4 18.4 42.4 18 40Z" fill="url(#waxUrgent)" stroke="rgba(25,24,21,.22)" />
          <path d="M18 28 C21 30 27 30 30 28" fill="none" stroke="rgba(255,255,255,.75)" strokeLinecap="round" />
        </svg>
      </span>
      <span className="brand-name">Passage</span>
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

        <div className="modal-note">We will keep this person available for other tasks. You can assign them again without retyping.</div>
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
  const [outcomes, setOutcomes] = useState(initialOutcomes);
  const [people, setPeople] = useState([]);
  const [assigning, setAssigning] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('passage_urgent_people') || '[]');
      if (Array.isArray(saved)) setPeople(saved);
    } catch {}
  }, []);

  const primary = outcomes.find(o => o.status !== 'handled') || outcomes[0];
  const nextItems = outcomes.filter(o => o.id !== primary?.id);
  const handled = outcomes.filter(o => o.status === 'handled').length;
  const assigned = outcomes.filter(o => o.owner).length;

  const reassurance = useMemo(() => {
    if (!primary) return 'Nothing urgent is missing right now.';
    if (primary.owner) return `${primary.owner.name} is holding the next step. You can breathe for a moment.`;
    return 'One thing at a time. Start by naming who owns the next practical step.';
  }, [primary]);

  const saveOwner = (person) => {
    const nextPeople = [person, ...people.filter(p => p.id !== person.id)];
    setPeople(nextPeople);
    try { localStorage.setItem('passage_urgent_people', JSON.stringify(nextPeople)); } catch {}
    setOutcomes(prev => prev.map(o => o.id === assigning.id ? { ...o, owner: person, status: 'in_progress' } : o));
    setAssigning(null);
  };

  const markHandled = (id) => {
    setOutcomes(prev => prev.map(o => o.id === id ? { ...o, status: 'handled' } : o));
  };

  return (
    <main>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; color: ${C.ink}; }
        main { min-height: 100vh; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: radial-gradient(circle at 50% 0%, #fffaf1 0%, ${C.bg} 42%, #f4efe7 100%); }
        .shell { max-width: 940px; margin: 0 auto; padding: 28px 22px 56px; }
        .brand { display: inline-flex; align-items: center; gap: 10px; }
        .brand-name { font-size: 25px; font-weight: 520; letter-spacing: 0; animation: wordGlow 4.6s ease-in-out infinite; }
        .mark { position: relative; display: inline-flex; align-items: center; justify-content: center; }
        .halo { position: absolute; inset: -8px; border-radius: 50%; background: radial-gradient(circle, rgba(207,149,60,.26), rgba(207,149,60,0) 66%); animation: brandGlow 4.2s ease-in-out infinite; }
        .flame { transform-origin: 24px 25px; animation: flame 2.9s ease-in-out infinite; }
        nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 52px; }
        nav a { color: ${C.mid}; text-decoration: none; font-size: 14px; }
        .hero { max-width: 690px; margin-bottom: 28px; }
        .kicker { color: ${C.rose}; font-size: 12px; text-transform: uppercase; letter-spacing: .16em; font-weight: 750; margin-bottom: 14px; }
        h1 { font-family: Georgia, serif; font-weight: 400; font-size: clamp(34px, 5vw, 58px); line-height: 1.05; margin: 0 0 16px; }
        .lede { font-size: 17px; line-height: 1.7; color: ${C.mid}; max-width: 620px; margin: 0; }
        .grid { display: grid; grid-template-columns: 1.5fr .8fr; gap: 18px; align-items: start; }
        .card { background: rgba(255,253,249,.92); border: 1px solid ${C.border}; border-radius: 18px; box-shadow: 0 18px 50px rgba(55,45,35,.08); }
        .primary-card { padding: 28px; }
        .phase { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: ${C.rose}; background: ${C.roseFaint}; border: 1px solid rgba(184,107,111,.22); border-radius: 999px; padding: 5px 10px; font-weight: 750; margin-bottom: 18px; }
        h2 { font-family: Georgia, serif; font-weight: 400; font-size: 31px; line-height: 1.18; margin: 0 0 12px; }
        .support { color: ${C.mid}; font-size: 15px; line-height: 1.75; margin: 0 0 22px; max-width: 580px; }
        .owner { background: ${C.subtle}; border-radius: 14px; padding: 15px 16px; color: ${C.mid}; line-height: 1.55; margin-bottom: 18px; }
        .owner strong { color: ${C.ink}; }
        button { font: inherit; }
        .primary, .secondary, .ghost { border: none; border-radius: 12px; padding: 12px 16px; font-weight: 750; cursor: pointer; }
        .primary { background: ${C.ink}; color: white; }
        .primary:disabled { opacity: .45; cursor: not-allowed; }
        .secondary { background: ${C.sage}; color: white; }
        .ghost { background: ${C.subtle}; color: ${C.mid}; border: 1px solid ${C.border}; }
        .stack { display: flex; gap: 10px; flex-wrap: wrap; }
        .side { padding: 20px; }
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
          .shell { padding: 22px 14px 48px; }
          nav { margin-bottom: 34px; }
          .grid { grid-template-columns: 1fr; }
          .primary-card { padding: 22px; }
          .field.two { grid-template-columns: 1fr; }
        }
      `}</style>

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
                <>No one is assigned yet. Choose the person most likely to answer and follow through.</>
              )}
            </div>

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
              {nextItems.map((item, index) => (
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
