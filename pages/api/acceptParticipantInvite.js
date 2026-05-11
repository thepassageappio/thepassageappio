import { createClient } from '@supabase/supabase-js';
import { recordTaskCommunicationEvent } from '../../lib/communicationEvents';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const authClient = createClient(url, anon);
const admin = createClient(url, service);

function schemaColumnError(error) {
  const message = String(error?.message || error || '');
  return /schema cache|column .* does not exist|Could not find the .* column/i.test(message);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function firstPresent(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).trim() !== '') || null;
}

function participantEmail(row) {
  return normalizeEmail(firstPresent(row?.email, row?.participant_email, row?.recipient_email, row?.contact_email));
}

async function updateParticipantAccepted(participant, user) {
  const now = new Date().toISOString();
  const updates = {
    invite_status: 'accepted',
    linked_user_id: user.id,
    accepted_at: now,
    updated_at: now,
  };
  let result = await admin
    .from('estate_participants')
    .update(updates)
    .eq('id', participant.id)
    .select('*')
    .maybeSingle();
  if (!result.error || !schemaColumnError(result.error)) return result;

  const fallback = {
    invite_status: 'accepted',
    updated_at: now,
  };
  result = await admin
    .from('estate_participants')
    .update(fallback)
    .eq('id', participant.id)
    .select('*')
    .maybeSingle();
  return result;
}

async function upsertEstateAccess({ workflowId, user, participant }) {
  const now = new Date().toISOString();
  const accessRow = {
    workflow_id: workflowId,
    user_id: user.id,
    email: normalizeEmail(user.email),
    role: participant.role || participant.participant_role || 'participant',
    status: 'active',
    updated_at: now,
  };
  const { data: existingByUser } = await admin
    .from('estate_access')
    .select('id')
    .eq('workflow_id', workflowId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (existingByUser?.id) {
    return admin.from('estate_access').update(accessRow).eq('id', existingByUser.id).select('*').maybeSingle();
  }

  const { data: existingByEmail } = await admin
    .from('estate_access')
    .select('id')
    .eq('workflow_id', workflowId)
    .ilike('email', user.email)
    .maybeSingle();
  if (existingByEmail?.id) {
    return admin.from('estate_access').update(accessRow).eq('id', existingByEmail.id).select('*').maybeSingle();
  }

  return admin.from('estate_access').insert([{ ...accessRow, created_at: now }]).select('*').maybeSingle();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in before accepting this invite.' });

  const inviteToken = String(req.body?.inviteToken || req.body?.invite_token || req.body?.token || '').trim();
  if (!inviteToken) return res.status(400).json({ error: 'Invite token is required.' });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user?.id || !user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

  const { data: participant, error: participantError } = await admin
    .from('estate_participants')
    .select('*')
    .eq('invite_token', inviteToken)
    .maybeSingle();
  if (participantError) return res.status(500).json({ error: participantError.message });
  if (!participant) return res.status(404).json({ error: 'This invite link was not found. Ask the coordinator to resend it.' });

  const invitedEmail = participantEmail(participant);
  const userEmail = normalizeEmail(user.email);
  if (invitedEmail && invitedEmail !== userEmail) {
    return res.status(403).json({
      error: `This invite was sent to ${invitedEmail}. Sign in with that email or ask the coordinator to resend it.`,
    });
  }

  const workflowId = firstPresent(participant.workflow_id, participant.estate_id);
  if (!workflowId) return res.status(500).json({ error: 'This invite is missing its estate reference.' });

  const updated = await updateParticipantAccepted(participant, user);
  if (updated.error) return res.status(500).json({ error: updated.error.message });

  const access = await upsertEstateAccess({ workflowId, user, participant: updated.data || participant });
  if (access.error) return res.status(500).json({ error: access.error.message });

  const taskId = firstPresent(participant.task_id, participant.assigned_task_id, participant.workflow_task_id);
  await recordTaskCommunicationEvent({
    verb: 'assign',
    workflowId,
    taskId,
    taskTitle: participant.task_title || participant.role || 'Participant invite',
    status: 'acknowledged',
    actor: user.email,
    actorRole: 'participant',
    channel: 'invite',
    recipient: user.email,
    recipientRole: participant.role || participant.participant_role || 'participant',
    detail: `${user.email} accepted their Passage invite. Access is scoped to the assigned estate work.`,
    visibility: 'family',
    eventType: 'participant_invite_accepted',
    eventTitle: 'Participant accepted invite',
  }).then(() => {}, () => {});
  await admin.from('estate_events').insert([{
    estate_id: workflowId,
    event_type: 'participant_invite_accepted',
    title: 'Participant accepted invite',
    description: `${user.email} accepted their Passage invite.`,
    actor: user.email,
  }]).then(() => {}, () => {});

  return res.status(200).json({
    success: true,
    estateId: workflowId,
    taskId,
    participantId: participant.id,
    accessId: access.data?.id || null,
    redirectTo: `/participating?estate=${encodeURIComponent(workflowId)}${taskId ? `&task=${encodeURIComponent(taskId)}` : ''}`,
  });
}
