// Passage Calm Guided OS — reusable presentational kit (E2, polished Cycle 4).
// Built on lib/designSystem.js. Pure/presentational so public site + app
// surfaces can migrate onto the same components. No data fetching here.
import { DS, TYPE, SANS, present, byCalmPriority } from '../../lib/designSystem';

const tx = `background ${DS.motion.fast} ${DS.motion.ease}, transform ${DS.motion.fast} ${DS.motion.ease}, border-color ${DS.motion.fast} ${DS.motion.ease}`;

export function CalmStatusPill({ view }) {
  if (!view) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 500,
      letterSpacing: '.005em', padding: '3px 10px 3px 8px', borderRadius: DS.radius.pill, background: view.bg, color: view.fg }}>
      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: view.dot }} />
      {view.label}
    </span>
  );
}

export function ProgressLine({ done = 0, total = 0 }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div style={{ height: 5, background: '#ece6db', borderRadius: DS.radius.pill, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: DS.color.sage, borderRadius: DS.radius.pill,
          transition: `width ${DS.motion.base} ${DS.motion.ease}` }} />
      </div>
      <p style={{ ...TYPE.small, color: DS.color.mid, margin: '9px 0 0' }}>
        You&rsquo;ve handled {done} of {total} things. There&rsquo;s no rush &mdash; we&rsquo;ll pace this.
      </p>
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <p style={{ ...TYPE.label, color: DS.color.soft, margin: '20px 0 8px' }}>{children}</p>
  );
}

export function HeroTask({ task, onOpen }) {
  const view = present(task.statusKey, { who: task.who });
  return (
    <button type="button" onClick={() => onOpen(task)} style={{ display: 'block', width: '100%', textAlign: 'left',
      cursor: 'pointer', background: DS.color.card, border: `1px solid ${DS.color.sage}44`, borderRadius: DS.radius.lg,
      padding: '16px 16px 14px', boxShadow: DS.shadow.card, font: 'inherit', transition: tx }}>
      <CalmStatusPill view={view} />
      <h3 style={{ ...TYPE.h2, fontSize: 16.5, color: DS.color.ink, margin: '11px 0 5px' }}>{task.title}</h3>
      <p style={{ ...TYPE.small, color: DS.color.mid, margin: 0 }}>{task.why}</p>
      <span style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 14, background: DS.color.sage,
        color: '#fff', borderRadius: DS.radius.md, padding: '11px', fontSize: 14, fontWeight: 500,
        minHeight: DS.tap.min, boxSizing: 'border-box', transition: tx }}>{task.action || 'Review & confirm'}</span>
    </button>
  );
}

export function TaskRow({ task, onOpen, muted = false }) {
  const view = present(task.statusKey, { who: task.who });
  return (
    <button type="button" onClick={() => onOpen && onOpen(task)} style={{ display: 'flex', width: '100%', alignItems: 'center',
      gap: 12, padding: '12px 6px', cursor: onOpen ? 'pointer' : 'default', background: 'none', border: 'none',
      borderTop: `1px solid ${DS.color.hair}`, font: 'inherit', textAlign: 'left', opacity: muted ? 0.66 : 1,
      minHeight: DS.tap.min, transition: tx }}>
      <span aria-hidden="true" style={{ width: 32, height: 32, flex: '0 0 32px', borderRadius: '50%',
        background: view.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: view.dot }} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', ...TYPE.body, color: DS.color.ink }}>{task.title}</span>
        <span style={{ display: 'block', ...TYPE.micro, color: DS.color.mid }}>{view.label}{task.eta ? ` · ${task.eta}` : ''}</span>
      </span>
      {onOpen && <span aria-hidden="true" style={{ color: DS.color.soft, fontSize: 18 }}>&rsaquo;</span>}
    </button>
  );
}

export function TaskSheet({ task, onClose }) {
  if (!task) return null;
  const view = present(task.statusKey, { who: task.who });
  return (
    <div role="dialog" aria-modal="true" aria-label={task.title} style={{ position: 'absolute', inset: 0,
      background: DS.color.cream, display: 'flex', flexDirection: 'column', fontFamily: SANS }}>
      <div style={{ padding: '14px 16px 4px' }}>
        <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', color: DS.color.sageDeep,
          font: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', padding: 0, minHeight: DS.tap.min }}>
          &lsaquo; Back to today
        </button>
      </div>
      <div style={{ padding: '4px 20px 20px', overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
        <CalmStatusPill view={view} />
        <h2 style={{ ...TYPE.display, color: DS.color.ink, margin: '12px 0 6px' }}>{task.title}</h2>
        <p style={{ ...TYPE.body, color: DS.color.mid, margin: '0 0 4px' }}>{task.why}</p>
        <button type="button" style={{ display: 'block', width: '100%', marginTop: 16, background: DS.color.sage,
          color: '#fff', border: 'none', borderRadius: DS.radius.md, padding: 12, fontSize: 15, fontWeight: 500,
          cursor: 'pointer', minHeight: DS.tap.min, transition: tx }}>{task.action || 'Confirm'}</button>
        <SectionLabel>Details</SectionLabel>
        {(task.details || []).map((d, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '11px 0',
            borderTop: `1px solid ${DS.color.hair}`, ...TYPE.small }}>
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
      border: `1px solid ${DS.color.hair}`, borderRadius: 26, overflow: 'hidden', position: 'relative',
      fontFamily: SANS, color: DS.color.ink, minHeight: 640, boxShadow: DS.shadow.card }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px 2px',
        ...TYPE.micro, color: DS.color.mid }}>
        <span>9:41</span>
        <span style={{ fontWeight: 500, color: DS.color.sageDeep, letterSpacing: '.01em' }}>{brand}</span>
        <span aria-hidden="true">&#9211;</span>
      </div>
      <div style={{ paddingBottom: 66 }}>{children}</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', background: DS.color.card,
        borderTop: `1px solid ${DS.color.hair}` }}>
        {NAV.map(([label, glyph]) => (
          <span key={label} style={{ flex: 1, textAlign: 'center', padding: '9px 0 11px', fontSize: 10,
            color: label === active ? DS.color.sage : DS.color.soft }}>
            <span aria-hidden="true" style={{ display: 'block', fontSize: 16, lineHeight: 1.3 }}>{glyph}</span>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export { byCalmPriority };
