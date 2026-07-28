import 'server-only';

import { verifiedUser } from '@/lib/auth/session';
import { loadWorkflowMessages, type WorkflowMessage } from '@/lib/messaging/hosted';
import { createPassageServerClient } from '@/lib/supabase/server';

export type FamilyMessagesView = {
  workflowId: string;
  personName: string | null;
  familyName: string | null;
  messages: WorkflowMessage[];
};

export type FamilyMessagesViewResult =
  | { ok: true; data: FamilyMessagesView }
  | { ok: false; reason: 'signed-out' | 'not-found' | 'not-authorized' | 'unavailable' };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Deliberately narrower than lib/family/case-view.ts's loadFamilyCaseView:
// this page only needs identity + the message thread, not tasks/events, so
// it does its own small RLS-scoped workflow lookup rather than pulling in
// unrelated data. Authorization is the same predicate either way
// (passage_private.can_view_workflow, reached here through the workflows
// table's own SELECT policy).
export async function loadFamilyMessagesView(workflowId: string): Promise<FamilyMessagesViewResult> {
  if (!UUID_PATTERN.test(workflowId)) return { ok: false, reason: 'not-found' };

  const client = await createPassageServerClient();
  if (!client) return { ok: false, reason: 'unavailable' };

  const user = await verifiedUser(client);
  if (!user) return { ok: false, reason: 'signed-out' };

  const workflowResult = await client
    .from('workflows')
    .select('id, person_name, family_name')
    .eq('id', workflowId)
    .maybeSingle();
  if (workflowResult.error) return { ok: false, reason: 'unavailable' };
  if (!workflowResult.data) return { ok: false, reason: 'not-authorized' };

  const messagesResult = await loadWorkflowMessages(client, workflowId, user.id);
  if (!messagesResult.ok) return { ok: false, reason: 'unavailable' };

  return {
    ok: true,
    data: {
      workflowId,
      personName: workflowResult.data.person_name,
      familyName: workflowResult.data.family_name,
      messages: messagesResult.messages,
    },
  };
}
