import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const C = {
  bg: '#f6f3ee',
  card: '#fff',
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

const SYSTEM_ADMIN_EMAILS = ['thepassageappio@gmail.com', 'steventurrisi@gmail.com'];

const demoSteps = [
  {
    id: 'overview',
    kicker: 'Open',
    title: 'Show Passage as the coordination layer.',
    point: 'Start with the pain: fewer repeated calls, clearer ownership, and a family-facing record the funeral home can trust.',
    action: 'Say: "This is not replacing your case system. It sits on top, reduces calls, and exports cleanly."',
  },
  {
    id: 'team',
    kicker: 'Setup',
    title: 'Set up locations and staff.',
    point: 'Directors, arrangers, coordinators, and location admins each see the work relevant to them.',
    action: 'Show how work can be routed by location and role without turning family helpers into funeral-home staff.',
  },
  {
    id: 'case',
    kicker: 'Case',
    title: 'Create a family case in under a minute.',
    point: 'Add the family contact and a few known facts. Passage creates the command center and starts the task spine.',
    action: 'Show at-need versus pre-need. Emphasize "add only what you know."',
  },
  {
    id: 'tasks',
    kicker: 'Work',
    title: 'Move one task, then show the proof.',
    point: 'Each task has a next action, an owner, a waiting state, and proof. Unknown never pretends to be done.',
    action: 'Use "Handle for family" only after recording what happened. Use "Need family info" when staff is blocked.',
  },
  {
    id: 'delegation',
    kicker: 'Delegate',
    title: 'Assign work to the right person.',
    point: 'Employees, family participants, clergy, cemetery contacts, and vendors are different actors with different views.',
    action: 'Explain that assignment sends an actionable email/SMS when configured and logs the update in Passage.',
  },
  {
    id: 'chat',
    kicker: 'Coordinate',
    title: 'Use one thread for the handoff.',
    point: 'Mock the real-life handoff: family, funeral home, cemetery, and religious leader in one tracked trail.',
    action: 'Point out that these messages become proof, not side-channel chaos.',
  },
  {
    id: 'vendor',
    kicker: 'Local support',
    title: 'Request trusted help inside the task.',
    point: 'Vendors are task-native: no directory, no browsing, just trusted help where it belongs.',
    action: 'Show sent, viewed, accepted, in progress, completed. Passage stays in the transaction trail.',
  },
  {
    id: 'export',
    kicker: 'Close',
    title: 'End with ROI and portability.',
    point: 'Calls avoided, waiting items, active cases, CSV export, and the family-facing audit trail are the adoption story.',
    action: 'Say: "You can use Passage without trapping your data here."',
  },
];

const staff = [
  ['Location admin', 'Sees roll-up metrics, location performance, and export controls.'],
  ['Funeral director', 'Owns arrangement decisions, family status, and sensitive handoffs.'],
  ['Coordinator', 'Moves routine tasks, chases missing info, records proof.'],
  ['Aftercare lead', 'Handles first-week and long-tail family follow-up.'],
];

const cases = [
  ['Marian Ellis', 'At-need', 'Hospital release waiting', 'Beacon'],
  ['Robert Alvarez', 'At-need', 'Cemetery and clergy coordination', 'Poughkeepsie'],
  ['Eleanor Price', 'Pre-need', 'Planning file in progress', 'Main location'],
];

const mockChats = [
  {
    title: 'Family + funeral home',
    messages: [
      ['Family', 'We confirmed the hospital release contact. Can you coordinate pickup timing?'],
      ['Director', 'Yes. I will call decedent affairs now and record the release reference here.'],
      ['Passage', 'Task moved to waiting. Family will see that the funeral home is tracking it.'],
    ],
  },
  {
    title: 'Family + cemetery + funeral home',
    messages: [
      ['Coordinator', 'The family prefers Thursday afternoon if the cemetery can confirm availability.'],
      ['Cemetery', 'Thursday at 2:00 PM is available. Permit must be received first.'],
      ['Passage', 'Cemetery availability recorded. Permit remains a blocker.'],
    ],
  },
  {
    title: 'Family + religious leader',
    messages: [
      ['Family', 'Rabbi Cohen can lead the service if the time is after 4:00 PM.'],
      ['Religious leader', 'I can do 4:30 PM and will send readings tonight.'],
      ['Passage', 'Officiant availability recorded under service details.'],
    ],
  },
];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSystemAdmin(user) {
  return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email));
}

export default function SystemDemo() {
  const [user, setUser] = useState(null);
  const [selectedStep, setSelectedStep] = useState('overview');
  const [selectedChat, setSelectedChat] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  const activeStep = useMemo(() => demoSteps.find(step => step.id === selectedStep) || demoSteps[0], [selectedStep]);
  const currentIndex = demoSteps.findIndex(step => step.id === activeStep.id);
  const nextStep = demoSteps[Math.min(currentIndex + 1, demoSteps.length - 1)];
  const admin = isSystemAdmin(user);

  async function signIn() {
    if (!supabase || typeof window === 'undefined') return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  function demoAction(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader user={user} onSignIn={signIn} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '30px 28px 64px' }}>
        {!user && (
          <Panel>
            <div style={eyebrow}>System admin demo</div>
            <h1 style={h1}>Sign in to open the Passage demo studio.</h1>
            <p style={lead}>This surface is for Passage system admins only. Real funeral homes and families should not see demo controls.</p>
            <button onClick={signIn} style={primaryButton}>Continue with Google</button>
          </Panel>
        )}

        {user && !admin && (
          <Panel>
            <div style={eyebrow}>System admin only</div>
            <h1 style={h1}>This demo studio is not available for this account.</h1>
            <p style={lead}>Use the normal funeral-home dashboard for partner work.</p>
            <Link href="/funeral-home/dashboard" style={secondaryLink}>Open funeral-home dashboard</Link>
          </Panel>
        )}

        {user && admin && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 22, alignItems: 'start' }}>
              <Panel>
                <div style={eyebrow}>System admin sales demo</div>
                <h1 style={{ ...h1, maxWidth: 720 }}>A guided walkthrough for funeral-home directors.</h1>
                <p style={{ ...lead, maxWidth: 760 }}>Use this as the clean demo environment. It shows the order, the talk track, and the operational "wow" moments without cluttering a live partner dashboard.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
                  <Link href="/system/demo?demoTour=funeral-home&demoStep=overview" style={primaryLink}>Start guided overlay</Link>
                  <Link href="/funeral-home/dashboard?demoTour=funeral-home&demoStep=dashboard" style={secondaryLink}>Open partner dashboard with guide</Link>
                  <Link href="/vendors/admin" style={secondaryLink}>Vendor admin</Link>
                </div>
              </Panel>

              <Panel>
                <div style={eyebrow}>Demo order</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {demoSteps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => setSelectedStep(step.id)}
                      style={{ textAlign: 'left', border: '1px solid ' + (activeStep.id === step.id ? C.sage : C.border), background: activeStep.id === step.id ? C.sageFaint : C.card, borderRadius: 14, padding: 12, cursor: 'pointer', fontFamily: 'Georgia,serif' }}
                    >
                      <div style={{ color: activeStep.id === step.id ? C.sage : C.soft, fontSize: 11, fontWeight: 900 }}>Step {index + 1} - {step.kicker}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, marginTop: 3 }}>{step.title}</div>
                    </button>
                  ))}
                </div>
              </Panel>
            </div>

            {notice && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 14, padding: 14, marginTop: 16, fontWeight: 900 }}>{notice}</div>}

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 22, marginTop: 22, alignItems: 'start' }}>
              <Panel>
                <div style={eyebrow}>{activeStep.kicker}</div>
                <h2 style={h2}>{activeStep.title}</h2>
                <p style={lead}>{activeStep.point}</p>
                <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 16, padding: 16, marginTop: 14 }}>
                  <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Say this</div>
                  <div style={{ fontSize: 17, lineHeight: 1.45, marginTop: 6 }}>{activeStep.action}</div>
                </div>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 16 }}>
                  <button onClick={() => setSelectedStep(nextStep.id)} style={primaryButton}>Next demo moment</button>
                  <Link href={`/system/demo?demoTour=funeral-home&demoStep=${activeStep.id}`} style={secondaryLink}>Show coach overlay</Link>
                </div>
              </Panel>

              <DemoStage selectedChat={selectedChat} setSelectedChat={setSelectedChat} demoAction={demoAction} />
            </section>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

function DemoStage({ selectedChat, setSelectedChat, demoAction }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Panel>
        <div style={eyebrow}>1. Staff and locations</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {staff.map(([role, body]) => (
            <div key={role} style={smallCard}>
              <div style={{ fontSize: 17, fontWeight: 900 }}>{role}</div>
              <div style={smallText}>{body}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div style={eyebrow}>2. Case setup</div>
        <div style={{ display: 'grid', gap: 9 }}>
          {cases.map(([name, type, status, location]) => (
            <div key={name} style={{ ...smallCard, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{name}</div>
                <div style={smallText}>{type} - {location} - {status}</div>
              </div>
              <button onClick={() => demoAction(`${name} opened in the guided talk track. In the live dashboard this opens the case record.`)} style={tinyButton}>Open</button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div style={eyebrow}>3. Task and delegation</div>
        <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 16, padding: 16 }}>
          <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Do this next</div>
          <h3 style={{ margin: '7px 0 5px', fontSize: 24 }}>Confirm hospital release process</h3>
          <p style={{ color: C.mid, lineHeight: 1.55, margin: 0 }}>Passage gives the staff script, tracks who owns it, and records release proof before marking it handled.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button onClick={() => demoAction('Demo: task assigned to the coordinator. Family sees "waiting on funeral home."')} style={tinyButton}>Assign to coordinator</button>
            <button onClick={() => demoAction('Demo: proof recorded. The audit log shows actor, note, and timestamp.')} style={tinyButton}>Record proof</button>
            <button onClick={() => demoAction('Demo: family information requested. The family sees exactly what is missing.')} style={tinyButton}>Need family info</button>
          </div>
        </div>
      </Panel>

      <Panel>
        <div style={eyebrow}>4. Communication command center</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {mockChats.map((chat, index) => (
            <button key={chat.title} onClick={() => setSelectedChat(index)} style={{ ...tinyButton, background: selectedChat === index ? C.sage : C.sageFaint, color: selectedChat === index ? '#fff' : C.sage }}>{chat.title}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {mockChats[selectedChat].messages.map(([sender, body], index) => (
            <div key={sender + index} style={{ background: index % 2 ? C.bg : C.sageFaint, border: '1px solid ' + C.border, borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 12, color: C.sage, fontWeight: 900 }}>{sender}</div>
              <div style={{ fontSize: 15, color: C.mid, lineHeight: 1.45, marginTop: 3 }}>{body}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div style={eyebrow}>5. Vendor and close</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {[
            ['Preferred local support', 'Vendor appears inside the task only.'],
            ['Viewed -> Quoted -> Accepted', 'Response loop stays visible to family and home.'],
            ['CSV export', 'Data portability closes the adoption objection.'],
          ].map(([title, body]) => (
            <div key={title} style={smallCard}>
              <div style={{ fontSize: 17, fontWeight: 900 }}>{title}</div>
              <div style={smallText}>{body}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Panel({ children }) {
  return <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.05)' }}>{children}</div>;
}

const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 36, lineHeight: 1.08, margin: '8px 0 10px', fontWeight: 400 };
const h2 = { fontSize: 30, lineHeight: 1.12, margin: '8px 0 10px', fontWeight: 400 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0 };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const primaryLink = { ...primaryButton, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
const smallCard = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 15, padding: 14 };
const smallText = { color: C.mid, fontSize: 13.5, lineHeight: 1.5, marginTop: 4 };
const tinyButton = { border: '1px solid #c8deca', background: C.sageFaint, color: C.sage, borderRadius: 11, padding: '8px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
