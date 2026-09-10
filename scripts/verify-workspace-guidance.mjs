import assert from 'node:assert/strict';
import { randomUUID, createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url='http://127.0.0.1:55321', publicKey=process.env.LOCAL_SUPABASE_PUBLISHABLE_KEY, localKey=process.env.LOCAL_SUPABASE_SECRET_KEY;
assert.ok(publicKey && localKey);
const admin=createClient(url,localKey,{auth:{persistSession:false,autoRefreshToken:false}});
const org=randomUUID(),users=[],jars=[],roles=['owner','staff','reviewer','auditor'];
const sql=q=>execFileSync('docker',['exec','-i','supabase_db_passage-authority','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:q,encoding:'utf8'});
function totp(secret){
 let bits='';for(const c of secret.replace(/=/g,''))bits+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c).toString(2).padStart(5,'0');
 const key=Buffer.from(bits.match(/.{8}/g).map(x=>parseInt(x,2))),step=Buffer.alloc(8);
 step.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
 const digest=createHmac('sha1',key).update(step).digest(),offset=digest[19]&15;
 return ((digest.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');
}
let browser;
try {
 for(const role of roles){
  const email='workspace-'+role+'-'+randomUUID()+'@local.authority.test',password=randomUUID()+'aA1!',cookies=new Map();
  const made=await admin.auth.admin.createUser({email,password,email_confirm:true});if(made.error)throw made.error;users.push(made.data.user.id);jars.push(cookies);
  const client=createServerClient(url,publicKey,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:rows=>rows.forEach(r=>cookies.set(r.name,r.value))}});
  const signed=await client.auth.signInWithPassword({email,password});if(signed.error)throw signed.error;
  const enrolled=await client.auth.mfa.enroll({factorType:'totp'});if(enrolled.error)throw enrolled.error;
  const checked=await client.auth.mfa.challengeAndVerify({factorId:enrolled.data.id,code:totp(enrolled.data.totp.secret)});if(checked.error)throw checked.error;
 }
 sql("insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status) values('"+org+"','Sample Community Bank','Sample Community Bank','regional_bank','1 Test Way','Albany','NY','12207','"+users[0]+"','ready');"+users.map((id,i)=>"insert into public.organization_memberships(organization_id,user_id,email_normalized,display_name,role) select '"+org+"',id,email,'Synthetic "+roles[i]+"','"+roles[i]+"' from auth.users where id='"+id+"';").join(''));
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(let i=0;i<roles.length;i++){
  const context=await browser.newContext({viewport:{width:1280,height:1000}});
  await context.addCookies([...jars[i]].map(([name,value])=>({name,value,domain:'127.0.0.1',path:'/',httpOnly:false,sameSite:'Lax'})));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3100/app');
  await page.getByRole('heading',{name:i<2?'Complete one request from start to receipt':'You’re up to date'}).waitFor();
  assert.equal(await page.getByRole('link',{name:'New sample request',exact:true}).count(),i<2?1:0);
  {
   for(const [,status] of ['accepted','awaiting_principal','draft','under_review'].entries()){
    sql("insert into public.authority_records(organization_id,created_by,status,template_key,template_version,account_boundary,principal_name,principal_email_normalized,representative_name,representative_email_normalized,allowed_action_keys,valid_until,activated_at) values('"+org+"','"+users[0]+"','"+status+"','ny_financial_poa','2026.1','Sample relationship ending 9010','Casey Quinn','casey@local.authority.test','Parker Quinn','parker@local.authority.test',array['receive_duplicate_statements'],now()+interval '30 days',"+(status==='draft'?'null':'now()')+");");
   }
  }
  await page.reload();
  await page.getByRole('heading',{name:i===0||i===2?'A request is ready for your review':i===1?'Finish this draft':'Waiting on Institution reviewer'}).waitFor();
  assert.equal(await page.getByText('1 requested action',{exact:true}).count(),4);
  assert.equal(await page.getByText('1 permitted action',{exact:true}).count(),0);
  const next=page.getByRole('region',{name:/A request is ready|Finish this draft|Waiting on/});
  const primary=next.getByRole('link');
  await primary.focus();assert.equal(await primary.evaluate(e=>e===document.activeElement),true);
  for(const width of [1280,390,360]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+roles[i]+' '+width);
   assert.ok((await primary.boundingBox()).height>=44);
   await page.screenshot({path:'work/workspace-'+roles[i]+'-'+width+'.png',fullPage:true});
  }
  assert.deepEqual(errors,[]);
  await context.close();
  // The next role must first see an empty workspace.
  if(i<roles.length-1) {
   sql("delete from public.authority_records where organization_id='"+org+"';");
   // Each role gets the same isolated fixture after its empty-state check.
  }
 }
 console.log('Workspace role, scope, priority, empty states, focus, and 1280/390/360 checks passed.');
}finally{
 if(browser)await browser.close();
 sql("delete from public.authority_records where organization_id='"+org+"'; delete from public.organization_entitlements where organization_id='"+org+"'; delete from public.organizations where id='"+org+"';");
 for(const id of users){const result=await admin.auth.admin.deleteUser(id);if(result.error)throw result.error;}
 console.log('Synthetic workspace fixtures removed.');
}
