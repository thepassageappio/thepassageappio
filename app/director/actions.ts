'use server';

import { revalidatePath } from 'next/cache';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import { sendTaskCommunicationEmail } from '@/lib/email';
import { createPassageServerClient } from '@/lib/supabase/server';

export type DirectorCommandState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'saved' | 'upgrade-required';
  message?: string;
  receipt?: {
    occurredAt: string;
    replayed: boolean;
  };
  workflowId?: string;
};

type CommandReceipt = { event_id: string; occurred_at: string; replayed: boolean };
type InvitationReceipt = { invitation_id: string; revoked_at: string; invitation_state: string; replayed: boolean };
type CaseCreationGrantReceipt = { organization_member_id: string; organization_location_id: string; can_create_cases: boolean; replayed: boolean };
type LocationReceipt = { location_id: string; location_count: number; included_location_slots: number; is_additional: boolean; replayed: boolean };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function failure(status: DirectorCommandState['status'], message: string): DirectorCommandState {
  return { status, message };
}

async function directorClient() {
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || !['owner', 'director'].includes(viewer.viewer.role)) return null;
  const client = await createPassageServerClient();
  return client ? { client, viewer: viewer.viewer } : null;
}

// Case creation is director/owner OR staff with an explicit can_create_cases
// grant (set via StaffCaseCreationGrantForm on /director/team) -- unlike
// every other action in this file, staff is not blocked here at the
// frontend layer, because passage_private.can_create_case_at_location
// already enforces the real per-location grant. Rejecting staff here too
// would just duplicate that check less precisely (this layer has no way to
// know which locations a given staff member has the grant at without
// querying it, so the RPC is the correct single source of truth).
async function caseCreationClient() {
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok) return null;
  const client = await createPassageServerClient();
  return client ? { client, viewer: viewer.viewer } : null;
}

// `noun` names the thing that changed, e.g. "assignment" / "proof review" --
// the 40001 branch previously hardcoded "Ownership changed..." regardless
// of noun, a copy bug that leaked assignment-specific wording into e.g. a
// proof-review conflict (found during the 2026-08-17 full UX audit).
function rpcFailure(error: { code?: string; message?: string } | null, noun: string): DirectorCommandState {
  if (error?.code === '42501' || error?.code === '28000') return failure('denied', `You do not have access to change this ${noun}. Nothing changed. Ask an organization owner for help.`);
  if (error?.code === '40001') return failure('conflict', `This ${noun} changed before your action was saved. No change was made. Reload current work.`);
  if (error?.code === '55000') return failure('conflict', noun === 'team access' ? 'Reassign active commitments before ending access. Nothing changed.' : `The ${noun} changed before this action was saved. Reload and review it again.`);
  if (error?.code === '55001') return failure('upgrade-required', error.message?.trim() || `Your plan does not include another ${noun}. Upgrade to continue.`);
  if (error?.code === '22023') return failure('validation', `Review the ${noun} details. They are incomplete or no longer match the current record.`);
  return failure('unavailable', `We could not save this ${noun}. Nothing changed. Try again.`);
}

export async function assignTask(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const taskId = String(formData.get('taskId') ?? '');
  const assigneeId = String(formData.get('assigneeId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));
  const reason = String(formData.get('reason') ?? '').trim();
  const requestId = String(formData.get('requestId') ?? '');
  if (!uuid.test(taskId) || !uuid.test(assigneeId) || !uuid.test(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1 || !reason) {
    return failure('validation', 'Choose authorized staff and explain why ownership is changing. Nothing changed.');
  }
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('assign_task_idempotent', {
    p_task_id: taskId,
    p_expected_version: expectedVersion,
    p_assignee_member_id: assigneeId,
    p_reason: reason,
    p_request_id: requestId,
  });
  if (result.error) return rpcFailure(result.error, 'assignment');
  const receipt = firstRpcRow<CommandReceipt>(result.data);
  if (!receipt?.event_id || !receipt.occurred_at) return failure('unavailable', 'We could not confirm that the owner changed. Reload before trying again.');
  revalidatePath('/director');
  revalidatePath('/staff');
  revalidatePath('/director/activity');
  return { status: 'saved', message: receipt.replayed ? 'This ownership change was already saved. The original saved time is shown below.' : 'Ownership was saved in team activity.', receipt: { occurredAt: receipt.occurred_at, replayed: receipt.replayed } };
}

export async function revokeInvitation(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const invitationId = String(formData.get('invitationId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (!uuid.test(invitationId) || !reason) return failure('validation', 'Name the invitation and explain why access is being revoked. Nothing changed.');
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('revoke_organization_invitation', { p_invitation_id: invitationId, p_reason: reason });
  if (result.error) return rpcFailure(result.error, 'invitation');
  const receipt = firstRpcRow<InvitationReceipt>(result.data);
  if (!receipt?.invitation_id || !receipt.revoked_at) return failure('unavailable', 'Passage did not return a complete revocation receipt. Reload before retrying.');
  revalidatePath('/director/team');
  revalidatePath('/director/activity');
  return { status: 'saved', message: receipt.replayed ? 'This invitation was already revoked. The original saved time is shown below.' : 'The invitation was revoked. No access was granted.', receipt: { occurredAt: receipt.revoked_at, replayed: receipt.replayed } };
}

export async function revokeMember(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const memberId = String(formData.get('memberId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  const requestId = String(formData.get('requestId') ?? '');
  if (!uuid.test(memberId) || !uuid.test(requestId) || !reason) return failure('validation', 'Name the staff member and explain why access is ending. Nothing changed.');
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('revoke_organization_member_idempotent', { p_member_id: memberId, p_reason: reason, p_request_id: requestId });
  if (result.error) return rpcFailure(result.error, 'team access');
  const receipt = firstRpcRow<CommandReceipt>(result.data);
  if (!receipt?.event_id || !receipt.occurred_at) return failure('unavailable', 'Passage did not return a complete access receipt. Reload before retrying.');
  revalidatePath('/director/team');
  revalidatePath('/director/activity');
  revalidatePath('/staff');
  return { status: 'saved', message: receipt.replayed ? 'This access change was already saved. The original saved time is shown below.' : 'Team access ended. Earlier activity remains in the record.', receipt: { occurredAt: receipt.occurred_at, replayed: receipt.replayed } };
}

export async function reviewTaskProof(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const proofId = String(formData.get('proofId') ?? '');
  const workflowId = String(formData.get('workflowId') ?? '');
  const expectedVersion = Number(formData.get('expectedVersion'));
  const decision = String(formData.get('decision') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  const requestId = String(formData.get('requestId') ?? '');
  if (!uuid.test(proofId) || !uuid.test(workflowId) || !uuid.test(requestId)
    || !Number.isInteger(expectedVersion) || expectedVersion < 1
    || !['verified', 'needs_replacement'].includes(decision)
    || (decision === 'needs_replacement' && !reason)
    || (decision === 'verified' && reason)) {
    return failure('validation', 'Choose a valid proof decision and explain any replacement request. Nothing changed.');
  }
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('review_task_proof_idempotent', {
    p_proof_id: proofId,
    p_expected_task_version: expectedVersion,
    p_decision: decision,
    p_reason: reason || null,
    p_request_id: requestId,
  });
  if (result.error) return rpcFailure(result.error, 'proof review');
  const receipt = firstRpcRow<CommandReceipt>(result.data);
  if (!receipt?.event_id || !receipt.occurred_at) return failure('unavailable', 'Passage did not return a complete proof-review receipt. Reload before retrying.');
  revalidatePath('/director');
  revalidatePath(`/director/cases/${workflowId}`);
  revalidatePath('/director/activity');
  revalidatePath('/staff');
  return {
    status: 'saved',
    message: receipt.replayed ? 'Already recorded. The original review receipt was returned.' : decision === 'verified' ? 'Proof verified. The task is complete.' : 'Replacement requested. The task returned to the current owner.',
    receipt: { occurredAt: receipt.occurred_at, replayed: receipt.replayed },
  };
}

export async function createLocation(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const organizationId = String(formData.get('organizationId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();
  const zip = String(formData.get('zip') ?? '').trim();
  if (!uuid.test(organizationId) || !uuid.test(requestId) || !name) {
    return failure('validation', 'Enter a location name. Nothing was created.');
  }
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('create_organization_location_idempotent', {
    p_organization_id: organizationId,
    p_name: name,
    p_address: address || null,
    p_city: city || null,
    p_state: state || null,
    p_zip: zip || null,
    p_request_id: requestId,
  });
  if (result.error) return rpcFailure(result.error, 'location');
  const receipt = firstRpcRow<LocationReceipt>(result.data);
  if (!receipt?.location_id) return failure('unavailable', 'Passage did not return a complete location receipt. Reload before retrying.');
  revalidatePath('/director/team');
  revalidatePath('/director/activity');
  return {
    status: 'saved',
    message: receipt.replayed ? 'This location was already created.' : 'Location added.',
  };
}

type CaseCreationReceipt = { workflow_id: string; replayed: boolean };

// The general-purpose "director or authorized staff opens a new case"
// path -- found missing during the persona-completeness pass. Previously
// the only way an org-owned workflow could be created was claiming an
// urgent-intake request; a funeral home taking a case any other way (a
// phone call, a walk-in, a pre-need arrangement) had no way to start one
// at all. Uses caseCreationClient(), not directorClient() -- staff with a
// can_create_cases grant may call this too, enforced by the RPC itself.
type FamilyInvitationReceipt = { invitation_id: string; raw_token: string | null; token_hint: string; invitation_expires_at: string; invitation_created_at: string; invitation_state: string; replayed: boolean };

export async function createCase(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const organizationId = String(formData.get('organizationId') ?? '');
  const locationId = String(formData.get('locationId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const caseReference = String(formData.get('caseReference') ?? '').trim();
  const familyName = String(formData.get('familyName') ?? '').trim();
  const personName = String(formData.get('personName') ?? '').trim();
  const contactEmail = String(formData.get('familyContactEmail') ?? '').trim().toLowerCase();
  const contactName = String(formData.get('familyContactName') ?? '').trim();
  const contactRelationship = String(formData.get('familyContactRelationship') ?? '').trim();
  const inviteRequestId = String(formData.get('inviteRequestId') ?? '');
  if (!uuid.test(organizationId) || !uuid.test(locationId) || !uuid.test(requestId)
    || !caseReference || caseReference.length > 60 || !familyName || familyName.length > 200
    || !personName || personName.length > 200) {
    return failure('validation', 'Enter a case reference, family name, and person’s name. Nothing was created.');
  }
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return failure('validation', 'Enter a valid family contact email, or leave it blank. Nothing was created.');
  }
  const authority = await caseCreationClient();
  if (!authority) return failure('denied', 'Sign in with an authorized account to create a case. Nothing changed.');
  const result = await authority.client.rpc('create_case_manual_idempotent', {
    p_organization_id: organizationId,
    p_organization_location_id: locationId,
    p_case_reference: caseReference,
    p_family_name: familyName,
    p_person_name: personName,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return failure('denied', 'You do not have case-creation authority at this location. Nothing changed.');
    if (result.error.code === '55001') return failure('upgrade-required', result.error.message?.trim() || 'Your plan does not include another active case. Upgrade to continue.');
    if (result.error.code === '22023') return failure('validation', 'Review the case details. Nothing was created.');
    return failure('unavailable', 'Passage could not create this case right now. Nothing was created.');
  }
  const receipt = firstRpcRow<CaseCreationReceipt>(result.data);
  if (!receipt?.workflow_id) return failure('unavailable', 'Passage did not confirm the new case. Reload before trying again.');
  revalidatePath('/director');
  revalidatePath('/director/activity');

  let message = receipt.replayed ? 'This case was already created.' : 'Case created with the standard checklist.';

  // Automatic, not a manual afterthought: if a primary family contact was
  // given at intake, invite and actually email them the secure link in the
  // same step, instead of requiring a second manual trip to the Case
  // Room's separate invitation form. Reuses the exact same
  // create_case_family_invitation_idempotent RPC that form already calls
  // (no duplicated invitation-creation logic) and the same Resend sender
  // already proven for task communications -- this is real delivery, not
  // another "copy this link yourself" dead end. A failure here never rolls
  // back the case itself; it's reported honestly, not silently dropped.
  if (contactEmail && contactName && uuid.test(inviteRequestId)) {
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    const inviteResult = await authority.client.rpc('create_case_family_invitation_idempotent', {
      p_workflow_id: receipt.workflow_id,
      p_invited_email: contactEmail,
      p_display_name: contactName,
      p_relationship: contactRelationship || 'Family contact',
      p_purpose: 'Stay updated on this case',
      p_expires_at: expiresAt,
      p_request_id: inviteRequestId,
    });
    if (inviteResult.error || !firstRpcRow<FamilyInvitationReceipt>(inviteResult.data)?.raw_token) {
      message += ` We could not create a family invitation for ${contactEmail} — send one from the case page.`;
    } else {
      const inviteReceipt = firstRpcRow<FamilyInvitationReceipt>(inviteResult.data)!;
      const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.thepassageapp.io';
      const inviteLink = `${origin}/family-invite/${inviteReceipt.raw_token}`;
      const emailResult = await sendTaskCommunicationEmail({
        to: [contactEmail],
        subject: `You've been invited to follow ${personName}'s case on Passage`,
        text: `Hi ${contactName},\n\n${authority.viewer.organizationName} has opened a Passage case for ${personName} and invited you to follow it.\n\nOpen your secure invitation: ${inviteLink}\n\nThis link is unique to you and expires in 30 days. No account or password is needed to accept it.\n\n— Passage`,
      });
      message += emailResult.ok
        ? ` An invitation email was sent to ${contactEmail}.`
        : ` The invitation was created, but the email could not be sent (${emailResult.reason}) — share the secure link from the case page instead.`;
    }
  }

  return {
    status: 'saved',
    message,
    workflowId: receipt.workflow_id,
  };
}

export async function grantStaffLocation(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const memberId = String(formData.get('memberId') ?? '');
  const locationId = String(formData.get('locationId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const canCreateCases = String(formData.get('canCreateCases') ?? '') === 'true';
  if (!uuid.test(memberId) || !uuid.test(locationId) || !uuid.test(requestId)) {
    return failure('validation', 'Choose a staff member and location. Nothing changed.');
  }
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('grant_staff_location_idempotent', {
    p_organization_member_id: memberId,
    p_organization_location_id: locationId,
    p_can_create_cases: canCreateCases,
    p_request_id: requestId,
  });
  if (result.error) {
    if (result.error.code === '23505') return failure('conflict', 'This staff member already has this location. Nothing changed.');
    return rpcFailure(result.error, 'location grant');
  }
  const receipt = firstRpcRow<CaseCreationGrantReceipt>(result.data);
  if (!receipt) return failure('unavailable', 'Passage did not return a complete grant receipt. Reload before retrying.');
  revalidatePath('/director/team');
  revalidatePath('/director/activity');
  return {
    status: 'saved',
    message: receipt.replayed ? 'Already recorded. This staff member already has this location.' : 'Location added for this staff member.',
  };
}

export async function setStaffCaseCreationGrant(_previous: DirectorCommandState, formData: FormData): Promise<DirectorCommandState> {
  const memberId = String(formData.get('memberId') ?? '');
  const locationId = String(formData.get('locationId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const granted = String(formData.get('granted') ?? '') === 'true';
  const reason = String(formData.get('reason') ?? '').trim();
  if (!uuid.test(memberId) || !uuid.test(locationId) || !uuid.test(requestId) || (!granted && !reason)) {
    return failure('validation', 'Choose a staff member and location, and explain any removal of case-creation rights. Nothing changed.');
  }
  const authority = await directorClient();
  if (!authority) return failure('denied', 'You need director access to make this change. Nothing changed.');
  const result = await authority.client.rpc('set_staff_case_creation_grant_idempotent', {
    p_organization_member_id: memberId,
    p_organization_location_id: locationId,
    p_granted: granted,
    p_request_id: requestId,
    p_revocation_reason: granted ? null : reason,
  });
  if (result.error) return rpcFailure(result.error, 'case-creation grant');
  const receipt = firstRpcRow<CaseCreationGrantReceipt>(result.data);
  if (!receipt) return failure('unavailable', 'Passage did not return a complete grant receipt. Reload before retrying.');
  revalidatePath('/director/team');
  revalidatePath('/director/activity');
  return {
    status: 'saved',
    message: receipt.replayed
      ? 'Already recorded. This grant was already set to that state.'
      : receipt.can_create_cases
        ? 'This staff member can now create cases at this location.'
        : 'Case-creation rights were removed.',
  };
}
