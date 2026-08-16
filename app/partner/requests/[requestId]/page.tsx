import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { formatPartnerAmount, formatPartnerTime, humanPartnerCategory, humanPartnerRequestStatus, loadHostedPartnerData } from '@/lib/partner/hosted';
import { RespondToRequestForm } from '../../RespondToRequestForm';
import { SubmitDeliveryProofForm } from './SubmitDeliveryProofForm';
import styles from '../../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PartnerRequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const result = await loadHostedPartnerData({ events: true });
  if (!result.ok) return <Closed />;
  const { viewer, requests, events } = result.data;
  const request = requests.find((candidate) => candidate.id === requestId);
  if (!request) return <Closed />;
  const history = events.filter((event) => event.partner_request_id === request.id).slice().reverse();

  return (
    <AppFrame active="partner" identity={viewer.displayName} mode="verified" role={`Vendor · ${viewer.partnerOrganizationName}`}>
      <Link className={styles.backLink} href="/partner">← Requests</Link>
      <ol aria-label="Request position" className={styles.orientation}>
        <li aria-current={request.status === 'sent' ? 'step' : undefined} data-active={request.status === 'sent' ? 'true' : undefined}>Respond</li>
        <li aria-current={request.status === 'quoted' ? 'step' : undefined} data-active={request.status === 'quoted' ? 'true' : undefined}>Approval</li>
        <li aria-current={request.status === 'in_progress' ? 'step' : undefined} data-active={request.status === 'in_progress' ? 'true' : undefined}>Deliver</li>
        <li aria-current={['proof_submitted', 'verified'].includes(request.status) ? 'step' : undefined} data-active={['proof_submitted', 'verified'].includes(request.status) ? 'true' : undefined}>Verified</li>
      </ol>
      <header className={styles.hero}>
        <div><p>{humanPartnerCategory(request.category)} · needed by {formatPartnerTime(request.needed_by)}</p><h1>{request.title}</h1><span>Only this request and its saved history are shown.</span></div>
        <strong className={styles.status} data-state={request.status}>{humanPartnerRequestStatus(request.status)}</strong>
      </header>
      <div className={styles.layout}>
        <section aria-labelledby="now-heading" className={styles.panel}>
          <p className={styles.eyebrow}>Now</p>
          <h2 id="now-heading">{request.status === 'verified' ? 'Verified. Request complete.' : request.status === 'declined' ? 'This request is declined.' : request.status === 'proof_submitted' ? 'Waiting for director review.' : request.status === 'quoted' ? 'Quote sent. Waiting for approval.' : request.status === 'sent' ? 'Respond to this request.' : 'Complete the work, then submit delivery proof.'}</h2>
          {request.status === 'sent' && <RespondToRequestForm partnerRequestId={request.id} requestId={randomUUID()} version={request.version} />}
          {request.status === 'quoted' && <div className={styles.receipt} role="status"><h3>Quote sent: {formatPartnerAmount(request.quote_amount_cents)}</h3><p>Work begins once the funeral home approves and payment is captured. You&apos;ll see this move to &quot;in progress&quot; automatically.</p><small>Sent {formatPartnerTime(request.quoted_at)}</small></div>}
          {request.status === 'in_progress' && <SubmitDeliveryProofForm partnerRequestId={request.id} requestId={randomUUID()} version={request.version} />}
          {request.status === 'proof_submitted' && <div className={styles.receipt} role="status"><h3>Delivery proof submitted.</h3><p>{request.proof_summary}</p>{request.proof_reference && <p>Supporting reference: {request.proof_reference}</p>}<small>Submitted {formatPartnerTime(request.proof_submitted_at)} · waiting for director review</small></div>}
          {request.status === 'verified' && (
            <div className={styles.receipt} role="status">
              <h3>Verified. Request complete.</h3>
              <p>{request.proof_summary}</p>
              {request.vendor_payout_cents !== null && (
                <p>{request.payout_released_at ? `You were paid ${formatPartnerAmount(request.vendor_payout_cents)}` : `${formatPartnerAmount(request.vendor_payout_cents)} is being released to you`}{request.platform_fee_cents !== null ? ` (platform fee ${formatPartnerAmount(request.platform_fee_cents)} deducted).` : '.'}</p>
              )}
              <small>Verified {formatPartnerTime(request.verified_at)}</small>
            </div>
          )}
          {request.status === 'declined' && <div className={styles.receipt} role="status"><h3>Declined</h3><p>{request.decline_reason}</p><small>Declined {formatPartnerTime(request.responded_at)}</small></div>}
        </section>
        <aside aria-labelledby="facts-heading" className={styles.panel}>
          <p className={styles.eyebrow}>Request facts</p><h2 id="facts-heading">What this request carries.</h2>
          <dl className={styles.facts}>
            <div><dt>Details</dt><dd>{request.details}</dd></div>
            <div><dt>Category</dt><dd>{humanPartnerCategory(request.category)}</dd></div>
            <div><dt>Needed by</dt><dd>{formatPartnerTime(request.needed_by)}</dd></div>
            <div><dt>Quote</dt><dd>{formatPartnerAmount(request.quote_amount_cents)}</dd></div>
            <div><dt>Sent</dt><dd>{formatPartnerTime(request.sent_at)}</dd></div>
          </dl>
        </aside>
      </div>
      <section aria-labelledby="history-heading" className={styles.panel} style={{ marginTop: 18 }}>
        <p className={styles.eyebrow}>History</p><h2 id="history-heading">Saved request history.</h2>
        {history.length === 0 ? <p>No history yet.</p> : (
          <ol className={styles.history}>
            {history.map((event) => <li key={event.id}><h3>{eventLabel(event.name)}</h3><small>{formatPartnerTime(event.occurred_at)}</small></li>)}
          </ol>
        )}
      </section>
    </AppFrame>
  );
}

function eventLabel(name: string) {
  const labels: Record<string, string> = {
    'partner_request.sent': 'Request sent',
    'partner_request.quoted': 'Quote sent',
    'partner_request.quote_declined': 'Quote declined by director',
    'partner_request.payment_captured': 'Payment captured — approved',
    'partner_request.declined': 'Declined',
    'partner_request.proof_submitted': 'Delivery proof submitted',
    'partner_request.verified': 'Verified by director',
    'partner_request.payout_released': 'Payment released to you',
  };
  return labels[name] ?? name;
}

function Closed() {
  return <main className={styles.closed} id="main-content"><h1>This request is not available to your account.</h1><p>Nothing changed, and no request details were shown.</p><Link href="/partner">Return to requests</Link></main>;
}
