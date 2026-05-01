import { useState } from 'react';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', gold: '#b8945a' };

const resources = [
  { type: 'First 24 Hours Guide', title: 'Know exactly what to do tonight', audience: 'For the first hours after a death', body: 'A calm order of operations: who to call first, what can wait, and what details to write down before decisions pile up.' },
  { type: 'Family Notification Playbook', title: 'Tell the right people without writing from scratch', audience: 'For close family and helpers', body: 'Simple language for first calls, texts, and emails, plus guidance on what not to broadcast before service details are confirmed.' },
  { type: 'Executor Checklist', title: 'Protect the estate without guessing', audience: 'For executors and responsible relatives', body: 'The first financial, legal, and document steps to start, with proof to save and what requires authority before acting.' },
  { type: 'Funeral Home Meeting Prep', title: 'Walk in with the facts they need', audience: 'For arrangement meetings', body: 'A focused prep sheet for transportation, death certificates, pricing questions, service timing, and who approves next steps.' },
];

export default function ContentPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [interest, setInterest] = useState(resources[0].title);
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    await fetch('/api/supportInquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, category: 'Content request', urgency: 'Normal', message: `Resource requested: ${interest}` }),
    });
    setSent(true);
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />

      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '12px 22px 36px' }}>
        <div style={{ maxWidth: 760, marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 7 }}>Get help now</div>
          <h1 style={{ fontSize: 'clamp(28px, 3.3vw, 36px)', lineHeight: 1.04, margin: '0 0 7px', fontWeight: 400 }}>Four guides for the moments families usually have to figure out alone.</h1>
          <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.5, margin: 0 }}>Choose the situation closest to yours. Passage will send the guide and point you toward the clearest next step.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {resources.map(r => (
              <button key={r.title} onClick={() => setInterest(r.title)} style={{ textAlign: 'left', background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 15, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                <div style={{ fontSize: 10, color: C.gold, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>{r.type}</div>
                <div style={{ fontSize: 18, color: C.ink, lineHeight: 1.24, marginBottom: 8 }}>{r.title}</div>
                <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.5, marginBottom: 8 }}>{r.audience}</div>
                <div style={{ fontSize: 12.5, color: C.soft, lineHeight: 1.45 }}>{r.body}</div>
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, alignSelf: 'start', position: 'sticky', top: 12 }}>
            <div style={{ fontSize: 20, lineHeight: 1.25, marginBottom: 7 }}>Send me the guide</div>
            <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.55, marginTop: 0 }}>No drip campaign. Just the guide and the next place to start.</p>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={inputStyle} />
            <select value={interest} onChange={e => setInterest(e.target.value)} style={inputStyle}>
              {resources.map(r => <option key={r.title}>{r.title}</option>)}
            </select>
            <button style={{ width: '100%', border: 'none', borderRadius: 12, padding: '13px 16px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Request access</button>
            {sent && <p style={{ color: C.sage, fontSize: 13, lineHeight: 1.6 }}>Request received. We will follow up when this resource is available.</p>}
          </form>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

const inputStyle = { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 13px', fontFamily: 'Georgia,serif', fontSize: 14, color: C.ink, outline: 'none', background: '#fff', marginBottom: 10 };
