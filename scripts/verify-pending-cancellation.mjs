import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHmac, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url='http://127.0.0.1:55321', publicKey=process.env.LOCAL_SUPABASE_PUBLISHABLE_KEY, localKey=process.env.LOCAL_SUPABASE_SECRET_KEY;
assert.ok(publicKey && localKey);
const admin=createClient(url,localKey,{auth:{persistSession:false,autoRefreshToken:false}});
const org=randomUUID(),users=[],jars=[],roles=['owner','admin','staff','reviewer','auditor'];
const cli=process.env.LOCAL_SUPABASE_CLI;
assert.ok(cli);
const runSql=q=> { writeFileSync('work/cancellation-query.sql',q); return execFileSync(cli,['db','query','--db-url','postgresql://postgres:postgres@127.0.0.1:55322/postgres','-f','work/cancellation-query.sql'],{encoding:'utf8',env:{...process.env,SUPABASE_TELEMETRY_DISABLED:'1'}}); };
const sql=q=>runSql('DO $fixture$ BEGIN EXECUTE $sql$'+q+'$sql$; END $fixture$;');
const read=q=>{const output=runSql(q);return JSON.parse(output.slice(output.indexOf('{'))).rows;};

function totp(secret){
 let bits='';for(const c of secret.replace(/=/g,''))bits+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c).toString(2).padStart(5,'0');
 const key=Buffer.from(bits.match(/.{8}/g).map(x=>parseInt(x,2))),step=Buffer.alloc(8);
 step.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
 const digest=createHmac('sha1',key).update(step).digest(),offset=digest[19]&15;
 return ((digest.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');
}

const record=randomUUID(),tokens=[randomBytes(32).toString('hex'),randomBytes(32).toString('hex')],invitations=[randomUUID(),randomUUID()];
const anon=createClient(url,publicKey,{auth:{persistSession:false}});
let browser;
try {
 for(const role of roles){
  const email='cancel-'+role+'-'+randomUUID()+'@local.authority.test',password=randomUUID()+'aA1!',cookies=new Map();
  const made=await admin.auth.admin.createUser({email,password,email_confirm:true});if(made.error)throw made.error;users.push(made.data.user.id);jars.push(cookies);
  const client=createServerClient(url,publicKey,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:rows=>rows.forEach(r=>cookies.set(r.name,r.value))}});
  const signed=await client.auth.signInWithPassword({email,password});if(signed.error)throw signed.error;
  const enrolled=await client.auth.mfa.enroll({factorType:'totp'});if(enrolled.error)throw enrolled.error;
  const checked=await client.auth.mfa.challengeAndVerify({factorId:enrolled.data.id,code:totp(enrolled.data.totp.secret)});if(checked.error)throw checked.error;
 }
 sql("insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status) values('"+org+"','Sample Cancellation Bank','Sample Cancellation Bank','regional_bank','1 Test Way','Albany','NY','12207','"+users[0]+"','ready');"+users.map((id,i)=>"insert into public.organization_memberships(organization_id,user_id,email_normalized,display_name,role) select '"+org+"',id,email,'Synthetic "+roles[i]+"','"+roles[i]+"' from auth.users where id='"+id+"';").join(''));
 sql("insert into public.authority_records(id,organization_id,created_by,status,template_key,template_version,account_boundary,principal_name,principal_email_normalized,representative_name,representative_email_normalized,allowed_action_keys,valid_until,activated_at) values('"+record+"','"+org+"','"+users[0]+"','awaiting_principal','ny_financial_poa','2026.1','Sample account ending 1402','Casey Quinn','casey@local.authority.test','Parker Quinn','parker@local.authority.test',array['receive_duplicate_statements'],now()+interval '30 days',now());"+['principal','representative'].map((role,i)=>"insert into public.authority_participant_invitations(id,organization_id,authority_record_id,participant_role,email_normalized,invited_by,expires_at) values('"+invitations[i]+"','"+org+"','"+record+"','"+role+"','"+role+"@local.authority.test','"+users[0]+"',now()+interval '3 days'); insert into authority_private.participant_invitation_secrets(invitation_id,token_hash) values('"+invitations[i]+"',encode(extensions.digest(convert_to('"+tokens[i]+"','UTF8'),'sha256'),'hex')); ").join(''));
 const initial=await anon.rpc('exchange_participant_invitation_v1',{p_token:tokens[0],p_idempotency_key:randomUUID()});if(initial.error)throw initial.error;
 browser=await chromium.launch({channel:'chrome',headless:true});
 const contexts=[],pages=[],errors=[];
 for(let i=0;i<roles.length;i++){
  const context=await browser.newContext({viewport:{width:1280,height:900}});contexts.push(context);
  await context.addCookies([...jars[i]].map(([name,value])=>({name,value,domain:'127.0.0.1',path:'/',httpOnly:false,sameSite:'Lax'})));
  const page=await context.newPage();pages.push(page);page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3100/app/requests/'+record);
  await page.getByRole('heading',{name:'Casey Quinn to Parker Quinn'}).waitFor();
  assert.equal(await page.getByText('Cancel this request',{exact:true}).count(),i<3?1:0);
 }
 const page=pages[0];await page.getByText('Cancel this request',{exact:true}).click();
 const form=page.locator('form').filter({has:page.locator('#cancellation-reason')});
 await page.locator('#cancellation-reason').fill('A duplicate request was opened by mistake.');
 await form.locator('[name=acknowledged]').check();
 await form.locator('[name=expectedVersion]').evaluate(e=>{e.value='999';});
 await form.getByRole('button',{name:'Cancel request',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'request changed'}).waitFor();
 assert.equal(await page.locator('#cancellation-reason').inputValue(),'A duplicate request was opened by mistake.');
 assert.equal(await form.locator('[name=acknowledged]').isChecked(),true);
 assert.equal(await page.getByRole('alert').filter({hasText:'request changed'}).evaluate(e=>e===document.activeElement),true);
 await form.locator('[name=expectedVersion]').evaluate(e=>{e.value='1';});
 for(const width of [1280,390,360]){
  await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const button=form.getByRole('button',{name:'Cancel request',exact:true});await button.focus();assert.ok((await button.boundingBox()).height>=44);
 }
 let post;page.on('request',request=>{if(request.method()==='POST'&&request.headers()['next-action'])post=request;});
 await form.getByRole('button',{name:'Cancel request',exact:true}).press('Enter');
 await page.waitForURL('**/receipt');await page.getByRole('heading',{name:'Request canceled',exact:true}).waitFor();
 assert.ok(post);const headers={};for(const name of ['next-action','content-type','accept','next-router-state-tree'])if(post.headers()[name])headers[name]=post.headers()[name];
 await contexts[0].request.post(post.url(),{headers,data:post.postDataBuffer()});
 const denied=await contexts[3].request.post(post.url(),{headers,data:post.postDataBuffer()});assert.match(await denied.text(),/Only an owner/);
 const saved=read("select receipt_sha256,receipt_snapshot::text as snapshot from public.authority_request_cancellations where authority_record_id='"+record+"';")[0];
 assert.equal(createHash('sha256').update(saved.snapshot).digest('hex'),saved.receipt_sha256);
 assert.equal(read("select count(*)::int as count from public.authority_events where authority_record_id='"+record+"' and event_type='authority.canceled';")[0].count,1);
 assert.equal(read("select count(*)::int as count from public.authority_institution_decisions where authority_record_id='"+record+"';")[0].count,0);
 for(let i=0;i<pages.length;i++){
  await pages[i].goto('http://127.0.0.1:3100/app/requests/'+record+'/receipt');
  await pages[i].getByText('A duplicate request was opened by mistake.',{exact:true}).waitFor();
  await pages[i].getByText(saved.receipt_sha256,{exact:true}).count().then(n=>assert.equal(n,1));
 }
 const representative=await anon.rpc('exchange_participant_invitation_v1',{p_token:tokens[1],p_idempotency_key:randomUUID()});if(representative.error)throw representative.error;
 for(const session of [initial.data,representative.data]){
  const context=await browser.newContext({viewport:{width:360,height:900}});
  await context.addCookies([{name:'pa_participant_session',value:session.session_token,domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Lax'}]);
  const participantPage=await context.newPage();participantPage.on('pageerror',e=>errors.push(e.message));
  await participantPage.goto('http://127.0.0.1:3100/request/'+record+'/overview');await participantPage.getByRole('link',{name:'View cancellation receipt'}).click();
  await participantPage.getByText('A duplicate request was opened by mistake.',{exact:true}).waitFor();
  assert.equal(await participantPage.locator('form').count(),0);assert.equal(await participantPage.getByText(saved.receipt_sha256,{exact:true}).count(),1);
  assert.ok(await participantPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await participantPage.screenshot({path:'work/cancellation-'+session.participant_role+'.png',fullPage:true});await context.close();
 }
 await page.screenshot({path:'work/cancellation-institution.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,record,organization:org,receiptHash:saved.receipt_sha256,checks:['five institution roles','stale page keeps reason and checkbox','keyboard cancellation','1280/390/360','exact POST replay','reviewer POST denied','one cancellation event and no decision','five institution and two participant receipt agreement','independent SHA256 replay']}));
}finally{
 if(browser)await browser.close();
 if(users.length)sql("update public.organizations set status='closed' where id='"+org+"';");
 for(const id of users){const result=await admin.auth.admin.updateUserById(id,{ban_duration:'876000h'});if(result.error)throw result.error;}
 console.log('Synthetic history retained; fixture organization closed and fixture accounts banned.');
}
