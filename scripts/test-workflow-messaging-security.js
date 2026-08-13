#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function source(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
}

function lexExecutableSql(sql, includeDollarBody = false) {
  const tokens = [];
  let index = 0;

  function readSingleQuoted(start, escapeBackslashes) {
    let cursor = start + 1;
    while (cursor < sql.length) {
      if (escapeBackslashes && sql[cursor] === '\\') {
        cursor += Math.min(2, sql.length - cursor);
        continue;
      }
      if (sql[cursor] === "'" && sql[cursor + 1] === "'") {
        cursor += 2;
        continue;
      }
      if (sql[cursor] === "'") return cursor + 1;
      cursor += 1;
    }
    return sql.length;
  }

  function readDoubleQuoted(start) {
    let cursor = start + 1;
    while (cursor < sql.length) {
      if (sql[cursor] === '"' && sql[cursor + 1] === '"') {
        cursor += 2;
        continue;
      }
      if (sql[cursor] === '"') return cursor + 1;
      cursor += 1;
    }
    return sql.length;
  }

  function skipBlockComment(start) {
    let cursor = start + 2;
    let depth = 1;
    while (cursor < sql.length && depth > 0) {
      if (sql[cursor] === '/' && sql[cursor + 1] === '*') {
        depth += 1;
        cursor += 2;
      } else if (sql[cursor] === '*' && sql[cursor + 1] === '/') {
        depth -= 1;
        cursor += 2;
      } else {
        cursor += 1;
      }
    }
    return cursor;
  }

  while (index < sql.length) {
    const current = sql[index];
    const next = sql[index + 1];

    if (/\s/.test(current)) {
      index += 1;
      continue;
    }
    if (current === '-' && next === '-') {
      const newline = sql.indexOf('\n', index + 2);
      index = newline === -1 ? sql.length : newline + 1;
      continue;
    }
    if (current === '/' && next === '*') {
      index = skipBlockComment(index);
      continue;
    }

    const previous = tokens[tokens.length - 1];
    const isEscapeStringPrefix = (current === 'e' || current === 'E')
      && next === "'"
      && (!previous || previous.end !== index || previous.type !== 'word');
    if (isEscapeStringPrefix) {
      const end = readSingleQuoted(index + 1, true);
      tokens.push({
        type: 'string',
        empty: end === index + 3,
        start: index,
        end,
      });
      index = end;
      continue;
    }
    if (current === "'") {
      const end = readSingleQuoted(index, false);
      tokens.push({
        type: 'string',
        empty: end === index + 2,
        start: index,
        end,
      });
      index = end;
      continue;
    }
    if (current === '"') {
      const end = readDoubleQuoted(index);
      tokens.push({ type: 'quoted-identifier', start: index, end });
      index = end;
      continue;
    }
    if (current === '$') {
      const delimiterMatch = sql.slice(index).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/);
      if (delimiterMatch) {
        const delimiter = delimiterMatch[0];
        const bodyStart = index + delimiter.length;
        const bodyEnd = sql.indexOf(delimiter, bodyStart);
        const end = bodyEnd === -1 ? sql.length : bodyEnd + delimiter.length;
        const isExecutableDoBody = includeDollarBody
          || (previous && previous.type === 'word' && previous.value === 'do');
        if (isExecutableDoBody) {
          const body = sql.slice(bodyStart, bodyEnd === -1 ? sql.length : bodyEnd);
          tokens.push(...lexExecutableSql(body, false));
        } else {
          tokens.push({ type: 'dollar-string', start: index, end });
        }
        index = end;
        continue;
      }
    }
    if (/[A-Za-z_]/.test(current)) {
      const word = sql.slice(index).match(/^[A-Za-z_][A-Za-z0-9_$]*/)[0];
      tokens.push({
        type: 'word',
        value: word.toLowerCase(),
        start: index,
        end: index + word.length,
      });
      index += word.length;
      continue;
    }

    tokens.push({ type: 'symbol', value: current, start: index, end: index + 1 });
    index += 1;
  }

  return tokens;
}

function tokenMatches(token, type, value) {
  if (!token || token.type !== type) return false;
  if (type === 'string' && value === 'empty') return token.empty === true;
  return value === undefined || token.value === value;
}

function containsTokenSequence(tokens, sequence) {
  return tokens.some((_, start) => sequence.every(
    ([type, value], offset) => tokenMatches(tokens[start + offset], type, value)
  ));
}

const canonicalSearchPathAssertion = "function_option.option_value = pg_catalog.quote_ident('')";
const obsoleteSearchPathAssertion = "function_option.option_value = ''";
const searchPathPrefix = [
  ['word', 'function_option'],
  ['symbol', '.'],
  ['word', 'option_value'],
  ['symbol', '='],
];
const canonicalSearchPathTokens = [
  ...searchPathPrefix,
  ['word', 'pg_catalog'],
  ['symbol', '.'],
  ['word', 'quote_ident'],
  ['symbol', '('],
  ['string', 'empty'],
  ['symbol', ')'],
];
const obsoleteSearchPathTokens = [
  ...searchPathPrefix,
  ['string', 'empty'],
];

function hasExactExecutableSearchPathAssertion(sql) {
  const tokens = lexExecutableSql(sql);
  const hasCanonical = containsTokenSequence(tokens, canonicalSearchPathTokens);
  const hasObsolete = containsTokenSequence(tokens, obsoleteSearchPathTokens);
  return hasCanonical && !hasObsolete;
}

const initialMigration = source('supabase/migrations/20260727020000_workflow_messages_thin_slice.sql');
const migration = source('supabase/migrations/20260729034001_workflow_messages_client_projection.sql');
const triggerHardening = source('supabase/migrations/20260729053000_workflow_messages_trigger_search_path.sql');
const loader = source('lib/messaging/hosted.ts');
const thread = source('components/messaging/MessageThread.tsx');
const directorPage = source('app/director/cases/[workflowId]/page.tsx');
const familyMessagesPage = source('app/case/[id]/messages/page.tsx');
const appFrame = source('components/operations/AppFrame.tsx');
const actions = source('lib/messaging/actions.ts');
const familyMessagesView = source('lib/family/messages-view.ts');
const sqlMatrix = source('supabase/tests/workflow_messages_client_projection.sql');
const ledger = JSON.parse(source('docs/product/frontend-backend-contracts.json'));

const authorityStart = migration.indexOf('create or replace function passage_private.can_message_workflow');
const authorityEnd = migration.indexOf('create or replace function passage_private.list_workflow_messages_client_safe');
const messageAuthority = migration.slice(authorityStart, authorityEnd);
const listStart = migration.indexOf('create or replace function passage_private.list_workflow_messages_client_safe');
const listEnd = migration.indexOf('create or replace function public.list_workflow_messages_client_safe');
const privateList = migration.slice(listStart, listEnd);
const resultStart = privateList.indexOf('returns table (');
const resultEnd = privateList.indexOf(')\nlanguage plpgsql', resultStart);
const resultSignature = privateList.slice(resultStart, resultEnd);
const sensitiveNames = [
  'sender_user_id',
  'sender_organization_member_id',
  'sender_continuity_participant_id',
  'creation_request_id',
  'organization_id',
];

check(
  'authenticated table SELECT is revoked and the client policy is removed',
  migration.includes('drop policy if exists workflow_messages_authorized_select')
    && migration.includes('revoke select on table public.workflow_messages from authenticated')
);
check(
  'trigger hardening is one exact forward-only ALTER FUNCTION',
  triggerHardening.trim() === "alter function passage_private.reject_workflow_message_mutation() set search_path = '';"
);
check(
  'SQL preflight proves the hardened function and attached trigger shape',
  sqlMatrix.includes("function_row.proname = 'reject_workflow_message_mutation'")
    && sqlMatrix.includes('function_row.pronargs = 0')
    && sqlMatrix.includes('pg_catalog.pg_options_to_table(')
    && sqlMatrix.includes("function_option.option_name = 'search_path'")
    && hasExactExecutableSearchPathAssertion(sqlMatrix)
    && sqlMatrix.includes("trigger_row.tgname = 'workflow_messages_append_only'")
    && sqlMatrix.includes('trigger_row.tgtype = 27')
);
const matrixWithoutCanonicalAssertion = sqlMatrix.replace(
  canonicalSearchPathAssertion,
  'function_option.option_value = function_option.option_value'
);
const quotedCanonicalAssertion = canonicalSearchPathAssertion.replaceAll("'", "''");
const canonicalOnlyInCommentMutation = matrixWithoutCanonicalAssertion
  + `\n-- ${canonicalSearchPathAssertion}\n`
  + `/* outer /* nested ${canonicalSearchPathAssertion} */ block */\n`;
check(
  'SQL preflight rejects a canonical search-path assertion in line or nested block comments',
  !hasExactExecutableSearchPathAssertion(canonicalOnlyInCommentMutation)
);
const canonicalOnlyInSingleQuoteMutation = matrixWithoutCanonicalAssertion
  + `\nselect '${quotedCanonicalAssertion}';\n`
  + `select E'escaped\\\\text ${quotedCanonicalAssertion}';\n`;
check(
  'SQL preflight rejects a canonical search-path assertion in standard or E strings',
  !hasExactExecutableSearchPathAssertion(canonicalOnlyInSingleQuoteMutation)
);
const canonicalOnlyInDoubleQuotedIdentifierMutation = matrixWithoutCanonicalAssertion
  + `\nselect "${canonicalSearchPathAssertion}";\n`;
check(
  'SQL preflight rejects a canonical search-path assertion in a double-quoted identifier',
  !hasExactExecutableSearchPathAssertion(canonicalOnlyInDoubleQuotedIdentifierMutation)
);
const canonicalOnlyInDollarQuoteMutation = matrixWithoutCanonicalAssertion
  + `\nselect $decoy_tag$${canonicalSearchPathAssertion}$decoy_tag$;\n`
  + `select $$${canonicalSearchPathAssertion}$$;\n`;
check(
  'SQL preflight rejects a canonical search-path assertion in tagged or untagged dollar strings',
  !hasExactExecutableSearchPathAssertion(canonicalOnlyInDollarQuoteMutation)
);
const obsoleteExecutableMutation = sqlMatrix.replace(
  canonicalSearchPathAssertion,
  obsoleteSearchPathAssertion
);
check(
  'SQL preflight rejects the obsolete executable empty-string comparison',
  !hasExactExecutableSearchPathAssertion(obsoleteExecutableMutation)
);
check(
  'SQL preflight accepts the restored exact executable search-path assertion',
  hasExactExecutableSearchPathAssertion(sqlMatrix)
);
check(
  'client-safe result has only the approved message projection',
  ['message_id uuid', 'sender_kind text', 'sender_label text', 'body text', 'occurred_at timestamp with time zone', 'is_own boolean']
    .every((field) => resultSignature.includes(field))
    && sensitiveNames.every((field) => !resultSignature.includes(field)),
  resultSignature
);
check(
  'message authority is purpose- and assignment-specific',
  messageAuthority.includes('space_row.owner_user_id = (select auth.uid())')
    && messageAuthority.includes("participant_row.status = 'active'")
    && messageAuthority.includes("'updates' = any (participant_row.category_scope)")
    && messageAuthority.includes('passage_private.can_manage_location(')
    && messageAuthority.includes("member_row.role = 'staff'")
    && messageAuthority.includes('grant_row.revoked_at is null')
    && messageAuthority.includes('task_row.assigned_organization_member_id =')
    && messageAuthority.includes('member_row.id')
);
check(
  'client-safe list and post use only message-specific authority',
  privateList.includes('not passage_private.can_message_workflow(p_workflow_id)')
    && privateList.includes('message_row.sender_user_id = v_actor_user_id')
    && migration.split('not passage_private.can_message_workflow(p_workflow_id)').length === 3
    && !privateList.includes('can_view_workflow(')
);
check(
  'only authenticated callers receive list-RPC execution',
  migration.includes('revoke all on function\n  public.list_workflow_messages_client_safe(uuid)\n  from public, anon, authenticated, service_role;')
    && migration.includes('grant execute on function\n  public.list_workflow_messages_client_safe(uuid)\n  to authenticated;')
);
check(
  'sender labels are database-bounded and server-truncated to 48 characters',
  migration.includes('workflow_messages_sender_label_length_check')
    && migration.includes('between 1 and 48')
    && migration.includes('v_sender_label := left(v_sender_label, 48);')
);
check(
  'message replay rejects actor or body conflicts',
  migration.includes('v_existing.sender_user_id is distinct from v_actor_user_id')
    && migration.includes('v_existing.body is distinct from v_body')
    && migration.includes("using errcode = '22023'")
);
check(
  'SQL matrix denies excess scope and preserves no-write cardinality',
  sqlMatrix.includes('Non-updates participant read unexpectedly succeeded')
    && sqlMatrix.includes('Non-updates participant post unexpectedly succeeded')
    && sqlMatrix.includes('Unassigned staff post unexpectedly succeeded')
    && sqlMatrix.includes('Revoked staff post unexpectedly succeeded')
    && sqlMatrix.includes('Wrong-location director post unexpectedly succeeded')
    && sqlMatrix.includes('Direct authenticated message INSERT unexpectedly succeeded')
    && sqlMatrix.includes('Changed-actor replay unexpectedly succeeded')
    && sqlMatrix.includes('Denied or conflicting requests changed message cardinality')
);
check(
  'SQL matrix scopes projection cardinality to its four request receipts',
  !/select count\(\*\)\s+from public\.list_workflow_messages_client_safe\(v_workflow_id\)\s+\) <> v_expected_message_count/m.test(sqlMatrix)
    && sqlMatrix.includes('v_owner_message_id := v_first.message_id;')
    && sqlMatrix.includes('v_participant_message_id := v_row.message_id;')
    && sqlMatrix.includes('v_director_message_id := v_row.message_id;')
    && sqlMatrix.includes('v_staff_message_id := v_row.message_id;')
    && sqlMatrix.split('where message_id in (v_owner_message_id, v_participant_message_id, v_director_message_id, v_staff_message_id)').length >= 10
);
check(
  'server loader uses only the client-safe RPC',
  loader.includes(".rpc('list_workflow_messages_client_safe'")
    && !loader.includes(".from('workflow_messages')")
    && !loader.includes('sender_user_id')
    && !loader.includes('currentUserId')
);
check(
  'participant sender labels use plain punctuation without dash encoding',
  initialMigration.includes("then 'Family: ' || initcap")
    && migration.includes("then 'Family: ' || initcap")
    && !initialMigration.includes('—')
    && !migration.includes('—')
);
check(
  'active updates participant reaches the message loader through the bounded identity fallback',
  familyMessagesView.includes("client.rpc('get_family_case_update_for_workflow', { p_workflow_id: workflowId })")
    && familyMessagesView.includes("if (!row) return { ok: false, reason: 'not-authorized' };")
    && familyMessagesView.indexOf("client.rpc('get_family_case_update_for_workflow'")
      < familyMessagesView.indexOf('loadWorkflowMessages(client, workflowId)')
);
check(
  'server loader produces an explicit UTC display value',
  loader.includes('occurredAtLabel: formatWorkflowMessageTimeUtc(row.occurred_at)')
    && loader.includes('${period} UTC')
);
check(
  'client thread renders the server label without client date formatting',
  thread.includes('<time dateTime={message.occurredAt}>{message.occurredAtLabel}</time>')
    && !thread.includes('Intl.DateTimeFormat')
    && !thread.includes('new Date(')
);
check(
  'history failure returns before the composer and offers recovery',
  thread.indexOf('if (loadError)') >= 0
    && thread.indexOf('if (loadError)') < thread.indexOf('<form action={action}')
    && thread.includes('Reload messages')
    && directorPage.includes('loadError={messagesResult.ok ? undefined : messagesResult.message}')
);
check(
  'family message navigation keeps interactive targets at least 48 pixels tall',
  familyMessagesPage.includes("minHeight: 48")
    && source('components/messaging/MessageThread.module.css').includes('min-height: 48px')
);
check(
  'message copy distinguishes saved in Passage from external delivery',
  thread.includes('no email or text is sent')
    && actions.includes('Message added to this case.')
    && !actions.includes('Message sent.')
);
check(
  'Case Room does not mark Today as the current page',
  directorPage.includes('<AppFrame active="case"')
    && appFrame.includes("'director' | 'case' | 'team'")
);
const sharedContract = ledger.contracts.find((contract) => contract.id === 'm3.shared.workflow_messages');
const staffContract = ledger.contracts.find((contract) => contract.id === 'm3.staff.workflow_messages_backend');
check(
  'parity ledger does not claim a user-visible staff message surface',
  sharedContract
    && Array.isArray(sharedContract.persona)
    && !sharedContract.persona.includes('staff')
    && staffContract?.status === 'backend_only'
    && staffContract?.persona === 'staff'
    && staffContract?.frontend?.user_visible === false
    && staffContract?.frontend?.route === null
    && staffContract?.frontend?.component === null
);

console.log(`\nworkflow messaging security: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
