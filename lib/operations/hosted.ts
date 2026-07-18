import 'server-only';

import { resolveOperationalViewer, type OperationalViewer } from '@/lib/auth/authorization';
import { createPassageServerClient } from '@/lib/supabase/server';

export type HostedWorkflow = {
  id: string;
  organization_id: string;
  organization_location_id: string;
  accountable_organization_member_id: string | null;
  case_reference: string | null;
  family_name: string | null;
  person_name: string | null;
  phase: string | null;
  status: 'active' | 'closed';
};

export type HostedTask = {
  id: string;
  workflow_id: string;
  organization_id: string;
  assigned_organization_member_id: string | null;
  title: string | null;
  status: 'assigned' | 'in_progress' | 'blocked' | 'completed';
  waiting_party: string | null;
  due_at: string | null;
  audience: string;
  automation_level: string;
  prepared_output: string | null;
  human_action: string | null;
  proof_destination: string | null;
  next_state: string | null;
  version: number;
};

export type HostedMember = {
  id: string;
  organization_id: string;
  user_id: string | null;
  email: string;
  role: 'owner' | 'director' | 'staff';
  status: string;
  display_name: string | null;
  title: string | null;
  revoked_at: string | null;
};

export type HostedMemberGrant = {
  organization_member_id: string;
  organization_location_id: string;
  revoked_at: string | null;
};

export type HostedEvent = {
  id: string;
  workflow_id: string | null;
  task_id: string | null;
  invitation_id: string | null;
  actor_organization_member_id: string | null;
  name: string;
  previous_state: string | null;
  next_state: string | null;
  occurred_at: string;
  organization_location_id: string | null;
  metadata: Record<string, unknown> | null;
};

export type HostedInvitation = {
  id: string;
  invited_email: string;
  role: 'staff';
  purpose: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  invited_by_user_id: string;
};

export type HostedInvitationLocation = {
  invitation_id: string;
  organization_location_id: string;
};

export type HostedOperationsData = {
  viewer: OperationalViewer;
  workflows: HostedWorkflow[];
  tasks: HostedTask[];
  members: HostedMember[];
  grants: HostedMemberGrant[];
  events: HostedEvent[];
  invitations: HostedInvitation[];
  invitationLocations: HostedInvitationLocation[];
};

export type HostedOperationsResult =
  | { ok: true; data: HostedOperationsData }
  | { ok: false; message: string };

export async function loadHostedOperations(options: {
  events?: boolean;
  invitations?: boolean;
} = {}): Promise<HostedOperationsResult> {
  const viewerResult = await resolveOperationalViewer();
  if (!viewerResult.ok) {
    return { ok: false, message: 'Passage could not verify current workspace authority.' };
  }
  const client = await createPassageServerClient();
  if (!client) return { ok: false, message: 'The isolated workspace data service is unavailable.' };

  const [workflowResult, taskResult, memberResult, grantResult, eventResult, invitationResult, invitationLocationResult] = await Promise.all([
    client.from('workflows').select('id, organization_id, organization_location_id, accountable_organization_member_id, case_reference, family_name, person_name, phase, status').eq('organization_id', viewerResult.viewer.organizationId).order('case_reference'),
    client.from('tasks').select('id, workflow_id, organization_id, assigned_organization_member_id, title, status, waiting_party, due_at, audience, automation_level, prepared_output, human_action, proof_destination, next_state, version').eq('organization_id', viewerResult.viewer.organizationId).order('due_at'),
    client.from('organization_members').select('id, organization_id, user_id, email, role, status, display_name, title, revoked_at').eq('organization_id', viewerResult.viewer.organizationId).order('display_name'),
    client.from('organization_member_locations').select('organization_member_id, organization_location_id, revoked_at'),
    options.events
      ? client.from('workflow_events').select('id, workflow_id, task_id, invitation_id, actor_organization_member_id, name, previous_state, next_state, occurred_at, organization_location_id, metadata').eq('organization_id', viewerResult.viewer.organizationId).order('occurred_at', { ascending: false }).limit(100)
      : Promise.resolve({ data: [], error: null }),
    options.invitations
      ? client.from('organization_invitations').select('id, invited_email, role, purpose, expires_at, accepted_at, revoked_at, created_at, invited_by_user_id').eq('organization_id', viewerResult.viewer.organizationId).order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    options.invitations
      ? client.from('organization_invitation_locations').select('invitation_id, organization_location_id')
      : Promise.resolve({ data: [], error: null }),
  ]);

  const error = workflowResult.error ?? taskResult.error ?? memberResult.error ?? grantResult.error
    ?? eventResult.error ?? invitationResult.error ?? invitationLocationResult.error;
  if (error) return { ok: false, message: 'Passage could not verify durable workload. No operational data is shown.' };

  return {
    ok: true,
    data: {
      viewer: viewerResult.viewer,
      workflows: (workflowResult.data ?? []) as HostedWorkflow[],
      tasks: (taskResult.data ?? []) as HostedTask[],
      members: (memberResult.data ?? []) as HostedMember[],
      grants: (grantResult.data ?? []) as HostedMemberGrant[],
      events: (eventResult.data ?? []) as HostedEvent[],
      invitations: (invitationResult.data ?? []) as HostedInvitation[],
      invitationLocations: (invitationLocationResult.data ?? []) as HostedInvitationLocation[],
    },
  };
}

export function displayMember(member: HostedMember | undefined) {
  return member?.display_name?.trim() || member?.email || 'Unassigned';
}

export function formatOperationalTime(value: string | null) {
  if (!value) return 'No deadline';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
}
