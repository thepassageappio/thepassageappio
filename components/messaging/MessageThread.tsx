'use client';

import { useActionState } from 'react';
import type { MessageCommandState } from '@/lib/messaging/actions';
import type { WorkflowMessage } from '@/lib/messaging/hosted';
import styles from './MessageThread.module.css';

const initialState: MessageCommandState = { status: 'idle' };

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

// Shared thread + composer, used by both the family case-detail messages
// page and the director Case Room's Messages panel. The parent Server
// Component supplies which persona-agnostic action to post through and a
// fresh idempotency key (requestId) on every render, so a remount after a
// successful send (via the form's key below) always carries a new key for
// the next message.
export function MessageThread({
  workflowId,
  requestId,
  messages,
  postAction,
}: {
  workflowId: string;
  requestId: string;
  messages: WorkflowMessage[];
  postAction: (previous: MessageCommandState, formData: FormData) => Promise<MessageCommandState>;
}) {
  const [state, action, pending] = useActionState(postAction, initialState);

  return (
    <div className={styles.thread}>
      {messages.length === 0 ? (
        <p className={styles.empty}>No messages yet. Send the first one below.</p>
      ) : (
        <ol className={styles.list}>
          {messages.map((message) => (
            <li className={styles.bubble} data-own={message.isOwn} data-sender-kind={message.senderKind} key={message.id}>
              <p className={styles.meta}>{message.isOwn ? 'You' : message.senderLabel} · {formatMessageTime(message.occurredAt)}</p>
              <p className={styles.body}>{message.body}</p>
            </li>
          ))}
        </ol>
      )}
      <form action={action} aria-busy={pending} className={styles.form} key={state.receipt?.occurredAt ?? 'initial'}>
        <input name="workflowId" type="hidden" value={workflowId} />
        <input name="requestId" type="hidden" value={requestId} />
        <label className={styles.composerLabel} htmlFor={`message-body-${workflowId}`}>Write a message</label>
        <textarea disabled={pending} id={`message-body-${workflowId}`} maxLength={4000} name="body" required rows={3} />
        <button disabled={pending} type="submit">{pending ? 'Sending…' : 'Send message'}</button>
        {state.message && (
          <p className={state.status === 'saved' ? styles.success : styles.errorText} role={state.status === 'saved' ? 'status' : 'alert'}>{state.message}</p>
        )}
      </form>
    </div>
  );
}
