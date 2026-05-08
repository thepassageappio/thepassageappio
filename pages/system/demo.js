import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';

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
    title: 'Set up the employee, then assign the work.',
    point: 'Directors save staff profiles first; case tasks then assign from saved employees, family contacts, participants, clergy, cemetery contacts, or vendors.',
    action: 'Show Add employee in Staff work, then assign a task from the saved dropdown. Notifications remain approval-based.',
  },
  {
    id: 'coordinate',
    kicker: 'Coordinate',
    title: 'Coordinate without mixing messages, notifications, and proof.',
    point: 'Mock the real-life handoff: director asks family once, staff sees the work, cemetery/vendor gets a scoped request, and proof is recorded separately.',
    action: 'Say: "Notifications get attention. Conversation coordinates the work. Proof records what happened."',
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
    title: 'Family request',
    messages: [
      ['Director', 'We need the cemetery plot section and lot number before we can finalize Thursday.'],
      ['Family', 'It is Section B, Lot 18. I uploaded the deed from my mother.'],
      ['Status', 'Waiting state cleared. Staff can now confirm with cemetery.'],
    ],
  },
  {
    title: 'Cemetery handoff',
    messages: [
      ['Coordinator', 'The family prefers Thursday afternoon if the cemetery can confirm availability.'],
      ['Cemetery', 'Thursday at 2:00 PM is available. Permit must be received first.'],
      ['Status', 'Cemetery availability recorded. Permit remains a blocker.'],
    ],
  },
  {
    title: 'Participant help',
    messages: [
      ['Family', 'Paul can bring the framed photo and confirm pallbearer names.'],
      ['Participant', 'I have the photo and will send names by 6 PM.'],
      ['Status', 'Participant task remains assigned. Next update expected this evening.'],
    ],
  },
];

const coordinationLayers = [
  ['Conversation', 'The human request and reply attached to the task.'],
  ['Notification', 'Email/SMS/in-app routing that tells the right person attention is needed.'],
  ['Proof', 'The recorded outcome: actor, timestamp, note, file, status, and destination.'],
];

const demoMetrics = [
  ['Active cases', '20'],
  ['Waiting responses', '7'],
  ['Staff tasks today', '14'],
  ['Calls avoided', '38'],
  ['CSV exports', '5'],
  ['Avg next update', '18 hrs'],
];

const ecosystemPaths = [
  {
    title: 'Family command center',
    body: 'One next task, proof capture, people, messages, events, exports, and a readable activity trail.',
    label: 'Dummy task spine',
  },
  {
    title: 'Participant view',
    body: 'Assigned work only: accept it, mark waiting, record handled, or ask for help. No funeral-home admin clutter.',
    label: 'Dummy helper flow',
  },
  {
    title: 'Funeral-home dashboard',
    body: 'Case inbox, staff work, waiting items, location metrics, calls avoided, and CSV export.',
    label: 'Dummy partner view',
  },
  {
    title: 'Vendor page',
    body: 'Task-native request portal: viewed, accepted, in-progress, completed, and referral value tracking.',
    label: 'Dummy vendor loop',
  },
  {
    title: 'Vendor admin',
    body: 'System-admin approval and vendor trust controls. Not visible to families or partner funeral homes.',
    label: 'System admin only',
  },
];

const readinessChecks = [
  'Demo studio is separate from the partner funeral-home dashboard.',
  'System-admin nav rolls demo, vendor approval, vendor QA, reporting, and support intake under one Passage-only command center.',
  'Guided coach stays in dummy demo data and does not depend on real estates.',
  'Family, participant, funeral-home, and vendor surfaces reuse the same task/proof/audit language.',
  'CSV export remains the adoption-trust close.',
];

const valueStory = [
  {
    title: 'For funeral directors',
    body: 'Passage turns repeated status calls into one family command center: what is done, what is waiting, who owns it, and proof.',
    metric: 'Fewer repeated calls',
  },
  {
    title: 'For employees',
    body: 'Staff see the next case task, what Passage prepared, what they must do, and where to record the outcome.',
    metric: 'Clear delegated work',
  },
  {
    title: 'For families',
    body: 'Families see one calm next step and can invite helpers without losing control or wondering what happened.',
    metric: 'Less confusion',
  },
  {
    title: 'For adoption',
    body: 'CSV export and demo-safe onboarding show Passage can sit on top of existing funeral-home systems.',
    metric: 'No lock-in',
  },
];

const tomorrowWorkflow = [
  'Create or import a case with the family contact.',
  'Move the single next task: handle it, assign it, or mark what is waiting.',
  'Use messages to coordinate family, staff, cemetery, clergy, or vendor context.',
  'Watch the activity trail instead of answering another "where are we?" call.',
  'Export the case record when the funeral home needs it in its existing system.',
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
  const [demoStaffRows, setDemoStaffRows] = useState(staff);
  const [demoCaseRows, setDemoCaseRows] = useState(cases);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  const activeStep = useMemo(() => demoSteps.find(step => step.id === selectedStep) || demoSteps[0], [selectedStep]);
  const currentIndex = demoSteps.findIndex(step => step.id === activeStep.id);
  const previousStep = demoSteps[Math.max(currentIndex - 1, 0)];
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

  function addDemoEmployee() {
    setDemoStaffRows((rows) => [...rows, ['Demo arranger', 'Added during this demo only. Routes service-prep tasks and family follow-up.']]);
    demoAction('Demo employee added locally. No staff account or production record was created.');
  }

  function addDemoFamily() {
    setDemoCaseRows((rows) => [...rows, ['Turrisi Family', 'At-need', 'First 48 hours active', 'Demo location']]);
    demoAction('Demo family case added locally. No real estate or Supabase row was created.');
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
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, .85fr)', gap: 22, alignItems: 'start' }}>
              <Panel>
                <div style={eyebrow}>System admin sales demo</div>
                <h1 style={{ ...h1, maxWidth: 720 }}>A guided walkthrough for funeral-home directors.</h1>
                <p style={{ ...lead, maxWidth: 760 }}>A clean, dummy-only walkthrough. Each step shows one screen and one sales point so the director is not overwhelmed.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
                  <button onClick={() => { setSelectedStep('overview'); demoAction('Guided demo started. Use Next demo moment to move through one screen at a time.'); }} style={primaryButton}>Start guided demo</button>
                  <button onClick={() => demoAction('Demo reset: use the dummy cases, staff, messages, vendor loop, and export close below. No real estate data is touched.')} style={secondaryButton}>Reset dummy demo</button>
                </div>
              </Panel>

              <Panel>
                <div style={eyebrow}>Demo order</div>
                <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 16, padding: 14, marginBottom: 10 }}>
                  <div style={{ color: C.sage, fontSize: 11, fontWeight: 900 }}>STEP {currentIndex + 1} OF {demoSteps.length}</div>
                  <div style={{ fontSize: 19, fontWeight: 900, marginTop: 4 }}>{activeStep.title}</div>
                </div>
                <details>
                  <summary style={{ cursor: 'pointer', color: C.sage, fontWeight: 900 }}>Show full order</summary>
                  <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
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
                </details>
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
                  <button onClick={() => setSelectedStep(previousStep.id)} style={secondaryButton} disabled={currentIndex === 0}>Back</button>
                  <button onClick={() => setSelectedStep(nextStep.id)} style={primaryButton} disabled={currentIndex === demoSteps.length - 1}>Next demo moment</button>
                </div>
              </Panel>

              <DemoStage
                activeStepId={activeStep.id}
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
                demoAction={demoAction}
                staffRows={demoStaffRows}
                caseRows={demoCaseRows}
                addDemoEmployee={addDemoEmployee}
                addDemoFamily={addDemoFamily}
              />
            </section>

            <details style={{ marginTop: 22 }}>
              <summary style={{ cursor: 'pointer', color: C.sage, fontWeight: 900, background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 16 }}>Demo appendix: product map, readiness checks, and close</summary>
              <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(280px, .75fr)', gap: 22, marginTop: 16, alignItems: 'start' }}>
                <Panel>
                  <div style={eyebrow}>Connected product map</div>
                  <h2 style={h2}>Every demo stop points to the same task spine.</h2>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {ecosystemPaths.map((path) => (
                      <div key={path.title} style={{ ...smallCard, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 900 }}>{path.title}</div>
                          <div style={smallText}>{path.body}</div>
                        </div>
                        <span style={tinyPill}>{path.label}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <div style={eyebrow}>Readiness checks</div>
                  <h2 style={h2}>Demo-safe boundaries.</h2>
                  <div style={{ display: 'grid', gap: 9 }}>
                    {readinessChecks.map((check) => (
                      <div key={check} style={{ display: 'grid', gridTemplateColumns: '24px minmax(0,1fr)', gap: 9, alignItems: 'start', color: C.mid, lineHeight: 1.45 }}>
                        <span style={{ color: C.sage, fontWeight: 900 }}>OK</span>
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </section>
            </details>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

function DemoStage({ activeStepId, selectedChat, setSelectedChat, demoAction, staffRows, caseRows, addDemoEmployee, addDemoFamily }) {
  if (activeStepId === 'overview') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>The one-sentence value story.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {valueStory.map((item) => (
            <div key={item.title} style={smallCard}>
              <span style={tinyPill}>{item.metric}</span>
              <div style={{ fontSize: 18, fontWeight: 900, marginTop: 10 }}>{item.title}</div>
              <div style={smallText}>{item.body}</div>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  if (activeStepId === 'team') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>Locations and employees.</h2>
        <p style={{ ...lead, marginBottom: 14 }}>Show that directors, coordinators, and aftercare staff can receive different work without creating separate family-helper experiences.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {staffRows.map(([role, body], index) => (
            <div key={role + index} style={smallCard}>
              <div style={{ fontSize: 17, fontWeight: 900 }}>{role}</div>
              <div style={smallText}>{body}</div>
            </div>
          ))}
        </div>
        <button onClick={addDemoEmployee} style={{ ...tinyButton, marginTop: 12 }}>Add dummy employee</button>
      </Panel>
    );
  }

  if (activeStepId === 'case') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>Dummy case inbox.</h2>
        <p style={{ ...lead, marginBottom: 14 }}>Only dummy families appear here. This is where you show a case can be opened quickly without touching real estate data.</p>
        <div style={{ display: 'grid', gap: 9 }}>
          {caseRows.map(([name, type, status, location], index) => (
            <div key={name + index} style={{ ...smallCard, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{name}</div>
                <div style={smallText}>{type} - {location} - {status}</div>
              </div>
              <button onClick={() => demoAction(`${name} opened in the dummy talk track. No real case record was opened or changed.`)} style={tinyButton}>Preview</button>
            </div>
          ))}
        </div>
        <button onClick={addDemoFamily} style={{ ...tinyButton, marginTop: 12 }}>Add dummy family</button>
      </Panel>
    );
  }

  if (activeStepId === 'tasks') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>One task, one outcome.</h2>
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
    );
  }

  if (activeStepId === 'delegation') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>Delegation without confusion.</h2>
        <p style={{ ...lead, marginBottom: 14 }}>Employees, family helpers, vendors, clergy, cemetery, and funeral-home staff are not the same actor. The task spine keeps the action the same while the view changes by role.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {[
            ['Employee task', 'Appears in the funeral-home work queue.'],
            ['Family helper task', 'Appears in the participant view with accept, waiting, handled, and help.'],
            ['Vendor task', 'Appears in the vendor request loop only when the task needs local support.'],
          ].map(([title, body]) => (
            <div key={title} style={smallCard}>
              <div style={{ fontSize: 17, fontWeight: 900 }}>{title}</div>
              <div style={smallText}>{body}</div>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  if (activeStepId === 'coordinate') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>Task-native coordination.</h2>
        <p style={{ ...lead, marginBottom: 14 }}>The demo should prove the director can coordinate family, staff, cemetery, clergy, and vendors from one case task without creating another phone tree.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 9, marginBottom: 14 }}>
          {coordinationLayers.map(([title, body]) => (
            <div key={title} style={smallCard}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{title}</div>
              <div style={smallText}>{body}</div>
            </div>
          ))}
        </div>
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
    );
  }

  if (activeStepId === 'vendor') {
    return (
      <Panel>
        <div style={eyebrow}>Demo screen</div>
        <h2 style={h2}>Vendor support stays inside the task.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {[
            ['Preferred local support', 'Vendor appears inside the task only.'],
            ['Viewed -> Quoted -> Accepted', 'Response loop stays visible to family and home.'],
            ['Passage stays central', 'The family does not get pushed into a vendor directory.'],
          ].map(([title, body]) => (
            <div key={title} style={smallCard}>
              <div style={{ fontSize: 17, fontWeight: 900 }}>{title}</div>
              <div style={smallText}>{body}</div>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div style={eyebrow}>Demo screen</div>
      <h2 style={h2}>ROI, portability, and daily use.</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 9, marginBottom: 16 }}>
        {demoMetrics.map(([label, value]) => (
          <div key={label} style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 12 }}>
            <div style={{ color: C.sage, fontSize: 21, fontWeight: 900, lineHeight: 1 }}>{value}</div>
            <div style={{ color: C.mid, fontSize: 11.5, fontWeight: 900, marginTop: 5 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {tomorrowWorkflow.map((item, index) => (
          <div key={item} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr)', gap: 10, alignItems: 'start' }}>
            <span style={{ width: 30, height: 30, borderRadius: 999, background: C.sageFaint, color: C.sage, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{index + 1}</span>
            <span style={{ color: C.mid, lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
      </div>
      <button onClick={() => demoAction('Demo: CSV export shows Passage can sit on top of the funeral home system without locking data in.')} style={{ ...tinyButton, marginTop: 14 }}>Show export close</button>
    </Panel>
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
const secondaryButton = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
const smallCard = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 15, padding: 14 };
const smallText = { color: C.mid, fontSize: 13.5, lineHeight: 1.5, marginTop: 4 };
const tinyButton = { border: '1px solid #c8deca', background: C.sageFaint, color: C.sage, borderRadius: 11, padding: '8px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const tinyPill = { border: '1px solid #c8deca', background: C.sageFaint, color: C.sage, borderRadius: 11, padding: '8px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, whiteSpace: 'nowrap', fontSize: 13 };
