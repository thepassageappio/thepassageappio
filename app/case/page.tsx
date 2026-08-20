import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifiedUser } from '@/lib/auth/session';
import { loginPath } from '@/lib/auth/redirects';
import { createPassageServerClient } from '@/lib/supabase/server';
import { CreateEstateForm, InviteAcrossHouseholdForm } from './EstateActions';
import styles from './CaseOverview.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type WorkflowRow = {
  id: string;
  mode: string | null;
  name: string | null;
  organization_id: string | null;
  path: string | null;
  person_name: string | null;
  phase: string | null;
  seat_index: number | null;
  status: string;
};

type UrgentRequestRow = {
  id: string;
  person_name: string;
  status: string;
  submitted_at: string;
  workflow_id: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Planning started',
  planning_active: 'Planning started',
  coordination_active: 'Care in progress',
  submitted: 'Waiting for a funeral home',
  claimed: 'A funeral home is responding',
  case_created: 'Care record created',
  completed: 'Completed',
  ready: 'Ready',
};

function readableStatus(value: string | null) {
  if (!value) return 'In progress';
  return STATUS_LABELS[value] ?? value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function planningLabel(workflow: WorkflowRow, index: number) {
  const personName = workflow.person_name?.trim();
  if (personName) return personName;
  const recordName = workflow.name?.trim();
  if (recordName && !['My family record', 'Untitled estate'].includes(recordName)) return recordName;
  return `Planning record ${workflow.seat_index ?? index + 1}`;
}

export default async function CaseIndexPage() {
  const client = await createPassageServerClient();
  if (!client) redirect('/');
  const user = await verifiedUser(client);
  if (!user) redirect(loginPath('/case'));

  const [workflowsResult, slotsResult, urgentResult] = await Promise.all([
    client.from('workflows').select('id, mode, name, organization_id, path, person_name, phase, seat_index, status').eq('user_id', user.id).order('seat_index', { ascending: true, nullsFirst: true }),
    client.rpc('active_estate_slots'),
    client.from('urgent_intake_requests').select('id, person_name, status, submitted_at, workflow_id').eq('requester_user_id', user.id).order('submitted_at', { ascending: false }),
  ]);

  const workflows = (workflowsResult.data ?? []) as WorkflowRow[];
  const planningRecords = workflows.filter((workflow) => workflow.organization_id === null && (workflow.path === 'green' || workflow.mode === 'green'));
  const careRecords = workflows.filter((workflow) => workflow.organization_id !== null || workflow.path === 'red' || workflow.mode === 'red');
  const urgentRequests = (urgentResult.data ?? []) as UrgentRequestRow[];
  const slots = typeof slotsResult.data === 'number' ? slotsResult.data : 1;

  if (planningRecords.length === 0 && careRecords.length === 0 && urgentRequests.length === 0) redirect('/case/start');

  const canAddAnother = planningRecords.length < slots;
  const linkedUrgentWorkflowIds = new Set(urgentRequests.map((request) => request.workflow_id).filter(Boolean));
  const additionalCareRecords = careRecords.filter((record) => !linkedUrgentWorkflowIds.has(record.id));

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}>
        <Link className={styles.wordmark} href="/">PASSAGE</Link>
        <nav aria-label="Account" className={styles.accountNav}>
          <Link href="/account/billing">Plan &amp; billing</Link>
          <form action="/auth/signout" method="post"><button type="submit">Sign out</button></form>
        </nav>
      </header>

      <div className={styles.overview}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>YOUR FAMILY</p>
            <h1>Choose what you need today.</h1>
            <p>Planning ahead and immediate help are different kinds of work. Passage keeps them separate here so you can continue without sorting through one mixed list.</p>
          </div>
          <Link className={styles.billingLink} href="/account/billing">Review plan &amp; billing</Link>
        </section>

        <section className={`${styles.lane} ${styles.planningLane}`} aria-labelledby="planning-records-title">
          <div className={styles.laneHeading}>
            <div><p>PLANNING AHEAD</p><h2 id="planning-records-title">Plans for the future</h2><span>Wishes, documents, people, and next steps before they are urgent.</span></div>
            <strong>{planningRecords.length} record{planningRecords.length === 1 ? '' : 's'}</strong>
          </div>

          {planningRecords.length > 0 ? (
            <ul className={styles.recordGrid}>
              {planningRecords.map((workflow, index) => (
                <li className={styles.recordCard} key={workflow.id}>
                  <div><span>{workflow.person_name ? readableStatus(workflow.phase || workflow.status) : 'Needs a name'}</span><h3>{planningLabel(workflow, index)}</h3><p>{workflow.person_name ? 'Private family planning record' : 'Open this record and add who the plan is for.'}</p></div>
                  <Link href={`/case/${workflow.id}/today`}>Continue planning →</Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyCard}><h3>No planning record yet.</h3><p>Start one when you are ready. Urgent requests stay separate below.</p><Link href="/case/start">Start planning</Link></div>
          )}

          <div className={styles.capacityBar}>
            <div><strong>{planningRecords.length} existing · {slots} included with the current plan</strong><span>Existing records remain available. The plan limit only controls whether another can be created.</span></div>
            {!canAddAnother && <Link href="/account/billing">Manage plan</Link>}
          </div>

          {canAddAnother && <details className={styles.management}><summary>Add another planning record</summary><div><CreateEstateForm requestId={randomUUID()} /></div></details>}
          {planningRecords.length > 0 && (
            <details className={styles.management}>
              <summary>Invite family or a trusted person</summary>
              <div>
                <p className={styles.managementIntro}>Choose only the planning records this person should be able to see.</p>
                <InviteAcrossHouseholdForm estates={planningRecords.map((workflow, index) => ({ workflowId: workflow.id, personLabel: planningLabel(workflow, index), requestId: randomUUID() }))} />
              </div>
            </details>
          )}
        </section>

        <section className={`${styles.lane} ${styles.urgentLane}`} aria-labelledby="urgent-records-title">
          <div className={styles.laneHeading}>
            <div><p>HELP NEEDED NOW</p><h2 id="urgent-records-title">Immediate-help requests</h2><span>Requests sent for a funeral home to claim and coordinate.</span></div>
            <strong>{urgentRequests.length} request{urgentRequests.length === 1 ? '' : 's'}</strong>
          </div>

          {urgentRequests.length > 0 ? (
            <ul className={styles.recordGrid}>
              {urgentRequests.map((request) => (
                <li className={styles.recordCard} key={request.id}>
                  <div><span>{readableStatus(request.status)}</span><h3>{request.person_name}</h3><p>Submitted {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(request.submitted_at))}</p></div>
                  <Link href={`/case/urgent/${request.id}`}>{request.workflow_id ? 'View request and care record' : 'View request'} →</Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyCard}><h3>No immediate-help requests.</h3><p>If someone has just died, Passage will give you one clear next step.</p></div>
          )}
          {additionalCareRecords.length > 0 && (
            <details className={`${styles.management} ${styles.careHistory}`}>
              <summary>Care records shared by funeral homes ({additionalCareRecords.length})</summary>
              <div><ul className={styles.recordGrid}>
                {additionalCareRecords.map((workflow) => (
                  <li className={styles.recordCard} key={workflow.id}>
                    <div><span>{readableStatus(workflow.phase || workflow.status)}</span><h3>{workflow.person_name?.trim() || 'Family care record'}</h3><p>Coordinated with a funeral home</p></div>
                    <Link href={`/case/${workflow.id}/today`}>Open care record →</Link>
                  </li>
                ))}
              </ul></div>
            </details>
          )}
          <Link className={styles.urgentAction} href="/start">Get help right now</Link>
        </section>
      </div>
    </main>
  );
}
