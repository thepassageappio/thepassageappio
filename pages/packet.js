import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';
import { isPassageAdmin } from '../lib/adminAccess';
import { supabase } from '../lib/supabaseBrowser';
import { buildContinuityPackets, demoContinuityInput } from '../lib/continuityPackets';
import { trackEvent } from '../lib/trackEvent';

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
  const router = useRouter();
  const demoPackets = useMemo(() => buildContinuityPackets(demoContinuityInput()), []);
  const [packets, setPackets] = useState(demoPackets);
  const [activeId, setActiveId] = useState(packets[0]?.id || '');
  const [notice, setNotice] = useState('');
  const [sourceLabel, setSourceLabel] = useState('Sample output set');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminDemoAllowed, setAdminDemoAllowed] = useState(false);
  const active = packets.find(packet => packet.id === activeId) || packets[0];
  const requestedDemoMode = router.isReady && (router.query.demoTour === 'funeral-home' || router.query.demo === '1');
  const demoMode = requestedDemoMode && adminDemoAllowed;
  const displaySourceLabel = sourceLabel;

  useEffect(() => {
    if (!router.isReady || !requestedDemoMode) {
      setAdminDemoAllowed(false);
      return;
    }
    if (!supabase?.auth) {
      setAdminDemoAllowed(false);
      return;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setAdminDemoAllowed(isPassageAdmin(data?.session?.user?.email));
    });
    return () => { cancelled = true; };
  }, [router.isReady, requestedDemoMode]);

  useEffect(() => {
    if (!router.isReady) return;
    const id = String(router.query.id || '').trim();
    if (!id) {
      setPackets(demoPackets);
      setSourceLabel(demoMode ? 'Demo packet set' : 'Sample output set');
      setError('');
      return;
    }
    if (demoMode && (/^demo[-_]/i.test(id) || router.query.demo === '1')) {
      setPackets(demoPackets);
      setActiveId(demoPackets[0]?.id || '');
      setSourceLabel('Demo packet set');
      setError('');
      return;
    }
    let cancelled = false;
    async function loadPackets() {
      setLoading(true);
      setError('');
      try {
        if (!supabase?.auth) {
          if (!cancelled) {
            setPackets(demoPackets);
            setActiveId(demoPackets[0]?.id || '');
            setSourceLabel('Demo packet set');
            setError('');
          }
          return;
        }
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (!token) throw new Error('Sign in to generate packets from this case.');
        const res = await fetch(`/api/estates/${encodeURIComponent(id)}/packets`, { headers: { Authorization: 'Bearer ' + token } });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Could not generate packets from this case.');
        if (cancelled) return;
        const nextPackets = Array.isArray(json.packets) && json.packets.length ? json.packets : demoPackets;
        setPackets(nextPackets);
        setActiveId(nextPackets[0]?.id || '');
        setSourceLabel(json.source === 'case' ? 'Generated from case spine' : 'Demo packet set');
      } catch (err) {
        if (!cancelled) {
          setPackets(demoPackets);
          setActiveId(demoPackets[0]?.id || '');
          setSourceLabel('Sample output set');
          setError(err.message || 'Could not load packets.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPackets();
    return () => { cancelled = true; };
  }, [router.isReady, router.query.id, demoPackets, demoMode]);

  async function copyActive() {
    trackEvent('packet_copied', { packetId: active?.id, sourceLabel });
    try {
      await navigator.clipboard.writeText(active.text);
      setNotice('Packet copied.');
    } catch (_err) {
      setNotice('Select the packet text and copy it manually.');
    }
    window.setTimeout(() => setNotice(''), 2500);
  }

  function packetStatus(packet) {
    const body = String(packet?.text || '');
    const missing = (body.match(/not added yet|not recorded yet|pending|unknown|not known yet|not supplied/gi) || []).length;
    return {
      missing,
      label: missing ? 'Needs review' : 'Ready for review',
      detail: missing ? `${missing} missing or pending field${missing === 1 ? '' : 's'} should be checked before sharing.` : 'No obvious placeholder fields found. Human approval is still required.',
    };
  }

  function downloadActive() {
    if (typeof window === 'undefined' || !active?.text) return;
    trackEvent('packet_downloaded', { packetId: active.id, sourceLabel });
    const status = packetStatus(active);
    const fileName = `${String(active.title || 'passage-packet').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'passage-packet'}.txt`;
    const content = [
      active.title,
      displaySourceLabel,
      status.label + ' - ' + status.detail,
      'Prepared by Passage. Review before sharing outside the family record.',
      '',
      active.text,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice('Packet downloaded as a reviewable text file.');
    window.setTimeout(() => setNotice(''), 2500);
  }

  const activeStatus = packetStatus(active);

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia, serif' }}>
      <style>{`
        @media print {
          nav, footer, .no-print { display: none !important; }
          main { background: #fff !important; }
          .packet-shell { max-width: none !important; padding: 0 !important; }
          .packet-grid { display: block !important; }
          .packet-sheet { box-shadow: none !important; border: none !important; padding: 20px 24px !important; overflow: visible !important; }
          .packet-brand-row { gap: 0 !important; overflow: visible !important; align-items: flex-start !important; }
          .packet-brand-icon { display: none !important; }
          .packet-brand-name { display: block !important; min-width: 120px !important; overflow: visible !important; line-height: 1.2 !important; letter-spacing: 0 !important; padding-left: 0 !important; margin-left: 0 !important; }
        }
        @media (max-width: 820px) {
          .packet-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <SiteHeader />
      <section className="packet-shell" style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 28px 48px' }}>
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 18, alignItems: 'end', marginBottom: 20 }}>
          <div>
            <div style={eyebrow}>Passage outputs</div>
            <h1 style={{ fontSize: 52, lineHeight: 1.02, margin: '8px 0 10px', fontWeight: 400 }}>Prepared outputs from the family record.</h1>
            <p style={lead}>Every packet starts from the same spine: dates, owner, message, proof, and approval boundary. Nothing sends automatically; a person reviews the output before it leaves Passage.</p>
            <div style={{ display: 'inline-flex', marginTop: 12, background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 900 }}>{loading ? 'Generating...' : displaySourceLabel}</div>
          </div>
          {demoMode ? (
            <Link href="/system/demo?demoStep=warm" style={secondaryLink}>Back to guided demo</Link>
          ) : (
            <Link href="/funeral-home" style={secondaryLink}>See provider workflow</Link>
          )}
        </div>

        {error && <div className="no-print" style={{ background: C.amberFaint, color: C.amber, border: '1px solid #edd7b1', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>{error} Showing sample packets instead.</div>}
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
            <div style={{ background: demoMode ? C.amberFaint : C.sageFaint, border: '1px solid ' + (demoMode ? '#edd7b1' : '#c8deca'), borderRadius: 14, padding: 13, color: demoMode ? C.amber : C.sage, fontSize: 12.5, lineHeight: 1.5 }}>
              {demoMode
                ? 'Demo output: review, copy, print, or save. Nothing sends by itself.'
                : 'Review boundary: copy, print, or download only after the family or coordinator approves the output.'}
            </div>
          </aside>

          <article className="packet-sheet" style={{ background: '#fff', border: '1px solid ' + C.border, borderRadius: 20, padding: 26, boxShadow: '0 20px 58px rgba(55,45,35,.07)' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', borderBottom: '1px solid ' + C.border, paddingBottom: 14, marginBottom: 18 }}>
              <div className="packet-brand-row" style={{ display: 'flex', gap: 10, alignItems: 'center', overflow: 'visible' }}>
                <img className="packet-brand-icon" src="/passage-icon-light-onbg.svg" alt="Passage" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
                <div>
                  <div className="packet-brand-name" style={{ color: C.ink, fontSize: 18, fontWeight: 900, lineHeight: 1.1, overflow: 'visible' }}>Passage</div>
                  <div style={{ color: C.mid, fontSize: 11.5, lineHeight: 1.35 }}>Family coordination spine</div>
                </div>
              </div>
              <div style={{ color: C.mid, fontSize: 11.5, lineHeight: 1.45, textAlign: 'right' }}>
                Powered by Passage<br />
                thepassageapp.io
              </div>
            </header>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={eyebrow}>Prepared output</div>
                <h2 style={{ fontSize: 30, lineHeight: 1.1, margin: '5px 0 0', fontWeight: 400 }}>{active.title}</h2>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={copyActive} style={primaryButton}>Copy packet</button>
                <button onClick={downloadActive} style={secondaryButton}>Download .txt</button>
                <button onClick={() => { trackEvent('packet_print_clicked', { packetId: active?.id, sourceLabel }); window.print(); }} style={secondaryButton}>Print / save PDF</button>
              </div>
            </div>
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 145px), 1fr))', gap: 8, marginBottom: 14 }}>
              {[
                ['From', 'Family record'],
                ['Uses', 'Dates + owners'],
                ['Keeps', 'Proof path'],
                ['Before sharing', 'Human review'],
              ].map(([label, value]) => (
                <div key={label} style={{ border: '1px solid ' + C.border, borderRadius: 12, padding: '8px 10px', background: C.card }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                  <div style={{ color: C.ink, fontSize: 12.5, fontWeight: 900, marginTop: 3 }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 8, marginBottom: 18 }}>
              {[
                ['Packet status', activeStatus.label, activeStatus.missing ? C.amberFaint : C.sageFaint],
                ['Approval boundary', 'Review before sharing', C.sageFaint],
                ['Proof path', 'Copy, print, or download only', C.sageFaint],
              ].map(([label, value, bg]) => (
                <div key={label} style={{ background: bg, border: '1px solid ' + C.border, borderRadius: 12, padding: '9px 10px' }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.11em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                  <div style={{ color: C.ink, fontSize: 13, lineHeight: 1.35, fontWeight: 900, marginTop: 3 }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="no-print" style={{ background: activeStatus.missing ? C.amberFaint : C.sageFaint, border: '1px solid ' + (activeStatus.missing ? '#edd7b1' : '#c8deca'), borderRadius: 13, padding: '10px 12px', color: activeStatus.missing ? C.amber : C.sage, fontSize: 12.5, fontWeight: 900, lineHeight: 1.45, marginBottom: 18 }}>
              {activeStatus.detail} Nothing leaves Passage from this page automatically.
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', color: C.ink, fontSize: 16, lineHeight: 1.62, margin: 0 }}>{displayPacketText(active.text)}</pre>
            <footer style={{ borderTop: '1px solid ' + C.border, marginTop: 20, paddingTop: 10, color: C.soft, fontSize: 11.5, lineHeight: 1.45 }}>
              Prepared by Passage. Review before sharing. Powered by Passage | thepassageapp.io
            </footer>
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

function displayPacketText(text) {
  return String(text || '').replace(/^Passage\r?\nPowered by Passage \| thepassageapp\.io\r?\n/, '');
}
