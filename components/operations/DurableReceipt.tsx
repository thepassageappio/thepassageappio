import styles from './DurableReceipt.module.css';

export type DurableReceiptData = {
  eventId: string;
  heading: string;
  changedBy: string;
  savedAt: string;
  savedLabel: string;
  result: string;
  visibleTo: string;
  savedIn: string;
  next: string;
};

export function DurableReceipt({ receipt, announce = false }: { receipt: DurableReceiptData; announce?: boolean }) {
  return (
    <section className={styles.receipt} role={announce ? 'status' : undefined} aria-label={receipt.heading}>
      <h3>{receipt.heading}</h3>
      <dl className={styles.facts}>
        <div><dt>Changed by</dt><dd>{receipt.changedBy}</dd></div>
        <div><dt>Saved</dt><dd><time dateTime={receipt.savedAt}>{receipt.savedLabel}</time></dd></div>
        <div><dt>Result</dt><dd>{receipt.result}</dd></div>
        <div><dt>Visible to</dt><dd>{receipt.visibleTo}</dd></div>
        <div><dt>Saved in</dt><dd>{receipt.savedIn}</dd></div>
        <div><dt>Next</dt><dd>{receipt.next}</dd></div>
      </dl>
    </section>
  );
}
