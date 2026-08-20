import 'server-only';

import { verifiedUser } from '@/lib/auth/session';
import { loadWorkflowMessages, type WorkflowMessage } from '@/lib/messaging/hosted';
import { createPassageServerClient } from '@/lib/supabase/server';

export type FamilyMessagesView = {
  workflowId: string;
  personName: string | null;
  familyName: string | null;
  messages: WorkflowMessage[];
  isSelfServe: boolean;
};

export type FamilyMessagesViewResult =
  | { ok: true; data: FamilyMessagesView }
  | { ok: false; reason: 'signed-out' | 'not-found' | 'not-authorized' | 'unavailable' };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Deliberately narrower than lib/family/case-view.ts's loadFamilyCaseView:
// this page only needs identity + the message thread, not tasks/events, so
// it does its own small RLS-scoped workflow lookup rather than pulling in
// unrelated data. Authorization for the page shell is workflows_select_safe
// (the same RLS the rest of /case/[id]/* relies on); the message thread
// itself is separately authorized by can_message_workflow() inside the RPC,
// so a caller who fails the direct workflows read (e.g. an estate_access
// participant that isn't the row owner) still gets an empty-but-correct
// shell rather than a hard denial -- matches case-view.ts's own fallback
// posture.
export async function loadFamilyMessagesView(workflowId: string): Promise<FamilyMessagesViewResult> {
  if (!UUID_PATTERN.test(workflowId)) return { ok: false, reason: 'not-found' };

  const client = await createPassageServerClient();
  if (!client) return { ok: false, reason: 'unavailable' };

  const user = await verifiedUser(client);
  if (!user) return { ok: false, reason: 'signed-out' };

  const workflowResult = await client
    .from('workflows')
    .select('id, person_name, family_name, organization_id')
    .eq('id', workflowId)
    .maybeSingle();
  if (workflowResult.error) return { ok: false, reason: 'unavailable' };

  const messagesResult = await loadWorkflowMessages(client, workflowId);
  if (!messagesResult.ok) {
    // No direct workflow row and the RPC also denies -- genuinely not
    // authorized, not just missing the richer projection.
    if (!workflowResult.data) return { ok: false, reason: 'not-authorized' };
    return { ok: false, reason: 'unavailable' };
  }

  return {
    ok: true,
    data: {
      workflowId,
      personName: workflowResult.data?.person_name ?? null,
      familyName: workflowResult.data?.family_name ?? null,
      messages: messagesResult.messages,
      isSelfServe: workflowResult.data?.organization_id === null,
    },
  };
}
