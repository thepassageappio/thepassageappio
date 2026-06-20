// Passage Calm Guided OS — employee "My Work" surface (Cycle 4).
// Funeral-home staff: assigned client steps, one action each, prepared output +
// waiting + proof. Built on polished CalmKit. Self-contained sample data; safe to deploy.
import { useState } from 'react';
import Head from 'next/head';
import { DS, TYPE } from '../../lib/designSystem';
import { AppShell, HeroTask, TaskRow, TaskSheet, SectionLabel, ProgressLine } from '../../components/calm/CalmKit';

const HERO = {
  id: 'spray',
  title: 'Booker family — order casket spray',
  statusKey: 'yours_now',
  why: 'Prepared output: vendor request drafted to Maple Floral. Send it to start the clock.',
  action: 'Review & send request',
  details: [
    ['Prepared output', 'Vendor request to Maple Floral'],
    ['Waiting on', 'Your send'],
    ['Proof saves to', 'Booker case file'],
    ['Escalate to', 'Director — Sarah R.'],
  ],
};

const READY = [
  { id: 'chen', title: 'Chen — confirm transport time', statusKey: 'yours_now', eta: '2 min',
    why: 'Prepared output: confirmation message ready for the family.', action: 'Send confirmation',
    details: [['Prepared output', 'Transport confirmation'], ['Proof saves to', 'Chen case file']] },
];

const WAITING = [
  { id: 'photo', title: 'Alvarez — slideshow photo', statusKey: 'waiting', who: 'family' },
  { id: 'invoice', title: 'Engel — final invoice proof', statusKey: 'done', who: 'you' },
];

export default function MyWorkPreview() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <Head><title>Passage · My Work (employee preview)</title><meta name="robots" content="noindex" /></Head>
      <div style={{ minHeight: '100vh', background: DS.color.page, padding: '28px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ ...TYPE.small, color: DS.color.mid, margin: '0 0 16px', textAlign: 'center', maxWidth: 360 }}>
          Employee &ldquo;My Work&rdquo; &mdash; assigned client steps, one clear action each. Tap any step.
        </p>
        <AppShell brand="passage · staff" active="Today">
          <div style={{ padding: '8px 18px 0' }}>
            <h1 style={{ ...TYPE.h1, color: DS.color.ink, margin: '6px 0 2px' }}>My Work</h1>
            <p style={{ ...TYPE.small, color: DS.color.mid, margin: '0 0 8px' }}>Dana K. &middot; 2 steps need you</p>
            <ProgressLine done={4} total={9} />
          </div>
          <div style={{ padding: '0 16px' }}>
            <SectionLabel>Do this next</SectionLabel>
            <HeroTask task={HERO} onOpen={setOpen} />
            <SectionLabel>Also assigned to you</SectionLabel>
            {READY.map((t) => <TaskRow key={t.id} task={t} onOpen={setOpen} />)}
            <SectionLabel>Waiting &mdash; nothing to do</SectionLabel>
            {WAITING.map((t) => <TaskRow key={t.id} task={t} muted />)}
          </div>
        </AppShell>
        {open && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,.28)', padding: 14 }} onClick={() => setOpen(null)}>
            <div style={{ width: 360, maxWidth: '100%', height: 'min(680px, 90vh)', position: 'relative',
              borderRadius: 26, overflow: 'hidden', border: `1px solid ${DS.color.hair}` }} onClick={(e) => e.stopPropagation()}>
              <TaskSheet task={open} onClose={() => setOpen(null)} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
