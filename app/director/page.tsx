import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { AssignTaskForm } from './CommandForms';
import { displayMember, formatOperationalTime, loadHostedOperations } from '@/lib/operations/hosted';
import styles from '../operations-beta.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DirectorPage() {
  const result = await loadHostedOperations();
  if (!result.ok) return <Unavailable message={result.message} />;
  const { viewer, workflows, tasks, members, grants } = result.data;
  const workflowById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
  const memberById = new Map(members.map((member) => [member.id, member]));
  const locationById = new Map(viewer.locations.map((location) => [location.id, location.name]));
  const activeStaff = members.filter((member) => member.role === 'staff' && member.status === 'active');
  const assignedCount = tasks.filter((task) => task.assigned_organization_member_id).length;
  const inProgressCount = tasks.filter((task) => task.status === 'in_progress').length;

  return (
    <AppFrame active="director" identity={viewer.displayName} mode="verified" role={`${viewer.role === 'owner' ? 'Owner' : 'Director'} · ${viewer.organizationName}`}>
      <header className={styles.pageHeading}>
        <div><p>OPERATIONS / TODAY</p><h1>What needs attention today.</h1><span>See unowned work, waiting parties, and staff load from the durable location record.</span></div>
        <dl><div><dt>Active</dt><dd>{tasks.filter((task) => task.status !== 'completed').length}</dd></div><div><dt>Assigned</dt><dd>{assignedCount}</dd></div><div><dt>In progress</dt><dd>{inProgressCount}</dd></div></dl>
      </header>

      <section className={styles.scopeBand} aria-label="Verified workspace scope">
        <strong>{viewer.organizationName}</strong><span>{viewer.locations.map((location) => location.name).join(' · ')}</span><small>Location filters change presentation only. Database authority remains server verified.</small>
      </section>

      {tasks.length === 0 ? (
        <section className={styles.emptyState} role="status"><p>WORKLOAD READY</p><h2>No durable work is queued yet.</h2><span>Apply the guarded Cycle 7B synthetic workload fixture after the invitation proof is retained.</span><Link href="/director/team">Open Team</Link></section>
      ) : (
        <section className={styles.workList} aria-labelledby="workload-title">
          <div className={styles.sectionHeading}><div><p>ACTIVE COMMITMENTS</p><h2 id="workload-title">Queue and ownership.</h2></div><span>{tasks.length} shown · ordered by due time</span></div>
          {tasks.map((task) => {
            const workflow = workflowById.get(task.workflow_id);
            const currentOwner = displayMember(task.assigned_organization_member_id ? memberById.get(task.assigned_organization_member_id) : undefined);
            const authorizedCandidates = activeStaff.filter((member) => member.id !== task.assigned_organization_member_id && grants.some((grant) => grant.organization_member_id === member.id && grant.organization_location_id === workflow?.organization_location_id && !grant.revoked_at));
            return (
              <article className={styles.workCard} key={task.id}>
                <div className={styles.cardTop}><span>{workflow?.case_reference ?? 'CASE'} · {locationById.get(workflow?.organization_location_id ?? '') ?? 'Authorized location'}</span><b data-state={task.status}>{task.assigned_organization_member_id ? task.status.replace('_', ' ') : 'unassigned'}</b></div>
                <div className={styles.cardBody}>
                  <p>{workflow?.phase ?? 'Coordinated work'}</p><h3>{task.title ?? 'Untitled commitment'}</h3>
                  <dl className={styles.facts}>
                    <div><dt>Case</dt><dd>{workflow?.family_name ?? 'Family'} family · {workflow?.person_name ?? 'Person withheld'}</dd></div>
                    <div><dt>Owner</dt><dd>{currentOwner}</dd></div>
                    <div><dt>Waiting</dt><dd>{task.waiting_party ?? 'Nobody recorded'}</dd></div>
                    <div><dt>Due</dt><dd>{formatOperationalTime(task.due_at)}</dd></div>
                    <div><dt>Audience</dt><dd>{task.audience}</dd></div>
                    <div><dt>Automation</dt><dd>{task.automation_level.replace('_', ' ')}</dd></div>
                    <div><dt>Passage prepared</dt><dd>{task.prepared_output ?? 'No prepared output'}</dd></div>
                    <div><dt>Proof destination</dt><dd>{task.proof_destination ?? 'Organization activity'}</dd></div>
                  </dl>
                </div>
                <AssignTaskForm candidates={authorizedCandidates.map((member) => ({ id: member.id, name: displayMember(member) }))} currentOwner={currentOwner} requestId={randomUUID()} taskId={task.id} version={task.version} />
              </article>
            );
          })}
        </section>
      )}
    </AppFrame>
  );
}

function Unavailable({ message }: { message: string }) {
  return <main className={styles.closed} id="main-content"><p>SERVER-VERIFIED WORKSPACE</p><h1>We couldn’t verify workload.</h1><span>{message} Nothing changed.</span><Link href="/director">Retry director workspace</Link></main>;
}
