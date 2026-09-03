import Link from "next/link";
import { notFound } from "next/navigation";
import { openReviewerAction } from "@/app/actions";
import { PortalHeader } from "@/components/authority/PortalHeader";
import { getAuthorityRepository } from "@/lib/authority/repository";
import { isLocalAuthoritySandboxAvailable } from "@/lib/authority/sandbox-boundary";
import type { AuthorityStatus } from "@/lib/authority/types";
import styles from "@/components/authority/portal.module.css";

export const dynamic = "force-dynamic";

const statusLabel: Record<AuthorityStatus, string> = {
  awaiting_principal: "Waiting on person granting authority",
  awaiting_representative: "Waiting on representative",
  evidence_required: "Evidence in progress",
  ready_to_submit: "Ready to submit",
  under_review: "Needs review",
  information_requested: "Information requested",
  accepted: "Accepted",
  accepted_with_limits: "Accepted with limits",
  rejected: "Rejected",
  declined: "Representative declined",
  withdrawn: "Representative withdrew",
  revoked: "Revoked",
  expired: "Expired",
};

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

type Props = { searchParams: Promise<{ notice?: string; error?: string }> };

export default async function InstitutionQueue({ searchParams }: Props) {
  if (!isLocalAuthoritySandboxAvailable()) notFound();
  const messages = await searchParams;
  const records = getAuthorityRepository().listRecords();
  const counts = {
    review: records.filter((record) => record.status === "under_review").length,
    waiting: records.filter((record) => ["awaiting_principal", "awaiting_representative", "evidence_required", "ready_to_submit", "information_requested"].includes(record.status)).length,
    decided: records.filter((record) => ["accepted", "accepted_with_limits", "rejected"].includes(record.status)).length,
    ended: records.filter((record) => ["declined", "withdrawn", "revoked", "expired"].includes(record.status)).length,
  };

  return (
    <main className={styles.page}>
      <PortalHeader active="institution" />
      <div className={styles.content}>
        <section className={styles.intro}>
          <div><p className={styles.eyebrow}>Institution workspace</p><h1>Authority review queue</h1></div>
          <div className={styles.introAction}><p className={styles.lede}>See who owns the next step, review complete evidence, and preserve every decision.</p><Link className={styles.primary} href="/institution/new">Start a request</Link></div>
        </section>
        {messages.notice ? <div className={styles.notice} role="status">{messages.notice}</div> : null}
        {messages.error ? <div className={styles.error} role="alert">{messages.error}</div> : null}
        <section className={styles.stats} aria-label="Queue summary">
          <div className={styles.stat}><span>Needs review</span><strong>{counts.review}</strong></div>
          <div className={styles.stat}><span>Waiting on participant</span><strong>{counts.waiting}</strong></div>
          <div className={styles.stat}><span>Institution decided</span><strong>{counts.decided}</strong></div>
          <div className={styles.stat}><span>Ended</span><strong>{counts.ended}</strong></div>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>All authority requests</h2><p>{records.length} records under one versioned institution policy.</p></div><span className={styles.status}>Sandbox</span></div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Request</th><th>Status</th><th>Requested authority</th><th>Policy</th><th>Updated</th><th>Action</th></tr></thead>
              <tbody>{records.map((record) => (
                <tr key={record.id}>
                  <td><strong>{record.principalName} to {record.representativeName}</strong><span className={styles.muted}>Next: {record.nextOwner === "principal" ? "person granting authority" : record.nextOwner === "representative" ? "representative" : record.nextOwner === "reviewer" ? "institution reviewer" : "complete"}</span></td>
                  <td><span className={styles.status} data-status={record.status}>{statusLabel[record.status]}</span></td>
                  <td className={styles.actionText}>{record.sourceLabel}<span className={styles.muted}>{record.actionLabel}</span></td>
                  <td>{record.policyVersion}<span className={styles.muted}>New York financial POA</span></td>
                  <td>{formatUpdated(record.updatedAt)}</td>
                  <td><form action={openReviewerAction}><input type="hidden" name="recordId" value={record.id} /><button className={record.status === "under_review" ? styles.primary : styles.secondary} type="submit">{record.status === "under_review" ? "Review" : "Open record"}</button></form></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
