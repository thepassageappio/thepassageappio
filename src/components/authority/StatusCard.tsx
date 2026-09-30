import Link from "next/link";
import type { ActorRole, AuthorityRecord } from "@/lib/authority/types";
import styles from "./authority.module.css";

const labels: Record<Exclude<AuthorityRecord["status"], "awaiting_principal" | "awaiting_representative">, string> = {
  evidence_required: "Papers still needed",
  ready_to_submit: "Ready for the person acting for them to send", under_review: "Staff can decide", information_requested: "Information requested",
  accepted: "Accepted", accepted_with_limits: "Accepted with limits", rejected: "Not accepted", declined: "Request declined",
  withdrawn: "The person acting for them ended this request", revoked: "Revoked", expired: "Expired",
};

function statusLabel(record: AuthorityRecord) {
  if (record.status === "awaiting_principal") return `Waiting for ${record.principal.name}`;
  if (record.status === "awaiting_representative") return `Waiting for ${record.representative.name}`;
  return labels[record.status];
}

function message(record: AuthorityRecord, role: ActorRole) {
  const active = (record.status === "awaiting_principal" && role === "principal") ||
    (["awaiting_representative", "evidence_required", "ready_to_submit", "information_requested"].includes(record.status) && role === "representative") ||
    (record.status === "under_review" && role === "reviewer");
  if (active) return "This request needs your attention now.";
  if (["accepted", "accepted_with_limits", "rejected", "declined", "withdrawn", "revoked", "expired"].includes(record.status)) return "The saved result and supporting details are below.";
  return "Someone else needs to act next. Their result will appear here.";
}

export function StatusCard({ record, role }: { record: AuthorityRecord; role: ActorRole }) {
  return <section className={styles.statusCard}>
    <div><p className={styles.eyebrow}>Current status</p><h2>{statusLabel(record)}</h2><p>{message(record, role)}</p></div>
    <div className={styles.statusActions}>
      <Link href={`/workspace/${record.id}/receipt`}>View decision receipt</Link>
      <div className={styles.versionBadge} aria-label={`Saved version ${record.version}`}><span>Saved</span><strong>Version {record.version}</strong></div>
    </div>
  </section>;
}
