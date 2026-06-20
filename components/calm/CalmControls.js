// Passage Calm Guided OS — shared controls (Cycle 5 library).
// Buttons, form fields, cards, banners on lib/designSystem tokens. Every migrated
// surface uses these so the whole product is consistent. Presentational + prop-forwarding.
import { DS, TYPE, SANS } from '../../lib/designSystem';

const tx = `background ${DS.motion.fast} ${DS.motion.ease}, border-color ${DS.motion.fast} ${DS.motion.ease}, opacity ${DS.motion.fast} ${DS.motion.ease}`;

export function Button({ variant = 'primary', full = false, disabled = false, children, style = {}, ...rest }) {
  const base = {
    display: full ? 'block' : 'inline-flex', width: full ? '100%' : 'auto', alignItems: 'center', justifyContent: 'center',
    gap: 8, fontFamily: SANS, fontSize: 14, fontWeight: 500, borderRadius: DS.radius.md, padding: '11px 16px',
    minHeight: DS.tap.min, cursor: disabled ? 'default' : 'pointer', transition: tx, boxSizing: 'border-box',
    border: '1px solid transparent', opacity: disabled ? 0.55 : 1,
  };
  const variants = {
    primary: { background: DS.color.sage, color: '#fff' },
    secondary: { background: DS.color.card, color: DS.color.sageDeep, borderColor: DS.color.border },
    ghost: { background: 'transparent', color: DS.color.mid },
    danger: { background: DS.color.roseFaint, color: '#8a3a3a', borderColor: '#e6c9c9' },
  };
  return (
    <button type="button" disabled={disabled} style={{ ...base, ...(variants[variant] || variants.primary), ...style }} {...rest}>
      {children}
    </button>
  );
}

export function Field({ label, hint, htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', marginBottom: 14 }}>
      {label && <span style={{ display: 'block', ...TYPE.small, fontWeight: 500, color: DS.color.ink, marginBottom: 6 }}>{label}</span>}
      {children}
      {hint && <span style={{ display: 'block', ...TYPE.micro, color: DS.color.soft, marginTop: 5 }}>{hint}</span>}
    </label>
  );
}

const fieldBase = {
  width: '100%', boxSizing: 'border-box', fontFamily: SANS, fontSize: 14, color: DS.color.ink,
  background: DS.color.card, border: `1px solid ${DS.color.border}`, borderRadius: DS.radius.md,
  padding: '10px 12px', minHeight: DS.tap.min, transition: tx, outline: 'none',
};

export function Input({ style = {}, ...rest }) {
  return <input style={{ ...fieldBase, ...style }} {...rest} />;
}

export function Textarea({ style = {}, rows = 4, ...rest }) {
  return <textarea rows={rows} style={{ ...fieldBase, minHeight: 90, resize: 'vertical', lineHeight: 1.5, ...style }} {...rest} />;
}

export function Select({ children, style = {}, ...rest }) {
  return <select style={{ ...fieldBase, appearance: 'none' }} {...rest}>{children}</select>;
}

export function Card({ children, pad = 16, style = {}, ...rest }) {
  return (
    <div style={{ background: DS.color.card, border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.lg,
      padding: pad, boxShadow: DS.shadow.card, ...style }} {...rest}>
      {children}
    </div>
  );
}

const BANNER_TONE = {
  info: { bg: '#eef3fb', fg: '#2c4a78', bar: '#7aa0d8' },
  success: { bg: DS.color.sageFaint, fg: DS.color.sageDeep, bar: DS.color.sage },
  warn: { bg: DS.color.amberFaint, fg: '#7a4f10', bar: DS.color.amber },
  danger: { bg: DS.color.roseFaint, fg: '#8a3a3a', bar: DS.color.rose },
};

export function Banner({ tone = 'info', children }) {
  const t = BANNER_TONE[tone] || BANNER_TONE.info;
  return (
    <div role="status" style={{ display: 'flex', gap: 10, background: t.bg, color: t.fg, borderRadius: DS.radius.md,
      padding: '11px 13px', ...TYPE.small }}>
      <span aria-hidden="true" style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: t.bar, flex: '0 0 3px' }} />
      <span>{children}</span>
    </div>
  );
}
