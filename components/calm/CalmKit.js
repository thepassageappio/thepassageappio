// Passage Calm Guided OS — reusable presentational kit (E2).
// Built on lib/designSystem.js. Pure/presentational so public site + app
// surfaces can migrate onto the same components. No data fetching here.
import { DS, present, byCalmPriority } from '../../lib/designSystem';

const sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function CalmStatusPill({ view }) {
  if (!view) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
      padding: '3px 10px', borderRadius: DS.radius.pill, background: view.bg, color: view.fg }}>
      <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: view.dot }} />
      {view.label}
    </span>
  );
}

export function ProgressLine({ done = 0, total = 0 }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div style={{ height: 6, background: '#ece7dc', borderRadius: DS.radius.pill, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: DS.color.sage, borderRadius: DS.radius.pill }} />
      </div>
      <p style={{ fontSize: 13, color: DS.color.mid, margin: '8px 0 0' }}>
        You&rsquo;ve handled {done} of {total} things. There&rsquo;s no rush &mdash; we&rsquo;ll pace this.
      </p>
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: DS.color.soft, margin: '20px 0 6px' }}>
      {children}
    </p>
  );
}

export function HeroTask({ task, onOpen }) {
  const view = present(task.statusKey, { who: task.who });
  return (
    <button type="button" onClick={() => onOpen(task)} style={{ display: 'block', width: '100%', textAlign: 'left',
      cursor: 'pointer', background: DS.color.card, border: `2px solid ${DS.color.sage}66`, borderRadius: DS.radius.lg,
      padding: '15px 16px', boxShadow: DS.shadow.card, font: 'inherit' }}>
      <CalmStatusPill view={view} />
      <h3 style={{ fontSize: 17, fontWeight: 600, color: DS.color.ink, margin: '10px 0 4px' }}>{task.title}</h3>
      <p style={{ fontSize: 14, color: DS.color.mid, margin: 0, lineHeight: 1.5 }}>{task.why}</p>
      <span style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 13, background: DS.color.sage,
        color: '#fff', borderRadius: DS.radius.md, padding: '11px', fontSize: 14, fontWeight: 600,
        minHeight: DS.tap.min, boxSizing: 'border-box' }}>{task.action || 'Review & confirm'}</span>
    </button>
  );
}

export function TaskRow({ task, onOpen, muted = false }) {
  const view = present(task.statusKey, { who: task.who });
  return (
    <button type="button" onClick={() => onOpen && onOpen(task)} style={{ display: 'flex', width: '100%', alignItems: 'center',
      gap: 11, padding: '11px 4px', cursor: onOpen ? 'pointer' : 'default', background: 'none', border: 'none',
      borderTop: `1px solid ${DS.color.border}`, font: 'inherit', textAlign: 'left', opacity: muted ? 0.72 : 1, minHeight: DS.tap.min }}>
      <span aria-hidden="true" style={{ width: 34, height: 34, flex: '0 0 34px', borderRadius: '50%',
        background: view.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: view.dot }} />
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 14, color: DS.color.ink }}>{task.title}</span>
        <span style={{ display: 'block', fontSize: 12, color: DS.color.mid }}>{view.label}{task.eta ? ` · ${task.eta}` : ''}</span>
      </span>
      {onOpen && <span aria-hidden="true" style={{ color: DS.color.soft }}>&rsaquo;</span>}
    </button>
  );
}

export function TaskSheet({ task, onClose }) {
  if (!task) return null;
  const view = present(task.statusKey, { who: task.who });
  return (
    <div role="dialog" aria-modal="true" aria-label={task.title} style={{ position: 'absolute', inset: 0,
      background: DS.color.cream, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px 6px' }}>
        <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', color: DS.color.sageDeep,
          font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, minHeight: DS.tap.min }}>
          &lsaquo; Back to today
        </button>
      </div>
      <div style={{ padding: '4px 20px 20px', overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
        <CalmStatusPill view={view} />
        <h2 style={{ fontSize: 20, fontWeight: 600, color: DS.color.ink, margin: '11px 0 6px' }}>{task.title}</h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: DS.color.mid, margin: '0 0 4px' }}>{task.why}</p>
        <button type="button" style={{ display: 'block', width: '100%', marginTop: 16, background: DS.color.sage,
          color: '#fff', border: 'none', borderRadius: DS.radius.md, padding: 12, fontSize: 15, fontWeight: 600,
          cursor: 'pointer', minHeight: DS.tap.min }}>{task.action || 'Confirm'}</button>
        <SectionLabel>Details</SectionLabel>
        {(task.details || []).map((d, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0',
            borderTop: `1px solid ${DS.color.border}`, fontSize: 13 }}>
            <span style={{ color: DS.color.mid }}>{d[0]}</span>
            <span style={{ textAlign: 'right', color: DS.color.ink }}>{d[1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const NAV = [['Today', '☀'], ['Plan', '◈'], ['People', '○'], ['Help', '⊕']];

export function AppShell({ children, brand = 'passage', active = 'Today' }) {
  return (
    <div style={{ width: 360, maxWidth: '100%', margin: '0 auto', background: DS.color.cream,
      border: `1px solid ${DS.color.border}`, borderRadius: 26, overflow: 'hidden', position: 'relative',
      fontFamily: sans, color: DS.color.ink, minHeight: 640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px 2px',
        fontSize: 12, color: DS.color.mid }}>
        <span>9:41</span>
        <span style={{ fontWeight: 600, color: DS.color.sageDeep, letterSpacing: '.02em' }}>{brand}</span>
        <span aria-hidden="true">&#9211;</span>
      </div>
      <div style={{ paddingBottom: 66 }}>{children}</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', background: DS.color.card,
        borderTop: `1px solid ${DS.color.border}` }}>
        {NAV.map(([label, glyph]) => (
          <span key={label} style={{ flex: 1, textAlign: 'center', padding: '9px 0 11px', fontSize: 10,
            color: label === active ? DS.color.sage : DS.color.soft }}>
            <span aria-hidden="true" style={{ display: 'block', fontSize: 17, lineHeight: 1.2 }}>{glyph}</span>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export { byCalmPriority };
