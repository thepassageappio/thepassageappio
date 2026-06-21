// Passage — Participant scoped-request review/save sheet (site-migration Slice 4).
// Mirrors components/family/FamilyTaskSheet.js + components/vendor/VendorRequestSheet.js:
// a review-before-send sheet with an accessible radio set whose values map straight
// to POST /api/participantAction actions, a note field gated by taskActionRequiresNote,
// a review-before-send banner, and a scoped details table. Focus moves to the close
// control on open; the container restores focus on close. SSR-safe (no window/document
// at module/render time; the Escape/scroll-lock effect guards window).
import { useEffect, useRef, useState } from 'react';
import { DS, TYPE, SANS } from '../../lib/designSystem';
import { CalmStatusPill, SectionLabel } from '../calm/CalmKit';
import { Banner, Button, Textarea } from '../calm/CalmControls';
import { taskActionPlaceholder, taskActionPrompt, taskActionRequiresNote } from '../../lib/taskActions';

// What saving each scoped response does for the participant, framed plainly.
function effectCopy(action) {
  if (action === 'save_note') return 'This saves a note for the coordinator without changing the request status.';
  if (action === 'accept') return 'This tells the coordinator you are taking responsibility. The request stays open until you save proof or a waiting update.';
  if (action === 'waiting') return 'This keeps the request open and shows exactly what you are waiting on.';
  if (action === 'handled' || action === 'confirmed') return 'This marks your part done, saves your note, and moves it out of your active requests.';
  if (action === 'help' || action === 'needs_details' || action === 'unavailable') return 'This keeps the request visible as needing help so the coordinator can step in.';
  if (action === 'quoted' || action === 'scheduled') return 'This saves your update to the same scoped request without exposing the full family record.';
  return 'This update goes back to the coordinator and stays attached to the scoped request.';
}

function saveLabel(action) {
  if (action === 'save_note') return 'Save update';
  if (action === 'accept') return 'I own this';
  if (action === 'waiting') return 'Mark waiting';
  if (action === 'handled' || action === 'confirmed') return 'Mark done with proof';
  if (action === 'help' || action === 'needs_details' || action === 'unavailable') return 'Ask coordinator for help';
  if (action === 'quoted') return 'Save quote update';
  if (action === 'scheduled') return 'Save scheduled update';
  return 'Send update';
}

export default function ParticipantTaskSheet({
  task,
  saving = false,
  error = '',
  notice = '',
  onClose,
  onSave,
}) {
  const closeRef = useRef(null);
  const [notes, setNotes] = useState('');
  const [action, setAction] = useState('');
  const [proofWarning, setProofWarning] = useState('');

  // Available actions for this scoped request, plus an explicit Save update note
  // option, mirroring the legacy save_note path.
  const options = task
    ? [...(task.actions || []), ['save_note', 'Save update']]
    : [];

  useEffect(() => {
    if (!task) return;
    setNotes(task.savedNote || task.raw?.notes || '');
    setAction(task.recommendedAction?.[0] || task.actions?.[0]?.[0] || 'accept');
    setProofWarning('');
  }, [task]);

  useEffect(() => {
    if (task) closeRef.current?.focus();
  }, [task?.id]);

  // Scroll-lock + Escape to close. Guards window for SSR safety.
  useEffect(() => {
    if (!task || typeof window === 'undefined') return undefined;
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
  }, [task, onClose]);

  if (!task) return null;

  const groupName = `participant-request-action-${task.id || 'selected'}`;
  // Note-gating: required-note actions surface the proof warning before send.
  const noteRequired = taskActionRequiresNote(action === 'save_note' ? 'handled' : action);
  const placeholder = taskActionPlaceholder(action === 'save_note' ? 'handled' : action, task.raw, 'participant')
    || 'Add proof, what is waiting, or what help you need.';
  const prompt = taskActionPrompt(action === 'save_note' ? 'handled' : action, task.raw, 'participant');

  const submit = () => {
    if (taskActionRequiresNote(action) && !String(notes || '').trim()) {
      setProofWarning('Add a short note first so the coordinator knows what changed.');
      return;
    }
    setProofWarning('');
    onSave && onSave(task, action, notes);
  };

  return (
    <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(29,27,23,.56)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '20px 8px 0', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <section role="dialog" aria-modal="true" aria-label={task.title} style={{ width: '100%', maxWidth: 720, maxHeight: '94vh', overflowY: 'auto', overflowX: 'hidden', background: DS.color.cream, borderRadius: '22px 22px 0 0', boxShadow: DS.shadow.sheet, fontFamily: SANS, boxSizing: 'border-box' }}>
        <div style={{ padding: '14px 18px 0' }}>
          <div aria-hidden="true" style={{ width: 34, height: 4, borderRadius: 2, background: DS.color.border, margin: '0 auto 14px' }} />
          <button ref={closeRef} type="button" onClick={onClose} style={{ minHeight: DS.tap.min, border: 'none', background: 'transparent', color: DS.color.sageDeep, font: 'inherit', fontSize: 13.5, fontWeight: 600, padding: 0, cursor: 'pointer' }}>
            Back to your requests
          </button>
        </div>

        <div style={{ padding: '8px 20px 24px' }}>
          <CalmStatusPill view={task.statusView} />
          <h2 style={{ ...TYPE.display, color: DS.color.ink, margin: '12px 0 8px' }}>{task.title}</h2>
          {task.description && <p style={{ ...TYPE.body, color: DS.color.mid, margin: 0 }}>{task.description}</p>}
          <p style={{ ...TYPE.small, color: DS.color.mid, margin: '8px 0 0' }}>{task.why}</p>

          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            <Banner tone="success">Review your response before you save. This stays attached to this scoped request. It does not expose the full family record.</Banner>
          </div>

          <SectionLabel>Your response</SectionLabel>
          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>Choose your response</legend>
            <div style={{ display: 'grid', gap: 8 }}>
              {options.map(([value, label]) => {
                const selected = action === value;
                const danger = value === 'unavailable';
                return (
                  <label key={value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', minHeight: DS.tap.min, textAlign: 'left', borderRadius: DS.radius.md, border: `1px solid ${selected ? (danger ? DS.color.rose : DS.color.sage) : DS.color.border}`, background: selected ? (danger ? DS.color.roseFaint : DS.color.sageFaint) : DS.color.card, color: DS.color.ink, fontFamily: SANS, fontSize: 14, fontWeight: 500, padding: '11px 12px', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <input type="radio" name={groupName} value={value} checked={selected} onChange={() => { setAction(value); setProofWarning(''); }} style={{ width: 18, height: 18, flex: '0 0 auto', margin: '2px 0 0', accentColor: danger ? DS.color.rose : DS.color.sage }} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block' }}>{label}</span>
                      <span style={{ display: 'block', ...TYPE.micro, color: DS.color.mid, fontWeight: 400, marginTop: 2 }}>{effectCopy(value)}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <SectionLabel>{noteRequired ? 'Add a note (required)' : 'Add a note'}</SectionLabel>
          {prompt && <p style={{ ...TYPE.small, color: DS.color.mid, margin: '0 0 8px' }}>{prompt}</p>}
          <Textarea value={notes} onChange={(event) => { setNotes(event.target.value); setProofWarning(''); }} rows={5} placeholder={placeholder} style={proofWarning ? { borderColor: DS.color.rose } : undefined} />
          {proofWarning && <div style={{ marginTop: 8 }}><Banner tone="danger">{proofWarning}</Banner></div>}

          <SectionLabel>Scoped details</SectionLabel>
          <div style={{ background: DS.color.card, border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.lg, padding: '3px 14px' }}>
            {(task.details || []).map(([label, value], index) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, borderTop: index === 0 ? 'none' : `1px solid ${DS.color.hair}`, padding: '12px 0', ...TYPE.small }}>
                <span style={{ color: DS.color.mid }}>{label}</span>
                <span style={{ textAlign: 'right', color: DS.color.ink, fontWeight: 500, overflowWrap: 'anywhere' }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <Banner tone="info">After you save: {effectCopy(action)}</Banner>
          </div>

          {error && <div style={{ marginTop: 14 }}><Banner tone="danger">{error}</Banner></div>}
          {notice && !error && <div style={{ marginTop: 14 }}><Banner tone="success">{notice}</Banner></div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 18 }}>
            <Button full variant={action === 'unavailable' ? 'danger' : 'primary'} disabled={saving} onClick={submit}>
              {saving ? 'Saving...' : saveLabel(action)}
            </Button>
            <Button full variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
