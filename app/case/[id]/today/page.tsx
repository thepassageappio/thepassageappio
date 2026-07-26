import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loadFamilyCaseView, type FamilyCaseViewResult } from '@/lib/family/case-view';
import { loginPath } from '@/lib/auth/redirects';
import { humanTaskStatus, humanWorkflowPhase, humanizePreviewLabel } from '@/lib/presentation/plain-language';
import styles from '../../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FAMILY_NAV = [
  { segment: 'today', label: 'Today', available: true },
  { segment: 'decisions', label: 'Decisions', available: false },
  { segment: 'tasks', label: 'Tasks', available: false },
  { segment: 'messages', label: 'Messages', available: false },
  { segment: 'service', label: 'Service', available: false },
  { segment: 'costs', label: 'Costs', available: false },
] as const;

export default async function FamilyCaseTodayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result: FamilyCaseViewResult = await loadFamilyCaseView(id);
  if (!result.ok && result.reason === 'signed-out') redirect(loginPath(`/case/${id}/today`));
  if (!result.ok) return <Closed reason={result.reason} />;
  const { workflow, currentTask, recentUpdates } = result.data;

  return (
    <main id="main-content">
      <nav aria-label="Your case" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20 }}>
        {FAMILY_NAV.map((item) => (
          item.available
            ? <Link key={item.segment} aria-current="page" href={`/case/${id}/${item.segment}`} style={{ padding: '8px 12px', fontWeight: 780, fontSize: 13 }}>{item.label}</Link>
            : <span key={item.segment} aria-disabled="true" style={{ padding: '8px 12px', fontWeight: 780, fontSize: 13, color: 'var(--muted)' }} title="Not available yet">{item.label}</span>
        ))}
      </nav>
      <header className={styles.hero}>
        <div>
          <p>{humanWorkflowPhase(workflow.phase)}</p>
          <h1>{humanizePreviewLabel(workflow.personName ?? '', 'Your family record')}</h1>
          <span>{humanizePreviewLabel(workflow.familyName ?? '', 'Your family')} · what's happening now</span>
        </div>
        {currentTask && <strong className={styles.status} data-state={currentTask.status}>{humanTaskStatus(currentTask.status)}</strong>}
      </header>
      <section className={styles.panel} aria-labelledby="now-heading">
        <p className={styles.eyebrow}>Now</p>
        <h2 id="now-heading">{currentTask ? humanizePreviewLabel(currentTask.title ?? '', 'Current step') : 'Nothing needs your attention right now.'}</h2>
        <p>{currentTask?.lastUpdateSummary ?? 'Passage will show the next update here as soon as there is one.'}</p>
        {currentTask && <p>{currentTask.ownerLabel} is on this.</p>}
      </section>
      <section className={styles.panel} aria-labelledby="updates-heading" style={{ marginTop: 18 }}>
        <p className={styles.eyebrow}>Recent updates</p>
        <h2 id="updates-heading">What's changed.</h2>
        {recentUpdates.length === 0 ? <p>No updates yet.</p> : (
          <ol className={styles.history}>
            {recentUpdates.map((update) => <li key={update.id}><p>{update.summary}</p></li>)}
          </ol>
        )}
      </section>
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
      <p>Nothing changed, and no case details were shown. Ask the funeral home for a new link, or try again.</p>
      <Link href="/">Return home</Link>
    </main>
  );
}
