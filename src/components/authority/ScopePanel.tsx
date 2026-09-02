import type { AuthorityRecord } from "@/lib/authority/types";
import styles from "./authority.module.css";

export function ScopePanel({ record }: { record: AuthorityRecord }) {
  return <section className={styles.panel}>
    <div className={styles.panelHeading}><div><p className={styles.eyebrow}>Exact permission</p><h2>What {record.representative.name} may and may not do</h2><p>{record.authoritySource.label} · {record.accountBoundary}</p></div><span className={styles.policyPill}>{record.policy.label} {record.policy.version} · New York</span></div>
    <div className={styles.scopeGrid}>
      <div className={styles.scopeAllowed}><h3>✓ Allowed</h3>{record.allowedActions.map((action) => <div className={styles.scopeItem} key={action.key}><strong>{action.label}</strong><p>{action.description}</p></div>)}</div>
      <div className={styles.scopeBlocked}><h3>× Not allowed</h3>{record.prohibitedActions.map((action) => <div className={styles.scopeItem} key={action.key}><strong>{action.label}</strong><p>{action.description}</p></div>)}</div>
    </div>
  </section>;
}
