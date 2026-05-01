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

      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '8px 22px 30px' }}>
        <div style={{ maxWidth: 760, marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 6 }}>Resource guides</div>
          <h1 style={{ fontSize: 'clamp(26px, 2.9vw, 33px)', lineHeight: 1.03, margin: '0 0 7px', fontWeight: 400 }}>Four practical guides for the moments families usually have to figure out alone.</h1>
          <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.45, margin: 0 }}>Choose a guide. Passage will send the resource and point you toward the clearest next step.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 14, alignItems: 'start' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
            {resources.map(r => (
              <button key={r.title} onClick={() => setInterest(r.title)} style={{ textAlign: 'left', background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: 13, fontFamily: 'Georgia,serif', cursor: 'pointer', minHeight: 158 }}>
                <div style={{ fontSize: 9.5, color: C.gold, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 7 }}>{r.type}</div>
                <div style={{ fontSize: 17, color: C.ink, lineHeight: 1.2, marginBottom: 7 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.4, marginBottom: 6 }}>{r.audience}</div>
                <div style={{ fontSize: 12, color: C.soft, lineHeight: 1.38 }}>{r.body}</div>
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 15, alignSelf: 'start' }}>
            <div style={{ fontSize: 19, lineHeight: 1.2, marginBottom: 7 }}>Request a resource guide</div>
            <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 0 }}>No drip campaign. Just the guide and the next place to start.</p>
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
