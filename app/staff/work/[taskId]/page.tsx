import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { displayMember, formatOperationalTime, loadHostedOperations } from '@/lib/operations/hosted';
import { humanAudience, humanProofType, humanizePreviewIdentity, humanizePreviewLabel, humanizeSavedReason, humanTaskStatus } from '@/lib/presentation/plain-language';
import { ProofSubmissionForm } from './ProofSubmissionForm';
import styles from '../../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StaffWorkPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const result = await loadHostedOperations({ proofs: true });
  if (!result.ok) return <Closed />;
  const { viewer, workflows, tasks, members, proofs, proofReviews } = result.data;
  const task = tasks.find((candidate) => candidate.id === taskId);
  if (!task) return <Closed />;
  const workflow = workflows.find((candidate) => candidate.id === task.workflow_id);
  if (!workflow) return <Closed />;
  const owner = members.find((member) => member.id === task.assigned_organization_member_id);
  const taskProofs = proofs.filter((proof) => proof.task_id === task.id);
  const reviewByProof = new Map(proofReviews.filter((review) => review.task_id === task.id).map((review) => [review.proof_id, review]));
  const latestProof = taskProofs.at(-1);
  const latestReview = latestProof ? reviewByProof.get(latestProof.id) : undefined;
  const needsReplacement = latestReview?.decision === 'needs_replacement';
  const canSubmit = task.status === 'in_progress' && (!latestProof || needsReplacement);

  const ownerName = humanizePreviewIdentity(displayMember(owner), owner?.role);
  const taskTitle = humanizePreviewLabel(task.title ?? '', 'Assigned commitment');
  const replacementReason = humanizeSavedReason(latestReview?.reason ?? null, 'Please review the latest request and replace the proof.');

  return (
    <AppFrame active="staff" identity={humanizePreviewIdentity(viewer.displayName, viewer.role)} mode="verified" role={`Staff · ${humanizePreviewLabel(viewer.organizationName, 'Your organization')}`}>
      <Link className={styles.backLink} href="/staff">← My work</Link>
      <ol aria-label="Case Room sections" className={styles.orientation}><li data-active="true">Now</li><li>Tasks</li><li>Proof</li></ol>
      <header className={styles.hero}><div><p>{humanizePreviewLabel(workflow.case_reference ?? '', 'Authorized case')} · {humanizePreviewLabel(viewer.locations.find((location) => location.id === workflow.organization_location_id)?.name ?? '', 'Authorized location')}</p><h1>{taskTitle}</h1><span>Only your current assignment and its proof history are shown.</span></div><strong className={styles.status} data-state={task.status}>{humanTaskStatus(task.status)}</strong></header>
      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby="now-heading">
          <p className={styles.eyebrow}>Now</p>
          <h2 id="now-heading">{task.status === 'completed' ? 'Verified — task complete.' : task.status === 'proof_submitted' ? 'Waiting for director review.' : needsReplacement ? 'Submit replacement proof.' : task.status === 'blocked' ? 'Ask your director for help.' : task.status === 'assigned' ? 'Start this work from My work.' : 'Complete the work, then save proof.'}</h2>
          <p>{task.status === 'proof_submitted' ? 'Your submitted proof is saved and cannot be edited or deleted.' : task.status === 'completed' ? 'The proof and director verification remain in history.' : 'Passage will save a receipt and send the proof to an authorized director for review.'}</p>
          {needsReplacement && <div className={styles.reason}><strong>Replacement requested</strong><span>{replacementReason}</span><span>Your earlier proof stays in history. Submit a new proof that addresses this request.</span></div>}
          {canSubmit && <ProofSubmissionForm requestId={randomUUID()} supersedesProofId={needsReplacement ? latestProof?.id : undefined} taskId={task.id} version={task.version} />}
          {task.status === 'proof_submitted' && latestProof && <ProofReceipt proof={latestProof} submitter={humanizePreviewIdentity(displayMember(members.find((member) => member.id === latestProof.submitted_by_organization_member_id)), 'staff')} />}
          {task.status === 'completed' && latestProof && <ProofReceipt proof={latestProof} submitter={humanizePreviewIdentity(displayMember(members.find((member) => member.id === latestProof.submitted_by_organization_member_id)), 'staff')} verified />}
        </section>
        <aside className={styles.panel} aria-labelledby="facts-heading"><p className={styles.eyebrow}>Task facts</p><h2 id="facts-heading">What this step carries.</h2><dl className={styles.facts}><div><dt>Owner</dt><dd>{ownerName}</dd></div><div><dt>Waiting party</dt><dd>{humanizePreviewLabel(task.waiting_party ?? '', 'Nobody recorded')}</dd></div><div><dt>Due</dt><dd>{formatOperationalTime(task.due_at)}</dd></div><div><dt>Audience</dt><dd>{humanAudience(task.audience)}</dd></div><div><dt>Passage prepared</dt><dd>{humanizePreviewLabel(task.prepared_output ?? '', 'No prepared output')}</dd></div><div><dt>What you do</dt><dd>{humanizePreviewLabel(task.human_action ?? '', 'Complete the assigned work')}</dd></div><div><dt>Proof is saved in</dt><dd>{humanizePreviewLabel(task.proof_destination ?? '', 'This task’s proof history')}</dd></div><div><dt>Next action</dt><dd>{task.status === 'blocked' ? 'Ask your director to clear the blocker' : task.status === 'assigned' ? 'Return to My work and start the task' : 'Director reviews submitted proof'}</dd></div></dl></aside>
      </div>
      <section className={styles.panel} aria-labelledby="history-heading" style={{ marginTop: 18 }}><p className={styles.eyebrow}>Proof</p><h2 id="history-heading">Proof and replacement history.</h2>{taskProofs.length === 0 ? <p>No proof has been submitted.</p> : <ol className={styles.history}>{taskProofs.map((proof) => { const review = reviewByProof.get(proof.id); const reason = humanizeSavedReason(review?.reason ?? null, 'Please replace this proof with a clearer or corrected submission.'); return <li key={proof.id}><h3>{review?.decision === 'verified' ? 'Proof verified — task complete' : review?.decision === 'needs_replacement' ? 'Replacement requested' : 'Proof submitted for review'}</h3><p>{humanizePreviewLabel(proof.completion_summary, 'Proof summary available')}</p>{proof.reference && <p>Reference: {humanizePreviewLabel(proof.reference, 'Work reference saved')}</p>}<small>{humanProofType(proof.proof_type)} · submitted {formatOperationalTime(proof.submitted_at)}{proof.supersedes_proof_id ? ' · replaces prior proof' : ''}</small>{reason && <p>Director request: {reason}</p>} {review && <small>{review.decision === 'verified' ? 'Verified' : 'Reviewed'} {formatOperationalTime(review.reviewed_at)}</small>}</li>; })}</ol>}</section>
    </AppFrame>
  );
}

function ProofReceipt({ proof, submitter, verified = false }: { proof: { completion_summary: string; proof_type: string; reference: string | null; submitted_at: string }; submitter: string; verified?: boolean }) {
  return <div className={styles.receipt} role="status"><h3>{verified ? 'Verified — task complete.' : 'Waiting for director review.'}</h3><p>{humanizePreviewLabel(proof.completion_summary, 'Proof summary available')}</p>{proof.reference && <p>Reference: {humanizePreviewLabel(proof.reference, 'Work reference saved')}</p>}<small>{humanProofType(proof.proof_type)} · submitted by {submitter} · {formatOperationalTime(proof.submitted_at)} · visible to the authorized case team</small></div>;
}

function Closed() {
  return <main className={styles.closed} id="main-content"><h1>This work is not available to your account.</h1><p>Nothing changed, and no task details were shown. Return to My work or ask a director to confirm your assignment.</p><Link href="/staff">Return to My work</Link></main>;
}
