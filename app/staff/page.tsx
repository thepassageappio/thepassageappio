import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { displayMember, formatOperationalTime, loadHostedOperations } from '@/lib/operations/hosted';
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
  const locationById = new Map(viewer.locations.map((location) => [location.id, location.name]));

  return (
    <AppFrame active="staff" identity={viewer.displayName} mode="verified" role={`Staff · ${viewer.organizationName}`}>
      <header className={styles.pageHeading}>
        <div><p>MY WORK / TODAY</p><h1>Only the work assigned to you.</h1><span>Your verified account, location grants, and current assignment must all agree.</span></div>
        <dl><div><dt>Assigned</dt><dd>{tasks.length}</dd></div><div><dt>In progress</dt><dd>{tasks.filter((task) => task.status === 'in_progress').length}</dd></div></dl>
      </header>
      <section className={styles.scopeBand} aria-label="Verified staff scope"><strong>{viewer.displayName}</strong><span>{viewer.locations.map((location) => location.name).join(' · ')}</span><small>{viewer.email} · Staff · assigned work only</small></section>

      {tasks.length === 0 ? (
        <section className={styles.emptyState} role="status"><p>SCOPE PROTECTED</p><h2>No work is assigned to you.</h2><span>New commitments appear only after an authorized director saves ownership.</span></section>
      ) : (
        <section className={styles.workList} aria-labelledby="my-work-title">
          <div className={styles.sectionHeading}><div><p>OWNED BY ME</p><h2 id="my-work-title">Current commitments.</h2></div><span>{tasks.length} assigned</span></div>
          {tasks.map((task) => {
            const workflow = workflowById.get(task.workflow_id);
            const owner = memberById.get(task.assigned_organization_member_id ?? '');
            return (
              <article className={styles.workCard} key={task.id}>
                <div className={styles.cardTop}><span>{workflow?.case_reference ?? 'CASE'} · {locationById.get(workflow?.organization_location_id ?? '') ?? 'Authorized location'}</span><b data-state={task.status}>{task.status.replace('_', ' ')}</b></div>
                <div className={styles.cardBody}>
                  <p>NEXT OWNED COMMITMENT · {formatOperationalTime(task.due_at)}</p><h3>{task.title ?? 'Untitled commitment'}</h3>
                  <dl className={styles.facts}>
                    <div><dt>Owner</dt><dd>{displayMember(owner)}</dd></div>
                    <div><dt>Waiting</dt><dd>{task.waiting_party ?? 'Nobody recorded'}</dd></div>
                    <div><dt>Case boundary</dt><dd>{workflow?.person_name ?? 'Person withheld'} · {workflow?.family_name ?? 'Family'} family</dd></div>
                    <div><dt>Audience</dt><dd>{task.audience}</dd></div>
                    <div><dt>Passage prepared</dt><dd>{task.prepared_output ?? 'No prepared output'}</dd></div>
                    <div><dt>Human action</dt><dd>{task.human_action ?? 'Start the assigned work'}</dd></div>
                    <div><dt>Proof destination</dt><dd>{task.proof_destination ?? 'Organization activity'}</dd></div>
                    <div><dt>Next state</dt><dd>{task.next_state ?? 'In progress'}</dd></div>
                  </dl>
                </div>
                {task.status === 'assigned' ? <StartTaskForm requestId={randomUUID()} taskId={task.id} version={task.version} /> : <div className={styles.commandReceipt} role="status"><strong>Work is in progress.</strong><p>The saved server state is visible to authorized directors in Activity.</p></div>}
              </article>
            );
          })}
        </section>
      )}
    </AppFrame>
  );
}

function Unavailable({ message }: { message: string }) {
  return <main className={styles.closed} id="main-content"><p>SERVER-VERIFIED WORKSPACE</p><h1>We couldn’t verify assigned work.</h1><span>{message} Nothing changed.</span><Link href="/staff">Retry My work</Link></main>;
}
