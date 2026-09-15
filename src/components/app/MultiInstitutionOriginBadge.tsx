import styles from "@/components/app/app-shell.module.css";

/** Visible multi-institution origin badge + independence line (PD MULTI-INSTITUTION-CLARITY-P0). */
export function MultiInstitutionOriginBadge() {
  return (
    <span className={styles.badge}>
      One of several banks
      <span style={{ display: "block", fontWeight: 400, marginTop: 2 }}>Your bank&rsquo;s answer is only for your bank.</span>
    </span>
  );
}

export function MultiInstitutionOriginStripLine() {
  return (
    <p style={{ marginTop: 12 }}>
      This request is one of several banks this family asked. Your bank&rsquo;s answer is only for your bank.
    </p>
  );
}
