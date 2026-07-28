'use server';

import { revalidatePath } from 'next/cache';
import { firstRpcRow } from '@/lib/auth/invitations';
import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

// Shared by both posting surfaces (family case-detail messages page, director
// Case Room Messages panel) -- authorization for who may post is decided
// entirely by the RPC (passage_private.can_view_workflow), so one action
// safely serves both personas rather than needing a family- and a director-
// specific copy.
export type MessageCommandState = {
  status: 'idle' | 'validation' | 'denied' | 'unavailable' | 'saved';
  message?: string;
  receipt?: { occurredAt: string; replayed: boolean };
};

type PostReceipt = { message_id: string; occurred_at: string; replayed: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function postWorkflowMessage(_previous: MessageCommandState, formData: FormData): Promise<MessageCommandState> {
  const workflowId = String(formData.get('workflowId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const body = String(formData.get('body') ?? '').trim();

  if (!uuid.test(workflowId) || !uuid.test(requestId) || body.length < 1 || body.length > 4000) {
    return { status: 'validation', message: 'Enter a message before sending.' };
  }

  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'We could not open this case right now. Nothing was sent. Try again.' };
  const user = await verifiedUser(client);
  if (!user) return { status: 'denied', message: 'Sign in to send a message on this case.' };

  const result = await client.rpc('post_workflow_message_idempotent', {
    p_workflow_id: workflowId,
    p_body: body,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'This case is not available to your account. Nothing was sent.' };
    if (result.error.code === '22023') return { status: 'validation', message: 'Enter a message before sending.' };
    return { status: 'unavailable', message: 'Passage could not send this message. Nothing was sent.' };
  }
  const receipt = firstRpcRow<PostReceipt>(result.data);
  if (!receipt?.message_id) return { status: 'unavailable', message: 'We could not confirm the message was saved. Reload before trying again.' };

  revalidatePath(`/case/${workflowId}/messages`);
  revalidatePath(`/director/cases/${workflowId}`);
  return {
    status: 'saved',
    message: receipt.replayed ? 'This message was already sent.' : 'Message sent.',
    receipt: { occurredAt: receipt.occurred_at, replayed: receipt.replayed },
  };
}
