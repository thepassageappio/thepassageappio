import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { formatPartnerAmount, formatPartnerTime, humanPartnerCategory, humanPartnerRequestStatus, loadHostedPartnerData } from '@/lib/partner/hosted';
import { RespondToRequestForm } from './RespondToRequestForm';
import { SubmitDeliveryProofForm } from './requests/[requestId]/SubmitDeliveryProofForm';
import styles from '../operations-beta.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PartnerPage() {
  const result = await loadHostedPartnerData();
  if (!result.ok) return <Unavailable message={result.message} />;
  const { viewer, requests } = result.data;
  const open = requests.filter((request) => ['sent', 'quoted', 'in_progress', 'proof_submitted'].includes(request.status));
  const closed = requests.filter((request) => request.status === 'declined' || request.status === 'verified');

  return (
    <AppFrame active="partner" identity={viewer.displayName} mode="verified" role={`Vendor · ${viewer.partnerOrganizationName}`}>
      <header className={styles.pageHeading}>
        <div><p>VENDOR / REQUESTS</p><h1>Requests from funeral homes.</h1><span>Only requests sent to {viewer.partnerOrganizationName} appear here. Accept with a quote, decline, or submit delivery proof.</span></div>
        <dl><div><dt>Waiting on you</dt><dd>{requests.filter((request) => request.status === 'sent').length}</dd></div><div><dt>In progress</dt><dd>{requests.filter((request) => request.status === 'in_progress').length}</dd></div></dl>
      </header>
      <section aria-label="Verified vendor access" className={styles.scopeBand}><strong>{viewer.partnerOrganizationName}</strong><span>{viewer.displayName}</span><small>Vendor · your organization’s requests only</small></section>

      {open.length === 0 ? (
        <section className={styles.emptyState} role="status"><p>REQUESTS</p><h2>No open requests right now.</h2><span>New requests from funeral homes will appear here.</span></section>
      ) : (
        <section aria-labelledby="open-requests-title" className={styles.workList}>
          <div className={styles.sectionHeading}><div><p>OPEN</p><h2 id="open-requests-title">Waiting on your organization.</h2></div><span>{open.length} shown</span></div>
          {open.map((request) => (
            <article className={styles.workCard} key={request.id}>
              <div className={styles.cardTop}><span>{humanPartnerCategory(request.category)}</span><b data-state={request.status}>{humanPartnerRequestStatus(request.status)}</b></div>
              <div className={styles.cardBody}>
                <p>NEEDED BY · {formatPartnerTime(request.needed_by)}</p><h3>{request.title}</h3>
                <dl className={styles.facts}>
                  <div><dt>Details</dt><dd>{request.details}</dd></div>
                  <div><dt>Quote</dt><dd>{formatPartnerAmount(request.quote_amount_cents)}</dd></div>
                  <div><dt>Sent</dt><dd>{formatPartnerTime(request.sent_at)}</dd></div>
                </dl>
              </div>
              {request.status === 'sent' && <RespondToRequestForm partnerRequestId={request.id} requestId={randomUUID()} version={request.version} />}
              {request.status === 'quoted' && <div className={styles.startForm}><p>Quote sent. Work begins once the funeral home approves and payment is captured.</p></div>}
              {request.status === 'in_progress' && <SubmitDeliveryProofForm partnerRequestId={request.id} requestId={randomUUID()} version={request.version} />}
              {request.status === 'proof_submitted' && <div className={styles.startForm}><p>Delivery proof is waiting for the funeral home director to review.</p></div>}
              <div className={styles.startForm}><Link className={styles.primaryLink} href={`/partner/requests/${request.id}`}>Open full history</Link></div>
            </article>
          ))}
        </section>
      )}

      {closed.length > 0 && (
        <section aria-labelledby="closed-requests-title" className={styles.workList}>
          <div className={styles.sectionHeading}><div><p>CLOSED</p><h2 id="closed-requests-title">Declined or verified.</h2></div><span>{closed.length} shown</span></div>
          {closed.map((request) => (
            <article className={styles.workCard} key={request.id}>
              <div className={styles.cardTop}><span>{humanPartnerCategory(request.category)}</span><b data-state={request.status}>{humanPartnerRequestStatus(request.status)}</b></div>
              <div className={styles.cardBody}><h3>{request.title}</h3></div>
              <div className={styles.startForm}><Link className={styles.primaryLink} href={`/partner/requests/${request.id}`}>Open full history</Link></div>
            </article>
          ))}
        </section>
      )}
    </AppFrame>
  );
}

function Unavailable({ message: _message }: { message: string }) {
  return <main className={styles.closed} id="main-content"><p>REQUESTS</p><h1>We couldn’t load your requests.</h1><span>No changes were made. Try again.</span><Link href="/partner">Reload requests</Link></main>;
}
