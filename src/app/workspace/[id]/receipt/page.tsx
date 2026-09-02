import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { RecordHeader } from "@/components/authority/RecordHeader";
import { ReceiptTimeline } from "@/components/authority/ReceiptTimeline";
import { isAuthorityError } from "@/lib/authority/errors";
import { getAuthorityRepository } from "@/lib/authority/repository";
import { ACTOR_COOKIE, resolveActorCookie } from "@/lib/authority/session";
import type { AuthorityRecord } from "@/lib/authority/types";
import styles from "./receipt.module.css";

export const dynamic = "force-dynamic";

const outcomeLabel: Record<AuthorityRecord["status"], string> = {
  awaiting_principal: "Waiting for confirmation",
  awaiting_representative: "Waiting for representative",
  evidence_required: "Evidence in progress",
  ready_to_submit: "Ready to send",
  under_review: "Institution review",
  information_requested: "More information requested",
  accepted: "Accepted",
  accepted_with_limits: "Accepted with limits",
  rejected: "Not accepted",
  declined: "Representative declined",
  withdrawn: "Representative withdrew",
  revoked: "Revoked",
  expired: "Expired",
};

function date(value?: string) {
  return value ? new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date(value)) : "Not yet recorded";
}

export default async function DecisionReceipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let record;
  try {
    record = getAuthorityRepository().getRecord(id);
  } catch (error) {
    if (isAuthorityError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const actor = resolveActorCookie(record, (await cookies()).get(ACTOR_COOKIE)?.value);
  const decision = record.decision;
  const accepted = decision?.acceptedActionKeys.length
    ? record.allowedActions.filter((action) => decision.acceptedActionKeys.includes(action.key))
    : [];

  return (
    <main className={styles.page}>
      <RecordHeader actor={actor} />
      <div className={styles.shell}>
        <Link className={styles.back} href={`/workspace/${record.id}`}>Back to request</Link>
        <header className={styles.title}>
          <div><p>Decision receipt</p><h1>{outcomeLabel[record.status]}</h1><span>{record.principal.name} to {record.representative.name}</span></div>
          <div className={styles.seal}><span>Current status</span><strong>{outcomeLabel[record.status]}</strong><small>Saved version {record.version}</small></div>
        </header>
        <div className={styles.columns}>
          <div className={styles.main}>
            <section className={styles.card}>
              <div className={styles.cardHead}><div><p>Institution</p><h2>{record.relyingParty.name}</h2></div><span>Policy {record.policy.version}</span></div>
              <dl className={styles.summary}>
                <div><dt>Account boundary</dt><dd>{record.accountBoundary}</dd></div>
                <div><dt>Authority source</dt><dd>{record.authoritySource.instrumentName}</dd></div>
                <div><dt>Jurisdiction</dt><dd>New York</dd></div>
                <div><dt>Request ends</dt><dd>{date(record.validUntil)}</dd></div>
                <div><dt>Decision recorded</dt><dd>{date(decision?.decidedAt)}</dd></div>
                <div><dt>Lifecycle</dt><dd>{record.revokedAt ? `Revoked ${date(record.revokedAt)}` : decision ? "Active unless ended, expired, or revoked" : "Decision not yet recorded"}</dd></div>
              </dl>
            </section>

            <section className={styles.card}>
              <p>Institution decision</p>
              <h2>{decision ? outcomeLabel[decision.outcome] : "Pending"}</h2>
              <p className={styles.reason}>{decision?.reason ?? "The institution has not recorded a final decision."}</p>
              {accepted.length ? <div className={styles.list}><h3>Accepted actions</h3>{accepted.map((action) => <div key={action.key}><b>Included</b><span><strong>{action.label}</strong><small>{action.description}</small></span></div>)}</div> : null}
              {decision?.limitations.length ? <div className={`${styles.list} ${styles.limits}`}><h3>Limits</h3>{decision.limitations.map((limit) => <div key={limit}><b>Limited</b><span><strong>{limit}</strong></span></div>)}</div> : null}
            </section>

            <section className={styles.boundary}>
              <strong>What this receipt means</strong>
              <p>The institution recorded its own decision against its policy and the evidence shown in this request. Passage preserved the scope, evidence references, disclosures, decision, and lifecycle. Passage did not create the legal authority or provide a legal opinion.</p>
            </section>
          </div>
          <ReceiptTimeline events={record.events} role={actor.role} />
        </div>
      </div>
    </main>
  );
}
