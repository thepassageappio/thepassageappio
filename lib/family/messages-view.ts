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

type ParticipantIdentityRow = { family_name: string | null; person_name: string | null };

// Deliberately narrower than lib/family/case-view.ts's loadFamilyCaseView:
// this page only needs identity + the message thread, not tasks/events, so
// it does its own small RLS-scoped workflow lookup rather than pulling in
// unrelated data. The raw workflow read is deliberately owner-only for the
// family branch. An active updates-scoped participant therefore falls back to
// the bounded case-update projection for the two display names before the
// message RPC applies its own exact-workflow authority check.
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

  let personName: string | null = null;
  let familyName: string | null = null;

  if (workflowResult.data) {
    personName = workflowResult.data.person_name;
    familyName = workflowResult.data.family_name;
  } else {
    const participantResult = await client.rpc('get_family_case_update_for_workflow', { p_workflow_id: workflowId });
    if (participantResult.error) return { ok: false, reason: 'unavailable' };
    const row = ((participantResult.data ?? []) as ParticipantIdentityRow[])[0];
    if (!row) return { ok: false, reason: 'not-authorized' };
    personName = row.person_name;
    familyName = row.family_name;
  }

  const messagesResult = await loadWorkflowMessages(client, workflowId);
  if (!messagesResult.ok) return { ok: false, reason: 'unavailable' };

  return {
    ok: true,
    data: {
      workflowId,
      personName,
      familyName,
      messages: messagesResult.messages,
    },
  };
}
