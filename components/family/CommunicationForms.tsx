'use client';

import { useActionState } from 'react';
import { prepareTaskCommunication, sendTaskCommunication, type PrepareCommunicationState, type SendCommunicationState } from '@/lib/communications/actions';
import styles from '../../app/proof-loop.module.css';

const initialPrepareState: PrepareCommunicationState = { status: 'idle' };
const initialSendState: SendCommunicationState = { status: 'idle' };

// Family/D2C version of the director Case Room's compose panel
// (app/director/cases/[workflowId]/CommunicationForms.tsx) -- same
// lib/communications/actions.ts server actions, no backend changes needed,
// since passage_private.can_message_workflow already covers a D2C case
// owner. Deliberately simpler than the director version: no "about which
// task" picker, since a family member is more likely emailing about the
// case in general (announcing a service, coordinating relatives) than one
// specific internal step.
function PrepareResult({ state }: { state: PrepareCommunicationState }) {
  if (!state.message) return null;
  return <div className={state.status === 'saved' ? styles.receipt : styles.error} role={state.status === 'saved' ? 'status' : 'alert'}><h3>{state.status === 'saved' ? 'Prepared.' : 'Nothing changed.'}</h3><p>{state.message}</p></div>;
}

function SendResult({ state }: { state: SendCommunicationState }) {
  if (!state.message) return null;
  return <div className={state.status === 'sent' ? styles.receipt : styles.error} role={state.status === 'sent' ? 'status' : 'alert'}><h3>{state.status === 'sent' ? 'Sent.' : 'Nothing sent.'}</h3><p>{state.message}</p></div>;
}

export function PrepareFamilyCommunicationForm({ workflowId, requestId }: { workflowId: string; requestId: string }) {
  const [state, action, pending] = useActionState(prepareTaskCommunication, initialPrepareState);
  return (
    <form action={action} aria-busy={pending} className={styles.form} key={state.communicationId ?? 'initial'}>
      <input name="workflowId" type="hidden" value={workflowId} />
      <input name="requestId" type="hidden" value={requestId} />
      <fieldset disabled={pending}>
        <legend>Email people about your case.</legend>
        <label>Subject<input maxLength={200} name="subject" required /></label>
        <label>Message<textarea maxLength={4000} name="body" required rows={5} /></label>
        <label>Send to <span>One email per line, or "Name &lt;email&gt;"</span>
          <textarea name="recipientsText" placeholder={'Aunt Carol <carol@example.com>\nuncle.jim@example.com'} required rows={3} />
        </label>
        <button disabled={pending} type="submit">{pending ? 'Preparing…' : 'Prepare draft'}</button>
      </fieldset>
      <PrepareResult state={state} />
    </form>
  );
}

export function SendFamilyCommunicationButton({ workflowId, communicationId, requestId }: { workflowId: string; communicationId: string; requestId: string }) {
  const [state, action, pending] = useActionState(sendTaskCommunication, initialSendState);
  return (
    <form action={action} className={styles.form}>
      <input name="workflowId" type="hidden" value={workflowId} />
      <input name="communicationId" type="hidden" value={communicationId} />
      <input name="requestId" type="hidden" value={requestId} />
      <button disabled={pending} type="submit">{pending ? 'Sending…' : 'Send'}</button>
      <SendResult state={state} />
    </form>
  );
}
