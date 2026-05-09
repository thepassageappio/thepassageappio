import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';
import { buildContinuityPackets, demoContinuityInput } from '../lib/continuityPackets';

const C = {
  bg: '#f6f3ee',
  card: '#ffffff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  amber: '#b07d2e',
  amberFaint: '#fdf8ee',
};

export default function PacketDemo() {
  const packets = useMemo(() => buildContinuityPackets(demoContinuityInput()), []);
  const [activeId, setActiveId] = useState(packets[0]?.id || '');
  const [notice, setNotice] = useState('');
  const active = packets.find(packet => packet.id === activeId) || packets[0];

  async function copyActive() {
    try {
      await navigator.clipboard.writeText(active.text);
      setNotice('Packet copied.');
    } catch (_err) {
      setNotice('Select the packet text and copy it manually.');
    }
    window.setTimeout(() => setNotice(''), 2500);
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia, serif' }}>
      <style>{`
        @media print {
          nav, footer, .no-print { display: none !important; }
          main { background: #fff !important; }
          .packet-shell { max-width: none !important; padding: 0 !important; }
          .packet-grid { display: block !important; }
          .packet-sheet { box-shadow: none !important; border: none !important; }
        }
        @media (max-width: 820px) {
          .packet-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <SiteHeader />
      <section className="packet-shell" style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 28px 70px' }}>
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 18, alignItems: 'end', marginBottom: 20 }}>
          <div>
            <div style={eyebrow}>Continuity packet demo</div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 1.02, margin: '8px 0 10px', fontWeight: 400 }}>Outputs from the same family spine.</h1>
            <p style={lead}>These are demo-safe artifacts. In product, the same packet generator should use the estate, lifecycle dates, tasks, owners, communication, proof, and permissions already on the spine.</p>
          </div>
          <Link href="/system/demo?demoStep=warm" style={secondaryLink}>Back to demo rail</Link>
        </div>

        {notice && <div className="no-print" style={{ background: C.sage, color: '#fff', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'inline-flex' }}>{notice}</div>}

        <div className="packet-grid" style={{ display: 'grid', gridTemplateColumns: '310px minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
          <aside className="no-print" style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 12 }}>
            {packets.map(packet => (
              <button
                key={packet.id}
                onClick={() => setActiveId(packet.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: '1px solid ' + (active.id === packet.id ? C.sage : C.border),
                  background: active.id === packet.id ? C.sageFaint : C.card,
                  borderRadius: 14,
                  padding: 13,
                  marginBottom: 8,
                  cursor: 'pointer',
                  fontFamily: 'Georgia,serif',
                }}
              >
                <div style={{ color: active.id === packet.id ? C.sage : C.ink, fontSize: 15, fontWeight: 900, lineHeight: 1.2 }}>{packet.title}</div>
                <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>{packet.description}</div>
              </button>
            ))}
            <div style={{ background: C.amberFaint, border: '1px solid #edd7b1', borderRadius: 14, padding: 13, color: C.amber, fontSize: 12.5, lineHeight: 1.5 }}>
              Demo rule: this page prepares copyable outputs only. It does not send email/SMS or mutate production data.
            </div>
          </aside>

          <article className="packet-sheet" style={{ background: '#fff', border: '1px solid ' + C.border, borderRadius: 20, padding: 26, boxShadow: '0 20px 58px rgba(55,45,35,.07)' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={eyebrow}>Prepared output</div>
                <h2 style={{ fontSize: 30, lineHeight: 1.1, margin: '5px 0 0', fontWeight: 400 }}>{active.title}</h2>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={copyActive} style={primaryButton}>Copy packet</button>
                <button onClick={() => window.print()} style={secondaryButton}>Print / save PDF</button>
              </div>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', color: C.ink, fontSize: 16, lineHeight: 1.62, margin: 0 }}>{active.text}</pre>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 760 };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 12, minHeight: 44, padding: '0 15px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryButton = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 12, minHeight: 44, padding: '0 15px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryLink = { ...secondaryButton, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
