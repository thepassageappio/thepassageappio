import styles from './FamilyJourney.module.css';
import type { ExpiryOption, Recipient, ScopeItem } from './types';

type BoundarySignalProps = {
  recipient?: Recipient;
  included: ScopeItem[];
  excluded: ScopeItem[];
  expiry?: ExpiryOption;
  active?: boolean;
};

export default function BoundarySignal({ recipient, included, excluded, expiry, active = false }: BoundarySignalProps) {
  return (
    <aside className={active ? styles.signalActive : styles.signal} aria-label={active ? 'Active handoff boundary' : 'Handoff boundary preview'}>
      <div className={styles.signalLight} aria-hidden="true" />
      <div className={styles.signalHeader}>
        <span>FAMILY CONTROL</span>
        <strong>{active ? 'LIVE' : 'BUILDING'}</strong>
      </div>

      <div className={styles.signalRoute} aria-hidden="true">
        <span className={styles.signalOrigin}>FAMILY</span>
        <span className={styles.signalTrack}><i /></span>
        <span className={styles.signalEnd}>{recipient ? 'RECEIVER' : 'OPEN'}</span>
      </div>

      <div className={styles.signalDestination}>
        <span>RECEIVING ORGANIZATION</span>
        <strong>{recipient?.organization ?? 'Not selected'}</strong>
        <small>{recipient ? `${recipient.person} / ${recipient.role}` : 'Choose one organization to continue'}</small>
      </div>

      <div className={styles.signalCounts}>
        <div>
          <span>CAN OPEN</span>
          <strong>{String(included.length).padStart(2, '0')}</strong>
        </div>
        <div>
          <span>STAYS PRIVATE</span>
          <strong>{String(excluded.length).padStart(2, '0')}</strong>
        </div>
        <div>
          <span>ENDS</span>
          <strong>{expiry?.label ?? '--'}</strong>
        </div>
      </div>

      <div className={styles.signalContents}>
        <span>VISIBLE THROUGH THIS HANDOFF</span>
        {included.length > 0 ? (
          <ul>{included.map((item) => <li key={item.id}>{item.label}</li>)}</ul>
        ) : (
          <p>Nothing is visible yet.</p>
        )}
      </div>

      <p className={styles.signalNote}>{active ? 'You can close this handoff at any time.' : 'No access is created until you activate.'}</p>
    </aside>
  );
}
