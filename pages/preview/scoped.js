// Passage Calm Guided OS — scoped surfaces preview (Cycle 3).
// Vendor scoped request (quote -> approve -> pay -> proof gate) and the participant
// single-ask sheet. Same spine + tokens; each party sees only their slice.
// Self-contained sample data; safe to deploy at /preview/scoped.
import { useState } from 'react';
import Head from 'next/head';
import { DS, present } from '../../lib/designSystem';
import { AppShell, CalmStatusPill, SectionLabel } from '../../components/calm/CalmKit';

const VENDOR_STEPS = ['Quote', 'Approved', 'Paid', 'Proof'];

function VendorScoped() {
  const [step, setStep] = useState(0);
  const statusKey = step >= 3 ? 'done' : step === 0 ? 'yours_now' : 'in_review';
  const view = present(statusKey, {});
  const cta = ['Send quote — $480', 'Awaiting approval', 'Schedule work', 'Save completion proof'][step];
  const advance = () => setStep((s) => Math.min(s + 1, 3));
  return (
    <AppShell brand="passage · vendor" active="Today">
      <div style={{ padding: '8px 18px 0' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: '6px 0 2px', color: DS.color.ink }}>Casket spray</h1>
        <p style={{ fontSize: 13, color: DS.color.mid, margin: 0 }}>Booker service · needed by Fri 5pm</p>
      </div>
      <div style={{ padding: '0 16px' }}>
        <SectionLabel>Your request</SectionLabel>
        <div style={{ background: DS.color.card, border: `1px solid ${DS.color.border}`, borderRadius: DS.radius.lg, padding: '14px 15px', boxShadow: DS.shadow.card }}>
          <CalmStatusPill view={view} />
          <div style={{ display: 'flex', gap: 6, margin: '12px 0' }}>
            {VENDOR_STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 4, borderRadius: 999, background: i <= step ? DS.color.sage : DS.color.border }} />
                <div style={{ fontSize: 10.5, marginTop: 4, color: i <= step ? DS.color.sageDeep : DS.color.soft }}>{s}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: DS.color.mid, lineHeight: 1.5, margin: '0 0 12px' }}>
            You only see this request, its timing, the quote gate, and the proof to save. No family record.
          </p>
          <button type="button" onClick={advance} disabled={step === 3}
            style={{ display: 'block', width: '100%', background: step === 3 ? DS.color.sageFaint : DS.color.sage,
              color: step === 3 ? DS.color.sageDeep : '#fff', border: 'none', borderRadius: DS.radius.md, padding: 11,
              fontSize: 14, fontWeight: 600, cursor: step === 3 ? 'default' : 'pointer', minHeight: DS.tap.min }}>
            {step === 3 ? 'Completed — proof saved' : cta}
          </button>
          <p style={{ fontSize: 12, color: DS.color.soft, margin: '10px 0 0' }}>Approve-and-pay gates before scheduled work. Proof saves to the case file.</p>
        </div>
      </div>
    </AppShell>
  );
}

function ParticipantScoped() {
  const [done, setDone] = useState(false);
  const view = present(done ? 'done' : 'yours_now', {});
  return (
    <AppShell brand="passage · you" active="Today">
      <div style={{ padding: '8px 18px 0' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: '6px 0 2px', color: DS.color.ink }}>One thing the family asked</h1>
        <p style={{ fontSize: 13, color: DS.color.mid, margin: 0 }}>For the Alvarez service</p>
      </div>
      <div style={{ padding: '0 16px' }}>
        <SectionLabel>Your one ask</SectionLabel>
        <div style={{ background: DS.color.card, border: `2px solid ${DS.color.sage}55`, borderRadius: DS.radius.lg, padding: '15px', boxShadow: DS.shadow.card }}>
          <CalmStatusPill view={view} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: DS.color.ink, margin: '10px 0 4px' }}>Share a photo for the slideshow</h3>
          <p style={{ fontSize: 13, color: DS.color.mid, lineHeight: 1.5, margin: 0 }}>
            A favorite photo of Robert. That&rsquo;s the only thing we need from you — nothing else.
          </p>
          <button type="button" onClick={() => setDone(true)} disabled={done}
            style={{ display: 'block', width: '100%', marginTop: 13, background: done ? DS.color.sageFaint : DS.color.sage,
              color: done ? DS.color.sageDeep : '#fff', border: 'none', borderRadius: DS.radius.md, padding: 11,
              fontSize: 14, fontWeight: 600, cursor: done ? 'default' : 'pointer', minHeight: DS.tap.min }}>
            {done ? 'Thank you — received' : 'Upload a photo'}
          </button>
          <p style={{ fontSize: 12, color: DS.color.soft, margin: '10px 0 0' }}>You only see this request. You don&rsquo;t need the full family record.</p>
        </div>
      </div>
    </AppShell>
  );
}

export default function ScopedPreview() {
  return (
    <>
      <Head><title>Passage · scoped surfaces</title><meta name="robots" content="noindex" /></Head>
      <div style={{ minHeight: '100vh', background: DS.color.page, padding: '28px 14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <p style={{ fontSize: 13, color: DS.color.mid, textAlign: 'center', margin: '0 0 16px' }}>
          Scoped surfaces &mdash; vendors and participants each see only their slice.
        </p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
          <VendorScoped />
          <ParticipantScoped />
        </div>
      </div>
    </>
  );
}
