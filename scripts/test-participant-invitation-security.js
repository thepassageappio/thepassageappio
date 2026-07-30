#!/usr/bin/env node

const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const files = {
  rawInvitePage: read('app/invite/[token]/page.tsx'),
  continuePage: read('app/invite/continue/page.tsx'),
  inviteActions: read('app/invite/[token]/actions.ts'),
  acceptButton: read('app/invite/[token]/AcceptInvitationButton.tsx'),
  loginPage: read('app/login/page.tsx'),
  loginClient: read('app/login/LoginClient.tsx'),
  proxy: read('lib/supabase/proxy.ts'),
  intentCookie: read('lib/auth/invitation-intent-cookie.ts'),
  intentReader: read('lib/auth/invitation-intent.ts'),
  familyPage: read('app/family/page.tsx'),
  peoplePage: read('app/family/people/page.tsx'),
  peopleForm: read('app/family/people/InviteParticipantForm.tsx'),
  peopleActions: read('app/family/people/actions.ts'),
  participantPage: read('app/participant/page.tsx'),
  participantLoader: read('lib/continuity/participants.ts'),
  labels: read('lib/presentation/participant-labels.ts'),
  contracts: read('docs/product/frontend-backend-contracts.json'),
  migration: read('supabase/migrations/20260730021524_participant_updates_case_scope.sql'),
  sqlMatrix: read('supabase/tests/participant_updates_case_scope.sql'),
};

const combinedPersona = [
  files.rawInvitePage,
  files.continuePage,
  files.loginPage,
  files.peoplePage,
  files.peopleForm,
  files.participantPage,
].join('\n');
const participantProjectionSignature = files.migration.match(
  /create or replace function public\.list_participant_family_updates\(\)\s+returns table \(([\s\S]*?)\)\s+language sql/,
)?.[1] ?? '';
const terminalStateComponent = files.continuePage.slice(
  files.continuePage.indexOf('function TerminalInvitationState'),
);

function hasFailClosedFunctionSearchPathAssertion(sql) {
  const blockStart = sql.indexOf('from pg_catalog.pg_proc as function_row');
  const blockEnd = sql.indexOf(
    "message = 'Participant family-safe updates test refused: reviewed catalog behavior drifted'",
  );
  if (blockStart < 0 || blockEnd <= blockStart) return false;

  const block = sql.slice(blockStart, blockEnd);
  return block.includes("'passage_private.can_view_workflow_as_family(uuid)'::regprocedure")
    && block.includes("'public.list_participant_family_updates()'::regprocedure")
    && block.includes("array['search_path=\"\"']::text[]")
    && block.includes('pg_catalog.pg_options_to_table(')
    && block.includes("function_option.option_name = 'search_path'")
    && block.includes("function_option.option_value = pg_catalog.quote_ident('')")
    && block.includes('is distinct from pg_catalog.quote_ident(\'\')')
    && block.includes(') <> 2 then')
    && !block.includes('array_to_string(function_row.proconfig')
    && !block.includes("not like '%search_path=%'");
}

const missingSearchPathConfigMutant = files.sqlMatrix.replace(
  '@> array[\'search_path=""\']::text[]',
  'is null',
);
const nonemptySearchPathMutant = files.sqlMatrix.replace(
  'array[\'search_path=""\']::text[]',
  "array['search_path=public']::text[]",
);

const assertions = [
  ['raw invitation route is immediately exchanged for a server-held intent',
    files.proxy.includes("match(/^\\/invite\\/([^/]+)$/)")
      && files.proxy.includes("invitationMatch[1] !== 'continue'")
      && files.proxy.includes('INVITATION_INTENT_COOKIE')
      && files.proxy.includes('INVITATION_CONTINUE_PATH')
      && files.rawInvitePage.includes('Nothing was joined or changed')
      && !files.rawInvitePage.includes("rpc('inspect_passage_invitation'")],
  ['invitation intent cookie is bounded and inaccessible to client JavaScript',
    files.intentCookie.includes("httpOnly: true")
      && files.intentCookie.includes("sameSite: 'lax'")
      && files.intentCookie.includes("path: '/'")
      && files.intentCookie.includes('maxAge: 30 * 60')
      && files.intentReader.includes("import 'server-only'")],
  ['post-inspection auth and receipt URLs contain no invitation bearer',
    files.continuePage.includes("INVITATION_CONTINUE_PATH")
      && files.inviteActions.includes('readInvitationIntent()')
      && !files.continuePage.includes('bind(null, token)')
      && !files.inviteActions.includes('encodeURIComponent(token)')
      && !files.loginClient.includes("next.startsWith('/invite/')")
      && !files.loginClient.includes("next.slice('/invite/'.length)")],
  ['OAuth and email callbacks receive only the opaque continue path',
    files.loginClient.includes("callback.searchParams.set('next', next)")
      && files.loginPage.includes('next === INVITATION_CONTINUE_PATH')
      && files.loginClient.includes('shouldCreateUser: invitationIntent')],
  ['unified typed invitation inspection and separate POST acceptance remain',
    files.continuePage.includes("client.rpc('inspect_passage_invitation'")
      && !files.continuePage.includes('inspect_organization_invitation')
      && files.inviteActions.includes('export async function acceptInvitation()')
      && files.inviteActions.includes('export async function acceptParticipantInvitation()')
      && files.inviteActions.includes("client.rpc('accept_organization_invitation'")
      && files.inviteActions.includes("client.rpc('accept_participant_invitation'")],
  ['wrong-account recovery signs out while preserving the server-held intent',
    files.inviteActions.includes('export async function useAnotherInvitationAccount()')
      && files.inviteActions.includes("client.auth.signOut({ scope: 'local' })")
      && files.inviteActions.includes('if (signOutResult.error)')
      && files.inviteActions.includes('?error=signout-failed')
      && !files.inviteActions.includes('client.auth.signOut()')
      && files.continuePage.includes('Use another account')
      && files.continuePage.includes('receiptReplayDenied')],
  ['an explicit error suppresses every acceptance control',
    files.continuePage.includes('const actionable = !explicitError && !stateError && !receiptReplayDenied')
      && files.continuePage.includes("invitation.invitation_state === 'available'")
      && files.continuePage.includes('showAvailableDetails &&')],
  ['terminal states never render full invitation details without a verified same-user receipt',
    files.continuePage.includes('const showTerminalState = Boolean(')
      && files.continuePage.includes("invitation.invitation_state !== 'available'")
      && files.continuePage.includes('<TerminalInvitationState')
      && terminalStateComponent.length > 0
      && !/(inviter_display_name|space_name|invitation_role|scope_labels|invitation_purpose|invitation_expires_at)/.test(terminalStateComponent)],
  ['terminal and existing-access recoveries have safe destinations',
    files.continuePage.includes("code === 'existing-access'")
      && files.continuePage.includes('href="/participant">Open Shared with me')
      && files.continuePage.includes("code === 'invalid' || code === 'unavailable'")
      && files.continuePage.includes('href="/">Return to Passage')
      && files.continuePage.includes('href="/participant">Check current shared access')],
  ['coordinator creation uses the idempotent command and updates-only scope',
    files.peopleActions.includes("client.rpc('create_participant_invitation_idempotent'")
      && files.peopleActions.includes("categoryScope[0] !== 'updates'")
      && files.peopleForm.includes('value="updates"')],
  ['purpose limits match the database command contract',
    files.peopleActions.includes('purpose.length > 240')
      && files.peopleForm.includes('maxLength={240}')
      && !files.peopleForm.includes('maxLength={500}')],
  ['creation and acceptance expose field-linked errors and announced pending/results',
    files.peopleForm.includes('aria-invalid=')
      && files.peopleForm.includes('aria-describedby=')
      && files.peopleForm.includes('aria-live="polite"')
      && files.peopleForm.includes('role="status"')
      && files.acceptButton.includes('aria-live="polite"')
      && files.continuePage.includes('role="status"')],
  ['delivery truth and one-time non-navigation copy remain',
    files.peopleForm.includes('NOT SENT BY PASSAGE')
      && files.peopleForm.includes('Email named for this invitation')
      && files.continuePage.includes('Not sent by Passage')
      && files.peopleForm.includes('readOnly value={secureLink}')
      && files.peopleForm.includes('navigator.clipboard.writeText')
      && !files.peopleForm.includes('<Link')],
  ['raw link is not persisted or logged',
    !/(localStorage|sessionStorage|indexedDB|document\.cookie|analytics|console\.)/.test(files.peopleForm + files.peopleActions + files.inviteActions)],
  ['participant uses a bounded family-safe RPC, never direct workflow tables',
    files.participantLoader.includes("client.rpc('list_participant_family_updates')")
      && !files.participantLoader.includes(".from('workflows')")
      && !files.participantLoader.includes(".from('tasks')")
      && !files.participantLoader.includes(".from('workflow_events')")
      && !files.participantPage.includes('/case/')],
  ['participant landing renders all active update spaces instead of truncating to one',
    files.participantLoader.includes('spaces: familyUpdates')
      && files.participantPage.includes('projection.spaces.map')
      && !files.participantLoader.includes('participants.find(')],
  ['raw case-table family predicate is owner-only',
    files.migration.includes('space_row.owner_user_id = (select auth.uid())')
      && !files.migration.match(/can_view_workflow_as_family[\s\S]*continuity_participants as participant_row[\s\S]*\\$function\\$/)],
  ['bounded SQL projection returns human updates without protected identifiers',
    files.migration.includes('public.list_participant_family_updates()')
      && files.migration.includes("array['Family updates']::text[]")
      && files.migration.includes('returns no workflow, task, event, proof, review, organization, or member identifier')
      && participantProjectionSignature.length > 0
      && !/(workflow_id|task_id|event_id|proof_id|review_id|organization_id|organization_member_id)/.test(
        participantProjectionSignature,
      )],
  ['private predicate is not callable by authenticated users',
    files.migration.includes('from public, anon, authenticated, service_role')
      && !files.migration.match(/grant execute on function\s+passage_private\.can_view_workflow_as_family/)],
  ['rollback matrix proves multi-space output and direct raw-table denials',
    files.sqlMatrix.includes('did not receive both active family spaces')
      && files.sqlMatrix.includes('public.task_proofs')
      && files.sqlMatrix.includes('public.task_proof_reviews')
      && files.sqlMatrix.includes('private family workflow predicate')
      && files.sqlMatrix.includes('Family-safe projection exposed a protected identifier')
      && files.sqlMatrix.trimEnd().endsWith('rollback;')],
  ['rollback matrix requires exact empty search_path for both definer functions',
    hasFailClosedFunctionSearchPathAssertion(files.sqlMatrix)],
  ['rollback matrix source guard rejects a missing search_path configuration',
    !hasFailClosedFunctionSearchPathAssertion(missingSearchPathConfigMutant)],
  ['rollback matrix source guard rejects a nonempty search_path configuration',
    !hasFailClosedFunctionSearchPathAssertion(nonemptySearchPathMutant)],
  ['/family reaches authenticated people management',
    files.familyPage.includes('href="/family/people"')
      && files.familyPage.includes('Manage people with family access')],
  ['runtime and configuration narration is absent from participant-facing invitation and login',
    !combinedPersona.includes('publicRuntimeLabel')
      && !combinedPersona.includes('configuration.reason')
      && !combinedPersona.includes('server verified')
      && !combinedPersona.includes('runtime binding')],
  ['central human category labels remain on coordinator and invitation surfaces',
    files.labels.includes("updates: 'Family updates'")
      && files.peoplePage.includes('participantCategoryLabels')
      && files.continuePage.includes('participantCategoryLabels')],
  ['P2 mutation controls remain absent from P1',
    !/(rotateParticipant|revokeParticipant|declineParticipant|revokeContinuity)/.test(
      files.peoplePage + files.peopleActions + files.continuePage + files.inviteActions,
    )],
  ['participant invitation copy makes no unsupported delivery claim',
    !/\b(received|resend|delivered|opened)\b/i.test(
      files.peoplePage + files.peopleForm + files.participantPage,
    )],
  ['updates copy states the granted category and mapped-event truth without a publication claim',
    files.peopleForm.includes('The coordinator grants this category')
      && files.participantPage.includes('coordinator granted the Family updates category')
      && files.participantPage.includes('Mapped progress update')
      && files.contracts.includes('this source packet does not claim a separate publication approval predicate')
      && !/chose to share|latest approved update/i.test(
        files.peopleForm + files.participantPage + files.contracts,
      )],
];

let failed = 0;
for (const [name, passed] of assertions) {
  if (passed) console.log(`ok - ${name}`);
  else {
    failed += 1;
    console.error(`FAIL - ${name}`);
  }
}
if (failed) process.exit(1);
console.log(`PASS participant invitation P1 security/source guard (${assertions.length}/${assertions.length})`);
