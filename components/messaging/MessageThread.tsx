'use client';

import { useActionState } from 'react';
import type { MessageCommandState } from '@/lib/messaging/actions';
import type { WorkflowMessage } from '@/lib/messaging/hosted';
import styles from './MessageThread.module.css';

const initialState: MessageCommandState = { status: 'idle' };

// Shared thread + composer, used by both the family case-detail messages
// page and the director Case Room's Messages panel. The parent Server
// Component supplies which persona-agnostic action to post through and a
// fresh idempotency key (requestId) on every render, so a remount after a
// successful add (via the form's key below) always carries a new key for
// the next message.
export function MessageThread({
  workflowId,
  requestId,
  messages,
  postAction,
  loadError,
  recoveryHref,
}: {
  workflowId: string;
  requestId: string;
  messages: WorkflowMessage[];
  postAction: (previous: MessageCommandState, formData: FormData) => Promise<MessageCommandState>;
  loadError?: string;
  recoveryHref?: string;
}) {
  const [state, action, pending] = useActionState(postAction, initialState);

  if (loadError) {
    return (
      <div className={styles.thread}>
        <div className={styles.loadFailure} role="alert">
          <p>{loadError} Nothing was added.</p>
          {recoveryHref && <a href={recoveryHref}>Reload messages</a>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.thread}>
      {messages.length === 0 ? (
        <p className={styles.empty}>No messages yet. Add the first one below.</p>
      ) : (
        <ol className={styles.list}>
          {messages.map((message) => (
            <li className={styles.bubble} data-own={message.isOwn} data-sender-kind={message.senderKind} key={message.id}>
              <p className={styles.meta}>
                {message.isOwn ? 'You' : message.senderLabel}
                {' · '}
                <time dateTime={message.occurredAt}>{message.occurredAtLabel}</time>
              </p>
              <p className={styles.body}>{message.body}</p>
            </li>
          ))}
        </ol>
      )}
      <form action={action} aria-busy={pending} className={styles.form} key={state.receipt?.occurredAt ?? 'initial'}>
        <input name="workflowId" type="hidden" value={workflowId} />
        <input name="requestId" type="hidden" value={requestId} />
        <label className={styles.composerLabel} htmlFor={`message-body-${workflowId}`}>Write a message about this case</label>
        <p className={styles.boundary}>People who can open this case can read it. Passage saves it here; no email or text is sent.</p>
        <textarea disabled={pending} id={`message-body-${workflowId}`} maxLength={4000} name="body" required rows={3} />
        <button disabled={pending} type="submit">{pending ? 'Adding…' : 'Add message'}</button>
        {state.message && (
          <p className={state.status === 'saved' ? styles.success : styles.errorText} role={state.status === 'saved' ? 'status' : 'alert'}>{state.message}</p>
        )}
      </form>
    </div>
  );
}
