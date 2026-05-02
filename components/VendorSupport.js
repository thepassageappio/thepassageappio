import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { vendorAvailabilityLabel, vendorCategoryLabel } from '../lib/vendors';

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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function VendorSupport({ workflowId, taskId, taskTitle, authToken, onRequested }) {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [requesting, setRequesting] = useState('');
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
          urgency: vendor.rush_supported ? 'rush' : 'planned',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not request help.');
      setMessage('Request sent - waiting for response. We will coordinate this for you here.');
      setRequests((prev) => [data.request, ...prev].filter(Boolean).slice(0, 3));
      if (onRequested) onRequested(data);
    } catch (error) {
      setMessage(error.message || 'Could not request help.');
    } finally {
      setRequesting('');
    }
  }

  return (
    <div style={{ background: C.card, border: '1px solid ' + C.sageLight, borderRadius: 12, padding: '13px 14px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 9 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: C.sage, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 4 }}>Need help with this?</div>
          <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.45 }}>Passage can suggest local support when it helps complete this step. We will coordinate this for you here.</div>
        </div>
        {category && <span style={{ fontSize: 10.5, fontWeight: 900, color: C.sage, background: C.sageFaint, borderRadius: 999, padding: '4px 8px', whiteSpace: 'nowrap' }}>{vendorCategoryLabel(category)}</span>}
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
                {vendor.preferred_by_funeral_home && <span style={{ fontSize: 10, color: C.sage, fontWeight: 900, whiteSpace: 'nowrap' }}>Preferred</span>}
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
                  {requesting === vendor.id ? 'Requesting...' : 'Request help'}
                </button>
                {vendor.contact_phone && <span style={{ fontSize: 11.5, color: C.mid }}>{vendor.contact_phone}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {requests.length > 0 && (
        <div style={{ background: C.sageFaint, border: '1px solid ' + C.sageLight, borderRadius: 11, padding: 10, marginTop: 9 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: C.sage, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Request proof</div>
          {requests.map((request) => (
            <div key={request.id} style={{ display: 'grid', gap: 5, padding: '6px 0', borderTop: '1px solid ' + C.sageLight }}>
              <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 900 }}>{request.vendors?.business_name || 'Local support'} - {vendorRequestLabel(request.status)}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {request.requested_at && <ProofPill label="Sent" time={request.requested_at} active />}
                {request.viewed_at && <ProofPill label="Viewed" time={request.viewed_at} active />}
                {(request.responded_at || ['accepted', 'in_progress', 'completed'].includes(request.status)) && <ProofPill label="Accepted" time={request.responded_at} active />}
                {(request.in_progress_at || request.status === 'in_progress' || request.status === 'completed') && <ProofPill label="In progress" time={request.in_progress_at || request.responded_at} active />}
                {request.completed_at && <ProofPill label="Completed" time={request.completed_at} active />}
              </div>
              {['requested', 'accepted', 'in_progress'].includes(request.status) && (
                <div style={{ fontSize: 11.5, color: C.mid }}>Waiting for response. If we do not hear back, Passage will prompt you.</div>
              )}
            </div>
          ))}
        </div>
      )}
      {message && <div style={{ marginTop: 9, background: message.includes('sent') ? C.sageFaint : C.roseFaint, border: '1px solid ' + (message.includes('sent') ? C.sageLight : C.rose + '33'), color: message.includes('sent') ? C.sage : C.rose, borderRadius: 10, padding: '8px 10px', fontSize: 12.5, fontWeight: 800 }}>{message}</div>}
      <div style={{ fontSize: 11.5, color: C.soft, lineHeight: 1.45, marginTop: 9 }}>Vendor help is optional. You can use anyone you choose.</div>
    </div>
  );
}

function ProofPill({ label, time }) {
  return (
    <span style={{ background: '#fff', border: '1px solid #c8deca', color: '#6b8f71', borderRadius: 999, padding: '3px 7px', fontSize: 10.5, fontWeight: 900 }}>
      {label}{time ? ` - ${new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
    </span>
  );
}

function vendorRequestLabel(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'in_progress') return 'In progress';
  if (status === 'accepted') return 'Accepted';
  if (status === 'declined') return 'Needs another option';
  return 'Waiting for response';
}
