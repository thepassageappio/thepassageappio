// Passage — calm public marketing homepage (site-migration Slice 1).
// Full functional parity with the legacy components/App.js CompactLanding, rebuilt
// on the calm design system (lib/designSystem.js + components/calm/*). SSR-safe
// (no window/document at module/render time), indexable (SEO comes from _app.js
// PAGE_META for '/'; NO noindex here). Reuses SiteChrome's SiteHeader/SiteFooter so
// the public nav link list + auth slot + footer logic stay a single source of truth.
//
// Mobile + web in tandem: zero horizontal overflow at 360/390/desktop, tap targets
// >= DS.tap.min, no hydration warnings, no internal vocab on this public page.
import { useEffect, useState } from 'react';
import { DS, TYPE, SANS } from '../lib/designSystem';
import { PASSAGE_BRAND } from '../lib/brand';
import { Button, Card } from './calm/CalmControls';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { trackEvent } from '../lib/trackEvent';

// Story panes — copy carried verbatim from CompactLanding (How it works / Journey /
// Providers / Lifecycle), including both panel CTAs.
const PANES = [
  {
    id: 'tasks',
    label: 'How it works',
    eyebrow: 'One clear next step',
    title: 'One next move. One owner. One proof trail.',
    body: 'Passage keeps attention on the work that matters now, then carries the same context through every handoff.',
    cta: null,
    rows: [
      ['1', 'Stabilize', 'Confirm the setting, decision-maker, and one action that cannot wait.'],
      ['2', 'Coordinate', 'Assign the owner, prepare the message or script, and show what is waiting.'],
      ['3', 'Prove', 'Record the reply, upload proof, and carry the same context forward.'],
    ],
  },
  {
    id: 'journey',
    label: 'Journey',
    eyebrow: 'Before, during, after',
    title: 'Families should not have to start over at every door.',
    body: 'Care teams, funeral homes, vendors, attorneys, helpers, and executors may all rotate in. The family record remains continuous.',
    cta: null,
    rows: [
      ['Planning', 'Plan before crisis', 'Wishes, contacts, documents, roles, and preferences are organized early.'],
      ['Care prep', 'Prepare during care', 'Hospice, home care, senior living, or serious illness can become an earlier activation point.'],
      ['Urgent', 'Move through the first hours', 'The experience narrows to one clear action, owner, and proof.'],
      ['After', 'Carry the long tail', 'Estate, notifications, remembrance, vendors, and reporting stay tied together.'],
    ],
  },
  {
    id: 'providers',
    label: 'Providers',
    eyebrow: 'For providers',
    title: 'A clearer way to keep families and staff aligned.',
    body: 'Funeral homes can create or import cases, assign staff and participants, prepare family updates, track proof, and export the record back to existing tools.',
    cta: { href: '/funeral-home/sample-case', label: 'Open sample case' },
    rows: [
      ['Case', 'Create or import', 'Start fresh or bring cases in by CSV without changing the current case system.'],
      ['Work', 'Assign the owner', 'Staff, family coordinators, and participants stay tied to the same next step and record.'],
      ['Proof', 'Close the loop', 'Proof, waiting states, and exports stay attached to the family record.'],
    ],
  },
  {
    id: 'lifecycle',
    label: 'Lifecycle',
    eyebrow: 'Shared history',
    title: 'The same family record moves through every handoff.',
    body: 'Planning, care, hospice, funeral coordination, and family work should not become separate islands. Passage keeps the record together as people and providers change.',
    cta: { href: '/mission', label: 'See the mission' },
    visual: 'lifecycle',
    rows: [],
  },
];

const LIFECYCLE_NODES = [
  ['1', 'Pre-planning', 'Wishes, roles, contacts'],
  ['2', 'Assisted living', 'Care context and people'],
  ['3', 'Hospice', 'First-hour plan'],
  ['4', 'Funeral home', 'Service and proof'],
  ['5', 'Family', 'Aftercare and estate work'],
];

function LifecycleMap() {
  return (
    <div aria-label="Passage continuity map" style={{ display: 'grid', gap: DS.space.sm }}>
      <div className="hc-lifecycle-track" style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 7, alignItems: 'stretch' }}>
        <div aria-hidden="true" className="hc-lifecycle-line" style={{ position: 'absolute', left: '8%', right: '8%', top: 22, height: 2, background: DS.color.sage + '66', zIndex: 0 }} />
        {LIFECYCLE_NODES.map((node) => (
          <div key={node[1]} className="hc-lifecycle-node" style={{ position: 'relative', zIndex: 1, background: DS.color.card, border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.md, padding: '9px 8px 8px', minWidth: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: DS.radius.pill, display: 'flex', alignItems: 'center', justifyContent: 'center', background: DS.color.sageFaint, border: `1px solid ${DS.color.sage}55`, color: DS.color.sageDeep, fontSize: 12, fontWeight: 600, marginBottom: 7 }}>{node[0]}</div>
            <b style={{ display: 'block', ...TYPE.small, fontWeight: 600, color: DS.color.ink, marginBottom: 4 }}>{node[1]}</b>
            <span style={{ display: 'block', ...TYPE.micro, color: DS.color.mid }}>{node[2]}</span>
          </div>
        ))}
      </div>
      <div className="hc-lifecycle-center" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .8fr) minmax(0, 1fr)', gap: 8, alignItems: 'stretch' }}>
        <div style={{ background: DS.color.sageDeep, color: '#fff', borderRadius: DS.radius.lg, padding: 13, minWidth: 0 }}>
          <small style={{ display: 'block', color: '#b9d2bd', ...TYPE.label, marginBottom: 7 }}>Passage record</small>
          <strong style={{ display: 'block', ...TYPE.h2, color: '#fff', marginBottom: 6 }}>One family record</strong>
          <span style={{ display: 'block', ...TYPE.micro, color: '#d8d0c7', lineHeight: 1.45 }}>The next step, owner, waiting point, permissions, and proof move forward together.</span>
        </div>
        <div style={{ background: DS.color.sageFaint, border: `1px solid ${DS.color.sage}44`, borderRadius: DS.radius.lg, padding: 12, minWidth: 0 }}>
          <b style={{ display: 'block', ...TYPE.small, fontWeight: 600, color: DS.color.sageDeep, marginBottom: 6 }}>Provider handoff becomes clearer</b>
          <span style={{ display: 'block', ...TYPE.micro, color: DS.color.mid, lineHeight: 1.45 }}>When the family chooses a funeral home, hospice, care facility, or vendor, the request carries context instead of starting another disconnected thread.</span>
        </div>
      </div>
    </div>
  );
}

export default function HomeCalm() {
  const [activePaneIndex, setActivePaneIndex] = useState(0);
  const activePane = PANES[activePaneIndex] || PANES[0];

  // Auto-rotate the story panes (reduced-motion safe). Effect-only, so SSR is unaffected.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      setActivePaneIndex((current) => (current + 1) % PANES.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  function openPublicCta(label, href) {
    trackEvent('homepage_cta_clicked', { label, href });
    if (typeof window !== 'undefined') window.location.href = href;
  }

  const slogan = PASSAGE_BRAND.slogan || "The operating system for life's hardest logistics.";

  return (
    <div style={{ background: DS.color.page, minHeight: '100vh', fontFamily: SANS, overflowX: 'hidden' }}>
      <style>{`
        .hc-shell { width: min(1180px, 100%); box-sizing: border-box; margin: 0 auto; padding: 16px 24px 28px; }
        .hc-hero { display: grid; grid-template-columns: minmax(0, 1.02fr) minmax(0, .9fr); gap: 30px; align-items: center; }
        .hc-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
        .hc-actions > * { min-width: 0; }
        .hc-proof { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .hc-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin-bottom: 16px; }
        .hc-tab { min-width: 0; border: 1px solid ${DS.color.border}; background: ${DS.color.page}; color: ${DS.color.mid}; border-radius: ${DS.radius.pill}px; min-height: 44px; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; padding: 6px 8px; transition: background ${DS.motion.fast} ${DS.motion.ease}, border-color ${DS.motion.fast} ${DS.motion.ease}; overflow-wrap: anywhere; }
        .hc-tab[aria-selected="true"] { border-color: ${DS.color.sage}66; background: ${DS.color.sageFaint}; color: ${DS.color.sageDeep}; }
        .hc-step { display: grid; grid-template-columns: minmax(80px, max-content) minmax(0, 1fr); gap: 10px; align-items: start; padding: 10px 0; border-bottom: 1px solid ${DS.color.hair}; }
        .hc-step:last-child { border-bottom: none; }
        .hc-num { min-width: 42px; max-width: 100%; min-height: 28px; border-radius: ${DS.radius.pill}px; display: inline-flex; align-items: center; justify-content: center; background: ${DS.color.sageFaint}; color: ${DS.color.sageDeep}; font-size: 12px; font-weight: 600; padding: 6px 10px; line-height: 1.15; text-align: center; overflow-wrap: anywhere; }
        @media (max-width: 760px) {
          .hc-hero { grid-template-columns: 1fr; gap: 22px; }
          .hc-actions { flex-direction: column; }
          .hc-actions > * { width: 100%; }
          .hc-tabs { grid-template-columns: 1fr 1fr; }
          .hc-lifecycle-track { grid-template-columns: 1fr; }
          .hc-lifecycle-line { display: none; }
          .hc-lifecycle-node { display: grid; grid-template-columns: 36px minmax(0, 1fr); column-gap: 9px; align-items: start; }
          .hc-lifecycle-node > div:first-child { grid-row: 1 / span 2; margin-bottom: 0; }
          .hc-lifecycle-center { grid-template-columns: 1fr; }
        }
      `}</style>

      <SiteHeader />

      <main className="hc-shell">
        <section className="hc-hero">
          <div style={{ minWidth: 0 }}>
            <div style={{ ...TYPE.label, color: DS.color.sage, marginBottom: 10 }}>{slogan}</div>
            <h1 style={{ fontSize: 'clamp(30px, 6vw, 44px)', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.08, color: DS.color.ink, margin: '0 0 14px' }}>
              One calm place for the hardest family handoffs.
            </h1>
            <p style={{ ...TYPE.body, fontSize: 16, color: DS.color.mid, lineHeight: 1.5, maxWidth: 640, margin: 0 }}>
              Passage keeps the next step, the owner, the waiting point, and the proof in one shared family record, from preparation through death, funeral coordination, and the long tail after.
            </p>

            <div className="hc-actions">
              <Button variant="primary" onClick={() => openPublicCta('Start urgent path', '/urgent')}>Start urgent path</Button>
              <Button variant="secondary" onClick={() => openPublicCta('Prepare during care', '/hospice')}>Prepare during care</Button>
              <Button variant="ghost" onClick={() => openPublicCta('Plan ahead', '/pricing')} style={{ borderColor: DS.color.border, borderStyle: 'solid', borderWidth: 1 }}>Plan ahead</Button>
            </div>

            <p style={{ ...TYPE.micro, color: DS.color.soft, lineHeight: 1.45, marginTop: 12, maxWidth: 640 }}>
              Nothing sends. Nothing shares. The family approves before Passage reaches outside the record.
            </p>

            <div className="hc-proof" aria-label="See Passage examples">
              <a
                href="/funeral-home/sample-case"
                onClick={() => trackEvent('homepage_sample_case_clicked', { href: '/funeral-home/sample-case' })}
                style={proofLinkStyle}
              >
                Open sample case
              </a>
              <a
                href="/vendors/request?demo=1&demoTour=funeral-home&demoStep=vendor"
                onClick={() => trackEvent('homepage_sample_vendor_clicked', { href: '/vendors/request?demo=1&demoTour=funeral-home&demoStep=vendor' })}
                style={proofLinkStyle}
              >
                See vendor request example
              </a>
            </div>

            <div style={{ display: 'inline-block', color: DS.color.sageDeep, background: DS.color.sageFaint, border: `1px solid ${DS.color.sage}44`, borderRadius: DS.radius.md, padding: '9px 11px', ...TYPE.micro, lineHeight: 1.4, marginTop: 12, maxWidth: 660 }}>
              <strong style={{ fontWeight: 600 }}>The Passage family pledge:</strong> 10% of proceeds support grief and family-care work. Each paid urgent family record also funds a remembrance tree dedication.
            </div>
          </div>

          <Card pad={16} style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }} aria-label="Passage coordination preview">
            <div className="hc-tabs" role="tablist" aria-label="Passage story">
              {PANES.map((pane, index) => (
                <button
                  key={pane.id}
                  type="button"
                  role="tab"
                  aria-selected={activePane.id === pane.id}
                  onClick={() => setActivePaneIndex(index)}
                  className="hc-tab"
                >
                  {pane.label}
                </button>
              ))}
            </div>
            <div style={{ borderBottom: `1px solid ${DS.color.hair}`, paddingBottom: 11, marginBottom: 10 }}>
              <div style={{ ...TYPE.label, color: DS.color.sage, marginBottom: 7 }}>{activePane.eyebrow}</div>
              <h2 style={{ ...TYPE.display, color: DS.color.ink, margin: '0 0 7px' }}>{activePane.title}</h2>
              <p style={{ ...TYPE.small, color: DS.color.mid, margin: 0, maxWidth: 560 }}>{activePane.body}</p>
            </div>

            {activePane.visual === 'lifecycle' ? (
              <LifecycleMap />
            ) : (
              activePane.rows.map((row) => (
                <div className="hc-step" key={row[1]}>
                  <span className="hc-num">{row[0]}</span>
                  <span style={{ minWidth: 0 }}>
                    <b style={{ display: 'block', ...TYPE.small, fontWeight: 600, color: DS.color.ink, marginBottom: 3 }}>{row[1]}</b>
                    <span style={{ display: 'block', ...TYPE.micro, color: DS.color.mid, lineHeight: 1.42 }}>{row[2]}</span>
                  </span>
                </div>
              ))
            )}

            {activePane.cta && (
              <a
                href={activePane.cta.href}
                onClick={() => trackEvent('homepage_panel_cta_clicked', { label: activePane.cta.label, href: activePane.cta.href, pane: activePane.id })}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', marginTop: 14, alignSelf: 'flex-start', minHeight: DS.tap.min, borderRadius: DS.radius.md, padding: '0 16px', background: DS.color.sage, color: '#fff', fontSize: 13, fontWeight: 500 }}
              >
                {activePane.cta.label}
              </a>
            )}
          </Card>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

const proofLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 44,
  borderRadius: DS.radius.pill,
  border: `1px solid ${DS.color.sage}44`,
  background: DS.color.card,
  color: DS.color.sageDeep,
  textDecoration: 'none',
  padding: '0 14px',
  fontSize: 13,
  fontWeight: 500,
};
