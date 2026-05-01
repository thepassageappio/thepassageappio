import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const C = { bg: '#f6f3ee', card: '#fffdf9', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1' };

function statusLabel(value) {
  if (value === 'handled' || value === 'completed') return 'Handled';
  if (value === 'delivered') return 'Delivered';
  if (value === 'acknowledged' || value === 'confirmed') return 'Confirmed';
  if (value === 'waiting' || value === 'sent' || value === 'assigned') return 'Waiting';
  if (value === 'blocked' || value === 'failed') return 'Needs attention';
  return 'Draft';
}

export default function PartnerCaseSummary() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.query.id) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.access_token) {
        setError('Sign in to view this case summary.');
        return;
      }
      const res = await fetch('/api/partnerCaseSummary?id=' + encodeURIComponent(router.query.id), { headers: { Authorization: 'Bearer ' + session.access_token } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error || 'Could not load summary.');
      else setData(json);
    });
  }, [router.query.id]);

  const workflow = data?.workflow;
  const org = workflow?.organizations || {};
  const caseName = workflow?.deceased_name || workflow?.estate_name || workflow?.name || 'Family case';

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink, padding: 22 }}>
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: none !important; }
        }
      `}</style>
      <div className="no-print" style={{ maxWidth: 840, margin: '0 auto 12px', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <button onClick={() => router.back()} style={{ border: `1px solid ${C.border}`, background: C.card, borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Back</button>
        <button onClick={() => window.print()} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Print / Save PDF</button>
      </div>
      {error && <div style={{ maxWidth: 840, margin: '0 auto', color: '#c47a7a' }}>{error}</div>}
      {!data && !error && <div style={{ maxWidth: 840, margin: '0 auto', color: C.soft }}>Loading summary...</div>}
      {data && (
        <section className="sheet" style={{ maxWidth: 840, margin: '0 auto', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,.07)' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', gap: 18, borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 18 }}>
            <div>
              <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>{org.from_name || org.name || 'Funeral home'} family summary</div>
              <h1 style={{ fontSize: 34, lineHeight: 1.05, fontWeight: 400, margin: '8px 0 0' }}>{caseName}</h1>
              <div style={{ color: C.mid, fontSize: 13, marginTop: 6 }}>{workflow.mode === 'funeral_home_preneed' ? 'Pre-need / prepaid planning' : 'At-need coordination'}{workflow.organization_case_reference ? ` · ${workflow.organization_case_reference}` : ''}</div>
            </div>
            <div style={{ textAlign: 'right', color: C.mid, fontSize: 12, lineHeight: 1.55 }}>
              Prepared {new Date().toLocaleDateString()}<br />
              Powered by Passage
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 14 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Family contact</div>
              <div style={{ fontSize: 18, marginTop: 5 }}>{workflow.coordinator_name || 'Not added yet'}</div>
              <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.5 }}>{workflow.coordinator_email || ''}<br />{workflow.coordinator_phone || ''}</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 14 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Meeting readiness</div>
              <div style={{ fontSize: 18, marginTop: 5 }}>Enough to get started</div>
              <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.5 }}>Bring this summary to the arrangement meeting or send it ahead.</div>
            </div>
          </div>

          <section style={{ marginBottom: 16 }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 7 }}>Open work</div>
            {(data.tasks || []).slice(0, 8).map(task => (
              <div key={task.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, padding: '8px 0', borderTop: `1px solid ${C.border}`, fontSize: 13.5 }}>
                <div>{task.title}<div style={{ color: C.soft, fontSize: 12 }}>{task.assigned_to_name || task.last_actor || 'Unassigned'}</div></div>
                <div style={{ color: C.sage, fontWeight: 900 }}>{statusLabel(task.status)}</div>
              </div>
            ))}
          </section>

          <section style={{ marginBottom: 16 }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 7 }}>Communication log</div>
            {(data.communications || []).length === 0 && <div style={{ color: C.mid, fontSize: 13 }}>No messages sent yet.</div>}
            {(data.communications || []).slice(0, 5).map(item => (
              <div key={item.id} style={{ padding: '7px 0', borderTop: `1px solid ${C.border}`, fontSize: 13 }}>
                {item.subject || 'Family update'} · {item.recipient_name || item.recipient_email || item.recipient_phone || 'recipient'} · {statusLabel(item.status)}
              </div>
            ))}
          </section>

          <footer style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, color: C.soft, fontSize: 11.5, lineHeight: 1.5 }}>
            This summary is for family coordination and arrangement preparation. Prepared with Passage based on standard funeral home intake and case coordination information.
          </footer>
        </section>
      )}
    </main>
  );
}
