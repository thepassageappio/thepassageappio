import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { AssignTaskForm } from '@/app/director/CommandForms';
import { displayMember, formatOperationalTime, loadHostedOperations, type HostedTask } from '@/lib/operations/hosted';
import { formatPartnerAmount, formatPartnerTime, humanPartnerCategory, humanPartnerRequestStatus, loadPartnerContextForWorkflow } from '@/lib/partner/hosted';
import { humanAudience, humanProofType, humanizePreviewIdentity, humanizePreviewLabel, humanizeSavedReason, humanTaskOwnerAction, humanTaskStatus, humanWorkflowPhase } from '@/lib/presentation/plain-language';
import { createPassageServerClient } from '@/lib/supabase/server';
import { loadWorkflowMessages } from '@/lib/messaging/hosted';
import { postWorkflowMessage } from '@/lib/messaging/actions';
import { MessageThread } from '@/components/messaging/MessageThread';
import { CreatePartnerRequestForm, VerifyPartnerRequestForm } from './PartnerRequestForms';
import { ProofReviewForms } from './ProofReviewForms';
import styles from '../../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DirectorCasePage({ params, searchParams }: { params: Promise<{ workflowId: string }>; searchParams: Promise<{ task?: string }> }) {
  const [{ workflowId }, query] = await Promise.all([params, searchParams]);
  const result = await loadHostedOperations({ proofs: true });
  if (!result.ok) return <Closed />;
  const { viewer, workflows, tasks, members, grants, proofs, proofReviews } = result.data;
  const workflow = workflows.find((candidate) => candidate.id === workflowId);
  if (!workflow) return <Closed />;

  const workflowTasks = tasks.filter((task) => task.workflow_id === workflow.id);
  const selectedTask = query.task
    ? workflowTasks.find((task) => task.id === query.task)
    : workflowTasks.find((task) => task.status === 'proof_submitted') ?? workflowTasks[0];
  if (query.task && workflowTasks.length > 0 && !selectedTask) return <Closed />;

  const location = viewer.locations.find((candidate) => candidate.id === workflow.organization_location_id);
  const frame = {
    identity: humanizePreviewIdentity(viewer.displayName, viewer.role),
    role: `${viewer.role === 'owner' ? 'Owner' : 'Director'} · ${humanizePreviewLabel(viewer.organizationName, 'Your organization')}`,
  };

  if (!selectedTask) {
    return (
      <AppFrame active="director" identity={frame.identity} mode="verified" role={frame.role}>
        <Link className={styles.backLink} href="/director">← Today</Link>
        <Orientation active="tasks" />
        <header className={styles.hero}>
          <div>
            <p>{humanizePreviewLabel(workflow.case_reference ?? '', 'Authorized case')} · {humanizePreviewLabel(location?.name ?? '', 'Managed location')} · {humanWorkflowPhase(workflow.phase)}</p>
            <h1>{humanizePreviewLabel(workflow.person_name ?? '', 'Person withheld')}</h1>
            <span>{humanizePreviewLabel(workflow.family_name ?? '', 'Family')} family · first task unavailable</span>
          </div>
          <strong className={styles.status} data-state="blocked">Needs attention</strong>
        </header>
        <section className={styles.panel} aria-labelledby="missing-task-heading">
          <p className={styles.eyebrow}>Tasks · Recovery</p>
          <h2 id="missing-task-heading">The case is open, but its first task is unavailable.</h2>
          <p>Nothing is ready to assign. Reload the case. If it is still missing, return to Urgent requests.</p>
          <div className={styles.recoveryActions}>
            <Link href={`/director/cases/${workflow.id}`}>Reload case</Link>
            <Link href="/director/urgent">Return to urgent requests</Link>
          </div>
        </section>
      </AppFrame>
    );
  }

  const taskProofs = proofs.filter((proof) => proof.task_id === selectedTask.id);
  const reviewByProof = new Map(proofReviews.filter((review) => review.task_id === selectedTask.id).map((review) => [review.proof_id, review]));
  const latestProof = taskProofs.at(-1);
  const latestReview = latestProof ? reviewByProof.get(latestProof.id) : undefined;
  const owner = members.find((member) => member.id === selectedTask.assigned_organization_member_id);
  const ownerName = humanizePreviewIdentity(displayMember(owner), owner?.role);
  const isUnassigned = selectedTask.assigned_organization_member_id === null;
  const proofStage = selectedTask.status === 'proof_submitted' || selectedTask.status === 'completed';
  const activeStage = proofStage ? 'proof' : 'tasks';
  const activeStaff = members.filter((member) => member.role === 'staff' && member.status === 'active');
  const authorizedCandidates = activeStaff.filter((member) => (
    member.id !== selectedTask.assigned_organization_member_id
    && grants.some((grant) => (
      grant.organization_member_id === member.id
      && grant.organization_location_id === workflow.organization_location_id
      && !grant.revoked_at
    ))
  ));
  const submitterName = latestProof ? humanizePreviewIdentity(displayMember(members.find((member) => member.id === latestProof.submitted_by_organization_member_id)), 'staff') : 'Staff member';
  const latestReviewer = latestReview ? humanizePreviewIdentity(displayMember(members.find((member) => member.id === latestReview.reviewed_by_organization_member_id)), 'director') : null;
  const latestReason = humanizeSavedReason(latestReview?.reason ?? null, 'The proof needs a clearer or corrected replacement.');

  const client = await createPassageServerClient();
  const partnerContext = client ? await loadPartnerContextForWorkflow(client, workflow.id) : { requests: [], partnerOrganizations: [], error: null };
  const partnerOrganizationOptions = partnerContext.partnerOrganizations.map((organization) => ({
    ...organization,
    categoryLabel: humanPartnerCategory(organization.category),
  }));
  const messagesResult = client
    ? await loadWorkflowMessages(client, workflow.id)
    : { ok: false as const, message: 'Passage could not load messages for this case.' };
  const messageRecoveryHref = query.task
    ? `/director/cases/${workflow.id}?task=${selectedTask.id}#messages`
    : `/director/cases/${workflow.id}#messages`;

  return (
    <AppFrame active="case" identity={frame.identity} mode="verified" role={frame.role}>
      <Link className={styles.backLink} href="/director">← Today</Link>
      <Orientation active={activeStage} />
      <header className={styles.hero}>
        <div>
          <p>{humanizePreviewLabel(workflow.case_reference ?? '', 'Authorized case')} · {humanizePreviewLabel(location?.name ?? '', 'Managed location')} · {humanWorkflowPhase(workflow.phase)}</p>
          <h1>{humanizePreviewLabel(workflow.person_name ?? '', 'Person withheld')}</h1>
          <span>{humanizePreviewLabel(workflow.family_name ?? '', 'Family')} family · {isUnassigned ? 'assignment needed' : selectedTask.status === 'proof_submitted' ? 'proof review' : selectedTask.status === 'completed' ? 'task complete' : 'task in progress'}</span>
        </div>
        <strong className={styles.status} data-state={isUnassigned ? 'unassigned' : selectedTask.status}>{isUnassigned ? 'Unassigned' : humanTaskStatus(selectedTask.status)}</strong>
      </header>

      {isUnassigned ? (
        <div className={styles.layout}>
          <section className={styles.panel} aria-labelledby="assignment-heading">
            <p className={styles.eyebrow}>Tasks · Now</p>
            <h2 id="assignment-heading">Choose who owns the first task.</h2>
            <p>Choose an active team member who can work at {humanizePreviewLabel(location?.name ?? '', 'this location')}. Passage saves the assignment in team activity. Nothing is sent to the family.</p>
            <AssignTaskForm
              assignmentKind="first-task"
              candidates={authorizedCandidates.map((member) => ({ id: member.id, name: displayMember(member) }))}
              currentOwner="Unassigned"
              locationName={humanizePreviewLabel(location?.name ?? '', 'this location')}
              requestId={randomUUID()}
              taskId={selectedTask.id}
              version={selectedTask.version}
              workflowId={workflow.id}
            />
          </section>
          <TaskFacts ownerName="Unassigned" task={selectedTask} />
        </div>
      ) : proofStage ? (
        <div className={styles.layout}>
          <section className={styles.panel} id="proof" aria-labelledby="proof-heading">
            <p className={styles.eyebrow}>Proof</p>
            <h2 id="proof-heading">{selectedTask.status === 'proof_submitted' ? 'Proof waiting for review.' : 'Proof verified — task complete.'}</h2>
            <p>{selectedTask.status === 'proof_submitted' ? latestProof ? 'Review the saved submission before changing the task.' : 'The saved submission could not load. Reload this task before reviewing it.' : 'The director review is saved with this completed task.'}</p>
            {latestProof && <div className={styles.receipt}><h3>{latestReview?.decision === 'needs_replacement' ? 'Replacement requested' : latestReview?.decision === 'verified' ? 'Verified proof' : 'Submitted proof'}</h3><p>{humanizePreviewLabel(latestProof.completion_summary, 'Proof summary available')}</p>{latestProof.reference && <p>Supporting reference: {humanizePreviewLabel(latestProof.reference, 'Reference saved')}</p>}<small>{humanProofType(latestProof.proof_type)} · submitted by {submitterName} · {formatOperationalTime(latestProof.submitted_at)} · {humanAudience(latestProof.audience)}</small>{latestReview && <small>Director decision: {latestReview.decision === 'verified' ? 'Verified' : 'Replacement requested'} by {latestReviewer} · {formatOperationalTime(latestReview.reviewed_at)}</small>}{latestReason && <p>Replacement reason: {latestReason}</p>}</div>}
            {selectedTask.status === 'proof_submitted' && latestProof && !latestReview && <ProofReviewForms proofId={latestProof.id} replacementRequestId={randomUUID()} taskId={selectedTask.id} verifyRequestId={randomUUID()} version={selectedTask.version} workflowId={workflow.id} />}
          </section>
          <TaskFacts ownerName={ownerName} task={selectedTask} />
        </div>
      ) : (
        <div className={styles.layout}>
          <section className={styles.panel} aria-labelledby="task-heading">
            <p className={styles.eyebrow}>Tasks · Now</p>
            <h2 id="task-heading">{humanizePreviewLabel(selectedTask.title ?? '', 'Assigned commitment')}</h2>
            <p>{selectedTask.status === 'blocked' ? 'This commitment is blocked. Help the current owner clear the blocker before work continues.' : selectedTask.status === 'assigned' ? `${ownerName} owns this commitment and starts the work next.` : `${ownerName} is working on this commitment and submits confirmation when it is ready.`}</p>
          </section>
          <TaskFacts ownerName={ownerName} task={selectedTask} />
        </div>
      )}

      {(proofStage || taskProofs.length > 0) && (
        <section className={styles.panel} aria-labelledby="history-heading" style={{ marginTop: 18 }}>
          <p className={styles.eyebrow}>Proof history</p>
          <h2 id="history-heading">Saved submission and review history.</h2>
          {taskProofs.length === 0 ? <p>No proof has been submitted for this task.</p> : <ol className={styles.history}>{taskProofs.map((proof, index) => { const review = reviewByProof.get(proof.id); const reason = humanizeSavedReason(review?.reason ?? null, 'The proof needs a clearer or corrected replacement.'); const reviewer = review ? humanizePreviewIdentity(displayMember(members.find((member) => member.id === review.reviewed_by_organization_member_id)), 'director') : null; const submitter = humanizePreviewIdentity(displayMember(members.find((member) => member.id === proof.submitted_by_organization_member_id)), 'staff'); const replacedIndex = proof.supersedes_proof_id ? taskProofs.findIndex((candidate) => candidate.id === proof.supersedes_proof_id) : -1; const replacedProof = replacedIndex >= 0 ? taskProofs[replacedIndex] : null; return <li key={proof.id}><h3>{review?.decision === 'verified' ? 'Proof verified — task complete' : review?.decision === 'needs_replacement' ? 'Replacement requested' : 'Proof submitted for review'}</h3><p>{humanizePreviewLabel(proof.completion_summary, 'Proof summary available')}</p>{proof.reference && <p>Supporting reference: {humanizePreviewLabel(proof.reference, 'Reference saved')}</p>}<small>Evidence #{index + 1} · submitted by {submitter} · {formatOperationalTime(proof.submitted_at)}</small>{replacedProof && <small>Replaces evidence #{replacedIndex + 1} submitted {formatOperationalTime(replacedProof.submitted_at)}</small>}{reason && <p>Director reason: {reason}</p>}{review && <small>Director decision: {review.decision === 'verified' ? 'Verified' : 'Replacement requested'} by {reviewer} · {formatOperationalTime(review.reviewed_at)}</small>}</li>; })}</ol>}
        </section>
      )}

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

      <section className={styles.panel} id="messages" aria-labelledby="messages-heading" style={{ marginTop: 18 }}>
        <p className={styles.eyebrow}>Messages</p>
        <h2 id="messages-heading">Messages with the family.</h2>
        <MessageThread
          loadError={messagesResult.ok ? undefined : messagesResult.message}
          messages={messagesResult.ok ? messagesResult.messages : []}
          postAction={postWorkflowMessage}
          recoveryHref={messageRecoveryHref}
          requestId={randomUUID()}
          workflowId={workflow.id}
        />
      </section>
    </AppFrame>
  );
}

function Orientation({ active }: { active: 'tasks' | 'proof' }) {
  return <ol aria-label="Case Room position" className={styles.orientation}><li>Now</li><li aria-current={active === 'tasks' ? 'step' : undefined} data-active={active === 'tasks'}>Tasks</li><li aria-current={active === 'proof' ? 'step' : undefined} data-active={active === 'proof'}>Proof</li></ol>;
}

function TaskFacts({ ownerName, task }: { ownerName: string; task: HostedTask }) {
  const nextAction = task.assigned_organization_member_id === null
    ? 'Choose an eligible staff owner'
    : task.status === 'proof_submitted'
      ? 'Review the submitted proof'
      : task.status === 'completed'
        ? 'No further action; the task is complete'
        : task.status === 'blocked'
          ? 'Help the owner clear the blocker'
          : task.status === 'assigned'
            ? 'The owner starts the work'
            : 'The owner completes the work and submits proof';
  return <aside className={styles.panel} aria-labelledby="now-heading"><p className={styles.eyebrow}>Now · Tasks</p><h2 id="now-heading">{humanizePreviewLabel(task.title ?? '', 'Assigned commitment')}</h2><dl className={styles.facts}><div><dt>Owner</dt><dd>{ownerName}</dd></div><div><dt>What the owner does</dt><dd>{humanTaskOwnerAction(task.human_action, 'Complete this commitment')}</dd></div><div><dt>Waiting party</dt><dd>{humanizePreviewLabel(task.waiting_party ?? '', 'Nobody recorded')}</dd></div><div><dt>Due</dt><dd>{formatOperationalTime(task.due_at)}</dd></div><div><dt>Audience</dt><dd>{humanAudience(task.audience)}</dd></div><div><dt>Proof is saved in</dt><dd>{humanizePreviewLabel(task.proof_destination ?? '', 'This task’s proof history')}</dd></div><div><dt>Next action</dt><dd>{nextAction}</dd></div></dl></aside>;
}

function Closed() {
  return <main className={styles.closed} id="main-content"><h1>This case is not available to your account.</h1><p>Nothing changed, and no case details were shown. Return to Today or ask an organization owner to confirm your access.</p><Link href="/director">Return to Today</Link></main>;
}
