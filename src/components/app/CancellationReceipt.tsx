import type { CancellationReceipt as Receipt } from "@/lib/authority/cancellation";
import styles from "./app-shell.module.css";
export function CancellationReceipt({ receipt }: { receipt: Receipt }) {
  return <section className={styles.panel} aria-label="Cancellation receipt">
    <div className={styles.panelHead}><div><p>{receipt.institutionName} · {receipt.referenceCode}</p><h1>Request canceled</h1><p>The institution closed this request before the account holder confirmed it.</p></div></div>
    <dl className={styles.policyFacts}>
      <div><dt>Reason</dt><dd style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{receipt.reason}</dd></div>
      <div><dt>People named in the request</dt><dd>{receipt.principalName} and {receipt.representativeName}</dd></div>
      <div><dt>Account description</dt><dd>{receipt.accountBoundary}</dd></div>
      <div><dt>Canceled</dt><dd>{new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(receipt.canceledAt))} UTC</dd></div>
    </dl>
    <p>No further steps are needed for this request. The saved history remains. This cancellation does not revoke a power of attorney or change access at the institution.</p>
    <details><summary>Receipt details</summary><p>{receipt.receiptCode} · Record {receipt.recordVersion}</p><p style={{ overflowWrap: "anywhere" }}>{receipt.receiptSha256}</p></details>
  </section>;
}
