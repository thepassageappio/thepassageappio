import { useEffect, useRef, useState } from 'react';
import { DS, TYPE, SANS } from '../../lib/designSystem';
import { CalmStatusPill, SectionLabel } from '../calm/CalmKit';
import { Banner, Button, Textarea } from '../calm/CalmControls';

const STATUS_OPTIONS = [
  ['handled', 'Saved proof - this is done'],
  ['waiting', 'Waiting on someone else'],
  ['blocked', 'Needs help or a missing detail'],
];

export default function FamilyTaskSheet({ task, saving = false, error = '', notice = '', onClose, onSave }) {
  const closeRef = useRef(null);
  const [notes, setNotes] = useState('');
  const [nextStatus, setNextStatus] = useState('handled');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNotes(task?.raw?.notes || '');
    setNextStatus(task?.statusKey === 'waiting' ? 'waiting' : task?.statusKey === 'blocked' ? 'blocked' : 'handled');
  }, [task]);

  useEffect(() => {
    closeRef.current?.focus();
  }, [task?.id]);

  if (!task) return null;

  const prepared = task.details?.find(([label]) => label === 'Passage prepared')?.[1] || task.why;
  const proof = task.details?.find(([label]) => label === 'Where this is saved')?.[1] || 'Saved to your family record.';
  const statusGroupName = `family-task-status-${task.id || 'selected'}`;

  const copyPrepared = async () => {
    try {
      await navigator.clipboard.writeText(prepared);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (_) {
      setCopied(false);
    }
  };

  const save = () => {
    onSave && onSave(task, {
      status: nextStatus,
      notes,
      detail: nextStatus === 'handled'
        ? 'Family update saved and marked done.'
        : nextStatus === 'blocked'
          ? 'Saved as needing help.'
          : 'Saved as waiting on someone else.',
    });
  };

  return (
    <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(29,27,23,.56)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '20px 8px 0', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <section role="dialog" aria-modal="true" aria-label={task.title} style={{ width: '100%', maxWidth: 720, maxHeight: '94vh', overflowY: 'auto', overflowX: 'hidden', background: DS.color.cream, borderRadius: '22px 22px 0 0', boxShadow: DS.shadow.sheet, fontFamily: SANS, boxSizing: 'border-box' }}>
        <div style={{ padding: '14px 18px 0' }}>
          <div aria-hidden="true" style={{ width: 34, height: 4, borderRadius: 2, background: DS.color.border, margin: '0 auto 14px' }} />
          <button ref={closeRef} type="button" onClick={onClose} style={{ minHeight: DS.tap.min, border: 'none', background: 'transparent', color: DS.color.sageDeep, font: 'inherit', fontSize: 13.5, fontWeight: 600, padding: 0, cursor: 'pointer' }}>
            Back to today
          </button>
        </div>

        <div style={{ padding: '8px 20px 24px' }}>
          <CalmStatusPill view={task.statusView} />
          <h2 style={{ ...TYPE.display, color: DS.color.ink, margin: '12px 0 8px' }}>{task.title}</h2>
          <p style={{ ...TYPE.body, color: DS.color.mid, margin: 0 }}>{task.why}</p>

          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            <div style={{ background: DS.color.card, border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.lg, padding: 15 }}>
              <p style={{ ...TYPE.label, color: DS.color.soft, margin: '0 0 7px' }}>Passage prepared</p>
              <p style={{ ...TYPE.body, color: DS.color.ink, margin: 0 }}>{prepared}</p>
              <Button variant="secondary" onClick={copyPrepared} style={{ marginTop: 12 }}>
                {copied ? 'Copied' : 'Copy text'}
              </Button>
            </div>

            <Banner tone="success">Nothing sends without your review. Save what happened here so the family record stays clear.</Banner>
          </div>

          <SectionLabel>What happens next</SectionLabel>
          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>What happens next</legend>
            <div style={{ display: 'grid', gap: 8 }}>
              {STATUS_OPTIONS.map(([value, label]) => {
                const selected = nextStatus === value;
                return (
                  <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: DS.tap.min, textAlign: 'left', borderRadius: DS.radius.md, border: `1px solid ${selected ? DS.color.sage : DS.color.border}`, background: selected ? DS.color.sageFaint : DS.color.card, color: DS.color.ink, fontFamily: SANS, fontSize: 14, fontWeight: 500, padding: '10px 12px', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <input type="radio" name={statusGroupName} value={value} checked={selected} onChange={() => setNextStatus(value)} style={{ width: 18, height: 18, flex: '0 0 auto', margin: 0, accentColor: DS.color.sage }} />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <SectionLabel>Private note</SectionLabel>
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} placeholder="Add the confirmation number, who replied, or what is still missing." />

          <SectionLabel>Details</SectionLabel>
          <div style={{ background: DS.color.card, border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.lg, padding: '3px 14px' }}>
            {(task.details || []).filter(([label]) => label !== 'Passage prepared').map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, borderTop: label === task.details?.[0]?.[0] ? 'none' : `1px solid ${DS.color.hair}`, padding: '12px 0', ...TYPE.small }}>
                <span style={{ color: DS.color.mid }}>{label}</span>
                <span style={{ textAlign: 'right', color: DS.color.ink, fontWeight: 500, overflowWrap: 'anywhere' }}>{label === 'Where this is saved' ? proof : value}</span>
              </div>
            ))}
          </div>

          {error && <div style={{ marginTop: 14 }}><Banner tone="danger">{error}</Banner></div>}
          {notice && !error && <div style={{ marginTop: 14 }}><Banner tone="success">{notice}</Banner></div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 18 }}>
            <Button full disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save to family record'}</Button>
            <Button full variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
