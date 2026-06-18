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

export default function PacketGeneratorModal({ estateId, taskId = '', packetType = 'funeral_home_arrangement', accessToken = '', onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [packet, setPacket] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [emailPreview, setEmailPreview] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);

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
          body: JSON.stringify({ type: packetType, taskId }),
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
  }, [estateId, taskId, packetType, accessToken]);

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

  async function prepareEmailPreview() {
    if (!estateId || !packet?.type) return;
    setEmailLoading(true);
    setNotice('');
    try {
      const res = await fetch(`/api/estates/${encodeURIComponent(estateId)}/packets/${encodeURIComponent(packet.type)}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ dryRun: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not prepare the email preview.');
      setEmailPreview(json.emailPreview || null);
      setNotice(json.safety || 'Email preview prepared. Nothing was sent.');
      window.setTimeout(() => setNotice(''), 2600);
    } catch (err) {
      setNotice(err.message || 'Could not prepare the email preview.');
    } finally {
      setEmailLoading(false);
    }
  }

  function finish() {
    onComplete?.({ packet, text: reviewText });
    onClose?.();
  }

  const packetTitle = packet?.data?.title || 'Passage prepared output';
  const packetDescription = packet?.data?.description || 'Prepared from the family record.';
  const approvalBoundary = packet?.data?.approvalBoundary || 'Review before sharing outside the family record.';
  const proofPath = 'Save the reviewed output as proof on the task before closing it.';

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="Prepare Passage packet">
      <div style={modal}>
        <style jsx global>{`
          @media print {
            body * { visibility: hidden !important; }
            #passage-packet-print, #passage-packet-print * { visibility: visible !important; }
            #passage-packet-print {
              display: block !important;
              position: absolute !important;
              inset: 0 auto auto 0 !important;
              width: 100% !important;
              background: #fff !important;
              color: #1a1916 !important;
              padding: 32px !important;
              box-sizing: border-box !important;
            }
          }
        `}</style>
        <button onClick={onClose} aria-label="Close" style={closeButton}>x</button>
        <div style={eyebrow}>Passage task output</div>
        <h2 style={{ fontSize: 32, lineHeight: 1.05, fontWeight: 400, margin: '4px 0 8px' }}>Review the packet before it becomes proof.</h2>
        <p style={{ color: C.mid, fontSize: 15.5, lineHeight: 1.55, margin: '0 0 16px', maxWidth: 760 }}>
          Passage builds this from the same family record: dates, owners, waiting points, proof, and approval boundaries. Nothing sends from this window.
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
                ['Approval', 'Review first'],
                ['Proof path', packet?.persistence === 'document_packet_saved' ? 'Saved packet + task record' : 'Task record'],
              ].map(([label, value]) => (
                <div key={label} style={metaBox}>
                  <div style={metaLabel}>{label}</div>
                  <div style={{ color: C.ink, fontSize: 14, fontWeight: 900 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={brandPreview}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src="/brand/passage-held-light.svg" alt="" width="28" height="28" style={mark} />
                    <div>
                      <div style={{ color: C.ink, fontSize: 17, fontWeight: 900 }}>Passage</div>
                      <div style={{ color: C.mid, fontSize: 11.5 }}>Family coordination record</div>
                    </div>
                  </div>
                </div>
                <div style={{ color: C.mid, fontSize: 11.5, textAlign: 'right' }}>Powered by Passage<br />thepassageapp.io</div>
              </div>
              <div style={eyebrow}>Prepared output</div>
              <div style={{ color: C.ink, fontSize: 24, lineHeight: 1.12, fontWeight: 900, marginTop: 4 }}>{packetTitle}</div>
              <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.5, margin: '8px 0 0' }}>{packetDescription}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
                {[
                  ['Purpose', 'Produce a useful artifact, not just a status change.'],
                  ['Boundary', approvalBoundary],
                  ['Proof', proofPath],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 10 }}>
                    <div style={metaLabel}>{label}</div>
                    <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.4 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <label style={{ ...eyebrow, display: 'block', marginTop: 14 }} htmlFor="packet-review-text">Review packet text</label>
            <textarea
              id="packet-review-text"
              value={reviewText}
              onChange={event => setReviewText(event.target.value)}
              style={textarea}
            />
            <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 8 }}>
              Print / save PDF creates a Passage-branded artifact. Use this output only after review, then save it as task proof.
            </div>
            <div id="passage-packet-print" style={printPacket}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src="/brand/passage-held-light.svg" alt="" width="28" height="28" style={{ borderRadius: 7 }} />
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900 }}>Passage</div>
                      <div style={{ color: C.mid, fontSize: 12 }}>Family coordination record</div>
                    </div>
                  </div>
                </div>
                <div style={{ color: C.mid, fontSize: 11, textAlign: 'right' }}>Powered by Passage<br />thepassageapp.io</div>
              </div>
              <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Prepared output</div>
              <h1 style={{ fontSize: 28, lineHeight: 1.1, margin: '6px 0 12px' }}>{packetTitle}</h1>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Georgia,serif', fontSize: 13.5, lineHeight: 1.55 }}>{reviewText}</pre>
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 18, paddingTop: 10, color: C.mid, fontSize: 11 }}>
                Prepared by Passage. Review before sharing outside the family record. Powered by Passage | thepassageapp.io
              </div>
            </div>
            {emailPreview && (
              <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderRadius: 14, padding: 12, marginTop: 12 }}>
                <div style={{ ...metaLabel, color: C.amber }}>Email preview only</div>
                <div style={{ color: C.ink, fontSize: 14, fontWeight: 900 }}>{emailPreview.subject}</div>
                <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0', color: C.mid, fontFamily: 'Georgia,serif', fontSize: 12.5, lineHeight: 1.45, maxHeight: 150, overflow: 'auto' }}>{emailPreview.body}</pre>
              </div>
            )}
            {notice && <div style={{ ...quietBox, padding: '9px 12px', marginTop: 12 }}>{notice}</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <button onClick={copyPacket} style={secondaryButton}>Copy</button>
              <button onClick={downloadPacket} style={secondaryButton}>Download .txt</button>
              <button onClick={() => window.print()} style={secondaryButton}>Print / save PDF</button>
              <button onClick={prepareEmailPreview} disabled={emailLoading} style={{ ...secondaryButton, opacity: emailLoading ? .65 : 1 }}>{emailLoading ? 'Preparing...' : 'Prepare email preview'}</button>
              <button onClick={finish} style={primaryButton}>Use as task proof</button>
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
const metaLabel = { color: C.sage, fontSize: 10.5, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 4 };
const mark = { width: 28, height: 28, borderRadius: 8, display: 'block', background: C.bg, border: `1px solid ${C.border}`, objectFit: 'contain' };
const brandPreview = { background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 16, padding: 15, marginBottom: 12 };
const printPacket = { display: 'none' };
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