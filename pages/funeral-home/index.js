import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fffdf9', ink: '#1a1916', mid: '#6a6560', soft: '#9a9288', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#eef5ef', rose: '#c47a7a', dark: '#191815' };

const needs = [
  ['Reduce family back-and-forth', 'One case view for service details, assignments, confirmations, and what is waiting.'],
  ['Act on behalf', 'Staff can move partner-ready tasks while the audit trail shows who did what and when.'],
  ['Keep families reassured', 'Families see visible progress instead of calling repeatedly to ask what happened.'],
];

export default function FuneralHomePage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '14px 22px 38px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.92fr) minmax(320px,.72fr)', gap: 18, alignItems: 'stretch', marginBottom: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 24, boxShadow: '0 18px 48px rgba(55,45,35,.06)' }}>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 9 }}>For funeral homes</div>
            <h1 style={{ fontSize: 'clamp(34px, 4.5vw, 58px)', lineHeight: 1, margin: '0 0 13px', fontWeight: 400 }}>
              A family command center your staff can actually use.
            </h1>
            <p style={{ color: C.mid, fontSize: 15, lineHeight: 1.62, maxWidth: 720, margin: '0 0 18px' }}>
              Passage gives directors a simple, co-branded place to see each case, reduce repeated calls, send updates, and help families know what is happening.
            </p>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <Link href="/funeral-home/dashboard" style={{ background: C.sage, color: '#fff', borderRadius: 12, padding: '11px 16px', textDecoration: 'none', fontWeight: 800, fontSize: 13 }}>Open partner dashboard</Link>
              <Link href="/contact" style={{ background: C.card, color: C.sage, border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 16px', textDecoration: 'none', fontWeight: 800, fontSize: 13 }}>Talk to Passage</Link>
            </div>
          </div>
          <div style={{ background: C.dark, color: '#fff', borderRadius: 22, padding: 22, boxShadow: '0 18px 48px rgba(55,45,35,.09)' }}>
            <div style={{ color: '#c8deca', fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 12 }}>Pilot promise</div>
            <div style={{ fontSize: 29, lineHeight: 1.1, marginBottom: 13 }}>Fewer status calls. Cleaner family handoffs. Better proof.</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {['Active cases', 'Waiting on family', 'Partner-ready tasks', 'Act on behalf'].map(item => (
                <div key={item} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 800 }}>{item}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: 10, marginBottom: 14 }}>
          {needs.map(([title, body]) => (
            <div key={title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>{title}</div>
              <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55 }}>{body}</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
          <div style={{ fontSize: 22, lineHeight: 1.18, marginBottom: 7 }}>Built as a separate partner module.</div>
          <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.6 }}>
            This does not disturb the family red path, green path, or participant flow. It reuses the same estate, task, status, and audit engine with funeral-home staff permissions layered on top.
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
