// Passage Calm Guided OS — experience preview (E2).
// Self-contained: sample data only, no auth/Supabase, safe to deploy at /preview/calm-os.
import { useState } from 'react';
import Head from 'next/head';
import { DS } from '../../lib/designSystem';
import { AppShell, HeroTask, TaskRow, TaskSheet, SectionLabel, ProgressLine } from '../../components/calm/CalmKit';

const HERO = {
  id: 'fh',
  title: 'Confirm the funeral home selection',
  statusKey: 'yours_now',
  why: 'Once you confirm, Maple Grove can begin. This unblocks 3 other steps.',
  action: 'Review & confirm',
  details: [
    ['What you’ll get', 'Signed arrangement summary'],
    ['Who sees this', 'You, Maria, Maple Grove'],
    ['Unblocks', '3 waiting steps'],
    ['Need a hand?', 'Talk to a Passage guide'],
  ],
};

const READY = [
  { id: 'cert', title: 'Upload the death certificate', statusKey: 'yours_now', eta: '2 min',
    why: 'We use this to release the next steps with the county and the bank.', action: 'Upload certificate', details: [['Format', 'Photo or PDF'], ['Who sees this', 'You and the funeral home']] },
  { id: 'sister', title: 'Add your sister as a family member', statusKey: 'yours_now', eta: '1 min',
    why: 'She can then take a few tasks off your plate.', action: 'Send invite', details: [['Role', 'Family member'], ['She sees', 'Only what you share']] },
];

const WAITING = [
  { id: 'bank', title: 'Estate account — bank review', statusKey: 'waiting', who: 'First National' },
  { id: 'obit', title: 'Obituary draft', statusKey: 'done', who: 'Maria' },
];

export default function CalmOsPreview() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <Head><title>Passage · calm preview</title><meta name="robots" content="noindex" /></Head>
      <div style={{ minHeight: '100vh', background: DS.color.page, padding: '28px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <p style={{ fontSize: 13, color: DS.color.mid, margin: '0 0 16px', textAlign: 'center', maxWidth: 360 }}>
          Calm Guided OS preview &mdash; the reimagined family experience. Tap the hero or any task.
        </p>
        <AppShell active="Today">
          <div style={{ padding: '8px 18px 0' }}>
            <h1 style={{ fontSize: 19, fontWeight: 600, color: DS.color.ink, margin: '6px 0 2px' }}>Good morning, Steve.</h1>
            <div style={{ marginTop: 10 }}><ProgressLine done={8} total={23} /></div>
          </div>
          <div style={{ padding: '0 16px' }}>
            <SectionLabel>Start here</SectionLabel>
            <HeroTask task={HERO} onOpen={setOpen} />
            <SectionLabel>A few more, when you&rsquo;re ready</SectionLabel>
            {READY.map((t) => <TaskRow key={t.id} task={t} onOpen={setOpen} />)}
            <SectionLabel>Waiting on others &mdash; nothing to do</SectionLabel>
            {WAITING.map((t) => <TaskRow key={t.id} task={t} muted />)}
          </div>
        </AppShell>
        {open && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,.28)', padding: 14 }} onClick={() => setOpen(null)}>
            <div style={{ width: 360, maxWidth: '100%', height: 'min(680px, 90vh)', position: 'relative',
              borderRadius: 26, overflow: 'hidden', border: `1px solid ${DS.color.border}` }} onClick={(e) => e.stopPropagation()}>
              <TaskSheet task={open} onClose={() => setOpen(null)} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
