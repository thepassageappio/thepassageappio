// Passage Calm Guided OS — operator desktop preview (Cycle 2).
// Funeral-home director "My Day" command surface. Same spine + tokens as the
// family experience, dense desktop posture. Self-contained sample data; safe to deploy.
import { useState } from 'react';
import Head from 'next/head';
import { DS, present } from '../../lib/designSystem';
import { CalmStatusPill } from '../../components/calm/CalmKit';

const sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const METRICS = [
  ['Cases needing action', '4', 'yours'],
  ['Waiting over 48h', '2', 'warn'],
  ['Proof gaps', '1', 'warn'],
  ['Billing ready', '3', 'good'],
];

const CASES = [
  { id: 1, family: 'Alvarez', step: 'Confirm arrangement summary', statusKey: 'yours_now', owner: 'You', next: 'Sign & send to family' },
  { id: 2, family: 'Booker', step: 'Vendor quote — floral', statusKey: 'in_review', owner: 'Dana', next: 'Approve $480 quote' },
  { id: 3, family: 'Chen', step: 'Death certificate upload', statusKey: 'waiting', who: 'Family', owner: 'Family', next: 'Nudge family' },
  { id: 4, family: 'Diallo', step: 'Service window confirm', statusKey: 'yours_now', owner: 'You', next: 'Lock 2pm Saturday' },
  { id: 5, family: 'Engel', step: 'Final invoice', statusKey: 'done', owner: 'Maria', next: 'Proof saved' },
];

const STAFF = [
  ['Maria R.', 6, 'Balanced'],
  ['Dana K.', 9, 'At capacity'],
  ['Sam P.', 3, 'Light'],
];

function Metric({ label, value, tone }) {
  const c = tone === 'warn' ? DS.color.amber : tone === 'good' ? DS.color.sage : DS.color.sageDeep;
  return (
    <div style={{ background: DS.color.card, border: `1px solid ${DS.color.border}`, borderRadius: DS.radius.md, padding: '12px 14px', flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 12, color: DS.color.mid }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: c, marginTop: 2 }}>{value}</div>
    </div>
  );
}

export default function MyDayPreview() {
  const [done, setDone] = useState({});
  return (
    <>
      <Head><title>Passage · My Day (operator preview)</title><meta name="robots" content="noindex" /></Head>
      <div style={{ minHeight: '100vh', background: DS.color.page, fontFamily: sans, color: DS.color.ink, padding: '24px 20px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>My Day</h1>
              <p style={{ fontSize: 13, color: DS.color.mid, margin: '2px 0 0' }}>Maple Grove Funeral Home &middot; Saturday, June 20</p>
            </div>
            <span style={{ fontSize: 13, color: DS.color.sageDeep }}>Director view &middot; operator posture</span>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '16px 0 20px' }}>
            {METRICS.map((m) => <Metric key={m[0]} label={m[0]} value={m[1]} tone={m[2]} />)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
            <div style={{ background: DS.color.card, border: `1px solid ${DS.color.border}`, borderRadius: DS.radius.lg, padding: '6px 0' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, padding: '12px 16px 8px' }}>Cases needing action</h2>
              {CASES.map((c) => {
                const isDone = done[c.id] || c.statusKey === 'done';
                const view = present(isDone ? 'done' : c.statusKey, { who: c.who });
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: `1px solid ${DS.color.border}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: DS.color.sageFaint, color: DS.color.sageDeep,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flex: '0 0 40px' }}>
                      {c.family[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.family} family</div>
                      <div style={{ fontSize: 13, color: DS.color.mid }}>{c.step} &middot; owner: {c.owner}</div>
                    </div>
                    <CalmStatusPill view={view} />
                    {!isDone && (
                      <button type="button" onClick={() => setDone((d) => ({ ...d, [c.id]: true }))}
                        style={{ background: DS.color.sage, color: '#fff', border: 'none', borderRadius: DS.radius.sm,
                          padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {c.next}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: DS.color.card, border: `1px solid ${DS.color.border}`, borderRadius: DS.radius.lg, padding: '14px 16px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Needs a decision</h2>
                <p style={{ fontSize: 13, color: DS.color.mid, margin: '0 0 10px' }}>Booker family &mdash; floral vendor quote</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={{ flex: 1, background: DS.color.sage, color: '#fff', border: 'none', borderRadius: DS.radius.sm, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Approve $480</button>
                  <button type="button" style={{ flex: 1, background: 'none', color: DS.color.ink, border: `1px solid ${DS.color.border}`, borderRadius: DS.radius.sm, padding: '9px', fontSize: 13, cursor: 'pointer' }}>Hold</button>
                </div>
              </div>
              <div style={{ background: DS.color.card, border: `1px solid ${DS.color.border}`, borderRadius: DS.radius.lg, padding: '14px 16px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Staff load</h2>
                {STAFF.map(([name, load, label]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, borderTop: `1px solid ${DS.color.border}` }}>
                    <span>{name}</span>
                    <span style={{ color: label === 'At capacity' ? DS.color.amber : DS.color.mid }}>{load} open &middot; {label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
