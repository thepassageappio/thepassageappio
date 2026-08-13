'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import styles from './OperatorDemo.module.css';

export type OperatorPersona = 'director' | 'staff' | 'vendor';

type Step = {
  action: string;
  next: string;
  receipt: string;
  status: string;
};

const stories: Record<OperatorPersona, {
  active: 'director' | 'staff' | 'partner';
  identity: string;
  role: string;
  eyebrow: string;
  title: string;
  intro: string;
  scope: string;
  subject: string;
  task: string;
  detail: string;
  facts: Array<[string, string]>;
  steps: Step[];
}> = {
  director: {
    active: 'director', identity: 'Elena Torres', role: 'Director at Northstar', eyebrow: 'DIRECTOR DEMO',
    title: 'Keep every family moving.', intro: 'See the work that needs attention, choose an owner, and review the confirmation before the family sees it.',
    scope: 'Northstar Funeral Home, Portland. Directors can see team workload and review saved confirmation.',
    subject: 'Sofia Rivera, Portland',
    task: 'Confirm service details with the family', detail: 'The Rivera family is waiting for a confirmed service time.',
    facts: [['Owner', 'Unassigned'], ['Waiting', 'The Rivera family'], ['Due', 'Today at 2:00 PM'], ['Visible to', 'Northstar team']],
    steps: [
      { action: 'Assign to Maya', next: 'Assigned', receipt: 'Maya now owns this step. The team activity shows who assigned it and when.', status: 'Assigned' },
      { action: 'Open submitted confirmation', next: 'Reviewing', receipt: 'The confirmation is open for review. Nothing has been shared with the family yet.', status: 'Reviewing' },
      { action: 'Approve family update', next: 'Ready for family', receipt: 'The update is approved and ready for the family. This browser demo did not send a message.', status: 'Ready' },
    ],
  },
  staff: {
    active: 'staff', identity: 'Maya Chen', role: 'Staff at Northstar', eyebrow: 'STAFF DEMO',
    title: 'One clear task at a time.', intro: 'See only the work assigned to you, start the next step, and save confirmation for your director.',
    scope: 'Northstar Funeral Home, Portland. Maya sees only work assigned to her.',
    subject: 'Sofia Rivera, Portland',
    task: 'Confirm service details with the family', detail: 'Call the family, confirm the service time, then save what was agreed.',
    facts: [['Owner', 'Maya Chen'], ['Waiting', 'The Rivera family'], ['Prepared', 'Call outline and questions'], ['Proof needed', 'Confirmed date and time']],
    steps: [
      { action: 'Start this task', next: 'In progress', receipt: 'The task is now in progress. The director can see that Maya started it.', status: 'In progress' },
      { action: 'Save confirmation', next: 'Waiting for review', receipt: 'The confirmed service time is saved for director review. The family has not been messaged.', status: 'Submitted' },
      { action: 'Return to My work', next: 'Complete', receipt: 'This example is complete. No real family or funeral-home record changed.', status: 'Complete' },
    ],
  },
  vendor: {
    active: 'partner', identity: 'Jordan Lee', role: 'Vendor at Cedar & Stem', eyebrow: 'VENDOR DEMO',
    title: 'Respond without seeing the family record.', intro: 'Review one request, accept the work with a quote, and submit delivery confirmation.',
    scope: 'Cedar & Stem. Jordan sees only requests sent to this vendor organization.',
    subject: 'Northstar request, Portland',
    task: 'Prepare a standing floral arrangement', detail: 'Northstar needs one low-scent arrangement delivered before the service.',
    facts: [['Requested by', 'Northstar Funeral Home'], ['Needed by', 'Friday at 10:00 AM'], ['Family details', 'Not shared'], ['Request status', 'Waiting for response']],
    steps: [
      { action: 'Accept with $185 quote', next: 'Accepted', receipt: 'Northstar can now review the $185 example quote. No purchase or payment was created.', status: 'Accepted' },
      { action: 'Start the order', next: 'In progress', receipt: 'The example order is in progress. Northstar can see the current status.', status: 'In progress' },
      { action: 'Submit delivery confirmation', next: 'Waiting for review', receipt: 'Delivery confirmation is ready for Northstar to review. No real order was changed.', status: 'Submitted' },
    ],
  },
};

export function OperatorDemo({ persona }: { persona: OperatorPersona }) {
  const story = stories[persona];
  const [step, setStep] = useState(0);
  const receiptRef = useRef<HTMLDivElement>(null);
  const current = story.steps[Math.min(step, story.steps.length - 1)];
  const finished = step >= story.steps.length;
  const displayedStatus = step === 0 ? 'Waiting' : story.steps[Math.min(step - 1, story.steps.length - 1)].status;

  function advance() {
    setStep((value) => Math.min(value + 1, story.steps.length));
    window.setTimeout(() => receiptRef.current?.focus(), 0);
  }

  function reset() {
    setStep(0);
    window.setTimeout(() => receiptRef.current?.focus(), 0);
  }

  return (
    <AppFrame active={story.active} identity={story.identity} mode="demo" role={story.role}>
      <p className={styles.boundary} role="status">Guided browser demo. Example changes reset when you leave. Nothing is saved to a real record or sent to anyone.</p>
      <header className={styles.heading}>
        <div><p>{story.eyebrow}</p><h1>{story.title}</h1><span>{story.intro}</span></div>
        <dl><div><dt>Open</dt><dd>{finished ? 0 : 1}</dd></div><div><dt>Completed</dt><dd>{step}</dd></div></dl>
      </header>
      <section className={styles.scope} aria-label="Demo access boundary"><strong>{story.identity}</strong><span>{story.scope}</span></section>
      <section className={styles.work} aria-labelledby="demo-task-title">
        <div className={styles.top}><span>{story.subject}</span><b>{finished ? 'Example complete' : displayedStatus}</b></div>
        <div className={styles.body}><p>WHAT NEEDS ATTENTION</p><h2 id="demo-task-title">{story.task}</h2><span>{story.detail}</span>
          <dl>{story.facts.map(([label, value], index) => <div key={label}><dt>{label}</dt><dd>{index === 0 && step > 0 && persona === 'director' ? 'Maya Chen' : index === 3 && step > 0 && persona === 'vendor' ? displayedStatus : value}</dd></div>)}</dl>
        </div>
        <div className={styles.action}>
          <p>{finished ? 'You completed the guided example. Reset it or choose another point of view.' : `Next: ${current.next}.`}</p>
          {finished ? <button onClick={reset} type="button">Reset this example</button> : <button onClick={advance} type="button">{current.action}</button>}
        </div>
      </section>
      <div className={styles.receipt} ref={receiptRef} role="status" tabIndex={-1}>
        <strong>{step === 0 ? 'No example action yet.' : finished ? 'Guided example complete.' : story.steps[step - 1].status}</strong>
        <p>{step === 0 ? 'Use the action above to move this example forward.' : story.steps[step - 1].receipt}</p>
      </div>
      <nav className={styles.exit} aria-label="Demo choices"><Link href="/demo">Choose another point of view</Link><Link href="/funeral-home">See the funeral-home experience</Link></nav>
    </AppFrame>
  );
}
