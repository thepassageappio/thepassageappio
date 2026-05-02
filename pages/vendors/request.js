import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { money } from '../../lib/vendorEconomics';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3', amber: '#b07d2e', amberFaint: '#fdf8ee' };

export default function VendorRequestPage() {
  const router = useRouter();
  const token = String(router.query.token || '');
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [finalValue, setFinalValue] = useState('');

  useEffect(() => {
    if (!token) return;
    load();
  }, [token]);

  async function load() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/vendorRequests/portal?token=' + encodeURIComponent(token));
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(json.error || 'Could not load this request.');
      return;
    }
    setRequest(json.request);
    setEstimatedValue(json.request?.estimated_value || '');
    setFinalValue(json.request?.final_value || '');
  }

  async function update(action) {
    setUpdating(action);
    setError('');
    setNotice('');
    const res = await fetch('/api/vendorRequests/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action, estimatedValue, finalValue }),
    });
    const json = await res.json().catch(() => ({}));
    setUpdating('');
    if (!res.ok) {
      setError(json.error || 'Could not update this request.');
      return;
    }
    setRequest(json.request);
    setNotice(action === 'completed'
      ? 'Marked completed. Passage will show the family and funeral home that this is handled.'
      : 'Updated. Passage will keep the family and funeral home informed.');
  }

  const familyName = request?.workflows?.deceased_name || request?.workflows?.estate_name || request?.workflows?.name || 'Family case';
  const vendorName = request?.vendors?.business_name || 'Vendor';

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink, padding: 24 }}>
      <section style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 18 }}>Passage</div>
        {loading && <div style={cardStyle}>Loading request...</div>}
        {error && <div style={{ ...cardStyle, background: C.roseFaint, color: C.rose, borderColor: C.rose + '44' }}>{error}</div>}
        {!loading && request && (
          <div style={cardStyle}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Local support request</div>
            <h1 style={{ fontSize: 'clamp(30px, 5vw, 48px)', lineHeight: 1.05, fontWeight: 400, margin: '10px 0' }}>{vendorName}, a family asked for help.</h1>
            <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.65 }}>Passage keeps this request visible to the family and any connected funeral home. Update it here so nobody has to chase a separate call or text.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, margin: '18px 0' }}>
              <Info label="Family case" value={familyName} />
              <Info label="Task" value={request.task_title || 'Local help'} />
              <Info label="Urgency" value={request.urgency === 'rush' ? 'Rush' : 'Planned'} />
              <Info label="Status" value={labelForStatus(request.status)} />
            </div>

            <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>Proof trail</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Pill label="Sent" time={request.requested_at} />
                {request.viewed_at && <Pill label="Viewed" time={request.viewed_at} />}
                {request.responded_at && <Pill label="Accepted" time={request.responded_at} />}
                {request.in_progress_at && <Pill label="In progress" time={request.in_progress_at} />}
                {request.completed_at && <Pill label="Completed" time={request.completed_at} />}
              </div>
            </div>

            <div style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <div style={{ color: C.soft, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 8 }}>Booking value</div>
              <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.5, marginTop: 0 }}>For now, this records the booking opportunity so Passage and the funeral home stay in the transaction trail. Family-facing payment collection can be turned on with Stripe Connect next.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                <label style={labelStyle}>Estimated value<input value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="250" style={inputStyle} /></label>
                <label style={labelStyle}>Final value<input value={finalValue} onChange={(e) => setFinalValue(e.target.value)} placeholder="250" style={inputStyle} /></label>
              </div>
              {(request.platform_fee_amount || request.funeral_home_share_amount || request.passage_share_amount) && (
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9, fontSize: 12.5, color: C.mid }}>
                  {request.platform_fee_amount && <span>Tracked platform fee: <strong>{money(request.platform_fee_amount)}</strong></span>}
                  {request.funeral_home_share_amount && <span>Funeral home share: <strong>{money(request.funeral_home_share_amount)}</strong></span>}
                  {request.passage_share_amount && <span>Passage share: <strong>{money(request.passage_share_amount)}</strong></span>}
                </div>
              )}
            </div>

            {notice && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 12, padding: 10, marginBottom: 10, fontWeight: 800 }}>{notice}</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => update('accepted')} disabled={!!updating} style={buttonStyle(C.sage)}>{updating === 'accepted' ? 'Updating...' : 'Accept request'}</button>
              <button onClick={() => update('in_progress')} disabled={!!updating} style={buttonStyle(C.amber)}>{updating === 'in_progress' ? 'Updating...' : 'Mark in progress'}</button>
              <button onClick={() => update('completed')} disabled={!!updating} style={buttonStyle(C.sage)}>{updating === 'completed' ? 'Updating...' : 'Mark completed'}</button>
              <button onClick={() => update('declined')} disabled={!!updating} style={{ ...buttonStyle('#fff'), color: C.rose, border: '1px solid ' + C.rose + '55' }}>Decline</button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 12, padding: 11 }}>
      <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
      <div style={{ fontSize: 15, marginTop: 4 }}>{value || 'Not provided'}</div>
    </div>
  );
}

function Pill({ label, time }) {
  return <span style={{ background: C.card, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900 }}>{label}{time ? ` - ${new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</span>;
}

function labelForStatus(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'in_progress') return 'In progress';
  if (status === 'accepted') return 'Accepted';
  if (status === 'declined') return 'Declined';
  return 'Waiting for response';
}

function buttonStyle(background) {
  return { border: background === '#fff' ? '1px solid ' + C.border : 'none', background, color: background === '#fff' ? C.ink : '#fff', borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
}

const cardStyle = { background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 24 };
const labelStyle = { display: 'grid', gap: 5, color: C.soft, fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.12em' };
const inputStyle = { border: '1px solid ' + C.border, borderRadius: 11, background: C.card, padding: '10px 11px', fontFamily: 'Georgia,serif', fontSize: 14, color: C.ink };
