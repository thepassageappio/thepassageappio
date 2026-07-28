import 'server-only';

import type { PassageServerClient } from '@/lib/partner/hosted';

export type WorkflowMessage = {
  id: string;
  senderKind: 'staff' | 'family';
  senderLabel: string;
  body: string;
  occurredAt: string;
  /** True when the current viewer authored this message -- lets the UI say "You" instead of repeating their own label. */
  isOwn: boolean;
};

export type WorkflowMessageThreadResult =
  | { ok: true; messages: WorkflowMessage[] }
  | { ok: false; message: string };

const MESSAGE_COLUMNS = 'id, sender_kind, sender_label, sender_user_id, body, occurred_at';

type MessageRow = {
  id: string;
  sender_kind: 'staff' | 'family';
  sender_label: string;
  sender_user_id: string;
  body: string;
  occurred_at: string;
};

// Shared by both the family case-detail messages page and the director Case
// Room's Messages panel. RLS (passage_private.can_view_workflow) already
// scopes this to whoever is authorized to see the case -- this loader adds
// nothing beyond mapping the row to a client-safe shape. sender_user_id is
// used only to compute isOwn below; it is never returned to a caller.
export async function loadWorkflowMessages(
  client: PassageServerClient,
  workflowId: string,
  currentUserId: string,
): Promise<WorkflowMessageThreadResult> {
  const result = await client
    .from('workflow_messages')
    .select(MESSAGE_COLUMNS)
    .eq('workflow_id', workflowId)
    .order('occurred_at', { ascending: true });
  if (result.error) return { ok: false, message: 'Passage could not load messages for this case.' };

  const rows = (result.data ?? []) as MessageRow[];
  return {
    ok: true,
    messages: rows.map((row) => ({
      id: row.id,
      senderKind: row.sender_kind,
      senderLabel: row.sender_label,
      body: row.body,
      occurredAt: row.occurred_at,
      isOwn: row.sender_user_id === currentUserId,
    })),
  };
}
