import Head from 'next/head';
import { useMemo, useState } from 'react';
import styles from '../../styles/DirectorBriefing.module.css';

const CASES = [
  {
    id: 'rivera',
    name: 'Rivera family',
    person: 'Sofia Rivera',
    due: '10:30 AM',
    commitment: 'Confirm the ceremony venue so the family can approve the notice.',
    waiting: 'Maya Rivera is waiting for one clear recommendation.',
    reason: 'The venue is holding the preferred time until noon.',
    owner: 'Elena Torres',
    stage: 'Arranging',
  },
  {
    id: 'chen',
    name: 'Chen family',
    person: 'Arthur Chen',
    due: '11:15 AM',
    commitment: 'Review the transport plan and confirm the receiving location.',
    waiting: 'The transport partner needs the destination before dispatch.',
    reason: 'Two locations are prepared; one family decision is outstanding.',
    owner: 'Marcus Lee',
    stage: 'Arriving',
  },
  {
    id: 'williams',
    name: 'Williams family',
    person: 'James Williams',
    due: '1:00 PM',
    commitment: 'Send the family the final keepsake proof for approval.',
    waiting: 'Danielle Williams is ready to review the completed proof.',
    reason: 'All service details are settled. Approval is the final dependency.',
    owner: 'Avery Brooks',
    stage: 'Ready',
  },
];

const STAGES = [
  ['Arriving', 2],
  ['Arranging', 4],
  ['Waiting', 1],
  ['Aftercare', 1],
];

export default function DirectorBriefingPage() {
  const [selectedId, setSelectedId] = useState('rivera');
  const selected = useMemo(
    () => CASES.find((item) => item.id === selectedId) || CASES[0],
    [selectedId]
  );

  return (
    <div className={styles.root}>
      <Head>
        <title>Director Briefing | Passage</title>
        <meta
          name="description"
          content="A calm, priority-led operating briefing for funeral-home directors."
        />
      </Head>

      <a className={styles.skip} href="#briefing-main">Skip to briefing</a>

      <header className={styles.header}>
        <div className={styles.wordmark} aria-label="Passage">PASSAGE</div>
        <div className={styles.headerRight}>
          <span>Northstar Funeral Home · Director</span>
          <div className={styles.avatar} aria-label="Signed in as Elena Torres">ET</div>
        </div>
      </header>

      <main id="briefing-main" className={styles.shell}>
        <p className={styles.eyebrow}>Tuesday, 14 July · Morning briefing</p>
        <h1 className={styles.title}>Good morning, Elena.</h1>
        <p className={styles.subtitle}>
          Three cases need a decision before noon. Passage has placed the most
          time-sensitive family commitment first.
        </p>

        <section className={styles.horizon} aria-label="Active case flow">
          {STAGES.map(([label, count]) => (
            <div
              className={label === 'Waiting' ? `${styles.stage} ${styles.stageAttention}` : styles.stage}
              key={label}
            >
              <span className={styles.stageCount}>{count}</span>
              <span className={styles.stageLabel}>{label}</span>
            </div>
          ))}
        </section>

        <div className={styles.workspace}>
          <section className={styles.priority} aria-labelledby="priority-heading">
            <div className={styles.priorityTop}>
              <span className={styles.priorityLabel}>Priority now</span>
              <span className={styles.due}>Due {selected.due}</span>
            </div>

            <h2 id="priority-heading" className={styles.caseName}>{selected.name}</h2>
            <div className={styles.caseMeta} aria-label="Case context">
              <span>{selected.person}</span>
              <span>{selected.stage}</span>
              <span>Owner: {selected.owner}</span>
            </div>

            <p className={styles.commitment}>{selected.commitment}</p>

            <div className={styles.why}>
              <span className={styles.contextLabel}>Why this is next</span>
              <p>{selected.reason} {selected.waiting}</p>
            </div>

            <div className={styles.actionRow}>
              <button className={styles.primary} type="button">
                Open {selected.name.replace(' family', '')} case
              </button>
              <button className={styles.secondary} type="button">
                Assign commitment
              </button>
            </div>
          </section>

          <aside className={styles.rail} aria-labelledby="queue-heading">
            <div className={styles.railHeader}>
              <h2 id="queue-heading">Today</h2>
              <span>{CASES.length} decisions</span>
            </div>

            <div className={styles.queue}>
              {CASES.map((item) => (
                <button
                  aria-pressed={selectedId === item.id}
                  className={
                    selectedId === item.id
                      ? `${styles.queueButton} ${styles.queueButtonActive}`
                      : styles.queueButton
                  }
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  type="button"
                >
                  <span className={styles.queueItem}>
                    <span>
                      <strong className={styles.queueMain}>{item.name}</strong>
                      <span className={styles.queueSub}>{item.commitment}</span>
                    </span>
                    <span className={styles.queueTime}>{item.due}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className={styles.continuity}>
              <span className={styles.continuityLine} aria-hidden="true" />
              <div>
                <h3>Continuity check</h3>
                <p>
                  Family decisions, staff commitments, provider handoffs, and
                  proof resolve to one case record.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
