import { randomUUID } from "node:crypto";
import Link from "next/link";
import { exchangeParticipantInvitationAction } from "@/app/participant-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { HOSTED_ACTIONS } from "@/lib/authority/hosted-records";
import { mapParticipantInvitationPreview, normalizeParticipantToken } from "@/lib/authority/participant-access";
import { createClient } from "@/lib/supabase/server";

export const metadata = { robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

const errorCopy: Record<string, string> = {
  link_unavailable: "This secure link is not available. Ask the institution to send a new invitation.",
  link_expired: "This secure link has expired. Ask the institution to send a new invitation.",
  link_used: "This one-time link has already been used. Continue from the device where it was opened or ask the institution for a new invitation.",
  not_ready: "The person granting authority must confirm the request before representative access can open.",
  session_unavailable: "The secure session could not be opened. Ask the institution to send a new invitation.",
};

export default async function ParticipantInvitationPage({ params, searchParams }: Props) {
  const { token: rawToken } = await params;
  const query = await searchParams;
  const token = normalizeParticipantToken(rawToken);
  let preview = mapParticipantInvitationPreview(null);
  let unavailable = !token;

  if (token) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("preview_participant_invitation_v1", { p_token: token });
    unavailable = Boolean(error);
    if (!error) preview = mapParticipantInvitationPreview(data);
  }

  const error = query.error ? errorCopy[query.error] ?? errorCopy.link_unavailable : null;
  const waiting = preview.entryStatus === "waiting";
  const expired = preview.entryStatus === "expired";
  const used = preview.entryStatus === "already_used";
  const ready = preview.entryStatus === "ready" && preview.participantRole && preview.participantName;
  const resuming = ready && preview.participantRole === "representative" && preview.accessPurpose === "resume";
  const viewingReceipt = ready && preview.accessPurpose === "receipt";

  if (unavailable || preview.entryStatus === "unavailable" || error || expired || used) {
    const message = error ?? (expired ? errorCopy.link_expired : used ? errorCopy.link_used : errorCopy.link_unavailable);
    return <AccountFrame eyebrow="Secure request" title="This link cannot open the request" description="Participant access is protected by expiring, one-time links.">
      <div className={styles.alert} role="alert">{message}</div>
      <Link className={styles.secondary} href="/security">How Passage protects access</Link>
    </AccountFrame>;
  }

  return <AccountFrame
    eyebrow={preview.institutionName ?? "Secure authority request"}
    title={waiting ? "The request is waiting for the principal" : viewingReceipt ? `Decision receipt ready for ${preview.participantName}` : resuming ? `Welcome back, ${preview.participantName}` : `Hello, ${preview.participantName}`}
    description={waiting
      ? "Your access is prepared, but the person granting authority must confirm the request before your responsibilities open."
      : viewingReceipt
        ? "The institution recorded its decision. Open the secure receipt to see the outcome, accepted actions, any limits, and later changes."
        : resuming
        ? "Your earlier choice is still saved. Open a new secure session to finish the remaining requirements."
        : `You were invited as the ${preview.participantRole === "principal" ? "person granting authority" : "representative"}. Review the request before opening secure access.`}
  >
    <div className={styles.summary}>
      <h2>{preview.purpose}</h2>
      <p>{preview.accountBoundary}</p>
    </div>
    <div className={styles.facts}>
      <div className={styles.fact}><span>Request</span><strong>{preview.referenceCode}</strong></div>
      <div className={styles.fact}><span>Other person</span><strong>{preview.otherPersonName}</strong></div>
      <div className={styles.fact}><span>Request ends</span><strong>{preview.validUntil ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(preview.validUntil)) : "Not available"}</strong></div>
    </div>
    <p className={styles.legend}>Requested actions</p>
    <ul className={styles.scope}>{preview.allowedActionKeys.map((key) => <li key={key}>{HOSTED_ACTIONS[key as keyof typeof HOSTED_ACTIONS] ?? key}</li>)}</ul>
    {waiting ? <div className={styles.notice} role="status">No action is required yet. The institution will notify you when the request is ready.</div> : ready ? <form action={exchangeParticipantInvitationAction} className={styles.form}>
      <input name="token" type="hidden" value={token!} />
      <input name="idempotencyKey" type="hidden" value={randomUUID()} />
      <button className={styles.primary} type="submit">{viewingReceipt ? "View decision receipt" : resuming ? "Resume secure request" : "Open secure request"}</button>
      <p className={styles.legal}>This link can be used once and gives you 30 minutes of access to this request.</p>
    </form> : null}
  </AccountFrame>;
}
