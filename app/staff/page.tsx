import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { displayMember, formatOperationalTime, loadHostedOperations } from '@/lib/operations/hosted';
import { humanAudience, humanizePreviewIdentity, humanizePreviewLabel, humanNextStep, humanTaskStatus } from '@/lib/presentation/plain-language';
import { StartTaskForm } from './StartTaskForm';
import styles from '../operations-beta.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StaffPage() {
  const result = await loadHostedOperations();
  if (!result.ok) return <Unavailable message={result.message} />;
  const { viewer, workflows, tasks, members } = result.data;
  const workflowById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
  const memberById = new Map(members.map((member) => [member.id, member]));
  const locationById = new Map(viewer.locations.map((location) => [location.id, humanizePreviewLabel(location.name)]));

  // Same grouping as the director's Today view: a staff member working
  // tasks across two or three families needs to see "here's what the Rivera
  // case still needs from me," not a flat due-time list that only names the
  // case in small type on each card.
  const tasksByWorkflow = new Map<string, typeof tasks>();
  for (const task of tasks) {
    const list = tasksByWorkflow.get(task.workflow_id) ?? [];
    list.push(task);
    tasksByWorkflow.set(task.workflow_id, list);
  }
  const dueTime = (task: (typeof tasks)[number]) => (task.due_at ? new Date(task.due_at).getTime() : Number.POSITIVE_INFINITY);
  const caseGroups = [...tasksByWorkflow.entries()]
    .map(([workflowId, workflowTasks]) => ({
      workflow: workflowById.get(workflowId),
      tasks: [...workflowTasks].sort((a, b) => dueTime(a) - dueTime(b)),
    }))
    .filter((group): group is { workflow: NonNullable<typeof group.workflow>; tasks: typeof tasks } => Boolean(group.workflow))
    .sort((a, b) => dueTime(a.tasks[0]) - dueTime(b.tasks[0]));

  return (
    <AppFrame active="staff" identity={humanizePreviewIdentity(viewer.displayName, viewer.role)} mode="verified" role={`Staff · ${humanizePreviewLabel(viewer.organizationName)}`}>
      <header className={styles.pageHeading}>
        <div><p>MY WORK / TODAY</p><h1>Your assigned work.</h1><span>Only work assigned to you appears here. Open one task to see what to do and what to save.</span></div>
        <dl><div><dt>Assigned</dt><dd>{tasks.length}</dd></div><div><dt>In progress</dt><dd>{tasks.filter((task) => task.status === 'in_progress').length}</dd></div></dl>
      </header>
      <section className={styles.scopeBand} aria-label="Verified staff access"><strong>{humanizePreviewIdentity(viewer.displayName, viewer.role)}</strong><span>{viewer.locations.map((location) => humanizePreviewLabel(location.name)).join(' · ')}</span><small>Staff · assigned work only</small></section>

      {tasks.length === 0 ? (
        <section className={styles.emptyState} role="status"><p>MY WORK</p><h2>You don’t have assigned work right now.</h2><span>Your director will see the work here after assigning it to you.</span></section>
      ) : (
        <section className={styles.workList} aria-labelledby="my-work-title">
          <div className={styles.sectionHeading}><div><p>OWNED BY ME</p><h2 id="my-work-title">Current commitments, by case.</h2></div><span>{caseGroups.length} case{caseGroups.length === 1 ? '' : 's'} · {tasks.length} assigned</span></div>
          {caseGroups.map(({ workflow, tasks: caseTasks }) => (
            <div className={styles.caseGroup} key={workflow.id}>
              <div className={styles.caseGroupHeader}>
                <div>
                  <p>{workflow.case_reference ?? 'CASE'} · {locationById.get(workflow.organization_location_id ?? '') ?? 'Authorized location'}</p>
                  <h3>{workflow.family_name ?? 'Family'} family · {workflow.person_name ?? 'Person withheld'}</h3>
                </div>
              </div>
              {caseTasks.map((task) => {
                const owner = memberById.get(task.assigned_organization_member_id ?? '');
                return (
                  <article className={styles.workCard} key={task.id}>
                    <div className={styles.cardTop}><span>DUE {formatOperationalTime(task.due_at)}</span><b data-state={task.status}>{humanTaskStatus(task.status)}</b></div>
                    <div className={styles.cardBody}>
                      <h3>{task.title ?? 'Untitled commitment'}</h3>
                      <dl className={styles.facts}>
                        <div><dt>Owner</dt><dd>{displayMember(owner)}</dd></div>
                        <div><dt>Waiting</dt><dd>{task.waiting_party ?? 'Nobody recorded'}</dd></div>
                        <div><dt>Visible to</dt><dd>{humanAudience(task.audience)}</dd></div>
                        <div><dt>Passage prepared</dt><dd>{task.prepared_output ?? 'No prepared output'}</dd></div>
                        <div><dt>Human action</dt><dd>{task.human_action ?? 'Start the assigned work'}</dd></div>
                        <div><dt>Proof destination</dt><dd>{task.proof_destination ?? 'Organization activity'}</dd></div>
                        <div><dt>Next state</dt><dd>{humanNextStep(task.status)}</dd></div>
                      </dl>
                    </div>
                    {task.status === 'assigned' ? <StartTaskForm requestId={randomUUID()} taskId={task.id} version={task.version} /> : <div className={styles.startForm}><p>{task.status === 'completed' ? 'Verified proof and the complete history are ready.' : task.status === 'proof_submitted' ? 'Proof is waiting for an authorized director.' : task.status === 'blocked' ? 'Blocked. Open the task to clear it once resolved.' : 'Work is in progress. Save proof when the outcome is ready.'}</p><Link className={styles.primaryLink} href={`/staff/work/${task.id}`}>{task.status === 'in_progress' ? 'Open proof step' : 'Open task history'}</Link></div>}
                  </article>
                );
              })}
            </div>
          ))}
        </section>
      )}
    </AppFrame>
  );
}

function Unavailable({ message: _message }: { message: string }) {
  return <main className={styles.closed} id="main-content"><p>MY WORK</p><h1>We couldn’t load your assigned work.</h1><span>No changes were made. Try again.</span><Link href="/staff">Reload My work</Link></main>;
}
