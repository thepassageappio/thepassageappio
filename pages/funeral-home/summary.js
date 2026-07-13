import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter } from '../../components/SiteChrome';

function statusLabel(value) {
  if (value === 'handled' || value === 'completed' || value === 'done') return 'Handled';
  if (value === 'delivered') return 'Delivered';
  if (value === 'acknowledged' || value === 'confirmed') return 'Confirmed';
  if (value === 'waiting' || value === 'pending' || value === 'sent' || value === 'assigned') return 'Waiting';
  if (value === 'blocked' || value === 'failed') return 'Needs attention';
  return 'Draft';
}

function statusTone(label) {
  if (label === 'Handled' || label === 'Delivered' || label === 'Confirmed') return 'done';
  if (label === 'Waiting') return 'waiting';
  if (label === 'Needs attention') return 'attention';
  return 'draft';
}

function StatusPill({ label }) {
  const tone = statusTone(label);
  return (
    <span className={`th-pill tone-${tone}`}>
      <span className="sdot" />
      {label}
    </span>
  );
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
  const stage = String(workflow?.setup_stage || '');
  const caseType = stage.includes('preneed') || stage.includes('prepaid') || workflow?.mode === 'green'
    ? 'Pre-need / prepaid planning'
    : 'At-need coordination';

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
          --ok-700:#3D6449; --ok-600:#4C7A5C; --ok-100:#E3EEE4;
          --wait-700:#946B23; --wait-600:#B5862F; --wait-100:#F5EAD6;
          --line:#E6DDCB; --line-soft:#EFE8DA;
          --r-xs:8px; --r-sm:12px; --r-md:18px; --r-lg:26px; --r-full:999px;
          --e1:0 1px 1px rgba(20,30,25,.03), 0 2px 4px rgba(20,30,25,.03);
          --e2:0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10);
          --ease:cubic-bezier(.22,1,.36,1);
        }
      `}</style>
      <style jsx>{`
        .th-shell {
          min-height: 100vh;
          background: var(--bone-100);
          color: var(--ink-900);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: -.005em;
          padding: 22px;
        }
        @media print {
          .th-shell { background: #fff !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: none !important; }
        }
        .toolbar {
          max-width: 840px;
          margin: 0 auto 14px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .th-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14px;
          border-radius: var(--r-full);
          padding: 12px 20px;
          min-height: 44px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
        }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn-secondary {
          background: var(--bone-50);
          color: var(--pine-800);
          border-color: var(--line);
          box-shadow: var(--e1);
        }
        .th-btn-primary {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800));
          color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .th-notice {
          max-width: 840px;
          margin: 0 auto 14px;
          background: var(--clay-50);
          border: 1px solid var(--clay-200);
          color: var(--clay-700);
          border-radius: var(--r-sm);
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.5;
        }
        .th-loading {
          max-width: 840px;
          margin: 0 auto;
          color: var(--ink-500);
          font-size: 14px;
        }
        .sheet {
          max-width: 840px;
          margin: 0 auto;
          background: var(--bone-50);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-lg);
          padding: 34px;
          box-shadow: var(--e2);
        }
        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          border-bottom: 1px solid var(--line-soft);
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .eyebrow {
          font-family: 'Inter', sans-serif;
          color: var(--clay-600);
          font-size: 11px;
          letter-spacing: .14em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .case-title {
          font-family: 'Fraunces', serif;
          font-weight: 440;
          font-size: clamp(30px, 5vw, 40px);
          line-height: 1.08;
          letter-spacing: -.018em;
          color: var(--pine-950);
          margin: 10px 0 0;
        }
        .case-meta { color: var(--ink-500); font-size: 13px; margin-top: 8px; }
        .brand-meta {
          text-align: right;
          color: var(--ink-500);
          font-size: 12px;
          line-height: 1.6;
          flex-shrink: 0;
        }
        .brand-meta img { width: 34px; height: 34px; border-radius: var(--r-xs); display: inline-block; margin-bottom: 8px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 22px; }
        .info-card {
          border-radius: var(--r-md);
          padding: 16px;
          box-shadow: var(--e1);
        }
        .info-card.tint { background: var(--pine-50); border: 1px solid #D5E4DC; }
        .info-card.plain { background: var(--bone-50); border: 1px solid var(--line-soft); }
        .info-label {
          color: var(--pine-700);
          font-size: 10.5px;
          letter-spacing: .12em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .info-value { font-size: 17px; margin-top: 6px; color: var(--ink-900); font-weight: 500; }
        .info-sub { color: var(--ink-500); font-size: 13px; line-height: 1.55; margin-top: 3px; }
        .section-block { margin-bottom: 22px; }
        .section-label {
          color: var(--pine-700);
          font-size: 10.5px;
          letter-spacing: .12em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 11px 0;
          border-top: 1px solid var(--line-soft);
          font-size: 13.5px;
        }
        .row-title { color: var(--ink-900); }
        .row-sub { color: var(--ink-400); font-size: 12px; margin-top: 2px; }
        .comm-row { padding: 10px 0; border-top: 1px solid var(--line-soft); font-size: 13px; color: var(--ink-700); }
        .empty-note { color: var(--ink-500); font-size: 13px; }
        .th-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: var(--r-full);
          white-space: nowrap;
        }
        .th-pill .sdot { width: 6px; height: 6px; border-radius: 50%; }
        .th-pill.tone-done { background: var(--ok-100); color: var(--ok-700); border: 1px solid #C7DECB; }
        .th-pill.tone-done .sdot { background: var(--ok-600); }
        .th-pill.tone-waiting { background: var(--wait-100); color: var(--wait-700); border: 1px solid #E9D6A8; }
        .th-pill.tone-waiting .sdot { background: var(--wait-600); }
        .th-pill.tone-attention { background: var(--clay-50); color: var(--clay-700); border: 1px solid var(--clay-200); }
        .th-pill.tone-attention .sdot { background: var(--clay-600); }
        .th-pill.tone-draft { background: var(--bone-200); color: var(--ink-500); border: 1px solid var(--line-soft); }
        .th-pill.tone-draft .sdot { background: var(--ink-300); }
        .sheet-footer {
          border-top: 1px solid var(--line-soft);
          padding-top: 14px;
          color: var(--ink-400);
          font-size: 11.5px;
          line-height: 1.55;
        }

        @media (max-width: 640px) {
          .th-shell { padding: 14px; }
          .sheet { padding: 22px 18px; border-radius: var(--r-md); }
          .sheet-header { flex-direction: column; gap: 14px; }
          .brand-meta { text-align: left; }
          .info-grid { grid-template-columns: 1fr; }
          .row { grid-template-columns: 1fr; align-items: flex-start; }
          .toolbar { padding: 0 2px; }
        }
      `}</style>

      <div className="toolbar no-print">
        <button className="th-btn th-btn-secondary" onClick={() => router.back()}>Back</button>
        <button className="th-btn th-btn-primary" onClick={() => window.print()}>Print / Save PDF</button>
      </div>

      {error && <div className="th-notice">{error}</div>}
      {!data && !error && <div className="th-loading">Loading summary&hellip;</div>}

      {data && (
        <section className="sheet">
          <header className="sheet-header">
            <div>
              <div className="eyebrow">{org.from_name || org.name || 'Funeral home'} family summary</div>
              <h1 className="case-title">{caseName}</h1>
              <div className="case-meta">{caseType}{workflow.organization_case_reference ? ` — ${workflow.organization_case_reference}` : ''}</div>
            </div>
            <div className="brand-meta">
              <img src="/passage-icon-light-onbg.svg" alt="Passage" />
              <br />
              Prepared {new Date().toLocaleDateString()}<br />
              Powered by Passage<br />
              thepassageapp.io
            </div>
          </header>

          <div className="info-grid">
            <div className="info-card tint">
              <div className="info-label">Family contact</div>
              <div className="info-value">{workflow.coordinator_name || 'Not added yet'}</div>
              <div className="info-sub">{workflow.coordinator_email || ''}{workflow.coordinator_email && workflow.coordinator_phone ? <br /> : null}{workflow.coordinator_phone || ''}</div>
            </div>
            <div className="info-card plain">
              <div className="info-label">Meeting readiness</div>
              <div className="info-value">Enough to get started</div>
              <div className="info-sub">Bring this summary to the arrangement meeting or send it ahead so everyone starts from the same facts.</div>
            </div>
          </div>

          <section className="section-block">
            <div className="section-label">Open work</div>
            {(data.tasks || []).slice(0, 8).map(task => (
              <div key={task.id} className="row">
                <div>
                  <div className="row-title">{task.title}</div>
                  <div className="row-sub">{task.assigned_to_name || task.last_actor || 'Unassigned'}</div>
                </div>
                <StatusPill label={statusLabel(task.status)} />
              </div>
            ))}
          </section>

          <section className="section-block">
            <div className="section-label">Communication log</div>
            {(data.communications || []).length === 0 && <div className="empty-note">No messages sent yet.</div>}
            {(data.communications || []).slice(0, 5).map(item => (
              <div key={item.id} className="comm-row">
                {item.subject || 'Family update'} — {item.recipient_name || item.recipient_email || item.recipient_phone || 'recipient'} — {statusLabel(item.status)}
              </div>
            ))}
          </section>

          <footer className="sheet-footer">
            Prepared with Passage. Powered by Passage | thepassageapp.io. Based on standard funeral home intake information and the family coordination details available at the time this summary was created.
          </footer>
        </section>
      )}
      <div className="no-print">
        <SiteFooter />
      </div>
    </main>
  );
}
