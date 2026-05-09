import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#ffffff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  amber: '#b07d2e',
  amberFaint: '#fdf8ee',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
};

const lifecycle = [
  ['1', 'Preparing during care', 'Record the people, hospice/on-call contact, likely dates, and the first-hour plan.'],
  ['2', 'Death occurs', 'Start red-path guidance from what the family already knows.'],
  ['3', 'Funeral-home handoff', 'Share a reviewed packet with contacts, dates, preferences, blockers, and proof needs.'],
  ['4', 'Aftercare continues', 'Estate, benefits, accounts, family updates, grief support, and anniversaries stay in one record.'],
];

const warmTasks = [
  {
    title: 'Name the family coordinator',
    owner: 'Family',
    output: 'One responsible contact and a backup',
    proof: 'Coordinator saved',
    urgency: 'Start here',
  },
  {
    title: 'Record hospice agency and on-call line',
    owner: 'Caregiver',
    output: 'First call path if death happens at home',
    proof: 'Agency/contact saved',
    urgency: 'Needed before crisis',
  },
  {
    title: 'Prepare the when-it-happens plan',
    owner: 'Passage prepares, family reviews',
    output: 'First-hour steps and who calls whom',
    proof: 'Plan reviewed',
    urgency: 'Keep visible',
  },
  {
    title: 'Prepare funeral-home handoff',
    owner: 'Family coordinator',
    output: 'Contacts, known dates, preferences, missing items',
    proof: 'Packet approved before sharing',
    urgency: 'When ready',
  },
];

const dates = [
  ['Expected window', 'If known'],
  ['Date of death', 'When it occurs'],
  ['Pronouncement', 'Required first proof'],
  ['Removal or transfer', 'When scheduled'],
  ['Arrangement meeting', 'If scheduled'],
  ['Visitation / wake / shiva', 'If applicable'],
  ['Funeral / memorial', 'If scheduled'],
  ['Burial / interment / cremation', 'If scheduled'],
];

const handoff = [
  ['Primary contacts', 'Family coordinator, caregiver, backup, decision maker'],
  ['Care context', 'Hospice agency, on-call line, facility or home address'],
  ['Known dates', 'Only the dates the family knows; unknown dates become tasks'],
  ['Preferences', 'Disposition, service tone, faith or cultural needs, documents to find'],
  ['What is missing', 'The next items the funeral home or family should ask for'],
];

const warmSpine = [
  ['What happens now', 'Save the care contacts and first-hour plan before the crisis moment.'],
  ['Who owns it', 'A family coordinator, with Passage keeping the handoff organized.'],
  ['What is waiting', 'Unknown dates, funeral-home choice, and family approvals stay visible.'],
  ['How we know', 'Saved contacts, reviewed plan, known dates, and handoff packet proof.'],
];

export default function HospiceWarmPath() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    lovedOneName: '',
    coordinatorName: '',
    hospiceAgency: '',
    hospiceContact: '',
    hospicePhone: '',
    funeralHomeName: '',
    expectedWindow: '',
    pronouncementDate: '',
    arrangementDate: '',
    serviceDate: '',
    burialDate: '',
    shivaDate: '',
    receptionDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function signIn() {
    if (!supabase || typeof window === 'undefined') return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }

  async function saveWarmWorkspace() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (!user) {
        await signIn();
        return;
      }
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) throw new Error('Sign in once so Passage can save this workspace.');
      const res = await fetch('/api/warmPathEstate', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          coordinatorEmail: user.email,
          coordinatorName: form.coordinatorName || user.user_metadata?.full_name || user.email,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not save warm-path workspace.');
      setNotice('Warm-path workspace saved. Opening the command center.');
      window.setTimeout(() => {
        window.location.href = '/estate?id=' + encodeURIComponent(json.estateId);
      }, 600);
    } catch (err) {
      setError(err.message || 'Could not save warm-path workspace.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia, serif' }}>
      <style>{`
        @media (max-width: 820px) {
          .warm-hero-grid,
          .warm-two-col {
            grid-template-columns: 1fr !important;
          }
          .warm-task-row,
          .warm-handoff-row,
          .warm-contact-grid,
          .warm-date-grid,
          .warm-spine-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <SiteHeader />
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '38px 28px 26px' }}>
        <div className="warm-hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, .72fr)', gap: 22, alignItems: 'stretch' }}>
          <div style={heroCard}>
            <div style={eyebrow}>Preparing during care</div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.02, margin: '10px 0 14px', fontWeight: 400 }}>
              When hospice or serious illness is already part of the journey.
            </h1>
            <p style={lead}>
              Passage keeps the family from starting over at each handoff. Capture who to call, what is known, what is still uncertain, and what the funeral home should receive when the family is ready.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
              <a href="#start-warm-workspace" style={primaryLink}>Start warm-path workspace</a>
              <Link href="/urgent" style={primaryLink}>Death has occurred</Link>
              <Link href="/share?dn=Your%20loved%20one&cn=Your%20family" style={secondaryLink}>Prepare family update</Link>
              <Link href="/packet" style={secondaryLink}>View continuity packets</Link>
              <Link href="/system/demo?demoStep=warm" style={secondaryLink}>Open demo rail</Link>
            </div>
          </div>
          <div style={{ ...heroCard, background: C.sageFaint, borderColor: '#c8deca' }}>
            <div style={eyebrow}>The handoff promise</div>
            <h2 style={{ fontSize: 31, lineHeight: 1.12, margin: '10px 0 12px', fontWeight: 400 }}>
              Same record. Different door.
            </h2>
            <p style={lead}>
              A family may enter through planning, hospice preparation, urgent death guidance, or a funeral home. Passage should carry the context forward instead of making them rebuild it.
            </p>
            <div style={{ display: 'grid', gap: 9, marginTop: 18 }}>
              {['Family owns permissions', 'Nothing shares without approval', 'Unknown dates become visible tasks'].map(item => (
                <div key={item} style={statusRow}>{item}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="warm-spine-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
          {warmSpine.map(([label, value]) => (
            <div key={label} style={spineBox}>
              <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
              <div style={{ color: C.ink, fontSize: 14, lineHeight: 1.45, marginTop: 5 }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="start-warm-workspace" style={section}>
        <div className="warm-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .95fr) minmax(0, 1.05fr)', gap: 16, alignItems: 'stretch' }}>
          <div style={panel}>
            <div style={eyebrow}>Saved warm-path workspace</div>
            <h2 style={h2}>Start with what the family knows now.</h2>
            <p style={lead}>This creates a real Passage workspace with the first care-preparation tasks. It does not send email or SMS. It keeps unknown dates visible until they are available.</p>
            <div style={{ display: 'grid', gap: 9, marginTop: 16 }}>
              {[
                'Name the family coordinator',
                'Record hospice/on-call contact',
                'Prepare the first-hour plan',
                'Record preferred funeral home or undecided status',
                'Prepare family update list',
                'Prepare funeral-home handoff packet',
              ].map(item => <div key={item} style={statusRow}>{item}</div>)}
            </div>
          </div>
          <div style={panel}>
            <div style={eyebrow}>Create workspace</div>
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              <input value={form.lovedOneName} onChange={event => updateField('lovedOneName', event.target.value)} placeholder="Loved one's name" style={inputStyle} />
              <input value={form.coordinatorName} onChange={event => updateField('coordinatorName', event.target.value)} placeholder="Family coordinator name" style={inputStyle} />
              <input value={form.hospiceAgency} onChange={event => updateField('hospiceAgency', event.target.value)} placeholder="Hospice agency or care team, if known" style={inputStyle} />
              <div className="warm-contact-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, .7fr)', gap: 10 }}>
                <input value={form.hospiceContact} onChange={event => updateField('hospiceContact', event.target.value)} placeholder="Hospice/on-call contact" style={inputStyle} />
                <input value={form.hospicePhone} onChange={event => updateField('hospicePhone', event.target.value)} placeholder="Phone" style={inputStyle} />
              </div>
              <input value={form.funeralHomeName} onChange={event => updateField('funeralHomeName', event.target.value)} placeholder="Preferred funeral home, or leave blank" style={inputStyle} />
              <input value={form.expectedWindow} onChange={event => updateField('expectedWindow', event.target.value)} placeholder="Expected window, if the family knows it" style={inputStyle} />
              <details style={{ border: '1px solid ' + C.border, borderRadius: 13, background: C.bg, padding: 12 }}>
                <summary style={{ cursor: 'pointer', color: C.sage, fontWeight: 900, fontSize: 14 }}>Known dates, if any</summary>
                <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, margin: '7px 0 10px' }}>
                  Add only what the family actually knows. Unknown dates stay visible as tasks instead of blocking the workspace.
                </div>
                <div className="warm-date-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  <WarmDate label="Pronouncement" value={form.pronouncementDate} onChange={value => updateField('pronouncementDate', value)} />
                  <WarmDate label="Arrangement meeting" value={form.arrangementDate} onChange={value => updateField('arrangementDate', value)} />
                  <WarmDate label="Funeral / memorial" value={form.serviceDate} onChange={value => updateField('serviceDate', value)} />
                  <WarmDate label="Burial / committal" value={form.burialDate} onChange={value => updateField('burialDate', value)} />
                  <WarmDate label="Shiva / mourning" value={form.shivaDate} onChange={value => updateField('shivaDate', value)} />
                  <WarmDate label="Reception / gathering" value={form.receptionDate} onChange={value => updateField('receptionDate', value)} />
                </div>
              </details>
              {error && <div style={{ background: C.roseFaint, color: C.rose, border: '1px solid #efcaca', borderRadius: 12, padding: '10px 12px', fontSize: 13 }}>{error}</div>}
              {notice && <div style={{ background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 12, padding: '10px 12px', fontSize: 13 }}>{notice}</div>}
              {!user && <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.45 }}>Sign in once so Passage can save this to your family command center.</div>}
              <button onClick={saveWarmWorkspace} disabled={saving} style={{ ...primaryButton, opacity: saving ? .7 : 1 }}>{saving ? 'Saving...' : user ? 'Save warm-path workspace' : 'Sign in and save workspace'}</button>
            </div>
          </div>
        </div>
      </section>

      <section style={section}>
        <div style={sectionHeader}>
          <div style={eyebrow}>Lifecycle spine</div>
          <h2 style={h2}>The warm path is the bridge between planning and red path.</h2>
          <p style={lead}>This is not medical software. It is family coordination continuity before, during, and after the institutional handoff.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          {lifecycle.map(([n, title, body]) => (
            <div key={n} style={card}>
              <span style={numberBubble}>{n}</span>
              <h3 style={h3}>{title}</h3>
              <p style={smallText}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <div className="warm-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(300px, .8fr)', gap: 16, alignItems: 'start' }}>
          <div style={panel}>
            <div style={eyebrow}>One next move</div>
            <h2 style={h2}>Prepare the first-hour plan before everyone is in shock.</h2>
            <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
              {warmTasks.map(task => (
                <div key={task.title} className="warm-task-row" style={taskRow}>
                  <div>
                    <div style={{ color: C.amber, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{task.urgency}</div>
                    <h3 style={{ margin: '4px 0 5px', fontSize: 21, lineHeight: 1.16 }}>{task.title}</h3>
                    <div style={smallText}>Owner: {task.owner}</div>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={miniBox}><strong>Output</strong><span>{task.output}</span></div>
                    <div style={miniBox}><strong>Proof</strong><span>{task.proof}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={panel}>
            <div style={eyebrow}>Date intelligence</div>
            <h2 style={{ ...h2, fontSize: 30 }}>Rank the work around real events.</h2>
            <p style={lead}>If the family does not know a date, Passage should not block them. It should mark the missing date as an attention item.</p>
            <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
              {dates.map(([label, note]) => (
                <div key={label} style={dateRow}>
                  <strong>{label}</strong>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={section}>
        <div className="warm-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .9fr) minmax(0, 1.1fr)', gap: 16, alignItems: 'stretch' }}>
          <div style={{ ...panel, background: C.roseFaint, borderColor: '#efcaca' }}>
            <div style={{ ...eyebrow, color: C.rose }}>When death occurs</div>
            <h2 style={h2}>Red path starts from what the family already prepared.</h2>
            <p style={lead}>If this is a hospice case, Passage should put the hospice/on-call path first, then carry known contacts and preferences into the command center.</p>
            <Link href="/urgent" style={{ ...primaryLink, background: C.rose, marginTop: 18 }}>Open urgent path</Link>
          </div>
          <div style={panel}>
            <div style={eyebrow}>Funeral-home handoff packet</div>
            <h2 style={h2}>The family reviews once. The director starts with context.</h2>
            <div style={{ display: 'grid', gap: 9, marginTop: 16 }}>
              {handoff.map(([title, body]) => (
                <div key={title} className="warm-handoff-row" style={handoffRow}>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              <Link href="/funeral-home/dashboard?demoTour=funeral-home&demoStep=case" style={primaryLink}>Show funeral-home handoff</Link>
              <Link href="/packet" style={secondaryLink}>Generate packet demo</Link>
              <Link href="/share?dn=Jack%20Taylor&cn=Taylor%20family" style={secondaryLink}>Prepare event one-pager</Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...section, paddingBottom: 70 }}>
        <div style={panel}>
          <div style={eyebrow}>Roadmap impact</div>
          <h2 style={h2}>What this changes in the platform.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 16 }}>
            {[
              ['Spine events', 'Add warm-path events such as hospice contact recorded, when-it-happens plan prepared, and funeral-home handoff approved.'],
              ['Task priority', 'Rank by lifecycle state, service dates, death date, unknown required dates, and who is waiting on whom.'],
              ['Partner demo', 'Show the family arriving with context instead of making the funeral home start from zero.'],
              ['Announcement batch', 'Prepare one event one-pager and recipient groups before any send queue exists.'],
            ].map(([title, body]) => (
              <div key={title} style={smallCard}>
                <h3 style={h3}>{title}</h3>
                <p style={smallText}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function WarmDate({ label, value, onChange }) {
  return (
    <label style={{ display: 'grid', gap: 5, color: C.soft, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>
      {label}
      <input type="date" value={value} onChange={event => onChange(event.target.value)} style={inputStyle} />
    </label>
  );
}

const heroCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 22, padding: '30px 32px', boxShadow: '0 18px 48px rgba(55,45,35,.06)' };
const section = { maxWidth: 1180, margin: '0 auto', padding: '18px 28px 28px' };
const sectionHeader = { maxWidth: 760, marginBottom: 16 };
const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h2 = { fontSize: 34, lineHeight: 1.1, margin: '8px 0 10px', fontWeight: 400 };
const h3 = { fontSize: 19, lineHeight: 1.18, margin: '8px 0 6px' };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.62, margin: 0 };
const smallText = { color: C.mid, fontSize: 13.5, lineHeight: 1.52, margin: 0 };
const primaryLink = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '0 18px', background: C.sage, color: '#fff', textDecoration: 'none', borderRadius: 13, fontWeight: 900 };
const secondaryLink = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '0 18px', background: C.card, color: C.sage, textDecoration: 'none', borderRadius: 13, border: '1px solid #c8deca', fontWeight: 900 };
const primaryButton = { border: 'none', minHeight: 48, borderRadius: 13, background: C.sage, color: '#fff', padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const inputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid ' + C.border, borderRadius: 13, background: C.card, minHeight: 48, padding: '0 14px', fontFamily: 'Georgia,serif', fontSize: 15, color: C.ink };
const statusRow = { background: C.card, border: '1px solid #c8deca', borderRadius: 13, padding: '12px 14px', color: C.sage, fontWeight: 900 };
const card = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 18 };
const panel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 22, padding: 24, boxShadow: '0 10px 34px rgba(55,45,35,.04)' };
const numberBubble = { width: 34, height: 34, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.sageFaint, color: C.sage, fontWeight: 900 };
const taskRow = { display: 'grid', gridTemplateColumns: 'minmax(0, .95fr) minmax(220px, .8fr)', gap: 12, border: '1px solid ' + C.border, borderRadius: 17, padding: 15, background: C.bg };
const miniBox = { background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: '10px 12px', display: 'grid', gap: 4, color: C.mid, fontSize: 13 };
const dateRow = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', background: C.bg, border: '1px solid ' + C.border, borderRadius: 12, padding: '10px 12px', color: C.mid };
const handoffRow = { display: 'grid', gridTemplateColumns: '160px minmax(0, 1fr)', gap: 12, background: C.bg, border: '1px solid ' + C.border, borderRadius: 13, padding: '12px 13px', color: C.mid };
const smallCard = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 15, padding: 16 };
const spineBox = { background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: '13px 14px' };
