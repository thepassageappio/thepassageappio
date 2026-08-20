import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loadFamilyTaskList, type FamilyTaskListResult } from '@/lib/family/case-view';
import { loginPath } from '@/lib/auth/redirects';
import { setFamilyTaskCompletion } from '@/lib/family/task-actions';
import { humanTaskStatus, humanizePreviewLabel } from '@/lib/presentation/plain-language';
import { TaskCompletionToggle } from '@/components/family/TaskCompletionToggle';
import { CreateFamilyTaskForm } from '@/components/family/CreateFamilyTaskForm';
import { CaseNav } from '@/components/family/CaseNav';
import { InviteToEstateForm } from '../../EstateActions';
import styles from '../../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FamilyCaseTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result: FamilyTaskListResult = await loadFamilyTaskList(id);
  if (!result.ok) {
    if (result.reason === 'signed-out') redirect(loginPath(`/case/${id}/tasks`));
    return <Closed reason={result.reason} />;
  }
  const { personName, items, isSelfServe, isElevatedParticipant } = result.data;
  const openItems = items.filter((item) => item.status !== 'completed');
  const completedItems = items.filter((item) => item.status === 'completed');
  const canCreateTasks = isSelfServe || isElevatedParticipant;

  return (
    <main id="main-content">
      <CaseNav active="tasks" caseId={id} planning={isSelfServe} />
      <header className={styles.hero}>
        <div>
          <p>{isSelfServe ? 'Your planning checklist' : 'Every step on this case'}</p>
          <h1>{isSelfServe ? `${humanizePreviewLabel(personName ?? '', 'Your plan')} · what to work on next` : humanizePreviewLabel(personName ?? '', 'Your family record')}</h1>
        </div>
      </header>

      {canCreateTasks && (
        <section className={styles.panel} aria-labelledby="add-step-heading">
          <p className={styles.eyebrow}>{isSelfServe ? 'Make it yours' : 'Add a step'}</p>
          <h2 id="add-step-heading">{isSelfServe ? 'Add something you want to plan.' : 'Something else that needs doing?'}</h2>
          <CreateFamilyTaskForm requestId={randomUUID()} workflowId={id} />
        </section>
      )}

      {isElevatedParticipant && (
        <section className={styles.panel} aria-labelledby="invite-heading" style={{ marginTop: 18 }}>
          <p className={styles.eyebrow}>Executor / POA authority</p>
          <h2 id="invite-heading">Invite someone else to this case.</h2>
          <InviteToEstateForm personLabel={humanizePreviewLabel(personName ?? '', 'this case')} requestId={randomUUID()} workflowId={id} />
        </section>
      )}

      <section className={styles.panel} aria-labelledby="open-tasks-heading">
        <p className={styles.eyebrow}>{isSelfServe ? 'Next' : 'Open'}</p>
        <h2 id="open-tasks-heading">{isSelfServe ? 'Work through these at your own pace.' : 'What\'s still happening.'}</h2>
        {openItems.length === 0 ? <p>Nothing open right now.</p> : (
          <ol className={styles.history}>
            {openItems.map((item) => (
              <li key={item.id}>
                <p>
                  {item.kind === 'vendor_request' && <span aria-hidden="true">🤝 </span>}
                  <strong>{humanizePreviewLabel(item.title ?? '', 'Case step')}</strong> <span className={styles.status} data-state={item.status}>{humanTaskStatus(item.status)}</span>
                </p>
                <p>{item.statusSummary}{!isSelfServe && ` ${item.ownerLabel} is on this.`}</p>
                {item.version !== null && (
                  <TaskCompletionToggle
                    action={setFamilyTaskCompletion}
                    completed={false}
                    requestId={randomUUID()}
                    taskId={item.id}
                    version={item.version}
                    workflowId={id}
                  />
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {completedItems.length > 0 && (
        <section className={styles.panel} aria-labelledby="done-tasks-heading" style={{ marginTop: 18 }}>
          <p className={styles.eyebrow}>Complete</p>
          <h2 id="done-tasks-heading">{isSelfServe ? 'What you have already planned.' : 'What\'s already been handled.'}</h2>
          <ol className={styles.history}>
            {completedItems.map((item) => (
              <li key={item.id}>
                <p>{humanizePreviewLabel(item.title ?? '', 'Case step')} — complete.</p>
                {item.version !== null && (
                  <TaskCompletionToggle
                    action={setFamilyTaskCompletion}
                    completed={true}
                    requestId={randomUUID()}
                    taskId={item.id}
                    version={item.version}
                    workflowId={id}
                  />
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}

function Closed({ reason }: { reason: 'not-found' | 'not-authorized' | 'unavailable' }) {
  const message = reason === 'not-authorized'
    ? 'This case is not available to your account.'
    : reason === 'not-found'
      ? 'This case could not be found.'
      : 'Passage could not open this case right now.';
  return (
    <main className={styles.closed} id="main-content">
      <h1>{message}</h1>
      <p>Nothing changed, and no case details were shown.</p>
      <Link href="../today">Back to Today</Link>
    </main>
  );
}
