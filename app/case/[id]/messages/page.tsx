import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loadFamilyMessagesView, type FamilyMessagesViewResult } from '@/lib/family/messages-view';
import { loginPath } from '@/lib/auth/redirects';
import { postWorkflowMessage } from '@/lib/messaging/actions';
import { humanizePreviewLabel } from '@/lib/presentation/plain-language';
import { MessageThread } from '@/components/messaging/MessageThread';
import styles from '../../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FAMILY_NAV = [
  { segment: 'today', label: 'Today', available: true },
  { segment: 'decisions', label: 'Decisions', available: false },
  { segment: 'tasks', label: 'Tasks', available: false },
  { segment: 'messages', label: 'Messages', available: true },
  { segment: 'service', label: 'Service', available: false },
  { segment: 'costs', label: 'Costs', available: false },
] as const;

export default async function FamilyCaseMessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result: FamilyMessagesViewResult = await loadFamilyMessagesView(id);
  if (!result.ok) {
    if (result.reason === 'signed-out') redirect(loginPath(`/case/${id}/messages`));
    return <Closed reason={result.reason} />;
  }
  const { personName, familyName, messages } = result.data;

  return (
    <main id="main-content">
      <nav aria-label="Your case" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20 }}>
        {FAMILY_NAV.map((item) => (
          item.available
            ? <Link key={item.segment} aria-current={item.segment === 'messages' ? 'page' : undefined} href={`/case/${id}/${item.segment}`} style={{ padding: '8px 12px', fontWeight: 780, fontSize: 13 }}>{item.label}</Link>
            : <span key={item.segment} aria-disabled="true" style={{ padding: '8px 12px', fontWeight: 780, fontSize: 13, color: 'var(--muted)' }} title="Not available yet">{item.label}</span>
        ))}
      </nav>
      <header className={styles.hero}>
        <div>
          <p>Messages</p>
          <h1>{humanizePreviewLabel(personName ?? '', 'Your family record')}</h1>
          <span>{humanizePreviewLabel(familyName ?? '', 'Your family')} · messages with your care team</span>
        </div>
      </header>
      <section className={styles.panel} aria-labelledby="messages-heading">
        <p className={styles.eyebrow}>Messages</p>
        <h2 id="messages-heading">Talk with your care team.</h2>
        <MessageThread messages={messages} postAction={postWorkflowMessage} requestId={randomUUID()} workflowId={id} />
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
      <p>Nothing changed, and no messages were shown. Ask the funeral home for a new link, or try again.</p>
      <Link href="/">Return home</Link>
    </main>
  );
}
