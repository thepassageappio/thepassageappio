import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { DurableReceipt } from '@/components/operations/DurableReceipt';
import { durableReceipt } from '@/lib/presentation/durable-receipts';
import { humanizePreviewLabel } from '@/lib/presentation/plain-language';
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
  const { viewer, requests, events, members } = result.data;
  const request = requests.find((candidate) => candidate.id === requestId);
  if (!request) return <Closed />;
  const partnerName = humanizePreviewLabel(viewer.partnerOrganizationName, 'Cascade Floral & Keepsakes');
  const viewerName = humanizePreviewLabel(viewer.displayName, `${partnerName} team member`);
  const requestTitle = humanizePreviewLabel(request.title, 'Memorial flowers');
  const requestDetails = humanizePreviewLabel(request.details, 'Prepare the requested memorial flowers.');
  const proofSummary = humanizePreviewLabel(request.proof_summary ?? '', 'Delivery proof is saved.');
  const history = events.filter((event) => event.partner_request_id === request.id).slice().reverse();
  const newest = (name: string) => history.slice().reverse().find((event) => event.name === name);
  const vendorActor = (event: (typeof history)[number] | undefined) => (
    humanizePreviewLabel(
      members.find((member) => member.id === event?.actor_partner_member_id)?.display_name ?? '',
      `${partnerName} team member`,
    )
  );
  const acceptedEvent = newest('partner_request.accepted');
  const proofEvent = newest('partner_request.proof_submitted');
  const verifiedEvent = newest('partner_request.verified');
  const quoteReceipt = acceptedEvent ? durableReceipt({
    eventId: acceptedEvent.id,
    heading: `${formatPartnerAmount(request.quote_amount_cents)} sample quote saved.`,
    changedBy: vendorActor(acceptedEvent),
    savedAt: acceptedEvent.occurred_at,
    result: `${vendorActor(acceptedEvent)} accepted ${requestTitle} with a ${formatPartnerAmount(request.quote_amount_cents)} sample quote. No purchase or payment occurred.`,
    visibleTo: `${partnerName} and authorized Northstar directors. Not visible to the Rivera family.`,
    savedIn: 'Vendor request history',
    next: 'Northstar reviews the quote and coordinates the next step.',
  }) : null;
  const proofReceipt = proofEvent ? durableReceipt({
    eventId: proofEvent.id,
    heading: 'Delivery proof saved.',
    changedBy: vendorActor(proofEvent),
    savedAt: proofEvent.occurred_at,
    result: `${vendorActor(proofEvent)} submitted delivery proof for ${requestTitle}.`,
    visibleTo: `${partnerName} and authorized Northstar directors. Not visible to the Rivera family.`,
    savedIn: 'Vendor request history',
    next: 'An authorized Northstar director reviews the proof. The request is not complete yet.',
  }) : null;
  const verifiedReceipt = verifiedEvent ? durableReceipt({
    eventId: verifiedEvent.id,
    heading: 'Delivery verified.',
    changedBy: 'Authorized Northstar director',
    savedAt: verifiedEvent.occurred_at,
    result: `${requestTitle} from ${partnerName} was verified. No payment was created and no family message was sent.`,
    visibleTo: `Northstar directors and ${partnerName}. Not visible to the Rivera family.`,
    savedIn: 'Case and vendor request history',
    next: 'The request is complete.',
  }) : null;

  return (
    <AppFrame active="partner" identity={viewerName} mode="verified" role={`Vendor · ${partnerName}`}>
      <Link className={styles.backLink} href="/partner">← Requests</Link>
      <ol aria-label="Request position" className={styles.orientation}>
        <li aria-current={request.status === 'sent' ? 'step' : undefined} data-active={request.status === 'sent' ? 'true' : undefined}>Respond</li>
        <li aria-current={request.status === 'in_progress' ? 'step' : undefined} data-active={request.status === 'in_progress' ? 'true' : undefined}>Deliver</li>
        <li aria-current={['proof_submitted', 'verified'].includes(request.status) ? 'step' : undefined} data-active={['proof_submitted', 'verified'].includes(request.status) ? 'true' : undefined}>Verified</li>
      </ol>
      <header className={styles.hero}>
        <div><p>{humanPartnerCategory(request.category)} · needed by {formatPartnerTime(request.needed_by)}</p><h1>{requestTitle}</h1><span>Only this request and its saved history are shown.</span></div>
        <strong className={styles.status} data-state={request.status}>{humanPartnerRequestStatus(request.status)}</strong>
      </header>
      <div className={styles.layout}>
        <section aria-labelledby="now-heading" className={styles.panel}>
          <p className={styles.eyebrow}>Now</p>
          <h2 id="now-heading">{request.status === 'verified' ? 'Verified — request complete.' : request.status === 'declined' ? 'You declined this request.' : request.status === 'proof_submitted' ? 'Waiting for director review.' : request.status === 'sent' ? 'Respond to this request.' : 'Complete the work, then submit delivery proof.'}</h2>
          {request.status === 'sent' && <RespondToRequestForm partnerRequestId={request.id} requestId={randomUUID()} version={request.version} />}
          {request.status === 'in_progress' && <SubmitDeliveryProofForm partnerRequestId={request.id} requestId={randomUUID()} version={request.version} />}
          {request.status === 'proof_submitted' && <p>{proofSummary} {request.proof_reference ? `Supporting reference: ${humanizePreviewLabel(request.proof_reference, 'Reference saved')}. ` : ''}An authorized Northstar director reviews this next.</p>}
          {request.status === 'verified' && <p>{proofSummary} The saved verification receipt appears below.</p>}
          {request.status === 'declined' && <p>{humanizePreviewLabel(request.decline_reason ?? '', 'The vendor declined this request.')} The saved response remains in request history.</p>}
        </section>
        <aside aria-labelledby="facts-heading" className={styles.panel}>
          <p className={styles.eyebrow}>Request facts</p><h2 id="facts-heading">What this request carries.</h2>
          <dl className={styles.facts}>
            <div><dt>Details</dt><dd>{requestDetails}</dd></div>
            <div><dt>Category</dt><dd>{humanPartnerCategory(request.category)}</dd></div>
            <div><dt>Needed by</dt><dd>{formatPartnerTime(request.needed_by)}</dd></div>
            <div><dt>Quote</dt><dd>{formatPartnerAmount(request.quote_amount_cents)}</dd></div>
            <div><dt>Sent</dt><dd>{formatPartnerTime(request.sent_at)}</dd></div>
          </dl>
        </aside>
      </div>
      {(quoteReceipt || proofReceipt || verifiedReceipt) && (
        <section aria-labelledby="receipts-heading" className={styles.panel} style={{ marginTop: 18 }}>
          <p className={styles.eyebrow}>Receipts</p>
          <h2 id="receipts-heading">Saved actions for this request.</h2>
          {quoteReceipt && <DurableReceipt receipt={quoteReceipt} />}
          {proofReceipt && <DurableReceipt receipt={proofReceipt} />}
          {verifiedReceipt && <DurableReceipt receipt={verifiedReceipt} />}
        </section>
      )}
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
    'partner_request.accepted': 'Sample quote saved',
    'partner_request.declined': 'Declined',
    'partner_request.proof_submitted': 'Delivery proof submitted',
    'partner_request.verified': 'Verified by director',
  };
  return labels[name] ?? 'Saved request update';
}

function Closed() {
  return <main className={styles.closed} id="main-content"><h1>This request is not available to your account.</h1><p>Nothing changed, and no request details were shown.</p><Link href="/partner">Return to requests</Link></main>;
}
