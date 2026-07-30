import type { ContinuityStep } from '@/lib/demo';

type ContinuityRailProps = {
  steps: ContinuityStep[];
  compact?: boolean;
  label?: string;
};

export function ContinuityRail({ steps, compact = false, label = 'Case continuity' }: ContinuityRailProps) {
  return (
    <section className={`continuity-rail${compact ? ' continuity-rail--compact' : ''}`} aria-label={label}>
      <header className="continuity-rail__header">
        <span>{label}</span>
        <b>LIVE</b>
      </header>
      <ol className="continuity-rail__steps">
        {steps.map((step) => (
          <li className={`continuity-step continuity-step--${step.state}`} key={step.id}>
            <i className="continuity-step__node" aria-hidden="true" />
            <span><strong>{step.label}</strong><small>{step.meta}</small></span>
          </li>
        ))}
      </ol>
    </section>
  );
}
