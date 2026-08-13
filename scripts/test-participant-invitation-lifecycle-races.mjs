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
 * A reviewed reset must prepare five fresh participant invitations for five
 * distinct verified participant accounts in the same owner-controlled family
 * space. The message-revocation invitation must already be accepted and linked
 * to the synthetic workflow named by PASSAGE_P2_RACE_WORKFLOW_ID. This script
 * uses only ordinary owner and participant JWTs. It never uses a service key.
 */

import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const isolatedProjectRef = 'uyacxqtsiwlvtmhxvoxr';
const productionProjectRef = 'qsveqfchwylsbncsfgxe';
const fixedCancellationReason = 'Family coordinator canceled the invitation';
const fixedDeclineReason = 'Invited person declined the invitation';
const fixedAccessEndReason = 'Family coordinator ended participant access';

const required = [
  'PASSAGE_P2_RACE_PROJECT_REF',
  'PASSAGE_P2_RACE_DISPOSABLE',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'PASSAGE_P2_RACE_OWNER_JWT',
  'PASSAGE_P2_RACE_ROTATE_ACCEPT_JWT',
  'PASSAGE_P2_RACE_ROTATE_ACCEPT_TOKEN',
  'PASSAGE_P2_RACE_ROTATE_ACCEPT_INVITATION_ID',
  'PASSAGE_P2_RACE_ROTATE_ACCEPT_EXPIRES_AT',
  'PASSAGE_P2_RACE_ROTATE_ACCEPT_REQUEST_ID',
  'PASSAGE_P2_RACE_ROTATE_CANCEL_INVITATION_ID',
  'PASSAGE_P2_RACE_ROTATE_CANCEL_EXPIRES_AT',
  'PASSAGE_P2_RACE_ROTATE_CANCEL_REQUEST_ID',
  'PASSAGE_P2_RACE_DECLINE_ACCEPT_JWT',
  'PASSAGE_P2_RACE_DECLINE_ACCEPT_TOKEN',
  'PASSAGE_P2_RACE_DECLINE_ACCEPT_INVITATION_ID',
  'PASSAGE_P2_RACE_CANCEL_ACCEPT_JWT',
  'PASSAGE_P2_RACE_CANCEL_ACCEPT_TOKEN',
  'PASSAGE_P2_RACE_CANCEL_ACCEPT_INVITATION_ID',
  'PASSAGE_P2_RACE_REVOKE_JWT',
  'PASSAGE_P2_RACE_REVOKE_PARTICIPANT_ID',
  'PASSAGE_P2_RACE_REVOKE_REQUEST_ID',
  'PASSAGE_P2_RACE_WORKFLOW_ID',
  'PASSAGE_P2_RACE_MESSAGE_REQUEST_ID',
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

function client(jwt) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    },
  );
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

async function eventNames(owner, invitationId) {
  const result = await owner
    .from('workflow_events')
    .select('id,name,participant_invitation_id,continuity_participant_id')
    .eq('participant_invitation_id', invitationId);
  if (result.error) throw new Error(`event cardinality query failed: ${result.error.message}`);
  return result.data.map((row) => row.name);
}

const ownerA = client(process.env.PASSAGE_P2_RACE_OWNER_JWT);
const ownerB = client(process.env.PASSAGE_P2_RACE_OWNER_JWT);

// rotate versus accept
{
  const participant = client(process.env.PASSAGE_P2_RACE_ROTATE_ACCEPT_JWT);
  const args = {
    p_invitation_id: process.env.PASSAGE_P2_RACE_ROTATE_ACCEPT_INVITATION_ID,
    p_expires_at: process.env.PASSAGE_P2_RACE_ROTATE_ACCEPT_EXPIRES_AT,
    p_request_id: process.env.PASSAGE_P2_RACE_ROTATE_ACCEPT_REQUEST_ID,
  };
  const results = await Promise.all([
    ownerA.rpc('rotate_participant_invitation_idempotent', args),
    participant.rpc('accept_participant_invitation', { p_raw_token: process.env.PASSAGE_P2_RACE_ROTATE_ACCEPT_TOKEN }),
  ]);
  const { winner, firstWon } = assertOneWinner(results, 'rotate versus accept');
  const terminal = await invitationState(process.env.PASSAGE_P2_RACE_ROTATE_ACCEPT_TOKEN);
  assert.equal(terminal.invitation_state, firstWon ? 'revoked' : 'accepted', 'rotate/accept terminal state disagrees with winner');
  const names = await eventNames(ownerA, process.env.PASSAGE_P2_RACE_ROTATE_ACCEPT_INVITATION_ID);
  assert.equal(names.filter((name) => ['participant_invitation.rotated', 'participant_invitation.accepted'].includes(name)).length, 1, 'rotate/accept wrote duplicate terminal events');
  if (firstWon) {
    assert.ok(winner.raw_token, 'winning rotation did not return the one-time bearer');
    const projection = one({ data: (await ownerA.rpc('list_participant_invitation_projection')).data?.filter((row) => row.id === winner.invitation_id), error: null }, 'rotation child projection');
    assert.equal(projection.lifecycle_state, 'available', 'winning rotation left an orphan replacement');
  }
}

// rotate versus cancel
{
  const invitationId = process.env.PASSAGE_P2_RACE_ROTATE_CANCEL_INVITATION_ID;
  const results = await Promise.all([
    ownerA.rpc('rotate_participant_invitation_idempotent', {
      p_invitation_id: invitationId,
      p_expires_at: process.env.PASSAGE_P2_RACE_ROTATE_CANCEL_EXPIRES_AT,
      p_request_id: process.env.PASSAGE_P2_RACE_ROTATE_CANCEL_REQUEST_ID,
    }),
    ownerB.rpc('revoke_participant_invitation', {
      p_invitation_id: invitationId,
      p_reason: fixedCancellationReason,
    }),
  ]);
  const { winner, firstWon } = assertOneWinner(results, 'rotate versus cancel');
  const names = await eventNames(ownerA, invitationId);
  assert.equal(names.filter((name) => ['participant_invitation.rotated', 'participant_invitation.revoked'].includes(name)).length, 1, 'rotate/cancel wrote duplicate terminal events');
  if (firstWon) {
    const projection = one({ data: (await ownerA.rpc('list_participant_invitation_projection')).data?.filter((row) => row.id === winner.invitation_id), error: null }, 'rotate/cancel child projection');
    assert.equal(projection.lifecycle_state, 'available', 'rotate/cancel left an orphan replacement');
  }
}

// decline versus accept
{
  const participantA = client(process.env.PASSAGE_P2_RACE_DECLINE_ACCEPT_JWT);
  const participantB = client(process.env.PASSAGE_P2_RACE_DECLINE_ACCEPT_JWT);
  const token = process.env.PASSAGE_P2_RACE_DECLINE_ACCEPT_TOKEN;
  const results = await Promise.all([
    participantA.rpc('decline_participant_invitation', { p_raw_token: token, p_reason: fixedDeclineReason }),
    participantB.rpc('accept_participant_invitation', { p_raw_token: token }),
  ]);
  const { winner, firstWon } = assertOneWinner(results, 'decline versus accept');
  const terminal = await invitationState(token);
  assert.equal(terminal.invitation_state, firstWon ? 'revoked' : 'accepted', 'decline/accept terminal state disagrees with winner');
  const names = await eventNames(ownerA, process.env.PASSAGE_P2_RACE_DECLINE_ACCEPT_INVITATION_ID);
  assert.equal(names.filter((name) => ['participant_invitation.declined', 'participant_invitation.accepted'].includes(name)).length, 1, 'decline/accept wrote duplicate terminal events');
}

// cancel versus accept
{
  const participant = client(process.env.PASSAGE_P2_RACE_CANCEL_ACCEPT_JWT);
  const token = process.env.PASSAGE_P2_RACE_CANCEL_ACCEPT_TOKEN;
  const invitationId = process.env.PASSAGE_P2_RACE_CANCEL_ACCEPT_INVITATION_ID;
  const results = await Promise.all([
    ownerA.rpc('revoke_participant_invitation', { p_invitation_id: invitationId, p_reason: fixedCancellationReason }),
    participant.rpc('accept_participant_invitation', { p_raw_token: token }),
  ]);
  const { firstWon } = assertOneWinner(results, 'cancel versus accept');
  const terminal = await invitationState(token);
  assert.equal(terminal.invitation_state, firstWon ? 'revoked' : 'accepted', 'cancel/accept terminal state disagrees with winner');
  const names = await eventNames(ownerA, invitationId);
  assert.equal(names.filter((name) => ['participant_invitation.revoked', 'participant_invitation.accepted'].includes(name)).length, 1, 'cancel/accept wrote duplicate terminal events');
}

// message post after committed revocation
{
  const participant = client(process.env.PASSAGE_P2_RACE_REVOKE_JWT);
  one(await ownerA.rpc('revoke_continuity_participant_idempotent', {
    p_participant_id: process.env.PASSAGE_P2_RACE_REVOKE_PARTICIPANT_ID,
    p_reason: fixedAccessEndReason,
    p_request_id: process.env.PASSAGE_P2_RACE_REVOKE_REQUEST_ID,
  }), 'committed participant revocation');
  const beforeResult = await ownerA.rpc('list_workflow_messages_client_safe', {
    p_workflow_id: process.env.PASSAGE_P2_RACE_WORKFLOW_ID,
  });
  if (beforeResult.error) throw new Error(`message cardinality precheck failed: ${beforeResult.error.message}`);
  const beforeCount = beforeResult.data.length;
  const denied = await participant.rpc('post_workflow_message_idempotent', {
    p_workflow_id: process.env.PASSAGE_P2_RACE_WORKFLOW_ID,
    p_body: 'This post must be denied after access ends.',
    p_request_id: process.env.PASSAGE_P2_RACE_MESSAGE_REQUEST_ID,
  });
  assert.ok(denied.error, 'message post after committed revocation unexpectedly succeeded');
  assert.ok(['42501', 'PGRST202'].includes(denied.error.code), `unexpected revoked-message denial ${denied.error.code}`);
  const afterResult = await ownerA.rpc('list_workflow_messages_client_safe', {
    p_workflow_id: process.env.PASSAGE_P2_RACE_WORKFLOW_ID,
  });
  if (afterResult.error) throw new Error(`message cardinality postcheck failed: ${afterResult.error.message}`);
  assert.equal(afterResult.data.length, beforeCount, 'revoked message attempt changed message cardinality');
}

console.log('PASS participant P2 true-concurrency lifecycle races');
