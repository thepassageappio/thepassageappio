'use server';

import { revalidatePath } from 'next/cache';
import { firstRpcRow } from '@/lib/auth/invitations';
import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';
import { sendTaskCommunicationEmail } from '@/lib/email';

// Authorization for who may prepare or send a communication about a case is
// decided entirely by passage_private.can_message_workflow -- the same
// predicate that already governs workflow messaging -- so this one pair of
// actions safely serves every persona (D2C owner, org director/staff)
// rather than needing a copy per surface.
export type CommunicationRecipientInput = { email: string; name?: string; kind: 'platform' | 'adhoc' };

export type PrepareCommunicationState = {
  status: 'idle' | 'validation' | 'denied' | 'unavailable' | 'saved';
  message?: string;
  communicationId?: string;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseRecipients(raw: string): CommunicationRecipientInput[] {
  // One "email" or "Name <email>" per line -- matches how a person would
  // naturally paste a short list of relatives/attendees, not a structured
  // picker (that's a real future upgrade, not required for the loop to work).
  return raw
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.*)<([^>]+)>$/);
      const email = (match ? match[2] : line).trim();
      const name = match ? match[1].trim() : undefined;
      return { email, name, kind: 'adhoc' as const };
    })
    .filter((recipient) => EMAIL_PATTERN.test(recipient.email));
}

export async function prepareTaskCommunication(_previous: PrepareCommunicationState, formData: FormData): Promise<PrepareCommunicationState> {
  const workflowId = String(formData.get('workflowId') ?? '');
  const taskId = String(formData.get('taskId') ?? '') || null;
  const requestId = String(formData.get('requestId') ?? '');
  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const recipients = parseRecipients(String(formData.get('recipientsText') ?? ''));

  if (!uuid.test(workflowId) || !uuid.test(requestId) || (taskId && !uuid.test(taskId)) || subject.length < 1 || body.length < 1) {
    return { status: 'validation', message: 'Write a subject and message before preparing this.' };
  }
  if (recipients.length === 0) {
    return { status: 'validation', message: 'Add at least one valid recipient email, one per line.' };
  }

  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this case right now. Nothing was prepared. Try again.' };
  const user = await verifiedUser(client);
  if (!user) return { status: 'denied', message: 'Sign in to prepare a message for this case.' };

  const result = await client.rpc('prepare_task_communication_idempotent', {
    p_workflow_id: workflowId,
    p_task_id: taskId,
    p_subject: subject,
    p_body: body,
    p_recipients: recipients,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'This case is not available to your account. Nothing was prepared.' };
    if (result.error.code === '22023') return { status: 'validation', message: result.error.message || 'This could not be prepared. Check the subject, message, and recipients.' };
    return { status: 'unavailable', message: 'Passage could not prepare this message. Nothing was sent. Try again.' };
  }
  const receipt = firstRpcRow<{ communication_id: string }>(result.data);
  if (!receipt?.communication_id) return { status: 'unavailable', message: 'We could not confirm this draft was saved. Reload before trying again.' };

  revalidatePath(`/director/cases/${workflowId}`);
  revalidatePath(`/case/${workflowId}/tasks`);
  revalidatePath(`/case/${workflowId}/today`);
  return { status: 'saved', message: 'Draft prepared. Review it, then send.', communicationId: receipt.communication_id };
}

export type SendCommunicationState = {
  status: 'idle' | 'validation' | 'denied' | 'unavailable' | 'sent' | 'failed';
  message?: string;
};

type CommunicationRow = { id: string; task_id: string | null; subject: string; body: string; recipients: CommunicationRecipientInput[]; status: string };

export async function sendTaskCommunication(_previous: SendCommunicationState, formData: FormData): Promise<SendCommunicationState> {
  const workflowId = String(formData.get('workflowId') ?? '');
  const communicationId = String(formData.get('communicationId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');

  if (!uuid.test(workflowId) || !uuid.test(communicationId) || !uuid.test(requestId)) {
    return { status: 'validation', message: 'This draft could not be sent. Reload the page, then try again.' };
  }

  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this case right now. Nothing was sent. Try again.' };
  const user = await verifiedUser(client);
  if (!user) return { status: 'denied', message: 'Sign in to send this message.' };

  // Re-reads the persisted draft rather than trusting client-submitted
  // subject/body -- what actually gets sent must be exactly what was
  // reviewed and prepared, not whatever a stale form happens to hold.
  const listResult = await client.rpc('get_workflow_communications', { p_workflow_id: workflowId });
  if (listResult.error) return { status: 'unavailable', message: 'Passage could not open this draft. Nothing was sent. Try again.' };
  const row = ((listResult.data ?? []) as CommunicationRow[]).find((c) => c.id === communicationId);
  if (!row) return { status: 'denied', message: 'This draft is not available to your account. Nothing was sent.' };
  if (row.status === 'sent') return { status: 'sent', message: 'This was already sent.' };

  const sendResult = await sendTaskCommunicationEmail({
    to: row.recipients.map((r) => r.email),
    subject: row.subject,
    text: row.body,
  });

  if (!sendResult.ok) {
    await client.rpc('confirm_task_communication_failed_idempotent', {
      p_communication_id: communicationId,
      p_failure_reason: sendResult.reason,
      p_request_id: requestId,
    });
    revalidatePath(`/director/cases/${workflowId}`);
    revalidatePath(`/case/${workflowId}/tasks`);
    return { status: 'failed', message: `Could not send: ${sendResult.reason}` };
  }

  const confirmResult = await client.rpc('confirm_task_communication_sent_idempotent', {
    p_communication_id: communicationId,
    p_provider_message_ids: [sendResult.providerMessageId],
    p_request_id: requestId,
  });
  if (confirmResult.error) {
    // The email genuinely sent -- surfacing this as a failure would be a
    // "prepared outcomes, not AI theater" violation in the other direction
    // (claiming nothing happened when it did). Tell the truth: it sent,
    // but Passage couldn't record it, so the on-screen status may be stale.
    return { status: 'sent', message: 'This was sent, but Passage could not save the confirmation. Reload to check its status.' };
  }

  revalidatePath(`/director/cases/${workflowId}`);
  revalidatePath(`/case/${workflowId}/tasks`);
  revalidatePath(`/case/${workflowId}/today`);
  return { status: 'sent', message: 'Sent.' };
}
