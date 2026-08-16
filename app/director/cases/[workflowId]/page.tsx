import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { displayMember, formatOperationalTime, loadHostedOperations } from '@/lib/operations/hosted';
import { formatPartnerAmount, formatPartnerTime, humanPartnerCategory, humanPartnerRequestStatus, loadPartnerContextForWorkflow } from '@/lib/partner/hosted';
import { loadWorkflowMessages } from '@/lib/messaging/hosted';
import { postWorkflowMessage } from '@/lib/messaging/actions';
import { humanAudience, humanProofType, humanizePreviewIdentity, humanizePreviewLabel, humanizeSavedReason, humanTaskStatus, humanWorkflowPhase } from '@/lib/presentation/plain-language';
import { createPassageServerClient } from '@/lib/supabase/server';
import { MessageThread } from '@/components/messaging/MessageThread';
import { FamilyInvitationForm } from './FamilyInvitationForm';
import { CreatePartnerRequestForm, VerifyPartnerRequestForm } from './PartnerRequestForms';
import { ProofReviewForms } from './ProofReviewForms';
import styles from '../../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DirectorCasePage({ params, searchParams }: { params: Promise<{ workflowId: string }>; searchParams: Promise<{ task?: string }> }) {
  const [{ workflowId }, query] = await Promise.all([params, searchParams]);
  const result = await loadHostedOperations({ proofs: true });
  if (!result.ok) return <Closed />;
  const { viewer, workflows, tasks, members, proofs, proofReviews } = result.data;
  const workflow = workflows.find((candidate) => candidate.id === workflowId);
  if (!workflow) return <Closed />;
  const workflowTasks = tasks.filter((task) => task.workflow_id === workflow.id);
  const selectedTask = query.task
    ? workflowTasks.find((task) => task.id === query.task)
    : workflowTasks.find((task) => task.status === 'proof_submitted') ?? workflowTasks[0];
  if (!selectedTask) return <Closed />;
  const taskProofs = proofs.filter((proof) => proof.task_id === selectedTask.id);
  const reviewByProof = new Map(proofReviews.filter((review) => review.task_id === selectedTask.id).map((review) => [review.proof_id, review]));
  const latestProof = taskProofs.at(-1);
  const latestReview = latestProof ? reviewByProof.get(latestProof.id) : undefined;
  const owner = members.find((member) => member.id === selectedTask.assigned_organization_member_id);
  const location = viewer.locations.find((candidate) => candidate.id === workflow.organization_location_id);

  const ownerName = humanizePreviewIdentity(displayMember(owner), owner?.role);
  const submitterName = latestProof ? humanizePreviewIdentity(displayMember(members.find((member) => member.id === latestProof.submitted_by_organization_member_id)), 'staff') : 'Staff member';
  const latestReviewer = latestReview ? humanizePreviewIdentity(displayMember(members.find((member) => member.id === latestReview.reviewed_by_organization_member_id)), 'director') : null;
  const latestReason = humanizeSavedReason(latestReview?.reason ?? null, 'The proof needs a clearer or corrected replacement.');

  // Vendor requests for this case (Batch 2 addition). Loaded separately from
  // loadHostedOperations() since partner_requests/partner_organizations are
  // their own table lineage, not part of the funeral-home operational data set.
  const client = await createPassageServerClient();
  const partnerContext = client ? await loadPartnerContextForWorkflow(client, workflow.id) : { requests: [], partnerOrganizations: [], error: null };
  const messagesResult = client ? await loadWorkflowMessages(client, workflow.id) : { ok: false as const, message: 'Passage could not open this case right now.' };
  // Fix (PR #57 finding): show each vendor's own specialty next to its name in
  // the picker, so a director has an on-screen cue before choosing a category
  // that must match it (enforced authoritatively by the RPC as of this fix).
  const partnerOrganizationOptions = partnerContext.partnerOrganizations.map((organization) => ({
    ...organization,
    categoryLabel: humanPartnerCategory(organization.category),
  }));

  return <AppFrame active="director" identity={humanizePreviewIdentity(viewer.displayName, viewer.role)} mode="verified" role={`${viewer.role === 'owner' ? 'Owner' : 'Director'} · ${humanizePreviewLabel(viewer.organizationName, 'Your organization')}`}>
    <Link className={styles.backLink} href="/director">← Today</Link>
    <ol aria-label="Case Room position" className={styles.orientation}><li>Now</li><li>Tasks</li><li aria-current="step" data-active="true">Proof</li></ol>
    <header className={styles.hero}><div><p>{humanizePreviewLabel(workflow.case_reference ?? '', 'Authorized case')} · {humanizePreviewLabel(location?.name ?? '', 'Managed location')} · {humanWorkflowPhase(workflow.phase)}</p><h1>{humanizePreviewLabel(workflow.person_name ?? '', 'Person withheld')}</h1><span>{humanizePreviewLabel(workflow.family_name ?? '', 'Family')} family · proof review</span></div><strong className={styles.status} data-state={selectedTask.status}>{humanTaskStatus(selectedTask.status)}</strong></header>
    <div className={styles.layout}>
      <section className={styles.panel} id="proof" aria-labelledby="proof-heading"><p className={styles.eyebrow}>Proof</p><h2 id="proof-heading">{selectedTask.status === 'proof_submitted' && latestProof && !latestReview ? 'Proof waiting for review.' : selectedTask.status === 'completed' ? 'Proof verified. Task complete.' : 'No proof is waiting for review.'}</h2><p>{selectedTask.status === 'proof_submitted' ? 'Review the saved submission before changing the task.' : 'The current owner and task status appear below.'}</p>
        {latestProof && <div className={styles.receipt}><h3>{latestReview?.decision === 'needs_replacement' ? 'Replacement requested' : latestReview?.decision === 'verified' ? 'Verified proof' : 'Submitted proof'}</h3><p>{humanizePreviewLabel(latestProof.completion_summary, 'Proof summary available')}</p>{latestProof.reference && <p>Supporting reference: {humanizePreviewLabel(latestProof.reference, 'Reference saved')}</p>}<small>{humanProofType(latestProof.proof_type)} · submitted by {submitterName} · {formatOperationalTime(latestProof.submitted_at)} · {humanAudience(latestProof.audience)}</small>{latestReview && <small>Director decision: {latestReview.decision === 'verified' ? 'Verified' : 'Replacement requested'} by {latestReviewer} · {formatOperationalTime(latestReview.reviewed_at)}</small>}{latestReason && <p>Replacement reason: {latestReason}</p>}</div>}
        {selectedTask.status === 'proof_submitted' && latestProof && !latestReview && <ProofReviewForms proofId={latestProof.id} replacementRequestId={randomUUID()} taskId={selectedTask.id} verifyRequestId={randomUUID()} version={selectedTask.version} workflowId={workflow.id} />}
      </section>
      <aside className={styles.panel} aria-labelledby="now-heading"><p className={styles.eyebrow}>Now · Tasks</p><h2 id="now-heading">{humanizePreviewLabel(selectedTask.title ?? '', 'Assigned commitment')}</h2><dl className={styles.facts}><div><dt>Owner</dt><dd>{ownerName}</dd></div><div><dt>Waiting party</dt><dd>{humanizePreviewLabel(selectedTask.waiting_party ?? '', 'Nobody recorded')}</dd></div><div><dt>Due</dt><dd>{formatOperationalTime(selectedTask.due_at)}</dd></div><div><dt>Audience</dt><dd>{humanAudience(selectedTask.audience)}</dd></div><div><dt>Proof is saved in</dt><dd>{humanizePreviewLabel(selectedTask.proof_destination ?? '', 'This task’s proof history')}</dd></div><div><dt>Next action</dt><dd>{selectedTask.status === 'proof_submitted' ? 'Review the submitted proof' : selectedTask.status === 'completed' ? 'No further action; the task is complete' : selectedTask.status === 'blocked' ? 'Help the owner clear the blocker' : selectedTask.status === 'assigned' ? 'The owner starts the work' : 'The owner completes the work and submits proof'}</dd></div></dl></aside>
    </div>
    <section className={styles.panel} aria-labelledby="history-heading" style={{ marginTop: 18 }}><p className={styles.eyebrow}>Proof history</p><h2 id="history-heading">Saved submission and review history.</h2>{taskProofs.length === 0 ? <p>No proof has been submitted for this task.</p> : <ol className={styles.history}>{taskProofs.map((proof, index) => { const review = reviewByProof.get(proof.id); const reason = humanizeSavedReason(review?.reason ?? null, 'The proof needs a clearer or corrected replacement.'); const reviewer = review ? humanizePreviewIdentity(displayMember(members.find((member) => member.id === review.reviewed_by_organization_member_id)), 'director') : null; const submitter = humanizePreviewIdentity(displayMember(members.find((member) => member.id === proof.submitted_by_organization_member_id)), 'staff'); const replacedIndex = proof.supersedes_proof_id ? taskProofs.findIndex((candidate) => candidate.id === proof.supersedes_proof_id) : -1; const replacedProof = replacedIndex >= 0 ? taskProofs[replacedIndex] : null; return <li key={proof.id}><h3>{review?.decision === 'verified' ? 'Proof verified, task complete' : review?.decision === 'needs_replacement' ? 'Replacement requested' : 'Proof submitted for review'}</h3><p>{humanizePreviewLabel(proof.completion_summary, 'Proof summary available')}</p>{proof.reference && <p>Supporting reference: {humanizePreviewLabel(proof.reference, 'Reference saved')}</p>}<small>Evidence #{index + 1} · submitted by {submitter} · {formatOperationalTime(proof.submitted_at)}</small>{replacedProof && <small>Replaces evidence #{replacedIndex + 1} submitted {formatOperationalTime(replacedProof.submitted_at)}</small>}{reason && <p>Director reason: {reason}</p>}{review && <small>Director decision: {review.decision === 'verified' ? 'Verified' : 'Replacement requested'} by {reviewer} · {formatOperationalTime(review.reviewed_at)}</small>}</li>; })}</ol>}</section>

    <section className={styles.panel} aria-labelledby="vendor-heading" style={{ marginTop: 18 }}>
      <p className={styles.eyebrow}>Vendors</p><h2 id="vendor-heading">Vendor requests for this case.</h2>
      {partnerContext.requests.length === 0 ? <p>No vendor requests have been sent for this case yet.</p> : (
        <ol className={styles.history}>
          {partnerContext.requests.map((request) => (
            <li key={request.id}>
              <h3>{request.title}</h3>
              <p>{humanPartnerCategory(request.category)} · {humanPartnerRequestStatus(request.status)}{request.quote_amount_cents !== null ? ` · ${formatPartnerAmount(request.quote_amount_cents)}` : ''}</p>
              {request.proof_summary && <p>Delivery proof: {request.proof_summary}</p>}
              <small>Sent {formatPartnerTime(request.sent_at)}</small>
              {request.status === 'proof_submitted' && <VerifyPartnerRequestForm partnerRequestId={request.id} requestId={randomUUID()} version={request.version} workflowId={workflow.id} />}
            </li>
          ))}
        </ol>
      )}
      <CreatePartnerRequestForm partnerOrganizations={partnerOrganizationOptions} requestId={randomUUID()} workflowId={workflow.id} />
    </section>

    <section className={styles.panel} aria-labelledby="family-heading" style={{ marginTop: 18 }}>
      <p className={styles.eyebrow}>Family access</p><h2 id="family-heading">Invite a family member to this case.</h2>
      <FamilyInvitationForm requestId={randomUUID()} workflowId={workflow.id} />
    </section>

    <section className={styles.panel} aria-labelledby="messages-heading" style={{ marginTop: 18 }}>
      <p className={styles.eyebrow}>Messages</p><h2 id="messages-heading">Talk with the family on this case.</h2>
      <MessageThread
        loadError={messagesResult.ok ? undefined : messagesResult.message}
        messages={messagesResult.ok ? messagesResult.messages : []}
        postAction={postWorkflowMessage}
        requestId={randomUUID()}
        workflowId={workflow.id}
      />
    </section>
  </AppFrame>;
}

function Closed() { return <main className={styles.closed} id="main-content"><h1>This case is not available to your account.</h1><p>Nothing changed, and no case details were shown. Return to Today or ask an organization owner to confirm your access.</p><Link href="/director">Return to Today</Link></main>; }
