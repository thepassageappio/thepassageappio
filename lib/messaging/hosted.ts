import 'server-only';

import type { PassageServerClient } from '@/lib/partner/hosted';

export type WorkflowMessage = {
  id: string;
  senderKind: 'staff' | 'family';
  senderLabel: string;
  body: string;
  occurredAt: string;
  occurredAtLabel: string;
  /** True when the current viewer authored this message -- lets the UI say "You" instead of repeating their own label. */
  isOwn: boolean;
};

export type WorkflowMessageThreadResult =
  | { ok: true; messages: WorkflowMessage[] }
  | { ok: false; message: string };

type MessageRow = {
  message_id: string;
  sender_kind: 'staff' | 'family';
  sender_label: string;
  body: string;
  occurred_at: string;
  is_own: boolean;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function formatWorkflowMessageTimeUtc(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Time unavailable';
  const hour = date.getUTCHours();
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const clockHour = hour % 12 || 12;
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${clockHour}:${minute} ${period} UTC`;
}

// Shared by the family messages page and the director Case Room. The public
// RPC is the sole authenticated read surface: it re-checks workflow authority,
// computes is_own in the database, and cannot return internal user, member,
// or request identifiers. The UTC label is produced on the server so the
// browser hydrates the exact text that Next rendered.
export async function loadWorkflowMessages(
  client: PassageServerClient,
  workflowId: string,
): Promise<WorkflowMessageThreadResult> {
  const result = await client.rpc('list_workflow_messages_client_safe', {
    p_workflow_id: workflowId,
  });
  if (result.error) return { ok: false, message: 'Passage could not load messages for this case.' };

  const rows = (result.data ?? []) as MessageRow[];
  return {
    ok: true,
    messages: rows.map((row) => ({
      id: row.message_id,
      senderKind: row.sender_kind,
      senderLabel: row.sender_label,
      body: row.body,
      occurredAt: row.occurred_at,
      occurredAtLabel: formatWorkflowMessageTimeUtc(row.occurred_at),
      isOwn: row.is_own,
    })),
  };
}
