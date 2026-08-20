import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loadFamilyMessagesView, type FamilyMessagesViewResult } from '@/lib/family/messages-view';
import { loginPath } from '@/lib/auth/redirects';
import { postWorkflowMessage } from '@/lib/messaging/actions';
import { humanizePreviewLabel } from '@/lib/presentation/plain-language';
import { MessageThread } from '@/components/messaging/MessageThread';
import { CaseNav } from '@/components/family/CaseNav';
import { PrepareFamilyCommunicationForm, SendFamilyCommunicationButton } from '@/components/family/CommunicationForms';
import { createPassageServerClient } from '@/lib/supabase/server';
import styles from '../../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type CommunicationRow = { id: string; subject: string; body: string; recipients: { email: string; name?: string }[]; status: string; prepared_at: string; sent_at: string | null; failure_reason: string | null };

export default async function FamilyCaseMessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result: FamilyMessagesViewResult = await loadFamilyMessagesView(id);
  if (!result.ok) {
    if (result.reason === 'signed-out') redirect(loginPath(`/case/${id}/messages`));
    return <Closed reason={result.reason} />;
  }
  const { personName, familyName, messages, isSelfServe } = result.data;

  // Fails closed to an empty list -- a family owner who can't reach the
  // communications RPC (e.g. an invited participant, out of scope for this
  // surface) still gets the rest of the page rather than an error.
  const client = await createPassageServerClient();
  const communicationsResult = client ? await client.rpc('get_workflow_communications', { p_workflow_id: id }) : null;
  const communications = (communicationsResult?.data ?? []) as CommunicationRow[];

  return (
    <main id="main-content">
      <CaseNav active="messages" caseId={id} planning={isSelfServe} />
      <header className={styles.hero}>
        <div>
          <p>{isSelfServe ? 'Share your plan' : 'Messages'}</p>
          <h1>{humanizePreviewLabel(personName ?? '', isSelfServe ? 'Your plan' : 'Your family record')}</h1>
          <span>{isSelfServe ? 'Notes and updates for people you trust' : `${humanizePreviewLabel(familyName ?? '', 'Your family')} · messages with your care team`}</span>
        </div>
      </header>
      <section className={styles.panel} aria-labelledby="messages-heading">
        <p className={styles.eyebrow}>{isSelfServe ? 'Private conversation' : 'Messages'}</p>
        <h2 id="messages-heading">{isSelfServe ? 'Write to people you invited to this plan.' : 'Talk with your care team.'}</h2>
        <MessageThread messages={messages} postAction={postWorkflowMessage} requestId={randomUUID()} workflowId={id} />
      </section>

      <section className={styles.panel} aria-labelledby="email-heading" style={{ marginTop: 18 }}>
        <p className={styles.eyebrow}>Email updates</p>
        <h2 id="email-heading">{isSelfServe ? 'Email someone you trust about this plan.' : 'Email relatives, friends, or your care team about your case.'}</h2>
        <p>These are real emails Passage sends on your behalf, once you review and click Send. Nothing sends automatically.</p>
        {communications.length > 0 && (
          <ol className={styles.history}>
            {communications.map((communication) => (
              <li key={communication.id}>
                <p><strong>{communication.subject}</strong></p>
                <p>{communication.body}</p>
                <p>To: {communication.recipients.map((r) => r.name ? `${r.name} <${r.email}>` : r.email).join(', ')}</p>
                <p>
                  {communication.status === 'sent' && communication.sent_at ? 'Sent.' : communication.status === 'failed' ? `Failed to send${communication.failure_reason ? `: ${communication.failure_reason}` : ''}` : 'Prepared, not yet sent.'}
                </p>
                {communication.status !== 'sent' && <SendFamilyCommunicationButton communicationId={communication.id} requestId={randomUUID()} workflowId={id} />}
              </li>
            ))}
          </ol>
        )}
        <PrepareFamilyCommunicationForm requestId={randomUUID()} workflowId={id} />
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
