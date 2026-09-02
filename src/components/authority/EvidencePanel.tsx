import type { AuthorityRecord } from "@/lib/authority/types";
import styles from "./authority.module.css";

const statusLabel = {
  needed: "Not started",
  complete: "Complete",
  failed: "Needs attention",
  waived: "Waived by reviewer",
} as const;

const methodLabel: Record<string, string> = {
  illustrative_document_review: "Document review",
  signed_agent_certification: "Signed certification",
  synthetic_identity_session: "Identity confirmation",
  synthetic_identity_check: "Identity confirmation",
  synthetic_document_check: "Address document review",
  signed_attestation: "Signed acceptance",
};

export function EvidencePanel({ record }: { record: AuthorityRecord }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeading}>
        <div><p className={styles.eyebrow}>Evidence packet</p><h2>Policy requirements</h2><p>Each item shows what was checked, where the result came from, and what still needs human review.</p></div>
        <span className={styles.policyPill}>Policy {record.policy.version} · New York</span>
      </div>
      <div className={styles.requirementGrid}>
        {record.requirements.map((requirement) => {
          const artifacts = record.evidenceArtifacts.filter((artifact) => artifact.requirementKey === requirement.key);
          return (
            <article className={styles.requirementCard} key={requirement.key}>
              <header><div><strong>{requirement.label}</strong><p>{requirement.reason}</p></div><span data-status={requirement.status}>{statusLabel[requirement.status]}</span></header>
              {artifacts.length ? artifacts.map((artifact) => (
                <div className={styles.artifact} key={artifact.id}>
                  <div className={styles.artifactMeta}><span>{methodLabel[artifact.method] ?? "Evidence review"}</span><b>{artifact.result === "verified" ? "Verified" : artifact.result === "review_required" ? "Reviewer confirmation needed" : "Needs attention"}</b></div>
                  <p>{artifact.sourceNote}</p>
                  {artifact.findings?.length ? <dl className={styles.findings}>{artifact.findings.map((finding) => <div key={finding.key}><dt>{finding.label}</dt><dd>{finding.value}<small>{finding.sourceLocator} · {finding.reviewStatus === "needs_review" ? "Confirm during review" : "Observed"}</small></dd></div>)}</dl> : null}
                </div>
              )) : requirement.failureReason ? <p className={styles.emptyEvidence}>{requirement.failureReason}</p> : <p className={styles.emptyEvidence}>This result will appear here when the responsible person completes the step.</p>}
            </article>
          );
        })}
      </div>
      <div className={styles.evidenceBoundary}><strong>Important</strong><span>Passage organizes evidence against the institution&apos;s policy. It does not issue the power of attorney, provide a legal opinion, or make the institution&apos;s acceptance decision.</span></div>
    </section>
  );
}
