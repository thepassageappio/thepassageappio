import styles from './ContinuityRail.module.css';

export type ContinuityStep = {
  label: string;
  detail: string;
  state?: 'complete' | 'current' | 'pending' | 'blocked';
};

type ContinuityRailProps = {
  compact?: boolean;
  label?: string;
  steps: ContinuityStep[];
};

export function ContinuityRail({ compact = false, label = 'Continuity', steps }: ContinuityRailProps) {
  return (
    <section className={`${styles.rail} ${compact ? styles.compact : ''}`} aria-label={label}>
      <div className={styles.label}><span>LIVE RECORD</span><strong>{label}</strong></div>
      <ol>
        {steps.map((step, index) => (
          <li className={styles[step.state || 'pending']} key={`${step.label}-${index}`}>
            <span className={styles.node} aria-hidden="true">{index + 1}</span>
            <div><strong>{step.label}</strong><small>{step.detail}</small></div>
          </li>
        ))}
      </ol>
    </section>
  );
}
