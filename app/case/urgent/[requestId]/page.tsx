import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { verifiedUser } from '@/lib/auth/session';
import { loginPath } from '@/lib/auth/redirects';
import { createPassageServerClient } from '@/lib/supabase/server';
import { humanSituationCategory } from '@/lib/urgent/situations';
import styles from '../../CaseOverview.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type UrgentRequest = {
  id: string;
  situation_category: string;
  person_name: string;
  person_location: string;
  person_city: string | null;
  person_state: string | null;
  person_timing: string | null;
  coordinator_name: string;
  coordinator_phone: string | null;
  coordinator_email: string | null;
  callback_notes: string | null;
  status: 'submitted' | 'self_handling' | 'claimed' | 'case_created';
  submitted_at: string;
  claimed_at: string | null;
  case_created_at: string | null;
  workflow_id: string | null;
};

const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

function formatTime(value: string | null) {
  return value ? dateTime.format(new Date(value)) : null;
}

function locationLabel(request: UrgentRequest) {
  const cityState = [request.person_city, request.person_state].filter(Boolean).join(', ');
  return cityState || request.person_location;
}

function statusContent(request: UrgentRequest) {
  if (request.status === 'case_created') return {
    eyebrow: 'CARE RECORD READY',
    heading: 'A funeral home created the care record.',
    body: 'You can now follow updates, decisions, messages, and next steps in the shared care record.',
  };
  if (request.status === 'claimed') return {
    eyebrow: 'A FUNERAL HOME IS RESPONDING',
    heading: 'A funeral home has taken responsibility for the next step.',
    body: 'They can review the contact details you shared and create a care record. You do not need to submit this request again.',
  };
  if (request.status === 'self_handling') return {
    eyebrow: 'SAVED PRIVATELY',
    heading: 'This older request was saved for your records.',
    body: 'It was not placed in the funeral-home response queue. If help is still needed, start a new immediate-help request.',
  };
  return {
    eyebrow: 'WAITING FOR A FUNERAL HOME',
    heading: 'Your request is available to funeral homes that can respond.',
    body: `A funeral home serving ${locationLabel(request)} must claim it before a shared care record can begin. You do not need to submit it again.`,
  };
}

export default async function FamilyUrgentRequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const client = await createPassageServerClient();
  if (!client) redirect('/');
  const user = await verifiedUser(client);
  if (!user) redirect(loginPath(`/case/urgent/${requestId}`));

  const result = await client
    .from('urgent_intake_requests')
    .select('id, situation_category, person_name, person_location, person_city, person_state, person_timing, coordinator_name, coordinator_phone, coordinator_email, callback_notes, status, submitted_at, claimed_at, case_created_at, workflow_id')
    .eq('id', requestId)
    .eq('requester_user_id', user.id)
    .maybeSingle();

  if (result.error || !result.data) notFound();
  const request = result.data as UrgentRequest;
  const status = statusContent(request);

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}>
        <Link className={styles.wordmark} href="/">PASSAGE</Link>
        <nav aria-label="Account" className={styles.accountNav}>
          <Link href="/case">Family dashboard</Link>
          <Link href="/account/billing">Plan &amp; billing</Link>
        </nav>
      </header>

      <div className={styles.detailPage}>
        <Link className={styles.backLink} href="/case">← Back to your family dashboard</Link>

        <header className={`${styles.detailHero} ${styles.urgentDetailHero}`}>
          <div>
            <p className={styles.eyebrow}>HELP NEEDED NOW</p>
            <h1>Request for {request.person_name}</h1>
            <p>Submitted {formatTime(request.submitted_at)}</p>
          </div>
          <strong>{status.eyebrow}</strong>
        </header>

        <section className={styles.nextStep} aria-labelledby="next-step-heading">
          <p className={styles.eyebrow}>WHAT HAPPENS NEXT</p>
          <h2 id="next-step-heading">{status.heading}</h2>
          <p>{status.body}</p>
          {request.workflow_id && <Link className={styles.urgentAction} href={`/case/${request.workflow_id}/today`}>Open the care record</Link>}
          {request.status === 'self_handling' && <Link className={styles.urgentAction} href="/start">Get help now</Link>}
        </section>

        <div className={styles.detailGrid}>
          <section className={styles.detailPanel} aria-labelledby="request-details-heading">
            <p className={styles.eyebrow}>WHAT YOU SENT</p>
            <h2 id="request-details-heading">Request details</h2>
            <dl className={styles.detailFacts}>
              <div><dt>Situation</dt><dd>{humanSituationCategory(request.situation_category as Parameters<typeof humanSituationCategory>[0])}</dd></div>
              <div><dt>Where</dt><dd>{request.person_location}</dd></div>
              {request.person_timing && <div><dt>Timing</dt><dd>{request.person_timing}</dd></div>}
              <div><dt>Family contact</dt><dd>{request.coordinator_name}</dd></div>
              {request.coordinator_phone && <div><dt>Phone</dt><dd>{request.coordinator_phone}</dd></div>}
              {request.coordinator_email && <div><dt>Email</dt><dd>{request.coordinator_email}</dd></div>}
              {request.callback_notes && <div><dt>Notes</dt><dd>{request.callback_notes}</dd></div>}
            </dl>
          </section>

          <section className={styles.detailPanel} aria-labelledby="proof-heading">
            <p className={styles.eyebrow}>SAVED PROOF</p>
            <h2 id="proof-heading">What Passage recorded</h2>
            <ol className={styles.receiptList}>
              <li><strong>Request submitted</strong><span>{formatTime(request.submitted_at)}</span></li>
              {request.claimed_at && <li><strong>Funeral home responded</strong><span>{formatTime(request.claimed_at)}</span></li>}
              {request.case_created_at && <li><strong>Care record created</strong><span>{formatTime(request.case_created_at)}</span></li>}
            </ol>
          </section>
        </div>

        <section className={styles.visibilityNote} aria-labelledby="visibility-heading">
          <div><p className={styles.eyebrow}>WHO CAN SEE THIS</p><h2 id="visibility-heading">Your family and funeral homes available to respond.</h2></div>
          <p>The contact and situation details above are used only to respond to this request. If something is wrong or circumstances changed, <Link href="/contact">contact Passage</Link>.</p>
        </section>
      </div>
    </main>
  );
}
