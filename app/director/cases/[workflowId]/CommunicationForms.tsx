'use client';

import { useActionState } from 'react';
import { prepareTaskCommunication, sendTaskCommunication, type PrepareCommunicationState, type SendCommunicationState } from '@/lib/communications/actions';
import styles from '../../../proof-loop.module.css';

const initialPrepareState: PrepareCommunicationState = { status: 'idle' };
const initialSendState: SendCommunicationState = { status: 'idle' };

function PrepareResult({ state }: { state: PrepareCommunicationState }) {
  if (!state.message) return null;
  return <div className={state.status === 'saved' ? styles.receipt : styles.error} role={state.status === 'saved' ? 'status' : 'alert'}><h3>{state.status === 'saved' ? 'Prepared.' : 'Nothing changed.'}</h3><p>{state.message}</p></div>;
}

function SendResult({ state }: { state: SendCommunicationState }) {
  if (!state.message) return null;
  return <div className={state.status === 'sent' ? styles.receipt : styles.error} role={state.status === 'sent' ? 'status' : 'alert'}><h3>{state.status === 'sent' ? 'Sent.' : 'Nothing sent.'}</h3><p>{state.message}</p></div>;
}

export function PrepareCommunicationForm({ workflowId, requestId, tasks }: { workflowId: string; requestId: string; tasks: { id: string; title: string | null }[] }) {
  const [state, action, pending] = useActionState(prepareTaskCommunication, initialPrepareState);
  return (
    <form action={action} aria-busy={pending} className={styles.form} key={state.communicationId ?? 'initial'}>
      <input name="workflowId" type="hidden" value={workflowId} />
      <input name="requestId" type="hidden" value={requestId} />
      <fieldset disabled={pending}>
        <legend>Prepare an email about this case.</legend>
        <label>About <span>Optional -- link this to a specific step</span>
          <select name="taskId" defaultValue="">
            <option value="">The case in general</option>
            {tasks.map((task) => <option key={task.id} value={task.id}>{task.title ?? 'Case step'}</option>)}
          </select>
        </label>
        <label>Subject<input maxLength={200} name="subject" required /></label>
        <label>Message<textarea maxLength={4000} name="body" required rows={5} /></label>
        <label>Recipients <span>One email per line, or "Name &lt;email&gt;"</span>
          <textarea name="recipientsText" placeholder={'Aunt Carol <carol@example.com>\nservice@stmarys.example.com'} required rows={3} />
        </label>
        <button disabled={pending} type="submit">{pending ? 'Preparing…' : 'Prepare draft'}</button>
      </fieldset>
      <PrepareResult state={state} />
    </form>
  );
}

export function SendCommunicationButton({ workflowId, communicationId, requestId }: { workflowId: string; communicationId: string; requestId: string }) {
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
