import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile), cli=process.env.LOCAL_SUPABASE_CLI;
assert.ok(cli);
const actor=randomUUID(), org=randomUUID(), record=randomUUID(), token=randomBytes(32).toString('hex');
const query=async sql => (await exec(cli,['db','query','--db-url','postgresql://postgres:postgres@127.0.0.1:55322/postgres',sql],{env:{...process.env,SUPABASE_TELEMETRY_DISABLED:'1'},maxBuffer:1024*1024})).stdout;
const run=sql=>query('DO $race$ BEGIN '+sql+' END $race$;');
try {
 await run(`insert into auth.users(id,email,email_confirmed_at,created_at,updated_at) values('${actor}','${actor}@local.authority.test',now(),now(),now());
 insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status) values('${org}','Race Test Bank','Race Test Bank','regional_bank','1 Test Way','Albany','NY','12207','${actor}','ready');
 insert into public.organization_memberships(organization_id,user_id,email_normalized,role) values('${org}','${actor}','${actor}@local.authority.test','owner');
 insert into public.authority_records(id,organization_id,created_by,status,template_key,template_version,account_boundary,principal_name,principal_email_normalized,representative_name,representative_email_normalized,allowed_action_keys,valid_until,activated_at) values('${record}','${org}','${actor}','awaiting_principal','ny_financial_poa','2026.1','Sample account','Casey','casey@local.authority.test','Parker','parker@local.authority.test',array['receive_duplicate_statements'],now()+interval '30 days',now());
 insert into public.authority_participant_invitations(organization_id,authority_record_id,participant_role,email_normalized,invited_by,expires_at) select '${org}','${record}',r,r||'@local.authority.test','${actor}',now()+interval '3 days' from unnest(array['principal','representative']) r;
 insert into authority_private.participant_sessions(invitation_id,organization_id,authority_record_id,participant_role,token_hash,expires_at) select id,'${org}','${record}','principal',encode(extensions.digest(convert_to('${token}','UTF8'),'sha256'),'hex'),now()+interval '1 day' from public.authority_participant_invitations where authority_record_id='${record}' and participant_role='principal';`);
 const outcomes=await Promise.allSettled([
  run(`perform set_config('request.jwt.claims','{"sub":"${actor}","aal":"aal2","role":"authenticated"}',true); perform public.cancel_pending_request_v1('${org}','${record}',1,'Duplicate request',true,'${randomUUID()}');`),
  run(`perform authority_private.submit_participant_decision_v1('${token}','${record}',1,'principal_confirm',true,'','${randomUUID()}');`),
 ]);
 assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1,'exactly one competing transition must win');
 const output=await query(`select status,version,(select count(*)::int from public.authority_request_cancellations where authority_record_id='${record}') cancellations,(select count(*)::int from public.authority_participant_decisions where authority_record_id='${record}') decisions from public.authority_records where id='${record}'`);
 const row=JSON.parse(output.slice(output.indexOf('{'))).rows[0];
 assert.equal(row.version,2);
 assert.ok(['canceled','awaiting_representative'].includes(row.status));
 assert.equal(row.cancellations,row.status==='canceled'?1:0);
 assert.equal(row.decisions,row.status==='awaiting_representative'?1:0);
 console.log(JSON.stringify({passed:true,record,...row}));
}finally{
 await run(`update public.organizations set status='closed' where id='${org}'; update auth.users set banned_until=now()+interval '100 years' where id='${actor}';`);
}
