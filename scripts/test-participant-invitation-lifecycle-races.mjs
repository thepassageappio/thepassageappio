#!/usr/bin/env node

/**
 * True two-session P2 lifecycle race harness for the isolated lab only.
 *
 * Covered races:
 * - rotate versus accept
 * - rotate versus cancel
 * - decline versus accept
 * - cancel versus accept
 * - message post after committed revocation
 *
 * supabase/test-fixtures/participant_p2_race_reset.sql prepares five fresh
 * invitations for five distinct verified accounts in one owner-controlled
 * family space. This harness signs in every actor through ordinary password
 * authentication. It never accepts or uses a service key or privileged JWT.
 */

import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const isolatedProjectRef = 'uyacxqtsiwlvtmhxvoxr';
const productionProjectRef = 'qsveqfchwylsbncsfgxe';
const fixedCancellationReason = 'Family coordinator canceled the invitation';
const fixedDeclineReason = 'Invited person declined the invitation';
const fixedAccessEndReason = 'Family coordinator ended participant access';
const fixture = Object.freeze({
  rotateAcceptInvitationId: '82a10001-82a1-42a1-82a1-000000000001',
  rotateAcceptToken: 'p2-race-rotate-accept-token-20260810',
  rotateCancelInvitationId: '82a10002-82a1-42a1-82a1-000000000002',
  declineAcceptInvitationId: '82a10003-82a1-42a1-82a1-000000000003',
  declineAcceptToken: 'p2-race-decline-accept-token-20260810',
  cancelAcceptInvitationId: '82a10004-82a1-42a1-82a1-000000000004',
  cancelAcceptToken: 'p2-race-cancel-accept-token-20260810',
  revokeParticipantId: '82a20005-82a2-42a2-82a2-000000000005',
  workflowId: '82a30001-82a3-42a3-82a3-000000000001',
});

const required = [
  'PASSAGE_P2_RACE_PROJECT_REF',
  'PASSAGE_P2_RACE_DISPOSABLE',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'PASSAGE_P2_RACE_PASSWORD',
];

for (const name of required) assert.ok(process.env[name], `${name} is required`);
assert.equal(process.env.PASSAGE_P2_RACE_PROJECT_REF, isolatedProjectRef, 'exact isolated project attestation is required');
assert.notEqual(process.env.PASSAGE_P2_RACE_PROJECT_REF, productionProjectRef, 'Production is prohibited');
assert.equal(
  process.env.PASSAGE_P2_RACE_DISPOSABLE,
  'participant-p2-race-isolated-reset-approved',
  'reviewed disposable reset attestation is required',
);
const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
assert.equal(url.hostname.split('.')[0], isolatedProjectRef, 'Supabase URL must bind to the exact isolated project');

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  );
}

async function ordinarySession(email) {
  const ordinary = client();
  const result = await ordinary.auth.signInWithPassword({
    email,
    password: process.env.PASSAGE_P2_RACE_PASSWORD,
  });
  if (result.error) throw new Error(`ordinary sign-in failed for ${email}: ${result.error.message}`);
  assert.equal(result.data.user?.email?.toLowerCase(), email, `ordinary sign-in returned the wrong identity for ${email}`);
  assert.ok(result.data.session?.access_token, `ordinary sign-in returned no session for ${email}`);
  return ordinary;
}

function one(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.code ?? 'RPC'} ${result.error.message}`);
  const value = Array.isArray(result.data) ? result.data[0] : result.data;
  assert.ok(value, `${label}: RPC returned no receipt`);
  return value;
}

function assertOneWinner(results, label) {
  const successes = results.filter((result) => !result.error);
  const failures = results.filter((result) => result.error);
  assert.equal(successes.length, 1, `${label}: exactly one command must commit`);
  assert.equal(failures.length, 1, `${label}: the losing command must fail`);
  return { winner: one(successes[0], label), firstWon: !results[0].error };
}

async function invitationState(token) {
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  return one(await anon.rpc('inspect_passage_invitation', { p_raw_token: token }), 'inspect invitation');
}

async function rpcRows(actor, command, args, label) {
  const result = args === undefined
    ? await actor.rpc(command)
    : await actor.rpc(command, args);
  if (result.error) throw new Error(`${label}: ${result.error.code ?? 'RPC'} ${result.error.message}`);
  return Array.isArray(result.data) ? result.data : [];
}

async function ownerSnapshot(owner) {
  const [invitations, participants] = await Promise.all([
    rpcRows(owner, 'list_participant_invitation_projection', undefined, 'owner invitation projection'),
    rpcRows(owner, 'list_owned_continuity_participant_projection', undefined, 'owner participant projection'),
  ]);
  return { invitations, participants };
}

function rowById(rows, id, label) {
  const row = rows.find((candidate) => candidate.id === id);
  assert.ok(row, `${label}: expected row is absent`);
  return row;
}

const ownerA = await ordinarySession('p2-race-owner@passage.test');
const ownerB = await ordinarySession('p2-race-owner@passage.test');
const rotateAcceptParticipant = await ordinarySession('p2-race-rotate-accept@passage.test');
const declineAcceptParticipantA = await ordinarySession('p2-race-decline-accept@passage.test');
const declineAcceptParticipantB = await ordinarySession('p2-race-decline-accept@passage.test');
const cancelAcceptParticipant = await ordinarySession('p2-race-cancel-accept@passage.test');
const revokeParticipant = await ordinarySession('p2-race-revoke@passage.test');

const fixtureInvitations = await ownerA.rpc('list_participant_invitation_projection');
if (fixtureInvitations.error) throw new Error(`fixture invitation preflight failed: ${fixtureInvitations.error.message}`);
assert.deepEqual(
  fixtureInvitations.data
    .filter((row) => Object.values(fixture).includes(row.id))
    .map((row) => row.id)
    .sort(),
  [
    fixture.rotateAcceptInvitationId,
    fixture.rotateCancelInvitationId,
    fixture.declineAcceptInvitationId,
    fixture.cancelAcceptInvitationId,
  ].sort(),
  'fixture reset did not prepare the four actionable invitations',
);
const fixtureOwnerProjection = await ownerSnapshot(ownerA);
const fixtureParticipant = rowById(
  fixtureOwnerProjection.participants,
  fixture.revokeParticipantId,
  'fixture participant projection',
);
assert.equal(fixtureParticipant.status, 'active', 'fixture participant is not active before the race');

// rotate versus accept
{
  const before = await ownerSnapshot(ownerA);
  const args = {
    p_invitation_id: fixture.rotateAcceptInvitationId,
    p_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    p_request_id: '82a40001-82a4-42a4-82a4-000000000001',
  };
  const results = await Promise.all([
    ownerA.rpc('rotate_participant_invitation_idempotent', args),
    rotateAcceptParticipant.rpc('accept_participant_invitation', { p_raw_token: fixture.rotateAcceptToken }),
  ]);
  const { winner, firstWon } = assertOneWinner(results, 'rotate versus accept');
  const terminal = await invitationState(fixture.rotateAcceptToken);
  assert.equal(terminal.invitation_state, firstWon ? 'revoked' : 'accepted', 'rotate/accept terminal state disagrees with winner');
  const after = await ownerSnapshot(ownerA);
  const original = rowById(after.invitations, fixture.rotateAcceptInvitationId, 'rotate/accept original invitation');
  assert.equal(original.lifecycle_state, firstWon ? 'revoked' : 'accepted', 'rotate/accept owner projection disagrees with winner');
  assert.equal(after.invitations.length - before.invitations.length, firstWon ? 1 : 0, 'rotate/accept invitation delta disagrees with winner');
  assert.equal(after.participants.length - before.participants.length, firstWon ? 0 : 1, 'rotate/accept participant delta disagrees with winner');
  if (firstWon) {
    assert.ok(winner.raw_token, 'winning rotation did not return the one-time bearer');
    const projection = rowById(after.invitations, winner.invitation_id, 'rotation child projection');
    assert.equal(projection.lifecycle_state, 'available', 'winning rotation left an orphan replacement');
  } else {
    assert.ok(winner.participant_id, 'winning acceptance did not return the participant receipt');
  }
}

// rotate versus cancel
{
  const before = await ownerSnapshot(ownerA);
  const invitationId = fixture.rotateCancelInvitationId;
  const results = await Promise.all([
    ownerA.rpc('rotate_participant_invitation_idempotent', {
      p_invitation_id: invitationId,
      p_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      p_request_id: '82a40002-82a4-42a4-82a4-000000000002',
    }),
    ownerB.rpc('revoke_participant_invitation', {
      p_invitation_id: invitationId,
      p_reason: fixedCancellationReason,
    }),
  ]);
  const { winner, firstWon } = assertOneWinner(results, 'rotate versus cancel');
  const after = await ownerSnapshot(ownerA);
  assert.equal(rowById(after.invitations, invitationId, 'rotate/cancel original invitation').lifecycle_state, 'revoked', 'rotate/cancel did not close the original invitation');
  assert.equal(after.invitations.length - before.invitations.length, firstWon ? 1 : 0, 'rotate/cancel invitation delta disagrees with winner');
  assert.equal(after.participants.length, before.participants.length, 'rotate/cancel changed participant cardinality');
  if (firstWon) {
    assert.ok(winner.raw_token, 'winning rotation did not return the one-time bearer');
    const projection = rowById(after.invitations, winner.invitation_id, 'rotate/cancel child projection');
    assert.equal(projection.lifecycle_state, 'available', 'rotate/cancel left an orphan replacement');
  } else {
    assert.ok(winner.event_id, 'winning cancellation did not return its event receipt');
  }
}

// decline versus accept
{
  const before = await ownerSnapshot(ownerA);
  const token = fixture.declineAcceptToken;
  const results = await Promise.all([
    declineAcceptParticipantA.rpc('decline_participant_invitation', { p_raw_token: token, p_reason: fixedDeclineReason }),
    declineAcceptParticipantB.rpc('accept_participant_invitation', { p_raw_token: token }),
  ]);
  const { winner, firstWon } = assertOneWinner(results, 'decline versus accept');
  const terminal = await invitationState(token);
  assert.equal(terminal.invitation_state, firstWon ? 'revoked' : 'accepted', 'decline/accept terminal state disagrees with winner');
  const after = await ownerSnapshot(ownerA);
  assert.equal(rowById(after.invitations, fixture.declineAcceptInvitationId, 'decline/accept invitation').lifecycle_state, firstWon ? 'declined' : 'accepted', 'decline/accept owner projection disagrees with winner');
  assert.equal(after.invitations.length, before.invitations.length, 'decline/accept changed invitation cardinality');
  assert.equal(after.participants.length - before.participants.length, firstWon ? 0 : 1, 'decline/accept participant delta disagrees with winner');
  assert.ok(winner.event_id, 'decline/accept winner did not return its event receipt');
}

// cancel versus accept
{
  const before = await ownerSnapshot(ownerA);
  const token = fixture.cancelAcceptToken;
  const invitationId = fixture.cancelAcceptInvitationId;
  const results = await Promise.all([
    ownerA.rpc('revoke_participant_invitation', { p_invitation_id: invitationId, p_reason: fixedCancellationReason }),
    cancelAcceptParticipant.rpc('accept_participant_invitation', { p_raw_token: token }),
  ]);
  const { winner, firstWon } = assertOneWinner(results, 'cancel versus accept');
  const terminal = await invitationState(token);
  assert.equal(terminal.invitation_state, firstWon ? 'revoked' : 'accepted', 'cancel/accept terminal state disagrees with winner');
  const after = await ownerSnapshot(ownerA);
  assert.equal(rowById(after.invitations, invitationId, 'cancel/accept invitation').lifecycle_state, firstWon ? 'revoked' : 'accepted', 'cancel/accept owner projection disagrees with winner');
  assert.equal(after.invitations.length, before.invitations.length, 'cancel/accept changed invitation cardinality');
  assert.equal(after.participants.length - before.participants.length, firstWon ? 0 : 1, 'cancel/accept participant delta disagrees with winner');
  assert.ok(winner.event_id, 'cancel/accept winner did not return its event receipt');
}

// message post after committed revocation
{
  const participantSpacesBefore = await rpcRows(revokeParticipant, 'list_participant_continuity_spaces', undefined, 'participant space precheck');
  const participantProjectionBefore = await rpcRows(revokeParticipant, 'list_continuity_participant_projection', undefined, 'participant projection precheck');
  assert.equal(participantSpacesBefore.length, 1, 'participant has no bounded space before revocation');
  assert.equal(participantProjectionBefore.length, 1, 'participant has no bounded projection before revocation');
  const participantMessagesBefore = await rpcRows(revokeParticipant, 'list_workflow_messages_client_safe', {
    p_workflow_id: fixture.workflowId,
  }, 'participant message precheck');
  one(await ownerA.rpc('revoke_continuity_participant_idempotent', {
    p_participant_id: fixture.revokeParticipantId,
    p_reason: fixedAccessEndReason,
    p_request_id: '82a40005-82a4-42a4-82a4-000000000005',
  }), 'committed participant revocation');
  const beforeResult = await ownerA.rpc('list_workflow_messages_client_safe', {
    p_workflow_id: fixture.workflowId,
  });
  if (beforeResult.error) throw new Error(`message cardinality precheck failed: ${beforeResult.error.message}`);
  const beforeCount = beforeResult.data.length;
  const denied = await revokeParticipant.rpc('post_workflow_message_idempotent', {
    p_workflow_id: fixture.workflowId,
    p_body: 'This post must be denied after access ends.',
    p_request_id: '82a40006-82a4-42a4-82a4-000000000006',
  });
  assert.ok(denied.error, 'message post after committed revocation unexpectedly succeeded');
  assert.ok(['42501', 'PGRST202'].includes(denied.error.code), `unexpected revoked-message denial ${denied.error.code}`);
  const deniedList = await revokeParticipant.rpc('list_workflow_messages_client_safe', {
    p_workflow_id: fixture.workflowId,
  });
  assert.ok(deniedList.error, 'message list after committed revocation unexpectedly succeeded');
  assert.ok(['42501', 'PGRST202'].includes(deniedList.error.code), `unexpected revoked-message list denial ${deniedList.error.code}`);
  assert.equal((await rpcRows(revokeParticipant, 'list_participant_continuity_spaces', undefined, 'participant spaces after revocation')).length, 0, 'revoked participant retained a space projection');
  assert.equal((await rpcRows(revokeParticipant, 'list_continuity_participant_projection', undefined, 'participant projection after revocation')).length, 0, 'revoked participant retained participant projection');
  assert.equal((await rpcRows(revokeParticipant, 'list_participant_family_updates', undefined, 'participant updates after revocation')).length, 0, 'revoked participant retained family updates');
  const afterResult = await ownerA.rpc('list_workflow_messages_client_safe', {
    p_workflow_id: fixture.workflowId,
  });
  if (afterResult.error) throw new Error(`message cardinality postcheck failed: ${afterResult.error.message}`);
  assert.equal(beforeCount, participantMessagesBefore.length, 'owner and participant message projections disagreed before revocation');
  assert.equal(afterResult.data.length, beforeCount, 'revoked message attempt changed message cardinality');
  const ownerParticipantsAfter = await rpcRows(ownerA, 'list_owned_continuity_participant_projection', undefined, 'owner participant projection after revocation');
  assert.equal(rowById(ownerParticipantsAfter, fixture.revokeParticipantId, 'revoked participant owner projection').status, 'revoked', 'participant revocation did not persist in the authorized owner projection');
}

console.log('PASS participant P2 true-concurrency lifecycle races through ordinary authorized projections');
