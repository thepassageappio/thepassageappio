import Head from 'next/head';
import { useRef, useState } from 'react';
import styles from '../../styles/EmployeeConsole.module.css';

const VIEWS = [
  { id: 'normal', label: 'My work', count: 4 },
  { id: 'waiting', label: 'Waiting', count: 2 },
  { id: 'escalated', label: 'Escalations', count: 1 },
  { id: 'handled', label: 'Handled', count: 7 },
  { id: 'empty', label: 'Clear desk', count: 0 },
];

const QUEUE = [
  {
    id: 'task-rivera',
    person: 'Sofia Rivera',
    caseId: 'NS-2051',
    task: 'Confirm the 2:00 PM transfer window',
    timing: 'Due in 24 min',
    tone: 'due',
    family: 'Family sees: Transfer window confirmed',
  },
  {
    id: 'task-chen',
    person: 'Arthur Chen',
    caseId: 'NS-2048',
    task: 'Send the service outline for review',
    timing: 'By 11:30 AM',
    tone: 'soon',
    family: 'Family sees: Service outline ready to review',
  },
  {
    id: 'task-brooks',
    person: 'James Brooks',
    caseId: 'NS-2044',
    task: 'Verify the portrait is print-ready',
    timing: 'By 1:00 PM',
    tone: 'steady',
    family: 'Family sees: Portrait received and checked',
  },
  {
    id: 'task-lee',
    person: 'Evelyn Lee',
    caseId: 'NS-2041',
    task: 'Prepare the room handoff for Dana',
    timing: 'By 3:15 PM',
    tone: 'steady',
    family: 'Internal handoff only',
  },
];

const WAITING = [
  {
    person: 'Arthur Chen',
    caseId: 'NS-2048',
    wait: 'Family reviewing the first service outline',
    owner: 'Lena Chen',
    nextCheck: 'Check again at 12:00 PM',
    fallback: 'If there is no reply, call the family coordinator at 12:15 PM.',
  },
  {
    person: 'James Brooks',
    caseId: 'NS-2044',
    wait: 'Print partner confirming the portrait proof',
    owner: 'Evergreen Print',
    nextCheck: 'Check again at 1:30 PM',
    fallback: 'If the proof is delayed, use the in-house print route.',
  },
];

const ESCALATIONS = [
  {
    person: 'Noah Patel',
    caseId: 'NS-2039',
    issue: 'The selected room is no longer available',
    raised: 'Raised 8 minutes ago',
    ask: 'Director decision: approve the Garden Room alternative',
    family: 'Family has not been notified yet',
  },
];

const HANDLED = [
  {
    person: 'Evelyn Lee',
    caseId: 'NS-2041',
    task: 'Confirm the music selections were received',
    handled: '9:18 AM',
    proof: 'Family update posted by Elena',
  },
  {
    person: 'Sofia Rivera',
    caseId: 'NS-2051',
    task: 'Attach the family-approved photo set',
    handled: '8:52 AM',
    proof: '6 selected photos saved to the case',
  },
  {
    person: 'Arthur Chen',
    caseId: 'NS-2048',
    task: 'Confirm the primary family coordinator',
    handled: '8:31 AM',
    proof: 'Lena Chen confirmed as coordinator',
  },
];

export default function EmployeeConsolePage() {
  const viewHeadingRef = useRef(null);
  const [view, setView] = useState('normal');
  const [activeTask, setActiveTask] = useState(QUEUE[0]);
  const [notice, setNotice] = useState('');
  const [completedIds, setCompletedIds] = useState([]);

  function changeView(nextView) {
    setView(nextView);
    setNotice('');
    requestAnimationFrame(() => viewHeadingRef.current?.focus());
  }

  function selectTask(task) {
    setActiveTask(task);
    setNotice(`${task.person} is now your next commitment.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function recordProof() {
    setCompletedIds((ids) => [...new Set([...ids, activeTask.id])]);
    setNotice(`Handled. Proof for ${activeTask.person} is ready in the case timeline.`);
  }

  function raiseEscalation() {
    setNotice(`Escalation raised for ${activeTask.person}. The director can see the decision needed now.`);
  }

  const remainingQueue = QUEUE.filter(
    (task) => task.id !== activeTask.id && !completedIds.includes(task.id),
  );

  return (
    <div className={styles.root}>
      <Head>
        <title>My work | Passage</title>
        <meta
          name="description"
          content="A focused funeral-home employee console for assigned work, waiting points, escalation, and family-visible proof."
        />
      </Head>

      <a className={styles.skip} href="#employee-console-main">Skip to my work</a>

      <header className={styles.mobileHeader}>
        <span className={styles.wordmark}>PASSAGE</span>
        <span className={styles.shiftStatus}><span /> On shift until 4:30</span>
        <button className={styles.avatarButton} aria-label="Open Elena Torres account menu" type="button">ET</button>
      </header>

      <div className={styles.appShell}>
        <aside className={styles.desktopRail} aria-label="Employee workspace">
          <div className={styles.railBrand}>
            <span className={styles.brandMark} aria-hidden="true">P</span>
            <span>PASSAGE</span>
          </div>
          <div className={styles.employeeCard}>
            <span className={styles.avatar}>ET</span>
            <span><strong>Elena Torres</strong><small>Care coordinator</small></span>
          </div>
          <nav className={styles.railNav} aria-label="Work views">
            {VIEWS.slice(0, 4).map((item) => (
              <button
                aria-current={view === item.id ? 'page' : undefined}
                className={view === item.id ? styles.railActive : undefined}
                key={item.id}
                onClick={() => changeView(item.id)}
                type="button"
              >
                <span>{item.label}</span><small>{item.count}</small>
              </button>
            ))}
          </nav>
          <div className={styles.railFooter}>
            <span><i /> On shift</span>
            <small>Northstar Funeral Home</small>
          </div>
        </aside>

        <main id="employee-console-main" className={styles.main}>
          <div className={styles.topline}>
            <div>
              <p className={styles.eyebrow}>Tuesday, July 15</p>
              <h1>Good morning, Elena.</h1>
            </div>
            <div className={styles.shiftSummary} aria-label="Shift workload summary">
              <span><strong>4</strong> assigned</span>
              <span><strong>2</strong> waiting</span>
              <span><strong>1</strong> escalation</span>
            </div>
          </div>

          <nav className={styles.mobileTabs} aria-label="Work views">
            {VIEWS.map((item) => (
              <button
                aria-pressed={view === item.id}
                className={view === item.id ? styles.tabActive : undefined}
                key={item.id}
                onClick={() => changeView(item.id)}
                type="button"
              >
                {item.label}{item.count > 0 && <span>{item.count}</span>}
              </button>
            ))}
          </nav>

          <div className={styles.liveNotice} aria-live="polite" aria-atomic="true">{notice}</div>

          {view === 'normal' && (
            <section aria-labelledby="normal-view-heading">
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>Do this next</p>
                  <h2 id="normal-view-heading" ref={viewHeadingRef} tabIndex="-1">One clear commitment.</h2>
                </div>
                <span className={styles.queueProgress}>{completedIds.length + 1} of {QUEUE.length}</span>
              </div>

              <article className={styles.focusCard}>
                <div className={styles.focusAccent} aria-hidden="true" />
                <div className={styles.focusMeta}>
                  <span className={styles.duePill}>{activeTask.timing}</span>
                  <span>{activeTask.caseId}</span>
                </div>
                <p className={styles.personLabel}>For {activeTask.person}</p>
                <h3>{activeTask.task}</h3>
                <div className={styles.contextStrip}>
                  <span className={styles.contextIcon} aria-hidden="true">i</span>
                  <p><strong>What the family knows</strong>{activeTask.family}</p>
                </div>
                <div className={styles.focusActions}>
                  <button className={styles.primaryButton} onClick={recordProof} type="button">
                    Record as handled <span aria-hidden="true">→</span>
                  </button>
                  <button className={styles.secondaryButton} onClick={raiseEscalation} type="button">I’m blocked</button>
                </div>
                <p className={styles.proofNote}>Recording this adds time, owner, outcome, and family-visible proof to the case timeline.</p>
              </article>

              <div className={styles.queueHeading}>
                <div><p className={styles.eyebrow}>Then</p><h2>Your queue</h2></div>
                <span>{remainingQueue.length} remaining</span>
              </div>
              <div className={styles.queueList}>
                {remainingQueue.map((task, index) => (
                  <article className={styles.queueItem} key={task.id}>
                    <span className={styles.queueNumber}>{String(index + 2).padStart(2, '0')}</span>
                    <div>
                      <span className={styles.caseLine}>{task.person} · {task.caseId}</span>
                      <h3>{task.task}</h3>
                      <p>{task.timing}</p>
                    </div>
                    <button onClick={() => selectTask(task)} type="button" aria-label={`Make ${task.task} the next commitment`}>
                      Start <span aria-hidden="true">→</span>
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {view === 'waiting' && (
            <StateSection eyebrow="Waiting points" heading="Know when to look again." headingRef={viewHeadingRef} intro="Work stays visible without asking you to keep it in your head.">
              <div className={styles.stateList}>
                {WAITING.map((item) => (
                  <article className={styles.waitCard} key={item.caseId}>
                    <div className={styles.cardTop}><span className={styles.waitPill}>Waiting</span><small>{item.caseId}</small></div>
                    <p className={styles.personLabel}>{item.person}</p><h3>{item.wait}</h3>
                    <dl><div><dt>Waiting on</dt><dd>{item.owner}</dd></div><div><dt>Next commitment</dt><dd>{item.nextCheck}</dd></div></dl>
                    <p className={styles.fallback}><span aria-hidden="true">↳</span>{item.fallback}</p>
                    <button className={styles.cardButton} onClick={() => setNotice(`Check-in opened for ${item.person}.`)} type="button">Open check-in <span aria-hidden="true">→</span></button>
                  </article>
                ))}
              </div>
            </StateSection>
          )}

          {view === 'escalated' && (
            <StateSection eyebrow="Needs a decision" heading="Escalate the decision, not the anxiety." headingRef={viewHeadingRef} intro="The director sees the exact block, owner, and family impact.">
              <div className={styles.stateList}>
                {ESCALATIONS.map((item) => (
                  <article className={styles.escalationCard} key={item.caseId}>
                    <div className={styles.cardTop}><span className={styles.escalationPill}>Director needed</span><small>{item.raised}</small></div>
                    <p className={styles.personLabel}>{item.person} · {item.caseId}</p><h3>{item.issue}</h3>
                    <div className={styles.decisionAsk}><strong>Decision requested</strong><p>{item.ask}</p></div>
                    <p className={styles.familyBoundary}><span aria-hidden="true">●</span>{item.family}</p>
                    <button className={styles.cardButton} onClick={() => setNotice(`Decision thread opened for ${item.person}.`)} type="button">Open decision thread <span aria-hidden="true">→</span></button>
                  </article>
                ))}
              </div>
            </StateSection>
          )}

          {view === 'handled' && (
            <StateSection eyebrow="Today’s proof" heading="Handled, with a visible trail." headingRef={viewHeadingRef} intro="Every completed commitment leaves the next person—and the family—clear on what happened.">
              <div className={styles.handledList}>
                {HANDLED.map((item) => (
                  <article className={styles.handledItem} key={`${item.caseId}-${item.task}`}>
                    <span className={styles.check} aria-hidden="true">✓</span>
                    <div><span>{item.person} · {item.caseId}</span><h3>{item.task}</h3><p>{item.proof}</p></div>
                    <time>{item.handled}</time>
                  </article>
                ))}
              </div>
            </StateSection>
          )}

          {view === 'empty' && (
            <section className={styles.emptyState} aria-labelledby="empty-heading">
              <span className={styles.emptyMark} aria-hidden="true">✓</span>
              <p className={styles.eyebrow}>Clear desk</p>
              <h2 id="empty-heading" ref={viewHeadingRef} tabIndex="-1">You’re caught up.</h2>
              <p>No assigned commitment needs your attention right now. Waiting work has its own next check-in, so nothing is quietly slipping.</p>
              <div className={styles.emptyProof}><strong>7 commitments handled today</strong><span>All have an owner, time, outcome, and case record.</span></div>
              <button className={styles.secondaryButton} onClick={() => changeView('waiting')} type="button">Review waiting points</button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function StateSection({ children, eyebrow, heading, headingRef, intro }) {
  return (
    <section aria-labelledby="state-view-heading">
      <div className={styles.stateHeader}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 id="state-view-heading" ref={headingRef} tabIndex="-1">{heading}</h2>
        <p>{intro}</p>
      </div>
      {children}
    </section>
  );
}
