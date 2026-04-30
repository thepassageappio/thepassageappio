import { useState } from 'react';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', gold: '#b8945a' };

const resources = [
  { type: 'Guide', title: 'The first 24 hours after a death', audience: 'Families in an urgent moment', gated: false },
  { type: 'Checklist', title: 'What to gather before meeting a funeral home', audience: 'Funeral planning', gated: true },
  { type: 'Whitepaper', title: 'Why grief needs orchestration, not another checklist', audience: 'Operators and partners', gated: true },
  { type: 'Guide', title: 'Planning ahead for parents, spouses, and multi-estate families', audience: 'Planning ahead', gated: true },
  { type: 'Partner brief', title: 'How funeral homes can offer Passage as a white-glove coordination layer', audience: 'Funeral homes', gated: true },
  { type: 'FAQ', title: 'How activation, approvals, and participant access work', audience: 'Participants and families', gated: false },
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

      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '26px 22px 58px' }}>
        <div style={{ maxWidth: 760, marginBottom: 18 }}>
          <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Resources</div>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 40px)', lineHeight: 1.06, margin: '0 0 10px', fontWeight: 400 }}>Practical guidance for families, planners, and the people asked to help.</h1>
          <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>Guides and partner briefs for families, participants, and care providers. Request the resource you need and Passage will follow up directly.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {resources.map(r => (
              <button key={r.title} onClick={() => setInterest(r.title)} style={{ textAlign: 'left', background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                <div style={{ fontSize: 10, color: r.gated ? C.gold : C.sage, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 10 }}>{r.type}{r.gated ? ' / gated' : ''}</div>
                <div style={{ fontSize: 18, color: C.ink, lineHeight: 1.3, marginBottom: 12 }}>{r.title}</div>
                <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.55 }}>{r.audience}</div>
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 22, alignSelf: 'start', position: 'sticky', top: 18 }}>
            <div style={{ fontSize: 20, lineHeight: 1.25, marginBottom: 8 }}>Request a resource</div>
            <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.65, marginTop: 0 }}>Tell us what you need and we will send the right resource or point you to the clearest next step.</p>
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
