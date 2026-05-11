import { useEffect, useState } from 'react';

const C = {
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  card: '#ffffff',
  bg: '#f6f3ee',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  amber: '#b07d2e',
  amberFaint: '#fdf8ee',
};

export default function PacketGeneratorModal({ estateId, packetType = 'funeral_home_arrangement', accessToken = '', onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [packet, setPacket] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      if (!estateId) {
        setError('Open a family record before preparing a packet.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/estates/${encodeURIComponent(estateId)}/generate-packet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ type: packetType }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Could not prepare this packet.');
        if (cancelled) return;
        setPacket(json.packet);
        setReviewText(json.packet?.data?.text || '');
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not prepare this packet.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    generate();
    return () => { cancelled = true; };
  }, [estateId, packetType, accessToken]);

  async function copyPacket() {
    try {
      await navigator.clipboard.writeText(reviewText);
      setNotice('Packet copied for review.');
      window.setTimeout(() => setNotice(''), 2200);
    } catch (_err) {
      setNotice('Select the text and copy it manually.');
    }
  }

  function downloadPacket() {
    if (typeof window === 'undefined' || !reviewText) return;
    const blob = new Blob([reviewText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = packet?.fileName || 'passage-packet.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice('Packet downloaded.');
    window.setTimeout(() => setNotice(''), 2200);
  }

  function finish() {
    onComplete?.({ packet, text: reviewText });
    onClose?.();
  }

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="Prepare Passage packet">
      <div style={modal}>
        <button onClick={onClose} aria-label="Close" style={closeButton}>x</button>
        <div style={eyebrow}>Packet generator</div>
        <h2 style={{ fontSize: 32, lineHeight: 1.05, fontWeight: 400, margin: '4px 0 8px' }}>Prepare the output, then review.</h2>
        <p style={{ color: C.mid, fontSize: 15.5, lineHeight: 1.55, margin: '0 0 16px', maxWidth: 760 }}>
          Passage builds this from the same family spine: dates, owners, waiting points, proof, and approval boundaries. Nothing sends from this window.
        </p>

        {loading ? (
          <div style={quietBox}>Preparing the packet from the family record...</div>
        ) : error ? (
          <div style={{ ...quietBox, background: C.amberFaint, color: C.amber }}>{error}</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
              {[
                ['Status', packet?.status || 'draft'],
                ['Boundary', 'Review first'],
                ['Powered by', 'Passage'],
              ].map(([label, value]) => (
                <div key={label} style={metaBox}>
                  <div style={metaLabel}>{label}</div>
                  <div style={{ color: C.ink, fontSize: 14, fontWeight: 900 }}>{value}</div>
                </div>
              ))}
            </div>
            <label style={eyebrow} htmlFor="packet-review-text">Review packet text</label>
            <textarea
              id="packet-review-text"
              value={reviewText}
              onChange={event => setReviewText(event.target.value)}
              style={textarea}
            />
            <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 8 }}>
              The PDF path today is browser print/save PDF so the family coordinator can review before anything leaves the record.
            </div>
            {notice && <div style={{ ...quietBox, padding: '9px 12px', marginTop: 12 }}>{notice}</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <button onClick={copyPacket} style={secondaryButton}>Copy</button>
              <button onClick={downloadPacket} style={secondaryButton}>Download .txt</button>
              <button onClick={() => window.print()} style={secondaryButton}>Print / save PDF</button>
              <button onClick={finish} style={primaryButton}>Use this output</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  background: 'rgba(26,25,22,.38)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  fontFamily: 'Georgia, serif',
};

const modal = {
  width: 'min(920px, 100%)',
  maxHeight: '90vh',
  overflow: 'auto',
  background: C.card,
  color: C.ink,
  border: `1px solid ${C.border}`,
  borderRadius: 24,
  padding: 28,
  boxShadow: '0 24px 80px rgba(55,45,35,.22)',
  position: 'relative',
};

const closeButton = {
  position: 'absolute',
  top: 18,
  right: 18,
  width: 44,
  height: 44,
  borderRadius: 999,
  border: `1px solid ${C.border}`,
  background: C.card,
  color: C.mid,
  fontFamily: 'Georgia,serif',
  fontWeight: 900,
  cursor: 'pointer',
};

const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const quietBox = { background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 800 };
const metaBox = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 };
const metaLabel = { color: C.sage, fontSize: 10, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 4 };
const textarea = {
  width: '100%',
  minHeight: 260,
  resize: 'vertical',
  boxSizing: 'border-box',
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  padding: 16,
  marginTop: 8,
  background: C.bg,
  color: C.ink,
  fontFamily: 'Georgia, serif',
  fontSize: 15,
  lineHeight: 1.55,
  outline: 'none',
};
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 14, minHeight: 52, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryButton = { border: `1px solid ${C.border}`, background: C.card, color: C.sage, borderRadius: 14, minHeight: 52, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
