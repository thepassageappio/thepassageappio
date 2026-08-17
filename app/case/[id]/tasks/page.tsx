import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loadFamilyTaskList, type FamilyTaskListResult } from '@/lib/family/case-view';
import { loginPath } from '@/lib/auth/redirects';
import { humanTaskStatus, humanizePreviewLabel } from '@/lib/presentation/plain-language';
import styles from '../../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FAMILY_NAV = [
  { segment: 'today', label: 'Today', available: true },
  { segment: 'decisions', label: 'Decisions', available: false },
  { segment: 'tasks', label: 'Tasks', available: true },
  { segment: 'messages', label: 'Messages', available: true },
  { segment: 'service', label: 'Service', available: false },
  { segment: 'costs', label: 'Costs', available: false },
] as const;

export default async function FamilyCaseTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result: FamilyTaskListResult = await loadFamilyTaskList(id);
  if (!result.ok) {
    if (result.reason === 'signed-out') redirect(loginPath(`/case/${id}/tasks`));
    return <Closed reason={result.reason} />;
  }
  const { personName, items } = result.data;
  const openItems = items.filter((item) => item.status !== 'completed');
  const completedItems = items.filter((item) => item.status === 'completed');

  return (
    <main id="main-content">
      <nav aria-label="Your case" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20 }}>
        {FAMILY_NAV.map((item) => (
          item.available
            ? <Link key={item.segment} aria-current={item.segment === 'tasks' ? 'page' : undefined} href={`/case/${id}/${item.segment}`} style={{ padding: '8px 12px', fontWeight: 780, fontSize: 13 }}>{item.label}</Link>
            : <span key={item.segment} aria-disabled="true" style={{ padding: '8px 12px', fontWeight: 780, fontSize: 13, color: 'var(--muted)' }} title="Not available yet">{item.label}</span>
        ))}
      </nav>
      <header className={styles.hero}>
        <div>
          <p>Every step on this case</p>
          <h1>{humanizePreviewLabel(personName ?? '', 'Your family record')}</h1>
        </div>
      </header>

      <section className={styles.panel} aria-labelledby="open-tasks-heading">
        <p className={styles.eyebrow}>Open</p>
        <h2 id="open-tasks-heading">What&apos;s still happening.</h2>
        {openItems.length === 0 ? <p>Nothing open right now.</p> : (
          <ol className={styles.history}>
            {openItems.map((item) => (
              <li key={item.id}>
                <p>
                  {item.kind === 'vendor_request' && <span aria-hidden="true">🤝 </span>}
                  <strong>{humanizePreviewLabel(item.title ?? '', 'Case step')}</strong> <span className={styles.status} data-state={item.status}>{humanTaskStatus(item.status)}</span>
                </p>
                <p>{item.statusSummary} {item.ownerLabel} is on this.</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {completedItems.length > 0 && (
        <section className={styles.panel} aria-labelledby="done-tasks-heading" style={{ marginTop: 18 }}>
          <p className={styles.eyebrow}>Complete</p>
          <h2 id="done-tasks-heading">What&apos;s already been handled.</h2>
          <ol className={styles.history}>
            {completedItems.map((item) => (
              <li key={item.id}><p>{humanizePreviewLabel(item.title ?? '', 'Case step')} — complete.</p></li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}

function Closed({ reason }: { reason: 'not-found' | 'not-authorized' | 'unavailable' | 'participant-not-supported' }) {
  const message = reason === 'not-authorized'
    ? 'This case is not available to your account.'
    : reason === 'not-found'
      ? 'This case could not be found.'
      : reason === 'participant-not-supported'
        ? 'The full task list isn’t available for invited access yet. Check Today for what’s currently happening.'
        : 'Passage could not open this case right now.';
  return (
    <main className={styles.closed} id="main-content">
      <h1>{message}</h1>
      <p>Nothing changed, and no case details were shown.</p>
      <Link href="../today">Back to Today</Link>
    </main>
  );
}
