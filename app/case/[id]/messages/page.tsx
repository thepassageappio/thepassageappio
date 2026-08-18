import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loadFamilyMessagesView, type FamilyMessagesViewResult } from '@/lib/family/messages-view';
import { loginPath } from '@/lib/auth/redirects';
import { postWorkflowMessage } from '@/lib/messaging/actions';
import { humanizePreviewLabel } from '@/lib/presentation/plain-language';
import { MessageThread } from '@/components/messaging/MessageThread';
import { CaseNav } from '@/components/family/CaseNav';
import styles from '../../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      <CaseNav active="messages" caseId={id} />
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
