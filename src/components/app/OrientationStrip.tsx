import Link from "next/link";
import type { OrientationModel } from "@/lib/authority/orientation-strip";
import styles from "./orientation-strip.module.css";
import shell from "@/components/app/app-shell.module.css";

type Props = {
  model: OrientationModel;
  headingId?: string;
};

export function OrientationStrip({ model, headingId = "request-next-step" }: Props) {
  return (
    <section className={styles.strip} aria-labelledby={headingId}>
      <div className={styles.topRow}>
        <div className={styles.statusBlock}>
          <p className={shell.eyebrow}>Where this stands</p>
          <h2 id={headingId}>{model.statusSentence}</h2>
        </div>
        <p className={styles.currency} data-kind={model.currencyKind} role="status">
          {model.currencyLabel}
        </p>
      </div>

      <p className={styles.nextLine}>{model.nextLine}</p>

      {model.primaryAction || model.secondaryAction ? (
        <div className={styles.ctaRow}>
          {model.primaryAction ? (
            <Link className={shell.primary} href={model.primaryAction.href}>
              {model.primaryAction.label}
            </Link>
          ) : null}
          {model.secondaryAction ? (
            <Link className={shell.secondary} href={model.secondaryAction.href}>
              {model.secondaryAction.label}
            </Link>
          ) : null}
        </div>
      ) : null}

      <p className={styles.decisionLine}>
        <strong>Decision: </strong>
        {model.decisionLine}
      </p>

      {model.currencyKind === "later_change" && model.laterChangeDetail ? (
        <p className={styles.laterDetail}>Later: {model.laterChangeDetail}</p>
      ) : null}

      <ul className={styles.chips} aria-label="Checks that stay separate">
        {model.chips.map((chip) => (
          <li className={styles.chip} key={chip.label}>
            <span className={styles.chipLabel}>{chip.label}</span>
            <span className={styles.chipState}>{chip.state}</span>
          </li>
        ))}
      </ul>

      {model.multiInstitutionLine ? <p className={styles.multiLine}>{model.multiInstitutionLine}</p> : null}
    </section>
  );
}
