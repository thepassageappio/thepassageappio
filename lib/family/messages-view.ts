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

// Minimal row shape read from public.get_family_case_update_for_workflow() --
// only used here to source personName/familyName for an active, updates-scoped
// participant who is correctly denied by the owner-only workflows table read
// below. See lib/family/case-view.ts for the fuller participant projection.
type ParticipantIdentityRow = { family_name: string | null; person_name: string | null };

// Deliberately narrower than lib/family/case-view.ts's loadFamilyCaseView:
// this page only needs identity + the message thread, not tasks/events, so
// it does its own small RLS-scoped workflow lookup rather than pulling in
// unrelated data. That raw table read is owner/staff/director-only (RLS on
// workflows routes through passage_private.can_view_workflow, which the
// participant_updates_case_scope migration narrowed to owner-only for the
// family branch) -- it does NOT cover an active, updates-scoped participant,
// even though passage_private.can_message_workflow() (which actually gates
// the message thread below via list_workflow_messages_client_safe) already
// grants that same participant access. So a participant who fails this first
// lookup isn't necessarily unauthorized; fall back to the bounded participant
// projection for personName/familyName before giving up.
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
    const rows = (participantResult.data ?? []) as ParticipantIdentityRow[];
    const row = rows[0];
    // Neither the owner/staff path nor the participant projection recognizes this
    // caller for this workflow -- collapsed into one reason on purpose, same as
    // case-view.ts, so the response can't be used to enumerate cases.
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
