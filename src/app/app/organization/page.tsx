import Link from "next/link";
import styles from "@/components/app/app-shell.module.css";
import { getAuthorityAccessContext, roleLabel } from "@/lib/authority/access";
import { createClient } from "@/lib/supabase/server";

const organizationTypeLabels: Record<string, string> = {
  regional_bank: "Regional bank",
  credit_union: "Credit union",
  elder_law_firm: "Elder law firm",
  authorized_service_organization: "Authorized service organization",
};

const offerLabels: Record<string, string> = {
  free_evaluation: "Evaluation",
  pilot: "Founding pilot",
  enterprise: "Institution plan",
};

const statusLabels: Record<string, string> = {
  not_started: "Ready to start",
  active: "Active",
  past_due: "Payment attention needed",
  canceled: "Canceled",
  expired: "Ended",
};

function formatDate(value: string | null) {
  if (!value) return "Begins with the first activated request";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default async function OrganizationPage() {
  const access = await getAuthorityAccessContext();
  if (!access?.membership || !access.organization) return null;

  const supabase = await createClient();
  const { data: plan, error } = await supabase
    .from("organization_entitlements")
    .select("offer, status, transaction_limit, activated_count, period_started_at, period_ends_at")
    .eq("organization_id", access.organization.id)
    .maybeSingle();
  if (error) throw error;

  const offer = String(plan?.offer ?? "free_evaluation");
  const used = Number(plan?.activated_count ?? 0);
  const limit = plan?.transaction_limit == null ? null : Number(plan.transaction_limit);
  const canManage = access.membership.role === "owner" || access.membership.role === "admin";
  const isEvaluation = offer === "free_evaluation";

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Organization and plan</p>
          <h1>{access.organization.displayName}</h1>
          <p>See who owns this workspace, what is included, and when the current access period ends.</p>
        </div>
      </header>

      <section className={`${styles.metricGrid} ${styles.compactMetrics}`} aria-label="Plan summary">
        <div className={styles.metric}><span>Current plan</span><strong>{offerLabels[offer] ?? "Custom plan"}</strong></div>
        <div className={styles.metric}><span>Plan status</span><strong>{statusLabels[String(plan?.status ?? "not_started")] ?? "Contact support"}</strong></div>
        <div className={styles.metric}><span>Requests used</span><strong>{limit == null ? used : `${used} of ${limit}`}</strong></div>
      </section>

      <div className={styles.grid} style={{ marginTop: 17 }}>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Institution account</h2><p>Your team signs in to one shared institution workspace. Each person keeps a separate account and role.</p></div></div>
          <dl className={styles.policyFacts}>
            <div><dt>Display name</dt><dd>{access.organization.displayName}</dd></div>
            <div><dt>Legal name</dt><dd>{access.organization.legalName}</dd></div>
            <div><dt>Organization type</dt><dd>{organizationTypeLabels[access.organization.organizationType] ?? "Institution"}</dd></div>
            <div><dt>Your access</dt><dd>{roleLabel(access.membership.role)}</dd></div>
            <div><dt>Workspace status</dt><dd>{access.organization.status === "active" ? "Active" : "Unavailable"}</dd></div>
          </dl>
          <div className={styles.panelActions}><Link className={styles.secondary} href="/app/team">Review people and access</Link></div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Billing summary</h2><p>Only the institution pays Passage. Account holders and representatives are never charged.</p></div></div>
          <dl className={styles.policyFacts}>
            <div><dt>Price</dt><dd>{isEvaluation ? "$0 evaluation" : offer === "pilot" ? "$5,000 pilot" : "Contracted"}</dd></div>
            <div><dt>Payment method</dt><dd>{isEvaluation ? "Not required" : "Institution invoice"}</dd></div>
            <div><dt>Period starts</dt><dd>{formatDate(plan?.period_started_at ?? null)}</dd></div>
            <div><dt>Period ends</dt><dd>{formatDate(plan?.period_ends_at ?? null)}</dd></div>
          </dl>
          <p className={styles.supportingCopy}>{isEvaluation ? "Your evaluation does not start until the first request is activated. Drafts and sample preparation do not count." : "Billing is handled with your institution contact. Payment does not change or remove previously saved receipts."}</p>
          {canManage ? <div className={styles.panelActions}><Link className={styles.primary} href="/contact?topic=pilot">Discuss a pilot</Link></div> : null}
        </section>
      </div>

      <details className={`${styles.panel} ${styles.disclosurePanel}`}>
        <summary>What happens after the evaluation</summary>
        <p>A founding pilot proves one workflow with a defined team, success criteria, and request allowance before an annual commitment.</p>
        <div className={styles.stepGrid}>
          <div><span>1</span><strong>Review results</strong><p>Confirm completion, user feedback, and operational fit.</p></div>
          <div><span>2</span><strong>Agree on the pilot</strong><p>Set scope, volume, support, security review, and success measures.</p></div>
          <div><span>3</span><strong>Invoice the institution</strong><p>The organization owner receives an invoice; participant access stays free.</p></div>
        </div>
      </details>
    </>
  );
}
