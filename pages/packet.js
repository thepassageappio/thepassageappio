import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';
import { isPassageAdmin } from '../lib/adminAccess';
import { supabase } from '../lib/supabaseBrowser';
import { buildContinuityPackets, demoContinuityInput } from '../lib/continuityPackets';
import { trackEvent } from '../lib/trackEvent';

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
        setSourceLabel(json.source === 'case' ? 'Generated from case record' : 'Demo packet set');
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
    <main className="th-shell">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,520&family=Inter:wght@400;500;600;700&display=swap');
        :root{
          --pine-950:#0A1F1A; --pine-900:#0F2A24; --pine-800:#153A31; --pine-700:#1C4A3E; --pine-600:#245A4B;
          --pine-100:#E7EFEA; --pine-50:#F2F6F3;
          --clay-700:#9A4F26; --clay-600:#B5622F; --clay-200:#EBC6A4; --clay-100:#F5E4D6; --clay-50:#FBF0E7;
          --bone-50:#FEFDFB; --bone-100:#FBF8F3; --bone-200:#F5F0E7; --bone-300:#EBE3D3; --bone-400:#DDD2BB;
          --ink-900:#1C1917; --ink-700:#3D372F; --ink-600:#5A5348; --ink-500:#79705F; --ink-400:#9A9081; --ink-300:#BEB6A8;
          --line:#E6DDCB; --line-soft:#EFE8DA;
          --r-xs:8px; --r-sm:12px; --r-md:18px; --r-lg:26px; --r-full:999px;
          --e1:0 1px 1px rgba(20,30,25,.03), 0 2px 4px rgba(20,30,25,.03);
          --e2:0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10);
          --ease:cubic-bezier(.22,1,.36,1);
        }
        @media print {
          nav, footer, .no-print { display: none !important; }
          main.th-shell { background: #fff !important; }
          .packet-shell { max-width: none !important; padding: 0 !important; }
          .packet-grid { display: block !important; }
          .packet-sheet { box-shadow: none !important; border: none !important; padding: 20px 24px !important; overflow: visible !important; }
          .packet-brand-row { gap: 0 !important; overflow: visible !important; align-items: flex-start !important; }
          .packet-brand-icon { display: none !important; }
          .packet-brand-name { display: block !important; min-width: 120px !important; overflow: visible !important; line-height: 1.2 !important; letter-spacing: 0 !important; padding-left: 0 !important; margin-left: 0 !important; }
        }
      `}</style>
      <style jsx>{`
        .th-shell {
          min-height: 100vh;
          background: var(--bone-100);
          color: var(--ink-900);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: -.005em;
        }
        .packet-shell { max-width: 1180px; margin: 0 auto; padding: 24px 28px 48px; }
        .top-row { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 18px; align-items: end; margin-bottom: 20px; }
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        h1 { font-family: 'Fraunces', serif; font-weight: 440; font-size: clamp(32px,4.6vw,48px); line-height: 1.02; margin: 8px 0 10px; letter-spacing: -.02em; color: var(--pine-950); }
        p.lede { color: var(--ink-500); font-size: 16px; line-height: 1.6; margin: 0; max-width: 760px; }
        .source-pill { display: inline-flex; margin-top: 12px; background: var(--pine-50); color: var(--pine-700); border: 1px solid #D5E4DC; border-radius: var(--r-full); padding: 5px 10px; font-size: 12px; font-weight: 700; }
        .th-btn { display: inline-flex; align-items: center; min-height: 44px; border-radius: var(--r-full); padding: 0 15px; text-decoration: none; font-weight: 600; font-family: 'Inter', sans-serif; font-size: 13.5px; border: 1px solid transparent; cursor: pointer; }
        .th-btn-secondary { background: var(--bone-50); color: var(--pine-800); border-color: var(--line); box-shadow: var(--e1); }
        .th-btn-primary { background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); color: #fff; box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35); }
        .banner-error { background: var(--clay-50); color: var(--clay-700); border: 1px solid var(--clay-200); border-radius: var(--r-sm); padding: 10px 14px; margin-bottom: 12px; font-size: 13.5px; }
        .banner-notice { background: var(--pine-600); color: #fff; border-radius: var(--r-sm); padding: 10px 14px; margin-bottom: 12px; display: inline-flex; font-size: 13.5px; }
        .packet-grid { display: grid; grid-template-columns: 310px minmax(0,1fr); gap: 18px; align-items: start; }
        aside.rail { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 12px; box-shadow: var(--e1); }
        .rail-item { width: 100%; text-align: left; border: 1px solid var(--line-soft); background: var(--bone-50); border-radius: var(--r-md); padding: 13px; margin-bottom: 8px; cursor: pointer; font-family: 'Inter', sans-serif; }
        .rail-item.active { border-color: var(--pine-600); background: var(--pine-50); }
        .rail-title { font-size: 15px; font-weight: 600; line-height: 1.2; color: var(--ink-900); }
        .rail-item.active .rail-title { color: var(--pine-700); }
        .rail-body { color: var(--ink-500); font-size: 12.5px; line-height: 1.45; margin-top: 5px; }
        .rail-note { border-radius: var(--r-md); padding: 13px; font-size: 12.5px; line-height: 1.5; }
        .rail-note.demo { background: var(--clay-50); border: 1px solid var(--clay-200); color: var(--clay-700); }
        .rail-note.review { background: var(--pine-50); border: 1px solid #D5E4DC; color: var(--pine-700); }
        .packet-sheet { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 26px; box-shadow: var(--e2); }
        .brand-header { display: flex; justify-content: space-between; gap: 18px; align-items: center; border-bottom: 1px solid var(--line-soft); padding-bottom: 14px; margin-bottom: 18px; }
        .packet-brand-row { display: flex; gap: 10px; align-items: center; overflow: visible; }
        .packet-brand-name { color: var(--ink-900); font-size: 18px; font-weight: 700; line-height: 1.1; }
        .brand-sub { color: var(--ink-500); font-size: 11.5px; line-height: 1.35; }
        .brand-right { color: var(--ink-500); font-size: 11.5px; line-height: 1.45; text-align: right; }
        .sheet-head-row { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
        h2 { font-family: 'Fraunces', serif; font-weight: 460; font-size: 28px; margin: 5px 0 0; line-height: 1.1; letter-spacing: -.015em; color: var(--pine-950); }
        .action-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 145px), 1fr)); gap: 8px; margin-bottom: 14px; }
        .meta-card { border: 1px solid var(--line-soft); border-radius: var(--r-sm); padding: 8px 10px; background: var(--bone-50); }
        .meta-label { color: var(--pine-700); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; font-weight: 700; }
        .meta-value { color: var(--ink-900); font-size: 12.5px; font-weight: 700; margin-top: 3px; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr)); gap: 8px; margin-bottom: 18px; }
        .status-card { border: 1px solid var(--line-soft); border-radius: var(--r-sm); padding: 9px 10px; }
        .status-card.amber { background: var(--clay-50); }
        .status-card.pine { background: var(--pine-50); }
        .status-label { color: var(--pine-700); font-size: 10.5px; letter-spacing: .11em; text-transform: uppercase; font-weight: 700; }
        .status-value { color: var(--ink-900); font-size: 13px; line-height: 1.35; font-weight: 700; margin-top: 3px; }
        .detail-note { border-radius: var(--r-sm); padding: 10px 12px; font-size: 12.5px; font-weight: 600; line-height: 1.45; margin-bottom: 18px; }
        .detail-note.amber { background: var(--clay-50); color: var(--clay-700); border: 1px solid var(--clay-200); }
        .detail-note.pine { background: var(--pine-50); color: var(--pine-700); border: 1px solid #D5E4DC; }
        pre.packet-text { white-space: pre-wrap; font-family: 'Inter', sans-serif; color: var(--ink-900); font-size: 15.5px; line-height: 1.62; margin: 0; }
        footer.sheet-footer { border-top: 1px solid var(--line-soft); margin-top: 20px; padding-top: 10px; color: var(--ink-400); font-size: 11.5px; line-height: 1.45; }

        @media (max-width: 820px) {
          .packet-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <SiteHeader />
      <section className="packet-shell">
        <div className="top-row no-print">
          <div>
            <span className="eyebrow">Passage outputs</span>
            <h1>Prepared outputs from the family record.</h1>
            <p className="lede">Every packet starts from the same family record: dates, owner, message, proof, and approval boundary. Nothing sends automatically; a person reviews the output before it leaves Passage.</p>
            <div className="source-pill">{loading ? 'Generating...' : displaySourceLabel}</div>
          </div>
          {demoMode ? (
            <Link href="/system/demo?demoStep=warm" className="th-btn th-btn-secondary">Back to guided demo</Link>
          ) : (
            <Link href="/funeral-home" className="th-btn th-btn-secondary">See provider workflow</Link>
          )}
        </div>

        {error && <div className="banner-error no-print">{error} Showing sample packets instead.</div>}
        {notice && <div className="banner-notice no-print">{notice}</div>}

        <div className="packet-grid">
          <aside className="rail no-print">
            {packets.map(packet => (
              <button
                key={packet.id}
                onClick={() => setActiveId(packet.id)}
                className={active.id === packet.id ? 'rail-item active' : 'rail-item'}
              >
                <div className="rail-title">{packet.title}</div>
                <div className="rail-body">{packet.description}</div>
              </button>
            ))}
            <div className={demoMode ? 'rail-note demo' : 'rail-note review'}>
              {demoMode
                ? 'Demo output: review, copy, print, or save. Nothing sends by itself.'
                : 'Review boundary: copy, print, or download only after the family or coordinator approves the output.'}
            </div>
          </aside>

          <article className="packet-sheet">
            <header className="brand-header">
              <div className="packet-brand-row">
                <img className="packet-brand-icon" src="/passage-icon-light-onbg.svg" alt="Passage" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
                <div>
                  <div className="packet-brand-name">Passage</div>
                  <div className="brand-sub">Family coordination record</div>
                </div>
              </div>
              <div className="brand-right">
                Powered by Passage<br />
                thepassageapp.io
              </div>
            </header>
            <div className="sheet-head-row no-print">
              <div>
                <span className="eyebrow">Prepared output</span>
                <h2>{active.title}</h2>
              </div>
              <div className="action-row">
                <button onClick={copyActive} className="th-btn th-btn-primary">Copy packet</button>
                <button onClick={downloadActive} className="th-btn th-btn-secondary">Download .txt</button>
                <button onClick={() => { trackEvent('packet_print_clicked', { packetId: active?.id, sourceLabel }); window.print(); }} className="th-btn th-btn-secondary">Print / save PDF</button>
              </div>
            </div>
            <div className="meta-grid no-print">
              {[
                ['From', 'Family record'],
                ['Uses', 'Dates + owners'],
                ['Keeps', 'Proof path'],
                ['Before sharing', 'Human review'],
              ].map(([label, value]) => (
                <div key={label} className="meta-card">
                  <div className="meta-label">{label}</div>
                  <div className="meta-value">{value}</div>
                </div>
              ))}
            </div>
            <div className="status-grid no-print">
              {[
                ['Packet status', activeStatus.label, activeStatus.missing],
                ['Approval boundary', 'Review before sharing', false],
                ['Proof path', 'Copy, print, or download only', false],
              ].map(([label, value, amber]) => (
                <div key={label} className={amber ? 'status-card amber' : 'status-card pine'}>
                  <div className="status-label">{label}</div>
                  <div className="status-value">{value}</div>
                </div>
              ))}
            </div>
            <div className={activeStatus.missing ? 'detail-note amber no-print' : 'detail-note pine no-print'}>
              {activeStatus.detail} Nothing leaves Passage from this page automatically.
            </div>
            <pre className="packet-text">{displayPacketText(active.text)}</pre>
            <footer className="sheet-footer">
              Prepared by Passage. Review before sharing. Powered by Passage | thepassageapp.io
            </footer>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function displayPacketText(text) {
  return String(text || '').replace(/^Passage\r?\nPowered by Passage \| thepassageapp\.io\r?\n/, '');
}
