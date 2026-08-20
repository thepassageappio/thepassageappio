import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { TrialBanner } from '@/components/operations/TrialBanner';
import { AssignTaskForm, CreateCaseForm } from './CommandForms';
import { displayMember, formatOperationalTime, loadHostedOperations } from '@/lib/operations/hosted';
import { humanAudience, humanAutomationLevel, humanizePreviewIdentity, humanizePreviewLabel, humanTaskStatus, humanWorkflowPhase } from '@/lib/presentation/plain-language';
import { createPassageServerClient } from '@/lib/supabase/server';
import styles from '../operations-beta.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type TrialStatusRow = { is_gated: boolean; is_paid: boolean; trial_ends_at: string | null };

export default async function DirectorPage() {
  const result = await loadHostedOperations();
  if (!result.ok) return <Unavailable message={result.message} />;
  const { viewer, workflows, tasks, members, grants } = result.data;
  const client = await createPassageServerClient();
  const adminCheck = client ? await client.rpc('is_platform_admin') : null;
  const isPlatformAdmin = adminCheck?.data === true;
  const trialStatusResult = client ? await client.rpc('organization_trial_status', { p_organization_id: viewer.organizationId }) : null;
  const trialStatus = (trialStatusResult?.data as TrialStatusRow[] | null)?.[0] ?? null;
  const workflowById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
  const memberById = new Map(members.map((member) => [member.id, member]));
  const locationById = new Map(viewer.locations.map((location) => [location.id, humanizePreviewLabel(location.name)]));
  const activeStaff = members.filter((member) => member.role === 'staff' && member.status === 'active');
  const assignedCount = tasks.filter((task) => task.assigned_organization_member_id).length;
  const inProgressCount = tasks.filter((task) => task.status === 'in_progress').length;

  // A director thinks in cases first, tasks second -- "what does the Rivera
  // family need" not "here are 15 tasks in due-time order, go find which
  // family each belongs to." Founder-reported: the flat list made ownership
  // and queue position illegible once more than one case had open work.
  // Grouped by workflow, each group sorted by its own earliest due task, and
  // groups themselves ordered by their most urgent task so nothing overdue
  // gets buried under a case with no near-term deadlines.
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
    <AppFrame active="director" identity={humanizePreviewIdentity(viewer.displayName, viewer.role)} isPlatformAdmin={isPlatformAdmin} mode="verified" role={`${viewer.role === 'owner' ? 'Owner' : 'Director'} · ${humanizePreviewLabel(viewer.organizationName)}`}>
      {trialStatus && <TrialBanner isGated={trialStatus.is_gated} isPaid={trialStatus.is_paid} trialEndsAt={trialStatus.trial_ends_at} />}
      <header className={styles.pageHeading}>
        <div><p>DIRECTOR / TODAY</p><h1>What needs your attention today?</h1><span>See unassigned work, who is waiting, and what your team needs to do next.</span></div>
        <dl><div><dt>Active</dt><dd>{tasks.filter((task) => task.status !== 'completed').length}</dd></div><div><dt>Assigned</dt><dd>{assignedCount}</dd></div><div><dt>In progress</dt><dd>{inProgressCount}</dd></div></dl>
      </header>

      <section className={styles.scopeBand} aria-label="Verified workspace scope">
        <strong>{humanizePreviewLabel(viewer.organizationName)}</strong><span>{viewer.locations.map((location) => humanizePreviewLabel(location.name)).join(' · ')}</span><small>You are signed in as {humanizePreviewIdentity(viewer.displayName, viewer.role)}. Changing this view does not change anyone’s access.</small>
      </section>

      <section className={styles.workList} aria-labelledby="new-case-title" style={{ marginBottom: 18 }}>
        <div className={styles.sectionHeading}><div><p>NEW CASE</p><h2 id="new-case-title">Taking a case by phone, walk-in, or referral?</h2></div></div>
        <CreateCaseForm
          inviteRequestId={randomUUID()}
          locations={viewer.locations.map((location) => ({ id: location.id, name: humanizePreviewLabel(location.name) }))}
          organizationId={viewer.organizationId}
          requestId={randomUUID()}
        />
      </section>

      {tasks.length === 0 ? (
        <section className={styles.emptyState} role="status"><p>TODAY</p><h2>No work needs attention.</h2><span>New work will appear here after it is assigned.</span><Link href="/director/team">Manage team access</Link></section>
      ) : (
        <section className={styles.workList} aria-labelledby="workload-title">
          <div className={styles.sectionHeading}><div><p>ACTIVE CASES</p><h2 id="workload-title">Queue and ownership, by case.</h2></div><span>{caseGroups.length} case{caseGroups.length === 1 ? '' : 's'} · {tasks.length} commitment{tasks.length === 1 ? '' : 's'}</span></div>
          {caseGroups.map(({ workflow, tasks: caseTasks }) => {
            const unassignedCount = caseTasks.filter((task) => !task.assigned_organization_member_id).length;
            return (
              <div className={styles.caseGroup} key={workflow.id}>
                <div className={styles.caseGroupHeader}>
                  <div>
                    <p>{workflow.case_reference ?? 'CASE'} · {locationById.get(workflow.organization_location_id ?? '') ?? 'Authorized location'} · {humanWorkflowPhase(workflow.phase)}</p>
                    <h3>{workflow.family_name ?? 'Family'} family · {workflow.person_name ?? 'Person withheld'}</h3>
                  </div>
                  <div className={styles.caseGroupMeta}>
                    {unassignedCount > 0 && <b>{unassignedCount} unassigned</b>}
                    <Link href={`/director/cases/${workflow.id}`}>Open Case Room →</Link>
                  </div>
                </div>
                {caseTasks.map((task) => {
                  const currentOwner = displayMember(task.assigned_organization_member_id ? memberById.get(task.assigned_organization_member_id) : undefined);
                  const authorizedCandidates = activeStaff.filter((member) => member.id !== task.assigned_organization_member_id && grants.some((grant) => grant.organization_member_id === member.id && grant.organization_location_id === workflow.organization_location_id && !grant.revoked_at));
                  return (
                    <article className={styles.workCard} key={task.id}>
                      <div className={styles.cardTop}><span>{task.assigned_organization_member_id ? 'ASSIGNED' : 'UNASSIGNED'}</span><b data-state={task.status}>{task.assigned_organization_member_id ? humanTaskStatus(task.status) : 'Unassigned'}</b></div>
                      <div className={styles.cardBody}>
                        <h3>{task.title ?? 'Untitled commitment'}</h3>
                        <dl className={styles.facts}>
                          <div><dt>Owner</dt><dd>{currentOwner}</dd></div>
                          <div><dt>Waiting</dt><dd>{task.waiting_party ?? 'Nobody recorded'}</dd></div>
                          <div><dt>Due</dt><dd>{formatOperationalTime(task.due_at)}</dd></div>
                          <div><dt>Visible to</dt><dd>{humanAudience(task.audience)}</dd></div>
                          <div><dt>How Passage helps</dt><dd>{humanAutomationLevel(task.automation_level)}</dd></div>
                          <div><dt>Passage prepared</dt><dd>{task.prepared_output ?? 'No prepared output'}</dd></div>
                          <div><dt>Proof destination</dt><dd>{task.proof_destination ?? 'Organization activity'}</dd></div>
                        </dl>
                      </div>
                      {!['proof_submitted', 'completed'].includes(task.status) && <AssignTaskForm candidates={authorizedCandidates.map((member) => ({ id: member.id, name: displayMember(member) }))} currentOwner={currentOwner} requestId={randomUUID()} taskId={task.id} version={task.version} />}
                      <div className={styles.startForm}><p>Review this task, its submitted proof, and its saved history.</p><Link className={styles.primaryLink} href={`/director/cases/${task.workflow_id}?task=${task.id}#proof`}>Review task</Link></div>
                    </article>
                  );
                })}
              </div>
            );
          })}
        </section>
      )}
    </AppFrame>
  );
}

function Unavailable({ message: _message }: { message: string }) {
  return <main className={styles.closed} id="main-content"><p>DIRECTOR / TODAY</p><h1>We couldn’t load today’s work.</h1><span>No changes were made. Try again.</span><Link href="/director">Reload today’s work</Link></main>;
}
