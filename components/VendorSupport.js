import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseBrowser';
import { StatusBadge } from './SiteChrome';
import { vendorAvailabilityLabel, vendorCategoryLabel } from '../lib/vendors';
import { paymentStatusLabel, vendorNextExpected, vendorStatusLabel } from '../lib/vendorLifecycle';

const C = {
  card: '#ffffff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  sageLight: '#c8deca',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
  amber: '#b07d2e',
  subtle: '#f0ece5',
};

export default function VendorSupport({ workflowId, taskId, taskTitle, authToken, onRequested }) {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [requesting, setRequesting] = useState('');
  const [deciding, setDeciding] = useState('');
  const [paymentReview, setPaymentReview] = useState(null);
  const [urgency, setUrgency] = useState('planned');
  const [token, setToken] = useState(authToken || '');

  useEffect(() => {
    if (authToken) {
      setToken(authToken);
      return;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setToken(data?.session?.access_token || '');
    });
    return () => { cancelled = true; };
  }, [authToken]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!workflowId || (!taskId && !taskTitle)) return;
      setLoading(true);
      setMessage('');
      try {
        const params = new URLSearchParams();
        params.set('workflowId', workflowId);
        if (taskId) params.set('taskId', taskId);
        if (taskTitle) params.set('taskTitle', taskTitle);
        const response = await fetch('/api/vendors/recommendations?' + params.toString(), {
          headers: token ? { Authorization: 'Bearer ' + token } : {},
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load local support.');
        if (!cancelled) {
          setVendors(data.vendors || []);
          setRequests(data.requests || []);
          setCategory(data.category || '');
        }
      } catch (error) {
        if (!cancelled) setMessage(error.message || 'Could not load local support.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [workflowId, taskId, taskTitle, token]);

  if (!category && !loading) return null;

  async function requestHelp(vendor) {
    setRequesting(vendor.id);
    setMessage('');
    try {
      const response = await fetch('/api/vendorRequests/create', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
        body: JSON.stringify({
          workflowId,
          taskId,
          taskTitle,
          vendorId: vendor.id,
          urgency,
          requestNote: urgency === 'rush'
            ? 'Family requested the fastest available quote or availability window.'
            : 'Family requested planned timing and a clear quote before work begins.',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not request help.');
      setMessage('Request sent - waiting for response. The quote response will appear here.');
      setRequests((prev) => [data.request, ...prev].filter(Boolean).slice(0, 3));
      if (onRequested) onRequested(data);
    } catch (error) {
      setMessage(error.message || 'Could not request help.');
    } finally {
      setRequesting('');
    }
  }

  async function decideQuote(request, action) {
    setDeciding(request.id + ':' + action);
    setMessage('');
    try {
      const endpoint = action === 'approve_quote' ? '/api/vendorRequests/checkout' : '/api/vendorRequests/decision';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
        body: JSON.stringify(action === 'approve_quote' ? { requestId: request.id } : { requestId: request.id, action }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not update this quote.');
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setRequests((prev) => prev.map((item) => item.id === request.id ? data.request : item));
      setMessage(action === 'approve_quote'
        ? 'Quote accepted - opening secure payment.'
        : 'Marked as needing another option. The request stays visible here with its reason and status.');
      if (onRequested) onRequested(data);
    } catch (error) {
      setMessage(error.message || 'Could not update this quote.');
    } finally {
      setDeciding('');
    }
  }

  return (
    <div style={{ background: C.card, border: '1px solid ' + C.sageLight, borderRadius: 12, padding: '13px 14px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 9 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: C.sage, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 4 }}>Need outside help?</div>
          <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.45 }}>Passage can suggest local support, request one quote, and keep the response attached to this step.</div>
        </div>
        {category && <span style={{ fontSize: 10.5, fontWeight: 900, color: C.sage, background: C.sageFaint, borderRadius: 999, padding: '4px 8px', whiteSpace: 'nowrap' }}>{vendorCategoryLabel(category)}</span>}
      </div>
      <div style={{ background: C.sageFaint, border: '1px solid ' + C.sageLight, borderRadius: 11, padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 9 }}>
        <div>
          <div style={{ fontSize: 10.5, color: C.sage, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.1em' }}>1. Do</div>
          <div style={{ fontSize: 12.2, color: C.ink, lineHeight: 1.35, fontWeight: 900, marginTop: 3 }}>Choose one provider only when this step needs outside help.</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: C.sage, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.1em' }}>2. Update</div>
          <div style={{ fontSize: 12.2, color: C.mid, lineHeight: 1.35, fontWeight: 800, marginTop: 3 }}>Quote requested, quote ready, payment, scheduled, and completed stay attached here.</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: C.sage, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.1em' }}>3. Save proof</div>
          <div style={{ fontSize: 12.2, color: C.mid, lineHeight: 1.35, fontWeight: 800, marginTop: 3 }}>The vendor sees only this request, timing, and contact boundary.</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 7, margin: '9px 0' }}>
        {[
          ['planned', 'Planned quote', 'Use when timing can be coordinated calmly.'],
          ['rush', 'Urgent quote', 'Use when the family needs a fast availability answer.'],
        ].map(([value, title, body]) => (
          <button key={value} onClick={() => setUrgency(value)} style={{ textAlign: 'left', border: '1px solid ' + (urgency === value ? C.sage : C.border), background: urgency === value ? C.sageFaint : C.card, color: C.ink, borderRadius: 11, padding: '9px 10px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
            <div style={{ fontSize: 12.5, fontWeight: 900 }}>{title}</div>
            <div style={{ color: C.mid, fontSize: 11.3, lineHeight: 1.35, marginTop: 3 }}>{body}</div>
          </button>
        ))}
      </div>
      {loading && <div style={{ fontSize: 12.5, color: C.soft }}>Checking local support...</div>}
      {!loading && vendors.length === 0 && (
        <div style={{ background: C.subtle, borderRadius: 10, padding: '9px 10px', fontSize: 12.5, color: C.mid, lineHeight: 1.45 }}>
          No trusted local option is attached to this task yet. You can still use the call, text, or email path above.
        </div>
      )}
      {vendors.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          {vendors.slice(0, 2).map((vendor) => (
            <div key={vendor.id} style={{ border: '1px solid ' + C.border, background: vendor.preferred_by_funeral_home ? C.sageFaint : C.subtle, borderRadius: 11, padding: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: C.ink, lineHeight: 1.25 }}>{vendor.business_name}</div>
                  <div style={{ fontSize: 11.5, color: C.mid, lineHeight: 1.45, marginTop: 3 }}>{vendor.short_description || 'Local support for this step.'}</div>
                </div>
                {vendor.preferred_by_funeral_home && <span style={{ fontSize: 10.5, color: C.sage, fontWeight: 900, whiteSpace: 'nowrap' }}>Preferred</span>}
              </div>
              <div style={{ fontSize: 11.5, color: C.amber, fontWeight: 800, marginTop: 7 }}>{vendorAvailabilityLabel(vendor)}</div>
              {vendor.preferred_by_funeral_home && (
                <div style={{ fontSize: 11.5, color: C.sage, lineHeight: 1.45, marginTop: 5 }}>Preferred by your funeral home for this kind of help.</div>
              )}
              {!vendor.preferred_by_funeral_home && (
                <div style={{ fontSize: 11.5, color: C.sage, lineHeight: 1.45, marginTop: 5 }}>
                  {vendor.recently_helped_count > 0 ? `Recently helped ${vendor.recently_helped_count} Passage families.` : 'Used by families like yours recently.'}
                </div>
              )}
              {(vendor.average_rating || vendor.review_count || vendor.family_review_snippet) && (
                <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 9, padding: '7px 8px', marginTop: 7, fontSize: 11.5, color: C.mid, lineHeight: 1.4 }}>
                  {(vendor.average_rating || vendor.review_count) && <strong style={{ color: C.ink }}>{vendor.average_rating ? `${Number(vendor.average_rating).toFixed(1)} / 5` : 'Trusted'}{vendor.review_count ? ` from ${vendor.review_count} families` : ''}</strong>}
                  {vendor.family_review_snippet && <div style={{ marginTop: 3 }}>&ldquo;{vendor.family_review_snippet}&rdquo;</div>}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 9 }}>
                <button onClick={() => requestHelp(vendor)} disabled={requesting === vendor.id} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '8px 10px', fontFamily: 'Georgia,serif', fontSize: 12.5, fontWeight: 900, cursor: requesting === vendor.id ? 'default' : 'pointer' }}>
                  {requesting === vendor.id ? 'Requesting...' : urgency === 'rush' ? 'Request urgent quote' : 'Request quote'}
                </button>
                {vendor.contact_phone && <span style={{ fontSize: 11.5, color: C.mid }}>{vendor.contact_phone}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {requests.length > 0 && (
        <div style={{ background: C.sageFaint, border: '1px solid ' + C.sageLight, borderRadius: 11, padding: 10, marginTop: 9 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: C.sage, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Request status</div>
          {requests.map((request) => (
            <div key={request.id} style={{ display: 'grid', gap: 5, padding: '6px 0', borderTop: '1px solid ' + C.sageLight }}>
              <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 900 }}>{request.vendors?.business_name || 'Local support'} - {vendorRequestLabel(request.status)}</div>
              <div style={{ fontSize: 11.5, color: C.mid, lineHeight: 1.45 }}>{vendorNextExpected(request.status, request.payment_collection_status)}</div>
              {request.vendor_note && <div style={{ fontSize: 11.5, color: C.mid, lineHeight: 1.45 }}>{request.vendor_note}</div>}
              {(request.estimated_value || request.final_value) && (
                <div style={{ fontSize: 11.5, color: C.sage, fontWeight: 900 }}>
                  Quote/value: ${Math.round(Number(request.final_value || request.estimated_value || 0))}
                </div>
              )}
              {request.payment_collection_status && (
                <div style={{ fontSize: 11.5, color: C.amber, fontWeight: 900 }}>
                  Payment: {paymentStatusLabel(request.payment_collection_status)}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {request.requested_at && <ProofPill status="sent" label="Sent" time={request.requested_at} />}
                {request.viewed_at && <ProofPill status="viewed" label="Viewed" time={request.viewed_at} />}
                {(request.responded_at || ['accepted', 'quoted', 'family_accepted', 'payment_pending', 'paid', 'scheduled', 'in_progress', 'completed'].includes(request.status)) && <ProofPill status="accepted" label="Quote ready" time={request.responded_at} />}
                {(['payment_pending'].includes(request.status) || request.payment_collection_status === 'checkout_created') && <ProofPill status="waiting" label="Payment pending" time={request.family_accepted_at || request.payment_url_created_at} />}
                {(['paid', 'scheduled', 'in_progress', 'completed'].includes(request.status) || request.payment_collection_status === 'paid') && <ProofPill status="completed" label="Paid" time={request.paid_at} />}
                {(request.in_progress_at || ['scheduled', 'in_progress', 'completed'].includes(request.status)) && <ProofPill status="waiting" label="Scheduled" time={request.in_progress_at || request.responded_at} />}
                {request.completed_at && <ProofPill status="completed" label="Completed" time={request.completed_at} />}
              </div>
              {['accepted', 'quoted', 'family_accepted', 'payment_pending'].includes(request.status) && request.payment_collection_status !== 'paid' && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button onClick={() => setPaymentReview(request)} disabled={deciding === request.id + ':approve_quote'} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '7px 9px', fontFamily: 'Georgia,serif', fontSize: 11.5, fontWeight: 900, cursor: 'pointer' }}>
                    {deciding === request.id + ':approve_quote' ? 'Opening payment...' : request.payment_collection_status === 'checkout_created' ? 'Return to payment' : 'Review and pay'}
                  </button>
                  <button onClick={() => decideQuote(request, 'decline_quote')} disabled={deciding === request.id + ':decline_quote'} style={{ border: '1px solid ' + C.border, background: C.card, color: C.mid, borderRadius: 9, padding: '7px 9px', fontFamily: 'Georgia,serif', fontSize: 11.5, fontWeight: 900, cursor: 'pointer' }}>
                    Need another option
                  </button>
                </div>
              )}
              {request.status === 'requested' && (
                <div style={{ fontSize: 11.5, color: C.mid }}>Waiting for a quote or availability response. If we do not hear back, Passage keeps it visible here.</div>
              )}
              {['paid', 'scheduled', 'in_progress'].includes(request.status) && (
                <div style={{ fontSize: 11.5, color: C.mid }}>Payment is tracked. Waiting for service completion proof from the vendor.</div>
              )}
            </div>
          ))}
        </div>
      )}
      {message && <div style={{ marginTop: 9, background: message.includes('sent') ? C.sageFaint : C.roseFaint, border: '1px solid ' + (message.includes('sent') ? C.sageLight : C.rose + '33'), color: message.includes('sent') ? C.sage : C.rose, borderRadius: 10, padding: '8px 10px', fontSize: 12.5, fontWeight: 800 }}>{message}</div>}
      <div style={{ fontSize: 11.5, color: C.soft, lineHeight: 1.45, marginTop: 9 }}>Vendor help is optional. You can use anyone you choose.</div>
      {paymentReview && (
        <div onClick={() => setPaymentReview(null)} style={{ position: 'fixed', inset: 0, zIndex: 240, background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div role="dialog" aria-modal="true" aria-label="Review vendor quote" onClick={(event) => event.stopPropagation()} style={{ width: 'min(560px, 100%)', background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 18, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Review before payment</div>
            <h3 style={{ color: C.ink, fontSize: 25, lineHeight: 1.15, margin: '6px 0 8px' }}>{paymentReview.vendors?.business_name || 'Vendor'} quote</h3>
            <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.6, margin: '0 0 12px' }}>Passage will open secure Stripe checkout. After payment, the vendor sees that work can begin, and this step keeps the payment proof, service details, and next update in one place.</p>
            <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
              <InfoRow label="Request" value={paymentReview.task_title || taskTitle || 'Vendor service'} />
              <InfoRow label="Quote" value={'$' + Math.round(Number(paymentReview.final_value || paymentReview.estimated_value || 0))} />
              {paymentReview.service_start_at && <InfoRow label="Service time" value={new Date(paymentReview.service_start_at).toLocaleString()} />}
              {paymentReview.service_location && <InfoRow label="Location" value={paymentReview.service_location} />}
              {paymentReview.vendor_note && <InfoRow label="Vendor note" value={paymentReview.vendor_note} />}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => decideQuote(paymentReview, 'approve_quote')} disabled={deciding === paymentReview.id + ':approve_quote'} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>{deciding === paymentReview.id + ':approve_quote' ? 'Opening payment...' : 'Continue to secure payment'}</button>
              <button onClick={() => setPaymentReview(null)} style={{ border: '1px solid ' + C.border, background: C.card, color: C.mid, borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Review later</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ background: C.sageFaint, border: '1px solid ' + C.sageLight, borderRadius: 11, padding: '9px 10px' }}>
      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
      <div style={{ color: C.ink, fontSize: 13.5, fontWeight: 900, marginTop: 3 }}>{value}</div>
    </div>
  );
}

function ProofPill({ status, label, time }) {
  return (
    <StatusBadge status={status} compact label={time ? `${label} - ${new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : label} />
  );
}

function vendorRequestLabel(status) {
  const label = vendorStatusLabel(status);
  return label === 'Declined' ? 'Needs another option' : label;
}
