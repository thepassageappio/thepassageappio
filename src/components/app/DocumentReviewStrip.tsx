import Link from "next/link";
import type { DocumentReviewModel } from "@/lib/authority/orientation-strip";
import styles from "./document-review-strip.module.css";
import shell from "@/components/app/app-shell.module.css";

type Props = {
  model: DocumentReviewModel;
  canAsk?: boolean;
  canDecide?: boolean;
  askHref?: string;
  decideHref?: string;
};

export function DocumentReviewStrip({
  model,
  canAsk = false,
  canDecide = false,
  askHref = "#questions",
  decideHref = "#institution-decision",
}: Props) {
  return (
    <section className={styles.strip} id="documents-and-checks" aria-labelledby="documents-and-checks-heading">
      <h2 id="documents-and-checks-heading">Documents and checks</h2>
      <ul className={styles.counts} aria-label="Document review summary">
        <li className={styles.count}>Missing ({model.missing.length})</li>
        <li className={styles.count}>Checked ({model.checked.length})</li>
        <li className={styles.count} data-ready={model.ready ? "yes" : "no"}>
          Ready to decide? {model.readyLabel}
        </li>
      </ul>

      {model.missing.length ? (
        <div>
          <p className={styles.sectionTitle}>Missing</p>
          <ul className={styles.list}>
            {model.missing.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.whoMustFix} must fix or finish this</span>
                {canAsk ? (
                  <div className={styles.actions} style={{ marginTop: 8 }}>
                    <Link className={shell.secondary} href={askHref}>
                      Ask for this
                    </Link>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {model.checked.length ? (
        <div>
          <p className={styles.sectionTitle}>Checked</p>
          <ul className={styles.list}>
            {model.checked.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>Checked by the bank</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.actions}>
        {canAsk ? (
          <Link className={shell.secondary} href={askHref}>
            Ask for something else
          </Link>
        ) : null}
        {canDecide ? (
          model.ready ? (
            <Link className={shell.primary} href={decideHref}>
              Review and decide
            </Link>
          ) : (
            <span className={shell.secondary} aria-disabled="true" style={{ opacity: 0.55, cursor: "not-allowed" }}>
              Review and decide
            </span>
          )
        ) : null}
      </div>
      {!model.ready && canDecide ? <p className={shell.supportingCopy}>{model.readyLabel}</p> : null}
    </section>
  );
}
