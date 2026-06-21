// Passage — Vendor scoped-request review/save sheet (site-migration Slice 3).
// Mirrors components/family/FamilyTaskSheet.js: a review-before-send sheet with an
// accessible radio set for the recommended response, quote/schedule/proof inputs, a
// review banner, and a scoped details table. Focus moves to the close control on
// open; the container restores focus on close. SSR-safe (no window/document at
// module/render time; the Escape/scroll-lock effect guards window).
import { useEffect, useRef, useState } from 'react';
import { DS, TYPE, SANS } from '../../lib/designSystem';
import { CalmStatusPill, SectionLabel } from '../calm/CalmKit';
import { Banner, Button, Input, Textarea } from '../calm/CalmControls';

// Vendor response options as a real radio set. Each value maps to a server action
// (accepted | in_progress | completed | declined). Visibility per option keeps the
// vendor scoped to the request lifecycle.
const ACTION_OPTIONS = [
  ['accepted', 'Send quote for review', 'The family or funeral home approves it before work begins.'],
  ['in_progress', 'Mark scheduled', 'Save the scheduled date, time, location, or note after payment.'],
  ['completed', 'Save completion proof', 'Record what was delivered. Proof stays on this scoped request.'],
  ['declined', 'Decline this request', 'Passage shows the case that another option is needed.'],
];

function actionTitle(action) {
  if (action === 'accepted') return 'Send quote for review';
  if (action === 'in_progress') return 'Mark scheduled after approval/payment';
  if (action === 'completed') return 'Save completion proof';
  if (action === 'declined') return 'Decline this request';
  return 'Respond to this request';
}

export default function VendorRequestSheet({
  open = false,
  model,
  initialAction = '',
  values,
  saving = false,
  error = '',
  notice = '',
  demoMode = false,
  onChange,
  onClose,
  onSave,
}) {
  const closeRef = useRef(null);
  const [action, setAction] = useState(initialAction || 'accepted');

  useEffect(() => {
    if (open) setAction(initialAction || 'accepted');
  }, [open, initialAction, model?.id]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open, model?.id]);

  // Scroll-lock + Escape to close. Guards window for SSR safety.
  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose && onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !model) return null;

  const v = values || {};
  const set = (field) => (event) => onChange && onChange(field, event.target.value);
  const groupName = `vendor-request-action-${model.id || 'selected'}`;

  const headerRows = [
    ['Request', model.title],
    ['Owner', model.owner],
    ['Waiting on', model.waiting],
    ['Where this is saved', 'This scoped request status trail'],
  ];

  return (
    <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(29,27,23,.56)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '20px 8px 0', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <section role="dialog" aria-modal="true" aria-label={actionTitle(action)} style={{ width: '100%', maxWidth: 720, maxHeight: '94vh', overflowY: 'auto', overflowX: 'hidden', background: DS.color.cream, borderRadius: '22px 22px 0 0', boxShadow: DS.shadow.sheet, fontFamily: SANS, boxSizing: 'border-box' }}>
        <div style={{ padding: '14px 18px 0' }}>
          <div aria-hidden="true" style={{ width: 34, height: 4, borderRadius: 2, background: DS.color.border, margin: '0 auto 14px' }} />
          <button ref={closeRef} type="button" onClick={onClose} style={{ minHeight: DS.tap.min, border: 'none', background: 'transparent', color: DS.color.sageDeep, font: 'inherit', fontSize: 13.5, fontWeight: 600, padding: 0, cursor: 'pointer' }}>
            Back to request
          </button>
        </div>

        <div style={{ padding: '8px 20px 24px' }}>
          <CalmStatusPill view={model.statusView} />
          <h2 style={{ ...TYPE.display, color: DS.color.ink, margin: '12px 0 8px' }}>{actionTitle(action)}</h2>
          <p style={{ ...TYPE.body, color: DS.color.mid, margin: 0 }}>
            This response stays connected to this scoped request. It does not expose the family record, and it does not send a live family message from this screen.
          </p>

          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            <Banner tone="success">Review the quote, schedule, or proof before saving. Nothing exposes the family record.</Banner>
            {demoMode && <Banner tone="warn">Sample mode. No live messages, payments, or production request records are changed.</Banner>}
          </div>

          <SectionLabel>Your response</SectionLabel>
          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>Choose your response</legend>
            <div style={{ display: 'grid', gap: 8 }}>
              {ACTION_OPTIONS.map(([value, label, hint]) => {
                const selected = action === value;
                return (
                  <label key={value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', minHeight: DS.tap.min, textAlign: 'left', borderRadius: DS.radius.md, border: `1px solid ${selected ? (value === 'declined' ? DS.color.rose : DS.color.sage) : DS.color.border}`, background: selected ? (value === 'declined' ? DS.color.roseFaint : DS.color.sageFaint) : DS.color.card, color: DS.color.ink, fontFamily: SANS, fontSize: 14, fontWeight: 500, padding: '11px 12px', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <input type="radio" name={groupName} value={value} checked={selected} onChange={() => setAction(value)} style={{ width: 18, height: 18, flex: '0 0 auto', margin: '2px 0 0', accentColor: value === 'declined' ? DS.color.rose : DS.color.sage }} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block' }}>{label}</span>
                      <span style={{ display: 'block', ...TYPE.micro, color: DS.color.mid, fontWeight: 400, marginTop: 2 }}>{hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <SectionLabel>Quote</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={{ ...TYPE.small, fontWeight: 500, color: DS.color.ink }}>Estimated quote</span>
              <Input value={v.estimatedValue || ''} onChange={set('estimatedValue')} placeholder="250" inputMode="decimal" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={{ ...TYPE.small, fontWeight: 500, color: DS.color.ink }}>Final value</span>
              <Input value={v.finalValue || ''} onChange={set('finalValue')} placeholder="250" inputMode="decimal" />
            </label>
          </div>

          <SectionLabel>Schedule</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={{ ...TYPE.small, fontWeight: 500, color: DS.color.ink }}>Service date</span>
              <Input type="date" value={v.serviceDate || ''} onChange={set('serviceDate')} />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={{ ...TYPE.small, fontWeight: 500, color: DS.color.ink }}>Service time</span>
              <Input type="datetime-local" value={v.serviceStartAt || ''} onChange={set('serviceStartAt')} />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={{ ...TYPE.small, fontWeight: 500, color: DS.color.ink }}>Location</span>
              <Input value={v.serviceLocation || ''} onChange={set('serviceLocation')} placeholder="Venue, cemetery, home..." />
            </label>
          </div>

          <SectionLabel>Notes &amp; proof</SectionLabel>
          <label style={{ display: 'grid', gap: 5, marginBottom: 10 }}>
            <span style={{ ...TYPE.small, fontWeight: 500, color: DS.color.ink }}>Quote note / availability</span>
            <Textarea value={v.vendorNote || ''} onChange={set('vendorNote')} rows={3} placeholder="Available Friday afternoon. Quote includes setup, service coverage, and delivery of recording." />
          </label>
          <label style={{ display: 'grid', gap: 5 }}>
            <span style={{ ...TYPE.small, fontWeight: 500, color: DS.color.ink }}>Work details and proof note</span>
            <Textarea value={v.serviceNotes || ''} onChange={set('serviceNotes')} rows={3} placeholder="Arrival instructions, delivery details, proof expected, or what the family should know." />
          </label>

          <div style={{ marginTop: 12 }}>
            <Banner tone="info">Payment setup stays private. You see only the quote, scheduling, and completion details needed to respond.</Banner>
          </div>

          <SectionLabel>Scoped details</SectionLabel>
          <div style={{ background: DS.color.card, border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.lg, padding: '3px 14px' }}>
            {headerRows.map(([label, value], index) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, borderTop: index === 0 ? 'none' : `1px solid ${DS.color.hair}`, padding: '12px 0', ...TYPE.small }}>
                <span style={{ color: DS.color.mid }}>{label}</span>
                <span style={{ textAlign: 'right', color: DS.color.ink, fontWeight: 500, overflowWrap: 'anywhere' }}>{value}</span>
              </div>
            ))}
          </div>

          {error && <div style={{ marginTop: 14 }}><Banner tone="danger">{error}</Banner></div>}
          {notice && !error && <div style={{ marginTop: 14 }}><Banner tone="success">{notice}</Banner></div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 18 }}>
            <Button full variant={action === 'declined' ? 'danger' : 'primary'} disabled={saving} onClick={() => onSave && onSave(action)}>
              {saving ? 'Saving...' : 'Save response'}
            </Button>
            <Button full variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
